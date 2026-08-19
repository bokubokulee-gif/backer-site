'use strict';

const crypto = require('node:crypto');
const { HttpError } = require('../_lib/errors');
const { assertMethod, createHandler, noStoreHeaders, readJsonBody, sendJson } = require('../_lib/http');
const { assertMutationOrigin } = require('../_lib/origin');
const {
  PROVIDERS,
  compactText,
  containsForbiddenDiscoveryKey,
  createProviderRun,
  dedupeDiscoveryBundle
} = require('../_lib/discovery-model');
const { emptyCatalog, filterCatalog, loadDiscoveryCatalog, overlayProviderRuns } = require('../_lib/discovery-catalog');
const { readDiscoveryCache } = require('../_lib/discovery-repository');
const { enforceDiscoveryRateLimit } = require('../_lib/discovery-rate-limit');
const { RANK_METRICS, normalizeRanking, rankDiscoveryBundle } = require('../_lib/discovery-rank');
const { deterministicSynthesis, synthesizeDiscovery } = require('../_lib/discovery-synthesis');
const { buildWorkClusters, projectWorkClusters, workClusterCounts } = require('../_lib/discovery-work-clusters');
const { runDiscoveryProviders } = require('../../lib/discovery/registry');

const REQUEST_KEYS = new Set([
  'mode', 'query', 'providerScopes', 'cursor', 'limit', 'clientRequestId', 'ranking', 'filters'
]);
const FILTER_KEYS = new Set(['contentTypes', 'publishedAfter', 'minimum']);
const RANKING_KEYS = new Set(['mode', 'windowDays', 'weights']);
const SCOPE_ALIASES = Object.freeze({ twitter: ['x'], publications: ['medium', 'substack', 'rss'], meta: ['facebook', 'instagram'] });
const CURSOR_VERSION = 5;
const LOCAL_CURSOR_SECRET = 'backer-local-discovery-cursor-secret-v1';
const MAX_PROVIDER_ATTEMPTS_PER_REQUEST = 4;
const MIN_RANKING_REFERENCE_MS = Date.UTC(2020, 0, 1);
const MAX_RANKING_REFERENCE_MS = Date.UTC(2100, 0, 1);
const MAX_RANKING_REFERENCE_FUTURE_SKEW_MS = 5 * 60 * 1000;
const EMPTY_DISCOVERY_CACHE = Object.freeze({
  creators: Object.freeze([]),
  platformIdentities: Object.freeze([]),
  contentRecords: Object.freeze([]),
  metricObservations: Object.freeze([]),
  providerRuns: Object.freeze([]),
  providerCursors: Object.freeze({})
});

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function rejectUnknown(value, allowed, message) {
  if (!plainObject(value) || Object.keys(value).some((key) => !allowed.has(key))) {
    throw new HttpError(400, message, 'invalid_discovery_request');
  }
}

function normalizeScopes(value) {
  const raw = value == null ? PROVIDERS : value;
  if (!Array.isArray(raw) || !raw.length || raw.length > 20) {
    throw new HttpError(400, 'Invalid provider scopes', 'invalid_provider_scopes');
  }
  const expanded = raw.flatMap((scope) => {
    const key = compactText(scope, 40).toLowerCase();
    return SCOPE_ALIASES[key] || [key];
  });
  if (expanded.some((scope) => !PROVIDERS.includes(scope))) {
    throw new HttpError(400, 'Invalid provider scopes', 'invalid_provider_scopes');
  }
  const selected = new Set(expanded);
  return PROVIDERS.filter((provider) => selected.has(provider));
}

