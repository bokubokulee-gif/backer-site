'use strict';

const { randomBytes, randomUUID } = require('node:crypto');
const { analyticsConfig, requireSecret } = require('./env');
const { HttpError } = require('./errors');
const { hmacValue, safeEqualText } = require('./crypto');
const { headerValue, trustedClientIp } = require('./ip');
const {
  ADMIN_COOKIE,
  adminCookieHeader,
  clearAdminCookieHeader,
  decodeAdminCookie,
  encodeAdminCookie,
  parseCookies
} = require('./cookies');
const defaultRepository = require('./admin-repository');

function adminSecrets(overrides) {
  const custom = overrides || {};
  return {
    hashSecret: custom.hashSecret || requireSecret('ANALYTICS_HASH_SECRET', 32),
    sessionSecret: custom.sessionSecret || requireSecret('ANALYTICS_SESSION_SECRET', 32)
  };
}

function requestIpHash(req, config, overrides) {
  const secrets = adminSecrets(overrides);
  const ip = trustedClientIp(req, overrides && overrides.environment);
  return hmacValue(
    secrets.hashSecret,
    config.hashKeyVersion,
    'admin-request-ip',
    ip || 'unknown'
  );
}

async function createAdminSession(req, options) {
  const config = options.config || analyticsConfig();
  const repository = options.repository || defaultRepository;
  const secrets = adminSecrets(options);
  const now = options.now || new Date();
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hmacValue(secrets.sessionSecret, 'v1', 'admin-session-token', token);
  const requestHash = requestIpHash(req, config, options);
  const expiresAt = new Date(now.getTime() + config.adminSessionTtlSeconds * 1000);
  await repository.insertSession({
    id,
    tokenHash,
    adminIdentity: config.adminIdentity,
    now,
    expiresAt,
    requestIpHash: requestHash
  });
  const cookieValue = encodeAdminCookie(secrets.sessionSecret, id, token);
  const session = {
    id,
    admin_identity: config.adminIdentity,
    expires_at: expiresAt,
    reauthenticated_at: null,
    created_ip_hash: requestHash,
    csrf_token_hash: null
  };
  const csrfToken = await issueCsrfToken(session, options);
  return {
    session,
    csrfToken,
    setCookie: adminCookieHeader(cookieValue, config.adminSessionTtlSeconds)
  };
}

async function authenticateAdmin(req, options) {
  const config = options.config || analyticsConfig();
  const repository = options.repository || defaultRepository;
  const secrets = adminSecrets(options);
  const encoded = parseCookies(headerValue(req.headers, 'cookie'))[ADMIN_COOKIE];
  const parsed = decodeAdminCookie(secrets.sessionSecret, encoded);
  if (!parsed) throw new HttpError(401, 'Unauthorized', 'invalid_admin_cookie');
  const tokenHash = hmacValue(
    secrets.sessionSecret,
    'v1',
    'admin-session-token',
    parsed.token
  );
  const session = await repository.loadSession(
    parsed.sessionId,
    tokenHash,
    options.now || new Date(),
    config.adminSessionIdleSeconds
  );
  if (!session) throw new HttpError(401, 'Unauthorized', 'expired_admin_session');
  return session;
}

async function issueCsrfToken(session, options) {
  const repository = options.repository || defaultRepository;
  const secrets = adminSecrets(options);
  const token = randomBytes(24).toString('base64url');
  const tokenHash = hmacValue(secrets.sessionSecret, 'v1', 'admin-csrf', token);
  await repository.setCsrfToken(session.id, tokenHash);
  session.csrf_token_hash = tokenHash;
  return token;
}

function assertCsrf(req, session, options) {
  const secrets = adminSecrets(options);
  const token = headerValue(req.headers, 'x-csrf-token');
  const actual = hmacValue(secrets.sessionSecret, 'v1', 'admin-csrf', token || 'missing');
  if (!session.csrf_token_hash || !safeEqualText(actual, session.csrf_token_hash)) {
    throw new HttpError(403, 'Forbidden', 'invalid_csrf');
  }
}

function sessionResponse(session, csrfToken, config) {
  return {
    authenticated: true,
    adminIdentity: session.admin_identity,
    csrfToken,
    rawIpRevealEnabled: config.storeRawIp,
    sessionExpiresAt: new Date(session.expires_at).toISOString(),
    reauthenticatedAt: session.reauthenticated_at
      ? new Date(session.reauthenticated_at).toISOString()
      : null
  };
}

function clearCookie() {
  return clearAdminCookieHeader();
}

module.exports = {
  adminSecrets,
  assertCsrf,
  authenticateAdmin,
  clearCookie,
  createAdminSession,
  issueCsrfToken,
  requestIpHash,
  sessionResponse
};
