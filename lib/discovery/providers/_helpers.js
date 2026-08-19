'use strict';

const {
  createContentRecord,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  safeHttpsUrl
} = require('../../../api/_lib/discovery-model');

const MAX_JSON_BYTES = 1024 * 1024;

async function readBoundedJson(response, maximumBytes) {
  const maximum = maximumBytes || MAX_JSON_BYTES;
  const length = Number(response && response.headers && response.headers.get && response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maximum) {
    throw Object.assign(new Error('provider body too large'), { code: 'provider_response_invalid' });
  }
  const raw = typeof response.arrayBuffer === 'function'
    ? Buffer.from(await response.arrayBuffer())
    : Buffer.from(await response.text(), 'utf8');
  if (raw.length > maximum) {
    throw Object.assign(new Error('provider body too large'), { code: 'provider_response_invalid' });
  }
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch (_error) {
    throw Object.assign(new Error('invalid provider json'), { code: 'provider_response_invalid' });
  }
}

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, Object.assign({
    method: 'GET',
    redirect: 'error',
    headers: { Accept: 'application/json' }
  }, options || {}));
  if (!response || !response.ok) {
    const status = Number(response && response.status) || 502;
    const error = new Error('provider request failed');
    error.status = status;
    error.code = status === 429 ? 'provider_rate_limited'
      : status === 401 || status === 403 ? 'provider_permission_required'
        : 'provider_unavailable';
    throw error;
  }
  return readBoundedJson(response, options && options.maximumBytes);
}

function fixedUrl(origin, pathname, parameters) {
  const url = new URL(pathname, origin);
  Object.entries(parameters || {}).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

function thumbnail(thumbnails) {
  const value = thumbnails || {};
  return safeHttpsUrl(value.maxres && value.maxres.url
    || value.standard && value.standard.url
    || value.high && value.high.url
    || value.medium && value.medium.url
    || value.default && value.default.url);
}

function addMetric(target, value) {
  const observation = createMetricObservation(value);
  if (observation) target.push(observation);
}

function identityBundle(input) {
  const creator = createCreator(input);
  if (!creator) return null;
  const identity = createPlatformIdentity(Object.assign({}, input, { creatorId: creator.id }));
  if (!identity) return null;
  creator.primaryIdentityId = identity.id;
  return { creator, identity };
}

function contentForIdentity(input, owner) {
  return createContentRecord(Object.assign({}, input, {
    creatorId: owner.creator.id,
    platformIdentityId: owner.identity.id
  }));
}

module.exports = {
  MAX_JSON_BYTES,
  addMetric,
  contentForIdentity,
  fetchJson,
  fixedUrl,
  identityBundle,
  readBoundedJson,
  thumbnail
};
