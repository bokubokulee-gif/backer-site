'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LEGACY_SENTINEL = '[{"id":"legacy-fixture-must-stay-separate"}]';

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
  const pathname = decodeURIComponent(url.pathname === '/' ? '/portfolio.html' : url.pathname);
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

test('Portfolio renders a canonical real-subject paper receipt without merging legacy fixtures', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript((legacy) => localStorage.setItem('backer_portfolio_v1', legacy), LEGACY_SENTINEL);
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => route.request().resourceType() === 'image'
    ? route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') })
    : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/portfolio.html`);
    await page.waitForFunction(() => window.BackerTradeCatalog && typeof window.BackerTradeCatalog.load === 'function');
    const seeded = await page.evaluate(async () => {
      const catalog = await window.BackerTradeCatalog.load();
      const subject = catalog.contents.find((row) => row.contract && row.simulation && row.person);
      if (!subject) throw new Error('No contract-ready real content');
      const person = subject.person;
      const contract = subject.contract;
      const sim = subject.simulation;
      const amount = 25;
      const quantity = Math.round(amount / (sim.supportPriceCents / 100) * 100) / 100;
      const estimatedPayout = Math.round(quantity * 100) / 100;
      const profitIfCorrect = Math.round((estimatedPayout - amount) * 100) / 100;
      const now = new Date().toISOString();
      const position = {
        schemaVersion: 'backer-trades-position-v1',
        id: 'trade_browser_real',
        receiptId: 'SIM-BROWSER-REAL',
        subjectId: subject.id,
        subjectKind: 'content',
        personId: subject.personId,
        contentId: subject.id,
        subjectSnapshot: {
          name: person.name,
          title: subject.title,
          avatar: person.avatar,
          thumbnail: subject.thumbnail,
          provider: subject.provider,
          sourceUrl: subject.sourceUrl
        },
        contractId: contract.id,
        contractObservationId: contract.metric.observationId,
        contractSnapshot: {
          id: contract.id,
          question: contract.question,
          claim: contract.claim,
          modelVersion: contract.modelVersion,
          baselineValue: contract.baseline.value,
          baselineLabel: contract.baseline.label,
          baselineObservedAt: contract.baseline.observedAt,
          targetValue: contract.target.value,
          targetLabel: contract.target.label,
          cutoff: contract.cutoff,
          horizonDays: contract.horizonDays,
          metricKey: contract.metric.key,
          metricLabel: contract.metric.label,
          metricUnit: contract.metric.unit,
          metricProvider: contract.metric.provider,
          metricSourceUrl: contract.metric.sourceUrl,
          observationId: contract.metric.observationId,
          resolutionRule: contract.resolutionRule
        },
        observationIds: [contract.metric.observationId],
        modelId: sim.modelVersion,
        modelBucket: sim.bucket,
        modelFingerprint: [contract.id, sim.modelVersion, sim.bucket, sim.supportPriceCents].join(':'),
        side: 'BACK',
        supportPriceCents: sim.supportPriceCents,
        priceCents: sim.supportPriceCents,
        quote: { side: 'BACK', priceCents: sim.supportPriceCents, supportPriceCents: sim.supportPriceCents, bucket: sim.bucket },
        quantity,
        cost: amount,
        maxLoss: amount,
        estimatedPayout,
        profitIfCorrect,
        status: 'OPEN_SIMULATION',
        isSimulation: true,
        createdAt: now,
        proposalHref: subject.proposalHref
      };
      localStorage.setItem('backer_trades_positions_v1', JSON.stringify([position]));
      localStorage.setItem('backer_trades_account_v1', JSON.stringify({ schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 9975, updatedAt: now }));
      return {
        name: person.name,
        title: subject.title,
        question: contract.question,
        personId: subject.personId,
        contentId: subject.id,
        sourceUrl: subject.sourceUrl,
        contractId: contract.id,
        estimatedPayout,
        profitIfCorrect
      };
    });
    await page.reload();
    await page.waitForSelector('[data-position-id="trade_browser_real"]', { state: 'visible' });

    assert.equal(await page.locator('#investorMode').evaluate((node) => node.classList.contains('hidden')), true);
    assert.equal(await page.locator('.tp-position').count(), 1);
    assert.match(await page.locator('.tp-position').innerText(), new RegExp(seeded.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(await page.locator('.tp-position').innerText(), new RegExp(seeded.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(await page.locator('.tp-position-contract h4').innerText(), seeded.question);
    const economics = await page.locator('.tp-receipt-economics').innerText();
    assert.match(economics, new RegExp(`Estimated payout if correct\\s+\\$${seeded.estimatedPayout.toFixed(2).replace('.', '\\.')}[\\s\\S]*Profit if correct\\s+\\$${seeded.profitIfCorrect.toFixed(2).replace('.', '\\.')}`));
    assert.match(await page.locator('.tp-position-links').innerText(), new RegExp(`Receipt SIM-BROWSER-REAL · Contract ${seeded.contractId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.equal(await page.locator('.tp-position-links a').nth(1).getAttribute('href'), seeded.sourceUrl);
    const discovery = new URL(await page.locator('.tp-position-links a').first().getAttribute('href'), origin);
    assert.equal(discovery.hash.includes(`person=${encodeURIComponent(seeded.personId)}`), true);
    assert.equal(discovery.hash.includes(`work=${encodeURIComponent(seeded.contentId)}`), true,
      'Portfolio must preserve its exact work= Discovery route');
    assert.match(await page.locator('.tp-summary').innerText(), /Paper equity\s+\$10,000\.00/);
    assert.match(await page.locator('.tp-summary').innerText(), /Available paper cash\s+\$9,975\.00/);
    assert.equal(await page.evaluate(() => localStorage.getItem('backer_portfolio_v1')), LEGACY_SENTINEL);

    await page.setViewportSize({ width: 390, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    assert.equal(await page.locator('.site-nav .brand-word').isVisible(), true);
    assert.equal(await page.locator('.backer-float-dock').count(), 1);

    await page.locator('.tp-position-links a').first().click();
    const focused = page.locator(`.m2-feed-card.is-route-focus[data-m2-content-id="${seeded.contentId}"]`);
    await focused.waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await focused.getAttribute('aria-current'), 'true');
    assert.equal(await focused.locator(`[data-m2-create="content"][data-content-id="${seeded.contentId}"]`).count(), 1,
      'Portfolio must return to the exact content card without substituting a different work');
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});
