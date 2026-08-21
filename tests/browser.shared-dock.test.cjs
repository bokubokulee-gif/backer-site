'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const SearchEngine = require('../js/search-engine.js');
const TradeCatalog = require('../js/trades-catalog-model.js');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = [
  { width: 320, height: 900 },
  { width: 390, height: 900 },
  { width: 648, height: 900 },
  { width: 1440, height: 1000 }
];
const TERMINAL_VIEWPORTS = [
  { width: 390, height: 900 },
  { width: 648, height: 900 },
  { width: 1440, height: 1000 }
];
const TERMINAL_PROPOSAL_ID = 'dock_proposal_123';
const SEARCH_CATALOG = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data/discovery-catalog.json'), 'utf8'));
const SEARCH_INDEX = SearchEngine.__test.buildIndex(SEARCH_CATALOG);
const SEARCH_REVIEW_REGISTRY = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data/trades-reviewed-humans.json'), 'utf8'));
const SEARCH_TRADE_MODEL = TradeCatalog.build(SEARCH_CATALOG, {
  reviewRegistry: SEARCH_REVIEW_REGISTRY,
  simulationBucket: '2026-08-21T00:00:00.000Z'
});
const SEARCH_ELIGIBLE_PROFILE = SEARCH_INDEX.profiles.find((row) => SEARCH_TRADE_MODEL.people.some((person) => person.id === row.id));
const SEARCH_INELIGIBLE_PROFILE = SEARCH_INDEX.profiles.find((row) => !SEARCH_TRADE_MODEL.people.some((person) => person.id === row.id));
const TERMINAL_DOCK_STATES = ['bottom', 'left', 'right', 'top'].flatMap((edge) => [
  { edge, crossAxisRatio: 0.5, minimized: false },
  { edge, crossAxisRatio: 0.5, minimized: true }
]);

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
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

async function context(viewport = { width: 1000, height: 800 }) {
  const instance = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await instance.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await instance.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await instance.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => {
    if (route.request().resourceType() === 'image') {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
      });
    }
    return route.abort();
  });
  return instance;
}

async function waitForDock(page) {
  await page.waitForSelector('.backer-float-dock', { state: 'visible' });
  await page.waitForFunction(() => Boolean(window.BackerDock));
  assert.equal(await page.locator('.backer-float-dock').count(), 1, 'exactly one shared dock should render');
  assert.equal(await page.locator('nav.dock').count(), 0, 'legacy dock markup must not survive');
}

async function persistedDock(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('backer_shared_dock_v1') || 'null'));
}

async function seedTerminalProposal(page) {
  const now = new Date().toISOString();
  const draft = {
    schemaVersion: 2,
    draftId: TERMINAL_PROPOSAL_ID,
    createdAt: now,
    updatedAt: now,
    source: 'discovery-builder',
    executionMode: 'simulation',
    status: 'local_draft',
    approvalStatus: 'discovery_proposal',
    subject: {
      type: 'person-growth',
      person: {
        id: 'creator_dock_test',
        name: 'Dock Test Creator',
        handle: '@dock-test',
        identityKind: 'public_discovery',
        tradable: false,
        platforms: [{ id: 'github', handle: 'dock-test', url: 'https://github.com/dock-test' }]
      }
    },
    instrument: 'milestone',
    outcome: {
      type: 'binary',
      question: 'Will Dock Test Creator reach 250 retained stars by the cutoff?',
      outcomes: [
        { id: 'GROWS_TO_TARGET', label: 'Grows to target' },
        { id: 'DOES_NOT_REACH_TARGET', label: 'Does not reach target' }
      ]
    },
    resolution: {
      platform: 'github',
      metricKey: 'stars',
      metricLabel: 'Stars',
      unit: 'count',
      readiness: 'unverified_idea',
      observation: null,
      baseline: {
        value: 100,
        observedAt: now,
        provenance: 'user_entered_unverified',
        sourceUrl: 'https://github.com/dock-test'
      },
      target: { value: 250, direction: 'at_least' },
      deadline: '2099-12-31T23:59:59.000Z',
      sourceUrl: 'https://github.com/dock-test'
    },
    rules: {
      graceHours: 24,
      deletionRule: 'pause_then_void',
      correctionRule: 'latest_valid_before_cutoff',
      tieRule: 'not_applicable',
      voidRule: 'refund_original_cost',
      disputeHours: 48
    },
    market: {
      lifecycle: 'DRAFT',
      approvalStatus: 'discovery_proposal',
      quote: null,
      feeRate: null,
      stake: null,
      maxLoss: null,
      payout: null
    },
    validation: { structurallyValid: true, executable: false, blockers: [] },
    provenance: { noFabricatedMetrics: true }
  };
  await page.evaluate(({ id, proposal }) => {
    localStorage.setItem(`backer_site_market_draft_v2:${id}`, JSON.stringify(proposal));
    localStorage.setItem('backer_site_market_draft_index_v2', JSON.stringify([{ draftId: id, createdAt: proposal.createdAt, updatedAt: proposal.updatedAt }]));
  }, { id: TERMINAL_PROPOSAL_ID, proposal: draft });
}

