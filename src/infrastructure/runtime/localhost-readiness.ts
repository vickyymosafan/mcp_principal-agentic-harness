import { assertLocalhostUrl } from '../security/workspace-guard.js';

export async function waitForLocalUrl(value: string, timeoutMs = 30000) {
  const url = assertLocalhostUrl(value);
  const startedAt = Date.now();
  let lastError = 'not attempted';
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(Math.min(1500, timeoutMs)) });
      if (response.ok || (response.status >= 300 && response.status < 500)) {
        return { ready: true, url: url.href, status: response.status, elapsedMs: Date.now() - startedAt, checkedAt: new Date().toISOString() };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) { lastError = error instanceof Error ? error.message : String(error); }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  return { ready: false, url: url.href, elapsedMs: Date.now() - startedAt, lastError, checkedAt: new Date().toISOString() };
}
