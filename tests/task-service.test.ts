import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskService } from '../src/application/task-service.js';
import { EMPTY_STATE, type HarnessState } from '../src/domain/models.js';
import type { StateRepository } from '../src/domain/ports.js';

class MemoryRepository implements StateRepository {
  private state: HarnessState = structuredClone(EMPTY_STATE);
  async read(): Promise<HarnessState> { return structuredClone(this.state); }
  async transact<T>(operation: (state: HarnessState) => T | Promise<T>): Promise<T> {
    return operation(this.state);
  }
}

const evidenceInput = (planId: string, taskId: string | null = null) => ({
  planId,
  taskId,
  kind: 'manual-review' as const,
  title: 'Requirement review passed',
  description: 'Reviewer confirmed the recorded acceptance criteria.',
  path: 'tests/fixtures/review-evidence.md',
  uri: null,
  metadata: { reviewer: 'test-agent' },
  createdBy: 'test-agent'
});

test('plan exposes only dependency-ready tasks', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Portfolio page', request: 'Build a responsive frontend portfolio website with motion' });
  const ready = await service.getReadyTasks(plan.plan.id);
  assert.equal(ready.length, 1);
  assert.match(ready[0]!.title, /Discover requirements/);
});

test('task cannot be claimed before dependencies complete', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'API', request: 'Build backend API service' });
  const architecture = plan.tasks.find(task => task.title.includes('architecture'))!;
  await assert.rejects(() => service.claimTask(architecture.id, 'architect-1'));
});

test('claim is single-owner and rejects blank agent identifiers', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'API', request: 'Build backend API service' });
  const discovery = plan.tasks[0]!;
  await assert.rejects(() => service.claimTask(discovery.id, '   '));
  await service.claimTask(discovery.id, 'discovery-agent');
  await assert.rejects(() => service.claimTask(discovery.id, 'second-agent'));
});

test('completed task requires task-scoped evidence', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build frontend website' });
  const discovery = plan.tasks[0]!;
  await service.claimTask(discovery.id, 'discovery-agent');
  await assert.rejects(() => service.completeTask(discovery.id, 'completed'));
  const evidence = await service.recordEvidence(evidenceInput(plan.plan.id, discovery.id));
  const completed = await service.completeTask(discovery.id, 'completed', [evidence.id]);
  assert.equal(completed.status, 'completed');
});

test('evidence cannot be attached to a task from another plan', async () => {
  const service = new TaskService(new MemoryRepository());
  const first = await service.createPlan({ title: 'First', request: 'Build frontend website' });
  const second = await service.createPlan({ title: 'Second', request: 'Build backend API' });
  const task = first.tasks[0]!;
  await service.claimTask(task.id, 'agent');
  const evidence = await service.recordEvidence(evidenceInput(second.plan.id));
  await assert.rejects(() => service.completeTask(task.id, 'completed', [evidence.id]));
});

test('PASS checkpoint requires plan-scoped evidence', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build responsive frontend website' });
  await assert.rejects(() => service.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [], null));
  const other = await service.createPlan({ title: 'Other', request: 'Build another responsive frontend' });
  const evidence = await service.recordEvidence(evidenceInput(other.plan.id));
  await assert.rejects(() => service.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [evidence.id], null));
  const valid = await service.recordEvidence(evidenceInput(plan.plan.id));
  const checkpoint = await service.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [valid.id], null);
  assert.equal(checkpoint.status, 'pass');
});

test('quality gate blocks while required checkpoints are pending', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build responsive frontend website' });
  const result = await service.evaluateGate(plan.plan.id);
  assert.equal(result.status, 'blocked');
  assert.ok(result.missing.includes('Responsive'));
});

test('invalidated checkpoint cannot retain a stale PASS status', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build responsive frontend website' });
  const evidence = await service.recordEvidence(evidenceInput(plan.plan.id));
  await service.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [evidence.id], null);
  const [checkpoint] = await service.invalidateCheckpoints(plan.plan.id, ['responsive'], 'CSS source changed');
  assert.equal(checkpoint!.status, 'pending');
  assert.deepEqual(checkpoint!.evidenceIds, []);
});

test('reopening a task cascades and invalidates all plan checkpoints', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build responsive frontend website' });
  const evidence = await service.recordEvidence(evidenceInput(plan.plan.id));
  await service.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [evidence.id], null);
  const discovery = plan.tasks[0]!;
  const reopened = await service.reopenTask(discovery.id, 'New product requirement');
  assert.equal(reopened.length, plan.tasks.length);
  const snapshot = await service.getPlan(plan.plan.id);
  assert.ok(snapshot.tasks.every(task => task.status === 'pending'));
  assert.ok(snapshot.checkpoints.every(checkpoint => checkpoint.status === 'pending'));
});

