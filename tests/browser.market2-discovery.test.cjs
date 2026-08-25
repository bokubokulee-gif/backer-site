'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');
const TradeCatalog = require('../js/trades-catalog-model');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'data', 'market2-people.json');
const LANDING_PREVIEW = JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data', 'landing-preview.json'), 'utf8'));
const TRADE_MODEL = TradeCatalog.build(
  JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8')),
  {
    reviewRegistry: JSON.parse(fsSync.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8')),
    simulationBucket: '2026-08-21T08:00:00.000Z'
  }
);
const TRADE_PROFILE_IDS = new Set(TRADE_MODEL.people.map((row) => row.id));
const TRADE_CONTENT_IDS = new Set(TRADE_MODEL.contents.map((row) => row.id));
let browser;
let server;
let origin;
let discoveryMode = 'connected';
let requests = [];

function type(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (/\.(?:png|jpg|jpeg|webp)$/.test(file)) return 'image/*';
  return 'application/octet-stream';
}

function creator(id, name, handle) {
  return {
    id,
    identityKind: 'public_discovery',
    eligibility: 'discovery_only',
    name,
    handle,
    category: 'Technology creator',
    bio: `${name} publishes sourced developer explainers.`,
    content: []
  };
}

function discoveryResponse(body) {
  const pageTwo = body.cursor === 'next_1';
  const person = pageTwo
    ? creator('public-person-youtube-signal-lab', 'Signal Lab', '@signal_lab')
    : creator('public-person-youtube-neon-byte', 'Neon Byte', '@neonbyte');
  const personId = person.id;
  const identityId = pageTwo ? 'identity-signal-youtube' : 'identity-neon-youtube';
  const contentId = pageTwo ? 'signal-video-1' : 'neon-video-1';
  const providerUrl = pageTwo ? 'https://www.youtube.com/@signal_lab' : 'https://www.youtube.com/@neonbyte';
  const contentUrl = pageTwo ? 'https://www.youtube.com/watch?v=signal1' : 'https://www.youtube.com/watch?v=neon1';
  return {
    schemaVersion: 4,
    generatedAt: '2026-08-19T02:00:00Z',
    status: 'fresh',
    providers: {
      youtube: { runStatus: 'succeeded', publishState: 'fresh', observedAt: '2026-08-19T02:00:00Z' },
      github: { runStatus: 'permission-required', publishState: 'last-good', observedAt: '2026-08-18T02:00:00Z' }
    },
    people: [person],
    work: [{
      id: contentId,
      personId,
      platformIdentityId: identityId,
      provider: 'youtube',
      title: pageTwo ? 'Signals from small creator tools' : 'Build a tiny compiler in one hour',
      type: 'video',
      url: contentUrl,
      publishedAt: '2026-08-18T10:00:00Z',
      observedAt: '2026-08-19T02:00:00Z',
      availability: 'public_at_capture'
    }],
    workClusters: [{
      id: `workcluster-${contentId}`,
      canonicalSourceRecordId: contentId,
      sourceRecordIds: [contentId],
      linkage: 'source_record'
    }],
    evidence: {
      platformIdentities: [{ id: identityId, personId, provider: 'youtube', handle: person.handle, url: providerUrl, sourceUrl: providerUrl, observedAt: '2026-08-19T02:00:00Z', state: 'fresh' }],
      metricObservations: [
        { entityType: 'identity', entityId: identityId, provider: 'youtube', metricKey: 'subscribers', nativeMetricName: 'Subscribers', rawValue: pageTwo ? 8200 : 48200, observedAt: '2026-08-19T02:00:00Z', sourceUrl: providerUrl, availability: 'available', methodologyVersion: 'youtube-data-api-v3-channels-v1', freshness: { state: 'fresh', expiresAt: '2026-09-18T02:00:00Z' }, confidence: { level: 'high', basis: 'direct_official_api_field' } },
        { entityType: 'content', entityId: contentId, provider: 'youtube', metricKey: 'views', nativeMetricName: 'Views', rawValue: pageTwo ? 18200 : 80321, observedAt: '2026-08-19T02:00:00Z', sourceUrl: contentUrl, availability: 'available', methodologyVersion: 'youtube-data-api-v3-videos-v1', freshness: { state: 'fresh', expiresAt: '2026-09-18T02:00:00Z' }, confidence: { level: 'high', basis: 'direct_official_api_field' } },
        { entityType: 'content', entityId: contentId, provider: 'youtube', metricKey: 'likes', nativeMetricName: 'Likes', rawValue: pageTwo ? 2300 : 23000, absoluteDelta: pageTwo ? 300 : 4100, observedAt: '2026-08-19T02:00:00Z', sourceUrl: contentUrl, availability: 'available', methodologyVersion: 'youtube-data-api-v3-videos-v1', freshness: { state: 'fresh', expiresAt: '2026-09-18T02:00:00Z' }, confidence: { level: 'high', basis: 'direct_official_api_field' } },
        { entityType: 'content', entityId: contentId, provider: 'youtube', metricKey: 'word_count', nativeMetricName: 'Word count', rawValue: 999999, observedAt: '2026-08-19T02:00:00Z', sourceUrl: contentUrl, availability: 'available', methodologyVersion: 'unreviewed-text-estimate-v1', freshness: { state: 'fresh' }, confidence: { level: 'unassessed', basis: 'unreviewed' } }
      ]
    },
    rankings: [{ personId, rank: pageTwo ? 2 : 1 }],
    counts: {
      responsePage: { scope: 'response_page', creatorEntities: 1, linkedPlatformIdentities: 1, uniqueWorks: 1, sourceRecords: 1, evidenceObservations: 4 },
      matchedSnapshot: { scope: 'live_augmentation_matched_snapshot', creatorEntities: 2, linkedPlatformIdentities: 2, uniqueWorks: 2, sourceRecords: 2, evidenceObservations: 8 }
    },
    markets: [],
    nextCursor: pageTwo ? null : 'next_1'
  };
}

function instagramResponse() {
  const person = {
    ...creator('public-person-instagram-connected', 'Studio Meridian', '@studio_meridian'),
    avatarUrl: 'https://images.example.test/studio-meridian.png'
  };
  const profileUrl = 'https://www.instagram.com/studio_meridian/';
  return {
    schemaVersion: 4,
    generatedAt: '2026-08-20T10:00:00Z',
    status: 'fresh',
    providers: { instagram: { runStatus: 'succeeded', publishState: 'fresh', observedAt: '2026-08-20T10:00:00Z' } },
    people: [person],
    work: [],
    workClusters: [],
    evidence: {
      platformIdentities: [{ id: 'identity-instagram-connected', personId: person.id, provider: 'instagram', handle: person.handle, url: profileUrl, sourceUrl: profileUrl, observedAt: '2026-08-20T10:00:00Z', state: 'fresh' }],
      metricObservations: []
    },
    rankings: [{ personId: person.id, rank: 1 }],
    counts: { responsePage: { scope: 'response_page', creatorEntities: 1, linkedPlatformIdentities: 1, uniqueWorks: 0, sourceRecords: 0, evidenceObservations: 0 } },
    markets: [],
    nextCursor: null
  };
}

function deepContentResponse(body) {
  const pageTwo = body.cursor === 'deep_next_1';
  const person = creator('public-person-youtube-deep-owner', 'Deep Owner', '@deep_owner');
  const identityId = 'identity-deep-owner-youtube';
  const providerUrl = 'https://www.youtube.com/@deep_owner';
  const indexes = pageTwo ? [5, 6] : [1, 2, 3, 4];
  const work = indexes.map((index) => ({
    id: `deep-video-${index}`,
    personId: person.id,
    platformIdentityId: identityId,
    provider: 'youtube',
    title: `Deep work ${index}`,
    type: 'video',
    url: `https://www.youtube.com/watch?v=deep${index}`,
    publishedAt: `2026-08-${String(20 - index).padStart(2, '0')}T10:00:00Z`,
    observedAt: '2026-08-19T02:00:00Z',
    availability: 'public_at_capture'
  }));
  return {
    schemaVersion: 4,
    generatedAt: '2026-08-19T02:00:00Z',
    status: 'delayed',
    providers: {
      youtube: { runStatus: 'succeeded', publishState: 'last-good', observedAt: '2026-08-19T02:00:00Z' }
    },
    people: [person],
    work,
    workClusters: work.map((row) => ({
      id: `workcluster-${row.id}`,
      canonicalSourceRecordId: row.id,
      sourceRecordIds: [row.id],
      linkage: 'source_record'
    })),
    evidence: {
      platformIdentities: [{
        id: identityId, personId: person.id, provider: 'youtube', handle: person.handle,
        url: providerUrl, sourceUrl: providerUrl, observedAt: '2026-08-19T02:00:00Z', state: 'last-good'
      }],
      metricObservations: work.map((row, index) => ({
        entityType: 'content', entityId: row.id, provider: 'youtube', metricKey: 'likes',
        nativeMetricName: 'Likes', rawValue: 10_000 - index, observedAt: '2026-08-19T02:00:00Z',
        sourceUrl: row.url, availability: 'available'
      }))
    },
    rankings: [{ personId: person.id, rank: 1 }],
    counts: {
      responsePage: { scope: 'response_page', creatorEntities: 1, linkedPlatformIdentities: 1, uniqueWorks: work.length, sourceRecords: work.length, evidenceObservations: work.length },
      matchedSnapshot: { scope: 'last_good_matched_snapshot', creatorEntities: 1, linkedPlatformIdentities: 1, uniqueWorks: 6, sourceRecords: 6, evidenceObservations: 6 }
    },
    markets: [],
    nextCursor: pageTwo ? null : 'deep_next_1'
  };
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/market2/people') {
    const body = await fs.readFile(SNAPSHOT);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }
  if (url.pathname === '/api/discovery/search') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw || '{}');
    requests.push(body);
    if (discoveryMode === 'failed' || discoveryMode === 'static-catalog') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end('{"error":"provider unavailable"}');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(discoveryMode === 'deep-content' ? deepContentResponse(body) : discoveryMode === 'instagram-records' ? instagramResponse() : discoveryResponse(body)));
    return;
  }
  if (url.pathname === '/data/discovery-catalog.json' && discoveryMode === 'failed') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end('{"error":"no retained catalog in this fixture"}');
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/backerdemo.html';
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(`${ROOT}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': type(file) });
    res.end(body);
  } catch (_error) {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function page(viewport = { width: 1440, height: 1000 }, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => {
    if (route.request().resourceType() === 'image') {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
      });
    }
    return route.abort();
  });
  return { context, tab: await context.newPage() };
}

before(async () => {
  server = http.createServer((req, res) => handler(req, res).catch((error) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(error.stack);
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('Market2 loads trending discovery, keeps research controls safe, and paginates connected content', async () => {
  discoveryMode = 'connected';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-person-name', { state: 'visible' });
    await tab.waitForFunction(() => document.querySelectorAll('.m2-profile-card').length === 9);
    await tab.waitForFunction(() => {
      const profiles = Array.from(document.querySelectorAll('.m2-profile-card .m2-profile-media img'));
      const works = Array.from(document.querySelectorAll('.m2-feed-card .m2-feed-media img'));
      return profiles.length === 9 && works.length === 12 && profiles.concat(works).every((image) => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 20000 });

    assert.equal(requests[0].mode, 'trending');
    assert.equal(requests[0].query, '');
    assert.deepEqual(requests[0].providerScopes, ['x', 'github', 'youtube', 'bilibili', 'facebook', 'instagram', 'linkedin', 'twitch', 'medium', 'dev', 'substack', 'rss']);
    assert.equal(await tab.locator('.m2-command h1').count(), 0);
    assert.equal(await tab.locator('.m2-command-summary').innerText(), 'Discover profiles and contents to back');
    assert.equal(await tab.locator('.m2-command-nav [data-nav="home"]').innerText(), 'Home');
    assert.equal(await tab.locator('.m2-command-nav a[href="research.html"]').innerText(), 'Research');
    assert.equal(await tab.locator('.m2-command-nav a[href="backerthesis.html"]').innerText(), 'Thesis');
    assert.equal(await tab.locator('.m2-command-nav [data-m2-show-watched]').innerText(), 'Your People 0');
    assert.equal(await tab.locator('.m2-command-nav [data-view="trades"]').innerText(), 'Trades');
    assert.equal(await tab.locator('.m2-command-nav a[href="portfolio.html"]').innerText(), 'Portfolio');
    assert.doesNotMatch(await tab.locator('.m2-command').innerText(), /People worth noticing/);
    assert.equal(await tab.locator('[data-m2-filters]').count(), 2);
    assert.equal(await tab.locator('[data-m2-filters="profiles"]').innerText(), 'Filter profiles');
    assert.equal(await tab.locator('[data-m2-filters="contents"]').innerText(), 'Filter contents');
    assert.equal(await tab.locator('.m2-local-archive, .m2-share-button').count(), 0);
    assert.equal(await tab.locator('.m2-filterbar, .m2-category-row').count(), 0);
    assert.equal(await tab.locator('.m2-state-banner').count(), 0, 'healthy retained catalog does not need a fallback banner');
    assert.equal(await tab.locator('#m2PeopleTitle').innerText(), 'Profiles to Back');
    assert.equal(await tab.locator('#m2FeedTitle').innerText(), 'Contents to Back');
    assert.equal(await tab.locator('.m2-list-provenance, .m2-why-now, .m2-attention-metrics, .m2-ledger, .m2-dossier, .m2-right, .m2-method').count(), 0);
    assert.equal(await tab.locator('[data-m2-more-feed]').innerText(), 'Show more');
    assert.ok(await tab.locator('.m2-workspace').evaluate((node) => node.compareDocumentPosition(document.querySelector('.m2-catalog-feed')) & Node.DOCUMENT_POSITION_FOLLOWING));
    const catalogStrip = await tab.locator('.m2-context-strip').innerText();
    assert.match(catalogStrip, /profiles/);
    assert.match(catalogStrip, /source-linked works/);
    assert.match(catalogStrip, /observations/);
    assert.match(catalogStrip, /Updated/);
    assert.doesNotMatch(catalogStrip, /unavailable|provider|last good/i);
    assert.equal(await tab.locator('.m2-context-track').count(), 2);
    assert.equal(await tab.locator('.m2-context-track[aria-hidden="true"]').count(), 1);
    assert.equal(await tab.locator('.m2-source-rail').count(), 0, 'catalog counts appear only in the moving strip');
    assert.equal(await tab.locator('.m2-desktop-people .m2-profile-card').count(), 9);
    assert.equal(await tab.locator('.m2-feed-card').count(), 12);
    assert.equal(await tab.locator('.m2-profile-card .m2-profile-media img').count(), 9, 'first-glance profile cards prioritize retained source images');
    assert.equal(await tab.locator('.m2-feed-card .m2-feed-media img').count(), 12, 'first-glance content cards prioritize retained source thumbnails');
    assert.equal(await tab.locator('.m2-profile-media.is-image-fallback, .m2-feed-media.is-image-fallback').count(), 0, 'the first marketplace viewport should contain no broken media panels');
    assert.equal(await tab.locator('.m2-profile-image-fallback:visible, .m2-feed-fallback:visible').count(), 0, 'fallback copy stays hidden behind every loaded first-glance image');
    assert.match(await tab.locator('.m2-catalog-feed').innerText(), /Contents to Back/i);
    const initialContentProviders = await tab.locator('.m2-feed-byline small').allTextContents();
    assert.ok(new Set(initialContentProviders.map((label) => label.split(' · ')[0])).size >= 3, 'image-first feed still interleaves retained sources');
    assert.doesNotMatch(await tab.locator('.market2-shell').innerText(), /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
    assert.equal(await tab.locator('[data-m2-create="person"]').count(), 9);
    assert.equal(await tab.locator('[data-m2-create="content"]').count(), 12);
    assert.equal(await tab.locator('[data-m2-create]').filter({ hasText: 'Draft custom' }).count(), 21,
      'every first-glance profile and content card can still open the five-step custom proposal composer');
    const connectedRoutes = await tab.evaluate(() => ({
      profiles: Array.from(document.querySelectorAll('.m2-profile-card')).map((card) => ({
        id: card.querySelector('[data-m2-create="person"]')?.getAttribute('data-creator-id') || '',
        tradeHref: card.querySelector('[data-m2-trade="person"]')?.getAttribute('href') || ''
      })),
      contents: Array.from(document.querySelectorAll('.m2-feed-card')).map((card) => ({
        id: card.querySelector('[data-m2-create="content"]')?.getAttribute('data-content-id') || '',
        tradeHref: card.querySelector('[data-m2-trade="content"]')?.getAttribute('href') || ''
      }))
    }));
    for (const row of connectedRoutes.profiles) {
      const eligible = TRADE_PROFILE_IDS.has(row.id);
      assert.equal(Boolean(row.tradeHref), eligible, `${row.id} connected profile route must match exact account eligibility`);
      if (eligible) assert.equal(row.tradeHref, `backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(row.id)}`);
    }
    for (const row of connectedRoutes.contents) {
      const eligible = TRADE_CONTENT_IDS.has(row.id);
      assert.equal(Boolean(row.tradeHref), eligible, `${row.id} connected content route must match exact work eligibility`);
      if (eligible) assert.equal(row.tradeHref, `backerdemo.html#trades?view=contents&subject=${encodeURIComponent(row.id)}`);
    }
    assert.equal(connectedRoutes.profiles.find((row) => row.id === 'public-person-youtube-neon-byte')?.tradeHref || '', '',
      'a connected test-only profile must not inherit another account contract');
    assert.equal(connectedRoutes.contents.find((row) => row.id === 'neon-video-1')?.tradeHref || '', '',
      'a connected test-only work must not inherit another work contract');
    assert.ok(await tab.locator('[data-m2-create="person"]').first().getAttribute('href').then((href) => /^backercreate\.html#draft\?scope=person&person=/.test(href)));
    assert.ok(await tab.locator('[data-m2-create="content"]').first().getAttribute('href').then((href) => /^backercreate\.html#draft\?scope=content&person=.+&content=/.test(href)));
    assert.equal(await tab.locator('.m2-ticket, .m2-research-boundary').count(), 0);
    assert.equal(await tab.locator('.backer-footer').count(), 1);
    assert.ok(await tab.locator('#app').evaluate((node) => node.compareDocumentPosition(document.querySelector('.backer-footer')) & Node.DOCUMENT_POSITION_FOLLOWING));

    const initialCreatorCount = Number(
      (await tab.locator('.m2-context-track').first().innerText())
        .match(/([\d,]+) profiles/)[1]
        .replaceAll(',', '')
    );
    await tab.locator('[data-m2-load-connected]').click();
    await tab.waitForFunction((expected) => {
      const text = document.querySelector('.m2-context-track')?.textContent || '';
      const match = text.match(/([\d,]+) profiles/);
      return match && Number(match[1].replaceAll(',', '')) === expected;
    }, initialCreatorCount + 1);
    assert.equal(requests.at(-1).cursor, 'next_1');

    await tab.fill('#m2Search', 'Neon Byte');
    await tab.waitForFunction(() => window.location.hash.includes('q=Neon+Byte'));
    await new Promise((resolve) => setTimeout(resolve, 450));
    assert.equal(requests.at(-1).mode, 'search');
    assert.equal(requests.at(-1).query, 'Neon Byte');
    await tab.waitForFunction(() => Array.from(document.querySelectorAll('.m2-person-name')).some((node) => node.textContent === 'Neon Byte'));
    assert.match(await tab.locator('.m2-profile-card', { hasText: 'Neon Byte' }).locator('.m2-profile-metrics').innerText(), /80\.3K[\s\S]*Views|48\.2K[\s\S]*Subscribers/i);
    assert.match(await tab.locator('.m2-feed-card', { hasText: 'Build a tiny compiler in one hour' }).locator('.m2-work-native').innerText(), /80\.3K\s+Views/i);
  } finally {
    await context.close();
  }
});

test('Marketplace command navigation exits to Home and public research pages', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const first = await page();
  try {
    await first.tab.goto(`${origin}/backerdemo.html#market2`);
    await first.tab.waitForSelector('.market2-shell');
    await first.tab.locator('.m2-command-nav [data-nav="home"]').click();
    await first.tab.waitForFunction(() => document.querySelector('#app.hidden') && location.hash === '');
    assert.equal(new URL(first.tab.url()).pathname, '/backerdemo.html');
  } finally {
    await first.context.close();
  }

  const second = await page();
  try {
    await second.tab.goto(`${origin}/backerdemo.html#market2`);
    await second.tab.waitForSelector('.market2-shell');
    await second.tab.locator('.m2-command-nav a[href="research.html"]').click();
    await second.tab.waitForURL(/\/research\.html$/);
    assert.equal(new URL(second.tab.url()).pathname, '/research.html');
  } finally {
    await second.context.close();
  }
});

