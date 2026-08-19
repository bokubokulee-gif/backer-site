'use strict';

const crypto = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createContentRecord,
  compactText,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle,
  stableId
} = require('../api/_lib/discovery-model');
const { createProviderAdapter, runProvider, validatePage } = require('../api/_lib/discovery-provider');
const { MAX_CATALOG_BYTES, normalizeCatalog, overlayProviderRuns } = require('../api/_lib/discovery-catalog');
const { persistDiscoveryResults } = require('../api/_lib/discovery-repository');
const { enforceDiscoveryRateLimit, resetLocalDiscoveryRateLimitForTests } = require('../api/_lib/discovery-rate-limit');
const { rankDiscoveryBundle } = require('../api/_lib/discovery-rank');
const { deterministicSynthesis, modelSynthesis, synthesizeDiscovery } = require('../api/_lib/discovery-synthesis');
const {
  createDiscoverySearchHandler,
  encodeCursor,
  rankingSnapshotId,
  requestFingerprint,
  validateRequest
} = require('../api/discovery/search');
const { createDiscoverySyncHandler } = require('../api/discovery/sync');
const { runDiscoveryProviders } = require('../lib/discovery/registry');
const { parseFeedConfig, privateIp } = require('../lib/discovery/providers/feeds');
const { facebook, instagram } = require('../lib/discovery/providers/meta');
const { linkedin } = require('../lib/discovery/providers/linkedin');
const { twitch } = require('../lib/discovery/providers/twitch');
const { x } = require('../lib/discovery/providers/x');
const { youtube } = require('../lib/discovery/providers/youtube');
const discoverySnapshot = require('../data/discovery-catalog.json');

const NOW = new Date('2026-08-19T12:00:00.000Z');
const EMPTY_CACHE = Object.freeze({
  creators: [], platformIdentities: [], contentRecords: [], metricObservations: [],
  providerRuns: [], providerCursors: {}
});

function response() {
  return {
    headers: {},
    statusCode: 0,
    body: undefined,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end(value) { this.body = value ? JSON.parse(value) : undefined; }
  };
}

function request(method, body, headers) {
  return {
    method,
    body,
    headers: Object.assign({ 'content-type': 'application/json', origin: 'http://localhost:8000' }, headers || {}),
    socket: { remoteAddress: '127.0.0.1' }
  };
}

function fixture(provider, nativeId, options) {
  const input = options || {};
  const observedAt = input.observedAt || NOW.toISOString();
  const creator = createCreator({
    provider,
    nativeId,
    displayName: input.displayName || `Creator ${nativeId}`,
    bio: input.bio || 'Public creator profile',
    avatarUrl: `https://images.example/${encodeURIComponent(nativeId)}.png`,
    observedAt
  });
  const identity = createPlatformIdentity({
    creatorId: creator.id,
    provider,
    nativeId,
    handle: input.handle || nativeId,
    profileUrl: input.profileUrl || `https://profiles.example/${provider}/${encodeURIComponent(nativeId)}`,
    observedAt
  });
  creator.primaryIdentityId = identity.id;
  const content = createContentRecord({
    creatorId: creator.id,
    platformIdentityId: identity.id,
    provider,
    nativeId: `${nativeId}-content`,
    contentType: input.contentType || 'article',
    title: input.title || `Work by ${nativeId}`,
    excerpt: input.excerpt || 'Evidence-backed public content',
    canonicalUrl: input.contentUrl || `https://content.example/${provider}/${encodeURIComponent(nativeId)}`,
    publishedAt: Object.prototype.hasOwnProperty.call(input, 'publishedAt') ? input.publishedAt : '2026-08-18T12:00:00.000Z',
    observedAt
  });
  const metrics = input.metric == null ? [] : [createMetricObservation({
    entityType: input.metricEntityType || 'content',
    entityId: input.metricEntityType === 'identity' ? identity.id : input.metricEntityType === 'creator' ? creator.id : content.id,
    provider,
    metric: input.metric,
    value: input.metricValue,
    observedAt,
    sourceUrl: input.metricEntityType === 'identity' ? identity.profileUrl : content.canonicalUrl
  })].filter(Boolean);
  return {
    creators: [creator],
    platformIdentities: [identity],
    contentRecords: [content],
    metricObservations: metrics
  };
}

function catalogFrom(bundle, runs) {
  return Object.assign({ schemaVersion: 1, generatedAt: NOW.toISOString() }, bundle, { providerRuns: runs || [] });
}

function emptyCatalog() {
  return catalogFrom({ creators: [], platformIdentities: [], contentRecords: [], metricObservations: [] });
}

function manyFixtures(provider, prefix, start, count, options) {
  const rows = Array.from({ length: count }, (_value, index) => fixture(provider, `${prefix}-${start + index}`, Object.assign({
    title: `Trending work ${start + index}`,
    metric: 'stars',
    metricValue: 1_000_000 - start - index
  }, options || {})));
  return dedupeDiscoveryBundle({
    creators: rows.flatMap((row) => row.creators),
    platformIdentities: rows.flatMap((row) => row.platformIdentities),
    contentRecords: rows.flatMap((row) => row.contentRecords),
    metricObservations: rows.flatMap((row) => row.metricObservations)
  });
}

test('stable IDs preserve opaque native-ID case and canonical dedupe counts a repeated GitHub owner once', () => {
  assert.notEqual(stableId('creator', 'github', 'CaseID'), stableId('creator', 'github', 'caseid'));
  const first = fixture('github', 'owner-1', { metric: 'stars', metricValue: 10 });
  const duplicate = fixture('github', 'owner-1', { metric: 'stars', metricValue: 10 });
  const result = dedupeDiscoveryBundle({
    creators: first.creators.concat(duplicate.creators),
    platformIdentities: first.platformIdentities.concat(duplicate.platformIdentities),
    contentRecords: first.contentRecords.concat(duplicate.contentRecords),
    metricObservations: first.metricObservations.concat(duplicate.metricObservations)
  });
  assert.equal(result.creators.length, 1);
  assert.equal(result.platformIdentities.length, 1);
  assert.equal(result.contentRecords.length, 1);
  assert.equal(result.metricObservations.length, 1);

  const upper = fixture('youtube', 'CaseSensitiveID');
  const lower = fixture('youtube', 'casesensitiveid');
  const caseSensitive = dedupeDiscoveryBundle({
    creators: upper.creators.concat(lower.creators),
    platformIdentities: upper.platformIdentities.concat(lower.platformIdentities),
    contentRecords: upper.contentRecords.concat(lower.contentRecords),
    metricObservations: []
  });
  assert.equal(caseSensitive.creators.length, 2);
  assert.equal(caseSensitive.platformIdentities.length, 2);
  assert.equal(caseSensitive.contentRecords.length, 2);
});