async function waitForStandaloneTerminal(page, proposal) {
  const selector = proposal
    ? '.poa-term-root.open .pt-market-surface[data-draft-proposal="true"]'
    : '.poa-term-root.open .pt-market-surface';
  await page.waitForSelector(selector, { state: 'visible', timeout: 20000 });
  await waitForDock(page);
  await page.waitForFunction(() => {
    const dock = document.querySelector('.backer-float-dock');
    const terminalRoot = document.querySelector('.poa-term-root.open');
    const nav = document.querySelector('.mdp-nav');
    if (!dock || !terminalRoot || !nav) return false;
    const intersects = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const target = dock.classList.contains('is-minimized') ? dock.querySelector('.backer-dock-restore') : dock.querySelector('.backer-dock-home');
    if (!target) return false;
    const targetRect = target.getBoundingClientRect();
    const hit = document.elementFromPoint(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2);
    return !intersects(dock.getBoundingClientRect(), terminalRoot.getBoundingClientRect())
      && !intersects(dock.getBoundingClientRect(), nav.getBoundingClientRect())
      && (hit === target || target.contains(hit));
  }, { timeout: 5000 });
}

async function assertStandaloneTerminalDock(page, state, label, proposal) {
  const result = await page.evaluate(() => {
    const rect = (node) => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
    };
    const intersects = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const dock = document.querySelector('.backer-float-dock');
    const terminalRoot = document.querySelector('.poa-term-root.open');
    const terminal = terminalRoot && terminalRoot.querySelector('.pt-term');
    const nav = document.querySelector('.mdp-nav');
    const target = dock.classList.contains('is-minimized') ? dock.querySelector('.backer-dock-restore') : dock.querySelector('.backer-dock-home');
    const targetRect = rect(target);
    const hit = document.elementFromPoint(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2);
    const dockRect = rect(dock);
    const rootRect = rect(terminalRoot);
    const navRect = rect(nav);
    return {
      edge: document.documentElement.getAttribute('data-backer-dock-edge'),
      minimized: document.documentElement.getAttribute('data-backer-dock-minimized'),
      dock: dockRect,
      root: rootRect,
      nav: navRect,
      terminal: rect(terminal),
      dockRootOverlap: intersects(dockRect, rootRect),
      dockNavOverlap: intersects(dockRect, navRect),
      dockHit: hit === target || target.contains(hit),
      dockZ: Number(getComputedStyle(dock).zIndex),
      rootZ: Number(getComputedStyle(terminalRoot).zIndex),
      terminalRole: terminal.getAttribute('role'),
      terminalModal: terminal.getAttribute('aria-modal'),
      orderCount: terminal.querySelectorAll('[data-order]').length,
      draftProposal: terminal.dataset.draftProposal || '',
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth
    };
  });

  assert.equal(result.edge, state.edge, `${label}: dock edge must match persisted state`);
  assert.equal(result.minimized, String(state.minimized), `${label}: minimized state must match persisted state`);
  assert.equal(result.dockRootOverlap, false, `${label}: standalone terminal must clear the dock gutter`);
  assert.equal(result.dockNavOverlap, false, `${label}: dock must clear the fixed trade navigation`);
  assert.equal(result.dockHit, true, `${label}: dock controls must own their hit target above the terminal`);
  assert.ok(result.dockZ > result.rootZ, `${label}: dedicated terminal must remain below the universal dock`);
  assert.equal(result.terminalRole, 'region', `${label}: standalone terminal must remain an in-page region`);
  assert.equal(result.terminalModal, null, `${label}: standalone terminal must not trap focus as a modal`);
  assert.ok(result.terminal.width >= 280 && result.terminal.height >= 500, `${label}: terminal content region must remain usable`);
  assert.ok(result.scrollWidth <= result.innerWidth + 1, `${label}: dock gutter must not introduce horizontal overflow`);
  if (proposal) {
    assert.equal(result.draftProposal, 'true', `${label}: local proposal must stay in its sanitized terminal`);
    assert.equal(result.orderCount, 0, `${label}: local proposal must not regain order controls`);
  } else {
    assert.ok(result.orderCount > 0, `${label}: approved fixture order control must remain available`);
  }
}

