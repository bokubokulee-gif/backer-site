'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { query } = require('./db');

const PLATFORMS = Object.freeze(['x', 'youtube', 'instagram', 'github']);
const WINDOWS = Object.freeze({ '24h': 1, '7d': 7, '30d': 30, '90d': 90 });
const VIEWS = Object.freeze(['markets', 'creator-radar', 'resolved']);
const SORTS = Object.freeze(['movement', 'provider-rank', 'trending', 'newest-work', 'evidence']);
const FALLBACK_PATH = path.join(process.cwd(), 'data', 'market2-people.json');
const YOUTUBE_MAX_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const STATIC_CACHE_MARKER = Symbol('market2-static-cache');

function unique(values) {
  return Array.from(new Set(values));
}

function normalizePlatforms(value) {
  const values = (Array.isArray(value) ? value : [value])
    .flatMap(item => String(item == null ? '' : item).toLowerCase().split(','))
    .map(item => item.trim())
    .filter(item => PLATFORMS.includes(item));
  return unique(values.length ? values : PLATFORMS);
}

function normalizeWindow(value) {
  const key = String(value || '7d').toLowerCase();
  return Object.prototype.hasOwnProperty.call(WINDOWS, key) ? key : '7d';
}

function normalizeView(value) {
  const key = String(value || 'markets').toLowerCase();
  return VIEWS.includes(key) ? key : 'markets';
}

function normalizeSort(value) {
  const key = String(value || 'movement').toLowerCase();
  return SORTS.includes(key) ? key : 'movement';
}

function decodeCursor(value) {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    const offset = Number(parsed && parsed.offset);
    return Number.isInteger(offset) && offset >= 0 && offset <= 10_000 ? offset : 0;
  } catch (_error) {
    return 0;
  }
}

