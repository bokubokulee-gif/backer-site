#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot as buildGithubMomentumSnapshot } from './sync-github-momentum.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(ROOT, 'data', 'market2-people.json');
const SCHEMA_VERSION = 1;
const METHODOLOGY = 'backer-market2-evidence-v1';
const PLATFORMS = Object.freeze(['x', 'youtube', 'instagram', 'github']);
const INSTRUMENTS = Object.freeze(['milestones', 'pk-market', 'creator-arena', 'creator-perps']);
const YOUTUBE_MAX_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function cleanText(value, maximum) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, maximum || 500);
}

function slugify(value) {
  return cleanText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'creator';
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function iso(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function firstThumbnail(thumbnails) {
  const source = thumbnails || {};
  const match = source.maxres || source.standard || source.high || source.medium || source.default;
  return match && match.url ? String(match.url) : null;
}

function discoveryEligibility() {
  return INSTRUMENTS.map(instrument => ({
    instrument,
    status: 'discovery-only',
    consentStatus: 'none',
    grantsProfilePublication: false,
    grantsTrading: false,
    platformAccountVerified: false,
    rightPublicityReview: 'pending',
    policyReview: 'pending',
    settlementSource: null
  }));
}

function providerResult(provider, status, people, details) {
  const list = Array.isArray(people) ? people : [];
  const contentCount = list.reduce((sum, person) => sum + (person.content || []).length, 0);
  const metricCount = list.reduce((sum, person) => sum + (person.metrics || []).length, 0);
  return Object.assign({
    provider,
    status,
    people: list,
    peopleCount: list.length,
    contentCount,
    metricCount,
    diagnosticCode: null,
    rateLimit: {}
  }, details || {});
}

function basePerson(platform, nativeAccountId, input, now) {
  const handle = cleanText(input.handle, 120);
  const personId = `person:${platform}:${nativeAccountId}`;
  const identitySuffix = slugify(nativeAccountId).slice(-16);
  return {
    id: personId,
    personId,
    slug: `${platform}-${slugify(handle || nativeAccountId).slice(0, 72)}-${identitySuffix}`,
    displayName: cleanText(input.displayName || handle, 160),
    handle,
    description: cleanText(input.description, 320),
    portraitUrl: String(input.portraitUrl || ''),
    portraitSourceUrl: String(input.portraitUrl || ''),
    portraitPolicy: 'provider-url-refresh-required',
    category: cleanText(input.category || 'Creator', 80),
    claimStatus: 'unclaimed',
    discoveryStatus: 'active',
    identityConfidence: 'source-account-only',
    sourceAccounts: [{
      id: `account:${platform}:${nativeAccountId}`,
      platform,
      nativeAccountId: String(nativeAccountId),
      handle,
      profileUrl: String(input.profileUrl || ''),
      accountType: cleanText(input.accountType || 'public', 80),
      verificationState: input.verified ? 'platform-verified' : 'unverified',
      policyMode: input.policyMode || 'discovery-only',
      refreshedAt: now.toISOString()
    }],
    platforms: [platform],
    coverageWindows: Array.isArray(input.coverageWindows) ? input.coverageWindows : [],
    content: [],
    metrics: [],
    evidence: [],
    marketEligibility: discoveryEligibility(),
    tradable: false,
    tradableInstruments: [],
    discoveryOnly: true,
    whyNow: cleanText(input.whyNow, 280),
    latestWork: null,
    breakoutWork: null,
    bestProviderRank: input.bestProviderRank == null ? null : Number(input.bestProviderRank),
    provenance: {
      platform,
      source: `${platform}-official-api`,
      observedAt: now.toISOString(),
      policyMode: input.policyMode || 'discovery-only'
    }
  };
}

function metric(platform, personId, subjectType, subjectId, name, value, window, observedAt, extras) {
  return Object.assign({
    platform,
    personId,
    subjectType,
    subjectId: String(subjectId),
    metricName: name,
    rawValue: numberOrNull(value),
    rawText: value == null ? null : String(value),
    window,
    observedAt: observedAt.toISOString(),
    sourceTimestamp: null,
    providerRank: null,
    isDerived: false,
    policyMode: 'raw-provider-metric'
  }, extras || {});
}

function contentItem(platform, personId, accountId, nativeContentId, input, now) {
  return {
    id: `content:${platform}:${nativeContentId}`,
    personId,
    sourceAccountId: accountId,
    platform,
    nativeContentId: String(nativeContentId),
    url: String(input.url || ''),
    title: cleanText(input.title, 500),
    type: cleanText(input.type || 'post', 80),
    publishedAt: iso(input.publishedAt),
    thumbnailUrl: input.thumbnailUrl ? String(input.thumbnailUrl) : null,
    thumbnailPolicy: input.thumbnailPolicy || 'provider-url-refresh-required',
    availability: 'available',
    observedAt: now.toISOString(),
    refreshedAt: now.toISOString(),
    providerRank: input.providerRank == null ? null : Number(input.providerRank)
  };
}

function headersObject(response) {
  if (!response || !response.headers || typeof response.headers.get !== 'function') return {};
  const names = ['x-rate-limit-limit', 'x-rate-limit-remaining', 'x-rate-limit-reset', 'x-app-usage'];
  return Object.fromEntries(names.map(name => [name, response.headers.get(name)]).filter(([, value]) => value != null));
}

async function requestJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options || {});
  if (!response || !response.ok) {
    const status = Number(response && response.status) || 500;
    const error = new Error(`Provider request failed with ${status}`);
    error.code = status === 429 ? 'rate_limited' : `provider_${status}`;
    error.status = status;
    error.rateLimit = headersObject(response);
    throw error;
  }
  return { payload: await response.json(), rateLimit: headersObject(response) };
}

function xHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

function xSearchQuery(trends) {
  const names = trends.slice(0, 4).map(trend => cleanText(trend.trend_name || trend.name, 80)).filter(Boolean);
  if (!names.length) return null;
  const terms = names.map(name => /\s/.test(name) && !name.startsWith('#') ? `"${name.replace(/"/g, '')}"` : name);
  return `(${terms.join(' OR ')}) -is:retweet`;
}

