'use strict';

const crypto = require('node:crypto');
const { withTransaction } = require('./db');
const { HttpError } = require('./errors');
const { trustedClientIp } = require('./ip');
const { consumeRateLimit } = require('./rate-limit');

const localBuckets = new Map();

function boundedLimit(value) {
  const supplied = Number.parseInt(value, 10);
  return Number.isInteger(supplied) ? Math.max(5, Math.min(600, supplied)) : 30;
}

function productionMode(environment) {
  return environment && (environment.NODE_ENV === 'production' || environment.VERCEL === '1');
}

function usableSecret(value) {
  return typeof value === 'string' && Buffer.byteLength(value, 'utf8') >= 32;
}

function rateKey(req, environment, secret) {
  const ip = trustedClientIp(req, environment) || 'unknown';
  return crypto.createHmac('sha256', secret || 'local-discovery-rate-limit')
    .update('backer-discovery\0')
    .update(ip)
    .digest('base64url');
}

function consumeLocal(key, now, limit) {
  const bucket = Math.floor(now.getTime() / 60_000);
  const current = localBuckets.get(key);
  const count = current && current.bucket === bucket ? current.count + 1 : 1;
  localBuckets.set(key, { bucket, count });
  if (localBuckets.size > 2_000) {
    for (const [entryKey, value] of localBuckets) {
      if (value.bucket < bucket - 1) localBuckets.delete(entryKey);
      if (localBuckets.size <= 1_500) break;
    }
  }
  if (count > limit) throw new HttpError(429, 'Too many requests', 'rate_limited');
  return count;
}

async function enforceDiscoveryRateLimit(req, options) {
  const input = options || {};
  const environment = input.environment || process.env;
  const now = input.now instanceof Date ? input.now : new Date(input.now || Date.now());
  const limit = boundedLimit(environment.BACKER_DISCOVERY_RATE_LIMIT_PER_MINUTE);
  const secret = environment.BACKER_DISCOVERY_RATE_LIMIT_SECRET || environment.ANALYTICS_HASH_SECRET || '';
  const key = rateKey(req, environment, secret);
  const isProduction = productionMode(environment);
  if (!environment.DATABASE_URL || !usableSecret(secret)) {
    const count = consumeLocal(key, now, limit);
    return {
      count,
      mode: isProduction ? 'degraded_catalog_only' : 'local_memory',
      allowExternal: !isProduction,
      reasonCode: !environment.DATABASE_URL ? 'durable_rate_limit_unavailable' : 'rate_limit_secret_invalid'
    };
  }
  const transaction = input.withTransaction || withTransaction;
  try {
    const count = await transaction((client) => consumeRateLimit(client, {
      scope: 'discovery_search_ip',
      keyHash: key,
      now,
      limit,
      windowMilliseconds: 60_000
    }));
    return { count, mode: 'durable_database', allowExternal: true, reasonCode: null };
  } catch (error) {
    if (error instanceof HttpError && error.status === 429) throw error;
    const count = consumeLocal(key, now, limit);
    return {
      count,
      mode: isProduction ? 'degraded_catalog_only' : 'local_memory',
      allowExternal: !isProduction,
      reasonCode: 'durable_rate_limit_unavailable'
    };
  }
}

function resetLocalDiscoveryRateLimitForTests() {
  localBuckets.clear();
}

module.exports = {
  boundedLimit,
  consumeLocal,
  enforceDiscoveryRateLimit,
  productionMode,
  rateKey,
  resetLocalDiscoveryRateLimitForTests,
  usableSecret
};
