#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { exhaustCursorPages, exhaustPages } from './discovery-pagination.mjs';
import { discoverYouTubeWithInstalledRouter } from './reach-youtube-discovery.mjs';
import {
  fetchBilibiliOwnerAvatar,
  fetchBilibiliHotPageWithInstalledRouter,
  fetchBilibiliRankWithInstalledRouter,
  fetchBilibiliUsersWithInstalledRouter,
  verifyBilibiliInstalledRouter
} from './reach-bilibili-discovery.mjs';
import {
  fetchTwitchAvatarUrl,
  fetchTwitchVodsWithInstalledRouter,
  verifyTwitchInstalledRouter
} from './reach-twitch-discovery.mjs';
import { discoverInstagramWithInstalledRouter } from './reach-instagram-discovery.mjs';

const require = createRequire(import.meta.url);
const {
  createContentRecord,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle
} = require('../api/_lib/discovery-model.js');
const { buildWorkClusters } = require('../api/_lib/discovery-work-clusters.js');
const { REVIEWED_PUBLIC_FEEDS } = require('../lib/discovery/providers/public-feeds.js');
const { VERIFIED_PUBLIC_TWITCH_CHANNELS } = require('../lib/discovery/providers/public-twitch-channels.js');
const {
  REVIEWED_PUBLIC_SNAPSHOT,
  REVIEWED_SNAPSHOT_PROVIDERS,
  importReviewedPublicSnapshot
} = require('../lib/discovery/providers/reviewed-public-snapshot.js');

const execFileAsync = promisify(execFile);
const outputPath = process.env.BACKER_DISCOVERY_CATALOG_OUTPUT
  ? pathToFileURL(resolve(process.env.BACKER_DISCOVERY_CATALOG_OUTPUT))
  : new URL('../data/discovery-catalog.json', import.meta.url);
const generatedAt = new Date().toISOString();
const USER_AGENT = 'BackerDiscovery/1.0 (+https://bokubokulee-gif.github.io/backer-site/)';
const PUBLIC_BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36';
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const GITHUB_ANONYMOUS_RESULT_PAGES = 10;
const DEV_PAGE_SIZE = 100;
const YOUTUBE_PAGE_SIZE = 50;
const YOUTUBE_DATA_MAX_AGE_MS = 30 * 86_400_000;
const BILIBILI_HOT_PAGE_SIZE = 20;
const BILIBILI_PUBLIC_RESULT_PAGES = 2;
const TWITCH_VODS_PER_CHANNEL = 3;
const PUBLIC_PROVIDERS = new Set([
  'github', 'dev', 'medium', 'substack', 'rss', 'youtube', 'bilibili', 'twitch',
  'instagram',
  ...REVIEWED_SNAPSHOT_PROVIDERS
]);
const FRESHNESS_SENSITIVE_PROVIDERS = new Set(['github', 'dev', 'youtube', 'bilibili', 'twitch', 'rss']);
const PRIVATE_ACQUISITION_MARKER = /agent[\s_-]*reach|panniantong|opencli|twitter-cli/i;

const DEV_DISCOVERY_QUERIES = [
  'creator',
  'content creator',
  'youtube creator',
  'twitch creator',
  'open source maintainer',
  'newsletter author'
];

const YOUTUBE_QUERIES = [
  '2026 technology creators',
  '2026 science education creators',
  '2026 design art creators',
  '2026 independent music artists',
  '2026 gaming creators',
  '2026 film video creators',
  '2026 business creator economy',
  '2026 food travel creators',
  '2026 fitness wellness creators',
  '2026 fashion beauty creators'
];

const BILIBILI_USER_QUERIES = [
  '科技',
  '知识科普',
  '人工智能',
  '编程',
  '设计',
  '艺术',
  '音乐',
  '游戏',
  '商业财经',
  '教育'
];
const BILIBILI_RANK_DAYS = [3, 7];
const INSTAGRAM_QUERIES = ['creator economy', 'technology creator', 'design creator', 'independent artist'];

const MEDIUM_FEEDS = [
  'https://medium.com/feed/tag/artificial-intelligence',
  'https://medium.com/feed/tag/technology',
  'https://medium.com/feed/tag/design',
  'https://medium.com/feed/tag/startup',
  'https://medium.com/feed/tag/programming'
];

const SUBSTACK_FEEDS = [
  'https://www.lennysnewsletter.com/feed',
  'https://www.platformer.news/feed',
  'https://www.bigtechnology.com/feed',
  'https://www.oneusefulthing.org/feed',
  'https://importai.substack.com/feed',
  'https://www.notboring.co/feed',
  'https://www.slowboring.com/feed'
];

const RSS_FEEDS = REVIEWED_PUBLIC_FEEDS.filter((feed) => feed.provider === 'rss' && feed.verified === true);

let bundle = {
  creators: [],
  platformIdentities: [],
  contentRecords: [],
  metricObservations: []
};
let providerRuns = [];
let acquisitionCheckpoints = {};
let existingCatalog = null;
let existingMetricsBySignature = new Map();

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
}

function positiveSafeInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function removePrivateAcquisitionReferences(source) {
  const badCreatorIds = new Set((source.creators || [])
    .filter((row) => PRIVATE_ACQUISITION_MARKER.test(JSON.stringify(row)))
    .map((row) => row.id));
  const badIdentityIds = new Set((source.platformIdentities || [])
    .filter((row) => badCreatorIds.has(row.creatorId) || PRIVATE_ACQUISITION_MARKER.test(JSON.stringify(row)))
    .map((row) => row.id));
  const creatorsWithIdentity = new Set((source.platformIdentities || [])
    .filter((row) => !badIdentityIds.has(row.id) && !badCreatorIds.has(row.creatorId))
    .map((row) => row.creatorId));
  (source.creators || []).forEach((row) => {
    if (!creatorsWithIdentity.has(row.id)) badCreatorIds.add(row.id);
  });
  const badContentIds = new Set((source.contentRecords || [])
    .filter((row) => badCreatorIds.has(row.creatorId) || badIdentityIds.has(row.platformIdentityId)
      || PRIVATE_ACQUISITION_MARKER.test(JSON.stringify(row)))
    .map((row) => row.id));
  return {
    creators: (source.creators || []).filter((row) => !badCreatorIds.has(row.id)),
    platformIdentities: (source.platformIdentities || []).filter((row) => !badCreatorIds.has(row.creatorId)
      && !badIdentityIds.has(row.id)),
    contentRecords: (source.contentRecords || []).filter((row) => !badCreatorIds.has(row.creatorId)
      && !badIdentityIds.has(row.platformIdentityId) && !badContentIds.has(row.id)),
    metricObservations: (source.metricObservations || []).filter((row) => !PRIVATE_ACQUISITION_MARKER.test(JSON.stringify(row))
      && (row.entityType !== 'creator' || !badCreatorIds.has(row.entityId))
      && (row.entityType !== 'identity' || !badIdentityIds.has(row.entityId))
      && (row.entityType !== 'content' || !badContentIds.has(row.entityId)))
  };
}

function selectedProviders() {
  const argument = process.argv.find((value) => value.startsWith('--providers='));
  const configured = argument ? argument.slice('--providers='.length) : process.env.BACKER_DISCOVERY_PROVIDERS;
  const values = String(configured || Array.from(PUBLIC_PROVIDERS).join(','))
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => PUBLIC_PROVIDERS.has(value));
  return Array.from(new Set(values));
}

function metricSignature(metric) {
  if (!metric) return '';
  return JSON.stringify([
    metric.provider, metric.entityType, metric.entityId, metric.metric, metric.value,
    metric.unit || 'count', metric.window || '', metric.availability || 'available',
    metric.visibility || 'public', metric.access || 'public_source', metric.sourceUrl || ''
  ]);
}

function replaceProviderRun(run) {
  if (!run) return;
  providerRuns = providerRuns.filter((current) => current && current.provider !== run.provider);
  providerRuns.push(run);
}

function priorProviderRun(provider) {
  return providerRuns.find((run) => run && run.provider === provider) || null;
}

async function loadExisting() {
  try {
    const parsed = JSON.parse(await readFile(outputPath, 'utf8'));
    if (!parsed || parsed.schemaVersion !== 1) return;
    existingCatalog = parsed;
    const migratedMetrics = (Array.isArray(parsed.metricObservations) ? parsed.metricObservations : [])
      .map((row) => {
        if (!row) return row;
        if (row.provider === 'bilibili' && row.methodologyVersion === 'bilibili-public-hot-v1') {
          return createMetricObservation({
            ...row,
            methodologyVersion: row.entityType === 'identity'
              ? 'bilibili-public-user-search-v1'
              : 'bilibili-public-hot-rank-v1'
          });
        }
        if (!['github', 'dev'].includes(row.provider)) return row;
        const evidence = directMetricEvidence(row.provider, row.observedAt || generatedAt);
        return createMetricObservation({
          ...row,
          access: 'public_api',
          methodologyVersion: evidence.methodologyVersion,
          freshness: { ...(row.freshness || {}), state: 'snapshot' },
          confidence: { level: 'high', basis: evidence.basis }
        });
      })
      .filter(Boolean);
    bundle = {
      creators: Array.isArray(parsed.creators) ? parsed.creators.slice() : [],
      platformIdentities: Array.isArray(parsed.platformIdentities) ? parsed.platformIdentities.slice() : [],
      contentRecords: Array.isArray(parsed.contentRecords) ? parsed.contentRecords.slice() : [],
      metricObservations: migratedMetrics
    };
    providerRuns = Array.isArray(parsed.providerRuns) ? parsed.providerRuns.slice() : [];
    acquisitionCheckpoints = parsed.acquisitionCheckpoints && typeof parsed.acquisitionCheckpoints === 'object'
      ? structuredClone(parsed.acquisitionCheckpoints) : {};
    existingMetricsBySignature = new Map(bundle.metricObservations
      .map((metric) => [metricSignature(metric), metric])
      .filter(([key]) => key));
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_match, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function stripMarkup(value, maximum = 700) {
  return decodeXml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum);
}

function tag(block, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(block || '').match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function attribute(block, tagName, attributeName) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedAttribute = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(block || '').match(new RegExp(`<${escapedTag}\\b[^>]*\\b${escapedAttribute}=["']([^"']+)["'][^>]*>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function firstHtmlImage(value) {
  const html = decodeXml(value);
  const match = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
  return match ? decodeXml(match[1]).trim() : '';
}

function metaImage(value) {
  const html = String(value || '');
  const match = html.match(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]*>/i);
  return match ? decodeXml(match[1]).trim() : '';
}

function youtubeEmbedThumbnail(value) {
  const match = decodeXml(value).match(/(?:youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,20})/i);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
}

function channelImage(channel) {
  const imageBlock = tag(channel, 'image');
  return tag(imageBlock, 'url') || attribute(channel, 'itunes:image', 'href');
}

function itemThumbnail(item, fallback = '') {
  const content = tag(item, 'content:encoded') || tag(item, 'description');
  const enclosure = attribute(item, 'enclosure', 'url');
  const enclosureType = attribute(item, 'enclosure', 'type');
  return attribute(item, 'media:thumbnail', 'url')
    || attribute(item, 'media:content', 'url')
    || (/^image\//i.test(enclosureType) ? enclosure : '')
    || firstHtmlImage(content)
    || youtubeEmbedThumbnail(content)
    || fallback;
}

async function resolveItemThumbnail(item, link, fallback = '') {
  const embedded = itemThumbnail(item);
  if (embedded) return embedded;
  try {
    const html = await fetchText(link, 'text/html,application/xhtml+xml', PUBLIC_BROWSER_USER_AGENT);
    return metaImage(html) || fallback;
  } catch (_error) {
    return fallback;
  }
}

async function mapPool(rows, concurrency, task) {
  const output = new Array(rows.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await task(rows[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

function rssItems(xml) {
  return Array.from(String(xml || '').matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi), (match) => match[1]);
}

function runCounts(provider) {
  const identities = bundle.platformIdentities.filter((row) => row.provider === provider);
  const creatorIds = new Set(identities.map((row) => row.creatorId));
  return {
    creators: creatorIds.size,
    contentRecords: bundle.contentRecords.filter((row) => row.provider === provider).length,
    metricObservations: bundle.metricObservations.filter((row) => row.provider === provider).length
  };
}

function addOwner(input) {
  const creator = createCreator({
    ...input,
    avatarSourceUrl: input.avatarUrl ? (input.avatarSourceUrl || input.profileUrl) : null
  });
  if (!creator) return null;
  const identity = createPlatformIdentity({
    creatorId: creator.id,
    provider: input.provider,
    nativeId: input.nativeId,
    handle: input.handle,
    profileUrl: input.profileUrl,
    verified: input.verified,
    observedAt: input.observedAt
  });
  if (!identity) return null;
  if (input.accountType === 'user' || input.accountType === 'organization') {
    identity.accountType = input.accountType;
  }
  creator.primaryIdentityId = identity.id;
  bundle.creators.push(creator);
  bundle.platformIdentities.push(identity);
  return { creator, identity };
}

function addContent(owner, input) {
  if (!owner) return null;
  const record = createContentRecord({
    ...input,
    thumbnailRole: input.thumbnailUrl ? (input.thumbnailRole || 'content') : null,
    thumbnailSourceUrl: input.thumbnailUrl ? (input.thumbnailSourceUrl || input.canonicalUrl) : null,
    creatorId: owner.creator.id,
    platformIdentityId: owner.identity.id
  });
  if (record) bundle.contentRecords.push(record);
  return record;
}

const REVIEWED_MEDIA_HOSTS = Object.freeze({
  x: ['pbs.twimg.com'],
  tiktok: ['tiktokcdn.com', 'tiktokcdn-us.com'],
  spotify: ['i.scdn.co', 'spotifycdn.com'],
  soundcloud: ['sndcdn.com'],
  patreon: ['patreon.com', 'patreonusercontent.com'],
  kick: ['files.kick.com'],
  linkedin: ['media.licdn.com']
});

function safeReviewedMediaUrl(provider, value) {
  let parsed;
  try {
    parsed = new URL(decodeXml(String(value || '').trim()).replace(/\\u002[fF]/g, '/'));
  } catch (_error) {
    return '';
  }
  const allowed = REVIEWED_MEDIA_HOSTS[provider] || [];
  return parsed.protocol === 'https:' && allowed.some((host) => parsed.hostname === host
    || parsed.hostname.endsWith(`.${host}`)) ? parsed.href : '';
}

function embeddedJsonString(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(html || '').match(new RegExp(`"${escaped}":"((?:\\\\.|[^"\\\\])*)"`));
  if (!match) return '';
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch (_error) {
    return '';
  }
}