test('text normalization replaces lone UTF-16 surrogates without damaging valid emoji pairs', () => {
  const normalized = compactText(`valid 😀 lone-high \ud83d lone-low \udc00`, 200);
  assert.equal(normalized, 'valid 😀 lone-high � lone-low �');
  assert.equal(normalized.includes('😀'), true);
  assert.equal(/\ud800|\udc00/.test(normalized), false);
});

test('catalog normalization preserves reviewed identity grouping and rejects executable-market fields', () => {
  const github = fixture('github', 'reviewed-person');
  const youtubeIdentity = createPlatformIdentity({
    creatorId: github.creators[0].id,
    provider: 'youtube',
    nativeId: 'channel-2',
    handle: '@reviewed',
    profileUrl: 'https://www.youtube.com/@reviewed',
    observedAt: NOW.toISOString()
  });
  const normalized = normalizeCatalog(catalogFrom({
    creators: github.creators,
    platformIdentities: github.platformIdentities.concat(youtubeIdentity),
    contentRecords: github.contentRecords,
    metricObservations: github.metricObservations
  }));
  assert.equal(normalized.creators.length, 1);
  assert.equal(new Set(normalized.platformIdentities.map((row) => row.creatorId)).size, 1);
  assert.throws(() => normalizeCatalog(Object.assign(emptyCatalog(), { price: 1 })), /non-discovery/);
});

test('provider contract rejects cross-provider rows and enforces a hard timeout even if an adapter ignores AbortSignal', async () => {
  const github = fixture('github', 'safe');
  assert.throws(() => validatePage('youtube', github), /crossed its boundary/);
  const adapter = createProviderAdapter({
    id: 'github',
    availability: () => ({ state: 'ready' }),
    fetchPage: () => new Promise(() => {})
  });
  const started = Date.now();
  const result = await runProvider(adapter, {
    env: {},
    now: () => new Date(),
    timeoutMs: 500,
    pageBudget: 1
  });
  assert.equal(result.providerRun.state, 'timed_out');
  assert.ok(Date.now() - started < 1_500);
});

test('request validation supports empty trending, strict viral inputs, and binds cursors to all search inputs', () => {
  const trending = validateRequest({
    mode: 'trending',
    query: '',
    providerScopes: ['publications', 'github', 'github'],
    limit: 20,
    ranking: { mode: 'viral', windowDays: 7, weights: { views: 2 } },
    filters: { contentTypes: ['video'], minimum: { views: 100 } }
  });
  assert.deepEqual(trending.providerScopes, ['github', 'medium', 'substack', 'rss']);
  assert.equal(trending.ranking.mode, 'viral');
  assert.throws(() => validateRequest({ mode: 'search', query: '', providerScopes: ['github'] }), /query/);
  assert.throws(() => validateRequest({ mode: 'trending', query: '', providerScopes: ['github'], extra: true }), /Unsupported/);
});

test('discovery cursors are HMAC authenticated, bind page size, and require a production signing secret', () => {
  const body = { mode: 'trending', query: '', providerScopes: ['github'], limit: 20 };
  const normalized = validateRequest(body);
  const cursor = encodeCursor({
    phase: 'live', offset: 41, workOffset: 7, peopleEmitted: true,
    providerIndex: 0, providerCursors: { github: 'provider-page-4' }, snapshotId: null,
    rankingReferenceMs: NOW.getTime()
  }, normalized.fingerprint);
  const last = cursor[cursor.length - 1];
  const tampered = `${cursor.slice(0, -1)}${last === 'A' ? 'B' : 'A'}`;
  assert.throws(() => validateRequest(Object.assign({}, body, { cursor: tampered })), /cursor/);
  assert.throws(() => validateRequest(Object.assign({}, body, { limit: 19, cursor })), /cursor/);
  assert.throws(() => encodeCursor({ phase: 'static' }, normalized.fingerprint, { NODE_ENV: 'production' }), /pagination/);

  const production = { NODE_ENV: 'production', BACKER_DISCOVERY_CURSOR_SECRET: 'c'.repeat(32) };
  const signed = encodeCursor({
    phase: 'static', offset: 1, workOffset: 0, peopleEmitted: false,
    providerIndex: 0, providerCursors: {}, snapshotId: null,
    rankingReferenceMs: NOW.getTime()
  }, requestFingerprint(validateRequest(body, production)), production);
  const decoded = validateRequest(Object.assign({}, body, { cursor: signed }), production, NOW);
  assert.equal(decoded.offset, 1);
  assert.equal(decoded.rankingReferenceMs, NOW.getTime());

  const [payload, mac] = signed.split('.');
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  parsed.t += 60_000;
  const modifiedPayload = Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url');
  assert.throws(() => validateRequest(Object.assign({}, body, {
    cursor: `${modifiedPayload}.${mac}`
  }), production, NOW), /cursor/);

  parsed.t = NOW.getTime() + 10 * 60_000;
  const futurePayload = Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url');
  const futureMac = crypto.createHmac('sha256', production.BACKER_DISCOVERY_CURSOR_SECRET)
    .update('backer-discovery-cursor\0')
    .update(futurePayload)
    .digest('base64url');
  assert.throws(() => validateRequest(Object.assign({}, body, {
    cursor: `${futurePayload}.${futureMac}`
  }), production, NOW), /cursor/);
  assert.throws(() => validateRequest(Object.assign({}, body, {
    rankingReferenceMs: NOW.getTime()
  }), production, NOW), /Unsupported/);
});

