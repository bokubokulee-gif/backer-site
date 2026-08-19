'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const {
  createContentRecord,
  compactText,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle,
  isUsableMetricObservation
} = require('../api/_lib/discovery-model');
const { applyReviewedIdentityLinks } = require('../api/_lib/discovery-identity-links');
const { buildWorkClusters, normalizeReviewedWorkRegistry } = require('../api/_lib/discovery-work-clusters');
const { rankDiscoveryBundle } = require('../api/_lib/discovery-rank');
const { deterministicSynthesis } = require('../api/_lib/discovery-synthesis');

const OBSERVED_AT = '2026-08-19T12:00:00.000Z';

test('text truncation never splits a valid surrogate pair at the field boundary', () => {
  const value = compactText(`${'x'.repeat(699)}😀`, 700);
  assert.equal(typeof value.isWellFormed === 'function' ? value.isWellFormed() : !value.endsWith('\ud83d'), true);
  assert.equal(value.endsWith('�'), true);
});

test('provider run page counts remain exhaustive instead of being capped at ten', () => {
  const run = createProviderRun({
    provider: 'github', state: 'succeeded', startedAt: OBSERVED_AT, finishedAt: OBSERVED_AT,
    pagesRead: 250, resultCounts: {}
  });
  assert.equal(run.pagesRead, 250);
});

function owner(provider, nativeId, profileUrl, displayName) {
  const creator = createCreator({ provider, nativeId, displayName, observedAt: OBSERVED_AT });
  const identity = createPlatformIdentity({
    creatorId: creator.id,
    provider,
    nativeId,
    handle: displayName,
    profileUrl,
    observedAt: OBSERVED_AT
  });
  creator.primaryIdentityId = identity.id;
  const content = createContentRecord({
    creatorId: creator.id,
    platformIdentityId: identity.id,
    provider,
    nativeId: `${nativeId}-work`,
    title: `${displayName} work`,
    canonicalUrl: `${profileUrl.replace(/\/$/, '')}/work`,
    publishedAt: OBSERVED_AT,
    observedAt: OBSERVED_AT
  });
  return { creator, identity, content };
}

function registry(github, youtube) {
  return {
    schemaVersion: 1,
    methodologyVersion: 'backer-reviewed-identity-links-test-v1',
    links: [{
      id: 'explicit-reviewed-link',
      displayName: 'Same Name',
      reviewState: 'approved',
      reviewedAt: OBSERVED_AT,
      canonicalAccount: { provider: 'github', nativeId: github.identity.nativeId, profileUrl: github.identity.profileUrl },
      accounts: [
        { provider: 'github', nativeId: github.identity.nativeId, profileUrl: github.identity.profileUrl },
        { provider: 'youtube', nativeId: youtube.identity.nativeId, profileUrl: youtube.identity.profileUrl }
      ],
      evidenceUrls: ['https://evidence.example/github', 'https://evidence.example/youtube'],
      reviewRationale: 'Test registry keyed by exact immutable provider IDs and URLs.'
    }]
  };
}

test('same display names never merge, while an exact reviewed account link rewrites every relationship', () => {
  const github = owner('github', 'exact-github-id', 'https://github.com/exact-reviewed', 'Same Name');
  const youtube = owner('youtube', 'ExactYouTubeChannelId', 'https://www.youtube.com/@exact-reviewed', 'Same Name');
  const source = dedupeDiscoveryBundle({
    creators: [github.creator, youtube.creator],
    platformIdentities: [github.identity, youtube.identity],
    contentRecords: [github.content, youtube.content],
    metricObservations: []
  });
  assert.equal(source.creators.length, 2, 'equal display names must remain separate');

  const linked = applyReviewedIdentityLinks(source, registry(github, youtube));
  assert.equal(linked.creators.length, 1);
  assert.equal(new Set(linked.platformIdentities.map((row) => row.creatorId)).size, 1);
  assert.equal(new Set(linked.contentRecords.map((row) => row.creatorId)).size, 1);
  assert.ok(linked.platformIdentities.every((row) => row.reviewedLink
    && row.reviewedLink.id === 'explicit-reviewed-link'
    && row.reviewedLink.confidence === 'editorial_reviewed'));

  const wrongUrlRegistry = registry(github, youtube);
  wrongUrlRegistry.links[0].accounts[1].profileUrl = 'https://www.youtube.com/@different-account';
  assert.equal(applyReviewedIdentityLinks(source, wrongUrlRegistry).creators.length, 2,
    'a provider ID without the reviewed canonical URL must fail closed');
});

