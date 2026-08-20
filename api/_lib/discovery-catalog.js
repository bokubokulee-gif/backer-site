'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { constants: BUFFER_CONSTANTS } = require('node:buffer');
const {
  PROVIDERS,
  containsForbiddenDiscoveryKey,
  createContentRecord,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle,
  isoDate
} = require('./discovery-model');
const { buildWorkClusters, projectWorkClusters } = require('./discovery-work-clusters');

const DEFAULT_CATALOG_PATH = path.join(process.cwd(), 'data', 'discovery-catalog.json');
// This is Node's platform UTF-8 string safety boundary, not a product/catalog record ceiling.
const MAX_CATALOG_BYTES = BUFFER_CONSTANTS.MAX_STRING_LENGTH;

function emptyCatalog() {
  return {
    schemaVersion: 1,
    generatedAt: null,
    creators: [],
    platformIdentities: [],
    contentRecords: [],
    workClusters: [],
    metricObservations: [],
    providerRuns: []
  };
}

function normalizeCatalog(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.schemaVersion !== 1) {
    throw Object.assign(new Error('catalog schema invalid'), { code: 'catalog_invalid' });
  }
  if (containsForbiddenDiscoveryKey(payload)) {
    throw Object.assign(new Error('catalog contains non-discovery fields'), { code: 'catalog_invalid' });
  }
  const rawCreators = Array.isArray(payload.creators) ? payload.creators : [];
  const rawIdentities = Array.isArray(payload.platformIdentities) ? payload.platformIdentities : [];
  const identitiesByCreator = new Map();
  rawIdentities.forEach((identity) => {
    if (!identity || !identity.creatorId) return;
    if (!identitiesByCreator.has(identity.creatorId)) identitiesByCreator.set(identity.creatorId, []);
    identitiesByCreator.get(identity.creatorId).push(identity);
  });

  const creators = [];
  const creatorAlias = new Map();
  for (const raw of rawCreators) {
    const identities = identitiesByCreator.get(raw && raw.id) || [];
    const primary = identities.find((identity) => identity.id === raw.primaryIdentityId) || identities[0];
    if (!primary) continue;
    const creator = createCreator({
      provider: primary.provider,
      nativeId: primary.nativeId,
      displayName: raw.displayName,
      bio: raw.bio,
      avatarUrl: raw.avatarUrl,
      avatarSourceUrl: raw.avatarSourceUrl,
      profileUrl: primary.profileUrl,
      observedAt: raw.observedAt || primary.observedAt
    });
    if (!creator) continue;
    creatorAlias.set(raw.id, creator.id);
    creators.push(creator);
  }

  const platformIdentities = [];
  const identityAlias = new Map();
  for (const raw of rawIdentities) {
    const creatorId = creatorAlias.get(raw && raw.creatorId);
    if (!creatorId) continue;
    const identity = createPlatformIdentity({
      creatorId,
      provider: raw.provider,
      nativeId: raw.nativeId,
      handle: raw.handle,
      profileUrl: raw.profileUrl,
      verified: raw.verified,
      observedAt: raw.observedAt
    });
    if (!identity) continue;
    identityAlias.set(raw.id, identity.id);
    platformIdentities.push(identity);
  }

  const contentRecords = [];
  const contentAlias = new Map();
  for (const raw of Array.isArray(payload.contentRecords) ? payload.contentRecords : []) {
    const creatorId = creatorAlias.get(raw && raw.creatorId);
    const platformIdentityId = identityAlias.get(raw && raw.platformIdentityId);
    if (!creatorId || !platformIdentityId) continue;
    const content = createContentRecord(Object.assign({}, raw, { creatorId, platformIdentityId }));
    if (!content) continue;
    contentAlias.set(raw.id, content.id);
    contentRecords.push(content);
  }

  const metricObservations = [];
  for (const raw of Array.isArray(payload.metricObservations) ? payload.metricObservations : []) {
    if (!raw) continue;
    const entityId = raw.entityType === 'creator' ? creatorAlias.get(raw.entityId)
      : raw.entityType === 'identity' ? identityAlias.get(raw.entityId)
        : contentAlias.get(raw.entityId);
    if (!entityId) continue;
    const metric = createMetricObservation(Object.assign({}, raw, { entityId }));
    if (metric) metricObservations.push(metric);
  }

  const bundle = dedupeDiscoveryBundle({
    creators,
    platformIdentities,
    contentRecords,
    metricObservations
  });
  const providerRuns = (Array.isArray(payload.providerRuns) ? payload.providerRuns : [])
    .map((run) => createProviderRun(Object.assign({}, run, {
      publishState: run && run.publishState === 'fresh' ? 'last_good' : run && run.publishState,
      observedAt: run && run.observedAt,
      lastSuccessAt: run && (run.lastSuccessAt || run.observedAt)
    })))
    .filter(Boolean);
  return Object.assign({
    schemaVersion: 1,
    generatedAt: isoDate(payload.generatedAt)
  }, bundle, { workClusters: buildWorkClusters(bundle.contentRecords), providerRuns });
}

