'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyBot } = require('../api/_lib/bot');
const { buildCollectorEvent, buildDedupeBucket } = require('../api/_lib/collector');
const {
  createScryptPasswordHash,
  decryptIp,
  encryptIp,
  hmacValue,
  verifyScryptPassword
} = require('../api/_lib/crypto');
const { csvCell, toCsv } = require('../api/_lib/csv');
const { parseAnalyticsRange } = require('../api/_lib/date-range');
const {
  decodeAdminCookie,
  encodeAdminCookie
} = require('../api/_lib/cookies');
const {
  maskIp,
  normalizeIp,
  trustedClientIp,
  trustedGeo
} = require('../api/_lib/ip');
const {
  canonicalizeRoute,
  stripQueryAndHash
} = require('../api/_lib/routes');
const { sessionResponse } = require('../api/_lib/admin-auth');
const { validateViewPayload } = require('../api/_lib/validate');

const HASH_SECRET = 'h'.repeat(48);
const SESSION_SECRET = 's'.repeat(48);
const POLICY = '2026-07-24';

function validPayload(overrides) {
  return Object.assign(
    {
      eventId: '11111111-1111-4111-8111-111111111111',
      pageKey: 'home',
      path: '/?utm_source=test#hero',
      pageTitle: 'Browser supplied title',
      virtualView: 'home',
      visitorId: '22222222-2222-4222-8222-222222222222',
      sessionId: '33333333-3333-4333-8333-333333333333',
      referrerHostname: 'Example.COM',
      utm: {
        source: 'newsletter',
        medium: 'email',
        campaign: 'launch-2026',
        id: 'wave_1'
      },
      deviceClass: 'desktop',
      locale: 'en-US',
      consentPolicyVersion: POLICY
    },
    overrides || {}
  );
}

function config(overrides) {
  return Object.assign(
    {
      consentPolicyVersion: POLICY,
      hashKeyVersion: 'v1',
      storeRawIp: false,
      encryptionKeyVersion: 'v1',
      adminSessionTtlSeconds: 3600,
      adminSessionIdleSeconds: 1800,
      adminReauthSeconds: 300
    },
    overrides || {}
  );
}

test('canonical routes remove queries and hashes and constrain dynamic public IDs', () => {
  assert.equal(stripQueryAndHash('/creator/kai?email=a@example.com#private'), '/creator/kai');
  assert.deepEqual(canonicalizeRoute('home', '/?utm_source=x#hero'), {
    pageKey: 'home',
    path: '/',
    title: 'Backer',
    virtualView: 'home'
  });
  assert.equal(
    canonicalizeRoute('creator', '/creator/Kai_Nakamura?search=secret').path,
    '/creator/kai_nakamura'
  );
  assert.equal(
    canonicalizeRoute('market_detail', '/market/ct-kai#instrument=perps').path,
    '/market/ct-kai'
  );
  assert.deepEqual(canonicalizeRoute('market_position', '/market/position'), {
    pageKey: 'market_position',
    path: '/market/position',
    title: 'Backer Market',
    virtualView: 'market_position'
  });
  assert.throws(() => canonicalizeRoute('creator', '/creator/not valid'));
  assert.throws(() => canonicalizeRoute('unknown', '/anything'));
});

test('IP normalization and masking are stable for IPv4, mapped IPv4, and IPv6', () => {
  assert.equal(normalizeIp('203.0.113.9'), '203.0.113.9');
  assert.equal(normalizeIp('::ffff:203.0.113.9'), '203.0.113.9');
  assert.equal(maskIp('203.0.113.9'), '203.0.113.xxx');
  assert.equal(normalizeIp('2001:0db8:0000:0000:0000:0000:0000:0001'), '2001:db8::1');
  assert.equal(normalizeIp('2001:db8::1'), '2001:db8::1');
  assert.equal(maskIp('2001:db8:abcd:12::1'), '2001:db8:abcd::/48');
  assert.equal(normalizeIp('127.0.0.1, 8.8.8.8'), null);
  assert.equal(normalizeIp('malformed'), null);
});

test('trusted proxy extraction ignores spoofed forwarding headers off Vercel', () => {
  const req = {
    headers: {
      'x-vercel-forwarded-for': '198.51.100.20',
      'x-vercel-ip-country': 'US'
    },
    socket: { remoteAddress: '10.0.0.7' }
  };
  assert.equal(trustedClientIp(req, { VERCEL: '0' }), '10.0.0.7');
  assert.deepEqual(trustedGeo(req, { VERCEL: '0' }), { country: null, region: null });
  assert.equal(trustedClientIp(req, { VERCEL: '1' }), '198.51.100.20');
  assert.deepEqual(trustedGeo(req, { VERCEL: '1' }), { country: 'US', region: null });
});

test('HMAC values are namespace- and key-version-separated', () => {
  const first = hmacValue(HASH_SECRET, 'v1', 'client-ip', '203.0.113.9');
  assert.equal(first, hmacValue(HASH_SECRET, 'v1', 'client-ip', '203.0.113.9'));
  assert.notEqual(first, hmacValue(HASH_SECRET, 'v2', 'client-ip', '203.0.113.9'));
  assert.notEqual(first, hmacValue(HASH_SECRET, 'v1', 'visitor-id', '203.0.113.9'));
});

