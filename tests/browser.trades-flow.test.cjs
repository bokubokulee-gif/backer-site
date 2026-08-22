'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const TradeCatalog = require('../js/trades-catalog-model');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORTFOLIO_SENTINEL = '[{"id":"existing-position-must-survive"}]';
const TRADE_CATALOG = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const TRADE_ELIGIBILITY = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8'));
const TRADE_MODEL = TradeCatalog.build(TRADE_CATALOG, {
  reviewRegistry: TRADE_ELIGIBILITY,
  simulationBucket: '2026-08-21T08:00:00.000Z'
});

let browser;
let server;
let origin;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (/\.(?:png|jpe?g|webp|gif|ico)$/.test(file)) return 'image/*';
  if (/\.(?:woff2?|ttf|otf)$/.test(file)) return 'font/woff2';
  return 'application/octet-stream';
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/backerdemo.html';
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
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Not found');
  }
}

async function newContext(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.addInitScript((portfolio) => {
    localStorage.setItem('backer_portfolio_v1', portfolio);
  }, PORTFOLIO_SENTINEL);
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => {
    if (route.request().resourceType() === 'image') {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
      });
    }
    return route.abort();
  });
  return context;
}

function routeFields(href) {
  const url = new URL(href, origin);
  const queryIndex = url.hash.indexOf('?');
  return {
    url,
    anchor: queryIndex < 0 ? url.hash : url.hash.slice(0, queryIndex),
    params: new URLSearchParams(queryIndex < 0 ? '' : url.hash.slice(queryIndex + 1))
  };
}

