'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { compactText, safeHttpsUrl } = require('../../../api/_lib/discovery-model');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle } = require('./_helpers');

const CONFIG_BATCH = 5;

function metaApproved(env) {
  return String(env.BACKER_META_APP_REVIEW_APPROVED || '').toLowerCase() === 'true';
}

function metaToken(env) {
  return env.BACKER_META_ACCESS_TOKEN || env.META_ACCESS_TOKEN || '';
}

function graphVersion(env) {
  const supplied = compactText(env.BACKER_META_GRAPH_VERSION, 20);
  return /^v\d{1,2}\.\d{1,2}$/.test(supplied) ? supplied : 'v23.0';
}

function parseAuthorizedAccounts(raw) {
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch (_error) { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((row) => {
    if (!row || row.authorized !== true) return null;
    const id = compactText(row.id, 160);
    if (!id) return null;
    return {
      id,
      name: compactText(row.name, 160),
      handle: compactText(row.handle || row.username, 120),
      profileUrl: safeHttpsUrl(row.profileUrl || row.url)
    };
  }).filter(Boolean).slice(0, 100);
}

function scopedAccounts(context, provider) {
  const raw = provider === 'facebook'
    ? context.env.BACKER_FACEBOOK_PAGES_JSON
    : context.env.BACKER_INSTAGRAM_ACCOUNTS_JSON;
  const rows = parseAuthorizedAccounts(raw);
  if (context.mode === 'trending' || !context.query) return rows;
  const terms = String(context.query).normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((row) => terms.some((term) => `${row.name} ${row.handle}`.toLowerCase().includes(term)));
}

function availability(env, configName) {
  if (!metaApproved(env)) return { state: 'permission_required', reasonCode: 'commercial_access_not_approved' };
  if (!metaToken(env)) return { state: 'not_configured', reasonCode: 'credentials_missing' };
  if (!parseAuthorizedAccounts(env[configName]).length) {
    return { state: 'permission_required', reasonCode: 'authorized_accounts_not_configured' };
  }
  return { state: 'ready' };
}

function configOffset(cursor, length) {
  return Math.max(0, Math.min(length, Number.parseInt(cursor, 10) || 0));
}

const facebook = createProviderAdapter({
  id: 'facebook',
  availability(env) {
    return availability(env, 'BACKER_FACEBOOK_PAGES_JSON');
  },
  async fetchPage(context) {
    const accounts = scopedAccounts(context, 'facebook');
    const offset = configOffset(context.cursor, accounts.length);
    const selected = accounts.slice(offset, offset + CONFIG_BATCH);
    const version = graphVersion(context.env);
    const headers = { Accept: 'application/json', Authorization: `Bearer ${metaToken(context.env)}` };
    const settled = await Promise.allSettled(selected.map((account) => fetchJson(
      context.fetch,
      fixedUrl('https://graph.facebook.com', `/${version}/${encodeURIComponent(account.id)}`, {
        fields: 'id,name,username,about,link,picture.type(large){url},followers_count,fan_count'
      }),
      { headers, signal: context.signal }
    ).then((payload) => ({ account, payload }))));
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const metricObservations = [];
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const { account, payload } = result.value;
      const nativeId = String(payload.id || account.id);
      const handle = payload.username || account.handle || nativeId;
      const owner = identityBundle({
        provider: 'facebook', nativeId, handle, displayName: payload.name || account.name || handle,
        bio: payload.about || '', avatarUrl: payload.picture && payload.picture.data && payload.picture.data.url,
        profileUrl: payload.link || account.profileUrl || `https://www.facebook.com/${encodeURIComponent(handle)}`,
        observedAt
      });
      if (!owner) continue;
      creators.push(owner.creator);
      platformIdentities.push(owner.identity);
      [['followers', payload.followers_count], ['likes', payload.fan_count]].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'identity', entityId: owner.identity.id, provider: 'facebook', metric,
        value, observedAt, sourceUrl: owner.identity.profileUrl
      }));
    }
    const failures = settled.filter((row) => row.status === 'rejected');
    if (!creators.length && failures.length) throw failures[0].reason;
    return {
      creators,
      platformIdentities,
      contentRecords: [],
      metricObservations,
      nextCursor: offset + selected.length < accounts.length ? String(offset + selected.length) : null,
      reasonCode: failures.length ? 'partial_page_failure' : null
    };
  }
});

const instagram = createProviderAdapter({
  id: 'instagram',
  availability(env) {
    return availability(env, 'BACKER_INSTAGRAM_ACCOUNTS_JSON');
  },
  async fetchPage(context) {
    const accounts = scopedAccounts(context, 'instagram');
    const offset = configOffset(context.cursor, accounts.length);
    const selected = accounts.slice(offset, offset + CONFIG_BATCH);
    const version = graphVersion(context.env);
    const headers = { Accept: 'application/json', Authorization: `Bearer ${metaToken(context.env)}` };
    const mediaLimit = Math.max(1, Math.min(25, context.providerLimit || 12));
    const settled = await Promise.allSettled(selected.map((account) => fetchJson(
      context.fetch,
      fixedUrl('https://graph.facebook.com', `/${version}/${encodeURIComponent(account.id)}`, {
        fields: `id,username,name,biography,profile_picture_url,followers_count,media_count,media.limit(${mediaLimit}){id,caption,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count}`
      }),
      { headers, signal: context.signal }
    ).then((payload) => ({ account, payload }))));
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const { account, payload } = result.value;
      const nativeId = String(payload.id || account.id);
      const handle = payload.username || account.handle;
      if (!handle) continue;
      const owner = identityBundle({
        provider: 'instagram', nativeId, handle, displayName: payload.name || account.name || handle,
        bio: payload.biography || '', avatarUrl: payload.profile_picture_url,
        profileUrl: account.profileUrl || `https://www.instagram.com/${encodeURIComponent(handle)}/`,
        observedAt
      });
      if (!owner) continue;
      creators.push(owner.creator);
      platformIdentities.push(owner.identity);
      [['followers', payload.followers_count], ['posts', payload.media_count]].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'identity', entityId: owner.identity.id, provider: 'instagram', metric,
        value, observedAt, sourceUrl: owner.identity.profileUrl
      }));
      for (const media of payload.media && Array.isArray(payload.media.data) ? payload.media.data : []) {
        const content = contentForIdentity({
          provider: 'instagram', nativeId: media.id, contentType: String(media.media_type || 'post').toLowerCase(),
          title: media.caption || `${handle} post`, excerpt: media.caption || '', canonicalUrl: media.permalink,
          thumbnailUrl: media.thumbnail_url, publishedAt: media.timestamp, observedAt
        }, owner);
        if (!content) continue;
        contentRecords.push(content);
        [['likes', media.like_count], ['comments', media.comments_count]].forEach(([metric, value]) => addMetric(metricObservations, {
          entityType: 'content', entityId: content.id, provider: 'instagram', metric,
          value, observedAt, sourceUrl: content.canonicalUrl
        }));
      }
    }
    const failures = settled.filter((row) => row.status === 'rejected');
    if (!creators.length && failures.length) throw failures[0].reason;
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: offset + selected.length < accounts.length ? String(offset + selected.length) : null,
      reasonCode: failures.length ? 'partial_page_failure' : null
    };
  }
});

module.exports = {
  CONFIG_BATCH,
  facebook,
  graphVersion,
  instagram,
  metaApproved,
  metaToken,
  parseAuthorizedAccounts
};
