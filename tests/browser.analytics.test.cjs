/* eslint-disable no-await-in-loop */
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const state = {
  views: [],
  collectorFailure: false,
  adminAuthenticated: false,
  configAvailable: true,
  consentPolicyVersion: '2026-07-24',
  publicViewCountsEnabled: true,
  publicCountRequests: 0
};

let server;
let origin;
let browser;

function json(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }, headers || {}));
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');

  if (url.pathname === '/api/config') {
    if (!state.configAvailable) {
      json(res, 404, { error: 'Not found' });
      return;
    }
    json(res, 200, {
      ga4MeasurementId: 'G-TEST12345',
      consentPolicyVersion: state.consentPolicyVersion,
      publicViewCountsEnabled: state.publicViewCountsEnabled
    });
    return;
  }
  if (url.pathname === '/api/analytics/public-count') {
    state.publicCountRequests += 1;
    json(res, 200, { count: 2049 + state.views.length });
    return;
  }
  if (url.pathname === '/api/analytics/view' && req.method === 'POST') {
    const payload = await readJson(req);
    state.views.push(payload);
    json(res, state.collectorFailure ? 503 : 202, state.collectorFailure
      ? { error: 'offline' }
      : { accepted: true });
    return;
  }

  if (url.pathname === '/api/admin/session') {
    if (!state.adminAuthenticated) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }
    json(res, 200, {
      authenticated: true,
      adminIdentity: 'backer-admin',
      csrfToken: 'browser-test-csrf',
      rawIpRevealEnabled: false,
      sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      reauthenticatedAt: new Date().toISOString()
    });
    return;
  }
  if (url.pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await readJson(req);
    if (typeof body.password !== 'string' || body.password.length < 14) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }
    state.adminAuthenticated = true;
    json(res, 200, {
      authenticated: true,
      adminIdentity: 'backer-admin',
      csrfToken: 'browser-test-csrf',
      rawIpRevealEnabled: false,
      sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      reauthenticatedAt: new Date().toISOString()
    });
    return;
  }
  if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
    if (req.headers['x-csrf-token'] !== 'browser-test-csrf') {
      json(res, 403, { error: 'Forbidden' });
      return;
    }
    state.adminAuthenticated = false;
    json(res, 200, { ok: true });
    return;
  }
  if (url.pathname === '/api/admin/summary') {
    if (!state.adminAuthenticated) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }
    json(res, 200, {
      range: { from: '2026-07-18', to: '2026-07-24', timeZone: 'UTC' },
      totals: {
        humanViews: 21,
        botViews: 2,
        uniqueVisitors: 13,
        uniqueIps: 10,
        sessions: 16,
        viewsPerSession: 1.31
      },
      series: [
        { date: '2026-07-23', humanViews: 8, botViews: 1 },
        { date: '2026-07-24', humanViews: 13, botViews: 1 }
      ],
      pages: [
        {
          pageKey: 'home',
          path: '/',
          humanViews: 12,
          uniqueVisitors: 9,
          uniqueIps: 8,
          sessions: 10,
          latestViewAt: new Date().toISOString()
        }
      ],
      referrers: [],
      campaigns: [],
      countries: [],
      devices: [{ deviceClass: 'desktop', views: 21 }]
    });
    return;
  }
  if (url.pathname === '/api/admin/recent') {
    if (!state.adminAuthenticated) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }
    json(res, 200, { views: [], hasMore: false });
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin/analytics') pathname = '/admin/analytics/index.html';
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(`${ROOT}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': contentType(file) });
    res.end(data);
  } catch (_error) {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function waitUntil(predicate, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('Timed out waiting for browser-observable state');
}

async function newPage() {
  const context = await browser.newContext();
  await context.route('https://www.googletagmanager.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: '/* browser-test GA loader */'
    });
  });
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  const page = await context.newPage();
  return { context, page };
}

before(async () => {
  server = http.createServer((req, res) => {
    handler(req, res).catch((error) => {
      res.writeHead(500);
      res.end(error.message);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('rejecting consent sends no GA or first-party view', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.backer-consent-panel');
    assert.equal(state.views.length, 0);
    await page.click('.backer-consent-reject');
    await page.waitForTimeout(150);
    assert.equal(state.views.length, 0);
    const gaLoads = await page.locator('script[src*="googletagmanager.com/gtag"]').count();
    assert.equal(gaLoads, 0);
  } finally {
    await context.close();
  }
});

test('server and bundled policy skew fails closed before any collection', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  state.consentPolicyVersion = '2026-08-15';
  state.publicViewCountsEnabled = true;
  const { context, page } = await newPage();
  try {
    await context.addInitScript(({ consentKey, visitorKey, sessionKey }) => {
      localStorage.setItem(consentKey, JSON.stringify({
        decision: 'accepted',
        policyVersion: '2026-07-24',
        timestamp: '2026-07-24T12:00:00.000Z'
      }));
      localStorage.setItem(visitorKey, '11111111-1111-4111-8111-111111111111');
      sessionStorage.setItem(sessionKey, JSON.stringify({
        id: '22222222-2222-4222-8222-222222222222',
        lastAt: Date.now()
      }));
    }, {
      consentKey: 'backer_analytics_consent_v1',
      visitorKey: 'backer_analytics_visitor_v1',
      sessionKey: 'backer_analytics_session_v1'
    });

    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.backer-consent-panel');
    assert.equal(state.views.length, 0);
    assert.equal(await page.locator('script[src*="googletagmanager.com/gtag"]').count(), 0);
    const browserState = await page.evaluate(() => ({
      consent: JSON.parse(localStorage.getItem('backer_analytics_consent_v1')),
      visitor: localStorage.getItem('backer_analytics_visitor_v1'),
      session: sessionStorage.getItem('backer_analytics_session_v1')
    }));
    assert.equal(browserState.consent.policyVersion, '2026-07-24');
    assert.equal(browserState.visitor, null);
    assert.equal(browserState.session, null);
    assert.equal(await page.locator('.backer-consent-accept').isDisabled(), true);
    assert.equal(await page.evaluate(() => window.BackerAnalytics.consentDecision()), 'rejected');
    assert.equal(state.views.length, 0);
  } finally {
    state.consentPolicyVersion = '2026-07-24';
    await context.close();
  }
});

test('a disabled public-count flag mounts no badge and makes no count request', async () => {
  state.views.length = 0;
  state.publicViewCountsEnabled = false;
  state.publicCountRequests = 0;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.backer-consent-panel');
    assert.equal(await page.locator('.backer-brand-lockup').count(), 0);
    assert.equal(await page.locator('.backer-view-count').count(), 0);
    assert.equal(state.publicCountRequests, 0);
  } finally {
    state.publicViewCountsEnabled = true;
    await context.close();
  }
});

test('an explicit static-page flag keeps the formula badge on when runtime config is unavailable', async () => {
  state.views.length = 0;
  state.configAvailable = false;
  state.publicCountRequests = 0;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.backer-view-count');
    await waitUntil(() => state.publicCountRequests === 1);
    const countText = await page.locator('.backer-view-count').textContent();
    assert.match(countText, /^[\d,]+ views$/);
    assert.ok(Number(countText.replace(/\D/g, '')) >= 2049);
    await page.click('.backer-consent-reject');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(
      await page.locator('.backer-consent-panel').count(),
      0,
      'the static preview must remember a rejection instead of prompting on every page'
    );
    assert.equal(state.views.length, 0);
  } finally {
    state.configAvailable = true;
    await context.close();
  }
});

test('accepted SPA views are canonical, single, revocable, and outage-safe', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.click('.backer-consent-accept');
    await waitUntil(() => state.views.length === 1);
    assert.equal(state.views[0].path, '/');

    await page.evaluate(() => window.__backerGo('search', 'private search text'));
    await waitUntil(() => state.views.length === 2);
    assert.equal(state.views[1].path, '/search');
    assert.equal(JSON.stringify(state.views[1]).includes('private search text'), false);

    await page.evaluate(() => window.__backerGo('market'));
    await waitUntil(() => state.views.length === 3);
    assert.equal(state.views[2].path, '/market');
    await page.click('[data-cat]');
    await page.waitForTimeout(150);
    assert.equal(state.views.length, 3, 'market filters must not create page views');

    const creatorId = await page.evaluate(() => window.BACKER.creators[0].id);
    await page.evaluate((id) => window.__backerGo('creator', id), creatorId);
    await waitUntil(() => state.views.length === 4);
    assert.equal(state.views[3].path, `/creator/${creatorId}`);

    const beforeEventCount = await page.evaluate(() => window.dataLayer
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === 'event' && entry[1] === 'poa_methodology_viewed').length);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('backer:track', {
        detail: { event: 'poa_methodology_viewed', props: {} }
      }));
    });
    const afterEventCount = await page.evaluate(() => window.dataLayer
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === 'event' && entry[1] === 'poa_methodology_viewed').length);
    assert.equal(afterEventCount - beforeEventCount, 1);
    assert.equal(await page.evaluate(() => typeof window.__backerTrack), 'undefined');

    state.collectorFailure = true;
    await page.evaluate(() => window.__backerGo('search', 'outage test'));
    await waitUntil(() => state.views.length === 5);
    assert.equal(await page.locator('#app').getAttribute('aria-hidden'), 'false');

    await page.click('.backer-privacy-settings:not(.is-footer)');
    await page.click('.backer-consent-reject');
    const atRevocation = state.views.length;
    await page.evaluate(() => window.__backerGo('home'));
    await page.waitForTimeout(150);
    assert.equal(state.views.length, atRevocation);
  } finally {
    await context.close();
  }
});

test('cross-tab rejection and removal stop subsequent tracking and clear identity', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.click('.backer-consent-accept');
    await waitUntil(() => state.views.length === 1);

    await page.evaluate(() => {
      const key = 'backer_analytics_consent_v1';
      const value = JSON.stringify({
        decision: 'rejected',
        policyVersion: '2026-07-24',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(key, value);
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
    });
    await page.waitForFunction(() => window.BackerAnalytics.consentDecision() === 'rejected');
    const afterRejection = state.views.length;
    await page.evaluate(() => window.__backerGo('search', 'cross-tab rejection'));
    await page.waitForTimeout(150);
    assert.equal(state.views.length, afterRejection);
    assert.equal(await page.evaluate(() => localStorage.getItem('backer_analytics_visitor_v1')), null);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('backer_analytics_session_v1')), null);

    await page.click('.backer-privacy-settings:not(.is-footer)');
    await page.click('.backer-consent-accept');
    await waitUntil(() => state.views.length === afterRejection + 1);

    await page.evaluate(() => {
      const key = 'backer_analytics_consent_v1';
      localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
    });
    await page.waitForSelector('.backer-consent-panel');
    const afterRemoval = state.views.length;
    await page.evaluate(() => window.__backerGo('market'));
    await page.waitForTimeout(150);
    assert.equal(state.views.length, afterRemoval);
  } finally {
    await context.close();
  }
});

test('private portfolio-position metadata is reduced to a generic market route and title', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backermarket.html?position=private-holding-42`, {
      waitUntil: 'domcontentloaded'
    });
    await page.evaluate(() => {
      document.title = 'Private holding · YES · 25 units';
    });
    await page.click('.backer-consent-accept');
    await waitUntil(() => state.views.length === 1);
    assert.equal(state.views[0].pageKey, 'market_position');
    assert.equal(state.views[0].path, '/market/position');
    assert.equal(state.views[0].pageTitle, 'Backer Market');
    assert.equal(JSON.stringify(state.views[0]).includes('private-holding-42'), false);
    assert.equal(JSON.stringify(state.views[0]).includes('25 units'), false);

    const gaPageView = await page.evaluate(() => window.dataLayer
      .map((entry) => Array.from(entry))
      .find((entry) => entry[0] === 'event' && entry[1] === 'page_view'));
    assert.equal(gaPageView[2].page_path, '/market/position');
    assert.equal(gaPageView[2].page_title, 'Backer Market');
  } finally {
    await context.close();
  }
});

test('redirect aliases do not double-count accepted traffic', async () => {
  state.views.length = 0;
  state.collectorFailure = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.click('.backer-consent-accept');
    await waitUntil(() => state.views.length === 1);
    state.views.length = 0;
    await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    await waitUntil(() => state.views.length === 1);
    await page.waitForTimeout(150);
    assert.equal(state.views.length, 1);
    assert.equal(state.views[0].path, '/');
  } finally {
    await context.close();
  }
});

test('dashboard authentication and CSRF-protected logout work', async () => {
  state.adminAuthenticated = false;
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/admin/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#authView:not([hidden])');
    await page.fill('#adminPassword', 'a-strong-browser-test-password');
    await page.click('#loginButton');
    await page.waitForSelector('#dashboard:not([hidden])');
    assert.equal(await page.locator('#metricHumanViews').textContent(), '21');
    await page.click('#logoutButton');
    await page.waitForSelector('#authView:not([hidden])');
    assert.equal(state.adminAuthenticated, false);
  } finally {
    await context.close();
  }
});