async function assertStandaloneTerminalLegibility(page, label) {
  const result = await page.evaluate(() => {
    const terminal = document.querySelector('.poa-term-root.open .pt-market-surface');
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const fontSizes = (selectors) => selectors.flatMap((selector) => Array.from(terminal.querySelectorAll(selector)))
      .filter(visible)
      .map((node) => ({ selector: node.className || node.tagName, size: Number.parseFloat(getComputedStyle(node).fontSize) }));
    const dimensions = (selectors) => selectors.flatMap((selector) => Array.from(terminal.querySelectorAll(selector)))
      .filter(visible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { selector: node.className || node.tagName, width: rect.width, height: rect.height };
      });
    const horizontalRegions = ['.pt-controls', 'figure.pt-figure', '.pt-block-b:has(.pt-otc-row)', '.pt-rail', '.pt-sources .acts']
      .map((selector) => terminal.querySelector(selector))
      .filter(Boolean)
      .map((node) => ({ selector: node.className || node.tagName, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
    const completeActions = Array.from(terminal.querySelectorAll('.pt-sources button'))
      .filter(visible)
      .map((node) => ({ text: node.textContent.trim(), clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }));
    return {
      width: innerWidth,
      supporting: fontSizes(['.pt-disc', '.pt-trade-h p', '.pt-kv', '.pt-sim', '.pt-rule-callout', '.pt-underlying-note', '.pt-scard p']),
      labels: fontSizes(['.pt-field label', '.pt-side-btn small', '.pt-scard small', '.pt-otc-row small']),
      values: fontSizes(['.pt-side-btn b', '.pt-ladder-row .lr-odds', '.pt-scard b', '.pt-underlying-lead strong']),
      controls: dimensions(['.pt-tab', '.pt-seg button', '.pt-rb', '.pt-side-btn', '.pt-ladder-row', '.pt-order', '.pt-otc-row .otc-select', '.pt-otc-row .otc-actions button', '.pt-sources button']),
      horizontalRegions,
      completeActions,
      documentWidth: document.documentElement.scrollWidth
    };
  });

  assert.ok(result.supporting.length > 0, `${label}: expected supporting terminal copy`);
  assert.deepEqual(result.supporting.filter((item) => item.size < 12.5), [], `${label}: supporting copy must stay at or above 12.5px`);
  assert.deepEqual(result.labels.filter((item) => item.size < 12), [], `${label}: terminal labels must stay at or above 12px`);
  assert.deepEqual(result.values.filter((item) => item.size < 15), [], `${label}: primary values must stay at or above 15px`);
  assert.ok(result.controls.length > 0, `${label}: expected terminal touch controls`);
  assert.deepEqual(result.controls.filter((item) => item.height < 43.5), [], `${label}: terminal controls must retain 44px touch height`);
  assert.ok(result.documentWidth <= result.width + 1, `${label}: terminal must not create document overflow`);
  if (result.width <= 680) {
    assert.deepEqual(result.horizontalRegions.filter((item) => item.scrollWidth > item.clientWidth + 1), [], `${label}: mobile terminal regions must reflow without inner horizontal scrolling`);
  }
  assert.deepEqual(result.completeActions.filter((item) => item.scrollHeight > item.clientHeight + 1), [], `${label}: footer actions must show their complete labels`);
}

async function assertViewportContract(page, label) {
  const result = await page.evaluate(() => {
    const dock = document.querySelector('.backer-float-dock');
    const dockRect = dock.getBoundingClientRect();
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
    };
    const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const actions = Array.from(document.querySelectorAll('.mkt-tabs button, .mkt-toolbar input, .mkt-toolbar select, [data-mkt-trade], [data-ticket-confirm], [data-proposal-review], header a, header button'))
      .filter(visible)
      .map((node) => ({
        text: (node.getAttribute('aria-label') || node.textContent || node.tagName).trim().replace(/\s+/g, ' ').slice(0, 90),
        rect: node.getBoundingClientRect()
      }));
    return {
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      dock: { left: dockRect.left, right: dockRect.right, top: dockRect.top, bottom: dockRect.bottom, width: dockRect.width, height: dockRect.height },
      overlaps: actions.filter((action) => intersects(dockRect, action.rect)).map((action) => action.text),
      actionCount: actions.length
    };
  });

  assert.ok(result.scrollWidth <= result.innerWidth + 1, `${label}: document width ${result.scrollWidth}px exceeds viewport ${result.innerWidth}px`);
  assert.ok(result.dock.left >= -0.5, `${label}: dock escapes the left viewport edge`);
  assert.ok(result.dock.right <= result.innerWidth + 0.5, `${label}: dock escapes the right viewport edge`);
  assert.ok(result.dock.top >= -0.5, `${label}: dock escapes the top viewport edge`);
  assert.ok(result.actionCount > 0, `${label}: expected at least one visible primary control`);
  assert.deepEqual(result.overlaps, [], `${label}: dock overlaps visible key actions`);
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
  if (browser) await browser.close().catch(() => {});
  if (server && server.listening) {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Search dock route opens the dedicated retained-catalog interface from Home, Discovery, and Trades', async () => {
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  try {
    for (const route of ['', '#market2', '#trades']) {
      await page.goto(`${origin}/backerdemo.html${route}`);
      await waitForDock(page);
      await page.locator('.backer-dock-search').click();
      await page.waitForSelector('.search-view.sx', { state: 'visible' });
      await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
      assert.match(await page.evaluate(() => location.hash), /^#search(?:\?|$)/, `${route || 'Home'} should enter #search`);
      assert.equal(await page.locator('.sx-orbit-ring').count(), 3, 'restored social orbit should render');
      const reducedAnimations = await page.evaluate(() => ({
        rings: Array.from(document.querySelectorAll('.sx-orbit-ring'), (node) => getComputedStyle(node).animationName),
        icons: Array.from(document.querySelectorAll('.sx-app-icon'), (node) => getComputedStyle(node).animationName)
      }));
      assert.deepEqual(reducedAnimations.rings, ['none', 'none', 'none'], 'reduced motion must stop every orbit ring');
      assert.equal(reducedAnimations.icons.length, 15);
      assert.ok(reducedAnimations.icons.every((name) => name === 'none'), 'reduced motion must stop every counter-orbit icon');
      assert.equal(await page.locator('#sxInput').count(), 1, 'natural-language input should render');
      assert.equal(await page.locator('.sxr-card').count(), 0, 'Search should not dump the full catalog before the user asks');
      assert.equal(await page.locator('.market2-shell').count(), 0, 'Search must not fall through to Discovery');
      assert.equal(await page.locator('.mkt').count(), 0, 'Search must not fall through to Trades');
      assert.equal(await page.locator('.backer-dock-search').getAttribute('aria-current'), 'page');
      if (route === '') {
        await page.locator('#sxInput').fill('Jem');
        await page.locator('#sxForm').press('Enter');
        await page.waitForSelector('.sxr-card', { state: 'visible' });
        assert.match(await page.locator('.sxr-summary h2').innerText(), /matches for “Jem”/);
        assert.ok(await page.locator('.sxr-actions a[href^="https://"]').count() > 0, 'results should retain public source links');
        assert.doesNotMatch(await page.locator('.search-view.sx').innerText(), /simulated catalog|generated creator/i);
        assert.doesNotMatch(await page.locator('.search-view.sx').innerText(), /Jan 1, 1970/);
      }
    }
  } finally {
    await instance.close();
  }
});

for (const viewport of VIEWPORTS) {
  test(`initial Search filter clears the expanded bottom dock with all motion stopped at ${viewport.width}px`, async () => {
    const instance = await context(viewport);
    await instance.addInitScript(() => {
      localStorage.setItem('backer_shared_dock_v1', JSON.stringify({ edge: 'bottom', crossAxisRatio: 0.5, minimized: false }));
    });
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html#search`);
      await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
      await waitForDock(page);
      const geometry = await page.evaluate(() => {
        const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
        const filters = document.querySelector('.sx-plat-filter').getBoundingClientRect();
        const overlaps = dock.left < filters.right - 1 && dock.right > filters.left + 1
          && dock.top < filters.bottom - 1 && dock.bottom > filters.top + 1;
        return {
          overlaps,
          dockTop: dock.top,
          filterBottom: filters.bottom,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth,
          rings: Array.from(document.querySelectorAll('.sx-orbit-ring'), (node) => getComputedStyle(node).animationName),
          icons: Array.from(document.querySelectorAll('.sx-app-icon'), (node) => getComputedStyle(node).animationName)
        };
      });
      assert.equal(geometry.overlaps, false, 'retained-source filters must clear the expanded dock');
      assert.ok(geometry.filterBottom <= geometry.dockTop - 12, 'Search should retain a readable gap above the bottom dock');
      assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'dock clearance must not create horizontal overflow');
      assert.deepEqual(geometry.rings, ['none', 'none', 'none']);
      assert.equal(geometry.icons.length, 15);
      assert.ok(geometry.icons.every((name) => name === 'none'));
    } finally {
      await instance.close();
    }
  });

  test(`top Search dock clears the fixed 95px header when expanded and minimized at ${viewport.width}px`, async () => {
    const instance = await context(viewport);
    const page = await instance.newPage();
    try {
      for (const minimized of [false, true]) {
        await page.goto(`${origin}/backerdemo.html`);
        await page.evaluate((value) => {
          localStorage.setItem('backer_shared_dock_v1', JSON.stringify({ edge: 'top', crossAxisRatio: 0.5, minimized: value }));
        }, minimized);
        await page.reload();
        await page.goto(`${origin}/backerdemo.html#search`);
        await page.waitForSelector('header.site-menu-header', { state: 'visible' });
        await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
        await waitForDock(page);
        const geometry = await page.evaluate(() => {
          const header = document.querySelector('header.site-menu-header').getBoundingClientRect();
          const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
          return {
            headerBottom: header.bottom,
            dockTop: dock.top,
            dockBottom: dock.bottom,
            edge: document.querySelector('.backer-float-dock').dataset.edge,
            minimized: document.querySelector('.backer-float-dock').classList.contains('is-minimized'),
            overlaps: dock.left < header.right - 1 && dock.right > header.left + 1
              && dock.top < header.bottom - 1 && dock.bottom > header.top + 1,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth
          };
        });
        assert.equal(geometry.edge, 'top');
        assert.equal(geometry.minimized, minimized);
        assert.equal(geometry.overlaps, false, 'top dock must never cover the fixed Backer header');
        assert.ok(geometry.dockTop >= geometry.headerBottom + 11, 'top dock should retain the shared 12px header gap');
        assert.ok(geometry.dockBottom <= viewport.height - 12, 'top clearance must preserve viewport bounds');
        assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'top clearance must not create horizontal overflow');
      }
    } finally {
      await instance.close();
    }
  });
}

