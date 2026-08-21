/* Backer retained discovery catalog client.
   Converts the public static catalog into a builder-safe, research-only model.
   It deliberately carries provider-native observation identifiers and never
   creates market eligibility, prices, or synthetic metrics. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerDiscoveryCatalog = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var CATALOG_URL = 'data/discovery-catalog.json';

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function number(value) {
    if (value === '' || value == null) return null;
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : null;
  }
  function safeURL(value, base) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, base || 'https://backer.invalid/');
      if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return '';
      return url.href;
    } catch (error) { return ''; }
  }
  function unique(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      var key = clean(value);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function first(values) {
    for (var i = 0; i < values.length; i += 1) if (values[i] !== undefined && values[i] !== null && values[i] !== '') return values[i];
    return null;
  }
  function observedMetric(row) {
    if (!row) return null;
    var id = clean(row.id);
    var entityType = clean(row.entityType || row.entity_type).toLowerCase();
    var entityId = clean(row.entityId || row.entity_id);
    var provider = clean(row.provider || row.platform).toLowerCase();
    var metric = clean(row.metric || row.key);
    var value = number(row.value != null ? row.value : row.count);
    var unit = clean(row.unit || 'count');
    var observedAt = clean(row.observedAt || row.observed_at);
    var sourceUrl = safeURL(row.sourceUrl || row.source_url || row.url);
    if (!id || !entityType || !entityId || !provider || !metric || value == null || !observedAt || !sourceUrl) return null;
    return {
      id: id,
      entityType: entityType,
      entityId: entityId,
      provider: provider,
      key: metric,
      metric: metric,
      label: metric.replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }),
      value: value,
      unit: unit,
      observedAt: observedAt,
      window: row.window == null ? null : clean(row.window),
      visibility: clean(row.visibility),
      access: clean(row.access),
      availability: clean(row.availability || 'available'),
      sourceUrl: sourceUrl,
      methodologyVersion: clean(row.methodologyVersion || row.methodology_version),
      freshness: row.freshness && typeof row.freshness === 'object' ? Object.assign({}, row.freshness) : null,
      confidence: row.confidence && typeof row.confidence === 'object' ? Object.assign({}, row.confidence) : null
    };
  }
  function normalizeProviderRuns(runs) {
    var status = Object.create(null);
    array(runs).forEach(function (run) {
      var provider = clean(run && (run.provider || run.platform)).toLowerCase();
      if (!provider) return;
      status[provider] = {
        id: clean(run.id),
        provider: provider,
        state: clean(run.state || run.publishState || 'unknown'),
        publishState: clean(run.publishState || run.state || 'unknown'),
        label: clean(run.publishState || run.state || 'unknown').replace(/_/g, ' '),
        observedAt: clean(run.observedAt),
        lastSuccessAt: clean(run.lastSuccessAt),
        reasonCode: clean(run.reasonCode),
        resultCounts: run.resultCounts && typeof run.resultCounts === 'object' ? Object.assign({}, run.resultCounts) : {}
      };
    });
    return status;
  }
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid retained discovery catalog');
    var creators = array(raw.creators);
    var identities = array(raw.platformIdentities || raw.platform_identities);
    var contents = array(raw.contentRecords || raw.content_records);
    var metrics = array(raw.metricObservations || raw.metric_observations).map(observedMetric).filter(Boolean);
    var clusters = array(raw.workClusters || raw.work_clusters);
    if (!creators.length || !identities.length) throw new Error('Retained discovery catalog has no public identities');

    var identityById = Object.create(null);
    var identitiesByCreator = Object.create(null);
    identities.forEach(function (row) {
      var id = clean(row && row.id);
      var creatorId = clean(row && (row.creatorId || row.creator_id));
      var provider = clean(row && (row.provider || row.platform)).toLowerCase();
      var profileUrl = safeURL(row && (row.profileUrl || row.profile_url || row.url));
      if (!id || !creatorId || !provider || !profileUrl) return;
      var normalized = {
        id: provider,
        provider: provider,
        sourceIdentityId: id,
        nativeId: clean(row.nativeId || row.native_id),
        handle: clean(row.handle || row.nativeId || row.native_id),
        url: profileUrl,
        sourceUrl: profileUrl,
        verified: row.verified === true,
        observedAt: clean(row.observedAt || row.observed_at)
      };
      identityById[id] = normalized;
      (identitiesByCreator[creatorId] = identitiesByCreator[creatorId] || []).push(normalized);
    });

    var clusterByRecord = Object.create(null);
    clusters.forEach(function (cluster) {
      var clusterId = clean(cluster && cluster.id);
      array(cluster && (cluster.sourceRecordIds || cluster.source_record_ids)).forEach(function (recordId) {
        var id = clean(recordId);
        if (id && !clusterByRecord[id]) clusterByRecord[id] = {
          id: clusterId || ('workcluster_source_' + id),
          sourceRecordCount: Math.max(1, number(cluster.sourceRecordCount || cluster.source_record_count) || 1),
          linkage: clean(cluster.linkage || 'source_record')
        };
      });
    });

    var metricsByEntity = Object.create(null);
    metrics.forEach(function (metric) { (metricsByEntity[metric.entityId] = metricsByEntity[metric.entityId] || []).push(metric); });
    var contentByCreator = Object.create(null);
    contents.forEach(function (row) {
      var id = clean(row && row.id);
      var creatorId = clean(row && (row.creatorId || row.creator_id));
      var provider = clean(row && (row.provider || row.platform)).toLowerCase();
      var url = safeURL(row && (row.canonicalUrl || row.canonical_url || row.url));
      if (!id || !creatorId || !provider || !url) return;
      var identityId = clean(row.platformIdentityId || row.platform_identity_id);
      var cluster = clusterByRecord[id] || { id: 'workcluster_source_' + id, sourceRecordCount: 1, linkage: 'source_record' };
      var work = {
        id: id,
        sourceRecordId: id,
        workClusterId: cluster.id,
        clusterSourceRecordCount: cluster.sourceRecordCount,
        clusterLinkage: cluster.linkage,
        platformIdentityId: identityId,
        nativeId: clean(row.nativeId || row.native_id),
        title: clean(row.title) || 'Untitled public work',
        excerpt: clean(row.excerpt),
        type: clean(row.contentType || row.content_type || 'content'),
        contentType: clean(row.contentType || row.content_type || 'content'),
        platform: provider,
        provider: provider,
        url: url,
        sourceUrl: url,
        thumbnail: safeURL(row.thumbnailUrl || row.thumbnail_url),
        thumbnailUrl: safeURL(row.thumbnailUrl || row.thumbnail_url),
        thumbnailSourceUrl: safeURL(row.thumbnailSourceUrl || row.thumbnail_source_url || url),
        publishedAt: clean(row.publishedAt || row.published_at),
        observedAt: clean(row.observedAt || row.observed_at),
        publicCounts: array(metricsByEntity[id]).map(function (metric) { return Object.assign({}, metric); })
      };
      (contentByCreator[creatorId] = contentByCreator[creatorId] || []).push(work);
    });

    var people = creators.map(function (row) {
      var id = clean(row && row.id);
      if (!id || /^(?:demo|fixture|synthetic)[-_]/i.test(id)) return null;
      var accounts = array(identitiesByCreator[id]).map(function (account) { return Object.assign({}, account); });
      if (!accounts.length) return null;
      var identityIds = accounts.map(function (account) { return account.sourceIdentityId; });
      var personMetrics = array(metricsByEntity[id]);
      identityIds.forEach(function (identityId) { personMetrics = personMetrics.concat(array(metricsByEntity[identityId])); });
      var content = array(contentByCreator[id]).sort(function (a, b) {
        return Date.parse(b.publishedAt || b.observedAt || 0) - Date.parse(a.publishedAt || a.observedAt || 0);
      });
      var primary = identityById[clean(row.primaryIdentityId || row.primary_identity_id)] || accounts[0];
      var breakout = content.slice().sort(function (a, b) {
        var av = a.publicCounts.reduce(function (sum, metric) { return sum + Math.max(0, number(metric.value) || 0); }, 0);
        var bv = b.publicCounts.reduce(function (sum, metric) { return sum + Math.max(0, number(metric.value) || 0); }, 0);
        return bv - av;
      })[0] || null;
      return {
        id: id,
        personId: id,
        name: clean(row.displayName || row.display_name || row.name) || clean(primary.handle) || id,
        displayName: clean(row.displayName || row.display_name || row.name),
        handle: primary && clean(primary.handle) ? '@' + clean(primary.handle).replace(/^@/, '') : '',
        avatar: safeURL(row.avatarUrl || row.avatar_url) || 'img/backer-mark.png?v=2',
        avatarAlt: (clean(row.displayName || row.display_name || row.name) || 'Creator') + ' public profile picture',
        avatarSourceUrl: safeURL(row.avatarSourceUrl || row.avatar_source_url || (primary && primary.sourceUrl)),
        bio: clean(row.bio),
        category: 'Public creator',
        identityKind: 'public_discovery',
        discoveryEligibility: clean(row.discoveryEligibility || row.discovery_eligibility || 'research_only'),
        eligibility: 'research_only',
        claimStatus: 'unclaimed',
        consentStatus: 'not_approved',
        tradable: false,
        tradableInstruments: [],
        marketEligibility: [],
        instruments: {},
        poa: { shown: false, settlement: { status: 'not_approved' } },
        accounts: accounts,
        platforms: accounts,
        content: content,
        recentWork: content[0] || null,
        breakoutWork: breakout,
        metrics: personMetrics.map(function (metric) { return Object.assign({}, metric); }),
        publicCounts: personMetrics.map(function (metric) { return Object.assign({}, metric); }),
        observedAt: clean(row.observedAt || row.observed_at)
      };
    }).filter(Boolean);

    return {
      schemaVersion: clean(raw.schemaVersion || raw.schema_version || 'discovery-catalog-v1'),
      generatedAt: clean(raw.generatedAt || raw.generated_at),
      isSnapshot: true,
      status: 'retained_public_catalog',
      providerStatus: normalizeProviderRuns(raw.providerRuns || raw.provider_runs),
      people: people,
      observationCount: metrics.length
    };
  }
  function personById(data, id) {
    var needle = clean(id);
    return array(data && data.people).filter(function (person) { return person.id === needle; })[0] || null;
  }
  function workById(person, id) {
    var needle = clean(id);
    return array(person && person.content).filter(function (work) { return work.id === needle; })[0] || null;
  }
  function load(options) {
    options = options || {};
    var fetcher = options.fetch || (typeof fetch === 'function' ? fetch : null);
    var url = options.url || CATALOG_URL;
    if (!fetcher) return Promise.reject(new Error('Fetch is unavailable'));
    return fetcher(url, { cache: 'no-store', credentials: 'same-origin' }).then(function (response) {
      if (!response || !response.ok) throw new Error('Discovery catalog HTTP ' + (response && response.status));
      return response.json();
    }).then(normalize);
  }

  return {
    CATALOG_URL: CATALOG_URL,
    normalize: normalize,
    load: load,
    personById: personById,
    workById: workById,
    safeURL: safeURL
  };
});
