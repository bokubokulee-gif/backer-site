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
const SEARCH_SEAM_VIEWPORTS = [
  { width: 408, height: 688 },
  { width: 1440, height: 1000 }
];
const TERMINAL_PROPOSAL_ID = 'dock_proposal_123';
const SEARCH_CATALOG = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data/discovery-catalog.json'), 'utf8'));
const SEARCH_INDEX = SearchEngine.__test.buildIndex(SEARCH_CATALOG);
const SEARCH_REVIEW_REGISTRY = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data/trades-eligible-accounts.json'), 'utf8'));
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

async function context(viewport = { width: 1000, height: 800 }, reducedMotion = 'reduce') {
  const instance = await browser.newContext({ viewport, reducedMotion });
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
        icons: Array.from(document.querySelectorAll('.sx-app-icon'), (node) => getComputedStyle(node).animationName),
        platforms: Array.from(document.querySelectorAll('.sx-orbit-node'), (node) => node.dataset.platform),
        ringCounts: Array.from(document.querySelectorAll('.sx-orbit-ring'), (node) => node.querySelectorAll('.sx-orbit-node').length)
      }));
      assert.deepEqual(reducedAnimations.rings, ['none', 'none', 'none'], 'reduced motion must stop every orbit ring');
      assert.equal(reducedAnimations.icons.length, 5);
      assert.deepEqual(reducedAnimations.ringCounts, [2, 2, 1], 'five nodes should be balanced across three orbit depths');
      assert.equal(new Set(reducedAnimations.platforms).size, 5, 'each social platform should appear once, not once per ring');
      assert.ok(reducedAnimations.icons.every((name) => name === 'none'), 'reduced motion must stop every counter-orbit icon');
      if (route === '') {
        const reducedPrompts = await page.evaluate(() => ({
          animation: getComputedStyle(document.querySelector('.search-ex-track')).animationName,
          overflow: getComputedStyle(document.querySelector('.search-ex')).overflowX,
          duplicateDisplay: getComputedStyle(document.querySelector('.search-ex-track .pills-group[aria-hidden="true"]')).display,
          primaryTags: document.querySelectorAll('.search-ex-track .pills-group:not([aria-hidden]) [data-ex]').length
        }));
        assert.equal(reducedPrompts.animation, 'none', 'reduced motion must stop the rotating prompt rail');
        assert.equal(reducedPrompts.overflow, 'auto', 'reduced motion must leave prompts directly scrollable');
        assert.equal(reducedPrompts.duplicateDisplay, 'none', 'reduced motion should hide the visual duplicate group');
        assert.ok(reducedPrompts.primaryTags >= 12);
      }
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

test('Search orbit runs normally while reduced-motion contexts stop every ring and icon', async () => {
  const instance = await context({ width: 1000, height: 820 }, 'no-preference');
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#search`);
    await page.waitForSelector('.sx-orbit-node', { state: 'visible' });
    const motion = await page.evaluate(() => ({
      rings: Array.from(document.querySelectorAll('.sx-orbit-ring'), (node) => ({
        name: getComputedStyle(node).animationName,
        state: getComputedStyle(node).animationPlayState
      })),
      icons: Array.from(document.querySelectorAll('.sx-app-icon'), (node) => ({
        name: getComputedStyle(node).animationName,
        state: getComputedStyle(node).animationPlayState
      }))
    }));
    assert.equal(motion.rings.length, 3);
    assert.equal(motion.icons.length, 5);
    assert.ok(motion.rings.every((item) => item.name !== 'none' && item.state === 'running'), `rings must be active: ${JSON.stringify(motion.rings)}`);
    assert.ok(motion.icons.every((item) => item.name !== 'none' && item.state === 'running'), `icons must counter-orbit: ${JSON.stringify(motion.icons)}`);
  } finally {
    await instance.close();
  }
});