function normalizeFilters(value) {
  if (value == null) return { contentTypes: [], publishedAfter: null, minimum: {} };
  rejectUnknown(value, FILTER_KEYS, 'Invalid discovery filters');
  const contentTypes = value.contentTypes == null ? [] : value.contentTypes;
  if (!Array.isArray(contentTypes) || contentTypes.length > 12) {
    throw new HttpError(400, 'Invalid content type filters', 'invalid_discovery_filters');
  }
  const normalizedTypes = Array.from(new Set(contentTypes.map((item) => compactText(item, 50).toLowerCase())
    .filter((item) => /^[a-z0-9_-]{1,50}$/.test(item))));
  if (normalizedTypes.length !== contentTypes.length) {
    throw new HttpError(400, 'Invalid content type filters', 'invalid_discovery_filters');
  }
  let publishedAfter = null;
  if (value.publishedAfter != null) {
    const raw = String(value.publishedAfter);
    const parsed = Date.parse(raw);
    if (!Number.isFinite(parsed) || raw.length > 40) {
      throw new HttpError(400, 'Invalid published date filter', 'invalid_discovery_filters');
    }
    publishedAfter = new Date(parsed).toISOString();
  }
  const rawMinimum = value.minimum == null ? {} : value.minimum;
  if (!plainObject(rawMinimum) || Object.keys(rawMinimum).some((key) => !RANK_METRICS.includes(key))) {
    throw new HttpError(400, 'Invalid minimum metric filters', 'invalid_discovery_filters');
  }
  const minimum = {};
  Object.entries(rawMinimum).forEach(([metric, supplied]) => {
    const number = Number(supplied);
    if (!Number.isSafeInteger(number) || number < 0 || number > 1_000_000_000_000) {
      throw new HttpError(400, 'Invalid minimum metric filters', 'invalid_discovery_filters');
    }
    minimum[metric] = number;
  });
  return { contentTypes: normalizedTypes, publishedAfter, minimum };
}

function normalizeRankingRequest(value, mode) {
  if (value != null) {
    rejectUnknown(value, RANKING_KEYS, 'Invalid discovery ranking');
    if (value.weights != null && (!plainObject(value.weights)
      || Object.keys(value.weights).some((key) => !RANK_METRICS.includes(key)))) {
      throw new HttpError(400, 'Invalid ranking weights', 'invalid_discovery_ranking');
    }
    if (value.mode != null && !['relevance', 'viral', 'recent'].includes(value.mode)) {
      throw new HttpError(400, 'Invalid ranking mode', 'invalid_discovery_ranking');
    }
    if (value.windowDays != null && (!Number.isInteger(value.windowDays) || value.windowDays < 1 || value.windowDays > 365)) {
      throw new HttpError(400, 'Invalid ranking window', 'invalid_discovery_ranking');
    }
    Object.values(value.weights || {}).forEach((weight) => {
      if (!Number.isFinite(Number(weight)) || Number(weight) < 0 || Number(weight) > 10) {
        throw new HttpError(400, 'Invalid ranking weights', 'invalid_discovery_ranking');
      }
    });
  }
  const supplied = Object.assign({}, value || {});
  if (!supplied.mode) supplied.mode = mode === 'trending' ? 'viral' : 'relevance';
  return normalizeRanking(supplied);
}

function requestFingerprint(request) {
  return crypto.createHash('sha256').update(JSON.stringify({
    mode: request.mode,
    query: request.query,
    providerScopes: request.providerScopes,
    limit: request.limit,
    ranking: request.ranking,
    filters: request.filters
  })).digest('base64url').slice(0, 24);
}

function cursorSecret(environment) {
  const env = environment || {};
  const supplied = env.BACKER_DISCOVERY_CURSOR_SECRET || '';
  if (Buffer.byteLength(supplied, 'utf8') >= 32) return supplied;
  if (env.NODE_ENV === 'production' || env.VERCEL === '1') {
    throw new HttpError(503, 'Discovery pagination is temporarily unavailable', 'discovery_cursor_unavailable');
  }
  return LOCAL_CURSOR_SECRET;
}

function cursorMac(payload, secret) {
  return crypto.createHmac('sha256', secret)
    .update('backer-discovery-cursor\0')
    .update(payload)
    .digest('base64url');
}

function normalizeRankingReferenceMs(value, currentTime) {
  const timestamp = value instanceof Date ? value.getTime() : value;
  if (!Number.isSafeInteger(timestamp)
    || timestamp < MIN_RANKING_REFERENCE_MS
    || timestamp >= MAX_RANKING_REFERENCE_MS) {
    throw new Error('invalid ranking reference');
  }
  if (currentTime instanceof Date && Number.isFinite(currentTime.getTime())
    && timestamp > currentTime.getTime() + MAX_RANKING_REFERENCE_FUTURE_SKEW_MS) {
    throw new Error('invalid ranking reference');
  }
  return timestamp;
}

