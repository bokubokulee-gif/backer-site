'use strict';

const { query } = require('./db');

function number(value) {
  return Number(value || 0);
}

async function summary(range) {
  const values = [range.start, range.endExclusive];
  const [
    totalsResult,
    seriesResult,
    pagesResult,
    referrersResult,
    campaignsResult,
    countriesResult,
    devicesResult
  ] = await Promise.all([
    query(
      `select
         count(*) filter (where not is_bot)::text as human_views,
         count(*) filter (where is_bot)::text as bot_views,
         count(distinct visitor_hash) filter (where not is_bot)::text as unique_visitors,
         count(distinct ip_hash) filter (where not is_bot and ip_masked is not null)::text as unique_ips,
         count(distinct session_record_id) filter (where not is_bot)::text as sessions
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2`,
      values
    ),
    query(
      `select
         (occurred_at at time zone 'UTC')::date::text as date,
         count(*) filter (where not is_bot)::text as human_views,
         count(*) filter (where is_bot)::text as bot_views,
         count(distinct session_record_id) filter (where not is_bot)::text as sessions,
         count(distinct visitor_hash) filter (where not is_bot)::text as unique_visitors,
         count(distinct ip_hash) filter (where not is_bot and ip_masked is not null)::text as unique_ips
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2
       group by 1
       order by 1`,
      values
    ),
    query(
      `select
         page_key,
         canonical_path,
         count(*) filter (where not is_bot)::text as human_views,
         count(distinct visitor_hash) filter (where not is_bot)::text as unique_visitors,
         count(distinct ip_hash) filter (where not is_bot and ip_masked is not null)::text as unique_ips,
         count(distinct session_record_id) filter (where not is_bot)::text as sessions,
         max(occurred_at) as latest_view_at
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2
       group by page_key, canonical_path
       order by count(*) filter (where not is_bot) desc, canonical_path`,
      values
    ),
    query(
      `select referrer_hostname, count(*)::text as views
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2
         and not is_bot and referrer_hostname is not null
       group by referrer_hostname
       order by count(*) desc, referrer_hostname
       limit 50`,
      values
    ),
    query(
      `select
         utm_source, utm_medium, utm_campaign, utm_id, count(*)::text as views
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2
         and not is_bot
         and (utm_source is not null or utm_medium is not null or utm_campaign is not null or utm_id is not null)
       group by utm_source, utm_medium, utm_campaign, utm_id
       order by count(*) desc
       limit 50`,
      values
    ),
    query(
      `select country, region, count(*)::text as views
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2
         and not is_bot and country is not null
       group by country, region
       order by count(*) desc, country, region
       limit 100`,
      values
    ),
    query(
      `select device_class, count(*)::text as views
       from analytics_page_views
       where occurred_at >= $1 and occurred_at < $2 and not is_bot
       group by device_class
       order by count(*) desc, device_class`,
      values
    )
  ]);
  const totalsRow = totalsResult.rows[0] || {};
  const humanViews = number(totalsRow.human_views);
  const sessions = number(totalsRow.sessions);
  return {
    totals: {
      humanViews,
      botViews: number(totalsRow.bot_views),
      uniqueVisitors: number(totalsRow.unique_visitors),
      uniqueIps: number(totalsRow.unique_ips),
      sessions,
      viewsPerSession: sessions ? Number((humanViews / sessions).toFixed(2)) : 0
    },
    series: seriesResult.rows.map((row) => ({
      date: row.date,
      humanViews: number(row.human_views),
      botViews: number(row.bot_views),
      sessions: number(row.sessions),
      uniqueVisitors: number(row.unique_visitors),
      uniqueIps: number(row.unique_ips)
    })),
    pages: pagesResult.rows.map((row) => ({
      pageKey: row.page_key,
      path: row.canonical_path,
      humanViews: number(row.human_views),
      uniqueVisitors: number(row.unique_visitors),
      uniqueIps: number(row.unique_ips),
      sessions: number(row.sessions),
      latestViewAt: row.latest_view_at ? new Date(row.latest_view_at).toISOString() : null
    })),
    referrers: referrersResult.rows.map((row) => ({
      referrerHostname: row.referrer_hostname,
      views: number(row.views)
    })),
    campaigns: campaignsResult.rows.map((row) => ({
      source: row.utm_source,
      medium: row.utm_medium,
      campaign: row.utm_campaign,
      id: row.utm_id,
      views: number(row.views)
    })),
    countries: countriesResult.rows.map((row) => ({
      country: row.country,
      region: row.region,
      views: number(row.views)
    })),
    devices: devicesResult.rows.map((row) => ({
      deviceClass: row.device_class,
      views: number(row.views)
    }))
  };
}

async function recent(range, limit) {
  const result = await query(
    `select
       id, occurred_at, page_key, canonical_path, ip_masked, country, region,
       referrer_hostname, device_class, is_bot,
       (
         encrypted_ip_ciphertext is not null
         and encrypted_ip_iv is not null
         and encrypted_ip_tag is not null
       ) as reveal_eligible
     from analytics_page_views
     where occurred_at >= $1 and occurred_at < $2
     order by occurred_at desc, id desc
     limit $3`,
    [range.start, range.endExclusive, limit + 1]
  );
  const hasMore = result.rows.length > limit;
  return {
    views: result.rows.slice(0, limit).map((row) => ({
      id: row.id,
      viewedAt: new Date(row.occurred_at).toISOString(),
      pageKey: row.page_key,
      path: row.canonical_path,
      maskedIp: row.ip_masked,
      country: row.country,
      region: row.region,
      referrerHostname: row.referrer_hostname,
      deviceClass: row.device_class,
      bot: row.is_bot,
      revealEligible: row.reveal_eligible
    })),
    hasMore
  };
}

async function exportRows(range, maximumRows) {
  const result = await query(
    `select
       occurred_at, page_key, canonical_path, ip_masked, country, region,
       referrer_hostname, device_class, is_bot, utm_source, utm_medium,
       utm_campaign, utm_id
     from analytics_page_views
     where occurred_at >= $1 and occurred_at < $2
     order by occurred_at desc, id desc
     limit $3`,
    [range.start, range.endExclusive, maximumRows]
  );
  return result.rows.map((row) => ({
    viewedAt: new Date(row.occurred_at).toISOString(),
    pageKey: row.page_key,
    path: row.canonical_path,
    maskedIp: row.ip_masked,
    country: row.country,
    region: row.region,
    referrerHostname: row.referrer_hostname,
    deviceClass: row.device_class,
    bot: row.is_bot,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmId: row.utm_id
  }));
}

async function encryptedView(viewId, now, retentionDays) {
  const result = await query(
    `select
       id, encrypted_ip_ciphertext, encrypted_ip_iv, encrypted_ip_tag,
       ip_encryption_key_version
     from analytics_page_views
     where id = $1
       and occurred_at >= $2 - make_interval(days => $3)
       and encrypted_ip_ciphertext is not null
       and encrypted_ip_iv is not null
       and encrypted_ip_tag is not null
       and ip_encryption_key_version is not null
     limit 1`,
    [viewId, now, retentionDays]
  );
  return result.rows[0] || null;
}

module.exports = { encryptedView, exportRows, recent, summary };