test('Search rotates a broad prompt rail and expands Profiles and Contents independently at 489x688', async () => {
  const instance = await context({ width: 489, height: 688 }, 'no-preference');
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#search`);
    await page.waitForSelector('.search-ex-track .pills-group:not([aria-hidden]) [data-ex]', { state: 'visible' });
    const firstPrompt = page.locator('.search-ex-track .pills-group:not([aria-hidden]) [data-ex]').first();
    const promptQuery = await firstPrompt.getAttribute('data-ex');
    await page.locator('.search-ex').hover();
    await firstPrompt.click();
    await page.waitForSelector('.sxr-card', { state: 'visible', timeout: 20000 });
    assert.equal(await page.locator('#sxInput').inputValue(), promptQuery, 'rotating prompts must remain working Search actions');
    assert.equal(await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1] || '').get('q')), promptQuery);

    await page.locator('#sxInput').fill('show me all');
    await page.locator('#sxInput').press('Enter');
    await page.waitForSelector('[data-sxr-more="profiles"]', { state: 'visible', timeout: 20000 });
    await page.waitForSelector('[data-sxr-more="works"]', { state: 'visible', timeout: 20000 });

    const initial = await page.evaluate(() => {
      const track = document.querySelector('.search-ex-track');
      const primary = document.querySelector('.search-ex-track .pills-group:not([aria-hidden])');
      const duplicate = document.querySelector('.search-ex-track .pills-group[aria-hidden="true"]');
      const profileMore = document.querySelector('[data-sxr-more="profiles"]');
      const workMore = document.querySelector('[data-sxr-more="works"]');
      return {
        title: document.querySelector('.sx-hero-title-sub').textContent.trim(),
        ariaTitle: document.querySelector('.search-hero h1').getAttribute('aria-label'),
        groups: document.querySelectorAll('.search-ex-track .pills-group').length,
        primaryTags: primary ? primary.querySelectorAll('[data-ex]').length : 0,
        duplicateTags: duplicate ? duplicate.querySelectorAll('[data-ex]').length : 0,
        promptLabels: primary ? Array.from(primary.querySelectorAll('[data-ex]'), (node) => node.textContent.trim()) : [],
        groupWidths: primary && duplicate ? [primary.getBoundingClientRect().width, duplicate.getBoundingClientRect().width] : [],
        trackAnimation: track ? getComputedStyle(track).animationName : 'none',
        profileCards: document.querySelectorAll('[data-search-kind="profile"]').length,
        workCards: document.querySelectorAll('[data-search-kind="work"]').length,
        profileControls: profileMore ? profileMore.getAttribute('aria-controls') : '',
        workControls: workMore ? workMore.getAttribute('aria-controls') : '',
        profileHeight: profileMore ? profileMore.getBoundingClientRect().height : 0,
        workHeight: workMore ? workMore.getBoundingClientRect().height : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth
      };
    });
    assert.equal(initial.title, 'Profile Discovery Agent');
    assert.equal(initial.ariaTitle, 'Backer AI Profile Discovery Agent');
    assert.equal(initial.groups, 2, 'the prompt rail needs a primary and duplicate group for a continuous loop');
    assert.ok(initial.primaryTags >= 12, `expected a broad prompt set: ${JSON.stringify(initial)}`);
    assert.equal(initial.duplicateTags, initial.primaryTags);
    assert.equal(new Set(initial.promptLabels).size, initial.primaryTags, 'visible prompt labels must be unique');
    assert.ok(Math.abs(initial.groupWidths[0] - initial.groupWidths[1]) < 1, `marquee halves must match: ${JSON.stringify(initial.groupWidths)}`);
    assert.notEqual(initial.trackAnimation, 'none', 'the prompt rail should rotate when motion is allowed');
    assert.equal(initial.profileCards, SearchEngine.__test.RESULT_LIMIT);
    assert.equal(initial.workCards, SearchEngine.__test.RESULT_LIMIT);
    assert.equal(initial.profileControls, 'sxr-grid-profiles');
    assert.equal(initial.workControls, 'sxr-grid-works');
    assert.ok(initial.profileHeight >= 44 && initial.workHeight >= 44, 'More controls need mobile touch height');
    assert.ok(initial.scrollWidth <= initial.innerWidth + 1, 'the larger prompt set must not widen the page');
    assert.match(await page.locator('.sxr-provenance').innerText(), /^\d[\d,]* source-linked profiles · \d[\d,]* original works up to date$/);
    assert.doesNotMatch(await page.locator('.sxr-provenance').innerText(), /snapshot|Aug \d/i);

    const broadResult = SearchEngine.__test.searchIndex(SEARCH_INDEX, 'show me all', new Set(SEARCH_INDEX.providers));
    const expectedProfiles = broadResult.profiles.slice(0, SearchEngine.__test.RESULT_LIMIT * 2).map((row) => row.id);
    const expectedWorks = broadResult.works.slice(0, SearchEngine.__test.RESULT_LIMIT * 2).map((row) => row.id);
    const broadHash = await page.evaluate(() => location.hash);
    await page.locator('[data-sxr-more="profiles"]').click();
    await page.waitForFunction((limit) => document.querySelectorAll('[data-search-kind="profile"]').length === limit * 2, SearchEngine.__test.RESULT_LIMIT);
    assert.equal(await page.locator('[data-search-kind="work"]').count(), SearchEngine.__test.RESULT_LIMIT,
      'expanding Profiles must not expand Contents');
    assert.match(await page.locator('[data-sxr-progress="profiles"]').innerText(), /showing 24/);
    assert.equal(await page.evaluate(() => location.hash), broadHash, 'More must not mutate the canonical query');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.searchSubject), expectedProfiles[SearchEngine.__test.RESULT_LIMIT],
      'keyboard focus must move to the first newly revealed Profile');
    assert.match(await page.locator('.sx-announce').innerText(), /12 more profiles shown\. 24 of/);

    await page.locator('[data-sxr-more="works"]').click();
    await page.waitForFunction((limit) => document.querySelectorAll('[data-search-kind="work"]').length === limit * 2, SearchEngine.__test.RESULT_LIMIT);
    assert.equal(await page.locator('[data-search-kind="profile"]').count(), SearchEngine.__test.RESULT_LIMIT * 2,
      'expanding Contents must preserve the expanded Profiles section');
    assert.match(await page.locator('[data-sxr-progress="works"]').innerText(), /showing 24/);
    const expandedIds = await page.evaluate(() => ({
      profiles: Array.from(document.querySelectorAll('[data-search-kind="profile"]'), (node) => node.dataset.searchSubject),
      works: Array.from(document.querySelectorAll('[data-search-kind="work"]'), (node) => node.dataset.searchSubject)
    }));
    assert.deepEqual(expandedIds.profiles, expectedProfiles, 'expanded Profiles must preserve exact ranked order without duplicates');
    assert.deepEqual(expandedIds.works, expectedWorks, 'expanded Contents must preserve exact ranked order without duplicates');
    assert.equal(new Set(expandedIds.profiles).size, expandedIds.profiles.length);
    assert.equal(new Set(expandedIds.works).size, expandedIds.works.length);

    await page.locator('#sxInput').press('Enter');
    await page.waitForFunction((limit) => document.querySelectorAll('[data-search-kind="profile"]').length === limit
      && document.querySelectorAll('[data-search-kind="work"]').length === limit, SearchEngine.__test.RESULT_LIMIT);
    assert.equal(await page.locator('[data-sxr-more="profiles"]').getAttribute('data-sxr-visible'), String(SearchEngine.__test.RESULT_LIMIT));
    assert.equal(await page.locator('[data-sxr-more="works"]').getAttribute('data-sxr-visible'), String(SearchEngine.__test.RESULT_LIMIT));
  } finally {
    await instance.close();
  }
});