async function loadDiscoveryCatalog(catalogPath) {
  const target = catalogPath || DEFAULT_CATALOG_PATH;
  try {
    const handle = await fs.open(target, 'r');
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size > MAX_CATALOG_BYTES) {
        throw Object.assign(new Error('catalog file invalid'), { code: 'catalog_invalid' });
      }
      const raw = await handle.readFile('utf8');
      return normalizeCatalog(JSON.parse(raw));
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') return emptyCatalog();
    throw error;
  }
}

function filterCatalog(catalog, providers) {
  const allowed = new Set(providers || PROVIDERS);
  const platformIdentities = catalog.platformIdentities.filter((row) => allowed.has(row.provider));
  const identityIds = new Set(platformIdentities.map((row) => row.id));
  const contentRecords = catalog.contentRecords.filter((row) => allowed.has(row.provider) && identityIds.has(row.platformIdentityId));
  const creatorIds = new Set(platformIdentities.map((row) => row.creatorId));
  const contentIds = new Set(contentRecords.map((row) => row.id));
  const creators = catalog.creators.filter((row) => creatorIds.has(row.id));
  const metricObservations = catalog.metricObservations.filter((row) => allowed.has(row.provider)
    && (row.entityType === 'creator' ? creatorIds.has(row.entityId)
      : row.entityType === 'identity' ? identityIds.has(row.entityId)
        : contentIds.has(row.entityId)));
  const bundle = dedupeDiscoveryBundle({ creators, platformIdentities, contentRecords, metricObservations });
  return Object.assign({}, bundle, {
    workClusters: projectWorkClusters(catalog.workClusters || buildWorkClusters(catalog.contentRecords), bundle.contentRecords)
  });
}

function overlayProviderRuns(liveRuns, catalogRuns, catalogBundle, providers, now) {
  const liveByProvider = new Map((liveRuns || []).map((run) => [run.provider, run]));
  const catalogByProvider = new Map((catalogRuns || []).map((run) => [run.provider, run]));
  const materialProviders = new Set(catalogBundle.platformIdentities.map((row) => row.provider)
    .concat(catalogBundle.contentRecords.map((row) => row.provider)));
  return providers.map((provider) => {
    const live = liveByProvider.get(provider);
    if (live && live.publishState === 'fresh') return live;
    if (!materialProviders.has(provider)) return live || createProviderRun({
      provider,
      state: 'not_configured',
      publishState: 'unavailable',
      startedAt: now,
      finishedAt: now,
      reasonCode: 'provider_not_configured',
      resultCounts: {}
    });
    const prior = catalogByProvider.get(provider);
    const observedAt = prior && (prior.observedAt || prior.lastSuccessAt || prior.finishedAt);
    return createProviderRun(Object.assign({}, live || prior, {
      provider,
      state: live ? live.state : prior && prior.state || 'succeeded',
      publishState: 'last_good',
      startedAt: live && live.startedAt || prior && prior.startedAt || now,
      finishedAt: live && live.finishedAt || prior && prior.finishedAt || now,
      observedAt,
      lastSuccessAt: observedAt,
      reasonCode: live && live.reasonCode || prior && prior.reasonCode || null,
      resultCounts: prior && prior.resultCounts || live && live.resultCounts || {}
    }));
  }).filter(Boolean);
}

module.exports = {
  DEFAULT_CATALOG_PATH,
  MAX_CATALOG_BYTES,
  emptyCatalog,
  filterCatalog,
  loadDiscoveryCatalog,
  normalizeCatalog,
  overlayProviderRuns
};
