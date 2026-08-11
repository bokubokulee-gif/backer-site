'use strict';

const { safeEqualText } = require('../_lib/crypto');
const { requireSecret } = require('../_lib/env');
const { HttpError } = require('../_lib/errors');
const { headerValue } = require('../_lib/ip');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  sendJson
} = require('../_lib/http');

let syncModulePromise;

function loadSyncModule() {
  if (!syncModulePromise) syncModulePromise = import('../../scripts/sync-market2-people.mjs');
  return syncModulePromise;
}

function envFlag(environment, name) {
  return String(environment && environment[name] || '').toLowerCase() === 'true';
}

function csvHandles(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function publicProviderStatus(providerStatus) {
  return Object.fromEntries(Object.entries(providerStatus || {}).map(([provider, value]) => [provider, {
    state: value.state || 'unavailable',
    status: value.status || 'failed',
    peopleCount: Number(value.peopleCount) || 0,
    contentCount: Number(value.contentCount) || 0,
    metricCount: Number(value.metricCount) || 0,
    retainedLastGood: Boolean(value.retainedLastGood || value.status === 'last-good')
  }]));
}

function createMarket2SyncHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const environment = deps.environment || process.env;
    const secret = deps.cronSecret || requireSecret('CRON_SECRET', 16);
    const supplied = headerValue(req && req.headers, 'authorization');
    if (!safeEqualText(supplied, `Bearer ${secret}`)) {
      throw new HttpError(401, 'Unauthorized', 'invalid_cron_secret');
    }

    const sync = deps.syncModule
      ? await (typeof deps.syncModule === 'function' ? deps.syncModule() : deps.syncModule)
      : await loadSyncModule();
    const now = deps.now ? new Date(deps.now()) : new Date();
    const outputPath = deps.outputPath || sync.OUTPUT_PATH;
    const previous = await sync.readExistingSnapshot(outputPath);
    const snapshot = await sync.buildMarket2Snapshot({
      now,
      fetchImpl: deps.fetchImpl || globalThis.fetch,
      tokens: {
        x: environment.X_BEARER_TOKEN || '',
        youtube: environment.YOUTUBE_API_KEY || '',
        instagram: environment.INSTAGRAM_ACCESS_TOKEN || '',
        instagramUserId: environment.INSTAGRAM_IG_USER_ID || '',
        github: environment.GITHUB_TOKEN || ''
      },
      xWoeid: environment.X_WOEID || 1,
      xCommercialUseApproved: envFlag(environment, 'X_COMMERCIAL_USE_APPROVED'),
      youtubeRegion: environment.YOUTUBE_REGION_CODE || 'US',
      youtubeDerivedApproved: envFlag(environment, 'YOUTUBE_DERIVED_METRICS_APPROVED'),
      instagramHandles: csvHandles(environment.INSTAGRAM_DISCOVERY_HANDLES),
      instagramApiVersion: environment.META_GRAPH_VERSION || 'v25.0',
      instagramAppReviewApproved: envFlag(environment, 'INSTAGRAM_APP_REVIEW_APPROVED'),
      instagramInsightsEnabled: envFlag(environment, 'INSTAGRAM_INSIGHTS_ENABLED'),
      instagramInsightsHandles: csvHandles(environment.INSTAGRAM_INSIGHTS_HANDLES),
      instagramInsightsConsentId: environment.INSTAGRAM_INSIGHTS_CONSENT_ID || '',
      instagramInsightsPublicDisplayAllowed: envFlag(environment, 'INSTAGRAM_INSIGHTS_PUBLIC_DISPLAY_ALLOWED'),
      githubPublicOnlyAccessApproved: envFlag(environment, 'GITHUB_PUBLIC_ONLY_TOKEN_APPROVED'),
      previousSnapshot: previous
    });

    let merged = sync.mergeWithLastGood(snapshot, previous);
    let persisted = false;
    if (environment.DATABASE_URL) {
      const suppressions = await sync.persistSnapshot(snapshot, environment.DATABASE_URL);
      merged = sync.applyPublicationSuppressions(merged, suppressions);
      persisted = true;
    }
    if (deps.writeSnapshot === true || envFlag(environment, 'MARKET2_SYNC_WRITE_SNAPSHOT')) {
      await sync.atomicWriteJson(outputPath, merged);
      persisted = true;
    }

    sendJson(res, 200, {
      ok: true,
      generatedAt: merged.generatedAt,
      state: merged.status,
      peopleCount: Array.isArray(merged.people) ? merged.people.length : 0,
      lastGoodPeopleCount: Array.isArray(merged.people)
        ? merged.people.filter(person => person.dataState === 'last-good').length
        : 0,
      providerStatus: publicProviderStatus(merged.providerStatus),
      persisted
    }, noStoreHeaders());
  }, 'market2-sync');
}

module.exports = createMarket2SyncHandler();
module.exports.createMarket2SyncHandler = createMarket2SyncHandler;
module.exports.publicProviderStatus = publicProviderStatus;