async function waitForDiscovery(page) {
  await page.goto(`${origin}/backerdemo.html#market2`);
  await page.waitForSelector('.m2-profile-card [data-m2-create="person"]', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.m2-feed-card [data-m2-create="content"]', { state: 'attached', timeout: 20000 });
}

async function assertPortfolioUnchanged(page) {
  assert.equal(await page.evaluate(() => localStorage.getItem('backer_portfolio_v1')), PORTFOLIO_SENTINEL);
}

async function assertSanitizedTerminal(page, draftId, expectedQuestion) {
  await page.waitForURL(/backermarket\.html\?draft=/, { timeout: 20000 });
  try {
    await page.waitForSelector('.poa-term-root .pt-market-surface[data-draft-proposal="true"]', { state: 'visible', timeout: 20000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      title: document.querySelector('#marketPageTitle') && document.querySelector('#marketPageTitle').textContent,
      copy: document.querySelector('#marketPageCopy') && document.querySelector('#marketPageCopy').textContent,
      status: document.body.dataset.draftStatus || '',
      terminal: Boolean(document.querySelector('.poa-term-root')),
      terminalClass: document.querySelector('.poa-term-root') && document.querySelector('.poa-term-root').className
    }));
    assert.fail(`draft terminal did not sanitize: ${JSON.stringify(diagnostic)}; ${error.message}`);
  }
  assert.equal(await page.locator('body').getAttribute('data-draft-status'), 'discovery_proposal');
  assert.equal(await page.locator('.pt-market-surface').getAttribute('data-draft-sanitized'), draftId);
  const terminalText = await page.locator('.poa-term-root').innerText();
  assert.match(terminalText, new RegExp(expectedQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(terminalText, /Local proposal\s*·\s*no execution/i);
  assert.match(terminalText, /No real money moves/i);
  assert.match(terminalText, /no order ticket, bid, ask, price, fee, loss, payout, or fill/i);
  assert.equal(await page.locator('[data-order],[data-quote-action],[data-order-type]').count(), 0, 'a local proposal must not expose trade controls');
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

after(async () => {
  if (browser) await browser.close();
  if (server && server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    });
  }
});

test('direct Trades loads the complete scaled inventory without loading Discovery data or mounting a giant card wall', async () => {
  assert.ok(TRADE_MODEL.people.length >= 1000, `expected at least 1,000 creator-account markets, received ${TRADE_MODEL.people.length}`);
  assert.ok(TRADE_MODEL.contents.length >= 1000, `expected at least 1,000 work markets, received ${TRADE_MODEL.contents.length}`);
  const context = await newContext({ width: 1440, height: 1000 });
  const page = await context.newPage();
  const requestedPaths = [];
  page.on('request', (request) => {
    try { requestedPaths.push(new URL(request.url()).pathname); } catch (_error) {}
  });
  try {
    await page.goto(`${origin}/backerdemo.html#trades?view=profiles`);
    await page.locator('.mkt-catalog-card.is-profile').first().waitFor({ state: 'visible', timeout: 30000 });

    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/js/data.js')), false,
      'a direct #trades route must not request the heavy Discovery data bundle');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/js/market-data.js')), false,
      'a direct #trades route must not request legacy market fixtures');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/js/market-archive.js')), false,
      'a direct #trades route must not request the archived fixture interface');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/css/market-archive.css')), false,
      'a direct #trades route must not request archived fixture styles');
    const inventory = await page.locator('.mkt-catalog-line').innerText();
    assert.match(inventory, new RegExp(`${TRADE_MODEL.people.length.toLocaleString('en-US')}\\s+creator-account markets`, 'i'));
    assert.match(inventory, new RegExp(`${TRADE_MODEL.contents.length.toLocaleString('en-US')}\\s+work markets`, 'i'));
    assert.match(inventory, new RegExp(`${(TRADE_MODEL.people.length + TRADE_MODEL.contents.length).toLocaleString('en-US')}\\s+active contracts`, 'i'));
    assert.equal(await page.locator('.mkt-catalog-card').count(), 15, 'browse routes mount exactly one 15-card page');
    assert.equal(await page.locator('.mkt-pagination').count(), 2, 'page controls remain reachable above and below the bounded result slice');
    assert.match(await page.locator('.mkt-pagination').first().innerText(), new RegExp(`Showing\\s+1-15\\s+of\\s+${TRADE_MODEL.people.length.toLocaleString('en-US')}`, 'i'));

    const firstPageFirst = await page.locator('.mkt-catalog-card').first().getAttribute('data-mkt-subject-id');
    await page.locator('.mkt-pagination').first().getByRole('button', { name: 'Next' }).click();
    await page.waitForFunction((id) => document.querySelector('.mkt-catalog-card')?.getAttribute('data-mkt-subject-id') !== id, firstPageFirst);
    assert.equal(await page.locator('.mkt-catalog-card').count(), 15);
    assert.match(await page.locator('.mkt-pagination').first().innerText(), /Showing\s+16-30\s+of/i);

    const lastProfile = TRADE_MODEL.people.at(-1);
    await page.goto(`${origin}/backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(lastProfile.id)}`);
    const routed = page.locator(`.mkt-catalog-card[data-mkt-subject-id="${lastProfile.id}"]`);
    await routed.waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.locator('.mkt-catalog-card').count(), 15, 'a far deep link is hoisted instead of mounting all preceding rows');
    assert.equal(await page.locator('.mkt-catalog-card').first().getAttribute('data-mkt-subject-id'), lastProfile.id);

    await page.goto(`${origin}/backerdemo.html#trades?view=profiles`);
    await page.locator('.mkt-catalog-card.is-profile').first().waitFor({ state: 'visible', timeout: 30000 });
    const providerValue = await page.locator('[data-trades-provider] option').nth(1).getAttribute('value');
    const expectedProviderCount = TRADE_MODEL.people.filter((row) => String(row.contract?.metric?.provider || '').toLowerCase() === providerValue).length;
    assert.ok(providerValue && expectedProviderCount > 15, 'the scale fixture needs a provider facet larger than one page');
    await page.locator('[data-trades-provider]').selectOption(providerValue);
    await page.waitForFunction((expected) => document.querySelector('.mkt-pagination')?.textContent.includes(expected), expectedProviderCount.toLocaleString('en-US'));
    assert.match(await page.locator('.mkt-pagination').first().innerText(), new RegExp(`of\\s+${expectedProviderCount.toLocaleString('en-US')}\\s+matching`, 'i'));
    assert.equal(await page.locator('.mkt-catalog-card').count(), 15, 'provider filtering runs across the full catalog but keeps one bounded page');

    await page.locator('[data-trades-provider]').selectOption('all');
    const metricValue = await page.locator('[data-trades-metric] option').nth(1).getAttribute('value');
    const expectedMetricCount = TRADE_MODEL.people.filter((row) => String(row.contract?.metric?.key || '').toLowerCase() === metricValue).length;
    assert.ok(metricValue && expectedMetricCount > 0);
    await page.locator('[data-trades-metric]').selectOption(metricValue);
    await page.waitForFunction((expected) => document.querySelector('.mkt-pagination')?.textContent.includes(expected), expectedMetricCount.toLocaleString('en-US'));
    assert.match(await page.locator('.mkt-pagination').first().innerText(), new RegExp(`of\\s+${expectedMetricCount.toLocaleString('en-US')}\\s+matching`, 'i'));
    assert.ok(await page.locator('.mkt-catalog-card').count() <= 15);

    await page.locator('[data-trades-metric]').selectOption('all');
    const nameCounts = new Map();
    for (const row of TRADE_MODEL.people) nameCounts.set(row.name, (nameCounts.get(row.name) || 0) + 1);
    const searchedProfile = [...TRADE_MODEL.people].reverse().find((row) => row.name && nameCounts.get(row.name) === 1);
    assert.ok(searchedProfile, 'the scaled inventory needs a uniquely searchable profile');
    await page.locator('[data-trades-query]').fill(searchedProfile.name);
    await page.locator(`.mkt-catalog-card[data-mkt-subject-id="${searchedProfile.id}"]`).waitFor({ state: 'visible', timeout: 30000 });
    assert.ok(await page.locator('.mkt-catalog-card').count() <= 15, 'full-inventory search stays bounded');

    for (const [width, expectedColumns] of [[1440, 3], [648, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const grid = document.querySelector('.mkt-catalog-grid');
        const card = document.querySelector('.mkt-catalog-card');
        const action = document.querySelector('.mkt-side-actions button');
        const support = document.querySelector('.mkt-description');
        return {
          columns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          cardWidth: card.getBoundingClientRect().width,
          actionHeight: action.getBoundingClientRect().height,
          supportFont: Number.parseFloat(getComputedStyle(support).fontSize),
          innerWidth,
          scrollWidth: document.documentElement.scrollWidth
        };
      });
      assert.equal(layout.columns, expectedColumns, `${width}px must render ${expectedColumns} catalog column(s)`);
      assert.ok(layout.cardWidth > 0 && layout.actionHeight >= 44 && layout.supportFont >= 15);
      assert.ok(layout.scrollWidth <= layout.innerWidth + 1, `${width}px Trades must not overflow horizontally`);
    }
  } finally {
    await context.close();
  }
});

