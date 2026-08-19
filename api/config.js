'use strict';

const { analyticsConfig } = require('./_lib/env');
const { assertMethod, createHandler, sendJson } = require('./_lib/http');

function createConfigHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const config = deps.config || analyticsConfig();
    const measurementId = /^G-[A-Z0-9]+$/i.test(config.ga4MeasurementId)
      ? config.ga4MeasurementId.toUpperCase()
      : '';
    const collectionEnabled = deps.collectionEnabled == null
      ? Boolean(measurementId || process.env.DATABASE_URL)
      : deps.collectionEnabled === true;
    sendJson(
      res,
      200,
      {
        ga4MeasurementId: measurementId,
        analyticsCollectionEnabled: collectionEnabled,
        consentPolicyVersion: config.consentPolicyVersion,
        publicViewCountsEnabled: config.publicViewCountsEnabled
      },
      { 'Cache-Control': 'no-store, max-age=0' }
    );
  }, 'config');
}

module.exports = createConfigHandler();
module.exports.createConfigHandler = createConfigHandler;
