'use strict';

const { HttpError } = require('./errors');

function boolValue(value, fallback) {
  if (value == null || value === '') return fallback;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new Error('Invalid boolean environment value');
}

function intValue(value, fallback, min, max) {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error('Invalid integer environment value');
  }
  return parsed;
}

function csvValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireSecret(name, minimumLength) {
  const value = process.env[name];
  if (!value || value.length < minimumLength) {
    throw new HttpError(503, 'Service unavailable', 'missing_server_configuration');
  }
  return value;
}

function analyticsConfig() {
  return {
    consentPolicyVersion: process.env.ANALYTICS_CONSENT_POLICY_VERSION || '2026-08-20',
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || '',
    publicViewCountsEnabled: boolValue(process.env.PUBLIC_VIEW_COUNTS_ENABLED, false),
    storeRawIp: boolValue(process.env.ANALYTICS_STORE_RAW_IP, false),
    rawIpRetentionDays: intValue(process.env.ANALYTICS_RAW_IP_RETENTION_DAYS, 7, 1, 30),
    eventRetentionDays: intValue(process.env.ANALYTICS_EVENT_RETENTION_DAYS, 90, 1, 730),
    hashKeyVersion: process.env.ANALYTICS_HASH_KEY_VERSION || 'v1',
    encryptionKeyVersion: process.env.ANALYTICS_IP_ENCRYPTION_KEY_VERSION || 'v1',
    viewIpLimitPerMinute: intValue(process.env.ANALYTICS_IP_RATE_LIMIT_PER_MINUTE, 300, 1, 10_000),
    viewVisitorLimitPerMinute: intValue(
      process.env.ANALYTICS_VISITOR_RATE_LIMIT_PER_MINUTE,
      120,
      1,
      10_000
    ),
    adminIdentity: process.env.ANALYTICS_ADMIN_IDENTITY || 'backer-admin',
    adminSessionTtlSeconds: intValue(
      process.env.ANALYTICS_ADMIN_SESSION_TTL_SECONDS,
      8 * 60 * 60,
      300,
      7 * 24 * 60 * 60
    ),
    adminSessionIdleSeconds: intValue(
      process.env.ANALYTICS_ADMIN_SESSION_IDLE_SECONDS,
      30 * 60,
      60,
      24 * 60 * 60
    ),
    adminReauthSeconds: intValue(
      process.env.ANALYTICS_ADMIN_REAUTH_SECONDS,
      5 * 60,
      30,
      60 * 60
    )
  };
}

module.exports = {
  analyticsConfig,
  boolValue,
  csvValues,
  intValue,
  requireSecret
};
