'use strict';

const crypto = require('node:crypto');
const { query } = require('./_lib/db');
const { HttpError } = require('./_lib/errors');
const { assertMethod, createHandler, noStoreHeaders, readJsonBody, sendJson, setHeaders } = require('./_lib/http');
const { headerValue, trustedClientIp } = require('./_lib/ip');

const DEFAULT_ORIGIN = 'https://bokubokulee-gif.github.io';
const WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 10;

function allowedOrigins(environment) {
  const entries = String(environment.WAITLIST_ALLOWED_ORIGINS || DEFAULT_ORIGIN)
    .split(',').map((value) => value.trim()).filter(Boolean);
  if (!entries.length || entries.some((value) => {
    try {
      const url = new URL(value);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      return url.origin !== value || url.username || url.password ||
        (url.protocol !== 'https:' && !(local && url.protocol === 'http:'));
    } catch (_error) {
      return true;
    }
  })) throw new HttpError(503, 'Waitlist temporarily unavailable', 'waitlist_origin_config');
  return entries;
}

function validatePayload(body) {
  const allowed = new Set(['email', 'source', 'submittedAt']);
  if (Object.keys(body).some((key) => !allowed.has(key)) ||
      typeof body.email !== 'string' ||
      (body.source != null && body.source !== 'backer-waitlist') ||
      (body.submittedAt != null && (typeof body.submittedAt !== 'string' ||
        body.submittedAt.length > 40 || !Number.isFinite(Date.parse(body.submittedAt))))) {
    throw new HttpError(400, 'Invalid signup details', 'invalid_waitlist_payload');
  }
  const email = body.email.trim().toLowerCase();
  const parts = email.split('@');
  const local = parts[0];
  const domain = parts[1] || '';
  const labels = domain.split('.');
  if (email.length > 254 || parts.length !== 2 || !local || local.length > 64 ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
      local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
      !/^[a-z]{2,63}$/.test(labels[labels.length - 1])) {
    throw new HttpError(400, 'Enter a valid email address', 'invalid_waitlist_email');
  }
  return email;
}

function createWaitlistHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    const environment = deps.environment || process.env;
    setHeaders(res, noStoreHeaders({ Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' }));
    assertMethod(req, ['POST', 'OPTIONS']);
    const origin = String(headerValue(req.headers, 'origin'));
    if (!allowedOrigins(environment).includes(origin)) {
      throw new HttpError(403, 'Origin not allowed', 'waitlist_origin_rejected');
    }
    setHeaders(res, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600'
    });
    if (String(req.method).toUpperCase() === 'OPTIONS') {
      if (String(headerValue(req.headers, 'access-control-request-method')).toUpperCase() !== 'POST') {
        throw new HttpError(405, 'Method not allowed', 'invalid_waitlist_preflight');
      }
      res.statusCode = 204;
      res.end();
      return;
    }

    const body = await readJsonBody(req, { maximumBytes: 1024 });
    const email = validatePayload(body);
    const secret = environment.WAITLIST_RATE_LIMIT_SECRET || '';
    if (!environment.DATABASE_URL || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new HttpError(503, 'Waitlist temporarily unavailable', 'waitlist_not_configured');
    }
    const ip = trustedClientIp(req, environment);
    if (!ip) throw new HttpError(503, 'Waitlist temporarily unavailable', 'waitlist_client_ip_unavailable');
    const keyHash = crypto.createHmac('sha256', secret).update('backer-waitlist\0').update(ip).digest('hex');
    const now = deps.now ? deps.now() : new Date();
    const bucket = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);
    const expires = new Date(bucket.getTime() + WINDOW_MS * 2);
    const execute = deps.query || query;

    try {
      // Autocommit the counter independently: rejected requests must not roll it back.
      const result = await execute(
        `insert into backer_waitlist_rate_limits (key_hash, bucket_start, request_count, expires_at)
         values ($1, $2, 1, $3)
         on conflict (key_hash, bucket_start) do update
         set request_count = least(backer_waitlist_rate_limits.request_count + 1, 1000000)
         returning request_count`,
        [keyHash, bucket, expires]
      );
      if (Number(result.rows[0].request_count) > IP_LIMIT) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.getTime() + WINDOW_MS - now.getTime()) / 1000))));
        throw new HttpError(429, 'Too many attempts. Please try again later.', 'waitlist_rate_limited');
      }
      await execute(
        `insert into backer_waitlist (email, source) values ($1, $2)
         on conflict (email) do nothing`,
        [email, 'backer-waitlist']
      );
      // Keep short-lived abuse-control data bounded; cleanup failure must not undo a saved signup.
      try {
        await execute('delete from backer_waitlist_rate_limits where expires_at < $1', [now]);
      } catch (_cleanupError) {
        // A later successful request or the documented daily cleanup retries this.
      }
    } catch (error) {
      if (error instanceof HttpError && error.status === 429) throw error;
      // Do not log database errors: they can contain addresses or connection details.
      throw new HttpError(503, 'Waitlist temporarily unavailable', 'waitlist_database_unavailable');
    }
    // Identical response for new and existing addresses; no account or trading session is created.
    sendJson(res, 200, { ok: true }, noStoreHeaders());
  }, 'waitlist');
}

module.exports = createWaitlistHandler();
module.exports.createWaitlistHandler = createWaitlistHandler;
module.exports.validatePayload = validatePayload;
module.exports.allowedOrigins = allowedOrigins;
