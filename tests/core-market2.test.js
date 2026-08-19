'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  applySnapshotQuery,
  databasePersonState,
  databaseSnapshotStatus,
  decodeCursor,
  encodeCursor,
  isEligibilityTradable,
  normalizeQuery,
  publicProviderState,
  readDatabaseSnapshot,
  readStaticSnapshot,
  sanitizeEvidence,
  sanitizeMarketCatalog,
  sanitizeMetric,
  sanitizePerson,
  sanitizeRollup
} = require('../api/_lib/market2-repository');
const { createMarket2PeopleHandler } = require('../api/market2/people');
const { createMarket2SyncHandler } = require('../api/market2/sync');

async function syncModule() {
  return import('../scripts/sync-market2-people.mjs');
}

function sourceAccount(platform, nativeAccountId) {
  return {
    id: `account:${platform}:${nativeAccountId}`,
    platform,
    nativeAccountId,
    handle: nativeAccountId,
    profileUrl: `https://example.test/${nativeAccountId}`,
    verificationState: 'unverified',
    policyMode: 'discovery-only',
    refreshedAt: '2026-08-11T00:00:00Z'
  };
}

function personFixture(overrides) {
  return Object.assign({
    id: 'person:x:creator',
    displayName: 'Creator',
    platforms: ['x'],
    coverageWindows: ['7d'],
    sourceAccounts: [sourceAccount('x', 'creator')],
    content: [],
    metrics: [],
    evidence: [],
    marketEligibility: []
  }, overrides || {});
}

function responseRecorder() {
  const headers = {};
  return {
    headers,
    setHeader(name, value) { headers[name] = value; },
    end(value) { this.body = value; }
  };
}

test('Market 2 query normalization is bounded and deterministic', () => {
  const query = normalizeQuery({
    platform: 'X, github,not-a-platform,x',
    window: '30D',
    view: 'CREATOR-RADAR',
    sort: 'provider-rank',
    cursor: encodeCursor(17),
    limit: 900
  });
  assert.deepEqual(query.platforms, ['x', 'github']);
  assert.equal(query.window, '30d');
  assert.equal(query.view, 'creator-radar');
  assert.equal(query.sort, 'provider-rank');
  assert.equal(query.cursorOffset, 17);
  assert.equal(query.limit, 50);
});

