'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Catalog = require('../js/discovery-catalog-client');
const Store = require('../js/market-draft-store');

const ROOT = path.resolve(__dirname, '..');
const NOW = Date.parse('2026-08-21T00:00:00.000Z');

function validDraft(overrides) {
  const draft = {
    schemaVersion: 2,
    draftId: 'proposal_123456',
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    source: 'discovery-builder',
    executionMode: 'simulation',
    status: 'local_draft',
    approvalStatus: 'discovery_proposal',
    subject: {
      type: 'content-growth',
      person: {
        id: 'creator_exact',
        name: 'Exact Creator',
        identityKind: 'public_discovery',
        tradable: false,
        platforms: [{ id: 'github', sourceIdentityId: 'identity_exact', url: 'https://github.com/exact' }]
      },
      content: { id: 'content_exact', title: 'Exact Work', platform: 'github', url: 'https://github.com/exact/work' }
    },
    instrument: 'milestone',
    outcome: {
      type: 'binary',
      question: 'Will Exact Work grow to 250 stars by the cutoff?',
      outcomes: [{ id: 'GROWS_TO_TARGET', label: 'Grows to target' }, { id: 'DOES_NOT_REACH_TARGET', label: 'Does not reach target' }]
    },
    resolution: {
      platform: 'github',
      metricKey: 'stars',
      metricLabel: 'Stars',
      unit: 'count',
      readiness: 'retained_observation',
      observation: {
        id: 'metric_exact',
        entityType: 'content',
        entityId: 'content_exact',
        provider: 'github',
        metric: 'stars',
        value: 100,
        unit: 'count',
        observedAt: '2026-08-20T00:00:00.000Z',
        sourceUrl: 'https://github.com/exact/work',
        methodologyVersion: 'github-rest-v3'
      },
      baseline: {
        value: 100,
        observedAt: '2026-08-20T00:00:00.000Z',
        provenance: 'retained_source_observation',
        sourceUrl: 'https://github.com/exact/work'
      },
      target: { value: 250, direction: 'at_least' },
      deadline: '2026-10-01T23:59:59.000Z',
      sourceUrl: 'https://github.com/exact/work'
    },
    rules: {
      graceHours: 24,
      deletionRule: 'pause_then_void',
      correctionRule: 'latest_valid_before_cutoff',
      tieRule: 'not_applicable',
      voidRule: 'refund_original_cost',
      disputeHours: 48
    },
    market: {
      lifecycle: 'DRAFT',
      approvalStatus: 'discovery_proposal',
      quote: null,
      feeRate: null,
      stake: null,
      maxLoss: null,
      payout: null
    },
    validation: { structurallyValid: true, executable: false, blockers: [] },
    provenance: { noFabricatedMetrics: true }
  };
  return Object.assign(draft, overrides || {});
}

test('retained discovery client preserves exact subjects, all work, and observation provenance', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/discovery-catalog.json'), 'utf8'));
  const data = Catalog.normalize(raw);
  assert.equal(data.people.length, raw.creators.length);
  assert.equal(data.people.reduce((sum, person) => sum + person.content.length, 0), raw.contentRecords.length);
  const sourceWork = raw.contentRecords.find((work) => raw.metricObservations.some((metric) => metric.entityType === 'content' && metric.entityId === work.id));
  const person = Catalog.personById(data, sourceWork.creatorId);
  const work = Catalog.workById(person, sourceWork.id);
  const sourceMetric = raw.metricObservations.find((metric) => metric.entityType === 'content' && metric.entityId === work.id);
  const metric = work.publicCounts.find((row) => row.id === sourceMetric.id);
  assert.equal(work.id, sourceWork.id);
  assert.equal(metric.entityId, sourceWork.id);
  assert.equal(metric.provider, sourceMetric.provider);
  assert.equal(metric.methodologyVersion, sourceMetric.methodologyVersion);
  assert.equal(metric.sourceUrl, sourceMetric.sourceUrl);
  assert.ok(data.people.every((row) => row.identityKind === 'public_discovery' && row.tradable === false));
  assert.equal(Catalog.personById(data, 'missing-subject'), null);
  assert.equal(Catalog.workById(person, 'missing-work'), null);
});

