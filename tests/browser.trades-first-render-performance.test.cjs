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
      readyAt: performance.now(),
      maxLongTask: Math.max(0, ...window.__backerLongTasks),
      cards: Array.from(document.querySelectorAll('#backerLandingCreatorFeed [data-m2-landing-person]')).map((row) => row.dataset.m2LandingPerson),
      previewRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/landing-preview.json')).length,
      catalogRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/discovery-catalog.json')).length,
      eligibilityRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/trades-eligible-accounts.json')).length
    }));
    assert.equal(new Set(result.cards).size, 3);
    assert.ok(result.readyAt < 2000, `Home preview was ready at ${Math.round(result.readyAt)}ms`);
    assert.ok(result.maxLongTask < 500, `Home blocked for ${Math.round(result.maxLongTask)}ms`);
    assert.deepEqual({ previewRequests: result.previewRequests, catalogRequests: result.catalogRequests, eligibilityRequests: result.eligibilityRequests },
      { previewRequests: 1, catalogRequests: 0, eligibilityRequests: 0 });
  } finally {
    await context.close();
  }
});

test('cold Discovery paints the bounded profile and content view without a catalog freeze', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#market2`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.m2-profile-card').length === 9
      && document.querySelectorAll('.m2-feed-card').length === 12, null, { timeout: 5000 });
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => ({
      readyAt: performance.now(),
      maxLongTask: Math.max(0, ...window.__backerLongTasks),
      profiles: document.querySelectorAll('.m2-profile-card').length,
      contents: document.querySelectorAll('.m2-feed-card').length,
      catalogRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/discovery-catalog.json')).length,
      eligibilityRequests: performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.endsWith('/data/trades-eligible-accounts.json')).length
    }));
    assert.ok(result.readyAt < 3000, `Discovery was ready at ${Math.round(result.readyAt)}ms`);
    assert.ok(result.maxLongTask < 750, `Discovery blocked for ${Math.round(result.maxLongTask)}ms`);
    assert.deepEqual({ profiles: result.profiles, contents: result.contents }, { profiles: 9, contents: 12 });
    assert.deepEqual({ catalogRequests: result.catalogRequests, eligibilityRequests: result.eligibilityRequests },
      { catalogRequests: 1, eligibilityRequests: 1 });
  } finally {
    await context.close();
  }
});

test('Search paints catalog results before trade enrichment and keeps the same result DOM', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#search?q=github%20developers`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.sxr-card', { timeout: 5000 });
    const initial = await page.evaluate(() => ({
      readyAt: performance.now(),
      firstCard: document.querySelector('.sxr-card')?.getAttribute('data-search-subject'),
      cards: document.querySelectorAll('.sxr-card').length,
      maxLongTask: Math.max(0, ...window.__backerLongTasks)
    }));
    await page.waitForSelector('[data-search-action="trade"]', { timeout: 5000 });
    const enriched = await page.evaluate(() => ({
      firstCard: document.querySelector('.sxr-card')?.getAttribute('data-search-subject'),
      cards: document.querySelectorAll('.sxr-card').length,
      tradeLinks: document.querySelectorAll('[data-search-action="trade"]').length
    }));
    assert.ok(initial.readyAt < 3000, `Search was ready at ${Math.round(initial.readyAt)}ms`);
    assert.ok(initial.maxLongTask < 750, `Search blocked for ${Math.round(initial.maxLongTask)}ms`);
    assert.equal(enriched.firstCard, initial.firstCard);
    assert.equal(enriched.cards, initial.cards);
    assert.ok(enriched.tradeLinks > 0);
  } finally {
    await context.close();
  }
});

