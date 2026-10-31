import { randomUUID } from 'node:crypto';
import type { StateRepository } from '../domain/ports.js';
import type { EvidenceRecord, ExecutionPlan, QualityCheckpoint, TaskNode, TaskStatus } from '../domain/models.js';
import { QUALITY_DIMENSIONS } from '../domain/models.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js';
import { TaskPlanner, type CreatePlanInput } from './task-planner.js';

const now = () => new Date().toISOString();

export class TaskService {
  constructor(private readonly repository: StateRepository, private readonly planner = new TaskPlanner()) {}

  async createPlan(input: CreatePlanInput): Promise<{ plan: ExecutionPlan; tasks: TaskNode[]; checkpoints: QualityCheckpoint[] }> {
    const { plan, tasks } = this.planner.create(input);
    const checkpointSet = QUALITY_DIMENSIONS.filter(item => plan.checkpointIds.includes(item.id));
    const checkpoints: QualityCheckpoint[] = checkpointSet.map(item => ({
      id: `${plan.id}:${item.id}`, title: item.title, status: 'pending',
      required: item.required || (item.id === 'motion' && plan.domains.includes('motion')) || (item.id === '3d-rendering' && plan.domains.includes('threejs')),
      evidenceIds: [], reason: null, updatedAt: now()
    }));
    await this.repository.transact(state => {
      state.plans[plan.id] = plan;
      for (const task of tasks) state.tasks[task.id] = task;
      for (const checkpoint of checkpoints) state.checkpoints[checkpoint.id] = checkpoint;
    });
    return { plan, tasks, checkpoints };
  }

  async getPlan(planId: string): Promise<{ plan: ExecutionPlan; tasks: TaskNode[]; checkpoints: QualityCheckpoint[] }> {
    const state = await this.repository.read();
    const plan = state.plans[planId];
    if (!plan) throw new NotFoundError('Plan', planId);
    return {
      plan,
      tasks: plan.taskIds.map(id => state.tasks[id]).filter((task): task is TaskNode => Boolean(task)),
      checkpoints: plan.checkpointIds.map(id => state.checkpoints[`${plan.id}:${id}`]).filter((item): item is QualityCheckpoint => Boolean(item))
    };
  }

