'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'data', 'market2-people.json');
let browser;
let server;
let origin;
let discoveryMode = 'connected';
let requests = [];

function type(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
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
    res.end(JSON.stringify(discoveryMode === 'deep-content' ? deepContentResponse(body) : discoveryResponse(body)));
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

async function page(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.route(/https:\/\/(?!127\.0\.0\.1).*/, (route) => route.abort());
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
    await tab.waitForFunction(() => Array.from(document.querySelectorAll('.m2-person-name')).some((node) => node.textContent === 'Neon Byte'));

    assert.equal(requests[0].mode, 'trending');
    assert.equal(requests[0].query, '');
    assert.deepEqual(requests[0].providerScopes, ['x', 'github', 'youtube', 'bilibili', 'facebook', 'instagram', 'linkedin', 'twitch', 'medium', 'dev', 'substack', 'rss']);
    assert.equal(await tab.locator('.m2-command h1').count(), 0);
    assert.equal(await tab.locator('.m2-command-summary').innerText(), 'Discover profiles and contents to back');
    assert.equal(await tab.locator('.m2-command-nav [data-nav="home"]').innerText(), 'Home');
    assert.equal(await tab.locator('.m2-command-nav a[href="research.html"]').innerText(), 'Research');
    assert.equal(await tab.locator('.m2-command-nav a[href="backerthesis.html"]').innerText(), 'Thesis');
    assert.equal(await tab.locator('.m2-command-nav a[href="portfolio.html"]').innerText(), 'Portfolio');
    assert.doesNotMatch(await tab.locator('.m2-command').innerText(), /People worth noticing/);
    assert.equal(await tab.locator('[data-m2-filters]').count(), 1);
    assert.equal(await tab.locator('.m2-local-archive[data-view="market-archive"]').innerText(), 'Legacy marketplace · local only');
    assert.equal(await tab.locator('.m2-filterbar, .m2-category-row').count(), 0);
    assert.equal(await tab.locator('.m2-state-banner').count(), 0, 'healthy retained catalog does not need a fallback banner');
    assert.equal(await tab.locator('#m2PeopleTitle').innerText(), 'Profiles to Back');
    assert.equal(await tab.locator('#m2FeedTitle').innerText(), 'Contents to Back');
    assert.equal(await tab.locator('.m2-list-provenance, .m2-why-now, .m2-attention-metrics, .m2-ledger').count(), 0);
    assert.equal(await tab.locator('[data-m2-more-feed]').innerText(), 'Show more');
    assert.ok(await tab.locator('.m2-workspace').evaluate((node) => node.compareDocumentPosition(document.querySelector('.m2-catalog-feed')) & Node.DOCUMENT_POSITION_FOLLOWING));
    const catalogStrip = await tab.locator('.m2-context-strip').innerText();
    assert.match(catalogStrip, /creator entities/);
    assert.match(catalogStrip, /linked platform identities/);
    assert.match(catalogStrip, /unique works/);
    assert.match(catalogStrip, /source records/);
    assert.match(catalogStrip, /evidence observations/);
    assert.match(catalogStrip, /Loaded Backer catalog/);
    assert.equal(await tab.locator('.m2-context-track').count(), 2);
    assert.equal(await tab.locator('.m2-context-track[aria-hidden="true"]').count(), 1);
    assert.equal(await tab.locator('.m2-source-rail').count(), 0, 'catalog counts appear only in the moving strip');
    assert.equal(await tab.locator('.m2-desktop-people .m2-person-row').count(), 32);
    assert.equal(await tab.locator('.m2-feed-card').count(), 12);
    assert.match(await tab.locator('.m2-catalog-feed').innerText(), /Contents to Back/i);
    assert.match(await tab.locator('.m2-feed-card', { hasText: 'Build a tiny compiler in one hour' }).locator('.m2-work-native span').first().innerText(), /80\.3K\s+Views/i);
    const initialContentProviders = await tab.locator('.m2-feed-byline small').allTextContents();
    for (const provider of ['YouTube', 'Bilibili', 'Twitch', 'GitHub', 'DEV', 'Medium', 'Substack', 'RSS']) {
      assert.ok(initialContentProviders.some((label) => label.startsWith(provider)),
        `expected a ${provider} record in the initial source-diverse feed`);
    }
    assert.ok(new Set(initialContentProviders.map((label) => label.split(' · ')[0])).size >= 8, 'initial feed should span at least eight retained sources');
    assert.doesNotMatch(await tab.locator('.market2-shell').innerText(), /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
    assert.equal(await tab.locator('[data-m2-create]').count(), 0);
    const neonFacts = tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Neon Byte' }).locator('.m2-person-facts');
    assert.match(await neonFacts.innerText(), /Views[\s\S]*Subscribers/);
    assert.doesNotMatch(await neonFacts.innerText(), /Word count|unavailable/i);

    await tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Neon Byte' }).locator('[data-m2-select]').click();
    assert.equal(await tab.locator('.m2-proof-callout').count(), 0, 'incomplete PoA dimensions are omitted instead of rendering unavailable values');
    assert.doesNotMatch(await tab.locator('.m2-dossier').innerText(), /Unavailable/i);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /23K Likes/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /1 source record · 1 unique work/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /Published Aug 18, 2026/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /Fresh|Recent snapshot/);
    assert.equal(await tab.locator('.m2-ticket').count(), 0);
    assert.equal(await tab.locator('[data-m2-create]').count(), 0);
    assert.match(await tab.locator('.m2-research-boundary').innerText(), /No execution/);
    assert.equal(await tab.locator('.backer-footer').count(), 1);
    assert.ok(await tab.locator('#app').evaluate((node) => node.compareDocumentPosition(document.querySelector('.backer-footer')) & Node.DOCUMENT_POSITION_FOLLOWING));

    await tab.locator('[data-m2-load-connected]').click();
    await tab.waitForFunction(() => Array.from(document.querySelectorAll('.m2-person-name')).some((node) => node.textContent === 'Signal Lab'));
    assert.equal(requests.at(-1).cursor, 'next_1');

    await tab.fill('#m2Search', 'Neon Byte');
    await tab.waitForFunction(() => window.location.hash.includes('q=Neon+Byte'));
    await new Promise((resolve) => setTimeout(resolve, 450));
    assert.equal(requests.at(-1).mode, 'search');
    assert.equal(requests.at(-1).query, 'Neon Byte');
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

test('zero-record providers stay out of the filter surface and cannot empty the real feed', async () => {
  discoveryMode = 'static-catalog';
  requests = [];
  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market2?platforms=instagram`);
    await tab.waitForSelector('.m2-person-name', { state: 'visible' });
    await tab.waitForFunction(() => !location.hash.includes('instagram') && document.querySelectorAll('.m2-feed-card').length === 12);

    assert.equal(await tab.locator('.m2-command h1').count(), 0);
    assert.equal(await tab.locator('.m2-command-summary').innerText(), 'Discover profiles and contents to back');
    assert.equal(await tab.locator('[data-m2-filters]').count(), 1);
    await tab.locator('[data-m2-filters]').click();
    await tab.waitForSelector('.m2-filter-drawer');
    for (const id of ['facebook', 'instagram', 'douyin']) {
      assert.equal(await tab.locator(`[data-m2-drawer-platform="${id}"]`).count(), 0, `${id} should not occupy the filter surface without retained records`);
    }
    for (const id of ['github', 'youtube', 'bilibili', 'twitch', 'medium', 'dev', 'substack', 'rss']) {
      assert.equal(await tab.locator(`[data-m2-drawer-platform="${id}"]`).isEnabled(), true, `${id} should remain filterable`);
    }
    assert.equal(await tab.locator('.m2-filter-note').innerText(), 'Showing sources with real profiles or original content retained in this catalog.');
    for (const selector of ['[data-m2-drawer-range]', '[data-m2-drawer-quick]', '[data-m2-drawer-category-rail]', '[data-m2-drawer-audience]', '[data-m2-drawer-engagement]', '[data-m2-drawer-sort]']) {
      assert.ok(await tab.locator(selector).count(), `${selector} should be available inside the single filter drawer`);
    }
    const originalHash = await tab.evaluate(() => location.hash);
    await tab.locator('[data-m2-drawer-range][value="30d"]').check();
    await tab.locator('[data-m2-drawer-sort]').selectOption('newest');
    await tab.locator('[data-m2-close-drawer]').click();
    assert.equal(await tab.evaluate(() => location.hash), originalHash, 'closing the drawer cancels provisional filters');
    await tab.locator('[data-m2-filters]').click();
    assert.equal(await tab.locator('[data-m2-drawer-range][value="7d"]').isChecked(), true);
    assert.equal(await tab.locator('[data-m2-drawer-sort]').inputValue(), 'viral');

    await tab.locator('[data-m2-drawer-platform="github"]').check();
    await tab.locator('[data-m2-apply-drawer]').click();
    await tab.waitForFunction(() => location.hash.includes('platforms=github'));
    assert.ok(await tab.evaluate(() => Array.from(document.querySelectorAll('.m2-desktop-people .m2-person-row')).every((row) => row.querySelector('.m2-platform-mark.is-github'))));
    assert.doesNotMatch(await tab.evaluate(() => location.hash), /instagram|facebook|douyin/);
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
    assert.match(await tab.locator('.m2-context-strip').innerText(), /0 creator entities/);
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
    await tab.waitForFunction(() => Array.from(document.querySelectorAll('.m2-person-name'))
      .some((node) => node.textContent === 'Deep Owner'));
    const deepFacts = tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Deep Owner' }).locator('.m2-person-facts');
    assert.match(await deepFacts.innerText(), /Current high-confidence source facts unavailable/);
    await tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Deep Owner' }).locator('[data-m2-select]').click();
    assert.equal(await tab.locator('.m2-work-card').count(), 4);

    await tab.locator('[data-m2-load-connected]').click();
    await tab.waitForFunction(() => document.body.textContent.includes('Deep work 6'));
    assert.equal(requests.at(-1).cursor, 'deep_next_1');
    await tab.waitForFunction(() => document.querySelectorAll('.m2-work-card').length === 6);
    assert.equal(await tab.locator('.m2-work-card').count(), 6);
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
      assert.equal(await tab.locator('[data-m2-filters]').count(), 1);
      assert.equal(await tab.locator('.m2-filterbar, .m2-category-row').count(), 0);
    } finally {
      await context.close();
    }
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
      await tab.locator('[data-m2-filters]').click();
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
          ['.m2-command-summary', 'body'], ['.m2-context-track span', 'body'], ['.m2-view-tabs button', 'body'],
          ['.m2-person-name', 'body'], ['.m2-person-field', 'body'], ['.m2-feed-card h3', '.m2-feed-card'],
          ['.m2-feed-byline small', '.m2-feed-card'], ['.m2-filter-button', '.m2-filter-button'],
          ['.m2-method p', 'body'], ['.backer-footer__link', '.backer-footer'],
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
      return button && /See all\s+(?:[1-9]\d{2,})/.test(button.textContent || '');
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
    assert.deepEqual(await tab.locator('#backerLandingCreatorFeed .mini-auth').allTextContents(), ['YouTube', 'Bilibili', 'Twitch']);
    await tab.locator('#backerLandingCreatorFeed [data-m2-landing-person]').first().click();
    await tab.waitForFunction(() => location.hash.includes('view=radar') && location.hash.includes('q='));
  } finally {
    await context.close();
  }
});

test('loopback legacy marketplace routes canonicalize publicly and keep the explicit archive local', async () => {
  discoveryMode = 'static-catalog';
  for (const route of ['#market', '?view=market']) {
    const { context, tab } = await page();
    try {
      await tab.goto(`${origin}/backerdemo.html${route}`);
      await tab.waitForSelector('.market2-shell');
      await tab.waitForFunction(() => location.hash.startsWith('#market2'));
      assert.doesNotMatch(await tab.evaluate(() => location.search), /(?:^|[?&])view=market(?:&|$)/);
      assert.equal(await tab.locator('.m2-local-archive[data-view="market-archive"]').count(), 1);
    } finally {
      await context.close();
    }
  }

  const { context, tab } = await page();
  try {
    await tab.goto(`${origin}/backerdemo.html#market-archive`);
    await tab.waitForSelector('#mktRoot');
    assert.match(await tab.evaluate(() => location.hash), /^#market-archive/);
    assert.equal(await tab.locator('.market2-shell').count(), 0);
  } finally {
    await context.close();
  }
});

test('legacy synthetic search asset and routes are absent from the public page', async () => {
  const html = await fs.readFile(path.join(ROOT, 'backerdemo.html'), 'utf8');
  assert.doesNotMatch(html, /js\/search-engine\.js/);
  assert.doesNotMatch(html, /data-view="search"/);
  assert.doesNotMatch(html, /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
  assert.match(html, /id="market2HeroSearch"/);
  assert.doesNotMatch(html, /css\/market\.css|js\/market-data\.js|js\/market\.js/);
  assert.doesNotMatch(html, /data-view="market"|href="[^"]*#market(?:[?"#])/);
  assert.ok((html.match(/data-view="market2"/g) || []).length >= 6);
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
