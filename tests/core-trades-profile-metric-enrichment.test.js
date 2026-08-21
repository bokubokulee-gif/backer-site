'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'enrich-trades-profile-metrics.mjs');
const SCRIPT_URL = pathToFileURL(SCRIPT_PATH).href;
const OBSERVED_AT = '2026-08-21T15:00:00.000Z';

function source() {
  return {
    catalog: {
      schemaVersion: 1,
      generatedAt: '2026-08-21T14:00:00.000Z',
      creators: [],
      contentRecords: [],
      metricObservations: [],
      platformIdentities: [
        {
          id: 'identity-github', creatorId: 'creator-github', provider: 'github', nativeId: '101',
          handle: 'octo-user', profileUrl: 'https://github.com/octo-user', accountType: 'user'
        },
        {
          id: 'identity-dev', creatorId: 'creator-dev', provider: 'dev', nativeId: 'dev-user',
          handle: 'dev-user', profileUrl: 'https://dev.to/dev-user'
        }
      ]
    },
    registry: {
      entries: [
        { creatorId: 'creator-github', identityId: 'identity-github', provider: 'github' },
        { creatorId: 'creator-dev', identityId: 'identity-dev', provider: 'dev' }
      ]
    }
  };
}

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get() { return null; } },
    async json() { return body; }
  };
}

function providerFetch({ githubType = 'User' } = {}) {
  return async (url, options) => {
    if (url.startsWith('https://api.github.com/users/')) {
      assert.equal(options.headers.Authorization, 'Bearer process-only-secret');
      return response({
        id: 101,
        login: 'octo-user',
        type: githubType,
        html_url: 'https://github.com/octo-user',
        followers: 17,
        public_repos: 9
      });
    }
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, 'https://dev.to/api/articles');
    assert.equal(parsed.searchParams.get('username'), 'dev-user');
    return response([
      { id: 1, user: { username: 'dev-user' } },
      { id: 2, user: { username: 'dev-user' } }
    ]);
  };
}

test('profile metric enrichment retains exact identity observations and no credential material', async () => {
  const { enrichProfileMetrics, GITHUB_PROFILE_METHOD, DEV_PROFILE_METHOD } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  const original = structuredClone(catalog);
  const result = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl: providerFetch(),
    concurrency: 2,
    minimumAcquiredAccounts: 2
  });
  assert.deepEqual(catalog, original, 'the source catalog must not be mutated before atomic replacement');
  assert.equal(result.report.acquiredAccounts, 2);
  assert.equal(result.report.observations, 3);
  assert.equal(result.report.failures, 0);
  assert.deepEqual(result.report.providerCounts.github.currentAttempt,
    { candidates: 1, acquiredAccounts: 1, failures: 0, failureReasons: {} });
  assert.deepEqual(result.report.providerCounts.github.published,
    { currentAccounts: 1, lastGoodAccounts: 0, totalAccounts: 1, observations: 2 });
  assert.deepEqual(result.report.providerCounts.dev.currentAttempt,
    { candidates: 1, acquiredAccounts: 1, failures: 0, failureReasons: {} });
  assert.deepEqual(result.report.providerCounts.dev.published,
    { currentAccounts: 1, lastGoodAccounts: 0, totalAccounts: 1, observations: 1 });
  assert.equal(result.catalog.acquisitionCheckpoints.tradesProfileMetrics.validatedIdentityMetricAccounts, 2);
  assert.equal('eligibleIdentityAccounts' in result.catalog.acquisitionCheckpoints.tradesProfileMetrics, false);
  const observations = result.catalog.metricObservations;
  assert.ok(observations.every((row) => row.entityType === 'identity' && row.observedAt === OBSERVED_AT));
  assert.deepEqual(observations.filter((row) => row.provider === 'github').map((row) => [row.metric, row.value]).sort(),
    [['followers', 17], ['public_repositories', 9]]);
  assert.deepEqual(observations.filter((row) => row.provider === 'dev').map((row) => [row.metric, row.value]),
    [['published_posts', 2]]);
  assert.ok(observations.some((row) => row.methodologyVersion === GITHUB_PROFILE_METHOD));
  assert.ok(observations.some((row) => row.methodologyVersion === DEV_PROFILE_METHOD));
  assert.doesNotMatch(JSON.stringify(result.catalog), /process-only-secret/);
});