test('static pagination fails explicitly when its ranked snapshot changes between pages', async () => {
  const initial = manyFixtures('github', 'snapshot', 0, 2);
  let current = initial;
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW), env: {},
    enforceDiscoveryRateLimit: async () => ({ allowExternal: false, mode: 'test_catalog_only' }),
    loadDiscoveryCatalog: async () => catalogFrom(current)
  });
  const first = response();
  await handler(request('POST', {
    mode: 'trending', query: '', providerScopes: ['github'], limit: 1
  }), first);
  assert.equal(first.statusCode, 200);
  assert.ok(first.body.nextCursor);

  const added = manyFixtures('github', 'snapshot-added', 2, 1);
  current = dedupeDiscoveryBundle({
    creators: initial.creators.concat(added.creators),
    platformIdentities: initial.platformIdentities.concat(added.platformIdentities),
    contentRecords: initial.contentRecords.concat(added.contentRecords),
    metricObservations: initial.metricObservations.concat(added.metricObservations)
  });
  const second = response();
  await handler(request('POST', {
    mode: 'trending', query: '', providerScopes: ['github'], limit: 1, cursor: first.body.nextCursor
  }), second);
  assert.equal(second.statusCode, 409);
  assert.match(second.body.error, /changed/);
});

test('production catalog pagination pins one signed ranking time while the server clock advances', async () => {
  const recent = Array.from({ length: 120 }, (_value, index) => fixture('github', `clock-recent-${index}`, {
    metric: 'stars',
    metricValue: 20 + index,
    publishedAt: NOW.toISOString()
  }));
  const old = Array.from({ length: 120 }, (_value, index) => fixture('github', `clock-old-${index}`, {
    metric: 'stars',
    metricValue: 1_000_000_000 - index,
    publishedAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }));
  const rows = recent.concat(old);
  const source = dedupeDiscoveryBundle({
    creators: rows.flatMap((row) => row.creators),
    platformIdentities: rows.flatMap((row) => row.platformIdentities),
    contentRecords: rows.flatMap((row) => row.contentRecords),
    metricObservations: rows.flatMap((row) => row.metricObservations)
  });
  let currentTimeMs = NOW.getTime();
  const environment = {
    NODE_ENV: 'production',
    ANALYTICS_ALLOWED_ORIGINS: 'https://backer.example',
    BACKER_DISCOVERY_CURSOR_SECRET: 'c'.repeat(32)
  };
  const handler = createDiscoverySearchHandler({
    now: () => new Date(currentTimeMs),
    env: environment,
    enforceDiscoveryRateLimit: async () => ({ allowExternal: false, mode: 'test_catalog_only' }),
    loadDiscoveryCatalog: async () => catalogFrom(source)
  });
  const seenCreators = [];
  const seenWork = [];
  let cursor = null;
  let firstCursor = null;
  let pages = 0;
  do {
    const res = response();
    await handler(request('POST', {
      mode: 'trending', query: '', providerScopes: ['github'], limit: 20,
      ranking: { mode: 'viral', windowDays: 1 },
      ...(cursor ? { cursor } : {})
    }, { origin: 'https://backer.example' }), res);
    assert.equal(res.statusCode, 200);
    seenCreators.push(...res.body.people.map((row) => row.id));
    seenWork.push(...res.body.work.map((row) => row.id));
    cursor = res.body.nextCursor;
    if (!firstCursor) firstCursor = cursor;
    pages += 1;
    currentTimeMs += 3 * 24 * 60 * 60 * 1000;
    assert.ok(pages <= 12, 'stable cursor should exhaust the catalog in twelve pages');
  } while (cursor);

  const firstPayload = JSON.parse(Buffer.from(firstCursor.split('.')[0], 'base64url').toString('utf8'));
  assert.equal(firstPayload.v, 5);
  assert.equal(firstPayload.t, NOW.getTime());
  assert.equal(pages, 12);
  assert.equal(seenCreators.length, 240);
  assert.equal(new Set(seenCreators).size, 240);
  assert.equal(seenWork.length, 240);
  assert.equal(new Set(seenWork).size, 240);
  assert.deepEqual(new Set(seenCreators), new Set(source.creators.map((row) => row.id)));
  assert.deepEqual(new Set(seenWork), new Set(source.contentRecords.map((row) => row.id)));
});

