import hftModel from '../js/hft-model.js';

const { buildJudgmentState, validateJudgment } = hftModel;
export const JEV_MODEL = 'jev-1.13.0';
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const QUESTION_ID = 'next_behavior';
const BODY_LIMIT = 2048;
const UPSTREAM_LIMIT = 32768;
const CHOICES = ['hold', 'add', 'reduce', 'abstain'];

const QUESTION = {
  type: 'choice',
  instructions: {
    question: 'Given this synthetic participant’s behavioral history, current holdings and new company announcement, which next behavior is most plausible within the stated decision horizon?',
    task: 'Predict the participant’s likely behavior, not an optimal, safest or most profitable action for the participant or a fund. Do not forecast returns or recommend a fund trade. These authored examples establish no validity for real people.',
    history: 'Use `behavioralHistory.records` in chronological order together with `holdings` and `situationalContext`. When history is withheld, do not infer an identity or invent past behavior. Repetition of a past action is not guaranteed.',
    uncertainty: 'Hold is a supported choice to retain exposure. Abstain means no sufficiently supported behavioral match, not an observed decision to hold and not a missing transaction record. Every probability remains visible; no answer executes an order.'
  },
  criteria: {
    hold: 'Retain the current shares and cash while observing or seeking confirmation; the available evidence supports this waiting behavior.',
    add: 'Buy additional shares within the cash and order-size constraints as a plausible response to this context.',
    reduce: 'Sell some currently held shares within the position and order-size constraints as a plausible response to this context; no short selling.',
    abstain: 'The supplied evidence does not support choosing a likely behavior among holding, adding and reducing, or no candidate fits.'
  }
};

/** The same canonical English question is used for every display language. */
export function buildHftRequest(selection) {
  return { model: JEV_MODEL, state: buildJudgmentState(selection), questions: { [QUESTION_ID]: QUESTION } };
}

export const HFT_CONTRACT = {
  name: 'Backer behavioral research API', version: 'local-preview/v1',
  availability: 'Optional local preview only. The static website does not operate a hosted inference API. No live Jev result or production availability has been established by this demonstration.',
  endpoint: { method: 'POST', path: '/api/hft/evaluate', contentType: 'application/json' },
  request: { type: 'object', additionalProperties: false, required: ['eventId', 'profileId', 'historyIncluded'],
    properties: { eventId: { enum: ['beat', 'cut', 'mixed'] }, profileId: { type: 'integer', enum: [0, 1, 2] }, historyIncluded: { type: 'boolean' } } },
  exampleRequest: { eventId: 'cut', profileId: 2, historyIncluded: true },
  response: { selection: 'The exact eventId, profileId and historyIncluded snapshot, echoed so clients can reject a stale response.',
    judgment: { type: 'choice', choice: CHOICES, probabilities: 'Exactly hold/add/reduce/abstain; finite values in [0,1] with sum 1. The selected choice is a maximum.',
      confidence: 'Finite [0,1]. Distribution concentration, not the probability of correctness.', source: 'jev', model: JEV_MODEL } },
  alternativeSemantics: QUESTION.criteria,
  evidenceBoundary: 'Participant histories, holdings and market snapshots are authored synthetic fixtures. Probabilities compare possible participant behaviors, not future prices, profitability or fund actions. Model abstention, an observed hold and a missing observation are separate concepts.',
  simulationBoundary: 'Code separately compares reader-selected fund alternatives on identical authored future price paths with explicit cash, inventory, spread, fee and fill assumptions. These future paths and fund results are never sent to Jev. Repeating a synthetic example does not train or calibrate a model.',
  verification: 'Mocked provider tests check the software contract and failures. Behavioral accuracy, incremental net returns, latency and real-data coverage require separate held-out and prospective evaluation.',
  security: 'Only the local Node process reads TYPESAFE_API_KEY. Requests accept three allowlisted fixture selectors; no arbitrary history, client prompt or uploaded records. The upstream endpoint, model and English question are fixed server-side. Size, time, rate and concurrency limits apply.',
  errors: { not_configured: 503, invalid_request: 400, upstream_unavailable: 502, invalid_response: 502,
    timeout: 504, too_large: 413, forbidden: 403, method_not_allowed: 405, busy: 429, not_found: 404 },
  errorBehavior: 'Errors return only a stable error code. The UI may retain its explicitly labeled fixture; it must not label that fixture as a Jev response.',
  documentationReviewed: '2026-09-24',
  sources: ['https://docs.typesafe.ai/api', 'https://docs.typesafe.ai/primitives/choice',
    'https://docs.typesafe.ai/concepts/state', 'https://docs.typesafe.ai/models', 'https://docs.typesafe.ai/cookbooks/function_calling']
};