function encodeCursor(pagination, fingerprint, environment) {
  const state = pagination || {};
  const secret = cursorSecret(environment);
  const rankingReferenceMs = normalizeRankingReferenceMs(state.rankingReferenceMs);
  const payload = Buffer.from(JSON.stringify({
    v: CURSOR_VERSION,
    f: fingerprint,
    h: state.phase === 'live' ? 'live' : 'static',
    o: state.offset || 0,
    w: state.workOffset || 0,
    e: state.peopleEmitted === true,
    i: state.providerIndex || 0,
    p: state.providerCursors || {},
    n: state.snapshotId || null,
    t: rankingReferenceMs
  }), 'utf8').toString('base64url');
  return `${payload}.${cursorMac(payload, secret)}`;
}

function decodeCursor(value, fingerprint, environment, currentTime) {
  if (value == null) return {
    phase: 'static', offset: 0, workOffset: 0, peopleEmitted: false,
    providerIndex: 0, providerCursors: {}, snapshotId: null, rankingReferenceMs: null
  };
  const raw = String(value);
  if (!raw || raw.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw)) {
    throw new HttpError(400, 'Invalid discovery cursor', 'invalid_discovery_cursor');
  }
  try {
    const [payload, suppliedMac] = raw.split('.');
    const expectedMac = cursorMac(payload, cursorSecret(environment));
    const suppliedBuffer = Buffer.from(suppliedMac, 'utf8');
    const expectedBuffer = Buffer.from(expectedMac, 'utf8');
    if (suppliedBuffer.length !== expectedBuffer.length
      || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) throw new Error('invalid');
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const rankingReferenceMs = normalizeRankingReferenceMs(parsed.t, currentTime);
    if (parsed.v !== CURSOR_VERSION || parsed.f !== fingerprint || !['static', 'live'].includes(parsed.h)
      || !Number.isSafeInteger(parsed.o) || parsed.o < 0
      || !Number.isSafeInteger(parsed.w) || parsed.w < 0
      || typeof parsed.e !== 'boolean'
      || !Number.isInteger(parsed.i) || parsed.i < 0 || parsed.i > PROVIDERS.length
      || !plainObject(parsed.p) || Object.keys(parsed.p).some((provider) => !PROVIDERS.includes(provider))
      || Object.values(parsed.p).some((cursor) => typeof cursor !== 'string' || cursor.length > 500)
      || (parsed.n !== null && (typeof parsed.n !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(parsed.n)))) {
      throw new Error('invalid');
    }
    return {
      phase: parsed.h,
      offset: parsed.o,
      workOffset: parsed.w,
      peopleEmitted: parsed.e,
      providerIndex: parsed.i,
      providerCursors: parsed.p,
      snapshotId: parsed.n,
      rankingReferenceMs
    };
  } catch (error) {
    if (error instanceof HttpError && error.status === 503) throw error;
    throw new HttpError(400, 'Invalid discovery cursor', 'invalid_discovery_cursor');
  }
}

function validateRequest(body, environment, currentTime) {
  rejectUnknown(body, REQUEST_KEYS, 'Unsupported discovery field');
  const rawQuery = body.query == null ? '' : String(body.query).normalize('NFKC').trim();
  const mode = body.mode == null ? (rawQuery ? 'search' : 'trending') : body.mode;
  if (!['search', 'trending'].includes(mode)) throw new HttpError(400, 'Invalid discovery mode', 'invalid_discovery_mode');
  if (/\p{Cc}/u.test(rawQuery) || rawQuery.length > 240 || (mode === 'search' && rawQuery.length < 2)) {
    throw new HttpError(400, 'Invalid discovery query', 'invalid_discovery_query');
  }
  const providerScopes = normalizeScopes(body.providerScopes);
  const limit = body.limit == null ? 20 : Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 40) {
    throw new HttpError(400, 'Discovery limit must be 1 to 40', 'invalid_discovery_limit');
  }
  const clientRequestId = body.clientRequestId == null ? null : compactText(body.clientRequestId, 81);
  if (body.clientRequestId != null && (!clientRequestId || clientRequestId.length > 80 || !/^[A-Za-z0-9._:-]+$/.test(clientRequestId))) {
    throw new HttpError(400, 'Invalid client request ID', 'invalid_client_request_id');
  }
  const filters = normalizeFilters(body.filters);
  const ranking = normalizeRankingRequest(body.ranking, mode);
  const partial = { mode, query: rawQuery, providerScopes, limit, clientRequestId, filters, ranking };
  const fingerprint = requestFingerprint(partial);
  const decoded = decodeCursor(body.cursor, fingerprint, environment, currentTime);
  return Object.assign(partial, {
    cursor: body.cursor == null ? null : String(body.cursor),
    offset: decoded.offset,
    workOffset: decoded.workOffset,
    peopleEmitted: decoded.peopleEmitted,
    phase: decoded.phase,
    providerIndex: decoded.providerIndex,
    providerCursors: decoded.providerCursors,
    snapshotId: decoded.snapshotId,
    rankingReferenceMs: decoded.rankingReferenceMs,
    fingerprint
  });
}

