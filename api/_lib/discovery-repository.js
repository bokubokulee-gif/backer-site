'use strict';

const { getPool, query } = require('./db');
const {
  containsForbiddenDiscoveryKey,
  createProviderRun,
  dedupeDiscoveryBundle
} = require('./discovery-model');

const EMPTY_BUNDLE = Object.freeze({
  creators: Object.freeze([]),
  platformIdentities: Object.freeze([]),
  contentRecords: Object.freeze([]),
  metricObservations: Object.freeze([])
});

function normalizedSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || containsForbiddenDiscoveryKey(value)) {
    return { creators: [], platformIdentities: [], contentRecords: [], metricObservations: [] };
  }
  return dedupeDiscoveryBundle({
    creators: Array.isArray(value.creators) ? value.creators : [],
    platformIdentities: Array.isArray(value.platformIdentities) ? value.platformIdentities : [],
    contentRecords: Array.isArray(value.contentRecords) ? value.contentRecords : [],
    metricObservations: Array.isArray(value.metricObservations) ? value.metricObservations : []
  });
}

function providerBundle(bundle, provider) {
  const platformIdentities = (bundle.platformIdentities || []).filter((row) => row.provider === provider);
  const identityIds = new Set(platformIdentities.map((row) => row.id));
  const creatorIds = new Set(platformIdentities.map((row) => row.creatorId));
  const contentRecords = (bundle.contentRecords || []).filter((row) => row.provider === provider && identityIds.has(row.platformIdentityId));
  const contentIds = new Set(contentRecords.map((row) => row.id));
  return dedupeDiscoveryBundle({
    creators: (bundle.creators || []).filter((row) => creatorIds.has(row.id)),
    platformIdentities,
    contentRecords,
    metricObservations: (bundle.metricObservations || []).filter((row) => row.provider === provider
      && (row.entityType === 'creator' ? creatorIds.has(row.entityId)
        : row.entityType === 'identity' ? identityIds.has(row.entityId) : contentIds.has(row.entityId)))
  });
}

function mergeBundles(current, incoming) {
  return dedupeDiscoveryBundle({
    creators: current.creators.concat(incoming.creators),
    platformIdentities: current.platformIdentities.concat(incoming.platformIdentities),
    contentRecords: current.contentRecords.concat(incoming.contentRecords),
    metricObservations: current.metricObservations.concat(incoming.metricObservations)
  });
}

async function readDiscoveryCache(providerScopes, dependencies) {
  const runQuery = dependencies && dependencies.query || query;
  const result = await runQuery(
    `select provider, provider_cursor, snapshot, provider_run, last_success_at, last_attempt_at
       from discovery_provider_cache
      where provider = any($1::text[])
      order by provider`,
    [providerScopes]
  );
  const rows = result.rows || [];
  const snapshots = rows.map((row) => normalizedSnapshot(row.snapshot));
  const bundle = dedupeDiscoveryBundle({
    creators: snapshots.flatMap((row) => row.creators),
    platformIdentities: snapshots.flatMap((row) => row.platformIdentities),
    contentRecords: snapshots.flatMap((row) => row.contentRecords),
    metricObservations: snapshots.flatMap((row) => row.metricObservations)
  });
  return Object.assign(bundle, {
    providerRuns: rows.map((row) => createProviderRun(row.provider_run)).filter(Boolean),
    providerCursors: Object.fromEntries(rows.filter((row) => row.provider_cursor).map((row) => [row.provider, row.provider_cursor]))
  });
}