async function syncX(options) {
  const config = Object.assign({
    fetchImpl: globalThis.fetch,
    now: new Date(),
    token: '',
    woeid: 1,
    peopleLimit: 8,
    commercialUseApproved: false
  }, options || {});
  if (!config.token) return providerResult('x', 'permission-required', [], { diagnosticCode: 'missing_x_bearer_token' });
  if (!config.commercialUseApproved) {
    return providerResult('x', 'permission-required', [], { diagnosticCode: 'x_commercial_use_review_required' });
  }
  const trendsUrl = new URL(`https://api.x.com/2/trends/by/woeid/${encodeURIComponent(config.woeid)}`);
  trendsUrl.searchParams.set('max_trends', '12');
  trendsUrl.searchParams.set('trend.fields', 'trend_name,tweet_count');
  const trendsResponse = await requestJson(config.fetchImpl, trendsUrl, { headers: xHeaders(config.token) });
  const trends = Array.isArray(trendsResponse.payload.data) ? trendsResponse.payload.data : [];
  const query = xSearchQuery(trends);
  if (!query) return providerResult('x', 'empty-window', [], { rateLimit: trendsResponse.rateLimit });

  const searchUrl = new URL('https://api.x.com/2/tweets/search/recent');
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('max_results', '100');
  searchUrl.searchParams.set('sort_order', 'recency');
  searchUrl.searchParams.set('tweet.fields', 'id,text,created_at,public_metrics,author_id,attachments');
  searchUrl.searchParams.set('expansions', 'author_id,attachments.media_keys');
  searchUrl.searchParams.set('user.fields', 'id,name,username,description,profile_image_url,url,verified,public_metrics');
  searchUrl.searchParams.set('media.fields', 'media_key,type,url,preview_image_url,public_metrics');
  const searchResponse = await requestJson(config.fetchImpl, searchUrl, { headers: xHeaders(config.token) });
  const posts = Array.isArray(searchResponse.payload.data) ? searchResponse.payload.data : [];
  const users = new Map(((searchResponse.payload.includes || {}).users || []).map(user => [String(user.id), user]));
  const mediaByKey = new Map(((searchResponse.payload.includes || {}).media || []).map(item => [String(item.media_key), item]));
  const postsByAuthor = new Map();
  posts.forEach(post => {
    const authorId = String(post.author_id || '');
    if (!users.has(authorId)) return;
    const list = postsByAuthor.get(authorId) || [];
    list.push(post);
    postsByAuthor.set(authorId, list);
  });

  const ranked = Array.from(postsByAuthor.entries())
    .sort((a, b) => Date.parse(b[1][0].created_at || 0) - Date.parse(a[1][0].created_at || 0))
    .slice(0, config.peopleLimit);
  const people = ranked.map(([authorId, authorPosts]) => {
    authorPosts.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
    const user = users.get(authorId);
    const observedAt = new Date(config.now);
    const twentyFourHoursAgo = observedAt.getTime() - 24 * 60 * 60 * 1000;
    const coverageWindows = authorPosts.some(post => Date.parse(post.created_at || 0) >= twentyFourHoursAgo)
      ? ['24h', '7d']
      : ['7d'];
    const person = basePerson('x', authorId, {
      handle: user.username,
      displayName: user.name,
      description: user.description,
      portraitUrl: user.profile_image_url,
      profileUrl: `https://x.com/${encodeURIComponent(user.username)}`,
      category: 'Public conversation',
      accountType: 'public',
      verified: user.verified,
      policyMode: 'discovery-only',
      coverageWindows,
      whyNow: `Recent public work appeared in X search around ${cleanText(trends[0] && trends[0].trend_name, 80) || 'a current topic'}.`
    }, new Date(config.now));
    const accountId = person.sourceAccounts[0].id;
    person.content = authorPosts.slice(0, 4).map(post => {
      const mediaKey = post.attachments && post.attachments.media_keys && post.attachments.media_keys[0];
      const media = mediaKey ? mediaByKey.get(String(mediaKey)) : null;
      return contentItem('x', person.id, accountId, post.id, {
        url: `https://x.com/${encodeURIComponent(user.username)}/status/${post.id}`,
        title: post.text,
        type: media && media.type || 'post',
        publishedAt: post.created_at,
        thumbnailUrl: media && (media.preview_image_url || media.url),
        thumbnailPolicy: 'provider-url-refresh-required'
      }, new Date(config.now));
    });
    const userMetrics = user.public_metrics || {};
    Object.entries(userMetrics).forEach(([name, value]) => {
      person.metrics.push(metric('x', person.id, 'account', authorId, name, value, 'lifetime', new Date(config.now)));
    });
    authorPosts.slice(0, 4).forEach(post => {
      Object.entries(post.public_metrics || {}).forEach(([name, value]) => {
        person.metrics.push(metric('x', person.id, 'content', post.id, name, value, 'current', new Date(config.now), {
          sourceTimestamp: iso(post.created_at)
        }));
      });
    });
    person.evidence = coverageWindows.map(window => ({
      window,
      platformCoverage: ['x'],
      facts: person.metrics
        .filter(item => item.subjectType === 'content')
        .filter(item => window !== '24h' || Date.parse(item.sourceTimestamp || 0) >= twentyFourHoursAgo)
        .slice(0, 8),
      coverageGaps: ['X supplies trending topics, not a provider-ranked list of people.'],
      interpretation: person.whyNow,
      confidence: 'medium',
      methodology: METHODOLOGY,
      crossPlatformScore: null,
      youtubeIncludedInScore: false,
      youtubePolicyMode: 'not-used',
      generatedAt: new Date(config.now).toISOString()
    }));
    person.latestWork = person.content[0] || null;
    person.breakoutWork = person.content[0] || null;
    return person;
  }).filter(person => person.portraitUrl && person.handle);

  return providerResult('x', people.length ? 'fresh' : 'empty-window', people, {
    rateLimit: Object.assign({}, trendsResponse.rateLimit, searchResponse.rateLimit)
  });
}

