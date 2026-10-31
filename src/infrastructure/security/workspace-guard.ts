import path from 'node:path';
import { lstat, mkdir, realpath, stat } from 'node:fs/promises';
import { ValidationError } from '../../domain/errors.js';

export class WorkspaceGuard {
  readonly root: string;
  constructor(root: string) { this.root = path.resolve(root); }

  resolveInsideWorkspace(relativePath: string): string {
    if (path.isAbsolute(relativePath)) throw new ValidationError('Absolute paths are not allowed.');
    const resolved = path.resolve(this.root, relativePath);
    const relative = path.relative(this.root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new ValidationError('Path escapes the configured workspace.');
    return resolved;
  }

  async resolveExistingFileInsideWorkspace(relativePath: string): Promise<string> {
    const resolved = this.resolveInsideWorkspace(relativePath);
    const [realRoot, realTarget] = await Promise.all([realpath(this.root), realpath(resolved)]);
    const relative = path.relative(realRoot, realTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new ValidationError('Evidence path resolves outside the workspace.');
    }
    const details = await stat(realTarget);
    if (!details.isFile()) throw new ValidationError('Evidence path must resolve to a regular file.');
    return realTarget;
  }

  async ensureEvidenceDirectory(relativeDirectory = '.harness/evidence'): Promise<string> {
    const resolved = this.resolveInsideWorkspace(relativeDirectory);
    const realRoot = await realpath(this.root);

    // Resolve the closest existing ancestor before mkdir so a symlink cannot
    // redirect directory creation outside the configured workspace.
    let ancestor = resolved;
    while (true) {
      try {
        const [realAncestor, details] = await Promise.all([realpath(ancestor), lstat(ancestor)]);
        const relative = path.relative(realRoot, realAncestor);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new ValidationError('Evidence directory resolves outside the workspace.');
        }
        if (!details.isDirectory() && !details.isSymbolicLink()) {
          throw new ValidationError('Evidence directory path contains a non-directory component.');
        }
        break;
      } catch (error) {
        if (error instanceof ValidationError) throw error;
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        const parent = path.dirname(ancestor);
        if (parent === ancestor) throw error;
        ancestor = parent;
      }
    }

    await mkdir(resolved, { recursive: true });
    const realTarget = await realpath(resolved);
    const relative = path.relative(realRoot, realTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new ValidationError('Evidence directory resolves outside the workspace.');
    }
    if (!(await stat(realTarget)).isDirectory()) throw new ValidationError('Evidence path must be a directory.');
    return realTarget;
  }
}

export function assertLocalhostUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new ValidationError('A valid absolute URL is required.'); }
  const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  if (!allowedHosts.has(url.hostname) || !['http:', 'https:'].includes(url.protocol)) {
    throw new ValidationError('Only http(s) localhost, 127.0.0.1, and ::1 URLs are allowed.');
  }
  if (url.username || url.password) throw new ValidationError('Credentials in localhost URLs are not allowed.');
  return url;
}