test('Search filter respects every persisted dock edge in expanded and minimized states', async () => {
  const instance = await context({ width: 390, height: 900 });
  const page = await instance.newPage();
  try {
    for (const state of TERMINAL_DOCK_STATES) {
      await page.goto(`${origin}/backerdemo.html`);
      await page.evaluate((value) => localStorage.setItem('backer_shared_dock_v1', JSON.stringify(value)), state);
      await page.reload();
      await page.goto(`${origin}/backerdemo.html#search`);
      await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
      await waitForDock(page);
      const layout = await page.evaluate(() => {
        const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
        const filters = document.querySelector('.sx-plat-filter').getBoundingClientRect();
        return {
          edge: document.querySelector('.backer-float-dock').dataset.edge,
          minimized: document.querySelector('.backer-float-dock').classList.contains('is-minimized'),
          overlaps: dock.left < filters.right - 1 && dock.right > filters.left + 1
            && dock.top < filters.bottom - 1 && dock.bottom > filters.top + 1,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth
        };
      });
      assert.equal(layout.edge, state.edge);
      assert.equal(layout.minimized, state.minimized);
      assert.equal(layout.overlaps, false, `${state.edge}/${state.minimized}: filters must clear dock`);
      assert.ok(layout.scrollWidth <= layout.innerWidth + 1);
    }
  } finally {
    await instance.close();
  }
});

