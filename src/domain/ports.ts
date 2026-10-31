import type { HarnessState } from './models.js';

export interface StateRepository {
  read(): Promise<HarnessState>;
  transact<T>(operation: (state: HarnessState) => T | Promise<T>): Promise<T>;
}

export interface BrowserInspectorPort {
  discoverRoutes(baseUrl: string, timeoutMs: number): Promise<{ baseUrl: string; routes: string[]; discoveredAt: string }>;
  inspectResponsive(input: ResponsiveInspectionInput): Promise<ResponsiveInspectionReport>;
  runInteractionScenario(input: InteractionScenarioInput): Promise<InteractionScenarioReport>;
}

export interface ResponsiveInspectionInput {
  baseUrl: string;
  routes: string[];
  viewports: ViewportProfile[];
  evidenceDirectory: string;
  timeoutMs: number;
  allowedOverflowSelectors: string[];
}

export interface ViewportProfile {
  name: string;
  width: number;
  height: number;
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
}

export interface ResponsiveViewportResult {
  route: string;
  viewport: ViewportProfile;
  finalUrl: string;
  documentWidth: number;
  viewportWidth: number;
  horizontalOverflow: number;
  overflowElements: Array<{ selector: string; scrollWidth: number; clientWidth: number }>;
  outOfBoundsElements: Array<{ selector: string; left: number; right: number; width: number }>;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  httpErrors: Array<{ status: number; url: string }>;
  screenshotPath: string;
  passed: boolean;
  issues: string[];
}

export interface ResponsiveInspectionReport {
  runId: string;
  baseUrl: string;
  startedAt: string;
  finishedAt: string;
  routeCount: number;
  viewportCount: number;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  overallStatus: 'pass' | 'fail';
  results: ResponsiveViewportResult[];
  reportPath: string;
}

export interface InteractionAction {
  action: 'click' | 'fill' | 'check' | 'uncheck' | 'select' | 'press' | 'expect-visible' | 'expect-text';
  selector: string;
  value?: string;
  timeoutMs?: number;
}

export interface InteractionScenarioInput {
  baseUrl: string;
  route: string;
  actions: InteractionAction[];
  evidenceDirectory: string;
  timeoutMs: number;
  allowRiskyActions: boolean;
}

export interface InteractionScenarioReport {
  runId: string;
  route: string;
  passed: boolean;
  startedAt: string;
  finishedAt: string;
  steps: Array<{ action: string; selector: string; status: 'pass' | 'fail' | 'skipped'; error?: string }>;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  httpErrors: Array<{ status: number; url: string }>;
  screenshotPath: string;
  reportPath: string;
}

export interface DevServerPort {
  start(packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun', script: 'dev' | 'start' | 'preview'): Promise<{ id: string; pid: number | null; status: string }>;
  status(id: string): Promise<unknown>;
  stop(id: string): Promise<{ id: string; status: string }>;
  stopAll(): Promise<void>;
}
