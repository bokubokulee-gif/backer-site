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
        { entityType: 'content', entityId: contentId, provider: 'youtube', metricKey: 'likes', nativeMetricName: 'Likes', rawValue: pageTwo ? 2300 : 23000, absoluteDelta: pageTwo ? 300 : 4100, observedAt: '2026-08-19T02:00:00Z', sourceUrl: contentUrl, availability: 'available', methodologyVersion: 'youtube-data-api-v3-videos-v1', freshness: { state: 'fresh', expiresAt: '2026-09-18T02:00:00Z' }, confidence: { level: 'high', basis: 'direct_official_api_field' } },
        { entityType: 'content', entityId: contentId, provider: 'youtube', metricKey: 'word_count', nativeMetricName: 'Word count', rawValue: 999999, observedAt: '2026-08-19T02:00:00Z', sourceUrl: contentUrl, availability: 'available', methodologyVersion: 'unreviewed-text-estimate-v1', freshness: { state: 'fresh' }, confidence: { level: 'unassessed', basis: 'unreviewed' } }
      ]
    },
    rankings: [{ personId, rank: pageTwo ? 2 : 1 }],
    counts: {
      responsePage: { scope: 'response_page', creatorEntities: 1, linkedPlatformIdentities: 1, uniqueWorks: 1, sourceRecords: 1, evidenceObservations: 3 },
      matchedSnapshot: { scope: 'live_augmentation_matched_snapshot', creatorEntities: 2, linkedPlatformIdentities: 2, uniqueWorks: 2, sourceRecords: 2, evidenceObservations: 6 }
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
    assert.deepEqual(requests[0].providerScopes, ['x', 'github', 'youtube', 'facebook', 'instagram', 'linkedin', 'twitch', 'medium', 'dev', 'substack', 'rss']);
    assert.deepEqual(await tab.locator('[data-m2-platform]').allTextContents(), ['X', 'GitHub', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn', 'Twitch', 'Medium', 'DEV', 'Substack', 'RSS']);
    const catalogStrip = await tab.locator('.m2-context-strip').innerText();
    assert.match(catalogStrip, /creator entities/);
    assert.match(catalogStrip, /linked platform identities/);
    assert.match(catalogStrip, /unique works/);
    assert.match(catalogStrip, /source records/);
    assert.match(catalogStrip, /evidence observations/);
    assert.match(catalogStrip, /Loaded Backer catalog/);
    const sourceRail = await tab.locator('.m2-source-rail').innerText();
    for (const label of ['Creator entities', 'Linked identities', 'Unique works', 'Source records', 'Evidence observations']) {
      assert.match(sourceRail, new RegExp(label));
    }
    assert.match(sourceRail, /not estimates of the internet/);
    for (const provider of ['X', 'GitHub', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn', 'Twitch', 'Medium', 'DEV', 'Substack', 'RSS']) {
      assert.match(sourceRail, new RegExp(`\\b${provider}\\b`));
    }
    assert.match(sourceRail, /Facebook[\s\S]*Unavailable/);
    assert.equal(await tab.locator('.m2-desktop-people .m2-person-row').count(), 32);
    assert.equal(await tab.locator('.m2-feed-card').count(), 12);
    assert.match(await tab.locator('.m2-catalog-feed').innerText(), /real source records/i);
    const initialContentProviders = await tab.locator('.m2-feed-byline small').allTextContents();
    for (const provider of ['YouTube', 'GitHub', 'DEV', 'Medium', 'Substack']) {
      assert.ok(initialContentProviders.filter((label) => label.startsWith(provider)).length >= 2,
        `expected at least two ${provider} records in the initial source-diverse feed`);
    }
    assert.doesNotMatch(await tab.locator('.market2-shell').innerText(), /Jeff Delaney|ThePrimeagen|Theo Browne|Wes Bos/);
    assert.equal(await tab.locator('[data-m2-create]').count(), 0);
    const neonFacts = tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Neon Byte' }).locator('.m2-person-facts');
    assert.match(await neonFacts.innerText(), /Subscribers[\s\S]*Likes/);
    assert.doesNotMatch(await neonFacts.innerText(), /Word count|unavailable/i);

    await tab.locator('.m2-desktop-people .m2-person-row', { hasText: 'Neon Byte' }).locator('[data-m2-select]').click();
    assert.equal(await tab.locator('.m2-proof-dimension').count(), 5);
    assert.match(await tab.locator('.m2-proof-callout').innerText(), /Reach[\s\S]*Traction[\s\S]*Momentum[\s\S]*Coverage[\s\S]*Confidence/i);
    assert.match(await tab.locator('.m2-proof-callout').innerText(), /48\.2K[\s\S]*23K/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /23K Likes/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /1 source record · 1 unique work/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /Published Aug 18, 2026/);
    assert.match(await tab.locator('.m2-work-card').first().innerText(), /Fresh|Recent snapshot/);
    assert.equal(await tab.locator('.m2-ticket').count(), 0);
    assert.equal(await tab.locator('[data-m2-create]').count(), 0);
    assert.match(await tab.locator('.m2-research-boundary').innerText(), /No execution/);

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

test('Market2 stays within 320px, 390px, and 430px mobile viewports', async () => {
  discoveryMode = 'connected';
  requests = [];
  for (const width of [320, 390, 430]) {
    const { context, tab } = await page({ width, height: 900 });
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
    assert.deepEqual(await tab.locator('#backerLandingCreatorFeed .mini-auth').allTextContents(), ['YouTube', 'GitHub', 'DEV']);
    await tab.locator('#backerLandingCreatorFeed [data-m2-landing-person]').first().click();
    await tab.waitForFunction(() => location.hash.includes('view=radar') && location.hash.includes('q='));
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
