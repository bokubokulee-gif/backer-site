'use strict';

const crypto = require('node:crypto');
const { applyReviewedIdentityLinks } = require('./discovery-identity-links');

const PROVIDERS = Object.freeze([
  'github',
  'youtube',
  'bilibili',
  'twitch',
  'tiktok',
  'spotify',
  'soundcloud',
  'patreon',
  'kick',
  'dev',
  'medium',
  'substack',
  'rss',
  'x',
  'facebook',
  'instagram',
  'linkedin'
]);

const PROVIDER_ALIASES = Object.freeze({
  twitter: 'x',
  meta_facebook: 'facebook',
  meta_instagram: 'instagram'
});

const FORBIDDEN_DISCOVERY_KEYS = new Set([
  'price', 'balance', 'payout', 'position', 'execution', 'quote', 'liquidity',
  'return', 'returns', 'odds', 'stake', 'poa', 'authenticityscore', 'marketid'
]);

const METRIC_AVAILABILITIES = Object.freeze([
  'available', 'unavailable', 'hidden', 'not_returned', 'permission_required', 'rate_limited'
]);
const METRIC_VISIBILITIES = Object.freeze(['public', 'authorized', 'restricted', 'hidden', 'unknown']);
const METRIC_ACCESS_CLASSES = Object.freeze([
  'public_source', 'public_api', 'public_page', 'creator_authorized', 'commercial_api',
  'browser_session', 'not_available', 'unknown'
]);
const METRIC_FRESHNESS_STATES = Object.freeze(['fresh', 'snapshot', 'last_good', 'stale', 'delayed', 'unknown']);
const METRIC_CONFIDENCE_LEVELS = Object.freeze(['high', 'medium', 'low', 'unassessed']);

function wellFormedUnicode(value) {
  const source = String(value || '');
  let output = '';
  for (let index = 0; index < source.length; index += 1) {
    const unit = source.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = source.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += source[index] + source[index + 1];
        index += 1;
      } else {
        output += '\ufffd';
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      output += '\ufffd';
    } else {
      output += source[index];
    }
  }
  return output;
}

function compactText(value, maximum) {
  const normalized = typeof value === 'string'
    ? wellFormedUnicode(value).normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  return wellFormedUnicode(normalized.slice(0, maximum || 500));
}

function isoDate(value, fallback) {
  const parsed = Date.parse(value || '');
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  if (fallback != null) {
    const fallbackParsed = Date.parse(fallback || '');
    if (Number.isFinite(fallbackParsed)) return new Date(fallbackParsed).toISOString();
  }
  return null;
}

function canonicalProvider(value) {
  const key = compactText(value, 40).toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  return PROVIDER_ALIASES[key] || key;
}

function safeHttpsUrl(value) {
  const candidate = compactText(value, 2048);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch (_error) {
    return null;
  }
}

function canonicalUrl(value) {
  const safe = safeHttpsUrl(value);
  if (!safe) return null;
  const parsed = new URL(safe);
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = '';
  const tracking = /^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|referrer|source)$/i;
  Array.from(parsed.searchParams.keys()).forEach((key) => {
    if (tracking.test(key)) parsed.searchParams.delete(key);
  });
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  parsed.searchParams.sort();
  return parsed.toString();
}

function stableId(kind, ...parts) {
  const digest = crypto.createHash('sha256')
    .update(parts.map((part) => compactText(String(part || ''), 2048)).join('\u001f'))
    .digest('hex')
    .slice(0, 20);
  return `${kind}_${digest}`;
}

function countValue(value) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.round(number));
}

function metricNumber(value, unit) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER) return null;
  if (unit === 'count') return number < 0 ? null : Math.round(number);
  return Math.round(number * 1_000_000) / 1_000_000;
}

function enumValue(value, allowed, fallback) {
  const normalized = compactText(value, 60).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeMetricFreshness(value, observedAt) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    state: enumValue(input.state || (typeof value === 'string' ? value : ''), METRIC_FRESHNESS_STATES, 'snapshot'),
    sourceUpdatedAt: isoDate(input.sourceUpdatedAt || input.source_updated_at),
    expiresAt: isoDate(input.expiresAt || input.expires_at),
    capturedAt: observedAt
  };
}

function normalizeMetricConfidence(value, basis) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const level = enumValue(input.level || (typeof value === 'string' ? value : ''), METRIC_CONFIDENCE_LEVELS, 'unassessed');
  return {
    level,
    basis: compactText(input.basis || basis, 120).toLowerCase().replace(/[^a-z0-9_.-]+/g, '_') || 'provider_reported'
  };
}

