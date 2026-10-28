/**
 * Path Security — platform-aware regression suite
 *
 * Covers the Windows defect: a normal Windows path such as
 * C:\Users\0\ais-polygon was rejected because '\' and '//' were treated as
 * dangerous patterns, and containment was checked with POSIX-only prefix
 * matching (sibling-prefix attacks).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PathSecurityService, PathSecurityError } from '../../mvp-ui/path-security.js';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const TMP_DIR = resolve('/tmp/ais-path-sec-' + process.pid);
const DEMO_DIR = resolve(TMP_DIR, 'demo-project');
const ALLOWED_SUBDIR = resolve(TMP_DIR, 'allowed-sub');

beforeEach(() => {
  mkdirSync(DEMO_DIR, { recursive: true });
  mkdirSync(ALLOWED_SUBDIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

function svc(roots: string[] = [], demos: string[] = []) {
  return new PathSecurityService({ allowedRoots: roots, demoAllowlist: demos });
}

// ── Windows paths ─────────────────────────────────────────────────

describe('PathSecurity — Windows paths', () => {
  it('accepts a normal Windows path under an allowed root', () => {
    const s = svc(['C:\\Users\\0']);
    expect(s.validateProjectPath('C:\\Users\\0\\ais-polygon')).toBe(
      'C:\\Users\\0\\ais-polygon',
    );
  });

  it('accepts a nested Windows path', () => {
    const s = svc(['C:\\Users\\0']);
    expect(s.validateProjectPath('C:\\Users\\0\\ais-polygon\\src\\core')).toBe(
      'C:\\Users\\0\\ais-polygon\\src\\core',
    );
  });

  it('rejects a Windows path escaping the root', () => {
    const s = svc(['C:\\Users\\0\\ais-polygon']);
    expect(() => s.validateProjectPath('C:\\Users\\0\\other')).toThrow(
      PathSecurityError,
    );
  });

  it('rejects ..\\ traversal that escapes the root', () => {
    const s = svc(['C:\\Users\\0\\ais-polygon']);
    expect(() => s.validateProjectPath('C:\\Users\\0\\ais-polygon\\..\\secrets')).toThrow(
      PathSecurityError,
    );
  });

  it('rejects ..\\..\\ traversal that escapes the root', () => {
    const s = svc(['C:\\Users\\0\\ais-polygon']);
    expect(() =>
      s.validateProjectPath('C:\\Users\\0\\ais-polygon\\..\\..\\Windows'),
    ).toThrow(PathSecurityError);
  });

  it('rejects a sibling-prefix attack', () => {
    const s = svc(['C:\\Users\\0\\ais-polygon']);
    expect(() => s.validateProjectPath('C:\\Users\\0\\ais-polygon-evil')).toThrow(
      PathSecurityError,
    );
  });

  it('accepts a Windows demo allowlist entry', () => {
    const s = svc([], ['C:\\Users\\0\\ais-polygon']);
    expect(s.validateProjectPath('C:\\Users\\0\\ais-polygon', { isDemo: true })).toBe(
      'C:\\Users\\0\\ais-polygon',
    );
  });

  it('accepts a subdirectory of a Windows demo allowlist entry', () => {
    const s = svc([], ['C:\\Users\\0\\ais-polygon']);
    expect(
      s.validateProjectPath('C:\\Users\\0\\ais-polygon\\src', { isDemo: true }),
    ).toBe('C:\\Users\\0\\ais-polygon\\src');
  });

  it('rejects a sibling Demo-prefix attack', () => {
    const s = svc([], ['C:\\Users\\0\\ais-polygon']);
    expect(() =>
      s.validateProjectPath('C:\\Users\\0\\ais-polygon-evil', { isDemo: true }),
    ).toThrow(PathSecurityError);
  });
});

// ── POSIX paths ───────────────────────────────────────────────────

describe('PathSecurity — POSIX paths', () => {
  it('accepts a path under an allowed root', () => {
    const s = svc([TMP_DIR]);
    expect(s.validateProjectPath(ALLOWED_SUBDIR)).toBe(ALLOWED_SUBDIR);
  });

  it('rejects a sibling-prefix attack', () => {
    const s = svc([TMP_DIR]);
    const sibling = TMP_DIR + '-evil';
    mkdirSync(sibling, { recursive: true });
    try {
      expect(() => s.validateProjectPath(sibling)).toThrow(PathSecurityError);
    } finally {
      rmSync(sibling, { recursive: true, force: true });
    }
  });

  it('rejects a path outside allowed roots', () => {
    const s = svc([TMP_DIR]);
    expect(() => s.validateProjectPath('/etc')).toThrow(PathSecurityError);
  });

  it('rejects traversal out of the root', () => {
    const s = svc([TMP_DIR]);
    expect(() => s.validateProjectPath(TMP_DIR + '/../etc')).toThrow(
      PathSecurityError,
    );
  });

  it('rejects URL-encoded traversal', () => {
    const s = svc([TMP_DIR]);
    expect(() => s.validateProjectPath(TMP_DIR + '/%2e%2e/etc')).toThrow(
      PathSecurityError,
    );
  });

  it('rejects a non-existent path', () => {
    const s = svc([TMP_DIR]);
    expect(() => s.validateProjectPath(resolve(TMP_DIR, 'nope'))).toThrow(
      PathSecurityError,
    );
  });

  it('rejects a file path', () => {
    const file = resolve(TMP_DIR, 'a.txt');
    writeFileSync(file, 'x');
    const s = svc([TMP_DIR]);
    expect(() => s.validateProjectPath(file)).toThrow(PathSecurityError);
  });
});

// ── Helpers ───────────────────────────────────────────────────────

describe('PathSecurity — helpers', () => {
  it('lists Windows demo project names', () => {
    const s = svc([], ['C:\\Users\\0\\ais-polygon']);
    expect(s.getDemoProjects()).toContain('ais-polygon');
  });

  it('lists POSIX demo project names', () => {
    const s = svc([], [DEMO_DIR]);
    expect(s.getDemoProjects()).toContain('demo-project');
  });

  it('isAllowedRoot is false for a sibling prefix', () => {
    const s = svc([TMP_DIR]);
    expect(s.isAllowedRoot(TMP_DIR + '-evil')).toBe(false);
  });

  it('isDemoAllowed is false for a sibling prefix', () => {
    const s = svc([], [DEMO_DIR]);
    expect(s.isDemoAllowed(DEMO_DIR + '-evil')).toBe(false);
  });
});
