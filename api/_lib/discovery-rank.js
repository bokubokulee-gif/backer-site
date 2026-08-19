'use strict';

const { dedupeDiscoveryBundle, isUsableMetricObservation } = require('./discovery-model');

const RANK_METRICS = Object.freeze([
  'views', 'likes', 'comments', 'shares', 'followers', 'subscribers',
  'stars', 'forks', 'watchers', 'current_viewers', 'posts', 'videos'
]);

const DEFAULT_WEIGHTS = Object.freeze({
  views: 1,
  likes: 2.2,
  comments: 3,
  shares: 4,
  followers: 0.65,
  subscribers: 0.65,
  stars: 3.2,
  forks: 4,
  watchers: 1.3,
  current_viewers: 2.5,
  posts: 0.25,
  videos: 0.25
});

function queryTerms(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .split(/[^\p{L}\p{N}_@.-]+/u)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function metricIndex(observations) {
  const index = new Map();
  for (const row of observations || []) {
    if (!row || !RANK_METRICS.includes(row.metric) || !isUsableMetricObservation(row)) continue;
    const key = `${row.entityType}:${row.entityId}`;
    if (!index.has(key)) index.set(key, {});
    const signals = index.get(key);
    const existing = signals[row.metric];
    if (!existing || row.observedAt > existing.observedAt) {
      signals[row.metric] = { value: row.value, observedAt: row.observedAt };
    }
  }
  return index;
}

function flattenSignals(index, entityType, entityId) {
  const source = index.get(`${entityType}:${entityId}`) || {};
  return Object.fromEntries(Object.entries(source).map(([key, row]) => [key, row.value]));
}

function mergeSignals(...sources) {
  const result = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      if (Number.isFinite(value)) result[key] = Math.max(result[key] || 0, value);
    }
  }
  return result;
}

function hoursSince(value, now) {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(((now.getTime() - parsed) / 3_600_000) * 10) / 10);
}

function relevanceValue(text, terms, phrase) {
  if (!terms.length) return 0;
  const haystack = String(text || '').normalize('NFKC').toLowerCase();
  let value = phrase && haystack.includes(phrase) ? 20 : 0;
  terms.forEach((term) => {
    if (haystack.includes(term)) value += 3;
  });
  return value;
}

function viralValue(signals, ageHours, ranking) {
  let value = 0;
  for (const metric of RANK_METRICS) {
    const count = Number(signals[metric]) || 0;
    value += Math.log1p(count) * ranking.weights[metric];
  }
  if (ageHours == null) return value * 0.65;
  const windowHours = ranking.windowDays * 24;
  const decay = Math.max(0.08, Math.exp(-ageHours / Math.max(1, windowHours)));
  return value * decay;
}

function meetsMinimum(signals, minimum) {
  return Object.entries(minimum || {}).every(([metric, value]) => (signals[metric] || 0) >= value);
}

function normalizeRanking(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const mode = ['relevance', 'viral', 'recent'].includes(input.mode) ? input.mode : 'relevance';
  const windowDays = Number.isInteger(input.windowDays) ? Math.max(1, Math.min(365, input.windowDays)) : 30;
  const suppliedWeights = input.weights && typeof input.weights === 'object' && !Array.isArray(input.weights)
    ? input.weights : {};
  const weights = {};
  RANK_METRICS.forEach((metric) => {
    const supplied = Number(suppliedWeights[metric]);
    weights[metric] = Number.isFinite(supplied) && supplied >= 0 && supplied <= 10
      ? Math.round(supplied * 100) / 100
      : DEFAULT_WEIGHTS[metric];
  });
  return { mode, windowDays, weights };
}

