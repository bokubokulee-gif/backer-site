'use strict';

const { analyticsConfig, requireSecret } = require('../env');
const { decryptIp, parseEncryptionKey } = require('../crypto');
const { HttpError } = require('../errors');
const analyticsRepository = require('../admin-analytics-repository');
const { adminContext, auditContext } = require('../admin-handler');
const {
  assertMethod,
  createHandler,
  noStoreHeaders,
  readJsonBody,
  sendJson
} = require('../http');
const { validateRevealBody } = require('../validate');

function encryptionKeyForVersion(version, config, dependencies) {
  if (dependencies && dependencies.encryptionKeys && dependencies.encryptionKeys[version]) {
    return dependencies.encryptionKeys[version];
  }
  const encodedMap = process.env.ANALYTICS_IP_ENCRYPTION_KEYS_B64_JSON;
  if (encodedMap) {
    try {
      const values = JSON.parse(encodedMap);
      if (values && typeof values[version] === 'string') return values[version];
    } catch (_error) {
      throw new HttpError(503, 'Service unavailable', 'invalid_encryption_key_map');
    }
  }
  if (version !== config.encryptionKeyVersion) {
    throw new HttpError(409, 'IP encryption key unavailable', 'encryption_key_unavailable');
  }
  const key =
    dependencies && dependencies.encryptionKey ||
    requireSecret('ANALYTICS_IP_ENCRYPTION_KEY_B64', 40);
  parseEncryptionKey(key);
  return key;
}

function createRevealHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['POST']);
    const context = await adminContext(req, deps, { mutation: true, csrf: true });
    const config = context.config || analyticsConfig();
    if (!config.storeRawIp) {
      throw new HttpError(403, 'IP reveal is disabled', 'raw_ip_disabled');
    }
    const reauthenticatedAt = context.session.reauthenticated_at
      ? new Date(context.session.reauthenticated_at).getTime()
      : Number.NaN;
    if (
      !Number.isFinite(reauthenticatedAt) ||
      reauthenticatedAt < context.now.getTime() - config.adminReauthSeconds * 1000
    ) {
      throw new HttpError(403, 'Recent re-authentication required', 'reauth_required');
    }
    const payload = await (deps.readBody || readJsonBody)(req, { maximumBytes: 512 });
    const viewId = validateRevealBody(payload);
    await auditContext(context, deps, 'analytics_ip_reveal_requested', 'requested', viewId);
    const repository = deps.analyticsRepository || analyticsRepository;
    const record = await repository.encryptedView(
      viewId,
      context.now,
      config.rawIpRetentionDays
    );
    if (!record) {
      await auditContext(context, deps, 'analytics_ip_reveal_failed', 'not_eligible', viewId);
      throw new HttpError(404, 'View not found', 'view_not_revealable');
    }
    try {
      const key = encryptionKeyForVersion(
        record.ip_encryption_key_version,
        config,
        deps
      );
      const ip = (deps.decryptIp || decryptIp)(
        {
          ciphertext: record.encrypted_ip_ciphertext,
          iv: record.encrypted_ip_iv,
          tag: record.encrypted_ip_tag,
          keyVersion: record.ip_encryption_key_version
        },
        key
      );
      await auditContext(context, deps, 'analytics_ip_revealed', 'succeeded', viewId);
      sendJson(
        res,
        200,
        { viewId, ip, revealedAt: context.now.toISOString() },
        noStoreHeaders()
      );
    } catch (error) {
      await auditContext(context, deps, 'analytics_ip_reveal_failed', 'decrypt_failed', viewId);
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, 'Could not reveal IP', 'ip_decryption_failed');
    }
  }, 'admin-reveal');
}

module.exports = createRevealHandler();
module.exports.createRevealHandler = createRevealHandler;
module.exports.encryptionKeyForVersion = encryptionKeyForVersion;
