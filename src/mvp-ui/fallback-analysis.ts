/**
 * Fallback analysis without an LLM.
 *
 * The hosted demo runs without OPENAI_API_KEY, and the engine refuses to
 * fabricate prose. But the deterministic half of AIS — discovery, module
 * boundaries, dependency graph, source excerpts — needs no model at all.
 *
 * So when no LLM is available we answer with FACTS, not with a generated
 * narrative: tech stack, module inventory, entry points, and the real files
 * whose content matches the question, each with file:line evidence.
 * The UI shows the label "code-derived facts (no LLM)" so nobody mistakes
 * this for a generated answer.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DiscoveryPipelineService } from '../core/discovery/discovery-pipeline.service.js';

export interface FallbackSource {
  filePath: string;
  description: string;
  relevance: number;
  excerpt: string;
}

export interface FallbackAnswer {
  content: string;
  sources: FallbackSource[];
  claims: Array<{
    statement: string;
    isVerified: boolean;
    evidenceCount: number;
    /**
     * What kind of statement this is.
     *
     * `scan-fact` — measured by the scan itself (file counts, tech stack).
     *   Verified: the pipeline computed it and can show the evidence.
     * `lexical-match` — a file was retrieved because it contains the
     *   question's terms. This is NOT a conclusion about the project, so it
     *   is not a verified claim; presenting it as one is exactly the kind of
     *   false guarantee the evidence protocol forbids.
     */
    kind?: 'scan-fact' | 'lexical-match';
  }>;
}

/**
 * Words that carry no retrieval signal. Kept deliberately small: domain words
 * like "architecture" or "module" are exactly what we want to match on.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'is', 'are', 'this', 'that',
  'it', 'for', 'on', 'with', 'as', 'be', 'by', 'at', 'from', 'how', 'what',
  'does', 'do', 'can', 'cannot', 'which', 'who', 'whom', 'whose', 'there',
  'their', 'they', 'them', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
  'not', 'but', 'you', 'your', 'our', 'we', 'us', 'i', 'me', 'my', 'any',
]);

const MAX_FILES = 400;
const MAX_SNIPPET_LINES = 24;

/** Candidate-file budget for keyword matching (env-tunable for big repos). */
function maxCandidateFiles(): number {
  const raw = Number(process.env.AIS_FALLBACK_MAX_CANDIDATES);
  return Number.isFinite(raw) && raw > 0 ? raw : MAX_FILES;
}

/**
 * Question terms for retrieval, plus a fallback set of structural terms so a
 * broad question ("what is the overall architecture") still lands on the
 * files that describe the project rather than nothing.
 */
const STRUCTURAL_TERMS = ['index', 'main', 'app', 'core', 'config', 'readme', 'package'];

/**
 * Question terms for retrieval, plus a fallback set of structural terms so a
 * broad question ("what is the overall architecture") still lands on the
 * files that describe the project rather than nothing.
 *
 * Structural terms carry a low weight: they match almost every file, so
 * counting them like question-specific words buries the real answer under
 * incidental matches.
 */
function keywords(question: string): { terms: string[]; weights: Map<string, number> } {
  const raw = question
    .toLowerCase()
    .split(/[^a-z0-9_]+/i)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Drop generic interrogative phrases that match everything ("project",
  // "repository") — they add noise without pointing at real code.
  const generic = new Set([
    'project', 'codebase', 'repository', 'repo', 'code', 'overall', 'total',
    'used', 'uses', 'using', 'based', 'across', 'into', 'out', 'about',
  ]);
  const strong = raw.filter((w) => !generic.has(w));

  const weights = new Map<string, number>();
  for (const t of strong) weights.set(t, 3);
  for (const t of STRUCTURAL_TERMS) weights.set(t, 1);

  const terms = Array.from(new Set([...strong, ...STRUCTURAL_TERMS])).slice(0, 16);
  return { terms, weights };
}

/** Read a file and return the lines that mention one of the keywords. */
function extractSnippet(
  filePath: string,
  terms: string[],
  weights: Map<string, number> = new Map(),
): { snippet: string; hits: number; distinctTerms: number; score: number } | null {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  const lines = text.split('\n');
  const scored: Array<{ idx: number; score: number }> = [];
  // A term is counted once per file for the ranking: a file that repeats
  // "package" two hundred times is not more relevant than one that repeats it
  // five times, it is just a bigger file.
  const termHits = new Map<string, number>();
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (!lower.includes(t)) continue;
      termHits.set(t, (termHits.get(t) ?? 0) + 1);
      score += weights.get(t) ?? 1;
    }
    if (score > 0) scored.push({ idx, score });
  });
  if (scored.length === 0) return null;

  const distinctTerms = termHits.size;
  const distinctScore = [...termHits.entries()].reduce(
    (sum, [term, count]) => sum + (weights.get(term) ?? 1) * Math.min(count, 5),
    0,
  );

  // Take the strongest window of lines.
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const start = Math.max(0, best.idx - Math.floor(MAX_SNIPPET_LINES / 3));
  const end = Math.min(lines.length, start + MAX_SNIPPET_LINES);
  const numbered = lines
    .slice(start, end)
    .map((l, i) => `${String(start + i + 1).padStart(4, ' ')} | ${l}`)
    .join('\n');
  return {
    snippet: numbered,
    hits: scored.length,
    distinctTerms,
    score: distinctScore,
  };
}

