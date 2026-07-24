'use strict';

const { randomUUID } = require('node:crypto');
const { query, withTransaction } = require('./db');
const { consumeRateLimit } = require('./rate-limit');

async function lockKeys(client, keys) {
  for (const key of Array.from(new Set(keys)).sort()) {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
  }
}

async function findOrCreateSession(client, event) {
  await lockKeys(client, [`session:${event.hashKeyVersion}:${event.sessionHash}`]);
  const existing = await client.query(
    `select id, last_seen_at
       from analytics_sessions
      where session_hash = $1 and hash_key_version = $2
      order by last_seen_at desc
      limit 1
      for update`,
    [event.sessionHash, event.hashKeyVersion]
  );
  const latest = existing.rows[0];
  if (
    latest &&
    new Date(latest.last_seen_at).getTime() >= event.now.getTime() - 30 * 60 * 1000
  ) {
    await client.query(
      `update analytics_sessions
          set last_seen_at = $2,
              event_count = event_count + 1
        where id = $1`,
      [latest.id, event.now]
    );
    return latest.id;
  }
  const id = randomUUID();
  await client.query(
    `insert into analytics_sessions
       (id, session_hash, visitor_hash, hash_key_version, first_seen_at, last_seen_at, event_count)
     values ($1, $2, $3, $4, $5, $5, 1)`,
    [id, event.sessionHash, event.visitorHash, event.hashKeyVersion, event.now]
  );
  return id;
}

async function refreshRollup(client, event) {
  await client.query(
    `insert into analytics_daily_rollups
       (
         rollup_date, page_key, canonical_path, human_views, bot_views,
         sessions, unique_visitors, unique_ips, latest_view_at, updated_at
       )
     select
       ($1::timestamptz at time zone 'UTC')::date,
       $2,
       $3,
       count(*) filter (where not is_bot),
       count(*) filter (where is_bot),
       count(distinct session_record_id) filter (where not is_bot),
       count(distinct visitor_hash) filter (where not is_bot),
       count(distinct ip_hash) filter (where not is_bot and ip_masked is not null),
       max(occurred_at),
       $1::timestamptz
     from analytics_page_views
     where occurred_at >= date_trunc('day', $1::timestamptz at time zone 'UTC') at time zone 'UTC'
       and occurred_at < (date_trunc('day', $1::timestamptz at time zone 'UTC') + interval '1 day') at time zone 'UTC'
       and canonical_path = $3
     on conflict (rollup_date, canonical_path)
     do update set
       page_key = excluded.page_key,
       human_views = excluded.human_views,
       bot_views = excluded.bot_views,
       sessions = excluded.sessions,
       unique_visitors = excluded.unique_visitors,
       unique_ips = excluded.unique_ips,
       latest_view_at = excluded.latest_view_at,
       updated_at = excluded.updated_at`,
    [event.now, event.pageKey, event.canonicalPath]
  );
}

async function recordViewWithClient(client, event, limits) {
    const utcDay = event.now.toISOString().slice(0, 10);
    await lockKeys(client, [
      `dedupe:${event.dedupeKey}`,
      `event:${event.eventId}`,
      `rollup:${utcDay}:${event.canonicalPath}`
    ]);
    const duplicate = await client.query(
      `select 1
         from analytics_page_views
        where event_key = $1 or dedupe_key = $2
        limit 1`,
      [event.eventId, event.dedupeKey]
    );
    if (duplicate.rowCount) return { accepted: true, duplicate: true };

    await consumeRateLimit(client, {
      scope: 'view_ip',
      keyHash: event.rateIpHash,
      limit: limits.ipPerMinute,
      now: event.now,
      windowMilliseconds: 60_000
    });
    await consumeRateLimit(client, {
      scope: 'view_visitor',
      keyHash: event.visitorHash,
      limit: limits.visitorPerMinute,
      now: event.now,
      windowMilliseconds: 60_000
    });

    const sessionRecordId = await findOrCreateSession(client, event);
    const encrypted = event.encryptedIp || {};
    const inserted = await client.query(
      `insert into analytics_page_views
       (
         event_key, occurred_at, page_key, canonical_path, page_title, virtual_view,
         referrer_hostname, utm_source, utm_medium, utm_campaign, utm_id,
         visitor_hash, session_hash, session_record_id, ip_hash, ip_masked,
         hash_key_version, encrypted_ip_ciphertext, encrypted_ip_iv, encrypted_ip_tag,
         ip_encryption_key_version, user_agent_hash, device_class, locale, country,
         region, is_bot, bot_reason, consent_policy_version, dedupe_key
       )
       values
       (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16,
         $17, $18, $19, $20,
         $21, $22, $23, $24, $25,
         $26, $27, $28, $29, $30
       )
       on conflict do nothing
       returning id`,
      [
        event.eventId,
        event.now,
        event.pageKey,
        event.canonicalPath,
        event.pageTitle,
        event.virtualView,
        event.referrerHostname,
        event.utmSource,
        event.utmMedium,
        event.utmCampaign,
        event.utmId,
        event.visitorHash,
        event.sessionHash,
        sessionRecordId,
        event.ipHash,
        event.ipMasked,
        event.hashKeyVersion,
        encrypted.ciphertext || null,
        encrypted.iv || null,
        encrypted.tag || null,
        encrypted.keyVersion || null,
        event.userAgentHash,
        event.deviceClass,
        event.locale,
        event.country,
        event.region,
        event.isBot,
        event.botReason,
        event.consentPolicyVersion,
        event.dedupeKey
      ]
    );
    if (!inserted.rowCount) return { accepted: true, duplicate: true };
    await refreshRollup(client, event);
    return { accepted: true, duplicate: false };
}

async function recordView(event, limits, dependencies) {
  const transaction = dependencies && dependencies.withTransaction || withTransaction;
  return transaction((client) => recordViewWithClient(client, event, limits));
}

async function totalHumanViews(anchorDate) {
  const result = await query(
    `select coalesce(sum(human_views), 0)::text as total
       from analytics_daily_rollups
      where rollup_date >= $1::date`,
    [anchorDate]
  );
  return Number(result.rows[0].total);
}

module.exports = {
  findOrCreateSession,
  lockKeys,
  recordView,
  recordViewWithClient,
  refreshRollup,
  totalHumanViews
};