test('publishedAfter excludes undated work, missing metrics stay absent, and retrieval rank is not evidence', () => {
  const dated = fixture('dev', 'dated', { metric: 'likes', metricValue: 12, publishedAt: '2026-08-18T00:00:00Z' });
  const undated = fixture('dev', 'undated', { metric: null, publishedAt: null });
  const bundle = dedupeDiscoveryBundle({
    creators: dated.creators.concat(undated.creators),
    platformIdentities: dated.platformIdentities.concat(undated.platformIdentities),
    contentRecords: dated.contentRecords.concat(undated.contentRecords),
    metricObservations: dated.metricObservations.concat(undated.metricObservations)
  });
  const ranked = rankDiscoveryBundle(bundle, {
    mode: 'trending', query: '', now: NOW,
    ranking: { mode: 'viral', windowDays: 30 },
    filters: { contentTypes: [], publishedAfter: '2026-08-17T00:00:00Z', minimum: {} }
  });
  assert.deepEqual(ranked.orderedContentIds, [dated.contentRecords[0].id]);
  assert.equal(bundle.metricObservations.some((row) => row.entityId === undated.contentRecords[0].id), false);
  assert.equal(JSON.stringify(ranked.rankings).toLowerCase().includes('poa'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(ranked.rankings[0], 'score'), false);
});

test('deterministic synthesis does not echo the query and cites creator/identity metrics used by a content highlight', () => {
  const source = fixture('youtube', 'channel', {
    metric: 'subscribers', metricValue: 1000, metricEntityType: 'identity'
  });
  const ranking = [{
    entityType: 'content', entityId: source.contentRecords[0].id, position: 1, mode: 'viral',
    signals: { subscribers: 1000 }
  }];
  const synthesis = deterministicSynthesis({
    mode: 'search', query: 'do-not-echo-this-query', bundle: source, rankings: ranking
  });
  assert.equal(JSON.stringify(synthesis).includes('do-not-echo-this-query'), false);
  assert.deepEqual(synthesis.evidenceIds, [source.metricObservations[0].id]);
});

test('optional Responses synthesis pins the approved model, disables storage, uses strict output, and falls back safely', async () => {
  const source = fixture('youtube', 'model-source', { metric: 'views', metricValue: 20 });
  const input = {
    mode: 'trending', query: '', bundle: source,
    rankings: [{ entityType: 'content', entityId: source.contentRecords[0].id, position: 1, mode: 'viral', signals: { views: 20 } }]
  };
  let requestBody;
  const valid = await modelSynthesis(input, {
    env: { BACKER_DISCOVERY_OPENAI_API_KEY: 'server-secret' },
    fetch: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => Buffer.from(JSON.stringify({
          output: [{ content: [{
            type: 'output_text',
            text: JSON.stringify({
              summary: 'Grounded summary',
              highlights: [{ entityId: source.contentRecords[0].id, reason: 'Observed public count.' }],
              evidenceIds: [source.metricObservations[0].id]
            })
          }] }]
        }))
      };
    }
  });
  assert.equal(requestBody.model, 'gpt-5.4-mini-2026-03-17');
  assert.equal(requestBody.store, false);
  assert.equal(requestBody.text.format.strict, true);
  assert.equal(valid.mode, 'model');

  const fallback = await synthesizeDiscovery(input, {
    env: { BACKER_DISCOVERY_AI_ENABLED: 'true', BACKER_DISCOVERY_OPENAI_API_KEY: 'server-secret' },
    fetch: async () => ({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => Buffer.from(JSON.stringify({ output_text: '{not-json' }))
    })
  });
  assert.equal(fallback.mode, 'deterministic');
});

test('POST discovery returns the strict web envelope, canonical counts, evidence, and last-good provider state', async () => {
  const source = fixture('github', 'same-owner', { metric: 'stars', metricValue: 42 });
  const run = createProviderRun({
    provider: 'github', state: 'succeeded', publishState: 'fresh', startedAt: NOW, finishedAt: NOW,
    observedAt: NOW, lastSuccessAt: NOW, resultCounts: { creators: 1, contentRecords: 1, metricObservations: 1 }
  });
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW),
    randomUUID: () => 'request-fixed',
    env: {},
    loadDiscoveryCatalog: async () => catalogFrom(source, [run]),
    loadDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders: async () => ({
      ...source,
      providerRuns: [createProviderRun({
        provider: 'github', state: 'failed', publishState: 'unavailable', startedAt: NOW, finishedAt: NOW,
        reasonCode: 'provider_unavailable', resultCounts: {}
      })],
      providerCursors: {},
      hasMore: false
    })
  });
  const res = response();
  await handler(request('POST', {
    mode: 'trending', query: '', providerScopes: ['github'], limit: 20,
    ranking: { mode: 'viral', windowDays: 30 }
  }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.discoveryOnly, true);
  assert.equal(res.body.people.length, 1);
  assert.equal(res.body.work.length, 1);
  assert.deepEqual(res.body.counts.responsePage, {
    scope: 'response_page',
    creatorEntities: 1,
    linkedPlatformIdentities: 1,
    uniqueWorks: 1,
    sourceRecords: 1,
    evidenceObservations: 1
  });
  assert.equal(res.body.counts.matchedSnapshot.scope, 'last_good_matched_snapshot');
  assert.equal(res.body.counts.matchedSnapshot.creatorEntities, 1);
  assert.equal(res.body.counts.matchedSnapshot.linkedPlatformIdentities, 1);
  assert.equal(res.body.counts.matchedSnapshot.uniqueWorks, 1);
  assert.equal(res.body.counts.matchedSnapshot.sourceRecords, 1);
  assert.equal(res.body.counts.matchedSnapshot.evidenceObservations, 1);
  assert.equal(res.body.workClusters.length, 1);
  assert.deepEqual(res.body.workClusters[0].sourceRecordIds, [res.body.work[0].id]);
  assert.equal(Object.prototype.hasOwnProperty.call(res.body.counts, 'people'), false);
  assert.equal(res.body.evidence.platformIdentities.length, 1);
  assert.equal(res.body.evidence.metricObservations.length, 1);
  assert.equal(res.body.providers.github.publishState, 'last_good');
  assert.deepEqual(res.body.markets, []);
  assert.equal(res.body.ranking.method, 'retrieval_heuristic_not_poa');
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
});

test('search response does not echo a raw unmatched query', async () => {
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW),
    env: {},
    loadDiscoveryCatalog: async () => emptyCatalog(),
    loadDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders: async () => ({
      creators: [], platformIdentities: [], contentRecords: [], metricObservations: [],
      providerRuns: [createProviderRun({ provider: 'github', state: 'empty', startedAt: NOW, finishedAt: NOW, resultCounts: {} })],
      providerCursors: {}, hasMore: false
    })
  });
  const res = response();
  await handler(request('POST', {
    mode: 'search', query: 'private-query-marker', providerScopes: ['github'], limit: 5
  }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.stringify(res.body).includes('private-query-marker'), false);
});