test('WorkCluster never groups by title or URL similarity and retains every provider source record', () => {
  const creator = createCreator({ provider: 'github', nativeId: 'cluster-owner', displayName: 'Cluster Owner', observedAt: OBSERVED_AT });
  const githubIdentity = createPlatformIdentity({
    creatorId: creator.id, provider: 'github', nativeId: 'cluster-owner', handle: 'cluster-owner',
    profileUrl: 'https://github.com/cluster-owner', observedAt: OBSERVED_AT
  });
  const devIdentity = createPlatformIdentity({
    creatorId: creator.id, provider: 'dev', nativeId: 'cluster-owner', handle: 'cluster-owner',
    profileUrl: 'https://dev.to/cluster-owner', observedAt: OBSERVED_AT
  });
  creator.primaryIdentityId = githubIdentity.id;
  const sharedUrl = 'https://creator.example/exact-same-page';
  const githubWork = createContentRecord({
    creatorId: creator.id, platformIdentityId: githubIdentity.id, provider: 'github', nativeId: 'repo-100',
    title: 'The exact same title', canonicalUrl: sharedUrl, observedAt: OBSERVED_AT
  });
  const devWork = createContentRecord({
    creatorId: creator.id, platformIdentityId: devIdentity.id, provider: 'dev', nativeId: 'post-200',
    title: 'The exact same title', canonicalUrl: sharedUrl, observedAt: OBSERVED_AT
  });
  const bundle = dedupeDiscoveryBundle({
    creators: [creator], platformIdentities: [githubIdentity, devIdentity],
    contentRecords: [githubWork, devWork], metricObservations: []
  });
  assert.equal(bundle.contentRecords.length, 2, 'cross-provider source records must never collapse by URL');
  assert.equal(buildWorkClusters(bundle.contentRecords).length, 2, 'similar title and URL are not linkage evidence');

  const reviewedRegistry = {
    schemaVersion: 1,
    methodologyVersion: 'backer-reviewed-work-clusters-test-v1',
    clusters: [{
      id: 'exact-reviewed-cross-post',
      reviewState: 'approved',
      reviewedAt: OBSERVED_AT,
      canonicalSource: { provider: 'github', nativeId: 'repo-100', canonicalUrl: sharedUrl },
      sources: [
        { provider: 'github', nativeId: 'repo-100', canonicalUrl: sharedUrl },
        { provider: 'dev', nativeId: 'post-200', canonicalUrl: sharedUrl }
      ],
      evidenceUrls: ['https://evidence.example/source-one', 'https://evidence.example/source-two'],
      reviewRationale: 'Fixture uses exact provider IDs and source URLs only.'
    }]
  };
  assert.doesNotThrow(() => normalizeReviewedWorkRegistry(reviewedRegistry));
  const clustered = buildWorkClusters(bundle.contentRecords, reviewedRegistry);
  assert.equal(clustered.length, 1);
  assert.equal(clustered[0].linkage, 'editorial_reviewed_exact_ids');
  assert.deepEqual(new Set(clustered[0].sourceRecordIds), new Set([githubWork.id, devWork.id]));
  assert.equal(bundle.contentRecords.length, 2, 'clustering is a relation and may not drop source records');

  const wrongId = structuredClone(reviewedRegistry);
  wrongId.clusters[0].sources[1].nativeId = 'different-post';
  assert.equal(buildWorkClusters(bundle.contentRecords, wrongId).length, 2, 'a partial reviewed claim fails closed');
});

test('metric observations preserve zero, null-out unavailable values, and retain semantic provenance', () => {
  const availableZero = createMetricObservation({
    provider: 'youtube', entityType: 'content', entityId: 'content-zero', metric: 'views', value: 0,
    unit: 'count', window: 'lifetime', availability: 'available', visibility: 'public', access: 'public_page',
    observedAt: OBSERVED_AT, sourceUrl: 'https://www.youtube.com/watch?v=zero',
    methodologyVersion: 'youtube-public-count-v1', freshness: { state: 'fresh', sourceUpdatedAt: OBSERVED_AT },
    confidence: { level: 'high', basis: 'provider_reported' }
  });
  const hidden = createMetricObservation({
    provider: 'youtube', entityType: 'content', entityId: 'content-zero', metric: 'likes', value: 999,
    unit: 'count', window: 'lifetime', availability: 'hidden', visibility: 'hidden', access: 'not_available',
    observedAt: OBSERVED_AT, sourceUrl: 'https://www.youtube.com/watch?v=zero',
    methodologyVersion: 'youtube-public-count-v1', freshness: { state: 'snapshot' }
  });
  assert.equal(availableZero.value, 0, 'literal zero is an observation, not missing data');
  assert.equal(availableZero.window, 'lifetime');
  assert.equal(availableZero.unit, 'count');
  assert.equal(availableZero.freshness.sourceUpdatedAt, OBSERVED_AT);
  assert.deepEqual(availableZero.confidence, { level: 'high', basis: 'provider_reported' });
  assert.equal(isUsableMetricObservation(availableZero), true);
  assert.equal(hidden.value, null, 'a hidden value may never survive as a numeric zero or count');
  assert.equal(hidden.availability, 'hidden');
  assert.equal(isUsableMetricObservation(hidden), false);
});

