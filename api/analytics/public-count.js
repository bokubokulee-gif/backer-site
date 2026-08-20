'use strict';

const { analyticsConfig } = require('../_lib/env');
const { HttpError } = require('../_lib/errors');
const { totalHumanViews } = require('../_lib/views-repository');
const { assertMethod, createHandler, sendJson } = require('../_lib/http');

function calculatePublicCount(_config, humanViews) {
  const count = Number(humanViews);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('Invalid human view count');
  }
  return count;
}

function createPublicCountHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const config = deps.config || analyticsConfig();
    if (!config.publicViewCountsEnabled) {
      throw new HttpError(404, 'Not found', 'public_count_disabled');
    }
    const humanViews = await (deps.totalHumanViews || totalHumanViews)('1970-01-01');
    const count = calculatePublicCount(config, humanViews);
    sendJson(
      res,
      200,
      { count, source: 'human_views' },
      { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' }
    );
  }, 'analytics-public-count');
}

module.exports = createPublicCountHandler();
module.exports.calculatePublicCount = calculatePublicCount;
module.exports.createPublicCountHandler = createPublicCountHandler;