test('repair iteration budget cannot be exceeded', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'Web', request: 'Build frontend website', maxRepairIterations: 1 });
  const first = await service.incrementRepairIteration(plan.plan.id);
  assert.equal(first.repairIterations, 1);
  await assert.rejects(() => service.incrementRepairIteration(plan.plan.id), /budget exhausted/i);
});

test('blocked and failed tasks require a reason', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'API', request: 'Build backend API service' });
  const discovery = plan.tasks[0]!;
  await service.claimTask(discovery.id, 'agent');
  await assert.rejects(() => service.completeTask(discovery.id, 'blocked'));
  const blocked = await service.completeTask(discovery.id, 'blocked', [], 'Repository is missing required package metadata.');
  assert.equal(blocked.status, 'blocked');
});


test('quality gate also blocks while execution tasks are unfinished', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'API', request: 'Build backend API service' });
  const result = await service.evaluateGate(plan.plan.id);
  assert.equal(result.status, 'blocked');
  assert.ok(result.missing.some(item => item.startsWith('Task:')));
});


test('independent planning tasks become ready together after discovery', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({
    title: 'Fullstack 3D site',
    request: 'Build a responsive fullstack 3D portfolio with Three.js, shaders, motion, and security',
    domains: ['frontend', 'backend', 'threejs', 'motion', 'security']
  });
  const discovery = plan.tasks[0]!;
  await service.claimTask(discovery.id, 'discovery-agent');
  const evidence = await service.recordEvidence(evidenceInput(plan.plan.id, discovery.id));
  await service.completeTask(discovery.id, 'completed', [evidence.id]);
  const ready = await service.getReadyTasks(plan.plan.id);
  assert.ok(ready.length >= 3);
  assert.ok(ready.some(task => task.ownerRole === 'governance-lead'));
  assert.ok(ready.some(task => task.ownerRole === 'architecture-lead'));
  assert.ok(ready.some(task => task.ownerRole === 'design-lead'));
  assert.ok(ready.every(task => task.parallelGroup === 'planning'));
});

test('Three.js plans enable frontend work, dedicated 3D QA and a required 3D checkpoint', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({
    title: '3D portfolio',
    request: 'Build an interactive Three.js portfolio with custom shaders',
    domains: ['threejs']
  });

  assert.ok(plan.plan.domains.includes('frontend'));
  assert.ok(plan.plan.domains.includes('threejs'));
  const threeJsTask = plan.tasks.find(task => task.ownerRole === 'threejs-developer');
  const threeJsQa = plan.tasks.find(task => task.ownerRole === 'threejs-qa-agent');
  assert.ok(threeJsTask);
  assert.ok(threeJsQa);
  assert.ok(plan.plan.checkpointIds.includes('3d-rendering'));
  assert.equal(plan.checkpoints.find(item => item.id.endsWith(':3d-rendering'))?.required, true);
  assert.ok(threeJsQa.dependsOn.includes(plan.tasks.find(task => task.title.includes('typography, color and motion'))!.id));
});

test('motion quality checkpoint is required only for plans that include motion', async () => {
  const service = new TaskService(new MemoryRepository());
  const motionPlan = await service.createPlan({ title: 'Motion UI', request: 'Build a website with motion', domains: ['frontend', 'motion'] });
  const staticPlan = await service.createPlan({ title: 'Static UI', request: 'Build a static website', domains: ['frontend'] });

  assert.equal(motionPlan.checkpoints.find(item => item.id.endsWith(':motion'))?.required, true);
  assert.ok(!staticPlan.plan.checkpointIds.includes('motion'));
});

test('backend-only plans omit UI-specific checkpoints and tasks', async () => {
  const service = new TaskService(new MemoryRepository());
  const plan = await service.createPlan({ title: 'API service', request: 'Build backend API service', domains: ['backend'] });

  for (const dimension of ['responsive', 'layout', 'interaction', 'typography-color', 'motion', '3d-rendering', 'accessibility']) {
    assert.ok(!plan.plan.checkpointIds.includes(dimension), `${dimension} should not apply to backend-only work`);
  }
  assert.ok(!plan.tasks.some(task => task.ownerRole === 'responsive-qa-agent' || task.ownerRole === 'threejs-qa-agent'));
});


test('evidence records require a workspace artifact path or reproducible URI', async () => {
  const service = new TaskService(new MemoryRepository());
  await assert.rejects(
    () => service.recordEvidence({ ...evidenceInput('00000000-0000-4000-8000-000000000001'), path: null, uri: null }),
    /artifact path or reproducible URI/i
  );
});
