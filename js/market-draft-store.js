/* Backer local market proposal store.
   Public GitHub Pages proposals are device-local, simulation-only drafts.
   Every read and write validates the complete fail-closed proposal contract. */
(function (root, factory) {
  'use strict';
  var api = factory(root || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerMarketDraftStore = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';

  var SCHEMA_VERSION = 2;
  var PREFIX = 'backer_site_market_draft_v2:';
  var INDEX_KEY = 'backer_site_market_draft_index_v2';
  var LEGACY_PREFIX = 'backer_market_route_draft_v1:';
  var MAX_DRAFTS = 50;
  var MAX_ITEM_BYTES = 96 * 1024;
  var MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  var ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/;

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function finite(value) {
    if (value === '' || value == null) return null;
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : null;
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, 'https://backer.invalid/');
      if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return '';
      return url.href;
    } catch (error) { return ''; }
  }
  function iso(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }
  function byteLength(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
    try { return unescape(encodeURIComponent(value)).length; }
    catch (error) { return value.length * 2; }
  }
  function failure(code, message) { return { ok: false, code: code, message: message }; }
  function forbiddenSecrets(value, path) {
    if (!value || typeof value !== 'object') return '';
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var next = path ? path + '.' + key : key;
      if (/(?:^|_)(?:cookie|password|access_token|refresh_token|auth_token|api_key|secret)(?:$|_)/i.test(key)) return next;
      var nested = forbiddenSecrets(value[key], next);
      if (nested) return nested;
    }
    return '';
  }
  function invalidURLField(value, path) {
    if (!value || typeof value !== 'object') return '';
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var next = path ? path + '.' + key : key;
      if (/url$/i.test(key) && value[key] != null && clean(value[key]) && !safeURL(value[key])) return next;
      var nested = invalidURLField(value[key], next);
      if (nested) return nested;
    }
    return '';
  }
  function observationMatchesSubject(draft, observation) {
    var person = draft.subject.person;
    var content = draft.subject.content;
    var entityType = clean(observation.entityType).toLowerCase();
    if (content) return (entityType === 'content' || entityType === 'work') && clean(observation.entityId) === clean(content.id);
    if ((entityType === 'creator' || entityType === 'person') && clean(observation.entityId) === clean(person.id)) return true;
    if (entityType !== 'identity') return false;
    return array(person.platforms).some(function (platform) {
      return clean(platform.sourceIdentityId || platform.identityId) === clean(observation.entityId);
    });
  }
  function validateDraft(draft, options) {
    options = options || {};
    var now = Number(options.now == null ? Date.now() : options.now);
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return failure('invalid_draft', 'Proposal must be an object.');
    var secretPath = forbiddenSecrets(draft, '');
    if (secretPath) return failure('forbidden_secret', 'Proposal contains a forbidden credential field at ' + secretPath + '.');
    var invalidURLPath = invalidURLField(draft, '');
    if (invalidURLPath) return failure('invalid_url', 'Proposal contains an invalid or credential-bearing URL at ' + invalidURLPath + '.');
    if (Number(draft.schemaVersion) !== SCHEMA_VERSION) return failure('unsupported_version', 'Proposal schema version is not supported.');
    if (!ID_RE.test(clean(draft.draftId))) return failure('invalid_id', 'Proposal identifier is invalid.');
    if (draft.executionMode !== 'simulation' || draft.status !== 'local_draft' || draft.approvalStatus !== 'discovery_proposal') return failure('invalid_boundary', 'Only local discovery simulation proposals can be stored.');
    if (draft.instrument !== 'milestone' && draft.instrument !== 'pk') return failure('invalid_instrument', 'Proposal instrument is not supported.');
    var createdAt = iso(draft.createdAt);
    var updatedAt = iso(draft.updatedAt);
    if (!createdAt || !updatedAt) return failure('invalid_timestamp', 'Proposal timestamps are invalid.');
    if (new Date(updatedAt).getTime() > now + 5 * 60 * 1000) return failure('future_timestamp', 'Proposal timestamp is in the future.');
    if (now - new Date(updatedAt).getTime() > MAX_AGE_MS) return failure('expired', 'Proposal expired after 90 days.');
    if (!draft.subject || !draft.subject.person || !clean(draft.subject.person.id) || !clean(draft.subject.person.name)) return failure('invalid_subject', 'Proposal is missing the exact public person.');
    if (draft.subject.person.identityKind !== 'public_discovery' || draft.subject.person.tradable !== false) return failure('invalid_subject_boundary', 'Public discovery subjects must remain non-tradable.');
    if (draft.subject.type !== 'person-growth' && draft.subject.type !== 'content-growth') return failure('invalid_subject', 'Proposal subject type is invalid.');
    if (draft.subject.type === 'content-growth' && (!draft.subject.content || !clean(draft.subject.content.id) || !clean(draft.subject.content.title))) return failure('invalid_content', 'Content proposal is missing the exact public work.');
    if (draft.subject.type === 'person-growth' && draft.subject.content) return failure('invalid_content', 'Person proposal cannot carry a content subject.');
    if (!draft.outcome || clean(draft.outcome.question).length < 12 || clean(draft.outcome.question).length > 220 || array(draft.outcome.outcomes).length < 2) return failure('invalid_outcome', 'Proposal question or outcomes are incomplete.');
    if (draft.instrument === 'milestone') {
      var milestoneOutcomeIds = array(draft.outcome.outcomes).map(function (outcome) { return clean(outcome && outcome.id); });
      if (draft.outcome.type !== 'binary' || milestoneOutcomeIds.length !== 2 || milestoneOutcomeIds[0] !== 'GROWS_TO_TARGET' || milestoneOutcomeIds[1] !== 'DOES_NOT_REACH_TARGET') return failure('invalid_outcome', 'Growth milestone outcomes must use Backer growth language.');
    } else if (draft.outcome.type !== 'multi' || clean(draft.outcome.outcomes[0] && draft.outcome.outcomes[0].label).toLowerCase() === clean(draft.outcome.outcomes[1] && draft.outcome.outcomes[1].label).toLowerCase()) return failure('invalid_outcome', 'Head-to-head proposal subjects must be distinct.');
    if (!draft.resolution || !clean(draft.resolution.platform) || !clean(draft.resolution.metricKey) || !clean(draft.resolution.metricLabel) || !clean(draft.resolution.unit)) return failure('invalid_resolution', 'Proposal resolution metric is incomplete.');
    var baseline = finite(draft.resolution.baseline && draft.resolution.baseline.value);
    var target = finite(draft.resolution.target && draft.resolution.target.value);
    if (baseline == null || baseline < 0 || target == null || target <= baseline) return failure('invalid_values', 'Proposal baseline and growth target are invalid.');
    var expectedDirection = draft.instrument === 'pk' ? 'highest_at_cutoff_above_minimum' : 'at_least';
    if (clean(draft.resolution.target && draft.resolution.target.direction) !== expectedDirection) return failure('invalid_direction', 'Proposal target direction does not match its growth instrument.');
    if (!iso(draft.resolution.deadline) || !safeURL(draft.resolution.sourceUrl) || !safeURL(draft.resolution.baseline && draft.resolution.baseline.sourceUrl)) return failure('invalid_resolution', 'Proposal cutoff or source URL is invalid.');
    var provenance = clean(draft.resolution.baseline && draft.resolution.baseline.provenance);
    var observation = draft.resolution.observation;
    if (provenance === 'retained_source_observation') {
      if (!observation || !clean(observation.id) || !clean(observation.entityType) || !clean(observation.entityId) || !clean(observation.provider) || !clean(observation.metric) || finite(observation.value) == null || !clean(observation.unit) || !iso(observation.observedAt) || !safeURL(observation.sourceUrl)) return failure('invalid_observation', 'Retained metric provenance is incomplete.');
      if (clean(observation.provider) !== clean(draft.resolution.platform) || clean(observation.metric) !== clean(draft.resolution.metricKey) || clean(observation.unit) !== clean(draft.resolution.unit) || finite(observation.value) !== baseline || iso(observation.observedAt) !== iso(draft.resolution.baseline.observedAt) || safeURL(observation.sourceUrl) !== safeURL(draft.resolution.baseline.sourceUrl) || safeURL(observation.sourceUrl) !== safeURL(draft.resolution.sourceUrl) || !observationMatchesSubject(draft, observation)) return failure('observation_mismatch', 'Retained metric does not match the selected subject and resolution.');
      if (draft.resolution.readiness !== 'retained_observation') return failure('invalid_readiness', 'Retained metric readiness is inconsistent.');
    } else if (provenance === 'user_entered_unverified') {
      if (observation != null || draft.resolution.readiness !== 'unverified_idea') return failure('invalid_readiness', 'Manual metric must remain an unverified idea.');
    } else return failure('invalid_provenance', 'Proposal baseline provenance is invalid.');
    if (!draft.rules || finite(draft.rules.graceHours) == null || finite(draft.rules.graceHours) < 0 || finite(draft.rules.graceHours) > 168 || finite(draft.rules.disputeHours) == null || finite(draft.rules.disputeHours) < 1 || finite(draft.rules.disputeHours) > 168 || ['pause_then_void', 'last_valid_snapshot'].indexOf(clean(draft.rules.deletionRule)) < 0 || ['latest_valid_before_cutoff', 'freeze_at_cutoff'].indexOf(clean(draft.rules.correctionRule)) < 0 || ['refund_original_cost', 'refund_equal_value'].indexOf(clean(draft.rules.voidRule)) < 0) return failure('invalid_rules', 'Proposal resolution safeguards are incomplete.');
    if (!draft.market || (draft.market.lifecycle !== 'DRAFT' && draft.market.lifecycle !== 'OPENING_SOON') || draft.market.approvalStatus !== 'discovery_proposal') return failure('invalid_market_boundary', 'Proposal market boundary is invalid.');
    if (draft.market.quote != null || draft.market.feeRate != null || draft.market.stake != null || draft.market.maxLoss != null || draft.market.payout != null) return failure('invented_terms', 'A local proposal cannot contain price, fee, stake, loss, or payout terms.');
    if (draft.validation && draft.validation.executable !== false) return failure('invalid_market_boundary', 'A local proposal cannot be marked executable.');
    return { ok: true, draft: draft };
  }
  function memoryStorage() {
    var values = Object.create(null);
    return {
      get length() { return Object.keys(values).length; },
      key: function (index) { return Object.keys(values)[index] || null; },
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
      setItem: function (key, value) { values[key] = String(value); },
      removeItem: function (key) { delete values[key]; }
    };
  }
  function create(options) {
    options = options || {};
    var local = options.localStorage || null;
    var session = options.sessionStorage || null;
    var nowFn = typeof options.now === 'function' ? options.now : function () { return Date.now(); };
    function storageGet(storage, key) { try { return storage && storage.getItem(key); } catch (error) { return null; } }
    function storageRemove(storage, key) { try { if (storage) storage.removeItem(key); } catch (error) {} }
    function parse(raw) { try { return JSON.parse(raw); } catch (error) { return null; } }
    function scan(storage) {
      var ids = [];
      if (!storage) return ids;
      try {
        for (var i = 0; i < storage.length; i += 1) {
          var key = storage.key(i);
          if (key && key.indexOf(PREFIX) === 0) ids.push(key.slice(PREFIX.length));
        }
      } catch (error) {}
      return ids;
    }
    function readIndex(storage) {
      var index = parse(storageGet(storage, INDEX_KEY));
      if (!Array.isArray(index)) return scan(storage).map(function (id) { return { draftId: id }; });
      return index.filter(function (entry) { return entry && ID_RE.test(clean(entry.draftId)); });
    }
    function writeIndex(storage, entries) { storage.setItem(INDEX_KEY, JSON.stringify(entries)); }
    function readFrom(storage, id, storageName) {
      var raw = storageGet(storage, PREFIX + id);
      if (!raw) return null;
      if (byteLength(raw) > MAX_ITEM_BYTES) { storageRemove(storage, PREFIX + id); return Object.assign(failure('item_too_large', 'Stored proposal exceeds the local size limit.'), { storage: storageName }); }
      var draft = parse(raw);
      var result = validateDraft(draft, { now: nowFn() });
      if (!result.ok) { storageRemove(storage, PREFIX + id); return Object.assign({}, result, { storage: storageName }); }
      return { ok: true, draft: draft, storage: storageName, durable: storageName === 'local' };
    }
    function upgradeLegacy(draft, id) {
      if (!draft || Number(draft.schemaVersion) !== 1 || clean(draft.draftId) !== clean(id)) return null;
      var upgraded = Object.assign({}, draft, {
        schemaVersion: 2,
        status: 'local_draft',
        approvalStatus: 'discovery_proposal',
        executionMode: 'simulation',
        source: 'legacy_session_v1'
      });
      upgraded.subject = Object.assign({}, upgraded.subject || {});
      upgraded.subject.person = Object.assign({}, upgraded.subject.person || {}, { identityKind: 'public_discovery', tradable: false });
      upgraded.outcome = Object.assign({}, upgraded.outcome || {});
      if (upgraded.instrument === 'milestone') upgraded.outcome = Object.assign({}, upgraded.outcome, { type: 'binary', outcomes: [{ id: 'GROWS_TO_TARGET', label: 'Grows to target' }, { id: 'DOES_NOT_REACH_TARGET', label: 'Does not reach target' }], selectedSide: null });
      upgraded.market = Object.assign({}, upgraded.market || {}, { lifecycle: 'OPENING_SOON', approvalStatus: 'discovery_proposal', quote: null, feeRate: null, stake: null, maxLoss: null, payout: null });
      upgraded.resolution = Object.assign({}, upgraded.resolution || {}, { readiness: 'unverified_idea', observation: null });
      upgraded.resolution.baseline = Object.assign({}, upgraded.resolution.baseline || {}, { provenance: 'user_entered_unverified' });
      upgraded.validation = Object.assign({}, upgraded.validation || {}, { executable: false });
      return validateDraft(upgraded, { now: nowFn() }).ok ? upgraded : null;
    }
    function pruneStorage(storage) {
      if (!storage) return [];
      var rows = [];
      readIndex(storage).forEach(function (entry) {
        var result = readFrom(storage, clean(entry.draftId), storage === local ? 'local' : 'session');
        if (result && result.ok) rows.push({ draftId: result.draft.draftId, createdAt: result.draft.createdAt, updatedAt: result.draft.updatedAt });
      });
      rows.sort(function (a, b) { return Date.parse(b.updatedAt) - Date.parse(a.updatedAt); });
      rows.slice(MAX_DRAFTS).forEach(function (entry) { storageRemove(storage, PREFIX + entry.draftId); });
      rows = rows.slice(0, MAX_DRAFTS);
      try { writeIndex(storage, rows); } catch (error) {}
      return rows;
    }
    function pruneAll() {
      var results = [];
      var seen = Object.create(null);
      [{ storage: local, name: 'local' }, { storage: session, name: 'session' }].forEach(function (candidate) {
        pruneStorage(candidate.storage).forEach(function (entry) {
          var result = readFrom(candidate.storage, clean(entry.draftId), candidate.name);
          if (!result || !result.ok) return;
          if (seen[result.draft.draftId]) {
            storageRemove(candidate.storage, PREFIX + result.draft.draftId);
            return;
          }
          seen[result.draft.draftId] = true;
          results.push(result);
        });
      });
      results.sort(function (a, b) { return Date.parse(b.draft.updatedAt) - Date.parse(a.draft.updatedAt); });
      results.slice(MAX_DRAFTS).forEach(function (result) {
        storageRemove(result.storage === 'local' ? local : session, PREFIX + result.draft.draftId);
      });
      pruneStorage(local);
      pruneStorage(session);
      return results.slice(0, MAX_DRAFTS);
    }
    function save(draft) {
      var validation = validateDraft(draft, { now: nowFn() });
      if (!validation.ok) return validation;
      var serialized;
      try { serialized = JSON.stringify(draft); } catch (error) { return failure('serialize_failed', 'Proposal could not be serialized.'); }
      if (byteLength(serialized) > MAX_ITEM_BYTES) return failure('item_too_large', 'Proposal exceeds the local size limit.');
      var candidates = [{ storage: local, name: 'local' }, { storage: session, name: 'session' }];
      for (var i = 0; i < candidates.length; i += 1) {
        var candidate = candidates[i];
        if (!candidate.storage) continue;
        try {
          candidate.storage.setItem(PREFIX + draft.draftId, serialized);
          var rows = readIndex(candidate.storage).filter(function (entry) { return clean(entry.draftId) !== draft.draftId; });
          rows.unshift({ draftId: draft.draftId, createdAt: draft.createdAt, updatedAt: draft.updatedAt });
          writeIndex(candidate.storage, rows);
          pruneAll();
          return { ok: true, draft: draft, storage: candidate.name, durable: candidate.name === 'local', disclosure: candidate.name === 'local' ? 'Saved on this device' : 'Saved for this tab only' };
        } catch (error) { storageRemove(candidate.storage, PREFIX + draft.draftId); }
      }
      return failure('storage_unavailable', 'This browser could not save the local proposal.');
    }
    function read(id) {
      id = clean(id);
      if (!ID_RE.test(id)) return failure('invalid_id', 'Proposal identifier is invalid.');
      var localResult = readFrom(local, id, 'local');
      if (localResult && localResult.ok) return localResult;
      var sessionResult = readFrom(session, id, 'session');
      if (sessionResult && sessionResult.ok) return sessionResult;
      var legacyRaw = storageGet(session, LEGACY_PREFIX + id);
      var legacy = upgradeLegacy(parse(legacyRaw), id);
      if (legacy) return { ok: true, draft: legacy, storage: 'legacy_session', durable: false, legacy: true, disclosure: 'Loaded from this tab only' };
      return localResult || sessionResult || failure('not_found', 'Proposal was not found on this device.');
    }
    function list() {
      return pruneAll();
    }
    function remove(id) {
      id = clean(id);
      [local, session].forEach(function (storage) {
        storageRemove(storage, PREFIX + id);
        if (!storage) return;
        var rows = readIndex(storage).filter(function (entry) { return clean(entry.draftId) !== id; });
        try { writeIndex(storage, rows); } catch (error) {}
      });
      return { ok: true, draftId: id };
    }
    return { save: save, read: read, list: list, remove: remove, prune: function () { pruneAll(); return { local: pruneStorage(local), session: pruneStorage(session) }; }, validate: validateDraft };
  }

  function rootStorage(name) {
    try { return root && root[name] || null; }
    catch (error) { return null; }
  }
  var singleton = create({ localStorage: rootStorage('localStorage'), sessionStorage: rootStorage('sessionStorage') });
  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    PREFIX: PREFIX,
    INDEX_KEY: INDEX_KEY,
    LEGACY_PREFIX: LEGACY_PREFIX,
    MAX_DRAFTS: MAX_DRAFTS,
    MAX_ITEM_BYTES: MAX_ITEM_BYTES,
    MAX_AGE_MS: MAX_AGE_MS,
    create: create,
    memoryStorage: memoryStorage,
    validate: validateDraft,
    save: singleton.save,
    read: singleton.read,
    list: singleton.list,
    remove: singleton.remove,
    prune: singleton.prune
  };
});