for (const viewport of SEARCH_SEAM_VIEWPORTS) {
  test(`Search orbit shares the page canvas without a rectangular panel at ${viewport.width}x${viewport.height}`, async () => {
    const instance = await context(viewport);
    await instance.addInitScript(() => {
      localStorage.setItem('backer_shared_dock_v1', JSON.stringify({ edge: 'bottom', crossAxisRatio: 0.5, minimized: false }));
    });
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html#search`);
      await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
      await waitForDock(page);
      const layout = await page.evaluate(() => {
        const rect = (node) => {
          const value = node.getBoundingClientRect();
          return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
        };
        const app = document.querySelector('#app');
        const view = document.querySelector('.search-view.sx');
        const stage = document.querySelector('.sx-hero-stage');
        const rail = document.querySelector('.sx-plat-filter');
        const dock = document.querySelector('.backer-float-dock');
        const appStyle = getComputedStyle(app);
        const viewStyle = getComputedStyle(view);
        const bgStyle = getComputedStyle(document.querySelector('#bg'));
        const railStyle = getComputedStyle(rail);
        const railRect = rect(rail);
        const dockRect = rect(dock);
        return {
          bodyClass: document.body.classList.contains('search-full'),
          appBackground: appStyle.backgroundColor,
          appMaxWidth: appStyle.maxWidth,
          viewBackground: viewStyle.backgroundColor,
          bgDisplay: bgStyle.display,
          app: rect(app),
          view: rect(view),
          stage: rect(stage),
          railOverflow: railStyle.overflowX,
          railWrap: railStyle.flexWrap,
          railScrollable: rail.scrollWidth > rail.clientWidth + 1,
          railDockOverlap: railRect.left < dockRect.right - 1 && railRect.right > dockRect.left + 1
            && railRect.top < dockRect.bottom - 1 && railRect.bottom > dockRect.top + 1,
          railBottom: railRect.bottom,
          dockTop: dockRect.top,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth
        };
      });
      assert.equal(layout.bodyClass, true, 'Search must own the body-level full-canvas state');
      assert.equal(layout.appBackground, 'rgba(0, 0, 0, 0)', 'the app shell must not paint an inset panel');
      assert.equal(layout.appMaxWidth, 'none', 'Search must escape the standard capped app shell');
      assert.equal(layout.viewBackground, 'rgba(0, 0, 0, 0)', 'the route surface must reveal the common dotted background');
      assert.notEqual(layout.bgDisplay, 'none', 'the shared background texture must stay rendered');
      assert.ok(layout.app.width >= layout.innerWidth - 1, `app must span the viewport: ${JSON.stringify(layout)}`);
      assert.ok(layout.view.left >= -1 && layout.view.right <= layout.innerWidth + 1, `view must align to the viewport: ${JSON.stringify(layout)}`);
      assert.ok(layout.stage.left >= -1 && layout.stage.right <= layout.innerWidth + 1, `orbit stage must align to the viewport: ${JSON.stringify(layout)}`);
      assert.equal(layout.railDockOverlap, false, `short Search controls must clear the expanded dock: ${JSON.stringify(layout)}`);
      assert.ok(layout.railBottom <= layout.dockTop - 11, `Search needs a readable dock gap: ${JSON.stringify(layout)}`);
      assert.ok(layout.scrollWidth <= layout.innerWidth + 1, `Search must not overflow horizontally: ${JSON.stringify(layout)}`);
      if (viewport.width <= 560) {
        assert.equal(layout.railOverflow, 'auto', 'mobile sources must be directly horizontally scrollable');
        assert.equal(layout.railWrap, 'nowrap');
        assert.equal(layout.railScrollable, true, 'the mobile source rail should expose additional retained providers');
      }
    } finally {
      await instance.close();
    }
  });
}

