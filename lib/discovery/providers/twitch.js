'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle, readBoundedJson } = require('./_helpers');

function twitchCredentials(env) {
  return {
    clientId: env.BACKER_TWITCH_CLIENT_ID || env.TWITCH_CLIENT_ID || '',
    clientSecret: env.BACKER_TWITCH_CLIENT_SECRET || env.TWITCH_CLIENT_SECRET || '',
    token: env.BACKER_TWITCH_APP_ACCESS_TOKEN || env.TWITCH_APP_ACCESS_TOKEN || ''
  };
}

async function accessToken(context, credentials) {
  if (credentials.token) return credentials.token;
  const response = await context.fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    redirect: 'error',
    signal: context.signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'client_credentials'
    }).toString()
  });
  if (!response || !response.ok) {
    const error = new Error('twitch authentication failed');
    error.status = Number(response && response.status) || 502;
    error.code = error.status === 401 || error.status === 403 ? 'provider_permission_required' : 'provider_unavailable';
    throw error;
  }
  const payload = await readBoundedJson(response, 128 * 1024);
  if (!payload.access_token) throw Object.assign(new Error('invalid twitch token response'), { code: 'provider_response_invalid' });
  return payload.access_token;
}

const twitch = createProviderAdapter({
  id: 'twitch',
  availability(env) {
    const credentials = twitchCredentials(env);
    return credentials.clientId && (credentials.token || credentials.clientSecret)
      ? { state: 'ready' }
      : { state: 'not_configured', reasonCode: 'credentials_missing' };
  },
  async fetchPage(context) {
    const credentials = twitchCredentials(context.env);
    const token = await accessToken(context, credentials);
    const limit = Math.max(5, Math.min(100, context.providerLimit || 25));
    const pathname = context.mode === 'trending' ? '/helix/streams' : '/helix/search/channels';
    const parameters = context.mode === 'trending'
      ? { first: limit, after: context.cursor }
      : { query: context.query, first: limit, after: context.cursor, live_only: 'false' };
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Client-Id': credentials.clientId
    };
    const payload = await fetchJson(context.fetch, fixedUrl('https://api.twitch.tv', pathname, parameters), {
      headers,
      signal: context.signal
    });
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const ids = Array.from(new Set(rows.map((row) => row.user_id || row.id).filter(Boolean)));
    let users = [];
    if (ids.length) {
      const usersUrl = fixedUrl('https://api.twitch.tv', '/helix/users');
      ids.forEach((id) => usersUrl.searchParams.append('id', id));
      const userPayload = await fetchJson(context.fetch, usersUrl, { headers, signal: context.signal });
      users = Array.isArray(userPayload.data) ? userPayload.data : [];
    }
    const userById = new Map(users.map((row) => [row.id, row]));
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];

    for (const row of rows) {
      const nativeId = row.user_id || row.id;
      const user = userById.get(nativeId) || {};
      const login = row.user_login || row.broadcaster_login || user.login;
      const name = row.user_name || row.display_name || user.display_name || login;
      if (!nativeId || !login) continue;
      const owner = identityBundle({
        provider: 'twitch',
        nativeId,
        handle: login,
        displayName: name,
        bio: user.description || '',
        avatarUrl: user.profile_image_url,
        profileUrl: `https://www.twitch.tv/${encodeURIComponent(login)}`,
        observedAt
      });
      if (!owner) continue;
      creators.push(owner.creator);
      platformIdentities.push(owner.identity);
      addMetric(metricObservations, {
        entityType: 'identity', entityId: owner.identity.id, provider: 'twitch', metric: 'views',
        value: user.view_count, observedAt, sourceUrl: owner.identity.profileUrl
      });
      const isLive = context.mode === 'trending' || row.is_live === true;
      if (!isLive || !(row.title || row.game_name)) continue;
      const streamId = row.id && row.user_id ? row.id : `live:${nativeId}`;
      const thumbnailUrl = row.thumbnail_url
        ? row.thumbnail_url.replace('{width}', '640').replace('{height}', '360')
        : null;
      const content = contentForIdentity({
        provider: 'twitch',
        nativeId: streamId,
        contentType: 'live_stream',
        title: row.title || `${name} live`,
        excerpt: row.game_name || '',
        canonicalUrl: owner.identity.profileUrl,
        thumbnailUrl,
        publishedAt: row.started_at,
        observedAt
      }, owner);
      if (!content) continue;
      contentRecords.push(content);
      addMetric(metricObservations, {
        entityType: 'content', entityId: content.id, provider: 'twitch', metric: 'current_viewers',
        value: row.viewer_count, observedAt, sourceUrl: content.canonicalUrl
      });
    }
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: payload.pagination && payload.pagination.cursor || null
    };
  }
});

module.exports = { accessToken, twitch, twitchCredentials };