async function reviewedOembed(provider, url) {
  const endpoint = provider === 'tiktok'
    ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    : provider === 'spotify'
      ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      : provider === 'soundcloud'
        ? `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
        : null;
  if (!endpoint) return '';
  const payload = JSON.parse(await fetchText(endpoint, 'application/json'));
  return safeReviewedMediaUrl(provider, payload && payload.thumbnail_url);
}

async function reviewedPageMedia(provider, url, kind) {
  if (provider === 'spotify') return reviewedOembed(provider, url);
  if (provider === 'soundcloud' && kind === 'content') {
    const embedded = await reviewedOembed(provider, url);
    if (embedded) return embedded;
  }
  if (provider === 'tiktok') {
    if (kind === 'content') return reviewedOembed(provider, url);
    const html = await fetchText(url, 'text/html,application/xhtml+xml', PUBLIC_BROWSER_USER_AGENT);
    return safeReviewedMediaUrl(provider, embeddedJsonString(html, 'avatarLarger')
      || embeddedJsonString(html, 'avatarMedium'));
  }
  const html = await fetchText(url, 'text/html,application/xhtml+xml', PUBLIC_BROWSER_USER_AGENT);
  return safeReviewedMediaUrl(provider, metaImage(html));
}

async function enrichPatreonMedia(imported) {
  const identityByCreator = new Map(imported.platformIdentities.map((row) => [row.creatorId, row]));
  const avatarByCreator = new Map();
  const thumbnailByContent = new Map();
  await mapPool(imported.contentRecords, 5, async (content) => {
    try {
      const payload = await fetchJsonWithRetry(`https://www.patreon.com/api/posts/${encodeURIComponent(content.nativeId)}?include=user`);
      const attributes = payload && payload.data && payload.data.attributes || {};
      const image = attributes.thumbnail && (attributes.thumbnail.default_large || attributes.thumbnail.original)
        || attributes.image && (attributes.image.large_url || attributes.image.url)
        || attributes.share_images && attributes.share_images.landscape && attributes.share_images.landscape.url;
      thumbnailByContent.set(content.id, safeReviewedMediaUrl('patreon', image));
      const included = Array.isArray(payload && payload.included) ? payload.included : [];
      const user = included.find((row) => row && row.type === 'user' && row.attributes);
      const creatorId = content.creatorId;
      const identity = identityByCreator.get(creatorId);
      const avatar = safeReviewedMediaUrl('patreon', user && user.attributes
        && (user.attributes.image_url || user.attributes.thumb_url));
      if (identity && avatar) avatarByCreator.set(creatorId, avatar);
    } catch (_error) {
      // Retain the reviewed row without media when the public metadata endpoint
      // is temporarily unavailable; never substitute an invented asset.
    }
  });
  return {
    ...imported,
    creators: imported.creators.map((row) => avatarByCreator.get(row.id)
      ? { ...row, avatarUrl: avatarByCreator.get(row.id), avatarSourceUrl: identityByCreator.get(row.id).profileUrl }
      : row),
    contentRecords: imported.contentRecords.map((row) => thumbnailByContent.get(row.id)
      ? { ...row, thumbnailUrl: thumbnailByContent.get(row.id), thumbnailSourceUrl: row.canonicalUrl }
      : row)
  };
}

async function enrichReviewedPublicMedia(imported, provider) {
  if (provider === 'patreon') return enrichPatreonMedia(imported);
  const identityByCreator = new Map(imported.platformIdentities.map((row) => [row.creatorId, row]));
  const avatarPairs = await mapPool(imported.creators, 5, async (creator) => {
    const identity = identityByCreator.get(creator.id);
    if (!identity) return [creator.id, ''];
    try {
      return [creator.id, await reviewedPageMedia(provider, identity.profileUrl, 'creator')];
    } catch (_error) {
      return [creator.id, ''];
    }
  });
  const thumbnailPairs = await mapPool(imported.contentRecords, 5, async (content) => {
    try {
      return [content.id, await reviewedPageMedia(provider, content.canonicalUrl, 'content')];
    } catch (_error) {
      return [content.id, ''];
    }
  });
  const avatarByCreator = new Map(avatarPairs);
  const thumbnailByContent = new Map(thumbnailPairs);
  return {
    ...imported,
    creators: imported.creators.map((row) => avatarByCreator.get(row.id)
      ? { ...row, avatarUrl: avatarByCreator.get(row.id), avatarSourceUrl: identityByCreator.get(row.id).profileUrl }
      : row),
    contentRecords: imported.contentRecords.map((row) => thumbnailByContent.get(row.id)
      ? { ...row, thumbnailUrl: thumbnailByContent.get(row.id), thumbnailSourceUrl: row.canonicalUrl }
      : row)
  };
}

async function collectReviewedPublicProvider(provider) {
  // Import and validate before replacing anything. A malformed or unreadable
  // reviewed snapshot therefore leaves the previously published provider data
  // untouched and the guard below reports it as last-good.
  const imported = await enrichReviewedPublicMedia(
    importReviewedPublicSnapshot(REVIEWED_PUBLIC_SNAPSHOT, [provider]),
    provider
  );
  const previous = providerSnapshot(provider);
  const previousMetrics = bundle.metricObservations.filter((row) => row.provider === provider);
  clearProviderSnapshot(provider);
  bundle.metricObservations = bundle.metricObservations.filter((row) => row.provider !== provider);
  try {
    bundle.creators.push(...imported.creators);
    bundle.platformIdentities.push(...imported.platformIdentities);
    bundle.contentRecords.push(...imported.contentRecords);
    bundle.metricObservations.push(...imported.metricObservations);
    replaceProviderRun(imported.providerRuns[0]);
    acquisitionCheckpoints[provider] = imported.acquisitionCheckpoints[provider];
  } catch (error) {
    clearProviderSnapshot(provider);
    bundle.metricObservations = bundle.metricObservations.filter((row) => row.provider !== provider);
    restoreProviderSnapshot(previous);
    bundle.metricObservations.push(...previousMetrics);
    throw error;
  }
}

export function directMetricEvidence(provider, observedAt = generatedAt) {
  const evidence = {
    github: { methodologyVersion: 'github-rest-v3', basis: 'direct_official_api_field', access: 'public_api' },
    dev: { methodologyVersion: 'forem-api-v1', basis: 'direct_official_api_field', access: 'public_api' },
    youtube: {
      methodologyVersion: 'youtube-data-api-v3', basis: 'direct_official_api_field', access: 'public_api',
      expiresAt: new Date(Date.parse(observedAt) + YOUTUBE_DATA_MAX_AGE_MS).toISOString()
    },
    bilibili: {
      methodologyVersion: 'bilibili-public-discovery-v1', basis: 'direct_public_page_field', access: 'public_page'
    },
    twitch: {
      methodologyVersion: 'twitch-public-vod-playlist-v1', basis: 'direct_public_page_field', access: 'public_page'
    },
    rss: {
      methodologyVersion: 'reviewed-public-feed-v1', basis: 'server_reviewed_public_feed',
      access: 'public_source'
    }
  }[provider];
  return evidence ? structuredClone(evidence) : null;
}

function providerSnapshot(provider) {
  const identityIds = new Set(bundle.platformIdentities
    .filter((row) => row.provider === provider)
    .map((row) => row.id));
  const creatorIds = new Set(bundle.platformIdentities
    .filter((row) => row.provider === provider)
    .map((row) => row.creatorId));
  return {
    creators: bundle.creators.filter((row) => creatorIds.has(row.id)),
    platformIdentities: bundle.platformIdentities.filter((row) => row.provider === provider),
    contentRecords: bundle.contentRecords.filter((row) => row.provider === provider
      || identityIds.has(row.platformIdentityId))
  };
}

function clearProviderSnapshot(provider) {
  const snapshot = providerSnapshot(provider);
  const identityIds = new Set(snapshot.platformIdentities.map((row) => row.id));
  const creatorIds = new Set(snapshot.creators.map((row) => row.id));
  bundle.platformIdentities = bundle.platformIdentities.filter((row) => row.provider !== provider);
  bundle.contentRecords = bundle.contentRecords.filter((row) => row.provider !== provider
    && !identityIds.has(row.platformIdentityId));
  const retainedCreatorIds = new Set(bundle.platformIdentities.map((row) => row.creatorId));
  bundle.creators = bundle.creators.filter((row) => !creatorIds.has(row.id) || retainedCreatorIds.has(row.id));
  // Metrics remain until the final relational dedupe. That preserves the
  // bounded latest-plus-prior-distinct history for records still in the new
  // snapshot and automatically drops observations for records that disappear.
  return snapshot;
}

function restoreProviderSnapshot(snapshot) {
  if (!snapshot) return;
  bundle.creators.push(...snapshot.creators);
  bundle.platformIdentities.push(...snapshot.platformIdentities);
  bundle.contentRecords.push(...snapshot.contentRecords);
}

