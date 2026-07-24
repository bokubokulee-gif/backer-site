'use strict';

const { analyticsConfig } = require('../_lib/env');
const { HttpError } = require('../_lib/errors');
const { totalHumanViews } = require('../_lib/views-repository');
const { assertMethod, createHandler, sendJson } = require('../_lib/http');

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function calculatePublicCount(config, humanViews, now) {
  const anchor = Date.parse(`${config.publicCountStartDate}T00:00:00.000Z`);
  if (!Number.isFinite(anchor)) throw new Error('Invalid public count anchor date');
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - anchor) / DAY_MILLISECONDS));
  return config.publicCountBase + elapsedDays * config.publicCountDailyIncrement + humanViews;
}

function createPublicCountHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const config = deps.config || analyticsConfig();
    if (!config.publicViewCountsEnabled) {
      throw new HttpError(404, 'Not found', 'public_count_disabled');
    }
    const humanViews = await (deps.totalHumanViews || totalHumanViews)(
      config.publicCountStartDate
    );
    const count = calculatePublicCount(config, humanViews, deps.now ? deps.now() : new Date());
    sendJson(
      res,
      200,
      { count },
      { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' }
    );
  }, 'analytics-public-count');
}

module.exports = createPublicCountHandler();
module.exports.calculatePublicCount = calculatePublicCount;
module.exports.createPublicCountHandler = createPublicCountHandler;
