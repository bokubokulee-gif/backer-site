'use strict';

const crypto = require('node:crypto');
const reviewedWorkRegistry = require('../../data/discovery-reviewed-work-links.json');

function registryError(message) {
  return Object.assign(new Error(message), { code: 'reviewed_work_registry_invalid' });
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

function sourceKey(value) {
  const row = value || {};
  const provider = clean(row.provider, 40).toLowerCase();
  const nativeId = clean(row.nativeId, 300);
  const canonicalUrl = exactUrl(row.canonicalUrl || row.url);
  return provider && nativeId && canonicalUrl
    ? `${provider}\u001f${nativeId}\u001f${canonicalUrl}`
    : '';
}

function stableClusterId(namespace, value) {
  const digest = crypto.createHash('sha256').update(`${namespace}\u001f${value}`).digest('hex').slice(0, 20);
  return `workcluster_${digest}`;
}

function singletonCluster(content) {
  return {
    id: stableClusterId('source_record', content.id),
    canonicalSourceRecordId: content.id,
    sourceRecordIds: [content.id],
    sourceRecordCount: 1,
    linkage: 'source_record'
  };
}

function normalizeReviewedWorkRegistry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) {
    throw registryError('reviewed work registry schema invalid');
  }
  const methodologyVersion = clean(value.methodologyVersion, 120);
  if (!methodologyVersion) throw registryError('reviewed work registry methodology missing');
  const seenClaimIds = new Set();
  const seenSources = new Set();
  const claims = (Array.isArray(value.clusters) ? value.clusters : []).map((raw) => {
    const id = clean(raw && raw.id, 120);
    const reviewedAt = raw && typeof raw.reviewedAt === 'string' && Number.isFinite(Date.parse(raw.reviewedAt))
      ? new Date(raw.reviewedAt).toISOString()
      : null;
    if (!id || seenClaimIds.has(id) || raw.reviewState !== 'approved' || !reviewedAt) {
      throw registryError('reviewed work claim approval invalid');
    }
    seenClaimIds.add(id);
    const sources = (Array.isArray(raw.sources) ? raw.sources : []).map((source) => ({
      provider: clean(source && source.provider, 40).toLowerCase(),
      nativeId: clean(source && source.nativeId, 300),
      canonicalUrl: exactUrl(source && source.canonicalUrl)
    }));
    const keys = new Set(sources.map(sourceKey));
    if (sources.length < 2 || keys.size !== sources.length || sources.some((source) => !sourceKey(source))) {
      throw registryError('reviewed work claim sources invalid');
    }
    for (const key of keys) {
      if (seenSources.has(key)) throw registryError('reviewed work source appears in multiple claims');
      seenSources.add(key);
    }
    const canonicalSource = {
      provider: clean(raw.canonicalSource && raw.canonicalSource.provider, 40).toLowerCase(),
      nativeId: clean(raw.canonicalSource && raw.canonicalSource.nativeId, 300),
      canonicalUrl: exactUrl(raw.canonicalSource && raw.canonicalSource.canonicalUrl)
    };
    if (!keys.has(sourceKey(canonicalSource))) throw registryError('reviewed work canonical source invalid');
    const evidenceUrls = Array.from(new Set((Array.isArray(raw.evidenceUrls) ? raw.evidenceUrls : [])
      .map(exactUrl).filter(Boolean)));
    if (evidenceUrls.length < 2) throw registryError('reviewed work evidence missing');
    return {
      id,
      reviewState: 'approved',
      reviewedAt,
      methodologyVersion,
      canonicalSource,
      sources,
      evidenceUrls,
      reviewRationale: clean(raw.reviewRationale, 700)
    };
  });
  return { schemaVersion: 1, methodologyVersion, clusters: claims };
}

function buildWorkClusters(contentRecords, registry) {
  const content = (contentRecords || []).filter((row) => row && row.id);
  const normalized = normalizeReviewedWorkRegistry(registry || reviewedWorkRegistry);
  const contentBySource = new Map();
  content.forEach((row) => {
    const key = sourceKey(row);
    if (!key) return;
    if (!contentBySource.has(key)) contentBySource.set(key, []);
    contentBySource.get(key).push(row);
  });
  const claimedContentIds = new Set();
  const reviewedClusters = [];
  normalized.clusters.forEach((claim) => {
    const matched = [];
    for (const source of claim.sources) {
      const candidates = contentBySource.get(sourceKey(source)) || [];
      if (candidates.length !== 1) return;
      matched.push(candidates[0]);
    }
    const creatorIds = new Set(matched.map((row) => row.creatorId));
    if (creatorIds.size !== 1 || matched.some((row) => claimedContentIds.has(row.id))) return;
    const canonical = matched.find((row) => sourceKey(row) === sourceKey(claim.canonicalSource));
    if (!canonical) return;
    const sourceRecordIds = matched.map((row) => row.id);
    sourceRecordIds.forEach((id) => claimedContentIds.add(id));
    reviewedClusters.push({
      id: stableClusterId('reviewed_claim', claim.id),
      canonicalSourceRecordId: canonical.id,
      sourceRecordIds,
      sourceRecordCount: sourceRecordIds.length,
      linkage: 'editorial_reviewed_exact_ids',
      reviewedClaim: {
        id: claim.id,
        reviewedAt: claim.reviewedAt,
        methodologyVersion: claim.methodologyVersion,
        evidenceUrls: claim.evidenceUrls
      }
    });
  });
  const singletons = content.filter((row) => !claimedContentIds.has(row.id)).map(singletonCluster);
  return reviewedClusters.concat(singletons);
}

function projectWorkClusters(workClusters, contentRecords) {
  const selectedIds = new Set((contentRecords || []).map((row) => row && row.id).filter(Boolean));
  const assignedIds = new Set();
  const projected = [];
  for (const cluster of workClusters || []) {
    if (!cluster || !cluster.id || !Array.isArray(cluster.sourceRecordIds)) continue;
    const sourceRecordIds = cluster.sourceRecordIds.filter((id) => selectedIds.has(id) && !assignedIds.has(id));
    if (!sourceRecordIds.length) continue;
    sourceRecordIds.forEach((id) => assignedIds.add(id));
    projected.push(Object.assign({}, cluster, {
      canonicalSourceRecordId: sourceRecordIds.includes(cluster.canonicalSourceRecordId)
        ? cluster.canonicalSourceRecordId
        : sourceRecordIds[0],
      sourceRecordIds
    }));
  }
  for (const content of contentRecords || []) {
    if (content && content.id && !assignedIds.has(content.id)) projected.push(singletonCluster(content));
  }
  return projected;
}

function workClusterCounts(bundle) {
  const source = bundle || {};
  const workClusters = Array.isArray(source.workClusters)
    ? projectWorkClusters(source.workClusters, source.contentRecords || [])
    : buildWorkClusters(source.contentRecords || []);
  return {
    creatorEntities: new Set((source.creators || []).map((row) => row.id)).size,
    linkedPlatformIdentities: new Set((source.platformIdentities || []).map((row) => row.id)).size,
    uniqueWorks: new Set(workClusters.map((row) => row.id)).size,
    sourceRecords: new Set((source.contentRecords || []).map((row) => row.id)).size,
    evidenceObservations: new Set((source.metricObservations || []).map((row) => row.id)).size
  };
}

module.exports = {
  buildWorkClusters,
  normalizeReviewedWorkRegistry,
  projectWorkClusters,
  singletonCluster,
  sourceKey,
  workClusterCounts
};
