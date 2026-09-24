import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildHftRequest, createHftHandler, HFT_CONTRACT, JEV_MODEL } from '../server/hft-local-api.mjs';
import { startHftPreview } from '../scripts/serve-hft-preview.mjs';

const selection = { eventId: 'cut', profileId: 2, historyIncluded: true };
const answer = () => ({ type: 'choice', choice: 'reduce', probabilities: { hold: 0.2, add: 0.1, reduce: 0.6, abstain: 0.1 }, confidence: 0.45 });
const provider = () => ({ model: JEV_MODEL, answers: { next_behavior: answer() }, usage: { input_tokens: 400, output_tokens: 40 } });
const upstream = (value = provider()) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

async function testServer(t, options = {}) {
  let handler;
  const server = createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  handler = createHftHandler({ port, apiKey: 'unit-test-key', fetchImpl: async () => upstream(), ...options });
  t.after(() => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)); });
  return port;
}

function request(port, { route = '/api/hft/evaluate', method = 'POST', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path: route, method,
      headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json;
        try { json = JSON.parse(text); } catch { /* static response */ }
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on('error', reject);
    req.end(body === undefined && method === 'POST' ? JSON.stringify(selection) : body);
  });
}

test('fixed request predicts participant behavior from canonical present-time synthetic state only', () => {
  const requestBody = buildHftRequest(selection);
  assert.equal(requestBody.model, JEV_MODEL);
  assert.deepEqual(Object.keys(requestBody.questions), ['next_behavior']);
  assert.deepEqual(Object.keys(requestBody.questions.next_behavior.criteria), ['hold', 'add', 'reduce', 'abstain']);
  assert.match(requestBody.questions.next_behavior.instructions.task, /not an optimal/);
  assert.equal(requestBody.state.behavioralHistory.records.length, 3);
  assert.deepEqual(Object.keys(requestBody.state), ['evidence', 'instrument', 'behavioralHistory', 'holdings', 'situationalContext', 'constraints']);
  assert.deepEqual(buildHftRequest({ ...selection, historyIncluded: false }).state.behavioralHistory, { status: 'withheld', records: [] });
  assert.deepEqual(buildHftRequest({ ...selection, historyIncluded: false, profileId: 0 }).state,
    buildHftRequest({ ...selection, historyIncluded: false, profileId: 1 }).state);
  for (const bad of [{ ...selection, futurePath: [94, 95] }, { ...selection, historyIncluded: 'false' },
    { ...selection, profileId: '2' }, { ...selection, profileId: 3 }, { ...selection, eventId: '__proto__' }, {}, null]) {
    assert.throws(() => buildHftRequest(bad));
  }
});

test('contract declares local-only scope, synthetic boundary, abstention and future-path separation', async (t) => {
  const port = await testServer(t, { apiKey: '', fetchImpl: async () => assert.fail('No inference for contract') });
  const res = await request(port, { route: '/api/hft/contract', method: 'GET', body: undefined });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, HFT_CONTRACT);
  assert.match(res.json.availability, /local preview only/);
  assert.match(res.json.simulationBoundary, /never sent to Jev/);
  assert.match(res.json.alternativeSemantics.abstain, /does not support/);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('valid model result is validated and returned with exact snapshot and provenance', async (t) => {
  let captured;
  const port = await testServer(t, { fetchImpl: async (url, options) => { captured = { url, options }; return upstream(); } });
  const res = await request(port);
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, { selection, judgment: { ...answer(), source: 'jev', model: JEV_MODEL } });
  assert.equal(captured.url, 'https://api.typesafe.ai/v1/systemone');
  assert.equal(captured.options.headers.Authorization, 'Bearer unit-test-key');
  assert.equal(captured.options.redirect, 'error');
  assert.deepEqual(JSON.parse(captured.options.body), buildHftRequest(selection));
  assert.doesNotMatch(res.text, /unit-test-key|input_tokens|output_tokens/);
});

test('missing key remains an explicit error and never calls the model', async (t) => {
  const port = await testServer(t, { apiKey: '', fetchImpl: async () => assert.fail('No provider without a key') });
  const res = await request(port);
  assert.equal(res.status, 503);
  assert.deepEqual(res.json, { error: 'not_configured' });
});

test('strict input validation rejects text, unknown selectors and unexpected fields before inference', async (t) => {
  const port = await testServer(t, { fetchImpl: async () => assert.fail('Invalid input must not be forwarded') });
  for (const body of ['{', 'null', '[]', JSON.stringify({ ...selection, instructions: 'Buy now' }),
    JSON.stringify({ ...selection, eventId: 'other' }), JSON.stringify({ ...selection, profileId: -1 }),
    JSON.stringify({ ...selection, historyIncluded: 1 })]) {
    const res = await request(port, { body });
    assert.equal(res.status, 400);
    assert.deepEqual(res.json, { error: 'invalid_request' });
  }
  assert.equal((await request(port, { headers: { 'Content-Type': 'text/plain' } })).status, 400);
  assert.equal((await request(port, { body: 'x'.repeat(3000) })).status, 413);
});

