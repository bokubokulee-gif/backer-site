const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const market = fs.readFileSync(path.join(ROOT, 'js/market.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/market.css'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

function sampleModel() {
  const metric = {
    id: 'obs-youtube-alice-views', entityType: 'content', entityId: 'work-alice-1',
    provider: 'youtube', metric: 'views', label: 'Views', unit: 'count', value: 125000,
    observedAt: '2026-08-20T08:00:00.000Z', sourceUrl: 'https://www.youtube.com/watch?v=alice'
  };
  const contract = {
    id: 'paper-growth:profile:person-alice:obs-youtube-alice-views', marketKey: 'paper-growth:profile:person-alice:obs-youtube-alice-views',
    modelVersion: 'backer-growth-contract-v1', isSimulation: true, subjectKind: 'profile', subjectId: 'person-alice',
    question: 'Will Alice Rivera’s “Building in public” reach 150,000 views on YouTube by 2026-10-19?',
    claim: 'Alice Rivera reaches 150,000 views.', baseline: { value: 125000, label: '125,000', observedAt: metric.observedAt },
    target: { value: 150000, label: '150,000' }, cutoff: '2026-10-19T08:00:00.000Z', horizonDays: 60,
    metric: { key: 'views', label: 'Views', unit: 'count', provider: 'youtube', sourceUrl: metric.sourceUrl, observationId: metric.id, entityType: metric.entityType, entityId: metric.entityId },
    resolutionRule: 'Resolve BACK from the first retained YouTube observation at or after cutoff.'
  };
  const simulation = {
    isSimulation: true, contractId: contract.id, modelVersion: 'backer-paper-market-v1', methodology: 'deterministic_subject_evidence_utc_hour_v1',
    bucket: '2026-08-21T03:00:00.000Z', bucketEndsAt: '2026-08-21T04:00:00.000Z', supportPriceCents: 63,
    move24hPoints: 2.4, simulatedVolume: 24840, sparkline: [45, 48, 51, 49, 55, 59, 63]
  };
  const person = {
    id: 'person-alice', personId: 'person-alice', kind: 'profile', name: 'Alice Rivera', handle: '@alicebuilds',
    bio: 'Independent product builder.', avatar: 'https://images.example.com/alice.jpg', avatarSourceUrl: 'https://youtube.com/@alicebuilds',
    profileUrl: 'https://youtube.com/@alicebuilds', provider: 'youtube',
    accounts: [{ provider: 'youtube', handle: 'alicebuilds', url: 'https://youtube.com/@alicebuilds', metrics: [metric] }],
    metrics: [metric], relatedMetrics: [], contract, simulation, evidenceState: 'retained_native_observations',
    proposalHref: 'backercreate.html#draft?type=person-growth&person=person-alice&source=trades'
  };
  const contentContract = {
    ...contract,
    id: 'paper-growth:content:work-alice-1:obs-youtube-alice-views', marketKey: 'paper-growth:content:work-alice-1:obs-youtube-alice-views',
    subjectKind: 'content', subjectId: 'work-alice-1',
    question: 'Will “Building in public” reach 150,000 views on YouTube by 2026-10-19?'
  };
  const content = {
    id: 'work-alice-1', contentId: 'work-alice-1', kind: 'content', title: 'Building in public', excerpt: 'A real retained original video.',
    provider: 'youtube', url: metric.sourceUrl, thumbnail: 'https://images.example.com/alice-video.jpg', thumbnailSourceUrl: metric.sourceUrl,
    publishedAt: '2026-08-20T08:00:00.000Z', observedAt: metric.observedAt, person, personId: person.id, metrics: [metric],
    contract: contentContract, simulation: { ...simulation, contractId: contentContract.id }, evidenceState: 'retained_native_observations',
    proposalHref: 'backercreate.html#draft?type=content-growth&person=person-alice&content=work-alice-1&source=trades'
  };
  return {
    generatedAt: '2026-08-20T08:00:00.000Z', people: [person], contents: [content],
    counts: { people: 1, contents: 1 }, simulationBucket: { id: simulation.bucket, endsAt: simulation.bucketEndsAt, intervalMs: 3600000, modelVersion: simulation.modelVersion }
  };
}

function control(attributes) {
  return {
    checked: false, value: '',
    closest() { return this; },
    getAttribute(name) { return attributes[name] ?? null; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name); },
    matches() { return false; }
  };
}

function makeHarness({ hash = '#trades', account = null, initial = {}, model = sampleModel() } = {}) {
  const values = new Map();
  Object.entries(initial).forEach(([key, value]) => values.set(key, typeof value === 'string' ? value : JSON.stringify(value)));
  if (account) values.set('backer_trades_account_v1', JSON.stringify(account));
  values.set('backer_portfolio_v1', JSON.stringify([{ id: 'legacy-sentinel' }]));
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const listeners = {};
  const target = {
    dataset: {}, innerHTML: '',
    addEventListener(name, handler) { listeners[name] = handler; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
  const windowObject = {
    BACKER: { fmt: String },
    BackerTradeCatalog: { load: async () => model },
    BackerMarketDraftStore: { list: () => [] },
    localStorage: storage,
    location: { hash, href: `https://backer.test/backerdemo.html${hash}`, pathname: '/backerdemo.html', search: '' },
    history: { replaceState(_state, _title, next) { windowObject.lastURL = next; } },
    setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame(callback) { callback(); }
  };
  const documentObject = { getElementById() { return null; }, querySelector() { return null; }, head: { appendChild() {} } };
  const context = vm.createContext({ window: windowObject, document: documentObject, URL, URLSearchParams, Intl, Set, Map, Number, String, Math, Date, isFinite, encodeURIComponent });
  vm.runInContext(market, context);
  windowObject.BackerMarket.render(target);
  return { windowObject, target, listeners, values };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

function click(listeners, attributes) {
  listeners.click({ target: control(attributes), preventDefault() {} });
}

function acknowledge(listeners) {
  const input = control({});
  input.checked = true;
  input.matches = (selector) => selector === '[data-ticket-ack]';
  listeners.change({ target: input });
}

test('Trades renders only retained catalog subjects with a complete priced contract', async () => {
  const { target } = makeHarness();
  await settle();
  assert.match(target.innerHTML, /Alice Rivera/);
  assert.match(target.innerHTML, /Building in public/);
  assert.match(target.innerHTML, /Will Alice Rivera/);
  assert.match(target.innerHTML, /125,000/);
  assert.match(target.innerHTML, /150,000/);
  assert.match(target.innerHTML, /63¢/);
  assert.match(target.innerHTML, /\+2\.4 pts/);
  assert.match(target.innerHTML, /\$24\.8K/);
  assert.match(target.innerHTML, />Back</);
  assert.match(target.innerHTML, />Fade</);
  assert.match(target.innerHTML, /Paper market · modeled quotes/);
  assert.doesNotMatch(target.innerHTML, /Ada Maker|Marcus Stillwater|BACKER_MKT|Demo simulations/i);
});

test('Trades labels retained refresh-failure evidence as last-good on cards and the ticket', async () => {
  const model = sampleModel();
  const person = model.people[0];
  person.metrics[0].freshness = { state: 'last_good', capturedAt: person.metrics[0].observedAt };
  person.contract.baseline.freshness = { state: 'last_good', capturedAt: person.metrics[0].observedAt };
  person.contract.metric.freshness = { state: 'last_good', capturedAt: person.metrics[0].observedAt };
  const { target, listeners } = makeHarness({ model });
  await settle();
  assert.match(target.innerHTML, /Last good · observed/);
  click(listeners, { 'data-mkt-trade': 'BACK', 'data-subject-kind': 'profile', 'data-subject-id': 'person-alice' });
  assert.match(target.innerHTML, /Observed baseline/);
  assert.match(target.innerHTML, /Last good · observed/);
});

test('Trades is people-first, personalized from device-local Discovery signals, and separate from legacy portfolio', () => {
  assert.match(market, /backer_market2_watch_v1/);
  assert.match(market, /backer_trades_work_watch_v1/);
  assert.match(market, /backer_discovery_interest_v1/);
  assert.match(market, /backer_trades_positions_v1/);
  assert.match(market, /backer_trades_account_v1/);
  assert.doesNotMatch(market, /BACKER_MKT|backer_portfolio_v1/);
  assert.match(market, /For you · on this device/);
  assert.match(market, /positionSubjectIds/);
  assert.match(market, /proposedContentIds/);
  assert.match(market, /watchedPersonIds/);
  assert.match(market, /watchedContentIds/);
  assert.match(market, /market_work_watch_changed/);
  assert.match(market, /aria-label="Reset personalization"[^>]*>Reset feed/);
});

test('content Watch uses exact device-local work state and visibly personalizes that work', async () => {
  const { target, listeners, values } = makeHarness();
  await settle();
  assert.match(target.innerHTML, /data-mkt-watch-work="work-alice-1" aria-pressed="false">Watch</);
  click(listeners, { 'data-mkt-watch-work': 'work-alice-1' });
  await settle();
  assert.deepEqual(JSON.parse(values.get('backer_trades_work_watch_v1')), ['work-alice-1']);
  assert.equal(values.has('backer_market2_watch_v1'), false, 'a work watch must not overload profile watch IDs');
  assert.match(target.innerHTML, /data-mkt-watch-work="work-alice-1" aria-pressed="true">Watching</);
  assert.match(target.innerHTML, /Watched work/);
  assert.equal(JSON.parse(values.get('backer_discovery_interest_v1'))[0].contentId, 'work-alice-1');
});

test('reset personalization restores default ranking without deleting proposals, positions, or account data', async () => {
  const oldPosition = {
    schemaVersion: 'backer-trades-position-v1', id: 'trade-old', subjectId: 'person-alice',
    side: 'BACK', cost: 25, createdAt: '2026-08-20T00:00:00.000Z', receiptId: 'KEEP-RECEIPT'
  };
  const { target, listeners, values } = makeHarness({
    initial: {
      backer_market2_watch_v1: ['person-alice'],
      backer_trades_work_watch_v1: ['work-alice-1'],
      backer_discovery_interest_v1: [{ personId: 'person-alice', action: 'opened', at: '2026-08-20T00:00:00.000Z' }],
      backer_trades_positions_v1: [oldPosition],
      backer_trades_account_v1: { schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 9975 },
      'backer_site_market_draft_v2:keep': { draftId: 'keep' }
    }
  });
  await settle();
  click(listeners, { 'data-reset-personalization': '' });
  await settle();
  assert.equal(values.has('backer_market2_watch_v1'), false);
  assert.equal(values.has('backer_trades_work_watch_v1'), false);
  assert.equal(values.has('backer_discovery_interest_v1'), false);
  assert.equal(JSON.parse(values.get('backer_trades_positions_v1'))[0].receiptId, 'KEEP-RECEIPT');
  assert.equal(JSON.parse(values.get('backer_trades_account_v1')).cash, 9975);
  assert.equal(JSON.parse(values.get('backer_site_market_draft_v2:keep')).draftId, 'keep');
  assert.ok(Date.parse(values.get('backer_trades_personalization_reset_v1')) > 0);
  assert.match(target.innerHTML, /Default order restored/);
  assert.match(target.innerHTML, /All saved data remains/);
});

test('public Trades loader requests the real catalog model before the view and never loads fixture market data', () => {
  const catalogIndex = app.indexOf("loadTradesScript('js/trades-catalog-model.js");
  const viewIndex = app.indexOf("loadTradesScript('js/market.js");
  assert.ok(catalogIndex >= 0 && viewIndex > catalogIndex, 'the catalog projection must initialize before the Trades view');
  assert.match(app, /css\/market\.css\?v=20260821-account-metrics-1/);
  assert.match(app, /js\/trades-catalog-model\.js\?v=20260826-perf-1/);
  assert.match(app, /js\/market\.js\?v=20260826-perf-1/);
  assert.match(market, /js\/trades-catalog-model\.js\?v=20260826-perf-1/);
  assert.match(market, /href="backerdemo\.html#market-archive">Archived demo market/);
  assert.doesNotMatch(app, /loadTradesScript\(['"]js\/market-data\.js/);
  assert.doesNotMatch(market, /BACKER_MKT|backer_portfolio_v1/);
});

test('deep links reveal exact profile/content contracts and can open a requested side', async () => {
  const { target, windowObject } = makeHarness({ hash: '#trades?view=profiles&subject=person-alice&side=back' });
  await settle();
  assert.match(target.innerHTML, /Review paper trade/);
  assert.match(target.innerHTML, /BACK · Alice Rivera/);
  assert.match(target.innerHTML, /Will Alice Rivera/);
  assert.equal(windowObject.BackerTradesRoutes.subjectURL('content', 'work-alice-1', 'fade'), 'backerdemo.html#trades?view=contents&subject=work-alice-1&side=fade');
});

test('an ineligible Discovery deep link fails closed instead of showing another subject', async () => {
  const { target } = makeHarness({ hash: '#trades?view=profiles&subject=not-reviewed' });
  await settle();
  assert.match(target.innerHTML, /Not listed in Trades/);
  assert.match(target.innerHTML, /no eligible paper contract/);
  assert.doesNotMatch(target.innerHTML, /data-mkt-trade=/);
  assert.doesNotMatch(target.innerHTML, /Alice Rivera/);
});

test('paper cash blocks overspend and never mutates the legacy portfolio store', async () => {
  const account = { schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 20, updatedAt: '2026-08-21T00:00:00.000Z' };
  const { target, listeners, values } = makeHarness({ account });
  await settle();
  click(listeners, { 'data-mkt-trade': 'BACK', 'data-subject-kind': 'profile', 'data-subject-id': 'person-alice' });
  acknowledge(listeners);
  click(listeners, { 'data-ticket-confirm': '' });
  assert.equal(values.has('backer_trades_positions_v1'), false);
  assert.deepEqual(JSON.parse(values.get('backer_portfolio_v1')), [{ id: 'legacy-sentinel' }]);
  assert.match(target.innerHTML, /Amount exceeds available paper cash/);
  assert.match(target.innerHTML, /Estimated payout if correct/);
  assert.match(target.innerHTML, /Profit if correct/);
  assert.match(target.innerHTML, /Resolution rule/);
  assert.match(target.innerHTML, /Resolve BACK/);
});

test('an affordable paper fill debits cash and persists the immutable contract receipt', async () => {
  const { target, listeners, values } = makeHarness();
  await settle();
  click(listeners, { 'data-mkt-trade': 'FADE', 'data-subject-kind': 'profile', 'data-subject-id': 'person-alice' });
  acknowledge(listeners);
  click(listeners, { 'data-ticket-confirm': '' });
  const positions = JSON.parse(values.get('backer_trades_positions_v1'));
  const account = JSON.parse(values.get('backer_trades_account_v1'));
  assert.equal(positions.length, 1);
  assert.equal(positions[0].contractId, 'paper-growth:profile:person-alice:obs-youtube-alice-views');
  assert.equal(positions[0].contractObservationId, 'obs-youtube-alice-views');
  assert.match(positions[0].contractSnapshot.question, /Will Alice Rivera/);
  assert.equal(positions[0].quote.side, 'FADE');
  assert.ok(positions[0].estimatedPayout > positions[0].cost);
  assert.equal(positions[0].profitIfCorrect, Math.round((positions[0].estimatedPayout - positions[0].cost) * 100) / 100);
  assert.equal(positions[0].modelBucket, '2026-08-21T03:00:00.000Z');
  assert.equal(account.cash, 9975);
  assert.deepEqual(JSON.parse(values.get('backer_portfolio_v1')), [{ id: 'legacy-sentinel' }]);
  assert.match(target.innerHTML, /Paper trade receipt/);
  assert.match(target.innerHTML, /Estimated payout if correct/);
  assert.match(target.innerHTML, /Profit if correct/);
  assert.match(target.innerHTML, /Resolution source/);
  assert.match(target.innerHTML, /Open Portfolio/);
});

test('Trades CSS uses Backer-native three-column hierarchy with readable responsive type', () => {
  assert.match(css, /\.mkt-catalog-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:1160px\)[\s\S]*\.mkt-catalog-grid,[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:720px\)[\s\S]*\.mkt-catalog-grid,[^}]*grid-template-columns:1fr/);
  assert.match(css, /\.mkt-contract h3\{[^}]*font-size:17px/);
  assert.match(css, /\.mkt-side-actions button\{[^}]*min-height:44px/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
