'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORTFOLIO_SENTINEL = '[{"id":"existing-position-must-survive"}]';

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

after(() => {
  if (browser) void browser.close().catch(() => {});
  if (server && server.listening) {
    server.close();
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
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
