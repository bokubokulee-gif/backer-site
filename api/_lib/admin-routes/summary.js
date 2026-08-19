'use strict';

const analyticsRepository = require('../admin-analytics-repository');
const { adminContext, auditContext } = require('../admin-handler');
const { parseAnalyticsRange } = require('../date-range');
const { assertMethod, createHandler, noStoreHeaders, sendJson } = require('../http');

function createSummaryHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const context = await adminContext(req, deps, { mutation: false });
    const range = parseAnalyticsRange(req, context.now);
    const data = await (deps.analyticsRepository || analyticsRepository).summary(range);
    await auditContext(context, deps, 'analytics_summary_viewed', 'succeeded');
    sendJson(
      res,
      200,
      Object.assign(
        { range: { from: range.from, to: range.to, timeZone: 'UTC' } },
        data
      ),
      noStoreHeaders()
    );
  }, 'admin-summary');
}

module.exports = createSummaryHandler();
module.exports.createSummaryHandler = createSummaryHandler;