async function collectBilibili() {
  const before = runCounts('bilibili');
  const priorRun = priorProviderRun('bilibili');
  const pageSize = boundedInteger(
    process.env.BACKER_BILIBILI_RESULTS_PER_PAGE,
    BILIBILI_HOT_PAGE_SIZE,
    1,
    100
  );
  const pageLimit = boundedInteger(
    process.env.BACKER_BILIBILI_PUBLIC_PAGES,
    BILIBILI_PUBLIC_RESULT_PAGES,
    1,
    25
  );
  const scopeKey = JSON.stringify({ endpoint: 'bilibili-public-hot', pageSize, pageLimit });
  const checkpoint = acquisitionCheckpoints.bilibili;
  const resuming = checkpoint && checkpoint.state === 'in_progress'
    && checkpoint.scopeKey === scopeKey && checkpoint.restartSnapshot !== true;
  let phase = resuming ? String(checkpoint.phase || 'hot') : 'hot';
  let hotPage = resuming && phase === 'hot' ? positiveSafeInteger(checkpoint.nextPage, 1) : 1;
  let rankIndex = resuming && phase === 'rank'
    ? boundedInteger(checkpoint.rankIndex, 0, 0, BILIBILI_RANK_DAYS.length - 1) : 0;
  let queryIndex = resuming && phase === 'user_search'
    ? boundedInteger(checkpoint.queryIndex, 0, 0, BILIBILI_USER_QUERIES.length - 1) : 0;

  await verifyBilibiliInstalledRouter({
    agentReachBin: process.env.BACKER_AGENT_REACH_BIN,
    biliBin: process.env.BACKER_BILI_BIN,
    env: process.env
  });
  const priorSnapshot = resuming ? null : clearProviderSnapshot('bilibili');
  let pagesRead = 0;
  let result = { state: 'succeeded', hasMore: false, reasonCode: null };

  const consumeVideos = async (rows) => {
    for (const row of rows) {
        const owner = addOwner({
          provider: 'bilibili', nativeId: row.ownerId, displayName: row.ownerName,
          bio: '', avatarUrl: row.ownerAvatarUrl, avatarSourceUrl: row.ownerUrl,
          handle: row.ownerId, profileUrl: row.ownerUrl,
          verified: null, observedAt: generatedAt
        });
        const record = addContent(owner, {
          provider: 'bilibili', nativeId: row.videoId, contentType: 'video',
          title: row.title, excerpt: row.description, canonicalUrl: row.videoUrl,
          thumbnailUrl: row.thumbnailUrl, thumbnailSourceUrl: row.videoUrl,
          publishedAt: null, observedAt: generatedAt
        });
        if (!record) continue;
        for (const [metric, value] of Object.entries(row.metrics || {})) {
          addMetric({
            entityType: 'content', entityId: record.id, provider: 'bilibili', metric, value,
            observedAt: generatedAt, sourceUrl: row.videoUrl,
            methodologyVersion: 'bilibili-public-hot-rank-v1'
          });
        }
      }
    await sleep(350);
  };

  const consumeUsers = async (rows) => {
    for (const row of rows) {
      const owner = addOwner({
        provider: 'bilibili', nativeId: row.ownerId, displayName: row.ownerName,
        bio: row.bio, avatarUrl: row.avatarUrl, avatarSourceUrl: row.ownerUrl,
        handle: row.ownerId, profileUrl: row.ownerUrl,
        verified: null, observedAt: generatedAt
      });
      if (!owner) continue;
      for (const [metric, value] of Object.entries(row.metrics || {})) {
        addMetric({
          entityType: 'identity', entityId: owner.identity.id, provider: 'bilibili', metric, value,
          observedAt: generatedAt, sourceUrl: row.ownerUrl,
          methodologyVersion: 'bilibili-public-user-search-v1'
        });
      }
    }
    await sleep(350);
  };

  if (phase === 'hot') {
    result = await exhaustPages({
      startPage: hotPage,
      pageSize,
      providerPageLimit: pageLimit,
      hasLastGood: before.contentRecords > 0,
      itemKey: (row) => row && row.videoId,
      fetchPage: async (page) => {
        const response = await fetchBilibiliHotPageWithInstalledRouter({
          biliBin: process.env.BACKER_BILI_BIN, page, resultLimit: pageSize, env: process.env
        });
        return { items: response.rows };
      },
      consumePage: consumeVideos
    });
    pagesRead += result.pagesRead;
    if (result.hasMore) hotPage = result.nextPage;
    else phase = 'rank';
  }

  if (!result.hasMore && phase === 'rank') {
    for (; rankIndex < BILIBILI_RANK_DAYS.length; rankIndex += 1) {
      try {
        const response = await fetchBilibiliRankWithInstalledRouter({
          biliBin: process.env.BACKER_BILI_BIN,
          day: BILIBILI_RANK_DAYS[rankIndex],
          resultLimit: pageSize,
          env: process.env
        });
        await consumeVideos(response.rows);
        pagesRead += 1;
      } catch (error) {
        result = { state: pagesRead ? 'partial' : 'failed', hasMore: true, reasonCode: 'partial_page_failure', error };
        break;
      }
    }
    if (!result.hasMore) phase = 'user_search';
  }

  if (!result.hasMore && phase === 'user_search') {
    for (; queryIndex < BILIBILI_USER_QUERIES.length; queryIndex += 1) {
      try {
        const response = await fetchBilibiliUsersWithInstalledRouter({
          biliBin: process.env.BACKER_BILI_BIN,
          query: BILIBILI_USER_QUERIES[queryIndex],
          page: 1,
          resultLimit: pageSize,
          env: process.env
        });
        await consumeUsers(response.rows);
        pagesRead += 1;
      } catch (error) {
        result = { state: pagesRead ? 'partial' : 'failed', hasMore: true, reasonCode: 'partial_page_failure', error };
        break;
      }
    }
    if (!result.hasMore) phase = 'complete';
  }

  if (result.hasMore && pagesRead === 0 && priorSnapshot) restoreProviderSnapshot(priorSnapshot);
  acquisitionCheckpoints.bilibili = result.hasMore
    ? {
        state: 'in_progress', scopeKey, phase,
        nextPage: phase === 'hot' ? hotPage : null,
        rankIndex: phase === 'rank' ? rankIndex : null,
        queryIndex: phase === 'user_search' ? queryIndex : null,
        restartSnapshot: pagesRead === 0,
        updatedAt: generatedAt, reasonCode: result.reasonCode
      }
    : {
        state: 'exhausted', scopeKey, phase: 'complete', nextPage: null,
        rankIndex: null, queryIndex: null, restartSnapshot: false,
        updatedAt: generatedAt, reasonCode: 'scoped_public_discovery_snapshot'
      };
  const bilibiliIdentityByCreator = new Map(bundle.platformIdentities
    .filter((row) => row.provider === 'bilibili')
    .map((row) => [row.creatorId, row]));
  const missingBilibiliCreators = bundle.creators
    .filter((row) => bilibiliIdentityByCreator.has(row.id) && !row.avatarUrl);
  for (const creator of missingBilibiliCreators) {
    const identity = bilibiliIdentityByCreator.get(creator.id);
    const avatarUrl = await fetchBilibiliOwnerAvatar(identity.nativeId);
    if (avatarUrl) {
      bundle.creators = bundle.creators.map((row) => row.id === creator.id
        ? { ...row, avatarUrl, avatarSourceUrl: identity.profileUrl }
        : row);
    }
    await sleep(400);
  }
  const counts = runCounts('bilibili');
  const succeeded = result.state === 'succeeded' && !result.hasMore;
  const hasFreshPartial = !succeeded && pagesRead > 0;
  replaceProviderRun(createProviderRun({
    provider: 'bilibili',
    state: succeeded ? (counts.contentRecords ? 'succeeded' : 'empty')
      : (counts.contentRecords ? 'partial' : 'failed'),
    publishState: succeeded || hasFreshPartial ? 'fresh'
      : (before.contentRecords ? 'last_good' : 'unavailable'),
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: succeeded || hasFreshPartial ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded || hasFreshPartial ? generatedAt
      : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
    pagesRead, hasMore: result.hasMore,
    reasonCode: succeeded ? 'scoped_public_discovery_snapshot' : result.reasonCode,
    resultCounts: counts
  }));
}

async function collectTwitch() {
  const before = runCounts('twitch');
  const priorRun = priorProviderRun('twitch');
  const seeds = VERIFIED_PUBLIC_TWITCH_CHANNELS
    .filter((row) => row && row.verified === true && /^[a-z0-9_]{2,40}$/.test(String(row.handle || '').toLowerCase()))
    .map((row) => ({
      handle: String(row.handle).toLowerCase(),
      displayName: String(row.displayName || row.handle).trim() || String(row.handle),
      preferredVodId: /^v?\d+$/.test(String(row.preferredVodId || '')) ? String(row.preferredVodId) : null
    }));
  const resultLimit = boundedInteger(
    process.env.BACKER_TWITCH_VODS_PER_CHANNEL,
    TWITCH_VODS_PER_CHANNEL,
    1,
    12
  );
  const scopeKey = JSON.stringify({
    endpoint: 'twitch-public-vods', resultLimit,
    channels: seeds.map((row) => [row.handle, row.preferredVodId])
  });
  const checkpoint = acquisitionCheckpoints.twitch;
  const resuming = checkpoint && checkpoint.state === 'in_progress'
    && checkpoint.scopeKey === scopeKey && Array.isArray(checkpoint.retryIndices);
  if (!seeds.length) {
    replaceProviderRun(createProviderRun({
      provider: 'twitch', state: 'not_configured',
      publishState: before.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: priorRun && priorRun.observedAt,
      lastSuccessAt: priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
      pagesRead: 0, hasMore: false, reasonCode: 'provider_not_configured', resultCounts: before
    }));
    return;
  }

  await verifyTwitchInstalledRouter({
    agentReachBin: process.env.BACKER_AGENT_REACH_BIN,
    ytDlpBin: process.env.BACKER_YT_DLP_BIN,
    env: process.env
  });
  const avatarPairs = await mapPool(seeds, 6, async (seed) => [seed.handle, await fetchTwitchAvatarUrl(seed.handle)]);
  const avatarByHandle = new Map(avatarPairs);
  const priorSnapshot = resuming ? null : clearProviderSnapshot('twitch');
  const targetIndices = resuming
    ? checkpoint.retryIndices.filter((index) => Number.isInteger(index) && index >= 0 && index < seeds.length)
    : seeds.map((_row, index) => index);
  const failedIndices = [];
  let pagesRead = 0;
  for (const index of targetIndices) {
    const seed = seeds[index];
    try {
      const response = await fetchTwitchVodsWithInstalledRouter({
        ytDlpBin: process.env.BACKER_YT_DLP_BIN,
        handle: seed.handle,
        resultLimit,
        env: process.env
      });
      const owner = addOwner({
        provider: 'twitch', nativeId: seed.handle, displayName: seed.displayName,
        bio: '', avatarUrl: avatarByHandle.get(seed.handle), avatarSourceUrl: response.channelUrl,
        handle: seed.handle, profileUrl: response.channelUrl,
        verified: null, observedAt: generatedAt
      });
      const orderedRows = seed.preferredVodId
        ? response.rows.slice().sort((left, right) => Number(right.nativeId === seed.preferredVodId)
          - Number(left.nativeId === seed.preferredVodId))
        : response.rows;
      let retained = 0;
      for (const row of orderedRows) {
        const record = addContent(owner, {
          provider: 'twitch', nativeId: row.nativeId, contentType: 'video',
          title: row.title, excerpt: '', canonicalUrl: row.canonicalUrl,
          thumbnailUrl: row.thumbnailUrl, publishedAt: null, observedAt: generatedAt
        });
        if (!record) continue;
        retained += 1;
        addMetric({
          entityType: 'content', entityId: record.id, provider: 'twitch', metric: 'views',
          value: row.viewCount, observedAt: generatedAt, sourceUrl: row.canonicalUrl
        });
      }
      if (!owner || !retained) throw Object.assign(new Error('no retained public VODs'), { code: 'no_matches' });
      addMetric({
        entityType: 'identity', entityId: owner.identity.id, provider: 'twitch',
        metric: 'videos_observed', value: retained, observedAt: generatedAt,
        sourceUrl: response.channelUrl
      });
      pagesRead += 1;
      await sleep(350);
    } catch (_error) {
      failedIndices.push(index);
    }
  }

  if (priorSnapshot && failedIndices.length && pagesRead > 0) {
    const failedHandles = new Set(failedIndices.map((index) => seeds[index] && seeds[index].handle).filter(Boolean));
    const failedIdentities = priorSnapshot.platformIdentities
      .filter((row) => failedHandles.has(String(row.handle || row.nativeId).toLowerCase()));
    const failedIdentityIds = new Set(failedIdentities.map((row) => row.id));
    const failedCreatorIds = new Set(failedIdentities.map((row) => row.creatorId));
    const failedIdentityByCreator = new Map(failedIdentities.map((row) => [row.creatorId, row]));
    restoreProviderSnapshot({
      creators: priorSnapshot.creators.filter((row) => failedCreatorIds.has(row.id)).map((row) => {
        const identity = failedIdentityByCreator.get(row.id);
        const avatarUrl = identity && avatarByHandle.get(String(identity.handle || identity.nativeId).toLowerCase());
        return avatarUrl ? { ...row, avatarUrl, avatarSourceUrl: identity.profileUrl } : row;
      }),
      platformIdentities: failedIdentities,
      contentRecords: priorSnapshot.contentRecords.filter((row) => failedIdentityIds.has(row.platformIdentityId))
    });
  }

  if (pagesRead === 0 && priorSnapshot) restoreProviderSnapshot(priorSnapshot);

  acquisitionCheckpoints.twitch = failedIndices.length
    ? {
        state: 'in_progress', scopeKey, retryIndices: failedIndices,
        updatedAt: generatedAt, reasonCode: 'partial_page_failure'
      }
    : {
        state: 'exhausted', scopeKey, retryIndices: [],
        updatedAt: generatedAt, reasonCode: 'scoped_public_vod_snapshot'
      };
  const counts = runCounts('twitch');
  const succeeded = failedIndices.length === 0;
  replaceProviderRun(createProviderRun({
    provider: 'twitch',
    state: succeeded ? (counts.contentRecords ? 'succeeded' : 'empty')
      : (counts.contentRecords ? 'partial' : 'failed'),
    publishState: counts.contentRecords ? 'fresh'
      : (before.contentRecords ? 'last_good' : 'unavailable'),
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: counts.contentRecords ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: counts.contentRecords ? generatedAt
      : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
    pagesRead, hasMore: failedIndices.length > 0,
    reasonCode: succeeded ? 'scoped_public_vod_snapshot' : 'partial_page_failure',
    resultCounts: counts
  }));
}

