/**
 * GitHub Resolver — configurable limits + pinned commit
 *
 * AIS could not analyse large real-world repositories: the fixed ceilings
 * (10 000 files / 50MB) rejected e.g. deepseek-ai/deepseek-harness
 * (~20k files, ~185MB), and the clone always took branch HEAD, so a
 * validation run could not be pinned to a frozen commit.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  GitHubResolver,
  GitHubResolverError,
  resolveRepoLimitsFromEnv,
} from '../../mvp-ui/github-resolver.js';
import { rmSync } from 'node:fs';

const created: string[] = [];

afterEach(() => {
  for (const p of created.splice(0)) {
    rmSync(p, { recursive: true, force: true });
  }
  delete process.env.AIS_REPO_MAX_FILES;
  delete process.env.AIS_REPO_MAX_SIZE_MB;
  delete process.env.AIS_REPO_MAX_CLONE_MS;
});

describe('resolveRepoLimitsFromEnv', () => {
  it('falls back to the conservative defaults', () => {
    const limits = resolveRepoLimitsFromEnv();
    expect(limits.maxFileCount).toBe(10_000);
    expect(limits.maxRepoSizeBytes).toBe(50 * 1024 * 1024);
    expect(limits.maxCloneTimeMs).toBe(60_000);
  });

  it('reads the ceilings from the environment', () => {
    process.env.AIS_REPO_MAX_FILES = '50000';
    process.env.AIS_REPO_MAX_SIZE_MB = '512';
    process.env.AIS_REPO_MAX_CLONE_MS = '600000';
    const limits = resolveRepoLimitsFromEnv();
    expect(limits.maxFileCount).toBe(50_000);
    expect(limits.maxRepoSizeBytes).toBe(512 * 1024 * 1024);
    expect(limits.maxCloneTimeMs).toBe(600_000);
  });

  it('ignores invalid environment values', () => {
    process.env.AIS_REPO_MAX_FILES = 'not-a-number';
    process.env.AIS_REPO_MAX_SIZE_MB = '-5';
    const limits = resolveRepoLimitsFromEnv();
    expect(limits.maxFileCount).toBe(10_000);
    expect(limits.maxRepoSizeBytes).toBe(50 * 1024 * 1024);
  });

  it('applies the environment to a resolver instance', () => {
    process.env.AIS_REPO_MAX_FILES = '4321';
    const resolver = new GitHubResolver({ cloneRoot: '/tmp/ais-resolver-limits-test' });
    expect(resolver).toBeInstanceOf(GitHubResolver);
  });
});

describe('GitHubResolver — URL validation', () => {
  it('rejects a non-GitHub URL', () => {
    const resolver = new GitHubResolver({ cloneRoot: '/tmp/ais-resolver-limits-test' });
    expect(() => resolver.parseUrl('https://gitlab.com/a/b')).toThrow(
      GitHubResolverError,
    );
  });

  it('parses owner and name', () => {
    const resolver = new GitHubResolver({ cloneRoot: '/tmp/ais-resolver-limits-test' });
    expect(resolver.parseUrl('https://github.com/deepseek-ai/deepseek-harness')).toEqual({
      owner: 'deepseek-ai',
      name: 'deepseek-harness',
    });
  });
});
