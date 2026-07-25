'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
let server;
let origin;
let browser;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end('{"error":"Not found"}');
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/backerdemo.html';
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

async function newPage(viewport) {
  const context = await browser.newContext({ viewport: viewport || { width: 1280, height: 800 } });
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

test('every market instrument mounts a stable community and activity feed', async () => {
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backermarket.html?market=kai&instrument=milestone&source=market`);
    await page.waitForSelector('[data-bmc-mounted]');

    assert.equal(await page.locator('.backer-consent-panel').count(), 0);
    assert.equal(await page.locator('[data-bmc-tab]').count(), 2);
    assert.equal(await page.locator('.bmc-comment').count(), 5);
    assert.match(await page.locator('[data-bmc-tab="community"]').innerText(), /Community\s+8/);
    assert.equal(await page.locator('.bmc-disclosure').count(), 0);
    assert.equal(await page.locator('.pt-sources .disclosure').count(), 1);
    assert.match(await page.locator('.pt-sources .disclosure').innerText(), /Seeded community profiles/);
    assert.equal(await page.locator('[data-bmc-slot]').getAttribute('data-market-key'), 'ct-kai:milestone');

    const seededComment = await page.locator('.bmc-comment-body > p').first().innerText();
    await page.reload();
    await page.waitForSelector('[data-bmc-mounted]');
    assert.equal(await page.locator('.bmc-comment-body > p').first().innerText(), seededComment);

    await page.click('[data-bmc-tab="activity"]');
    assert.equal(await page.locator('.bmc-activity-row').count(), 16);
    await page.selectOption('[data-bmc-min]', '100');
    assert.ok(await page.locator('.bmc-activity-row').count() > 0);
    assert.ok(await page.locator('.bmc-activity-row').count() < 16);

    await page.click('[data-mtype="pk"]');
    await page.waitForFunction(() => document.querySelector('[data-bmc-slot]')?.dataset.instrument === 'pk');
    assert.match(await page.locator('[data-bmc-mounted]').getAttribute('data-bmc-mounted'), /:pk$/);
    assert.equal(await page.locator('.bmc-comment').count(), 5);
    const pkOutcomes = JSON.parse(await page.locator('[data-bmc-slot]').getAttribute('data-outcomes'));
    const pkPrices = JSON.parse(await page.locator('[data-bmc-slot]').getAttribute('data-outcome-prices'));
    assert.equal(new Set(pkPrices.map(Math.round)).size, 3);
    await page.click('[data-bmc-tab="activity"]');
    const pkRows = await page.locator('.bmc-activity-row').evaluateAll((rows) => rows.map((row) => ({
      outcome: row.dataset.activityOutcome,
      price: Number(row.dataset.activityPrice)
    })));
    pkRows.forEach((row) => {
      const outcomeIndex = pkOutcomes.indexOf(row.outcome);
      assert.ok(outcomeIndex >= 0);
      assert.ok(Math.abs(row.price - pkPrices[outcomeIndex]) <= 4);
    });

    await page.click('[data-mtype="perps"]');
    await page.waitForFunction(() => document.querySelector('[data-bmc-slot]')?.dataset.instrument === 'perps');
    assert.match(await page.locator('[data-bmc-mounted]').getAttribute('data-bmc-mounted'), /:perps$/);
    assert.equal(await page.locator('.bmc-comment').count(), 5);
    assert.ok(['Long', 'Short'].includes(await page.locator('.bmc-position').first().innerText()));
  } finally {
    await context.close();
  }
});

test('composer, reactions, tabs, and pre-open activity behave correctly', async () => {
  const { context, page } = await newPage();
  try {
    await page.goto(`${origin}/backermarket.html?market=elena&source=market`);
    await page.waitForSelector('[data-bmc-mounted]');

    const post = page.locator('[data-bmc-post]');
    assert.equal(await post.isDisabled(), true);
    await page.fill('[data-bmc-textarea]', 'Leaning YES, but I want one more clean upload before sizing up.');
    const yesOutcome = await page.locator('[data-bmc-position] option').nth(1).getAttribute('value');
    await page.selectOption('[data-bmc-position]', yesOutcome);
    await page.click('[data-range="30d"]');
    await page.waitForSelector('[data-bmc-mounted]');
    assert.equal(await page.inputValue('[data-bmc-textarea]'), 'Leaning YES, but I want one more clean upload before sizing up.');
    assert.equal(await page.locator('[data-bmc-position]').inputValue(), yesOutcome);
    assert.equal(await post.isEnabled(), true);
    await post.click();
    assert.equal(await page.locator('.bmc-local').count(), 1);
    assert.match(await page.locator('.bmc-comment').first().innerText(), /Leaning YES/);

    const like = page.locator('[data-bmc-like]').first();
    await like.click();
    assert.equal(await page.locator('[data-bmc-like]').first().getAttribute('aria-pressed'), 'true');

    await page.locator('[data-bmc-tab="community"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-bmc-tab="activity"]').getAttribute('aria-selected'), 'true');

    await page.goto(`${origin}/backermarket.html?market=mira&source=market`);
    await page.waitForSelector('[data-bmc-mounted]');
    await page.click('[data-bmc-tab="activity"]');
    assert.equal(await page.locator('.bmc-activity-row').count(), 0);
    assert.match(await page.locator('.bmc-empty').innerText(), /Activity starts when trading opens/);
  } finally {
    await context.close();
  }
});

test('community stays within the mobile market column without horizontal overflow', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  try {
    await page.goto(`${origin}/backermarket.html?market=kai&source=market`);
    await page.waitForSelector('[data-bmc-mounted]');
    const metrics = await page.locator('[data-bmc-slot]').evaluate((slot) => {
      const tabs = Array.from(slot.querySelectorAll('[data-bmc-tab]'));
      return {
        clientWidth: slot.clientWidth,
        scrollWidth: slot.scrollWidth,
        tabWidths: tabs.map((tab) => Math.round(tab.getBoundingClientRect().width)),
        slotWidth: Math.round(slot.getBoundingClientRect().width)
      };
    });
    assert.ok(metrics.scrollWidth <= metrics.clientWidth + 1);
    assert.ok(Math.abs(metrics.tabWidths[0] - metrics.tabWidths[1]) <= 1);
    assert.ok(metrics.slotWidth <= 375);

    await page.click('[data-bmc-tab="activity"]');
    const activityMetrics = await page.locator('[data-bmc-slot]').evaluate((slot) => ({
      clientWidth: slot.clientWidth,
      scrollWidth: slot.scrollWidth
    }));
    assert.ok(activityMetrics.scrollWidth <= activityMetrics.clientWidth + 1);
  } finally {
    await context.close();
  }
});
