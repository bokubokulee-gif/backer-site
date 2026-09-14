'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SOURCE = fs.readFileSync(path.join(__dirname, '../js/waitlist.js'), 'utf8');

function node() {
  const listeners = {}, attributes = new Map(), classes = new Set();
  return {
    listeners, attributes, textContent: '', className: '', value: '', disabled: false,
    focusCalls: 0,
    focus() { this.focusCalls++; },
    setAttribute(name, value) { attributes.set(name, value); },
    addEventListener(type, listener) { listeners[type] = listener; },
    classList: {
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); }
    }
  };
}
function harness(endpoint = 'https://api.example.test/api/waitlist', responses = []) {
  const form = node(), input = node(), status = node(), button = node();
  button.textContent = 'Join the waitlist';
  input.value = '  reader@example.test  ';
  form.querySelector = selector => selector === 'button[type="submit"]' ? button : null;
  const nodes = { waitlistForm: form, 'waitlist-email': input, 'waitlist-status': status };
  const calls = [], storageWrites = [], timerClears = [];
  let currentEndpoint = endpoint;
  const context = {
    document: {
      readyState: 'complete',
      getElementById(id) { return nodes[id] || null; },
      querySelector(selector) {
        assert.equal(selector, 'meta[name="backer-waitlist-endpoint"]');
        return currentEndpoint === null ? null : { getAttribute() { return currentEndpoint; } };
      }
    },
    window: {
      matchMedia() { return { matches: false }; },
      location: { href: 'https://example.test/backer-site/waitlist.html?source=trade' },
      setTimeout() { return 1; }, clearTimeout(id) { timerClears.push(id); },
      localStorage: { setItem(...args) { storageWrites.push(args); } },
      fetch(url, options) {
        calls.push({ url, options });
        const response = responses.shift();
        if (response instanceof Error) return Promise.reject(response);
        return Promise.resolve(response);
      }
    },
    URL, Date, AbortController
  };
  vm.runInNewContext(SOURCE, context);
  async function submit() {
    let prevented = false;
    form.listeners.submit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    await new Promise(resolve => setImmediate(resolve));
  }
  return { form, input, status, button, calls, storageWrites, timerClears, submit, setEndpoint(value) { currentEndpoint = value; } };
}
function assertRetryable(h) {
  assert.match(h.status.className, /is-error/);
  assert.doesNotMatch(h.status.className, /is-success/);
  assert.equal(h.button.textContent, 'Join the waitlist');
  assert.equal(h.input.disabled, false);
  assert.equal(h.button.disabled, false);
  assert.deepEqual(h.storageWrites, []);
}
function jsonResponse(body) { return { ok: true, async json() { return body; } }; }

test('missing or invalid endpoint never fetches, stores an email, or claims registration', async () => {
  for (const endpoint of [null, '', '   ', 'javascript:alert(1)']) {
    const h = harness(endpoint);
    await h.submit();
    assertRetryable(h);
    assert.equal(h.calls.length, 0);
    assert.match(h.status.textContent, /temporarily unavailable/);
    h.input.value = 'retry@example.test';
    h.input.listeners.input();
    assert.equal(h.input.attributes.get('aria-invalid'), 'false');
    assert.equal(h.status.textContent, '');
    await h.submit();
    assertRetryable(h);
  }
});

test('invalid email is rejected locally and the visitor can correct it', async () => {
  const h = harness(undefined, [jsonResponse({ ok: true })]);
  h.input.value = 'missing-domain@';
  await h.submit();
  assertRetryable(h);
  assert.equal(h.calls.length, 0);
  assert.equal(h.input.focusCalls, 1);
  h.input.value = 'corrected@example.test';
  h.input.listeners.input();
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.match(h.status.className, /is-success/);
});

test('non-OK HTTP and network failures leave registration unconfirmed and allow retry', async () => {
  const failures = [
    { ok: false, status: 429, json() { throw new Error('non-OK body must not be trusted'); } },
    { ok: false, status: 500, json() { throw new Error('non-OK body must not be trusted'); } },
    new Error('network unavailable')
  ];
  for (const failure of failures) {
    const h = harness(undefined, [failure, jsonResponse({ ok: true })]);
    await h.submit();
    assertRetryable(h);
    assert.equal(h.form.attributes.get('aria-busy'), 'false');
    assert.match(h.status.textContent, /couldn’t confirm/);
    assert.equal(h.timerClears.length, 1);
    await h.submit();
    assert.equal(h.calls.length, 2);
    assert.match(h.status.className, /is-success/);
    assert.deepEqual(h.storageWrites, []);
  }
});

test('HTTP 200 HTML or JSON without explicit ok:true never shows success', async () => {
  const responses = [
    { ok: true, status: 200, async json() { throw new SyntaxError('Unexpected token < in HTML'); } },
    jsonResponse(null), jsonResponse({}), jsonResponse({ ok: false }),
    jsonResponse({ ok: 1 }), jsonResponse({ success: true })
  ];
  for (const response of responses) {
    const h = harness(undefined, [response]);
    await h.submit();
    assertRetryable(h);
    assert.equal(h.calls.length, 1);
    assert.equal(h.form.attributes.get('aria-busy'), 'false');
  }
});

test('only confirmed server acceptance completes signup, without local-only registration', async () => {
  const h = harness(undefined, [jsonResponse({ ok: true })]);
  await h.submit();
  assert.equal(h.calls.length, 1);
  const { url, options } = h.calls[0];
  assert.equal(url, 'https://api.example.test/api/waitlist');
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.headers['Content-Type'], 'application/json');
  const payload = JSON.parse(options.body);
  assert.equal(payload.email, 'reader@example.test');
  assert.equal(payload.source, 'backer-waitlist');
  assert.ok(Number.isFinite(Date.parse(payload.submittedAt)));
  assert.deepEqual(h.storageWrites, []);
  assert.equal(h.button.textContent, 'You’re in');
  assert.equal(h.input.disabled, true);
  assert.equal(h.button.disabled, true);
  assert.equal(h.form.attributes.get('aria-busy'), 'false');
  assert.match(h.status.className, /is-success/);
  assert.match(h.status.textContent, /You’re on the list/);
});
