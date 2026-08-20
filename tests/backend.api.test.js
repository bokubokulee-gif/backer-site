'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { HttpError } = require('../api/_lib/errors');
const { buildCollectorEvent } = require('../api/_lib/collector');
const { consumeRateLimit } = require('../api/_lib/rate-limit');
const { recordView } = require('../api/_lib/views-repository');
const { runRetentionWithClient } = require('../api/_lib/retention-repository');
const { createConfigHandler } = require('../api/config');
const {
  calculatePublicCount,
  createPublicCountHandler
} = require('../api/analytics/public-count');
const { createRetentionHandler } = require('../api/analytics/retention');
const { createViewHandler } = require('../api/analytics/view');
const { createLoginHandler } = require('../api/_lib/admin-routes/login');
const { createReauthHandler } = require('../api/_lib/admin-routes/reauth');
const { createRevealHandler } = require('../api/_lib/admin-routes/reveal');
const { createSessionHandler } = require('../api/_lib/admin-routes/session');
const { createAdminRouteHandler } = require('../api/admin/[route]');

const NOW = new Date('2026-07-24T12:00:00.000Z');
const HASH_SECRET = 'h'.repeat(48);
const SESSION_SECRET = 's'.repeat(48);

function response() {
  return {
    headers: {},
    statusCode: 0,
    body: undefined,
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      this.ended = true;
      return this;
    },
    send(value) {
      this.body = value;
      this.ended = true;
      return this;
    },
    end(value) {
      this.body = value;
      this.ended = true;
    }
  };
}

function request(method, body, headers, url) {
  return {
    method,
    body,
    headers: Object.assign(
      {
        origin: 'http://localhost:8000',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 Safari/605.1'
      },
      headers || {}
    ),
    socket: { remoteAddress: '127.0.0.1' },
    url: url || '/'
  };
}

function collectorConfig(overrides) {
  return Object.assign(
    {
      consentPolicyVersion: '2026-08-20',
      hashKeyVersion: 'v1',
      encryptionKeyVersion: 'v1',
      storeRawIp: false,
      viewIpLimitPerMinute: 300,
      viewVisitorLimitPerMinute: 120
    },
    overrides || {}
  );
}

function adminConfig(overrides) {
  return Object.assign(
    {
      adminIdentity: 'backer-admin',
      adminSessionTtlSeconds: 3600,
      adminSessionIdleSeconds: 1800,
      adminReauthSeconds: 300,
      hashKeyVersion: 'v1',
      storeRawIp: false,
      rawIpRetentionDays: 7
    },
    overrides || {}
  );
}

function payload(overrides) {
  return Object.assign(
    {
      eventId: '11111111-1111-4111-8111-111111111111',
      pageKey: 'home',
      path: '/',
      pageTitle: 'Backer',
      virtualView: 'home',
      visitorId: '22222222-2222-4222-8222-222222222222',
      sessionId: '33333333-3333-4333-8333-333333333333',
      referrerHostname: '',
      utm: { source: null, medium: null, campaign: null, id: null },
      deviceClass: 'desktop',
      locale: 'en-US',
      consentPolicyVersion: '2026-08-20'
    },
    overrides || {}
  );
}

test('the consolidated admin route preserves public endpoint paths and fails closed for unknown routes', async () => {
  const handler = createAdminRouteHandler({
    routes: {
      session: async (_req, res) => res.status(200).json({ ok: true })
    }
  });
  const success = response();
  await handler(request('GET', undefined, {}, '/api/admin/session'), success);
  assert.equal(success.statusCode, 200);
  assert.deepEqual(success.body, { ok: true });

  const missing = response();
  await handler(request('GET', undefined, {}, '/api/admin/not-a-route'), missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body.error, 'Not found');
});

function adminSession(overrides) {
  return Object.assign(
    {
      id: '44444444-4444-4444-8444-444444444444',
      admin_identity: 'backer-admin',
      csrf_token_hash: 'csrf-hash',
      expires_at: new Date('2026-07-24T13:00:00.000Z'),
      reauthenticated_at: null
    },
    overrides || {}
  );
}

