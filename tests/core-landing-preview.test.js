'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const eligibility = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8'));
const preview = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'landing-preview.json'), 'utf8'));

test('Home preview is a compact, exact projection of the retained Discovery catalog', () => {
  assert.equal(preview.schemaVersion, 'backer-landing-preview-v1');
  assert.equal(preview.sourceCatalogGeneratedAt, catalog.generatedAt);
  assert.equal(preview.profiles.length, 3);
  const availableEligibleProviders = new Set(eligibility.entries
    .filter((row) => row.eligibilityState === 'eligible')
    .map((row) => row.provider));
  assert.equal(new Set(preview.profiles.map((row) => row.provider)).size, Math.min(3, availableEligibleProviders.size),
    'the compact preview must preserve the maximum truthful provider diversity available to reviewed profile markets');
  assert.ok(Buffer.byteLength(JSON.stringify(preview)) < 4096);

  const creators = new Map(catalog.creators.map((row) => [row.id, row]));
  const identities = new Map(catalog.platformIdentities.map((row) => [row.id, row]));
  const works = new Map(catalog.contentRecords.map((row) => [row.id, row]));
  const eligibleCreators = new Set(eligibility.entries.filter((row) => row.eligibilityState === 'eligible').map((row) => row.creatorId));
  const observations = new Map();
  catalog.metricObservations.forEach((row) => {
    if (!observations.has(row.entityId)) observations.set(row.entityId, []);
    observations.get(row.entityId).push(row);
  });

  for (const row of preview.profiles) {
    const creator = creators.get(row.id);
    const work = works.get(row.workId);
    const identity = work && identities.get(work.platformIdentityId);
    assert.ok(creator, `${row.id} must remain in Discovery`);
    assert.equal(creator.kind, 'public_creator');
    assert.ok(eligibleCreators.has(row.id), `${row.id} must remain eligible for Trades`);
    assert.ok(work, `${row.workId} must remain original work`);
    assert.equal(row.name, creator.displayName);
    assert.equal(work.creatorId, row.id);
    assert.equal(work.title, row.workTitle);
    assert.equal(work.provider, row.provider);
    assert.equal(identity.creatorId, row.id);
    assert.ok((observations.get(row.workId) || []).some((metric) => metric.provider === row.provider));
    assert.match(row.metricLabel, /\S+\s+\S+/);
  }
});

test('Home preview is included in the allowlisted Pages artifact', () => {
  const artifact = fs.readFileSync(path.join(ROOT, 'scripts', 'build-pages-artifact.mjs'), 'utf8');
  assert.match(artifact, /'data\/landing-preview\.json'/);
});