function youtubeUrl(resource, params, key) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  Object.entries(params || {}).forEach(([name, value]) => {
    if (value != null && value !== '') url.searchParams.set(name, String(value));
  });
  url.searchParams.set('key', key);
  return url;
}

async function syncYouTube(options) {
  const config = Object.assign({ fetchImpl: globalThis.fetch, now: new Date(), apiKey: '', regionCode: 'US', peopleLimit: 8 }, options || {});
  if (!config.apiKey) return providerResult('youtube', 'permission-required', [], { diagnosticCode: 'missing_youtube_api_key' });
  const videosResponse = await requestJson(config.fetchImpl, youtubeUrl('videos', {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    maxResults: Math.max(8, config.peopleLimit * 2),
    regionCode: config.regionCode
  }, config.apiKey));
  const videos = Array.isArray(videosResponse.payload.items) ? videosResponse.payload.items : [];
  const channelOrder = [];
  videos.forEach((video, index) => {
    const channelId = video && video.snippet && video.snippet.channelId;
    if (channelId && !channelOrder.some(item => item.channelId === channelId)) {
      channelOrder.push({ channelId, video, providerRank: index + 1 });
    }
  });
  const selected = channelOrder.slice(0, config.peopleLimit);
  if (!selected.length) return providerResult('youtube', 'empty-window', [], { rateLimit: videosResponse.rateLimit });
  const channelsResponse = await requestJson(config.fetchImpl, youtubeUrl('channels', {
    part: 'snippet,statistics,contentDetails',
    id: selected.map(item => item.channelId).join(','),
    maxResults: selected.length
  }, config.apiKey));
  const channels = new Map((channelsResponse.payload.items || []).map(channel => [String(channel.id), channel]));

  const latestByChannel = new Map();
  for (const candidate of selected) {
    const channel = channels.get(candidate.channelId);
    const playlistId = channel && channel.contentDetails && channel.contentDetails.relatedPlaylists && channel.contentDetails.relatedPlaylists.uploads;
    if (!playlistId) continue;
    try {
      const latest = await requestJson(config.fetchImpl, youtubeUrl('playlistItems', {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: 1
      }, config.apiKey));
      const item = latest.payload.items && latest.payload.items[0];
      if (item) latestByChannel.set(candidate.channelId, item);
    } catch (_error) {
      // The provider-ranked work remains useful if a single uploads playlist is unavailable.
    }
  }

  const people = selected.map(candidate => {
    const channel = channels.get(candidate.channelId);
    if (!channel || !channel.snippet || !channel.snippet.thumbnails) return null;
    const snippet = channel.snippet;
    const rankedVideo = candidate.video;
    const person = basePerson('youtube', candidate.channelId, {
      handle: snippet.customUrl || candidate.channelId,
      displayName: snippet.title,
      description: snippet.description,
      portraitUrl: firstThumbnail(snippet.thumbnails),
      profileUrl: `https://www.youtube.com/channel/${candidate.channelId}`,
      category: 'Video creator',
      accountType: 'channel',
      policyMode: 'provider-rank-raw-only',
      coverageWindows: ['24h'],
      bestProviderRank: candidate.providerRank,
      whyNow: `Appears in YouTube's current mostPopular response for ${config.regionCode}.`
    }, new Date(config.now));
    const accountId = person.sourceAccounts[0].id;
    const rankedItem = contentItem('youtube', person.id, accountId, rankedVideo.id, {
      url: `https://www.youtube.com/watch?v=${rankedVideo.id}`,
      title: rankedVideo.snippet.title,
      type: 'video',
      publishedAt: rankedVideo.snippet.publishedAt,
      thumbnailUrl: firstThumbnail(rankedVideo.snippet.thumbnails),
      thumbnailPolicy: 'embed-only',
      providerRank: candidate.providerRank
    }, new Date(config.now));
    person.content.push(rankedItem);
    const latest = latestByChannel.get(candidate.channelId);
    const latestVideoId = latest && latest.contentDetails && latest.contentDetails.videoId;
    if (latestVideoId && latestVideoId !== rankedVideo.id) {
      person.content.unshift(contentItem('youtube', person.id, accountId, latestVideoId, {
        url: `https://www.youtube.com/watch?v=${latestVideoId}`,
        title: latest.snippet && latest.snippet.title,
        type: 'video',
        publishedAt: latest.contentDetails.videoPublishedAt || latest.snippet && latest.snippet.publishedAt,
        thumbnailUrl: firstThumbnail(latest.snippet && latest.snippet.thumbnails),
        thumbnailPolicy: 'embed-only'
      }, new Date(config.now)));
    }
    Object.entries(channel.statistics || {}).forEach(([name, value]) => {
      person.metrics.push(metric('youtube', person.id, 'account', candidate.channelId, name, value, 'lifetime', new Date(config.now), {
        policyMode: 'raw-provider-metric'
      }));
    });
    Object.entries(rankedVideo.statistics || {}).forEach(([name, value]) => {
      person.metrics.push(metric('youtube', person.id, 'content', rankedVideo.id, name, value, 'current', new Date(config.now), {
        sourceTimestamp: iso(rankedVideo.snippet.publishedAt),
        providerRank: candidate.providerRank,
        policyMode: 'raw-provider-metric'
      }));
    });
    person.metrics.push(metric('youtube', person.id, 'content', rankedVideo.id, 'provider_rank', candidate.providerRank, 'current', new Date(config.now), {
      providerRank: candidate.providerRank,
      policyMode: 'provider-rank-raw-only'
    }));
    person.evidence = [{
      window: '24h',
      platformCoverage: ['youtube'],
      facts: person.metrics.filter(item => item.subjectId === String(rankedVideo.id)),
      coverageGaps: ['YouTube mostPopular is not a general all-category creator trend feed.'],
      interpretation: person.whyNow,
      confidence: 'high',
      methodology: METHODOLOGY,
      crossPlatformScore: null,
      youtubeIncludedInScore: false,
      youtubePolicyMode: 'raw-provider-only',
      generatedAt: new Date(config.now).toISOString()
    }];
    person.latestWork = person.content[0] || null;
    person.breakoutWork = rankedItem;
    return person;
  }).filter(Boolean);
  return providerResult('youtube', people.length ? 'fresh' : 'empty-window', people, {
    rateLimit: Object.assign({}, videosResponse.rateLimit, channelsResponse.rateLimit)
  });
}

