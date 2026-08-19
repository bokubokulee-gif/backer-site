'use strict';

const dns = require('node:dns/promises');
const net = require('node:net');
const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { compactText, safeHttpsUrl } = require('../../../api/_lib/discovery-model');
const { addMetric, contentForIdentity, identityBundle } = require('./_helpers');
const { REVIEWED_PUBLIC_FEEDS } = require('./public-feeds');

const MAX_FEED_BYTES = 384 * 1024;
const FEED_BATCH = 5;

function classifyFeed(url, supplied) {
  if (['medium', 'substack', 'rss'].includes(supplied)) return supplied;
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname === 'medium.com' || hostname.endsWith('.medium.com')) return 'medium';
  if (hostname === 'substack.com' || hostname.endsWith('.substack.com')) return 'substack';
  return 'rss';
}

function parseFeedConfig(raw) {
  let configured = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) configured = parsed;
    } catch (_error) {
      configured = [];
    }
  }
  const parsed = REVIEWED_PUBLIC_FEEDS.concat(configured);
  const rows = [];
  const seen = new Set();
  for (const item of parsed) {
    if (!item || item.verified !== true) continue;
    const url = safeHttpsUrl(item.url || item.feedUrl);
    const id = compactText(item.id, 100).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    if (!url || !id) continue;
    const provider = classifyFeed(url, compactText(item.provider, 20).toLowerCase());
    const key = `${provider}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id,
      provider,
      title: compactText(item.title, 160),
      url,
      profileUrl: safeHttpsUrl(item.profileUrl || item.siteUrl) || url
    });
    if (rows.length >= 100) break;
  }
  return rows;
}

function privateIpv4(address) {
  const parts = String(address || '').split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 0 || b === 168))
    || (a === 198 && (b === 18 || b === 19))
    || a === 255;
}

function ipv6Bytes(address) {
  let source = String(address || '').toLowerCase().split('%')[0];
  const dotted = source.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const octets = dotted[1].split('.').map(Number);
    source = source.slice(0, -dotted[1].length)
      + ((octets[0] << 8) | octets[1]).toString(16) + ':'
      + ((octets[2] << 8) | octets[3]).toString(16);
  }
  const halves = source.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = halves.length === 2 ? 8 - left.length - right.length : 0;
  const groups = left.concat(Array(Math.max(0, missing)).fill('0'), right);
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.flatMap((group) => {
    const value = Number.parseInt(group, 16);
    return [value >> 8, value & 255];
  });
}

function privateIp(address) {
  const normalized = String(address || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIP(normalized) === 4) return privateIpv4(normalized);
  if (net.isIP(normalized) !== 6) return true;
  const bytes = ipv6Bytes(normalized);
  if (!bytes) return true;
  if (bytes.every((byte) => byte === 0) || (bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1)) return true;
  if ((bytes[0] & 0xfe) === 0xfc || bytes[0] === 0xff) return true;
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) >= 0x80) return true;
  const mapped = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  const compatible = bytes.slice(0, 12).every((byte) => byte === 0);
  return mapped || compatible ? privateIpv4(bytes.slice(12).join('.')) : false;
}

async function assertPublicFeedUrl(value, lookup) {
  const safe = safeHttpsUrl(value);
  if (!safe) throw Object.assign(new Error('invalid feed url'), { code: 'feed_unavailable' });
  const parsed = new URL(safe);
  if (parsed.port && parsed.port !== '443') throw Object.assign(new Error('unsafe feed port'), { code: 'feed_unavailable' });
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  const records = net.isIP(hostname)
    ? [{ address: hostname }]
    : await (lookup || dns.lookup)(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => privateIp(record.address))) {
    throw Object.assign(new Error('feed host is not public'), { code: 'feed_unavailable' });
  }
  return parsed.toString();
}

async function boundedFeedText(response) {
  const contentType = String(response.headers && response.headers.get && response.headers.get('content-type') || '').toLowerCase();
  if (contentType && !/(?:rss|atom|xml|text\/plain)/.test(contentType)) {
    throw Object.assign(new Error('invalid feed content type'), { code: 'feed_unavailable' });
  }
  const length = Number(response.headers && response.headers.get && response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_FEED_BYTES) throw Object.assign(new Error('feed too large'), { code: 'feed_unavailable' });
  const raw = typeof response.arrayBuffer === 'function'
    ? Buffer.from(await response.arrayBuffer())
    : Buffer.from(await response.text(), 'utf8');
  if (raw.length > MAX_FEED_BYTES) throw Object.assign(new Error('feed too large'), { code: 'feed_unavailable' });
  const body = raw.toString('utf8');
  if (/<!DOCTYPE|<!ENTITY/i.test(body)) throw Object.assign(new Error('unsafe feed markup'), { code: 'feed_unavailable' });
  return body;
}

async function fetchFeed(url, context, depth) {
  const safe = await assertPublicFeedUrl(url, context.lookup);
  const response = await context.fetch(safe, {
    method: 'GET',
    redirect: 'manual',
    signal: context.signal,
    headers: { Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9' }
  });
  if (response.status >= 300 && response.status < 400) {
    if ((depth || 0) >= 2) throw Object.assign(new Error('feed redirect limit'), { code: 'feed_unavailable' });
    const location = response.headers && response.headers.get && response.headers.get('location');
    if (!location) throw Object.assign(new Error('feed redirect missing'), { code: 'feed_unavailable' });
    return fetchFeed(new URL(location, safe).toString(), context, (depth || 0) + 1);
  }
  if (!response.ok) {
    const error = new Error('feed request failed');
    error.status = response.status;
    error.code = response.status === 429 ? 'provider_rate_limited' : 'feed_unavailable';
    throw error;
  }
  return boundedFeedText(response);
}

function decodeEntities(value) {
  return String(value || '').replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (entity) => ({
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'"
  })[entity] || '');
}

function cleanMarkup(value, maximum) {
  return compactText(decodeEntities(String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')), maximum);
}

function tag(block, names, maximum) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (match) return cleanMarkup(match[1], maximum || 1000);
  }
  return '';
}

function attribute(block, names, name) {
  for (const tagName of names) {
    const match = block.match(new RegExp(`<${tagName}\\b[^>]*\\b${name}=["']([^"']+)["'][^>]*>`, 'i'));
    if (match) return decodeEntities(match[1]);
  }
  return '';
}

function feedTerms(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .split(/[^\p{L}\p{N}_@.-]+/u).filter(Boolean).slice(0, 12);
}

function parseFeed(body, feed, context) {
  const channel = body.match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i)?.[1] || body;
  const title = tag(channel, ['title'], 160) || feed.title || feed.id;
  const description = tag(channel, ['description', 'subtitle'], 600);
  const icon = safeHttpsUrl(tag(channel, ['logo', 'icon'], 2048));
  const observedAt = context.now().toISOString();
  const owner = identityBundle({
    provider: feed.provider,
    nativeId: feed.id,
    handle: new URL(feed.profileUrl).hostname,
    displayName: title,
    bio: description,
    avatarUrl: icon,
    profileUrl: feed.profileUrl,
    observedAt
  });
  if (!owner) return { creators: [], platformIdentities: [], contentRecords: [], metricObservations: [] };
  const blocks = [];
  const pattern = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = pattern.exec(body)) && blocks.length < 100) blocks.push(match[2]);
  const queryTerms = feedTerms(context.query);
  const contentRecords = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const itemTitle = tag(block, ['title'], 280);
    const excerpt = tag(block, ['description', 'summary', 'content:encoded'], 700);
    const haystack = `${title} ${description} ${itemTitle} ${excerpt}`.normalize('NFKC').toLowerCase();
    if (context.mode !== 'trending' && queryTerms.length && !queryTerms.some((term) => haystack.includes(term))) continue;
    const link = safeHttpsUrl(tag(block, ['link'], 2048)) || safeHttpsUrl(attribute(block, ['link'], 'href'));
    const nativeId = tag(block, ['guid', 'id'], 300) || link || `${feed.id}:${index}`;
    const content = contentForIdentity({
      provider: feed.provider,
      nativeId,
      contentType: 'article',
      title: itemTitle,
      excerpt,
      canonicalUrl: link,
      thumbnailUrl: safeHttpsUrl(attribute(block, ['media:thumbnail', 'media:content', 'enclosure'], 'url')),
      publishedAt: tag(block, ['pubDate', 'published', 'updated'], 100),
      observedAt
    }, owner);
    if (content) contentRecords.push(content);
    if (contentRecords.length >= (context.providerLimit || 30)) break;
  }
  const metricObservations = [];
  addMetric(metricObservations, {
    entityType: 'identity', entityId: owner.identity.id, provider: feed.provider,
    metric: 'feed_items_observed', value: blocks.length, observedAt, sourceUrl: feed.url
  });
  const publicationMatches = context.mode === 'trending' || !queryTerms.length
    || queryTerms.some((term) => `${title} ${description}`.toLowerCase().includes(term));
  if (!publicationMatches && !contentRecords.length) {
    return { creators: [], platformIdentities: [], contentRecords: [], metricObservations: [] };
  }
  return {
    creators: [owner.creator],
    platformIdentities: [owner.identity],
    contentRecords,
    metricObservations
  };
}

function feedAdapter(provider) {
  return createProviderAdapter({
    id: provider,
    availability(env) {
      const config = parseFeedConfig(env.BACKER_DISCOVERY_FEEDS_JSON || env.BACKER_VERIFIED_PUBLICATION_FEEDS_JSON);
      return config.some((feed) => feed.provider === provider)
        ? { state: 'ready' }
        : { state: 'not_configured', reasonCode: 'verified_feeds_not_configured' };
    },
    async fetchPage(context) {
      const all = parseFeedConfig(context.env.BACKER_DISCOVERY_FEEDS_JSON || context.env.BACKER_VERIFIED_PUBLICATION_FEEDS_JSON)
        .filter((feed) => feed.provider === provider);
      const offset = Math.max(0, Math.min(all.length, Number.parseInt(context.cursor, 10) || 0));
      const selected = all.slice(offset, offset + FEED_BATCH);
      const settled = await Promise.allSettled(selected.map(async (feed) => {
        const body = await fetchFeed(feed.url, context, 0);
        return parseFeed(body, feed, context);
      }));
      const successful = settled.filter((row) => row.status === 'fulfilled').map((row) => row.value);
      const merged = {
        creators: successful.flatMap((row) => row.creators),
        platformIdentities: successful.flatMap((row) => row.platformIdentities),
        contentRecords: successful.flatMap((row) => row.contentRecords),
        metricObservations: successful.flatMap((row) => row.metricObservations)
      };
      const failures = settled.filter((row) => row.status === 'rejected');
      if (!successful.length && failures.length) throw failures[0].reason;
      return Object.assign(merged, {
        nextCursor: offset + selected.length < all.length ? String(offset + selected.length) : null,
        reasonCode: failures.length ? 'partial_page_failure' : null
      });
    }
  });
}

const medium = feedAdapter('medium');
const substack = feedAdapter('substack');
const rss = feedAdapter('rss');

module.exports = {
  FEED_BATCH,
  MAX_FEED_BYTES,
  assertPublicFeedUrl,
  boundedFeedText,
  classifyFeed,
  fetchFeed,
  feedAdapter,
  medium,
  parseFeed,
  parseFeedConfig,
  privateIp,
  rss,
  substack
};
