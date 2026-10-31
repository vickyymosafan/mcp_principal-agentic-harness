export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed' | 'cancelled';
export type CheckpointStatus = 'pending' | 'pass' | 'fail' | 'blocked' | 'not_applicable';
export type EvidenceKind = 'browser-report' | 'screenshot' | 'test-report' | 'build-log' | 'security-report' | 'manual-review' | 'other';
export type WorkDomain = 'frontend' | 'backend' | 'design' | 'responsive' | 'threejs' | 'motion' | 'security' | 'data' | 'release';

export interface TaskNode {
  id: string;
  planId: string;
  title: string;
  description: string;
  ownerRole: string;
  skillIds: string[];
  moduleIds: number[];
  domains: WorkDomain[];
  dependsOn: string[];
  status: TaskStatus;
  parallelGroup: string | null;
  requiredEvidence: boolean;
  evidenceIds: string[];
  claimedBy: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface QualityCheckpoint {
  id: string;
  title: string;
  status: CheckpointStatus;
  required: boolean;
  evidenceIds: string[];
  reason: string | null;
  updatedAt: string;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  request: string;
  domains: WorkDomain[];
  taskIds: string[];
  checkpointIds: string[];
  maxRepairIterations: number;
  repairIterations: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  planId: string | null;
  taskId: string | null;
  kind: EvidenceKind;
  title: string;
  description: string;
  path: string | null;
  uri: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
}

export interface ServerProcessRecord {
  id: string;
  pid: number | null;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  script: 'dev' | 'start' | 'preview';
  status: 'starting' | 'running' | 'exited' | 'stopped' | 'failed';
  startedAt: string;
  stoppedAt: string | null;
  exitCode: number | null;
  logs: string[];
}

export interface HarnessState {
  schemaVersion: 1;
  plans: Record<string, ExecutionPlan>;
  tasks: Record<string, TaskNode>;
  checkpoints: Record<string, QualityCheckpoint>;
  evidence: Record<string, EvidenceRecord>;
  serverProcesses: Record<string, ServerProcessRecord>;
}

export const EMPTY_STATE: HarnessState = {
  schemaVersion: 1,
  plans: {}, tasks: {}, checkpoints: {}, evidence: {}, serverProcesses: {}
};

export const QUALITY_DIMENSIONS = [
  { id: 'responsive', title: 'Responsive', required: true },
  { id: 'layout', title: 'Layout & Structure', required: true },
  { id: 'interaction', title: 'Functional Interaction', required: true },
  { id: 'typography-color', title: 'Typography & Color', required: true },
  { id: 'motion', title: 'Motion & Animation', required: false },
  { id: '3d-rendering', title: '3D Rendering & Shader Stability', required: false },
  { id: 'accessibility', title: 'Accessibility', required: true },
  { id: 'performance', title: 'Performance', required: true },
  { id: 'security', title: 'Security & Reliability', required: true },
  { id: 'final-regression', title: 'Final Regression', required: true }
] as const;

export type QualityDimensionId = typeof QUALITY_DIMENSIONS[number]['id'];
