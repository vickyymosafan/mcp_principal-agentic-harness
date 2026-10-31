import { readFile } from 'node:fs/promises';

export interface ModuleSummary { id: number; name: string; cluster: string; function: string; capabilities: string[]; }
export class ModuleRegistry {
  constructor(private readonly catalogPath: string) {}
  async list(filter?: string): Promise<ModuleSummary[]> {
    const catalog = JSON.parse(await readFile(this.catalogPath, 'utf8')) as { modules: ModuleSummary[] };
    if (!filter) return catalog.modules;
    const normalized = filter.toLowerCase();
    return catalog.modules.filter(item => `${item.name} ${item.cluster} ${item.function} ${item.capabilities.join(' ')}`.toLowerCase().includes(normalized));
  }
}
