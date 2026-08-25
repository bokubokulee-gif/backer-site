'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const store = require(path.join(ROOT, 'js', 'trades-position-store.js'));
const portfolio = fs.readFileSync(path.join(ROOT, 'js', 'trades-portfolio.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'portfolio.html'), 'utf8');
const artifact = fs.readFileSync(path.join(ROOT, 'scripts', 'build-pages-artifact.mjs'), 'utf8');

function validPosition(overrides = {}) {
  return {
    schemaVersion: 'backer-trades-position-v1',
    id: 'trade_one',
    receiptId: 'SIM-ONE',
    subjectId: 'creator_real_1',
    subjectKind: 'profile',
    personId: 'creator_real_1',
    contentId: '',
    subjectSnapshot: {
      name: 'Real Person', title: '', avatar: 'https://images.example/person.jpg', thumbnail: '',
      provider: 'youtube', sourceUrl: 'https://youtube.com/@realperson'
    },
    contractId: 'paper-growth:profile:creator_real_1:obs_real_1',
    contractObservationId: 'obs_real_1',
    contractSnapshot: {
      id: 'paper-growth:profile:creator_real_1:obs_real_1',
      question: 'Will Real Person reach 125 subscribers by 2026-10-20?',
      claim: 'Real Person reaches 125 subscribers by 2026-10-20.',
      modelVersion: 'backer-growth-contract-v1',
      baselineValue: 100,
      baselineLabel: '100',
      baselineObservedAt: '2026-08-21T08:00:00.000Z',
      targetValue: 125,
      targetLabel: '125',
      cutoff: '2026-10-20T08:00:00.000Z',
      horizonDays: 60,
      metricKey: 'subscribers',
      metricLabel: 'Subscribers',
      metricUnit: 'count',
      metricProvider: 'youtube',
      metricSourceUrl: 'https://youtube.com/@realperson',
      observationId: 'obs_real_1',
      resolutionRule: 'Resolve from the same retained public source.'
    },
    observationIds: ['obs_real_1'],
    modelId: 'backer-support-market-hourly-v1',
    modelBucket: '2026-08-21T08:00:00.000Z',
    modelFingerprint: 'profile:creator_real_1:model:63',
    side: 'BACK', supportPriceCents: 63, priceCents: 63, quantity: 39.68,
    quote: { side: 'BACK', supportPriceCents: 63, priceCents: 63, bucket: '2026-08-21T08:00:00.000Z' },
    cost: 25, maxLoss: 25, estimatedPayout: 39.68, profitIfCorrect: 14.68,
    status: 'OPEN_SIMULATION', isSimulation: true,
    createdAt: '2026-08-21T08:00:00.000Z',
    proposalHref: 'backercreate.html#draft?type=person-growth&person=creator_real_1',
    ...overrides
  };
}

test('Trades position store validates only the dedicated real-subject paper schema', () => {
  const rows = [
    validPosition(),
    validPosition({ id: 'wrong-schema', schemaVersion: 'legacy' }),
    validPosition({ id: 'unsafe-source', subjectSnapshot: { ...validPosition().subjectSnapshot, sourceUrl: 'javascript:alert(1)' } }),
    validPosition({ id: 'missing-person', personId: '' }),
    validPosition({ id: 'not-simulation', isSimulation: false }),
    validPosition({ id: 'invalid-side', side: 'BUY' }),
    validPosition({ id: 'missing-contract', contractSnapshot: null }),
    validPosition({ id: 'quote-drift', quote: { side: 'BACK', supportPriceCents: 62, priceCents: 63, bucket: '2026-08-21T08:00:00.000Z' } })
  ];
  const storage = { getItem(key) { assert.equal(key, 'backer_trades_positions_v1'); return JSON.stringify(rows); } };
  assert.deepEqual(store.list(storage).map((row) => row.id), ['trade_one']);
  assert.equal(store.storageKey, 'backer_trades_positions_v1');
  assert.equal(store.schemaVersion, 'backer-trades-position-v1');
});

test('content positions retain exact person, work, evidence, quote, side, and receipt identity', () => {
  const row = validPosition({
    id: 'trade_content', subjectId: 'work_real_1', subjectKind: 'content', contentId: 'work_real_1', side: 'FADE',
    contractId: 'paper-growth:content:work_real_1:obs_real_1',
    contractSnapshot: { ...validPosition().contractSnapshot, id: 'paper-growth:content:work_real_1:obs_real_1' },
    priceCents: 37, quantity: 67.5675675676, estimatedPayout: 67.57, profitIfCorrect: 42.57,
    quote: { side: 'FADE', supportPriceCents: 63, priceCents: 37, bucket: '2026-08-21T08:00:00.000Z' },
    subjectSnapshot: {
      name: 'Real Person', title: 'Exact source-linked work', avatar: 'https://images.example/person.jpg',
      thumbnail: 'https://images.example/work.jpg', provider: 'bilibili', sourceUrl: 'https://www.bilibili.com/video/BV1real'
    }
  });
  const sanitized = store.sanitize(row);
  assert.equal(sanitized.personId, 'creator_real_1');
  assert.equal(sanitized.contentId, 'work_real_1');
  assert.equal(sanitized.subjectSnapshot.title, 'Exact source-linked work');
  assert.deepEqual(sanitized.observationIds, ['obs_real_1']);
  assert.equal(sanitized.side, 'FADE');
  assert.equal(sanitized.priceCents, 37);
  assert.equal(sanitized.estimatedPayout, 67.57);
  assert.equal(sanitized.profitIfCorrect, 42.57);
  assert.equal(sanitized.receiptId, 'SIM-ONE');
  assert.equal(sanitized.contractId, 'paper-growth:content:work_real_1:obs_real_1');
  assert.equal(sanitized.contractObservationId, 'obs_real_1');
  assert.equal(sanitized.contractSnapshot.question, 'Will Real Person reach 125 subscribers by 2026-10-20?');
  assert.deepEqual(sanitized.quote, { side: 'FADE', supportPriceCents: 63, priceCents: 37, bucket: '2026-08-21T08:00:00.000Z' });
});

test('paper cash uses a dedicated validated account and defaults to 10,000', () => {
  const valid = { getItem(key) {
    assert.equal(key, 'backer_trades_account_v1');
    return JSON.stringify({ schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 9925, updatedAt: '2026-08-21T08:00:00.000Z' });
  } };
  assert.deepEqual(store.account(valid), { schemaVersion: 'backer-trades-account-v1', startingCash: 10000, cash: 9925, updatedAt: '2026-08-21T08:00:00.000Z' });
  const fallback = store.account({ getItem() { return '{"schemaVersion":"wrong","cash":-1}'; } });
  assert.equal(fallback.cash, 10000);
  assert.equal(store.accountStorageKey, 'backer_trades_account_v1');
});

test('Portfolio defaults to the real Trades ledger and keeps fixture examples behind a separate mode', () => {
  assert.match(html, /id="tradesPortfolio"/);
  assert.match(html, /id="mTrades"[^>]*>Your trades</);
  assert.match(html, /id="mInvestor"[^>]*>Legacy examples</);
  assert.match(html, /id="investorMode" class="hidden"/);
  assert.match(html, /css\/trades-portfolio\.css\?v=20260821-scale-1/);
  assert.match(html, /js\/trades-position-store\.js\?v=20260821-scale-1/);
  assert.match(html, /js\/trades-catalog-model\.js\?v=20260826-perf-1/);
  assert.match(html, /js\/trades-portfolio\.js\?v=20260821-scale-1/);
  assert.match(portfolio, /backerdemo\.html#market2\?/);
  assert.match(portfolio, /backerdemo\.html#trades\?view=positions/);
  assert.match(portfolio, /Profiles and work come from the Discovery catalog/);
  assert.match(portfolio, /Available paper cash/);
  assert.match(portfolio, /Paper equity/);
  assert.match(portfolio, /Resolution source/);
  assert.match(portfolio, /Estimated payout if correct/);
  assert.match(portfolio, /Profit if correct/);
  assert.match(portfolio, /source-backed creator account/);
  assert.match(portfolio, /contract\.question/);
  assert.doesNotMatch(portfolio, /backer_portfolio_v1/);
});

test('Pages artifact includes every Portfolio integration dependency', () => {
  for (const file of ['css/trades-portfolio.css', 'js/trades-catalog-model.js', 'js/trades-portfolio.js', 'js/trades-position-store.js', 'data/trades-eligible-accounts.json']) {
    assert.ok(artifact.includes(`'${file}'`), `${file} must ship in the allowlisted Pages artifact`);
  }
});
