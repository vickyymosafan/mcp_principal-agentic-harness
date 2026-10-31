import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRuntimeConfig } from '../src/infrastructure/config/runtime-config.js';

test('runtime config applies safe defaults', () => {
  const config = createRuntimeConfig({}, '/tmp/project');
  assert.equal(config.workspaceRoot, path.resolve('/tmp/project'));
  assert.equal(config.stateDirectory, '.harness');
  assert.equal(config.maxParallelTasks, 4);
  assert.equal(config.maxRepairIterations, 5);
  assert.equal(config.browserTimeoutMs, 20_000);
});

test('runtime config validates concurrency and repair budgets', () => {
  const config = createRuntimeConfig({ HARNESS_MAX_PARALLEL_TASKS: '8', HARNESS_MAX_REPAIR_ITERATIONS: '7', HARNESS_BROWSER_TIMEOUT_MS: '45000' }, '/tmp/project');
  assert.equal(config.maxParallelTasks, 8);
  assert.equal(config.maxRepairIterations, 7);
  assert.equal(config.browserTimeoutMs, 45_000);
  assert.throws(() => createRuntimeConfig({ HARNESS_MAX_PARALLEL_TASKS: '99' }, '/tmp/project'));
  assert.throws(() => createRuntimeConfig({ HARNESS_STATE_DIR: '/tmp/outside' }, '/tmp/project'));
});
