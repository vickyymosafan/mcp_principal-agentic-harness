import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrowserInspectorPort, InteractionScenarioInput, InteractionScenarioReport, ResponsiveInspectionInput, ResponsiveInspectionReport, ResponsiveViewportResult } from '../../domain/ports.js';
import { assertLocalhostUrl } from '../security/workspace-guard.js';

const DEFAULT_VIEWPORTS = [
  { name: 'small-mobile-320', width: 320, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-360', width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-375', width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-414', width: 414, height: 896, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'large-mobile-430', width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet-768-portrait', width: 768, height: 1024, isMobile: false, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-844-landscape', width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet-1024-landscape', width: 1024, height: 768, isMobile: false, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'laptop-1280', width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: 'laptop-1366', width: 1366, height: 768, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: 'desktop-1440', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: 'wide-desktop-1920', width: 1920, height: 1080, isMobile: false, hasTouch: false, deviceScaleFactor: 1 }
];

function safeRoute(route: string): string {
  if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\')) throw new Error(`Route must be a local absolute path beginning with /: ${route}`);
  return route;
}

function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'page'; }

export class PlaywrightInspector implements BrowserInspectorPort {
  async discoverRoutes(baseUrl: string, timeoutMs: number) {
    const base = assertLocalhostUrl(baseUrl);
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      await context.route('**/*', async routeRequest => {
        if (!routeRequest.request().isNavigationRequest()) { await routeRequest.continue(); return; }
        try {
          const target = new URL(routeRequest.request().url());
          if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(target.hostname) || target.origin !== base.origin) { await routeRequest.abort('blockedbyclient'); return; }
          await routeRequest.continue();
        } catch { await routeRequest.abort('blockedbyclient'); }
      });
      const page = await context.newPage();
      await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      const hrefs = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => (anchor as HTMLAnchorElement).href));
      const routes = new Set<string>(['/']);
      for (const href of hrefs) {
        try {
          const target = new URL(href);
          if (target.origin !== base.origin) continue;
          routes.add(`${target.pathname}${target.search}`);
        } catch { /* Ignore malformed links. */ }
      }
      return { baseUrl: base.href, routes: [...routes].sort(), discoveredAt: new Date().toISOString() };
    } finally { await browser.close(); }
  }

  async inspectResponsive(input: ResponsiveInspectionInput): Promise<ResponsiveInspectionReport> {
    const base = assertLocalhostUrl(input.baseUrl);
    const runId = randomUUID();
    const startedAt = new Date().toISOString();
    const routes = input.routes.length ? input.routes : ['/'];
    const profiles = input.viewports.length ? input.viewports : DEFAULT_VIEWPORTS;
    const evidenceDirectory = path.resolve(input.evidenceDirectory);
    await mkdir(evidenceDirectory, { recursive: true });
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const results: ResponsiveViewportResult[] = [];

    try {
      for (const routeValue of routes) {
        const route = safeRoute(routeValue);
        const targetUrl = new URL(route, base);
        if (targetUrl.origin !== base.origin) throw new Error('Route escaped the configured localhost origin.');
        for (const viewport of profiles) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            screen: { width: viewport.width, height: viewport.height },
            isMobile: viewport.isMobile,
            hasTouch: viewport.hasTouch,
            deviceScaleFactor: viewport.deviceScaleFactor
          });
          const page = await context.newPage();
          const consoleErrors: string[] = [];
          const pageErrors: string[] = [];
          const failedRequests: string[] = [];
          const httpErrors: Array<{ status: number; url: string }> = [];
          page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
          page.on('pageerror', error => pageErrors.push(error.message));
          page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`));
          page.on('response', response => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
          await context.route('**/*', async routeRequest => {
            if (!routeRequest.request().isNavigationRequest()) { await routeRequest.continue(); return; }
            try {
              const navigationUrl = new URL(routeRequest.request().url());
              const isLoopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(navigationUrl.hostname);
              if (!isLoopback || navigationUrl.origin !== base.origin) { await routeRequest.abort('blockedbyclient'); return; }
              await routeRequest.continue();
            } catch { await routeRequest.abort('blockedbyclient'); }
          });
          const caseDirectory = path.join(evidenceDirectory, runId, slug(route), viewport.name);
          await mkdir(caseDirectory, { recursive: true });
          const screenshotPath = path.join(caseDirectory, 'full-page.png');
          let metrics = { documentWidth: viewport.width, viewportWidth: viewport.width, horizontalOverflow: 0, overflowElements: [] as Array<{ selector: string; scrollWidth: number; clientWidth: number }>, outOfBoundsElements: [] as Array<{ selector: string; left: number; right: number; width: number }> };
          const issues: string[] = [];
          try {
            const response = await page.goto(targetUrl.href, { waitUntil: 'domcontentloaded', timeout: input.timeoutMs });
            await page.waitForLoadState('networkidle', { timeout: Math.min(input.timeoutMs, 3000) }).catch(() => undefined);
            await page.evaluate(async () => { if ('fonts' in document) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]); });
            const finalUrl = new URL(page.url());
            if (finalUrl.origin !== base.origin) throw new Error(`Navigation escaped localhost origin: ${finalUrl.origin}`);
            if (response && response.status() >= 400) issues.push(`Route returned HTTP ${response.status()}.`);
            metrics = await page.evaluate((allowedSelectors: string[]) => {
              const doc = document.documentElement;
              const viewportWidth = window.innerWidth;
              const documentWidth = Math.max(doc.scrollWidth, document.body?.scrollWidth ?? 0);
              const isAllowed = (element: Element) => allowedSelectors.some(selector => { try { return element.matches(selector) || Boolean(element.closest(selector)); } catch { return false; } });
              const overflowElements: Array<{ selector: string; scrollWidth: number; clientWidth: number }> = [];
              const outOfBoundsElements: Array<{ selector: string; left: number; right: number; width: number }> = [];
              for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
                if (isAllowed(element)) continue;
                const style = getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || element.closest('[aria-hidden="true"], [inert]')) continue;
                const rect = element.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) continue;
                if (element.scrollWidth > element.clientWidth + 3 && ['auto', 'scroll'].includes(style.overflowX)) {
                  overflowElements.push({ selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.classList.length ? `.${Array.from(element.classList).slice(0, 2).join('.')}` : ''), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth });
                }
                if (rect.left < -2 || rect.right > viewportWidth + 2) {
                  outOfBoundsElements.push({ selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.classList.length ? `.${Array.from(element.classList).slice(0, 2).join('.')}` : ''), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
                }
              }
              return { documentWidth, viewportWidth, horizontalOverflow: Math.max(0, documentWidth - viewportWidth), overflowElements: overflowElements.slice(0, 30), outOfBoundsElements: outOfBoundsElements.slice(0, 30) };
            }, input.allowedOverflowSelectors);
            if (metrics.horizontalOverflow > 1) issues.push(`Document has ${metrics.horizontalOverflow}px horizontal overflow.`);
            if (metrics.outOfBoundsElements.length > 0) issues.push(`${metrics.outOfBoundsElements.length} visible element(s) extend beyond the viewport bounds.`);
            if (consoleErrors.length) issues.push(`${consoleErrors.length} browser console error(s).`);
            if (pageErrors.length) issues.push(`${pageErrors.length} uncaught page error(s).`);
            if (httpErrors.some(item => new URL(item.url).origin === base.origin)) issues.push('One or more same-origin requests returned HTTP 4xx/5xx.');
            const localFailedRequests = failedRequests.filter(value => { try { return new URL(value.match(/https?:\/\/\S+/)?.[0] ?? '').origin === base.origin; } catch { return false; } });
            if (localFailedRequests.length) issues.push(`${localFailedRequests.length} same-origin request(s) failed.`);

            const webglAudit = await page.evaluate(() => {
              const canvases = Array.from(document.querySelectorAll('canvas'));
              let contextLost = false;
              for (const c of canvases) {
                try {
                  const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
                  if (gl && gl.isContextLost && gl.isContextLost()) contextLost = true;
                } catch { /* Ignore canvas evaluation error */ }
              }
              return { contextLost };
            }).catch(() => ({ contextLost: false }));
            if (webglAudit.contextLost) issues.push('WebGL context lost detected on one or more canvas elements.');
            await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
          } catch (error) {
            issues.push(error instanceof Error ? error.message : String(error));
            await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
          }
          const finalUrl = page.url();
          const passed = issues.length === 0;
          results.push({ route, viewport, finalUrl, ...metrics, consoleErrors, pageErrors, failedRequests, httpErrors, screenshotPath, passed, issues });
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    const finishedAt = new Date().toISOString();
    const passedCases = results.filter(item => item.passed).length;
    const report: ResponsiveInspectionReport = {
      runId, baseUrl: base.href, startedAt, finishedAt, routeCount: routes.length, viewportCount: profiles.length,
      totalCases: results.length, passedCases, failedCases: results.length - passedCases,
      overallStatus: passedCases === results.length ? 'pass' : 'fail', results,
      reportPath: path.join(evidenceDirectory, runId, 'responsive-report.json')
    };
    await mkdir(path.dirname(report.reportPath), { recursive: true });
    await writeFile(report.reportPath, JSON.stringify(report, null, 2), 'utf8');
    return report;
  }

  async runInteractionScenario(input: InteractionScenarioInput): Promise<InteractionScenarioReport> {
    const base = assertLocalhostUrl(input.baseUrl);
    const route = safeRoute(input.route);
    const target = new URL(route, base);
    if (target.origin !== base.origin) throw new Error('Interaction route escaped the configured localhost origin.');
    const runId = randomUUID();
    const startedAt = new Date().toISOString();
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const steps: InteractionScenarioReport['steps'] = [];
    const directory = path.join(path.resolve(input.evidenceDirectory), runId);
    await mkdir(directory, { recursive: true });
    const screenshotPath = path.join(directory, 'interaction.png');
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    const httpErrors: Array<{ status: number; url: string }> = [];
    try {
      const context = await browser.newContext();
      await context.route('**/*', async routeRequest => {
        if (!routeRequest.request().isNavigationRequest()) { await routeRequest.continue(); return; }
        try {
          const navigationUrl = new URL(routeRequest.request().url());
          if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(navigationUrl.hostname) || navigationUrl.origin !== base.origin) { await routeRequest.abort('blockedbyclient'); return; }
          await routeRequest.continue();
        } catch { await routeRequest.abort('blockedbyclient'); }
      });
      const page = await context.newPage();
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`));
      page.on('response', response => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
      await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: input.timeoutMs });
      for (const action of input.actions) {
        try {
          const locator = page.locator(action.selector).first();
          const timeout = action.timeoutMs ?? input.timeoutMs;
          if (!input.allowRiskyActions) {
            const targetDescription = await locator.evaluate(element => [element.textContent, element.getAttribute('aria-label'), element.getAttribute('name'), element.getAttribute('type'), element.getAttribute('data-testid')].filter(Boolean).join(' ')).catch(() => '');
            if (/delete|remove|purchase|checkout|pay|submit|logout|sign.?out/i.test(`${action.selector} ${targetDescription}`)) throw new Error('Potentially destructive target blocked. Set allowRiskyActions=true only for an isolated test environment.');
          }
          switch (action.action) {
            case 'click': await locator.click({ timeout }); break;
            case 'fill': await locator.fill(action.value ?? '', { timeout }); break;
            case 'check': await locator.check({ timeout }); break;
            case 'uncheck': await locator.uncheck({ timeout }); break;
            case 'select': await locator.selectOption(action.value ?? '', { timeout }); break;
            case 'press': await locator.press(action.value ?? 'Enter', { timeout }); break;
            case 'expect-visible': await locator.waitFor({ state: 'visible', timeout }); break;
            case 'expect-text': {
              const text = await locator.textContent({ timeout });
              if (!text?.includes(action.value ?? '')) throw new Error(`Expected text not found: ${action.value ?? ''}`);
              break;
            }
          }
          steps.push({ action: action.action, selector: action.selector, status: 'pass' });
        } catch (error) {
          steps.push({ action: action.action, selector: action.selector, status: 'fail', error: error instanceof Error ? error.message : String(error) });
        }
      }
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } finally { await browser.close(); }
    const finishedAt = new Date().toISOString();
    const localHttpErrors = httpErrors.filter(item => new URL(item.url).origin === base.origin);
    const localFailedRequests = failedRequests.filter(value => { try { return new URL(value.match(/https?:\/\/\S+/)?.[0] ?? '').origin === base.origin; } catch { return false; } });
    const passed = steps.every(step => step.status === 'pass') && consoleErrors.length === 0 && pageErrors.length === 0 && localHttpErrors.length === 0 && localFailedRequests.length === 0;
    const report: InteractionScenarioReport = { runId, route, passed, startedAt, finishedAt, steps, consoleErrors, pageErrors, failedRequests, httpErrors, screenshotPath, reportPath: path.join(directory, 'interaction-report.json') };
    await writeFile(report.reportPath, JSON.stringify(report, null, 2), 'utf8');
    return report;
  }
}

export { DEFAULT_VIEWPORTS };