/** A workspace unit with its file counts and entry point. */
interface UnitSummary {
  unit: string;
  fileCount: number;
  sourceFileCount: number;
  testFileCount: number;
  entryPoint?: string;
}

/**
 * Reads the workspace package manifests of a monorepo.
 *
 * Cross-package imports in a pnpm/npm workspace are bare specifiers
 * (`@deepseek-ai/dsh-util-values`), so file-level import scanning cannot see
 * them at all. The manifests are the authoritative source: a package name maps
 * to a unit, and its declared dependencies give the real edges.
 */
function readWorkspaceManifests(
  projectPath: string,
  files: ReadonlyArray<{ relativePath: string }>,
): {
  manifests: Map<string, { unit: string; dependencies: string[] }>;
  packageDirs: Set<string>;
} {
  const manifests = new Map<string, { unit: string; dependencies: string[] }>();
  const packageDirs = new Set<string>();
  for (const file of files) {
    if (!file.relativePath.endsWith('package.json')) continue;
    if (file.relativePath.split('/').length < 2) continue; // root manifest
    const abs = join(projectPath, file.relativePath);
    let parsed: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    try {
      parsed = JSON.parse(readFileSync(abs, 'utf8'));
    } catch {
      continue;
    }
    const dir = file.relativePath.slice(0, file.relativePath.length - 'package.json'.length).replace(/\/$/, '');
    // Every directory that carries a manifest is a workspace package, even if
    // it has no name: the count of units must match the repository, not the
    // count of named packages.
    packageDirs.add(dir);
    if (!parsed.name) continue;
    const deps = [
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
    ];
    manifests.set(parsed.name, { unit: dir, dependencies: deps });
  }
  return { manifests, packageDirs };
}

/** Aggregates discovered files into workspace units. */
function summarizeUnits(
  files: ReadonlyArray<{ relativePath: string }>,
  packageDirs: ReadonlySet<string>,
): { packages: UnitSummary[]; otherDirectories: UnitSummary[] } {
  const dirs = [...packageDirs].filter((d) => d.length > 0).sort((a, b) => b.length - a.length);
  const owningPackage = (path: string): string | undefined => {
    for (const dir of dirs) {
      if (path === dir || path.startsWith(`${dir}/`)) return dir;
    }
    return undefined;
  };

  const packages = new Map<string, UnitSummary>();
  const otherDirectories = new Map<string, UnitSummary>();

  for (const file of files) {
    const owner = owningPackage(file.relativePath);
    // A file outside every workspace package belongs to a plain directory.
    // Those directories are real, but they are NOT workspace units, and
    // mixing them into the unit list inflates the count and buries real
    // packages under documentation, notes and snapshots.
    const unit =
      owner ??
      (file.relativePath.includes('/')
        ? file.relativePath.slice(0, file.relativePath.indexOf('/'))
        : '.');
    const bucket = owner ? packages : otherDirectories;

    let entry = bucket.get(unit);
    if (!entry) {
      entry = { unit, fileCount: 0, sourceFileCount: 0, testFileCount: 0 };
      bucket.set(unit, entry);
    }
    entry.fileCount += 1;
    const base = file.relativePath.split('/').pop() ?? '';
    const isTest =
      /\.(test|spec)\.[cm]?[jt]sx?$/.test(base) ||
      /(^|\/)(tests?|__tests__)\//.test(file.relativePath);
    if (isTest) entry.testFileCount += 1;
    else entry.sourceFileCount += 1;
    if (!entry.entryPoint && /(^|\/)(index|main|cli|server)\.[cm]?[jt]sx?$/.test(base)) {
      entry.entryPoint = file.relativePath;
    }
  }

  const bySize = (a: UnitSummary, b: UnitSummary): number =>
    b.sourceFileCount - a.sourceFileCount || b.fileCount - a.fileCount;
  return {
    packages: [...packages.values()].sort(bySize),
    otherDirectories: [...otherDirectories.values()].sort(bySize),
  };
}