async function collectInstagram() {
  const before = runCounts('instagram');
  const priorRun = priorProviderRun('instagram');
  let discovery;
  try {
    discovery = await discoverInstagramWithInstalledRouter({
      agentReachBin: process.env.BACKER_AGENT_REACH_BIN,
      opencliBin: process.env.BACKER_OPENCLI_BIN,
      queries: INSTAGRAM_QUERIES,
      env: process.env
    });
  } catch (error) {
    const permissionRequired = error && error.code === 'provider_permission_required';
    const reasonCode = permissionRequired ? 'browser_extension_not_connected'
      : error && error.code || 'provider_response_invalid';
    acquisitionCheckpoints.instagram = {
      state: 'blocked',
      scopeKey: 'instagram:browser-session:source-linked-media-v1',
      updatedAt: generatedAt,
      reasonCode
    };
    replaceProviderRun(createProviderRun({
      provider: 'instagram',
      state: permissionRequired ? 'permission_required' : 'failed',
      publishState: before.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: priorRun && priorRun.observedAt,
      lastSuccessAt: priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
      pagesRead: 0, hasMore: false, reasonCode, resultCounts: before
    }));
    return;
  }

  const profiles = discovery.profiles || [];
  const content = discovery.content || [];
  if (!profiles.length || !content.length) {
    acquisitionCheckpoints.instagram = {
      state: 'blocked', scopeKey: 'instagram:browser-session:source-linked-media-v1',
      updatedAt: generatedAt, reasonCode: 'provider_response_missing_media'
    };
    replaceProviderRun(createProviderRun({
      provider: 'instagram', state: 'failed',
      publishState: before.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: priorRun && priorRun.observedAt,
      lastSuccessAt: priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
      pagesRead: discovery.pagesRead || 0, hasMore: false,
      reasonCode: 'provider_response_missing_media', resultCounts: before
    }));
    return;
  }

  clearProviderSnapshot('instagram');
  const owners = new Map();
  profiles.forEach((row) => {
    const owner = addOwner({
      provider: 'instagram', ...row, avatarSourceUrl: row.profileUrl,
      observedAt: generatedAt
    });
    if (owner) owners.set(row.nativeId, owner);
  });
  content.forEach((row) => addContent(owners.get(row.ownerNativeId), {
    provider: 'instagram', ...row, contentType: 'post',
    thumbnailSourceUrl: row.canonicalUrl, observedAt: generatedAt
  }));
  const counts = runCounts('instagram');
  acquisitionCheckpoints.instagram = {
    state: 'exhausted', scopeKey: 'instagram:browser-session:source-linked-media-v1',
    updatedAt: generatedAt, reasonCode: 'scoped_browser_session_discovery'
  };
  replaceProviderRun(createProviderRun({
    provider: 'instagram', state: 'succeeded', publishState: 'fresh',
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: generatedAt, lastSuccessAt: generatedAt,
    pagesRead: discovery.pagesRead || 0, hasMore: false,
    reasonCode: 'scoped_browser_session_discovery', resultCounts: counts
  }));
}

export function enrichDirectMetric(input, observedAt = generatedAt) {
  const directEvidence = directMetricEvidence(input && input.provider, observedAt);
  return directEvidence ? {
    ...input,
    access: input.access || directEvidence.access,
    methodologyVersion: input.methodologyVersion || directEvidence.methodologyVersion,
    freshness: input.freshness || {
      state: 'fresh', sourceUpdatedAt: null, expiresAt: directEvidence.expiresAt || null
    },
    confidence: input.confidence || { level: 'high', basis: directEvidence.basis }
  } : input;
}

function addMetric(input) {
  const directEvidence = directMetricEvidence(input && input.provider);
  const enriched = enrichDirectMetric(input);
  const metric = createMetricObservation(enriched);
  if (!metric) return;
  // A fresh official response must advance its observation time even when the
  // native value is unchanged. Reusing an older object would silently violate
  // freshness and, for YouTube, the 30-day non-authorized-data limit.
  const prior = directEvidence ? null : existingMetricsBySignature.get(metricSignature(metric));
  bundle.metricObservations.push(prior || metric);
}

async function fetchText(url, accept = 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5', userAgent = USER_AGENT) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { Accept: accept, 'User-Agent': userAgent },
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) {
      const error = new Error(`source request failed with ${response.status}`);
      error.status = response.status;
      error.retryAfter = response.headers.get('retry-after');
      error.rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      error.rateLimitReset = response.headers.get('x-ratelimit-reset');
      throw error;
    }
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > 3 * 1024 * 1024) throw new Error('source response exceeded 3 MiB');
    return text;
  } catch (error) {
    if (error && Number.isInteger(error.status)) throw error;
    const python = [
      'import sys, urllib.request',
      'url, accept, agent = sys.argv[1:4]',
      "request = urllib.request.Request(url, headers={'Accept': accept, 'User-Agent': agent})",
      'with urllib.request.urlopen(request, timeout=20) as response: sys.stdout.buffer.write(response.read(3 * 1024 * 1024 + 1))'
    ].join('\n');
    const { stdout } = await execFileAsync(PYTHON_BIN, ['-c', python, url, accept, userAgent], {
      timeout: 25_000,
      encoding: 'buffer',
      maxBuffer: 3 * 1024 * 1024 + 1
    });
    if (stdout.length > 3 * 1024 * 1024) throw new Error('source response exceeded 3 MiB');
    return stdout.toString('utf8');
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJsonWithRetry(url, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return JSON.parse(await fetchText(url, 'application/json'));
    } catch (error) {
      lastError = error;
      const rateLimited = error && (error.status === 429
        || (error.status === 403 && String(error.rateLimitRemaining) === '0'));
      if (!rateLimited && Number.isInteger(error && error.status) && error.status < 500) break;
      const retrySeconds = Number.parseInt(error.retryAfter, 10);
      const resetMilliseconds = Number.parseInt(error.rateLimitReset, 10) * 1000 - Date.now();
      const delay = Number.isFinite(retrySeconds) ? retrySeconds * 1000
        : Number.isFinite(resetMilliseconds) && resetMilliseconds > 0 ? resetMilliseconds + 500
          : 1_000 * (attempt + 1);
      await sleep(Math.min(65_000, Math.max(250, delay)));
    }
  }
  throw lastError;
}

async function collectDev() {
  const devCreatorIds = new Set(bundle.platformIdentities
    .filter((row) => row.provider === 'dev')
    .map((row) => row.creatorId));
  bundle.creators = bundle.creators.map((row) => devCreatorIds.has(row.id) ? { ...row, bio: '' } : row);
  const before = runCounts('dev');
  const priorRun = priorProviderRun('dev');
  const scopeKey = JSON.stringify({ endpoint: 'articles/search', topDays: 30, queries: DEV_DISCOVERY_QUERIES });
  const priorCheckpoint = acquisitionCheckpoints.dev;
  const resuming = priorCheckpoint && priorCheckpoint.state === 'in_progress'
    && priorCheckpoint.scopeKey === scopeKey;
  let queryIndex = resuming ? boundedInteger(priorCheckpoint.queryIndex, 0, 0, DEV_DISCOVERY_QUERIES.length - 1) : 0;
  let startPage = resuming ? positiveSafeInteger(priorCheckpoint.nextPage, 1) : 1;
  let pagesRead = 0;
  let finalOutcome = { state: 'succeeded', hasMore: false, reasonCode: null, nextPage: null };
  let windowExhausted = false;

  const consume = async (articles) => {
    for (const article of articles) {
      const user = article && article.user || {};
      const username = String(user.username || '').trim();
      if (!username || !article.url || !article.title) continue;
      const owner = addOwner({
        provider: 'dev',
        nativeId: username,
        displayName: user.name || username,
        // Article copy belongs only to the ContentRecord. Forem's article
        // search response does not provide an author-profile biography.
        bio: '',
        avatarUrl: user.profile_image_90 || user.profile_image,
        handle: username,
        profileUrl: `https://dev.to/${encodeURIComponent(username)}`,
        verified: null,
        observedAt: generatedAt
      });
      const record = addContent(owner, {
        provider: 'dev',
        nativeId: String(article.id || ''),
        contentType: 'article',
        title: article.title,
        excerpt: article.description,
        canonicalUrl: article.url,
        thumbnailUrl: article.cover_image || article.social_image,
        publishedAt: article.published_at,
        observedAt: generatedAt
      });
      if (!record) continue;
      for (const [metric, value] of [
        ['reactions', article.public_reactions_count],
        ['comments', article.comments_count]
      ]) {
        addMetric({
          entityType: 'content', entityId: record.id, provider: 'dev', metric, value,
          observedAt: generatedAt, sourceUrl: article.url
        });
      }
    }
    await sleep(450);
  };

  for (; queryIndex < DEV_DISCOVERY_QUERIES.length; queryIndex += 1) {
    const query = DEV_DISCOVERY_QUERIES[queryIndex];
    const result = await exhaustPages({
      startPage,
      pageSize: DEV_PAGE_SIZE,
      hasLastGood: before.contentRecords > 0,
      itemKey: (article) => article && article.id,
      fetchPage: async (page) => {
        const url = new URL('https://dev.to/api/articles/search');
        url.searchParams.set('q', query);
        url.searchParams.set('top', '30');
        url.searchParams.set('per_page', String(DEV_PAGE_SIZE));
        url.searchParams.set('page', String(page));
        return { items: await fetchJsonWithRetry(url) };
      },
      consumePage: consume
    });
    pagesRead += result.pagesRead;
    if (result.reasonCode === 'api_result_window') windowExhausted = true;
    if (result.hasMore) {
      finalOutcome = result;
      acquisitionCheckpoints.dev = {
        state: 'in_progress', scopeKey, queryIndex, nextPage: result.nextPage,
        updatedAt: generatedAt, reasonCode: result.reasonCode
      };
      break;
    }
    startPage = 1;
  }

  if (!finalOutcome.hasMore) {
    finalOutcome = {
      state: 'succeeded', hasMore: false,
      reasonCode: windowExhausted ? 'api_result_window' : null,
      nextPage: null
    };
    acquisitionCheckpoints.dev = {
      state: 'exhausted', scopeKey, queryIndex: DEV_DISCOVERY_QUERIES.length,
      nextPage: null, updatedAt: generatedAt, reasonCode: finalOutcome.reasonCode
    };
  }
  const counts = runCounts('dev');
  const succeeded = finalOutcome.state === 'succeeded';
  replaceProviderRun(createProviderRun({
    provider: 'dev', state: counts.contentRecords ? finalOutcome.state : 'empty',
    publishState: succeeded ? 'fresh' : (priorRun && priorRun.publishState || 'last_good'),
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: succeeded ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
    pagesRead, hasMore: finalOutcome.hasMore,
    reasonCode: finalOutcome.reasonCode, resultCounts: counts
  }));
}

