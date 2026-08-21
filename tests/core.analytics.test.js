'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/analytics-core.js');

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test('consent reads and writes only against the bundled privacy policy version', () => {
  const storage = memoryStorage();
  const timestamp = Date.UTC(2026, 6, 24, 12);

  const written = Core.writeConsent(storage, 'accepted', timestamp);
  assert.deepEqual(written, {
    decision: 'accepted',
    policyVersion: Core.POLICY_VERSION,
    timestamp: '2026-07-24T12:00:00.000Z'
  });
  assert.deepEqual(Core.readConsent(storage), written);
});

test('a stored decision from another bundled policy version is invalid', () => {
  const storage = memoryStorage({
    [Core.CONSENT_KEY]: JSON.stringify({
      decision: 'accepted',
      policyVersion: '2026-06-01',
      timestamp: '2026-07-24T12:00:00.000Z'
    })
  });

  assert.equal(Core.readConsent(storage), null);
  assert.equal(Core.effectiveConsent(Core.readConsent(storage), {}), 'rejected');
});

test('malformed consent records fail closed', () => {
  const storage = memoryStorage();
  storage.setItem(Core.CONSENT_KEY, JSON.stringify({
    decision: 'maybe',
    policyVersion: Core.POLICY_VERSION,
    timestamp: '2026-07-24T12:00:00.000Z'
  }));
  assert.equal(Core.readConsent(storage), null);
});

test('event normalization keeps only allowlisted non-PII properties', () => {
  const event = Core.normalizeEvent('market_card_opened', {
    market_id: 'market-42',
    creator_id: 'creator-7',
    source: 'market',
    email: 'person@example.com',
    search_text: 'private search',
    profile_url: 'https://example.com/private'
  });

  assert.deepEqual(event, {
    name: 'market_card_opened',
    props: {
      market_id: 'market-42',
      creator_id: 'creator-7',
      source: 'market'
    }
  });
  assert.equal(Core.normalizeEvent('unapproved_event', { source: 'test' }), null);
});

test('virtual routes sanitize public IDs and never place free-form search text in paths', () => {
  assert.deepEqual(Core.canonicalRoute('search', 'secret search words'), {
    pageKey: 'search',
    path: '/search',
    virtualView: 'search',
    publicId: ''
  });
  assert.equal(Core.canonicalRoute('creator', 'Kai Nakamura?email=x').path, '/creator');
  assert.equal(Core.initialRoute('https://backer.example/waitlist.html').path, '/waitlist');
  assert.deepEqual(Core.initialRoute('https://backer.example/backerdemo.html?view=market'), {
    pageKey: 'trades',
    path: '/trades',
    virtualView: 'trades',
    publicId: ''
  });
  assert.equal(Core.initialRoute('https://backer.example/backerdemo.html#trades').path, '/trades');
  assert.equal(Core.initialRoute('https://backer.example/backerdemo.html#market').path, '/trades');
  assert.equal(Core.initialRoute('https://backer.example/backerdemo.html#market-archive').path, '/trades');
  assert.equal(Core.initialRoute('http://127.0.0.1:8766/backerdemo.html#market-archive').path, '/trades');
  assert.equal(
    Core.initialRoute('https://backer.example/onboarding.html?role=creator&answer=private').path,
    '/onboarding'
  );
  assert.deepEqual(
    Core.initialRoute('https://backer.example/backermarket.html?position=private-holding-42'),
    {
      pageKey: 'market_position',
      path: '/market/position',
      virtualView: 'market_position',
      publicId: ''
    }
  );
});

test('scheduled header display starts at 2,305 and adds five per completed UTC day', () => {
  assert.equal(Core.PUBLIC_COUNT_BASE, 2305);
  assert.equal(Core.PUBLIC_COUNT_DAILY, 5);
  assert.equal(Core.PUBLIC_COUNT_ANCHOR_UTC, Date.UTC(2026, 7, 20));
  assert.equal(Core.publicCountFallback(Date.parse('2026-08-19T23:59:59.999Z')), 2305);
  assert.equal(Core.publicCountFallback(Date.parse('2026-08-20T00:00:00.000Z')), 2305);
  assert.equal(Core.publicCountFallback(Date.parse('2026-08-20T23:59:59.999Z')), 2305);
  assert.equal(Core.publicCountFallback(Date.parse('2026-08-21T00:00:00.000Z')), 2310);
  assert.equal(Core.publicCountFallback(Date.parse('2026-09-01T00:00:00.000Z')), 2365);
});

test('scheduled header display is determined by UTC epoch, not local timezone text', () => {
  const epoch = Date.parse('2026-08-21T00:00:00.000Z');
  assert.equal(Core.publicCountFallback(epoch), Core.publicCountFallback(new Date(epoch)));
  assert.equal(Core.publicCountFallback('2026-08-20T17:00:00-07:00'), 2310);
  assert.equal(Core.publicCountFallback('2026-08-21T08:00:00+08:00'), 2310);
});
