'use strict';

const { issueCsrfToken, sessionResponse } = require('../admin-auth');
const defaultRepository = require('../admin-repository');
const { adminContext } = require('../admin-handler');
const { assertMethod, createHandler, noStoreHeaders, sendJson } = require('../http');

function createSessionHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const context = await adminContext(req, deps, { mutation: false });
    const csrfToken = await (deps.issueCsrf || issueCsrfToken)(context.session, {
      repository: deps.authRepository || defaultRepository,
      hashSecret: deps.hashSecret,
      sessionSecret: deps.sessionSecret
    });
    sendJson(
      res,
      200,
      sessionResponse(context.session, csrfToken, context.config),
      noStoreHeaders()
    );
  }, 'admin-session');
}

module.exports = createSessionHandler();
module.exports.createSessionHandler = createSessionHandler;
