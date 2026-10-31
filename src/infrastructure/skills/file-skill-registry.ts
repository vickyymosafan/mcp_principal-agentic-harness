import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface SkillSummary { name: string; description: string; path: string; }

export class FileSkillRegistry {
  constructor(private readonly skillsRoot: string) {}
  async list(): Promise<SkillSummary[]> {
    let entries;
    try { entries = await readdir(this.skillsRoot, { withFileTypes: true }); }
    catch { return []; }
    const skills: SkillSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const file = path.join(this.skillsRoot, entry.name, 'SKILL.md');
      try {
        const content = await readFile(file, 'utf8');
        const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? entry.name;
        const description = content.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? '';
        skills.push({ name, description, path: path.relative(process.cwd(), file) });
      } catch { /* Ignore incomplete skill folders; catalog validation reports them separately. */ }
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }
}