function adminDependencies(overrides) {
  const audits = [];
  const repository = {
    consumeReauthRateLimit: async () => 1,
    insertAudit: async (entry) => audits.push(entry),
    markReauthenticated: async (_id, now) => now,
    setCsrfToken: async () => {}
  };
  return Object.assign(
    {
      config: adminConfig(),
      now: () => NOW,
      assertOrigin: () => 'http://localhost:8000',
      assertReadOrigin: () => null,
      authenticate: async () => adminSession(),
      assertCsrf: () => {},
      requestIpHash: () => 'request-ip-hash',
      authRepository: repository,
      hashSecret: HASH_SECRET,
      sessionSecret: SESSION_SECRET,
      audits
    },
    overrides || {}
  );
}

test('GET /api/config returns only the public contract and is never cached', async () => {
  const handler = createConfigHandler({
    collectionEnabled: true,
    config: {
      ga4MeasurementId: 'g-test123',
      consentPolicyVersion: '2026-08-20',
      publicViewCountsEnabled: true
    }
  });
  const res = response();
  await handler(request('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ga4MeasurementId: 'G-TEST123',
    analyticsCollectionEnabled: true,
    consentPolicyVersion: '2026-08-20',
    publicViewCountsEnabled: true
  });
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
});

test('POST /api/analytics/view accepts one strict valid event with a small 202', async () => {
  let captured;
  const handler = createViewHandler({
    config: collectorConfig(),
    now: () => NOW,
    hashSecret: HASH_SECRET,
    environment: { VERCEL: '0', NODE_ENV: 'test' },
    assertOrigin: () => 'http://localhost:8000',
    recordView: async (event, limits) => {
      captured = { event, limits };
      return { accepted: true };
    }
  });
  const res = response();
  await handler(request('POST', payload()), res);
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, { accepted: true });
  assert.equal(captured.event.canonicalPath, '/');
  assert.equal(captured.event.ipMasked, '127.0.0.xxx');
  assert.equal(captured.limits.ipPerMinute, 300);
  assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'id'), false);
});

test('collector rejects disallowed origin, invalid media, oversized body, and client IP fields', async (t) => {
  await t.test('origin', async () => {
    const handler = createViewHandler({
      config: collectorConfig(),
      hashSecret: HASH_SECRET,
      environment: { NODE_ENV: 'production', ANALYTICS_ALLOWED_ORIGINS: 'https://backer.example' },
      recordView: async () => assert.fail('must not write')
    });
    const res = response();
    await handler(request('POST', payload(), { origin: 'https://evil.example' }), res);
    assert.equal(res.statusCode, 403);
  });

  await t.test('media type', async () => {
    const handler = createViewHandler({
      config: collectorConfig(),
      assertOrigin: () => 'http://localhost:8000',
      recordView: async () => assert.fail('must not write')
    });
    const res = response();
    await handler(request('POST', payload(), { 'content-type': 'text/plain' }), res);
    assert.equal(res.statusCode, 415);
  });

  await t.test('body size', async () => {
    const handler = createViewHandler({
      config: collectorConfig(),
      assertOrigin: () => 'http://localhost:8000',
      recordView: async () => assert.fail('must not write')
    });
    const res = response();
    await handler(request('POST', payload(), { 'content-length': '9000' }), res);
    assert.equal(res.statusCode, 413);
  });

  await t.test('client IP', async () => {
    const handler = createViewHandler({
      config: collectorConfig(),
      now: () => NOW,
      hashSecret: HASH_SECRET,
      environment: { VERCEL: '0' },
      assertOrigin: () => 'http://localhost:8000',
      recordView: async () => assert.fail('must not write')
    });
    const res = response();
    await handler(request('POST', Object.assign(payload(), { ip: '203.0.113.8' })), res);
    assert.equal(res.statusCode, 400);
  });
});

test('DB-backed rate limiter returns 429 after the configured atomic count', async () => {
  const client = {
    query: async () => ({ rows: [{ request_count: 11 }] })
  };
  await assert.rejects(
    consumeRateLimit(client, {
      scope: 'view_ip',
      keyHash: 'ip',
      limit: 10,
      now: NOW,
      windowMilliseconds: 60_000
    }),
    (error) => error instanceof HttpError && error.status === 429
  );
});

