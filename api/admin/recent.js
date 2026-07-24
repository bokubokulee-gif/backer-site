'use strict';

const analyticsRepository = require('../_lib/admin-analytics-repository');
const { adminContext, auditContext } = require('../_lib/admin-handler');
const { parseAnalyticsRange, queryValue } = require('../_lib/date-range');
const { HttpError } = require('../_lib/errors');
const { assertMethod, createHandler, noStoreHeaders, sendJson } = require('../_lib/http');

function parseLimit(req) {
  const raw = queryValue(req, 'limit');
  if (raw == null || raw === '') return 50;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new HttpError(400, 'Invalid limit', 'invalid_limit');
  }
  return limit;
}

function createRecentHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const context = await adminContext(req, deps, { mutation: false });
    const range = parseAnalyticsRange(req, context.now);
    const data = await (deps.analyticsRepository || analyticsRepository).recent(
      range,
      parseLimit(req)
    );
    await auditContext(context, deps, 'analytics_recent_viewed', 'succeeded');
    sendJson(res, 200, data, noStoreHeaders());
  }, 'admin-recent');
}

module.exports = createRecentHandler();
module.exports.createRecentHandler = createRecentHandler;
module.exports.parseLimit = parseLimit;