test('Discovery Trade growth links fail closed to exact reviewed Trades subjects and preserve exact deep links', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-profile-card');
    await tab.waitForSelector('.m2-feed-card');
    await tab.waitForFunction(() => document.querySelectorAll('.m2-profile-card').length >= 6 && document.querySelectorAll('.m2-feed-card').length >= 6);
    const rendered = await tab.evaluate(() => ({
      profiles: Array.from(document.querySelectorAll('.m2-profile-card')).map((card) => ({
        id: card.querySelector('[data-m2-create="person"]')?.getAttribute('data-creator-id') || '',
        tradeHref: card.querySelector('[data-m2-trade="person"]')?.getAttribute('href') || '',
        cardHref: card.getAttribute('data-m2-trade-card') || ''
      })),
      contents: Array.from(document.querySelectorAll('.m2-feed-card')).map((card) => ({
        id: card.querySelector('[data-m2-create="content"]')?.getAttribute('data-content-id') || '',
        tradeHref: card.querySelector('[data-m2-trade="content"]')?.getAttribute('href') || '',
        cardHref: card.getAttribute('data-m2-trade-card') || ''
      }))
    }));

    assert.ok(rendered.profiles.some((row) => !TRADE_PROFILE_IDS.has(row.id)), 'the first Discovery profile set should exercise an ineligible research profile');
    for (const row of rendered.profiles) {
      const eligible = TRADE_PROFILE_IDS.has(row.id);
      assert.equal(Boolean(row.tradeHref), eligible, `${row.id} profile Trade growth CTA must match exact reviewed eligibility`);
      assert.equal(Boolean(row.cardHref), eligible, `${row.id} profile card navigation must fail closed with the CTA`);
      if (eligible) assert.equal(row.tradeHref, `backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(row.id)}`);
    }
    for (const row of rendered.contents) {
      const eligible = TRADE_CONTENT_IDS.has(row.id);
      assert.equal(Boolean(row.tradeHref), eligible, `${row.id} content Trade growth CTA must match exact reviewed eligibility`);
      assert.equal(Boolean(row.cardHref), eligible, `${row.id} content card navigation must fail closed with the CTA`);
      if (eligible) assert.equal(row.tradeHref, `backerdemo.html#trades?view=contents&subject=${encodeURIComponent(row.id)}`);
    }

    const reviewedProfile = TRADE_MODEL.people.find((row) => row.name === 'Dian Huang') || TRADE_MODEL.people[0];
    await tab.fill('#m2Search', reviewedProfile.name);
    const reviewedProfileCard = tab.locator('.m2-profile-card').filter({ has: tab.locator(`[data-m2-create="person"][data-creator-id="${reviewedProfile.id}"]`) });
    await reviewedProfileCard.waitFor({ state: 'visible', timeout: 20000 });
    const eligibleProfile = {
      id: reviewedProfile.id,
      tradeHref: await reviewedProfileCard.locator('[data-m2-trade="person"]').getAttribute('href')
    };
    assert.equal(eligibleProfile.tradeHref, `backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(eligibleProfile.id)}`);
    const profileTab = await context.newPage();
    await profileTab.goto(new URL(eligibleProfile.tradeHref, `${origin}/`).href);
    const profileCard = profileTab.locator(`.mkt-catalog-card[data-mkt-subject-kind="profile"][data-mkt-subject-id="${eligibleProfile.id}"]`);
    await profileCard.waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await profileCard.evaluate((node) => node.classList.contains('is-route-focus')), true);
    assert.equal((await profileCard.locator('.mkt-contract h3').innerText()).trim(), TRADE_MODEL.people.find((row) => row.id === eligibleProfile.id).contract.question);
    await profileTab.close();

    const reviewedContent = TRADE_MODEL.contents.find((row) => row.personId === reviewedProfile.id) || TRADE_MODEL.contents[0];
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-profile-card');
    await tab.fill('#m2Search', reviewedContent.title);
    const reviewedContentCard = tab.locator('.m2-feed-card').filter({ has: tab.locator(`[data-m2-create="content"][data-content-id="${reviewedContent.id}"]`) });
    await reviewedContentCard.waitFor({ state: 'visible', timeout: 20000 });
    const eligibleContent = {
      id: reviewedContent.id,
      tradeHref: await reviewedContentCard.locator('[data-m2-trade="content"]').getAttribute('href')
    };
    assert.equal(eligibleContent.tradeHref, `backerdemo.html#trades?view=contents&subject=${encodeURIComponent(eligibleContent.id)}`);
    const contentTab = await context.newPage();
    await contentTab.goto(new URL(eligibleContent.tradeHref, `${origin}/`).href);
    const contentCard = contentTab.locator(`.mkt-catalog-card[data-mkt-subject-kind="content"][data-mkt-subject-id="${eligibleContent.id}"]`);
    await contentCard.waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await contentCard.evaluate((node) => node.classList.contains('is-route-focus')), true);
    assert.equal((await contentCard.locator('.mkt-contract h3').innerText()).trim(), TRADE_MODEL.contents.find((row) => row.id === eligibleContent.id).contract.question);
    await contentTab.close();
  } finally {
    await context.close();
  }
});