function encodeCursor(offset) {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

function normalizeQuery(input) {
  const source = input || {};
  return {
    platforms: normalizePlatforms(source.platforms == null ? source.platform : source.platforms),
    window: normalizeWindow(source.window),
    view: normalizeView(source.view),
    sort: normalizeSort(source.sort),
    cursorOffset: decodeCursor(source.cursor),
    limit: Math.max(1, Math.min(50, Number(source.limit) || 24))
  };
}

function jsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

function policyMode(value) {
  return String(value || '').toLowerCase();
}

function enabledFlag(value) {
  return value === true || value === 1 || String(value).toLowerCase() === 'true';
}

function isAllowedMetric(metric) {
  if (!metric || typeof metric !== 'object') return false;
  if (String(metric.platform).toLowerCase() !== 'youtube') return true;
  const derivedValue = metric.isDerived == null ? metric.is_derived : metric.isDerived;
  const derived = enabledFlag(derivedValue);
  if (!derived) return true;
  return policyMode(metric.policyMode || metric.policy_mode) === 'youtube-derived-approved';
}

function sanitizeEvidence(record, allowedPlatforms) {
  if (!record || typeof record !== 'object') return null;
  const evidence = Object.assign({}, record);
  const allowed = Array.isArray(allowedPlatforms) ? allowedPlatforms : PLATFORMS;
  const suppliedCoverage = jsonArray(evidence.platformCoverage || evidence.platform_coverage)
    .map(item => String(item).toLowerCase());
  const youtubeUnavailable = suppliedCoverage.includes('youtube') && !allowed.includes('youtube');
  const youtubeIncluded = enabledFlag(
    evidence.youtubeIncludedInScore == null
      ? evidence.youtube_included_in_score
      : evidence.youtubeIncludedInScore
  );
  const youtubePolicy = policyMode(evidence.youtubePolicyMode || evidence.youtube_policy_mode) || 'not-used';
  const approved = youtubePolicy === 'youtube-derived-approved';
  const crossPlatformScore = evidence.crossPlatformScore == null
    ? evidence.cross_platform_score
    : evidence.crossPlatformScore;
  const youtubeCouldInfluenceScore = youtubeIncluded
    || (crossPlatformScore != null && suppliedCoverage.includes('youtube'));
  evidence.facts = jsonArray(evidence.facts || evidence.evidenceFacts || evidence.evidence_facts)
    .filter(isAllowedMetric)
    .filter(item => !item.platform || allowed.includes(String(item.platform).toLowerCase()));
  evidence.platformCoverage = suppliedCoverage.filter(platform => allowed.includes(platform));
  evidence.coverageGaps = jsonArray(evidence.coverageGaps || evidence.coverage_gaps);
  evidence.crossPlatformScore = crossPlatformScore == null ? null : crossPlatformScore;
  evidence.youtubeIncludedInScore = youtubeIncluded;
  evidence.youtubePolicyMode = youtubePolicy;
  delete evidence.cross_platform_score;
  delete evidence.youtube_included_in_score;
  delete evidence.youtube_policy_mode;
  delete evidence.coverage_gaps;
  delete evidence.evidence_facts;
  delete evidence.platform_coverage;
  if (youtubeCouldInfluenceScore && (!approved || youtubeUnavailable)) {
    evidence.crossPlatformScore = null;
    evidence.youtubeIncludedInScore = false;
    evidence.coverageGaps = unique(evidence.coverageGaps
      .concat(youtubeUnavailable
        ? 'YouTube data excluded because the retained observation passed its refresh window.'
        : 'YouTube data excluded from Backer-derived scoring pending API audit approval.'));
  }
  return evidence;
}

function isEligibilityTradable(record, nowValue) {
  if (!record || String(record.status) !== 'eligible') return false;
  const expiresAt = record.consentExpiresAt || record.consent_expires_at;
  const expiry = expiresAt ? Date.parse(expiresAt) : null;
  const now = new Date(nowValue || Date.now()).getTime();
  return String(record.consentStatus || record.consent_status) === 'active'
    && enabledFlag(record.grantsProfilePublication == null ? record.grants_profile_publication : record.grantsProfilePublication)
    && enabledFlag(record.grantsTrading == null ? record.grants_trading : record.grantsTrading)
    && enabledFlag(record.platformAccountVerified == null ? record.platform_account_verified : record.platformAccountVerified)
    && String(record.rightPublicityReview || record.right_publicity_review) === 'approved'
    && String(record.policyReview || record.policy_review) === 'approved'
    && String(record.settlementSource || record.settlement_source || '').trim().length > 0
    && (expiry == null || (Number.isFinite(expiry) && expiry > now));
}

function sanitizePerson(value, queryValue, nowValue) {
  if (!value || typeof value !== 'object') return null;
  const queryOptions = queryValue || normalizeQuery();
  const person = Object.assign({}, value);
  const discoveryStatus = String(person.discoveryStatus || person.discovery_status || 'active').toLowerCase();
  if (discoveryStatus !== 'active') return null;
  const now = new Date(nowValue || Date.now()).getTime();
  const accounts = jsonArray(person.sourceAccounts || person.source_accounts)
    .filter(account => queryOptions.platforms.includes(String(account.platform).toLowerCase()))
    .filter(account => {
      if (String(account.platform).toLowerCase() !== 'youtube') return true;
      const refreshedAt = Date.parse(account.refreshedAt || account.refreshed_at || 0);
      return Number.isFinite(refreshedAt) && now - refreshedAt <= YOUTUBE_MAX_RETENTION_MS;
    });
  const activePlatforms = unique(accounts.map(account => String(account.platform).toLowerCase()));
  if (!activePlatforms.length) return null;

  const rawMetrics = jsonArray(person.metrics || person.metricSnapshots || person.metric_snapshots);
  const rawEvidence = jsonArray(person.evidence || person.attentionEvidence || person.attention_evidence);
  const explicitWindows = jsonArray(person.coverageWindows || person.coverage_windows)
    .map(item => String(item).toLowerCase());
  const retainedWindows = unique(explicitWindows
    .concat(rawMetrics.map(item => String(item.window || item.observationWindow || item.observation_window || '').toLowerCase()))
    .concat(rawEvidence.map(item => String(item.window || item.observationWindow || item.observation_window || '').toLowerCase())))
    .filter(item => Object.prototype.hasOwnProperty.call(WINDOWS, item));
  if (!retainedWindows.includes(queryOptions.window)) return null;

  const content = jsonArray(person.content || person.contentItems || person.content_items)
    .filter(item => activePlatforms.includes(String(item.platform).toLowerCase()))
    .filter(item => ['available', 'removed'].includes(String(item.availability || 'available')))
    .map(item => String(item.availability || 'available') === 'removed'
      ? Object.assign({}, item, {
        availability: 'removed',
        title: 'Content removed at source',
        title_or_excerpt: 'Content removed at source',
        url: null,
        canonical_url: null,
        thumbnailUrl: null,
        thumbnail_url: null,
        thumbnailPolicy: 'none',
        thumbnail_policy: 'none'
      })
      : item)
    .sort((a, b) => Date.parse(b.publishedAt || b.published_at || 0) - Date.parse(a.publishedAt || a.published_at || 0));
  const removedContentIds = new Set(content
    .filter(item => item.availability === 'removed')
    .flatMap(item => [item.nativeContentId, item.native_content_id, item.id].filter(Boolean).map(String)));
  const metrics = rawMetrics
    .filter(metric => activePlatforms.includes(String(metric.platform).toLowerCase()))
    .filter(metric => String(metric.subjectType || metric.subject_type || '') !== 'content'
      || !removedContentIds.has(String(metric.subjectId || metric.subject_id || '')))
    .filter(isAllowedMetric);
  const evidence = rawEvidence
    .filter(record => String(
      record.window || record.observationWindow || record.observation_window || ''
    ).toLowerCase() === queryOptions.window)
    .map(record => sanitizeEvidence(record, activePlatforms))
    .map(record => Object.assign({}, record, {
      facts: record.facts.filter(item => String(item.subjectType || item.subject_type || '') !== 'content'
        || !removedContentIds.has(String(item.subjectId || item.subject_id || '')))
    }))
    .filter(Boolean);
  const eligibility = jsonArray(person.marketEligibility || person.market_eligibility || person.eligibilityRecords)
    .map(item => Object.assign({}, item));
  const tradableInstruments = eligibility
    .filter(item => isEligibilityTradable(item, nowValue))
    .map(item => item.instrument);

  person.id = String(person.id || person.personId || person.person_id || '');
  person.personId = person.id;
  person.sourceAccounts = accounts;
  person.platforms = activePlatforms;
  person.coverageWindows = retainedWindows;
  person.content = content;
  person.metrics = metrics;
  person.evidence = evidence;
  person.marketEligibility = eligibility;
  person.tradable = tradableInstruments.length > 0;
  person.tradableInstruments = tradableInstruments;
  person.discoveryOnly = !person.tradable;
  const originalLatestId = person.latestWork && person.latestWork.id;
  const originalBreakoutId = person.breakoutWork && person.breakoutWork.id;
  person.latestWork = content.find(item => originalLatestId && item.id === originalLatestId) || content[0] || null;
  person.breakoutWork = content.find(item => Number.isInteger(Number(item.providerRank || item.provider_rank)))
    || content.find(item => originalBreakoutId && item.id === originalBreakoutId)
    || content[0]
    || null;
  return person;
}

function uiSnapshotPerson(value, generatedAt) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.platforms) || value.sourceAccounts) return value;
  const observedAt = value.source && value.source.asOf || generatedAt || new Date(0).toISOString();
  const accounts = value.platforms.map(item => typeof item === 'string' ? { id: item } : item).filter(item => item.id).map(item => ({
    id: `account:${item.id}:${value.id}`,
    platform: item.id,
    nativeAccountId: item.handle || value.handle || value.id,
    handle: item.handle || value.handle || '',
    profileUrl: item.url || '',
    accountType: 'public',
    verificationState: 'unverified',
    policyMode: 'discovery-only',
    refreshedAt: item.asOf || observedAt
  }));
  const seenContent = new Set();
  const content = [value.recentWork, value.breakoutWork].filter(Boolean).map((item, index) => {
    const nativeId = String(item.url || item.sourceUrl || `${value.id}:${index}`);
    if (seenContent.has(nativeId)) return null;
    seenContent.add(nativeId);
    const account = accounts.find(row => row.platform === item.platform) || accounts[0] || {};
    return {
      id: `content:${value.id}:${index}`,
      personId: value.id,
      sourceAccountId: account.id || null,
      platform: item.platform || account.platform,
      nativeContentId: nativeId,
      url: item.url || item.sourceUrl || null,
      title: item.title || '',
      type: item.type || 'post',
      publishedAt: item.publishedAt || null,
      thumbnailUrl: item.thumbnail || null,
      thumbnailPolicy: 'provider-url-refresh-required',
      availability: item.availability === 'removed' ? 'removed' : 'available',
      observedAt: item.observedAt || observedAt,
      refreshedAt: item.observedAt || observedAt,
      providerRank: item.providerRank == null ? null : Number(item.providerRank)
    };
  }).filter(Boolean);
  const evidence = Object.keys(value.evidence || {}).map(window => {
    const item = value.evidence[window] || {};
    return {
      window,
      state: item.state || 'partial-coverage',
      label: item.label || 'Retained public snapshot',
      interpretation: item.whyNow || value.whyNow || '',
      confidence: item.confidence || 'low',
      platformCoverage: Array.isArray(item.platforms) ? item.platforms : accounts.map(row => row.platform),
      coverageGaps: Array.isArray(item.coverageGaps) ? item.coverageGaps : [],
      facts: [],
      providerRank: item.providerRank == null ? null : Number(item.providerRank),
      generatedAt: item.asOf || observedAt,
      youtubeIncludedInScore: false,
      youtubePolicyMode: 'not-used',
      crossPlatformScore: null
    };
  });
  const eligibility = Object.keys(value.instruments || {}).map(key => ({
    instrument: key.replace(/_/g, '-'),
    status: value.instruments[key] && value.instruments[key].status === 'resolved' ? 'resolved' : 'discovery-only',
    consentStatus: 'none',
    grantsProfilePublication: false,
    grantsTrading: false,
    platformAccountVerified: false,
    rightPublicityReview: 'pending',
    policyReview: 'pending',
    settlementSource: null
  }));
  return {
    id: value.id,
    personId: value.id,
    slug: value.id,
    displayName: value.name,
    handle: value.handle,
    description: value.bio || '',
    portraitUrl: value.avatar,
    portraitPolicy: 'provider-url-refresh-required',
    category: value.category || 'Creator',
    claimStatus: value.claimStatus || 'unclaimed',
    discoveryStatus: 'active',
    sourceAccounts: accounts,
    platforms: accounts.map(row => row.platform),
    coverageWindows: evidence.map(item => item.window),
    content,
    metrics: [],
    evidence,
    marketEligibility: eligibility,
    tradable: false,
    tradableInstruments: [],
    discoveryOnly: true,
    whyNow: value.whyNow || '',
    latestWork: content[0] || null,
    breakoutWork: content[1] || content[0] || null,
    bestProviderRank: evidence.map(item => item.providerRank).filter(Number.isFinite).sort((a, b) => a - b)[0] || null,
    provenance: value.source || { observedAt }
  };
}