function createCreator(value) {
  const input = value || {};
  const provider = canonicalProvider(input.provider);
  const nativeId = compactText(input.nativeId || input.id || input.handle || input.displayName, 200);
  const displayName = compactText(input.displayName || input.name || input.handle, 160);
  if (!PROVIDERS.includes(provider) || !nativeId || !displayName) return null;
  const observedAt = isoDate(input.observedAt);
  return {
    id: stableId('creator', provider, nativeId),
    kind: 'public_creator',
    displayName,
    bio: compactText(input.bio || input.description, 600),
    avatarUrl: safeHttpsUrl(input.avatarUrl || input.avatar),
    primaryIdentityId: input.primaryIdentityId || null,
    discoveryEligibility: 'research_only',
    observedAt
  };
}

function createPlatformIdentity(value) {
  const input = value || {};
  const provider = canonicalProvider(input.provider);
  const nativeId = compactText(input.nativeId || input.id || input.handle, 200);
  const creatorId = compactText(input.creatorId, 100);
  const profileUrl = canonicalUrl(input.profileUrl || input.url);
  if (!PROVIDERS.includes(provider) || !nativeId || !creatorId || !profileUrl) return null;
  return {
    id: stableId('identity', provider, nativeId),
    creatorId,
    provider,
    nativeId,
    handle: compactText(input.handle, 120),
    profileUrl,
    verified: typeof input.verified === 'boolean' ? input.verified : null,
    observedAt: isoDate(input.observedAt)
  };
}

function createContentRecord(value) {
  const input = value || {};
  const provider = canonicalProvider(input.provider);
  const nativeId = compactText(input.nativeId || input.id || input.canonicalUrl || input.url, 300);
  const creatorId = compactText(input.creatorId, 100);
  const platformIdentityId = compactText(input.platformIdentityId, 100);
  const url = canonicalUrl(input.canonicalUrl || input.url);
  const title = compactText(input.title || input.excerpt, 280);
  if (!PROVIDERS.includes(provider) || !nativeId || !creatorId || !platformIdentityId || !url || !title) return null;
  return {
    id: stableId('content', provider, nativeId),
    creatorId,
    platformIdentityId,
    provider,
    nativeId,
    contentType: compactText(input.contentType || input.type, 50) || 'post',
    title,
    excerpt: compactText(input.excerpt || input.description, 700),
    canonicalUrl: url,
    thumbnailUrl: safeHttpsUrl(input.thumbnailUrl || input.thumbnail),
    publishedAt: isoDate(input.publishedAt),
    observedAt: isoDate(input.observedAt)
  };
}

function createMetricObservation(value) {
  const input = value || {};
  const provider = canonicalProvider(input.provider);
  const entityType = compactText(input.entityType, 20).toLowerCase();
  const entityId = compactText(input.entityId, 100);
  const metric = compactText(input.metric, 60).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  const observedAt = isoDate(input.observedAt);
  const unit = compactText(input.unit, 30).toLowerCase().replace(/[^a-z0-9_/%.-]+/g, '_') || 'count';
  const sourceUrl = canonicalUrl(input.sourceUrl);
  const suppliedValue = metricNumber(input.value, unit);
  let visibility = enumValue(input.visibility, METRIC_VISIBILITIES, 'public');
  let access = enumValue(input.access || input.accessClass, METRIC_ACCESS_CLASSES, 'public_source');
  let availability = enumValue(input.availability, METRIC_AVAILABILITIES, suppliedValue == null ? null : 'available');
  if (!availability) return null;
  if (visibility === 'hidden') availability = 'hidden';
  if (access === 'not_available' && availability === 'available') availability = 'unavailable';
  const observationValue = availability === 'available' ? suppliedValue : null;
  if (!PROVIDERS.includes(provider) || !['creator', 'identity', 'content'].includes(entityType)
    || !entityId || !metric || (availability === 'available' && observationValue == null)
    || !observedAt || !sourceUrl) return null;
  if (availability === 'hidden') visibility = 'hidden';
  if (['unavailable', 'hidden', 'not_returned', 'permission_required'].includes(availability)
    && access === 'public_source') access = 'not_available';
  const window = compactText(input.window, 50).toLowerCase().replace(/[^a-z0-9_.-]+/g, '_') || null;
  const methodologyVersion = compactText(input.methodologyVersion || input.methodology_version, 120)
    .toLowerCase().replace(/[^a-z0-9_.-]+/g, '_') || 'provider-native-v1';
  const freshness = normalizeMetricFreshness(input.freshness || input.freshnessState, observedAt);
  const confidence = normalizeMetricConfidence(input.confidence, input.confidenceBasis || input.confidence_basis);
  return {
    id: stableId('metric', provider, entityType, entityId, metric, unit, window || '', observedAt),
    entityType,
    entityId,
    provider,
    metric,
    value: observationValue,
    unit,
    observedAt,
    window,
    visibility,
    access,
    availability,
    sourceUrl,
    methodologyVersion,
    freshness,
    confidence
  };
}