async function collectGitHub() {
  const perPage = 100;
  const before = runCounts('github');
  const priorRun = priorProviderRun('github');
  const checkpoint = acquisitionCheckpoints.github;
  const resuming = checkpoint && checkpoint.state === 'in_progress'
    && /^\d{4}-\d{2}-\d{2}$/.test(String(checkpoint.since || ''));
  const since = resuming
    ? checkpoint.since
    : new Date(Date.parse(generatedAt) - 30 * 86_400_000).toISOString().slice(0, 10);
  const startPage = resuming ? boundedInteger(checkpoint.nextPage, 1, 1, GITHUB_ANONYMOUS_RESULT_PAGES) : 1;
  // A complete GitHub search pass replaces the provider snapshot. Keeping the
  // old snapshot in the bundle would retain organization owners collected
  // before account.type was enforced. Restore only when no fresh page can be
  // retained, preserving the previous last-good snapshot on source failure.
  const priorSnapshot = clearProviderSnapshot('github');
  let result;
  try {
    result = await exhaustPages({
    startPage,
    pageSize: perPage,
    providerPageLimit: GITHUB_ANONYMOUS_RESULT_PAGES,
    hasLastGood: before.contentRecords > 0,
    itemKey: (repository) => repository && repository.id,
    fetchPage: async (page) => {
      const url = new URL('https://api.github.com/search/repositories');
      url.searchParams.set('q', `created:>=${since} archived:false`);
      url.searchParams.set('sort', 'stars');
      url.searchParams.set('order', 'desc');
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      const payload = await fetchJsonWithRetry(url);
      const repositories = Array.isArray(payload && payload.items) ? payload.items : [];
      const total = Number(payload && payload.total_count) || 0;
      const resultWindow = Math.min(1000, total);
      const terminal = repositories.length < perPage || page * perPage >= resultWindow;
      return {
        items: repositories,
        terminal,
        terminalReason: total > 1000 && page * perPage >= 1000 ? 'api_result_window' : null
      };
    },
    consumePage: async (repositories) => {
    for (const repository of repositories) {
      const account = repository && repository.owner || {};
      const login = String(account.login || '').trim();
      if (!login || !['User', 'Organization'].includes(account.type)
        || !account.html_url || !repository.html_url) continue;
      const owner = addOwner({
        provider: 'github', nativeId: String(account.id || login), displayName: login,
        bio: '', avatarUrl: account.avatar_url, handle: login, profileUrl: account.html_url,
        verified: null, observedAt: generatedAt,
        accountType: account.type === 'User' ? 'user' : 'organization'
      });
      const record = addContent(owner, {
        provider: 'github', nativeId: String(repository.id || repository.full_name || ''),
        contentType: 'repository', title: repository.full_name || repository.name,
        excerpt: repository.description || '', canonicalUrl: repository.html_url,
        thumbnailUrl: account.avatar_url, publishedAt: repository.created_at,
        observedAt: generatedAt
      });
      if (!record) continue;
      for (const [metric, value] of [
        ['stars', repository.stargazers_count],
        ['forks', repository.forks_count],
        ['open_issues', repository.open_issues_count]
      ]) {
        addMetric({
          entityType: 'content', entityId: record.id, provider: 'github', metric, value,
          observedAt: generatedAt, sourceUrl: repository.html_url
        });
      }
    }
      // GitHub search has a separate anonymous rate bucket. Sequential spacing
      // keeps the zero-credential collector inside its public allowance.
      await sleep(6_250);
    }
    });
  } catch (error) {
    restoreProviderSnapshot(priorSnapshot);
    throw error;
  }

  if (!runCounts('github').contentRecords) restoreProviderSnapshot(priorSnapshot);

  acquisitionCheckpoints.github = result.hasMore
    ? {
        state: 'in_progress', since, nextPage: result.nextPage,
        updatedAt: generatedAt, reasonCode: result.reasonCode
      }
    : {
        state: 'exhausted', since, nextPage: null,
        updatedAt: generatedAt, reasonCode: result.reasonCode
      };
  const counts = runCounts('github');
  const succeeded = result.state === 'succeeded';
  replaceProviderRun(createProviderRun({
    provider: 'github', state: counts.contentRecords ? result.state : 'empty',
    publishState: succeeded ? 'fresh' : (priorRun && priorRun.publishState || 'last_good'),
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: succeeded ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
    pagesRead: result.pagesRead, hasMore: result.hasMore, reasonCode: result.reasonCode, resultCounts: counts
  }));
}

function mediumIdentity(link) {
  try {
    const parsed = new URL(link);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith('.medium.com') && host !== 'medium.com' && host !== 'www.medium.com') {
      const handle = host.slice(0, -'.medium.com'.length);
      return { nativeId: handle, handle, profileUrl: `https://${host}/` };
    }
    const first = parsed.pathname.split('/').filter(Boolean)[0] || '';
    if ((host === 'medium.com' || host === 'www.medium.com') && first.startsWith('@')) {
      return { nativeId: first.slice(1), handle: first, profileUrl: `https://medium.com/${first}` };
    }
  } catch (_error) {
    return null;
  }
  return null;
}

async function collectMedium() {
  const before = runCounts('medium');
  const priorRun = priorProviderRun('medium');
  let pagesRead = 0;
  const settled = await Promise.allSettled(MEDIUM_FEEDS.map((url) => fetchText(url)));
  const entries = [];
  settled.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    pagesRead += 1;
    for (const item of rssItems(result.value)) {
      const link = tag(item, 'link') || tag(item, 'guid');
      const identity = mediumIdentity(link);
      const displayName = tag(item, 'dc:creator');
      if (!identity || !displayName) continue;
      entries.push({ item, link, identity, displayName });
    }
  });
  const identities = Array.from(new Map(entries.map((entry) => [entry.identity.nativeId, entry.identity])).values());
  const avatars = await mapPool(identities, 6, async (identity) => {
    try {
      const html = await fetchText(identity.profileUrl, 'text/html,application/xhtml+xml', PUBLIC_BROWSER_USER_AGENT);
      return [identity.nativeId, metaImage(html)];
    } catch (_error) {
      return [identity.nativeId, ''];
    }
  });
  const avatarByNativeId = new Map(avatars);
  const thumbnailPairs = await mapPool(entries, 6, async ({ item, link }) => [
    tag(item, 'guid') || link,
    await resolveItemThumbnail(item, link)
  ]);
  const thumbnailByNativeId = new Map(thumbnailPairs);
  entries.forEach(({ item, link, identity, displayName }) => {
      const owner = addOwner({
        provider: 'medium', nativeId: identity.nativeId, displayName,
        bio: '', avatarUrl: avatarByNativeId.get(identity.nativeId), avatarSourceUrl: identity.profileUrl,
        handle: identity.handle, profileUrl: identity.profileUrl,
        verified: null, observedAt: generatedAt
      });
      const content = tag(item, 'content:encoded') || tag(item, 'description');
      addContent(owner, {
        provider: 'medium', nativeId: tag(item, 'guid') || link, contentType: 'article',
        title: stripMarkup(tag(item, 'title'), 280),
        excerpt: stripMarkup(tag(item, 'description') || tag(item, 'content:encoded')),
        canonicalUrl: link, thumbnailUrl: thumbnailByNativeId.get(tag(item, 'guid') || link)
          || firstHtmlImage(content),
        thumbnailSourceUrl: link,
        publishedAt: tag(item, 'pubDate') || tag(item, 'dc:date'), observedAt: generatedAt
      });
  });
  const counts = runCounts('medium');
  const succeeded = pagesRead === MEDIUM_FEEDS.length;
  replaceProviderRun(createProviderRun({
    provider: 'medium', state: succeeded ? 'succeeded' : (counts.contentRecords ? 'partial' : 'failed'),
    publishState: succeeded ? 'fresh' : (before.contentRecords ? 'last_good' : 'unavailable'), startedAt: generatedAt,
    finishedAt: new Date().toISOString(), observedAt: succeeded ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt), pagesRead, hasMore: false,
    reasonCode: pagesRead === MEDIUM_FEEDS.length ? null : 'partial_page_failure', resultCounts: counts
  }));
}

async function collectSubstack() {
  const before = runCounts('substack');
  const priorRun = priorProviderRun('substack');
  let pagesRead = 0;
  const settled = await Promise.allSettled(SUBSTACK_FEEDS.map(async (url) => ({ url, xml: await fetchText(url) })));
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    pagesRead += 1;
    const { url, xml } = result.value;
    const channel = xml.split(/<item(?:\s|>)/i)[0];
    const home = tag(channel, 'link') || new URL(url).origin;
    const nativeId = new URL(home).hostname.toLowerCase().replace(/^www\./, '');
    const publicationImage = channelImage(channel);
    const owner = addOwner({
      provider: 'substack', nativeId,
      displayName: stripMarkup(tag(channel, 'title'), 160) || nativeId,
      bio: stripMarkup(tag(channel, 'description'), 600), avatarUrl: publicationImage,
      avatarSourceUrl: home,
      handle: nativeId, profileUrl: home, verified: null, observedAt: generatedAt
    });
    const items = rssItems(xml);
    const thumbnails = await mapPool(items, 6, async (item) => {
      const link = tag(item, 'link') || tag(item, 'guid');
      return [tag(item, 'guid') || link, await resolveItemThumbnail(item, link, publicationImage)];
    });
    const thumbnailByNativeId = new Map(thumbnails);
    for (const item of items) {
      const link = tag(item, 'link') || tag(item, 'guid');
      addContent(owner, {
        provider: 'substack', nativeId: tag(item, 'guid') || link, contentType: 'newsletter',
        title: stripMarkup(tag(item, 'title'), 280),
        excerpt: stripMarkup(tag(item, 'description') || tag(item, 'content:encoded')),
        canonicalUrl: link,
        thumbnailUrl: thumbnailByNativeId.get(tag(item, 'guid') || link), thumbnailSourceUrl: link,
        publishedAt: tag(item, 'pubDate') || tag(item, 'dc:date'), observedAt: generatedAt
      });
    }
  }
  const counts = runCounts('substack');
  const succeeded = pagesRead === SUBSTACK_FEEDS.length;
  replaceProviderRun(createProviderRun({
    provider: 'substack', state: succeeded ? 'succeeded' : (counts.contentRecords ? 'partial' : 'failed'),
    publishState: succeeded ? 'fresh' : (before.contentRecords ? 'last_good' : 'unavailable'), startedAt: generatedAt,
    finishedAt: new Date().toISOString(), observedAt: succeeded ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt), pagesRead, hasMore: false,
    reasonCode: pagesRead === SUBSTACK_FEEDS.length ? null : 'partial_page_failure', resultCounts: counts
  }));
}

