'use strict';

const {
  PROVIDERS,
  compactText,
  createProviderRun,
  dedupeDiscoveryBundle
} = require('./discovery-model');

const EMPTY_BUNDLE = Object.freeze({
  creators: Object.freeze([]),
  platformIdentities: Object.freeze([]),
  contentRecords: Object.freeze([]),
  metricObservations: Object.freeze([])
});

const PUBLIC_REASON_CODES = new Set([
  'credentials_missing',
  'provider_not_configured',
  'commercial_access_not_approved',
  'authorized_accounts_not_configured',
  'authorized_self_only',
  'provider_permission_required',
  'provider_rate_limited',
  'provider_timeout',
  'provider_unavailable',
  'provider_response_invalid',
  'no_matches',
  'partial_page_failure',
  'verified_feeds_not_configured',
  'feed_unavailable'
]);

function createProviderAdapter(definition) {
  const source = definition || {};
  if (!PROVIDERS.includes(source.id)) throw new TypeError('Provider adapter has an invalid id');
  if (typeof source.availability !== 'function' || typeof source.fetchPage !== 'function') {
    throw new TypeError('Provider adapter must implement availability() and fetchPage()');
  }
  return Object.freeze({
    id: source.id,
    availability: source.availability,
    fetchPage: source.fetchPage
  });
}

function emptyBundle() {
  return {
    creators: [],
    platformIdentities: [],
    contentRecords: [],
    metricObservations: []
  };
}

function publicReason(error, fallback) {
  const raw = compactText(error && error.code || fallback, 80).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  if (PUBLIC_REASON_CODES.has(raw)) return raw;
  const status = Number(error && (error.status || error.statusCode));
  if (status === 401 || status === 403) return 'provider_permission_required';
  if (status === 429) return 'provider_rate_limited';
  if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return 'provider_timeout';
  return fallback || 'provider_unavailable';
}

function stateForReason(reason, hasResults) {
  if (hasResults) return reason ? 'partial' : 'succeeded';
  if (reason === 'provider_rate_limited') return 'rate_limited';
  if (reason === 'provider_timeout') return 'timed_out';
  if (reason === 'provider_permission_required' || reason === 'commercial_access_not_approved'
    || reason === 'authorized_accounts_not_configured' || reason === 'authorized_self_only') {
    return 'permission_required';
  }
  if (reason === 'credentials_missing' || reason === 'provider_not_configured'
    || reason === 'verified_feeds_not_configured') return 'not_configured';
  if (reason === 'no_matches') return 'empty';
  return 'failed';
}

function validatePage(provider, page) {
  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    throw Object.assign(new Error('invalid provider response'), { code: 'provider_response_invalid' });
  }
  const bundle = {
    creators: Array.isArray(page.creators) ? page.creators : [],
    platformIdentities: Array.isArray(page.platformIdentities) ? page.platformIdentities : [],
    contentRecords: Array.isArray(page.contentRecords) ? page.contentRecords : [],
    metricObservations: Array.isArray(page.metricObservations) ? page.metricObservations : []
  };
  const providerMismatch = bundle.platformIdentities.concat(bundle.contentRecords, bundle.metricObservations)
    .some((row) => !row || row.provider !== provider);
  if (providerMismatch) {
    throw Object.assign(new Error('provider response crossed its boundary'), { code: 'provider_response_invalid' });
  }
  return {
    bundle,
    nextCursor: compactText(page.nextCursor, 500) || null,
    reasonCode: page.reasonCode ? publicReason({ code: page.reasonCode }, 'partial_page_failure') : null
  };
}

function mergeBundles(target, incoming) {
  target.creators.push(...incoming.creators);
  target.platformIdentities.push(...incoming.platformIdentities);
  target.contentRecords.push(...incoming.contentRecords);
  target.metricObservations.push(...incoming.metricObservations);
}

function availabilityResult(adapter, context) {
  try {
    const value = adapter.availability(context.env || {});
    if (!value || value.state === 'ready') return { state: 'ready', reasonCode: null };
    const reasonCode = publicReason({ code: value.reasonCode }, 'provider_not_configured');
    return { state: stateForReason(reasonCode, false), reasonCode };
  } catch (_error) {
    return { state: 'not_configured', reasonCode: 'provider_not_configured' };
  }
}

async function runProvider(adapter, context) {
  const clock = context.now || (() => new Date());
  const startedAt = clock().toISOString();
  const availability = availabilityResult(adapter, context);
  if (availability.state !== 'ready') {
    const finishedAt = clock().toISOString();
    return Object.assign(emptyBundle(), {
      providerRun: createProviderRun({
        provider: adapter.id,
        state: availability.state,
        startedAt,
        finishedAt,
        reasonCode: availability.reasonCode,
        pagesRead: 0,
        publishState: 'unavailable',
        hasMore: false,
        resultCounts: {}
      }),
      hasMore: false
    });
  }

  const bundle = emptyBundle();
  const timeoutMs = Math.max(500, Math.min(12_000, Number(context.timeoutMs) || 4_000));
  const pageBudget = Math.max(1, Math.min(4, Number(context.pageBudget) || 1));
  const controller = new AbortController();
  let rejectTimeout;
  const timeoutPromise = new Promise((_resolve, reject) => { rejectTimeout = reject; });
  const timer = setTimeout(() => {
    controller.abort();
    const error = Object.assign(new Error('provider timed out'), { name: 'TimeoutError', code: 'provider_timeout' });
    rejectTimeout(error);
  }, timeoutMs);
  let cursor = context.providerCursor || null;
  let pagesRead = 0;
  let reasonCode = null;
  try {
    const work = async () => {
      while (pagesRead < pageBudget) {
        const raw = await adapter.fetchPage(Object.assign({}, context, {
          provider: adapter.id,
          cursor,
          signal: controller.signal
        }));
        const page = validatePage(adapter.id, raw);
        mergeBundles(bundle, page.bundle);
        if (page.reasonCode && !reasonCode) reasonCode = page.reasonCode;
        pagesRead += 1;
        if (!page.nextCursor || page.nextCursor === cursor) {
          cursor = null;
          break;
        }
        cursor = page.nextCursor;
      }
    };
    await Promise.race([work(), timeoutPromise]);
  } catch (error) {
    reasonCode = publicReason(error, 'provider_unavailable');
  } finally {
    clearTimeout(timer);
  }

  if (controller.signal.aborted && !reasonCode) reasonCode = 'provider_timeout';
  const normalized = dedupeDiscoveryBundle(bundle);
  const hasResults = normalized.creators.length > 0 || normalized.contentRecords.length > 0;
  const state = stateForReason(reasonCode || (hasResults ? null : 'no_matches'), hasResults);
  const finishedAt = clock().toISOString();
  return Object.assign(normalized, {
    providerRun: createProviderRun({
      provider: adapter.id,
      state,
      startedAt,
      finishedAt,
      reasonCode: reasonCode || (hasResults ? null : 'no_matches'),
      pagesRead,
      publishState: hasResults ? 'fresh' : 'unavailable',
      observedAt: hasResults ? finishedAt : null,
      lastSuccessAt: hasResults ? finishedAt : null,
      hasMore: Boolean(cursor),
      resultCounts: {
        creators: normalized.creators.length,
        contentRecords: normalized.contentRecords.length,
        metricObservations: normalized.metricObservations.length
      }
    }),
    hasMore: Boolean(cursor),
    internalNextCursor: cursor
  });
}

module.exports = {
  EMPTY_BUNDLE,
  createProviderAdapter,
  emptyBundle,
  publicReason,
  runProvider,
  validatePage
};