function rowToPerson(row, queryValue, nowValue) {
  const raw = {
    id: row.person_id,
    slug: row.slug,
    displayName: row.display_name,
    description: row.public_description || '',
    portraitUrl: row.portrait_url,
    portraitPolicy: row.portrait_policy,
    category: row.category || 'Creator',
    claimStatus: row.claim_status || 'unclaimed',
    discoveryStatus: row.discovery_status || 'active',
    identityConfidence: row.identity_confidence || 'source-account-only',
    sourceAccounts: jsonArray(row.source_accounts),
    content: jsonArray(row.content_items),
    metrics: jsonArray(row.metric_snapshots),
    evidence: jsonArray(row.attention_evidence),
    marketEligibility: jsonArray(row.market_eligibility),
    coverageWindows: jsonArray(row.coverage_windows),
    whyNow: row.why_now || '',
    latestObservedAt: row.latest_observed_at || null,
    bestProviderRank: row.best_provider_rank == null ? null : Number(row.best_provider_rank)
  };
  return sanitizePerson(raw, queryValue, nowValue);
}

function sortClause(sort) {
  if (sort === 'provider-rank' || sort === 'trending') {
    return 'best_provider_rank asc nulls last, latest_observed_at desc nulls last, p.display_name asc';
  }
  if (sort === 'newest-work') {
    return 'latest_work_at desc nulls last, latest_observed_at desc nulls last, p.display_name asc';
  }
  if (sort === 'evidence') {
    return 'confidence_weight desc, latest_observed_at desc nulls last, p.display_name asc';
  }
  return 'latest_observed_at desc nulls last, best_provider_rank asc nulls last, p.display_name asc';
}