async function collectRss() {
  const before = runCounts('rss');
  const priorRun = priorProviderRun('rss');
  let pagesRead = 0;
  const settled = await Promise.allSettled(RSS_FEEDS.map(async (feed) => ({ feed, xml: await fetchText(feed.url) })));
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    pagesRead += 1;
    const { feed, xml } = result.value;
    const channel = xml.split(/<item(?:\s|>)/i)[0];
    const publicationImage = channelImage(channel);
    const owner = addOwner({
      provider: 'rss', nativeId: feed.id,
      displayName: stripMarkup(tag(channel, 'title'), 160) || feed.title,
      bio: stripMarkup(tag(channel, 'description'), 600), avatarUrl: publicationImage,
      avatarSourceUrl: feed.profileUrl,
      handle: new URL(feed.profileUrl).hostname, profileUrl: feed.profileUrl,
      verified: true, observedAt: generatedAt
    });
    const items = rssItems(xml);
    const thumbnails = await mapPool(items, 6, async (item) => {
      const link = tag(item, 'link') || tag(item, 'guid');
      return [tag(item, 'guid') || link, await resolveItemThumbnail(item, link, publicationImage)];
    });
    const thumbnailByNativeId = new Map(thumbnails);
    for (const item of items) {
      const link = tag(item, 'link') || tag(item, 'guid');
      addContent(owner, {
        provider: 'rss', nativeId: tag(item, 'guid') || link, contentType: 'article',
        title: stripMarkup(tag(item, 'title'), 280),
        excerpt: stripMarkup(tag(item, 'description') || tag(item, 'content:encoded')),
        canonicalUrl: link,
        thumbnailUrl: thumbnailByNativeId.get(tag(item, 'guid') || link), thumbnailSourceUrl: link,
        publishedAt: tag(item, 'pubDate') || tag(item, 'dc:date'), observedAt: generatedAt
      });
    }
    if (owner) addMetric({
      entityType: 'identity', entityId: owner.identity.id, provider: 'rss',
      metric: 'feed_items_observed', value: items.length, unit: 'count', window: 'feed_snapshot',
      observedAt: generatedAt, sourceUrl: feed.url,
      methodologyVersion: 'reviewed-public-feed-v1', freshness: { state: 'fresh' },
      confidence: { level: 'high', basis: 'server_reviewed_public_feed' }
    });
  }
  const counts = runCounts('rss');
  const succeeded = pagesRead === RSS_FEEDS.length;
  replaceProviderRun(createProviderRun({
    provider: 'rss', state: succeeded ? 'succeeded' : (counts.contentRecords ? 'partial' : 'failed'),
    publishState: succeeded ? 'fresh' : (before.contentRecords ? 'last_good' : 'unavailable'), startedAt: generatedAt,
    finishedAt: new Date().toISOString(), observedAt: succeeded ? generatedAt : priorRun && priorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : priorRun && (priorRun.lastSuccessAt || priorRun.observedAt), pagesRead, hasMore: false,
    reasonCode: pagesRead === RSS_FEEDS.length ? null : 'partial_page_failure', resultCounts: counts
  }));
}

function youtubeApiKey() {
  return String(process.env.BACKER_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '').trim();
}

function reachYouTubeEnabled() {
  return String(process.env.BACKER_ENABLE_AGENT_REACH_YOUTUBE || '').trim() === '1';
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

function pruneExpiredYouTubeData() {
  const cutoff = Date.parse(generatedAt) - YOUTUBE_DATA_MAX_AGE_MS;
  const expired = (row) => {
    const timestamp = Date.parse(row && (row.observedAt || row.freshness && row.freshness.capturedAt) || '');
    const explicitExpiry = Date.parse(row && row.freshness && row.freshness.expiresAt || '');
    return !Number.isFinite(timestamp) || timestamp < cutoff
      || (Number.isFinite(explicitExpiry) && explicitExpiry <= Date.parse(generatedAt));
  };
  const staleIdentityIds = new Set(bundle.platformIdentities
    .filter((row) => row.provider === 'youtube' && expired(row))
    .map((row) => row.id));
  const staleContentIds = new Set(bundle.contentRecords
    .filter((row) => row.provider === 'youtube' && (expired(row) || staleIdentityIds.has(row.platformIdentityId)))
    .map((row) => row.id));
  bundle.platformIdentities = bundle.platformIdentities
    .filter((row) => !staleIdentityIds.has(row.id));
  bundle.contentRecords = bundle.contentRecords
    .filter((row) => !staleContentIds.has(row.id));
  bundle.metricObservations = bundle.metricObservations.filter((row) => !(row.provider === 'youtube'
    && (expired(row)
      || (row.entityType === 'identity' && staleIdentityIds.has(row.entityId))
      || (row.entityType === 'content' && staleContentIds.has(row.entityId)))));
  const referencedCreatorIds = new Set(bundle.platformIdentities.map((row) => row.creatorId));
  bundle.creators = bundle.creators.filter((row) => referencedCreatorIds.has(row.id));
  return { staleIdentityIds, staleContentIds };
}

function clearYouTubeSnapshot() {
  const identityIds = new Set(bundle.platformIdentities
    .filter((row) => row.provider === 'youtube')
    .map((row) => row.id));
  const contentIds = new Set(bundle.contentRecords
    .filter((row) => row.provider === 'youtube')
    .map((row) => row.id));
  bundle.platformIdentities = bundle.platformIdentities.filter((row) => row.provider !== 'youtube');
  bundle.contentRecords = bundle.contentRecords.filter((row) => row.provider !== 'youtube');
  bundle.metricObservations = bundle.metricObservations.filter((row) => row.provider !== 'youtube'
    && !(row.entityType === 'identity' && identityIds.has(row.entityId))
    && !(row.entityType === 'content' && contentIds.has(row.entityId)));
  const referencedCreatorIds = new Set(bundle.platformIdentities.map((row) => row.creatorId));
  bundle.creators = bundle.creators.filter((row) => referencedCreatorIds.has(row.id));
}

function officialYouTubeCheckpoint(checkpoint) {
  return Boolean(checkpoint && typeof checkpoint.scopeKey === 'string'
    && checkpoint.scopeKey.includes('"endpoint":"youtube/v3/search"'));
}

function youtubeApiReason(status, payload) {
  const reasons = ((payload && payload.error && payload.error.errors) || [])
    .map((item) => String(item && item.reason || '').toLowerCase());
  if (status === 429 || reasons.some((reason) => [
    'quotaexceeded', 'dailylimitexceeded', 'ratelimitexceeded', 'userratelimitexceeded'
  ].includes(reason))) return 'provider_rate_limited';
  if (status === 401 || status === 403) return 'provider_permission_required';
  if (status === 400) return 'provider_response_invalid';
  return 'partial_page_failure';
}

async function fetchYouTubeJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(20_000)
      });
      const payload = await response.json();
      if (response.ok) return payload;
      const error = new Error(`YouTube source request failed with ${response.status}`);
      error.status = response.status;
      error.code = youtubeApiReason(response.status, payload);
      throw error;
    } catch (error) {
      lastError = error;
      if (!error.code && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        error.code = 'provider_timeout';
      }
      const retryable = Number(error.status) >= 500 || error.code === 'provider_timeout';
      if (!retryable || attempt === attempts - 1) break;
      await sleep(1_000 * (attempt + 1));
    }
  }
  throw lastError;
}

function youtubeThumbnail(thumbnails) {
  const ordered = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const key of ordered) {
    if (thumbnails && thumbnails[key] && thumbnails[key].url) return thumbnails[key].url;
  }
  return null;
}

async function fetchYouTubeVideos(ids, key) {
  if (!ids.length) return [];
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,statistics,status');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', key);
  const response = await fetchYouTubeJson(videosUrl);
  return Array.isArray(response.items) ? response.items : [];
}

async function fetchYouTubeChannels(ids, key) {
  if (!ids.length) return [];
  const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelsUrl.searchParams.set('part', 'snippet,statistics,brandingSettings,status');
  channelsUrl.searchParams.set('id', ids.join(','));
  channelsUrl.searchParams.set('key', key);
  const response = await fetchYouTubeJson(channelsUrl);
  return Array.isArray(response.items) ? response.items : [];
}

export function publicYouTubeVideos(items) {
  return (Array.isArray(items) ? items : [])
    .filter((video) => video && video.status && video.status.privacyStatus === 'public');
}

export async function revalidateYouTubeResources(options) {
  const videoIds = Array.from(new Set(options && options.videoIds || []));
  const retainedChannelIds = Array.from(new Set(options && options.channelIds || []));
  const fetchVideos = options && options.fetchVideos || fetchYouTubeVideos;
  const fetchChannels = options && options.fetchChannels || fetchYouTubeChannels;
  const key = options && options.key || '';
  const videos = [];
  let pagesRead = 0;
  for (const ids of chunks(videoIds, YOUTUBE_PAGE_SIZE)) {
    videos.push(...publicYouTubeVideos(await fetchVideos(ids, key)));
    pagesRead += 1;
  }
  const channelIds = Array.from(new Set(retainedChannelIds.concat(videos
    .map((video) => video && video.snippet && video.snippet.channelId)
    .filter(Boolean))));
  const channels = [];
  for (const ids of chunks(channelIds, YOUTUBE_PAGE_SIZE)) {
    channels.push(...await fetchChannels(ids, key));
    pagesRead += 1;
  }
  const returnedVideoIds = new Set(videos.map((video) => video.id));
  const returnedChannelIds = new Set(channels.map((channel) => channel.id));
  return {
    videos,
    channels,
    pagesRead,
    removedVideoIds: videoIds.filter((id) => !returnedVideoIds.has(id)),
    removedChannelIds: retainedChannelIds.filter((id) => !returnedChannelIds.has(id))
  };
}

async function hydrateYouTubeVideos(ids, key) {
  const videos = publicYouTubeVideos(await fetchYouTubeVideos(ids, key));
  const channelIds = Array.from(new Set(videos
    .map((video) => video && video.snippet && video.snippet.channelId)
    .filter(Boolean)));
  const channels = await fetchYouTubeChannels(channelIds, key);
  const channelsById = new Map(channels.map((channel) => [channel && channel.id, channel]));
  return videos.map((video) => ({
    video,
    channel: channelsById.get(video.snippet && video.snippet.channelId) || null
  }));
}

async function fetchYouTubePage(query, pageToken, key) {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('order', 'viewCount');
  searchUrl.searchParams.set('maxResults', String(YOUTUBE_PAGE_SIZE));
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('key', key);
  const region = String(process.env.BACKER_YOUTUBE_REGION || process.env.YOUTUBE_REGION_CODE || '').trim();
  if (region) searchUrl.searchParams.set('regionCode', region);
  if (pageToken) searchUrl.searchParams.set('pageToken', pageToken);
  const search = await fetchYouTubeJson(searchUrl);
  const ids = (Array.isArray(search.items) ? search.items : [])
    .map((item) => item && item.id && item.id.videoId)
    .filter(Boolean);
  if (!ids.length) {
    return { items: [], nextCursor: search.nextPageToken || null };
  }
  return {
    items: await hydrateYouTubeVideos(ids, key),
    nextCursor: search.nextPageToken || null
  };
}

function youtubeFailureState(reasonCode, counts) {
  if (counts.contentRecords) return 'partial';
  if (reasonCode === 'provider_rate_limited') return 'rate_limited';
  if (reasonCode === 'provider_permission_required') return 'permission_required';
  if (reasonCode === 'provider_timeout') return 'timed_out';
  return 'failed';
}

