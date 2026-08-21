'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const test = require('node:test');
const model = require('../js/trades-catalog-model');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8'));
const BUCKET = '2026-08-21T08:00:00.000Z';

test('optimized quote projection is byte-equivalent to the pre-optimization deterministic fixture', () => {
  const observations = [
    { id: 'obs-a', value: 1250, unit: 'count', observedAt: '2026-08-20T10:00:00.000Z' },
    { id: 'obs-b', value: 18, unit: 'count', observedAt: '2026-08-20T11:00:00.000Z' }
  ];
  const quote = model.simulatedMarket('content', 'work-real-1', observations, BUCKET, 'contract-real-1');
  assert.deepEqual({
    contractId: quote.contractId,
    bucket: quote.bucket,
    supportPriceCents: quote.supportPriceCents,
    move24hPoints: quote.move24hPoints,
    simulatedVolume: quote.simulatedVolume,
    liquidityDepth: quote.liquidityDepth,
    sparkline: quote.sparkline
  }, {
    contractId: 'contract-real-1',
    bucket: BUCKET,
    supportPriceCents: 42,
    move24hPoints: -2,
    simulatedVolume: 46547,
    liquidityDepth: 84,
    sparkline: [35, 34, 33, 35, 35, 35, 36, 37, 38, 40, 40, 41, 42, 42, 43, 42]
  });
});

test('full retained projection stays exact, complete, and below the 3 second PRD budget', () => {
  const creatorIds = new Set(catalog.creators.map((row) => row.id));
  const workIds = new Set(catalog.contentRecords.map((row) => row.id));
  const startedAt = performance.now();
  const result = model.build(catalog, { eligibilityRegistry: registry, simulationBucket: BUCKET });
  const duration = performance.now() - startedAt;

  assert.equal(result.people.length, registry.counts.eligibleProfiles);
  assert.equal(result.contents.length, registry.counts.eligibleWorks);
  assert.ok(result.people.length >= 1000);
  assert.ok(result.contents.length >= 1000);
  assert.ok(result.people.every((row) => creatorIds.has(row.id)));
  assert.ok(result.contents.every((row) => workIds.has(row.id)));
  assert.equal(new Set(result.people.map((row) => row.id)).size, result.people.length);
  assert.equal(new Set(result.contents.map((row) => row.id)).size, result.contents.length);
  assert.ok(duration < 3000, `full retained projection took ${Math.round(duration)}ms`);
});