test('same page/day rollup recomputation is serialized across concurrent view transactions', async () => {
  const tails = new Map();
  let activeRollups = 0;
  let maximumActiveRollups = 0;

  async function acquire(key) {
    const previous = tails.get(key) || Promise.resolve();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    tails.set(key, previous.then(() => gate));
    await previous;
    return release;
  }

  function transaction(work) {
    const releases = [];
    const client = {
      async query(text, values) {
        if (text.includes('pg_advisory_xact_lock')) {
          releases.push(await acquire(values[0]));
          return { rows: [], rowCount: 1 };
        }
        if (text.includes('select 1') && text.includes('analytics_page_views')) {
          return { rows: [], rowCount: 0 };
        }
        if (text.includes('insert into analytics_rate_limits')) {
          return { rows: [{ request_count: 1 }], rowCount: 1 };
        }
        if (text.includes('from analytics_sessions') && text.includes('for update')) {
          return { rows: [], rowCount: 0 };
        }
        if (text.includes('insert into analytics_page_views')) {
          return { rows: [{ id: 'view-id' }], rowCount: 1 };
        }
        if (text.includes('insert into analytics_daily_rollups')) {
          activeRollups += 1;
          maximumActiveRollups = Math.max(maximumActiveRollups, activeRollups);
          await new Promise((resolve) => setTimeout(resolve, 5));
          activeRollups -= 1;
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 1 };
      }
    };
    return Promise.resolve()
      .then(() => work(client))
      .finally(() => releases.reverse().forEach((release) => release()));
  }

  const req = request('POST', payload());
  const first = buildCollectorEvent(payload(), req, {
    config: collectorConfig(),
    hashSecret: HASH_SECRET,
    now: NOW,
    environment: { VERCEL: '0' }
  });
  const second = buildCollectorEvent(
    payload({
      eventId: '55555555-5555-4555-8555-555555555555',
      visitorId: '66666666-6666-4666-8666-666666666666',
      sessionId: '77777777-7777-4777-8777-777777777777'
    }),
    req,
    {
      config: collectorConfig(),
      hashSecret: HASH_SECRET,
      now: NOW,
      environment: { VERCEL: '0' }
    }
  );
  await Promise.all([
    recordView(first, { ipPerMinute: 300, visitorPerMinute: 120 }, { withTransaction: transaction }),
    recordView(second, { ipPerMinute: 300, visitorPerMinute: 120 }, { withTransaction: transaction })
  ]);
  assert.equal(maximumActiveRollups, 1);
});

test('duplicate idempotency key is accepted without a second rate-limit, insert, or rollup', async () => {
  let writeQueries = 0;
  const transaction = async (work) =>
    work({
      async query(text) {
        if (text.includes('pg_advisory_xact_lock')) return { rows: [], rowCount: 1 };
        if (text.includes('select 1') && text.includes('analytics_page_views')) {
          return { rows: [{ exists: 1 }], rowCount: 1 };
        }
        writeQueries += 1;
        return { rows: [], rowCount: 1 };
      }
    });
  const event = buildCollectorEvent(payload(), request('POST', payload()), {
    config: collectorConfig(),
    hashSecret: HASH_SECRET,
    now: NOW,
    environment: { VERCEL: '0' }
  });
  const result = await recordView(
    event,
    { ipPerMinute: 300, visitorPerMinute: 120 },
    { withTransaction: transaction }
  );
  assert.deepEqual(result, { accepted: true, duplicate: true });
  assert.equal(writeQueries, 0);
});

