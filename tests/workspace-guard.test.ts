import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { WorkspaceGuard, assertLocalhostUrl } from '../src/infrastructure/security/workspace-guard.js';

test('workspace guard accepts paths inside the workspace', () => {
  const root = path.resolve('/tmp/harness-workspace');
  const guard = new WorkspaceGuard(root);
  assert.equal(guard.resolveInsideWorkspace('src/index.ts'), path.join(root, 'src/index.ts'));
});

test('workspace guard rejects absolute paths and traversal', () => {
  const guard = new WorkspaceGuard('/tmp/harness-workspace');
  assert.throws(() => guard.resolveInsideWorkspace('../outside.txt'));
  assert.throws(() => guard.resolveInsideWorkspace('/etc/passwd'));
});

test('localhost URL guard accepts loopback addresses', () => {
  assert.equal(assertLocalhostUrl('http://localhost:5173/').hostname, 'localhost');
  assert.equal(assertLocalhostUrl('http://127.0.0.1:3000/').port, '3000');
});

test('localhost URL guard rejects remote hosts and embedded credentials', () => {
  assert.throws(() => assertLocalhostUrl('https://example.com'));
  assert.throws(() => assertLocalhostUrl('http://user:pass@localhost:3000'));
});

test('localhost URL guard rejects non-http schemes', () => {
  assert.throws(() => assertLocalhostUrl('file:///etc/passwd'));
});


test('workspace guard validates evidence files against real paths and regular-file type', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-evidence-'));
  try {
    await mkdir(path.join(root, 'evidence'));
    await writeFile(path.join(root, 'evidence', 'report.json'), '{}');
    const guard = new WorkspaceGuard(await realpath(root));
    const resolved = await guard.resolveExistingFileInsideWorkspace('evidence/report.json');
    const expected = await realpath(path.join(root, 'evidence', 'report.json'));
    assert.equal(resolved, expected);
    await assert.rejects(() => guard.resolveExistingFileInsideWorkspace('evidence'));
    await assert.rejects(() => guard.resolveExistingFileInsideWorkspace('missing.json'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('workspace guard rejects evidence and directory creation redirected by symlinks', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-workspace-'));
  const outside = await mkdtemp(path.join(os.tmpdir(), 'harness-outside-'));
  try {
    await writeFile(path.join(outside, 'secret.txt'), 'not workspace data');

    // Windows directory junctions do not require the symlink privilege that
    // native directory symlinks require. POSIX ignores the type argument.
    const directoryLinkType = process.platform === 'win32' ? 'junction' : 'dir';
    try {
      await symlink(outside, path.join(root, 'external-link'), directoryLinkType);
      await symlink(outside, path.join(root, '.harness'), directoryLinkType);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (process.platform === 'win32' && ['EPERM', 'EACCES', 'ENOTSUP'].includes(code ?? '')) {
        t.skip('This Windows environment does not permit creating directory junctions/symlinks.');
        return;
      }
      throw error;
    }

    const guard = new WorkspaceGuard(await realpath(root));
    await assert.rejects(() => guard.resolveExistingFileInsideWorkspace('external-link/secret.txt'));
    await assert.rejects(() => guard.ensureEvidenceDirectory('.harness/evidence'));
    await assert.rejects(() => guard.ensureEvidenceDirectory('external-link/new-evidence'));
    await assert.rejects(() => import('node:fs/promises').then(fs => fs.access(path.join(outside, 'evidence'))));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
