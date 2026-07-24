'use strict';

const analyticsRepository = require('../_lib/admin-analytics-repository');
const { adminContext, auditContext } = require('../_lib/admin-handler');
const { parseAnalyticsRange } = require('../_lib/date-range');
const { assertMethod, createHandler, noStoreHeaders, sendJson } = require('../_lib/http');

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