test('Search honors light theme and keeps result metadata human-readable on mobile', async () => {
  const instance = await context({ width: 320, height: 900 });
  await instance.addInitScript(() => localStorage.setItem('backer_theme_v1', 'light'));
  const page = await instance.newPage();
  try {
    const query = SEARCH_ELIGIBLE_PROFILE?.name || SEARCH_INDEX.profiles[0].name;
    await page.goto(`${origin}/backerdemo.html#search?q=${encodeURIComponent(query)}`);
    await page.waitForSelector('.sxr-card', { state: 'visible', timeout: 20000 });
    const rendering = await page.evaluate(() => {
      const rgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = (value) => {
        const [r, g, b] = rgb(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (a, b) => {
        const high = Math.max(luminance(a), luminance(b));
        const low = Math.min(luminance(a), luminance(b));
        return (high + 0.05) / (low + 0.05);
      };
      const view = document.querySelector('.search-view.sx');
      const bodyStyle = getComputedStyle(document.body);
      const appStyle = getComputedStyle(document.querySelector('#app'));
      const bgStyle = getComputedStyle(document.querySelector('#bg'));
      const card = document.querySelector('.sxr-card');
      const metadata = ['.sxr-provider', '.sxr-date', '.sxr-metric>span'].map((selector) => {
        const node = document.querySelector(selector);
        return { selector, fontSize: Number.parseFloat(getComputedStyle(node).fontSize), color: getComputedStyle(node).color };
      });
      const viewStyle = getComputedStyle(view);
      const cardStyle = getComputedStyle(card);
      return {
        theme: document.documentElement.dataset.theme,
        searchBody: document.body.classList.contains('search-full'),
        bodyBackground: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        bodyContrast: contrast(bodyStyle.color, bodyStyle.backgroundColor),
        appBackground: appStyle.backgroundColor,
        viewBackground: viewStyle.backgroundColor,
        viewColor: viewStyle.color,
        cardBackground: cardStyle.backgroundColor,
        cardColor: cardStyle.color,
        bgDisplay: bgStyle.display,
        bgOpacity: Number.parseFloat(bgStyle.opacity),
        bgFilter: bgStyle.filter,
        bgBlend: bgStyle.mixBlendMode,
        inputFont: Number.parseFloat(getComputedStyle(document.querySelector('#sxInput')).fontSize),
        ledeFont: Number.parseFloat(getComputedStyle(document.querySelector('.sx-lede')).fontSize),
        metadata,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth
      };
    });
    assert.equal(rendering.theme, 'light');
    assert.equal(rendering.searchBody, true, 'light Search theme must be owned by the route body');
    assert.equal(rendering.bodyBackground, 'rgb(243, 239, 229)', 'light Search must paint its warm page canvas on the body');
    assert.ok(rendering.bodyContrast >= 7, `Search light text contrast should be strong, got ${rendering.bodyContrast}`);
    assert.equal(rendering.appBackground, 'rgba(0, 0, 0, 0)');
    assert.equal(rendering.viewBackground, 'rgba(0, 0, 0, 0)', 'Search must not place another canvas over the shared background');
    assert.notEqual(rendering.bgDisplay, 'none', 'light Search must retain the page texture');
    assert.ok(rendering.bgOpacity > 0, 'light Search texture must remain perceptible');
    assert.match(rendering.bgFilter, /invert\(1\)/, 'light Search should invert the common background shader');
    assert.equal(rendering.bgBlend, 'multiply', 'light Search texture should integrate with the body canvas');
    assert.ok(rendering.inputFont >= 16, 'mobile natural-language input must stay readable and avoid browser zoom');
    assert.ok(rendering.ledeFont >= 14, 'mobile Search support copy must stay at least 14px');
    assert.ok(rendering.metadata.every((item) => item.fontSize >= 12), `result metadata must be at least 12px: ${JSON.stringify(rendering.metadata)}`);
    assert.ok(rendering.scrollWidth <= rendering.innerWidth + 1, 'light mobile Search must not overflow horizontally');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 360);
    });
    await page.waitForFunction(() => {
      const node = document.querySelector('.nav');
      return node?.classList.contains('scrolled') && getComputedStyle(node).backgroundColor.startsWith('rgba(243, 239, 229');
    });
    const scrolledHeader = await page.evaluate(() => {
      const node = document.querySelector('.nav');
      const nav = getComputedStyle(node);
      const brand = getComputedStyle(document.querySelector('.brand-word'));
      return { className: node.className, scrollY, background: nav.backgroundColor, brandColor: brand.color };
    });
    assert.match(scrolledHeader.background, /rgba?\(243, 239, 229/, `light Search scrolled header must stay warm: ${JSON.stringify(scrolledHeader)}`);
    assert.equal(scrolledHeader.brandColor, 'rgb(29, 26, 22)', 'light Search brand text must remain dark and readable after scroll');
  } finally {
    await instance.close();
  }
});

