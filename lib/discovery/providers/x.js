'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle } = require('./_helpers');

function approved(env) {
  return String(env.BACKER_X_COMMERCIAL_USE_APPROVED || '').toLowerCase() === 'true';
}

function bearer(env) {
  return env.BACKER_X_BEARER_TOKEN || env.X_BEARER_TOKEN || '';
}

const x = createProviderAdapter({
  id: 'x',
  availability(env) {
    if (!approved(env)) return { state: 'permission_required', reasonCode: 'commercial_access_not_approved' };
    return bearer(env) ? { state: 'ready' } : { state: 'not_configured', reasonCode: 'credentials_missing' };
  },
  async fetchPage(context) {
    const limit = Math.max(10, Math.min(100, context.providerLimit || 25));
    const query = context.mode === 'trending'
      ? (context.env.BACKER_X_TRENDING_QUERY || '-is:retweet has:links lang:en')
      : `${context.query} -is:retweet`;
    const url = fixedUrl('https://api.x.com', '/2/tweets/search/recent', {
      query,
      max_results: limit,
      pagination_token: context.cursor,
      expansions: 'author_id',
      'tweet.fields': 'author_id,created_at,public_metrics',
      'user.fields': 'id,name,username,description,profile_image_url,verified,public_metrics'
    });
    const payload = await fetchJson(context.fetch, url, {
      signal: context.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${bearer(context.env)}` }
    });
    const users = payload.includes && Array.isArray(payload.includes.users) ? payload.includes.users : [];
    const userById = new Map(users.map((row) => [row.id, row]));
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];
    const owners = new Map();

    for (const tweet of Array.isArray(payload.data) ? payload.data : []) {
      const user = userById.get(tweet.author_id);
      if (!user || !user.username) continue;
      let owner = owners.get(user.id);
      if (!owner) {
        owner = identityBundle({
          provider: 'x', nativeId: user.id, handle: user.username, displayName: user.name || user.username,
          bio: user.description || '', avatarUrl: user.profile_image_url,
          profileUrl: `https://x.com/${encodeURIComponent(user.username)}`, verified: user.verified,
          observedAt
        });
        if (!owner) continue;
        owners.set(user.id, owner);
        creators.push(owner.creator);
        platformIdentities.push(owner.identity);
        const publicMetrics = user.public_metrics || {};
        [['followers', publicMetrics.followers_count], ['following', publicMetrics.following_count], ['posts', publicMetrics.tweet_count]].forEach(([metric, value]) => addMetric(metricObservations, {
          entityType: 'identity', entityId: owner.identity.id, provider: 'x', metric,
          value, observedAt, sourceUrl: owner.identity.profileUrl
        }));
      }
      const contentUrl = `https://x.com/${encodeURIComponent(user.username)}/status/${encodeURIComponent(tweet.id)}`;
      const content = contentForIdentity({
        provider: 'x', nativeId: tweet.id, contentType: 'post', title: tweet.text,
        excerpt: tweet.text, canonicalUrl: contentUrl, publishedAt: tweet.created_at, observedAt
      }, owner);
      if (!content) continue;
      contentRecords.push(content);
      const publicMetrics = tweet.public_metrics || {};
      [
        ['likes', publicMetrics.like_count],
        ['shares', publicMetrics.retweet_count],
        ['comments', publicMetrics.reply_count],
        ['quotes', publicMetrics.quote_count],
        ['views', publicMetrics.impression_count]
      ].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'content', entityId: content.id, provider: 'x', metric,
        value, observedAt, sourceUrl: content.canonicalUrl
      }));
    }
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: payload.meta && payload.meta.next_token || null
    };
  }
});

module.exports = { approved, bearer, x };
