'use strict';

const { analyticsConfig } = require('./env');
const { authenticateAdmin, assertCsrf, requestIpHash } = require('./admin-auth');
const { assertMutationOrigin, assertSafeReadOrigin } = require('./origin');
const defaultRepository = require('./admin-repository');

async function adminContext(req, dependencies, options) {
  const deps = dependencies || {};
  const config = deps.config || analyticsConfig();
  const now = deps.now ? deps.now() : new Date();
  if (options && options.mutation) (deps.assertOrigin || assertMutationOrigin)(req, deps.environment);
  else (deps.assertReadOrigin || assertSafeReadOrigin)(req, deps.environment);
  const session = await (deps.authenticate || authenticateAdmin)(req, {
    config,
    now,
    repository: deps.authRepository || defaultRepository,
    hashSecret: deps.hashSecret,
    sessionSecret: deps.sessionSecret,
    environment: deps.environment
  });
  if (options && options.csrf) {
    (deps.assertCsrf || assertCsrf)(req, session, {
      repository: deps.authRepository || defaultRepository,
      hashSecret: deps.hashSecret,
      sessionSecret: deps.sessionSecret
    });
  }
  const requestHash = (deps.requestIpHash || requestIpHash)(req, config, {
    hashSecret: deps.hashSecret,
    sessionSecret: deps.sessionSecret,
    environment: deps.environment
  });
  return { config, now, session, requestIpHash: requestHash };
}

async function auditContext(context, dependencies, action, result, targetViewId) {
  const repository = dependencies && dependencies.authRepository || defaultRepository;
  await repository.insertAudit({
    now: context.now,
    adminIdentity: context.session.admin_identity,
    action,
    targetViewId: targetViewId || null,
    requestIpHash: context.requestIpHash,
    result
  });
}

module.exports = { adminContext, auditContext };