test('Market 2 cursors traverse beyond ten thousand and reject malformed offsets', () => {
  const people = Array.from({ length: 10_052 }, (_, index) => personFixture({
    id: `person:x:creator-${index}`,
    personId: `person:x:creator-${index}`,
    displayName: `Creator ${index}`,
    sourceAccounts: [sourceAccount('x', `creator-${index}`)]
  }));
  const page = applySnapshotQuery({
    generatedAt: '2026-08-19T00:00:00Z',
    status: 'snapshot',
    people
  }, {
    platform: 'x',
    window: '7d',
    cursor: encodeCursor(10_050),
    limit: 2
  }, '2026-08-19T00:00:00Z');
  assert.deepEqual(page.people.map(person => person.personId), [
    'person:x:creator-10050',
    'person:x:creator-10051'
  ]);
  assert.equal(page.nextCursor, null);
  assert.equal(decodeCursor(encodeCursor(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
  assert.throws(() => decodeCursor(Buffer.from(JSON.stringify({ offset: -1 })).toString('base64url')), /cursor/i);
  assert.throws(() => decodeCursor(Buffer.from(JSON.stringify({ offset: 1.5 })).toString('base64url')), /cursor/i);
  assert.throws(() => decodeCursor('not*base64url'), /cursor/i);
});

test('tradability fails closed unless every consent and review gate passes', () => {
  const eligible = {
    instrument: 'milestones',
    status: 'eligible',
    consentStatus: 'active',
    grantsProfilePublication: true,
    grantsTrading: true,
    platformAccountVerified: true,
    rightPublicityReview: 'approved',
    policyReview: 'approved',
    settlementSource: 'contract:milestone:42',
    consentExpiresAt: '2027-01-01T00:00:00Z'
  };
  assert.equal(isEligibilityTradable(eligible, '2026-08-11T00:00:00Z'), true);
  assert.equal(isEligibilityTradable(Object.assign({}, eligible, { grantsTrading: false })), false);
  assert.equal(isEligibilityTradable(Object.assign({}, eligible, { grantsTrading: 'false' })), false);
  assert.equal(isEligibilityTradable(Object.assign({}, eligible, { consentStatus: 'revoked' })), false);
  assert.equal(isEligibilityTradable(Object.assign({}, eligible, { settlementSource: '' })), false);
  assert.equal(isEligibilityTradable(Object.assign({}, eligible, { consentExpiresAt: '2026-01-01T00:00:00Z' }), '2026-08-11T00:00:00Z'), false);
  assert.equal(isEligibilityTradable(null), false);
});

test('database freshness state cannot call cached provider rows live', () => {
  assert.equal(databaseSnapshotStatus({ x: { status: 'succeeded' } }, ['x']), 'live');
  assert.equal(databaseSnapshotStatus({
    x: { status: 'succeeded' },
    github: { status: 'rate-limited' }
  }, ['x', 'github']), 'partial');
  assert.equal(databaseSnapshotStatus({ x: { status: 'failed' } }, ['x']), 'delayed');
  assert.equal(databaseSnapshotStatus({ x: { status: 'empty-window' } }, ['x']), 'empty-window');
  assert.equal(databaseSnapshotStatus({}, ['x']), 'delayed');
});

test('database people must belong to the latest successful provider refresh', () => {
  const person = personFixture();
  assert.equal(databasePersonState(person, {
    x: { status: 'succeeded', refreshedAt: '2026-08-11T00:00:00Z' }
  }), 'current');
  assert.equal(databasePersonState(person, {
    x: { status: 'succeeded', refreshedAt: '2026-08-12T00:00:00Z' }
  }), 'exclude');
  assert.equal(databasePersonState(person, {
    x: { status: 'partial', refreshedAt: '2026-08-12T00:00:00Z' }
  }), 'last-good');
  assert.equal(databasePersonState(person, {
    x: { status: 'failed', refreshedAt: null }
  }), 'last-good');
  assert.equal(databasePersonState(person, {}), 'exclude');
});

test('a successful empty provider refresh excludes historical rows from the database read', async () => {
  const calls = [];
  const snapshot = await readDatabaseSnapshot({ platform: 'x', window: '7d' }, {
    now: new Date('2026-08-11T00:00:00Z'),
    query: async (statement, parameters) => {
      calls.push({ statement, parameters });
      if (/from market2_sync_runs/.test(statement)) {
        return {
          rows: [{
            provider: 'x',
            status: 'empty-window',
            completed_at: '2026-08-11T00:00:00Z',
            people_count: 0,
            content_count: 0,
            metric_count: 0,
            rate_limit_metadata: {}
          }]
        };
      }
      assert.deepEqual(parameters[0], []);
      return { rows: [] };
    }
  });
  assert.equal(calls.length, 2);
  assert.equal(snapshot.status, 'empty-window');
  assert.deepEqual(snapshot.people, []);
});

test('unapproved YouTube-derived metrics and score inputs never reach the read model', () => {
  const person = sanitizePerson(personFixture({
    id: 'person:youtube:channel-1',
    platforms: ['youtube'],
    sourceAccounts: [sourceAccount('youtube', 'channel-1')],
    metrics: [
      { platform: 'youtube', metricName: 'viewCount', rawValue: 800, isDerived: false },
      { platform: 'youtube', metricName: 'velocity', rawValue: 91, isDerived: true, policyMode: 'backer-score-v1' },
      { platform: 'youtube', metricName: 'approved_velocity', rawValue: 72, isDerived: true, policyMode: 'youtube-derived-approved' }
    ],
    evidence: [{
      window: '7d',
      facts: [],
      crossPlatformScore: 89,
      youtubeIncludedInScore: true,
      youtubePolicyMode: 'raw-provider-only',
      coverageGaps: []
    }]
  }), normalizeQuery({ platform: 'youtube', window: '7d' }));
  assert.deepEqual(person.metrics.map(item => item.metricName), ['viewCount', 'approved_velocity']);
  assert.equal(person.evidence[0].crossPlatformScore, null);
  assert.equal(person.evidence[0].youtubeIncludedInScore, false);
  assert.match(person.evidence[0].coverageGaps[0], /excluded/i);
  const mislabeledScore = sanitizeEvidence({
    platformCoverage: ['youtube', 'x'],
    facts: [],
    crossPlatformScore: 64,
    youtubeIncludedInScore: false,
    youtubePolicyMode: 'raw-provider-only'
  }, ['youtube', 'x']);
  assert.equal(mislabeledScore.crossPlatformScore, null);
});

test('YouTube observations expire from the public read model after the refresh window', () => {
  const stale = personFixture({
    id: 'person:youtube:channel-1',
    platforms: ['youtube'],
    coverageWindows: ['24h'],
    sourceAccounts: [Object.assign(sourceAccount('youtube', 'channel-1'), {
      refreshedAt: '2026-06-01T00:00:00Z'
    })]
  });
  assert.equal(sanitizePerson(
    stale,
    normalizeQuery({ platform: 'youtube', window: '24h' }),
    '2026-08-11T00:00:00Z'
  ), null);
});

test('hidden and opted-out people cannot reappear through a static snapshot', () => {
  const query = normalizeQuery({ platform: 'x', window: '7d' });
  assert.equal(sanitizePerson(personFixture({ discoveryStatus: 'hidden' }), query), null);
  assert.equal(sanitizePerson(personFixture({ discoveryStatus: 'opted-out' }), query), null);
});

test('static snapshots are always disclosed as snapshots and never relabeled live', async () => {
  const source = {
    schemaVersion: 1,
    generatedAt: '2026-08-10T00:00:00Z',
    status: 'live',
    isFixture: false,
    people: [personFixture()]
  };
  const snapshot = await readStaticSnapshot({ platform: 'x', window: '7d' }, {
    now: new Date('2026-08-11T00:00:00Z'),
    readFile: async () => JSON.stringify(source)
  });
  assert.equal(snapshot.status, 'delayed');
  assert.equal(snapshot.isSnapshot, true);
  assert.equal(snapshot.isFixture, false);
  assert.equal(snapshot.people.length, 1);
  assert.equal(snapshot.people[0].dataState, 'last-good');
  assert.equal(snapshot.people[0].snapshotAsOf, source.generatedAt);
});

test('snapshot coverage filters unsupported time windows rather than fabricating data', () => {
  const snapshot = applySnapshotQuery({
    generatedAt: '2026-08-11T00:00:00Z',
    status: 'snapshot',
    people: [personFixture()]
  }, { platform: 'x', window: '90d' }, '2026-08-11T00:00:00Z');
  assert.equal(snapshot.status, 'empty-window');
  assert.deepEqual(snapshot.people, []);
});

test('an empty rate-limited snapshot remains distinct from an empty evidence window', () => {
  const snapshot = applySnapshotQuery({
    generatedAt: '2026-08-11T00:00:00Z',
    status: 'rate-limited',
    people: []
  }, { platform: 'x', window: '7d' }, '2026-08-11T00:00:00Z');
  assert.equal(snapshot.status, 'rate-limited');
});

test('API handler exposes cache, provenance, and data-state headers', async () => {
  const snapshot = {
    schemaVersion: 1,
    generatedAt: '2026-08-11T00:00:00Z',
    status: 'delayed',
    isSnapshot: true,
    people: []
  };
  const handler = createMarket2PeopleHandler({
    latestMarket2People: async query => {
      assert.equal(query.window, '7d');
      return { snapshot, source: 'static-cache' };
    }
  });
  const headers = {};
  let body;
  const response = {
    setHeader(name, value) { headers[name] = value; },
    end(value) { body = value; }
  };
  await handler({ method: 'GET', query: { window: '7d' } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(headers['X-Backer-Data-Source'], 'static-cache');
  assert.equal(headers['X-Backer-Data-State'], 'delayed');
  assert.match(headers['Cache-Control'], /stale-while-revalidate/);
  assert.deepEqual(JSON.parse(body), snapshot);
});

test('official sync is graceful with no provider credentials', async () => {
  const module = await syncModule();
  const snapshot = await module.buildMarket2Snapshot({
    now: new Date('2026-08-11T00:00:00Z'),
    tokens: {},
    fetchImpl: async () => { throw new Error('network should not be called'); }
  });
  assert.equal(snapshot.status, 'permission-required');
  assert.equal(snapshot.people.length, 0);
  assert.deepEqual(Object.values(snapshot.providerStatus).map(value => value.status), [
    'permission-required',
    'permission-required',
    'permission-required',
    'permission-required'
  ]);
});

test('platform review and public-only access are explicit ingestion gates', async () => {
  const module = await syncModule();
  const fetchImpl = async () => { throw new Error('network should not be called before policy approval'); };
  const x = await module.syncX({ token: 'token', commercialUseApproved: false, fetchImpl });
  const instagram = await module.syncInstagram({
    token: 'token',
    igUserId: 'ig-user',
    handles: ['creator'],
    appReviewApproved: false,
    fetchImpl
  });
  const github = await module.syncGitHub({
    token: 'token',
    publicOnlyAccessApproved: false,
    fetchImpl
  });
  assert.equal(x.status, 'permission-required');
  assert.equal(x.diagnosticCode, 'x_commercial_use_review_required');
  assert.equal(instagram.status, 'permission-required');
  assert.equal(instagram.diagnosticCode, 'instagram_app_review_required');
  assert.equal(github.status, 'permission-required');
  assert.equal(github.diagnosticCode, 'github_public_only_token_required');
  const githubSearch = module.publicGitHubUrl(
    'https://api.github.com/search/repositories?q=pushed%3A%3E%3D2026-08-04'
  );
  assert.match(githubSearch.searchParams.get('q'), /(?:^|\s)is:public(?:\s|$)/);
});

test('YouTube adapter preserves provider ordering and raw metrics without a Backer score', async () => {
  const module = await syncModule();
  const responses = {
    videos: {
      items: [{
        id: 'video-1',
        snippet: {
          channelId: 'channel-1',
          title: 'A real public video',
          publishedAt: '2026-08-11T00:00:00Z',
          thumbnails: { high: { url: 'https://i.ytimg.com/video-1.jpg' } }
        },
        statistics: { viewCount: '1200', likeCount: '80' }
      }]
    },
    channels: {
      items: [{
        id: 'channel-1',
        snippet: {
          customUrl: '@creator',
          title: 'Creator',
          description: 'Makes useful videos.',
          thumbnails: { high: { url: 'https://yt3.ggpht.com/channel-1' } }
        },
        statistics: { subscriberCount: '9000', videoCount: '40' },
        contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } }
      }]
    },
    playlistItems: { items: [] }
  };
  const fetchImpl = async urlValue => {
    const resource = new URL(String(urlValue)).pathname.split('/').pop();
    assert.ok(responses[resource], `unexpected YouTube resource ${resource}`);
    return {
      ok: true,
      status: 200,
      headers: { get() { return null; } },
      async json() { return responses[resource]; }
    };
  };
  const result = await module.syncYouTube({
    apiKey: 'test-key',
    fetchImpl,
    now: new Date('2026-08-11T01:00:00Z'),
    regionCode: 'US',
    peopleLimit: 1
  });
  assert.equal(result.status, 'fresh');
  assert.equal(result.people.length, 1);
  const person = result.people[0];
  assert.equal(person.bestProviderRank, 1);
  assert.equal(person.breakoutWork.providerRank, 1);
  assert.equal(person.evidence[0].crossPlatformScore, null);
  assert.equal(person.evidence[0].youtubeIncludedInScore, false);
  assert.equal(person.discoveryOnly, true);
  assert.equal(person.tradable, false);
  assert.equal(person.metrics.some(item => item.isDerived), false);
  assert.equal(person.content[0].thumbnailPolicy, 'embed-only');
});

test('failed providers retain last-good people with an explicit delayed state', async () => {
  const module = await syncModule();
  const current = await module.buildMarket2Snapshot({
    now: new Date('2026-08-11T00:00:00Z'),
    tokens: {},
    fetchImpl: async () => { throw new Error('network should not be called'); }
  });
  const previous = {
    generatedAt: '2026-08-10T00:00:00Z',
    people: [personFixture()],
    providerStatus: { x: { status: 'fresh' } }
  };
  const merged = module.mergeWithLastGood(current, previous);
  assert.equal(merged.status, 'delayed');
  assert.equal(merged.generatedAt, previous.generatedAt);
  assert.equal(merged.people[0].dataState, 'last-good');
  assert.equal(merged.providerStatus.x.status, 'last-good');
  assert.equal(merged.providerStatus.x.failedStatus, 'permission-required');
});

test('partial refreshes prefer fresh records and retain only missing last-good people', async () => {
  const module = await syncModule();
  const refreshed = personFixture({ displayName: 'Creator refreshed' });
  const missing = personFixture({ id: 'person:x:missing', displayName: 'Missing creator' });
  const merged = module.mergeWithLastGood({
    generatedAt: '2026-08-11T00:00:00Z',
    status: 'partial',
    people: [refreshed],
    providerStatus: { x: { status: 'partial' } }
  }, {
    generatedAt: '2026-08-10T00:00:00Z',
    people: [personFixture({ displayName: 'Creator stale' }), missing],
    providerStatus: { x: { status: 'fresh' } }
  });
  assert.equal(merged.people.length, 2);
  assert.equal(merged.people.find(person => person.id === refreshed.id).displayName, 'Creator refreshed');
  assert.equal(merged.people.find(person => person.id === missing.id).dataState, 'last-good');
  assert.equal(merged.providerStatus.x.status, 'partial');
  assert.equal(merged.providerStatus.x.retainedLastGood, true);
});

test('last-good merge does not retain expired YouTube observations', async () => {
  const module = await syncModule();
  const staleYouTube = personFixture({
    id: 'person:youtube:stale',
    platforms: ['youtube'],
    sourceAccounts: [Object.assign(sourceAccount('youtube', 'stale'), {
      refreshedAt: '2026-06-01T00:00:00Z'
    })]
  });
  assert.equal(module.isRetentionSafePerson(staleYouTube, '2026-08-11T00:00:00Z'), false);
  const merged = module.mergeWithLastGood({
    generatedAt: '2026-08-11T00:00:00Z',
    status: 'permission-required',
    people: [],
    providerStatus: { youtube: { status: 'permission-required' } }
  }, {
    generatedAt: '2026-06-01T00:00:00Z',
    people: [staleYouTube],
    providerStatus: { youtube: { status: 'fresh' } }
  });
  assert.deepEqual(merged.people, []);
  assert.equal(merged.providerStatus.youtube.status, 'permission-required');
});

test('opt-outs suppress people and content tombstones become safe removed states', async () => {
  const module = await syncModule();
  const content = {
    id: 'content:x:post-1',
    personId: 'person:x:creator',
    sourceAccountId: 'account:x:creator',
    platform: 'x',
    nativeContentId: 'post-1',
    url: 'https://x.com/creator/status/post-1',
    title: 'Original post text',
    type: 'post',
    publishedAt: '2026-08-11T00:00:00Z',
    thumbnailUrl: 'https://pbs.twimg.com/post-1.jpg',
    thumbnailPolicy: 'provider-url-refresh-required',
    availability: 'available'
  };
  const creator = personFixture({
    content: [content],
    latestWork: content,
    breakoutWork: content,
    metrics: [{ platform: 'x', subjectType: 'content', subjectId: 'post-1', metricName: 'like_count' }],
    evidence: [{ facts: [{ platform: 'x', subjectType: 'content', subjectId: 'post-1' }], coverageGaps: [] }]
  });
  const removedContent = module.applyPublicationSuppressions({ people: [creator] }, {
    contentTombstones: [{ provider: 'x', nativeObjectId: 'post-1' }]
  });
  assert.equal(removedContent.people[0].content[0].availability, 'removed');
  assert.equal(removedContent.people[0].content[0].url, null);
  assert.equal(removedContent.people[0].content[0].thumbnailUrl, null);
  assert.deepEqual(removedContent.people[0].metrics, []);
  assert.deepEqual(removedContent.people[0].evidence[0].facts, []);
  const optedOut = module.applyPublicationSuppressions({ people: [creator] }, {
    personIds: [creator.id]
  });
  assert.deepEqual(optedOut.people, []);
});

test('reviewed identity links merge source accounts but display names never do', async () => {
  const module = await syncModule();
  const xPerson = personFixture({
    id: 'person:x:101',
    personId: 'person:x:101',
    displayName: 'Same Display Name',
    sourceAccounts: [Object.assign(sourceAccount('x', '101'), { handle: '@reviewed' })]
  });
  const youtubePerson = personFixture({
    id: 'person:youtube:202',
    personId: 'person:youtube:202',
    displayName: 'Same Display Name',
    platforms: ['youtube'],
    sourceAccounts: [Object.assign(sourceAccount('youtube', '202'), { handle: '@reviewed-channel' })]
  });
  assert.equal(module.applyIdentityGraph([xPerson, youtubePerson], { people: [] }).length, 2);
  const graph = {
    people: [{
      personId: 'person:canonical:reviewed',
      slug: 'reviewed-person',
      displayName: 'Reviewed Person',
      linkConfidence: 'editorial_reviewed',
      reviewState: 'approved',
      reviewedBy: 'editor',
      reviewedAt: '2026-08-12T00:00:00Z',
      accounts: [
        { platform: 'x', handle: 'reviewed', profileUrl: 'https://x.com/reviewed' },
        { platform: 'youtube', handle: 'reviewed-channel', profileUrl: 'https://youtube.com/@reviewed-channel' }
      ]
    }]
  };
  const merged = module.applyIdentityGraph([xPerson, youtubePerson], graph);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].personId, 'person:canonical:reviewed');
  assert.deepEqual(merged[0].platforms.sort(), ['x', 'youtube']);
  assert.equal(merged[0].identityConfidence, 'editorial_reviewed');
  assert.equal(merged[0].tradable, false);
});

test('window rollups require distinct baseline and current observations', async () => {
  const module = await syncModule();
  const observation = (rawHash, observedAt, rawValue) => ({
    rawHash,
    personId: 'person:github:1',
    platform: 'github',
    subjectType: 'repository',
    subjectId: 'repo-1',
    metricName: 'repository_stars',
    nativeMetricName: 'stargazers_count',
    rawValue,
    rawText: String(rawValue),
    observedAt,
    availability: 'available',
    accessClass: 'public_app',
    publiclyDisplayable: true,
    isDerived: false,
    kind: 'counter'
  });
  const complete = module.buildMetricRollups([
    observation('baseline', '2026-08-05T00:00:00Z', 100),
    observation('current', '2026-08-12T00:00:00Z', 145)
  ], '2026-08-12T00:00:00Z').find(item => item.window === '7d');
  assert.equal(complete.state, 'complete');
  assert.equal(complete.baseline, 100);
  assert.equal(complete.current, 145);
  assert.equal(complete.absoluteDelta, 45);
  assert.equal(complete.percentDelta, 45);
  assert.equal(complete.sampleCount, 2);
  const newOnly = module.buildMetricRollups([
    observation('only', '2026-08-12T00:00:00Z', 145)
  ], '2026-08-12T00:00:00Z').find(item => item.window === '7d');
  assert.equal(newOnly.state, 'newly_observed');
  assert.equal(newOnly.baseline, null);
  assert.equal(newOnly.absoluteDelta, null);
  assert.equal(newOnly.percentDelta, null);
});

test('owner-only metrics and malformed movement fail closed in the public model', () => {
  const privateMetric = sanitizeMetric({
    platform: 'instagram',
    metricName: 'saved',
    rawValue: 42,
    rawText: '42',
    availability: 'available',
    accessClass: 'creator_authorized',
    publiclyDisplayable: false
  }, '2026-08-12T00:00:00Z');
  assert.equal(privateMetric.availability, 'permission_required');
  assert.equal(privateMetric.rawValue, null);
  assert.equal(privateMetric.freshnessState, 'permission_required');
  const consented = sanitizeMetric(Object.assign({}, privateMetric, {
    availability: 'available',
    rawValue: 42,
    rawText: '42',
    publiclyDisplayable: true
  }), '2026-08-12T00:00:00Z');
  assert.equal(consented.rawValue, 42);
  const invalidRollup = sanitizeRollup({
    platform: 'github',
    metricKey: 'repository_stars',
    window: '7d',
    current: 10,
    baseline: 4,
    absoluteDelta: 6,
    sampleCount: 1,
    observationIds: ['one'],
    state: 'complete',
    accessClass: 'public_app'
  });
  assert.equal(invalidRollup.state, 'unavailable');
  assert.equal(invalidRollup.absoluteDelta, null);
});

test('GitHub notification watchers map only from subscribers_count', async () => {
  const module = await syncModule();
  const metrics = module.githubRepositoryMetrics({
    stargazers_count: 120,
    forks_count: 9,
    watchers_count: 120,
    subscribers_count: 7
  }, 'person:github:1', 'repo-1', new Date('2026-08-12T00:00:00Z'), 'https://github.com/example/repo');
  assert.equal(metrics.find(item => item.metricName === 'repository_stars').rawValue, 120);
  assert.equal(metrics.find(item => item.metricName === 'repository_forks').rawValue, 9);
  assert.equal(metrics.find(item => item.metricName === 'repository_watchers').rawValue, 7);
});

test('Instagram authorized Insights map saved, shares, and reposts only with public consent', async () => {
  const module = await syncModule();
  let calls = 0;
  const fetchImpl = async urlValue => {
    calls += 1;
    const url = new URL(String(urlValue));
    const insights = url.pathname.endsWith('/media-1/insights');
    return {
      ok: true,
      status: 200,
      headers: { get() { return null; } },
      async json() {
        if (insights) return { data: [
          { name: 'saved', values: [{ value: 12 }] },
          { name: 'shares', values: [{ value: 3 }] },
          { name: 'reposts', values: [{ value: 1 }] }
        ] };
        return { business_discovery: {
          id: 'creator-id',
          username: 'creator',
          name: 'Creator',
          profile_picture_url: 'https://cdn.example/creator.jpg',
          followers_count: 100,
          media_count: 1,
          media: { data: [{
            id: 'media-1',
            permalink: 'https://www.instagram.com/p/media-1/',
            timestamp: '2026-08-12T00:00:00Z',
            media_type: 'IMAGE',
            like_count: 20,
            comments_count: 2
          }] }
        } };
      }
    };
  };
  const consented = await module.syncInstagram({
    token: 'token',
    igUserId: 'ig-user',
    handles: ['creator'],
    appReviewApproved: true,
    insightsEnabled: true,
    insightsHandles: ['creator'],
    insightsConsentId: 'consent-1',
    insightsPublicDisplayAllowed: true,
    fetchImpl,
    now: new Date('2026-08-12T00:00:00Z')
  });
  assert.equal(calls, 2);
  const ownerMetrics = consented.people[0].metrics.filter(item => ['saved', 'shares', 'reposts'].includes(item.metricName));
  assert.deepEqual(ownerMetrics.map(item => item.rawValue), [12, 3, 1]);
  assert.equal(ownerMetrics.every(item => item.accessClass === 'creator_authorized'), true);
  assert.equal(ownerMetrics.every(item => item.consentId === 'consent-1'), true);

  calls = 0;
  const blocked = await module.syncInstagram({
    token: 'token',
    igUserId: 'ig-user',
    handles: ['creator'],
    appReviewApproved: true,
    insightsEnabled: true,
    insightsHandles: ['creator'],
    insightsConsentId: '',
    insightsPublicDisplayAllowed: false,
    fetchImpl,
    now: new Date('2026-08-12T00:00:00Z')
  });
  assert.equal(calls, 1);
  const blockedMetrics = blocked.people[0].metrics.filter(item => ['saved', 'shares', 'reposts'].includes(item.metricName));
  assert.equal(blockedMetrics.every(item => item.availability === 'permission_required'), true);
  assert.equal(blockedMetrics.every(item => item.rawValue === null), true);
});

test('YouTube never enters a cross-platform score, including approved-derived mode', () => {
  const evidence = sanitizeEvidence({
    platformCoverage: ['youtube', 'github'],
    facts: [],
    crossPlatformScore: 77,
    youtubeIncludedInScore: true,
    youtubePolicyMode: 'youtube-derived-approved',
    coverageGaps: []
  }, ['youtube', 'github']);
  assert.equal(evidence.crossPlatformScore, null);
  assert.equal(evidence.youtubeIncludedInScore, false);
  assert.match(evidence.coverageGaps.join(' '), /isolated/i);
});

test('provider states and market catalog use the frozen public contract', () => {
  assert.equal(publicProviderState('succeeded'), 'live');
  assert.equal(publicProviderState('rate-limited'), 'stale_snapshot');
  assert.equal(publicProviderState('permission-required'), 'permission_required');
  assert.equal(publicProviderState('failed'), 'unavailable');
  const catalog = sanitizeMarketCatalog([
    {
      marketId: 'market-1',
      personId: 'person-1',
      publicationState: 'published',
      isSimulation: true,
      status: 'open',
      closesAt: '2026-09-01T00:00:00Z',
      tradeEligible: true,
      outcomes: []
    },
    {
      marketId: 'private-market',
      publicationState: 'private',
      isSimulation: true,
      status: 'open',
      closesAt: '2026-09-01T00:00:00Z',
      tradeEligible: true
    }
  ], '2026-08-12T00:00:00Z');
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].tradeEligible, true);
});

