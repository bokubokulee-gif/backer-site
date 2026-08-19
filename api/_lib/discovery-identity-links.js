'use strict';

const reviewedIdentityRegistry = require('../../data/discovery-reviewed-links.json');

function linkError(message) {
  return Object.assign(new Error(message), { code: 'reviewed_identity_registry_invalid' });
}

function clean(value, maximum) {
  return typeof value === 'string' ? value.trim().slice(0, maximum || 500) : '';
}

function exactUrl(value) {
  const raw = clean(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    url.searchParams.sort();
    return url.toString();
  } catch (_error) {
    return null;
  }
}

function accountKey(value) {
  const row = value || {};
  const provider = clean(row.provider, 40).toLowerCase();
  const nativeId = clean(row.nativeId, 200);
  return provider && nativeId ? `${provider}\u001f${nativeId}` : '';
}

function normalizeReviewedIdentityRegistry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) {
    throw linkError('reviewed identity registry schema invalid');
  }
  const methodologyVersion = clean(value.methodologyVersion, 100);
  if (!methodologyVersion) throw linkError('reviewed identity registry methodology missing');
  const seenLinkIds = new Set();
  const seenAccounts = new Set();
  const links = (Array.isArray(value.links) ? value.links : []).map((raw) => {
    const id = clean(raw && raw.id, 100);
    const reviewedAt = raw && typeof raw.reviewedAt === 'string' && Number.isFinite(Date.parse(raw.reviewedAt))
      ? new Date(raw.reviewedAt).toISOString() : null;
    if (!id || seenLinkIds.has(id) || raw.reviewState !== 'approved' || !reviewedAt) {
      throw linkError('reviewed identity link approval invalid');
    }
    seenLinkIds.add(id);
    const accounts = (Array.isArray(raw.accounts) ? raw.accounts : []).map((account) => ({
      provider: clean(account && account.provider, 40).toLowerCase(),
      nativeId: clean(account && account.nativeId, 200),
      profileUrl: exactUrl(account && account.profileUrl)
    }));
    const keys = new Set(accounts.map(accountKey));
    const providers = new Set(accounts.map((account) => account.provider));
    if (accounts.length < 2 || keys.size !== accounts.length || providers.size < 2
      || accounts.some((account) => !account.provider || !account.nativeId || !account.profileUrl)) {
      throw linkError('reviewed identity link accounts invalid');
    }
    for (const key of keys) {
      if (seenAccounts.has(key)) throw linkError('reviewed identity account appears in multiple links');
      seenAccounts.add(key);
    }
    const canonicalAccount = {
      provider: clean(raw.canonicalAccount && raw.canonicalAccount.provider, 40).toLowerCase(),
      nativeId: clean(raw.canonicalAccount && raw.canonicalAccount.nativeId, 200),
      profileUrl: exactUrl(raw.canonicalAccount && raw.canonicalAccount.profileUrl)
    };
    if (!keys.has(accountKey(canonicalAccount))
      || !accounts.some((account) => accountKey(account) === accountKey(canonicalAccount)
        && account.profileUrl === canonicalAccount.profileUrl)) {
      throw linkError('reviewed identity canonical account invalid');
    }
    const evidenceUrls = Array.from(new Set((Array.isArray(raw.evidenceUrls) ? raw.evidenceUrls : [])
      .map(exactUrl).filter(Boolean)));
    if (evidenceUrls.length < 2) throw linkError('reviewed identity link evidence missing');
    return {
      id,
      displayName: clean(raw.displayName, 160),
      reviewState: 'approved',
      reviewedAt,
      methodologyVersion,
      canonicalAccount,
      accounts,
      evidenceUrls,
      reviewRationale: clean(raw.reviewRationale, 700)
    };
  });
  return { schemaVersion: 1, methodologyVersion, links };
}

function mergeCreator(primary, secondary, displayName) {
  const merged = Object.assign({}, primary || {});
  Object.entries(secondary || {}).forEach(([key, value]) => {
    if ((merged[key] == null || merged[key] === '') && value != null && value !== '') merged[key] = value;
  });
  if (displayName) merged.displayName = displayName;
  return merged;
}