test('unsupported route providers are removed and the drawer only exposes active providers', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2?platforms=unknown-provider`);
    await tab.waitForSelector('.m2-person-name', { state: 'visible' });
    await tab.waitForFunction(() => !location.hash.includes('unknown-provider') && document.querySelectorAll('.m2-feed-card').length === 12);

    assert.equal(await tab.locator('.m2-command h1').count(), 0);
    assert.equal(await tab.locator('.m2-command-summary').innerText(), 'Discover profiles and contents to back');
    assert.equal(await tab.locator('[data-m2-filters]').count(), 2);
    await tab.locator('[data-m2-filters="profiles"]').click();
    await tab.waitForSelector('.m2-filter-drawer');
    const exposedProviders = tab.locator('[data-m2-drawer-platform]');
    assert.ok(await exposedProviders.count() > 0, 'retained providers should occupy the filter surface');
    assert.equal(await tab.locator('[data-m2-drawer-platform][disabled]').count(), 0, 'the drawer should not render disabled provider choices');
    const instagramConnect = tab.locator('[data-m2-platform-connect="instagram"]');
    assert.equal(await instagramConnect.count(), 1, 'Instagram remains visible as an explicit connector instead of a dead filter');
    assert.match(await instagramConnect.innerText(), /Instagram[\s\S]*Add profiles and posts[\s\S]*Connect source/);
    assert.equal(await instagramConnect.locator('a').getAttribute('href'), 'https://chromewebstore.google.com/detail/ildkmabpimmkaediidaifkhjpohdnifk');
    assert.equal(await tab.locator('[data-m2-drawer-platform="instagram"]').count(), 0, 'zero-record Instagram cannot apply an empty catalog filter');
    for (const id of ['github', 'youtube', 'bilibili', 'twitch', 'medium', 'dev', 'substack', 'rss']) {
      assert.equal(await tab.locator(`[data-m2-drawer-platform="${id}"]`).isEnabled(), true, `${id} should remain filterable`);
    }
    assert.equal(await tab.locator('.m2-filter-note').innerText(), 'Filter retained profiles by their original source.');
    for (const selector of ['[data-m2-drawer-range]', '[data-m2-drawer-quick]', '[data-m2-drawer-category-rail]', '[data-m2-drawer-audience]', '[data-m2-drawer-engagement]', '[data-m2-drawer-sort]']) {
      assert.ok(await tab.locator(selector).count(), `${selector} should be available inside the profile filter drawer`);
    }
    const originalHash = await tab.evaluate(() => location.hash);
    await tab.locator('[data-m2-drawer-range][value="30d"]').check();
    await tab.locator('[data-m2-drawer-sort]').selectOption('newest');
    await tab.locator('[data-m2-close-drawer]').click();
    assert.equal(await tab.evaluate(() => location.hash), originalHash, 'closing the drawer cancels provisional filters');
    await tab.locator('[data-m2-filters="profiles"]').click();
    assert.equal(await tab.locator('[data-m2-drawer-range][value="7d"]').isChecked(), true);
    assert.equal(await tab.locator('[data-m2-drawer-sort]').inputValue(), 'viral');

    await tab.locator('[data-m2-drawer-platform="github"]').check();
    await tab.locator('[data-m2-apply-drawer]').click();
    await tab.waitForFunction(() => location.hash.includes('platforms=github'));
    assert.ok(await tab.evaluate(() => Array.from(document.querySelectorAll('.m2-desktop-people .m2-profile-card')).every((row) => row.querySelector('.m2-platform-mark.is-github'))));
    assert.doesNotMatch(await tab.evaluate(() => location.hash), /unknown-provider/);

    await tab.locator('[data-m2-filters="contents"]').click();
    assert.equal(await tab.locator('#m2DrawerTitle').innerText(), 'Filter contents');
    assert.equal(await tab.locator('.m2-filter-note').innerText(), 'Filter retained contents by their original source.');
    for (const selector of ['[data-m2-content-range]', '[data-m2-content-type]', '[data-m2-content-category]', '[data-m2-content-media]', '[data-m2-content-engagement]', '[data-m2-content-sort]']) {
      assert.ok(await tab.locator(selector).count(), `${selector} should be available inside the content filter drawer`);
    }
    assert.equal(await tab.locator('[data-m2-drawer-audience], [data-m2-drawer-engagement], [data-m2-drawer-sort]').count(), 0,
      'profile-only parameters stay out of the independent content filter drawer');
    await tab.locator('[data-m2-drawer-platform="youtube"]').check();
    await tab.locator('[data-m2-apply-drawer]').click();
    await tab.waitForFunction(() => location.hash.includes('cf_platforms=youtube'));
    assert.match(await tab.evaluate(() => location.hash), /platforms=github/);
  } finally {
    await context.close();
  }
});

test('Instagram automatically becomes a normal filter when a retained profile is connected', async () => {
  discoveryMode = 'instagram-records';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.locator('[data-m2-filters="profiles"]').click();
    await tab.waitForSelector('[data-m2-drawer-platform="instagram"]');
    assert.equal(await tab.locator('[data-m2-platform-connect="instagram"]').count(), 0);
    const instagram = tab.locator('[data-m2-drawer-platform="instagram"]');
    assert.equal(await instagram.count(), 1);
    assert.equal(await instagram.isEnabled(), true);
    assert.match(await instagram.getAttribute('aria-label'), /Instagram · retained in catalog/);
    await instagram.check();
    await tab.locator('[data-m2-apply-drawer]').click();
    await tab.waitForFunction(() => location.hash.includes('platforms=instagram'));
    assert.deepEqual(await tab.locator('.m2-profile-card .m2-person-name').allTextContents(), ['Studio Meridian']);
  } finally {
    await context.close();
  }
});

test('total catalog failure stays honestly empty and never restores bundled people', async () => {
  discoveryMode = 'failed';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-state-banner.is-warning');
    assert.equal(await tab.locator('.m2-person-name').count(), 0);
    assert.equal(await tab.locator('.m2-feed-card').count(), 0);
    assert.match(await tab.locator('.m2-state-banner').innerText(), /No creator or content record is substituted with demo data/i);
    assert.match(await tab.locator('.m2-context-strip').innerText(), /0 profiles/);
    assert.match(await tab.locator('.m2-context-strip').innerText(), /0 source-linked works/);
    assert.match(await tab.locator('.m2-context-strip').innerText(), /0 observations/);
    assert.doesNotMatch(await tab.locator('.market2-shell').innerText(), /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
  } finally {
    await context.close();
  }
});

test('a creator work continuation makes the fifth and sixth retained records visible after nextCursor', async () => {
  discoveryMode = 'deep-content';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-profile-card');
    const queryPage = tab.waitForResponse((response) => {
      if (!response.url().endsWith('/api/discovery/search')) return false;
      const request = response.request();
      if (request.method() !== 'POST') return false;
      try {
        const body = request.postDataJSON();
        return body.query === 'Deep Owner' && !body.cursor;
      } catch (_error) {
        return false;
      }
    });
    await tab.fill('#m2Search', 'Deep Owner');
    await queryPage;
    await tab.waitForFunction(() => Array.from(document.querySelectorAll('.m2-person-name')).some((node) => node.textContent === 'Deep Owner'));
    assert.match(await tab.locator('.m2-profile-card', { hasText: 'Deep Owner' }).locator('.m2-profile-metrics').innerText(), /native metrics not retained/i);
    assert.equal(await tab.locator('.m2-feed-card').count(), 4);

    await tab.locator('[data-m2-load-connected]').click();
    await tab.waitForFunction(() => document.body.textContent.includes('Deep work 6'));
    assert.equal(requests.at(-1).cursor, 'deep_next_1');
    await tab.waitForFunction(() => document.querySelectorAll('.m2-feed-card').length === 6);
    assert.equal(await tab.locator('.m2-feed-card').count(), 6);
    const ownerNames = await tab.locator('.m2-desktop-people .m2-person-name').allTextContents();
    assert.equal(ownerNames.filter((name) => name === 'Deep Owner').length, 1);
  } finally {
    await context.close();
  }
});

test('Market2 stays within 320px, 390px, 430px, and 608x688 viewports', async () => {
  discoveryMode = 'connected';
  requests = [];
  for (const viewport of [{ width: 320, height: 900 }, { width: 390, height: 900 }, { width: 430, height: 900 }, { width: 608, height: 688 }]) {
    const { context, tab } = await page(viewport);
    try {
      await tab.goto(`${origin}/backerdemo.html#market2`);
      await tab.waitForSelector('.m2-person-name:visible');
      const widths = await tab.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      assert.ok(widths.document <= widths.viewport, `document is ${widths.document}px wide at a ${widths.viewport}px viewport`);
      assert.ok(widths.body <= widths.viewport, `body is ${widths.body}px wide at a ${widths.viewport}px viewport`);
      assert.equal(await tab.locator('.nav .brand-word').isVisible(), true, `Backer wordmark stays visible at ${viewport.width}px`);
      assert.equal(await tab.locator('[data-m2-filters]').count(), 2);
      assert.equal(await tab.locator('.m2-filterbar, .m2-category-row').count(), 0);
      await tab.locator('[data-m2-filters="profiles"]').click();
      await tab.waitForSelector('[data-m2-platform-connect="instagram"]');
      const drawerBounds = await tab.evaluate(() => {
        const drawer = document.querySelector('.m2-filter-drawer');
        const connector = document.querySelector('[data-m2-platform-connect="instagram"]');
        const drawerRect = drawer.getBoundingClientRect();
        const connectorRect = connector.getBoundingClientRect();
        return {
          drawerLeft: drawerRect.left,
          drawerRight: drawerRect.right,
          connectorLeft: connectorRect.left,
          connectorRight: connectorRect.right,
          viewport: innerWidth
        };
      });
      assert.ok(drawerBounds.drawerLeft >= 0 && drawerBounds.drawerRight <= drawerBounds.viewport + 1, `drawer stays inside ${viewport.width}px viewport`);
      assert.ok(drawerBounds.connectorLeft >= drawerBounds.drawerLeft && drawerBounds.connectorRight <= drawerBounds.drawerRight + 1, `Instagram connector stays inside drawer at ${viewport.width}px`);
      const drawerType = await tab.evaluate(() => ({
        apply: parseFloat(getComputedStyle(document.querySelector('.m2-drawer-footer .m2-primary-button')).fontSize),
        clear: parseFloat(getComputedStyle(document.querySelector('.m2-drawer-footer .m2-clear-button')).fontSize)
      }));
      assert.ok(drawerType.apply >= 14 && drawerType.clear >= 14, `drawer actions stay readable at ${viewport.width}px`);
    } finally {
      await context.close();
    }
  }
});

