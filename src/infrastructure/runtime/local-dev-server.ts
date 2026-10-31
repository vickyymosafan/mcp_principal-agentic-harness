import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { DevServerPort } from '../../domain/ports.js';
import type { ServerProcessRecord } from '../../domain/models.js';
import { ValidationError } from '../../domain/errors.js';
import { WorkspaceGuard } from '../security/workspace-guard.js';
import type { TaskService } from '../../application/task-service.js';

export class LocalDevServerManager implements DevServerPort {
  private readonly children = new Map<string, ChildProcess>();
  private readonly logBuffers = new Map<string, string[]>();
  private readonly guard: WorkspaceGuard;
  constructor(private readonly workspaceRoot: string, private readonly tasks: TaskService) { this.guard = new WorkspaceGuard(workspaceRoot); }

  async start(packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun', script: 'dev' | 'start' | 'preview') {
    const packageFile = this.guard.resolveInsideWorkspace('package.json');
    let packageJson: { scripts?: Record<string, string> };
    try { packageJson = JSON.parse(await readFile(packageFile, 'utf8')) as { scripts?: Record<string, string> }; }
    catch { throw new ValidationError('No readable package.json exists at the configured workspace root.'); }
    if (!packageJson.scripts?.[script]) throw new ValidationError(`package.json does not define the allowed script: ${script}`);

    const id = randomUUID();
    const startedAt = new Date().toISOString();
    const record: ServerProcessRecord = { id, pid: null, packageManager, script, status: 'starting', startedAt, stoppedAt: null, exitCode: null, logs: [] };
    await this.tasks.registerServerProcess(record);
    const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : packageManager;
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', `${packageManager} run ${script}`] : ['run', script];
    const child = spawn(command, args, { cwd: this.workspaceRoot, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSER: 'none' } });
    this.children.set(id, child);
    this.logBuffers.set(id, []);
    const append = (chunk: Buffer) => {
      const lines = (this.logBuffers.get(id) ?? []).concat(chunk.toString('utf8').split(/\r?\n/).filter(Boolean));
      this.logBuffers.set(id, lines.slice(-200));
    };
    child.stdout?.on('data', append);
    child.stderr?.on('data', append);
    child.once('spawn', () => { void this.tasks.updateServerProcess(id, { pid: child.pid ?? null, status: 'running', logs: this.logBuffers.get(id) ?? [] }); });
    child.once('error', error => { void this.tasks.updateServerProcess(id, { status: 'failed', stoppedAt: new Date().toISOString(), logs: [...(this.logBuffers.get(id) ?? []), error.message].slice(-200) }); });
    child.once('exit', (code) => { void this.tasks.updateServerProcess(id, { status: code === 0 || code === null ? 'stopped' : 'exited', stoppedAt: new Date().toISOString(), exitCode: code, logs: this.logBuffers.get(id) ?? [] }); });
    return { id, pid: child.pid ?? null, status: 'starting' };
  }

  async status(id: string) {
    const record = await this.tasks.getServerProcess(id);
    return { ...record, logs: this.logBuffers.get(id) ?? record.logs };
  }

  async stop(id: string) {
    const child = this.children.get(id);
    if (!child) throw new ValidationError(`Process was not started by this MCP server: ${id}`);
    child.kill('SIGTERM');
    this.children.delete(id);
    await this.tasks.updateServerProcess(id, { status: 'stopped', stoppedAt: new Date().toISOString() });
    return { id, status: 'stopped' };
  }

  async stopAll() {
    await Promise.all([...this.children.keys()].map(id => this.stop(id).catch(() => undefined)));
  }
}