test('public search rejects cross-site origins before providers and uses the atomic DB limiter when configured', async () => {
  let providerCalls = 0;
  const handler = createDiscoverySearchHandler({
    env: { NODE_ENV: 'production', ANALYTICS_ALLOWED_ORIGINS: 'https://backer.example' },
    runDiscoveryProviders: async () => { providerCalls += 1; return EMPTY_CACHE; }
  });
  const denied = response();
  await handler(request('POST', {
    mode: 'trending', query: '', providerScopes: ['github']
  }, { origin: 'https://evil.example' }), denied);
  assert.equal(denied.statusCode, 403);
  assert.equal(providerCalls, 0);

  let captured;
  await enforceDiscoveryRateLimit(request('POST', {}), {
    environment: {
      DATABASE_URL: 'postgres://configured',
      BACKER_DISCOVERY_RATE_LIMIT_SECRET: 'r'.repeat(32),
      BACKER_DISCOVERY_RATE_LIMIT_PER_MINUTE: '12'
    },
    now: NOW,
    withTransaction: async (work) => work({
      query: async (sql, values) => {
        captured = { sql, values };
        return { rows: [{ request_count: 1 }] };
      }
    })
  });
  assert.match(captured.sql, /analytics_rate_limits/);
  assert.equal(captured.values[0], 'discovery_search_ip');

  resetLocalDiscoveryRateLimitForTests();
  for (let index = 0; index < 5; index += 1) {
    await enforceDiscoveryRateLimit(request('POST', {}), {
      environment: { BACKER_DISCOVERY_RATE_LIMIT_PER_MINUTE: '5' }, now: NOW
    });
  }
  await assert.rejects(enforceDiscoveryRateLimit(request('POST', {}), {
    environment: { BACKER_DISCOVERY_RATE_LIMIT_PER_MINUTE: '5' }, now: NOW
  }), (error) => error.status === 429);
  resetLocalDiscoveryRateLimitForTests();
});

test('production limiter outage serves catalog only and never calls cache, live providers, or AI', async () => {
  resetLocalDiscoveryRateLimitForTests();
  const missing = await enforceDiscoveryRateLimit(request('POST', {}), {
    environment: { NODE_ENV: 'production' }, now: NOW
  });
  assert.equal(missing.mode, 'degraded_catalog_only');
  assert.equal(missing.allowExternal, false);

  const failed = await enforceDiscoveryRateLimit(request('POST', {}), {
    environment: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://configured',
      BACKER_DISCOVERY_RATE_LIMIT_SECRET: 'r'.repeat(32)
    },
    now: NOW,
    withTransaction: async () => { throw new Error('database offline'); }
  });
  assert.equal(failed.mode, 'degraded_catalog_only');
  assert.equal(failed.allowExternal, false);

  const source = fixture('github', 'catalog-only', { metric: 'stars', metricValue: 9 });
  let cacheCalls = 0;
  let providerCalls = 0;
  let aiCalls = 0;
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW),
    env: {
      NODE_ENV: 'production',
      ANALYTICS_ALLOWED_ORIGINS: 'https://backer.example',
      BACKER_DISCOVERY_CURSOR_SECRET: 'c'.repeat(32),
      BACKER_DISCOVERY_OPENAI_API_KEY: 'must-not-be-used'
    },
    loadDiscoveryCatalog: async () => catalogFrom(source),
    loadDiscoveryCache: async () => { cacheCalls += 1; return EMPTY_CACHE; },
    runDiscoveryProviders: async () => { providerCalls += 1; return EMPTY_CACHE; },
    synthesizeDiscovery: async () => { aiCalls += 1; throw new Error('must not run'); }
  });
  const res = response();
  await handler(request('POST', {
    mode: 'trending', query: '', providerScopes: ['github'], limit: 20
  }, { origin: 'https://backer.example' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.people.length, 1);
  assert.equal(res.body.parsed.pageSource, 'catalog_only_rate_limit_degraded');
  assert.equal(res.body.synthesis.mode, 'deterministic');
  assert.equal(res.body.nextCursor, null);
  assert.deepEqual({ cacheCalls, providerCalls, aiCalls }, { cacheCalls: 0, providerCalls: 0, aiCalls: 0 });
  resetLocalDiscoveryRateLimitForTests();
});

test('composite endpoint cursor is passed back to the exact provider adapter', async () => {
  const observedCursors = [];
  const adapter = createProviderAdapter({
    id: 'github',
    availability: () => ({ state: 'ready' }),
    fetchPage: async (context) => {
      observedCursors.push(context.cursor || null);
      const nativeId = context.cursor ? 'second-creator' : 'first-creator';
      return Object.assign(fixture('github', nativeId, { title: 'creator discovery work' }), {
        nextCursor: context.cursor ? null : 'provider-page-2'
      });
    }
  });
  const dependencies = {
    now: () => new Date(NOW),
    env: {},
    adapters: { github: adapter },
    loadDiscoveryCatalog: async () => emptyCatalog(),
    loadDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders
  };
  const handler = createDiscoverySearchHandler(dependencies);
  const first = response();
  await handler(request('POST', {
    mode: 'search', query: 'creator', providerScopes: ['github'], limit: 1
  }), first);
  assert.equal(first.body.people[0].displayName, 'Creator first-creator');
  assert.ok(first.body.nextCursor);
  const second = response();
  await handler(request('POST', {
    mode: 'search', query: 'creator', providerScopes: ['github'], limit: 1, cursor: first.body.nextCursor
  }), second);
  assert.deepEqual(observedCursors, [null, 'provider-page-2']);
  assert.equal(second.body.people[0].displayName, 'Creator second-creator');

  const changed = response();
  await handler(request('POST', {
    mode: 'search', query: 'different creator', providerScopes: ['github'], limit: 1, cursor: first.body.nextCursor
  }), changed);
  assert.equal(changed.statusCode, 400);
});

