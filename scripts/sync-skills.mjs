import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const target = process.argv[2];
const destinations = {
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  antigravity: '.agent/skills',
  generic: '.agents/skills'
};
if (!target || !destinations[target]) {
  console.error(`Usage: npm run skills:sync -- <${Object.keys(destinations).join('|')}>`);
  process.exit(2);
}
const root = process.cwd();
const source = path.join(root, '.agents', 'skills');
const destination = path.join(root, destinations[target]);
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log(`Copied canonical Skills from ${source} to ${destination}.`);
