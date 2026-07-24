'use strict';

const { csvValues } = require('./env');
const { HttpError } = require('./errors');
const { headerValue } = require('./ip');

function normalizeOrigin(value) {
  try {
    const url = new URL(String(value || ''));
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch (_error) {
    return null;
  }
}

function allowedOrigins(environment) {
  const env = environment || process.env;
  const values = csvValues(env.ANALYTICS_ALLOWED_ORIGINS);
  if (String(env.VERCEL || '') === '1') {
    if (env.VERCEL_URL) values.push(`https://${env.VERCEL_URL}`);
    if (env.VERCEL_PROJECT_PRODUCTION_URL) {
      values.push(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
    }
  }
  if (env.NODE_ENV !== 'production') {
    values.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    );
  }
  return new Set(values.map(normalizeOrigin).filter(Boolean));
}

function assertMutationOrigin(req, environment) {
  const raw = headerValue(req && req.headers, 'origin');
  const origin = normalizeOrigin(raw);
  if (!origin || !allowedOrigins(environment).has(origin)) {
    throw new HttpError(403, 'Forbidden', 'disallowed_origin');
  }
  return origin;
}

function assertSafeReadOrigin(req, environment) {
  const fetchSite = String(headerValue(req && req.headers, 'sec-fetch-site')).toLowerCase();
  if (fetchSite === 'cross-site') throw new HttpError(403, 'Forbidden', 'cross_site_request');
  const raw = headerValue(req && req.headers, 'origin');
  if (raw) return assertMutationOrigin(req, environment);
  return null;
}

function corsHeaders(origin) {
  return origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin'
      }
    : {};
}

module.exports = {
  allowedOrigins,
  assertMutationOrigin,
  assertSafeReadOrigin,
  corsHeaders,
  normalizeOrigin
};