test('profile metric enrichment rejects an authoritative GitHub Organization before replacement', async () => {
  const { enrichProfileMetrics } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  await assert.rejects(enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl: providerFetch({ githubType: 'Organization' }),
    concurrency: 2,
    minimumAcquiredAccounts: 2
  }), /Complete replacement gate failed/);
  assert.equal(catalog.metricObservations.length, 0);
});

test('DEV pagination exhausts later pages and deduplicates exact native article IDs', async () => {
  const { enrichProfileMetrics } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  let devPages = 0;
  const fetchImpl = async (url, options) => {
    if (url.startsWith('https://api.github.com/users/')) return providerFetch()(url, options);
    const page = Number(new URL(url).searchParams.get('page'));
    devPages += 1;
    if (page === 1) return response(Array.from({ length: 1000 }, (_, index) => ({
      id: index + 1,
      user: { username: 'dev-user' }
    })));
    return response([
      { id: 1000, user: { username: 'dev-user' } },
      { id: 1001, user: { username: 'dev-user' } }
    ]);
  };
  const result = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl,
    concurrency: 2,
    minimumAcquiredAccounts: 2
  });
  assert.equal(devPages, 2);
  const posts = result.catalog.metricObservations.find((row) => row.provider === 'dev');
  assert.equal(posts.metric, 'published_posts');
  assert.equal(posts.value, 1001);
});

test('controlled observation time makes repeated enrichment byte-identical', async () => {
  const { enrichProfileMetrics } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  const first = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl: providerFetch(),
    concurrency: 2,
    minimumAcquiredAccounts: 2
  });
  const second = await enrichProfileMetrics({
    catalog: first.catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl: providerFetch(),
    concurrency: 2,
    minimumAcquiredAccounts: 2
  });
  assert.equal(JSON.stringify(second.catalog), JSON.stringify(first.catalog));
  assert.deepEqual(Object.keys(second.report).filter((key) => key === 'schemaVersion'), ['schemaVersion']);
});

test('validated partial acquisition records failures and never synthesizes a missing account metric', async () => {
  const { enrichProfileMetrics, DEV_PROFILE_METHOD } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  const fetchImpl = async (url, options) => {
    if (url.startsWith('https://api.github.com/users/')) return providerFetch()(url, options);
    return response({ message: 'missing' }, 404);
  };
  const result = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl,
    concurrency: 2,
    minimumAcquiredAccounts: 1,
    minimumTotalIdentityAccounts: 1,
    requireComplete: false
  });
  const checkpoint = result.catalog.acquisitionCheckpoints.tradesProfileMetrics;
  assert.equal(checkpoint.state, 'partial');
  assert.equal(checkpoint.reasonCode, 'partial_account_profile_failure');
  assert.equal(checkpoint.providers.github.acquiredAccounts, 1);
  assert.equal(checkpoint.providers.github.failures, 0);
  assert.equal(checkpoint.providers.dev.candidates, 1);
  assert.equal(checkpoint.providers.dev.acquiredAccounts, 0);
  assert.equal(checkpoint.providers.dev.failures, 1);
  assert.equal(checkpoint.providers.dev.acquiredAccounts + checkpoint.providers.dev.failures,
    checkpoint.providers.dev.candidates);
  assert.deepEqual(checkpoint.providers.dev.failureReasons, { not_found: 1 });
  assert.deepEqual(checkpoint.providers.dev.currentAttempt,
    { candidates: 1, acquiredAccounts: 0, failures: 1, failureReasons: { not_found: 1 } });
  assert.deepEqual(checkpoint.providers.dev.published,
    { currentAccounts: 0, lastGoodAccounts: 0, totalAccounts: 0, observations: 0 });
  assert.equal(checkpoint.validatedIdentityMetricAccounts, 1);
  assert.equal('eligibleIdentityAccounts' in checkpoint, false);
  assert.deepEqual(result.report.failureReasons, { not_found: 1 });
  assert.equal(result.catalog.metricObservations.some((row) => row.methodologyVersion === DEV_PROFILE_METHOD), false);
  assert.equal(result.catalog.metricObservations.some((row) => row.entityId === 'identity-dev'), false);
});

