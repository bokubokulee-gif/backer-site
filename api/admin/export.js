'use strict';

const analyticsRepository = require('../_lib/admin-analytics-repository');
const { adminContext, auditContext } = require('../_lib/admin-handler');
const { toCsv } = require('../_lib/csv');
const { parseAnalyticsRange } = require('../_lib/date-range');
const { assertMethod, createHandler, noStoreHeaders, sendText } = require('../_lib/http');

const CSV_HEADERS = [
  { key: 'viewedAt', label: 'Viewed at (UTC)' },
  { key: 'pageKey', label: 'Page key' },
  { key: 'path', label: 'Canonical path' },
  { key: 'maskedIp', label: 'Masked IP' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'referrerHostname', label: 'Referrer hostname' },
  { key: 'deviceClass', label: 'Device class' },
  { key: 'bot', label: 'Bot' },
  { key: 'utmSource', label: 'UTM source' },
  { key: 'utmMedium', label: 'UTM medium' },
  { key: 'utmCampaign', label: 'UTM campaign' },
  { key: 'utmId', label: 'UTM id' }
];

function createExportHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const context = await adminContext(req, deps, { mutation: false });
    const range = parseAnalyticsRange(req, context.now);
    const rows = await (deps.analyticsRepository || analyticsRepository).exportRows(
      range,
      20_000
    );
    await auditContext(context, deps, 'analytics_csv_exported', 'succeeded');
    sendText(
      res,
      200,
      toCsv(CSV_HEADERS, rows),
      noStoreHeaders({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="backer-analytics-${range.from}-to-${range.to}.csv"`,
        'X-Content-Type-Options': 'nosniff'
      })
    );
  }, 'admin-export');
}

module.exports = createExportHandler();
module.exports.CSV_HEADERS = CSV_HEADERS;
module.exports.createExportHandler = createExportHandler;
