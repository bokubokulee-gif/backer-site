'use strict';

const { analyticsConfig } = require('../_lib/env');
const { buildCollectorEvent } = require('../_lib/collector');
const { recordView } = require('../_lib/views-repository');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  readJsonBody,
  sendJson,
  sendText
} = require('../_lib/http');
const { assertMutationOrigin, corsHeaders } = require('../_lib/origin');

function createViewHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    const method = assertMethod(req, ['POST', 'OPTIONS']);
    const origin = (deps.assertOrigin || assertMutationOrigin)(req, deps.environment);
    if (method === 'OPTIONS') {
      sendText(res, 204, '', noStoreHeaders(corsHeaders(origin)));
      return;
    }
    const payload = await (deps.readBody || readJsonBody)(req, { maximumBytes: 8192 });
    const config = deps.config || analyticsConfig();
    const event = (deps.buildEvent || buildCollectorEvent)(payload, req, {
      config,
      now: deps.now ? deps.now() : new Date(),
      hashSecret: deps.hashSecret,
      encryptionKey: deps.encryptionKey,
      environment: deps.environment,
      randomSource: deps.randomSource
    });
    await (deps.recordView || recordView)(event, {
      ipPerMinute: config.viewIpLimitPerMinute,
      visitorPerMinute: config.viewVisitorLimitPerMinute
    });
    sendJson(res, 202, { accepted: true }, noStoreHeaders(corsHeaders(origin)));
  }, 'analytics-view');
}

module.exports = createViewHandler();
module.exports.createViewHandler = createViewHandler;
