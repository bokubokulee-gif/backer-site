'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle, thumbnail } = require('./_helpers');

function youtubeKey(env) {
  return env.BACKER_YOUTUBE_API_KEY || env.YOUTUBE_API_KEY || '';
}

async function videoPage(context, key, maxResults) {
  if (context.mode === 'trending') {
    const url = fixedUrl('https://www.googleapis.com', '/youtube/v3/videos', {
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode: context.env.BACKER_YOUTUBE_REGION || 'US',
      maxResults,
      pageToken: context.cursor,
      key
    });
    return fetchJson(context.fetch, url, { signal: context.signal });
  }
  const searchUrl = fixedUrl('https://www.googleapis.com', '/youtube/v3/search', {
    part: 'snippet',
    type: 'video',
    q: context.query,
    maxResults,
    pageToken: context.cursor,
    order: 'relevance',
    key
  });
  const search = await fetchJson(context.fetch, searchUrl, { signal: context.signal });
  const ids = (Array.isArray(search.items) ? search.items : [])
    .map((row) => row && row.id && row.id.videoId)
    .filter(Boolean);
  if (!ids.length) return { items: [], nextPageToken: null };
  const videosUrl = fixedUrl('https://www.googleapis.com', '/youtube/v3/videos', {
    part: 'snippet,statistics',
    id: ids.join(','),
    key
  });
  const videos = await fetchJson(context.fetch, videosUrl, { signal: context.signal });
  return Object.assign({}, videos, { nextPageToken: search.nextPageToken || null });
}

const youtube = createProviderAdapter({
  id: 'youtube',
  availability(env) {
    return youtubeKey(env) ? { state: 'ready' } : { state: 'not_configured', reasonCode: 'credentials_missing' };
  },
  async fetchPage(context) {
    const key = youtubeKey(context.env);
    const maxResults = Math.max(5, Math.min(50, context.providerLimit || 25));
    const payload = await videoPage(context, key, maxResults);
    const videos = Array.isArray(payload.items) ? payload.items : [];
    const channelIds = Array.from(new Set(videos.map((row) => row && row.snippet && row.snippet.channelId).filter(Boolean)));
    let channels = [];
    if (channelIds.length) {
      const channelsUrl = fixedUrl('https://www.googleapis.com', '/youtube/v3/channels', {
        part: 'snippet,statistics,brandingSettings',
        id: channelIds.join(','),
        key
      });
      const response = await fetchJson(context.fetch, channelsUrl, { signal: context.signal });
      channels = Array.isArray(response.items) ? response.items : [];
    }
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];
    const owners = new Map();

    for (const channel of channels) {
      const snippet = channel.snippet || {};
      const owner = identityBundle({
        provider: 'youtube',
        nativeId: channel.id,
        handle: snippet.customUrl || '',
        displayName: snippet.title,
        bio: snippet.description,
        avatarUrl: thumbnail(snippet.thumbnails),
        profileUrl: `https://www.youtube.com/channel/${encodeURIComponent(channel.id)}`,
        observedAt
      });
      if (!owner) continue;
      owners.set(channel.id, owner);
      creators.push(owner.creator);
      platformIdentities.push(owner.identity);
      const statistics = channel.statistics || {};
      if (!statistics.hiddenSubscriberCount) {
        addMetric(metricObservations, {
          entityType: 'identity', entityId: owner.identity.id, provider: 'youtube', metric: 'subscribers',
          value: statistics.subscriberCount, observedAt, sourceUrl: owner.identity.profileUrl
        });
      }
      [['views', statistics.viewCount], ['videos', statistics.videoCount]].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'identity', entityId: owner.identity.id, provider: 'youtube', metric,
        value, observedAt, sourceUrl: owner.identity.profileUrl
      }));
    }

    for (const video of videos) {
      const snippet = video.snippet || {};
      let owner = owners.get(snippet.channelId);
      if (!owner) {
        owner = identityBundle({
          provider: 'youtube', nativeId: snippet.channelId, handle: '', displayName: snippet.channelTitle,
          bio: '', profileUrl: `https://www.youtube.com/channel/${encodeURIComponent(snippet.channelId || '')}`,
          observedAt
        });
        if (owner) {
          owners.set(snippet.channelId, owner);
          creators.push(owner.creator);
          platformIdentities.push(owner.identity);
        }
      }
      if (!owner) continue;
      const content = contentForIdentity({
        provider: 'youtube',
        nativeId: video.id,
        contentType: 'video',
        title: snippet.title,
        excerpt: snippet.description,
        canonicalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
        thumbnailUrl: thumbnail(snippet.thumbnails),
        publishedAt: snippet.publishedAt,
        observedAt
      }, owner);
      if (!content) continue;
      contentRecords.push(content);
      const statistics = video.statistics || {};
      [['views', statistics.viewCount], ['likes', statistics.likeCount], ['comments', statistics.commentCount]].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'content', entityId: content.id, provider: 'youtube', metric,
        value, observedAt, sourceUrl: content.canonicalUrl
      }));
    }
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: payload.nextPageToken || null
    };
  }
});

module.exports = { videoPage, youtube, youtubeKey };