test('real-catalog Trades deep link, paper account, Back/Fade ticket, receipt, position, and personalized feed stay coherent', async () => {
  assert.ok(TRADE_MODEL.people.length >= 1000);
  assert.ok(TRADE_MODEL.contents.length >= 1000);
  const subject = TRADE_MODEL.people.at(-1);
  assert.ok(subject && subject.id && subject.contract && subject.simulation, 'the eligible model needs a complete creator-account contract');
  const context = await newContext({ width: 320, height: 780 });
  const page = await context.newPage();
  const requestedPaths = [];
  page.on('request', (request) => {
    try { requestedPaths.push(new URL(request.url()).pathname); } catch (_error) {}
  });
  try {
    await page.goto(`${origin}/backerdemo.html`);
    await page.evaluate(() => {
      localStorage.setItem('backer_trades_account_v1', JSON.stringify({
        schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 20,
        updatedAt: '2026-08-21T08:00:00.000Z'
      }));
    });
    await page.goto(`${origin}/backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(subject.id)}`);
    const card = page.locator(`.mkt-catalog-card[data-mkt-subject-kind="profile"][data-mkt-subject-id="${subject.id}"]`);
    await card.waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForFunction((id) => document.querySelector(`[data-mkt-subject-id="${id}"]`)?.classList.contains('is-route-focus'), subject.id);

    assert.equal(requestedPaths.filter((pathname) => pathname.endsWith('/js/market-data.js')).length, 0,
      '#trades must never request the legacy fixture data module');
    assert.equal(await page.locator('.mkt-paper-status').count(), 1, 'the board uses one compact paper-model status');
    assert.equal((await page.locator('.mkt-paper-status').innerText()).trim(), 'Paper market · modeled quotes');
    const inventoryText = await page.locator('.mkt-catalog-line').innerText();
    assert.match(inventoryText, /\$20(?:\.00)?\s+paper cash/i);
    assert.match(inventoryText, new RegExp(`${TRADE_MODEL.people.length.toLocaleString('en-US')}\\s+creator-account markets`, 'i'));
    assert.match(inventoryText, new RegExp(`${TRADE_MODEL.contents.length.toLocaleString('en-US')}\\s+work markets`, 'i'));
    assert.equal(await page.locator('.mkt-disclosure').count(), 0);
    assert.doesNotMatch(await page.locator('.mkt').innerText(), /Ada Maker|Marcus Stillwater|BACKER_MKT|Demo simulations/i);
    assert.equal((await card.locator('.mkt-contract h3').innerText()).trim(), subject.contract.question);
    assert.match(await card.locator('.mkt-contract-facts').innerText(), new RegExp(subject.contract.baseline.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(await card.locator('.mkt-contract-facts').innerText(), new RegExp(subject.contract.target.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(await card.locator('.mkt-sim-market').innerText(), /\d+¢[\s\S]*[+-]\d+(?:\.\d)? pts[\s\S]*\$[\d,.]+[KM]?\s+paper vol[\s\S]*Back[\s\S]*Fade/i);
    assert.match(await card.locator('[data-mkt-source-open]').first().getAttribute('href'), /^https?:\/\//);

    await card.locator('[data-mkt-trade="BACK"]').click();
    await page.waitForFunction(() => document.activeElement?.matches('.mkt-ticket'));
    const primaryTicketGeometry = await page.evaluate(() => {
      const dialog = document.querySelector('.mkt-ticket').getBoundingClientRect();
      const amount = document.querySelector('.mkt-ticket-amount').getBoundingClientRect();
      const actions = document.querySelector('.mkt-ticket-actions').getBoundingClientRect();
      const contract = document.querySelector('.mkt-ticket-contract').getBoundingClientRect();
      const quote = document.querySelector('.mkt-ticket-quote').getBoundingClientRect();
      const totals = document.querySelector('.mkt-ticket-totals').getBoundingClientRect();
      const error = document.querySelector('.mkt-ticket-error').getBoundingClientRect();
      const ack = document.querySelector('.mkt-ticket-ack').getBoundingClientRect();
      return { dialog, contract, quote, amount, totals, error, ack, actions };
    });
    assert.ok(primaryTicketGeometry.amount.top >= primaryTicketGeometry.dialog.top - 1,
      'the paper amount must appear in the first mobile ticket viewport');
    assert.ok(primaryTicketGeometry.actions.bottom <= primaryTicketGeometry.dialog.bottom + 1,
      `the primary paper action must appear before the supporting details on mobile: ${JSON.stringify(primaryTicketGeometry)}`);
    assert.equal(await page.locator('.mkt-ticket').getAttribute('tabindex'), '-1');
    assert.equal(await page.locator('.mkt-ticket-layer').evaluate((layer) => [...layer.parentElement.children]
      .filter((child) => child !== layer).every((child) => child.inert && child.getAttribute('aria-hidden') === 'true')), true,
    'the modal must isolate all background trade controls');
    await page.locator('[data-ticket-ack]').check();
    assert.equal(await page.locator('[data-ticket-confirm]').isDisabled(), true, 'paper cash below the amount blocks the fill');
    assert.match(await page.locator('[data-ticket-error]').innerText(), /Amount exceeds available paper cash/i);
    assert.equal((await page.locator('.mkt-ticket-contract h3').innerText()).trim(), subject.contract.question);
    const blockedTicketText = await page.locator('.mkt-ticket').innerText();
    assert.match(blockedTicketText, /Resolution rule[\s\S]*Resolve BACK if/i);
    assert.match(blockedTicketText, /Resolution source/i);
    assert.match(blockedTicketText, /Estimated payout if correct[\s\S]*Profit if correct/i);
    await page.keyboard.press('Escape');
    await page.waitForFunction((id) => document.activeElement?.matches(`[data-mkt-trade="BACK"][data-subject-id="${id}"]`), subject.id);

    await page.evaluate(() => {
      localStorage.setItem('backer_trades_account_v1', JSON.stringify({
        schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 10000,
        updatedAt: '2026-08-21T08:00:00.000Z'
      }));
    });
    await page.reload();
    await card.waitFor({ state: 'visible', timeout: 20000 });
    await card.locator('[data-mkt-trade="FADE"]').click();
    await page.waitForFunction(() => document.activeElement?.matches('.mkt-ticket'));
    const ticketText = await page.locator('.mkt-ticket').innerText();
    assert.match(ticketText, /Available cash[\s\S]*\$10,000(?:\.00)?/i);
    assert.match(ticketText, /Estimated payout if correct[\s\S]*Profit if correct/i);
    assert.match(ticketText, /Native metric[\s\S]*Observed baseline[\s\S]*Resolution rule[\s\S]*Resolve BACK if/i);
    const ticketClose = page.locator('.mkt-ticket [data-ticket-close]').first();
    await ticketClose.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => {
      const links = document.querySelectorAll('.mkt-ticket-details a');
      return document.activeElement === links[links.length - 1];
    }), true,
      'Shift+Tab from the first ticket control must wrap to the last enabled control');
    await page.locator('[data-ticket-amount]').fill('25');
    await page.locator('[data-ticket-ack]').check();
    assert.equal(await page.locator('[data-ticket-confirm]').isEnabled(), true);
    await page.locator('.mkt-ticket-details a').last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.matches('.mkt-ticket [data-ticket-close]')), true,
      'Tab from the last ticket control must wrap to the close control');
    await page.locator('[data-ticket-confirm]').focus();
    await page.locator('[data-ticket-confirm]').click();
    await page.locator('.mkt-ticket.is-receipt').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.matches('.mkt-ticket.is-receipt'));
    assert.match(await page.locator('.mkt-ticket.is-receipt').innerText(), /Paper trade receipt[\s\S]*Estimated payout if correct[\s\S]*Profit if correct[\s\S]*Resolution rule[\s\S]*Resolution source[\s\S]*Paper cash left[\s\S]*\$9,975(?:\.00)?[\s\S]*Contract[\s\S]*Evidence observation[\s\S]*Receipt/i);

    const stored = await page.evaluate(() => ({
      positions: JSON.parse(localStorage.getItem('backer_trades_positions_v1') || '[]'),
      account: JSON.parse(localStorage.getItem('backer_trades_account_v1') || 'null'),
      legacy: localStorage.getItem('backer_portfolio_v1')
    }));
    assert.equal(stored.positions.length, 1);
    assert.equal(stored.positions[0].schemaVersion, 'backer-trades-position-v1');
    assert.equal(stored.positions[0].subjectId, subject.id);
    assert.equal(stored.positions[0].contractId, subject.contract.id);
    assert.equal(stored.positions[0].contractObservationId, subject.contract.metric.observationId);
    assert.equal(stored.positions[0].contractSnapshot.question, subject.contract.question);
    assert.equal(stored.positions[0].side, 'FADE');
    assert.equal(stored.positions[0].cost, 25);
    assert.ok(stored.positions[0].estimatedPayout > 25);
    assert.equal(stored.positions[0].profitIfCorrect, Math.round((stored.positions[0].estimatedPayout - 25) * 100) / 100);
    assert.equal(stored.account.cash, 9975);
    assert.equal(stored.legacy, PORTFOLIO_SENTINEL, 'real Trades must never merge into the legacy fixture portfolio');

    await page.keyboard.press('Escape');
    await page.waitForFunction((id) => document.activeElement?.matches(`[data-mkt-trade="FADE"][data-subject-id="${id}"]`), subject.id);
    await page.getByRole('tab', { name: /Your trades/ }).click();
    await page.locator('.mkt-position-card').waitFor({ state: 'visible' });
    assert.match(await page.locator('.mkt-account-summary').innerText(), /Paper cash[\s\S]*\$9,975(?:\.00)?[\s\S]*Position cost[\s\S]*\$25(?:\.00)?[\s\S]*Current mark[\s\S]*Paper P&L/i);
    assert.equal((await page.locator('.mkt-position-contract h4').innerText()).trim(), subject.contract.question);

    await page.getByRole('tab', { name: /For you/ }).click();
    assert.match(await page.locator('.mkt-personalization').innerText(), /1 simulated trade[\s\S]*Preferences stay on this device/i);
    assert.equal(await page.locator('.mkt-feed-section').first().locator('.mkt-catalog-card').first().getAttribute('data-mkt-subject-id'), subject.id,
      'the exact traded profile should lead the device-personalized profile feed');
    await page.getByRole('button', { name: 'Reset personalization' }).click();
    await page.waitForFunction(() => document.querySelector('.mkt-personalization')?.textContent.includes('Default order restored'));
    const resetState = await page.evaluate(() => ({
      watches: localStorage.getItem('backer_market2_watch_v1'),
      actions: localStorage.getItem('backer_discovery_interest_v1'),
      positions: JSON.parse(localStorage.getItem('backer_trades_positions_v1') || '[]'),
      account: JSON.parse(localStorage.getItem('backer_trades_account_v1') || 'null')
    }));
    assert.equal(resetState.watches, null);
    assert.equal(resetState.actions, null);
    assert.equal(resetState.positions.length, 1, 'reset must keep paper receipts and positions');
    assert.equal(resetState.account.cash, 9975, 'reset must keep paper cash');
    const dimensions = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scrollWidth <= dimensions.innerWidth + 1, 'mobile Trades must not overflow horizontally');
  } finally {
    await context.close();
  }
});

