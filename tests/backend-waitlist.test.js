'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createWaitlistHandler } = require('../api/waitlist');

const ORIGIN = 'https://bokubokulee-gif.github.io';
const NOW = new Date('2026-09-14T04:15:00Z');

function response() {
  return {
    headers: {}, statusCode: 0,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; },
    end(body) { this.body = body; }
  };
}

function request(overrides) {
  return Object.assign({
    method: 'POST',
    body: { email: 'Person+Backer@Example.com', source: 'backer-waitlist', submittedAt: NOW.toISOString() },
    headers: { origin: ORIGIN, 'content-type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.25' },
    socket: { remoteAddress: '127.0.0.1' }
  }, overrides);
}

function setup(overrides) {
  const calls = [];
  const options = Object.assign({
    environment: { DATABASE_URL: 'postgresql://test-only', WAITLIST_RATE_LIMIT_SECRET: 's'.repeat(48), VERCEL: '1' },
    now: () => NOW,
    query: async (sql, values) => { calls.push({ sql, values }); return { rows: [{ request_count: 1 }] }; }
  }, overrides);
  return { handler: createWaitlistHandler(options), calls };
}

test('durably saves a normalized email with bound parameters and server-owned timestamp', async () => {
  const { handler, calls } = setup();
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1].values, ['person+backer@example.com', 'backer-waitlist']);
  assert.match(calls[1].sql, /on conflict \(email\) do nothing/);
  assert.ok(!calls[1].sql.includes('person+backer'));
  assert.match(calls[0].values[0], /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(calls).includes('203.0.113.25'));
  assert.ok(!JSON.stringify(calls).includes('s'.repeat(48)));
  assert.equal(res.headers['access-control-allow-origin'], ORIGIN);
  assert.match(res.headers['cache-control'], /no-store/);
});

test('duplicate registrations receive the same acknowledgement without modifying their original record', async () => {
  const { handler, calls } = setup();
  const first = response();
  const second = response();
  await handler(request(), first);
  await handler(request(), second);
  assert.deepEqual(first.body, second.body);
  assert.equal(second.statusCode, 200);
  assert.ok(calls.filter(({ sql }) => sql.includes('insert into backer_waitlist (')).every(({ sql }) => /do nothing/.test(sql)));
});

test('preflight allows the exact configured origin without touching the database', async () => {
  const { handler, calls } = setup({ environment: { WAITLIST_ALLOWED_ORIGINS: `${ORIGIN},https://backer.example` } });
  const res = response();
  await handler(request({ method: 'OPTIONS', headers: { origin: 'https://backer.example', 'access-control-request-method': 'POST' } }), res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], 'https://backer.example');
  assert.equal(calls.length, 0);
});

test('rejects absent, null, wildcard and lookalike origins before database access', async () => {
  for (const origin of ['', 'null', '*', 'https://bokubokulee-gif.github.io.attacker.example']) {
    const { handler, calls } = setup();
    const res = response();
    await handler(request({ headers: { origin, 'content-type': 'application/json' } }), res);
    assert.equal(res.statusCode, 403, origin);
    assert.equal(calls.length, 0);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  }
});

test('rejects unsafe origin configuration instead of allowing wildcard hosts', async () => {
  for (const origins of ['*', 'https://example.com/path', 'http://example.com', 'https://user:pass@example.com']) {
    const { handler, calls } = setup({ environment: { WAITLIST_ALLOWED_ORIGINS: origins } });
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(calls.length, 0);
  }
});

test('rejects unsupported methods, content types, oversized bodies and malformed data', async () => {
  const cases = [
    [{ method: 'GET' }, 405],
    [{ headers: { origin: ORIGIN, 'content-type': 'text/plain' } }, 415],
    [{ body: '{' }, 400],
    [{ body: [] }, 400],
    [{ body: { email: 'x'.repeat(1100) } }, 413],
    [{ body: { email: 'x@domain' } }, 400],
    [{ body: { email: 'x\n@example.com' } }, 400],
    [{ body: { email: 'x@-example.com' } }, 400],
    [{ body: { email: 'x..y@example.com' } }, 400],
    [{ body: { email: 'x@example.com', source: 'unexpected-source' } }, 400],
    [{ body: { email: 'x@example.com', submittedAt: 'not-a-date' } }, 400],
    [{ body: { email: 'x@example.com', secret: 'unexpected-field' } }, 400]
  ];
  for (const [overrides, status] of cases) {
    const { handler, calls } = setup();
    const res = response();
    await handler(request(overrides), res);
    assert.equal(res.statusCode, status, JSON.stringify(overrides));
    assert.equal(calls.length, 0);
  }
});

test('fails closed if the database, hashing secret or trusted client IP is absent', async () => {
  const environments = [
    {},
    { DATABASE_URL: 'postgresql://test-only' },
    { DATABASE_URL: 'postgresql://test-only', WAITLIST_RATE_LIMIT_SECRET: 'short' }
  ];
  for (const environment of environments) {
    const { handler, calls } = setup({ environment });
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(calls.length, 0);
  }
  const { handler, calls } = setup();
  const res = response();
  await handler(request({ headers: { origin: ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.25' } }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(calls.length, 0);
});

test('durable IP limit rejects the eleventh attempt before insertion and provides a retry time', async () => {
  const calls = [];
  const { handler } = setup({ query: async (sql, values) => { calls.push({ sql, values }); return { rows: [{ request_count: 11 }] }; } });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['retry-after'], '2700');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /on conflict/);
});

test('database failures never acknowledge signup or expose database details', async () => {
  for (const failAt of [1, 2]) {
    let count = 0;
    const { handler } = setup({ query: async () => {
      count += 1;
      if (count === failAt) throw new Error('private@example.com postgresql://secret');
      return { rows: [{ request_count: 1 }] };
    } });
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'Waitlist temporarily unavailable' });
    assert.ok(!JSON.stringify(res).includes('private@example.com'));
  }
});

test('cleanup failure does not turn an already committed signup into an error', async () => {
  let count = 0;
  const { handler } = setup({ query: async () => {
    count += 1;
    if (count === 3) throw new Error('cleanup unavailable');
    return { rows: [{ request_count: 1 }] };
  } });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
});