async function withDiscoverySession(work) {
  const client = await getPool().connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

async function inTransaction(client, work) {
  await client.query('begin');
  try {
    const result = await work();
    await client.query('commit');
    return result;
  } catch (error) {
    try { await client.query('rollback'); } catch (_rollbackError) { /* retain original error */ }
    throw error;
  }
}

async function persistOneProvider(client, live, provider, now) {
  const existing = await client.query(
    `select snapshot, provider_run, last_success_at
       from discovery_provider_cache
      where provider = $1
      for update`,
    [provider]
  );
  const current = normalizedSnapshot(existing.rows[0] && existing.rows[0].snapshot);
  const incoming = providerBundle(live, provider);
  const liveRun = (live.providerRuns || []).find((run) => run.provider === provider);
  const hasIncoming = incoming.creators.length > 0 || incoming.contentRecords.length > 0;
  const publishable = liveRun && ['succeeded', 'partial'].includes(liveRun.state) && hasIncoming;
  const stored = publishable ? mergeBundles(current, incoming) : current;
  const hasStored = stored.creators.length > 0 || stored.contentRecords.length > 0;
  const previousSuccess = existing.rows[0] && existing.rows[0].last_success_at;
  const lastSuccessAt = publishable ? now : previousSuccess;
  const storedRun = createProviderRun(Object.assign({}, liveRun || {}, {
    provider,
    state: liveRun && liveRun.state || 'failed',
    publishState: publishable ? 'fresh' : hasStored ? 'last_good' : 'unavailable',
    startedAt: liveRun && liveRun.startedAt || now,
    finishedAt: liveRun && liveRun.finishedAt || now,
    observedAt: publishable ? now : previousSuccess,
    lastSuccessAt,
    resultCounts: {
      creators: stored.creators.length,
      contentRecords: stored.contentRecords.length,
      metricObservations: stored.metricObservations.length
    },
    hasMore: Boolean(live.providerCursors && live.providerCursors[provider])
  }));
  await client.query(
    `insert into discovery_provider_cache
       (provider, provider_cursor, snapshot, provider_run, last_success_at, last_attempt_at, updated_at)
     values ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $6)
     on conflict (provider) do update set
       provider_cursor = excluded.provider_cursor,
       snapshot = excluded.snapshot,
       provider_run = excluded.provider_run,
       last_success_at = coalesce(excluded.last_success_at, discovery_provider_cache.last_success_at),
       last_attempt_at = excluded.last_attempt_at,
       updated_at = excluded.updated_at`,
    [
      provider,
      live.providerCursors && live.providerCursors[provider] || null,
      JSON.stringify(stored),
      JSON.stringify(storedRun),
      lastSuccessAt || null,
      now
    ]
  );
  return { bundle: stored, run: storedRun };
}

async function persistDiscoveryResults(live, options) {
  const session = options && options.withSession || withDiscoverySession;
  const now = options && options.now instanceof Date ? options.now : new Date(options && options.now || Date.now());
  const providers = options.providerScopes;
  return session(async (client) => {
    const lock = await client.query(
      'select pg_try_advisory_lock(hashtext($1)) as locked',
      ['backer-discovery-sync-v1']
    );
    if (!lock.rows[0] || lock.rows[0].locked !== true) return { state: 'busy', persisted: false };
    let syncRunId;
    const storedRuns = [];
    const storedBundles = [];
    let persistenceFailures = 0;
    try {
      syncRunId = await inTransaction(client, async () => {
        const inserted = await client.query(
          `insert into discovery_sync_runs (started_at, state, provider_count)
           values ($1, 'running', $2)
           returning sync_run_id`,
          [now, providers.length]
        );
        return inserted.rows[0].sync_run_id;
      });

      for (const provider of providers) {
        try {
          const stored = await inTransaction(client, () => persistOneProvider(client, live, provider, now));
          storedRuns.push(stored.run);
          storedBundles.push(stored.bundle);
        } catch (_error) {
          persistenceFailures += 1;
          const liveRun = (live.providerRuns || []).find((run) => run.provider === provider);
          storedRuns.push(createProviderRun({
            provider,
            state: 'failed',
            publishState: 'unavailable',
            startedAt: liveRun && liveRun.startedAt || now,
            finishedAt: now,
            reasonCode: 'persistence_failed',
            resultCounts: {}
          }));
        }
      }
      const all = dedupeDiscoveryBundle({
        creators: storedBundles.flatMap((row) => row.creators),
        platformIdentities: storedBundles.flatMap((row) => row.platformIdentities),
        contentRecords: storedBundles.flatMap((row) => row.contentRecords),
        metricObservations: storedBundles.flatMap((row) => row.metricObservations)
      });
      const partial = persistenceFailures > 0
        || storedRuns.some((run) => !['succeeded', 'empty'].includes(run.state));
      await inTransaction(client, () => client.query(
        `update discovery_sync_runs
            set finished_at = $2,
                state = $3,
                creator_count = $4,
                content_count = $5,
                metric_count = $6
          where sync_run_id = $1`,
        [syncRunId, now, partial ? 'partial' : 'succeeded', all.creators.length, all.contentRecords.length, all.metricObservations.length]
      ));
      return {
        state: partial ? 'partial' : 'succeeded',
        persisted: storedBundles.length > 0,
        syncRunId,
        providerRuns: storedRuns,
        counts: {
          people: all.creators.length,
          work: all.contentRecords.length,
          metricObservations: all.metricObservations.length
        }
      };
    } finally {
      try {
        await client.query('select pg_advisory_unlock(hashtext($1))', ['backer-discovery-sync-v1']);
      } catch (_unlockError) {
        // The session release below also releases the advisory lock.
      }
    }
  });
}

module.exports = {
  EMPTY_BUNDLE,
  mergeBundles,
  normalizedSnapshot,
  persistDiscoveryResults,
  persistOneProvider,
  providerBundle,
  readDiscoveryCache,
  withDiscoverySession
};
