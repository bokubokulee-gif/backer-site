/* =========================================================
   BACKER MARKET 2.1
   People, work, native evidence, Proof of Attention, markets.
   ========================================================= */
(function () {
  'use strict';

  var WATCH_KEY = 'backer_market2_watch_v1';
  var CORE_PLATFORMS = ['x', 'youtube', 'instagram', 'github'];
  var PROFILE_ONLY_PLATFORMS = ['tiktok', 'twitch', 'spotify', 'soundcloud', 'substack', 'patreon', 'kick', 'bilibili', 'douyin'];
  var PLATFORM_LABELS = {
    x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub',
    tiktok: 'TikTok', twitch: 'Twitch', spotify: 'Spotify', soundcloud: 'SoundCloud',
    substack: 'Substack', patreon: 'Patreon', kick: 'Kick', bilibili: 'Bilibili', douyin: 'Douyin'
  };
  var PLATFORM_MARKS = {
    x: 'X', youtube: 'YT', instagram: 'IG', github: 'GH', tiktok: 'TT', twitch: 'TW',
    spotify: 'SP', soundcloud: 'SC', substack: 'SS', patreon: 'PA', kick: 'K', bilibili: 'BI', douyin: 'DY'
  };
  var WINDOWS = ['24h', '7d', '30d', '90d'];
  var VIEWS = [['markets', 'Markets'], ['radar', 'Creator Radar'], ['resolved', 'Resolved']];
  var BROWSE = [
    ['trending', 'Trending'], ['new', 'New'], ['rising', 'Rising'], ['ending', 'Ending soon'],
    ['most-backed', 'Most backed'], ['high-poa', 'High PoA'], ['risk-watch', 'Risk watch']
  ];
  var CATEGORIES = [
    ['all', 'All'], ['knowledge', 'Knowledge'], ['gaming', 'Gaming'], ['music', 'Music'],
    ['business', 'Business'], ['art-design', 'Art and design'], ['technology', 'Technology']
  ];
  var INSTRUMENTS = [
    { id: 'milestones', label: 'Milestones', terminal: 'milestone', short: 'A measurable goal with a source and deadline.' },
    { id: 'pk_market', label: 'PK Market', terminal: 'pk', short: 'A source-matched comparison between outcomes.' },
    { id: 'creator_arena', label: 'Creator Arena', terminal: 'pk', short: 'Research two people before an approved PK market.' },
    { id: 'creator_perps', label: 'Creator Perps', terminal: 'perps', short: 'Continuous simulated exposure to an approved attention index.' }
  ];
  var CONFIDENCE_ORDER = { high: 4, medium: 3, low: 2, insufficient: 1, unavailable: 0 };
  var BUNDLED = window.BACKER_MARKET2_DATA || window.BackerMarket2Data || null;
  var root = null;
  var DATA = null;
  var requestSequence = 0;
  var requestTimer = null;
  var searchTimer = null;
  var booted = false;
  var state = {
    view: 'radar', browse: 'trending', categoryRail: 'all', range: '7d',
    platforms: [], quick: [], sort: 'movement', selectedId: '', instrument: 'milestones',
    query: '', drawer: false, mobileRoster: false, mobileTicket: false,
    categories: [], eligibility: 'all', confidence: 'all', peerId: '', watched: [],
    dataMode: '', loading: true, loadError: '', source: 'bundled', sourceLabel: 'Bundled fallback',
    sourceState: 'stale_snapshot', loadedOnce: false
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function text(value, fallback) {
    if (value == null || value === '') return fallback || '';
    if (Array.isArray(value)) return value.map(function (item) { return text(item, ''); }).filter(Boolean).join(' ');
    if (typeof value === 'object') return text(value.label || value.copy || value.reason || value.status, fallback);
    return String(value).replace(/[\u2013\u2014]/g, ' - ');
  }

  function first() {
    for (var i = 0; i < arguments.length; i += 1) {
      if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== '') return arguments[i];
    }
    return null;
  }

  function array(value) {
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
  }

  function unique(values) {
    return values.filter(function (value, index, all) { return value && all.indexOf(value) === index; });
  }

  function number(value) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function safeURL(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    try {
      var parsed = new URL(raw, window.location.href);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
      return '';
    } catch (error) { return ''; }
  }

  function formatDate(value, withTime) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'Time not retained';
    try {
      return new Intl.DateTimeFormat('en-US', withTime ? {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: 'UTC', timeZoneName: 'short'
      } : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
    } catch (error) { return date.toISOString().slice(0, 10); }
  }

  function formatCompact(value) {
    var parsed = number(value);
    if (parsed === null) return text(value, 'Unavailable');
    if (Math.abs(parsed) >= 1000000) return (parsed / 1000000).toFixed(parsed >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (Math.abs(parsed) >= 1000) return (parsed / 1000).toFixed(parsed >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return new Intl.NumberFormat('en-US').format(parsed);
  }

  function formatMoney(value) {
    var parsed = number(value);
    if (parsed === null) return 'No simulated volume';
    return '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(parsed) + ' sim.';
  }

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function humanState(value) {
    var key = String(value || '').toLowerCase().replace(/_/g, '-');
    var known = {
      live: 'Live', succeeded: 'Live', fresh: 'Fresh', partial: 'Partial', 'partial-coverage': 'Partial coverage',
      snapshot: 'Snapshot', 'stale-snapshot': 'Stale snapshot', delayed: 'Delayed', 'last-good': 'Last good',
      unavailable: 'Unavailable', failed: 'Unavailable', 'rate-limited': 'Rate limited',
      'permission-required': 'Permission required', 'empty-window': 'No range data', 'not-returned': 'Not returned',
      unsupported: 'Unsupported', public_app: 'Public app', 'public-app': 'Public app',
      creator_authorized: 'Creator authorized', 'creator-authorized': 'Creator authorized',
      known_professional: 'Known professional', 'known-professional': 'Known professional'
    };
    return known[key] || (key ? key.replace(/-/g, ' ').replace(/^./, function (letter) { return letter.toUpperCase(); }) : 'Unavailable');
  }

  function domainLabel(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (error) { return 'Original source'; }
  }

  function initials(name) {
    return String(name || 'B').split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
  }

  function metricLabel(key) {
    var aliases = {
      public_repos: 'Public repositories', publicRepos: 'Public repositories', followers: 'Followers',
      following: 'Following', stars: 'Repository stars', stargazers_count: 'Repository stars',
      forks: 'Repository forks', forks_count: 'Repository forks', subscribers: 'Notification watchers',
      subscribers_count: 'Notification watchers', views: 'Views', view_count: 'Views', likes: 'Likes',
      like_count: 'Likes', comments: 'Comments', comment_count: 'Comments', reposts: 'Reposts',
      quotes: 'Quotes', impressions: 'Impressions', bookmarks: 'Bookmarks', media_count: 'Media count'
    };
    return aliases[key] || String(key || 'Native metric').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (letter) { return letter.toUpperCase(); });
  }

  function normalizeAccount(raw, person) {
    var item = typeof raw === 'string' ? { id: raw } : (raw || {});
    var id = String(first(item.id, item.platform, item.provider, '')).toLowerCase();
    return {
      id: id,
      handle: text(first(item.handle, item.nativeAccountId, person && person.handle), ''),
      url: safeURL(first(item.url, item.profileUrl, item.sourceUrl)),
      state: first(item.state, item.verificationState, item.availability, 'profile_only'),
      accessClass: first(item.accessClass, item.accountType, item.policyMode, 'profile_only'),
      asOf: first(item.asOf, item.refreshedAt, item.observedAt),
      sourceUrl: safeURL(first(item.sourceUrl, item.profileUrl, item.url))
    };
  }

  function normalizeWork(raw, personId, fallbackPlatform, index) {
    var item = raw || {};
    var url = safeURL(first(item.url, item.canonicalUrl, item.canonical_url, item.sourceUrl));
    var id = text(first(item.id, item.contentId, item.content_id, item.nativeContentId, item.native_content_id), '');
    if (!id) id = slug(personId + '-' + (url || item.title || index || 'work'));
    return {
      id: id,
      platform: String(first(item.platform, item.provider, fallbackPlatform, '')).toLowerCase(),
      title: text(first(item.title, item.title_or_excerpt, item.name), 'Work retained at source'),
      type: text(first(item.type, item.contentType, item.content_type), 'Public work'),
      publishedAt: first(item.publishedAt, item.published_at),
      observedAt: first(item.observedAt, item.observed_at, item.refreshedAt, item.refreshed_at),
      url: url,
      thumbnail: safeURL(first(item.thumbnail, item.thumbnailUrl, item.thumbnail_url)),
      providerLabel: text(first(item.providerLabel, item.nativeLabel, item.type), 'Original public work'),
      providerRank: number(first(item.providerRank, item.provider_rank)),
      publicCounts: array(first(item.publicCounts, item.metrics, [])),
      availability: first(item.availability, 'available'),
      sourceUrl: safeURL(first(item.sourceUrl, item.url, item.canonicalUrl, item.canonical_url)),
      backerInterpretation: text(first(item.backerInterpretation, item.interpretation), '')
    };
  }

  function normalizeMetric(raw, fallback) {
    var item = raw || {};
    var value = first(item.rawText, item.raw_metric_text, item.rawValue, item.raw_metric_value, item.current, item.value, item.count);
    var delta = first(item.percentDelta, item.percent_delta, item.absoluteDelta, item.absolute_delta, item.delta);
    var provider = String(first(item.platform, item.provider, fallback && fallback.provider, '')).toLowerCase();
    var availability = first(item.availability, item.state, value == null ? 'not_returned' : 'available');
    return {
      provider: provider,
      subject: text(first(item.subjectLabel, item.subject, item.repository, item.repo, fallback && fallback.subject), ''),
      key: text(first(item.key, item.metricKey, item.metric_key, item.metricName, item.metric_name, item.nativeMetricName, item.label, fallback && fallback.key), 'native_metric'),
      label: text(first(item.nativeMetricName, item.label, item.metricName, item.metric_name, fallback && fallback.label), ''),
      value: value,
      delta: delta,
      deltaKind: item.percentDelta != null || item.percent_delta != null ? 'percent' : 'absolute',
      availability: availability,
      accessClass: first(item.accessClass, item.access_class, item.policyMode, item.policy_mode, fallback && fallback.accessClass, 'public_app'),
      observedAt: first(item.observedAt, item.observed_at, item.sourceTimestamp, item.source_timestamp, item.providerTimestamp, fallback && fallback.observedAt),
      sourceUrl: safeURL(first(item.sourceUrl, item.source_url, fallback && fallback.sourceUrl)),
      window: String(first(item.window, item.observationWindow, item.observation_window, fallback && fallback.window) || '').toLowerCase(),
      providerRank: number(first(item.providerRank, item.provider_rank))
    };
  }

  function catalogEntry(catalog, provider, key) {
    var source = catalog || {};
    var providerCatalog = source[provider] || {};
    if (Array.isArray(providerCatalog)) {
      return providerCatalog.filter(function (entry) { return String(first(entry.key, entry.metricKey, entry.metric_key, '')) === String(key); })[0] || {};
    }
    return providerCatalog[key] || providerCatalog.metrics && providerCatalog.metrics[key] || source[key] || {};
  }

  function catalogEntries(catalog, provider) {
    var bucket = catalog && catalog[provider] || [];
    if (Array.isArray(bucket)) return bucket;
    var metrics = bucket.metrics || bucket;
    return Object.keys(metrics || {}).map(function (key) {
      var entry = metrics[key];
      return typeof entry === 'object' ? Object.assign({ key: key }, entry) : { key: key, label: entry };
    });
  }

  function flattenNativeSnapshots(personId, snapshots, catalog) {
    var result = [];
    var node = snapshots && (snapshots[personId] || snapshots[String(personId)]) || {};
    var allowed = /^(followers|followers_count|following|public_repos|publicRepos|stars|stargazers_count|forks|forks_count|subscribers|subscriberCount|subscribers_count|views|viewCount|view_count|likes|likeCount|like_count|comments|commentCount|comment_count|replies|reply_count|reposts|retweet_count|quotes|quote_count|impressions|impression_count|bookmarks|bookmark_count|media_count)$/;
    Object.keys(node || {}).forEach(function (providerKey) {
      var provider = providerKey.toLowerCase();
      var payload = node[providerKey] || {};
      var base = {
        provider: provider,
        observedAt: first(payload.observedAt, payload.asOf, payload.fetchedAt),
        sourceUrl: first(payload.sourceUrl, payload.url),
        accessClass: first(payload.accessClass, payload.access_class, 'public_app')
      };
      function pushValue(key, value, subject, extra) {
        if (!allowed.test(key)) return;
        var detail = value && typeof value === 'object' && !Array.isArray(value) ? value : { value: value };
        var cat = catalogEntry(catalog, provider, key);
        result.push(normalizeMetric(detail, {
          provider: provider,
          key: key,
          label: first(detail.label, cat.label, metricLabel(key)),
          subject: subject || '',
          observedAt: first(detail.observedAt, extra && extra.observedAt, base.observedAt),
          sourceUrl: first(detail.sourceUrl, extra && extra.sourceUrl, base.sourceUrl),
          accessClass: first(detail.accessClass, cat.accessClass, base.accessClass)
        }));
      }
      var metrics = payload.metrics && typeof payload.metrics === 'object' ? payload.metrics : payload;
      if (Array.isArray(metrics)) {
        metrics.forEach(function (metric) {
          var key = String(first(metric.key, metric.metricKey, metric.metric_key, ''));
          pushValue(key, metric, text(metric.subject, ''), base);
        });
      } else {
        Object.keys(metrics || {}).forEach(function (key) {
          if (key !== 'repositories' && key !== 'repos') pushValue(key, metrics[key], '', base);
        });
      }
      array(first(payload.repositories, payload.repos, [])).forEach(function (repo) {
        var subject = text(first(repo.name, repo.fullName, repo.full_name), 'Repository');
        Object.keys(repo || {}).forEach(function (key) { pushValue(key, repo[key], subject, repo); });
      });
    });
    return result.filter(function (row) { return row.value !== null && row.value !== undefined && row.value !== ''; });
  }

  function normalizeEvidence(raw, range, person, dataset) {
    var item = raw || {};
    var facts = array(first(item.platformEvidence, item.facts, item.evidenceFacts, item.evidence_facts, item.publicCounts, []));
    var metrics = facts.map(function (fact) { return normalizeMetric(fact, { window: range }); });
    return {
      state: first(item.state, item.dataState, 'partial_coverage'),
      label: text(first(item.label, item.headline, item.ranking && item.ranking.label), 'Public evidence retained'),
      whyNow: text(first(item.whyNow, item.interpretation, item.backerInterpretation, person && person.whyNow), 'Public work and source links are retained for review.'),
      confidence: text(first(item.confidence && (item.confidence.grade || item.confidence.label), item.confidence, 'low'), 'low').toLowerCase(),
      providerRank: number(first(item.providerRank, item.provider_rank, item.ranking && item.ranking.providerRank)),
      platforms: unique(array(first(item.platforms, item.platformCoverage, item.platform_coverage, [])).map(function (value) { return String(value).toLowerCase(); })),
      asOf: first(item.asOf, item.generatedAt, item.observedAt, dataset && dataset.generatedAt),
      sourceUrls: unique(array(first(item.sourceUrls, item.provenance && item.provenance.sourceUrls, [])).map(safeURL)),
      coverageGaps: array(first(item.coverageGaps, item.coverage_gaps, [])),
      metrics: metrics,
      confirmation: first(item.confirmation, null)
    };
  }

  function normalizeEvidenceMap(person, dataset) {
    var result = {};
    var source = person.evidence || person.attentionEvidence || person.attention_evidence || {};
    if (Array.isArray(source)) {
      source.forEach(function (item) {
        var range = String(first(item.window, item.observationWindow, item.observation_window, dataset.window, '7d')).toLowerCase();
        result[range] = normalizeEvidence(item, range, person, dataset);
      });
    } else {
      Object.keys(source || {}).forEach(function (range) { result[range.toLowerCase()] = normalizeEvidence(source[range], range.toLowerCase(), person, dataset); });
    }
    if (person.attention && !result[String(person.attention.window || dataset.window || '7d').toLowerCase()]) {
      var attentionRange = String(person.attention.window || dataset.window || '7d').toLowerCase();
      result[attentionRange] = normalizeEvidence(person.attention, attentionRange, person, dataset);
    }
    WINDOWS.forEach(function (range) {
      if (!result[range]) result[range] = normalizeEvidence({ state: 'empty_window', confidence: 'unavailable' }, range, person, dataset);
    });
    return result;
  }

  function normalizePerson(raw, dataset, catalog, snapshots) {
    var item = raw || {};
    var identity = item.identity || {};
    var id = text(first(item.personId, item.person_id, item.id, item.slug), '');
    var name = text(first(identity.displayName, identity.name, item.displayName, item.display_name, item.name), 'Unknown person');
    var handle = text(first(identity.handle, item.handle), '');
    var personSeed = { handle: handle };
    var accountSource = first(identity.accounts, item.accounts, item.sourceAccounts, item.source_accounts, item.platforms, []);
    var accounts = array(accountSource).map(function (account) { return normalizeAccount(account, personSeed); }).filter(function (account) { return account.id; });
    var contentSource = array(first(item.content, item.contentItems, item.content_items, []));
    var fallbackPlatform = accounts[0] && accounts[0].id;
    var content = contentSource.map(function (work, index) { return normalizeWork(work, id, fallbackPlatform, index); });
    var latest = normalizeWork(first(item.latestWork, item.recentWork, content[0], {}), id, fallbackPlatform, 0);
    var breakout = normalizeWork(first(item.breakoutWork, content.filter(function (work) { return work.providerRank !== null; })[0], content[1], latest), id, fallbackPlatform, 1);
    if (!content.length) content = [latest, breakout].filter(function (work, index, all) { return work.url && all.map(function (row) { return row.id; }).indexOf(work.id) === index; });
    var person = {
      id: id,
      name: name,
      handle: handle,
      avatar: safeURL(first(identity.portraitUrl, item.portraitUrl, item.portrait_url, item.avatar)),
      category: text(first(identity.category, item.category), 'Creator'),
      bio: text(first(identity.description, item.description, item.public_description, item.bio), 'Public creator profile retained from linked source accounts.'),
      identityConfidence: text(first(identity.linkConfidence, item.identityConfidence, item.identity_confidence), 'source_only'),
      claimStatus: text(first(identity.claimStatus, item.claimStatus, item.claim_status), 'unclaimed'),
      consentStatus: text(first(item.consentStatus, item.consent_status), 'not_recorded'),
      accounts: accounts,
      platforms: accounts,
      content: content,
      recentWork: latest,
      breakoutWork: breakout,
      evidence: null,
      metrics: [],
      instruments: first(item.markets, item.instruments, {}),
      marketEligibility: array(first(item.marketEligibility, item.market_eligibility, item.eligibilityRecords, [])),
      tradableInstruments: array(first(item.tradableInstruments, item.tradable_instruments, [])),
      tradable: Boolean(first(item.tradable, item.tradeEligible, item.tradability && item.tradability.tradeEligible, item.eligibility === 'eligible', false)),
      audienceSize: number(first(item.audienceSize, item.followers, identity.audienceSize)),
      whyNow: text(first(item.whyNow, item.attention && item.attention.whyNow), ''),
      poa: item.poa || item.proofOfAttention || {},
      source: item.provenance || item.source || {},
      dataState: first(item.dataState, item.data_state, dataset.status)
    };
    person.evidence = normalizeEvidenceMap(item, dataset);
    person.metrics = array(first(item.metrics, item.metricSnapshots, item.metric_snapshots, [])).map(function (metric) { return normalizeMetric(metric); });
    WINDOWS.forEach(function (range) { person.metrics = person.metrics.concat(person.evidence[range].metrics || []); });
    person.metrics = person.metrics.concat(flattenNativeSnapshots(id, snapshots, catalog));
    var providerWithValue = unique(person.metrics.filter(function (metric) { return metric.value !== null && metric.value !== undefined && metric.value !== ''; }).map(function (metric) { return metric.provider; }));
    accounts.forEach(function (account) {
      if (providerWithValue.indexOf(account.id) >= 0) return;
      var provider = dataset.providerStatus && dataset.providerStatus[account.id] || {};
      var plannedMetrics = catalogEntries(catalog, account.id);
      if (!plannedMetrics.length) plannedMetrics = [{ key: 'availability', label: 'Metric access', subject: '' }];
      plannedMetrics.forEach(function (definition) {
        person.metrics.push({
          provider: account.id, subject: text(definition.subject, ''), key: text(first(definition.key, definition.metricKey), 'availability'), label: text(first(definition.label, definition.nativeMetricName), 'Metric access'), value: null, delta: null,
          availability: first(provider.state, provider.status, account.state, 'permission_required'),
          accessClass: first(definition.accessClass, definition.access_class, account.accessClass, 'profile_only'), observedAt: first(provider.asOf, provider.completedAt, account.asOf, dataset.generatedAt),
          sourceUrl: safeURL(first(provider.sourceUrl, account.sourceUrl, account.url)), window: '', providerRank: null
        });
      });
    });
    if (!person.tradable) person.tradable = person.marketEligibility.some(function (record) { return String(record.status).toLowerCase() === 'eligible'; });
    return person;
  }

  function normalizeDataset(raw, sourceName) {
    var source = raw && raw.data && Array.isArray(raw.data.people) ? raw.data : (raw || {});
    var catalog = source.metricCatalog || source.metric_catalog || {};
    var snapshots = source.nativeMetricSnapshots || source.native_metric_snapshots || {};
    var dataset = {
      schemaVersion: first(source.schemaVersion, source.schema_version, 1),
      generatedAt: first(source.generatedAt, source.generated_at, new Date(0).toISOString()),
      status: first(source.dataState, source.status, source.isSnapshot ? 'stale_snapshot' : 'live'),
      isSnapshot: Boolean(source.isSnapshot || source.is_snapshot || sourceName !== 'api'),
      isFixture: Boolean(source.isFixture || source.is_fixture),
      notice: text(first(source.notice, source.message), ''),
      defaultWindow: String(first(source.defaultWindow, source.window, '7d')).toLowerCase(),
      providerStatus: source.providerStatus || source.provider_status || {},
      methodology: source.methodology || {},
      marketCatalog: source.marketCatalog || source.market_catalog || [],
      rightRail: source.rightRail || source.right_rail || {},
      nextCursor: source.nextCursor || source.next_cursor || null,
      metricCatalog: catalog,
      nativeMetricSnapshots: snapshots,
      people: []
    };
    dataset.people = array(source.people).map(function (person) { return normalizePerson(person, dataset, catalog, snapshots); }).filter(function (person) { return person.id; });
    return dataset;
  }

  function people() { return DATA && Array.isArray(DATA.people) ? DATA.people : []; }
  function personById(id) { return people().filter(function (person) { return person.id === id; })[0] || null; }
  function selectedPerson() { return personById(state.selectedId) || people()[0] || null; }
  function evidenceFor(person) { return person && person.evidence && (person.evidence[state.range] || person.evidence['7d']) || {}; }
  function platformIds(person) { return unique((person && person.accounts || []).map(function (account) { return account.id; })); }
  function confidenceValue(person) { return text(evidenceFor(person).confidence, 'unavailable').toLowerCase(); }
  function confidenceRank(person) { return CONFIDENCE_ORDER[confidenceValue(person)] || 0; }

  function categoryId(person) {
    var value = (person.category + ' ' + person.bio).toLowerCase();
    if (/game|stream|esport/.test(value)) return 'gaming';
    if (/music|artist|audio|producer|singer/.test(value)) return 'music';
    if (/business|startup|marketing|founder|entrepreneur/.test(value)) return 'business';
    if (/art|design|illustrat|photo|film|video creator/.test(value)) return 'art-design';
    if (/program|develop|software|github|technology|code|engineer/.test(value)) return 'technology';
    return 'knowledge';
  }

  function instrumentId(value) {
    var key = String(value || '').toLowerCase().replace(/-/g, '_');
    if (key === 'milestone') return 'milestones';
    if (key === 'pk') return 'pk_market';
    if (key === 'arena') return 'creator_arena';
    if (key === 'perps' || key === 'creator_perp') return 'creator_perps';
    return key;
  }

  function instrumentMeta(id) { return INSTRUMENTS.filter(function (item) { return item.id === id; })[0] || INSTRUMENTS[0]; }

  function instrumentRaw(person, id) {
    var source = person && person.instruments || {};
    if (Array.isArray(source)) return source.filter(function (item) { return instrumentId(item.id || item.instrument) === id; })[0] || {};
    return source[id] || source[id.replace(/_/g, '-')] || source[instrumentMeta(id).terminal] || {};
  }

  function eligibilityRecord(person, id) {
    return (person.marketEligibility || []).filter(function (record) { return instrumentId(record.instrument || record.id) === id; })[0] || {};
  }

  function instrumentOpen(person, id) {
    var raw = instrumentRaw(person, id);
    var eligibility = eligibilityRecord(person, id);
    var status = String(first(raw.status, eligibility.status, '')).toLowerCase();
    return Boolean(person.tradable && ['open', 'eligible', 'active'].indexOf(status) >= 0);
  }

  function hasQuote(raw, id) {
    if (id === 'creator_perps') return number(first(raw.mark, raw.markPrice, raw.index)) !== null;
    return number(first(raw.ask, raw.yesAsk, raw.lastTrade, raw.price, raw.bid)) !== null;
  }

  function blockersFor(person, id) {
    var raw = instrumentRaw(person, id);
    var record = eligibilityRecord(person, id);
    var blockers = array(first(raw.blockers, raw.reasons, [])).map(function (item) { return text(item, ''); }).filter(Boolean);
    if (!/creator[_ -]?verified|verified/i.test(person.identityConfidence) && String(record.platformAccountVerified) !== 'true') blockers.push('Creator-verified identity link');
    if (String(first(record.consentStatus, person.consentStatus, '')).toLowerCase() !== 'active') blockers.push('Active trading consent');
    if (!first(raw.oracle, raw.source, raw.settlementSource, record.settlementSource)) blockers.push('Written settlement source');
    if (!instrumentOpen(person, id)) blockers.push(id === 'creator_perps' ? 'Perpetual risk and index approval' : 'Instrument policy and risk approval');
    return unique(blockers);
  }

  function resolvedPerson(person) {
    return INSTRUMENTS.some(function (item) { return String(instrumentRaw(person, item.id).status).toLowerCase() === 'resolved'; });
  }

  function marketBacking(person) {
    var total = 0;
    INSTRUMENTS.forEach(function (item) {
      var raw = instrumentRaw(person, item.id);
      var value = number(first(raw.simulatedVolume, raw.simVolume, raw.volume, raw.backed));
      if (value !== null) total += value;
    });
    return total;
  }

  function daysToClose(person) {
    var values = INSTRUMENTS.map(function (item) { return number(first(instrumentRaw(person, item.id).daysToClose, instrumentRaw(person, item.id).closeDays)); }).filter(function (value) { return value !== null; });
    return values.length ? Math.min.apply(Math, values) : null;
  }

  function nativeRank(person, fallback) {
    var ev = evidenceFor(person);
    var values = [ev.providerRank].concat(person.metrics.map(function (metric) { return metric.providerRank; })).filter(function (value) { return number(value) !== null; });
    return values.length ? Math.min.apply(Math, values.map(Number)) : 1000 + fallback;
  }

  function movementValue(person) {
    var values = person.metrics.filter(function (metric) { return metric.window === state.range && number(metric.delta) !== null; }).map(function (metric) { return Number(metric.delta); });
    return values.length ? Math.max.apply(Math, values) : null;
  }

  function isWatched(id) { return state.watched.indexOf(id) >= 0; }
  function loadWatched() {
    try { var parsed = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); state.watched = Array.isArray(parsed) ? parsed.filter(Boolean) : []; }
    catch (error) { state.watched = []; }
  }
  function toggleWatch(id) {
    var index = state.watched.indexOf(id);
    if (index >= 0) state.watched.splice(index, 1); else state.watched.push(id);
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(state.watched)); } catch (error) {}
  }

  function parseHash() {
    var parts = String(location.hash || '').split('?');
    if (parts[0] !== '#market2') return;
    var params = new URLSearchParams(parts.slice(1).join('?'));
    if (VIEWS.some(function (view) { return view[0] === params.get('view'); })) state.view = params.get('view');
    if (WINDOWS.indexOf(params.get('range')) >= 0) state.range = params.get('range');
    if (BROWSE.some(function (item) { return item[0] === params.get('browse'); })) state.browse = params.get('browse');
    if (CATEGORIES.some(function (item) { return item[0] === params.get('category'); })) state.categoryRail = params.get('category');
    if (params.get('platforms')) state.platforms = params.get('platforms').split(',').filter(Boolean);
    if (params.get('quick')) state.quick = params.get('quick').split(',').filter(Boolean);
    if (params.get('sort')) state.sort = params.get('sort');
    if (params.get('person')) state.selectedId = params.get('person');
    if (INSTRUMENTS.some(function (item) { return item.id === params.get('instrument'); })) state.instrument = params.get('instrument');
    if (params.get('categories')) state.categories = params.get('categories').split(',').filter(Boolean);
    if (params.get('eligibility')) state.eligibility = params.get('eligibility');
    if (params.get('confidence')) state.confidence = params.get('confidence');
    if (params.get('peer')) state.peerId = params.get('peer');
    state.dataMode = params.get('data') || '';
  }

  function stateURL() {
    var params = new URLSearchParams();
    params.set('view', state.view); params.set('browse', state.browse); params.set('category', state.categoryRail);
    params.set('range', state.range); params.set('sort', state.sort); params.set('instrument', state.instrument);
    if (state.platforms.length) params.set('platforms', state.platforms.join(','));
    if (state.quick.length) params.set('quick', state.quick.join(','));
    if (state.selectedId) params.set('person', state.selectedId);
    if (state.categories.length) params.set('categories', state.categories.join(','));
    if (state.eligibility !== 'all') params.set('eligibility', state.eligibility);
    if (state.confidence !== 'all') params.set('confidence', state.confidence);
    if (state.peerId) params.set('peer', state.peerId);
    if (state.dataMode) params.set('data', state.dataMode);
    return location.origin + location.pathname + '#market2?' + params.toString();
  }

  function syncHash() {
    try { history.replaceState(null, '', stateURL().replace(location.origin, '')); } catch (error) {}
  }

  function track(event, props) {
    try {
      if (window.BackerAnalytics) window.BackerAnalytics.track(event, props || {});
      window.dispatchEvent(new CustomEvent('backer:track', { detail: { event: event, props: props || {} } }));
    } catch (error) {}
  }

  function toast(message, kind) { if (window.__backerToast) window.__backerToast(message, kind); }

  function matchesQuick(person) {
    if (state.quick.indexOf('open') >= 0 && !person.tradable) return false;
    if (state.quick.indexOf('ending30') >= 0 && !(daysToClose(person) !== null && daysToClose(person) < 30)) return false;
    if (state.quick.indexOf('under100k') >= 0 && !(person.audienceSize !== null && person.audienceSize < 100000)) return false;
    if (state.quick.indexOf('medium') >= 0 && confidenceRank(person) < CONFIDENCE_ORDER.medium) return false;
    if (state.quick.indexOf('multi') >= 0 && platformIds(person).length < 2) return false;
    if (state.quick.indexOf('watched') >= 0 && !isWatched(person.id)) return false;
    return true;
  }

  function filteredPeople() {
    if (state.dataMode === 'empty') return [];
    var query = state.query.toLowerCase().trim();
    var generated = Date.parse(DATA && DATA.generatedAt || 0);
    var list = people().filter(function (person) {
      if (state.view === 'markets' && !person.tradable) return false;
      if (state.view === 'radar' && resolvedPerson(person)) return false;
      if (state.view === 'resolved' && !resolvedPerson(person)) return false;
      var ids = platformIds(person);
      if (state.platforms.length && !state.platforms.some(function (id) { return ids.indexOf(id) >= 0; })) return false;
      if (state.categoryRail !== 'all' && categoryId(person) !== state.categoryRail) return false;
      if (state.categories.length && state.categories.indexOf(person.category) < 0) return false;
      if (state.eligibility === 'eligible' && !person.tradable) return false;
      if (state.eligibility === 'discovery_only' && person.tradable) return false;
      if (state.confidence !== 'all' && confidenceValue(person) !== state.confidence) return false;
      if (!matchesQuick(person)) return false;
      if (state.browse === 'new') {
        var published = Date.parse(person.recentWork.publishedAt || 0);
        if (!Number.isFinite(published) || !Number.isFinite(generated) || generated - published > 30 * 86400000) return false;
      }
      if (state.browse === 'ending' && !(daysToClose(person) !== null && daysToClose(person) < 30)) return false;
      if (state.browse === 'high-poa' && confidenceRank(person) < CONFIDENCE_ORDER.medium) return false;
      if (state.browse === 'risk-watch' && !evidenceFor(person).coverageGaps.length && /live|fresh/.test(String(person.dataState))) return false;
      if (query) {
        var workText = [person.recentWork.title, person.breakoutWork.title].join(' ');
        var haystack = [person.name, person.handle, person.category, person.bio, workText, ids.join(' ')].join(' ').toLowerCase();
        if (haystack.indexOf(query) < 0) return false;
      }
      return true;
    });
    return list.map(function (person, index) { return { person: person, index: index }; }).sort(function (a, b) {
      if (state.sort === 'watched') return Number(isWatched(b.person.id)) - Number(isWatched(a.person.id));
      if (state.sort === 'evidence' || state.browse === 'high-poa') return confidenceRank(b.person) - confidenceRank(a.person);
      if (state.sort === 'newest' || state.browse === 'new') return Date.parse(b.person.recentWork.publishedAt || 0) - Date.parse(a.person.recentWork.publishedAt || 0);
      if (state.sort === 'backed' || state.browse === 'most-backed') return marketBacking(b.person) - marketBacking(a.person);
      if (state.sort === 'risk' || state.browse === 'risk-watch') return evidenceFor(b.person).coverageGaps.length - evidenceFor(a.person).coverageGaps.length;
      if (state.browse === 'rising') return (movementValue(b.person) || -Infinity) - (movementValue(a.person) || -Infinity);
      return nativeRank(a.person, a.index) - nativeRank(b.person, b.index);
    }).map(function (entry) { return entry.person; });
  }

  function apiQuery() {
    var params = new URLSearchParams();
    params.set('window', state.range);
    params.set('view', state.view === 'radar' ? 'creator-radar' : state.view);
    var sortMap = { movement: 'movement', native: 'provider-rank', watched: 'movement', evidence: 'evidence', newest: 'newest-work', backed: 'movement', risk: 'movement' };
    params.set('sort', sortMap[state.sort] || 'movement');
    params.set('limit', '50');
    if (state.platforms.length) params.set('platforms', state.platforms.join(','));
    return params.toString();
  }

  function validPayload(value) { return value && (Array.isArray(value.people) || value.data && Array.isArray(value.data.people)); }

  async function requestJSON(url) {
    var response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Request failed ' + response.status);
    var payload = await response.json();
    if (!validPayload(payload)) throw new Error('Invalid Market 2 payload');
    return { payload: payload, response: response };
  }

  async function loadData() {
    var sequence = ++requestSequence;
    state.loading = true; state.loadError = '';
    draw(false);
    if (state.dataMode === 'loading') await new Promise(function (resolve) { window.setTimeout(resolve, 850); });
    var result = null;
    try {
      if (state.dataMode === 'error') throw new Error('Simulated provider error');
      if (/\.github\.io$/i.test(window.location.hostname) || state.dataMode === 'static') {
        throw new Error('Static host uses the dated same-origin snapshot');
      }
      result = await requestJSON('/api/market2/people?' + apiQuery());
      if (sequence !== requestSequence) return;
      DATA = normalizeDataset(result.payload, 'api');
      state.source = 'api'; state.sourceLabel = 'Backer API'; state.sourceState = DATA.status || 'live';
    } catch (apiError) {
      try {
        result = await requestJSON('data/market2-people.json');
        if (sequence !== requestSequence) return;
        DATA = normalizeDataset(result.payload, 'static');
        state.source = 'static'; state.sourceLabel = 'Dated static snapshot'; state.sourceState = 'stale_snapshot';
        state.loadError = apiError.message;
      } catch (staticError) {
        if (sequence !== requestSequence) return;
        if (validPayload(BUNDLED)) {
          DATA = normalizeDataset(BUNDLED, 'bundled');
          state.source = 'bundled'; state.sourceLabel = 'Emergency bundled snapshot'; state.sourceState = 'stale_snapshot';
          state.loadError = staticError.message;
        } else {
          DATA = normalizeDataset({ people: [], status: 'unavailable', generatedAt: new Date().toISOString() }, 'empty');
          state.source = 'none'; state.sourceLabel = 'No retained data'; state.sourceState = 'unavailable';
          state.loadError = staticError.message;
        }
      }
    }
    state.loading = false; state.loadedOnce = true;
    ensureSelection(filteredPeople());
    draw(false);
  }

  function scheduleDataLoad() {
    window.clearTimeout(requestTimer);
    requestTimer = window.setTimeout(loadData, 90);
  }

  function avatarHTML(person, type, eager) {
    var src = safeURL(person && person.avatar);
    return '<span class="m2-avatar m2-avatar-' + esc(type || 'row') + '">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(person.name) + ' profile" loading="' + (eager ? 'eager' : 'lazy') + '" referrerpolicy="no-referrer" />' : '') +
      '<span class="m2-avatar-fallback" aria-hidden="true">' + esc(initials(person && person.name)) + '</span></span>';
  }

  function platformMarks(person, links) {
    return (person.accounts || []).map(function (account) {
      var label = PLATFORM_LABELS[account.id] || account.id;
      var mark = '<span class="m2-platform-mark is-' + esc(account.id) + '">' + esc(PLATFORM_MARKS[account.id] || label.slice(0, 2)) + '</span>';
      if (links && account.url) return '<a class="m2-profile-link" href="' + esc(account.url) + '" target="_blank" rel="noreferrer">' + mark + '<span>' + esc(account.handle || label) + '</span></a>';
      return '<span class="m2-platform-badge" title="' + esc(label + ' · ' + humanState(account.state)) + '">' + mark + '</span>';
    }).join('');
  }

  function watchButton(person, compact) {
    var watched = isWatched(person.id);
    return '<button class="m2-watch ' + (compact ? 'm2-watch-small' : 'm2-secondary-button') + (watched ? ' is-active' : '') + '" type="button" data-m2-watch="' + esc(person.id) + '" aria-pressed="' + watched + '"><span aria-hidden="true">' + (watched ? '●' : '+') + '</span>' + (watched ? 'Watching' : 'Watch') + '</button>';
  }

  function statusBadge(person) {
    return '<span class="m2-status ' + (person.tradable ? 'is-eligible' : 'is-discovery') + '"><i></i>' + (person.tradable ? 'Trade eligible' : 'Discovery only') + '</span>';
  }

  function builderURL(scope, person, work) {
    var params = new URLSearchParams();
    params.set('scope', scope); params.set('person', person.id); params.set('source', 'market2');
    if (work && work.id) params.set('content', work.id);
    return 'backercreate.html?' + params.toString();
  }

  function commandHTML() {
    return '<header class="m2-command"><div class="m2-command-copy"><span class="m2-kicker">Backer people market</span><h1>People worth noticing</h1><p>See the work, inspect the native evidence, then decide how to back the person.</p></div>' +
      '<div class="m2-command-side"><label class="m2-search"><span class="m2-search-label">Search</span><input id="m2Search" type="search" value="' + esc(state.query) + '" placeholder="People, handles, or work" autocomplete="off" /><kbd>/</kbd></label>' +
      '<nav class="m2-command-nav"><button type="button" data-m2-show-watched>Your People <b>' + state.watched.length + '</b></button><a href="portfolio.html">Portfolio</a><a href="backercreate.html?source=market2">Create market</a></nav></div></header>';
  }

  function viewCounts() {
    return {
      markets: people().filter(function (person) { return person.tradable; }).length,
      radar: people().filter(function (person) { return !resolvedPerson(person); }).length,
      resolved: people().filter(resolvedPerson).length
    };
  }

  function browseHTML() {
    return '<section class="m2-browse-layer" aria-label="Browse people and markets"><div class="m2-browse-row" role="navigation" aria-label="Browse modes">' +
      BROWSE.map(function (item) { return '<button type="button" data-m2-browse="' + item[0] + '" class="' + (state.browse === item[0] ? 'is-active' : '') + '" aria-pressed="' + (state.browse === item[0]) + '">' + item[1] + '</button>'; }).join('') +
      '</div><div class="m2-category-row" role="navigation" aria-label="Categories">' +
      CATEGORIES.map(function (item) { return '<button type="button" data-m2-category-rail="' + item[0] + '" class="' + (state.categoryRail === item[0] ? 'is-active' : '') + '" aria-pressed="' + (state.categoryRail === item[0]) + '">' + item[1] + '</button>'; }).join('') + '</div></section>';
  }

  function contextStats() {
    var open = 0, closing = 0, volume = 0, hasVolume = false;
    people().forEach(function (person) {
      INSTRUMENTS.forEach(function (instrument) {
        var raw = instrumentRaw(person, instrument.id);
        if (instrumentOpen(person, instrument.id)) open += 1;
        var days = number(first(raw.daysToClose, raw.closeDays));
        if (instrumentOpen(person, instrument.id) && days !== null && days < 30) closing += 1;
        var amount = number(first(raw.simulatedVolume, raw.simVolume, raw.volume));
        if (amount !== null) { volume += amount; hasVolume = true; }
      });
    });
    var medium = people().filter(function (person) { return confidenceRank(person) >= CONFIDENCE_ORDER.medium; }).length;
    var warning = Object.keys(DATA && DATA.providerStatus || {}).map(function (id) {
      var provider = DATA.providerStatus[id] || {};
      return { id: id, state: first(provider.state, provider.status, 'unavailable') };
    }).filter(function (item) { return !/live|fresh|succeeded|operational/.test(String(item.state)); })[0];
    return {
      open: open, closing: closing, volume: hasVolume ? volume : null,
      evidence: people().length ? Math.round(medium / people().length * 100) : 0,
      warning: warning
    };
  }

  function contextHTML() {
    var stats = contextStats();
    return '<div class="m2-context-strip" role="status" aria-live="polite"><span><b>' + stats.open + '</b> open simulated markets</span><i>·</i><span><b>' + stats.closing + '</b> closing within 30 days</span><i>·</i><span><b>' + esc(formatMoney(stats.volume)) + '</b>' + (stats.volume === null ? '' : ' volume') + '</span><i>·</i><span><b>' + stats.evidence + '%</b> Medium+ evidence</span><i>·</i>' +
      (stats.warning ? '<span class="is-warning">' + esc(PLATFORM_LABELS[stats.warning.id] || stats.warning.id) + ' ' + esc(humanState(stats.warning.state).toLowerCase()) + '</span><i>·</i>' : '') +
      '<span>' + esc(state.sourceLabel) + ' · ' + esc(formatDate(DATA && DATA.generatedAt, true)) + '</span></div>';
  }

  function deskControlsHTML() {
    var counts = viewCounts();
    var quick = [['open', 'Open'], ['ending30', 'Ending <30d'], ['under100k', 'Under 100K'], ['medium', 'Medium+ evidence'], ['multi', 'Multi-source'], ['watched', 'Watched']];
    return '<section class="m2-desk-controls" aria-label="Market controls"><div class="m2-view-row"><div class="m2-view-tabs" role="tablist" aria-label="Marketplace views">' +
      VIEWS.map(function (item) { return '<button type="button" role="tab" data-m2-view="' + item[0] + '" class="' + (state.view === item[0] ? 'is-active' : '') + '" aria-selected="' + (state.view === item[0]) + '">' + item[1] + ' <span>' + counts[item[0]] + '</span></button>'; }).join('') +
      '</div><span class="m2-source-state is-' + esc(slug(state.sourceState)) + '">' + (state.loading ? 'Refreshing sources' : esc(humanState(state.sourceState))) + '</span></div>' +
      '<div class="m2-filterbar"><div class="m2-filter-scroll"><div class="m2-window-filters" aria-label="Evidence range">' +
      WINDOWS.map(function (range) { return '<button type="button" data-m2-range="' + range + '" class="' + (state.range === range ? 'is-active' : '') + '" aria-pressed="' + (state.range === range) + '">' + range.toUpperCase() + '</button>'; }).join('') +
      '</div><div class="m2-platform-filters" aria-label="Core platforms">' + CORE_PLATFORMS.map(function (id) { var active = state.platforms.indexOf(id) >= 0; return '<button type="button" data-m2-platform="' + id + '" class="' + (active ? 'is-active' : '') + '" aria-pressed="' + active + '">' + PLATFORM_LABELS[id] + '</button>'; }).join('') +
      '</div><div class="m2-quick-filters">' + quick.map(function (item) { var active = state.quick.indexOf(item[0]) >= 0; return '<button type="button" data-m2-quick="' + item[0] + '" class="' + (active ? 'is-active' : '') + '" aria-pressed="' + active + '">' + item[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="m2-filter-actions"><button class="m2-filter-button" type="button" data-m2-filters>Filters' + (state.categories.length || state.eligibility !== 'all' || state.confidence !== 'all' ? ' <b>•</b>' : '') + '</button>' +
      '<label class="m2-sort"><span>Sort</span><select data-m2-sort><option value="movement"' + (state.sort === 'movement' ? ' selected' : '') + '>Attention movement</option><option value="native"' + (state.sort === 'native' ? ' selected' : '') + '>Native rank</option><option value="watched"' + (state.sort === 'watched' ? ' selected' : '') + '>Most watched</option><option value="evidence"' + (state.sort === 'evidence' ? ' selected' : '') + '>Highest evidence</option><option value="newest"' + (state.sort === 'newest' ? ' selected' : '') + '>Newest work</option><option value="backed"' + (state.sort === 'backed' ? ' selected' : '') + '>Most backed</option><option value="risk"' + (state.sort === 'risk' ? ' selected' : '') + '>Risk watch</option></select></label>' +
      '<button class="m2-share-button" type="button" data-m2-share>Share</button></div></div></section>';
  }

  function dataBannerHTML() {
    if (state.loading && !state.loadedOnce) return '<div class="m2-state-banner" role="status"><b>Connecting the people market.</b><span>Loading public identities, work, native evidence, and market states.</span></div>';
    if (state.dataMode === 'error' || state.loadError && state.source === 'bundled') return '<div class="m2-state-banner is-warning" role="status"><b>Live refresh unavailable.</b><span>A dated retained snapshot remains visible with its original timestamps.</span><button type="button" data-m2-retry>Retry</button></div>';
    if (state.source !== 'api') return '<div class="m2-state-banner" role="status"><b>' + esc(state.sourceLabel) + '.</b><span>Source links remain original. Freshness and permission limits are shown in the evidence ledger.</span><time>' + esc(formatDate(DATA.generatedAt, true)) + '</time></div>';
    return '';
  }

  function personRowHTML(person, index, active) {
    var evidence = evidenceFor(person);
    var move = movementValue(person);
    var signal = move !== null ? ((move > 0 ? '+' : '') + formatCompact(move)) : (evidence.providerRank !== null ? '#' + evidence.providerRank : humanState(evidence.state));
    return '<article class="m2-person-row' + (active ? ' is-selected' : '') + '"><button type="button" class="m2-person-button" data-m2-select="' + esc(person.id) + '" aria-pressed="' + active + '">' + avatarHTML(person, 'row', index < 5) +
      '<span class="m2-person-copy"><span class="m2-person-name-line"><b class="m2-person-name">' + esc(person.name) + '</b><small>' + esc(person.handle) + '</small></span><span class="m2-person-field">' + esc(person.category) + '</span><span class="m2-person-why">' + esc(evidence.whyNow || evidence.label) + '</span><span class="m2-person-platforms">' + platformMarks(person, false) + '</span></span>' +
      '<span class="m2-person-signal"><b>' + esc(signal) + '</b><small>' + esc(humanState(person.dataState)) + '</small></span></button><div class="m2-person-foot">' + watchButton(person, true) + '</div></article>';
  }

  function peopleHTML(list) {
    var selected = selectedPerson();
    if (!list.length) return '<aside class="m2-people"><div class="m2-pane-head"><div><span class="m2-kicker">People tape</span><h2>No matching people</h2></div></div><div class="m2-empty"><h3>' + (state.view === 'markets' ? 'No approved markets in this source view.' : 'No one matches these filters.') + '</h3><p>Try Creator Radar, another platform, or a wider evidence range.</p><button class="m2-primary-button" type="button" data-m2-open-radar>Open Creator Radar</button></div></aside>';
    var mobile = [];
    if (selected && list.indexOf(selected) >= 0) mobile.push(selected);
    list.forEach(function (person) { if (mobile.length < 4 && mobile.indexOf(person) < 0) mobile.push(person); });
    return '<aside class="m2-people" aria-labelledby="m2PeopleTitle"><div class="m2-pane-head"><div><span class="m2-kicker">Gaining now · ' + state.range.toUpperCase() + '</span><h2 id="m2PeopleTitle">People tape</h2></div><button class="m2-text-button m2-see-all" type="button" data-m2-open-roster>See all ' + list.length + '</button></div>' +
      '<p class="m2-list-provenance">Native signals only. Unlike metrics are never added together.</p><div class="m2-person-list m2-desktop-people">' + list.map(function (person, index) { return personRowHTML(person, index, selected && selected.id === person.id); }).join('') + '</div>' +
      '<div class="m2-mobile-people">' + mobile.map(function (person, index) { return personRowHTML(person, index, selected && selected.id === person.id); }).join('') + '</div></aside>';
  }

  function workCountsHTML(work) {
    var rows = array(work.publicCounts).slice(0, 3);
    if (!rows.length) return '<span>Native counts not retained</span>';
    return rows.map(function (row) {
      var metric = normalizeMetric(row, { provider: work.platform });
      return '<span><b>' + esc(metric.value == null ? humanState(metric.availability) : formatCompact(metric.value)) + '</b> ' + esc(metric.label || metricLabel(metric.key)) + '</span>';
    }).join('');
  }

  function workHTML(person, work, label) {
    var url = safeURL(work.url || work.sourceUrl);
    var thumb = safeURL(work.thumbnail || person.avatar);
    var platform = PLATFORM_LABELS[work.platform] || work.platform || 'Original source';
    return '<article class="m2-work-card' + (label === 'Breakout work' ? ' is-breakout' : '') + '"><a class="m2-work-media" href="' + esc(url || '#') + '"' + (url ? ' target="_blank" rel="noreferrer"' : ' aria-disabled="true"') + '>' + (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />' : '') + '<span class="m2-work-fallback">' + esc(initials(person.name)) + '</span><span class="m2-work-play">Open source ↗</span></a>' +
      '<div class="m2-work-body"><div class="m2-work-meta"><span>' + esc(label) + '</span><b>' + esc(platform) + '</b></div><h4><a href="' + esc(url || '#') + '"' + (url ? ' target="_blank" rel="noreferrer"' : '') + '>' + esc(work.title) + '</a></h4><p>' + esc(work.providerLabel) + '</p><div class="m2-work-native">' + workCountsHTML(work) + '</div><div class="m2-work-source"><time>' + esc(formatDate(work.publishedAt, false)) + '</time><span>Observed ' + esc(formatDate(work.observedAt, false)) + '</span></div>' +
      '<a class="m2-work-create" data-m2-create="content" href="' + esc(builderURL('content', person, work)) + '">Create market on this work</a></div></article>';
  }

  function metricRows(person) {
    var rows = person.metrics.filter(function (metric) { return !metric.window || metric.window === state.range || metric.window === 'current' || metric.window === 'lifetime'; });
    var seen = {};
    var providerOrder = unique(state.platforms.concat(platformIds(person), CORE_PLATFORMS));
    return rows.filter(function (metric) {
      var key = [metric.provider, metric.subject, metric.key, metric.observedAt].join('|');
      if (seen[key]) return false; seen[key] = true; return true;
    }).sort(function (a, b) {
      var aObserved = a.value !== null && a.value !== undefined && a.value !== '';
      var bObserved = b.value !== null && b.value !== undefined && b.value !== '';
      if (aObserved !== bObserved) return aObserved ? -1 : 1;
      var aProvider = providerOrder.indexOf(a.provider); if (aProvider < 0) aProvider = 999;
      var bProvider = providerOrder.indexOf(b.provider); if (bProvider < 0) bProvider = 999;
      if (aProvider !== bProvider) return aProvider - bProvider;
      return [a.subject, a.label, a.key].join('|').localeCompare([b.subject, b.label, b.key].join('|'));
    }).slice(0, 14);
  }

  function metricValueHTML(metric) {
    if (metric.value === null || metric.value === undefined || metric.value === '') return '<span class="is-unavailable">' + esc(humanState(metric.availability)) + '</span>';
    return '<b>' + esc(formatCompact(metric.value)) + '</b>';
  }

  function metricDeltaHTML(metric) {
    var delta = number(metric.delta);
    if (delta === null) return '<span>Point in time</span>';
    return '<b class="' + (delta > 0 ? 'is-positive' : delta < 0 ? 'is-negative' : '') + '">' + (delta > 0 ? '+' : '') + esc(formatCompact(delta)) + (metric.deltaKind === 'percent' ? '%' : '') + '</b>';
  }

  function ledgerHTML(person) {
    var rows = metricRows(person);
    var providers = unique(rows.filter(function (row) { return row.value !== null && row.value !== undefined; }).map(function (row) { return row.provider; }));
    return '<section class="m2-ledger" aria-labelledby="m2LedgerTitle"><div class="m2-section-head"><div><span class="m2-kicker">Native evidence ledger</span><h3 id="m2LedgerTitle">What the platforms actually return</h3></div><div class="m2-confirmation"><b>' + providers.length + '</b> source' + (providers.length === 1 ? '' : 's') + ' with retained values</div></div>' +
      '<div class="m2-ledger-head"><span>Source</span><span>Native metric</span><span>Value</span><span>Movement</span><span>Access</span><span>Freshness</span></div><div class="m2-ledger-body">' +
      (rows.length ? rows.map(function (metric) {
        var label = metric.label || metricLabel(metric.key);
        return '<div class="m2-ledger-row"><span class="m2-ledger-provider"><i class="m2-platform-mark is-' + esc(metric.provider) + '">' + esc(PLATFORM_MARKS[metric.provider] || String(metric.provider || '?').slice(0, 2).toUpperCase()) + '</i><b>' + esc(PLATFORM_LABELS[metric.provider] || metric.provider || 'Source') + '</b></span><span><b>' + esc(label) + '</b>' + (metric.subject ? '<small>' + esc(metric.subject) + '</small>' : '') + '</span><span>' + metricValueHTML(metric) + '</span><span>' + metricDeltaHTML(metric) + '</span><span><b>' + esc(humanState(metric.accessClass)) + '</b><small>' + esc(humanState(metric.availability)) + '</small></span><span><time>' + esc(formatDate(metric.observedAt, false)) + '</time>' + (metric.sourceUrl ? '<a href="' + esc(metric.sourceUrl) + '" target="_blank" rel="noreferrer">Source ↗</a>' : '') + '</span></div>';
      }).join('') : '<div class="m2-ledger-empty">No native metric observation was retained for this range. Permission-required values remain unavailable rather than zero.</div>') + '</div><div class="m2-ledger-foot"><span>Metrics keep their provider-native names and units.</span><button class="m2-text-button" type="button" data-m2-open-poa>Open Proof of Attention</button></div></section>';
  }

  function proofHTML(person) {
    var evidence = evidenceFor(person);
    var poa = person.poa || {};
    return '<section class="m2-proof-callout"><div><span class="m2-kicker">Original underwriting interface</span><h3>Proof of Attention</h3><p>' + esc(text(first(poa.backerInterpretation, evidence.whyNow), 'Inspect public attention history, composition, confidence, source gaps, and methodology changes.')) + '</p></div><div class="m2-proof-facts"><span><small>Evidence</small><b>' + esc(humanState(confidenceValue(person))) + '</b></span><span><small>Coverage</small><b>' + esc(humanState(evidence.state)) + '</b></span><span><small>As of</small><b>' + esc(formatDate(evidence.asOf, false)) + '</b></span></div><button class="m2-primary-button" type="button" data-m2-open-poa>Open full Proof of Attention</button></section>';
  }

  function specValue(raw, keys, fallback) {
    for (var i = 0; i < keys.length; i += 1) {
      var value = raw[keys[i]];
      if (value !== undefined && value !== null && value !== '') return text(value);
    }
    return fallback;
  }

  function instrumentSpec(person, id) {
    var raw = instrumentRaw(person, id);
    var evidence = evidenceFor(person);
    var peer = personById(state.peerId) || people().filter(function (candidate) { return candidate.id !== person.id; })[0] || person;
    var open = instrumentOpen(person, id);
    var quoted = open && hasQuote(raw, id);
    var rows = [];
    var title = specValue(raw, ['title', 'question'], 'Proposed structure for ' + person.name);
    if (id === 'milestones') rows = [
      ['Target', specValue(raw, ['targetLabel', 'target'], 'Target not proposed')],
      ['Baseline', specValue(raw, ['baselineLabel', 'baseline'], 'Source baseline required')],
      ['Current', specValue(raw, ['currentLabel', 'current'], 'No retained contract observation')],
      ['Progress', specValue(raw, ['progressLabel', 'progress'], 'Unavailable until target approval')],
      ['Deadline', specValue(raw, ['deadline', 'closeLabel'], 'Not scheduled')],
      ['Oracle', specValue(raw, ['oracle', 'source', 'settlementSource'], 'Written source required')],
      ['Payout', specValue(raw, ['payout', 'multiple'], 'Set by approved market terms')],
      ['Void rule', specValue(raw, ['voidRule', 'void'], 'Provider failure rule required')]
    ];
    if (id === 'pk_market') rows = [
      ['Outcomes', specValue(raw, ['outcomesLabel'], person.name + ' / ' + peer.name + ' / tie if approved')],
      ['Question', specValue(raw, ['question', 'title'], 'Which outcome leads on one comparable native metric?')],
      ['Metric', specValue(raw, ['metric', 'metricLabel'], 'Comparable metric not selected')],
      ['Window', specValue(raw, ['window', 'measurementWindow'], 'Not scheduled')],
      ['Source', specValue(raw, ['source', 'oracle'], 'Same native source required')],
      ['Bid / ask', quoted ? specValue(raw, ['quoteLabel'], specValue(raw, ['bid'], '') + ' / ' + specValue(raw, ['ask'], '')) : 'No executable quote'],
      ['Tie rule', specValue(raw, ['tieRule', 'tie'], 'Explicit tie outcome required')]
    ];
    if (id === 'creator_arena') rows = [
      ['People', person.name + ' and ' + peer.name],
      ['Current signal', evidence.label || humanState(evidence.state)],
      ['Peer signal', evidenceFor(peer).label || humanState(evidenceFor(peer).state)],
      ['Latest work', person.recentWork.title || 'Source work unavailable'],
      ['Peer latest', peer.recentWork.title || 'Source work unavailable'],
      ['Evidence', humanState(confidenceValue(person)) + ' / ' + humanState(confidenceValue(peer))],
      ['Executable layer', 'Separately approved PK Market only']
    ];
    if (id === 'creator_perps') rows = [
      ['Index', specValue(raw, ['indexName'], 'Creator Attention Index approval required')],
      ['Mark', quoted ? specValue(raw, ['mark', 'markPrice'], 'Unavailable') : 'No executable mark'],
      ['Reference index', quoted ? specValue(raw, ['index', 'indexPrice'], 'Unavailable') : 'No approved reference value'],
      ['Movement', specValue(raw, ['movementLabel', 'change'], 'No approved series')],
      ['Funding', quoted ? specValue(raw, ['funding', 'fundingRate'], 'Unavailable') : 'Unavailable before launch'],
      ['Margin', specValue(raw, ['margin', 'initialMargin'], 'Risk approval required')],
      ['Open interest', quoted ? specValue(raw, ['openInterest', 'oi'], 'Unavailable') : 'No open interest'],
      ['Circuit breaker', specValue(raw, ['circuitBreaker', 'haltRule'], 'Fresh-source quorum required')]
    ];
    return { id: id, meta: instrumentMeta(id), raw: raw, open: open, quoted: quoted, title: title, rows: rows, peer: peer, blockers: blockersFor(person, id) };
  }

  function arenaPeopleHTML(person, peer) {
    return '<div class="m2-arena-pair"><div>' + avatarHTML(person, 'arena', false) + '<b>' + esc(person.name) + '</b><small>' + esc(evidenceFor(person).label) + '</small></div><span>versus</span><div>' + avatarHTML(peer, 'arena', false) + '<b>' + esc(peer.name) + '</b><small>' + esc(evidenceFor(peer).label) + '</small></div></div><label class="m2-peer-select">Compare with<select data-m2-peer>' + people().filter(function (candidate) { return candidate.id !== person.id; }).map(function (candidate) { return '<option value="' + esc(candidate.id) + '"' + (candidate.id === peer.id ? ' selected' : '') + '>' + esc(candidate.name) + '</option>'; }).join('') + '</select></label>';
  }

  function instrumentModuleHTML(person, id) {
    var spec = instrumentSpec(person, id);
    return '<article class="m2-instrument-module' + (state.instrument === id ? ' is-selected' : '') + '" data-instrument-card="' + id + '"><button type="button" class="m2-instrument-heading" data-m2-instrument="' + id + '" aria-expanded="' + (state.instrument === id) + '"><span><small>' + (spec.open ? 'Approved market' : id === 'creator_arena' ? 'Research space' : 'Proposed market') + '</small><b>' + esc(spec.meta.label) + '</b></span><span>' + (spec.quoted ? 'Quote available' : spec.open ? 'Awaiting quote' : 'View structure') + '</span></button><div class="m2-instrument-body"><p>' + esc(spec.meta.short) + '</p>' +
      (id === 'creator_arena' ? arenaPeopleHTML(person, spec.peer) : '') + '<dl>' + spec.rows.map(function (row) { return '<div><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd></div>'; }).join('') + '</dl>' +
      (spec.blockers.length && id !== 'creator_arena' ? '<div class="m2-blockers"><b>What must happen first</b><ul>' + spec.blockers.map(function (blocker) { return '<li>' + esc(blocker) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="m2-instrument-actions"><button type="button" class="m2-secondary-button" data-m2-instrument="' + id + '">' + (state.instrument === id ? 'Selected' : 'Open in ticket') + '</button>' +
      (id === 'creator_arena' ? '<button type="button" class="m2-text-button" data-m2-instrument="pk_market">See PK structure</button>' : '<a class="m2-text-button" data-m2-create="person" href="' + esc(builderURL('person', person)) + '">Propose this market</a>') + '</div></div></article>';
  }

  function instrumentBoardHTML(person) {
    return '<section class="m2-instrument-board" aria-labelledby="m2WaysTitle"><div class="m2-section-head"><div><span class="m2-kicker">Trading products, with the person still visible</span><h3 id="m2WaysTitle">Ways to back ' + esc(person.name) + '</h3></div><p>Select a structure to update the position ticket.</p></div><div class="m2-instrument-grid">' + INSTRUMENTS.map(function (item) { return instrumentModuleHTML(person, item.id); }).join('') + '</div></section>';
  }

  function dossierHTML(person) {
    if (!person) return '<main class="m2-dossier"><div class="m2-empty"><h3>No person is available under this coverage view.</h3><p>Backer has not inferred an identity, trend, or metric for the selected filters. Clear a platform or open Creator Radar to continue.</p><button class="m2-primary-button" type="button" data-m2-open-radar>Open Creator Radar</button></div></main>';
    var evidence = evidenceFor(person);
    return '<main class="m2-dossier" aria-labelledby="m2DossierTitle"><section class="m2-dossier-hero">' + avatarHTML(person, 'hero', true) + '<div class="m2-identity"><p class="m2-identity-handle">' + esc(person.handle) + ' · ' + esc(person.category) + '</p><h2 id="m2DossierTitle">' + esc(person.name) + '</h2><p class="m2-identity-description">' + esc(person.bio) + '</p><div class="m2-profile-links">' + platformMarks(person, true) + statusBadge(person) + '<span class="m2-claim-label">' + esc(humanState(person.claimStatus)) + '</span></div><div class="m2-dossier-actions">' + watchButton(person, false) + '<button class="m2-secondary-button" type="button" data-m2-open-poa>Open full Proof of Attention</button><a class="m2-primary-button" data-m2-create="person" href="' + esc(builderURL('person', person)) + '">Create person-growth market</a><a class="m2-quiet-button" data-m2-create="content" href="' + esc(builderURL('content', person, person.recentWork)) + '">Create content-growth market</a></div></div></section>' +
      '<section class="m2-why-now"><span class="m2-kicker">Why people are noticing · ' + state.range.toUpperCase() + '</span><div><p>' + esc(evidence.whyNow || person.whyNow) + '</p><div class="m2-why-meta"><span>' + esc(evidence.label) + '</span><time>As of ' + esc(formatDate(evidence.asOf || DATA.generatedAt, true)) + '</time></div></div></section>' +
      '<section class="m2-attention-metrics"><div class="m2-metric"><small>Native signal</small><strong>' + esc(evidence.providerRank !== null ? '#' + evidence.providerRank : humanState(evidence.state)) + '</strong><span>Source-specific, never a price</span></div><div class="m2-metric"><small>Evidence confidence</small><strong>' + esc(humanState(confidenceValue(person))) + '</strong><span>Not a probability</span></div><div class="m2-metric"><small>Linked sources</small><strong>' + platformIds(person).length + '</strong><span>No fake cross-platform total</span></div><div class="m2-metric"><small>Market state</small><strong>' + (person.tradable ? 'Eligible' : 'Watch only') + '</strong><span>Consent and policy gated</span></div></section>' +
      '<section class="m2-work-section"><div class="m2-section-head"><div><span class="m2-kicker">The work behind the movement</span><h3>Latest and breakout work</h3></div><p>Original links and observed timestamps.</p></div><div class="m2-work-grid">' + workHTML(person, person.recentWork, 'Latest work') + workHTML(person, person.breakoutWork, 'Breakout work') + '</div></section>' +
      ledgerHTML(person) + proofHTML(person) + instrumentBoardHTML(person) + '</main>';
  }

  function ticketHTML(person, inSheet) {
    var spec = instrumentSpec(person, state.instrument);
    var terminalId = text(first(spec.raw.marketId, spec.raw.contractId, person.id));
    var terminal = 'backermarket.html?market=' + encodeURIComponent(terminalId) + '&creator=' + encodeURIComponent(person.id) + '&instrument=' + encodeURIComponent(spec.meta.terminal) + '&source=market2';
    return '<section class="m2-ticket' + (inSheet ? ' is-sheet-ticket' : '') + '" id="' + (inSheet ? 'm2MobileTicketPanel' : 'm2Ticket') + '"><header class="m2-ticket-head"><div><span>Position ticket</span><h2' + (inSheet ? ' id="m2MobileTicketTitle"' : '') + '>' + esc(spec.meta.label) + '</h2></div>' + (inSheet ? '<button class="m2-drawer-close" type="button" data-m2-close-mobile-ticket aria-label="Close ticket">×</button>' : statusBadge(person)) + '</header><div class="m2-ticket-person">' + avatarHTML(person, 'ticket', false) + '<div><b>' + esc(person.name) + '</b><small>' + esc(person.handle) + '</small></div></div><div class="m2-instrument-tabs" role="tablist">' + INSTRUMENTS.map(function (item) { return '<button type="button" role="tab" data-m2-instrument="' + item.id + '" class="' + (state.instrument === item.id ? 'is-active' : '') + '" aria-selected="' + (state.instrument === item.id) + '">' + item.label + '</button>'; }).join('') + '</div><p class="m2-ticket-prompt">' + esc(spec.title) + '</p><p class="m2-ticket-question">' + esc(spec.meta.short) + '</p><dl class="m2-ticket-terms">' + spec.rows.slice(0, 6).map(function (row) { return '<div><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd></div>'; }).join('') + '</dl>' +
      (spec.open && spec.quoted ? '<div class="m2-field"><label for="m2Amount' + (inSheet ? 'Mobile' : '') + '">Simulated stake</label><div class="m2-amount-wrap"><span>$</span><input id="m2Amount' + (inSheet ? 'Mobile' : '') + '" type="number" min="1" value="25" inputmode="decimal" /></div></div><div class="m2-ticket-actions"><a class="m2-primary-button" href="' + esc(terminal) + '">Open full terminal ↗</a></div>' : '<div class="m2-ticket-gate"><b>' + (spec.open ? 'Approved market, awaiting an executable quote' : 'Research and proposal only') + '</b><p>No price or probability is invented before an approved market and real simulated quote exist.</p>' + (spec.blockers.length ? '<ul>' + spec.blockers.map(function (blocker) { return '<li>' + esc(blocker) + '</li>'; }).join('') + '</ul>' : '') + '</div><div class="m2-ticket-actions">' + watchButton(person, false) + '<a class="m2-primary-button" data-m2-create="person" href="' + esc(builderURL('person', person)) + '">Create proposal</a></div>') + '<p class="m2-ticket-disclosure">Attention evidence is context, not price, consent, or settlement authority.</p></section>';
  }

  function railList(list) {
    return list.slice(0, 3).map(function (person, index) {
      var evidence = evidenceFor(person);
      return '<button class="m2-rail-row" type="button" data-m2-select="' + esc(person.id) + '"><span>0' + (index + 1) + '</span><span><b>' + esc(person.name) + '</b><small>' + esc(evidence.whyNow || evidence.label) + '</small></span><span><b>' + esc(evidence.providerRank !== null ? '#' + evidence.providerRank : humanState(confidenceValue(person))) + '</b><small>' + (evidence.providerRank !== null ? 'native' : 'evidence') + '</small></span></button>';
    }).join('');
  }

  function rightRailHTML(person, list) {
    var watched = people().filter(function (candidate) { return isWatched(candidate.id); });
    var risks = Object.keys(DATA.providerStatus || {}).map(function (id) { return { id: id, data: DATA.providerStatus[id] || {} }; }).filter(function (item) { return !/live|fresh|succeeded|operational/.test(String(first(item.data.state, item.data.status, ''))); });
    return '<aside class="m2-right" aria-label="Position and market intelligence">' + ticketHTML(person, false) + '<div class="m2-intelligence"><section class="m2-rail-card"><header><h3>Your market</h3></header><p><b>' + watched.length + '</b> watched people. Relationship can come before risk.</p><a href="portfolio.html">View portfolio →</a></section><section class="m2-rail-card"><header><h3>Trending</h3><span>' + state.range.toUpperCase() + '</span></header><div>' + railList(list) + '</div><button type="button" data-m2-scroll-people>View all people →</button></section><section class="m2-rail-card"><header><h3>Top movers</h3><span>Native only</span></header><div>' + railList(list.slice().sort(function (a, b) { return (movementValue(b) || -Infinity) - (movementValue(a) || -Infinity); })) + '</div></section><section class="m2-rail-card is-risk"><header><h3>Risk watch</h3></header>' + (risks.length ? '<ul>' + risks.slice(0, 4).map(function (risk) { return '<li><b>' + esc(PLATFORM_LABELS[risk.id] || risk.id) + '</b><span>' + esc(humanState(first(risk.data.state, risk.data.status))) + '</span></li>'; }).join('') + '</ul>' : '<p>All requested provider states are usable.</p>') + '<button type="button" data-m2-open-poa>Open evidence context →</button></section></div></aside>';
  }

  function emptyRightHTML() {
    return '<aside class="m2-right" aria-label="Coverage state"><section class="m2-rail-card is-risk"><header><h3>Coverage state</h3><span>Honest empty</span></header><p>No retained person matches this source and filter combination. Profile-only connectors do not create synthetic people or attention evidence.</p><button type="button" data-m2-open-radar>Clear filters and open Creator Radar</button></section></aside>';
  }

  function drawerHTML() {
    if (!state.drawer) return '';
    var platforms = unique(CORE_PLATFORMS.concat(PROFILE_ONLY_PLATFORMS, people().reduce(function (all, person) { return all.concat(platformIds(person)); }, [])));
    var categories = unique(people().map(function (person) { return person.category; })).sort();
    return '<div class="m2-drawer-backdrop" data-m2-drawer-backdrop><section class="m2-filter-drawer" role="dialog" aria-modal="true" aria-labelledby="m2DrawerTitle"><header class="m2-drawer-head"><div><span class="m2-kicker">Refine the people view</span><h2 id="m2DrawerTitle">Full filters</h2></div><button class="m2-drawer-close" type="button" data-m2-close-drawer aria-label="Close filters">×</button></header><div class="m2-drawer-body"><fieldset class="m2-filter-group"><legend>Platform</legend><p class="m2-filter-note">Connected evidence sources appear first. Planned connectors filter only retained profiles and never fabricate coverage.</p>' + platforms.map(function (id) { return '<label><input type="checkbox" data-m2-drawer-platform="' + id + '"' + (state.platforms.indexOf(id) >= 0 ? ' checked' : '') + ' /><span><b>' + esc(PLATFORM_LABELS[id] || id) + '</b>' + (CORE_PLATFORMS.indexOf(id) < 0 ? '<small>Profile only / connector planned</small>' : '<small>Connected evidence filter</small>') + '</span></label>'; }).join('') + '</fieldset><fieldset class="m2-filter-group"><legend>Creator category</legend>' + categories.map(function (category) { return '<label><input type="checkbox" data-m2-category="' + esc(category) + '"' + (state.categories.indexOf(category) >= 0 ? ' checked' : '') + ' /><span>' + esc(category) + '</span></label>'; }).join('') + '</fieldset><fieldset class="m2-filter-group"><legend>Trading state</legend><label><input type="radio" name="m2Eligibility" value="all" data-m2-eligibility' + (state.eligibility === 'all' ? ' checked' : '') + ' /><span>All people</span></label><label><input type="radio" name="m2Eligibility" value="eligible" data-m2-eligibility' + (state.eligibility === 'eligible' ? ' checked' : '') + ' /><span>Trade eligible</span></label><label><input type="radio" name="m2Eligibility" value="discovery_only" data-m2-eligibility' + (state.eligibility === 'discovery_only' ? ' checked' : '') + ' /><span>Discovery only</span></label></fieldset><fieldset class="m2-filter-group"><legend>Evidence confidence</legend>' + ['all', 'high', 'medium', 'low', 'insufficient'].map(function (value) { return '<label><input type="radio" name="m2Confidence" value="' + value + '" data-m2-confidence' + (state.confidence === value ? ' checked' : '') + ' /><span>' + esc(value === 'all' ? 'All grades' : humanState(value)) + '</span></label>'; }).join('') + '</fieldset></div><footer class="m2-drawer-footer"><button class="m2-clear-button" type="button" data-m2-clear-drawer>Clear all</button><button class="m2-primary-button" type="button" data-m2-apply-drawer>Show people</button></footer></section></div>';
  }

  function rosterSheetHTML(list) {
    if (!state.mobileRoster) return '';
    return '<div class="m2-mobile-sheet-backdrop" data-m2-roster-backdrop><section class="m2-mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="m2RosterTitle"><header><div><span class="m2-kicker">Full people tape</span><h2 id="m2RosterTitle">People gaining now</h2></div><button class="m2-drawer-close" type="button" data-m2-close-roster aria-label="Close people list">×</button></header><div class="m2-mobile-roster">' + list.map(function (person, index) { return personRowHTML(person, index, person.id === state.selectedId); }).join('') + '</div></section></div>';
  }

  function mobileTicketHTML(person) {
    var spec = instrumentSpec(person, state.instrument);
    return '<div class="m2-mobile-dock">' + avatarHTML(person, 'mobile', false) + '<span><b>' + esc(person.name) + '</b><small>' + esc(spec.meta.label + ' · ' + (spec.quoted ? 'Quote available' : spec.open ? 'Awaiting quote' : 'Watch only')) + '</small></span><button class="m2-primary-button" type="button" data-m2-open-mobile-ticket>' + (spec.open && spec.quoted ? 'Trade' : 'View') + '</button></div>' +
      (state.mobileTicket ? '<div class="m2-mobile-sheet-backdrop" data-m2-ticket-backdrop><section class="m2-mobile-sheet m2-ticket-sheet" role="dialog" aria-modal="true" aria-labelledby="m2MobileTicketTitle">' + ticketHTML(person, true) + '</section></div>' : '');
  }

  function methodologyHTML() {
    return '<footer class="m2-method"><div><span class="m2-kicker">The Backer boundary</span><h2>Person, work, evidence, market, position.</h2><p>Discovery does not create consent. Native evidence does not become a fake score. Proof of Attention does not settle a market.</p></div><dl><div><dt>People</dt><dd>Real public identity and original work</dd></div><div><dt>Evidence</dt><dd>Native names, timestamps, access, and source</dd></div><div><dt>Markets</dt><dd>Consent, policy, oracle, and risk approval</dd></div></dl></footer>';
  }

  function loadingHTML() {
    return '<div class="m2-workspace is-loading" aria-busy="true"><aside class="m2-people">' + new Array(4).fill('<span class="m2-skeleton is-row"></span>').join('') + '</aside><main class="m2-dossier"><span class="m2-skeleton is-hero"></span><span class="m2-skeleton is-copy"></span><span class="m2-skeleton is-work"></span></main><aside class="m2-right"><span class="m2-skeleton is-ticket"></span></aside></div>';
  }

  function ensureSelection(list) {
    if (!list.length) return;
    if (!list.some(function (person) { return person.id === state.selectedId; })) state.selectedId = list[0].id;
    if (!state.peerId || state.peerId === state.selectedId || !personById(state.peerId)) {
      var peer = people().filter(function (person) { return person.id !== state.selectedId; })[0];
      state.peerId = peer ? peer.id : '';
    }
  }

  function bindImageFallbacks() {
    root.querySelectorAll('.m2-avatar img, .m2-work-media img').forEach(function (image) {
      function fail() { if (image.parentElement) image.parentElement.classList.add('is-image-fallback'); }
      image.addEventListener('error', fail, { once: true });
      if (image.complete && !image.naturalWidth) fail();
    });
  }

  function draw(focusSearch) {
    if (!root || !DATA) return;
    var list = filteredPeople();
    ensureSelection(list);
    var person = list.length ? (list.filter(function (candidate) { return candidate.id === state.selectedId; })[0] || list[0]) : null;
    document.body.classList.toggle('mkt2-drawer-open', state.drawer || state.mobileRoster || state.mobileTicket);
    var workspace = state.loading && !state.loadedOnce && state.dataMode === 'loading' ? loadingHTML() : '<div class="m2-workspace">' + peopleHTML(list) + dossierHTML(person) + (person ? rightRailHTML(person, list) : emptyRightHTML()) + '</div>';
    root.innerHTML = '<div class="market2-shell">' + commandHTML() + '<div class="m2-underlayer">' + browseHTML() + contextHTML() + deskControlsHTML() + '</div>' + dataBannerHTML() + workspace + methodologyHTML() + drawerHTML() + rosterSheetHTML(list.length ? list : people()) + (person ? mobileTicketHTML(person) : '') + '</div>';
    root.classList.remove('hidden'); root.setAttribute('aria-hidden', 'false');
    bindImageFallbacks(); syncHash();
    if (focusSearch) {
      var search = document.getElementById('m2Search');
      if (search) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
    }
    var dialogFocus = root.querySelector('.m2-filter-drawer .m2-drawer-close, .m2-mobile-sheet .m2-drawer-close');
    if ((state.drawer || state.mobileRoster || state.mobileTicket) && dialogFocus) dialogFocus.focus();
  }

  function openPoa(person) {
    if (!person || !window.PoaTerminal || typeof window.PoaTerminal.open !== 'function') { toast('Proof of Attention is unavailable'); return; }
    var creator = {
      id: person.id, name: person.name, handle: person.handle,
      platforms: person.accounts.map(function (account) { return { id: account.id, handle: account.handle, url: account.url }; }),
      poa: person.poa || {}, evidence: { value: confidenceRank(person) * 20 }
    };
    window.PoaTerminal.open({ seed: 'market2_' + person.id, creator: creator, name: person.name, handle: person.handle, surface: 'poa' });
    track('market_poa_opened', { creator_id: person.id, source: 'market2' });
  }

  function toggleInArray(values, value) {
    var index = values.indexOf(value);
    if (index >= 0) values.splice(index, 1); else values.push(value);
  }

  function closeOverlays() {
    state.drawer = false; state.mobileRoster = false; state.mobileTicket = false; draw(false);
  }

  function clickHandler(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var el;
    if ((el = target.closest('[data-m2-create]'))) {
      track(el.getAttribute('data-m2-create') === 'content' ? 'market_create_content_opened' : 'market_create_person_opened', { creator_id: state.selectedId, source: 'market2' });
      return;
    }
    if ((el = target.closest('[data-m2-select]'))) {
      state.selectedId = el.getAttribute('data-m2-select'); state.mobileRoster = false; draw(false);
      track('market_creator_selected', { creator_id: state.selectedId, source: 'market2' }); return;
    }
    if ((el = target.closest('[data-m2-view]'))) { state.view = el.getAttribute('data-m2-view'); draw(false); scheduleDataLoad(); track('market_view_changed', { view: state.view }); return; }
    if ((el = target.closest('[data-m2-browse]'))) { state.browse = el.getAttribute('data-m2-browse'); draw(false); track('market_browse_changed', { browse: state.browse }); return; }
    if ((el = target.closest('[data-m2-category-rail]'))) { state.categoryRail = el.getAttribute('data-m2-category-rail'); draw(false); track('market_category_changed', { category: state.categoryRail }); return; }
    if ((el = target.closest('[data-m2-range]'))) { state.range = el.getAttribute('data-m2-range'); draw(false); scheduleDataLoad(); track('market_filter_changed', { filter: 'range', value: state.range }); return; }
    if ((el = target.closest('[data-m2-platform]'))) { toggleInArray(state.platforms, el.getAttribute('data-m2-platform')); draw(false); scheduleDataLoad(); track('market_filter_changed', { filter: 'platform', value: state.platforms.join(',') }); return; }
    if ((el = target.closest('[data-m2-quick]'))) { toggleInArray(state.quick, el.getAttribute('data-m2-quick')); draw(false); track('market_filter_changed', { filter: 'quick', value: state.quick.join(',') }); return; }
    if ((el = target.closest('[data-m2-watch]'))) { var id = el.getAttribute('data-m2-watch'); toggleWatch(id); draw(false); toast(isWatched(id) ? 'Added to Your People' : 'Removed from Your People'); track('market_watch_changed', { creator_id: id, watched: isWatched(id) }); return; }
    if ((el = target.closest('[data-m2-instrument]'))) { state.instrument = el.getAttribute('data-m2-instrument'); draw(false); track('market_instrument_changed', { instrument: state.instrument, creator_id: state.selectedId }); return; }
    if (target.closest('[data-m2-open-poa]')) { openPoa(selectedPerson()); return; }
    if (target.closest('[data-m2-filters]')) { state.drawer = true; draw(false); return; }
    if (target.closest('[data-m2-open-roster]')) { state.mobileRoster = true; draw(false); return; }
    if (target.closest('[data-m2-open-mobile-ticket]')) { state.mobileTicket = true; draw(false); return; }
    if (target.closest('[data-m2-close-drawer]') || target.matches('[data-m2-drawer-backdrop]') || target.closest('[data-m2-close-roster]') || target.matches('[data-m2-roster-backdrop]') || target.closest('[data-m2-close-mobile-ticket]') || target.matches('[data-m2-ticket-backdrop]')) { closeOverlays(); return; }
    if (target.closest('[data-m2-apply-drawer]')) { state.drawer = false; draw(false); scheduleDataLoad(); return; }
    if (target.closest('[data-m2-clear-drawer]')) { state.platforms = []; state.categories = []; state.eligibility = 'all'; state.confidence = 'all'; draw(false); return; }
    if (target.closest('[data-m2-open-radar]')) { state.view = 'radar'; state.quick = []; state.platforms = []; state.categoryRail = 'all'; draw(false); scheduleDataLoad(); return; }
    if (target.closest('[data-m2-share]')) { var url = stateURL(); if (navigator.share) navigator.share({ title: 'Backer people market', url: url }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Marketplace link copied'); }); return; }
    if (target.closest('[data-m2-show-watched]')) { state.quick = ['watched']; state.view = 'radar'; draw(false); return; }
    if (target.closest('[data-m2-scroll-people]')) { var tape = root.querySelector('.m2-people'); if (tape) tape.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
    if (target.closest('[data-m2-retry]')) { state.dataMode = ''; scheduleDataLoad(); }
  }

  function inputHandler(event) {
    if (event.target.id !== 'm2Search') return;
    window.clearTimeout(searchTimer); state.query = event.target.value;
    searchTimer = window.setTimeout(function () { draw(true); }, 120);
  }

  function changeHandler(event) {
    var target = event.target;
    if (target.matches('[data-m2-sort]')) { state.sort = target.value; draw(false); scheduleDataLoad(); track('market_sort_changed', { sort: state.sort }); return; }
    if (target.matches('[data-m2-peer]')) { state.peerId = target.value; draw(false); return; }
    if (target.matches('[data-m2-drawer-platform]')) { toggleInArray(state.platforms, target.getAttribute('data-m2-drawer-platform')); return; }
    if (target.matches('[data-m2-category]')) { toggleInArray(state.categories, target.getAttribute('data-m2-category')); return; }
    if (target.matches('[data-m2-eligibility]')) { state.eligibility = target.value; return; }
    if (target.matches('[data-m2-confidence]')) state.confidence = target.value;
  }

  function trapFocus(event) {
    var dialog = root && root.querySelector('.m2-filter-drawer, .m2-mobile-sheet');
    if (!dialog || event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (node) { return node.offsetParent !== null; });
    if (!focusable.length) return;
    var firstNode = focusable[0], lastNode = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === firstNode) { event.preventDefault(); lastNode.focus(); }
    else if (!event.shiftKey && document.activeElement === lastNode) { event.preventDefault(); firstNode.focus(); }
  }

  function keyHandler(event) {
    if (event.key === '/' && !/input|textarea|select/i.test((event.target || {}).tagName || '')) { var search = document.getElementById('m2Search'); if (search) { event.preventDefault(); search.focus(); } }
    if (event.key === 'Escape' && (state.drawer || state.mobileRoster || state.mobileTicket)) { event.preventDefault(); closeOverlays(); }
    trapFocus(event);
  }

  function render(app) {
    root = app;
    document.title = 'People worth noticing | Backer Market';
    if (!booted) {
      loadWatched(); parseHash();
      DATA = validPayload(BUNDLED) ? normalizeDataset(BUNDLED, 'bundled') : normalizeDataset({ people: [], status: 'unavailable', generatedAt: new Date().toISOString() }, 'empty');
      state.source = validPayload(BUNDLED) ? 'bundled' : 'none';
      state.sourceLabel = validPayload(BUNDLED) ? 'Emergency bundled snapshot' : 'No retained data';
      state.sourceState = DATA.status || 'stale_snapshot';
      if (!state.selectedId && people()[0]) state.selectedId = people()[0].id;
      booted = true;
    } else parseHash();
    if (!app.dataset.market2Bound) {
      app.addEventListener('click', clickHandler); app.addEventListener('input', inputHandler); app.addEventListener('change', changeHandler);
      document.addEventListener('keydown', keyHandler); app.dataset.market2Bound = 'true';
    }
    draw(false);
    if (!state.loadedOnce) loadData();
    track('market_home_viewed', { source: 'market2' });
  }

  window.BackerMarket2 = { render: render, stateURL: stateURL, normalize: normalizeDataset };
})();