test('v2 proposal store validates exact retained observation and never touches portfolio storage', () => {
  const local = Store.memoryStorage();
  local.setItem('backer_portfolio_v1', '[{"id":"keep"}]');
  const api = Store.create({ localStorage: local, sessionStorage: Store.memoryStorage(), now: () => NOW });
  const saved = api.save(validDraft());
  assert.equal(saved.ok, true);
  assert.equal(saved.storage, 'local');
  assert.equal(api.read('proposal_123456').draft.resolution.observation.id, 'metric_exact');
  assert.equal(api.list().length, 1);
  assert.equal(local.getItem('backer_portfolio_v1'), '[{"id":"keep"}]');

  const mismatch = validDraft({ draftId: 'proposal_mismatch' });
  mismatch.resolution = JSON.parse(JSON.stringify(mismatch.resolution));
  mismatch.resolution.observation.entityId = 'content_other';
  assert.equal(api.save(mismatch).code, 'observation_mismatch');
});

test('manual metrics remain unverified ideas with no retained observation', () => {
  const draft = validDraft({ draftId: 'proposal_manual' });
  draft.resolution = JSON.parse(JSON.stringify(draft.resolution));
  draft.resolution.metricKey = 'provider_native_count';
  draft.resolution.metricLabel = 'Provider native count';
  draft.resolution.readiness = 'unverified_idea';
  draft.resolution.observation = null;
  draft.resolution.baseline.provenance = 'user_entered_unverified';
  const result = Store.validate(draft, { now: NOW });
  assert.equal(result.ok, true);

  draft.resolution.observation = validDraft().resolution.observation;
  assert.equal(Store.validate(draft, { now: NOW }).code, 'invalid_readiness');
});

test('store falls back to session storage and discloses tab-only persistence', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {}, key() { return null; }, length: 0 };
  const session = Store.memoryStorage();
  const api = Store.create({ localStorage: blocked, sessionStorage: session, now: () => NOW });
  const saved = api.save(validDraft());
  assert.equal(saved.ok, true);
  assert.equal(saved.storage, 'session');
  assert.equal(saved.disclosure, 'Saved for this tab only');
  assert.equal(api.read(saved.draft.draftId).durable, false);
});