test('marketplace uses three readable card columns and removes the abandoned dossier rails', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page({ width: 1440, height: 1000 });
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-profile-card');
    const layout = await tab.evaluate(() => ({
      profileColumns: getComputedStyle(document.querySelector('.m2-profile-grid')).gridTemplateColumns.split(' ').length,
      contentColumns: getComputedStyle(document.querySelector('.m2-feed-grid')).gridTemplateColumns.split(' ').length,
      profileCount: document.querySelectorAll('.m2-profile-card').length,
      contentCount: document.querySelectorAll('.m2-feed-card').length,
      discarded: document.querySelectorAll('.m2-dossier, .m2-right, .m2-method').length,
      profileBeforeContent: Boolean(document.querySelector('.m2-workspace').compareDocumentPosition(document.querySelector('.m2-catalog-feed')) & Node.DOCUMENT_POSITION_FOLLOWING),
      portraitTreatment: document.querySelector('.m2-profile-media').classList.contains('is-avatar'),
      portraitWidth: Math.round(document.querySelector('.m2-profile-media img').getBoundingClientRect().width),
      contextType: parseFloat(getComputedStyle(document.querySelector('.m2-context-track')).fontSize),
      filterType: parseFloat(getComputedStyle(document.querySelector('[data-m2-filters="profiles"]')).fontSize),
      platformMarkType: parseFloat(getComputedStyle(document.querySelector('.m2-platform-mark')).fontSize)
    }));
    assert.deepEqual(layout, {
      profileColumns: 3,
      contentColumns: 3,
      profileCount: 9,
      contentCount: 12,
      discarded: 0,
      profileBeforeContent: true,
      portraitTreatment: true,
      portraitWidth: 148,
      contextType: 14,
      filterType: 15,
      platformMarkType: 10
    });
  } finally {
    await context.close();
  }
});

