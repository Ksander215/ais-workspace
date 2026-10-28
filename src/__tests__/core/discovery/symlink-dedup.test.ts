import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DiscoveryPipelineService } from '../../../core/discovery/discovery-pipeline.service.js';

/**
 * A repository that symlinks shared files — a common pattern (AGENTS.md,
 * CLAUDE.md, shared skills). Following the link counts the target twice.
 */
function makeRepoWithSymlinks(): { root: string; target: string } {
  const root = mkdtempSync(join(tmpdir(), 'ais-symlink-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'shared'), { recursive: true });

  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', private: true }));
  writeFileSync(join(root, 'src', 'index.ts'), 'export const x = 1;\n');
  writeFileSync(join(root, 'shared', 'AGENTS.md'), '# shared\n');

  // A symlink to a file and a symlink to a directory.
  symlinkSync(join(root, 'shared', 'AGENTS.md'), join(root, 'AGENTS.md'));
  symlinkSync(join(root, 'shared'), join(root, 'linked-shared'));

  return { root, target: join(root, 'shared', 'AGENTS.md') };
}

describe('discovery — symlink handling', () => {
  it('does not count a symlinked file twice', async () => {
    const { root, target } = makeRepoWithSymlinks();
    const service = new DiscoveryPipelineService({ rootPath: root });
    await service.initialize();
    await service.start();
    const { discovery: result } = await service.discover('test');

    const paths = result.files.map((f) => f.relativePath);
    // The link is listed once, the target once — not the target twice.
    const agentPaths = paths.filter((p) => p === 'AGENTS.md' || p === 'shared/AGENTS.md');
    expect(agentPaths).toHaveLength(2);
    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('shared/AGENTS.md');
    expect(paths).not.toContain('linked-shared/AGENTS.md');
    expect(result.totalFiles).toBe(new Set(paths).size);
    expect(result.totalFiles).toBeLessThan(6);
  }, 60_000);
});
