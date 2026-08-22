const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const search = require('../js/search-engine.js');
const trades = require('../js/trades-catalog-model.js');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/discovery-catalog.json'), 'utf8'));
const reviewRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data/trades-eligible-accounts.json'), 'utf8'));
const tradeModel = trades.build(catalog, {
  reviewRegistry,
  simulationBucket: '2026-08-21T00:00:00.000Z'
});

test('Backer AI search indexes only retained Discovery creator and work records', () => {
  const index = search.__test.buildIndex(catalog);
  assert.ok(index.profiles.length >= 1000, 'retained creator catalog stays available to Search');
  assert.ok(index.works.length >= 1000, 'retained original-work catalog stays available to Search');
  assert.ok(index.profiles.every((row) => catalog.creators.some((creator) => creator.id === row.id)));
  assert.ok(index.works.every((row) => catalog.contentRecords.some((work) => work.id === row.id)));
  assert.ok(index.profiles.every((row) => /^creator_/.test(row.id)));
  assert.ok(index.works.every((row) => /^content_/.test(row.id)));
});

test('natural-language search returns exact retained names and titles without filling gaps', () => {
  const index = search.__test.buildIndex(catalog);
  const profile = index.profiles.find((row) => row.name.length > 3);
  const work = index.works.find((row) => row.name.length > 12);
  assert.ok(profile);
  assert.ok(work);
  const selected = new Set(index.providers);
  assert.equal(search.__test.searchIndex(index, profile.name, selected).profiles[0].id, profile.id);
  assert.equal(search.__test.searchIndex(index, work.name, selected).works[0].id, work.id);
  const impossible = search.__test.searchIndex(index, 'zzzz-no-retained-record-zzzz', selected);
  assert.equal(impossible.profiles.length + impossible.works.length, 0);
});

test('provider controls scope both profile and work results to retained sources', () => {
  const index = search.__test.buildIndex(catalog);
  const github = search.__test.searchIndex(index, '', new Set(['github']));
  assert.ok(github.profiles.length > 0);
  assert.ok(github.works.length > 0);
  assert.ok(github.profiles.every((row) => row.providers.includes('github')));
  assert.ok(github.works.every((row) => row.provider === 'github'));
});

test('Search actions preserve exact retained IDs and gate Trades to the current eligible registry', () => {
  const index = search.__test.buildIndex(catalog);
  const eligibility = search.__test.buildTradeEligibility(tradeModel);
  assert.equal(search.__test.CATALOG_URL, trades.CATALOG_URL, 'Search and Trades must use the same retained catalog');
  assert.equal(tradeModel.source, search.__test.CATALOG_URL);

  const eligibleProfile = index.profiles.find((row) => eligibility.profiles.has(row.id));
  const eligibleWork = index.works.find((row) => eligibility.works.has(row.id));
  const ineligibleProfile = index.profiles.find((row) => !eligibility.profiles.has(row.id));
  const ineligibleWork = index.works.find((row) => !eligibility.works.has(row.id));
  assert.ok(eligibleProfile && eligibleWork && ineligibleProfile && ineligibleWork);

  assert.equal(
    search.__test.tradeHref(eligibleProfile, eligibility),
    `backerdemo.html#trades?view=profiles&subject=${encodeURIComponent(eligibleProfile.id)}`
  );
  assert.equal(
    search.__test.tradeHref(eligibleWork, eligibility),
    `backerdemo.html#trades?view=contents&subject=${encodeURIComponent(eligibleWork.id)}`
  );
  assert.equal(search.__test.tradeHref(ineligibleProfile, eligibility), '');
  assert.equal(search.__test.tradeHref(ineligibleWork, eligibility), '');

  const profileCard = search.__test.resultCard(eligibleProfile, eligibility);
  assert.ok(profileCard.includes(`data-search-subject="${eligibleProfile.id}"`));
  assert.ok(profileCard.includes(`href="backerdemo.html#market2?view=radar&amp;person=${eligibleProfile.creatorId}"`));
  assert.ok(profileCard.includes(`href="backerdemo.html#trades?view=profiles&amp;subject=${eligibleProfile.id}"`));
  assert.match(profileCard, /data-search-action="source"[^>]+target="_blank"/);
  assert.match(search.__test.resultCard({
    ...eligibleProfile,
    metric: { ...eligibleProfile.metric, freshness: { state: 'last_good' } }
  }, eligibility), /Last good · observed/,
  'Search must disclose a retained refresh-failure metric instead of presenting it as current');

  const workCard = search.__test.resultCard(eligibleWork, eligibility);
  assert.ok(workCard.includes(`data-search-subject="${eligibleWork.id}"`));
  assert.ok(workCard.includes(`href="backerdemo.html#market2?view=radar&amp;person=${eligibleWork.creatorId}&amp;work=${eligibleWork.id}"`));
  assert.ok(workCard.includes(`href="backerdemo.html#trades?view=contents&amp;subject=${eligibleWork.id}"`));
  assert.match(workCard, /data-search-action="source"[^>]+target="_blank"/);

  assert.doesNotMatch(search.__test.resultCard(ineligibleProfile, eligibility), /data-search-action="trade"/);
  assert.doesNotMatch(search.__test.resultCard(ineligibleWork, eligibility), /data-search-action="trade"/);
});