test('desktop paper ticket keeps its primary actions inside the initial dialog viewport', async () => {
  const subject = TRADE_MODEL.people[0];
  assert.ok(subject?.id, 'the model needs a profile subject for desktop ticket geometry');
  const context = await newContext({ width: 1440, height: 1000 });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(subject.id)}`);
    const card = page.locator(`.mkt-catalog-card[data-mkt-subject-kind="profile"][data-mkt-subject-id="${subject.id}"]`);
    await card.waitFor({ state: 'visible', timeout: 20000 });
    await card.locator('[data-mkt-trade="BACK"]').click();
    await page.waitForFunction(() => document.activeElement?.matches('.mkt-ticket'));
    const geometry = await page.evaluate(() => {
      const dialog = document.querySelector('.mkt-ticket').getBoundingClientRect();
      const actions = document.querySelector('.mkt-ticket-actions').getBoundingClientRect();
      return {
        dialog: { top: dialog.top, bottom: dialog.bottom },
        actions: { top: actions.top, bottom: actions.bottom },
        scrollTop: document.querySelector('.mkt-ticket').scrollTop
      };
    });
    assert.equal(geometry.scrollTop, 0, 'the ticket must open at its top');
    assert.ok(geometry.actions.top >= geometry.dialog.top - 1, `desktop actions must begin inside the dialog: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.actions.bottom <= geometry.dialog.bottom - 11, `desktop actions need a readable bottom inset: ${JSON.stringify(geometry)}`);
  } finally {
    await context.close();
  }
});

