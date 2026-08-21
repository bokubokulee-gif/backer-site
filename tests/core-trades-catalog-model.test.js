'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const model = require('../js/trades-catalog-model');

const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const reviewRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trades-reviewed-humans.json'), 'utf8'));
const BUCKET = '2026-08-21T08:00:00.000Z';

function build(options = {}) {
  return model.build(catalog, { reviewRegistry, simulationBucket: BUCKET, ...options });
}

function assertContract(subject) {
  const { contract } = subject;
  assert.ok(contract && contract.id && contract.question.endsWith('?'));
  assert.equal(contract.subjectId, subject.id);
  assert.equal(contract.isSimulation, true);
  assert.ok(Number.isFinite(contract.baseline.value));
  assert.ok(Number.isFinite(contract.target.value));
  assert.ok(contract.target.value > contract.baseline.value);
  assert.ok(contract.target.multiplier >= 1.08 && contract.target.multiplier <= 1.25);
  assert.ok(contract.cutoff > contract.baseline.observedAt);
  assert.ok(contract.metric.observationId && /^https:\/\//.test(contract.metric.sourceUrl));
  assert.match(contract.resolutionRule, /same provider/i);
  assert.deepEqual(contract.outcomes.map((row) => row.id), ['back', 'fade']);
  assert.equal(subject.simulation.contractId, contract.id);
  assert.equal(Number.isInteger(subject.simulation.supportPriceCents), true);
  assert.equal(subject.simulation.bucket, BUCKET);
  assert.equal(subject.simulation.bucketEndsAt, '2026-08-21T09:00:00.000Z');
}

test('public Trades fails closed to exact reviewed creator-person accounts and owned works', () => {
  const result = build();
  const approved = new Map(reviewRegistry.entries.map((row) => [row.creatorId, row]));
  assert.equal(reviewRegistry.entries.length, 26);
  assert.equal(result.people.length, reviewRegistry.entries.length);
  assert.ok(result.contents.length >= 40);
  assert.equal(result.humanReview.rejectedCount, 0);
  assert.equal(result.status, 'reviewed_real_human_subjects');
  assert.deepEqual(new Set(result.people.map((row) => row.provider)), new Set(['youtube', 'bilibili', 'twitch']));
  for (const person of result.people) {
    const review = approved.get(person.id);
    assert.ok(review, `${person.id} was not reviewed`);
    assert.equal(person.humanConfirmed, true);
    assert.equal(person.identityReview, 'confirmed_public_creator_person_account');
    assert.equal(person.accounts.length, 1);
    assert.equal(person.accounts[0].id, review.identityId);
    assert.equal(person.accounts[0].nativeId, review.nativeId);
    assert.equal(person.profileUrl, review.profileUrl);
    assert.match(person.avatar, /^https:\/\//);
    assert.match(person.avatarSourceUrl, /^https:\/\//);
    assert.ok(person.content.length > 0);
    assert.ok(person.metrics.length + person.relatedMetrics.length > 0);
    assert.equal(person.humanReview.legalIdentityVerified, false);
    assertContract(person);
  }
  for (const content of result.contents) {
    const review = approved.get(content.personId);
    assert.ok(review, `${content.id} has no reviewed human owner`);
    assert.equal(content.humanReview.identityId, review.identityId);
    assert.equal(content.provider, review.provider);
    assert.match(content.url, /^https:\/\//);
    assert.match(content.thumbnail, /^https:\/\//);
    assert.match(content.thumbnailSourceUrl, /^https:\/\//);
    assert.ok(content.metrics.length > 0);
    assertContract(content);
  }
  assert.ok(result.people.every((row) => !/^(?:demo|fixture|synthetic)[-_]/i.test(row.id)));
  assert.ok(result.contents.every((row) => !/^(?:demo|fixture|synthetic)[-_]/i.test(row.id)));
});

test('Trades evidence remains byte-for-field exact while simulation is namespaced', () => {
  const result = build();
  const rawById = new Map(catalog.metricObservations.map((row) => [row.id, row]));
  const evidence = result.contents.flatMap((row) => row.metrics);
  assert.ok(evidence.length > 0);
  for (const metric of evidence) {
    const raw = rawById.get(metric.id);
    assert.ok(raw);
    assert.equal(metric.value, raw.value);
    assert.equal(metric.unit, raw.unit);
    assert.equal(metric.observedAt, raw.observedAt);
    assert.equal(metric.sourceUrl, raw.sourceUrl);
    assert.equal('supportPriceCents' in metric, false);
    assert.equal('target' in metric, false);
  }
  const first = result.contents[0];
  assert.equal(first.contract.metric.observationId, first.metrics.find((row) => row.id === first.contract.metric.observationId).id);
  assert.equal(first.contract.baseline.value, rawById.get(first.contract.metric.observationId).value);
});

test('hour-bucketed paper market is reproducible and progresses without mutating evidence', () => {
  const first = build();
  const same = build();
  const next = model.build(catalog, {
    reviewRegistry,
    simulationBucket: '2026-08-21T09:00:00.000Z'
  });
  assert.deepEqual(first.contents[0].simulation, same.contents[0].simulation);
  assert.notDeepEqual(
    {
      price: first.contents[0].simulation.supportPriceCents,
      volume: first.contents[0].simulation.simulatedVolume,
      series: first.contents[0].simulation.series
    },
    {
      price: next.contents[0].simulation.supportPriceCents,
      volume: next.contents[0].simulation.simulatedVolume,
      series: next.contents[0].simulation.series
    }
  );
  assert.deepEqual(first.contents[0].metrics, next.contents[0].metrics);
  assert.deepEqual(first.contents[0].contract, next.contents[0].contract);
  assert.equal(next.simulationBucket.endsAt, '2026-08-21T10:00:00.000Z');
});

test('device-local Discovery and real Trades position signals deterministically personalize the feed', () => {
  const baseline = build();
  const target = baseline.people.at(-1);
  const contentTarget = baseline.contents.at(-1);
  const personalized = build({ signals: { watchedPersonIds: [target.id], watchedContentIds: [contentTarget.id] } });
  assert.equal(personalized.people[0].id, target.id);
  assert.equal(personalized.people[0].personalized, true);
  assert.equal(personalized.contents[0].id, contentTarget.id);
  assert.equal(personalized.contents[0].personalized, true);
  assert.match(personalized.contents[0].personalizationReasons.join(' '), /Work watched in Trades/i);

  const storage = {
    getItem(key) {
      if (key === 'backer_trades_positions_v1') return JSON.stringify([{ subjectId: target.id }]);
      if (key === 'backer_trades_work_watch_v1') return JSON.stringify([contentTarget.id]);
      if (key === 'backer_portfolio_v1') return JSON.stringify([{ id: 'legacy-fixture-market' }]);
      return '[]';
    }
  };
  const signals = model.signalsFromStorage(storage, []);
  assert.equal(signals.positionSubjectIds.has(target.id), true);
  assert.equal(signals.watchedContentIds.has(contentTarget.id), true);
  assert.equal(signals.positionSubjectIds.has('legacy-fixture-market'), false);
});

test('review mismatches are excluded and a missing registry cannot publish', () => {
  const mismatched = JSON.parse(JSON.stringify(reviewRegistry));
  mismatched.entries[0].nativeId = 'wrong-native-id';
  const result = model.build(catalog, { reviewRegistry: mismatched, simulationBucket: BUCKET });
  assert.equal(result.people.some((row) => row.id === reviewRegistry.entries[0].creatorId), false);
  assert.equal(result.contents.some((row) => row.personId === reviewRegistry.entries[0].creatorId), false);
  assert.equal(result.humanReview.rejectedCount, 1);
  assert.throws(() => model.build(catalog, { simulationBucket: BUCKET }), /reviewed-human registry/i);
});

test('browser loader fetches the retained catalog and reviewed-human registry', async () => {
  const seen = [];
  const result = await model.load({
    simulationBucket: BUCKET,
    fetch: async (url, options) => {
      seen.push({ url, options });
      return {
        ok: true,
        json: async () => url === model.CATALOG_URL ? catalog : reviewRegistry
      };
    }
  });
  assert.deepEqual(seen.map((row) => row.url), [model.CATALOG_URL, model.REVIEW_URL]);
  assert.ok(seen.every((row) => row.options.cache === 'no-store' && row.options.credentials === 'same-origin'));
  assert.equal(result.people.length, 26);
});