test('cursor traverses sixty cached creators then multi-page live results exactly once', async () => {
  function manyFixtures(prefix, start, count) {
    const rows = Array.from({ length: count }, (_value, index) => fixture('github', `${prefix}-${start + index}`, {
      title: `Trending work ${start + index}`,
      metric: 'stars',
      metricValue: 10_000 - start - index
    }));
    return dedupeDiscoveryBundle({
      creators: rows.flatMap((row) => row.creators),
      platformIdentities: rows.flatMap((row) => row.platformIdentities),
      contentRecords: rows.flatMap((row) => row.contentRecords),
      metricObservations: rows.flatMap((row) => row.metricObservations)
    });
  }

  const cached = manyFixtures('cached', 0, 60);
  const liveFirst = manyFixtures('live', 60, 20);
  const liveSecond = manyFixtures('live', 80, 20);
  const observedCursors = [];
  const adapter = createProviderAdapter({
    id: 'github',
    availability: () => ({ state: 'ready' }),
    fetchPage: async (context) => {
      observedCursors.push(context.cursor || null);
      return Object.assign({}, context.cursor ? liveSecond : liveFirst, {
        nextCursor: context.cursor ? null : 'live-page-2'
      });
    }
  });
  const run = createProviderRun({
    provider: 'github', state: 'succeeded', publishState: 'last_good',
    startedAt: NOW, finishedAt: NOW, observedAt: NOW, lastSuccessAt: NOW,
    resultCounts: { creators: 60, contentRecords: 60, metricObservations: 60 }
  });
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW),
    env: {},
    adapters: { github: adapter },
    loadDiscoveryCatalog: async () => emptyCatalog(),
    loadDiscoveryCache: async () => Object.assign({}, cached, {
      providerRuns: [run], providerCursors: {}
    }),
    runDiscoveryProviders
  });

  const seen = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = response();
    await handler(request('POST', {
      mode: 'trending', query: '', providerScopes: ['github'], limit: 20,
      ...(cursor ? { cursor } : {})
    }), res);
    assert.equal(res.statusCode, 200);
    seen.push(...res.body.people.map((creator) => creator.id));
    cursor = res.body.nextCursor;
    pages += 1;
    assert.ok(pages <= 5, 'cursor should terminate after five full pages');
  } while (cursor);

  const expected = cached.creators.concat(liveFirst.creators, liveSecond.creators).map((creator) => creator.id);
  assert.equal(pages, 5);
  assert.deepEqual(observedCursors, [null, 'live-page-2']);
  assert.equal(seen.length, 100);
  assert.equal(new Set(seen).size, 100);
  assert.deepEqual(new Set(seen), new Set(expected));
});

test('live pagination exhausts more than eighty creators without duplicates or a traversal stop', async () => {
  const providerPages = Array.from({ length: 5 }, (_value, index) => manyFixtures(
    'github', 'unbounded-live', index * 25, 25
  ));
  let calls = 0;
  const adapter = createProviderAdapter({
    id: 'github',
    availability: () => ({ state: 'ready' }),
    fetchPage: async (context) => {
      calls += 1;
      const index = context.cursor ? Number(context.cursor.slice(1)) : 0;
      return Object.assign({}, providerPages[index], {
        nextCursor: index + 1 < providerPages.length ? `p${index + 1}` : null
      });
    }
  });
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW), env: {}, adapters: { github: adapter },
    loadDiscoveryCatalog: async () => emptyCatalog(),
    loadDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders
  });
  const people = [];
  const work = [];
  let cursor = null;
  do {
    const res = response();
    await handler(request('POST', {
      mode: 'trending', query: '', providerScopes: ['github'], limit: 25,
      ...(cursor ? { cursor } : {})
    }), res);
    assert.equal(res.statusCode, 200);
    people.push(...res.body.people.map((row) => row.id));
    work.push(...res.body.work.map((row) => row.id));
    cursor = res.body.nextCursor;
  } while (cursor);
  assert.equal(calls, 5);
  assert.equal(people.length, 125);
  assert.equal(new Set(people).size, 125);
  assert.equal(work.length, 125);
  assert.equal(new Set(work).size, 125);
});

test('cursor replays a provider page when its API minimum exceeds the requested page size', async () => {
  const rows = ['one', 'two', 'three'].map((nativeId) => fixture('github', `minimum-${nativeId}`));
  const live = dedupeDiscoveryBundle({
    creators: rows.flatMap((row) => row.creators),
    platformIdentities: rows.flatMap((row) => row.platformIdentities),
    contentRecords: rows.flatMap((row) => row.contentRecords),
    metricObservations: []
  });
  let calls = 0;
  const adapter = createProviderAdapter({
    id: 'github',
    availability: () => ({ state: 'ready' }),
    fetchPage: async () => {
      calls += 1;
      return Object.assign({}, live, { nextCursor: null });
    }
  });
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW), env: {}, adapters: { github: adapter },
    loadDiscoveryCatalog: async () => emptyCatalog(),
    loadDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders
  });
  const seen = [];
  let cursor = null;
  do {
    const res = response();
    await handler(request('POST', {
      mode: 'trending', query: '', providerScopes: ['github'], limit: 1,
      ...(cursor ? { cursor } : {})
    }), res);
    assert.equal(res.statusCode, 200);
    seen.push(...res.body.people.map((creator) => creator.id));
    cursor = res.body.nextCursor;
  } while (cursor);
  assert.equal(calls, 3);
  assert.equal(seen.length, 3);
  assert.equal(new Set(seen).size, 3);
});

test('one creator with more than four page limits of work remains fully reachable with its bounded owner context', async () => {
  const owner = fixture('github', 'deep-catalog-owner', { metric: null });
  const creator = owner.creators[0];
  const identity = owner.platformIdentities[0];
  const contentRecords = Array.from({ length: 13 }, (_value, index) => createContentRecord({
    creatorId: creator.id,
    platformIdentityId: identity.id,
    provider: 'github',
    nativeId: `deep-work-${index}`,
    contentType: 'repository',
    title: `Deep work ${index}`,
    canonicalUrl: `https://content.example/github/deep-work-${index}`,
    publishedAt: new Date(NOW.getTime() - index * 60_000).toISOString(),
    observedAt: NOW
  }));
  const source = dedupeDiscoveryBundle({
    creators: [creator], platformIdentities: [identity], contentRecords, metricObservations: []
  });
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW), env: {},
    enforceDiscoveryRateLimit: async () => ({ allowExternal: false, mode: 'test_catalog_only' }),
    loadDiscoveryCatalog: async () => catalogFrom(source)
  });
  const people = [];
  const work = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = response();
    await handler(request('POST', {
      mode: 'trending', query: '', providerScopes: ['github'], limit: 2,
      ...(cursor ? { cursor } : {})
    }), res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.work.length <= 2);
    assert.equal(res.body.counts.matchedSnapshot.uniqueWorks, 13);
    assert.equal(res.body.counts.matchedSnapshot.sourceRecords, 13);
    assert.ok(res.body.work.every((row) => res.body.people.some((person) => person.id === row.creatorId)));
    people.push(...res.body.people.map((row) => row.id));
    work.push(...res.body.work.map((row) => row.id));
    cursor = res.body.nextCursor;
    pages += 1;
  } while (cursor);
  assert.equal(pages, 7);
  assert.equal(people.length, 7);
  assert.deepEqual(new Set(people), new Set([creator.id]));
  assert.equal(work.length, 13);
  assert.equal(new Set(work).size, 13);
  assert.deepEqual(new Set(work), new Set(contentRecords.map((row) => row.id)));
});