test('same session and page inside one 10-second bucket is suppressed once', async () => {
  const seenDedupeKeys = new Set();
  let pageInserts = 0;
  const transaction = async (work) =>
    work({
      async query(text, values) {
        if (text.includes('pg_advisory_xact_lock')) return { rows: [], rowCount: 1 };
        if (text.includes('select 1') && text.includes('analytics_page_views')) {
          const duplicate = seenDedupeKeys.has(values[1]);
          return { rows: duplicate ? [{ exists: 1 }] : [], rowCount: duplicate ? 1 : 0 };
        }
        if (text.includes('insert into analytics_rate_limits')) {
          return { rows: [{ request_count: 1 }], rowCount: 1 };
        }
        if (text.includes('from analytics_sessions') && text.includes('for update')) {
          return { rows: [], rowCount: 0 };
        }
        if (text.includes('insert into analytics_page_views')) {
          pageInserts += 1;
          seenDedupeKeys.add(values[29]);
          return { rows: [{ id: `view-${pageInserts}` }], rowCount: 1 };
        }
        return { rows: [], rowCount: 1 };
      }
    });
  const req = request('POST', payload());
  const first = buildCollectorEvent(payload(), req, {
    config: collectorConfig(),
    hashSecret: HASH_SECRET,
    now: new Date('2026-07-24T12:00:01.000Z'),
    environment: { VERCEL: '0' }
  });
  const second = buildCollectorEvent(
    payload({ eventId: '99999999-9999-4999-8999-999999999999' }),
    req,
    {
      config: collectorConfig(),
      hashSecret: HASH_SECRET,
      now: new Date('2026-07-24T12:00:09.000Z'),
      environment: { VERCEL: '0' }
    }
  );
  assert.equal(first.dedupeKey, second.dedupeKey);
  const firstResult = await recordView(
    first,
    { ipPerMinute: 300, visitorPerMinute: 120 },
    { withTransaction: transaction }
  );
  const secondResult = await recordView(
    second,
    { ipPerMinute: 300, visitorPerMinute: 120 },
    { withTransaction: transaction }
  );
  assert.equal(firstResult.duplicate, false);
  assert.equal(secondResult.duplicate, true);
  assert.equal(pageInserts, 1);
});