function isUsableMetricObservation(value) {
  const row = value || {};
  return row.availability === 'available'
    && ['public', 'authorized'].includes(row.visibility)
    && !['not_available', 'unknown'].includes(row.access)
    && Number.isFinite(row.value)
    && Boolean(isoDate(row.observedAt))
    && Boolean(canonicalUrl(row.sourceUrl));
}

function createProviderRun(value) {
  const input = value || {};
  const provider = canonicalProvider(input.provider);
  const startedAt = isoDate(input.startedAt);
  const finishedAt = isoDate(input.finishedAt, startedAt);
  if (!PROVIDERS.includes(provider) || !startedAt || !finishedAt) return null;
  const allowedStates = new Set([
    'succeeded', 'empty', 'partial', 'not_configured', 'permission_required',
    'rate_limited', 'timed_out', 'failed'
  ]);
  const state = allowedStates.has(input.state) ? input.state : 'failed';
  const allowedPublishStates = new Set(['fresh', 'last_good', 'unavailable']);
  const publishState = allowedPublishStates.has(input.publishState)
    ? input.publishState
    : (['succeeded', 'partial'].includes(state) ? 'fresh' : 'unavailable');
  const pagesRead = countValue(input.pagesRead);
  return {
    id: stableId('run', provider, startedAt),
    provider,
    state,
    publishState,
    startedAt,
    finishedAt,
    observedAt: isoDate(input.observedAt, state === 'succeeded' ? finishedAt : null),
    lastSuccessAt: isoDate(input.lastSuccessAt, state === 'succeeded' ? finishedAt : null),
    reasonCode: compactText(input.reasonCode, 80).toLowerCase().replace(/[^a-z0-9_]+/g, '_') || null,
    pagesRead: pagesRead == null ? 0 : pagesRead,
    resultCounts: {
      creators: countValue(input.resultCounts && input.resultCounts.creators) || 0,
      contentRecords: countValue(input.resultCounts && input.resultCounts.contentRecords) || 0,
      metricObservations: countValue(input.resultCounts && input.resultCounts.metricObservations) || 0
    },
    hasMore: input.hasMore === true
  };
}

function preferRecord(current, incoming) {
  if (!current) return incoming;
  const currentTime = Date.parse(current.observedAt || current.publishedAt || '') || 0;
  const incomingTime = Date.parse(incoming && (incoming.observedAt || incoming.publishedAt) || '') || 0;
  const primary = incomingTime > currentTime ? incoming : current;
  const secondary = primary === current ? incoming : current;
  const merged = Object.assign({}, primary);
  Object.keys(secondary || {}).forEach((key) => {
    if ((merged[key] == null || merged[key] === '') && secondary[key] != null && secondary[key] !== '') {
      merged[key] = secondary[key];
    }
  });
  return merged;
}