test('site view count owns the line directly below the Backer brand and never renders a synthetic watching label', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page({ width: 1440, height: 1000 });
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForFunction(() => Boolean(window.BackerAnalytics && document.querySelector('.backer-brand-lockup')));
    const placement = await tab.evaluate(() => {
      const lockup = document.querySelector('.backer-brand-lockup');
      const brand = lockup && lockup.querySelector(':scope > .brand');
      const count = lockup && lockup.querySelector(':scope > .backer-view-count');
      const visible = Boolean(count && !count.hidden && count.getClientRects().length);
      const brandRect = brand && brand.getBoundingClientRect();
      const countRect = visible ? count.getBoundingClientRect() : null;
      return {
        directSibling: Boolean(brand && count && count.previousElementSibling === brand),
        visible,
        belowBrand: !visible || countRect.top >= brandRect.top + brandRect.height - 1,
        leftAligned: !visible || Math.abs(countRect.left - brandRect.left) <= 2,
        text: count ? count.textContent.trim() : '',
        source: count ? count.getAttribute('data-source') : ''
      };
    });
    assert.equal(placement.directSibling, true);
    assert.equal(placement.belowBrand, true);
    assert.equal(placement.leftAligned, true);
    assert.doesNotMatch(placement.text, /watching|baseline|estimated/i);
    assert.notEqual(placement.source, 'baseline');
    if (placement.visible) assert.match(placement.text, /(?:site )?views|unavailable/i);
  } finally {
    await context.close();
  }
});

test('Market2 light theme keeps visible text and controls at readable computed contrast', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  for (const viewport of [{ width: 320, height: 900 }, { width: 390, height: 900 }, { width: 430, height: 900 }, { width: 608, height: 688 }, { width: 1440, height: 1000 }]) {
    const { context, tab } = await page(viewport);
    try {
      await context.addInitScript(() => localStorage.setItem('backer_theme_v1', 'light'));
      await tab.goto(`${origin}/backerdemo.html#market2`);
      await tab.waitForSelector('.m2-person-name:visible');
      assert.equal(await tab.evaluate(() => document.documentElement.dataset.theme), 'light');
      await tab.locator('[data-m2-filters="profiles"]').click();
      await tab.waitForSelector('.m2-filter-drawer');
      const failures = await tab.evaluate(() => {
        function rgb(value) {
          const match = String(value).match(/[\d.]+/g);
          return match && match.length >= 3 ? match.slice(0, 3).map(Number) : [0, 0, 0];
        }
        function luminance(color) {
          return color.map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
          }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        }
        function ratio(a, b) {
          const one = luminance(a), two = luminance(b);
          return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
        }
        const samples = [
          ['.m2-command-summary', 'body'], ['.m2-context-track span', 'body'], ['.m2-browse-row button', 'body'],
          ['.m2-person-name', '.m2-profile-card'], ['.m2-profile-bio', '.m2-profile-card'], ['.m2-feed-card h3', '.m2-feed-card'],
          ['.m2-feed-byline small', '.m2-feed-card'], ['.m2-filter-button', '.m2-filter-button'],
          ['.m2-profile-source', '.m2-profile-card'], ['.backer-footer__link', '.backer-footer'],
          ['.m2-filter-note', '.m2-filter-drawer'], ['.m2-filter-group legend', '.m2-filter-drawer'],
          ['[data-m2-drawer-platform] + span b', '.m2-filter-drawer'],
          ['[data-m2-drawer-platform] + span small', '.m2-filter-drawer']
        ];
        return samples.map(([selector, backgroundSelector]) => {
          const element = Array.from(document.querySelectorAll(selector)).find((node) => node.getClientRects().length);
          const background = backgroundSelector === selector ? element : document.querySelector(backgroundSelector);
          if (!element || !background) return { selector, ratio: 0, missing: true };
          return { selector, ratio: Number(ratio(rgb(getComputedStyle(element).color), rgb(getComputedStyle(background).backgroundColor)).toFixed(2)) };
        }).filter((row) => row.ratio < 4.5);
      });
      assert.deepEqual(failures, [], `contrast failures at ${viewport.width}x${viewport.height}: ${JSON.stringify(failures)}`);
      const fontFailures = await tab.evaluate(() => {
        const minimums = [
          ['.m2-command-summary', 18], ['.m2-command-nav a', 15], ['.m2-search input', 16],
          ['#m2PeopleTitle', 32], ['#m2FeedTitle', 32], ['.m2-person-name', 18],
          ['.m2-profile-bio', 15], ['.m2-profile-metrics b', 18], ['.m2-feed-body h3', 18],
          ['.m2-feed-byline small', 14], ['.m2-feed-body .m2-work-native', 14]
        ];
        return minimums.map(([selector, minimum]) => {
          const node = Array.from(document.querySelectorAll(selector)).find((candidate) => candidate.getClientRects().length);
          return { selector, minimum, actual: node ? parseFloat(getComputedStyle(node).fontSize) : 0 };
        }).filter((row) => row.actual < row.minimum);
      });
      assert.deepEqual(fontFailures, [], `font-size failures at ${viewport.width}x${viewport.height}: ${JSON.stringify(fontFailures)}`);
      if (viewport.width === 648) {
        const clippedMetricLabels = await tab.evaluate(() => Array.from(document.querySelectorAll('.m2-profile-metrics a span'))
          .filter((node) => node.getClientRects().length)
          .map((node) => ({ text: node.textContent.trim(), clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }))
          .filter((row) => row.scrollWidth > row.clientWidth + 1 || row.scrollHeight > row.clientHeight + 1));
        assert.deepEqual(clippedMetricLabels, [], `648px profile metric labels must render complete words: ${JSON.stringify(clippedMetricLabels)}`);
      }
    } finally {
      await context.close();
    }
  }
});