function rankingSnapshotId(ranked, rankingReferenceMs) {
  const reference = normalizeRankingReferenceMs(rankingReferenceMs);
  const hash = crypto.createHash('sha256')
    .update('backer-discovery-ranking-v2\0')
    .update(String(reference))
    .update('\0');
  const contentById = new Map(ranked.bundle.contentRecords.map((row) => [row.id, row]));
  ranked.orderedCreatorIds.forEach((id) => hash.update('p\0').update(id).update('\0'));
  ranked.orderedContentIds.forEach((id) => {
    const content = contentById.get(id);
    hash.update('w\0').update(id).update('\0').update(content && content.creatorId || '').update('\0');
  });
  return hash.digest('base64url');
}

function assertRankingSnapshot(expected, ranked, rankingReferenceMs) {
  const actual = rankingSnapshotId(ranked, rankingReferenceMs);
  if (expected && expected !== actual) {
    throw new HttpError(409, 'Discovery results changed; restart pagination', 'discovery_snapshot_expired');
  }
  return actual;
}

function latestMetricEvidence(rows, creatorIds, identityIds, contentIds) {
  const latest = new Map();
  for (const row of rows || []) {
    if (!row || !row.metric) continue;
    const selected = row.entityType === 'creator' ? creatorIds.has(row.entityId)
      : row.entityType === 'identity' ? identityIds.has(row.entityId)
        : contentIds.has(row.entityId);
    if (!selected) continue;
    const key = `${row.provider}\0${row.entityType}\0${row.entityId}\0${row.metric}`;
    const current = latest.get(key);
    if (!current || String(row.observedAt || '') > String(current.observedAt || '')) latest.set(key, row);
  }
  return Array.from(latest.values());
}