function dedupeDiscoveryBundle(bundle, options) {
  const source = bundle || {};
  const creators = [];
  const creatorById = new Map();
  for (const row of source.creators || []) {
    if (!row || !row.id) continue;
    if (!creatorById.has(row.id)) {
      creatorById.set(row.id, creators.length);
      creators.push(row);
    } else {
      const index = creatorById.get(row.id);
      creators[index] = preferRecord(creators[index], row);
    }
  }

  const platformIdentities = [];
  const identityByKey = new Map();
  const identityAlias = new Map();
  for (const row of source.platformIdentities || []) {
    if (!row || !creatorById.has(row.creatorId)) continue;
    const key = row.nativeId
      ? `${row.provider}\u001fnative\u001f${row.nativeId}`
      : `${row.provider}\u001furl\u001f${row.profileUrl}`;
    if (!identityByKey.has(key)) {
      identityByKey.set(key, platformIdentities.length);
      platformIdentities.push(row);
      identityAlias.set(row.id, row.id);
    } else {
      const index = identityByKey.get(key);
      const canonicalId = platformIdentities[index].id;
      identityAlias.set(row.id, canonicalId);
      platformIdentities[index] = preferRecord(platformIdentities[index], row);
    }
  }

  const contentRecords = [];
  const contentByKey = new Map();
  const contentAlias = new Map();
  const platformIdentityIds = new Set(platformIdentities.map((identity) => identity.id));
  for (const raw of source.contentRecords || []) {
    if (!raw || !creatorById.has(raw.creatorId)) continue;
    const identityId = identityAlias.get(raw.platformIdentityId) || raw.platformIdentityId;
    if (!platformIdentityIds.has(identityId)) continue;
    const row = Object.assign({}, raw, { platformIdentityId: identityId });
    const key = row.nativeId
      ? `${row.provider}\u001fnative\u001f${row.nativeId}`
      : `${row.provider}\u001furl\u001f${row.canonicalUrl}`;
    // A URL is not a cross-provider identity claim. Retain each provider-native
    // source record here; verified cross-post relationships live in WorkCluster.
    const existingIndex = contentByKey.get(key);
    if (existingIndex == null) {
      const index = contentRecords.length;
      contentByKey.set(key, index);
      contentRecords.push(row);
      contentAlias.set(row.id, row.id);
    } else {
      const canonicalId = contentRecords[existingIndex].id;
      contentAlias.set(row.id, canonicalId);
      contentRecords[existingIndex] = preferRecord(contentRecords[existingIndex], row);
    }
  }

  const metrics = [];
  const metricByKey = new Map();
  const validIdentityIds = new Set(platformIdentities.map((row) => row.id));
  const validContentIds = new Set(contentRecords.map((row) => row.id));
  for (const raw of source.metricObservations || []) {
    if (!raw) continue;
    const entityId = raw.entityType === 'content'
      ? (contentAlias.get(raw.entityId) || raw.entityId)
      : raw.entityType === 'identity'
        ? (identityAlias.get(raw.entityId) || raw.entityId)
        : raw.entityId;
    const valid = raw.entityType === 'creator' ? creatorById.has(entityId)
      : raw.entityType === 'identity' ? validIdentityIds.has(entityId)
        : validContentIds.has(entityId);
    if (!valid) continue;
    const row = Object.assign({}, raw, { entityId });
    const key = `${row.provider}:${row.entityType}:${row.entityId}:${row.metric}:${row.unit || ''}:${row.window || ''}:${row.observedAt}`;
    if (!metricByKey.has(key)) {
      metricByKey.set(key, metrics.length);
      metrics.push(row);
    } else {
      const index = metricByKey.get(key);
      const existing = metrics[index];
      const existingUnavailable = existing.availability && existing.availability !== 'available';
      const incomingUnavailable = row.availability && row.availability !== 'available';
      if (incomingUnavailable && !existingUnavailable) metrics[index] = row;
    }
  }

  const identityIdsByCreator = new Map();
  platformIdentities.forEach((identity) => {
    if (!identityIdsByCreator.has(identity.creatorId)) identityIdsByCreator.set(identity.creatorId, []);
    identityIdsByCreator.get(identity.creatorId).push(identity.id);
  });
  creators.forEach((creator) => {
    const identities = identityIdsByCreator.get(creator.id) || [];
    creator.primaryIdentityId = identities.includes(creator.primaryIdentityId) ? creator.primaryIdentityId : (identities[0] || null);
  });

  const deduped = { creators, platformIdentities, contentRecords, metricObservations: metrics };
  if (options && options.reviewedIdentityLinks === false) return deduped;
  return applyReviewedIdentityLinks(deduped, options && options.reviewedIdentityLinks);
}

function containsForbiddenDiscoveryKey(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value).some((key) => {
    const canonical = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return FORBIDDEN_DISCOVERY_KEYS.has(canonical) || containsForbiddenDiscoveryKey(value[key]);
  });
}

module.exports = {
  FORBIDDEN_DISCOVERY_KEYS,
  METRIC_ACCESS_CLASSES,
  METRIC_AVAILABILITIES,
  METRIC_CONFIDENCE_LEVELS,
  METRIC_FRESHNESS_STATES,
  METRIC_VISIBILITIES,
  PROVIDERS,
  canonicalProvider,
  canonicalUrl,
  compactText,
  containsForbiddenDiscoveryKey,
  countValue,
  createContentRecord,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle,
  isoDate,
  isUsableMetricObservation,
  safeHttpsUrl,
  stableId,
  wellFormedUnicode
};
