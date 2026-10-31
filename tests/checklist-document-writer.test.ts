import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { TaskService } from '../src/application/task-service.js';
import { EMPTY_STATE, type HarnessState } from '../src/domain/models.js';
import type { StateRepository } from '../src/domain/ports.js';
import { ChecklistDocumentWriter } from '../src/infrastructure/persistence/checklist-document-writer.js';
import { WorkspaceGuard } from '../src/infrastructure/security/workspace-guard.js';

class MemoryRepository implements StateRepository {
  private state: HarnessState = structuredClone(EMPTY_STATE);
  async read(): Promise<HarnessState> { return structuredClone(this.state); }
  async transact<T>(operation: (state: HarnessState) => T | Promise<T>): Promise<T> { return operation(this.state); }
}

test('generated checklist includes execution tasks, checkpoint states and evidence metadata', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'principal-harness-checklist-'));
  try {
    const tasks = new TaskService(new MemoryRepository());
    const plan = await tasks.createPlan({ title: 'Responsive portfolio', request: 'Build a responsive portfolio website' });
    const discovery = plan.tasks[0]!;
    await tasks.claimTask(discovery.id, 'discovery-agent');
    const evidence = await tasks.recordEvidence({
      planId: plan.plan.id,
      taskId: discovery.id,
      kind: 'test-report',
      title: 'Discovery acceptance report',
      description: 'Acceptance criteria and repository map were reviewed.',
      path: '.harness/evidence/discovery.json',
      uri: null,
      metadata: {},
      createdBy: 'discovery-agent'
    });
    await tasks.completeTask(discovery.id, 'completed', [evidence.id]);
    await tasks.updateCheckpoint(plan.plan.id, 'responsive', 'pass', [evidence.id], null);

    const writer = new ChecklistDocumentWriter(tasks, new WorkspaceGuard(root));
    const relativePath = await writer.write(plan.plan.id);
    const document = await readFile(path.join(root, relativePath), 'utf8');
    assert.match(document, /## Execution tasks/);
    assert.match(document, /DISCOVERY-AGENT|discovery-lead/i);
    assert.match(document, /## Quality checkpoints/);
    assert.match(document, /Responsive \| Yes \| PASS/);
    assert.match(document, /Discovery acceptance report/);
    assert.match(document, new RegExp(evidence.id));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