test('Trades profile and content cards return their exact retained subjects to Discovery', async () => {
  const profile = TRADE_MODEL.people.find((row) => row.researchHref && row.contract && row.simulation);
  const content = TRADE_MODEL.contents.find((row) => row.researchHref && row.contract && row.simulation);
  assert.ok(profile && content, 'the eligible catalog needs exact Discovery return routes');
  const context = await newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(profile.id)}`);
    const profileCard = page.locator(`.mkt-catalog-card[data-mkt-subject-kind="profile"][data-mkt-subject-id="${profile.id}"]`);
    await profileCard.waitFor({ state: 'visible', timeout: 20000 });
    const profileResearch = profileCard.locator('[data-mkt-research]');
    assert.equal((await profileResearch.innerText()).trim(), 'Research in Discovery');
    const profileRoute = routeFields(await profileResearch.getAttribute('href'));
    assert.equal(profileRoute.anchor, '#market2');
    assert.equal(profileRoute.params.get('person'), profile.id);
    assert.equal(profileRoute.params.has('work'), false);
    assert.equal(await profileCard.locator('a a').count(), 0, 'profile links must never be nested');

    await page.goto(`${origin}/backerdemo.html#trades?view=contents&subject=${encodeURIComponent(content.id)}`);
    const contentCard = page.locator(`.mkt-catalog-card[data-mkt-subject-kind="content"][data-mkt-subject-id="${content.id}"]`);
    await contentCard.waitFor({ state: 'visible', timeout: 20000 });
    const contentResearch = contentCard.locator('[data-mkt-research]');
    assert.equal((await contentResearch.innerText()).trim(), 'Research in Discovery');
    const contentRoute = routeFields(await contentResearch.getAttribute('href'));
    assert.equal(contentRoute.anchor, '#market2');
    assert.equal(contentRoute.params.get('person'), content.personId);
    assert.equal(contentRoute.params.get('work'), content.id);
    assert.equal(await contentCard.locator('a a').count(), 0, 'content links must never be nested');

    await contentResearch.click();
    const focused = page.locator(`.m2-feed-card.is-route-focus[data-m2-content-id="${content.id}"]`);
    await focused.waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await focused.getAttribute('aria-current'), 'true');
    assert.equal(await focused.locator(`[data-m2-create="content"][data-content-id="${content.id}"]`).count(), 1,
      'Discovery must focus the exact work instead of another record');
    assert.equal(routeFields(page.url()).params.get('work'), content.id);

    await page.goto(`${origin}/backerdemo.html#market2?view=radar&person=${encodeURIComponent(content.personId)}&content=${encodeURIComponent(content.id)}`);
    const aliasFocused = page.locator(`.m2-feed-card.is-route-focus[data-m2-content-id="${content.id}"]`);
    await aliasFocused.waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await aliasFocused.locator(`[data-m2-create="content"][data-content-id="${content.id}"]`).count(), 1,
      'the content= compatibility route must retain the same exact work ID');

    await page.goto(`${origin}/backerdemo.html?route-check=ineligible#trades?view=contents&subject=${encodeURIComponent('not-an-eligible-work')}`);
    await page.locator('.mkt-empty.is-route-missing').waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await page.locator('.mkt-catalog-card.is-route-focus').count(), 0,
      'an ineligible subject must fail closed without substituting another card');
  } finally {
    await context.close();
  }
});

