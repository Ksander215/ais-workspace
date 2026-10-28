/**
 * Path Security — MVP UI
 * TASK-MVP-FREE-UI-001 §28-30
 *
 * Protects against path traversal attacks on project paths.
 * Enforces demo path allowlist for demo mode.
 * Sanitizes user-provided paths before reaching InteractionService.
 *
 * Security invariants:
 *   S-01: No path traversal beyond allowed roots
 *   S-02: Demo mode restricted to demo allowlist
 *   S-03: No absolute path injection from user input
 *
 * Platform note:
 *   The service is platform-aware. Windows paths (drive letters, backslash
 *   separators) are validated with win32 semantics even when the process runs
 *   on POSIX, and vice versa. Backslash is a separator on Windows, never a
 *   traversal indicator.
 */

import { existsSync, statSync } from 'node:fs';
import { posix as posixPath, win32 as win32Path } from 'node:path';

// ═══════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathSecurityError';
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

export interface PathSecurityConfig {
  /** Allowed root directories for project paths. */
  readonly allowedRoots: readonly string[];
  /** Paths allowed in demo mode (full paths to demo projects). */
  readonly demoAllowlist: readonly string[];
}

/** Path dialect used to interpret a path. */
type PathFlavor = 'win32' | 'posix';

interface PathImpl {
  normalize(p: string): string;
  resolve(...p: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(p: string): boolean;
  basename(p: string, ext?: string): string;
  sep: string;
}

/**
 * Detect the dialect of a raw path.
 * Windows: drive letter prefix or backslash separators.
 */
function detectFlavor(rawPath: string): PathFlavor {
  if (/^[A-Za-z]:[\\/]/.test(rawPath)) return 'win32';
  if (rawPath.includes('\\')) return 'win32';
  return 'posix';
}

function implFor(flavor: PathFlavor): PathImpl {
  return flavor === 'win32' ? win32Path : posixPath;
}

/**
 * True when `target` is the root itself or lies inside it.
 * Uses relative() so that sibling-prefix attacks
 * (/roots/foo vs /roots/foobar) are rejected.
 */
function isContained(root: string, target: string, impl: PathImpl): boolean {
  const rel = impl.relative(root, target);
  if (rel === '') return true;
  if (rel.startsWith('..')) return false;
  if (impl.isAbsolute(rel)) return false;
  return true;
}

/** Dialect of the host platform. */
function hostFlavor(): PathFlavor {
  return process.platform === 'win32' ? 'win32' : 'posix';
}

/** True when any segment of the path is a parent reference. */
function hasParentSegment(normalized: string): boolean {
  return normalized
    .split(/[\\/]+/)
    .some(segment => segment === '..');
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════

export class PathSecurityService {
  private readonly allowedRoots: readonly string[];
  private readonly demoAllowlist: readonly string[];

  constructor(config: PathSecurityConfig) {
    this.allowedRoots = config.allowedRoots.map(r => r);
    this.demoAllowlist = config.demoAllowlist.map(p => p);
  }

  /**
   * Validate and sanitize a project path.
   * Resolves to an absolute path, checks it against allowed roots
   * (or the demo allowlist in demo mode).
   *
   * @returns Resolved absolute path
   * @throws PathSecurityError if path is invalid
   */
  validateProjectPath(
    rawPath: string,
    options?: { isDemo?: boolean },
  ): string {
    if (!rawPath || typeof rawPath !== 'string' || !rawPath.trim()) {
      throw new PathSecurityError('Project path is required');
    }

    const trimmed = rawPath.trim();
    const flavor = detectFlavor(trimmed);
    const impl = implFor(flavor);

    // S-03: URL-encoded traversal is never a legitimate filesystem path.
    if (/%2e%2e|%252e/i.test(trimmed)) {
      throw new PathSecurityError('Path contains disallowed pattern: %2e%2e');
    }

    const normalized = impl.normalize(trimmed);
    const absolute = impl.isAbsolute(normalized)
      ? normalized
      : impl.resolve(normalized);

    // S-01/S-02: containment is decided by the resolved path, not by the raw
    // string. A parent segment is only a violation when it escapes the root.
    const scope = options?.isDemo ? this.demoAllowlist : this.allowedRoots;
    const contained = scope.some(root =>
      detectFlavor(root) === flavor && isContained(root, absolute, impl),
    );

    if (!contained) {
      if (hasParentSegment(normalized)) {
        throw new PathSecurityError(
          'Path contains disallowed pattern: ..',
        );
      }
      throw new PathSecurityError(
        options?.isDemo
          ? `Demo path not in allowlist: ${rawPath}`
          : 'Project path must be under an allowed root directory',
      );
    }

    // Verify path exists and is a directory.
    // A path in the foreign dialect (e.g. a Windows path while running on
    // POSIX) cannot address a local directory, so the fs check is skipped —
    // the allowlist decision above already governs it.
    if (flavor !== hostFlavor()) {
      return absolute;
    }

    if (!existsSync(absolute)) {
      throw new PathSecurityError(`Project path does not exist: ${rawPath}`);
    }

    try {
      const stat = statSync(absolute);
      if (!stat.isDirectory()) {
        throw new PathSecurityError(
          `Project path is not a directory: ${rawPath}`,
        );
      }
    } catch (err) {
      if (err instanceof PathSecurityError) throw err;
      throw new PathSecurityError(
        `Cannot access project path: ${rawPath}`,
      );
    }

    return absolute;
  }

  /** Check if a resolved path is under an allowed root. */
  isAllowedRoot(resolvedPath: string): boolean {
    const flavor = detectFlavor(resolvedPath);
    const impl = implFor(flavor);
    return this.allowedRoots.some(
      root => detectFlavor(root) === flavor && isContained(root, resolvedPath, impl),
    );
  }

  /** Check if a resolved path is in the demo allowlist. */
  isDemoAllowed(resolvedPath: string): boolean {
    const flavor = detectFlavor(resolvedPath);
    const impl = implFor(flavor);
    return this.demoAllowlist.some(
      allowed => detectFlavor(allowed) === flavor && isContained(allowed, resolvedPath, impl),
    );
  }

  /** Get list of demo project names (last path component). */
  getDemoProjects(): readonly string[] {
    return this.demoAllowlist.map(p => {
      const impl = implFor(detectFlavor(p));
      return impl.basename(impl.normalize(p));
    });
  }
}