test('homepage form and suggestion pill enter canonical Search with exact retained actions', async () => {
  assert.ok(SEARCH_ELIGIBLE_PROFILE && SEARCH_INELIGIBLE_PROFILE);
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`);
    await page.locator('#heroSearchInput').fill(SEARCH_ELIGIBLE_PROFILE.name);
    await page.locator('#heroSearchInput').press('Enter');
    const eligibleCard = page.locator(`[data-search-subject="${SEARCH_ELIGIBLE_PROFILE.id}"]`);
    await eligibleCard.waitFor({ state: 'visible' });
    assert.equal(await page.locator('#sxInput').inputValue(), SEARCH_ELIGIBLE_PROFILE.name);
    assert.equal(await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1] || '').get('q')), SEARCH_ELIGIBLE_PROFILE.name);
    assert.equal(
      await eligibleCard.locator('[data-search-action="discovery"]').getAttribute('href'),
      `backerdemo.html#market2?view=radar&person=${SEARCH_ELIGIBLE_PROFILE.creatorId}`
    );
    assert.equal(
      await eligibleCard.locator('[data-search-action="trade"]').getAttribute('href'),
      `backerdemo.html#trades?view=profiles&subject=${SEARCH_ELIGIBLE_PROFILE.id}`
    );
    assert.equal(await eligibleCard.locator('[data-search-action="source"]').getAttribute('href'), SEARCH_ELIGIBLE_PROFILE.sourceUrl);

    await page.locator('#sxInput').fill(SEARCH_INELIGIBLE_PROFILE.name);
    await page.locator('#sxInput').press('Enter');
    const ineligibleCard = page.locator(`[data-search-subject="${SEARCH_INELIGIBLE_PROFILE.id}"]`);
    await ineligibleCard.waitFor({ state: 'visible' });
    assert.equal(await ineligibleCard.locator('[data-search-action="trade"]').count(), 0, 'ineligible exact ID must not receive a fallback Trades route');
    assert.equal(
      await ineligibleCard.locator('[data-search-action="discovery"]').getAttribute('href'),
      `backerdemo.html#market2?view=radar&person=${SEARCH_INELIGIBLE_PROFILE.creatorId}`
    );

    await page.goto(`${origin}/backerdemo.html`);
    const pill = page.locator('#market2HeroPills button[data-q]').first();
    const pillQuery = await pill.getAttribute('data-q');
    await pill.click();
    await page.waitForSelector('.search-view.sx', { state: 'visible' });
    assert.match(await page.evaluate(() => location.hash), /^#search\?q=/);
    assert.equal(await page.locator('#sxInput').inputValue(), pillQuery);
    assert.equal(await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1] || '').get('q')), pillQuery);
  } finally {
    await instance.close();
  }
});

