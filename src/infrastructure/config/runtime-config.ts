import path from 'node:path';
import { ValidationError } from '../../domain/errors.js';

export interface HarnessRuntimeConfig {
  workspaceRoot: string;
  stateDirectory: string;
  maxParallelTasks: number;
  maxRepairIterations: number;
  browserTimeoutMs: number;
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number, variableName: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new ValidationError(`${variableName} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

export function createRuntimeConfig(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): HarnessRuntimeConfig {
  const workspaceRoot = path.resolve(env.HARNESS_WORKSPACE_ROOT ?? cwd);
  const stateDirectory = env.HARNESS_STATE_DIR ?? '.harness';
  if (path.isAbsolute(stateDirectory)) throw new ValidationError('HARNESS_STATE_DIR must be relative to the workspace root.');

  return {
    workspaceRoot,
    stateDirectory,
    maxParallelTasks: boundedInteger(env.HARNESS_MAX_PARALLEL_TASKS, 4, 1, 16, 'HARNESS_MAX_PARALLEL_TASKS'),
    maxRepairIterations: boundedInteger(env.HARNESS_MAX_REPAIR_ITERATIONS, 5, 1, 12, 'HARNESS_MAX_REPAIR_ITERATIONS'),
    browserTimeoutMs: boundedInteger(env.HARNESS_BROWSER_TIMEOUT_MS, 20_000, 1_000, 120_000, 'HARNESS_BROWSER_TIMEOUT_MS')
  };
}