async function collectYouTubeViaInstalledRouter(priorRun) {
  const before = runCounts('youtube');
  const resultLimit = boundedInteger(process.env.BACKER_YOUTUBE_PUBLIC_RESULTS_PER_QUERY, 12, 1, 50);
  const minimumViews = boundedInteger(process.env.BACKER_YOUTUBE_PUBLIC_MIN_VIEWS, 2500, 0, 1_000_000_000);
  let discovery;
  try {
    discovery = await discoverYouTubeWithInstalledRouter({
      agentReachBin: process.env.BACKER_AGENT_REACH_BIN || 'agent-reach',
      ytDlpBin: process.env.BACKER_YT_DLP_BIN || 'yt-dlp',
      queries: YOUTUBE_QUERIES,
      resultLimit,
      env: process.env
    });
  } catch (error) {
    const counts = runCounts('youtube');
    const reasonCode = [
      'provider_not_configured', 'provider_response_invalid', 'provider_command_failed'
    ].includes(error && error.code) ? error.code : 'partial_page_failure';
    replaceProviderRun(createProviderRun({
      provider: 'youtube', state: counts.contentRecords ? 'partial' : 'failed',
      publishState: counts.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: priorRun && priorRun.observedAt,
      lastSuccessAt: priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
      pagesRead: 0, hasMore: false, reasonCode, resultCounts: counts
    }));
    return;
  }

  const eligibleRows = discovery.rows.filter((row) => row.verified === true
    || (row.viewCount != null && row.viewCount >= minimumViews));
  if (!eligibleRows.length) {
    const counts = runCounts('youtube');
    replaceProviderRun(createProviderRun({
      provider: 'youtube', state: counts.contentRecords ? 'partial' : 'empty',
      publishState: counts.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: priorRun && priorRun.observedAt,
      lastSuccessAt: priorRun && (priorRun.lastSuccessAt || priorRun.observedAt),
      pagesRead: discovery.pagesRead, hasMore: false,
      reasonCode: 'provider_returned_empty', resultCounts: counts
    }));
    return;
  }

  clearYouTubeSnapshot();
  const expiresAt = new Date(Date.parse(generatedAt) + YOUTUBE_DATA_MAX_AGE_MS).toISOString();
  eligibleRows.forEach((row) => {
    const owner = addOwner({
      provider: 'youtube', nativeId: row.channelId, displayName: row.channelName,
      bio: '', avatarUrl: row.channelAvatarUrl, avatarSourceUrl: row.channelUrl,
      handle: row.channelHandle, profileUrl: row.channelUrl,
      verified: row.verified, observedAt: generatedAt
    });
    if (owner && row.subscriberCount != null) {
      addMetric({
        entityType: 'identity', entityId: owner.identity.id, provider: 'youtube', metric: 'subscribers',
        value: row.subscriberCount, observedAt: generatedAt, sourceUrl: owner.identity.profileUrl,
        access: 'public_page', methodologyVersion: 'youtube-public-channel-page-v1',
        freshness: { state: 'fresh', capturedAt: generatedAt, expiresAt },
        confidence: { level: 'high', basis: 'direct_public_channel_field' }
      });
    }
    const record = addContent(owner, {
      provider: 'youtube', nativeId: row.videoId, contentType: 'video', title: row.title,
      excerpt: stripMarkup(row.description), canonicalUrl: row.videoUrl,
      thumbnailUrl: row.thumbnailUrl, publishedAt: null, observedAt: generatedAt
    });
    if (!record || row.viewCount == null) return;
    addMetric({
      entityType: 'content', entityId: record.id, provider: 'youtube', metric: 'views',
      value: row.viewCount, observedAt: generatedAt, sourceUrl: record.canonicalUrl,
      access: 'public_page', methodologyVersion: 'youtube-public-search-page-v1',
      freshness: { state: 'fresh', capturedAt: generatedAt, expiresAt },
      confidence: { level: 'high', basis: 'direct_public_page_field' }
    });
  });
  const counts = runCounts('youtube');
  const scopeKey = JSON.stringify({
    endpoint: 'youtube-public-search',
    resultLimit, minimumViews, queries: YOUTUBE_QUERIES
  });
  acquisitionCheckpoints.youtube = {
    state: 'exhausted', scopeKey, queryIndex: YOUTUBE_QUERIES.length,
    updatedAt: generatedAt, reasonCode: 'scoped_public_search_snapshot'
  };
  replaceProviderRun(createProviderRun({
    provider: 'youtube', state: 'succeeded', publishState: 'fresh',
    startedAt: generatedAt, finishedAt: new Date().toISOString(),
    observedAt: generatedAt, lastSuccessAt: generatedAt,
    pagesRead: discovery.pagesRead, hasMore: false,
    reasonCode: 'scoped_public_search_snapshot', resultCounts: counts
  }));
}

async function collectYouTube() {
  const priorRun = priorProviderRun('youtube');
  pruneExpiredYouTubeData();
  const key = youtubeApiKey();
  if (!key && reachYouTubeEnabled()) {
    await collectYouTubeViaInstalledRouter(priorRun);
    return;
  }
  // Rows acquired before this official collector have no verifiable Data API
  // checkpoint and must not be silently relabeled or retained as API output.
  const hasOfficialPrior = officialYouTubeCheckpoint(acquisitionCheckpoints.youtube);
  if (!hasOfficialPrior) clearYouTubeSnapshot();
  const trustedPriorRun = hasOfficialPrior ? priorRun : null;
  const before = runCounts('youtube');
  if (!key) {
    replaceProviderRun(createProviderRun({
      provider: 'youtube', state: 'not_configured',
      publishState: before.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt, finishedAt: new Date().toISOString(),
      observedAt: trustedPriorRun && trustedPriorRun.observedAt,
      lastSuccessAt: trustedPriorRun && (trustedPriorRun.lastSuccessAt || trustedPriorRun.observedAt),
      pagesRead: 0, hasMore: false, reasonCode: 'credentials_missing', resultCounts: before
    }));
    return;
  }

  const region = String(process.env.BACKER_YOUTUBE_REGION || process.env.YOUTUBE_REGION_CODE || '').trim();
  const scopeKey = JSON.stringify({
    endpoint: 'youtube/v3/search', type: 'video', order: 'viewCount',
    maxResults: YOUTUBE_PAGE_SIZE, region: region || null, queries: YOUTUBE_QUERIES
  });
  const checkpoint = acquisitionCheckpoints.youtube;
  const resuming = checkpoint && checkpoint.state === 'in_progress' && checkpoint.scopeKey === scopeKey;
  let queryIndex = resuming
    ? boundedInteger(checkpoint.queryIndex, 0, 0, YOUTUBE_QUERIES.length - 1)
    : 0;
  let pageToken = resuming && checkpoint.pageToken ? String(checkpoint.pageToken) : null;
  let pagesRead = 0;
  let finalOutcome = { state: 'succeeded', hasMore: false, reasonCode: null, nextCursor: null };

  const ingestChannel = (channel, fallbackSnippet) => {
    const channelSnippet = channel && channel.snippet || {};
    const fallback = fallbackSnippet || {};
    const channelStatistics = channel && channel.statistics || {};
    const channelId = channel && channel.id || fallback.channelId;
    const displayName = channelSnippet.title || fallback.channelTitle;
    if (!channelId || !displayName) return null;
    const customUrl = String(channelSnippet.customUrl || '').trim();
    const profileUrl = customUrl.startsWith('@')
      ? `https://www.youtube.com/${customUrl}`
      : `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;
    const owner = addOwner({
      provider: 'youtube', nativeId: channelId, displayName,
      bio: channelSnippet.description || '',
      avatarUrl: youtubeThumbnail(channelSnippet.thumbnails),
      handle: customUrl || channelId, profileUrl, verified: null, observedAt: generatedAt
    });
    if (!owner) return null;
    if (!channelStatistics.hiddenSubscriberCount) {
      addMetric({
        entityType: 'identity', entityId: owner.identity.id, provider: 'youtube',
        metric: 'subscribers', value: channelStatistics.subscriberCount,
        observedAt: generatedAt, sourceUrl: owner.identity.profileUrl
      });
    }
    for (const [metric, value] of [['views', channelStatistics.viewCount], ['videos', channelStatistics.videoCount]]) {
      addMetric({
        entityType: 'identity', entityId: owner.identity.id, provider: 'youtube', metric, value,
        observedAt: generatedAt, sourceUrl: owner.identity.profileUrl
      });
    }
    return owner;
  };

  const consume = async (items) => {
    for (const item of items) {
      const entry = item && item.video || {};
      const channel = item && item.channel || {};
      const snippet = entry.snippet || {};
      const channelId = snippet.channelId || channel.id;
      if (!entry.id || !channelId || !snippet.channelTitle) continue;
      const owner = ingestChannel(channel, snippet);
      const record = addContent(owner, {
        provider: 'youtube', nativeId: entry.id, contentType: 'video', title: snippet.title,
        excerpt: snippet.description,
        canonicalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(entry.id)}`,
        thumbnailUrl: youtubeThumbnail(snippet.thumbnails),
        publishedAt: snippet.publishedAt, observedAt: generatedAt
      });
      if (!owner || !record) continue;
      for (const [metric, value] of [
        ['views', entry.statistics && entry.statistics.viewCount],
        ['likes', entry.statistics && entry.statistics.likeCount],
        ['comments', entry.statistics && entry.statistics.commentCount]
      ]) {
        addMetric({
          entityType: 'content', entityId: record.id, provider: 'youtube', metric, value,
          observedAt: generatedAt, sourceUrl: record.canonicalUrl
        });
      }
    }
  };

  // Revalidate every retained video and channel before discovery. The list
  // endpoints are low-quota official checks, and omitted/private/deleted
  // resources are intentionally absent from the rebuilt snapshot.
  const retainedVideoIds = bundle.contentRecords
    .filter((row) => row.provider === 'youtube')
    .map((row) => row.nativeId);
  const retainedChannelIds = bundle.platformIdentities
    .filter((row) => row.provider === 'youtube')
    .map((row) => row.nativeId);
  if (retainedVideoIds.length || retainedChannelIds.length) {
    try {
      const revalidated = await revalidateYouTubeResources({
        videoIds: retainedVideoIds, channelIds: retainedChannelIds, key
      });
      const { videos, channels } = revalidated;
      pagesRead += revalidated.pagesRead;
      const channelsById = new Map(channels.map((channel) => [channel && channel.id, channel]));
      clearYouTubeSnapshot();
      channels.forEach((channel) => ingestChannel(channel));
      await consume(videos.map((video) => ({
        video,
        channel: channelsById.get(video.snippet && video.snippet.channelId) || null
      })));
    } catch (error) {
      finalOutcome = {
        state: before.contentRecords ? 'partial' : 'failed', hasMore: true,
        reasonCode: [
          'provider_rate_limited', 'provider_permission_required',
          'provider_timeout', 'provider_response_invalid'
        ].includes(error && error.code) ? error.code : 'partial_page_failure',
        pagesRead, nextCursor: pageToken, error
      };
      acquisitionCheckpoints.youtube = {
        state: 'in_progress', scopeKey, queryIndex, pageToken,
        updatedAt: generatedAt, reasonCode: finalOutcome.reasonCode
      };
    }
  }

  for (; !finalOutcome.hasMore && queryIndex < YOUTUBE_QUERIES.length; queryIndex += 1) {
    const result = await exhaustCursorPages({
      startCursor: pageToken,
      hasLastGood: before.contentRecords > 0,
      itemKey: (item) => item && item.video && item.video.id,
      fetchPage: (cursor) => fetchYouTubePage(YOUTUBE_QUERIES[queryIndex], cursor, key),
      consumePage: consume
    });
    pagesRead += result.pagesRead;
    if (result.hasMore) {
      finalOutcome = result;
      acquisitionCheckpoints.youtube = {
        state: 'in_progress', scopeKey, queryIndex, pageToken: result.nextCursor,
        updatedAt: generatedAt, reasonCode: result.reasonCode
      };
      break;
    }
    pageToken = null;
    acquisitionCheckpoints.youtube = {
      state: 'in_progress', scopeKey, queryIndex: queryIndex + 1, pageToken: null,
      updatedAt: generatedAt, reasonCode: null
    };
  }

  if (!finalOutcome.hasMore) {
    acquisitionCheckpoints.youtube = {
      state: 'exhausted', scopeKey, queryIndex: YOUTUBE_QUERIES.length, pageToken: null,
      updatedAt: generatedAt, reasonCode: null
    };
  }
  const counts = runCounts('youtube');
  const succeeded = !finalOutcome.hasMore;
  replaceProviderRun(createProviderRun({
    provider: 'youtube', state: succeeded ? 'succeeded' : youtubeFailureState(finalOutcome.reasonCode, counts),
    publishState: succeeded ? 'fresh' : (before.contentRecords ? 'last_good' : 'unavailable'),
    startedAt: generatedAt,
    finishedAt: new Date().toISOString(), observedAt: succeeded ? generatedAt : trustedPriorRun && trustedPriorRun.observedAt,
    lastSuccessAt: succeeded ? generatedAt : trustedPriorRun && (trustedPriorRun.lastSuccessAt || trustedPriorRun.observedAt),
    pagesRead, hasMore: finalOutcome.hasMore,
    reasonCode: finalOutcome.reasonCode, resultCounts: counts
  }));
}