test('watching an exact work reorders personalized content and reset restores defaults without deleting ledgers', async () => {
  const context = await newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`);
    await page.evaluate((profileId) => {
      localStorage.setItem('backer_market2_watch_v1', JSON.stringify([profileId]));
      localStorage.setItem('backer_discovery_interest_v1', JSON.stringify([{
        personId: profileId, action: 'opened', at: new Date(Date.now() - 2000).toISOString()
      }]));
      localStorage.setItem('backer_trades_positions_v1', JSON.stringify([{
        schemaVersion: 'backer-trades-position-v1', id: 'preserved-position', subjectId: 'preserved-subject',
        subjectKind: 'profile', side: 'BACK', cost: 25, receiptId: 'KEEP-RECEIPT',
        createdAt: new Date(Date.now() - 1000).toISOString()
      }]));
      localStorage.setItem('backer_trades_account_v1', JSON.stringify({
        schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 9975,
        updatedAt: new Date(Date.now() - 1000).toISOString()
      }));
    }, TRADE_MODEL.people[0].id);

    await page.goto(`${origin}/backerdemo.html#trades?view=contents`);
    await page.waitForFunction(() => Boolean(window.BackerMarketDraftStore));
    await page.evaluate((profileId) => {
      const now = new Date().toISOString();
      const saved = window.BackerMarketDraftStore.save({
        schemaVersion: 2, draftId: 'keep001', executionMode: 'simulation', status: 'local_draft',
        approvalStatus: 'discovery_proposal', instrument: 'milestone', createdAt: now, updatedAt: now,
        subject: {
          type: 'person-growth', person: {
            id: profileId, name: 'Preserved creator', identityKind: 'public_discovery', tradable: false, platforms: []
          }, content: null
        },
        outcome: {
          question: 'Will this preserved creator reach the retained growth target?', type: 'binary',
          outcomes: [{ id: 'GROWS_TO_TARGET', label: 'Grows to target' }, { id: 'DOES_NOT_REACH_TARGET', label: 'Does not reach target' }],
          selectedSide: null
        },
        resolution: {
          platform: 'youtube', metricKey: 'views', metricLabel: 'Views', unit: 'count',
          baseline: { value: 100, observedAt: now, sourceUrl: 'https://example.com/source', provenance: 'user_entered_unverified' },
          target: { value: 120, direction: 'at_least' }, deadline: '2099-12-31T00:00:00.000Z',
          sourceUrl: 'https://example.com/source', readiness: 'unverified_idea', observation: null
        },
        rules: {
          graceHours: 24, disputeHours: 24, deletionRule: 'pause_then_void',
          correctionRule: 'latest_valid_before_cutoff', voidRule: 'refund_original_cost'
        },
        market: {
          lifecycle: 'DRAFT', approvalStatus: 'discovery_proposal', quote: null, feeRate: null,
          stake: null, maxLoss: null, payout: null
        },
        validation: { executable: false }
      });
      if (!saved.ok) throw new Error(`proposal fixture failed: ${saved.code}`);
    }, TRADE_MODEL.people[0].id);
    const cards = page.locator('.mkt-catalog-card.is-content');
    await cards.first().waitFor({ state: 'visible', timeout: 20000 });
    assert.ok(await cards.count() >= 6, 'the content catalog needs a non-leading exact work to exercise ranking');
    const defaultFirst = TRADE_MODEL.contents[0].id;
    const targetId = await cards.nth(5).getAttribute('data-mkt-subject-id');
    assert.notEqual(targetId, defaultFirst);
    await page.evaluate(() => {
      window.__backerWorkWatchEvents = [];
      window.BackerAnalytics = {
        track(event, props) { window.__backerWorkWatchEvents.push({ event, props }); }
      };
    });

    const target = page.locator(`.mkt-catalog-card.is-content[data-mkt-subject-id="${targetId}"]`);
    await target.locator(`[data-mkt-watch-work="${targetId}"]`).click();
    await page.waitForFunction((id) => document.querySelector('.mkt-catalog-card.is-content')?.getAttribute('data-mkt-subject-id') === id, targetId);
    const watchedTarget = page.locator(`.mkt-catalog-card.is-content[data-mkt-subject-id="${targetId}"]`).first();
    assert.equal(await watchedTarget.locator('[data-mkt-watch-work]').getAttribute('aria-pressed'), 'true');
    assert.equal((await watchedTarget.locator('[data-mkt-watch-work]').innerText()).trim(), 'Watching');
    assert.match(await watchedTarget.locator('.mkt-why').innerText(), /Watched work/i);

    const watchedState = await page.evaluate(() => ({
      work: JSON.parse(localStorage.getItem('backer_trades_work_watch_v1') || '[]'),
      people: JSON.parse(localStorage.getItem('backer_market2_watch_v1') || '[]'),
      events: window.__backerWorkWatchEvents
    }));
    assert.deepEqual(watchedState.work, [targetId]);
    assert.equal(watchedState.people.includes(targetId), false, 'the exact work ID must not be written into profile watches');
    assert.equal(watchedState.events.at(-1).event, 'market_work_watch_changed');
    assert.equal(watchedState.events.at(-1).props.content_id, targetId);
    assert.equal(watchedState.events.at(-1).props.watched, true);

    await page.getByRole('tab', { name: /For you/ }).click();
    const personalizedContent = page.locator('.mkt-feed-section').nth(1);
    assert.equal(await personalizedContent.locator('.mkt-catalog-card.is-content').first().getAttribute('data-mkt-subject-id'), targetId);
    assert.match(await page.locator('.mkt-personalization').innerText(), /1 watched work/i);

    await page.getByRole('button', { name: 'Reset personalization' }).click();
    await page.waitForFunction(() => document.querySelector('.mkt-personalization')?.textContent.includes('Default order restored'));
    await page.waitForFunction((id) => document.querySelectorAll('.mkt-feed-section')[1]?.querySelector('.mkt-catalog-card.is-content')?.getAttribute('data-mkt-subject-id') === id, defaultFirst);
    const reset = await page.evaluate(() => ({
      work: localStorage.getItem('backer_trades_work_watch_v1'),
      people: localStorage.getItem('backer_market2_watch_v1'),
      interests: localStorage.getItem('backer_discovery_interest_v1'),
      positions: JSON.parse(localStorage.getItem('backer_trades_positions_v1') || '[]'),
      account: JSON.parse(localStorage.getItem('backer_trades_account_v1') || 'null'),
      proposal: window.BackerMarketDraftStore.read('keep001')
    }));
    assert.equal(reset.work, null);
    assert.equal(reset.people, null);
    assert.equal(reset.interests, null);
    assert.equal(reset.positions[0].receiptId, 'KEEP-RECEIPT');
    assert.equal(reset.account.cash, 9975);
    assert.equal(reset.proposal.ok, true);
    assert.equal(reset.proposal.draft.draftId, 'keep001');
    assert.equal(await personalizedContent.locator('.mkt-catalog-card.is-content').first().getAttribute('data-mkt-subject-id'), defaultFirst);
  } finally {
    await context.close();
  }
});

test('Discovery profile and content cards retain their exact subject routes into the composer', async () => {
  const context = await newContext();
  const page = await context.newPage();
  try {
    await waitForDiscovery(page);

    const profile = page.locator('.m2-profile-card [data-m2-create="person"]').first();
    const profileHref = await profile.getAttribute('href');
    const profileCreator = await profile.getAttribute('data-creator-id');
    const profileRoute = routeFields(profileHref);
    assert.equal(profileRoute.anchor, '#draft');
    assert.equal(profileRoute.params.get('scope'), 'person');
    assert.equal(profileRoute.params.get('person'), profileCreator);
    assert.equal(profileRoute.params.get('source'), 'discovery');
    assert.equal(profileRoute.params.has('content'), false);
    await profile.click();
    await page.waitForSelector('#mbPerson', { state: 'visible' });
    assert.equal(await page.locator('#mbPerson').inputValue(), profileCreator, 'the exact profile ID must survive navigation');
    assert.equal(routeFields(page.url()).params.get('person'), profileCreator);

    await waitForDiscovery(page);
    const content = page.locator('.m2-feed-card [data-m2-create="content"]').first();
    const contentHref = await content.getAttribute('href');
    const contentCreator = await content.getAttribute('data-creator-id');
    const contentId = await content.getAttribute('data-content-id');
    const contentRoute = routeFields(contentHref);
    assert.equal(contentRoute.anchor, '#draft');
    assert.equal(contentRoute.params.get('scope'), 'content');
    assert.equal(contentRoute.params.get('person'), contentCreator);
    assert.equal(contentRoute.params.get('content'), contentId);
    assert.equal(contentRoute.params.get('source'), 'discovery');
    await content.click();
    await page.waitForSelector('#mbContent', { state: 'visible' });
    assert.equal(await page.locator('#mbPerson').inputValue(), contentCreator, 'the exact content owner must survive navigation');
    assert.equal(await page.locator('#mbContent').inputValue(), contentId, 'the exact public work must survive navigation');
    assert.equal(routeFields(page.url()).params.get('content'), contentId);
    await assertPortfolioUnchanged(page);
  } finally {
    await context.close();
  }
});

