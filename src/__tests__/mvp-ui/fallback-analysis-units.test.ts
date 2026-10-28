import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { analyzeWithoutLlm } from '../../mvp-ui/fallback-analysis.js';

/**
 * A workspace with real packages plus the directories that used to be
 * mistaken for them: agent notes, docs and snapshots. Those are large, they
 * are not code, and they must not show up as workspace units.
 */
function makeRepoWithArtifacts(): string {
  const root = mkdtempSync(join(tmpdir(), 'ais-units-'));
  const pkgA = join(root, 'packages', 'alpha');
  mkdirSync(join(pkgA, 'src'), { recursive: true });
  mkdirSync(join(root, 'docs', 'guides'), { recursive: true });
  mkdirSync(join(root, '.agents', 'notes'), { recursive: true });
  mkdirSync(join(root, 'snapshots', 'session'), { recursive: true });

  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', private: true }));
  writeFileSync(
    join(pkgA, 'package.json'),
    JSON.stringify({ name: '@acme/alpha', version: '0.1.0' }),
  );
  writeFileSync(join(pkgA, 'src', 'index.ts'), 'export const alpha = 1;\n');

  // Artifacts: many files, no manifest, no code.
  for (let i = 0; i < 5; i++) {
    writeFileSync(join(root, '.agents', 'notes', `note-${i}.md`), '# note\n');
    writeFileSync(join(root, 'docs', 'guides', `guide-${i}.md`), '# guide\n');
    writeFileSync(join(root, 'snapshots', 'session', `snap-${i}.json`), '{}\n');
  }
  return root;
}

describe('fallback analysis — workspace unit map', () => {
  it('counts workspace packages, not every directory with files', async () => {
    const root = makeRepoWithArtifacts();
    const result = await analyzeWithoutLlm(root, 'Which modules exist?');

    // One real package (packages/alpha). The root manifest is not a unit.
    expect(result.content).toContain('Workspace packages (1 total');

    // The artifacts must not appear in the PACKAGE list — they belong to the
    // separate "outside the workspace packages" section.
    const packagesSection = result.content.slice(
      result.content.indexOf('Workspace packages ('),
      result.content.indexOf('Directories outside the workspace packages'),
    );
    expect(packagesSection).not.toContain('.agents');
    expect(packagesSection).not.toContain('docs');
    expect(packagesSection).not.toContain('snapshots');
    expect(packagesSection).toContain('packages/alpha');
  }, 60_000);

  it('reports directories outside the workspace packages separately', async () => {
    const root = makeRepoWithArtifacts();
    const result = await analyzeWithoutLlm(root, 'Which modules exist?');

    expect(result.content).toContain('Directories outside the workspace packages');
    // The artifacts are still visible — just not counted as packages.
    expect(result.content).toContain('.agents');
  }, 60_000);

  it('states the limits of the deterministic mode', async () => {
    const root = makeRepoWithArtifacts();
    const result = await analyzeWithoutLlm(root, 'Which claims are supported by evidence and which are inference?');

    expect(result.content).toContain('What this answer is, and is not');
    expect(result.content).toMatch(/cannot separate what the repository proves/);
    expect(result.content).toMatch(/does not use git history/);
    expect(result.content).toMatch(/keyword match, not an answer/);
  }, 60_000);

  it('does not mark a keyword match as a verified claim', async () => {
    const root = makeRepoWithArtifacts();
    const result = await analyzeWithoutLlm(root, 'How does the alpha module orchestrate execution?');

    const scanFacts = result.claims.filter((c) => c.kind === 'scan-fact');
    const lexical = result.claims.filter((c) => c.kind === 'lexical-match');

    // The measured facts of the scan are verified...
    expect(scanFacts.length).toBeGreaterThan(0);
    for (const claim of scanFacts) expect(claim.isVerified).toBe(true);

    // ...a retrieved file is not a verified conclusion about the project.
    for (const claim of lexical) {
      expect(claim.isVerified).toBe(false);
      expect(claim.statement).toMatch(/mentions the question terms/);
    }
  }, 60_000);
});