test('AES-256-GCM round trips and rejects ciphertext tampering', () => {
  const key = Buffer.alloc(32, 7).toString('base64');
  const encrypted = encryptIp(
    '2001:db8::1',
    key,
    'key-1',
    () => Buffer.alloc(12, 3)
  );
  assert.equal(decryptIp(encrypted, key), '2001:db8::1');
  const tampered = Object.assign({}, encrypted, {
    ciphertext: Buffer.from(encrypted.ciphertext)
  });
  tampered.ciphertext[0] ^= 1;
  assert.throws(() => decryptIp(tampered, key));
});

test('strict payload validation emits server canonical fields and rejects unknown/IP fields', () => {
  const value = validateViewPayload(validPayload(), POLICY);
  assert.equal(value.canonicalPath, '/');
  assert.equal(value.pageTitle, 'Backer');
  assert.equal(value.referrerHostname, 'example.com');
  assert.equal(value.utmId, 'wave_1');

  assert.throws(
    () => validateViewPayload(Object.assign(validPayload(), { ip: '203.0.113.9' }), POLICY),
    /Invalid analytics payload/
  );
  assert.throws(
    () => validateViewPayload(validPayload({ consentPolicyVersion: 'old' }), POLICY),
    /Invalid analytics payload/
  );
  assert.throws(
    () => validateViewPayload(validPayload({ utm: { source: 'x', term: 'private search' } }), POLICY),
    /Invalid analytics payload/
  );
});

test('collector derives trusted network metadata and never accepts browser IP or UA', () => {
  const now = new Date('2026-07-24T12:34:56.000Z');
  const req = {
    headers: {
      'user-agent': 'Mozilla/5.0 Safari/605.1',
      'x-vercel-forwarded-for': '198.51.100.8',
      'x-vercel-ip-country': 'GB',
      'x-vercel-ip-country-region': 'ENG'
    },
    socket: { remoteAddress: '10.0.0.8' }
  };
  const event = buildCollectorEvent(validPayload(), req, {
    config: config(),
    hashSecret: HASH_SECRET,
    now,
    environment: { VERCEL: '1' }
  });
  assert.equal(event.ipMasked, '198.51.100.xxx');
  assert.equal(event.country, 'GB');
  assert.equal(event.region, 'ENG');
  assert.equal(event.isBot, false);
  assert.equal(
    event.ipHash,
    hmacValue(HASH_SECRET, 'v1', 'client-ip', '198.51.100.8')
  );
  assert.equal(event.encryptedIp, null);
  assert.equal(buildDedupeBucket(now), Math.floor(now.getTime() / 10_000));
});

test('bot classifier covers crawlers, prefetch, and normal browsers', () => {
  assert.equal(classifyBot({ 'user-agent': 'Googlebot/2.1' }).isBot, true);
  assert.equal(
    classifyBot({ 'user-agent': 'Mozilla/5.0', purpose: 'prefetch' }).reason,
    'prefetch'
  );
  assert.equal(classifyBot({ 'user-agent': 'Mozilla/5.0 Safari/605.1' }).isBot, false);
  assert.equal(classifyBot({}).reason, 'missing_user_agent');
});

test('signed admin cookies reject tampering', () => {
  const value = encodeAdminCookie(
    SESSION_SECRET,
    '44444444-4444-4444-8444-444444444444',
    'A'.repeat(43)
  );
  assert.equal(decodeAdminCookie(SESSION_SECRET, value).sessionId, '44444444-4444-4444-8444-444444444444');
  assert.equal(decodeAdminCookie(SESSION_SECRET, `${value.slice(0, -1)}x`), null);
});

test('scrypt password hash verifies the intended password', async () => {
  const encoded = await createScryptPasswordHash('correct horse battery staple', {
    n: 16_384,
    r: 8,
    p: 1,
    keyLength: 32,
    salt: Buffer.alloc(16, 9)
  });
  assert.equal(await verifyScryptPassword('correct horse battery staple', encoded), true);
  assert.equal(await verifyScryptPassword('wrong password', encoded), false);
});

test('session response represents missing explicit reauthentication as null', () => {
  const response = sessionResponse(
    {
      admin_identity: 'backer-admin',
      expires_at: new Date('2026-07-24T13:00:00Z'),
      reauthenticated_at: null
    },
    'csrf',
    { storeRawIp: true }
  );
  assert.equal(response.reauthenticatedAt, null);
  assert.equal(response.rawIpRevealEnabled, true);
});

test('CSV escaping prevents formulas and date ranges cap custom queries at 90 days', () => {
  assert.equal(csvCell('=2+2'), "\"'=2+2\"");
  assert.match(toCsv([{ key: 'a', label: 'A' }], [{ a: 'line\nbreak' }]), /line break/);
  const range = parseAnalyticsRange(
    { url: '/api/admin/summary?range=7d' },
    new Date('2026-07-24T22:00:00Z')
  );
  assert.equal(range.from, '2026-07-18');
  assert.equal(range.to, '2026-07-24');
  assert.throws(() =>
    parseAnalyticsRange({
      url: '/api/admin/summary?range=custom&from=2026-01-01&to=2026-07-24'
    })
  );
});