test('missing Search asset shows an honest error and never substitutes fixture results', async () => {
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  try {
    await page.route('**/js/search-engine.js*', (route) => route.abort());
    await page.goto(`${origin}/backerdemo.html#search?q=Ali%20Abdaal`);
    await page.waitForSelector('[data-search-state="asset-error"]', { state: 'visible' });
    assert.match(await page.locator('[data-search-state="asset-error"]').innerText(), /retained Discovery search asset is unavailable/i);
    assert.match(await page.locator('[data-search-state="asset-error"]').innerText(), /No fallback profiles, works, or metrics were substituted/i);
    assert.equal(await page.locator('.sxr-card, .creator-card, [data-search-subject]').count(), 0);
    assert.equal(await page.locator('.market2-shell, .mkt').count(), 0);
  } finally {
    await instance.close();
  }
});

test('historical Market2 Search bookmark migrates on cold load and hashchange without redirecting other focus values', async () => {
  const coldInstance = await context({ width: 1000, height: 820 });
  const coldPage = await coldInstance.newPage();
  try {
    await coldPage.goto(`${origin}/backerdemo.html#market2?focus=search&q=Ali%20Abdaal`);
    await coldPage.waitForFunction(() => location.hash === '#search?q=Ali+Abdaal');
    await coldPage.waitForSelector('.search-view.sx', { state: 'visible' });
    assert.equal(await coldPage.locator('#sxInput').inputValue(), 'Ali Abdaal');
    assert.equal(await coldPage.locator('.market2-shell').count(), 0);
  } finally {
    await coldInstance.close();
  }

  const hashInstance = await context({ width: 1000, height: 820 });
  const page = await hashInstance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html`);
    await page.evaluate(() => { location.hash = '#market2?focus=search&q=GitHub%20developers'; });
    await page.waitForFunction(() => location.hash === '#search?q=GitHub+developers');
    await page.waitForSelector('.search-view.sx', { state: 'visible' });
    assert.equal(await page.locator('#sxInput').inputValue(), 'GitHub developers');
    assert.equal(await page.locator('.market2-shell').count(), 0);

    await page.evaluate(() => { location.hash = '#market2?focus=profiles&q=Ali%20Abdaal'; });
    await page.waitForSelector('.market2-shell', { state: 'visible' });
    assert.match(await page.evaluate(() => location.hash), /^#market2(?:\?|$)/);
    assert.equal(await page.locator('.search-view.sx').count(), 0);
  } finally {
    await hashInstance.close();
  }
});

test('canonical and legacy marketplace hashes all render the public Trades interface', async () => {
  const instance = await context();
  const page = await instance.newPage();
  try {
    for (const hash of ['#trades', '#market', '#market-archive']) {
      await page.goto(`${origin}/backerdemo.html${hash}`);
      await page.waitForSelector('.mkt-header h1', { state: 'visible' });
      assert.equal(await page.locator('.mkt-header h1').innerText(), 'Trade future growth in people and work', `${hash} should render Trades`);
      assert.equal(await page.locator('.backer-dock-trades').getAttribute('aria-current'), 'page', `${hash} should mark Trades active`);
      assert.equal(await page.locator('.mkt-paper-status').count(), 1, `${hash} should show one compact paper-market status`);
      assert.equal((await page.locator('.mkt-paper-status').innerText()).trim(), 'Paper market · modeled quotes');
      assert.equal(await page.locator('.mkt-disclosure').count(), 0, `${hash} should not restore the abandoned full-width demo disclosure`);
      assert.match(await page.locator('.mkt-catalog-line').innerText(), /\$10,000(?:\.00)?\s+paper cash[\s\S]*26\s+profiles[\s\S]*43\s+works/i);
      assert.doesNotMatch(await page.locator('.mkt').innerText(), /Ada Maker|Marcus Stillwater|BACKER_MKT|Demo simulations/i);
    }
  } finally {
    await instance.close();
  }
});

test('dock drag, minimize, restore, and persisted state survive navigation to a secondary page', async () => {
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades`);
    await waitForDock(page);

    const handle = page.locator('.backer-dock-move');
    const box = await handle.boundingBox();
    assert.ok(box, 'drag handle must be measurable');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(986, 360, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').dataset.edge === 'right');
    assert.equal((await persistedDock(page)).edge, 'right');

    await page.goto(`${origin}/research.html`);
    await waitForDock(page);
    assert.equal(await page.locator('.backer-float-dock').getAttribute('data-edge'), 'right', 'dragged edge should persist on a secondary page');
    assert.equal(await page.locator('.backer-float-dock').getAttribute('data-orientation'), 'vertical');

    await page.locator('.backer-dock-minimize').click();
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    assert.equal((await persistedDock(page)).minimized, true);

    await page.goto(`${origin}/backerdemo.html#trades`);
    await waitForDock(page);
    assert.equal(await page.locator('.backer-float-dock').getAttribute('class').then((value) => value.includes('is-minimized')), true, 'minimized state should persist back to the primary page');
    await page.locator('.backer-dock-restore').click();
    await page.waitForFunction(() => !document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    assert.equal((await persistedDock(page)).minimized, false);
  } finally {
    await instance.close();
  }
});

