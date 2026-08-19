'use strict';

const { dedupeDiscoveryBundle } = require('../../api/_lib/discovery-model');
const { runProvider } = require('../../api/_lib/discovery-provider');
const { dev } = require('./providers/dev');
const { medium, rss, substack } = require('./providers/feeds');
const { github } = require('./providers/github');
const { linkedin } = require('./providers/linkedin');
const { facebook, instagram } = require('./providers/meta');
const { twitch } = require('./providers/twitch');
const { x } = require('./providers/x');
const { youtube } = require('./providers/youtube');

const ADAPTERS = Object.freeze({
  github,
  youtube,
  twitch,
  dev,
  medium,
  substack,
  rss,
  x,
  facebook,
  instagram,
  linkedin
});

async function runDiscoveryProviders(options) {
  const adapters = options.adapters || ADAPTERS;
  const now = options.now || (() => new Date());
  const results = await Promise.all(options.providerScopes.map((provider) => runProvider(adapters[provider], {
    mode: options.mode,
    query: options.query,
    ranking: options.ranking,
    filters: options.filters,
    env: options.env || process.env,
    fetch: options.fetch || global.fetch,
    lookup: options.lookup,
    now,
    timeoutMs: options.timeoutMs,
    pageBudget: options.pageBudget,
    providerLimit: options.providerLimit,
    providerCursor: options.providerCursors && options.providerCursors[provider]
  })));
  const bundle = dedupeDiscoveryBundle({
    creators: results.flatMap((result) => result.creators),
    platformIdentities: results.flatMap((result) => result.platformIdentities),
    contentRecords: results.flatMap((result) => result.contentRecords),
    metricObservations: results.flatMap((result) => result.metricObservations)
  });
  return Object.assign(bundle, {
    providerRuns: results.map((result) => result.providerRun).filter(Boolean),
    hasMore: results.some((result) => result.hasMore),
    providerCursors: Object.fromEntries(results
      .filter((result) => result.internalNextCursor)
      .map((result) => [result.providerRun.provider, result.internalNextCursor]))
  });
}

module.exports = { ADAPTERS, runDiscoveryProviders };
