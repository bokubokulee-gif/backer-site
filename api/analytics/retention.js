'use strict';

const { analyticsConfig, requireSecret } = require('../_lib/env');
const { safeEqualText } = require('../_lib/crypto');
const { HttpError } = require('../_lib/errors');
const { headerValue } = require('../_lib/ip');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  sendJson
} = require('../_lib/http');
const { runRetention } = require('../_lib/retention-repository');

function createRetentionHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const secret = deps.cronSecret || requireSecret('CRON_SECRET', 16);
    const supplied = headerValue(req.headers, 'authorization');
    if (!safeEqualText(supplied, `Bearer ${secret}`)) {
      throw new HttpError(401, 'Unauthorized', 'invalid_cron_secret');
    }
    const config = deps.config || analyticsConfig();
    const result = await (deps.runRetention || runRetention)(
      deps.now ? deps.now() : new Date(),
      config
    );
    sendJson(res, 200, { ok: true, retention: result }, noStoreHeaders());
  }, 'analytics-retention');
}

module.exports = createRetentionHandler();
module.exports.createRetentionHandler = createRetentionHandler;
