import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { waitForLocalUrl } from '../../infrastructure/runtime/localhost-readiness.js';
import type { TaskService } from '../../application/task-service.js';
import type { BrowserInspectorPort, DevServerPort } from '../../domain/ports.js';
import type { WorkspaceGuard } from '../../infrastructure/security/workspace-guard.js';
import type { FileSkillRegistry } from '../../infrastructure/skills/file-skill-registry.js';
import type { ModuleRegistry } from '../../infrastructure/catalog/module-registry.js';
import type { ChecklistDocumentWriter } from '../../infrastructure/persistence/checklist-document-writer.js';
import { toCreatePlanInput, toInteractionActions } from './input-normalizers.js';

interface Dependencies {
  workspaceRoot: string;
  harnessRoot: string;
  guard: WorkspaceGuard;
  taskService: TaskService;
  inspector: BrowserInspectorPort;
  devServer: DevServerPort;
  skillRegistry: FileSkillRegistry;
  moduleRegistry: ModuleRegistry;
  checklistWriter: ChecklistDocumentWriter;
  maxParallelTasks: number;
  browserTimeoutMs: number;
}

const workDomains = ['frontend', 'backend', 'design', 'responsive', 'threejs', 'motion', 'security', 'data', 'release'] as const;
const checkpointIds = ['responsive', 'layout', 'interaction', 'typography-color', 'motion', '3d-rendering', 'accessibility', 'performance', 'security', 'final-regression'] as const;
const viewportSchema = z.object({ name: z.string().min(1), width: z.number().int().min(240).max(7680), height: z.number().int().min(320).max(4320), isMobile: z.boolean(), hasTouch: z.boolean(), deviceScaleFactor: z.number().min(1).max(3) });
const actionSchema = z.object({ action: z.enum(['click', 'fill', 'check', 'uncheck', 'select', 'press', 'expect-visible', 'expect-text']), selector: z.string().min(1), value: z.string().optional(), timeoutMs: z.number().int().min(500).max(120000).optional() });

function result(value: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }; }
function errorResult(error: unknown) { return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? `${error.name}: ${error.message}` : String(error) }] }; }