test('Search, Discovery, and Trades share one retained catalog load per page session', async () => {
  const instance = await context({ width: 1000, height: 820 });
  const page = await instance.newPage();
  const requests = { catalog: 0, eligibility: 0 };
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/data/discovery-catalog.json')) requests.catalog += 1;
    if (pathname.endsWith('/data/trades-eligible-accounts.json')) requests.eligibility += 1;
  });
  try {
    await page.goto(`${origin}/backerdemo.html`);
    await waitForDock(page);

    await page.locator('.backer-dock-search').click();
    await page.waitForSelector('#sxProviderFilters [data-plat]', { state: 'visible' });
    await page.waitForFunction(() => window.BackerSearch && window.BackerTradeCatalog);

    await page.locator('.backer-dock-discovery').click();
    await page.waitForSelector('.market2-shell', { state: 'visible' });
    await page.waitForFunction(() => document.querySelectorAll('.m2-profile-card').length > 0);

    await page.locator('.backer-dock-trades').click();
    await page.waitForSelector('.mkt-catalog-card', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.mkt-catalog-line') && /1,\d{3}/.test(document.querySelector('.mkt-catalog-line').textContent));

    assert.deepEqual(requests, { catalog: 1, eligibility: 1 }, 'hash-route projections must reuse the same retained source promises');
    assert.equal(await page.evaluate(() => Object.keys(window.__backerRetainedSourcePromises || {}).length), 2);
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
      assert.equal(geometry.overlaps, false, `retained-source filters must clear the expanded dock: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.filterBottom <= geometry.dockTop - 12, `Search should retain a readable gap above the bottom dock: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'dock clearance must not create horizontal overflow');
      assert.deepEqual(geometry.rings, ['none', 'none', 'none']);
      assert.equal(geometry.icons.length, 5);
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

test('canonical Trades and the #market alias render the public source-backed Trades interface', async () => {
  const instance = await context();
  const page = await instance.newPage();
  try {
    for (const hash of ['#trades', '#market']) {
      await page.goto(`${origin}/backerdemo.html${hash}`);
      await page.waitForSelector('.mkt-header h1', { state: 'visible' });
      assert.equal(await page.locator('.mkt-header h1').innerText(), 'Trade future growth in creator accounts and work', `${hash} should render Trades`);
      assert.equal(await page.locator('.backer-dock-trades').getAttribute('aria-current'), 'page', `${hash} should mark Trades active`);
      assert.equal(await page.locator('.mkt-paper-status').count(), 1, `${hash} should show one compact paper-market status`);
      assert.equal((await page.locator('.mkt-paper-status').innerText()).trim(), 'Paper market · modeled quotes');
      assert.equal(await page.locator('.mkt-disclosure').count(), 0, `${hash} should not restore the abandoned full-width demo disclosure`);
      const inventory = await page.locator('.mkt-catalog-line').innerText();
      assert.match(inventory, /\$10,000(?:\.00)?\s+paper cash/i);
      assert.match(inventory, new RegExp(`${SEARCH_TRADE_MODEL.people.length.toLocaleString('en-US')}\\s+creator-account markets`, 'i'));
      assert.match(inventory, new RegExp(`${SEARCH_TRADE_MODEL.contents.length.toLocaleString('en-US')}\\s+work markets`, 'i'));
      assert.doesNotMatch(await page.locator('.mkt').innerText(), /Ada Maker|Marcus Stillwater|BACKER_MKT|Demo simulations/i);
    }
  } finally {
    await instance.close();
  }
});

test('the pre-Trades demo market remains independently available at #market-archive', async () => {
  const instance = await context();
  const page = await instance.newPage();
  const requestedPaths = [];
  page.on('request', (request) => {
    try { requestedPaths.push(new URL(request.url()).pathname); } catch (_error) {}
  });
  try {
    await page.goto(`${origin}/backerdemo.html#market-archive`);
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.equal((await page.locator('.mkt-framing h1').innerText()).trim(), 'Live Markets');
    assert.equal(await page.locator('link[data-backer-legacy-market]').count(), 1);
    assert.equal(await page.locator('script[data-backer-legacy-market="view"]').count(), 1);
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/js/market.js')), false, 'the archive must not load the source-backed Trades view');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/data/discovery-catalog.json')), false, 'the archive must not fetch the retained Discovery catalog');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/data/trades-eligible-accounts.json')), false, 'the archive must not fetch the Trades eligibility registry');
    assert.equal(requestedPaths.some((pathname) => pathname.endsWith('/css/market.css')), false, 'the archive must not load Trades styles');
    assert.equal(await page.locator('.mkt-paper-status').count(), 0, 'the archive must not masquerade as Trades');
    assert.match(await page.locator('.mkt-foot').innerText(), /Simulated markets · no real money moves[\s\S]*fixture catalog/i);
    assert.equal(await page.locator('.backer-dock-trades').getAttribute('aria-current'), null, 'the historical archive must not claim to be Trades');
    const archivedMarket = page.locator('[data-market-open]').first();
    assert.equal(await archivedMarket.count(), 1, 'the preserved board must retain its market entry flow');
    await archivedMarket.click();
    await page.waitForURL(/backermarket\.html\?.*source=market-archive/);
    await page.waitForFunction(() => document.body.dataset.returnSource === 'archive');
    assert.equal(await page.locator('.mdp-back').getAttribute('href'), 'backerdemo.html#market-archive');
    assert.match(await page.locator('.mdp-back').innerText(), /Back to archived market/i);
    assert.equal(await page.locator('.backer-dock-trades').getAttribute('aria-current'), null, 'an archived fixture detail must not claim to be Trades');
    await page.waitForSelector('.pt-x[data-close]', { state: 'visible' });
    assert.equal(await page.locator('.pt-x[data-close]').getAttribute('aria-label'), 'Back to archived market');
  } finally {
    await instance.close();
  }
});