function selectPage(ranked, request) {
  const cohortIds = ranked.orderedCreatorIds.slice(request.offset, request.offset + request.limit);
  const cohortCreatorIds = new Set(cohortIds);
  const creatorById = new Map(ranked.bundle.creators.map((row) => [row.id, row]));
  const contentById = new Map(ranked.bundle.contentRecords.map((row) => [row.id, row]));
  const cohortContentIds = ranked.orderedContentIds.filter((id) => {
    const content = contentById.get(id);
    return content && cohortCreatorIds.has(content.creatorId);
  });
  const selectedContentIds = cohortContentIds.slice(request.workOffset, request.workOffset + request.limit);
  const contentRecords = selectedContentIds.map((id) => contentById.get(id)).filter(Boolean);
  const contentIds = new Set(contentRecords.map((row) => row.id));
  // Repeat the bounded cohort on work-continuation pages so every response is independently
  // relationally complete. Clients canonicalize by creator ID when appending pages.
  const emittedCreatorIds = cohortCreatorIds;
  const creators = cohortIds
    .map((id) => creatorById.get(id))
    .filter(Boolean);
  const requiredIdentityIds = new Set(contentRecords.map((row) => row.platformIdentityId));
  creators.forEach((creator) => {
    if (creator.primaryIdentityId) requiredIdentityIds.add(creator.primaryIdentityId);
  });
  const platformIdentities = ranked.bundle.platformIdentities.filter((row) => requiredIdentityIds.has(row.id));
  const identityIds = new Set(platformIdentities.map((row) => row.id));
  const metricObservations = latestMetricEvidence(
    ranked.bundle.metricObservations,
    cohortCreatorIds,
    identityIds,
    contentIds
  );
  const entityIds = new Set([...emittedCreatorIds, ...contentIds]);
  const rankings = ranked.rankings.filter((row) => entityIds.has(row.entityId));
  const allWorkClusters = ranked.workClusters || buildWorkClusters(ranked.bundle.contentRecords);
  const workClusters = projectWorkClusters(allWorkClusters, contentRecords);
  const matchedCreatorIds = new Set(ranked.orderedCreatorIds);
  const matchedContentIds = new Set(ranked.orderedContentIds);
  const matchedIdentities = ranked.bundle.platformIdentities.filter((row) => matchedCreatorIds.has(row.creatorId));
  const matchedIdentityIds = new Set(matchedIdentities.map((row) => row.id));
  const matchedBundle = {
    creators: ranked.bundle.creators.filter((row) => matchedCreatorIds.has(row.id)),
    platformIdentities: matchedIdentities,
    contentRecords: ranked.bundle.contentRecords.filter((row) => matchedContentIds.has(row.id)),
    metricObservations: ranked.bundle.metricObservations.filter((row) => row.entityType === 'creator'
      ? matchedCreatorIds.has(row.entityId)
      : row.entityType === 'identity' ? matchedIdentityIds.has(row.entityId) : matchedContentIds.has(row.entityId))
  };
  matchedBundle.workClusters = projectWorkClusters(allWorkClusters, matchedBundle.contentRecords);
  const nextWorkOffset = request.workOffset + contentRecords.length;
  return {
    bundle: { creators, platformIdentities, contentRecords, workClusters, metricObservations },
    rankings,
    matchedCounts: workClusterCounts(matchedBundle),
    cohortCreatorCount: cohortIds.length,
    nextWorkOffset,
    hasMoreCohortWork: nextWorkOffset < cohortContentIds.length
  };
}

function excludeCreators(bundle, blockedCreatorIds) {
  const blocked = blockedCreatorIds instanceof Set ? blockedCreatorIds : new Set(blockedCreatorIds || []);
  const creators = (bundle.creators || []).filter((row) => !blocked.has(row.id));
  const creatorIds = new Set(creators.map((row) => row.id));
  const platformIdentities = (bundle.platformIdentities || []).filter((row) => creatorIds.has(row.creatorId));
  const identityIds = new Set(platformIdentities.map((row) => row.id));
  const contentRecords = (bundle.contentRecords || []).filter((row) => creatorIds.has(row.creatorId)
    && identityIds.has(row.platformIdentityId));
  const contentIds = new Set(contentRecords.map((row) => row.id));
  const metricObservations = (bundle.metricObservations || []).filter((row) => row.entityType === 'creator'
    ? creatorIds.has(row.entityId)
    : row.entityType === 'identity' ? identityIds.has(row.entityId) : contentIds.has(row.entityId));
  const filtered = dedupeDiscoveryBundle({ creators, platformIdentities, contentRecords, metricObservations });
  return Object.assign({}, filtered, {
    workClusters: projectWorkClusters(
      Array.isArray(bundle.workClusters) ? bundle.workClusters : buildWorkClusters(bundle.contentRecords || []),
      filtered.contentRecords
    )
  });
}

function rankBundle(bundle, request, now) {
  const ranked = rankDiscoveryBundle(bundle, {
    mode: request.mode,
    query: request.query,
    ranking: request.ranking,
    filters: request.filters,
    now
  });
  ranked.workClusters = projectWorkClusters(
    Array.isArray(bundle.workClusters) ? bundle.workClusters : buildWorkClusters(bundle.contentRecords || []),
    ranked.bundle.contentRecords
  );
  return ranked;
}

function emptyPage() {
  return {
    bundle: { creators: [], platformIdentities: [], contentRecords: [], workClusters: [], metricObservations: [] },
    rankings: [],
    matchedCounts: {
      creatorEntities: 0,
      linkedPlatformIdentities: 0,
      uniqueWorks: 0,
      sourceRecords: 0,
      evidenceObservations: 0
    },
    cohortCreatorCount: 0,
    nextWorkOffset: 0,
    hasMoreCohortWork: false
  };
}