test('content proposal saves as v2, persists into Trades, and opens only a sanitized draft terminal', async () => {
  const context = await newContext();
  const page = await context.newPage();
  const expectedQuestion = 'Will this exact public work reach the next retained growth target?';
  try {
    await waitForDiscovery(page);
    const content = page.locator('.m2-feed-card [data-m2-create="content"]').first();
    const personId = await content.getAttribute('data-creator-id');
    const contentId = await content.getAttribute('data-content-id');
    await content.click();
    await page.waitForSelector('#mbContent', { state: 'visible' });
    assert.equal(await page.locator('#mbPerson').inputValue(), personId);
    assert.equal(await page.locator('#mbContent').inputValue(), contentId);

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForSelector('#mbTarget', { state: 'visible' });
    let baseline = Number(await page.locator('#mbBaseline').inputValue());
    if (!Number.isFinite(baseline) || baseline < 0) {
      baseline = 100;
      await page.locator('#mbBaseline').fill(String(baseline));
    }
    await page.locator('#mbTarget').fill(String(baseline + Math.max(10, Math.ceil(baseline * 0.1))));
    await page.locator('#mbQuestion').fill(expectedQuestion);
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForSelector('#mbDeadline', { state: 'visible' });
    await page.locator('#mbDeadline').fill('2099-12-31');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForSelector('#mbSource', { state: 'visible' });
    assert.match(await page.locator('#mbSource').inputValue(), /^https?:\/\//, 'resolution source must stay attached');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('button', { name: 'Save proposal' }).click();
    await page.waitForSelector('.mb-receipt-id', { state: 'visible' });
    const draftId = (await page.locator('.mb-receipt-id').innerText()).trim();
    assert.match(draftId, /^m2_[A-Za-z0-9_-]+$/);
    const receiptText = await page.locator('.mb-receipt').innerText();
    assert.match(receiptText, /no price, odds, orders, volume, payout, or real-money execution/i);

    const stored = await page.evaluate((id) => ({
      draft: JSON.parse(localStorage.getItem(`backer_site_market_draft_v2:${id}`)),
      index: JSON.parse(localStorage.getItem('backer_site_market_draft_index_v2')),
      portfolio: localStorage.getItem('backer_portfolio_v1')
    }), draftId);
    assert.equal(stored.draft.schemaVersion, 2);
    assert.equal(stored.draft.subject.type, 'content-growth');
    assert.equal(stored.draft.subject.person.id, personId);
    assert.equal(stored.draft.subject.content.id, contentId);
    assert.equal(stored.draft.outcome.question, expectedQuestion);
    assert.equal(stored.draft.executionMode, 'simulation');
    assert.equal(stored.draft.validation.executable, false);
    assert.deepEqual({
      quote: stored.draft.market.quote,
      feeRate: stored.draft.market.feeRate,
      stake: stored.draft.market.stake,
      maxLoss: stored.draft.market.maxLoss,
      payout: stored.draft.market.payout
    }, { quote: null, feeRate: null, stake: null, maxLoss: null, payout: null });
    assert.equal(Object.prototype.hasOwnProperty.call(stored.draft.market, 'odds'), false);
    assert.ok(stored.index.some((entry) => entry.draftId === draftId));
    assert.equal(stored.portfolio, PORTFOLIO_SENTINEL);

    await page.getByRole('link', { name: 'View in Trades' }).click();
    await page.waitForSelector(`#proposal-${draftId}`, { state: 'visible', timeout: 20000 });
    assert.match(page.url(), /#trades\?view=proposals&proposal=/);
    assert.match(await page.locator(`#proposal-${draftId}`).innerText(), new RegExp(expectedQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(await page.locator(`#proposal-${draftId} [data-fixture-position]`).count(), 0, 'proposal inbox must not expose a position action');
    await assertPortfolioUnchanged(page);

    await page.reload();
    await page.waitForSelector(`#proposal-${draftId}`, { state: 'visible', timeout: 20000 });
    assert.match(await page.locator(`#proposal-${draftId}`).innerText(), /Saved on this device/);

    await page.locator(`#proposal-${draftId} [data-proposal-review]`).click();
    await assertSanitizedTerminal(page, draftId, expectedQuestion);
    await assertPortfolioUnchanged(page);

    await page.reload();
    await assertSanitizedTerminal(page, draftId, expectedQuestion);
    assert.ok(await page.evaluate((id) => Boolean(localStorage.getItem(`backer_site_market_draft_v2:${id}`)), draftId), 'v2 proposal must survive a terminal reload');
    await assertPortfolioUnchanged(page);
  } finally {
    await context.close();
  }
});

test('composer typography remains legible in dark desktop and light mobile rendering', async () => {
  const context = await newContext({ width: 1440, height: 1000 });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/backercreate.html#draft?scope=person&person=creator_35e4be02c85c10020c7b&source=discovery`);
    await page.waitForSelector('#mbPerson', { state: 'visible' });
    const desktop = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      const px = (value) => Number.parseFloat(value);
      return {
        label: [px(style('.mb-field label').fontSize), px(style('.mb-field label').lineHeight), Number(style('.mb-field label').fontWeight)],
        helper: [px(style('.mb-field small').fontSize), px(style('.mb-field small').lineHeight)],
        section: [px(style('.mb-section-head h2').fontSize), px(style('.mb-section-head h2').lineHeight)],
        input: [px(style('.mb-control').fontSize), document.querySelector('.mb-control').getBoundingClientRect().height],
        preview: [px(style('.mb-preview-fact b').fontSize), px(style('.mb-preview-fact b').lineHeight)],
        claim: [px(style('.mb-preview-question h2').fontSize), px(style('.mb-preview-question h2').lineHeight)]
      };
    });
    assert.deepEqual(desktop.label, [14, 20, 650]);
    assert.deepEqual(desktop.helper, [13, 19]);
    assert.deepEqual(desktop.section, [20, 26]);
    assert.ok(desktop.input[0] >= 16 && desktop.input[1] >= 48);
    assert.deepEqual(desktop.preview, [14, 20]);
    assert.deepEqual(desktop.claim, [20, 28]);

    await page.emulateMedia({ colorScheme: 'light' });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.reload();
    await page.waitForSelector('#mbPerson', { state: 'visible' });
    const mobile = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const control = document.querySelector('.mb-control');
      return {
        scheme: root.colorScheme,
        foreground: getComputedStyle(document.body).color,
        background: getComputedStyle(document.body).backgroundColor,
        inputFont: Number.parseFloat(getComputedStyle(control).fontSize),
        inputHeight: control.getBoundingClientRect().height,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth
      };
    });
    assert.equal(mobile.scheme, 'light');
    assert.notEqual(mobile.foreground, mobile.background);
    assert.ok(mobile.inputFont >= 16 && mobile.inputHeight >= 48);
    assert.ok(mobile.scrollWidth <= mobile.innerWidth + 1, 'mobile composer must not overflow horizontally');
  } finally {
    await context.close();
  }
});

