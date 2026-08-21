'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const Catalog = require('../js/discovery-catalog-client');
const Store = require('../js/market-draft-store');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function builderHarness(hash, catalog, sharedStore) {
  const handlers = {};
  const root = {
    innerHTML: '',
    addEventListener(type, handler) { handlers[type] = handler; },
    setAttribute() {},
    contains() { return true; },
    querySelector() { return null; }
  };
  const local = Store.memoryStorage();
  const draftStore = sharedStore || Store.create({ localStorage: local, sessionStorage: Store.memoryStorage() });
  const windowObject = {
    location: { href: 'https://example.test/backercreate.html' + hash, search: '', hash },
    BackerDiscoveryCatalog: { load: () => Promise.resolve(catalog), workById: Catalog.workById },
    BackerMarketDraftStore: draftStore,
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000001' },
    requestAnimationFrame(callback) { callback(); },
    scrollTo() {},
    dispatchEvent() {}
  };
  const documentObject = {
    readyState: 'complete',
    getElementById(id) { return id === 'marketBuilder' ? root : null; },
    addEventListener() {}
  };
  vm.runInNewContext(read('js/market-builder.js'), {
    window: windowObject,
    document: documentObject,
    URL,
    URLSearchParams,
    Intl,
    Date,
    Number,
    String,
    Array,
    Object,
    Math,
    RegExp,
    JSON,
    Promise,
    isFinite,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; }
  });
  return {
    root,
    store: draftStore,
    async ready() { await new Promise((resolve) => setImmediate(resolve)); await new Promise((resolve) => setImmediate(resolve)); },
    click(action, value) {
      const button = { dataset: { action, value: value || '' }, disabled: false };
      handlers.click({ target: { closest: () => button }, preventDefault() {} });
    },
    input(field, value) {
      handlers.input({ target: { dataset: { field }, value: String(value), tagName: 'INPUT' } });
    }
  };
}

test('proposal composer loads the retained catalog and v2 store before the builder', () => {
  const html = read('backercreate.html');
  const catalog = html.indexOf('js/discovery-catalog-client.js');
  const store = html.indexOf('js/market-draft-store.js');
  const builder = html.indexOf('js/market-builder.js');
  const dock = html.indexOf('js/backer-dock.js');
  assert.ok(catalog >= 0 && store > catalog && builder > store);
  assert.ok(dock > builder, 'shared dock mount and script must remain on the builder page');
  assert.doesNotMatch(html, /js\/market2-data\.js/);
  assert.match(html, /Draft a growth bet/);
  assert.match(html, /Return to Discovery/);
});