test('a slow or canceled Trades asset load never disables the outgoing Discovery interface', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  let assetStarted;
  let releaseAsset;
  const started = new Promise((resolve) => { assetStarted = resolve; });
  const release = new Promise((resolve) => { releaseAsset = resolve; });
  await context.route(/\/js\/market\.js(?:\?|$)/, async (route) => {
    assetStarted();
    await release;
    await route.continue();
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#market2`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m2-profile-card', { timeout: 5000 });
    await page.evaluate(() => { window.__backerGo('trades'); });
    await started;

    assert.equal(await page.locator('.market2-shell').count(), 1, 'Discovery must stay mounted while incoming assets load');
    await page.click('[data-m2-filters]');
    await page.waitForSelector('.m2-filter-drawer', { state: 'visible', timeout: 1000 });

    await page.evaluate(() => { window.__backerGo('search'); });
    await page.waitForSelector('.search-view.sx', { state: 'visible', timeout: 3000 });
    releaseAsset();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.search-view.sx').count(), 1, 'the canceled Trades route must not replace the newer route');
    assert.equal(await page.locator('.mkt').count(), 0);
  } finally {
    releaseAsset();
    await context.close();
  }
});

test('slow or canceled Home and creator preflights keep the committed Discovery screen interactive', async () => {
  for (const view of ['home', 'creator']) {
    const context = await isolatedContext({ width: 1440, height: 900 });
    let assetStarted;
    let releaseAsset;
    const started = new Promise((resolve) => { assetStarted = resolve; });
    const release = new Promise((resolve) => { releaseAsset = resolve; });
    await context.route(/\/js\/data\.js(?:\?|$)/, async (route) => {
      assetStarted();
      await release;
      await route.continue();
    });
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html#market2`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.m2-profile-card', { timeout: 5000 });
      await page.evaluate(({ next }) => { window.__backerGo(next, 'creator_preflight_probe'); }, { next: view });
      await started;

      assert.equal(await page.locator('.market2-shell').count(), 1, `${view} preflight must leave Discovery mounted`);
      await page.click('[data-m2-filters]');
      await page.waitForSelector('.m2-filter-drawer', { state: 'visible', timeout: 1000 });

      await page.evaluate(() => { window.__backerGo('search'); });
      await page.waitForSelector('.search-view.sx', { state: 'visible', timeout: 3000 });
      releaseAsset();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.search-view.sx').count(), 1, `canceled ${view} preflight must not replace Search`);
    } finally {
      releaseAsset();
      await context.close();
    }
  }
});

test('an aborted Trades module can be retried in the same document without a poisoned asset cache', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  let requests = 0;
  await context.route(/\/js\/market\.js(?:\?|$)/, async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.abort('aborted');
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#search`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.search-view.sx', { state: 'visible' });
    await page.evaluate(() => { window.__backerGo('trades'); });
    await page.waitForSelector('.mkt-fatal', { state: 'visible', timeout: 5000 });
    assert.equal(requests, 1);

    await page.evaluate(() => { window.__backerGo('search'); });
    await page.waitForSelector('.search-view.sx', { state: 'visible' });
    await page.evaluate(() => { window.__backerGo('trades'); });
    await page.waitForSelector('.mkt-catalog-card', { state: 'visible', timeout: 5000 });
    assert.equal(requests, 2, 'retry must issue a fresh request for the previously aborted Trades module');
    assert.equal(await page.locator('.mkt-fatal').count(), 0);
  } finally {
    await context.close();
  }
});

test('an aborted connected Discovery request cannot repaint over Trades', async () => {
  const context = await isolatedContext({ width: 1440, height: 900 });
  let started;
  const apiStarted = new Promise((resolve) => { started = resolve; });
  await context.route('**/api/discovery/search', async (route) => {
    started();
    await new Promise((resolve) => setTimeout(resolve, 900));
    try { await route.fulfill({ status: 503, body: 'offline' }); } catch (_error) {}
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#market2`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.m2-profile-card', { timeout: 5000 });
    await apiStarted;
    await page.evaluate(() => window.__backerGo('trades'));
    await page.waitForSelector('.mkt-catalog-card', { timeout: 5000 });
    await page.waitForTimeout(1100);
    const result = await page.evaluate(() => ({
      trades: document.querySelectorAll('.mkt-catalog-card').length,
      discovery: document.querySelectorAll('.market2-shell').length,
      heading: document.querySelector('.mkt-header h1')?.textContent.trim()
    }));
    assert.ok(result.trades > 0);
    assert.equal(result.discovery, 0);
    assert.equal(result.heading, 'Trade future growth in creator accounts and work');
  } finally {
    await context.close();
  }
});