async function readProviderStatus(runQuery) {
  const result = await runQuery(
    `select distinct on (provider)
       provider, status, completed_at, people_count, content_count, metric_count,
       rate_limit_metadata, diagnostic_code, last_good_snapshot_reference
     from market2_sync_runs
     where provider <> 'market2'
     order by provider, started_at desc`
  );
  return Object.fromEntries(result.rows.map(row => [row.provider, {
    status: row.status,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    refreshedAt: row.completed_at && ['succeeded', 'partial', 'last-good', 'empty-window'].includes(row.status)
      ? new Date(row.completed_at).toISOString()
      : null,
    peopleCount: Number(row.people_count) || 0,
    contentCount: Number(row.content_count) || 0,
    metricCount: Number(row.metric_count) || 0,
    rateLimit: row.rate_limit_metadata || {},
    diagnosticCode: row.diagnostic_code || null,
    lastGoodSnapshotReference: row.last_good_snapshot_reference || null
  }]));
}

function databaseSnapshotStatus(providerStatus, platforms) {
  const states = platforms.map(platform => String(
    providerStatus && providerStatus[platform] && providerStatus[platform].status || 'unknown'
  ));
  if (states.every(state => state === 'empty-window')) return 'empty-window';
  if (states.every(state => ['succeeded', 'fresh', 'live'].includes(state))) return 'live';
  const hasUsableRefresh = states.some(state => ['succeeded', 'fresh', 'live', 'partial'].includes(state));
  return hasUsableRefresh ? 'partial' : 'delayed';
}