function withoutObservation(row) {
  if (!row || typeof row !== 'object') return row;
  const copy = structuredClone(row);
  delete copy.observedAt;
  return copy;
}

function stabilizeRows(rows, priorRows, shouldReuse = () => true) {
  const priorById = new Map((priorRows || []).map((row) => [row && row.id, row]));
  return rows.map((row) => {
    const prior = priorById.get(row && row.id);
    if (!prior || !shouldReuse(row)) return row;
    return JSON.stringify(withoutObservation(row)) === JSON.stringify(withoutObservation(prior)) ? prior : row;
  });
}

export function preferMediaCompleteRows(rows, mediaKey) {
  return (rows || []).map((row, index) => ({ row, index }))
    .sort((left, right) => Number(Boolean(right.row && right.row[mediaKey]))
      - Number(Boolean(left.row && left.row[mediaKey])) || left.index - right.index)
    .map((entry) => entry.row);
}

export function attachMediaProvenance(value) {
  const source = value || {};
  const identityByCreator = new Map((source.platformIdentities || []).map((row) => [row.creatorId, row]));
  const creatorById = new Map((source.creators || []).map((row) => [row.id, row]));
  return {
    ...source,
    creators: (source.creators || []).map((row) => row.avatarUrl && !row.avatarSourceUrl
      ? { ...row, avatarSourceUrl: identityByCreator.get(row.id) && identityByCreator.get(row.id).profileUrl || null }
      : row),
    contentRecords: (source.contentRecords || []).map((row) => {
      if (row.thumbnailUrl) return {
        ...row,
        thumbnailRole: row.thumbnailRole || 'content',
        thumbnailSourceUrl: row.thumbnailSourceUrl || row.canonicalUrl
      };
      const creator = creatorById.get(row.creatorId);
      if (!creator || !creator.avatarUrl) return row;
      const identity = identityByCreator.get(row.creatorId);
      return {
        ...row,
        thumbnailUrl: creator.avatarUrl,
        thumbnailRole: ['substack', 'rss'].includes(row.provider)
          ? 'publication_art' : 'creator_avatar_fallback',
        thumbnailSourceUrl: creator.avatarSourceUrl || identity && identity.profileUrl || row.canonicalUrl
      };
    })
  };
}

export function compactMetricHistory(rows) {
  const streams = new Map();
  for (const row of rows || []) {
    if (!row) continue;
    const key = JSON.stringify([
      row.provider, row.entityType, row.entityId, row.metric, row.unit || 'count', row.window || null
    ]);
    if (!streams.has(key)) streams.set(key, []);
    streams.get(key).push(row);
  }
  const retained = [];
  for (const values of streams.values()) {
    values.sort((left, right) => {
      const time = (Date.parse(right.observedAt || '') || 0) - (Date.parse(left.observedAt || '') || 0);
      return time || String(right.id || '').localeCompare(String(left.id || ''));
    });
    const latest = values[0];
    retained.push(latest);
    const latestValue = JSON.stringify([
      latest.value, latest.availability, latest.visibility, latest.access
    ]);
    const priorDistinct = values.slice(1).find((row) => JSON.stringify([
      row.value, row.availability, row.visibility, row.access
    ]) !== latestValue);
    if (priorDistinct) retained.push(priorDistinct);
  }
  return retained.sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));
}

export function materialCatalogView(value) {
  const copy = structuredClone(value);
  delete copy.generatedAt;
  for (const key of ['creators', 'platformIdentities', 'contentRecords']) {
    for (const row of copy[key] || []) delete row.observedAt;
  }
  for (const row of copy.metricObservations || []) {
    delete row.id;
    if (!FRESHNESS_SENSITIVE_PROVIDERS.has(row.provider)) {
      delete row.observedAt;
      if (row.freshness) delete row.freshness.capturedAt;
    }
  }
  for (const run of copy.providerRuns || []) {
    for (const key of ['id', 'startedAt', 'finishedAt']) delete run[key];
    if (!FRESHNESS_SENSITIVE_PROVIDERS.has(run.provider)) {
      delete run.observedAt;
      delete run.lastSuccessAt;
    }
  }
  for (const checkpoint of Object.values(copy.acquisitionCheckpoints || {})) {
    if (!checkpoint || typeof checkpoint !== 'object') continue;
    delete checkpoint.updatedAt;
    if (checkpoint.state === 'exhausted') delete checkpoint.since;
  }
  return JSON.stringify(copy);
}

export function sanitizePublicCheckpoints(value) {
  const output = structuredClone(value && typeof value === 'object' ? value : {});
  for (const checkpoint of Object.values(output)) {
    if (!checkpoint || typeof checkpoint !== 'object' || typeof checkpoint.scopeKey !== 'string') continue;
    try {
      const scope = JSON.parse(checkpoint.scopeKey);
      if (!scope || typeof scope !== 'object' || Array.isArray(scope)) continue;
      delete scope.backend;
      delete scope.command;
      delete scope.tool;
      checkpoint.scopeKey = JSON.stringify(scope);
    } catch (_error) {
      // Non-JSON scope keys identify public provider/methodology only. Never
      // expose an internal acquisition implementation if one slips into them.
      if (PRIVATE_ACQUISITION_MARKER.test(checkpoint.scopeKey) || /yt-dlp/i.test(checkpoint.scopeKey)) {
        delete checkpoint.scopeKey;
      }
    }
  }
  return output;
}

async function collectWithGuard(provider, collector) {
  const prior = priorProviderRun(provider);
  try {
    await collector();
    return null;
  } catch (error) {
    const counts = runCounts(provider);
    replaceProviderRun(createProviderRun({
      provider,
      state: counts.contentRecords ? 'partial' : 'failed',
      publishState: counts.contentRecords ? 'last_good' : 'unavailable',
      startedAt: generatedAt,
      finishedAt: new Date().toISOString(),
      observedAt: prior && prior.observedAt,
      lastSuccessAt: prior && (prior.lastSuccessAt || prior.observedAt),
      pagesRead: 0,
      hasMore: Boolean(acquisitionCheckpoints[provider] && acquisitionCheckpoints[provider].state === 'in_progress'),
      reasonCode: 'partial_page_failure',
      resultCounts: counts
    }));
    return error;
  }
}

async function main() {
  await loadExisting();
  const collectors = {
    github: collectGitHub,
    dev: collectDev,
    medium: collectMedium,
    substack: collectSubstack,
    rss: collectRss,
    youtube: collectYouTube,
    bilibili: collectBilibili,
    twitch: collectTwitch,
    instagram: collectInstagram,
    x: () => collectReviewedPublicProvider('x'),
    tiktok: () => collectReviewedPublicProvider('tiktok'),
    spotify: () => collectReviewedPublicProvider('spotify'),
    soundcloud: () => collectReviewedPublicProvider('soundcloud'),
    patreon: () => collectReviewedPublicProvider('patreon'),
    kick: () => collectReviewedPublicProvider('kick'),
    linkedin: () => collectReviewedPublicProvider('linkedin')
  };
  const providers = selectedProviders();
  const errors = (await Promise.all(providers.map((provider) => collectWithGuard(provider, collectors[provider]))))
    .filter(Boolean);
  errors.forEach((error) => process.stderr.write(`source warning: ${error && error.message || 'unknown error'}\n`));

  const fresh = dedupeDiscoveryBundle(removePrivateAcquisitionReferences(bundle));
  const youtubeCreatorIds = new Set(fresh.platformIdentities
    .filter((row) => row.provider === 'youtube')
    .map((row) => row.creatorId));
  let deduped = existingCatalog ? {
    creators: stabilizeRows(fresh.creators, existingCatalog.creators, (row) => !youtubeCreatorIds.has(row.id)),
    platformIdentities: stabilizeRows(fresh.platformIdentities, existingCatalog.platformIdentities,
      (row) => row.provider !== 'youtube'),
    contentRecords: stabilizeRows(fresh.contentRecords, existingCatalog.contentRecords,
      (row) => row.provider !== 'youtube'),
    metricObservations: compactMetricHistory(fresh.metricObservations)
  } : fresh;
  deduped = attachMediaProvenance(deduped);
  deduped.creators = preferMediaCompleteRows(deduped.creators, 'avatarUrl');
  deduped.contentRecords = preferMediaCompleteRows(deduped.contentRecords, 'thumbnailUrl');
  const normalizedRuns = providerRuns.filter(Boolean).map((run) => {
    const identities = deduped.platformIdentities.filter((row) => row.provider === run.provider);
    const creatorIds = new Set(identities.map((row) => row.creatorId));
    return {
      ...run,
      resultCounts: {
        creators: creatorIds.size,
        contentRecords: deduped.contentRecords.filter((row) => row.provider === run.provider).length,
        metricObservations: deduped.metricObservations.filter((row) => row.provider === run.provider).length
      }
    };
  }).sort((left, right) => left.provider.localeCompare(right.provider));
  const catalog = {
    schemaVersion: 1,
    generatedAt,
    creators: deduped.creators,
    platformIdentities: deduped.platformIdentities,
    contentRecords: deduped.contentRecords,
    workClusters: buildWorkClusters(deduped.contentRecords),
    metricObservations: deduped.metricObservations,
    providerRuns: normalizedRuns,
    acquisitionCheckpoints: sanitizePublicCheckpoints(acquisitionCheckpoints)
  };
  const changed = !existingCatalog || materialCatalogView(catalog) !== materialCatalogView(existingCatalog);
  if (!changed) {
    process.stdout.write(`${JSON.stringify({
      output: outputPath.pathname,
      changed: false,
      creators: existingCatalog.creators.length,
      platformIdentities: existingCatalog.platformIdentities.length,
      contentRecords: existingCatalog.contentRecords.length,
      metricObservations: existingCatalog.metricObservations.length
    }, null, 2)}\n`);
    return;
  }
  const temporaryPath = new URL(`.discovery-catalog-${process.pid}.tmp`, outputPath);
  await writeFile(temporaryPath, `${JSON.stringify(catalog)}\n`, 'utf8');
  await rename(temporaryPath, outputPath);
  process.stdout.write(`${JSON.stringify({
    output: outputPath.pathname,
    changed: true,
    creators: catalog.creators.length,
    platformIdentities: catalog.platformIdentities.length,
    contentRecords: catalog.contentRecords.length,
    metricObservations: catalog.metricObservations.length,
    providers: catalog.providerRuns.map((run) => ({ provider: run.provider, state: run.state, results: run.resultCounts }))
  }, null, 2)}\n`);
  if (errors.length === providers.length) process.exitCode = 1;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