const failure = (code) => Object.assign(new Error(code), { code });

function reply(response, status, value, extra = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin', ...extra });
  response.end(JSON.stringify(value, null, 2));
}

function readJson(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    let done = false;
    let timer;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
      request.off('aborted', onError);
      if (error) { request.resume(); reject(error); } else resolve(value);
    };
    const onData = (chunk) => {
      bytes += chunk.length;
      if (bytes > BODY_LIMIT) return finish(failure('too_large'));
      chunks.push(chunk);
    };
    const onEnd = () => {
      try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { finish(failure('invalid_request')); }
    };
    const onError = () => finish(failure('invalid_request'));
    if (Number(request.headers['content-length']) > BODY_LIMIT) return finish(failure('too_large'));
    timer = setTimeout(() => finish(failure('timeout')), timeoutMs);
    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', onError);
    request.on('aborted', onError);
  });
}

async function upstreamJson(response) {
  if (Number(response.headers.get('content-length')) > UPSTREAM_LIMIT) {
    await response.body?.cancel();
    throw failure('invalid_response');
  }
  if (!response.body) throw failure('invalid_response');
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > UPSTREAM_LIMIT) { await reader.cancel(); throw failure('invalid_response'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw failure('invalid_response'); }
}

export function isLocalRequest(request, port) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  return hosts.includes(request.headers.host) && request.headers['sec-fetch-site'] !== 'cross-site'
    && (request.headers.origin === undefined || hosts.map((host) => `http://${host}`).includes(request.headers.origin));
}

/** Inject fetch and a dummy key in tests; never spend or contact a model in tests. */
export function createHftHandler({ apiKey = process.env.TYPESAFE_API_KEY, fetchImpl = globalThis.fetch,
  port = Number(process.env.BACKER_HFT_PORT || 4191), timeoutMs = 8000, bodyTimeoutMs = 2500,
  maxPerMinute = 30, now = Date.now } = {}) {
  let active = false;
  let requests = 0;
  let windowStart = now();
  return async function handleHft(request, response) {
    const path = request.url.split('?')[0];
    if (!isLocalRequest(request, port)) return reply(response, 403, { error: 'forbidden' });
    if (!['/api/hft/contract', '/api/hft/evaluate'].includes(path)) return reply(response, 404, { error: 'not_found' });
    const method = path === '/api/hft/contract' ? 'GET' : 'POST';
    if (request.method !== method) return reply(response, 405, { error: 'method_not_allowed' }, { Allow: method });
    if (path === '/api/hft/contract') return reply(response, 200, HFT_CONTRACT);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) return reply(response, 400, { error: 'invalid_request' });
    if (active) return reply(response, 429, { error: 'busy' }, { 'Retry-After': '1' });
    if (now() - windowStart >= 60000) { requests = 0; windowStart = now(); }
    if (requests >= maxPerMinute) return reply(response, 429, { error: 'busy' }, { 'Retry-After': '60' });
    active = true;
    requests += 1;
    let timer;
    try {
      const input = await readJson(request, bodyTimeoutMs);
      let body;
      try { body = buildHftRequest(input); }
      catch { throw failure('invalid_request'); }
      const selection = { eventId: input.eventId, profileId: input.profileId, historyIncluded: input.historyIncluded };
      if (typeof apiKey !== 'string' || !apiKey.trim()) throw failure('not_configured');
      const controller = new AbortController();
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => { reject(failure('timeout')); controller.abort(); }, timeoutMs);
      });
      const evaluate = (async () => {
        const upstream = await fetchImpl(ENDPOINT, { method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body) });
        if (!upstream.ok) { await upstream.body?.cancel(); throw failure('upstream_unavailable'); }
        const result = await upstreamJson(upstream);
        const answer = result?.answers?.[QUESTION_ID];
        if (result?.model !== JEV_MODEL || !answer || Object.keys(answer).length !== 4
          || !result.answers || Object.keys(result.answers).length !== 1) throw failure('invalid_response');
        let judgment;
        try { judgment = validateJudgment({ ...answer, source: 'jev', model: result.model }); }
        catch { throw failure('invalid_response'); }
        return { selection, judgment };
      })();
      return reply(response, 200, await Promise.race([evaluate, deadline]));
    } catch (error) {
      const known = Object.hasOwn(HFT_CONTRACT.errors, error?.code);
      return reply(response, known ? HFT_CONTRACT.errors[error.code] : 502, { error: known ? error.code : 'upstream_unavailable' });
    } finally {
      clearTimeout(timer);
      active = false;
    }
  };
}
