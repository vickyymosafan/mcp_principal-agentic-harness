import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EMPTY_STATE, type HarnessState } from '../../domain/models.js';
import type { StateRepository } from '../../domain/ports.js';

class AsyncMutex {
  private tail: Promise<void> = Promise.resolve();
  async run<T>(operation: () => Promise<T> | T): Promise<T> {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const previous = this.tail;
    this.tail = previous.then(() => gate);
    await previous;
    try { return await operation(); } finally { release(); }
  }
}

export class JsonStateRepository implements StateRepository {
  private readonly mutex = new AsyncMutex();
  constructor(private readonly stateFile: string) {}

  async read(): Promise<HarnessState> {
    return this.mutex.run(async () => this.readUnsafe());
  }

  async transact<T>(operation: (state: HarnessState) => T | Promise<T>): Promise<T> {
    return this.mutex.run(async () => {
      const state = await this.readUnsafe();
      const result = await operation(state);
      await mkdir(path.dirname(this.stateFile), { recursive: true });
      const temporaryFile = `${this.stateFile}.${process.pid}.tmp`;
      await writeFile(temporaryFile, JSON.stringify(state, null, 2), 'utf8');
      await rename(temporaryFile, this.stateFile);
      return result;
    });
  }

  private async readUnsafe(): Promise<HarnessState> {
    try {
      const raw = await readFile(this.stateFile, 'utf8');
      const parsed = JSON.parse(raw) as HarnessState;
      if (parsed.schemaVersion !== 1) throw new Error(`Unsupported state schema version: ${String(parsed.schemaVersion)}`);
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(EMPTY_STATE);
      throw error;
    }
  }
}
