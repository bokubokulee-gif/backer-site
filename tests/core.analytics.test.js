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
