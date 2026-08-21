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