/**
 * Dependency edges between workspace units, counted and deduplicated.
 * The raw edges are file-to-file, which is unreadable for a monorepo.
 */
function summarizeUnitDependencies(
  dependencies: ReadonlyArray<{ from: string; to: string; type: string }>,
  files: ReadonlyArray<{ relativePath: string }>,
  manifests: Map<string, { unit: string; dependencies: string[] }>,
  packageDirs: ReadonlySet<string>,
): {
  fileEdges: Array<{ from: string; to: string; count: number; types: string[] }>;
  manifestEdges: Array<{ from: string; to: string; count: number }>;
} {
  const known = new Set(files.map((f) => f.relativePath));
  // Package directories, longest first, so a file maps to its own package
  // rather than to a broader workspace folder.
  const dirs = [...packageDirs].filter((d) => d.length > 0).sort((a, b) => b.length - a.length);

  const unitFor = (path: string): string => {
    for (const dir of dirs) {
      if (path === dir || path.startsWith(`${dir}/`)) return dir;
    }
    // Outside every package: the plain directory is still a real container of
    // code (scripts/, native/), so it keeps its name in the graph.
    return path.includes('/') ? path.slice(0, path.indexOf('/')) : '.';
  };

  const counts = new Map<string, { from: string; to: string; count: number; types: Set<string> }>();
  const manifestCounts = new Map<string, { from: string; to: string; count: number }>();
  const bump = (from: string, to: string, type: string): void => {
    if (from === to) return;
    const key = `${from}→${to}`;
    let edge = counts.get(key);
    if (!edge) {
      edge = { from, to, count: 0, types: new Set() };
      counts.set(key, edge);
    }
    edge.count += 1;
    edge.types.add(type);
  };

  // 1. File-level relative imports inside the repository.
  //    A relative specifier usually omits the extension and may point at a
  //    directory, so the target is resolved the way a bundler would.
  const resolveTarget = (from: string, spec: string): string | undefined => {
    if (!spec.startsWith('.')) return undefined;
    const base = from.split('/').slice(0, -1);
    const segments: string[] = [];
    for (const segment of [...base, ...spec.split('/')]) {
      if (segment === '.' || segment === '') continue;
      if (segment === '..') segments.pop();
      else segments.push(segment);
    }
    const raw = segments.join('/');
    const candidates = [
      raw,
      `${raw}.ts`, `${raw}.tsx`, `${raw}.js`, `${raw}.jsx`, `${raw}.mjs`, `${raw}.cjs`,
      `${raw}/index.ts`, `${raw}/index.tsx`, `${raw}/index.js`, `${raw}/index.jsx`,
    ];
    for (const candidate of candidates) {
      if (known.has(candidate)) return candidate;
    }
    return undefined;
  };

  for (const dep of dependencies) {
    const fromUnit = unitFor(dep.from);
    const target = resolveTarget(dep.from, dep.to);
    if (!target) continue; // not a repository file
    bump(fromUnit, unitFor(target), dep.type);
  }

  // 2. Workspace packages declared in the manifests — the only way to see
  //    cross-package dependencies in a pnpm/npm workspace.
  for (const [, manifest] of manifests) {
    for (const depName of manifest.dependencies) {
      const target = manifests.get(depName);
      if (!target) continue; // an external npm dependency, not a workspace unit
      if (manifest.unit === target.unit) continue;
      const key = `${manifest.unit}→${target.unit}`;
      const edge = manifestCounts.get(key) ?? { from: manifest.unit, to: target.unit, count: 0 };
      edge.count += 1;
      manifestCounts.set(key, edge);
    }
  }

  const fileEdges = [...counts.values()]
    .map((e) => ({ from: e.from, to: e.to, count: e.count, types: [...e.types] }))
    .sort((a, b) => b.count - a.count);
  const manifestEdges = [...manifestCounts.values()].sort((a, b) => b.count - a.count);

  return { fileEdges, manifestEdges };
}

