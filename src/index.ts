import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { JsonStateRepository } from './infrastructure/persistence/json-state-repository.js';
import { WorkspaceGuard } from './infrastructure/security/workspace-guard.js';
import { PlaywrightInspector } from './infrastructure/browser/playwright-inspector.js';
import { LocalDevServerManager } from './infrastructure/runtime/local-dev-server.js';
import { FileSkillRegistry } from './infrastructure/skills/file-skill-registry.js';
import { ModuleRegistry } from './infrastructure/catalog/module-registry.js';
import { TaskService } from './application/task-service.js';
import { ChecklistDocumentWriter } from './infrastructure/persistence/checklist-document-writer.js';
import { createMcpServer } from './interfaces/mcp/server.js';
import { createRuntimeConfig } from './infrastructure/config/runtime-config.js';
import { TaskPlanner } from './application/task-planner.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootCandidates = [path.resolve(currentDirectory, '../..'), path.resolve(currentDirectory, '..'), process.cwd()];
const projectRoot = rootCandidates.find(candidate => existsSync(path.join(candidate, 'catalogs', 'modules.json'))) ?? process.cwd();
const runtimeConfig = createRuntimeConfig();
const workspaceRoot = await realpath(runtimeConfig.workspaceRoot);
const guard = new WorkspaceGuard(workspaceRoot);
const stateDirectory = await guard.ensureEvidenceDirectory(runtimeConfig.stateDirectory);
const repository = new JsonStateRepository(path.join(stateDirectory, 'state.json'));
const taskService = new TaskService(repository, new TaskPlanner(runtimeConfig.maxRepairIterations));
const inspector = new PlaywrightInspector();
const devServer = new LocalDevServerManager(workspaceRoot, taskService);
const skillRegistry = new FileSkillRegistry(path.join(projectRoot, '.agents', 'skills'));
const moduleRegistry = new ModuleRegistry(path.join(projectRoot, 'catalogs', 'modules.json'));
const checklistWriter = new ChecklistDocumentWriter(taskService, guard);

const shutdown = async () => { await devServer.stopAll(); process.exit(0); };
process.once('SIGINT', () => { void shutdown(); });
process.once('SIGTERM', () => { void shutdown(); });

console.error(`Principal Agentic Engineering Harness MCP ready. Workspace: ${workspaceRoot}`);
await serveStdio(() => createMcpServer({ workspaceRoot, harnessRoot: projectRoot, guard, taskService, inspector, devServer, skillRegistry, moduleRegistry, checklistWriter, maxParallelTasks: runtimeConfig.maxParallelTasks, browserTimeoutMs: runtimeConfig.browserTimeoutMs }));