test('signed static cursor reaches records beyond ten thousand without a product catalog ceiling', async () => {
  assert.ok(MAX_CATALOG_BYTES > 16 * 1024 * 1024, 'catalog byte guard must be a platform safety bound');
  const source = manyFixtures('github', 'large-static', 0, 10_005, { metric: null });
  const body = { mode: 'trending', query: '', providerScopes: ['github'], limit: 5 };
  const normalized = validateRequest(body);
  const ranked = rankDiscoveryBundle(source, {
    mode: normalized.mode,
    query: normalized.query,
    ranking: normalized.ranking,
    filters: normalized.filters,
    now: NOW
  });
  const cursor = encodeCursor({
    phase: 'static', offset: 10_000, workOffset: 0, peopleEmitted: false,
    providerIndex: 0, providerCursors: {}, snapshotId: rankingSnapshotId(ranked, NOW.getTime()),
    rankingReferenceMs: NOW.getTime()
  }, normalized.fingerprint);
  const handler = createDiscoverySearchHandler({
    now: () => new Date(NOW), env: {},
    enforceDiscoveryRateLimit: async () => ({ allowExternal: false, mode: 'test_catalog_only' }),
    loadDiscoveryCatalog: async () => catalogFrom(source)
  });
  const res = response();
  await handler(request('POST', Object.assign({}, body, { cursor })), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.people.map((row) => row.id), ranked.orderedCreatorIds.slice(10_000));
  assert.equal(res.body.counts.matchedSnapshot.creatorEntities, 10_005);
});

test('official conditional adapters make no network request when approval or credentials are absent', async () => {
  const adapters = [youtube, twitch, x, facebook, instagram, linkedin];
  for (const adapter of adapters) {
    const availability = adapter.availability({});
    assert.notEqual(availability.state, 'ready');
  }
  let calls = 0;
  const result = await runProvider(x, {
    env: {},
    fetch: async () => { calls += 1; throw new Error('must not run'); },
    now: () => new Date(NOW)
  });
  assert.equal(calls, 0);
  assert.equal(result.providerRun.state, 'permission_required');
});

test('reviewed built-in feeds are available while unverified configured URLs remain disabled', () => {
  const feeds = parseFeedConfig(JSON.stringify([
    { id: 'unsafe', provider: 'rss', url: 'https://example.com/feed', verified: false },
    { id: 'reviewed-extra', provider: 'rss', url: 'https://example.com/feed', verified: true }
  ]));
  assert.ok(feeds.some((row) => row.provider === 'medium'));
  assert.ok(feeds.some((row) => row.provider === 'substack'));
  assert.equal(feeds.some((row) => row.id === 'unsafe'), false);
  assert.equal(feeds.some((row) => row.id === 'reviewed-extra'), true);
  assert.equal(privateIp('127.0.0.1'), true);
  assert.equal(privateIp('::ffff:127.0.0.1'), true);
  assert.equal(privateIp('8.8.8.8'), false);
});

test('launch acquisition exposes only real failures as resumable page failures', () => {
  const unexhausted = discoverySnapshot.providerRuns.filter((run) => run.hasMore === true);
  const resumableReasons = new Set([
    'partial_page_failure',
    'provider_pagination_stalled',
    'provider_rate_limited',
    'provider_permission_required',
    'provider_timeout',
    'provider_response_invalid'
  ]);
  assert.ok(unexhausted.every((run) => resumableReasons.has(run.reasonCode)
    && ['partial', 'rate_limited', 'permission_required', 'timed_out', 'failed'].includes(run.state)));
  assert.ok(discoverySnapshot.providerRuns
    .filter((run) => run.reasonCode === 'partial_page_failure')
    .every((run) => ['partial', 'failed'].includes(run.state)));
  assert.ok(discoverySnapshot.providerRuns
    .filter((run) => run.reasonCode === 'api_result_window')
    .every((run) => run.state === 'succeeded' && run.hasMore === false));
  assert.ok(discoverySnapshot.acquisitionCheckpoints
    && typeof discoverySnapshot.acquisitionCheckpoints === 'object');
  const normalized = normalizeCatalog(discoverySnapshot);
  const providers = unexhausted.map((run) => run.provider);
  const publicRuns = overlayProviderRuns([], normalized.providerRuns, normalized, providers, NOW.toISOString());
  assert.ok(publicRuns.every((run) => run.state === 'partial' && run.publishState === 'last_good'));
});

test('provider run overlay distinguishes last-good from fresh and does not fabricate zero metrics', () => {
  const source = fixture('github', 'cached', { metric: null });
  const live = createProviderRun({
    provider: 'github', state: 'rate_limited', publishState: 'unavailable', startedAt: NOW, finishedAt: NOW,
    reasonCode: 'provider_rate_limited', resultCounts: {}
  });
  const prior = createProviderRun({
    provider: 'github', state: 'succeeded', publishState: 'last_good', startedAt: NOW, finishedAt: NOW,
    observedAt: NOW, lastSuccessAt: NOW, resultCounts: { creators: 1, contentRecords: 1 }
  });
  const [run] = overlayProviderRuns([live], [prior], source, ['github'], NOW.toISOString());
  assert.equal(run.state, 'rate_limited');
  assert.equal(run.publishState, 'last_good');
  assert.equal(source.metricObservations.length, 0);
});