function instagramHandles(value) {
  return String(value || '').split(',')
    .map(item => item.trim().replace(/^@/, ''))
    .filter(item => /^[a-zA-Z0-9._]{1,30}$/.test(item))
    .slice(0, 12);
}

function publicGitHubUrl(input) {
  const url = new URL(String(input));
  if (url.hostname === 'api.github.com' && url.pathname === '/search/repositories') {
    const query = url.searchParams.get('q') || '';
    if (!/(?:^|\s)is:public(?:\s|$)/.test(query)) url.searchParams.set('q', `${query} is:public`.trim());
  }
  return url;
}

async function syncInstagram(options) {
  const config = Object.assign({
    fetchImpl: globalThis.fetch,
    now: new Date(),
    token: '',
    igUserId: '',
    handles: [],
    apiVersion: 'v25.0',
    appReviewApproved: false
  }, options || {});
  const handles = Array.isArray(config.handles) ? config.handles : instagramHandles(config.handles);
  if (!config.token || !config.igUserId) {
    return providerResult('instagram', 'permission-required', [], { diagnosticCode: 'missing_instagram_oauth' });
  }
  if (!config.appReviewApproved) {
    return providerResult('instagram', 'permission-required', [], { diagnosticCode: 'instagram_app_review_required' });
  }
  if (!handles.length) return providerResult('instagram', 'empty-window', [], { diagnosticCode: 'no_approved_discovery_handles' });
  const people = [];
  let partial = false;
  let rateLimit = {};
  for (const handle of handles) {
    const fields = `business_discovery.username(${handle}){id,username,name,biography,profile_picture_url,followers_count,media_count,media.limit(3){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}}`;
    const url = new URL(`https://graph.facebook.com/${encodeURIComponent(config.apiVersion)}/${encodeURIComponent(config.igUserId)}`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('access_token', config.token);
    try {
      const response = await requestJson(config.fetchImpl, url);
      rateLimit = Object.assign(rateLimit, response.rateLimit);
      const account = response.payload.business_discovery;
      if (!account || !account.username || !account.profile_picture_url) continue;
      const nativeId = String(account.id || account.username);
      const person = basePerson('instagram', nativeId, {
        handle: account.username,
        displayName: account.name || account.username,
        description: account.biography,
        portraitUrl: account.profile_picture_url,
        profileUrl: `https://www.instagram.com/${encodeURIComponent(account.username)}/`,
        category: 'Visual creator',
        accountType: 'professional',
        policyMode: 'known-professional-discovery',
        coverageWindows: ['24h'],
        whyNow: 'Included through an approved known Professional-account discovery seed.'
      }, new Date(config.now));
      const accountId = person.sourceAccounts[0].id;
      person.content = ((account.media || {}).data || []).map(item => contentItem('instagram', person.id, accountId, item.id, {
        url: item.permalink,
        title: item.caption,
        type: String(item.media_type || 'post').toLowerCase(),
        publishedAt: item.timestamp,
        thumbnailUrl: item.thumbnail_url || item.media_url,
        thumbnailPolicy: 'provider-url-refresh-required'
      }, new Date(config.now)));
      person.metrics.push(metric('instagram', person.id, 'account', nativeId, 'followers_count', account.followers_count, 'lifetime', new Date(config.now)));
      person.metrics.push(metric('instagram', person.id, 'account', nativeId, 'media_count', account.media_count, 'lifetime', new Date(config.now)));
      ((account.media || {}).data || []).forEach(item => {
        if (item.like_count != null) person.metrics.push(metric('instagram', person.id, 'content', item.id, 'like_count', item.like_count, 'current', new Date(config.now), { sourceTimestamp: iso(item.timestamp) }));
        if (item.comments_count != null) person.metrics.push(metric('instagram', person.id, 'content', item.id, 'comments_count', item.comments_count, 'current', new Date(config.now), { sourceTimestamp: iso(item.timestamp) }));
      });
      person.evidence = [{
        window: '24h',
        platformCoverage: ['instagram'],
        facts: person.metrics.slice(0, 8),
        coverageGaps: ['Business Discovery covers known Professional accounts and is not a global trending-people feed.'],
        interpretation: person.whyNow,
        confidence: 'medium',
        methodology: METHODOLOGY,
        crossPlatformScore: null,
        youtubeIncludedInScore: false,
        youtubePolicyMode: 'not-used',
        generatedAt: new Date(config.now).toISOString()
      }];
      person.latestWork = person.content[0] || null;
      person.breakoutWork = person.content[0] || null;
      people.push(person);
    } catch (error) {
      partial = true;
      if (error && error.code === 'rate_limited') throw error;
    }
  }
  return providerResult('instagram', people.length ? partial ? 'partial' : 'fresh' : partial ? 'failed' : 'empty-window', people, { rateLimit });
}

async function syncGitHub(options) {
  const config = Object.assign({
    fetchImpl: globalThis.fetch,
    now: new Date(),
    token: '',
    peopleLimit: 8,
    publicOnlyAccessApproved: false
  }, options || {});
  if (!config.token) return providerResult('github', 'permission-required', [], { diagnosticCode: 'missing_github_token' });
  if (!config.publicOnlyAccessApproved) {
    return providerResult('github', 'permission-required', [], { diagnosticCode: 'github_public_only_token_required' });
  }
  const publicOnlyFetch = (input, init) => {
    return config.fetchImpl(publicGitHubUrl(input), init);
  };
  const snapshot = await buildGithubMomentumSnapshot({
    fetchImpl: publicOnlyFetch,
    token: config.token,
    now: new Date(config.now),
    peopleLimit: config.peopleLimit
  });
  const people = snapshot.people.map(source => {
    const person = basePerson('github', source.githubId, {
      handle: source.login,
      displayName: source.displayName,
      description: source.bio,
      portraitUrl: source.avatarUrl,
      profileUrl: source.profileUrl,
      category: 'Open source',
      accountType: 'developer',
      policyMode: 'discovery-only',
      coverageWindows: ['7d'],
      bestProviderRank: null,
      whyNow: source.breakoutRepo && source.breakoutRepo.nameWithOwner
        ? `${source.breakoutRepo.nameWithOwner} is the strongest repository signal in the captured GitHub window.`
        : 'Public GitHub activity increased in the captured window.'
    }, new Date(config.now));
    const accountId = person.sourceAccounts[0].id;
    const repo = source.breakoutRepo;
    if (repo && repo.githubId) {
      person.content.push(contentItem('github', person.id, accountId, repo.githubId, {
        url: repo.url,
        title: `${repo.nameWithOwner}: ${repo.description || 'Public repository'}`,
        type: 'repository',
        publishedAt: repo.pushedAt,
        thumbnailUrl: null,
        thumbnailPolicy: 'none'
      }, new Date(config.now)));
    }
    const signalNames = {
      followerCount: 'followers_count',
      totalProjectStars: 'aggregate_repository_stars',
      totalProjectForks: 'aggregate_repository_forks',
      publicContributions: 'public_contributions',
      activeDays: 'active_days',
      contributionConsistency: 'contribution_consistency'
    };
    Object.entries(source.signals || {}).forEach(([name, value]) => {
      if (signalNames[name]) person.metrics.push(metric('github', person.id, 'account', source.githubId, signalNames[name], value, name === 'followerCount' ? 'lifetime' : '7d', new Date(config.now)));
    });
    const momentum = source.metricsByRange && source.metricsByRange['7d'] && source.metricsByRange['7d'].momentum;
    if (momentum != null) person.metrics.push(metric('github', person.id, 'account', source.githubId, 'backer_github_momentum', momentum, '7d', new Date(config.now), {
      isDerived: true,
      policyMode: 'backer-github-momentum-v1'
    }));
    person.evidence = [{
      window: '7d',
      platformCoverage: ['github'],
      facts: person.metrics,
      coverageGaps: ['GitHub does not provide an official Trending API.'],
      interpretation: person.whyNow,
      confidence: snapshot.status === 'fresh' ? 'high' : 'medium',
      methodology: 'backer-github-momentum-v1',
      crossPlatformScore: null,
      youtubeIncludedInScore: false,
      youtubePolicyMode: 'not-used',
      generatedAt: new Date(config.now).toISOString()
    }];
    person.latestWork = person.content[0] || null;
    person.breakoutWork = person.content[0] || null;
    return person;
  });
  return providerResult('github', snapshot.status === 'fresh' ? 'fresh' : 'partial', people);
}

function diagnosticStatus(error) {
  if (error && (error.code === 'rate_limited' || error.status === 429)) return 'rate-limited';
  return 'failed';
}

async function runProvider(provider, work) {
  try {
    return await work();
  } catch (error) {
    return providerResult(provider, diagnosticStatus(error), [], {
      diagnosticCode: cleanText(error && error.code || 'sync_failed', 80),
      rateLimit: error && error.rateLimit || {}
    });
  }
}

function assertPolicySafeSnapshot(snapshot) {
  (snapshot.people || []).forEach(person => {
    if (person.tradable || (person.tradableInstruments || []).length) {
      throw new Error('Official discovery sync cannot grant market tradability');
    }
    (person.marketEligibility || []).forEach(record => {
      if (record.status === 'eligible') throw new Error('Official discovery sync cannot create eligible instruments');
    });
    (person.metrics || []).forEach(item => {
      if (item.platform === 'youtube' && item.isDerived && item.policyMode !== 'youtube-derived-approved') {
        throw new Error('Unapproved YouTube-derived metric');
      }
    });
    (person.evidence || []).forEach(record => {
      const coverage = Array.isArray(record.platformCoverage) ? record.platformCoverage : [];
      const youtubeCouldInfluenceScore = record.youtubeIncludedInScore
        || (record.crossPlatformScore != null && coverage.includes('youtube'));
      if (youtubeCouldInfluenceScore && record.youtubePolicyMode !== 'youtube-derived-approved') {
        throw new Error('Unapproved YouTube input in Backer score');
      }
    });
  });
  return snapshot;
}

async function buildMarket2Snapshot(options) {
  const config = Object.assign({
    fetchImpl: globalThis.fetch,
    now: new Date(),
    tokens: {},
    connectors: {},
    peopleLimit: 8,
    xWoeid: 1,
    xCommercialUseApproved: false,
    youtubeRegion: 'US',
    instagramHandles: [],
    instagramApiVersion: 'v25.0',
    instagramAppReviewApproved: false,
    githubPublicOnlyAccessApproved: false,
    youtubeDerivedApproved: false
  }, options || {});
  if (typeof config.fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  const now = new Date(config.now);
  const connectors = Object.assign({
    x: () => syncX({
      fetchImpl: config.fetchImpl,
      now,
      token: config.tokens.x,
      woeid: config.xWoeid,
      peopleLimit: config.peopleLimit,
      commercialUseApproved: config.xCommercialUseApproved
    }),
    youtube: () => syncYouTube({ fetchImpl: config.fetchImpl, now, apiKey: config.tokens.youtube, regionCode: config.youtubeRegion, peopleLimit: config.peopleLimit }),
    instagram: () => syncInstagram({
      fetchImpl: config.fetchImpl,
      now,
      token: config.tokens.instagram,
      igUserId: config.tokens.instagramUserId,
      handles: config.instagramHandles,
      apiVersion: config.instagramApiVersion,
      appReviewApproved: config.instagramAppReviewApproved
    }),
    github: () => syncGitHub({
      fetchImpl: config.fetchImpl,
      now,
      token: config.tokens.github,
      peopleLimit: config.peopleLimit,
      publicOnlyAccessApproved: config.githubPublicOnlyAccessApproved
    })
  }, config.connectors || {});
  const results = await Promise.all(PLATFORMS.map(provider => runProvider(provider, connectors[provider])));
  const providerStatus = Object.fromEntries(results.map(result => [result.provider, {
    status: result.status,
    peopleCount: result.peopleCount,
    contentCount: result.contentCount,
    metricCount: result.metricCount,
    diagnosticCode: result.diagnosticCode,
    rateLimit: result.rateLimit,
    refreshedAt: ['fresh', 'partial', 'empty-window'].includes(result.status) ? now.toISOString() : null
  }]));
  const people = results.flatMap(result => result.people);
  const failures = results.filter(result => ['failed', 'rate-limited'].includes(result.status));
  const status = people.length
    ? results.every(result => result.status === 'fresh') ? 'live' : 'partial'
    : failures.length
      ? failures.every(result => result.status === 'rate-limited') ? 'rate-limited' : 'failed'
      : results.every(result => result.status === 'permission-required') ? 'permission-required' : 'empty-window';
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    status,
    isFixture: false,
    isSnapshot: true,
    window: '7d',
    platforms: PLATFORMS.slice(),
    view: 'markets',
    sort: 'movement',
    providerStatus,
    people,
    rightRail: {},
    methodology: {
      version: METHODOLOGY,
      officialApisOnly: true,
      crossPlatformScore: 'disabled-by-default',
      youtubeDerivedMetrics: config.youtubeDerivedApproved ? 'approval-recorded-but-not-used-by-sync' : 'not-approved-and-not-used',
      youtubeAudiovisualCaching: 'disabled',
      identityMatching: 'no-cross-platform-merge-without-creator-claim',
      tradability: 'all-synced-people-discovery-only',
      sortSemantics: 'provider-rank-remains-provider-rank; no-cross-platform-score'
    },
    nextCursor: null
  };
  return assertPolicySafeSnapshot(snapshot);
}

function personPlatforms(person) {
  const fromAccounts = (person.sourceAccounts || []).map(account => account.platform);
  return Array.from(new Set((person.platforms || []).concat(fromAccounts)));
}

function isRetentionSafePerson(person, nowValue) {
  if (!personPlatforms(person).includes('youtube')) return true;
  const now = new Date(nowValue || Date.now()).getTime();
  return (person.sourceAccounts || [])
    .filter(account => account.platform === 'youtube')
    .some(account => {
      const refreshedAt = Date.parse(account.refreshedAt || account.refreshed_at || 0);
      return Number.isFinite(refreshedAt) && now - refreshedAt <= YOUTUBE_MAX_RETENTION_MS;
    });
}

function applyPublicationSuppressions(snapshot, policyValue) {
  const policy = policyValue || {};
  const hiddenPeople = new Set(policy.personIds || []);
  const accountTombstones = new Set((policy.accountTombstones || [])
    .map(item => `${item.provider}:${item.nativeObjectId}`));
  const contentTombstones = new Set((policy.contentTombstones || [])
    .map(item => `${item.provider}:${item.nativeObjectId}`));
  const people = (snapshot.people || []).filter(person => {
    if (hiddenPeople.has(person.id || person.personId)) return false;
    return !(person.sourceAccounts || []).some(account => accountTombstones.has(
      `${account.platform}:${account.nativeAccountId}`
    ));
  }).map(person => {
    const removedContentIds = new Set((person.content || [])
      .filter(item => contentTombstones.has(`${item.platform}:${item.nativeContentId}`))
      .map(item => String(item.nativeContentId)));
    if (!removedContentIds.size) return person;
    const content = (person.content || []).map(item => removedContentIds.has(String(item.nativeContentId))
      ? {
        id: item.id,
        personId: item.personId,
        sourceAccountId: item.sourceAccountId,
        platform: item.platform,
        nativeContentId: item.nativeContentId,
        url: null,
        title: 'Content removed at source',
        type: item.type,
        publishedAt: item.publishedAt,
        thumbnailUrl: null,
        thumbnailPolicy: 'none',
        availability: 'removed',
        observedAt: item.observedAt,
        refreshedAt: item.refreshedAt
      }
      : item);
    const metrics = (person.metrics || []).filter(item => (
      item.subjectType !== 'content' || !removedContentIds.has(String(item.subjectId))
    ));
    const evidence = (person.evidence || []).map(record => Object.assign({}, record, {
      facts: (record.facts || []).filter(item => (
        item.subjectType !== 'content' || !removedContentIds.has(String(item.subjectId))
      )),
      coverageGaps: Array.from(new Set((record.coverageGaps || [])
        .concat('One or more content items were removed at the source.')))
    }));
    const contentById = new Map(content.map(item => [item.id, item]));
    return Object.assign({}, person, {
      content,
      metrics,
      evidence,
      latestWork: person.latestWork && contentById.get(person.latestWork.id) || content[0] || null,
      breakoutWork: person.breakoutWork && contentById.get(person.breakoutWork.id) || content[0] || null
    });
  });
  return Object.assign({}, snapshot, { people });
}

function mergeWithLastGood(current, previous) {
  if (!previous || !Array.isArray(previous.people)) return current;
  const unavailable = PLATFORMS.filter(platform => {
    const state = current.providerStatus && current.providerStatus[platform] && current.providerStatus[platform].status;
    return ['failed', 'rate-limited', 'permission-required', 'partial'].includes(state);
  });
  if (!unavailable.length) return current;
  const fresh = current.people.slice();
  const freshIds = new Set(fresh.map(person => person.id || person.personId));
  const retained = previous.people.filter(person => personPlatforms(person).some(platform => unavailable.includes(platform)))
    .filter(person => isRetentionSafePerson(person, current.generatedAt))
    .filter(person => !freshIds.has(person.id || person.personId))
    .map(person => Object.assign({}, person, {
      dataState: 'last-good',
      snapshotAsOf: previous.generatedAt
    }));
  const providerStatus = Object.assign({}, current.providerStatus);
  unavailable.forEach(platform => {
    const previousState = previous.providerStatus && previous.providerStatus[platform];
    if (!previousState) return;
    const currentStatus = current.providerStatus[platform].status;
    const retainedForProvider = retained.some(person => personPlatforms(person).includes(platform));
    if (currentStatus !== 'partial' && !retainedForProvider) return;
    providerStatus[platform] = Object.assign({}, providerStatus[platform], currentStatus === 'partial'
      ? { retainedLastGood: retainedForProvider, lastGoodAsOf: retainedForProvider ? previous.generatedAt : null }
      : { status: 'last-good', failedStatus: currentStatus, lastGoodAsOf: previous.generatedAt });
  });
  return Object.assign({}, current, {
    generatedAt: fresh.length || !retained.length ? current.generatedAt : previous.generatedAt,
    status: fresh.length ? 'partial' : retained.length ? 'delayed' : current.status,
    providerStatus,
    people: fresh.concat(retained),
    isSnapshot: true
  });
}

async function atomicWriteJson(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const temporary = `${targetPath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporary, targetPath);
}

async function readExistingSnapshot(targetPath) {
  try {
    const source = await fs.readFile(targetPath, 'utf8');
    const parsed = JSON.parse(source);
    return parsed && Array.isArray(parsed.people) ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function databaseRunStatus(status) {
  if (status === 'fresh' || status === 'live') return 'succeeded';
  if (status === 'permission-required') return 'permission-required';
  if (status === 'rate-limited') return 'rate-limited';
  if (status === 'failed') return 'failed';
  if (status === 'empty-window') return 'empty-window';
  return 'partial';
}

async function persistSnapshot(snapshot, connectionString) {
  if (!connectionString) return { personIds: [], accountTombstones: [], contentTombstones: [] };
  const pgModule = await import('pg');
  const Pool = pgModule.Pool || pgModule.default && pgModule.default.Pool;
  const pool = new Pool({ connectionString, max: 1, allowExitOnIdle: true, application_name: 'backer-market2-sync' });
  const client = await pool.connect();
  let suppressionPolicy = { personIds: [], accountTombstones: [], contentTombstones: [] };
  try {
    await client.query('begin');
    const [hiddenResult, tombstoneResult] = await Promise.all([
      client.query(`select person_id from market2_people where discovery_status <> 'active'`),
      client.query(
        `select provider, native_object_type, native_object_id
         from market2_deletion_tombstones`
      )
    ]);
    suppressionPolicy = {
      personIds: hiddenResult.rows.map(row => row.person_id),
      accountTombstones: tombstoneResult.rows
        .filter(row => row.native_object_type === 'account')
        .map(row => ({ provider: row.provider, nativeObjectId: row.native_object_id })),
      contentTombstones: tombstoneResult.rows
        .filter(row => row.native_object_type === 'content')
        .map(row => ({ provider: row.provider, nativeObjectId: row.native_object_id }))
    };
    const publishableSnapshot = applyPublicationSuppressions(snapshot, suppressionPolicy);
    await client.query(
      `update market2_people person
       set discovery_status = 'removed', updated_at = now()
       from market2_source_accounts account, market2_deletion_tombstones tombstone
       where account.person_id = person.person_id
         and tombstone.native_object_type = 'account'
         and tombstone.provider = account.platform
         and tombstone.native_object_id = account.native_account_id`
    );
    await client.query(
      `update market2_content_items content
       set availability = 'removed', thumbnail_url = null, thumbnail_policy = 'none', refreshed_at = now()
       from market2_deletion_tombstones tombstone
       where tombstone.native_object_type = 'content'
         and tombstone.provider = content.platform
         and tombstone.native_object_id = content.native_content_id`
    );
    for (const platform of PLATFORMS) {
      const state = snapshot.providerStatus[platform] || { status: 'failed' };
      await client.query(
        `insert into market2_sync_runs
           (provider, started_at, completed_at, status, people_count, content_count, metric_count,
            rate_limit_metadata, diagnostic_code, last_good_snapshot_reference, schema_version, methodology_version)
         values ($1, $2, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
        [platform, snapshot.generatedAt, databaseRunStatus(state.status), state.peopleCount || 0,
          state.contentCount || 0, state.metricCount || 0, JSON.stringify(state.rateLimit || {}),
          state.diagnosticCode || null, state.lastGoodAsOf || null, snapshot.schemaVersion, METHODOLOGY]
      );
    }
    for (const person of publishableSnapshot.people) {
      if (person.dataState === 'last-good') continue;
      await client.query(
        `insert into market2_people
           (person_id, slug, display_name, public_description, portrait_url, portrait_source_url,
            portrait_policy, category, claim_status, discovery_status, identity_confidence, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'unclaimed', 'active', 'source-account-only', $9, $9)
         on conflict (person_id) do update set
           slug = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.slug else excluded.slug end,
           display_name = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.display_name else excluded.display_name end,
           public_description = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.public_description else excluded.public_description end,
           portrait_url = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.portrait_url else excluded.portrait_url end,
           portrait_source_url = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.portrait_source_url else excluded.portrait_source_url end,
           portrait_policy = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.portrait_policy else excluded.portrait_policy end,
           category = case when market2_people.claim_status in ('claimed', 'verified') then market2_people.category else excluded.category end,
           updated_at = excluded.updated_at
         where market2_people.discovery_status = 'active'`,
        [person.id, person.slug, person.displayName, person.description || '', person.portraitUrl,
          person.portraitSourceUrl || person.portraitUrl, person.portraitPolicy, person.category, snapshot.generatedAt]
      );
      for (const account of person.sourceAccounts || []) {
        await client.query(
          `insert into market2_source_accounts
             (source_account_id, person_id, platform, native_account_id, handle, profile_url, account_type,
              verification_state, source_policy_mode, latest_refresh_at, first_seen_at, updated_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $10)
           on conflict (source_account_id) do update set
             handle = excluded.handle,
             profile_url = excluded.profile_url,
             account_type = excluded.account_type,
             verification_state = case
               when market2_source_accounts.verification_state = 'creator-verified' then market2_source_accounts.verification_state
               else excluded.verification_state
             end,
             source_policy_mode = case
               when market2_source_accounts.source_policy_mode in ('creator-authorized', 'youtube-derived-approved')
                 then market2_source_accounts.source_policy_mode
               else excluded.source_policy_mode
             end,
             latest_refresh_at = excluded.latest_refresh_at,
             updated_at = excluded.updated_at`,
          [account.id, person.id, account.platform, account.nativeAccountId, account.handle, account.profileUrl,
            account.accountType || 'public', account.verificationState || 'unverified', account.policyMode || 'discovery-only', snapshot.generatedAt]
        );
      }
      for (const item of person.content || []) {
        if (item.availability === 'removed') continue;
        await client.query(
          `insert into market2_content_items
             (content_id, person_id, source_account_id, platform, native_content_id, canonical_url,
              title_or_excerpt, content_type, published_at, thumbnail_url, thumbnail_policy,
              availability, observed_at, refreshed_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'available', $12, $12)
           on conflict (content_id) do update set
             canonical_url = excluded.canonical_url,
             title_or_excerpt = excluded.title_or_excerpt,
             content_type = excluded.content_type,
             published_at = excluded.published_at,
             thumbnail_url = excluded.thumbnail_url,
             thumbnail_policy = excluded.thumbnail_policy,
             availability = case when market2_content_items.availability = 'removed' then 'removed' else 'available' end,
             refreshed_at = excluded.refreshed_at`,
          [item.id, person.id, item.sourceAccountId, item.platform, item.nativeContentId, item.url,
            item.title || '', item.type || 'post', item.publishedAt, item.thumbnailUrl, item.thumbnailPolicy, snapshot.generatedAt]
        );
      }
      for (const item of person.metrics || []) {
        await client.query(
          `insert into market2_metric_snapshots
             (person_id, subject_type, subject_id, platform, metric_name, raw_metric_value, raw_metric_text,
              observation_window, observed_at, source_timestamp, provider_rank, is_derived, policy_mode)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           on conflict do nothing`,
          [person.id, item.subjectType, item.subjectId, item.platform, item.metricName, item.rawValue,
            item.rawText, item.window, item.observedAt, item.sourceTimestamp, item.providerRank,
            Boolean(item.isDerived), item.policyMode || 'raw-provider-metric']
        );
      }
      for (const evidence of person.evidence || []) {
        await client.query(
          `insert into market2_attention_evidence
             (person_id, observation_window, platform_coverage, evidence_facts, coverage_gaps,
              interpretation_text, confidence_grade, methodology_version, cross_platform_score,
              youtube_included_in_score, youtube_policy_mode, generated_at)
           values ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)`,
          [person.id, evidence.window, JSON.stringify(evidence.platformCoverage || []),
            JSON.stringify(evidence.facts || []), JSON.stringify(evidence.coverageGaps || []),
            evidence.interpretation || '', evidence.confidence || 'low', evidence.methodology || METHODOLOGY,
            evidence.crossPlatformScore, Boolean(evidence.youtubeIncludedInScore),
            evidence.youtubePolicyMode || 'not-used', evidence.generatedAt || snapshot.generatedAt]
        );
      }
      for (const instrument of INSTRUMENTS) {
        await client.query(
          `insert into market2_market_eligibility (person_id, instrument, status)
           values ($1, $2, 'discovery-only')
           on conflict (person_id, instrument) do nothing`,
          [person.id, instrument]
        );
      }
    }
    await client.query('commit');
    return suppressionPolicy;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const now = new Date();
  const tokens = {
    x: process.env.X_BEARER_TOKEN || '',
    youtube: process.env.YOUTUBE_API_KEY || '',
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    instagramUserId: process.env.INSTAGRAM_IG_USER_ID || '',
    github: process.env.GITHUB_TOKEN || ''
  };
  const previous = await readExistingSnapshot(OUTPUT_PATH);
  const snapshot = await buildMarket2Snapshot({
    now,
    tokens,
    xWoeid: process.env.X_WOEID || 1,
    xCommercialUseApproved: process.env.X_COMMERCIAL_USE_APPROVED === 'true',
    youtubeRegion: process.env.YOUTUBE_REGION_CODE || 'US',
    instagramHandles: instagramHandles(process.env.INSTAGRAM_DISCOVERY_HANDLES),
    instagramApiVersion: process.env.META_GRAPH_VERSION || 'v25.0',
    instagramAppReviewApproved: process.env.INSTAGRAM_APP_REVIEW_APPROVED === 'true',
    githubPublicOnlyAccessApproved: process.env.GITHUB_PUBLIC_ONLY_TOKEN_APPROVED === 'true',
    youtubeDerivedApproved: process.env.YOUTUBE_DERIVED_METRICS_APPROVED === 'true'
  });
  let merged = mergeWithLastGood(snapshot, previous);
  if (process.env.DATABASE_URL) {
    const suppressionPolicy = await persistSnapshot(snapshot, process.env.DATABASE_URL);
    merged = applyPublicationSuppressions(merged, suppressionPolicy);
  }
  await atomicWriteJson(OUTPUT_PATH, merged);
  process.stdout.write(`Market 2 snapshot updated with ${merged.people.length} people; ${snapshot.status}.\n`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().catch(error => {
    const code = cleanText(error && error.code || 'sync_failed', 80);
    process.stderr.write(`Market 2 sync failed (${code}). Last-good JSON was preserved.\n`);
    process.exitCode = 1;
  });
}

export {
  INSTRUMENTS,
  METHODOLOGY,
  OUTPUT_PATH,
  PLATFORMS,
  SCHEMA_VERSION,
  YOUTUBE_MAX_RETENTION_MS,
  applyPublicationSuppressions,
  assertPolicySafeSnapshot,
  atomicWriteJson,
  basePerson,
  buildMarket2Snapshot,
  cleanText,
  contentItem,
  discoveryEligibility,
  instagramHandles,
  isRetentionSafePerson,
  mergeWithLastGood,
  metric,
  persistSnapshot,
  providerResult,
  publicGitHubUrl,
  readExistingSnapshot,
  requestJson,
  runProvider,
  slugify,
  syncGitHub,
  syncInstagram,
  syncX,
  syncYouTube,
  xSearchQuery
};