test('mobile full roster renders retained creators in bounded forty-row chunks', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page({ width: 390, height: 900 });
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForFunction(() => {
      const button = document.querySelector('[data-m2-open-roster]');
      return button && /Browse all\s+(?:[1-9]\d{2,})/.test(button.textContent || '');
    });
    await tab.locator('[data-m2-open-roster]').click();
    await tab.waitForSelector('.m2-mobile-roster .m2-person-row');
    assert.equal(await tab.locator('.m2-mobile-roster .m2-person-row').count(), 40);
    assert.match(await tab.locator('[data-m2-more-roster]').innerText(), /40 \/ \d+ retained/);
    await tab.locator('[data-m2-more-roster]').click();
    assert.equal(await tab.locator('.m2-mobile-roster .m2-person-row').count(), 80);
  } finally {
    await context.close();
  }
});

test('landing discovery preview is populated from the real retained catalog', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html`);
    await tab.waitForFunction(() => document.querySelectorAll('#backerLandingCreatorFeed [data-m2-landing-person]').length === 3);
    const preview = await tab.locator('#backerLandingCreatorFeed').innerText();
    assert.doesNotMatch(preview, /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
    assert.doesNotMatch(preview, /Loading creator catalog|unavailable/i);
    assert.equal(await tab.locator('#backerLandingCreatorFeed .mini-work').count(), 3);
    assert.ok(await tab.locator('#backerLandingCreatorFeed .mini-signal').count() >= 1, 'landing cards surface retained native counts when available');
    assert.deepEqual(
      await tab.locator('#backerLandingCreatorFeed .mini-auth').allTextContents(),
      LANDING_PREVIEW.profiles.map((row) => ({ dev: 'DEV', github: 'GitHub' })[row.provider] || row.provider)
    );
    await tab.locator('#backerLandingCreatorFeed [data-m2-landing-person]').first().click();
    await tab.waitForFunction(() => location.hash.startsWith('#market2?') && location.hash.includes('q='));
    assert.equal(await tab.locator('.market2-shell').count(), 1);
  } finally {
    await context.close();
  }
});

test('homepage product surfaces stay in the viewport while hero pills retain internal overflow', async () => {
  for (const viewport of [
    { width: 320, height: 900 },
    { width: 390, height: 900 },
    { width: 608, height: 688 }
  ]) {
    const { context, tab } = await page(viewport);
    try {
      await tab.goto(`${origin}/backerdemo.html`);
      await tab.locator('#product').scrollIntoViewIfNeeded();
      await tab.waitForSelector('#product .surface.reveal.in');

      const result = await tab.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const grid = document.querySelector('#product .surfaces');
        const cards = Array.from(document.querySelectorAll('#product .surface'));
        const copy = Array.from(document.querySelectorAll('#product .surface h3, #product .surface p'));
        const pills = document.querySelector('.pills');
        const pillsShell = document.querySelector('.pills-shell');
        const gridRect = grid.getBoundingClientRect();
        const pillsShellRect = pillsShell.getBoundingClientRect();
        return {
          documentOverflow: document.documentElement.scrollWidth - viewportWidth,
          grid: { left: gridRect.left, right: gridRect.right },
          cards: cards.map((card) => {
            const rect = card.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: rect.width };
          }),
          copyFailures: copy.map((node) => ({
            text: node.textContent.trim(),
            fontSize: parseFloat(getComputedStyle(node).fontSize),
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            clientHeight: node.clientHeight,
            scrollHeight: node.scrollHeight
          })).filter((row) => row.scrollWidth > row.clientWidth + 1 || row.scrollHeight > row.clientHeight + 1),
          smallestHeading: Math.min(...cards.map((card) => parseFloat(getComputedStyle(card.querySelector('h3')).fontSize))),
          smallestBody: Math.min(...cards.map((card) => parseFloat(getComputedStyle(card.querySelector('p')).fontSize))),
          pills: {
            shellLeft: pillsShellRect.left,
            shellRight: pillsShellRect.right,
            viewportWidth,
            internalOverflow: pills.scrollWidth - pills.clientWidth
          }
        };
      });

      assert.ok(result.documentOverflow <= 1, `${viewport.width}px homepage overflowed by ${result.documentOverflow}px`);
      assert.ok(result.grid.left >= -1 && result.grid.right <= viewport.width + 1, `${viewport.width}px product grid escaped the viewport: ${JSON.stringify(result.grid)}`);
      assert.equal(result.cards.length, 4);
      assert.equal(result.cards.some((card) => card.left < -1 || card.right > viewport.width + 1 || card.width <= 0), false, `${viewport.width}px surface overflow: ${JSON.stringify(result.cards)}`);
      assert.deepEqual(result.copyFailures, [], `${viewport.width}px surface copy clipping`);
      assert.ok(result.smallestHeading >= 19, `${viewport.width}px surface heading is ${result.smallestHeading}px`);
      assert.ok(result.smallestBody >= 14, `${viewport.width}px surface body is ${result.smallestBody}px`);
      assert.ok(result.pills.shellLeft >= -1 && result.pills.shellRight <= result.pills.viewportWidth + 1, `${viewport.width}px pill shell escaped the viewport: ${JSON.stringify(result.pills)}`);
      assert.ok(result.pills.internalOverflow > 0, `${viewport.width}px hero pills no longer overflow internally`);
    } finally {
      await context.close();
    }
  }
});

test('homepage globe shows complete sourced figures and globe-synchronized outward flow', async () => {
  const { context, tab } = await page({ width: 1440, height: 1000 });
  try {
    await tab.goto(`${origin}/backerdemo.html`);
    await tab.locator('.val-asset').scrollIntoViewIfNeeded();
    await tab.waitForSelector('.val-asset.reveal.in');
    await tab.waitForFunction(() => {
      const globe = document.querySelector('[data-globe-live]');
      const network = document.querySelector('.val-asset-network');
      return globe && globe.classList.contains('is-ready') && network && network.classList.contains('is-globe-spinning');
    }, null, { timeout: 10000 });
    await tab.waitForTimeout(1700);

    assert.deepEqual(await tab.locator('.val-branch-figure').allTextContents(), ['$60B', '$250B → $480B', '~207M']);
    assert.equal(await tab.locator('.val-branch-source').count(), 3);
    assert.deepEqual(await tab.locator('.val-branch-source').allTextContents(), [
      'Citi GPS report · 2023 ↗',
      'Goldman Sachs Research · 2023 ↗',
      'Visa Creator Report · 2025 ↗'
    ]);
    assert.equal(await tab.locator('[data-globe-viewers]').count(), 0);
    assert.equal(await tab.locator('.val-branch-map [marker-end="url(#branch-arrow)"]').count(), 3);
    assert.equal(await tab.locator('.val-branch-pulse').count(), 3);
    assert.equal(await tab.locator('.val-branch-pulse').first().evaluate((node) => getComputedStyle(node).animationName), 'valBranchFlow');

    const before = await tab.locator('.val-globe-label').first().evaluate((node) => ({
      x: node.style.getPropertyValue('--marker-x'),
      y: node.style.getPropertyValue('--marker-y')
    }));
    await tab.waitForTimeout(450);
    const after = await tab.locator('.val-globe-label').first().evaluate((node) => ({
      x: node.style.getPropertyValue('--marker-x'),
      y: node.style.getPropertyValue('--marker-y')
    }));
    assert.notDeepEqual(after, before, 'globe-linked flow labels move with the rotating globe');

    const geometry = await tab.locator('.val-asset').evaluate((section) => ({
      cards: Array.from(section.querySelectorAll('.val-branch-stat')).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          className: node.className,
          left: rect.left,
          right: rect.right,
          height: rect.height,
          scrollHeight: node.scrollHeight,
          viewportWidth: document.documentElement.clientWidth
        };
      }),
      connectors: Array.from(section.querySelectorAll('.val-branch-line')).map((path, index) => {
        const card = section.querySelectorAll('.val-branch-stat')[index];
        const figure = card.querySelector('.val-branch-figure');
        const cardRect = card.getBoundingClientRect();
        const figureRect = figure.getBoundingClientRect();
        const point = path.getPointAtLength(path.getTotalLength());
        const svgPoint = path.ownerSVGElement.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        const end = svgPoint.matrixTransform(path.getScreenCTM());
        return {
          endX: end.x,
          endY: end.y,
          cardLeft: cardRect.left,
          cardRight: cardRect.right,
          figureCenterY: (figureRect.top + figureRect.bottom) / 2
        };
      }),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    assert.equal(geometry.cards.some((row) => row.left < 0 || row.right > row.viewportWidth || row.height + 1 < row.scrollHeight), false, JSON.stringify(geometry.cards));
    assert.ok(geometry.connectors[0].endX >= geometry.connectors[0].cardRight + 12, JSON.stringify(geometry.connectors[0]));
    assert.ok(geometry.connectors.slice(1).every((row) => row.endX <= row.cardLeft - 12), JSON.stringify(geometry.connectors));
    assert.ok(geometry.connectors.every((row) => Math.abs(row.endY - row.figureCenterY) <= 8), JSON.stringify(geometry.connectors));
    assert.ok(geometry.overflow <= 1, `homepage globe overflowed by ${geometry.overflow}px`);
  } finally {
    await context.close();
  }
});

test('homepage globe retains its dotted visual poster when WebGL is unavailable', async () => {
  const { context, tab } = await page({ width: 1440, height: 1000 });
  const fallbackWarnings = [];
  tab.on('console', (message) => {
    if (/Backer globe renderer/.test(message.text())) fallbackWarnings.push(message.text());
  });
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (/^webgl/i.test(String(kind))) return null;
      return original.call(this, kind, ...args);
    };
  });
  try {
    await tab.goto(`${origin}/backerdemo.html#validation`);
    await tab.locator('.val-asset').scrollIntoViewIfNeeded();
    await tab.waitForSelector('.val-globe-shell.is-fallback', { timeout: 10000 });
    const result = await tab.locator('.val-globe-shell').evaluate((globe) => ({
      posterOpacity: Number(getComputedStyle(globe.querySelector('.val-globe-poster')).opacity),
      canvasOpacity: Number(getComputedStyle(globe.querySelector('.val-globe-canvas')).opacity),
      posterPaths: globe.querySelectorAll('.val-globe-poster path').length,
      spinning: globe.closest('.val-asset-network').classList.contains('is-globe-spinning')
    }));
    assert.ok(result.posterOpacity > 0.99);
    assert.equal(result.canvasOpacity, 0);
    assert.ok(result.posterPaths >= 8);
    assert.equal(result.spinning, false);
    assert.deepEqual(await tab.locator('.val-branch-figure').allTextContents(), ['$60B', '$250B → $480B', '~207M']);
    await tab.waitForTimeout(250);
    assert.equal(fallbackWarnings.length, 1, 'a known WebGL failure must not be retried on every resize');
  } finally {
    await context.close();
  }
});