test('retrieval and synthesis use only usable observations and never create a universal score', () => {
  const youtube = owner('youtube', 'signal-channel', 'https://www.youtube.com/@signal-channel', 'Signal Channel');
  const zero = createMetricObservation({
    provider: 'youtube', entityType: 'content', entityId: youtube.content.id, metric: 'views', value: 0,
    observedAt: OBSERVED_AT, sourceUrl: youtube.content.canonicalUrl
  });
  const hidden = createMetricObservation({
    provider: 'youtube', entityType: 'content', entityId: youtube.content.id, metric: 'likes', value: 1000000,
    availability: 'hidden', visibility: 'hidden', observedAt: OBSERVED_AT, sourceUrl: youtube.content.canonicalUrl
  });
  const ranked = rankDiscoveryBundle({
    creators: [youtube.creator], platformIdentities: [youtube.identity], contentRecords: [youtube.content],
    metricObservations: [zero, hidden]
  }, { mode: 'trending', query: '', now: new Date(OBSERVED_AT), ranking: { mode: 'viral' }, filters: {} });
  const contentRanking = ranked.rankings.find((row) => row.entityType === 'content');
  assert.equal(contentRanking.signals.views, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(contentRanking.signals, 'likes'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(contentRanking, 'score'), false);

  const synthesis = deterministicSynthesis({
    mode: 'trending', bundle: ranked.bundle, rankings: ranked.rankings
  });
  assert.deepEqual(synthesis.evidenceIds, [zero.id]);
  assert.equal(JSON.stringify(synthesis).toLowerCase().includes('universal score'), false);
});

test('Market2 normalization keeps unavailable observations null and exposes their evidence semantics', () => {
  const window = {
    location: { href: 'https://backer.example/backerdemo.html', hash: '', origin: 'https://backer.example', pathname: '/backerdemo.html' },
    history: { replaceState() {} }
  };
  const context = vm.createContext({ window, URL, URLSearchParams, Intl, Date, Number, String, Object, Array, Math, console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'market2.js'), 'utf8'), context);
  const normalize = window.BackerMarket2.normalizeObservation;
  const zero = normalize({
    provider: 'youtube', metric: 'views', value: 0, unit: 'count', availability: 'available',
    visibility: 'public', access: 'public_page', observedAt: OBSERVED_AT,
    sourceUrl: 'https://www.youtube.com/watch?v=zero', methodologyVersion: 'youtube-public-count-v1',
    freshness: { state: 'fresh', capturedAt: OBSERVED_AT }, confidence: { level: 'high', basis: 'provider_reported' }
  });
  const hidden = normalize({
    provider: 'youtube', metric: 'views', value: 400, availability: 'hidden', visibility: 'hidden',
    access: 'not_available', observedAt: OBSERVED_AT, sourceUrl: 'https://www.youtube.com/watch?v=hidden'
  });
  assert.equal(zero.value, 0);
  assert.equal(zero.unit, 'count');
  assert.equal(zero.methodologyVersion, 'youtube-public-count-v1');
  assert.equal(zero.freshness.state, 'fresh');
  assert.equal(JSON.stringify(zero.confidence), JSON.stringify({ level: 'high', basis: 'provider_reported' }));
  assert.equal(window.BackerMarket2.observationUsable(zero), true);
  assert.equal(hidden.value, null);
  assert.equal(window.BackerMarket2.observationUsable(hidden), false);
});

test('Market2 card facts require current high-confidence observations with an explicit methodology', () => {
  const window = {
    location: { href: 'https://backer.example/backerdemo.html', hash: '', origin: 'https://backer.example', pathname: '/backerdemo.html' },
    history: { replaceState() {} }
  };
  const context = vm.createContext({ window, URL, URLSearchParams, Intl, Date, Number, String, Object, Array, Math, console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'market2.js'), 'utf8'), context);
  const normalize = window.BackerMarket2.normalizeObservation;
  const currentTime = new Date(Date.now() - 86_400_000).toISOString();
  const high = normalize({
    provider: 'github', metric: 'stars', value: 42, availability: 'available', visibility: 'public',
    access: 'public_api', observedAt: currentTime, sourceUrl: 'https://github.com/backer/example',
    methodologyVersion: 'github-rest-repository-v1', freshness: { state: 'fresh' },
    confidence: { level: 'high', basis: 'direct_official_api_field' }
  });
  const unassessed = normalize(Object.assign({}, high, {
    metric: 'forks', confidence: { level: 'unassessed', basis: 'provider_reported' }
  }));
  const noMethod = normalize(Object.assign({}, high, { metric: 'comments', methodologyVersion: '' }));
  const stale = normalize(Object.assign({}, high, {
    metric: 'views', observedAt: new Date(Date.now() - 31 * 86_400_000).toISOString()
  }));
  const facts = window.BackerMarket2.cardFacts({ metrics: [unassessed, noMethod, stale, high], content: [] }, 2);
  assert.deepEqual(Array.from(facts, (fact) => fact.label), ['stars']);
});