test('persistent sync transaction merges new canonical records and never erases last-good on failure', async () => {
  const current = fixture('github', 'existing', { metric: 'stars', metricValue: 1 });
  const incoming = fixture('github', 'new', { metric: 'stars', metricValue: 2 });
  const liveRun = createProviderRun({
    provider: 'github', state: 'succeeded', publishState: 'fresh', startedAt: NOW, finishedAt: NOW,
    observedAt: NOW, lastSuccessAt: NOW, resultCounts: { creators: 1, contentRecords: 1, metricObservations: 1 }
  });
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (/pg_try_advisory/.test(sql)) return { rows: [{ locked: true }] };
      if (/insert into discovery_sync_runs/.test(sql)) return { rows: [{ sync_run_id: 7 }] };
      if (/select snapshot/.test(sql)) return { rows: [{ snapshot: current, provider_run: {}, last_success_at: NOW }] };
      return { rows: [] };
    }
  };
  const result = await persistDiscoveryResults(Object.assign({}, incoming, {
    providerRuns: [liveRun], providerCursors: { github: 'next-3' }
  }), {
    providerScopes: ['github'],
    now: NOW,
    withSession: async (work) => work(client)
  });
  assert.equal(result.persisted, true);
  assert.equal(result.counts.people, 2);
  const upsert = calls.find((row) => /insert into discovery_provider_cache/.test(row.sql));
  const stored = JSON.parse(upsert.values[2]);
  assert.equal(stored.creators.length, 2);
  assert.equal(upsert.values[1], 'next-3');

  const failureCalls = [];
  const failedClient = {
    async query(sql, values) {
      failureCalls.push({ sql, values });
      if (/pg_try_advisory/.test(sql)) return { rows: [{ locked: true }] };
      if (/insert into discovery_sync_runs/.test(sql)) return { rows: [{ sync_run_id: 8 }] };
      if (/select snapshot/.test(sql)) return { rows: [{ snapshot: current, provider_run: {}, last_success_at: NOW }] };
      return { rows: [] };
    }
  };
  await persistDiscoveryResults({
    creators: [], platformIdentities: [], contentRecords: [], metricObservations: [], providerCursors: {},
    providerRuns: [createProviderRun({ provider: 'github', state: 'failed', startedAt: NOW, finishedAt: NOW, resultCounts: {} })]
  }, {
    providerScopes: ['github'], now: NOW, withSession: async (work) => work(failedClient)
  });
  const failureUpsert = failureCalls.find((row) => /insert into discovery_provider_cache/.test(row.sql));
  assert.equal(JSON.parse(failureUpsert.values[2]).creators.length, 1);
  assert.equal(JSON.parse(failureUpsert.values[3]).publishState, 'last_good');
});

test('provider-local persistence rollback does not block another provider under the sync session lock', async () => {
  const github = fixture('github', 'db-fails');
  const dev = fixture('dev', 'db-succeeds');
  const live = dedupeDiscoveryBundle({
    creators: github.creators.concat(dev.creators),
    platformIdentities: github.platformIdentities.concat(dev.platformIdentities),
    contentRecords: github.contentRecords.concat(dev.contentRecords),
    metricObservations: []
  });
  live.providerRuns = ['github', 'dev'].map((provider) => createProviderRun({
    provider, state: 'succeeded', startedAt: NOW, finishedAt: NOW,
    observedAt: NOW, lastSuccessAt: NOW, resultCounts: { creators: 1, contentRecords: 1 }
  }));
  live.providerCursors = {};
  const commits = [];
  const client = {
    async query(sql, values) {
      if (/pg_try_advisory_lock/.test(sql)) return { rows: [{ locked: true }] };
      if (/insert into discovery_sync_runs/.test(sql)) return { rows: [{ sync_run_id: 9 }] };
      if (/select snapshot/.test(sql)) return { rows: [] };
      if (/insert into discovery_provider_cache/.test(sql) && values[0] === 'github') {
        throw new Error('provider-local write failure');
      }
      if (/^commit$/.test(sql)) commits.push('commit');
      return { rows: [] };
    }
  };
  const result = await persistDiscoveryResults(live, {
    providerScopes: ['github', 'dev'],
    now: NOW,
    withSession: async (work) => work(client)
  });
  assert.equal(result.state, 'partial');
  assert.equal(result.persisted, true);
  assert.equal(result.counts.people, 1);
  assert.equal(result.providerRuns.find((run) => run.provider === 'github').reasonCode, 'persistence_failed');
  assert.equal(result.providerRuns.find((run) => run.provider === 'dev').publishState, 'fresh');
  assert.ok(commits.length >= 3);
});

test('protected discovery sync persists compact public status and rejects a bad cron secret', async () => {
  const unauthorized = createDiscoverySyncHandler({
    cronSecret: 's'.repeat(24),
    env: { DATABASE_URL: 'postgres://configured' },
    readDiscoveryCache: async () => assert.fail('must not read')
  });
  const denied = response();
  await unauthorized(request('GET', null, { authorization: 'Bearer wrong' }), denied);
  assert.equal(denied.statusCode, 401);

  const source = fixture('github', 'sync');
  const run = createProviderRun({ provider: 'github', state: 'succeeded', startedAt: NOW, finishedAt: NOW, resultCounts: { creators: 1 } });
  const authorized = createDiscoverySyncHandler({
    cronSecret: 's'.repeat(24),
    env: { DATABASE_URL: 'postgres://configured' },
    providerScopes: ['github'],
    now: () => new Date(NOW),
    readDiscoveryCache: async () => EMPTY_CACHE,
    runDiscoveryProviders: async () => Object.assign({}, source, { providerRuns: [run], providerCursors: {} }),
    persistDiscoveryResults: async () => ({
      state: 'succeeded', persisted: true, counts: { people: 1, work: 1, metricObservations: 0 }, providerRuns: [run]
    })
  });
  const ok = response();
  await authorized(request('GET', null, { authorization: `Bearer ${'s'.repeat(24)}` }), ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.persisted, true);
  assert.equal(ok.body.counts.people, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(ok.body, 'snapshot'), false);
});
