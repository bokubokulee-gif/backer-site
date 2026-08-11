'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applySnapshotQuery,
  databasePersonState,
  databaseSnapshotStatus,
  encodeCursor,
  isEligibilityTradable,
  normalizeQuery,
  readDatabaseSnapshot,
  readStaticSnapshot,
  sanitizeEvidence,
  sanitizePerson
} = require('../api/_lib/market2-repository');
const { createMarket2PeopleHandler } = require('../api/market2/people');

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