function databasePersonState(person, providerStatus) {
  let hasCurrentAccount = false;
  let hasRetainableAccount = false;
  (person.sourceAccounts || []).forEach(account => {
    const platform = String(account.platform || '').toLowerCase();
    const provider = providerStatus && providerStatus[platform] || {};
    const state = String(provider.status || 'unknown');
    if (state === 'empty-window') return;
    if (['succeeded', 'fresh', 'live', 'partial'].includes(state)) {
      const providerRefresh = Date.parse(provider.refreshedAt || 0);
      const accountRefresh = Date.parse(account.refreshedAt || account.refreshed_at || 0);
      const refreshedInRun = Number.isFinite(providerRefresh)
        && Number.isFinite(accountRefresh)
        && accountRefresh >= providerRefresh - 5 * 60 * 1000;
      if (refreshedInRun) hasCurrentAccount = true;
      else if (state === 'partial') hasRetainableAccount = true;
      return;
    }
    if (['failed', 'rate-limited', 'permission-required', 'last-good'].includes(state)) {
      hasRetainableAccount = true;
    }
  });
  if (hasCurrentAccount) return 'current';
  if (hasRetainableAccount) return 'last-good';
  return 'exclude';
}

async function readDatabaseSnapshot(queryValue, dependencies) {
  const options = normalizeQuery(queryValue);
  const runQuery = dependencies && dependencies.query || query;
  const orderBy = sortClause(options.sort);
  const providerStatus = await readProviderStatus(runQuery);
  if (!Object.keys(providerStatus).length) return null;
  const queryPlatforms = options.platforms.filter(platform => {
    const state = providerStatus[platform] && providerStatus[platform].status;
    return state !== 'empty-window';
  });
  const result = await runQuery(
    `with candidate_people as (
       select p.*
       from market2_people p
       where p.discovery_status = 'active'
         and exists (
           select 1 from market2_source_accounts account
           where account.person_id = p.person_id
             and account.platform = any($1::text[])
         )
         and (
           exists (
             select 1 from market2_metric_snapshots metric
             where metric.person_id = p.person_id
               and metric.platform = any($1::text[])
               and metric.observation_window = $2
           )
           or exists (
             select 1 from market2_attention_evidence evidence
             where evidence.person_id = p.person_id
               and evidence.observation_window = $2
           )
         )
     )
     select
       p.*,
       accounts.source_accounts,
       content.content_items,
       content.latest_work_at,
       metrics.metric_snapshots,
       metrics.latest_observed_at,
       metrics.best_provider_rank,
       evidence.attention_evidence,
       evidence.coverage_windows,
       evidence.why_now,
       evidence.confidence_weight,
       eligibility.market_eligibility
     from candidate_people p
     left join lateral (
       select jsonb_agg(jsonb_build_object(
         'id', account.source_account_id,
         'platform', account.platform,
         'nativeAccountId', account.native_account_id,
         'handle', account.handle,
         'profileUrl', account.profile_url,
         'accountType', account.account_type,
         'verificationState', account.verification_state,
         'policyMode', account.source_policy_mode,
         'refreshedAt', account.latest_refresh_at
       ) order by account.platform) as source_accounts
       from market2_source_accounts account
       where account.person_id = p.person_id
         and account.platform = any($1::text[])
     ) accounts on true
     left join lateral (
       select
         jsonb_agg(jsonb_build_object(
           'id', item.content_id,
           'platform', item.platform,
           'nativeContentId', item.native_content_id,
           'url', item.canonical_url,
           'title', item.title_or_excerpt,
           'type', item.content_type,
           'publishedAt', item.published_at,
           'thumbnailUrl', item.thumbnail_url,
           'thumbnailPolicy', item.thumbnail_policy,
           'availability', item.availability,
           'observedAt', item.observed_at,
           'refreshedAt', item.refreshed_at
         ) order by item.published_at desc nulls last) as content_items,
         max(item.published_at) as latest_work_at
       from (
         select * from market2_content_items scoped
         where scoped.person_id = p.person_id
           and scoped.platform = any($1::text[])
         order by scoped.published_at desc nulls last
         limit 12
       ) item
     ) content on true
     left join lateral (
       select
         jsonb_agg(jsonb_build_object(
           'platform', metric.platform,
           'subjectType', metric.subject_type,
           'subjectId', metric.subject_id,
           'metricName', metric.metric_name,
           'rawValue', metric.raw_metric_value,
           'rawText', metric.raw_metric_text,
           'window', metric.observation_window,
           'observedAt', metric.observed_at,
           'sourceTimestamp', metric.source_timestamp,
           'providerRank', metric.provider_rank,
           'isDerived', metric.is_derived,
           'policyMode', metric.policy_mode
         ) order by metric.observed_at desc) as metric_snapshots,
         max(metric.observed_at) as latest_observed_at,
         min(metric.provider_rank) filter (where metric.provider_rank is not null) as best_provider_rank
       from market2_metric_snapshots metric
       where metric.person_id = p.person_id
         and metric.platform = any($1::text[])
         and metric.observation_window in ($2, 'current', 'lifetime')
     ) metrics on true
     left join lateral (
       select
         jsonb_agg(jsonb_build_object(
           'id', selected.evidence_id,
           'window', selected.observation_window,
           'platformCoverage', selected.platform_coverage,
           'facts', selected.evidence_facts,
           'coverageGaps', selected.coverage_gaps,
           'interpretation', selected.interpretation_text,
           'confidence', selected.confidence_grade,
           'methodology', selected.methodology_version,
           'crossPlatformScore', selected.cross_platform_score,
           'youtubeIncludedInScore', selected.youtube_included_in_score,
           'youtubePolicyMode', selected.youtube_policy_mode,
           'generatedAt', selected.generated_at
         ) order by selected.generated_at desc) as attention_evidence,
         jsonb_agg(distinct selected.observation_window) as coverage_windows,
         (array_agg(selected.interpretation_text order by selected.generated_at desc))[1] as why_now,
         max(case selected.confidence_grade when 'high' then 3 when 'medium' then 2 else 1 end) as confidence_weight
       from (
         select * from market2_attention_evidence scoped
         where scoped.person_id = p.person_id
           and scoped.observation_window = $2
         order by scoped.generated_at desc
         limit 4
       ) selected
     ) evidence on true
     left join lateral (
       select jsonb_agg(jsonb_build_object(
         'instrument', eligible.instrument,
         'status', eligible.status,
         'platformAccountVerified', eligible.platform_account_verified,
         'rightPublicityReview', eligible.right_publicity_review,
         'policyReview', eligible.policy_review,
         'settlementSource', eligible.settlement_source,
         'reviewedAt', eligible.reviewed_at,
         'consentStatus', consent.status,
         'grantsProfilePublication', consent.grants_profile_publication,
         'grantsTrading', consent.grants_trading,
         'consentExpiresAt', consent.expires_at
       ) order by eligible.instrument) as market_eligibility
       from market2_market_eligibility eligible
       left join market2_creator_consents consent
         on consent.consent_record_id = eligible.consent_record_id
        and consent.person_id = eligible.person_id
       where eligible.person_id = p.person_id
     ) eligibility on true
     order by ${orderBy}
     limit $3 offset $4`,
    [queryPlatforms, options.window, options.limit + 1, options.cursorOffset]
  );

  const now = dependencies && dependencies.now || new Date();
  const hasMore = result.rows.length > options.limit;
  let people = result.rows.slice(0, options.limit)
    .map(row => rowToPerson(row, options, now))
    .filter(Boolean);
  people = people.filter(person => {
    const dataState = databasePersonState(person, providerStatus);
    if (dataState === 'exclude') return false;
    if (dataState === 'last-good') {
      person.dataState = 'last-good';
      person.snapshotAsOf = person.latestObservedAt || null;
    }
    return true;
  });
  const dates = people.map(person => Date.parse(person.latestObservedAt || 0)).filter(Number.isFinite);
  const generatedAt = dates.length ? new Date(Math.max(...dates)).toISOString() : new Date(now).toISOString();
  const state = databaseSnapshotStatus(providerStatus, options.platforms);
  return {
    schemaVersion: 1,
    generatedAt,
    status: !people.length && state === 'live' ? 'empty-window' : state,
    isFixture: false,
    isSnapshot: false,
    window: options.window,
    platforms: options.platforms,
    view: options.view,
    sort: options.sort,
    providerStatus,
    people,
    rightRail: {},
    methodology: {
      version: 'backer-market2-evidence-v1',
      crossPlatformScore: 'disabled-by-default',
      youtubeDerivedMetrics: 'requires-explicit-audit-approval',
      tradability: 'active-consent-and-policy-gates',
      sortSemantics: ['provider-rank', 'trending'].includes(options.sort)
        ? 'provider-supplied-rank-when-present-then-observation-recency'
        : 'backer-supplied-observation-recency-without-cross-platform-score'
    },
    nextCursor: hasMore ? encodeCursor(options.cursorOffset + options.limit) : null
  };
}