test('homepage hero form and suggestions enter canonical Search rather than Discovery', () => {
  const market2 = fs.readFileSync(path.join(root, 'js/market2.js'), 'utf8');
  assert.match(market2, /function openSearchQuery\(query\)/);
  assert.match(market2, /openSearchQuery\(input && input\.value \|\| 'creators gaining attention'\)/);
  assert.match(market2, /openSearchQuery\(item\.getAttribute\('data-q'\)\)/);
  assert.match(market2, /location\.hash = '#search'/);
});

test('Discovery evidence dimensions preserve the last-good freshness disclosure', () => {
  const market2 = fs.readFileSync(path.join(root, 'js/market2.js'), 'utf8');
  assert.match(market2, /metricFreshness === 'last_good' \? 'Last good'/);
});

test('missing Search engine fails closed without fixture or synthetic creator results', () => {
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  assert.match(app, /data-search-state="asset-error"/);
  assert.match(app, /No fallback profiles, works, or metrics were substituted/);
  assert.doesNotMatch(app, /const SYN\s*=|function rankCreators\(|function runAgent\(/);
  assert.doesNotMatch(app, /B\.creators\.map\(c =>/);
});

test('historical Market2 Search bookmark migrates narrowly to canonical Search', () => {
  const market2 = fs.readFileSync(path.join(root, 'js/market2.js'), 'utf8');
  assert.match(market2, /legacyFocusParams\.get\('focus'\) === 'search'/);
  assert.match(market2, /canonicalSearchHash = '#search'/);
  assert.doesNotMatch(market2, /legacyFocusParams\.has\('focus'\)/);
});

test('minimized dock orb shares drag handling and suppresses restore after a real drag', () => {
  const dock = fs.readFileSync(path.join(root, 'js/backer-dock.js'), 'utf8');
  assert.match(dock, /\[handle, restore\]\.forEach/);
  assert.match(dock, /control\.__suppressClick = true/);
  assert.match(dock, /if \(restore\.__suppressClick \|\| dock\.classList\.contains\('is-dragging'\)\) return/);
});

test('Search motion and initial controls honor shared dock layout state', () => {
  const css = fs.readFileSync(path.join(root, 'css/search.css'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  assert.match(css, /\.sx-orbit-ring\.is-reverse,[\s\S]*?\.sx-orbit-ring\.is-reverse \.sx-app-icon\{animation-name:none!important;animation-duration:0s!important\}/);
  assert.match(css, /var\(--backer-dock-clearance-bottom,0px\)/);
  assert.match(css, /var\(--backer-dock-clearance-left,0px\)/);
  assert.match(css, /var\(--backer-dock-clearance-right,0px\)/);
  assert.match(shell, /--bd-top-clearance:95px/);
});

test('public page and shared dock restore the dedicated Backer AI route', () => {
  const html = fs.readFileSync(path.join(root, 'backerdemo.html'), 'utf8');
  const dock = fs.readFileSync(path.join(root, 'js/backer-dock.js'), 'utf8');
  const engine = fs.readFileSync(path.join(root, 'js/search-engine.js'), 'utf8');
  const artifact = fs.readFileSync(path.join(root, 'scripts/build-pages-artifact.mjs'), 'utf8');
  assert.match(html, /js\/search-engine\.js\?v=20260821-account-metrics-1/);
  assert.match(html, /href="backerdemo\.html#search" data-view="search">AI Search/);
  assert.match(html, /01 · AI Search Agent[\s\S]*?<article class="surface reveal" data-view="search"|<article class="surface reveal" data-view="search">[\s\S]*?01 · AI Search Agent/);
  assert.match(dock, /linkHTML\('search', 'backerdemo\.html#search'/);
  assert.doesNotMatch(dock, /#market2\?focus=search/);
  assert.match(engine, /Backer AI/);
  assert.match(engine, /sx-orbit-ring/);
  assert.match(engine, /data\/discovery-catalog\.json/);
  assert.doesNotMatch(engine, /function buildCatalog|mulberry32|externalId:\s*'sim-|cat_demo_/);
  assert.match(artifact, /'js\/search-engine\.js'/);
});

test('every changed public Search asset is allowlisted and uses its current cache key', () => {
  const versions = {
    'css/styles.css': '20260821-2',
    'css/backer-dock.css': '20260821-2',
    'css/market.css': '20260821-account-metrics-1',
    'css/market2.css': '20260821-account-metrics-1',
    'css/search.css': '20260821-account-metrics-1',
    'js/app.js': '20260822-archive-1',
    'js/backer-dock.js': '20260822-archive-1',
    'js/market2.js': '20260821-account-metrics-1',
    'js/search-engine.js': '20260821-account-metrics-1',
    'js/trades-catalog-model.js': '20260821-account-metrics-1',
    'js/site-menu.js': '20260821-trades-1'
  };
  const artifact = fs.readFileSync(path.join(root, 'scripts/build-pages-artifact.mjs'), 'utf8');
  const pages = fs.readdirSync(root).filter((file) => file.endsWith('.html'));

  for (const [asset, version] of Object.entries(versions)) {
    assert.match(artifact, new RegExp(`['"]${asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`), `${asset} must ship in the Pages artifact`);
    let references = 0;
    for (const page of pages) {
      const source = fs.readFileSync(path.join(root, page), 'utf8');
      const expression = new RegExp(`${asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=([^"']+)`, 'g');
      for (const match of source.matchAll(expression)) {
        references += 1;
        assert.equal(match[1], version, `${page} must cache-bust ${asset}`);
      }
    }
    assert.ok(references > 0, `${asset} must have at least one public HTML reference`);
  }
});
