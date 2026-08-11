'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

test('Market2 V2.1 PRD freezes the requested product boundary before implementation', () => {
  const prd = read('docs/MARKETPLACE_MARKET2_V2_1_PRD.md');
  [
    '#market2',
    'backercreate.html',
    'Proof of Attention',
    'Milestones',
    'PK Market',
    'Creator Arena',
    'Creator Perps',
    'X',
    'YouTube',
    'Instagram',
    'GitHub',
    'discovery',
    'trade'
  ].forEach((term) => assert.match(prd, new RegExp(term, 'i'), `missing PRD term: ${term}`));
});

test('static launch snapshot contains real identities and native metric provenance without generated portraits', () => {
  const snapshot = json('data/market2-people.json');
  assert.equal(snapshot.schemaVersion, 2);
  assert.ok(Array.isArray(snapshot.people));
  assert.ok(snapshot.people.length >= 10);
  assert.ok(snapshot.metricCatalog && snapshot.nativeMetricSnapshots);

  const represented = new Set();
  snapshot.people.forEach((person) => {
    assert.ok(person.id && person.name && person.avatar);
    assert.match(person.avatar, /^https:\/\/(avatars\.githubusercontent\.com|github\.com)\//);
    assert.doesNotMatch(person.avatar, /(openai|dall-e|midjourney|stable.?diffusion|generated)/i);
    (person.platforms || []).forEach((platform) => represented.add(typeof platform === 'string' ? platform : platform.id));
  });
  ['x', 'youtube', 'instagram', 'github'].forEach((platform) => assert.ok(represented.has(platform), `missing ${platform}`));

  const metricRows = Object.values(snapshot.nativeMetricSnapshots)
    .flatMap((providers) => Object.values(providers || {}))
    .filter(Boolean);
  assert.ok(metricRows.length > 0);
  assert.match(JSON.stringify(metricRows), /observedAt|asOf/);
  assert.doesNotMatch(JSON.stringify(metricRows), /watchers_count/);
});

test('Market2 keeps the deep browse rail while centering people, work, evidence, and four instruments', () => {
  const source = read('js/market2.js');
  [
    'Trending',
    'Ending soon',
    'Most backed',
    'Risk watch',
    '24h',
    '7d',
    '30d',
    '90d',
    'Proof of Attention',
    'Create person-growth market',
    'Create content-growth market',
    'milestones',
    'pk_market',
    'creator_arena',
    'creator_perps',
    '/api/market2/people',
    'data/market2-people.json'
  ].forEach((term) => assert.match(source, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing Market2 affordance: ${term}`));
  assert.match(source, /PoaTerminal\.open/);
  assert.match(source, /permission.required|Permission required/i);
});

test('Market2 normalization surfaces observed GitHub values before permission placeholders', () => {
  const windowObject = {
    location: { href: 'https://example.test/backerdemo.html#market2' },
    BACKER_MARKET2_DATA: null,
    BackerMarket2Data: null
  };
  vm.runInNewContext(read('js/market2.js'), {
    window: windowObject,
    URL,
    URLSearchParams,
    Intl,
    Date,
    Number,
    String,
    Array,
    Object,
    Boolean,
    Math,
    RegExp,
    JSON,
    setTimeout,
    clearTimeout
  });
  const normalized = windowObject.BackerMarket2.normalize(json('data/market2-people.json'), 'static');
  const wes = normalized.people.find((person) => person.id === 'wes-bos');
  assert.ok(wes);
  const githubValues = wes.metrics.filter((metric) => metric.provider === 'github' && metric.value != null);
  assert.ok(githubValues.some((metric) => metric.key === 'followers' && metric.value === 35797));
  assert.ok(githubValues.some((metric) => metric.key === 'stargazers_count' && metric.value === 29232));
  assert.equal(normalized.people[0].evidence['7d'].providerRank, null);
});

test('separate builder stores a versioned draft and hands it to the full terminal without fake pricing', () => {
  const html = read('backercreate.html');
  const builder = read('js/market-builder.js');
  const detail = read('js/market-detail-page.js');
  assert.match(html, /id="marketBuilder"/);
  assert.match(builder, /backer_market_route_draft_v1:/);
  assert.match(builder, /backermarket\.html\?draft=/);
  assert.match(builder, /milestone/i);
  assert.match(builder, /pk/i);
  assert.match(builder, /Opening soon/i);
  assert.match(builder, /No price, orders, volume, or market-implied probability exists/i);
  assert.match(builder, /nativeMetricSnapshots/);
  assert.match(builder, /stargazers_count/);
  assert.match(builder, /subscribers_count/);
  assert.match(detail, /draft/i);
  assert.match(detail, /sessionStorage/);
  assert.match(detail, /OPENING_SOON/);
});

test('the position terminal requires a reviewed confirmation and opens a receipt after fill', () => {
  const terminal = read('js/poa-terminal.js');
  assert.match(terminal, /openOrderReview/);
  assert.match(terminal, /data-order-ack/);
  assert.match(terminal, /Confirm simulated order/);
  assert.match(terminal, /Maximum loss/);
  assert.match(terminal, /Settlement source/);
  assert.match(terminal, /openBetCard\(receiptIndex\)/);
});

test('provider secrets stay server-side and the public page uses honest access states', () => {
  const env = read('.env.example');
  ['X_BEARER_TOKEN', 'YOUTUBE_API_KEY', 'INSTAGRAM_ACCESS_TOKEN', 'GITHUB_TOKEN'].forEach((name) => assert.match(env, new RegExp(name)));

  const publicSources = [read('js/market2.js'), read('js/market-builder.js'), read('data/market2-people.json')].join('\n');
  assert.doesNotMatch(publicSources, /(X_BEARER_TOKEN|YOUTUBE_API_KEY|INSTAGRAM_ACCESS_TOKEN|GITHUB_TOKEN)\s*[:=]\s*['"][^'"]+/);
  assert.match(publicSources, /permission.required|Permission required/i);
});