function rankDiscoveryBundle(sourceBundle, options) {
  const bundle = dedupeDiscoveryBundle(sourceBundle);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const ranking = normalizeRanking(options.ranking);
  const terms = queryTerms(options.query);
  const phrase = String(options.query || '').normalize('NFKC').toLowerCase().trim();
  const filters = options.filters || {};
  const allowedContentTypes = new Set(filters.contentTypes || []);
  const publishedAfter = filters.publishedAfter ? Date.parse(filters.publishedAfter) : NaN;
  const minimum = filters.minimum || {};
  const metrics = metricIndex(bundle.metricObservations);
  const identityById = new Map(bundle.platformIdentities.map((row) => [row.id, row]));
  const creatorById = new Map(bundle.creators.map((row) => [row.id, row]));
  const identitiesByCreator = new Map();
  bundle.platformIdentities.forEach((identity) => {
    if (!identitiesByCreator.has(identity.creatorId)) identitiesByCreator.set(identity.creatorId, []);
    identitiesByCreator.get(identity.creatorId).push(identity);
  });

  const contentRows = bundle.contentRecords.map((content) => {
    const creator = creatorById.get(content.creatorId);
    const identity = identityById.get(content.platformIdentityId);
    const signals = mergeSignals(
      flattenSignals(metrics, 'creator', content.creatorId),
      flattenSignals(metrics, 'identity', content.platformIdentityId),
      flattenSignals(metrics, 'content', content.id)
    );
    const ageHours = hoursSince(content.publishedAt, now);
    const text = `${content.title} ${content.excerpt} ${creator && creator.displayName || ''} ${identity && identity.handle || ''}`;
    const relevance = relevanceValue(text, terms, phrase);
    const viral = viralValue(signals, ageHours, ranking);
    const recent = ageHours == null ? -Number.MAX_SAFE_INTEGER : -ageHours;
    return { content, signals, ageHours, relevance, viral, recent };
  }).filter((row) => {
    if (allowedContentTypes.size && !allowedContentTypes.has(row.content.contentType)) return false;
    if (Number.isFinite(publishedAfter)) {
      const publishedAt = Date.parse(row.content.publishedAt || '');
      if (!Number.isFinite(publishedAt) || publishedAt < publishedAfter) return false;
    }
    if (!meetsMinimum(row.signals, minimum)) return false;
    if (terms.length && options.mode === 'search' && row.relevance <= 0) return false;
    return true;
  });

  const metricKey = ranking.mode === 'viral' ? 'viral' : ranking.mode === 'recent' ? 'recent' : 'relevance';
  contentRows.sort((a, b) => b[metricKey] - a[metricKey]
    || b.viral - a.viral
    || String(b.content.publishedAt || '').localeCompare(String(a.content.publishedAt || ''))
    || a.content.id.localeCompare(b.content.id));

  const bestContentByCreator = new Map();
  contentRows.forEach((row, index) => {
    if (!bestContentByCreator.has(row.content.creatorId)) bestContentByCreator.set(row.content.creatorId, index);
  });
  const creatorRows = bundle.creators.map((creator) => {
    const identities = identitiesByCreator.get(creator.id) || [];
    const signals = identities.reduce((current, identity) => mergeSignals(
      current,
      flattenSignals(metrics, 'identity', identity.id)
    ), flattenSignals(metrics, 'creator', creator.id));
    const text = `${creator.displayName} ${creator.bio} ${identities.map((row) => `${row.provider} ${row.handle}`).join(' ')}`;
    const relevance = relevanceValue(text, terms, phrase);
    const bestContentIndex = bestContentByCreator.get(creator.id);
    const contentRankValue = bestContentIndex == null ? -1 : (contentRows.length - bestContentIndex);
    const viral = viralValue(signals, null, ranking) + Math.max(0, contentRankValue);
    return { creator, signals, relevance, viral, recent: contentRankValue };
  }).filter((row) => {
    const hasRankedContent = bestContentByCreator.has(row.creator.id);
    if (terms.length && options.mode === 'search' && row.relevance <= 0 && !hasRankedContent) return false;
    if (Object.keys(minimum).length && !meetsMinimum(row.signals, minimum) && !hasRankedContent) return false;
    return true;
  });

  creatorRows.sort((a, b) => {
    const key = ranking.mode === 'recent' ? 'recent' : ranking.mode === 'viral' ? 'viral' : 'relevance';
    return b[key] - a[key] || b.viral - a.viral || a.creator.id.localeCompare(b.creator.id);
  });

  return {
    bundle,
    ranking,
    orderedCreatorIds: creatorRows.map((row) => row.creator.id),
    orderedContentIds: contentRows.map((row) => row.content.id),
    rankings: contentRows.map((row, index) => ({
      entityType: 'content',
      entityId: row.content.id,
      rank: index + 1,
      mode: ranking.mode,
      signals: Object.assign({ ageHours: row.ageHours }, row.signals)
    })).concat(creatorRows.map((row, index) => ({
      entityType: 'creator',
      entityId: row.creator.id,
      rank: index + 1,
      mode: ranking.mode,
      signals: row.signals
    })))
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  RANK_METRICS,
  metricIndex,
  normalizeRanking,
  queryTerms,
  rankDiscoveryBundle
};