test('unsupported provider selection fails closed before any request', async () => {
  const { enrichProfileMetrics } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  let requested = false;
  await assert.rejects(enrichProfileMetrics({
    catalog,
    registry,
    observedAt: OBSERVED_AT,
    fetchImpl: async () => { requested = true; return response([]); },
    minimumAcquiredAccounts: 1,
    providers: ['instagram']
  }), /Unsupported profile metric provider selection/);
  assert.equal(requested, false);
});

test('identity-native release count ignores provider-matching poison rows without the exact method and metric set', async () => {
  const { countIdentityNativeAccounts } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  catalog.metricObservations = registry.entries.map((entry, index) => ({
    id: `poison-${index}`,
    entityType: 'identity',
    entityId: entry.identityId,
    provider: entry.provider,
    metric: 'views',
    value: 999999,
    unit: 'count',
    observedAt: OBSERVED_AT,
    sourceUrl: catalog.platformIdentities.find((row) => row.id === entry.identityId).profileUrl,
    visibility: 'public',
    access: 'public_api',
    availability: 'available',
    methodologyVersion: 'unrelated-provider-row-v1'
  }));
  assert.equal(countIdentityNativeAccounts(catalog, registry), 0,
    'unrelated identity rows must not satisfy the combined Profile release gate');
});

test('CLI rejects the generated v4 eligibility output as an acquisition retry seed before any provider request', () => {
  const result = spawnSync(process.execPath, [SCRIPT_PATH], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      BACKER_DISCOVERY_CATALOG: path.join(ROOT, 'data', 'discovery-catalog.json'),
      BACKER_TRADES_ELIGIBILITY_SEED: path.join(ROOT, 'data', 'trades-eligible-accounts.json'),
      BACKER_PROFILE_METRICS_ALLOW_PARTIAL: '1',
      BACKER_PROFILE_METRICS_PROVIDERS: 'dev',
      BACKER_PROFILE_METRICS_MIN_ACCOUNTS: '1',
      BACKER_PROFILE_METRICS_MIN_TOTAL_ACCOUNTS: '1'
    }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use the stable target-seed schema/);
  assert.equal(result.stdout, '');
});

test('failed refresh retains a validated last-good row without counting it as current acquisition', async () => {
  const { enrichProfileMetrics, normalizeExistingSelection, DEV_PROFILE_METHOD } = await import(SCRIPT_URL);
  const { catalog, registry } = source();
  const first = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: 'process-only-secret',
    observedAt: OBSERVED_AT,
    fetchImpl: providerFetch(),
    minimumAcquiredAccounts: 2
  });
  const prior = first.catalog.metricObservations.find((row) => row.methodologyVersion === DEV_PROFILE_METHOD);
  const later = '2026-08-22T15:00:00.000Z';
  const refreshed = await enrichProfileMetrics({
    catalog: first.catalog,
    registry,
    observedAt: later,
    fetchImpl: async () => response({ message: 'missing' }, 404),
    minimumAcquiredAccounts: 1,
    minimumTotalIdentityAccounts: 1,
    requireComplete: false,
    providers: ['dev']
  });
  const retained = refreshed.catalog.metricObservations.find((row) => row.methodologyVersion === DEV_PROFILE_METHOD);
  const bucket = refreshed.catalog.acquisitionCheckpoints.tradesProfileMetrics.providers.dev;
  assert.equal(refreshed.report.acquiredAccounts, 0);
  assert.equal(refreshed.report.publishedAccounts, 1);
  assert.equal(refreshed.report.lastGoodAccounts, 1);
  assert.deepEqual(bucket.currentAttempt,
    { candidates: 1, acquiredAccounts: 0, failures: 1, failureReasons: { not_found: 1 } });
  assert.deepEqual(bucket.published,
    { currentAccounts: 0, lastGoodAccounts: 1, totalAccounts: 1, observations: 1 });
  assert.equal(retained.id, prior.id);
  assert.equal(retained.value, prior.value);
  assert.equal(retained.sourceUrl, prior.sourceUrl);
  assert.equal(retained.observedAt, OBSERVED_AT);
  assert.equal(retained.freshness.state, 'last_good');
  assert.equal(refreshed.catalog.generatedAt, later);
  assert.equal(normalizeExistingSelection(
    refreshed.catalog,
    { entries: registry.entries.filter((row) => row.provider === 'dev') },
    new Set(['dev']),
    new Set(),
    1
  ), null, 'complete reuse must not promote last-good evidence to current/exhausted');
});
