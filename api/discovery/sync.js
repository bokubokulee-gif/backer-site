'use strict';

const { safeEqualText } = require('../_lib/crypto');
const { requireSecret } = require('../_lib/env');
const { HttpError } = require('../_lib/errors');
const { headerValue } = require('../_lib/ip');
const { assertMethod, createHandler, noStoreHeaders, sendJson } = require('../_lib/http');
const { normalizeRanking } = require('../_lib/discovery-rank');
const { persistDiscoveryResults, readDiscoveryCache } = require('../_lib/discovery-repository');
const { runDiscoveryProviders } = require('../../lib/discovery/registry');
const { normalizeScopes, publicProviderMap } = require('./search');

const DEFAULT_SYNC_PROVIDERS = Object.freeze(['github', 'dev', 'medium', 'substack', 'rss']);

function configuredProviders(environment) {
  const supplied = String(environment.BACKER_DISCOVERY_SYNC_PROVIDERS || '')
    .split(',').map((item) => item.trim()).filter(Boolean);
  return normalizeScopes(supplied.length ? supplied : DEFAULT_SYNC_PROVIDERS);
}

function createDiscoverySyncHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const environment = deps.env || process.env;
    const secret = deps.cronSecret || requireSecret('CRON_SECRET', 16);
    const supplied = headerValue(req && req.headers, 'authorization');
    if (!safeEqualText(supplied, `Bearer ${secret}`)) {
      throw new HttpError(401, 'Unauthorized', 'invalid_cron_secret');
    }
    if (!environment.DATABASE_URL && !deps.persistDiscoveryResults) {
      throw new HttpError(503, 'Service unavailable', 'missing_database_url');
    }
    const clock = deps.now || (() => new Date());
    const now = clock();
    const providerScopes = deps.providerScopes || configuredProviders(environment);
    const previous = await (deps.readDiscoveryCache || readDiscoveryCache)(providerScopes);
    const ranking = normalizeRanking({
      mode: 'viral',
      windowDays: Math.max(1, Math.min(365, Number.parseInt(environment.BACKER_DISCOVERY_SYNC_WINDOW_DAYS, 10) || 30))
    });
    const live = await (deps.runDiscoveryProviders || runDiscoveryProviders)({
      mode: 'trending',
      query: '',
      providerScopes,
      ranking,
      filters: { contentTypes: [], publishedAfter: null, minimum: {} },
      env: environment,
      fetch: deps.fetch || global.fetch,
      lookup: deps.lookup,
      now: clock,
      timeoutMs: Number(environment.BACKER_DISCOVERY_PROVIDER_TIMEOUT_MS) || 8_000,
      pageBudget: Math.max(1, Math.min(4, Number.parseInt(environment.BACKER_DISCOVERY_SYNC_PAGE_BUDGET, 10) || 2)),
      providerLimit: Math.max(10, Math.min(100, Number.parseInt(environment.BACKER_DISCOVERY_SYNC_PAGE_SIZE, 10) || 50)),
      providerCursors: previous.providerCursors,
      adapters: deps.adapters
    });
    const persisted = await (deps.persistDiscoveryResults || persistDiscoveryResults)(live, {
      providerScopes,
      now,
      withSession: deps.withSession
    });
    if (persisted.state === 'busy') {
      sendJson(res, 202, { ok: true, state: 'busy', persisted: false }, noStoreHeaders());
      return;
    }
    sendJson(res, 200, {
      ok: true,
      generatedAt: now.toISOString(),
      state: persisted.state,
      persisted: persisted.persisted === true,
      counts: persisted.counts,
      providers: publicProviderMap(persisted.providerRuns || [])
    }, noStoreHeaders({ 'X-Content-Type-Options': 'nosniff' }));
  }, 'discovery-sync');
}

module.exports = createDiscoverySyncHandler();
module.exports.configuredProviders = configuredProviders;
module.exports.createDiscoverySyncHandler = createDiscoverySyncHandler;