test('store prunes expired, corrupt, oversized, and oldest proposals to a maximum of fifty', () => {
  const local = Store.memoryStorage();
  const api = Store.create({ localStorage: local, sessionStorage: Store.memoryStorage(), now: () => NOW });
  for (let index = 0; index < 51; index += 1) {
    const timestamp = new Date(NOW - index * 1000).toISOString();
    const draft = validDraft({ draftId: `proposal_${String(index).padStart(6, '0')}`, createdAt: timestamp, updatedAt: timestamp });
    assert.equal(api.save(draft).ok, true);
  }
  assert.equal(api.list().length, 50);
  assert.equal(api.read('proposal_000050').code, 'not_found');

  local.setItem(Store.PREFIX + 'proposal_corrupt', '{broken');
  local.setItem(Store.INDEX_KEY, JSON.stringify([{ draftId: 'proposal_corrupt' }].concat(JSON.parse(local.getItem(Store.INDEX_KEY)))));
  assert.equal(api.read('proposal_corrupt').ok, false);
  assert.equal(local.getItem(Store.PREFIX + 'proposal_corrupt'), null);

  const injectedHuge = validDraft({ draftId: 'proposal_injected_huge', padding: 'x'.repeat(Store.MAX_ITEM_BYTES) });
  local.setItem(Store.PREFIX + injectedHuge.draftId, JSON.stringify(injectedHuge));
  assert.equal(api.read(injectedHuge.draftId).code, 'item_too_large');
  assert.equal(local.getItem(Store.PREFIX + injectedHuge.draftId), null);

  const huge = validDraft({ draftId: 'proposal_hugeee', padding: 'x'.repeat(Store.MAX_ITEM_BYTES) });
  assert.equal(api.save(huge).code, 'item_too_large');

  const expired = validDraft({ draftId: 'proposal_expire', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
  assert.equal(api.save(expired).code, 'expired');
});

test('legacy session drafts are read-only fallback and are downgraded to unverified proposals', () => {
  const session = Store.memoryStorage();
  const current = validDraft({ draftId: 'legacy_123456' });
  const legacy = JSON.parse(JSON.stringify(current));
  legacy.schemaVersion = 1;
  legacy.status = 'approved_simulation';
  legacy.approvalStatus = 'approved_simulation';
  legacy.market.lifecycle = 'OPEN';
  legacy.market.approvalStatus = 'approved_simulation';
  legacy.market.quote = 63;
  session.setItem(Store.LEGACY_PREFIX + legacy.draftId, JSON.stringify(legacy));
  const api = Store.create({ localStorage: Store.memoryStorage(), sessionStorage: session, now: () => NOW });
  const result = api.read(legacy.draftId);
  assert.equal(result.ok, true);
  assert.equal(result.legacy, true);
  assert.equal(result.draft.schemaVersion, 2);
  assert.equal(result.draft.status, 'local_draft');
  assert.equal(result.draft.market.quote, null);
  assert.equal(result.draft.resolution.readiness, 'unverified_idea');
  assert.equal(session.getItem(Store.PREFIX + legacy.draftId), null, 'legacy reads must not write a v2 copy');
});

test('proposal store rejects approval, invented terms, credentials, and malformed URLs', () => {
  const approved = validDraft({ draftId: 'proposal_approve', approvalStatus: 'approved_simulation' });
  assert.equal(Store.validate(approved, { now: NOW }).code, 'invalid_boundary');
  const priced = validDraft({ draftId: 'proposal_priced' });
  priced.market = Object.assign({}, priced.market, { quote: 52 });
  assert.equal(Store.validate(priced, { now: NOW }).code, 'invented_terms');
  const secret = validDraft({ draftId: 'proposal_secret', auth_token: 'do-not-store' });
  assert.equal(Store.validate(secret, { now: NOW }).code, 'forbidden_secret');
  const credentials = validDraft({ draftId: 'proposal_badurl' });
  credentials.resolution = JSON.parse(JSON.stringify(credentials.resolution));
  credentials.resolution.sourceUrl = 'https://user:pass@example.com/value';
  assert.equal(Store.validate(credentials, { now: NOW }).code, 'invalid_url');

  const tradable = validDraft({ draftId: 'proposal_tradable' });
  tradable.subject = JSON.parse(JSON.stringify(tradable.subject));
  tradable.subject.person.tradable = true;
  assert.equal(Store.validate(tradable, { now: NOW }).code, 'invalid_subject_boundary');

  const eventOutcomes = validDraft({ draftId: 'proposal_yesno' });
  eventOutcomes.outcome = Object.assign({}, eventOutcomes.outcome, { outcomes: [{ id: 'YES', label: 'Yes' }, { id: 'NO', label: 'No' }] });
  assert.equal(Store.validate(eventOutcomes, { now: NOW }).code, 'invalid_outcome');

  const executable = validDraft({ draftId: 'proposal_executable' });
  executable.validation = Object.assign({}, executable.validation, { executable: true });
  assert.equal(Store.validate(executable, { now: NOW }).code, 'invalid_market_boundary');

  const wrongDirection = validDraft({ draftId: 'proposal_direction' });
  wrongDirection.resolution = JSON.parse(JSON.stringify(wrongDirection.resolution));
  wrongDirection.resolution.target.direction = 'highest_at_cutoff_above_minimum';
  assert.equal(Store.validate(wrongDirection, { now: NOW }).code, 'invalid_direction');
});

test('read skips a corrupt local copy when a valid tab fallback exists', () => {
  const local = Store.memoryStorage();
  const session = Store.memoryStorage();
  const draft = validDraft({ draftId: 'proposal_fallback' });
  local.setItem(Store.PREFIX + draft.draftId, '{broken');
  session.setItem(Store.PREFIX + draft.draftId, JSON.stringify(draft));
  const api = Store.create({ localStorage: local, sessionStorage: session, now: () => NOW });
  const result = api.read(draft.draftId);
  assert.equal(result.ok, true);
  assert.equal(result.storage, 'session');
  assert.equal(local.getItem(Store.PREFIX + draft.draftId), null);
});

test('the fifty proposal cap applies across local and tab storage together', () => {
  const local = Store.memoryStorage();
  const session = Store.memoryStorage();
  for (let index = 0; index < 30; index += 1) {
    const timestamp = new Date(NOW - index * 1000).toISOString();
    const draft = validDraft({ draftId: `local_${String(index).padStart(6, '0')}`, createdAt: timestamp, updatedAt: timestamp });
    local.setItem(Store.PREFIX + draft.draftId, JSON.stringify(draft));
  }
  for (let index = 0; index < 30; index += 1) {
    const timestamp = new Date(NOW - (index + 30) * 1000).toISOString();
    const draft = validDraft({ draftId: `session_${String(index).padStart(6, '0')}`, createdAt: timestamp, updatedAt: timestamp });
    session.setItem(Store.PREFIX + draft.draftId, JSON.stringify(draft));
  }
  const api = Store.create({ localStorage: local, sessionStorage: session, now: () => NOW });
  assert.equal(api.list().length, 50);
  const storedKeys = (storage) => Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key) => key && key.startsWith(Store.PREFIX));
  assert.equal(storedKeys(local).length + storedKeys(session).length, 50);
});