function applyReviewedIdentityLinks(bundle, registry) {
  const normalized = normalizeReviewedIdentityRegistry(registry || reviewedIdentityRegistry);
  const creators = (bundle.creators || []).map((row) => Object.assign({}, row));
  const platformIdentities = (bundle.platformIdentities || []).map((row) => Object.assign({}, row));
  const contentRecords = (bundle.contentRecords || []).map((row) => Object.assign({}, row));
  const metricObservations = (bundle.metricObservations || []).map((row) => Object.assign({}, row));
  const creatorById = new Map(creators.map((row) => [row.id, row]));
  const identityByAccount = new Map();
  const identitiesByCreator = new Map();
  platformIdentities.forEach((identity) => {
    const key = accountKey(identity);
    if (key) {
      if (!identityByAccount.has(key)) identityByAccount.set(key, []);
      identityByAccount.get(key).push(identity);
    }
    if (!identitiesByCreator.has(identity.creatorId)) identitiesByCreator.set(identity.creatorId, []);
    identitiesByCreator.get(identity.creatorId).push(identity);
  });
  const creatorAlias = new Map();
  const linkByCreator = new Map();

  normalized.links.forEach((link) => {
    const matched = [];
    for (const account of link.accounts) {
      const candidates = identityByAccount.get(accountKey(account)) || [];
      const exact = candidates.filter((identity) => exactUrl(identity.profileUrl) === account.profileUrl);
      if (exact.length !== 1) return;
      matched.push(exact[0]);
    }
    const matchedKeys = new Set(matched.map(accountKey));
    const affectedCreatorIds = new Set(matched.map((identity) => identity.creatorId));
    if (!affectedCreatorIds.size) return;
    for (const creatorId of affectedCreatorIds) {
      const owned = identitiesByCreator.get(creatorId) || [];
      if (!creatorById.has(creatorId) || owned.some((identity) => !matchedKeys.has(accountKey(identity)))) return;
      if (linkByCreator.has(creatorId)) return;
    }
    const canonicalIdentity = matched.find((identity) => accountKey(identity) === accountKey(link.canonicalAccount)
      && exactUrl(identity.profileUrl) === link.canonicalAccount.profileUrl);
    if (!canonicalIdentity) return;
    const canonicalCreatorId = canonicalIdentity.creatorId;
    let canonicalCreator = creatorById.get(canonicalCreatorId);
    for (const creatorId of affectedCreatorIds) {
      creatorAlias.set(creatorId, canonicalCreatorId);
      linkByCreator.set(creatorId, link);
      if (creatorId !== canonicalCreatorId) canonicalCreator = mergeCreator(canonicalCreator, creatorById.get(creatorId), link.displayName);
    }
    canonicalCreator = mergeCreator(canonicalCreator, {}, link.displayName);
    creatorById.set(canonicalCreatorId, canonicalCreator);
  });

  if (!creatorAlias.size) {
    return { creators, platformIdentities, contentRecords, metricObservations };
  }
  const linkedIdentities = platformIdentities.map((identity) => {
    const canonicalCreatorId = creatorAlias.get(identity.creatorId);
    const link = linkByCreator.get(identity.creatorId);
    if (!canonicalCreatorId || !link) return identity;
    return Object.assign({}, identity, {
      creatorId: canonicalCreatorId,
      reviewedLink: {
        id: link.id,
        state: link.reviewState,
        confidence: 'editorial_reviewed',
        reviewedAt: link.reviewedAt,
        methodologyVersion: link.methodologyVersion,
        evidenceUrls: link.evidenceUrls.slice()
      }
    });
  });
  const linkedContent = contentRecords.map((content) => Object.assign({}, content, {
    creatorId: creatorAlias.get(content.creatorId) || content.creatorId
  }));
  const linkedMetrics = metricObservations.map((metric) => metric.entityType === 'creator'
    ? Object.assign({}, metric, { entityId: creatorAlias.get(metric.entityId) || metric.entityId })
    : metric);
  const retainedCreators = creators.filter((creator) => !creatorAlias.has(creator.id)
    || creatorAlias.get(creator.id) === creator.id).map((creator) => creatorById.get(creator.id) || creator);
  const identitiesForCreator = new Map();
  linkedIdentities.forEach((identity) => {
    if (!identitiesForCreator.has(identity.creatorId)) identitiesForCreator.set(identity.creatorId, []);
    identitiesForCreator.get(identity.creatorId).push(identity.id);
  });
  retainedCreators.forEach((creator) => {
    const identities = identitiesForCreator.get(creator.id) || [];
    if (!identities.includes(creator.primaryIdentityId)) creator.primaryIdentityId = identities[0] || null;
  });
  return {
    creators: retainedCreators,
    platformIdentities: linkedIdentities,
    contentRecords: linkedContent,
    metricObservations: linkedMetrics
  };
}

module.exports = {
  accountKey,
  applyReviewedIdentityLinks,
  normalizeReviewedIdentityRegistry,
  reviewedIdentityRegistry
};