test('homepage globe keeps every figure, sentence, and source readable across responsive widths', async () => {
  const expectedCopy = [
    'Citi estimated the creator economy generated about $60B in 2022 across ad-funded video, subscriptions, donations, purchases, and sponsorships.',
    'Goldman Sachs Research estimated a $250B creator economy in 2023 and projected it could approach $480B by 2027.',
    "Approximately 207M people worldwide identify as creators, according to Visa's 2025 report citing Linktree's 2022 creator research."
  ];
  for (const viewport of [
    { width: 320, height: 900 },
    { width: 390, height: 900 },
    { width: 608, height: 688 },
    { width: 1440, height: 1000 }
  ]) {
    const { context, tab } = await page(viewport);
    try {
      await tab.goto(`${origin}/backerdemo.html#validation`);
      await tab.locator('.val-asset').scrollIntoViewIfNeeded();
      await tab.waitForSelector('.val-asset.reveal.in');
      await tab.waitForSelector('.val-globe-label', { state: 'attached' });
      assert.equal(await tab.locator('.nav .brand-word').isVisible(), true, `Backer wordmark stays visible at ${viewport.width}px`);
      assert.equal(await tab.locator('.val-asset-head h3').innerText(), 'Capital already flows to people on the internet.');
      assert.deepEqual(await tab.locator('.val-branch-figure').allTextContents(), ['$60B', '$250B → $480B', '~207M']);
      assert.deepEqual(await tab.locator('.val-branch-stat p').allTextContents(), expectedCopy);
      assert.deepEqual(await tab.locator('.val-branch-source').allTextContents(), [
        'Citi GPS report · 2023 ↗',
        'Goldman Sachs Research · 2023 ↗',
        'Visa Creator Report · 2025 ↗'
      ]);

      const result = await tab.locator('.val-asset').evaluate((section) => {
        const viewportWidth = document.documentElement.clientWidth;
        const cards = Array.from(section.querySelectorAll('.val-branch-stat'));
        const text = Array.from(section.querySelectorAll('.val-branch-figure, .val-branch-stat p, .val-branch-source'));
        return {
          cardFailures: cards.map((node) => {
            const rect = node.getBoundingClientRect();
            return { left: rect.left, right: rect.right, viewportWidth };
          }).filter((row) => row.left < -1 || row.right > row.viewportWidth + 1),
          clipFailures: text.map((node) => ({
            text: node.textContent.trim(),
            width: node.clientWidth,
            scrollWidth: node.scrollWidth,
            height: node.clientHeight,
            scrollHeight: node.scrollHeight
          })).filter((row) => row.scrollWidth > row.width + 1 || row.scrollHeight > row.height + 1),
          fontSizes: {
            figure: parseFloat(getComputedStyle(section.querySelector('.val-branch-figure')).fontSize),
            body: parseFloat(getComputedStyle(section.querySelector('.val-branch-stat p')).fontSize),
            source: parseFloat(getComputedStyle(section.querySelector('.val-branch-source')).fontSize)
          },
          branchDisplay: getComputedStyle(section.querySelector('.val-branch-map')).display,
          labelDisplay: getComputedStyle(section.querySelector('.val-globe-label')).display
        };
      });
      assert.deepEqual(result.cardFailures, [], `${viewport.width}px card overflow`);
      assert.deepEqual(result.clipFailures, [], `${viewport.width}px clipped copy`);
      assert.ok(result.fontSizes.figure >= 34, `${viewport.width}px figure is ${result.fontSizes.figure}px`);
      assert.ok(result.fontSizes.body >= 15, `${viewport.width}px body is ${result.fontSizes.body}px`);
      assert.ok(result.fontSizes.source >= 12.5, `${viewport.width}px source is ${result.fontSizes.source}px`);
      assert.equal(result.branchDisplay === 'none', viewport.width <= 920);
      assert.equal(result.labelDisplay === 'none', viewport.width <= 760);
    } finally {
      await context.close();
    }
  }
});

test('homepage globe preserves exact figures and disables illustrative motion for reduced-motion users', async () => {
  const { context, tab } = await page({ width: 1440, height: 1000 }, { reducedMotion: 'reduce' });
  try {
    await tab.goto(`${origin}/backerdemo.html#validation`);
    await tab.waitForSelector('.val-asset.reveal.in');
    await tab.waitForSelector('.val-globe-label', { state: 'attached' });
    await tab.waitForTimeout(500);
    assert.deepEqual(await tab.locator('.val-branch-figure').allTextContents(), ['$60B', '$250B → $480B', '~207M']);
    assert.equal(await tab.locator('.val-asset-network').evaluate((node) => node.classList.contains('is-globe-spinning')), false);
    assert.equal(await tab.locator('.val-branch-pulse').first().evaluate((node) => getComputedStyle(node).display), 'none');
    const before = await tab.locator('.val-globe-label').first().evaluate((node) => node.style.getPropertyValue('--marker-x'));
    await tab.waitForTimeout(500);
    const after = await tab.locator('.val-globe-label').first().evaluate((node) => node.style.getPropertyValue('--marker-x'));
    assert.equal(after, before);
  } finally {
    await context.close();
  }
});

