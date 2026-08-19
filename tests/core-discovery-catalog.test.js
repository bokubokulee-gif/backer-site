'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { containsForbiddenDiscoveryKey } = require('../api/_lib/discovery-model');
const { normalizeCatalog } = require('../api/_lib/discovery-catalog');

const ROOT = path.join(__dirname, '..');
const catalogPath = path.join(ROOT, 'data', 'discovery-catalog.json');

function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

test('launch discovery snapshot preserves real catalog density and relational integrity', () => {
  const raw = readCatalog();
  const malformed = [];
  (function inspect(value, pointer) {
    if (typeof value === 'string') {
      if (typeof value.isWellFormed === 'function' && !value.isWellFormed()) malformed.push(pointer);
      return;
    }
    if (Array.isArray(value)) return value.forEach((row, index) => inspect(row, `${pointer}[${index}]`));
    if (value && typeof value === 'object') Object.entries(value).forEach(([key, row]) => inspect(row, `${pointer}.${key}`));
  })(raw, '$');
  assert.deepEqual(malformed, [], 'catalog contains malformed Unicode strings');
  const catalog = normalizeCatalog(raw);
  assert.equal(catalog.creators.length, raw.creators.length);
  assert.equal(catalog.platformIdentities.length, raw.platformIdentities.length);
  assert.equal(catalog.contentRecords.length, raw.contentRecords.length);
  assert.equal(catalog.workClusters.length, raw.contentRecords.length,
    'without approved cross-post claims every source record is its own unique work');
  assert.equal(catalog.metricObservations.length, raw.metricObservations.length);
  assert.ok(catalog.creators.length >= 900, 'real creator catalog regressed below launch density');
  assert.ok(catalog.contentRecords.length >= 1_300, 'real content catalog regressed below launch density');
  assert.ok(catalog.metricObservations.length >= 3_000, 'native observation catalog regressed below launch density');

  const creatorIds = new Set(catalog.creators.map((row) => row.id));
  const identityIds = new Set(catalog.platformIdentities.map((row) => row.id));
  const contentIds = new Set(catalog.contentRecords.map((row) => row.id));
  assert.equal(creatorIds.size, catalog.creators.length);
  assert.equal(identityIds.size, catalog.platformIdentities.length);
  assert.equal(contentIds.size, catalog.contentRecords.length);
  assert.deepEqual(
    new Set(catalog.workClusters.flatMap((cluster) => cluster.sourceRecordIds)),
    contentIds,
    'compact WorkCluster relationships must cover every retained source record'
  );
  assert.ok(catalog.workClusters.every((cluster) => cluster.sourceRecordCount === cluster.sourceRecordIds.length
    && cluster.canonicalSourceRecordId && cluster.linkage === 'source_record'));
  assert.ok(catalog.creators.every((row) => row.kind === 'public_creator' && row.discoveryEligibility === 'research_only'));
  assert.ok(catalog.platformIdentities.every((row) => creatorIds.has(row.creatorId) && /^https:\/\//.test(row.profileUrl)));
  assert.ok(catalog.contentRecords.every((row) => creatorIds.has(row.creatorId)
    && identityIds.has(row.platformIdentityId) && /^https:\/\//.test(row.canonicalUrl)));
  assert.ok(catalog.metricObservations.every((row) => (row.availability === 'available'
    ? Number.isFinite(row.value) : row.value === null)
    && row.unit && row.visibility && row.access && row.methodologyVersion
    && row.freshness && row.freshness.capturedAt === row.observedAt
    && row.confidence && row.confidence.level
    && /^https:\/\//.test(row.sourceUrl)
    && (row.entityType === 'creator' ? creatorIds.has(row.entityId)
      : row.entityType === 'identity' ? identityIds.has(row.entityId) : contentIds.has(row.entityId))));
  const microsoft = catalog.platformIdentities.filter((row) => [
    'github\u001f6154722', 'youtube\u001fUCFtEEv80fQVKkD4h1PF-Xqw'
  ].includes(`${row.provider}\u001f${row.nativeId}`));
  assert.ok(microsoft.some((row) => row.provider === 'github'), 'reviewed Microsoft GitHub account missing');
  if (microsoft.some((row) => row.provider === 'youtube')) {
    assert.equal(microsoft.length, 2, 'reviewed Microsoft accounts missing from the acquired source set');
    assert.equal(new Set(microsoft.map((row) => row.creatorId)).size, 1, 'reviewed exact accounts were not linked');
    assert.ok(microsoft.every((row) => row.reviewedLink && row.reviewedLink.confidence === 'editorial_reviewed'));
  }
  assert.equal(containsForbiddenDiscoveryKey(raw), false);
});

test('launch discovery snapshot covers every acquired public source', () => {
  const catalog = normalizeCatalog(readCatalog());
  const counts = {};
  catalog.platformIdentities.forEach((row) => {
    if (!counts[row.provider]) counts[row.provider] = { creators: new Set(), content: 0, metrics: 0 };
    counts[row.provider].creators.add(row.creatorId);
  });
  catalog.contentRecords.forEach((row) => { counts[row.provider].content += 1; });
  catalog.metricObservations.forEach((row) => { counts[row.provider].metrics += 1; });

  ['github', 'dev', 'medium', 'substack', 'rss'].forEach((provider) => {
    assert.ok(counts[provider] && counts[provider].creators.size > 0, `${provider} creator coverage missing`);
    assert.ok(counts[provider].content > 0, `${provider} content coverage missing`);
  });
  assert.ok(counts.github.metrics > 0);
  assert.ok(counts.dev.metrics > 0);
  if (!counts.youtube) {
    const youtubeRun = catalog.providerRuns.find((run) => run.provider === 'youtube');
    assert.equal(youtubeRun && youtubeRun.state, 'not_configured');
    assert.equal(youtubeRun && youtubeRun.publishState, 'unavailable');
    assert.equal(youtubeRun && youtubeRun.reasonCode, 'credentials_missing');
  } else {
    assert.ok(counts.youtube.metrics > 0);
  }
});

test('deployed source surfaces contain no private acquisition-layer branding', () => {
  const forbidden = /agent[\s_-]*reach|panniantong|opencli|twitter-cli/i;
  const roots = ['api', 'css', 'data', 'js'];
  const files = ['backerdemo.html', 'vercel.json'];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (/\.(?:css|html?|js|mjs|json|map)$/i.test(entry.name)) files.push(path.relative(ROOT, target));
    }
  }
  roots.forEach((directory) => walk(path.join(ROOT, directory)));
  const leaking = files.filter((file) => forbidden.test(fs.readFileSync(path.join(ROOT, file), 'utf8')));
  assert.deepEqual(leaking, []);
});