test('builder is subject-first, fails closed, and saves only a local v2 proposal', () => {
  const source = read('js/market-builder.js');
  ['Subject', 'Future claim', 'Measurement cutoff', 'How resolved', 'Review proposal'].forEach((label) => assert.match(source, new RegExp(label, 'i')));
  assert.match(source, /BackerDiscoveryCatalog\.load/);
  assert.match(source, /BackerDiscoveryCatalog\.workById/);
  assert.match(source, /Subject no longer in the retained catalog/);
  assert.doesNotMatch(source, /bundled_fallback|BACKER_MARKET2_DATA|BackerMarket2Data/);
  assert.match(source, /schemaVersion:\s*2/);
  assert.match(source, /status:\s*'local_draft'/);
  assert.match(source, /approvalStatus:\s*'discovery_proposal'/);
  assert.match(source, /BackerMarketDraftStore\.save\(draft\)/);
  assert.doesNotMatch(source, /sessionStorage\.setItem/);
  assert.match(source, /GROWS_TO_TARGET/);
  assert.match(source, /DOES_NOT_REACH_TARGET/);
  assert.doesNotMatch(source, /Yes: reaches target|No: misses target/);
  assert.doesNotMatch(source, /Create simulated market|data-field="stake"|function orderReview/);
  assert.match(source, /observation:\s*observed\s*\?/);
  assert.match(source, /readiness:\s*retained\s*\?\s*'retained_observation'\s*:\s*'unverified_idea'/);
  assert.match(source, /backerdemo\.html#trades\?view=proposals&proposal=/);
  assert.match(source, /backermarket\.html\?draft=.*&source=trades/);
});

test('proposal preview reads through the validated store and returns to Trades', () => {
  const html = read('backermarket.html');
  const detail = read('js/market-detail-page.js');
  const store = html.indexOf('js/market-draft-store.js');
  const page = html.indexOf('js/market-detail-page.js');
  const dock = html.indexOf('js/backer-dock.js');
  assert.ok(store >= 0 && page > store);
  assert.ok(dock > page, 'shared dock mount and script must remain on the proposal page');
  assert.match(html, /backerdemo\.html#trades/);
  assert.match(detail, /BackerMarketDraftStore\.read\(id\)/);
  assert.doesNotMatch(detail, /backer_market_route_draft_v1:/);
  assert.doesNotMatch(detail, /sessionStorage\.getItem\(DRAFT_STORAGE_PREFIX/);
  assert.match(detail, /version:\s*'draft-v2'/);
  assert.match(detail, /approved:\s*false,\s*discovery:\s*true/);
  assert.match(detail, /HEAD-TO-HEAD GROWTH PROPOSAL/);
  assert.match(detail, /GROWTH MILESTONE PROPOSAL/);
});

test('an exact retained work completes the five-step flow and stores its exact id', async () => {
  const raw = JSON.parse(read('data/discovery-catalog.json'));
  const catalog = Catalog.normalize(raw);
  const person = catalog.people.find((row) => row.content.length > 0);
  const work = person.content[person.content.length - 1];
  const hash = `#draft?scope=content&person=${encodeURIComponent(person.id)}&content=${encodeURIComponent(work.id)}&source=discovery`;
  const harness = builderHarness(hash, catalog);
  await harness.ready();
  harness.click('next');
  harness.input('baseline', 100);
  harness.input('target', 200);
  harness.click('next');
  harness.click('next');
  harness.click('next');
  harness.click('save');
  const proposals = harness.store.list();
  assert.equal(proposals.length, 1);
  const draft = proposals[0].draft;
  assert.equal(draft.subject.person.id, person.id);
  assert.equal(draft.subject.content.id, work.id);
  assert.equal(draft.schemaVersion, 2);
  assert.equal(draft.status, 'local_draft');
  assert.equal(draft.market.quote, null);
  assert.match(harness.root.innerHTML, /View in Trades/);
});

test('builder carries the selected retained observation id and provenance without rewriting it', async () => {
  const catalog = Catalog.normalize(JSON.parse(read('data/discovery-catalog.json')));
  const person = catalog.people.find((row) => row.content.some((work) => work.publicCounts.length > 0));
  const work = person.content.find((row) => row.publicCounts.length > 0);
  const observation = work.publicCounts[0];
  const hash = `#draft?scope=content&person=${encodeURIComponent(person.id)}&content=${encodeURIComponent(work.id)}&source=discovery`;
  const harness = builderHarness(hash, catalog);
  await harness.ready();
  harness.click('next');
  harness.input('target', Number(observation.value) + 1);
  harness.click('next');
  harness.click('next');
  harness.click('next');
  harness.click('save');
  const draft = harness.store.list()[0].draft;
  assert.equal(draft.resolution.readiness, 'retained_observation');
  assert.equal(draft.resolution.observation.id, observation.id);
  assert.equal(draft.resolution.observation.entityId, work.id);
  assert.equal(draft.resolution.observation.provider, observation.provider);
  assert.equal(draft.resolution.observation.metric, observation.metric);
  assert.equal(draft.resolution.observation.sourceUrl, observation.sourceUrl);
  assert.equal(draft.resolution.baseline.provenance, 'retained_source_observation');
});

test('edit route reloads the same exact subject and updates one v2 proposal in place', async () => {
  const catalog = Catalog.normalize(JSON.parse(read('data/discovery-catalog.json')));
  const person = catalog.people.find((row) => row.content.length > 0);
  const work = person.content[0];
  const sharedStore = Store.create({ localStorage: Store.memoryStorage(), sessionStorage: Store.memoryStorage() });
  const first = builderHarness(`#draft?scope=content&person=${encodeURIComponent(person.id)}&content=${encodeURIComponent(work.id)}&source=discovery`, catalog, sharedStore);
  await first.ready();
  first.click('next');
  first.input('baseline', 100);
  first.input('target', 200);
  first.click('next');
  first.click('next');
  first.click('next');
  first.click('save');
  const original = sharedStore.list()[0].draft;

  const edit = builderHarness(`#draft?edit=${encodeURIComponent(original.draftId)}&source=trades`, catalog, sharedStore);
  await edit.ready();
  edit.click('next');
  edit.input('target', 300);
  edit.click('next');
  edit.click('next');
  edit.click('next');
  edit.click('save');
  const proposals = sharedStore.list();
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].draft.draftId, original.draftId);
  assert.equal(proposals[0].draft.createdAt, original.createdAt);
  assert.equal(proposals[0].draft.subject.person.id, person.id);
  assert.equal(proposals[0].draft.subject.content.id, work.id);
  assert.equal(proposals[0].draft.resolution.target.value, 300);
});

test('a missing explicit subject hard-errors instead of selecting another creator', async () => {
  const catalog = Catalog.normalize(JSON.parse(read('data/discovery-catalog.json')));
  const harness = builderHarness('#draft?scope=person&person=creator_missing_exact&source=discovery', catalog);
  await harness.ready();
  assert.equal(harness.store.list().length, 0);
  assert.match(harness.root.innerHTML, /Subject no longer in the retained catalog/);
  assert.match(harness.root.innerHTML, /stopped instead of substituting another profile or work/);
});

test('opening the composer without a discovery subject does not pick the first catalog row', async () => {
  const catalog = Catalog.normalize(JSON.parse(read('data/discovery-catalog.json')));
  const harness = builderHarness('#draft?source=discovery', catalog);
  await harness.ready();
  assert.equal(harness.store.list().length, 0);
  assert.match(harness.root.innerHTML, /No discovery subject was specified/);
});