test('Trades owns its canonical route, the #market alias, and the legacy market query alias', async () => {
  discoveryMode = 'static-catalog';
  for (const route of ['#trades', '#market', '?view=market']) {
    const { context, tab } = await page();
    try {
      await tab.goto(`${origin}/backerdemo.html${route}`);
      await tab.waitForSelector('.mkt');
      assert.equal(await tab.locator('.market2-shell, .m2-local-archive').count(), 0);
      assert.match(await tab.locator('.mkt-header').innerText(), /Backer Trades[\s\S]*Trade future growth in creator accounts and work[\s\S]*Source-backed creator accounts and original content from Discovery/i);
      assert.equal(await tab.locator('.mkt-paper-status').count(), 1);
      assert.equal((await tab.locator('.mkt-paper-status').innerText()).trim(), 'Paper market · modeled quotes');
      const inventory = await tab.locator('.mkt-catalog-line').innerText();
      assert.match(inventory, /\$10,000(?:\.00)?\s+paper cash/i);
      assert.match(inventory, new RegExp(`${TRADE_MODEL.people.length.toLocaleString('en-US')}\\s+creator-account markets`, 'i'));
      assert.match(inventory, new RegExp(`${TRADE_MODEL.contents.length.toLocaleString('en-US')}\\s+work markets`, 'i'));
      assert.doesNotMatch(await tab.locator('.mkt').innerText(), /Ada Maker|Marcus Stillwater|BACKER_MKT|Demo simulations/i);
    } finally {
      await context.close();
    }
  }
});

test('a Discovery filter drawer does not reopen after a Trades round trip', async () => {
  discoveryMode = 'static-catalog';
  const { context, tab } = await page({ width: 648, height: 900 });
  try {
    await tab.goto(`${origin}/backerdemo.html#market2`);
    await tab.waitForSelector('.m2-profile-card');
    await tab.locator('[data-m2-filters="profiles"]').click();
    await tab.waitForSelector('.m2-filter-drawer');
    await tab.evaluate(() => { location.hash = '#trades'; });
    await tab.waitForSelector('.mkt');
    await tab.evaluate(() => { location.hash = '#market2'; });
    await tab.waitForSelector('.market2-shell');
    assert.equal(await tab.locator('.m2-filter-drawer').count(), 0);
    assert.equal(await tab.locator('[data-m2-filters="profiles"]').getAttribute('aria-expanded'), 'false');
  } finally {
    await context.close();
  }
});

test('restored Search stays source-backed while legacy synthetic creators remain absent', async () => {
  const html = await fs.readFile(path.join(ROOT, 'backerdemo.html'), 'utf8');
  assert.match(html, /js\/search-engine\.js\?v=20260826-perf-1/);
  assert.equal((html.match(/data-view="search"/g) || []).length, 2);
  assert.doesNotMatch(html, /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
  assert.match(html, /id="market2HeroSearch"/);
  assert.doesNotMatch(html, /css\/market\.css|js\/market-data\.js|js\/market\.js/);
  assert.doesNotMatch(html, /data-view="market"|href="[^"]*#market(?:[?"#])/);
  assert.equal((html.match(/data-view="market2"/g) || []).length, 3);
  assert.equal((html.match(/data-view="trades"/g) || []).length, 4);
  assert.match(html, /href="backerdemo\.html#market2"[^>]*data-view="market2">Discovery/);
  assert.match(html, /href="backerdemo\.html#trades"[^>]*data-view="trades">Trades/);
  assert.match(html, /href="backerdemo\.html#search"[^>]*data-view="search">AI Search/);
  assert.match(html, /<\/section>\s*<!-- SHARED FLICKERING FOOTER -->\s*<footer class="backer-footer/);
  const market = await fs.readFile(path.join(ROOT, 'js', 'market2.js'), 'utf8');
  assert.match(market, /method:\s*'POST'/);
  assert.match(market, /mode:\s*query\s*\?\s*'search'\s*:\s*'trending'/);
  assert.match(market, /data\/discovery-catalog\.json/);
  assert.doesNotMatch(html, /js\/market2-data\.js/);
  assert.doesNotMatch(market, /BACKER_MARKET2_DATA|Bundled fallback|Emergency bundled snapshot/);
  assert.match(market, /no universal score/i);
});

test('the retained discovery catalog adapter preserves every creator, work record, and native observation', async () => {
  const [marketSource, catalogSource] = await Promise.all([
    fs.readFile(path.join(ROOT, 'js', 'market2.js'), 'utf8'),
    fs.readFile(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8')
  ]);
  const catalog = JSON.parse(catalogSource);
  const windowObject = {
    location: { href: 'https://example.test/backerdemo.html#market2', pathname: '/backerdemo.html', search: '', hash: '#market2' },
    BACKER_MARKET2_DATA: null,
    BackerMarket2Data: null
  };
  vm.runInNewContext(marketSource, {
    window: windowObject, URL, URLSearchParams, Intl, Date, Number, String, Array, Object,
    Boolean, Math, RegExp, JSON, setTimeout, clearTimeout
  });
  const normalized = windowObject.BackerMarket2.normalizeDiscovery(catalog, 'static');
  assert.equal(normalized.people.length, catalog.creators.length);
  assert.equal(normalized.people.reduce((count, person) => count + person.content.length, 0), catalog.contentRecords.length);
  const normalizedWorks = normalized.people.flatMap((person) => person.content);
  assert.equal(new Set(normalizedWorks.map((work) => work.sourceRecordId)).size, catalog.contentRecords.length);
  assert.equal(new Set(normalizedWorks.map((work) => work.workClusterId)).size, catalog.contentRecords.length,
    'an unreviewed static catalog must not cluster works by title or URL similarity');
  assert.ok(normalized.people.some((person) => person.metrics.length || person.content.some((work) => work.publicCounts.length)));
  const retainedMetric = catalog.metricObservations.find((metric) => metric.availability === 'available');
  assert.ok(retainedMetric, 'the catalog must retain at least one available native observation');
  if (retainedMetric.entityType === 'identity') {
    const identity = catalog.platformIdentities.find((row) => row.id === retainedMetric.entityId);
    const owner = normalized.people.find((person) => person.id === identity.creatorId);
    assert.ok(owner.metrics.some((metric) => metric.provider === retainedMetric.provider
      && metric.key === retainedMetric.metric && metric.value === retainedMetric.value));
  } else {
    const record = catalog.contentRecords.find((row) => row.id === retainedMetric.entityId);
    const owner = normalized.people.find((person) => person.id === record.creatorId);
    const work = owner.content.find((row) => row.id === record.id);
    assert.ok(work.publicCounts.some((metric) => metric.provider === retainedMetric.provider
      && (metric.key || metric.metric) === retainedMetric.metric && metric.value === retainedMetric.value));
  }
  assert.ok(normalized.people.every((person) => person.tradable === false));
  assert.ok(normalized.people.every((person) => person.identityKind === 'public_discovery'));
  assert.ok(normalized.people.every((person) => person.accounts.some((account) => account.url || account.sourceUrl)));

  function clusterPage(contentId, provider, identityId) {
    return {
      schemaVersion: 4,
      generatedAt: '2026-08-19T02:00:00Z',
      status: 'fresh',
      people: [{ id: 'cluster-person', name: 'Reviewed Cross-post', identityKind: 'public_discovery' }],
      work: [{
        id: contentId, creatorId: 'cluster-person', platformIdentityId: identityId, provider,
        title: 'Same reviewed work', canonicalUrl: `https://${provider}.example/exact-work`
      }],
      workClusters: [{
        id: 'workcluster-reviewed-exact', canonicalSourceRecordId: contentId,
        sourceRecordIds: [contentId], sourceRecordCount: 2, linkage: 'editorial_reviewed_exact_ids'
      }],
      evidence: {
        platformIdentities: [{
          id: identityId, creatorId: 'cluster-person', provider, nativeId: `${provider}-owner`,
          profileUrl: `https://${provider}.example/owner`
        }],
        metricObservations: []
      }
    };
  }
  const firstPage = windowObject.BackerMarket2.normalizeDiscovery(clusterPage('source-record-a', 'github', 'identity-a'), 'api');
  const secondPage = windowObject.BackerMarket2.normalizeDiscovery(clusterPage('source-record-b', 'dev', 'identity-b'), 'api');
  const merged = windowObject.BackerMarket2.merge(firstPage, secondPage);
  const reviewedPerson = merged.people.find((person) => person.id === 'cluster-person');
  assert.equal(reviewedPerson.content.length, 2, 'connected page merge must retain both source records');
  assert.deepEqual(new Set(reviewedPerson.content.map((work) => work.sourceRecordId)), new Set(['source-record-a', 'source-record-b']));
  assert.deepEqual(new Set(reviewedPerson.content.map((work) => work.workClusterId)), new Set(['workcluster-reviewed-exact']));
  assert.ok(reviewedPerson.content.every((work) => work.clusterSourceRecordCount === 2));
  assert.equal(reviewedPerson.tradable, false);
});
