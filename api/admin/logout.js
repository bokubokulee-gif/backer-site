'use strict';

const defaultRepository = require('../_lib/admin-repository');
const { clearCookie } = require('../_lib/admin-auth');
const { adminContext, auditContext } = require('../_lib/admin-handler');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  readJsonBody,
  sendJson
} = require('../_lib/http');
const { HttpError } = require('../_lib/errors');

function createLogoutHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['POST']);
    const context = await adminContext(req, deps, { mutation: true, csrf: true });
    const payload = await (deps.readBody || readJsonBody)(req, { maximumBytes: 256 });
    if (Object.keys(payload).length) throw new HttpError(400, 'Invalid request', 'invalid_body');
    await auditContext(context, deps, 'admin_logout', 'succeeded');
    await (deps.authRepository || defaultRepository).revokeSession(
      context.session.id,
      context.now
    );
    sendJson(
      res,
      200,
      { ok: true },
      noStoreHeaders({ 'Set-Cookie': clearCookie() })
    );
  }, 'admin-logout');
}

module.exports = createLogoutHandler();
module.exports.createLogoutHandler = createLogoutHandler;