  async getEvidenceForPlan(planId: string): Promise<EvidenceRecord[]> {
    const state = await this.repository.read();
    if (!state.plans[planId]) throw new NotFoundError('Plan', planId);
    return Object.values(state.evidence).filter(item => item.planId === planId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getReadyTasks(planId: string): Promise<TaskNode[]> {
    const state = await this.repository.read();
    const plan = state.plans[planId];
    if (!plan) throw new NotFoundError('Plan', planId);
    return plan.taskIds.map(id => state.tasks[id]).filter((task): task is TaskNode => Boolean(task)).filter(task =>
      task.status === 'pending' && task.dependsOn.every(depId => state.tasks[depId]?.status === 'completed')
    );
  }

  async claimTask(taskId: string, agentId: string): Promise<TaskNode> {
    if (!agentId.trim()) throw new ValidationError('agentId must not be empty.');
    return this.repository.transact(state => {
      const task = state.tasks[taskId];
      if (!task) throw new NotFoundError('Task', taskId);
      if (task.status !== 'pending') throw new ConflictError(`Task cannot be claimed from status ${task.status}.`);
      const blockedBy = task.dependsOn.filter(id => state.tasks[id]?.status !== 'completed');
      if (blockedBy.length) throw new ConflictError(`Task dependencies are not complete: ${blockedBy.join(', ')}`);
      const updated: TaskNode = { ...task, status: 'in_progress', claimedBy: agentId, updatedAt: now() };
      state.tasks[taskId] = updated;
      return updated;
    });
  }

  async completeTask(taskId: string, status: Extract<TaskStatus, 'completed' | 'blocked' | 'failed'>, evidenceIds: string[] = [], reason: string | null = null): Promise<TaskNode> {
    return this.repository.transact(state => {
      const task = state.tasks[taskId];
      if (!task) throw new NotFoundError('Task', taskId);
      if (task.status !== 'in_progress') throw new ConflictError(`Task must be in_progress before completion. Current: ${task.status}`);
      if (status !== 'completed' && !reason?.trim()) throw new ValidationError(`${status.toUpperCase()} requires a documented reason.`);
      if (status === 'completed' && task.requiredEvidence && evidenceIds.length === 0) throw new ValidationError('This task requires at least one evidence record before it can be completed.');
      const missing = evidenceIds.filter(id => !state.evidence[id]);
      if (missing.length) throw new ValidationError(`Unknown evidence IDs: ${missing.join(', ')}`);
      const unrelated = evidenceIds.filter(id => { const item = state.evidence[id]!; return item.planId !== task.planId || (item.taskId !== null && item.taskId !== taskId); });
      if (unrelated.length) throw new ValidationError(`Evidence must belong to this plan and may only be linked to this task: ${unrelated.join(', ')}`);
      const updated: TaskNode = { ...task, status, evidenceIds: [...new Set([...task.evidenceIds, ...evidenceIds])], failureReason: reason, completedAt: status === 'completed' ? now() : null, updatedAt: now() };
      state.tasks[taskId] = updated;
      const plan = state.plans[task.planId];
      if (plan) state.plans[task.planId] = { ...plan, updatedAt: now() };
      return updated;
    });
  }

  async recordEvidence(input: Omit<EvidenceRecord, 'id' | 'createdAt'>): Promise<EvidenceRecord> {
    if (!input.path?.trim() && !input.uri?.trim()) {
      throw new ValidationError('Evidence must reference a workspace artifact path or reproducible URI.');
    }
    return this.repository.transact(state => {
      let planId = input.planId;
      if (planId && !state.plans[planId]) throw new NotFoundError('Plan', planId);
      if (input.taskId) {
        const task = state.tasks[input.taskId];
        if (!task) throw new NotFoundError('Task', input.taskId);
        if (planId && planId !== task.planId) throw new ValidationError('Evidence planId does not match the task plan.');
        planId = task.planId;
      }
      const record: EvidenceRecord = { ...input, planId, id: randomUUID(), createdAt: now() };
      state.evidence[record.id] = record;
      return record;
    });
  }

  async updateCheckpoint(planId: string, dimension: string, status: QualityCheckpoint['status'], evidenceIds: string[], reason: string | null): Promise<QualityCheckpoint> {
    return this.repository.transact(state => {
      const plan = state.plans[planId];
      if (!plan) throw new NotFoundError('Plan', planId);
      if (!plan.checkpointIds.includes(dimension)) throw new ValidationError(`Checkpoint is not part of this plan: ${dimension}`);
      if (status === 'pass' && evidenceIds.length === 0) throw new ValidationError('A PASS checkpoint requires evidence.');
      if (['not_applicable', 'fail', 'blocked'].includes(status) && !reason?.trim()) throw new ValidationError(`${status.toUpperCase()} requires a documented reason.`);
      const missing = evidenceIds.filter(id => !state.evidence[id]);
      if (missing.length) throw new ValidationError(`Unknown evidence IDs: ${missing.join(', ')}`);
      const unrelated = evidenceIds.filter(id => state.evidence[id]!.planId !== planId);
      if (unrelated.length) throw new ValidationError(`Checkpoint evidence must belong to this plan: ${unrelated.join(', ')}`);
      const checkpointId = `${planId}:${dimension}`;
      const previous = state.checkpoints[checkpointId];
      if (!previous) throw new NotFoundError('Checkpoint', checkpointId);
      const checkpoint: QualityCheckpoint = { ...previous, status, evidenceIds: [...new Set(evidenceIds)], reason, updatedAt: now() };
      state.checkpoints[checkpointId] = checkpoint;
      state.plans[planId] = { ...plan, updatedAt: now() };
      return checkpoint;
    });
  }

  async evaluateGate(planId: string): Promise<{ status: 'pass' | 'blocked'; missing: string[]; failed: string[]; checkpoints: QualityCheckpoint[] }> {
    const snapshot = await this.getPlan(planId);
    const evidence = await this.getEvidenceForPlan(planId);
    const evidenceIds = new Set(evidence.map(item => item.id));
    const { checkpoints, tasks } = snapshot;
    const pendingTasks = tasks.filter(task => ['pending', 'in_progress'].includes(task.status)).map(task => `Task: ${task.title}`);
    const failedTasks = tasks.filter(task => ['blocked', 'failed', 'cancelled'].includes(task.status)).map(task => `Task: ${task.title}`);
    const missing = [
      ...pendingTasks,
      ...checkpoints.filter(item => item.required && item.status === 'pending').map(item => item.title)
    ];
    const failed = [
      ...failedTasks,
      ...checkpoints.filter(item => item.required && ['fail', 'blocked'].includes(item.status)).map(item => item.title)
    ];
    const invalidNA = checkpoints.filter(item => item.required && item.status === 'not_applicable' && !item.reason?.trim()).map(item => item.title);
    const passWithoutEvidence = checkpoints.filter(item => item.required && item.status === 'pass' && (item.evidenceIds.length === 0 || item.evidenceIds.some(id => !evidenceIds.has(id)))).map(item => item.title);
    const incomplete = missing.length + failed.length + invalidNA.length + passWithoutEvidence.length > 0;
    return { status: incomplete ? 'blocked' : 'pass', missing, failed: [...failed, ...invalidNA, ...passWithoutEvidence], checkpoints };
  }

  async incrementRepairIteration(planId: string): Promise<{ repairIterations: number; maxRepairIterations: number }> {
    return this.repository.transact(state => {
      const plan = state.plans[planId];
      if (!plan) throw new NotFoundError('Plan', planId);
      if (plan.repairIterations >= plan.maxRepairIterations) throw new ConflictError(`Repair budget exhausted (${plan.maxRepairIterations}). Escalate to human review.`);
      const updated = { ...plan, repairIterations: plan.repairIterations + 1, updatedAt: now() };
      state.plans[planId] = updated;
      return { repairIterations: updated.repairIterations, maxRepairIterations: updated.maxRepairIterations };
    });
  }

  async invalidateCheckpoints(planId: string, dimensions: string[], reason: string): Promise<QualityCheckpoint[]> {
    return this.repository.transact(state => {
      const plan = state.plans[planId];
      if (!plan) throw new NotFoundError('Plan', planId);
      const updated: QualityCheckpoint[] = [];
      for (const dimension of dimensions) {
        if (!plan.checkpointIds.includes(dimension)) throw new ValidationError(`Checkpoint is not part of this plan: ${dimension}`);
        const id = `${planId}:${dimension}`;
        const previous = state.checkpoints[id];
        if (!previous) throw new NotFoundError('Checkpoint', id);
        const checkpoint: QualityCheckpoint = { ...previous, status: 'pending', evidenceIds: [], reason: `Invalidated: ${reason}`, updatedAt: now() };
        state.checkpoints[id] = checkpoint;
        updated.push(checkpoint);
      }
      state.plans[planId] = { ...plan, updatedAt: now() };
      return updated;
    });
  }

  async reopenTask(taskId: string, reason: string, cascade = true): Promise<TaskNode[]> {
    return this.repository.transact(state => {
      const target = state.tasks[taskId];
      if (!target) throw new NotFoundError('Task', taskId);
      const affected = new Set<string>([taskId]);
      if (cascade) {
        let changed = true;
        while (changed) {
          changed = false;
          for (const task of Object.values(state.tasks)) {
            if (task.planId === target.planId && !affected.has(task.id) && task.dependsOn.some(dep => affected.has(dep))) {
              affected.add(task.id);
              changed = true;
            }
          }
        }
      }
      const reopened: TaskNode[] = [];
      for (const id of affected) {
        const current = state.tasks[id]!;
        const updated: TaskNode = { ...current, status: 'pending', evidenceIds: [], claimedBy: null, completedAt: null, failureReason: reason, updatedAt: now() };
        state.tasks[id] = updated;
        reopened.push(updated);
      }
      const plan = state.plans[target.planId]!;
      for (const dimension of plan.checkpointIds) {
        const checkpointId = `${target.planId}:${dimension}`;
        const previous = state.checkpoints[checkpointId];
        if (previous) state.checkpoints[checkpointId] = { ...previous, status: 'pending', evidenceIds: [], reason: `Invalidated by reopened task: ${reason}`, updatedAt: now() };
      }
      state.plans[target.planId] = { ...plan, updatedAt: now() };
      return reopened;
    });
  }

  async getServerProcess(id: string): Promise<ServerProcessRecord> {
    const state = await this.repository.read();
    const record = state.serverProcesses[id];
    if (!record) throw new NotFoundError('Server process', id);
    return record;
  }

  async registerServerProcess(record: HarnessStateProcessInput): Promise<void> {
    await this.repository.transact(state => { state.serverProcesses[record.id] = record; });
  }

  async updateServerProcess(id: string, patch: Partial<HarnessStateProcessInput>): Promise<void> {
    await this.repository.transact(state => {
      const current = state.serverProcesses[id];
      if (!current) throw new NotFoundError('Server process', id);
      state.serverProcesses[id] = { ...current, ...patch };
    });
  }
}

import type { ServerProcessRecord } from '../domain/models.js';
type HarnessStateProcessInput = ServerProcessRecord;