test('draggable dock never covers composer navigation, actions, or the final form field', async () => {
  const context = await newContext({ width: 390, height: 900 });
  const page = await context.newPage();
  const route = `${origin}/backercreate.html#draft?scope=person&person=creator_35e4be02c85c10020c7b&source=discovery`;

  const overlaps = (a, b) => a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
  try {
    await page.goto(route);
    await page.waitForSelector('#mbPerson', { state: 'visible' });

    for (const viewport of [{ width: 390, height: 900 }, { width: 648, height: 900 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport);
      for (const dockState of [
        { edge: 'bottom', crossAxisRatio: 0.5, minimized: false },
        { edge: 'bottom', crossAxisRatio: 0.5, minimized: true },
        { edge: 'left', crossAxisRatio: 0.82, minimized: false },
        { edge: 'left', crossAxisRatio: 0.82, minimized: true },
        { edge: 'right', crossAxisRatio: 0.82, minimized: false },
        { edge: 'right', crossAxisRatio: 0.82, minimized: true },
        { edge: 'top', crossAxisRatio: 0.5, minimized: false },
        { edge: 'top', crossAxisRatio: 0.5, minimized: true }
      ]) {
        await page.evaluate((state) => localStorage.setItem('backer_shared_dock_v1', JSON.stringify(state)), dockState);
        await page.reload();
        await page.waitForSelector('#mbPerson', { state: 'visible' });
        await page.waitForSelector('.backer-float-dock', { state: 'visible' });
        const geometry = await page.evaluate(() => {
          const rect = (selector) => {
            const box = document.querySelector(selector).getBoundingClientRect();
            return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
          };
          return {
            action: rect('.mb-actions'),
            dock: rect('.backer-float-dock'),
            nav: rect('.mb-nav'),
            content: Array.from(document.querySelectorAll('.mb-stage h1,.mb-stage .mb-lede,.mb-stage .mb-person-strip,.mb-stage .mb-choice,.mb-stage .mb-control')).filter((node) => node.getClientRects().length).map((node) => {
              const box = node.getBoundingClientRect();
              return { tag: node.id || node.className || node.tagName, left: box.left, top: box.top, right: box.right, bottom: box.bottom };
            }),
            preview: document.querySelector('.mb-preview-inner') && getComputedStyle(document.querySelector('.mb-preview')).display !== 'none' ? rect('.mb-preview-inner') : null,
            edge: document.documentElement.getAttribute('data-backer-dock-edge'),
            minimized: document.documentElement.getAttribute('data-backer-dock-minimized'),
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth
          };
        });
        assert.equal(geometry.edge, dockState.edge);
        assert.equal(geometry.minimized, String(dockState.minimized));
        assert.equal(overlaps(geometry.action, geometry.dock), false, `${viewport.width}px ${dockState.edge} dock must not cover composer actions`);
        assert.equal(overlaps(geometry.nav, geometry.dock), false, `${viewport.width}px ${dockState.edge} dock must not cover composer navigation`);
        if (dockState.edge !== 'bottom') assert.equal(geometry.content.some((box) => overlaps(box, geometry.dock)), false, `${viewport.width}px ${dockState.edge} dock must not cover visible composer content`);
        if (geometry.preview) assert.equal(overlaps(geometry.preview, geometry.dock), false, `${viewport.width}px ${dockState.edge} dock must not cover the live preview`);
        assert.ok(geometry.action.left >= -1 && geometry.action.right <= viewport.width + 1, 'composer actions must stay inside the viewport');
        assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'dock clearance must not create horizontal overflow');
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.waitForSelector('#mbTarget', { state: 'visible' });
        await page.locator('#mbQuestion').focus();
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(80);
        const focused = await page.evaluate(() => {
          const rect = (selector) => {
            const box = document.querySelector(selector).getBoundingClientRect();
            return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
          };
          return {
            question: rect('#mbQuestion'),
            dock: rect('.backer-float-dock'),
            action: rect('.mb-actions'),
            scrollY,
            maxScrollY: document.documentElement.scrollHeight - innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth
          };
        });
        assert.ok(focused.scrollY >= focused.maxScrollY - 3, `${viewport.width}px composer must reach maximum scroll`);
        assert.equal(overlaps(focused.question, focused.dock), false, `${viewport.width}px ${dockState.edge} dock must not cover the final textarea at maximum scroll`);
        assert.equal(overlaps(focused.question, focused.action), false, `${viewport.width}px action bar must not cover the final textarea at maximum scroll`);
        assert.ok(focused.question.left >= -1 && focused.question.right <= viewport.width + 1, `${viewport.width}px final textarea must stay inside the viewport`);
        assert.ok(focused.scrollWidth <= focused.innerWidth + 1, 'focused composer field must not create horizontal overflow');
      }
    }
  } finally {
    await context.close();
  }
});