test('bot traffic is stored diagnostically but excluded from human rollup and summary SQL', async () => {
  let insertedBotFlag;
  let rollupSql = '';
  const transaction = async (work) =>
    work({
      async query(text, values) {
        if (text.includes('pg_advisory_xact_lock')) return { rows: [], rowCount: 1 };
        if (text.includes('select 1') && text.includes('analytics_page_views')) {
          return { rows: [], rowCount: 0 };
        }
        if (text.includes('insert into analytics_rate_limits')) {
          return { rows: [{ request_count: 1 }], rowCount: 1 };
        }
        if (text.includes('from analytics_sessions') && text.includes('for update')) {
          return { rows: [], rowCount: 0 };
        }
        if (text.includes('insert into analytics_page_views')) {
          insertedBotFlag = values[26];
          return { rows: [{ id: 'bot-view' }], rowCount: 1 };
        }
        if (text.includes('insert into analytics_daily_rollups')) rollupSql = text;
        return { rows: [], rowCount: 1 };
      }
    });
  const botRequest = request('POST', payload(), { 'user-agent': 'Googlebot/2.1' });
  const botEvent = buildCollectorEvent(payload(), botRequest, {
    config: collectorConfig(),
    hashSecret: HASH_SECRET,
    now: NOW,
    environment: { VERCEL: '0' }
  });
  await recordView(
    botEvent,
    { ipPerMinute: 300, visitorPerMinute: 120 },
    { withTransaction: transaction }
  );
  assert.equal(insertedBotFlag, true);
  assert.doesNotMatch(rollupSql, /count\(\*\)|count\(distinct/i);
  assert.match(rollupSql, /human_views = analytics_daily_rollups\.human_views \+ excluded\.human_views/);
  assert.match(rollupSql, /bot_views = analytics_daily_rollups\.bot_views \+ excluded\.bot_views/);
  assert.match(rollupSql, /and session_record_id = \$6/);
  assert.match(rollupSql, /and visitor_hash = \$7/);
  assert.match(rollupSql, /and ip_hash = \$8/);

  const dbModule = require('../api/_lib/db');
  const repositoryPath = require.resolve('../api/_lib/admin-analytics-repository');
  const originalQuery = dbModule.query;
  const summaryQueries = [];
  try {
    dbModule.query = async (text) => {
      summaryQueries.push(text);
      if (text.includes('as human_views') && !text.includes('group by')) {
        return {
          rows: [{
            human_views: '0',
            bot_views: '1',
            unique_visitors: '0',
            unique_ips: '0',
            sessions: '0'
          }]
        };
      }
      return { rows: [] };
    };
    delete require.cache[repositoryPath];
    const repository = require(repositoryPath);
    const data = await repository.summary({ start: NOW, endExclusive: new Date(NOW.getTime() + 1000) });
    assert.equal(data.totals.humanViews, 0);
    assert.equal(data.totals.botViews, 1);
    const humanMetricQueries = summaryQueries.filter((text) => text.includes('as human_views'));
    assert.ok(humanMetricQueries.length >= 2);
    humanMetricQueries.forEach((text) => assert.match(text, /filter \(where not is_bot\)/));
  } finally {
    dbModule.query = originalQuery;
    delete require.cache[repositoryPath];
  }
});

test('login does not grant recent reauthentication', async () => {
  const audits = [];
  const config = adminConfig();
  const repository = {
    consumeLoginRateLimit: async () => 1,
    insertAudit: async (entry) => audits.push(entry)
  };
  const handler = createLoginHandler({
    config,
    now: () => NOW,
    assertOrigin: () => 'http://localhost:8000',
    requestIpHash: () => 'ip-hash',
    verifyPassword: async () => true,
    passwordHash: 'test-hash',
    authRepository: repository,
    createSession: async () => ({
      session: adminSession({ reauthenticated_at: null }),
      csrfToken: 'csrf',
      setCookie: '__Host-backer_admin=signed; Secure'
    })
  });
  const res = response();
  await handler(request('POST', { password: 'a sufficiently long password' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reauthenticatedAt, null);
  assert.match(res.headers['set-cookie'], /Secure/);
});

test('reauth is throttled before scrypt and invalid credentials return 403 without logging out', async (t) => {
  await t.test('wrong password', async () => {
    let throttleCalls = 0;
    const deps = adminDependencies();
    deps.authRepository.consumeReauthRateLimit = async () => {
      throttleCalls += 1;
    };
    deps.verifyPassword = async () => false;
    deps.passwordHash = 'test-hash';
    const handler = createReauthHandler(deps);
    const res = response();
    await handler(request('POST', { password: 'wrong' }, { 'x-csrf-token': 'csrf' }), res);
    assert.equal(throttleCalls, 1);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Forbidden' });
  });

  await t.test('rate limited before password work', async () => {
    let verifyCalls = 0;
    const deps = adminDependencies();
    deps.authRepository.consumeReauthRateLimit = async () => {
      throw new HttpError(429, 'Too many requests', 'rate_limited');
    };
    deps.verifyPassword = async () => {
      verifyCalls += 1;
      return true;
    };
    deps.passwordHash = 'test-hash';
    const handler = createReauthHandler(deps);
    const res = response();
    await handler(request('POST', { password: 'password' }, { 'x-csrf-token': 'csrf' }), res);
    assert.equal(res.statusCode, 429);
    assert.equal(verifyCalls, 0);
  });
});

test('reveal requires explicit recent reauth, respects raw mode, and audits successful one-IP reveal', async (t) => {
  await t.test('missing reauth', async () => {
    let queried = false;
    const deps = adminDependencies({
      config: adminConfig({ storeRawIp: true }),
      analyticsRepository: {
        encryptedView: async () => {
          queried = true;
        }
      }
    });
    const handler = createRevealHandler(deps);
    const res = response();
    await handler(
      request('POST', { viewId: '88888888-8888-4888-8888-888888888888' }, { 'x-csrf-token': 'csrf' }),
      res
    );
    assert.equal(res.statusCode, 403);
    assert.equal(queried, false);
  });

  await t.test('raw mode disabled', async () => {
    const deps = adminDependencies();
    const handler = createRevealHandler(deps);
    const res = response();
    await handler(
      request('POST', { viewId: '88888888-8888-4888-8888-888888888888' }, { 'x-csrf-token': 'csrf' }),
      res
    );
    assert.equal(res.statusCode, 403);
  });

  await t.test('success with audit', async () => {
    const deps = adminDependencies({
      config: adminConfig({
        storeRawIp: true,
        encryptionKeyVersion: 'v1'
      }),
      authenticate: async () =>
        adminSession({ reauthenticated_at: new Date('2026-07-24T11:59:00.000Z') }),
      encryptionKeys: { v1: 'test-key' },
      decryptIp: () => '203.0.113.9',
      analyticsRepository: {
        encryptedView: async () => ({
          encrypted_ip_ciphertext: Buffer.from('ciphertext'),
          encrypted_ip_iv: Buffer.alloc(12),
          encrypted_ip_tag: Buffer.alloc(16),
          ip_encryption_key_version: 'v1'
        })
      }
    });
    const handler = createRevealHandler(deps);
    const res = response();
    const viewId = '88888888-8888-4888-8888-888888888888';
    await handler(
      request('POST', { viewId }, { 'x-csrf-token': 'csrf' }),
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ip, '203.0.113.9');
    assert.deepEqual(
      deps.audits.map((entry) => entry.action),
      ['analytics_ip_reveal_requested', 'analytics_ip_revealed']
    );
    assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
  });
});

test('expired admin session is rejected with a generic no-store 401', async () => {
  const handler = createSessionHandler(
    adminDependencies({
      authenticate: async () => {
        throw new HttpError(401, 'Unauthorized', 'expired_admin_session');
      }
    })
  );
  const res = response();
  await handler(request('GET', undefined, {}, '/api/admin/session'), res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Unauthorized' });
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
});

test('retention nulls encrypted IP first, deletes detailed data, and purges audit only in retention mode', async () => {
  const statements = [];
  const rowCounts = [3, 5, 2, 7, 1, 4];
  let index = 0;
  const client = {
    async query(text, values) {
      statements.push({ text: text.replace(/\s+/g, ' ').trim(), values });
      if (text.includes('set local')) return { rowCount: null, rows: [] };
      return { rowCount: rowCounts[index++], rows: [] };
    }
  };
  const result = await runRetentionWithClient(client, NOW, {
    rawIpRetentionDays: 7,
    eventRetentionDays: 90
  });
  assert.deepEqual(result, {
    encryptedIpsDeleted: 3,
    detailedEventsDeleted: 5,
    sessionsDeleted: 2,
    rateLimitBucketsDeleted: 7,
    adminSessionsDeleted: 1,
    auditRowsDeleted: 4
  });
  assert.match(statements[0].text, /set encrypted_ip_ciphertext = null/);
  assert.ok(statements.some((statement) => statement.text.includes("set local backer.allow_audit_retention = 'on'")));
});

test('retention endpoint requires its bearer secret', async () => {
  let calls = 0;
  const handler = createRetentionHandler({
    cronSecret: 'a-secure-cron-secret',
    config: { rawIpRetentionDays: 7, eventRetentionDays: 90 },
    now: () => NOW,
    runRetention: async () => {
      calls += 1;
      return { detailedEventsDeleted: 0 };
    }
  });
  const denied = response();
  await handler(request('GET', undefined, { authorization: 'Bearer wrong' }), denied);
  assert.equal(denied.statusCode, 401);
  assert.equal(calls, 0);

  const allowed = response();
  await handler(
    request('GET', undefined, { authorization: 'Bearer a-secure-cron-secret' }),
    allowed
  );
  assert.equal(allowed.statusCode, 200);
  assert.equal(calls, 1);
});

test('public count returns only durable recorded human views', async () => {
  const config = {
    publicViewCountsEnabled: true
  };
  assert.equal(calculatePublicCount(config, 11), 11);
  assert.throws(() => calculatePublicCount(config, -1), /Invalid human view count/);
  let anchor;
  const handler = createPublicCountHandler({
    config,
    totalHumanViews: async (value) => {
      anchor = value;
      return 11;
    }
  });
  const res = response();
  await handler(request('GET'), res);
  assert.equal(anchor, '1970-01-01');
  assert.deepEqual(res.body, { count: 11, source: 'human_views' });
});
