import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async relativePath => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
const modulesCatalog = await readJson('catalogs/modules.json');
if (!Array.isArray(modulesCatalog.modules) || modulesCatalog.modules.length !== 70) {
  throw new Error(`Expected 70 modules, found ${modulesCatalog.modules?.length ?? 0}`);
}
const ids = modulesCatalog.modules.map(item => item.id);
if (new Set(ids).size !== 70 || ids.some((id, index) => id !== index + 1)) {
  throw new Error('Module IDs must be unique and sequential from 1 to 70.');
}
for (const item of modulesCatalog.modules) {
  if (!item.name || !item.function || !item.cluster || !Array.isArray(item.capabilities) || item.capabilities.length === 0) {
    throw new Error(`Invalid module record: ${item.id}`);
  }
}

const referencesCatalog = await readJson('catalogs/references.json');
if (!Array.isArray(referencesCatalog.categories) || referencesCatalog.categories.length !== 7) {
  throw new Error(`Expected 7 reference categories, found ${referencesCatalog.categories?.length ?? 0}`);
}
const references = referencesCatalog.categories.flatMap(category => {
  if (!category.id || !category.name || !Array.isArray(category.sources)) throw new Error(`Invalid reference category: ${category.id}`);
  return category.sources;
});
if (references.length !== 36) throw new Error(`Expected 36 reference sources, found ${references.length}`);
for (const reference of references) {
  if (!reference.title || !/^https:\/\//.test(reference.url) || !['verified', 'partial', 'partially_verified', 'unverified'].includes(reference.verificationStatus)) {
    throw new Error(`Invalid reference record: ${reference.title ?? 'unknown'}`);
  }
}

const rolesCatalog = await readJson('catalogs/agent-roles.json');
if (!Array.isArray(rolesCatalog.roles) || rolesCatalog.roles.length < 6) throw new Error('Agent role catalog must contain at least six roles.');
const roleIds = new Set();
for (const role of rolesCatalog.roles) {
  if (!role.id || !role.responsibility || !role.execution || roleIds.has(role.id)) throw new Error(`Invalid or duplicate agent role: ${role.id}`);
  roleIds.add(role.id);
}

const skillsRoot = path.join(root, '.agents', 'skills');
const entries = await readdir(skillsRoot, { withFileTypes: true });
const skillDirs = entries.filter(entry => entry.isDirectory());
const skillNames = new Set();
for (const dir of skillDirs) {
  const file = path.join(skillsRoot, dir.name, 'SKILL.md');
  const content = await readFile(file, 'utf8');
  const name = content.match(/^name:\s*([a-z0-9-]+)$/m)?.[1];
  const description = content.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!content.startsWith('---\n') || !name || !description) throw new Error(`Invalid Agent Skill metadata: ${dir.name}`);
  if (name !== dir.name) throw new Error(`Skill folder/name mismatch: ${dir.name} != ${name}`);
  if (name.length > 64 || description.length > 1024) throw new Error(`Agent Skill metadata exceeds specification limits: ${dir.name}`);
  if (skillNames.has(name)) throw new Error(`Duplicate Agent Skill name: ${name}`);
  skillNames.add(name);
}

console.log(`Catalog valid: ${modulesCatalog.modules.length} modules, ${references.length} reference sources across ${referencesCatalog.categories.length} categories, ${skillDirs.length} Agent Skills, ${rolesCatalog.roles.length} agent roles.`);