export async function analyzeWithoutLlm(
  projectPath: string,
  question: string,
): Promise<FallbackAnswer> {
  // The core discovery defaults are tuned for the AIS workspace and skip
  // `packages`, `backend`, `docs` and friends. That is right for the graph
  // AIS builds about itself, but wrong for a repository we are analysing:
  // in most monorepos the code lives exactly there. The fallback therefore
  // scans the source tree with only vendor/build output excluded.
  // `AIS_DISCOVERY_EXCLUDE` still overrides this when it is set.
  const discovery = new DiscoveryPipelineService({
    rootPath: projectPath,
    excludePatterns: [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.cache',
      'frames',
      '__tests__',
    ],
  });
  await discovery.initialize();
  await discovery.start();
  const { discovery: result } = await discovery.discover('fallback');
  const config = discovery.config;

  const { terms, weights } = keywords(question);
  // Rank candidate files by how likely they are to answer the question:
  // a path or name that mentions a term comes first. Test files are kept
  // aside — they mention terms often but rarely answer the question, so they
  // are only used when there is nothing else to show.
  const isTestFile = (relativePath: string): boolean => {
    const base = relativePath.split('/').pop() ?? '';
    return (
      /\.(test|spec)\.[cm]?[jt]sx?$/.test(base) ||
      /(^|\/)(tests?|__tests__|fixtures?|__fixtures__)\//.test(relativePath)
    );
  };

  const ranked = result.files
    .filter((f) => f.extension === '.ts' || f.extension === '.js' || f.extension === '.mjs')
    .map((f) => {
      const lower = f.relativePath.toLowerCase();
      let score = 0;
      for (const t of terms) if (lower.includes(t)) score += weights.get(t) ?? 1;
      return { file: f, score };
    })
    .sort((a, b) => b.score - a.score);

  const budget = maxCandidateFiles();
  const sourceFiles = ranked.filter((c) => !isTestFile(c.file.relativePath));
  const testFiles = ranked.filter((c) => isTestFile(c.file.relativePath));
  const candidates = [...sourceFiles, ...testFiles].slice(0, budget).map((c) => c.file);

  const hitsPerFile: Array<{ source: FallbackSource; hits: number; distinctTerms: number; score: number }> = [];
  for (const file of candidates) {
    const abs = join(projectPath, file.relativePath);
    try {
      statSync(abs);
    } catch {
      continue;
    }
    const found = extractSnippet(abs, terms, weights);
    if (!found) continue;
    const rel = relative(projectPath, abs).split(sep).join('/');
    hitsPerFile.push({
      hits: found.hits,
      distinctTerms: found.distinctTerms,
      score: found.score,
      source: {
        filePath: rel,
        description:
          `Matched ${found.distinctTerms} distinct question term(s) in ${found.hits} line(s) of this file.`,
        relevance: 0,
        excerpt: found.snippet,
      },
    });
  }

  hitsPerFile.sort((a, b) => b.score - a.score);
  const maxScore = hitsPerFile[0]?.score ?? 1;
  for (const h of hitsPerFile) {
    h.source.relevance = Math.min(0.95, 0.3 + 0.6 * (h.score / maxScore));
  }
  const sources = hitsPerFile.map((h) => h.source);
  const top = sources.slice(0, 6);

  const tech = result.techStack.map((t) => t.name).join(', ') || 'not detected';

  // Workspace packages — the level a human reads a monorepo at.
  const { manifests, packageDirs } = readWorkspaceManifests(projectPath, result.files);
  const { packages: units, otherDirectories } = summarizeUnits(result.files, packageDirs);
  const modules = units
    .slice(0, 15)
    .map(
      (u) =>
        `  • ${u.unit} — ${u.sourceFileCount} source file(s)` +
        (u.testFileCount ? `, ${u.testFileCount} test file(s)` : '') +
        (u.entryPoint ? `, entry: ${u.entryPoint}` : ''),
    )
    .join('\n');
  const otherDirs = otherDirectories
    .slice(0, 8)
    .map((u) => `  • ${u.unit} — ${u.sourceFileCount} source file(s)`)
    .join('\n');

  // Dependency edges between workspace units — real, extracted relations.
  const { fileEdges, manifestEdges } = summarizeUnitDependencies(
    result.dependencies,
    result.files,
    manifests,
    packageDirs,
  );
  const depEdges = fileEdges
    .slice(0, 15)
    .map((d) => `  • ${d.from} → ${d.to} — ${d.count} import(s) [${d.types.join(', ')}]`)
    .join('\n');
  const manifestDepEdges = manifestEdges
    .slice(0, 15)
    .map((d) => `  • ${d.from} → ${d.to} — ${d.count} declared dependency(ies)`)
    .join('\n');

  // Coverage honesty: what the scan did NOT see (Q6/Q7 live here).
  const excluded = config.excludePatterns.filter((dir) => existsSync(join(projectPath, dir)));
  const maxFiles = config.maxFiles;
  const truncated = result.totalFiles >= maxFiles;

  const coverage = [
    `Scanned ${result.totalFiles} file(s), ${result.totalSize.toLocaleString()} bytes.`,
    truncated
      ? `SCAN TRUNCATED: the discovery limit is ${maxFiles.toLocaleString()} files, so this answer does NOT cover the whole repository.`
      : 'Scan completed without hitting the file limit.',
    excluded.length
      ? `Directories excluded by configuration and therefore NOT analyzed: ${excluded.join(', ')}.`
      : 'No configured directories were excluded.',
    `Config files detected: ${result.configFiles.slice(0, 8).join(', ') || 'none'}.`,
  ].join('\n');

  const sourcesBlock = top.length
    ? top
        .map((s) => `── ${s.filePath}\n${s.excerpt}`)
        .join('\n\n')
    : '(no source file mentions the question terms)';

  // Limits of this mode, stated by the answer itself.
  //
  // The deterministic path measures the repository. It cannot reason about it.
  // Saying so is part of the answer: without this, a keyword-matched excerpt
  // reads like an answer to a question it does not answer, and the reader
  // cannot tell evidence from inference.
  const limits = [
    'This mode derives FACTS from the code scan. It does not generate an',
    'argument, so it cannot separate what the repository proves from what a',
    'reader might infer — that separation requires a language model.',
    'It also reads a static snapshot: it does not use git history, so it',
    'cannot tell current code from historical or deprecated code.',
    'Every excerpt below is a keyword match, not an answer to the question.',
  ].join('\n');

  const content = [
    'code-derived facts (no LLM)',
    '',
    `Question: ${question}`,
    '',
    'This demo instance has no language model key configured, so AIS answered from the',
    'deterministic part of the pipeline: it scanned the project, built the module map',
    'and matched your question against the real source files. No prose was generated.',
    '',
    'What this answer is, and is not:',
    limits,
    '',
    `Files scanned: ${result.totalFiles} (${result.totalSize} bytes)`,
    `Tech stack: ${tech}`,
    `Entry points: ${result.entryPoints.slice(0, 5).join(', ') || 'n/a'}`,
    '',
    `Workspace packages (${units.length} total, top ${Math.min(15, units.length)} by source files):`,
    modules || '  • none',
    '',
    `Directories outside the workspace packages (top ${Math.min(8, otherDirectories.length)} by source files):`,
    otherDirs || '  • none',
    '',
    `Dependency edges between units (file-level imports, top ${Math.min(15, fileEdges.length)}):`,
    depEdges || '  • none detected',
    '',
    `Declared workspace package dependencies (top ${Math.min(15, manifestEdges.length)}):`,
    manifestDepEdges || '  • none detected',
    '',
    'Scan coverage:',
    coverage,
    '',
    `Question terms looked for: ${terms.join(', ') || '(none)'}`,
    '',
    'Matching source excerpts:',
    sourcesBlock,
  ].join('\n');

  const claims = [
    {
      statement: `The project contains ${result.totalFiles} files across ${units.length} workspace packages.`,
      // The scan counted these itself, so the number is a measured fact.
      isVerified: true,
      evidenceCount: top.length,
      kind: 'scan-fact' as const,
    },
    {
      statement: `Detected tech stack: ${tech}.`,
      isVerified: true,
      evidenceCount: top.length,
      kind: 'scan-fact' as const,
    },
    ...top.map((s) => ({
      statement: `${s.filePath} mentions the question terms.`,
      // The file was retrieved because it contains the terms. That is a
      // retrieval hit, not a conclusion about the project: nothing here
      // verifies that the file answers the question. Marking it as a
      // verified claim would be a false guarantee.
      isVerified: false,
      evidenceCount: 1,
      kind: 'lexical-match' as const,
    })),
  ];

  return { content, sources: top, claims };
}
