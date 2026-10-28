import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DiscoveryPipelineService } from '../../../core/discovery/discovery-pipeline.service.js';

/**
 * A repo whose real stack is TypeScript + Python + Swift. Config-file
 * detection alone sees only TypeScript, so the native and Python parts of the
 * stack stay invisible in the tech stack report.
 */
function makeMixedStackRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'ais-techstack-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', private: true }));
  writeFileSync(join(root, 'src', 'index.ts'), 'export const x = 1;\n');

  mkdirSync(join(root, 'py'), { recursive: true });
  for (let i = 0; i < 4; i++) {
    writeFileSync(join(root, 'py', `mod-${i}.py`), 'def f():\n    return 1\n');
  }

  mkdirSync(join(root, 'native'), { recursive: true });
  for (let i = 0; i < 4; i++) {
    writeFileSync(join(root, 'native', `file-${i}.swift`), 'func f() {}\n');
  }
  return root;
}

describe('discovery — tech stack languages', () => {
  it('detects languages that no config file declares', async () => {
    const root = makeMixedStackRepo();
    const service = new DiscoveryPipelineService({ rootPath: root });
    await service.initialize();
    await service.start();
    const { discovery: result } = await service.discover('test');

    const names = result.techStack.map((t) => t.name);
    expect(names).toContain('TypeScript');
    expect(names).toContain('Python');
    expect(names).toContain('Swift');
  }, 60_000);

  it('ignores a language that appears only once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ais-techstack-noise-'));
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', private: true }));
    writeFileSync(join(root, 'src', 'index.ts'), 'export const x = 1;\n');
    writeFileSync(join(root, 'src', 'build.py'), 'x = 1\n');

    const service = new DiscoveryPipelineService({ rootPath: root });
    await service.initialize();
    await service.start();
    const { discovery: result } = await service.discover('test');

    expect(result.techStack.map((t) => t.name)).not.toContain('Python');
  }, 60_000);
});
