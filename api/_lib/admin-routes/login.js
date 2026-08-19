'use strict';

const { analyticsConfig } = require('../env');
const { HttpError } = require('../errors');
const { verifyScryptPassword } = require('../crypto');
const {
  createAdminSession,
  requestIpHash,
  sessionResponse
} = require('../admin-auth');
const defaultRepository = require('../admin-repository');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  readJsonBody,
  sendJson
} = require('../http');
const { assertMutationOrigin } = require('../origin');
const { validatePasswordBody } = require('../validate');

function createLoginHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['POST']);
    (deps.assertOrigin || assertMutationOrigin)(req, deps.environment);
    const payload = await (deps.readBody || readJsonBody)(req, { maximumBytes: 1024 });
    const password = validatePasswordBody(payload);
    const config = deps.config || analyticsConfig();
    const now = deps.now ? deps.now() : new Date();
    const repository = deps.authRepository || defaultRepository;
    const requestHash = (deps.requestIpHash || requestIpHash)(req, config, {
      hashSecret: deps.hashSecret,
      sessionSecret: deps.sessionSecret,
      environment: deps.environment
    });
    await repository.consumeLoginRateLimit(requestHash, now);
    const encodedHash = deps.passwordHash || process.env.ANALYTICS_ADMIN_PASSWORD_HASH;
    if (!encodedHash) throw new HttpError(503, 'Service unavailable', 'missing_admin_password');
    const valid = await (deps.verifyPassword || verifyScryptPassword)(password, encodedHash);
    if (!valid) {
      await repository.insertAudit({
        now,
        adminIdentity: config.adminIdentity,
        action: 'admin_login',
        targetViewId: null,
        requestIpHash: requestHash,
        result: 'denied'
      });
      throw new HttpError(401, 'Unauthorized', 'invalid_admin_password');
    }
    const created = await (deps.createSession || createAdminSession)(req, {
      config,
      now,
      repository,
      hashSecret: deps.hashSecret,
      sessionSecret: deps.sessionSecret,
      environment: deps.environment
    });
    await repository.insertAudit({
      now,
      adminIdentity: config.adminIdentity,
      action: 'admin_login',
      targetViewId: null,
      requestIpHash: requestHash,
      result: 'succeeded'
    });
    sendJson(
      res,
      200,
      sessionResponse(created.session, created.csrfToken, config),
      noStoreHeaders({ 'Set-Cookie': created.setCookie })
    );
  }, 'admin-login');
}

module.exports = createLoginHandler();
module.exports.createLoginHandler = createLoginHandler;