for (const viewport of VIEWPORTS) {
  test(`minimized dock orb drags without expanding and persists on Home/Search at ${viewport.width}px`, async () => {
    const instance = await context(viewport);
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html`);
      await waitForDock(page);
      await page.locator('.backer-dock-minimize').click();
      await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
      const orb = page.locator('.backer-dock-restore');
      const box = await orb.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(viewport.width - 16, Math.round(viewport.height * 0.42), { steps: 10 });
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.backer-float-dock').dataset.edge === 'right');
      assert.equal(await page.locator('.backer-float-dock').evaluate((node) => node.classList.contains('is-minimized')), true, 'drag must not restore the dock');
      assert.equal((await persistedDock(page)).minimized, true);

      await page.goto(`${origin}/backerdemo.html#search`);
      await page.waitForSelector('.search-view.sx', { state: 'visible' });
      await waitForDock(page);
      assert.equal(await page.locator('.backer-float-dock').getAttribute('data-edge'), 'right');
      assert.equal(await page.locator('.backer-float-dock').evaluate((node) => node.classList.contains('is-minimized')), true);
      let bounds = await page.locator('.backer-float-dock').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);

      const searchOrbBox = await page.locator('.backer-dock-restore').boundingBox();
      await page.mouse.move(searchOrbBox.x + searchOrbBox.width / 2, searchOrbBox.y + searchOrbBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(16, Math.round(viewport.height * 0.62), { steps: 10 });
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.backer-float-dock').dataset.edge === 'left');
      assert.equal(await page.locator('.backer-float-dock').evaluate((node) => node.classList.contains('is-minimized')), true);
      await page.reload();
      await page.waitForSelector('.search-view.sx', { state: 'visible' });
      await waitForDock(page);
      assert.equal(await page.locator('.backer-float-dock').getAttribute('data-edge'), 'left');
      assert.equal(await page.locator('.backer-float-dock').evaluate((node) => node.classList.contains('is-minimized')), true);
      bounds = await page.locator('.backer-float-dock').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);
      await page.locator('.backer-dock-restore').click();
      await page.waitForFunction(() => !document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    } finally {
      await instance.close();
    }
  });
}

test('minimized dock orb accepts touch-pointer drag without accidental restore', async () => {
  const instance = await context({ width: 390, height: 900 });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#search`);
    await waitForDock(page);
    await page.locator('.backer-dock-minimize').click();
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    await page.locator('.backer-dock-restore').evaluate((control) => {
      const box = control.getBoundingClientRect();
      const dispatch = (type, x, y) => control.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 73,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y
      }));
      dispatch('pointerdown', box.left + box.width / 2, box.top + box.height / 2);
      dispatch('pointermove', 18, 410);
      dispatch('pointerup', 18, 410);
    });
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').dataset.edge === 'left');
    assert.equal(await page.locator('.backer-float-dock').evaluate((node) => node.classList.contains('is-minimized')), true);
    assert.equal((await persistedDock(page)).edge, 'left');
  } finally {
    await instance.close();
  }
});

