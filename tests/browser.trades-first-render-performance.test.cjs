'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 608, height: 900 },
  { width: 390, height: 844 }
];

let browser;
let server;
let origin;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (/\.(?:png|jpe?g|webp|gif|ico)$/.test(file)) return 'image/*';
  return 'application/octet-stream';
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname === '/' ? '/backerdemo.html' : url.pathname);
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(`${ROOT}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (_error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

async function isolatedContext(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => route.abort());
  await context.addInitScript(() => {
    window.__backerLongTasks = [];
    new PerformanceObserver((list) => {
      window.__backerLongTasks.push(...list.getEntries().map((entry) => entry.duration));
    }).observe({ type: 'longtask', buffered: true });
  });
  return context;
}

before(async () => {
  server = http.createServer((req, res) => handler(req, res).catch((error) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(error.stack);
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: CHROME });
});

after(() => {
  if (browser) void browser.close().catch(() => {});
  if (server && server.listening) {
    server.close();
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  }
});

for (const viewport of VIEWPORTS) {
  test(`cold Trades paints exact retained cards within 3 seconds at ${viewport.width}px`, async () => {
    const context = await isolatedContext(viewport);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    try {
      await page.goto(`${origin}/backerdemo.html#trades`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__backerTradesPerformance
        && Number.isFinite(window.__backerTradesPerformance.firstCardPaintedAt), null, { timeout: 5000 });
      const result = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const source = (suffix) => resources.filter((entry) => new URL(entry.name).pathname.endsWith(suffix));
        const market = source('/js/market.js')[0];
        const catalog = source('/data/discovery-catalog.json');
        const eligibility = source('/data/trades-eligible-accounts.json');
        const measures = Object.fromEntries(performance.getEntriesByType('measure')
          .filter((entry) => entry.name.startsWith('backer-trades:'))
          .map((entry) => [entry.name, entry.duration]));
        return {
          timing: window.__backerTradesPerformance,
          maxLongTask: Math.max(0, ...window.__backerLongTasks),
          cards: document.querySelectorAll('.mkt-catalog-card').length,
          heading: document.querySelector('.mkt-header h1')?.textContent.trim(),
          body: document.body.innerText,
          requestCounts: { catalog: catalog.length, eligibility: eligibility.length },
          marketStartedAt: market && market.startTime,
          catalogStartedAt: catalog[0] && catalog[0].startTime,
          measures
        };
      });
      assert.deepEqual(pageErrors, []);
      assert.ok(result.timing.firstCardPaintedAt < 3000,
        `first card painted at ${Math.round(result.timing.firstCardPaintedAt)}ms`);
      assert.ok(result.measures['backer-trades:model-build'] < 3000);
      assert.ok(result.measures['backer-trades:first-card-render'] < 3000);
      assert.ok(result.maxLongTask < 1500, `longest main-thread task was ${Math.round(result.maxLongTask)}ms`);
      assert.equal(result.cards, 12, 'first render stays DOM-bounded while full inventory remains searchable');
      assert.equal(result.heading, 'Trade future growth in creator accounts and work');
      assert.match(result.body, /[\d,]+\s+creator-account markets/);
      assert.match(result.body, /[\d,]+\s+work markets/);
      assert.deepEqual(result.requestCounts, { catalog: 1, eligibility: 1 });
      assert.ok(result.marketStartedAt < result.catalogStartedAt,
        'hidden Home preview must not load/normalize the catalog before the Trades module');
    } finally {
      await context.close();
    }
  });
}

test('Home still lazily renders its retained creator preview', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#backerLandingCreatorFeed [data-m2-landing-person]').length === 3,
      null, { timeout: 15000 });
    const result = await page.evaluate(() => ({
      cards: Array.from(document.querySelectorAll('#backerLandingCreatorFeed [data-m2-landing-person]')).map((row) => row.dataset.m2LandingPerson),
      catalogRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/discovery-catalog.json')).length,
      eligibilityRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/trades-eligible-accounts.json')).length
    }));
    assert.equal(new Set(result.cards).size, 3);
    assert.deepEqual(result, { cards: result.cards, catalogRequests: 1, eligibilityRequests: 1 });
  } finally {
    await context.close();
  }
});
