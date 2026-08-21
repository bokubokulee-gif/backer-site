/* Backer real-subject paper position reader.
   The legacy demo portfolio is intentionally outside this storage boundary. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerTradesPositionStore = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var STORAGE_KEY = 'backer_trades_positions_v1';
  var SCHEMA_VERSION = 'backer-trades-position-v1';
  var ACCOUNT_STORAGE_KEY = 'backer_trades_account_v1';
  var ACCOUNT_SCHEMA_VERSION = 'backer-trades-account-v1';
  var DEFAULT_STARTING_CASH = 10000;

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function finite(value) {
    if (value === '' || value == null) return null;
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : null;
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var parsed = new URL(raw);
      if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password) return '';
      return parsed.href;
    } catch (error) { return ''; }
  }
  function safeInternalHref(value) {
    var raw = clean(value);
    return /^(?:backerdemo|backercreate)\.html(?:[?#]|$)/.test(raw) ? raw : '';
  }
  function timestamp(value) {
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  function snapshot(value, kind) {
    var row = value && typeof value === 'object' ? value : {};
    var normalized = {
      name: clean(row.name),
      title: kind === 'content' ? clean(row.title) : '',
      avatar: safeURL(row.avatar),
      thumbnail: kind === 'content' ? safeURL(row.thumbnail) : '',
      provider: clean(row.provider).toLowerCase(),
      sourceUrl: safeURL(row.sourceUrl)
    };
    if (!normalized.name || !normalized.provider || !normalized.sourceUrl) return null;
    if (kind === 'content' && !normalized.title) return null;
    return normalized;
  }
  function quote(value) {
    var row = value && typeof value === 'object' ? value : {};
    var side = clean(row.side).toUpperCase();
    var priceCents = finite(row.priceCents);
    var supportPriceCents = finite(row.supportPriceCents);
    var bucket = timestamp(row.bucket);
    if ((side !== 'BACK' && side !== 'FADE') || priceCents == null || priceCents < 1 || priceCents > 99
      || supportPriceCents == null || supportPriceCents < 1 || supportPriceCents > 99 || !bucket) return null;
    return { side: side, priceCents: priceCents, supportPriceCents: supportPriceCents, bucket: bucket };
  }
  function contractSnapshot(value) {
    var row = value && typeof value === 'object' ? value : {};
    var baselineValue = finite(row.baselineValue);
    var targetValue = finite(row.targetValue);
    var horizonDays = finite(row.horizonDays);
    var normalized = {
      id: clean(row.id),
      question: clean(row.question),
      claim: clean(row.claim),
      modelVersion: clean(row.modelVersion),
      baselineValue: baselineValue,
      baselineLabel: clean(row.baselineLabel),
      baselineObservedAt: timestamp(row.baselineObservedAt),
      targetValue: targetValue,
      targetLabel: clean(row.targetLabel),
      cutoff: timestamp(row.cutoff),
      horizonDays: horizonDays,
      metricKey: clean(row.metricKey),
      metricLabel: clean(row.metricLabel),
      metricUnit: clean(row.metricUnit),
      metricProvider: clean(row.metricProvider).toLowerCase(),
      metricSourceUrl: safeURL(row.metricSourceUrl),
      observationId: clean(row.observationId),
      resolutionRule: clean(row.resolutionRule)
    };
    if (!normalized.id || !normalized.question || !normalized.claim || !normalized.modelVersion
      || baselineValue == null || baselineValue < 0 || !normalized.baselineLabel || !normalized.baselineObservedAt
      || targetValue == null || targetValue <= baselineValue || !normalized.targetLabel || !normalized.cutoff
      || horizonDays == null || horizonDays <= 0 || !normalized.metricKey || !normalized.metricLabel
      || !normalized.metricUnit || !normalized.metricProvider || !normalized.metricSourceUrl
      || !normalized.observationId || !normalized.resolutionRule) return null;
    return normalized;
  }
  function sanitize(row) {
    if (!row || typeof row !== 'object' || row.schemaVersion !== SCHEMA_VERSION || row.isSimulation !== true) return null;
    var kind = clean(row.subjectKind).toLowerCase();
    var side = clean(row.side).toUpperCase();
    var subjectId = clean(row.subjectId);
    var personId = clean(row.personId);
    var contentId = clean(row.contentId);
    var createdAt = timestamp(row.createdAt);
    var subject = snapshot(row.subjectSnapshot, kind);
    var contract = contractSnapshot(row.contractSnapshot);
    var savedQuote = quote(row.quote);
    var supportPriceCents = finite(row.supportPriceCents);
    var priceCents = finite(row.priceCents);
    var quantity = finite(row.quantity);
    var cost = finite(row.cost);
    var maxLoss = finite(row.maxLoss);
    var observationIds = Array.isArray(row.observationIds) ? row.observationIds.map(clean).filter(Boolean).slice(0, 100) : [];
    if ((kind !== 'profile' && kind !== 'content') || (side !== 'BACK' && side !== 'FADE') || !clean(row.id)
      || !clean(row.receiptId) || !subjectId || !personId || (kind === 'content' && (!contentId || contentId !== subjectId))
      || !createdAt || !subject || !contract || !savedQuote || !clean(row.contractId) || !clean(row.contractObservationId)
      || clean(row.contractId) !== contract.id || clean(row.contractObservationId) !== contract.observationId
      || !clean(row.modelId) || !clean(row.modelBucket) || !clean(row.modelFingerprint)
      || timestamp(row.modelBucket) !== savedQuote.bucket || side !== savedQuote.side
      || supportPriceCents !== savedQuote.supportPriceCents || priceCents !== savedQuote.priceCents
      || priceCents !== (side === 'BACK' ? supportPriceCents : 100 - supportPriceCents)
      || supportPriceCents == null || supportPriceCents < 1 || supportPriceCents > 99
      || priceCents == null || priceCents < 1 || priceCents > 99 || quantity == null || quantity <= 0
      || cost == null || cost <= 0 || Math.abs(quantity * priceCents / 100 - cost) > 0.011
      || maxLoss == null || Math.abs(maxLoss - cost) > 0.011 || observationIds.indexOf(contract.observationId) < 0
      || clean(row.status) !== 'OPEN_SIMULATION') return null;
    return {
      schemaVersion: SCHEMA_VERSION,
      id: clean(row.id),
      receiptId: clean(row.receiptId),
      subjectId: subjectId,
      subjectKind: kind,
      personId: personId,
      contentId: kind === 'content' ? contentId : '',
      subjectSnapshot: subject,
      contractId: contract.id,
      contractObservationId: contract.observationId,
      contractSnapshot: contract,
      observationIds: observationIds,
      modelId: clean(row.modelId),
      modelBucket: savedQuote.bucket,
      modelFingerprint: clean(row.modelFingerprint),
      side: side,
      supportPriceCents: supportPriceCents,
      priceCents: priceCents,
      quote: savedQuote,
      quantity: quantity,
      cost: cost,
      maxLoss: maxLoss,
      status: 'OPEN_SIMULATION',
      isSimulation: true,
      createdAt: createdAt,
      paperCashAfter: finite(row.paperCashAfter),
      proposalHref: safeInternalHref(row.proposalHref)
    };
  }
  function list(storage) {
    var target = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!target || typeof target.getItem !== 'function') return [];
    try {
      var parsed = JSON.parse(target.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.map(sanitize).filter(Boolean).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    } catch (error) { return []; }
  }
  function account(storage) {
    var target = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    var fallback = { schemaVersion: ACCOUNT_SCHEMA_VERSION, startingCash: DEFAULT_STARTING_CASH, cash: DEFAULT_STARTING_CASH, updatedAt: '' };
    if (!target || typeof target.getItem !== 'function') return fallback;
    try {
      var parsed = JSON.parse(target.getItem(ACCOUNT_STORAGE_KEY) || 'null');
      var startingCash = finite(parsed && parsed.startingCash);
      var cash = finite(parsed && parsed.cash);
      var updatedAt = timestamp(parsed && parsed.updatedAt);
      if (!parsed || parsed.schemaVersion !== ACCOUNT_SCHEMA_VERSION || startingCash == null || startingCash <= 0
        || cash == null || cash < 0 || !updatedAt) return fallback;
      return { schemaVersion: ACCOUNT_SCHEMA_VERSION, startingCash: startingCash, cash: cash, updatedAt: updatedAt };
    } catch (error) { return fallback; }
  }

  return Object.freeze({
    storageKey: STORAGE_KEY,
    schemaVersion: SCHEMA_VERSION,
    accountStorageKey: ACCOUNT_STORAGE_KEY,
    accountSchemaVersion: ACCOUNT_SCHEMA_VERSION,
    defaultStartingCash: DEFAULT_STARTING_CASH,
    sanitize: sanitize,
    list: list,
    account: account
  });
});
