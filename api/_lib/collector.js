'use strict';

const { analyticsConfig, requireSecret } = require('./env');
const { encryptIp, hmacValue } = require('./crypto');
const { trustedClientIp, trustedGeo, maskIp } = require('./ip');
const { classifyBot } = require('./bot');
const { validateViewPayload } = require('./validate');

function buildDedupeBucket(now) {
  return Math.floor(now.getTime() / 10_000);
}

function buildCollectorEvent(payload, req, options) {
  const config = options && options.config || analyticsConfig();
  const now = options && options.now || new Date();
  const hashSecret = options && options.hashSecret || requireSecret('ANALYTICS_HASH_SECRET', 32);
  const validated = validateViewPayload(payload, config.consentPolicyVersion);
  const normalizedIp = trustedClientIp(req, options && options.environment);
  const geo = trustedGeo(req, options && options.environment);
  const bot = classifyBot(req.headers);
  const visitorHash = hmacValue(
    hashSecret,
    config.hashKeyVersion,
    'visitor-id',
    validated.visitorId
  );
  const sessionHash = hmacValue(
    hashSecret,
    config.hashKeyVersion,
    'session-id',
    validated.sessionId
  );
  const ipHash = hmacValue(
    hashSecret,
    config.hashKeyVersion,
    'client-ip',
    normalizedIp || 'unknown'
  );
  const userAgentHash = hmacValue(
    hashSecret,
    config.hashKeyVersion,
    'user-agent',
    bot.userAgent || 'unknown'
  );
  const dedupeKey = hmacValue(
    hashSecret,
    config.hashKeyVersion,
    'view-dedupe',
    `${sessionHash}\0${validated.canonicalPath}\0${buildDedupeBucket(now)}`
  );
  let encryptedIp = null;
  if (config.storeRawIp && normalizedIp) {
    const key =
      options && options.encryptionKey ||
      requireSecret('ANALYTICS_IP_ENCRYPTION_KEY_B64', 40);
    encryptedIp = encryptIp(
      normalizedIp,
      key,
      config.encryptionKeyVersion,
      options && options.randomSource
    );
  }
  return Object.assign({}, validated, {
    now,
    visitorHash,
    sessionHash,
    ipHash,
    rateIpHash: ipHash,
    ipMasked: maskIp(normalizedIp),
    hashKeyVersion: config.hashKeyVersion,
    encryptedIp,
    userAgentHash,
    country: geo.country,
    region: geo.region,
    isBot: bot.isBot,
    botReason: bot.reason,
    dedupeKey
  });
}

module.exports = { buildCollectorEvent, buildDedupeBucket };
