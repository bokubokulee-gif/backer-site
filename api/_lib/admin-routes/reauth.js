'use strict';

const { verifyScryptPassword } = require('../crypto');
const { HttpError } = require('../errors');
const defaultRepository = require('../admin-repository');
const { adminContext, auditContext } = require('../admin-handler');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  readJsonBody,
  sendJson
} = require('../http');
const { validatePasswordBody } = require('../validate');

function createReauthHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['POST']);
    const context = await adminContext(req, deps, { mutation: true, csrf: true });
    const payload = await (deps.readBody || readJsonBody)(req, { maximumBytes: 1024 });
    const password = validatePasswordBody(payload);
    const repository = deps.authRepository || defaultRepository;
    await repository.consumeReauthRateLimit(context.requestIpHash, context.now);
    const encodedHash = deps.passwordHash || process.env.ANALYTICS_ADMIN_PASSWORD_HASH;
    if (!encodedHash) throw new HttpError(503, 'Service unavailable', 'missing_admin_password');
    const valid = await (deps.verifyPassword || verifyScryptPassword)(password, encodedHash);
    if (!valid) {
      await auditContext(context, deps, 'admin_reauthenticate', 'denied');
      throw new HttpError(403, 'Forbidden', 'invalid_admin_password');
    }
    const timestamp = await repository.markReauthenticated(context.session.id, context.now);
    await auditContext(context, deps, 'admin_reauthenticate', 'succeeded');
    sendJson(
      res,
      200,
      { ok: true, reauthenticatedAt: new Date(timestamp || context.now).toISOString() },
      noStoreHeaders()
    );
  }, 'admin-reauth');
}

module.exports = createReauthHandler();
module.exports.createReauthHandler = createReauthHandler;