test('dock is fully keyboard-operable on the primary and secondary pages', async () => {
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades`);
    await waitForDock(page);
    await page.locator('.backer-dock-move').focus();
    await page.keyboard.press('Shift+ArrowLeft');
    assert.equal(await page.locator('.backer-float-dock').getAttribute('data-edge'), 'left');
    assert.equal((await persistedDock(page)).edge, 'left');

    await page.locator('.backer-dock-search').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-route')), 'discovery', 'arrow keys should rove between dock routes');

    await page.goto(`${origin}/research.html`);
    await waitForDock(page);
    await page.locator('.backer-dock-move').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('.backer-float-dock').getAttribute('data-edge'), 'bottom');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    await page.waitForFunction(() => document.activeElement && document.activeElement.classList.contains('backer-dock-restore'));
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('backer-dock-restore')), true, 'minimizing should move focus to restore');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
    await page.waitForFunction(() => document.activeElement && document.activeElement.classList.contains('backer-dock-move'));
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('backer-dock-move')), true, 'restoring should return focus to the move handle');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-minimized'));
  } finally {
    await instance.close();
  }
});

test('dock yields to a scrolled mobile roster action and returns after the dialog closes', async () => {
  const instance = await context({ width: 390, height: 900 });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#market2`);
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-m2-open-roster]');
      return button && /Browse all\s+(?:[1-9]\d{2,})/.test(button.textContent || '');
    });
    await waitForDock(page);
    await page.locator('[data-m2-open-roster]').click();
    await page.waitForSelector('[data-m2-more-roster]', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.backer-float-dock').classList.contains('is-yielding-to-modal'));
    assert.equal(await page.locator('.backer-float-dock').getAttribute('inert'), '', 'an exclusive dialog should make background navigation inert');

    const before = await page.locator('.m2-mobile-roster .m2-person-row').count();
    assert.equal(before, 40);
    await page.locator('[data-m2-more-roster]').click();
    assert.equal(await page.locator('.m2-mobile-roster .m2-person-row').count(), 80, 'the dock must not intercept a roster action scrolled into view');

    await page.locator('[data-m2-close-roster]').click();
    await page.waitForFunction(() => !document.querySelector('.backer-float-dock').classList.contains('is-yielding-to-modal'));
    assert.equal(await page.locator('.backer-float-dock').getAttribute('inert'), null, 'dock interaction should return when the dialog closes');
    await page.locator('.backer-dock-discovery').focus();
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-route')), 'discovery');
  } finally {
    await instance.close();
  }
});

for (const viewport of TERMINAL_VIEWPORTS) {
  test(`fixture and proposal terminals preserve a usable dock gutter at ${viewport.width}px`, async () => {
    const instance = await context(viewport);
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html`);
      await seedTerminalProposal(page);
      const routes = [
        { href: `${origin}/backermarket.html?market=kai&source=trades`, proposal: false, label: 'fixture' },
        { href: `${origin}/backermarket.html?draft=${TERMINAL_PROPOSAL_ID}&source=trades`, proposal: true, label: 'proposal' }
      ];

      for (const route of routes) {
        await page.goto(route.href);
        await waitForStandaloneTerminal(page, route.proposal);
        if (!route.proposal) await assertStandaloneTerminalLegibility(page, `${viewport.width}px fixture`);
        for (const state of TERMINAL_DOCK_STATES) {
          await page.evaluate((value) => localStorage.setItem('backer_shared_dock_v1', JSON.stringify(value)), state);
          await page.reload();
          await waitForStandaloneTerminal(page, route.proposal);
          await assertStandaloneTerminalDock(page, state, `${viewport.width}px ${route.label} ${state.edge}${state.minimized ? ' minimized' : ''}`, route.proposal);
        }
      }

      await page.evaluate(() => localStorage.setItem('backer_shared_dock_v1', JSON.stringify({ edge: 'bottom', crossAxisRatio: 0.5, minimized: false })));
      await page.goto(`${origin}/backermarket.html?market=kai&source=trades`);
      await waitForStandaloneTerminal(page, false);
      await page.locator('[data-order]').click();
      await page.waitForSelector('.pt-evcard.show [data-order-ack]', { state: 'visible' });
      assert.equal(await page.locator('[data-confirm-order]').isDisabled(), true, 'order review must still require explicit acknowledgement');
      await page.locator('[data-order-ack]').check();
      assert.equal(await page.locator('[data-confirm-order]').isEnabled(), true, 'approved fixture order review must remain operable beside the dock');
      await page.locator('[data-evx]').click();
      await page.waitForSelector('.pt-evcard.show', { state: 'hidden' });
    } finally {
      await instance.close();
    }
  });
}

for (const viewport of VIEWPORTS) {
  test(`Trades and a secondary page stay in-bounds without dock/action overlap at ${viewport.width}px`, async () => {
    const instance = await context(viewport);
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html#trades`);
      await page.waitForSelector('.mkt-header h1', { state: 'visible' });
      await waitForDock(page);
      await assertViewportContract(page, `Trades ${viewport.width}px`);

      await page.goto(`${origin}/research.html`);
      await page.waitForSelector('main, #app', { state: 'visible' });
      await waitForDock(page);
      await assertViewportContract(page, `Research ${viewport.width}px`);
    } finally {
      await instance.close();
    }
  });
}