test('archived fixture styles and source-backed Trades styles stay isolated across route changes', async () => {
  const instance = await context();
  const page = await instance.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    await page.goto(`${origin}/backerdemo.html#market-archive`);
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    await page.evaluate(() => { location.hash = '#trades'; });
    await page.waitForSelector('.mkt-header h1', { state: 'visible' });
    assert.equal((await page.locator('.mkt-header h1').innerText()).trim(), 'Trade future growth in creator accounts and work');
    assert.deepEqual(await page.evaluate(() => ({
      archiveDisabled: document.querySelector('link[data-backer-legacy-market]').disabled,
      tradesDisabled: document.querySelector('link[data-backer-trades]').disabled
    })), { archiveDisabled: true, tradesDisabled: false });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
    assert.deepEqual(pageErrors, [], 'archive-level key handlers must stay dormant on Trades');
    await page.evaluate(() => { location.hash = '#market-archive'; });
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.deepEqual(await page.evaluate(() => ({
      archiveDisabled: document.querySelector('link[data-backer-legacy-market]').disabled,
      tradesDisabled: document.querySelector('link[data-backer-trades]').disabled
    })), { archiveDisabled: false, tradesDisabled: true });
    await page.evaluate(() => {
      window.__backerGo('market-archive');
      window.__backerGo('trades');
    });
    await page.waitForSelector('.mkt-header h1', { state: 'visible' });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.mkt[data-market-surface="archive"]').count(), 0, 'an earlier archive load must not overwrite the latest Trades route');
    assert.deepEqual(await page.evaluate(() => ({
      archiveDisabled: document.querySelector('link[data-backer-legacy-market]').disabled,
      tradesDisabled: document.querySelector('link[data-backer-trades]').disabled
    })), { archiveDisabled: true, tradesDisabled: false });
  } finally {
    await instance.close();
  }
});

test('a canceled cold archive load cannot append active styles over Discovery', async () => {
  const instance = await context();
  let releaseData;
  let markDataRequested;
  const dataRequested = new Promise((resolve) => { markDataRequested = resolve; });
  const dataReleased = new Promise((resolve) => { releaseData = resolve; });
  await instance.route('**/js/data.js*', async (route) => {
    markDataRequested();
    await dataReleased;
    await route.continue();
  });
  const page = await instance.newPage();
  try {
    const navigation = page.goto(`${origin}/backerdemo.html#market-archive`, { waitUntil: 'domcontentloaded' });
    await dataRequested;
    await page.evaluate(() => { location.hash = '#market2'; });
    await page.waitForSelector('.m2-profile-catalog', { state: 'visible' });
    releaseData();
    await navigation;
    await page.waitForSelector('link[data-backer-legacy-market][data-backer-style-ready="true"]', { state: 'attached' });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.mkt[data-market-surface="archive"]').count(), 0, 'the canceled archive render must stay canceled');
    assert.equal(await page.locator('link[data-backer-legacy-market]').evaluate((link) => link.disabled), true, 'late archive CSS must remain disabled');
    assert.equal(await page.locator('.m2-profile-catalog').count(), 1, 'Discovery must remain the committed route');
  } finally {
    releaseData();
    await instance.close();
  }
});

test('a pending archive transition preserves committed Trades styles until atomic route commit', async () => {
  const instance = await context();
  let releaseArchiveData;
  let markArchiveDataRequested;
  const archiveDataRequested = new Promise((resolve) => { markArchiveDataRequested = resolve; });
  const archiveDataReleased = new Promise((resolve) => { releaseArchiveData = resolve; });
  await instance.route('**/js/market-data.js*', async (route) => {
    markArchiveDataRequested();
    await archiveDataReleased;
    await route.continue();
  });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades`);
    await page.waitForSelector('.mkt-header h1', { state: 'visible' });
    const before = await page.locator('.mkt-header h1').evaluate((node) => {
      const style = getComputedStyle(node);
      return { fontSize: style.fontSize, fontWeight: style.fontWeight, paddingTop: getComputedStyle(node.closest('.mkt-header')).paddingTop };
    });
    await page.evaluate(() => { location.hash = '#market-archive'; });
    await archiveDataRequested;
    const pending = await page.evaluate(() => {
      const trades = document.querySelector('link[data-backer-trades]');
      const archive = document.querySelector('link[data-backer-legacy-market]');
      const heading = document.querySelector('.mkt-header h1');
      const style = getComputedStyle(heading);
      return {
        tradesDisabled: trades.disabled,
        archiveDisabled: archive.disabled,
        archiveReady: archive.dataset.backerStyleReady,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        paddingTop: getComputedStyle(heading.closest('.mkt-header')).paddingTop
      };
    });
    assert.equal(pending.archiveReady, 'true', 'the test must hold after incoming archive CSS has loaded');
    assert.equal(pending.tradesDisabled, false, 'the outgoing committed Trades stylesheet must remain active');
    assert.equal(pending.archiveDisabled, true, 'incoming archive CSS must stay non-applicable until commit');
    assert.deepEqual({ fontSize: pending.fontSize, fontWeight: pending.fontWeight, paddingTop: pending.paddingTop }, before, 'the visible Trades frame must not restyle while archive scripts are pending');
    releaseArchiveData();
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.deepEqual(await page.evaluate(() => ({
      archiveDisabled: document.querySelector('link[data-backer-legacy-market]').disabled,
      tradesDisabled: document.querySelector('link[data-backer-trades]').disabled
    })), { archiveDisabled: false, tradesDisabled: true });
  } finally {
    releaseArchiveData();
    await instance.close();
  }
});

test('archive query alias and saved archive tab state cold-load the preserved interface', async () => {
  const instance = await context();
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html?view=market-archive`);
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.equal((await page.locator('.mkt-framing h1').innerText()).trim(), 'Live Markets');
    await page.goto(`${origin}/backerdemo.html#market-archive?view=radar`);
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.equal(await page.locator('.mkt-tabs [data-tab="radar"]').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('.mkt-canvas').innerText(), /Creators worth monitoring before a contract opens/i);
    await page.evaluate(() => { location.hash = '#trades'; });
    await page.waitForSelector('.mkt-header h1', { state: 'visible' });
    await page.evaluate(() => { location.hash = '#market-archive?view=resolved'; });
    await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
    assert.equal(await page.locator('.mkt-tabs [data-tab="resolved"]').getAttribute('aria-selected'), 'true', 'a remount must rehydrate the current archive hash');
    assert.match(await page.locator('.mkt-canvas').innerText(), /Resolved milestone contracts/i);
    await page.evaluate(() => { location.hash = '#market-archive?browse=bogus&sort=bogus&genre=bogus&platform=bogus&scale=bogus&poa=bogus&multiple=bogus&evidence=bogus&risk=bogus'; });
    await page.waitForFunction(() => document.querySelector('.mkt-tabs [data-tab="markets"]')?.getAttribute('aria-selected') === 'true');
    assert.equal(await page.locator('.mkt-tabs [data-tab="markets"]').getAttribute('aria-selected'), 'true', 'invalid deep-link values must fall back to archive defaults');
    assert.match(await page.locator('.mkt-grid-h').first().innerText(), /sorted by Attention Pulse/i);
  } finally {
    await instance.close();
  }
});