test('local host, origin, fetch-site, path and method checks protect inference', async (t) => {
  const port = await testServer(t, { fetchImpl: async () => assert.fail('Rejected request must not be forwarded') });
  for (const headers of [{ Host: 'malicious.example' }, { Origin: 'https://malicious.example' },
    { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    assert.equal((await request(port, { headers })).status, 403);
  }
  assert.equal((await request(port, { method: 'GET' })).status, 405);
  assert.equal((await request(port, { route: '/api/hft/unknown' })).status, 404);
});

test('provider schema failures never appear as successful typed judgments', async (t) => {
  let value;
  const port = await testServer(t, { fetchImpl: async () => upstream(value) });
  const changes = [
    (v) => { v.model = 'jev-latest'; },
    (v) => { v.answers.next_behavior = 'I suggest selling.'; },
    (v) => { v.answers.next_behavior.prose = 'Sell'; },
    (v) => { v.answers.extra = answer(); },
    (v) => { v.answers.next_behavior.choice = 'add'; },
    (v) => { v.answers.next_behavior.probabilities.reduce = 0.2; },
    (v) => { v.answers.next_behavior.probabilities.other = 0; },
    (v) => { delete v.answers.next_behavior.probabilities.abstain; },
    (v) => { v.answers.next_behavior.confidence = '0.45'; },
    (v) => { v.answers.next_behavior.confidence = 2; },
    (v) => { v.answers.next_behavior.probabilities.reduce = null; },
    (v) => { v.answers.next_behavior.source = 'fixture'; }
  ];
  for (const change of changes) {
    value = provider(); change(value);
    const res = await request(port);
    assert.equal(res.status, 502);
    assert.deepEqual(res.json, { error: 'invalid_response' });
  }
});

test('upstream failures and oversized or malformed output return safe codes without details', async (t) => {
  let mode = 'http';
  const port = await testServer(t, { fetchImpl: async () => {
    if (mode === 'http') return new Response('private upstream body unit-test-key', { status: 401 });
    if (mode === 'throw') throw new Error('private upstream diagnostic unit-test-key');
    if (mode === 'malformed') return new Response('not JSON');
    return new Response('x'.repeat(40000));
  } });
  for (const next of ['http', 'throw', 'malformed', 'large']) {
    mode = next;
    const res = await request(port);
    assert.equal(res.status, 502);
    assert.deepEqual(res.json, { error: ['http', 'throw'].includes(mode) ? 'upstream_unavailable' : 'invalid_response' });
    assert.doesNotMatch(res.text, /private|unit-test-key/);
  }
});

test('deadline covers stalled headers and a stalled response body; abort is signaled', async (t) => {
  let signal;
  let mode = 'headers';
  const port = await testServer(t, { timeoutMs: 30, fetchImpl: async (_url, options) => {
    signal = options.signal;
    if (mode === 'headers') return new Promise(() => {});
    return new Response(new ReadableStream({ start() {} }));
  } });
  for (const next of ['headers', 'body']) {
    mode = next;
    const res = await request(port);
    assert.equal(res.status, 504);
    assert.deepEqual(res.json, { error: 'timeout' });
    assert.equal(signal.aborted, true);
  }
});

test('one request at a time and finite request windows bound model use', async (t) => {
  let release;
  let reached;
  const started = new Promise((resolve) => { reached = resolve; });
  let clock = 0;
  const port = await testServer(t, { maxPerMinute: 1, now: () => clock,
    fetchImpl: async () => { reached(); return new Promise((resolve) => { release = () => resolve(upstream()); }); } });
  const first = request(port);
  await started;
  assert.equal((await request(port)).status, 429);
  release();
  assert.equal((await first).status, 200);
  assert.equal((await request(port)).status, 429);
  clock = 60001;
  const next = request(port);
  await new Promise((resolve) => setTimeout(resolve, 10));
  release();
  assert.equal((await next).status, 200);
});

test('slow request bodies time out before model use', async (t) => {
  const port = await testServer(t, { bodyTimeoutMs: 30, fetchImpl: async () => assert.fail('No incomplete request') });
  const result = await new Promise((resolve, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path: '/api/hft/evaluate', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (res) => {
      res.resume();
      res.on('end', () => { req.end(); resolve(res.statusCode); });
    });
    req.on('error', reject);
    req.write('{');
  });
  assert.equal(result, 504);
});

test('preview serves only built public files and blocks source, dotfiles, traversal and escaping symlinks', async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'backer-hft-preview-'));
  const artifactRoot = path.join(folder, '.public-artifact');
  await mkdir(path.join(artifactRoot, 'use-cases'), { recursive: true });
  await writeFile(path.join(artifactRoot, 'use-cases/high-frequency-trading.html'), '<h1>Synthetic preview</h1>');
  await writeFile(path.join(folder, 'secret.js'), 'private secret');
  await writeFile(path.join(artifactRoot, '.env'), 'private secret');
  await symlink(path.join(folder, 'secret.js'), path.join(artifactRoot, 'escape.js'));
  const server = await startHftPreview({ port: 0, artifactRoot, apiKey: '', fetchImpl: async () => assert.fail('No live model') });
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(folder, { recursive: true, force: true }); });
  assert.equal(server.address().address, '127.0.0.1');
  const port = server.address().port;
  const page = await request(port, { route: '/use-cases/high-frequency-trading.html', method: 'GET', body: undefined });
  assert.equal(page.status, 200);
  assert.match(page.text, /Synthetic preview/);
  for (const route of ['/.env', '/%2e%2e/secret.js', '/escape.js', '/server/hft-local-api.mjs', '/docs/HFT_RESEARCH_PRD.md', '/package.json']) {
    const res = await request(port, { route, method: 'GET', body: undefined });
    assert.equal(res.status, 404, route);
    assert.doesNotMatch(res.text, /private secret/);
  }
  assert.equal((await request(port, { route: '/use-cases/high-frequency-trading.html', method: 'HEAD', body: undefined })).text, '');
  assert.equal((await request(port, { route: '/use-cases/high-frequency-trading.html', method: 'GET', headers: { Host: 'malicious.example' } })).status, 403);
  assert.equal((await request(port)).status, 503);
});
