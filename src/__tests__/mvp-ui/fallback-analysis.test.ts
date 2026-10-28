import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { analyzeWithoutLlm } from '../../mvp-ui/fallback-analysis.js';

/** Builds a small pnpm-style workspace with two packages and a cross import. */
function makeWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'ais-fallback-'));
  const pkgA = join(root, 'packages', 'alpha');
  const pkgB = join(root, 'packages', 'beta');
  mkdirSync(join(pkgA, 'src'), { recursive: true });
  mkdirSync(join(pkgB, 'src'), { recursive: true });

  writeFileSync(
    join(pkgA, 'package.json'),
    JSON.stringify({
      name: '@acme/alpha',
      version: '0.1.0',
      dependencies: { '@acme/beta': 'workspace:*' },
    }),
  );
  writeFileSync(
    join(pkgB, 'package.json'),
    JSON.stringify({ name: '@acme/beta', version: '0.1.0' }),
  );
  writeFileSync(
    join(pkgA, 'src', 'index.ts'),
    "export const alpha = 1;\nimport { beta } from '../../packages/beta/src/index.js';\nexport const both = beta + alpha;\n",
  );
  writeFileSync(join(pkgB, 'src', 'index.ts'), 'export const beta = 2;\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', private: true }));
  return root;
}

describe('fallback analysis', () => {
  it('reports workspace packages and their declared cross-package dependency', async () => {
    const root = makeWorkspace();
    const result = await analyzeWithoutLlm(root, 'Which modules depend on each other?');

    expect(result.content).toContain('packages/alpha');
    expect(result.content).toContain('packages/beta');
    // The manifest edge is invisible to file-level import scanning, so it has
    // to come from the package.json declarations.
    expect(result.content).toContain('Declared workspace package dependencies');
    expect(result.content).toMatch(/packages\/alpha → packages\/beta/);
  }, 60_000);

  it('returns real sources with file:line excerpts and no LLM prose', async () => {
    const root = makeWorkspace();
    const result = await analyzeWithoutLlm(root, 'Where is the alpha entry point defined?');

    expect(result.sources.length).toBeGreaterThan(0);
    const source = result.sources[0];
    expect(source.filePath).toMatch(/\.ts$/);
    expect(source.excerpt).toMatch(/\d+ \|/);
    expect(result.content).toContain('code-derived facts (no LLM)');
  }, 60_000);
});
