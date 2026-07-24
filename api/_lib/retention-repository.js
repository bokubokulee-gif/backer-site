'use strict';

const { withTransaction } = require('./db');

async function runRetentionWithClient(client, now, config) {
    const encryptedResult = await client.query(
      `update analytics_page_views
          set encrypted_ip_ciphertext = null,
              encrypted_ip_iv = null,
              encrypted_ip_tag = null,
              ip_encryption_key_version = null
        where occurred_at < $1 - make_interval(days => $2)
          and encrypted_ip_ciphertext is not null`,
      [now, config.rawIpRetentionDays]
    );
    const eventsResult = await client.query(
      `delete from analytics_page_views
        where occurred_at < $1 - make_interval(days => $2)`,
      [now, config.eventRetentionDays]
    );
    const sessionsResult = await client.query(
      `delete from analytics_sessions
        where last_seen_at < $1 - make_interval(days => $2)`,
      [now, config.eventRetentionDays]
    );
    const rateLimitsResult = await client.query(
      `delete from analytics_rate_limits where expires_at < $1`,
      [now]
    );
    const adminSessionsResult = await client.query(
      `delete from analytics_admin_sessions
        where expires_at < $1 - interval '1 day'
           or revoked_at < $1 - interval '1 day'`,
      [now]
    );
    await client.query(`set local backer.allow_audit_retention = 'on'`);
    const auditResult = await client.query(
      `delete from analytics_admin_audit
        where occurred_at < $1 - interval '12 months'`,
      [now]
    );
    return {
      encryptedIpsDeleted: encryptedResult.rowCount,
      detailedEventsDeleted: eventsResult.rowCount,
      sessionsDeleted: sessionsResult.rowCount,
      rateLimitBucketsDeleted: rateLimitsResult.rowCount,
      adminSessionsDeleted: adminSessionsResult.rowCount,
      auditRowsDeleted: auditResult.rowCount
    };
}

async function runRetention(now, config, dependencies) {
  const transaction = dependencies && dependencies.withTransaction || withTransaction;
  return transaction((client) => runRetentionWithClient(client, now, config));
}

module.exports = { runRetention, runRetentionWithClient };
