'use strict';

const { query, withTransaction } = require('./db');
const { consumeRateLimit } = require('./rate-limit');

async function consumeLoginRateLimit(keyHash, now) {
  return withTransaction((client) =>
    consumeRateLimit(client, {
      scope: 'admin_login_ip',
      keyHash,
      limit: 10,
      now,
      windowMilliseconds: 15 * 60 * 1000
    })
  );
}

async function consumeReauthRateLimit(keyHash, now) {
  return withTransaction((client) =>
    consumeRateLimit(client, {
      scope: 'admin_reauth_ip',
      keyHash,
      limit: 10,
      now,
      windowMilliseconds: 15 * 60 * 1000
    })
  );
}

async function insertSession(session) {
  await query(
    `insert into analytics_admin_sessions
       (
         id, token_hash, csrf_token_hash, admin_identity, created_at,
         last_seen_at, expires_at, reauthenticated_at, created_ip_hash
       )
     values ($1, $2, null, $3, $4, $4, $5, null, $6)`,
    [
      session.id,
      session.tokenHash,
      session.adminIdentity,
      session.now,
      session.expiresAt,
      session.requestIpHash
    ]
  );
}

async function loadSession(id, tokenHash, now, idleSeconds) {
  const result = await query(
    `update analytics_admin_sessions
        set last_seen_at = $3
      where id = $1
        and token_hash = $2
        and revoked_at is null
        and expires_at > $3
        and last_seen_at > $3 - make_interval(secs => $4)
      returning
        id, csrf_token_hash, admin_identity, created_at, last_seen_at,
        expires_at, reauthenticated_at, created_ip_hash`,
    [id, tokenHash, now, idleSeconds]
  );
  return result.rows[0] || null;
}

async function setCsrfToken(sessionId, csrfTokenHash) {
  await query(
    `update analytics_admin_sessions
        set csrf_token_hash = $2
      where id = $1 and revoked_at is null`,
    [sessionId, csrfTokenHash]
  );
}

async function revokeSession(sessionId, now) {
  await query(
    `update analytics_admin_sessions
        set revoked_at = $2
      where id = $1 and revoked_at is null`,
    [sessionId, now]
  );
}

async function markReauthenticated(sessionId, now) {
  const result = await query(
    `update analytics_admin_sessions
        set reauthenticated_at = $2
      where id = $1 and revoked_at is null
      returning reauthenticated_at`,
    [sessionId, now]
  );
  return result.rows[0] && result.rows[0].reauthenticated_at;
}

async function insertAudit(entry) {
  await query(
    `insert into analytics_admin_audit
       (occurred_at, admin_identity, action, target_view_id, request_ip_hash, result)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      entry.now,
      entry.adminIdentity,
      entry.action,
      entry.targetViewId || null,
      entry.requestIpHash,
      entry.result
    ]
  );
}

module.exports = {
  consumeLoginRateLimit,
  consumeReauthRateLimit,
  insertAudit,
  insertSession,
  loadSession,
  markReauthenticated,
  revokeSession,
  setCsrfToken
};