for (const archiveWidth of [320, 390, 648]) {
  test(`the preserved archive stays inside a ${archiveWidth}px viewport`, async () => {
    const instance = await context({ width: archiveWidth, height: 900 });
    const page = await instance.newPage();
    try {
      await page.goto(`${origin}/backerdemo.html#market-archive`);
      await page.waitForSelector('.mkt[data-market-surface="archive"]', { state: 'visible' });
      const geometry = await page.evaluate(() => {
        const box = (selector) => {
          const node = document.querySelector(selector);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        };
        return {
          innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          root: box('.mkt[data-market-surface="archive"]'),
          featured: box('.mkt-feat'),
          controls: box('.mkt-controls')
        };
      });
      assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `archive document must not overflow: ${JSON.stringify(geometry)}`);
      for (const [name, rect] of Object.entries({ root: geometry.root, featured: geometry.featured, controls: geometry.controls })) {
        assert.ok(rect && rect.left >= -0.5 && rect.right <= geometry.innerWidth + 0.5, `${name} must remain within the viewport: ${JSON.stringify(geometry)}`);
      }
    } finally {
      await instance.close();
    }
  });
}

test('initial short-mobile Trades actions clear the expanded bottom dock', async () => {
  const instance = await context({ width: 320, height: 780 });
  await instance.addInitScript(() => {
    localStorage.setItem('backer_shared_dock_v1', JSON.stringify({ edge: 'bottom', crossAxisRatio: 0.5, minimized: false }));
  });
  const page = await instance.newPage();
  try {
    await page.goto(`${origin}/backerdemo.html#trades?view=feed`);
    await page.waitForSelector('.mkt-personalization-actions', { state: 'visible' });
    await waitForDock(page);
    const geometry = await page.evaluate(() => {
      const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
      const actions = document.querySelector('.mkt-personalization-actions').getBoundingClientRect();
      const section = document.querySelector('.mkt-personalization').getBoundingClientRect();
      const intro = document.querySelector('.mkt-personalization > div:first-child').getBoundingClientRect();
      const button = document.querySelector('.mkt-personalization-actions button');
      const link = document.querySelector('.mkt-personalization-actions a');
      return {
        dock,
        section,
        intro,
        actions,
        overlaps: dock.left < actions.right - 1 && dock.right > actions.left + 1
          && dock.top < actions.bottom - 1 && dock.bottom > actions.top + 1,
        buttonHeight: button.getBoundingClientRect().height,
        buttonFont: Number.parseFloat(getComputedStyle(button).fontSize),
        linkFont: Number.parseFloat(getComputedStyle(link).fontSize),
        scrollY,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth
      };
    });
    assert.equal(geometry.scrollY, 0, 'the clearance must hold on the untouched first view');
    assert.equal(geometry.overlaps, false, `personalization actions must clear the dock: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.actions.bottom <= geometry.dock.top - 11, `actions should retain a 12px dock gap: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.buttonHeight >= 44, 'reset remains a full-size touch target');
    assert.ok(geometry.buttonFont >= 14 && geometry.linkFont >= 14, 'compact labels must remain readable');
    assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'short-mobile clearance must not create horizontal overflow');
  } finally {
    await instance.close();
  }
});