function emptySnapshot(queryValue, nowValue) {
  const options = normalizeQuery(queryValue);
  return {
    schemaVersion: 1,
    generatedAt: new Date(nowValue || Date.now()).toISOString(),
    status: 'permission-required',
    isFixture: false,
    isSnapshot: true,
    window: options.window,
    platforms: options.platforms,
    view: options.view,
    sort: options.sort,
    providerStatus: Object.fromEntries(PLATFORMS.map(platform => [platform, { status: 'permission-required' }])),
    people: [],
    rightRail: {},
    methodology: {
      version: 'backer-market2-evidence-v1',
      crossPlatformScore: 'disabled-by-default',
      youtubeDerivedMetrics: 'not-used',
      tradability: 'fail-closed',
      sortSemantics: 'unavailable-without-retained-evidence'
    },
    nextCursor: null
  };
}

function applySnapshotQuery(snapshotValue, queryValue, nowValue) {
  const options = normalizeQuery(queryValue);
  const source = snapshotValue && typeof snapshotValue === 'object' ? snapshotValue : emptySnapshot(options, nowValue);
  let people = jsonArray(source.people)
    .map(person => uiSnapshotPerson(person, source.generatedAt))
    .map(person => sanitizePerson(person, options, nowValue))
    .filter(Boolean);
  if (options.sort === 'provider-rank' || options.sort === 'trending') {
    people.sort((a, b) => (Number(a.bestProviderRank) || Number.MAX_SAFE_INTEGER) - (Number(b.bestProviderRank) || Number.MAX_SAFE_INTEGER));
  } else if (options.sort === 'newest-work') {
    people.sort((a, b) => Date.parse(b.latestWork && (b.latestWork.publishedAt || b.latestWork.published_at) || 0)
      - Date.parse(a.latestWork && (a.latestWork.publishedAt || a.latestWork.published_at) || 0));
  }
  const offset = options.cursorOffset;
  const hasMore = people.length > offset + options.limit;
  people = people.slice(offset, offset + options.limit);
  const statedStatus = String(source.status || 'snapshot');
  const safeStatus = statedStatus === 'fixture'
    ? 'fixture'
    : ['permission-required', 'rate-limited', 'failed'].includes(statedStatus) && !people.length
      ? statedStatus
      : people.length
        ? 'delayed'
        : 'empty-window';
  if (safeStatus === 'delayed') {
    people = people.map(person => Object.assign({}, person, {
      dataState: person.dataState || 'last-good',
      snapshotAsOf: person.snapshotAsOf || source.generatedAt || null
    }));
  }
  return Object.assign({}, source, {
    status: safeStatus,
    isFixture: Boolean(source.isFixture || statedStatus === 'fixture'),
    isSnapshot: true,
    window: options.window,
    platforms: options.platforms,
    view: options.view,
    sort: options.sort,
    people,
    nextCursor: hasMore ? encodeCursor(offset + options.limit) : null
  });
}