export function createMcpServer(deps: Dependencies): McpServer {
  const server = new McpServer({ name: 'principal-agentic-engineering-harness', version: '0.1.0' });

  server.registerTool('harness.create_execution_plan', {
    description: 'Create a persistent task DAG for an engineering request. Returns parallel-ready workstreams, agent roles, Skill IDs, module references, and quality checkpoints. The host orchestrator must delegate ready tasks to native subagents.',
    inputSchema: z.object({ title: z.string().min(1).max(160), request: z.string().min(10).max(12000), domains: z.array(z.enum(workDomains)).optional(), maxRepairIterations: z.number().int().min(1).max(12).optional() })
  }, async input => { try { const created = await deps.taskService.createPlan(toCreatePlanInput(input)); const checklistPath = await deps.checklistWriter.write(created.plan.id); return result({ ...created, checklistPath }); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.get_execution_plan', {
    description: 'Read a plan, its tasks, and quality checkpoints.',
    inputSchema: z.object({ planId: z.string().uuid() })
  }, async ({ planId }) => { try { return result(await deps.taskService.getPlan(planId)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.get_ready_tasks', {
    description: 'Return all pending tasks whose dependencies are completed. Claim these in parallel using separate host subagents when file ownership and dependencies allow.',
    inputSchema: z.object({ planId: z.string().uuid() })
  }, async ({ planId }) => { try { return result(await deps.taskService.getReadyTasks(planId)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.claim_task', {
    description: 'Claim a ready task for one agent. Prevents duplicate concurrent ownership.',
    inputSchema: z.object({ taskId: z.string().uuid(), agentId: z.string().min(1).max(100) })
  }, async ({ taskId, agentId }) => { try { return result(await deps.taskService.claimTask(taskId, agentId)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.complete_task', {
    description: 'Complete, block, or fail a claimed task. Completed tasks that require evidence must include at least one existing evidence ID.',
    inputSchema: z.object({ taskId: z.string().uuid(), status: z.enum(['completed', 'blocked', 'failed']), evidenceIds: z.array(z.string().uuid()).default([]), reason: z.string().max(2000).nullable().optional() })
  }, async ({ taskId, status, evidenceIds, reason }) => { try { const task = await deps.taskService.completeTask(taskId, status, evidenceIds, reason ?? null); const checklistPath = await deps.checklistWriter.write(task.planId); return result({ task, checklistPath }); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.record_evidence', {
    description: 'Record auditable evidence for a plan or task. Evidence paths must be workspace-relative; do not record an assertion as evidence without an artifact or reproducible source.',
    inputSchema: z.object({ planId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), kind: z.enum(['browser-report', 'screenshot', 'test-report', 'build-log', 'security-report', 'manual-review', 'other']), title: z.string().min(1).max(200), description: z.string().max(4000), path: z.string().nullable().optional(), uri: z.string().url().refine(value => value.startsWith('https://'), 'Evidence URI must use HTTPS.').nullable().optional(), metadata: z.record(z.string(), z.unknown()).default({}), createdBy: z.string().min(1).max(100) })
  }, async input => { try {
    const safePath = input.path ? path.relative(deps.workspaceRoot, await deps.guard.resolveExistingFileInsideWorkspace(input.path)) : null;
    return result(await deps.taskService.recordEvidence({ ...input, path: safePath, planId: input.planId ?? null, taskId: input.taskId ?? null, uri: input.uri ?? null }));
  } catch (error) { return errorResult(error); } });

  server.registerTool('harness.update_quality_checkpoint', {
    description: 'Update one quality checkpoint. PASS requires evidence IDs. NOT_APPLICABLE requires an explicit rationale. Use FAIL or BLOCKED when a criterion is not met.',
    inputSchema: z.object({ planId: z.string().uuid(), dimension: z.enum(checkpointIds), status: z.enum(['pass', 'fail', 'blocked', 'not_applicable']), evidenceIds: z.array(z.string().uuid()).default([]), reason: z.string().max(2000).nullable().optional() })
  }, async ({ planId, dimension, status, evidenceIds, reason }) => { try { const checkpoint = await deps.taskService.updateCheckpoint(planId, dimension, status, evidenceIds, reason ?? null); const checklistPath = await deps.checklistWriter.write(planId); return result({ checkpoint, checklistPath }); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.evaluate_quality_gate', {
    description: 'Evaluate required acceptance checkpoints for a plan. A PASS is impossible while any required checkpoint is pending, failed, blocked, or missing valid evidence.',
    inputSchema: z.object({ planId: z.string().uuid() })
  }, async ({ planId }) => { try { return result(await deps.taskService.evaluateGate(planId)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.increment_repair_iteration', {
    description: 'Consume one repair-loop iteration from the plan budget. If the budget is exhausted, the task must be escalated instead of looping indefinitely.',
    inputSchema: z.object({ planId: z.string().uuid() })
  }, async ({ planId }) => { try { return result(await deps.taskService.incrementRepairIteration(planId)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.invalidate_checkpoints', {
    description: 'Invalidate quality checkpoints after a source/configuration change so stale PASS results cannot be reused.',
    inputSchema: z.object({ planId: z.string().uuid(), dimensions: z.array(z.enum(checkpointIds)).min(1), reason: z.string().min(3).max(1000) })
  }, async ({ planId, dimensions, reason }) => { try { const checkpoints = await deps.taskService.invalidateCheckpoints(planId, dimensions, reason); const checklistPath = await deps.checklistWriter.write(planId); return result({ checkpoints, checklistPath }); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.reopen_task', {
    description: 'Reopen a task and optionally all downstream dependent tasks after a requirement change or regression. Existing evidence remains in history but is detached from the reopened tasks.',
    inputSchema: z.object({ taskId: z.string().uuid(), reason: z.string().min(3).max(1000), cascade: z.boolean().default(true) })
  }, async ({ taskId, reason, cascade }) => { try { const tasks = await deps.taskService.reopenTask(taskId, reason, cascade); const checklistPath = tasks[0] ? await deps.checklistWriter.write(tasks[0].planId) : null; return result({ tasks, checklistPath }); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.list_modules', {
    description: 'Search or list the 70 engineering and governance modules available in the capability catalog.',
    inputSchema: z.object({ filter: z.string().max(120).optional() })
  }, async ({ filter }) => { try { return result(await deps.moduleRegistry.list(filter)); } catch (error) { return errorResult(error); } });

  server.registerTool('harness.list_skills', {
    description: 'List locally available Agent Skills with their descriptions and paths.',
    inputSchema: z.object({})
  }, async () => { try { return result(await deps.skillRegistry.list()); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.discover_routes', {
    description: 'Open a localhost entry route and discover same-origin anchor routes. Supplement this with source-router inspection because hidden, authenticated, or programmatic routes may not be linked from the page.',
    inputSchema: z.object({ baseUrl: z.string().url(), timeoutMs: z.number().int().min(1000).max(120000).default(deps.browserTimeoutMs) })
  }, async ({ baseUrl, timeoutMs }) => { try { return result(await deps.inspector.discoverRoutes(baseUrl, timeoutMs)); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.wait_for_ready', {
    description: 'Poll a loopback URL until the development site responds. Only localhost/127.0.0.1/::1 URLs are accepted.',
    inputSchema: z.object({ url: z.string().url(), timeoutMs: z.number().int().min(1000).max(120000).default(Math.max(30000, deps.browserTimeoutMs)) })
  }, async ({ url, timeoutMs }) => { try { return result(await waitForLocalUrl(url, timeoutMs)); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.start_dev_server', {
    description: 'Start an allowlisted package.json dev/start/preview script inside the configured workspace. Does not run arbitrary shell commands.',
    inputSchema: z.object({ packageManager: z.enum(['npm', 'pnpm', 'yarn', 'bun']).default('npm'), script: z.enum(['dev', 'start', 'preview']).default('dev') })
  }, async ({ packageManager, script }) => { try { return result(await deps.devServer.start(packageManager, script)); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.get_server_status', {
    description: 'Read status and bounded logs for a development server started by this MCP process.',
    inputSchema: z.object({ processId: z.string().uuid() })
  }, async ({ processId }) => { try { return result(await deps.devServer.status(processId)); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.stop_dev_server', {
    description: 'Stop only a development server process started and tracked by this MCP process.',
    inputSchema: z.object({ processId: z.string().uuid() })
  }, async ({ processId }) => { try { return result(await deps.devServer.stop(processId)); } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.inspect_responsive', {
    description: 'Open a localhost website using Playwright. Inspect each route across the default 13 viewport profiles or supplied profiles; collect full-page screenshots, DOM overflow measurements, console/page/network errors, and a JSON report. This is the responsive-first browser QA tool.',
    inputSchema: z.object({ baseUrl: z.string().url(), routes: z.array(z.string()).default(['/']), viewports: z.array(viewportSchema).optional(), timeoutMs: z.number().int().min(1000).max(120000).default(deps.browserTimeoutMs), allowedOverflowSelectors: z.array(z.string()).default([]), planId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), createdBy: z.string().default('responsive-qa-agent') })
  }, async input => { try {
    const evidenceDirectory = await deps.guard.ensureEvidenceDirectory();
    const report = await deps.inspector.inspectResponsive({ baseUrl: input.baseUrl, routes: input.routes, viewports: input.viewports ?? [], evidenceDirectory, timeoutMs: input.timeoutMs, allowedOverflowSelectors: input.allowedOverflowSelectors });
    const evidence = await deps.taskService.recordEvidence({ planId: input.planId ?? null, taskId: input.taskId ?? null, kind: 'browser-report', title: `Responsive inspection: ${report.runId}`, description: `${report.passedCases}/${report.totalCases} route/viewport cases passed. Overall: ${report.overallStatus}.`, path: path.relative(deps.workspaceRoot, report.reportPath), uri: null, metadata: { runId: report.runId, overallStatus: report.overallStatus, passedCases: report.passedCases, failedCases: report.failedCases, results: report.results.map(item => ({ route: item.route, viewport: item.viewport.name, passed: item.passed, issues: item.issues })) }, createdBy: input.createdBy });
    return result({ ...report, evidenceId: evidence.id, nextAction: report.overallStatus === 'pass' ? 'Record responsive checkpoint as PASS with this evidence ID, then continue to layout inspection.' : 'Diagnose failed route/viewport cases, repair source code, then rerun this tool. Do not mark responsive PASS.' });
  } catch (error) { return errorResult(error); } });

  server.registerTool('localhost.run_interaction_scenario', {
    description: 'Run an explicit, bounded interaction scenario on localhost using Playwright. Supports click/fill/check/select/press/visibility/text assertions. Potentially destructive selectors are blocked unless allowRiskyActions is explicitly true for an isolated test environment.',
    inputSchema: z.object({ baseUrl: z.string().url(), route: z.string().default('/'), actions: z.array(actionSchema).min(1).max(100), timeoutMs: z.number().int().min(1000).max(120000).default(deps.browserTimeoutMs), allowRiskyActions: z.boolean().default(false), planId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), createdBy: z.string().default('functional-qa-agent') })
  }, async input => { try {
    const evidenceDirectory = await deps.guard.ensureEvidenceDirectory();
    const report = await deps.inspector.runInteractionScenario({ baseUrl: input.baseUrl, route: input.route, actions: toInteractionActions(input.actions), evidenceDirectory, timeoutMs: input.timeoutMs, allowRiskyActions: input.allowRiskyActions });
    const evidence = await deps.taskService.recordEvidence({ planId: input.planId ?? null, taskId: input.taskId ?? null, kind: 'browser-report', title: `Interaction scenario: ${report.runId}`, description: `${report.steps.filter(step => step.status === 'pass').length}/${report.steps.length} interaction steps passed.`, path: path.relative(deps.workspaceRoot, report.reportPath), uri: null, metadata: { passed: report.passed, steps: report.steps }, createdBy: input.createdBy });
    return result({ ...report, evidenceId: evidence.id });
  } catch (error) { return errorResult(error); } });

  server.registerResource('architecture-blueprint', 'harness://architecture', { title: 'Principal Agentic Engineering Harness Architecture', description: 'Clean Architecture layers, agent delegation model, QA loop and boundaries.', mimeType: 'text/markdown' }, async uri => {
    const file = path.join(deps.harnessRoot, 'docs', 'ARCHITECTURE.md');
    const text = await readFile(file, 'utf8').catch(() => '# Architecture\nArchitecture document is not available in the configured workspace.');
    return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text }] };
  });

  server.registerResource('principal-development-principles', 'harness://development-principles', { title: 'Principal Development Principles', description: 'Clean Architecture, Clean Code, agent delegation, evidence, UI engineering and security rules.', mimeType: 'text/markdown' }, async uri => {
    const file = path.join(deps.harnessRoot, 'docs', 'PRINCIPAL_DEVELOPMENT.md');
    const text = await readFile(file, 'utf8');
    return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text }] };
  });

  server.registerResource('module-catalog', 'harness://modules', { title: '70-module capability catalog', description: 'Read-only catalog of all engineering, security, design, verification and learning capabilities.', mimeType: 'application/json' }, async uri => {
    const text = await readFile(path.join(deps.harnessRoot, 'catalogs', 'modules.json'), 'utf8');
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text }] };
  });
  server.registerResource('reference-catalog', 'harness://references', { title: 'Design reference catalog', description: 'Reference source provenance and verification statuses for the seven design categories.', mimeType: 'application/json' }, async uri => {
    const text = await readFile(path.join(deps.harnessRoot, 'catalogs', 'references.json'), 'utf8');
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text }] };
  });
  server.registerResource('runtime-config', 'harness://runtime-config', { title: 'Harness runtime configuration', description: 'Non-secret runtime limits for host orchestration and browser checks.', mimeType: 'application/json' }, async uri => {
    const text = JSON.stringify({ maxParallelTasks: deps.maxParallelTasks, browserTimeoutMs: deps.browserTimeoutMs }, null, 2);
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text }] };
  });

  server.registerResource('agent-role-catalog', 'harness://agent-roles', { title: 'Agent role catalog', description: 'Specialist agent roles and responsibilities for host-native delegation.', mimeType: 'application/json' }, async uri => {
    const text = await readFile(path.join(deps.harnessRoot, 'catalogs', 'agent-roles.json'), 'utf8');
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text }] };
  });

  server.registerPrompt('principal-orchestrator-workflow', {
    title: 'Principal Orchestrator Workflow',
    description: 'Plan and coordinate a project task using parallel subagents, Skills, MCP tools and independent verification.',
    argsSchema: z.object({ request: z.string().min(10), projectRoot: z.string().optional() })
  }, ({ request, projectRoot }) => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `Act as Principal Orchestrator. Create an execution plan for this request: ${request}\nWorkspace: ${projectRoot ?? deps.workspaceRoot}\nMaximum parallel tasks: ${deps.maxParallelTasks}. Never exceed this host delegation limit.\nUse harness.create_execution_plan, delegate dependency-ready tasks to host-native subagents, preserve file ownership, collect evidence, run localhost browser QA for UI changes, and do not pass quality gates without evidence.` } }] }));

  return server;
}