test('Market 2 migration and identity graph encode reviewed links, observations, consent, markets, and drafts', () => {
  const root = path.resolve(__dirname, '..');
  const migration = fs.readFileSync(path.join(root, 'migrations', '004_market2_attention_markets.sql'), 'utf8');
  const graph = JSON.parse(fs.readFileSync(path.join(root, 'data', 'market2-identity-graph.json'), 'utf8'));
  [
    'market2_identity_links',
    'market2_provider_observations',
    'market2_metric_rollups',
    'market2_consent_scopes',
    'market2_market_catalog',
    'market2_market_drafts'
  ].forEach(name => assert.match(migration, new RegExp(`create table if not exists ${name}`)));
  assert.equal(graph.matchingPolicy.displayNameMatching, false);
  assert.equal(graph.people.every(person => person.reviewState === 'approved'), true);
  assert.equal(graph.people.some(person => person.accounts.length > 1), true);
});

test('cron sync handler requires CRON_SECRET and returns counts and states only', async () => {
  let persisted = false;
  const previous = { generatedAt: '2026-08-11T00:00:00Z', people: [{ id: 'stale' }] };
  const snapshot = {
    generatedAt: '2026-08-12T00:00:00Z',
    status: 'partial',
    people: [{ id: 'fresh' }],
    providerStatus: {
      x: {
        status: 'fresh',
        state: 'live',
        peopleCount: 1,
        contentCount: 2,
        metricCount: 3,
        diagnosticCode: 'must-not-be-returned',
        rawPayload: { token: 'must-not-leak' }
      }
    }
  };
  const sync = {
    OUTPUT_PATH: '/tmp/market2.json',
    readExistingSnapshot: async () => previous,
    buildMarket2Snapshot: async options => {
      assert.equal(options.tokens.x, 'provider-secret');
      assert.equal(options.previousSnapshot, previous);
      return snapshot;
    },
    mergeWithLastGood: () => Object.assign({}, snapshot, {
      people: [{ id: 'fresh' }, { id: 'stale', dataState: 'last-good' }]
    }),
    persistSnapshot: async () => {
      persisted = true;
      return { personIds: [], accountTombstones: [], contentTombstones: [] };
    },
    applyPublicationSuppressions: value => value,
    atomicWriteJson: async () => { throw new Error('serverless handler must not write unless configured'); }
  };
  const handler = createMarket2SyncHandler({
    cronSecret: 'a-secure-cron-secret',
    syncModule: sync,
    now: () => new Date('2026-08-12T00:00:00Z'),
    environment: {
      DATABASE_URL: 'postgres://database.example/backer',
      X_BEARER_TOKEN: 'provider-secret'
    }
  });
  const denied = responseRecorder();
  await handler({ method: 'GET', headers: { authorization: 'Bearer wrong' } }, denied);
  assert.equal(denied.statusCode, 401);
  const allowed = responseRecorder();
  await handler({ method: 'GET', headers: { authorization: 'Bearer a-secure-cron-secret' } }, allowed);
  assert.equal(allowed.statusCode, 200);
  assert.equal(persisted, true);
  const body = JSON.parse(allowed.body);
  assert.equal(body.peopleCount, 2);
  assert.equal(body.lastGoodPeopleCount, 1);
  assert.deepEqual(body.providerStatus.x, {
    state: 'live',
    status: 'fresh',
    peopleCount: 1,
    contentCount: 2,
    metricCount: 3,
    retainedLastGood: false
  });
  assert.doesNotMatch(allowed.body, /provider-secret|must-not-leak|must-not-be-returned|postgres/);
});