async function readStaticSnapshot(queryValue, dependencies) {
  const readFile = dependencies && dependencies.readFile || fs.readFile;
  const now = dependencies && dependencies.now || new Date();
  try {
    const source = await readFile(FALLBACK_PATH, 'utf8');
    const snapshot = JSON.parse(source);
    if (!snapshot || !Array.isArray(snapshot.people)) throw new Error('Invalid Market 2 snapshot');
    const filtered = applySnapshotQuery(snapshot, queryValue, now);
    Object.defineProperty(filtered, STATIC_CACHE_MARKER, { value: true });
    return filtered;
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error instanceof SyntaxError || /Invalid Market 2 snapshot/.test(error.message))) {
      return emptySnapshot(queryValue, now);
    }
    throw error;
  }
}

async function latestMarket2People(queryValue, dependencies) {
  const options = normalizeQuery(queryValue);
  const hasDatabase = dependencies && Object.prototype.hasOwnProperty.call(dependencies, 'hasDatabase')
    ? dependencies.hasDatabase
    : Boolean(process.env.DATABASE_URL);
  if (hasDatabase) {
    try {
      const snapshot = await readDatabaseSnapshot(options, dependencies);
      if (snapshot) return { snapshot, source: 'database' };
    } catch (_error) {
      // A database or migration delay must not erase the last-good public snapshot.
    }
  }
  const snapshot = await readStaticSnapshot(options, dependencies);
  const source = snapshot.isFixture ? 'fixture' : snapshot[STATIC_CACHE_MARKER] ? 'static-cache' : 'empty-fallback';
  return { snapshot, source };
}

module.exports = {
  FALLBACK_PATH,
  PLATFORMS,
  WINDOWS,
  YOUTUBE_MAX_RETENTION_MS,
  applySnapshotQuery,
  databasePersonState,
  databaseSnapshotStatus,
  decodeCursor,
  emptySnapshot,
  encodeCursor,
  isAllowedMetric,
  isEligibilityTradable,
  latestMarket2People,
  normalizePlatforms,
  normalizeQuery,
  normalizeSort,
  normalizeView,
  normalizeWindow,
  readDatabaseSnapshot,
  readStaticSnapshot,
  rowToPerson,
  sanitizeEvidence,
  sanitizePerson,
  uiSnapshotPerson
};
