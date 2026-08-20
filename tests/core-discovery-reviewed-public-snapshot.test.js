'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { runProvider } = require('../api/_lib/discovery-provider');
const {
  REVIEWED_PUBLIC_SNAPSHOT,
  REVIEWED_SNAPSHOT_ADAPTERS,
  REVIEWED_SNAPSHOT_PROVIDERS,
  SNAPSHOT_OBSERVED_AT,
  importReviewedPublicSnapshot
} = require('../lib/discovery/providers/reviewed-public-snapshot');

const EXPECTED_COUNTS = Object.freeze({
  x: { creators: 5, contentRecords: 4, metricObservations: 0 },
  tiktok: { creators: 5, contentRecords: 5, metricObservations: 0 },
  spotify: { creators: 6, contentRecords: 6, metricObservations: 0 },
  soundcloud: { creators: 6, contentRecords: 4, metricObservations: 0 },
  patreon: { creators: 5, contentRecords: 5, metricObservations: 0 },
  kick: { creators: 6, contentRecords: 5, metricObservations: 6 },
  linkedin: { creators: 5, contentRecords: 2, metricObservations: 2 }
});

test('reviewed public snapshot normalizes exact source records without inferred metrics', () => {
  const imported = importReviewedPublicSnapshot();
  assert.equal(imported.creators.length, 38);
  assert.equal(imported.platformIdentities.length, 38);
  assert.equal(imported.contentRecords.length, 31);
  assert.equal(imported.metricObservations.length, 8);
  assert.deepEqual(REVIEWED_SNAPSHOT_PROVIDERS, Object.keys(EXPECTED_COUNTS));

  for (const run of imported.providerRuns) {
    assert.deepEqual(run.resultCounts, EXPECTED_COUNTS[run.provider]);
    assert.equal(run.publishState, 'last_good');
    assert.equal(run.observedAt, SNAPSHOT_OBSERVED_AT);
    assert.equal(run.lastSuccessAt, SNAPSHOT_OBSERVED_AT);
    assert.equal(run.reasonCode, 'reviewed_public_snapshot');
  }
  assert.ok(imported.platformIdentities.every((row) => row.observedAt === SNAPSHOT_OBSERVED_AT
    && /^https:\/\//.test(row.profileUrl)));
  assert.ok(imported.contentRecords.every((row) => row.observedAt === SNAPSHOT_OBSERVED_AT
    && /^https:\/\//.test(row.canonicalUrl)));
  assert.deepEqual(new Set(imported.metricObservations.map((row) => row.provider)), new Set(['kick', 'linkedin']));
  assert.ok(imported.metricObservations.every((row) => row.availability === 'available'
    && row.visibility === 'public'
    && row.freshness.state === 'snapshot'
    && row.freshness.capturedAt === SNAPSHOT_OBSERVED_AT
    && row.confidence.level === 'high'
    && ['followers', 'views'].includes(row.metric)));
  assert.ok(imported.contentRecords.filter((row) => row.provider === 'patreon').every((row) => row.publishedAt));
});

test('reviewed snapshot rejects unlabeled counts, locked posts, and off-provider URLs', () => {
  const unlabeled = structuredClone(REVIEWED_PUBLIC_SNAPSHOT);
  unlabeled.providers.find((row) => row.provider === 'kick').metrics[0].labelVerified = false;
  assert.throws(() => importReviewedPublicSnapshot(unlabeled, ['kick']), { code: 'provider_response_invalid' });

  const locked = structuredClone(REVIEWED_PUBLIC_SNAPSHOT);
  locked.providers.find((row) => row.provider === 'patreon').content[0].publicAccess = 'locked';
  assert.throws(() => importReviewedPublicSnapshot(locked, ['patreon']), { code: 'provider_response_invalid' });

  const offProvider = structuredClone(REVIEWED_PUBLIC_SNAPSHOT);
  offProvider.providers.find((row) => row.provider === 'tiktok').content[0].canonicalUrl = 'https://example.com/copied';
  assert.throws(() => importReviewedPublicSnapshot(offProvider, ['tiktok']), { code: 'provider_response_invalid' });
});

test('catalog-only snapshot adapters fail closed so catalog overlay remains last-good', async () => {
  for (const provider of ['tiktok', 'spotify', 'soundcloud', 'patreon', 'kick']) {
    const result = await runProvider(REVIEWED_SNAPSHOT_ADAPTERS[provider], {
      env: {}, now: () => new Date('2026-08-20T12:00:00.000Z')
    });
    assert.equal(result.providerRun.provider, provider);
    assert.equal(result.providerRun.state, 'not_configured');
    assert.equal(result.providerRun.publishState, 'unavailable');
    assert.equal(result.contentRecords.length, 0);
  }
});

test('generated discovery catalog retains the reviewed provider snapshot exactly', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'discovery-catalog.json'), 'utf8'));
  for (const [provider, expected] of Object.entries(EXPECTED_COUNTS)) {
    const identities = catalog.platformIdentities.filter((row) => row.provider === provider);
    const actual = {
      creators: new Set(identities.map((row) => row.creatorId)).size,
      contentRecords: catalog.contentRecords.filter((row) => row.provider === provider).length,
      metricObservations: catalog.metricObservations.filter((row) => row.provider === provider).length
    };
    assert.deepEqual(actual, expected);
    const run = catalog.providerRuns.find((row) => row.provider === provider);
    assert.equal(run.publishState, 'last_good');
    assert.equal(run.observedAt, SNAPSHOT_OBSERVED_AT);
  }
});
