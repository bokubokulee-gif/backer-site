const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const market = fs.readFileSync(path.join(ROOT, 'js/market.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/market.css'), 'utf8');

function body(name, nextName) {
  const start = market.indexOf(`function ${name}(`);
  const end = market.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return market.slice(start, end);
}

test('Trades has the required public route, tabs, disclosure, and terminal source', () => {
  assert.match(market, /#trades/);
  assert.match(market, /Open simulations/);
  assert.match(market, /Your proposals/);
  assert.match(market, /Resolved/);
  assert.match(market, /Demo simulations · no real money/);
  assert.match(market, /backermarket\.html\?market=.*source=trades/);
  assert.match(market, /backermarket\.html\?draft=.*source=trades/);
  assert.doesNotMatch(market, /source=market-archive/);
});

test('Trades omits legacy marketplace and provider-health messaging', () => {
  for (const forbidden of ['Share', 'Creator Radar', 'Backer AI Pulse', 'provider-delayed', 'unavailable']) {
    assert.equal(market.toLowerCase().includes(forbidden.toLowerCase()), false, `${forbidden} must not appear in Trades`);
  }
});

test('local proposals remain a separate, unpriced inbox', () => {
  assert.match(market, /BackerMarketDraftStore/);
  assert.match(market, /Review proposal/);
  assert.match(market, /data-proposal-edit/);
  assert.match(market, /data-proposal-delete/);
  assert.match(market, /store\.remove\(id\)/);
  assert.match(market, /No proposals on this device/);
  assert.match(market, /Find a profile in Discovery/);
  const proposal = body('proposalCard', 'categories');
  assert.doesNotMatch(proposal, /Open simulated position|simulated activity|participants|fixed demo term/i);
  assert.match(proposal, /Not approved or priced/);
});

test('only an open approved fixture exposes the simulated-position action', () => {
  const fixture = body('fixtureCard', 'proposalReviewState');
  assert.match(fixture, /isOpen \? .*Open simulated position/s);
  assert.match(market, /contract\.isFixture/);
  assert.match(market, /contract\.mkt\.state !== 'OPEN'/);
});

test('personalization is device-local, deterministic, and explained', () => {
  assert.match(market, /For you · on this device/);
  assert.match(market, /Nothing leaves this device/);
  assert.match(market, /backer_watchlist_v1/);
  assert.match(market, /backer_discovery_interest_v1/);
  assert.match(market, /backer_portfolio_v1/);
  assert.match(market, /saved proposal/);
  assert.match(market, /recent Discovery action/);
  assert.match(market, /contentTitle/);
  assert.match(market, /discoveryWatches\.has/);
  assert.match(market, /freshMin/);
  assert.match(market, /a\.index - b\.index/);
});

test('recent Discovery provider interest deterministically changes fixture order', () => {
  const values = new Map([
    ['backer_discovery_interest_v1', JSON.stringify([{ personId: 'real-one', contentTitle: 'A creator launch', provider: 'youtube', category: 'knowledge', action: 'opened' }])]
  ]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const contract = (id, name, platform, freshMin) => ({
    id, name, hue: 32, isFixture: true,
    mkt: { state: 'OPEN', cat: 'knowledge', profiles: [{ plat: platform }] },
    contract: { title: `${name} reaches target`, curLabel: '10K', tgtLabel: '20K', closeLabel: 'Nov 30, 2026', deadlineLabel: 'Dec 31, 2026', progressPct: 50, source: `${platform} public metric`, freshMin, mult: 1.2, simVol: 100, backers: 3 }
  });
  const windowObject = {
    BACKER: { fmt: String, money: (value) => `$${value}` },
    BACKER_MKT: { DEFAULT_WINDOW: '7d', CONTRACTS: [contract('first', 'First Fixture', 'github', 1), contract('second', 'YouTube Fixture', 'youtube', 100)], catById: () => ({ name: 'Knowledge' }), platById: (id) => ({ name: id }) },
    BackerMarketDraftStore: { list: () => [] },
    localStorage: storage,
    location: { hash: '#trades', href: 'https://backer.test/backerdemo.html#trades', pathname: '/backerdemo.html', search: '' },
    history: { replaceState() {} },
    setTimeout() {}, requestAnimationFrame(callback) { callback(); }
  };
  const context = vm.createContext({ window: windowObject, document: { getElementById() { return null; } }, URL, URLSearchParams, Intl, Set, Map, Number, String, Math, Date, isFinite, encodeURIComponent });
  vm.runInContext(market, context);
  const target = { dataset: {}, innerHTML: '', addEventListener() {} };
  windowObject.BackerMarket.render(target);
  assert.ok(target.innerHTML.indexOf('YouTube Fixture') < target.innerHTML.indexOf('First Fixture'));
  assert.match(target.innerHTML, /1 recent Discovery action/);
});

test('Trades CSS preserves readable type, two-column desktop cards, and responsive access', () => {
  assert.match(css, /\.mkt-contract-grid,\.mkt-proposal-grid\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:980px\)[\s\S]*grid-template-columns:1fr/);
  assert.match(css, /\.mkt-subject-copy h3\{[\s\S]*font-size:20px/);
  assert.match(css, /\.mkt-button\{[\s\S]*min-height:44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /html\[data-theme="light"\]/);
});

test('Trades renders fixture simulations and local proposals without merging their terms', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const fixture = {
    id: 'fixture-person', name: 'Ada Maker', hue: 32, isFixture: true,
    mkt: { state: 'OPEN', cat: 'knowledge', profiles: [{ plat: 'youtube' }] },
    contract: {
      title: 'Reach 100K subscribers by Dec 31, 2026', curLabel: '72K', tgtLabel: '100K',
      closeLabel: 'Nov 30, 2026', deadlineLabel: 'Dec 31, 2026', progressPct: 72,
      source: 'YouTube public metrics - independent resolution source', mult: 1.4,
      simVol: 12000, backers: 42
    }
  };
  const proposal = {
    draftId: 'proposal_123456', subject: { type: 'person-growth', person: { id: 'real-person', name: 'Real Person', avatar: '' }, content: null },
    outcome: { question: 'Will Real Person reach 2,000 followers by the cutoff?' },
    resolution: { platform: 'github', metricLabel: 'Followers', readiness: 'retained_observation', baseline: { value: 1000 }, target: { value: 2000 }, deadline: '2026-12-31T23:59:59.000Z', sourceUrl: 'https://github.com/real-person' },
    rules: { correctionRule: 'latest_valid_before_cutoff', deletionRule: 'pause_then_void', disputeHours: 48, voidRule: 'refund_original_cost' }
  };
  const windowObject = {
    BACKER: { fmt: String, money: (value) => `$${value}` },
    BACKER_MKT: { DEFAULT_WINDOW: '7d', CONTRACTS: [fixture], catById: () => ({ name: 'Knowledge' }), platById: () => ({ name: 'YouTube' }) },
    BackerMarketDraftStore: { list: () => [{ ok: true, draft: proposal, storage: 'local', durable: true }], remove: () => ({ ok: true }) },
    localStorage: storage,
    location: { hash: '#trades', href: 'https://backer.test/backerdemo.html#trades', pathname: '/backerdemo.html', search: '' },
    history: { replaceState() {} },
    setTimeout() {}, requestAnimationFrame(callback) { callback(); }
  };
  const documentObject = { getElementById() { return null; } };
  const context = vm.createContext({ window: windowObject, document: documentObject, URL, URLSearchParams, Intl, Set, Map, Number, String, Math, Date, isFinite, encodeURIComponent });
  vm.runInContext(market, context);
  const target = { dataset: {}, innerHTML: '', addEventListener() {} };
  windowObject.BackerMarket.render(target);
  assert.match(target.innerHTML, /Ada Maker/);
  assert.match(target.innerHTML, /Open simulated position/);
  assert.doesNotMatch(target.innerHTML, /Real Person/);

  windowObject.location.hash = '#trades?view=proposals';
  windowObject.BackerMarket.render(target);
  assert.match(target.innerHTML, /Real Person/);
  assert.match(target.innerHTML, /Not approved or priced/);
  assert.doesNotMatch(target.innerHTML, /Open simulated position|simulated activity|participants/);
});