test('mobile Trades reserves readable space around every floating-dock edge', async () => {
  const instance = await context({ width: 390, height: 900 });
  const page = await instance.newPage();
  try {
    for (const edge of ['bottom', 'left', 'right', 'top']) {
      for (const minimized of [false, true]) {
        await page.goto(`${origin}/backerdemo.html#trades`);
        await page.evaluate(({ edge: nextEdge, minimized: nextMinimized }) => {
          localStorage.setItem('backer_shared_dock_v1', JSON.stringify({
            edge: nextEdge,
            crossAxisRatio: 0.5,
            minimized: nextMinimized
          }));
        }, { edge, minimized });
        await page.reload();
        await page.waitForSelector('.mkt-personalization', { state: 'visible', timeout: 20000 });
        await page.waitForFunction(({ edge: nextEdge, minimized: nextMinimized }) => {
          const dock = document.querySelector('.backer-float-dock');
          return dock?.dataset.edge === nextEdge
            && dock.classList.contains('is-minimized') === nextMinimized;
        }, { edge, minimized });
        const geometry = await page.evaluate(() => {
          const rect = (selector) => {
            const value = document.querySelector(selector).getBoundingClientRect();
            return { left: value.left, right: value.right, top: value.top, bottom: value.bottom };
          };
          const dock = rect('.backer-float-dock');
          const regions = ['.mkt-header', '.mkt-tabs', '.mkt-personalization', '.mkt-feed-section .mkt-section-head']
            .map((selector) => ({ selector, rect: rect(selector) }));
          const intersects = (a, b) => a.left < b.right - 1 && a.right > b.left + 1
            && a.top < b.bottom - 1 && a.bottom > b.top + 1;
          return {
            overlaps: regions.filter((entry) => intersects(dock, entry.rect)).map((entry) => entry.selector),
            dock,
            regions,
            clearanceTop: getComputedStyle(document.documentElement).getPropertyValue('--backer-dock-clearance-top'),
            marketPaddingTop: getComputedStyle(document.querySelector('.mkt')).paddingTop,
            marketRect: rect('.mkt'),
            appRect: rect('#app'),
            appPaddingTop: getComputedStyle(document.querySelector('#app')).paddingTop,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth
          };
        });
        assert.deepEqual(
          geometry.overlaps,
          [],
          `${edge}/${minimized ? 'minimized' : 'expanded'} dock must not obscure Trades hierarchy: ${JSON.stringify(geometry)}`
        );
        assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `${edge} dock clearance must not create horizontal overflow`);
      }
    }
  } finally {
    await instance.close();
  }
});

test('tablet Trades keeps the first market heading clear of the bottom dock', async () => {
  const instance = await context({ width: 648, height: 900 });
  const page = await instance.newPage();
  try {
    for (const minimized of [false, true]) {
      await page.goto(`${origin}/backerdemo.html#trades`);
      await page.evaluate((nextMinimized) => {
        localStorage.setItem('backer_shared_dock_v1', JSON.stringify({
          edge: 'bottom',
          crossAxisRatio: 0.5,
          minimized: nextMinimized
        }));
      }, minimized);
      await page.reload();
      await page.waitForSelector('.mkt-feed-section .mkt-section-head', { state: 'visible', timeout: 20000 });
      await page.waitForFunction((nextMinimized) => {
        const dock = document.querySelector('.backer-float-dock');
        return dock?.dataset.edge === 'bottom'
          && dock.classList.contains('is-minimized') === nextMinimized;
      }, minimized);
      const geometry = await page.evaluate(() => {
        const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
        const heading = document.querySelector('.mkt-feed-section .mkt-section-head').getBoundingClientRect();
        return {
          dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom },
          heading: { left: heading.left, right: heading.right, top: heading.top, bottom: heading.bottom },
          overlaps: dock.left < heading.right - 1 && dock.right > heading.left + 1
            && dock.top < heading.bottom - 1 && dock.bottom > heading.top + 1,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth
        };
      });
      assert.equal(geometry.overlaps, false, `648px bottom dock must clear the first market heading: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.heading.top >= geometry.dock.bottom + 11, `heading needs a readable dock gap: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, 'tablet dock clearance must not create horizontal overflow');
    }
  } finally {
    await instance.close();
  }
});

test('right-edge dock leaves the complete Trades tab scrollport interactive', async () => {
  for (const viewport of [{ width: 320, height: 900 }, { width: 390, height: 900 }, { width: 648, height: 900 }]) {
    const instance = await context(viewport);
    const page = await instance.newPage();
    try {
      for (const minimized of [false, true]) {
        await page.goto(`${origin}/backerdemo.html#trades`);
        await page.evaluate((nextMinimized) => {
          localStorage.setItem('backer_shared_dock_v1', JSON.stringify({
            edge: 'right',
            crossAxisRatio: 0.5,
            minimized: nextMinimized
          }));
        }, minimized);
        await page.reload();
        await page.waitForSelector('.mkt-tabs button', { state: 'visible', timeout: 20000 });
        await page.waitForFunction((nextMinimized) => {
          const dock = document.querySelector('.backer-float-dock');
          return dock?.dataset.edge === 'right'
            && dock.classList.contains('is-minimized') === nextMinimized;
        }, minimized);
        const geometry = await page.evaluate(() => {
          const dock = document.querySelector('.backer-float-dock').getBoundingClientRect();
          const rail = document.querySelector('.mkt-tabs').getBoundingClientRect();
          return {
            dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom },
            rail: { left: rail.left, right: rail.right, top: rail.top, bottom: rail.bottom },
            gap: dock.left - rail.right,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth
          };
        });
        assert.ok(geometry.gap >= 11, `${viewport.width}px right-edge dock needs a 12px tab hit-area gap: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `${viewport.width}px right dock must not create horizontal overflow`);
      }
    } finally {
      await instance.close();
    }
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