function publicProviderMap(runs) {
  return Object.fromEntries(runs.map((run) => [run.provider, run]));
}

function responseStatus(page, runs) {
  const hasResults = page.bundle.creators.length > 0 || page.bundle.contentRecords.length > 0;
  const trouble = runs.some((run) => ['partial', 'not_configured', 'permission_required', 'rate_limited', 'timed_out', 'failed'].includes(run.state));
  if (!hasResults) return runs.some((run) => ['succeeded', 'empty', 'partial'].includes(run.state)) ? 'empty' : 'unavailable';
  if (trouble) return 'partial';
  if (runs.some((run) => run.publishState === 'fresh')) return 'fresh';
  return 'delayed';
}

function createDiscoverySearchHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['POST']);
    const environment = deps.env || process.env;
    const clock = deps.now || (() => new Date());
    const requestNow = clock();
    if (!(requestNow instanceof Date) || !Number.isFinite(requestNow.getTime())) {
      throw Object.assign(new Error('invalid discovery clock'), { code: 'invalid_discovery_clock' });
    }
    (deps.assertOrigin || assertMutationOrigin)(req, environment);
    const rateLimitState = await (deps.enforceDiscoveryRateLimit || enforceDiscoveryRateLimit)(req, {
      environment,
      now: requestNow,
      withTransaction: deps.withTransaction
    });
    const production = environment.NODE_ENV === 'production' || environment.VERCEL === '1';
    const allowExternal = rateLimitState && typeof rateLimitState.allowExternal === 'boolean'
      ? rateLimitState.allowExternal
      : !production;
    const request = validateRequest(
      await readJsonBody(req, { maximumBytes: 8192 }),
      environment,
      requestNow
    );
    const rankingReferenceMs = request.rankingReferenceMs == null
      ? normalizeRankingReferenceMs(requestNow)
      : request.rankingReferenceMs;
    const rankingReferenceTime = new Date(rankingReferenceMs);
    const generatedAt = requestNow.toISOString();
    const requestId = request.clientRequestId || (deps.randomUUID || crypto.randomUUID)();

    const catalogPromise = (deps.loadDiscoveryCatalog || loadDiscoveryCatalog)(deps.catalogPath)
      .catch(() => emptyCatalog());
    const cachePromise = allowExternal && deps.loadDiscoveryCache
      ? deps.loadDiscoveryCache(request.providerScopes)
      : allowExternal && environment.DATABASE_URL
        ? readDiscoveryCache(request.providerScopes).catch(() => Object.assign({}, EMPTY_DISCOVERY_CACHE))
        : Promise.resolve(Object.assign({}, EMPTY_DISCOVERY_CACHE));
    const [catalog, cached] = await Promise.all([catalogPromise, cachePromise]);
    const local = filterCatalog(catalog, request.providerScopes);
    const staticRecords = dedupeDiscoveryBundle({
      creators: local.creators.concat(cached.creators || []),
      platformIdentities: local.platformIdentities.concat(cached.platformIdentities || []),
      contentRecords: local.contentRecords.concat(cached.contentRecords || []),
      metricObservations: local.metricObservations.concat(cached.metricObservations || [])
    });
    const staticBundle = Object.assign({}, staticRecords, {
      workClusters: projectWorkClusters(
        (local.workClusters || []).concat(cached.workClusters || [], buildWorkClusters(staticRecords.contentRecords)),
        staticRecords.contentRecords
      )
    });
    const staticRanked = rankBundle(staticBundle, request, rankingReferenceTime);
    const priorRuns = (catalog.providerRuns || []).concat(cached.providerRuns || []);
    let page;
    let nextPagination = null;
    let liveRuns = [];
    let pageSource = allowExternal ? 'last_good' : 'catalog_only_rate_limit_degraded';
    let enterLivePhase = request.phase === 'live' && allowExternal;

    if (request.phase === 'live' && !allowExternal) page = emptyPage();

    if (request.phase === 'static') {
      const snapshotId = assertRankingSnapshot(request.snapshotId, staticRanked, rankingReferenceMs);
      if (request.offset < staticRanked.orderedCreatorIds.length) {
        page = selectPage(staticRanked, request);
        if (page.hasMoreCohortWork) {
          nextPagination = {
            phase: 'static', offset: request.offset, workOffset: page.nextWorkOffset,
            peopleEmitted: true, providerIndex: 0, providerCursors: {}, snapshotId
          };
        } else {
          const nextOffset = request.offset + page.cohortCreatorCount;
          if (nextOffset < staticRanked.orderedCreatorIds.length) {
            nextPagination = {
              phase: 'static', offset: nextOffset, workOffset: 0,
              peopleEmitted: false, providerIndex: 0, providerCursors: {}, snapshotId
            };
          } else if (allowExternal && request.providerScopes.length) {
            nextPagination = {
              phase: 'live', offset: 0, workOffset: 0, peopleEmitted: false,
              providerIndex: 0, providerCursors: {}, snapshotId: null
            };
          }
        }
      } else if (allowExternal && request.providerScopes.length) {
        enterLivePhase = true;
      } else {
        page = emptyPage();
      }
    }

    if (enterLivePhase) {
      pageSource = 'live_augmentation';
      const staticCreatorIds = new Set(staticRanked.orderedCreatorIds);
      let providerIndex = request.phase === 'live' ? request.providerIndex : 0;
      let providerCursors = request.phase === 'live' ? request.providerCursors : {};
      let offset = request.phase === 'live' ? request.offset : 0;
      let workOffset = request.phase === 'live' ? request.workOffset : 0;
      let peopleEmitted = request.phase === 'live' ? request.peopleEmitted : false;
      let expectedSnapshot = request.phase === 'live' ? request.snapshotId : null;
      let attempts = 0;
      page = emptyPage();
      while (providerIndex < request.providerScopes.length
        && attempts < MAX_PROVIDER_ATTEMPTS_PER_REQUEST
        && page.bundle.creators.length === 0
        && page.bundle.contentRecords.length === 0) {
        const provider = request.providerScopes[providerIndex];
        const live = await (deps.runDiscoveryProviders || runDiscoveryProviders)({
          mode: request.mode,
          query: request.query,
          providerScopes: [provider],
          ranking: request.ranking,
          filters: request.filters,
          env: environment,
          fetch: deps.fetch || global.fetch,
          lookup: deps.lookup,
          now: clock,
          timeoutMs: Number(environment.BACKER_DISCOVERY_PROVIDER_TIMEOUT_MS) || 4_000,
          pageBudget: 1,
          providerLimit: request.limit,
          providerCursors,
          adapters: deps.adapters
        }).catch(() => ({
          creators: [], platformIdentities: [], contentRecords: [], metricObservations: [],
          providerCursors: {}, hasMore: false,
          providerRuns: [createProviderRun({
            provider, state: 'failed', publishState: 'unavailable', startedAt: generatedAt,
            finishedAt: clock().toISOString(), reasonCode: 'provider_unavailable', resultCounts: {}
          })]
        }));
        liveRuns.push(...(live.providerRuns || []));
        const candidate = rankBundle(excludeCreators(live, staticCreatorIds), request, rankingReferenceTime);
        const snapshotId = assertRankingSnapshot(expectedSnapshot, candidate, rankingReferenceMs);
        expectedSnapshot = null;
        page = selectPage(candidate, Object.assign({}, request, { offset, workOffset, peopleEmitted }));
        const nextProviderCursor = live.providerCursors && live.providerCursors[provider];
        if (page.bundle.creators.length || page.bundle.contentRecords.length) {
          if (page.hasMoreCohortWork) {
            nextPagination = {
              phase: 'live', offset, workOffset: page.nextWorkOffset, peopleEmitted: true,
              providerIndex, providerCursors, snapshotId
            };
          } else {
            const nextOffset = offset + page.cohortCreatorCount;
            if (nextOffset < candidate.orderedCreatorIds.length) {
              nextPagination = {
                phase: 'live', offset: nextOffset, workOffset: 0, peopleEmitted: false,
                providerIndex, providerCursors, snapshotId
              };
            } else if (nextProviderCursor) {
              nextPagination = {
                phase: 'live', offset: 0, workOffset: 0, peopleEmitted: false,
                providerIndex, providerCursors: { [provider]: nextProviderCursor }, snapshotId: null
              };
            } else if (providerIndex + 1 < request.providerScopes.length) {
              nextPagination = {
                phase: 'live', offset: 0, workOffset: 0, peopleEmitted: false,
                providerIndex: providerIndex + 1, providerCursors: {}, snapshotId: null
              };
            }
          }
          break;
        }
        if (nextProviderCursor) {
          providerCursors = { [provider]: nextProviderCursor };
          offset = 0;
          workOffset = 0;
          peopleEmitted = false;
        } else {
          providerIndex += 1;
          providerCursors = {};
          offset = 0;
          workOffset = 0;
          peopleEmitted = false;
        }
        attempts += 1;
      }
      if (!nextPagination && page.bundle.creators.length === 0 && page.bundle.contentRecords.length === 0
        && providerIndex < request.providerScopes.length) {
        nextPagination = {
          phase: 'live', offset, workOffset, peopleEmitted,
          providerIndex, providerCursors, snapshotId: null
        };
      }
    }
    const providerRuns = overlayProviderRuns(
      liveRuns,
      priorRuns,
      staticBundle,
      request.providerScopes,
      generatedAt
    );
    const nextCursor = nextPagination ? encodeCursor(
      Object.assign({}, nextPagination, { rankingReferenceMs }),
      request.fingerprint,
      environment
    ) : null;
    const synthesisInput = {
      mode: request.mode,
      query: request.query,
      bundle: page.bundle,
      rankings: page.rankings
    };
    const synthesis = allowExternal
      ? await (deps.synthesizeDiscovery || synthesizeDiscovery)(synthesisInput, {
        env: environment,
        fetch: deps.fetch || global.fetch,
        timeoutMs: Number(environment.BACKER_DISCOVERY_AI_TIMEOUT_MS) || 4_500
      })
      : deterministicSynthesis(synthesisInput);
    const responsePageCounts = workClusterCounts(page.bundle);
    const response = {
      schemaVersion: 4,
      kind: 'creator_discovery',
      discoveryOnly: true,
      requestId,
      generatedAt,
      status: responseStatus(page, providerRuns),
      parsed: {
        mode: request.mode,
        providerScopes: request.providerScopes,
        rankingMode: request.ranking.mode,
        pageSource
      },
      counts: {
        responsePage: Object.assign({ scope: 'response_page' }, responsePageCounts),
        matchedSnapshot: Object.assign({ scope: `${pageSource}_matched_snapshot` }, page.matchedCounts)
      },
      ranking: {
        mode: request.ranking.mode,
        windowDays: request.ranking.windowDays,
        inputs: { metrics: RANK_METRICS, weights: request.ranking.weights },
        method: 'retrieval_heuristic_not_poa'
      },
      rankings: page.rankings,
      synthesis,
      providers: publicProviderMap(providerRuns),
      people: page.bundle.creators,
      work: page.bundle.contentRecords,
      workClusters: page.bundle.workClusters,
      evidence: {
        platformIdentities: page.bundle.platformIdentities,
        metricObservations: page.bundle.metricObservations
      },
      markets: [],
      nextCursor
    };
    if (containsForbiddenDiscoveryKey(response)) {
      throw Object.assign(new Error('unsafe discovery projection'), { code: 'unsafe_discovery_projection' });
    }
    sendJson(res, 200, response, noStoreHeaders({
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }));
  }, 'discovery-search');
}

module.exports = createDiscoverySearchHandler();
module.exports.createDiscoverySearchHandler = createDiscoverySearchHandler;
module.exports.cursorSecret = cursorSecret;
module.exports.decodeCursor = decodeCursor;
module.exports.encodeCursor = encodeCursor;
module.exports.normalizeFilters = normalizeFilters;
module.exports.normalizeScopes = normalizeScopes;
module.exports.publicProviderMap = publicProviderMap;
module.exports.requestFingerprint = requestFingerprint;
module.exports.responseStatus = responseStatus;
module.exports.rankingSnapshotId = rankingSnapshotId;
module.exports.selectPage = selectPage;
module.exports.validateRequest = validateRequest;
