#!/usr/bin/env node

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildProfileMetricTargets } from './generate-trades-eligibility.mjs';

const require = createRequire(import.meta.url);
const { createMetricObservation } = require('../api/_lib/discovery-model.js');

export const PROFILE_METRIC_ENRICHMENT_SCHEMA = 'backer-trades-profile-metrics-enrichment-v1';
export const PROFILE_METRIC_TARGET_SCHEMA = 'backer-trades-profile-metric-targets-v1';
export const GITHUB_PROFILE_METHOD = 'github-rest-v3-user-profile-v1';
export const DEV_PROFILE_METHOD = 'forem-api-v1-public-user-articles-v1';

const DEFAULT_CATALOG = new URL('../data/discovery-catalog.json', import.meta.url);
const USER_AGENT = 'BackerDiscovery/1.0 (+https://bokubokulee-gif.github.io/backer-site/)';
const DEV_PAGE_SIZE = 1000;
const MAX_DEV_PAGES = 100;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const PROFILE_MARKET_PROVIDERS = new Set(['github', 'dev']);

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function finiteCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function iso(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function retryDelay(response, attempt) {
  const seconds = Number(response && response.headers && response.headers.get('retry-after'));
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(30_000, seconds * 1000);
  return 500 * (2 ** attempt);
}

async function fetchJson(url, options, fetchImpl) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal });
      if (response.ok) return await response.json();
      if ((response.status === 429 || response.status >= 500) && attempt + 1 < MAX_RETRIES) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      const error = new Error(`HTTP ${response.status}`);
      error.retryable = false;
      throw error;
    } catch (error) {
      lastError = error;
      if (error && error.retryable === false) break;
      if (attempt + 1 >= MAX_RETRIES) break;
      await sleep(500 * (2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Request failed');
}

async function pooledMap(rows, concurrency, task) {
  const output = new Array(rows.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await task(rows[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

function providerSet(value, fallback = ['github', 'dev']) {
  const values = (Array.isArray(value) ? value : clean(value).split(','))
    .map((row) => clean(row).toLowerCase()).filter(Boolean);
  if (!values.length) return new Set(fallback);
  const unsupported = values.filter((row) => !['github', 'dev'].includes(row));
  if (unsupported.length) throw new Error(`Unsupported profile metric provider selection: ${unsupported.join(',')}`);
  return new Set(values);
}

function failureReason(error) {
  const message = clean(error && error.message).toLowerCase();
  if (error && (error.name === 'AbortError' || /aborted|timeout/.test(message))) return 'request_timed_out';
  if (/http 404/.test(message)) return 'not_found';
  if (/http 429/.test(message)) return 'rate_limited';
  if (/http 4\d\d/.test(message)) return 'provider_rejected_request';
  if (/http 5\d\d/.test(message)) return 'provider_server_error';
  if (/ownership did not match|profile did not match/.test(message)) return 'provider_identity_mismatch';
  if (/pagination/.test(message)) return 'pagination_incomplete';
  if (/normalization/.test(message)) return 'normalization_failed';
  return 'request_failed';
}

function exactProfileTargets(catalog, registry, selectedProviders = new Set(['github', 'dev'])) {
  if (!catalog || typeof catalog !== 'object' || !registry || typeof registry !== 'object') {
    throw new Error('Catalog and eligibility seed are required');
  }
  const identities = new Map((catalog.platformIdentities || []).map((row) => [clean(row && row.id), row]));
  const seen = new Set();
  return (registry.entries || []).map((entry) => {
    const identity = identities.get(clean(entry && entry.identityId));
    const provider = clean(entry && entry.provider).toLowerCase();
    const identityProvider = clean(identity && identity.provider).toLowerCase();
    const nativeId = clean(identity && identity.nativeId);
    const handle = clean(identity && (identity.handle || identity.nativeId)).replace(/^@/, '');
    const profileUrl = clean(identity && identity.profileUrl);
    const key = `${provider}:${nativeId}`.toLowerCase();
    if (!identity || !selectedProviders.has(provider) || provider !== identityProvider
      || !nativeId || !handle || !profileUrl || seen.has(key)
      || clean(identity.creatorId) !== clean(entry.creatorId)) return null;
    if (provider === 'github' && clean(identity.accountType).toLowerCase() !== 'user') return null;
    seen.add(key);
    return {
      creatorId: clean(entry.creatorId),
      identityId: clean(identity.id),
      provider,
      nativeId,
      handle,
      profileUrl
    };
  }).filter(Boolean).sort((left, right) => left.identityId.localeCompare(right.identityId));
}

export function validateStableTargetSeed(catalog, registry) {
  if (!registry || registry.schemaVersion !== PROFILE_METRIC_TARGET_SCHEMA || !Array.isArray(registry.entries)) {
    throw new Error(`BACKER_TRADES_ELIGIBILITY_SEED must use the stable target-seed schema ${PROFILE_METRIC_TARGET_SCHEMA}`);
  }
  const expected = buildProfileMetricTargets(catalog);
  const actual = exactProfileTargets(catalog, registry, PROFILE_MARKET_PROVIDERS);
  if (registry.entries.length !== expected.length || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('BACKER_TRADES_ELIGIBILITY_SEED must contain the complete stable acquisition target set');
  }
  return { schemaVersion: PROFILE_METRIC_TARGET_SCHEMA, entries: expected };
}

async function acquireGitHub(target, context) {
  const data = await fetchJson(`https://api.github.com/users/${encodeURIComponent(target.handle)}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${context.githubToken}`,
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }, context.fetchImpl);
  const login = clean(data && data.login);
  const accountType = clean(data && data.type);
  const nativeId = clean(data && data.id);
  const sourceUrl = clean(data && data.html_url);
  const followers = finiteCount(data && data.followers);
  const publicRepos = finiteCount(data && data.public_repos);
  if (login.toLowerCase() !== target.handle.toLowerCase() || accountType !== 'User'
    || nativeId !== target.nativeId || sourceUrl !== target.profileUrl
    || followers == null || publicRepos == null) {
    throw new Error('official GitHub profile did not match the retained User identity');
  }
  return [
    ['followers', followers],
    ['public_repositories', publicRepos]
  ].map(([metric, value]) => createMetricObservation({
    entityType: 'identity',
    entityId: target.identityId,
    provider: 'github',
    metric,
    value,
    unit: 'count',
    observedAt: context.observedAt,
    visibility: 'public',
    access: 'public_api',
    availability: 'available',
    sourceUrl,
    methodologyVersion: GITHUB_PROFILE_METHOD,
    freshness: { state: 'fresh', capturedAt: context.observedAt },
    confidence: { level: 'high', basis: 'direct_official_api_field' }
  })).filter(Boolean);
}

async function acquireDev(target, context) {
  let page = 1;
  const articleIds = new Set();
  while (true) {
    if (page > MAX_DEV_PAGES) throw new Error('Forem API pagination exceeded the bounded page limit');
    const url = new URL('https://dev.to/api/articles');
    url.searchParams.set('username', target.handle);
    url.searchParams.set('per_page', String(DEV_PAGE_SIZE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('state', 'all');
    const rows = await fetchJson(url.href, {
      headers: {
        Accept: 'application/vnd.forem.api-v1+json',
        'User-Agent': USER_AGENT
      }
    }, context.fetchImpl);
    if (!Array.isArray(rows)) throw new Error('Forem API did not return an article list');
    if (rows.some((row) => clean(row && row.user && row.user.username).toLowerCase() !== target.handle.toLowerCase())) {
      throw new Error('Forem API article ownership did not match the retained DEV identity');
    }
    const priorSize = articleIds.size;
    for (const row of rows) {
      const id = clean(row && row.id);
      if (!id) throw new Error('Forem API article did not retain an exact native ID');
      articleIds.add(id);
    }
    if (rows.length < DEV_PAGE_SIZE) break;
    if (articleIds.size === priorSize) throw new Error('Forem API pagination repeated a page without new article IDs');
    page += 1;
  }
  const observation = createMetricObservation({
    entityType: 'identity',
    entityId: target.identityId,
    provider: 'dev',
    metric: 'published_posts',
    value: articleIds.size,
    unit: 'count',
    observedAt: context.observedAt,
    visibility: 'public',
    access: 'public_api',
    availability: 'available',
    sourceUrl: target.profileUrl,
    methodologyVersion: DEV_PROFILE_METHOD,
    freshness: { state: 'fresh', capturedAt: context.observedAt },
    confidence: { level: 'high', basis: 'direct_official_api_listing_count' }
  });
  if (!observation) throw new Error('DEV account observation normalization failed');
  return [observation];
}

function enrichmentProvider(row) {
  const method = clean(row && row.methodologyVersion);
  if (method === GITHUB_PROFILE_METHOD) return 'github';
  if (method === DEV_PROFILE_METHOD) return 'dev';
  return '';
}

function requiredMetrics(provider) {
  return provider === 'github' ? ['followers', 'public_repositories'] : ['published_posts'];
}

function validRowsForTarget(observations, target) {
  const rows = observations.filter((row) => enrichmentProvider(row) === target.provider
    && row.entityType === 'identity' && clean(row.entityId) === target.identityId
    && row.provider === target.provider && row.sourceUrl === target.profileUrl
    && row.availability === 'available' && row.access === 'public_api'
    && Number.isFinite(Number(row.value)) && Number(row.value) >= 0 && iso(row.observedAt));
  const required = requiredMetrics(target.provider);
  if (required.some((metric) => rows.filter((row) => row.metric === metric).length !== 1)) return [];
  return rows.filter((row) => required.includes(row.metric));
}

function normalizedProviderBucket(row) {
  const source = row && typeof row === 'object' ? row : {};
  const current = source.currentAttempt && typeof source.currentAttempt === 'object'
    ? source.currentAttempt : {
      candidates: Number(source.candidates || 0),
      acquiredAccounts: Number(source.acquiredAccounts || 0),
      failures: Number(source.failures || 0),
      failureReasons: structuredClone(source.failureReasons || {})
    };
  const published = source.published && typeof source.published === 'object'
    ? source.published : {
      currentAccounts: Number(source.acquiredAccounts || 0),
      lastGoodAccounts: 0,
      totalAccounts: Number(source.acquiredAccounts || 0),
      observations: Number(source.observations || 0)
    };
  return {
    candidates: Number(current.candidates || 0),
    acquiredAccounts: Number(current.acquiredAccounts || 0),
    observations: Number(published.observations || 0),
    failures: Number(current.failures || 0),
    failureReasons: structuredClone(current.failureReasons || {}),
    currentAttempt: {
      candidates: Number(current.candidates || 0),
      acquiredAccounts: Number(current.acquiredAccounts || 0),
      failures: Number(current.failures || 0),
      failureReasons: structuredClone(current.failureReasons || {})
    },
    published: {
      currentAccounts: Number(published.currentAccounts || 0),
      lastGoodAccounts: Number(published.lastGoodAccounts || 0),
      totalAccounts: Number(published.totalAccounts || 0),
      observations: Number(published.observations || 0)
    }
  };
}

function asLastGood(row) {
  return {
    ...row,
    freshness: {
      ...(row && row.freshness && typeof row.freshness === 'object' ? row.freshness : {}),
      state: 'last_good'
    }
  };
}

function replaceEnrichmentStreams(catalog, acquiredRows, observedAt, targets, failures, stripProviders = new Set()) {
  const replacedMethods = new Set([GITHUB_PROFILE_METHOD, DEV_PROFILE_METHOD]);
  const prior = Array.isArray(catalog.metricObservations) ? catalog.metricObservations : [];
  const targetByIdentity = new Map(targets.map((target) => [target.identityId, target]));
  const selectedProviders = new Set(targets.map((row) => row.provider));
  const failureIds = new Set(failures.map((row) => row.identityId));
  const lastGoodRows = [];
  for (const identityId of failureIds) {
    const target = targetByIdentity.get(identityId);
    if (!target) continue;
    validRowsForTarget(prior, target).forEach((row) => lastGoodRows.push(asLastGood(row)));
  }
  const preserved = prior.filter((row) => {
    const method = clean(row && row.methodologyVersion);
    if (!replacedMethods.has(method)) return true;
    const provider = enrichmentProvider(row);
    return !selectedProviders.has(provider) && !stripProviders.has(provider);
  });
  const merged = preserved.concat(acquiredRows, lastGoodRows)
    .sort((left, right) => clean(left && left.id).localeCompare(clean(right && right.id)));
  const priorCheckpoint = catalog && catalog.acquisitionCheckpoints && catalog.acquisitionCheckpoints.tradesProfileMetrics;
  const providerCounts = {};
  Object.entries(priorCheckpoint && priorCheckpoint.providers || {}).forEach(([provider, row]) => {
    providerCounts[provider] = normalizedProviderBucket(row);
  });
  for (const provider of stripProviders) if (!selectedProviders.has(provider)) delete providerCounts[provider];
  for (const provider of selectedProviders) {
    const providerTargets = targets.filter((row) => row.provider === provider);
    const providerFailures = failures.filter((row) => row.provider === provider);
    const failureReasons = providerFailures.reduce((counts, row) => {
      counts[row.reason] = (counts[row.reason] || 0) + 1;
      return counts;
    }, {});
    const currentAccounts = providerTargets.filter((target) => validRowsForTarget(acquiredRows, target).length).length;
    const lastGoodAccounts = providerTargets.filter((target) => validRowsForTarget(lastGoodRows, target).length).length;
    const publishedObservations = providerTargets.reduce((count, target) => count + validRowsForTarget(merged, target).length, 0);
    providerCounts[provider] = {
      candidates: providerTargets.length,
      acquiredAccounts: currentAccounts,
      observations: publishedObservations,
      failures: providerFailures.length,
      failureReasons,
      currentAttempt: {
        candidates: providerTargets.length,
        acquiredAccounts: currentAccounts,
        failures: providerFailures.length,
        failureReasons: structuredClone(failureReasons)
      },
      published: {
        currentAccounts,
        lastGoodAccounts,
        totalAccounts: currentAccounts + lastGoodAccounts,
        observations: publishedObservations
      }
    };
  }
  const failureCount = Object.values(providerCounts).reduce((sum, row) => sum
    + Number(row && row.currentAttempt && row.currentAttempt.failures || 0), 0);
  return {
    ...catalog,
    generatedAt: observedAt,
    metricObservations: merged,
    acquisitionCheckpoints: {
      ...(catalog.acquisitionCheckpoints || {}),
      tradesProfileMetrics: {
        schemaVersion: PROFILE_METRIC_ENRICHMENT_SCHEMA,
        state: failureCount ? 'partial' : 'exhausted',
        observedAt,
        updatedAt: observedAt,
        providers: providerCounts,
        reasonCode: failureCount ? 'partial_account_profile_failure' : null
      }
    }
  };
}

export async function enrichProfileMetrics({
  catalog,
  registry,
  githubToken,
  observedAt,
  fetchImpl = globalThis.fetch,
  concurrency = 8,
  minimumAcquiredAccounts = 1000,
  minimumTotalIdentityAccounts = minimumAcquiredAccounts,
  requireComplete = true,
  providers = ['github', 'dev'],
  stripProviders = []
}) {
  const captureTime = iso(observedAt);
  if (!captureTime) throw new Error('A valid observation timestamp is required');
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const selectedProviders = providerSet(providers);
  const strippedProviders = providerSet(stripProviders, []);
  if (selectedProviders.has('github') && !clean(githubToken)) throw new Error('GITHUB_TOKEN is required in process memory');
  const targets = exactProfileTargets(catalog, registry, selectedProviders);
  const providerTargetCounts = targets.reduce((counts, row) => {
    counts[row.provider] = (counts[row.provider] || 0) + 1;
    return counts;
  }, {});
  if (!targets.length || Array.from(selectedProviders).some((provider) => !providerTargetCounts[provider])) {
    throw new Error('Every selected provider requires eligible account targets');
  }
  const failures = [];
  const acquired = await pooledMap(targets, Math.max(1, Math.min(12, Number(concurrency) || 8)), async (target) => {
    try {
      const rows = target.provider === 'github'
        ? await acquireGitHub(target, { githubToken, observedAt: captureTime, fetchImpl })
        : await acquireDev(target, { observedAt: captureTime, fetchImpl });
      if (validRowsForTarget(rows, target).length !== requiredMetrics(target.provider).length) {
        throw new Error('provider account observation normalization was incomplete');
      }
      return rows;
    } catch (error) {
      failures.push({ provider: target.provider, identityId: target.identityId, reason: failureReason(error) });
      return [];
    }
  });
  const observations = acquired.flat().filter(Boolean);
  const acquiredAccounts = new Set(observations.map((row) => clean(row.entityId)));
  if (requireComplete && (failures.length || acquiredAccounts.size !== targets.length)) {
    throw new Error(`Complete replacement gate failed: ${acquiredAccounts.size}/${targets.length} accounts acquired; ${failures.length} failed`);
  }
  if (requireComplete && acquiredAccounts.size < minimumAcquiredAccounts) {
    throw new Error(`Non-empty replacement gate failed: ${acquiredAccounts.size} account metrics acquired; ${minimumAcquiredAccounts} required`);
  }
  const nextCatalog = replaceEnrichmentStreams(catalog, observations, captureTime, targets, failures, strippedProviders);
  const selectedPublishedAccounts = Array.from(selectedProviders).reduce((sum, provider) => sum
    + Number(nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers[provider]
      && nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers[provider].published.totalAccounts || 0), 0);
  if (!requireComplete && selectedPublishedAccounts < minimumAcquiredAccounts) {
    throw new Error(`Non-empty replacement gate failed: ${selectedPublishedAccounts} validated current/last-good account metrics published; ${minimumAcquiredAccounts} required`);
  }
  const totalIdentityNativeAccounts = countIdentityNativeAccounts(nextCatalog, registry);
  if (totalIdentityNativeAccounts < minimumTotalIdentityAccounts) {
    throw new Error(`Combined identity-native release gate failed: ${totalIdentityNativeAccounts} accounts; ${minimumTotalIdentityAccounts} required`);
  }
  nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.validatedIdentityMetricAccounts = totalIdentityNativeAccounts;
  const failureReasons = failures.reduce((counts, row) => {
    counts[row.reason] = (counts[row.reason] || 0) + 1;
    return counts;
  }, {});
  return {
    catalog: nextCatalog,
    report: {
      schemaVersion: PROFILE_METRIC_ENRICHMENT_SCHEMA,
      observedAt: captureTime,
      targets: targets.length,
      acquiredAccounts: acquiredAccounts.size,
      publishedAccounts: selectedPublishedAccounts,
      lastGoodAccounts: Array.from(selectedProviders).reduce((sum, provider) => sum
        + Number(nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers[provider]
          && nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers[provider].published.lastGoodAccounts || 0), 0),
      observations: observations.length,
      failures: failures.length,
      failureReasons,
      totalIdentityNativeAccounts,
      providerCounts: nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers
    }
  };
}

function validatedExistingRows(catalog, targets) {
  const observations = Array.isArray(catalog.metricObservations) ? catalog.metricObservations : [];
  const retained = [];
  for (const target of targets) {
    const rows = validRowsForTarget(observations, target);
    if (!rows.length) return null;
    retained.push(...rows);
  }
  return retained;
}

export function countIdentityNativeAccounts(catalog, registry) {
  const observations = Array.isArray(catalog.metricObservations) ? catalog.metricObservations : [];
  const stableTargets = exactProfileTargets(catalog, registry, PROFILE_MARKET_PROVIDERS);
  return stableTargets.filter((target) => validRowsForTarget(observations, target).length
    === requiredMetrics(target.provider).length).length;
}

export function reusePartialSelection(catalog, registry, selectedProviders, minimumAcquiredAccounts, minimumTotalIdentityAccounts) {
  const checkpoint = catalog && catalog.acquisitionCheckpoints && catalog.acquisitionCheckpoints.tradesProfileMetrics;
  if (!checkpoint || checkpoint.schemaVersion !== PROFILE_METRIC_ENRICHMENT_SCHEMA
    || checkpoint.state !== 'partial' || !checkpoint.providers) return null;
  const targets = exactProfileTargets(catalog, registry, selectedProviders);
  let publishedAccounts = 0;
  let observationCount = 0;
  for (const target of targets) {
    const rows = validRowsForTarget(catalog.metricObservations || [], target);
    if (rows.length) {
      publishedAccounts += 1;
      observationCount += rows.length;
    }
  }
  const normalizedProviders = {};
  Object.entries(checkpoint.providers).forEach(([provider, row]) => {
    normalizedProviders[provider] = normalizedProviderBucket(row);
  });
  const providerCounts = Array.from(selectedProviders).map((provider) => normalizedProviders[provider]).filter(Boolean);
  const failureReasons = providerCounts.reduce((output, row) => {
    Object.entries(row.currentAttempt.failureReasons || {}).forEach(([reason, count]) => {
      output[reason] = (output[reason] || 0) + count;
    });
    return output;
  }, {});
  const failures = providerCounts.reduce((sum, row) => sum + Number(row.currentAttempt.failures || 0), 0);
  const acquiredAccounts = providerCounts.reduce((sum, row) => sum + Number(row.currentAttempt.acquiredAccounts || 0), 0);
  const lastGoodAccounts = providerCounts.reduce((sum, row) => sum + Number(row.published.lastGoodAccounts || 0), 0);
  const checkpointPublishedAccounts = providerCounts.reduce((sum, row) => sum + Number(row.published.totalAccounts || 0), 0);
  const totalIdentityNativeAccounts = countIdentityNativeAccounts(catalog, registry);
  if (publishedAccounts < minimumAcquiredAccounts || publishedAccounts !== checkpointPublishedAccounts
    || totalIdentityNativeAccounts < minimumTotalIdentityAccounts
    || providerCounts.length !== selectedProviders.size || !failures
    || providerCounts.some((row) => row.currentAttempt.acquiredAccounts + row.currentAttempt.failures
      !== row.currentAttempt.candidates)) return null;
  const nextCatalog = structuredClone(catalog);
  nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.providers = normalizedProviders;
  delete nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.eligibleIdentityAccounts;
  nextCatalog.acquisitionCheckpoints.tradesProfileMetrics.validatedIdentityMetricAccounts = totalIdentityNativeAccounts;
  return {
    catalog: nextCatalog,
    report: {
      schemaVersion: PROFILE_METRIC_ENRICHMENT_SCHEMA,
      reused: true,
      observedAt: checkpoint.observedAt,
      targets: targets.length,
      acquiredAccounts,
      publishedAccounts,
      lastGoodAccounts,
      observations: observationCount,
      failures,
      failureReasons,
      totalIdentityNativeAccounts,
      providerCounts: normalizedProviders
    }
  };
}

export function normalizeExistingSelection(catalog, registry, selectedProviders, strippedProviders, minimumAcquiredAccounts) {
  const targets = exactProfileTargets(catalog, registry, selectedProviders);
  if (targets.length < minimumAcquiredAccounts) return null;
  const observations = validatedExistingRows(catalog, targets);
  /* A complete reuse may only publish observations that are current. A
     retained refresh-failure row is intentionally last-good and must remain
     partial instead of being silently promoted to current/exhausted. */
  if (!observations || observations.some((row) => clean(row.freshness && row.freshness.state) === 'last_good')) return null;
  const observedAt = observations.reduce((latest, row) => iso(row.observedAt) > latest ? iso(row.observedAt) : latest, '');
  const normalized = replaceEnrichmentStreams(catalog, observations, observedAt, targets, [], strippedProviders);
  const validatedIdentityMetricAccounts = countIdentityNativeAccounts(normalized, registry);
  normalized.acquisitionCheckpoints.tradesProfileMetrics.validatedIdentityMetricAccounts = validatedIdentityMetricAccounts;
  return {
    catalog: normalized,
    report: {
      schemaVersion: PROFILE_METRIC_ENRICHMENT_SCHEMA,
      reused: true,
      observedAt,
      targets: targets.length,
      acquiredAccounts: targets.length,
      observations: observations.length,
      failures: 0,
      totalIdentityNativeAccounts: validatedIdentityMetricAccounts,
      providerCounts: normalized.acquisitionCheckpoints.tradesProfileMetrics.providers
    }
  };
}

async function writeCatalogAtomic(catalogPath, nextCatalog) {
  const temporaryPath = new URL(`.profile-metrics-${process.pid}.tmp`, catalogPath);
  try {
    const serialized = `${JSON.stringify(nextCatalog)}\n`;
    await writeFile(temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 });
    const verified = JSON.parse(await readFile(temporaryPath, 'utf8'));
    if (JSON.stringify(verified) !== JSON.stringify(nextCatalog)) throw new Error('Temporary catalog verification failed');
    await rename(temporaryPath, catalogPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function main() {
  const catalogPath = process.env.BACKER_DISCOVERY_CATALOG
    ? pathToFileURL(resolve(process.env.BACKER_DISCOVERY_CATALOG)) : DEFAULT_CATALOG;
  const registryPath = process.env.BACKER_TRADES_ELIGIBILITY_SEED
    ? pathToFileURL(resolve(process.env.BACKER_TRADES_ELIGIBILITY_SEED)) : null;
  const allowPartial = process.env.BACKER_PROFILE_METRICS_ALLOW_PARTIAL === '1';
  const minimumAcquiredAccounts = Math.max(1, Number(process.env.BACKER_PROFILE_METRICS_MIN_ACCOUNTS)
    || (allowPartial ? 1 : 1000));
  const minimumTotalIdentityAccounts = Math.max(1,
    Number(process.env.BACKER_PROFILE_METRICS_MIN_TOTAL_ACCOUNTS) || 1000);
  const selectedProviders = providerSet(process.env.BACKER_PROFILE_METRICS_PROVIDERS || 'github,dev');
  const strippedProviders = providerSet(process.env.BACKER_PROFILE_METRICS_STRIP_PROVIDERS || '', []);
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const registry = registryPath
    ? validateStableTargetSeed(catalog, JSON.parse(await readFile(registryPath, 'utf8')))
    : { schemaVersion: PROFILE_METRIC_TARGET_SCHEMA, entries: buildProfileMetricTargets(catalog) };
  const reusable = process.env.BACKER_PROFILE_METRICS_REFETCH === '1' ? null
    : (allowPartial
      ? reusePartialSelection(
        catalog,
        registry,
        selectedProviders,
        minimumAcquiredAccounts,
        minimumTotalIdentityAccounts
      )
      : normalizeExistingSelection(
        catalog,
        registry,
        selectedProviders,
        strippedProviders,
        minimumAcquiredAccounts
      ));
  if (reusable) {
    if (JSON.stringify(reusable.catalog) !== JSON.stringify(catalog)) await writeCatalogAtomic(catalogPath, reusable.catalog);
    process.stdout.write(`${JSON.stringify(reusable.report, null, 2)}\n`);
    return;
  }
  const { catalog: nextCatalog, report } = await enrichProfileMetrics({
    catalog,
    registry,
    githubToken: process.env.GITHUB_TOKEN,
    observedAt: process.env.BACKER_PROFILE_METRICS_OBSERVED_AT || new Date().toISOString(),
    concurrency: Number(process.env.BACKER_PROFILE_METRICS_CONCURRENCY) || 8,
    minimumAcquiredAccounts,
    minimumTotalIdentityAccounts,
    requireComplete: !allowPartial,
    providers: Array.from(selectedProviders),
    stripProviders: Array.from(strippedProviders)
  });
  await writeCatalogAtomic(catalogPath, nextCatalog);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
