/* Backer Trades
   A people-first simulation exchange backed by the same retained catalog as
   Discovery. Every visible subject and evidence value is retained source data.
   Market prices and activity live in an explicitly separate simulation model. */
(function (root) {
  'use strict';

  var B = root.BACKER || {};
  var VIEW_VALUES = ['feed', 'profiles', 'contents', 'positions', 'proposals'];
  var WATCH_KEY = 'backer_market2_watch_v1';
  var WORK_WATCH_KEY = 'backer_trades_work_watch_v1';
  var DISCOVERY_INTEREST_KEY = 'backer_discovery_interest_v1';
  var PERSONALIZATION_RESET_KEY = 'backer_trades_personalization_reset_v1';
  var POSITION_KEY = 'backer_trades_positions_v1';
  var ACCOUNT_KEY = 'backer_trades_account_v1';
  var POSITION_SCHEMA = 'backer-trades-position-v1';
  var ACCOUNT_SCHEMA = 'backer-trades-account-v1';
  var STARTING_CASH = 10000;
  var MODEL_SRC = 'js/trades-catalog-model.js?v=20260821-account-metrics-1';
  var PAGE_SIZE = 15;
  var mountedRoot = null;
  var modelPromise = null;
  var refreshTimer = null;
  var ticketReturnFocus = null;
  var firstCardPaintScheduled = false;
  var state = {
    view: 'feed', query: '', provider: 'all', metric: 'all', sort: 'personalized', page: 1,
    proposalId: '', pendingDeleteId: '', loading: true, loadError: '', catalog: null,
    ticket: null, receipt: null, routeSubjectId: '', routeSide: '', routeHandled: '', routeMissing: false
  };

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function number(value) {
    var parsed = Number(value);
    return value === '' || value == null || !isFinite(parsed) ? null : parsed;
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function display(value) { return clean(value).replace(/[\u2013\u2014]/g, ' - '); }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, root.location && root.location.href ? root.location.href : 'https://backer.invalid/');
      return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
    } catch (error) { return ''; }
  }
  function usableMedia(value) {
    var url = safeURL(value);
    return /(?:backer-mark|backer-logo|data:image\/svg)/i.test(url) ? '' : url;
  }
  function initials(value) {
    return display(value).split(/\s+/).filter(Boolean).slice(0, 2).map(function (word) { return word.charAt(0); }).join('').toUpperCase() || 'B';
  }
  function shortId(value) {
    var id = clean(value);
    return id.length > 26 ? id.slice(0, 13) + '\u2026' + id.slice(-8) : id;
  }
  function platformLabel(value) {
    var id = clean(value).toLowerCase();
    var known = { x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub', dev: 'DEV', twitch: 'Twitch', linkedin: 'LinkedIn', medium: 'Medium', substack: 'Substack', rss: 'RSS', tiktok: 'TikTok', spotify: 'Spotify', soundcloud: 'SoundCloud', patreon: 'Patreon', kick: 'Kick', bilibili: 'Bilibili', facebook: 'Facebook' };
    return known[id] || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) || 'Public source';
  }
  function formatCount(value) {
    var parsed = number(value);
    if (parsed == null) return display(value);
    if (typeof B.fmt === 'function') return B.fmt(parsed);
    return new Intl.NumberFormat('en-US', { notation: Math.abs(parsed) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(parsed);
  }
  function formatExactCount(value) {
    var parsed = number(value);
    return parsed == null ? display(value) : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(parsed);
  }
  function formatMoney(value) {
    var parsed = number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(parsed);
  }
  function formatPaperVolume(value) {
    var parsed = number(value) || 0;
    return '$' + new Intl.NumberFormat('en-US', { notation: parsed >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(parsed);
  }
  function formatDate(value, includeYear) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: includeYear === false ? undefined : 'numeric', timeZone: 'UTC' }).format(date);
  }
  function formatNumber(value) {
    var parsed = number(value);
    return parsed == null ? 'Not set' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parsed);
  }
  function analytics(event, props) {
    try { if (root.BackerAnalytics) root.BackerAnalytics.track(event, props || {}); } catch (error) {}
  }
  function performanceNow() {
    return root.performance && typeof root.performance.now === 'function' ? root.performance.now() : Date.now();
  }
  function performanceMark(name) {
    if (!root.performance || typeof root.performance.mark !== 'function') return;
    try { root.performance.mark(name); } catch (_error) {}
  }
  function performanceMeasure(name, start, end) {
    if (!root.performance || typeof root.performance.measure !== 'function') return;
    try { root.performance.measure(name, start, end); } catch (_error) {}
  }
  function performanceState() {
    if (!root.__backerTradesPerformance || typeof root.__backerTradesPerformance !== 'object') {
      root.__backerTradesPerformance = {};
    }
    return root.__backerTradesPerformance;
  }
  function toast(message, kind) {
    if (root.__backerToast) { root.__backerToast(message, kind); return; }
    var target = document.getElementById('toast');
    if (!target) return;
    target.textContent = message;
    target.classList.add('show');
    root.setTimeout(function () { target.classList.remove('show'); }, 2400);
  }
  function readArray(key) {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) { return []; }
  }
  function writeArray(key, value) {
    try { root.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }
  function readWatchSet() {
    return new Set(readArray(WATCH_KEY).map(function (row) {
      return clean(row && typeof row === 'object' ? (row.personId || row.creatorId || row.id) : row);
    }).filter(Boolean));
  }
  function readWorkWatchSet() {
    return new Set(readArray(WORK_WATCH_KEY).map(function (row) {
      return clean(row && typeof row === 'object' ? (row.contentId || row.workId || row.id) : row);
    }).filter(Boolean));
  }
  function listPositions() {
    return readArray(POSITION_KEY).filter(function (row) {
      return row && row.schemaVersion === POSITION_SCHEMA && clean(row.id) && clean(row.subjectId)
        && (row.side === 'BACK' || row.side === 'FADE') && number(row.cost) != null;
    });
  }
  function readAccount() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(ACCOUNT_KEY) || 'null');
      if (parsed && parsed.schemaVersion === ACCOUNT_SCHEMA && number(parsed.cash) != null && parsed.cash >= 0) return parsed;
    } catch (error) {}
    return { schemaVersion: ACCOUNT_SCHEMA, startingCash: STARTING_CASH, cash: STARTING_CASH, updatedAt: '' };
  }

  function proposalRows() {
    var store = root.BackerMarketDraftStore;
    if (!store || typeof store.list !== 'function') return [];
    try {
      return array(store.list()).map(function (row) {
        var draft = row && row.draft ? row.draft : row;
        return draft && draft.draftId ? { draft: draft, storage: row.storage || '', durable: row.durable !== false } : null;
      }).filter(Boolean);
    } catch (error) { return []; }
  }
  function proposalById(id) {
    return proposalRows().filter(function (row) { return clean(row.draft.draftId) === clean(id); })[0] || null;
  }
  function personalizationResetAt() {
    try {
      var raw = clean(root.localStorage.getItem(PERSONALIZATION_RESET_KEY));
      var parsed = Date.parse(raw);
      return isFinite(parsed) ? parsed : 0;
    } catch (error) { return 0; }
  }
  function signalIsNewer(row, resetAt) {
    if (!resetAt) return true;
    var timestamp = Date.parse(clean(row && (row.updatedAt || row.createdAt || row.savedAt || row.at)));
    return isFinite(timestamp) && timestamp > resetAt;
  }
  function deviceSignals() {
    var proposedPersonIds = [], proposedContentIds = [], resetAt = personalizationResetAt();
    proposalRows().filter(function (row) { return signalIsNewer(row && row.draft, resetAt); }).forEach(function (row) {
      var subject = row.draft.subject || {};
      if (subject.person && subject.person.id) proposedPersonIds.push(subject.person.id);
      if (subject.content && subject.content.id) proposedContentIds.push(subject.content.id);
    });
    return {
      watchedPersonIds: Array.from(readWatchSet()),
      watchedContentIds: Array.from(readWorkWatchSet()),
      proposedPersonIds: proposedPersonIds,
      proposedContentIds: proposedContentIds,
      positionSubjectIds: listPositions().filter(function (position) { return signalIsNewer(position, resetAt); }).map(function (position) { return position.subjectId; }),
      recentActions: readArray(DISCOVERY_INTEREST_KEY).filter(function (row) { return row && typeof row === 'object' && signalIsNewer(row, resetAt); }).slice(0, 40),
      resetAt: resetAt
    };
  }
  function personalizationSummary() {
    var signals = deviceSignals();
    function reason(count, singular) {
      return count ? count + ' ' + singular + (count === 1 ? '' : 's') : '';
    }
    var reasons = [
      reason(signals.watchedPersonIds.length, 'watched profile'),
      reason(signals.watchedContentIds.length, 'watched work'),
      reason(signals.proposedPersonIds.length + signals.proposedContentIds.length, 'saved proposal'),
      reason(signals.positionSubjectIds.length, 'simulated trade'),
      reason(signals.recentActions.length, 'recent Discovery action')
    ].filter(Boolean);
    if (reasons.length) return 'Ranked by ' + reasons.join(', ') + '. Preferences stay on this device.';
    return signals.resetAt ? 'Default order restored. All saved data remains.' : 'Watch or trade to rank this local feed.';
  }

  function readURL() {
    var hash = clean(root.location && root.location.hash);
    var queryIndex = hash.indexOf('?');
    var params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
    var next = clean(params.get('view'));
    if (next === 'open' || next === 'resolved') next = 'feed';
    state.view = VIEW_VALUES.indexOf(next) >= 0 ? next : 'feed';
    state.proposalId = clean(params.get('proposal'));
    state.routeSubjectId = clean(params.get('subject'));
    state.query = clean(params.get('q'));
    state.provider = clean(params.get('provider')).toLowerCase() || 'all';
    state.metric = clean(params.get('metric')).toLowerCase() || 'all';
    state.sort = ['personalized', 'evidence', 'price', 'movement', 'volume', 'name'].indexOf(clean(params.get('order')).toLowerCase()) >= 0
      ? clean(params.get('order')).toLowerCase() : 'personalized';
    state.page = Math.max(1, Math.floor(number(params.get('page')) || 1));
    state.routeSide = clean(params.get('side')).toUpperCase();
    if (state.routeSide !== 'BACK' && state.routeSide !== 'FADE') state.routeSide = '';
    if (state.routeSubjectId && state.view !== 'profiles' && state.view !== 'contents') state.routeSubjectId = '';
    if (state.proposalId) state.view = 'proposals';
  }
  function writeURL() {
    var params = new URLSearchParams();
    if (state.view !== 'feed') params.set('view', state.view);
    if (state.view === 'proposals' && state.proposalId) params.set('proposal', state.proposalId);
    if ((state.view === 'profiles' || state.view === 'contents') && state.routeSubjectId) {
      params.set('subject', state.routeSubjectId);
      if (state.routeSide) params.set('side', state.routeSide.toLowerCase());
    }
    if (state.view === 'profiles' || state.view === 'contents') {
      if (state.query) params.set('q', state.query);
      if (state.provider !== 'all') params.set('provider', state.provider);
      if (state.metric !== 'all') params.set('metric', state.metric);
      if (state.sort !== 'personalized') params.set('order', state.sort);
      if (state.page > 1) params.set('page', String(state.page));
    }
    try { root.history.replaceState(null, '', root.location.pathname + root.location.search + '#trades' + (params.toString() ? '?' + params.toString() : '')); } catch (error) {}
  }

  function loadScript(src) {
    if (!document || !document.head) return Promise.reject(new Error('Catalog module could not be initialized'));
    var existing = document.querySelector('script[data-backer-trades-catalog]');
    if (existing) return new Promise(function (resolve, reject) {
      if (root.BackerTradeCatalog) { resolve(); return; }
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.dataset.backerTradesCatalog = 'true';
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Trades could not read the retained catalog module')); };
      document.head.appendChild(script);
    });
  }
  function catalogAPI() {
    if (root.BackerTradeCatalog && typeof root.BackerTradeCatalog.load === 'function') return Promise.resolve(root.BackerTradeCatalog);
    return loadScript(MODEL_SRC).then(function () {
      if (!root.BackerTradeCatalog || typeof root.BackerTradeCatalog.load !== 'function') throw new Error('Trades catalog model did not initialize');
      return root.BackerTradeCatalog;
    });
  }
  function ensureCatalog(force) {
    if (state.catalog && !force) return Promise.resolve(state.catalog);
    if (modelPromise && !force) return modelPromise;
    state.loading = true;
    state.loadError = '';
    var timing = performanceState();
    timing.catalogLoadStartedAt = performanceNow();
    performanceMark('backer-trades:catalog-load-start');
    renderContent();
    modelPromise = catalogAPI().then(function (api) { return api.load({ signals: deviceSignals() }); }).then(function (catalog) {
      if (!catalog || !array(catalog.people).length) throw new Error('The retained catalog did not return eligible creator accounts');
      state.catalog = normalizeCatalog(catalog);
      timing.catalogLoadedAt = performanceNow();
      performanceMark('backer-trades:catalog-load-end');
      performanceMeasure('backer-trades:catalog-load', 'backer-trades:catalog-load-start', 'backer-trades:catalog-load-end');
      state.loading = false;
      prepareSubjectRoute();
      scheduleModelRefresh(state.catalog);
      renderContent();
      return state.catalog;
    }).catch(function (error) {
      state.loading = false;
      state.loadError = clean(error && error.message) || 'Trades could not read the retained catalog';
      renderContent();
      throw error;
    }).finally(function () { modelPromise = null; });
    return modelPromise;
  }
  function scheduleModelRefresh(catalog) {
    if (refreshTimer) root.clearTimeout(refreshTimer);
    var endsAt = catalog && catalog.simulationBucket && catalog.simulationBucket.endsAt;
    var boundary = Date.parse(endsAt || '');
    if (!isFinite(boundary) || boundary <= Date.now()) {
      var now = new Date();
      boundary = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0, 0);
    }
    refreshTimer = root.setTimeout(function () {
      ensureCatalog(true).catch(function () {});
    }, Math.max(1000, boundary - Date.now() + 100));
  }
  function normalizeCatalog(catalog) {
    var people = array(catalog.people).filter(function (person) { return person && clean(person.id || person.personId) && clean(person.name || person.displayName); });
    var byId = Object.create(null);
    people.forEach(function (person) { byId[clean(person.id || person.personId)] = person; });
    var contents = array(catalog.contents).filter(function (work) { return work && clean(work.id || work.contentId) && clean(work.title) && safeURL(work.url || work.sourceUrl); }).map(function (work) {
      if (!work.person) work.person = byId[clean(work.personId || work.creatorId)] || null;
      return work;
    });
    return {
      generatedAt: clean(catalog.generatedAt), people: people, contents: contents, feed: array(catalog.feed),
      counts: { people: people.length, contents: contents.length },
      simulationDisclosure: clean(catalog.simulationDisclosure),
      simulationBucket: catalog.simulationBucket && typeof catalog.simulationBucket === 'object' ? Object.assign({}, catalog.simulationBucket) : null
    };
  }

  function tradesURL(kind, id, side) {
    var params = new URLSearchParams();
    params.set('view', kind === 'content' ? 'contents' : 'profiles');
    params.set('subject', clean(id));
    var normalizedSide = clean(side).toLowerCase();
    if (normalizedSide === 'back' || normalizedSide === 'fade') params.set('side', normalizedSide);
    return 'backerdemo.html#trades?' + params.toString();
  }
  function prepareSubjectRoute() {
    state.routeMissing = false;
    if (!state.routeSubjectId || !state.catalog) return;
    var kind = state.view === 'contents' ? 'content' : 'profile';
    var rows = kind === 'content' ? state.catalog.contents : state.catalog.people;
    var index = rows.findIndex(function (row) { return subjectId(kind, row) === state.routeSubjectId; });
    if (index < 0) { state.routeMissing = true; return; }
    /* Route subjects are pinned into the first bounded page. Never expand the
       mounted card count to the subject's original position in a 1K+ list. */
    state.page = 1;
    var handle = [kind, state.routeSubjectId, state.routeSide].join(':');
    if (state.routeSide && state.routeHandled !== handle) {
      var row = rows[index], sim = subjectSimulation(row), contract = validContract(row);
      if (sim && contract && clean(sim.contractId) === clean(contract.id)) {
        state.ticket = { kind: kind, id: state.routeSubjectId, side: state.routeSide, amount: 25, ack: false };
        state.routeHandled = handle;
        rememberInterest(kind, row, 'trade_deep_link');
      }
    }
  }

  function personId(person) { return clean(person && (person.id || person.personId)); }
  function personName(person) { return display(person && (person.name || person.displayName)) || 'Public creator'; }
  function primaryAccount(person) {
    return array(person && (person.accounts || person.platforms)).filter(function (account) { return safeURL(account && (account.url || account.sourceUrl || account.profileUrl)); })[0] || array(person && (person.accounts || person.platforms))[0] || {};
  }
  function profileURL(person) {
    var account = primaryAccount(person);
    return safeURL(person && (person.profileUrl || person.sourceUrl) || account.url || account.sourceUrl || account.profileUrl);
  }
  function primaryProvider(person) {
    var account = primaryAccount(person);
    return clean(person && person.provider || account.provider || account.id).toLowerCase();
  }
  function contentId(work) { return clean(work && (work.id || work.contentId || work.sourceRecordId)); }
  function contentProvider(work) { return clean(work && (work.provider || work.platform)).toLowerCase(); }
  function contentURL(work) { return safeURL(work && (work.url || work.sourceUrl || work.canonicalUrl)); }
  function contentPerson(work) {
    if (work && work.person) return work.person;
    var id = clean(work && (work.personId || work.creatorId));
    return array(state.catalog && state.catalog.people).filter(function (person) { return personId(person) === id; })[0] || null;
  }
  function subjectId(kind, row) { return kind === 'profile' ? personId(row) : contentId(row); }
  function subjectPerson(kind, row) { return kind === 'profile' ? row : contentPerson(row); }
  function subjectName(kind, row) { return kind === 'profile' ? personName(row) : display(row && row.title); }
  function subjectProvider(kind, row) { return kind === 'profile' ? primaryProvider(row) : contentProvider(row); }
  function subjectSource(kind, row) { return kind === 'profile' ? profileURL(row) : contentURL(row); }
  function subjectSimulation(row) { return row && row.simulation && row.simulation.isSimulation === true ? row.simulation : null; }
  function subjectContract(row) { return row && row.contract && typeof row.contract === 'object' ? row.contract : null; }
  function contractMetric(row) {
    var contract = subjectContract(row);
    return contract && contract.metric && typeof contract.metric === 'object' ? contract.metric : {};
  }
  function contractProvider(kind, row) {
    return clean(contractMetric(row).provider || subjectProvider(kind, row)).toLowerCase();
  }
  function contractMetricKey(row) {
    var metric = contractMetric(row);
    return clean(metric.key || metric.metric || metric.label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'other';
  }
  function contractMetricName(row) {
    var metric = contractMetric(row);
    return display(metric.label || metric.metric || metric.key).replace(/_/g, ' ') || 'Other metric';
  }
  function validContract(row) {
    var contract = subjectContract(row), metric = contract && contract.metric;
    return contract && clean(contract.id) && clean(contract.question) && clean(contract.baseline && contract.baseline.label)
      && clean(contract.target && contract.target.label) && clean(contract.cutoff) && clean(metric && metric.observationId)
      && clean(metric && metric.label) && safeURL(metric && metric.sourceUrl) ? contract : null;
  }
  function subjectMetrics(kind, row) { return array(kind === 'profile' ? row && row.metrics : row && (row.metrics || row.publicCounts)); }
  function validMetrics(rows) {
    var seen = Object.create(null);
    return array(rows).filter(function (metric) {
      var key = [clean(metric && (metric.provider || metric.platform)), clean(metric && (metric.metric || metric.key || metric.label))].join(':');
      if (!key || seen[key] || number(metric && (metric.value != null ? metric.value : metric.count)) == null || !safeURL(metric && (metric.sourceUrl || metric.url))) return false;
      seen[key] = true;
      return true;
    }).sort(function (a, b) { return Date.parse(b.observedAt || 0) - Date.parse(a.observedAt || 0); });
  }
  function metricLabel(metric) { return display(metric && (metric.label || metric.metric || metric.key)).replace(/_/g, ' ') || 'Public metric'; }
  function freshnessState(value) {
    var freshness = value && value.freshness && typeof value.freshness === 'object' ? value.freshness : value;
    return clean(freshness && freshness.state).toLowerCase();
  }
  function baselineEvidenceText(value, observedAt) {
    var date = formatDate(observedAt || value && value.observedAt);
    return freshnessState(value) === 'last_good' ? 'Last good · observed ' + date : date;
  }
  function metricHTML(metric) {
    var value = metric.value != null ? metric.value : metric.count;
    var lastGood = freshnessState(metric) === 'last_good';
    return '<a class="mkt-fact' + (lastGood ? ' is-last-good' : '') + '" href="' + esc(safeURL(metric.sourceUrl || metric.url)) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open><b>' + esc(formatCount(value)) + '</b><span>' + esc(platformLabel(metric.provider || metric.platform) + ' · ' + metricLabel(metric)) + '</span>' + (lastGood ? '<small>' + esc(baselineEvidenceText(metric, metric.observedAt)) + '</small>' : '') + '</a>';
  }
  function evidenceHTML(kind, row) {
    var metrics = validMetrics(subjectMetrics(kind, row)).slice(0, 2);
    if (metrics.length) return '<div class="mkt-facts" aria-label="Retained public evidence">' + metrics.map(metricHTML).join('') + '</div>';
    return '<p class="mkt-source-fact">Public identity and original source retained.</p>';
  }
  function contractHTML(row) {
    var contract = validContract(row);
    if (!contract) return '';
    var metric = contract.metric, baseline = contract.baseline, target = contract.target;
    return '<section class="mkt-contract" aria-label="Paper market proposition"><span class="mkt-contract-label">Market question</span><h3>' + esc(contract.question) + '</h3><div class="mkt-contract-facts"><div><span>Baseline</span><b>' + esc(baseline.label) + '</b><small>' + esc(baselineEvidenceText(baseline, baseline.observedAt)) + '</small></div><div><span>Target</span><b>' + esc(target.label) + '</b><small>by ' + esc(formatDate(contract.cutoff)) + '</small></div><a href="' + esc(safeURL(metric.sourceUrl)) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open><span>Metric</span><b>' + esc(metric.label) + '</b><small>' + esc(platformLabel(metric.provider)) + ' source ↗</small></a></div></section>';
  }
  function providerBadges(person) {
    return array(person && (person.accounts || person.platforms)).slice(0, 4).map(function (account) {
      var provider = clean(account.provider || account.id || account.platform);
      var url = safeURL(account.url || account.sourceUrl || account.profileUrl);
      return url ? '<a class="mkt-provider" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open>' + esc(platformLabel(provider)) + '</a>' : '<span class="mkt-provider">' + esc(platformLabel(provider)) + '</span>';
    }).join('');
  }
  function isWatched(id) { return readWatchSet().has(clean(id)); }
  function mediaHTML(kind, image, alt, fallbackText, sourceURL) {
    var media = usableMedia(image);
    var imageHTML = media ? '<img data-mkt-media src="' + esc(media) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"/>' : '';
    var fallback = '<span class="mkt-media-fallback" aria-hidden="true"><b>' + esc(initials(fallbackText)) + '</b><small>Source media not retained</small></span>';
    var inner = imageHTML + fallback;
    return sourceURL ? '<a class="mkt-card-media is-' + kind + (media ? ' has-media' : ' is-image-fallback') + '" href="' + esc(sourceURL) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open>' + inner + '<span class="mkt-open-source">Open source ↗</span></a>' : '<div class="mkt-card-media is-' + kind + (media ? ' has-media' : ' is-image-fallback') + '">' + inner + '</div>';
  }
  function personalReason(kind, row) {
    var signals = deviceSignals();
    if (kind === 'content' && signals.watchedContentIds.indexOf(contentId(row)) >= 0) return 'Watched work';
    if (kind === 'profile' && signals.watchedPersonIds.indexOf(personId(row)) >= 0) return 'Watched profile';
    var reasons = array(row && row.personalizationReasons);
    return display(reasons[0]) || (row && row.evidenceState === 'retained_native_observations' ? 'Retained native observation' : 'Retained public source');
  }
  function personalScore(kind, row, index, signals) {
    signals = signals || deviceSignals();
    var pid = personId(subjectPerson(kind, row));
    var id = subjectId(kind, row);
    var score = -index;
    if (signals.positionSubjectIds.indexOf(id) >= 0) score += 12000;
    if (signals.proposedContentIds.indexOf(id) >= 0 || signals.proposedPersonIds.indexOf(pid) >= 0) score += 10000;
    /* An exact work watch must outrank aggregate creator affinities so the
       watched card visibly leads the personalized content feed. */
    if (kind === 'content' && signals.watchedContentIds.indexOf(id) >= 0) score += 50000;
    if (signals.watchedPersonIds.indexOf(pid) >= 0) score += 8000;
    signals.recentActions.forEach(function (interest, interestIndex) {
      if (kind === 'content' && clean(interest.contentId) === id) score += 6000 - Math.min(1000, interestIndex * 20);
      else if (clean(interest.personId) === pid) score += 3500 - Math.min(1000, interestIndex * 20);
    });
    if (usableMedia(kind === 'profile' ? row.avatar || row.avatarUrl : row.thumbnail || row.thumbnailUrl)) score += 80;
    if (validMetrics(subjectMetrics(kind, row)).length) score += 40;
    return score;
  }
  function personalize(kind, rows) {
    var signals = deviceSignals();
    return array(rows).map(function (row, index) { return { row: row, index: index, score: personalScore(kind, row, index, signals) }; }).sort(function (a, b) {
      return b.score - a.score || a.index - b.index || subjectId(kind, a.row).localeCompare(subjectId(kind, b.row));
    }).map(function (entry) { return entry.row; });
  }

  function sparklineSVG(values, positive) {
    var points = array(values).map(number).filter(function (value) { return value != null; });
    if (points.length < 2) return '';
    var min = Math.min.apply(Math, points), max = Math.max.apply(Math, points), spread = Math.max(1, max - min);
    var plotted = points.map(function (value, index) {
      return (index / (points.length - 1) * 100).toFixed(2) + ',' + (38 - ((value - min) / spread * 34)).toFixed(2);
    }).join(' ');
    return '<svg class="mkt-spark ' + (positive ? 'is-up' : 'is-down') + '" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label="Simulated market movement"><polyline points="' + plotted + '"/></svg>';
  }
  function simulationHTML(kind, row) {
    var sim = subjectSimulation(row), contract = validContract(row);
    if (!sim || !contract || clean(sim.contractId) !== clean(contract.id)) return '';
    var support = Math.max(1, Math.min(99, number(sim.supportPriceCents) || 50));
    var fade = 100 - support;
    var move = number(sim.move24hPoints) || 0;
    var moveClass = move >= 0 ? 'is-up' : 'is-down';
    return '<section class="mkt-sim-market" aria-label="Modeled paper market"><div class="mkt-quote"><span title="Modeled paper-market price">Price</span><strong>' + support + '¢</strong><b class="' + moveClass + '">' + (move >= 0 ? '+' : '') + move.toFixed(1) + ' pts</b></div>' + sparklineSVG(sim.sparkline, move >= 0) + '<div class="mkt-market-stats"><span><b>' + esc(formatPaperVolume(sim.simulatedVolume)) + '</b> paper vol</span><span>Updates hourly</span></div><div class="mkt-side-actions"><button type="button" class="is-back" data-mkt-trade="BACK" data-subject-kind="' + kind + '" data-subject-id="' + esc(subjectId(kind, row)) + '" aria-label="Back: ' + esc(contract.question) + '"><span>Back</span><b>' + support + '¢</b></button><button type="button" class="is-fade" data-mkt-trade="FADE" data-subject-kind="' + kind + '" data-subject-id="' + esc(subjectId(kind, row)) + '" aria-label="Fade: ' + esc(contract.question) + '"><span>Fade</span><b>' + fade + '¢</b></button></div></section>';
  }
  function draftURL(kind, row) {
    if (row && safeURL(row.proposalHref)) return row.proposalHref;
    var person = subjectPerson(kind, row);
    var params = new URLSearchParams();
    params.set('scope', kind === 'content' ? 'content' : 'person');
    params.set('person', personId(person));
    params.set('source', 'trades');
    if (kind === 'content') params.set('content', contentId(row));
    return 'backercreate.html#draft?' + params.toString();
  }
  function personCard(person) {
    var id = personId(person), name = personName(person), provider = primaryProvider(person), source = profileURL(person);
    var avatar = usableMedia(person.avatar || person.avatarUrl || person.image), watched = isWatched(id);
    var research = safeURL(person.researchHref);
    return '<article class="mkt-catalog-card is-profile" data-mkt-subject-kind="profile" data-mkt-subject-id="' + esc(id) + '"><div class="mkt-catalog-top">' + mediaHTML('profile', avatar, name + ' public profile picture', name, source) + '<div class="mkt-catalog-heading"><div class="mkt-card-kind"><span>Profile market</span><div>' + providerBadges(person) + '</div></div><h2>' + esc(name) + '</h2><p class="mkt-handle">' + esc(display(person.handle || primaryAccount(person).handle) || platformLabel(provider) + ' public profile') + '</p><p class="mkt-description">' + esc(display(person.bio) || 'Public profile linked to retained account-native source evidence.') + '</p></div></div>' + evidenceHTML('profile', person) + contractHTML(person) + simulationHTML('profile', person) + '<div class="mkt-why"><b>For you</b><span>' + esc(personalReason('profile', person)) + '</span></div><footer class="mkt-catalog-footer">' + (source ? '<a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open>View source</a>' : '') + (research ? '<a class="mkt-research-link" href="' + esc(research) + '" data-mkt-research data-subject-kind="profile" data-subject-id="' + esc(id) + '">Research in Discovery</a>' : '') + '<button type="button" data-mkt-watch="' + esc(id) + '" aria-pressed="' + watched + '">' + (watched ? 'Watching' : 'Watch') + '</button><a class="mkt-draft-link" href="' + esc(draftURL('profile', person)) + '" data-mkt-draft data-subject-kind="profile" data-subject-id="' + esc(id) + '">Draft custom bet</a></footer></article>';
  }
  function contentCard(work) {
    var id = contentId(work), person = contentPerson(work) || {}, pid = personId(person) || clean(work.personId || work.creatorId);
    var name = personName(person) || display(work.personName), provider = contentProvider(work), source = contentURL(work);
    var title = display(work.title), thumb = usableMedia(work.thumbnail || work.thumbnailUrl || work.image), avatar = usableMedia(person.avatar || person.avatarUrl);
    var research = safeURL(work.researchHref);
    var watched = readWorkWatchSet().has(id);
    return '<article class="mkt-catalog-card is-content" data-mkt-subject-kind="content" data-mkt-subject-id="' + esc(id) + '">' + mediaHTML('content', thumb, title + ' source thumbnail', title, source) + '<div class="mkt-catalog-heading"><div class="mkt-card-kind"><span>Content market · ' + esc(platformLabel(provider)) + '</span><small>' + esc(formatDate(work.publishedAt || work.observedAt, false)) + '</small></div><div class="mkt-byline">' + (avatar ? '<img src="' + esc(avatar) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"/>' : '<span>' + esc(initials(name)) + '</span>') + '<b>' + esc(name) + '</b></div><h2>' + esc(title) + '</h2>' + (work.excerpt ? '<p class="mkt-description">' + esc(display(work.excerpt)) + '</p>' : '') + '</div>' + evidenceHTML('content', work) + contractHTML(work) + simulationHTML('content', work) + '<div class="mkt-why"><b>For you</b><span>' + esc(personalReason('content', work)) + '</span></div><footer class="mkt-catalog-footer"><a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer" data-mkt-source-open>View source</a>' + (research ? '<a class="mkt-research-link" href="' + esc(research) + '" data-mkt-research data-subject-kind="content" data-subject-id="' + esc(id) + '">Research in Discovery</a>' : '') + '<button type="button" data-mkt-watch-work="' + esc(id) + '" aria-pressed="' + watched + '">' + (watched ? 'Watching' : 'Watch') + '</button><a class="mkt-draft-link" href="' + esc(draftURL('content', work)) + '" data-mkt-draft data-subject-kind="content" data-subject-id="' + esc(id) + '">Draft custom bet</a></footer></article>';
  }

  function proposalReviewState(draft) {
    return clean(draft.resolution && draft.resolution.readiness) === 'retained_observation' ? 'Retained source observation selected' : 'Metric still needs source review';
  }
  function proposalTitle(draft) {
    var subject = draft.subject || {};
    return display(subject.content && subject.content.title || subject.person && subject.person.name) || 'Saved subject';
  }
  function proposalVisual(draft) {
    var person = draft.subject && draft.subject.person || {}, content = draft.subject && draft.subject.content || null;
    var image = usableMedia(content && (content.thumbnail || content.thumbnailUrl || content.image) || person.avatar || person.avatarUrl || person.image);
    return '<span class="mkt-proposal-visual' + (image ? ' has-media' : '') + '">' + (image ? '<img data-mkt-media src="' + esc(image) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"/>' : '<b>' + esc(initials(proposalTitle(draft))) + '</b>') + '</span>';
  }
  function proposalCard(row, expanded) {
    var draft = row.draft, resolution = draft.resolution || {}, baseline = resolution.baseline || {}, target = resolution.target || {}, rules = draft.rules || {};
    var title = proposalTitle(draft), question = display(draft.outcome && draft.outcome.question) || 'Creator-growth milestone proposal', source = safeURL(resolution.sourceUrl);
    var pending = state.pendingDeleteId === draft.draftId;
    var deleteControls = pending ? '<span class="mkt-delete-confirm" role="group"><span>Delete this local proposal?</span><button type="button" class="mkt-button is-quiet" data-proposal-delete-cancel>Cancel</button><button type="button" class="mkt-button is-danger" data-proposal-delete-confirm="' + esc(draft.draftId) + '">Delete</button></span>' : '<button type="button" class="mkt-button is-quiet" data-proposal-delete="' + esc(draft.draftId) + '">Delete</button>';
    var details = expanded ? '<div class="mkt-proposal-details"><h4>Resolution safeguards</h4><dl class="mkt-rules"><div><dt>Correction rule</dt><dd>' + esc(display(rules.correctionRule) || 'Not set') + '</dd></div><div><dt>Deletion rule</dt><dd>' + esc(display(rules.deletionRule) || 'Not set') + '</dd></div><div><dt>Review window</dt><dd>' + esc(formatNumber(rules.disputeHours)) + ' hours</dd></div><div><dt>Void rule</dt><dd>' + esc(display(rules.voidRule) || 'Not set') + '</dd></div></dl></div>' : '';
    return '<article class="mkt-proposal-card' + (expanded ? ' is-expanded' : '') + '" id="proposal-' + esc(draft.draftId) + '"><header class="mkt-subject">' + proposalVisual(draft) + '<div class="mkt-subject-copy"><span class="mkt-eyebrow">' + esc(draft.subject && draft.subject.content ? 'Original work proposal' : 'Profile growth proposal') + '</span><h3>' + esc(title) + '</h3><p>' + esc(platformLabel(resolution.platform)) + ' · Saved on this device</p></div><span class="mkt-status">Your proposal</span></header><div class="mkt-claim"><span>Future milestone</span><h2>' + esc(question) + '</h2></div><div class="mkt-number-grid"><div><span>Baseline</span><b>' + esc(formatNumber(baseline.value)) + '</b></div><div><span>Target</span><b>' + esc(formatNumber(target.value)) + '</b></div><div><span>Cutoff</span><b>' + esc(formatDate(resolution.deadline)) + '</b></div><div><span>Metric</span><b>' + esc(display(resolution.metricLabel || resolution.unit) || 'Not set') + '</b></div></div><dl class="mkt-rules"><div><dt>Resolution source</dt><dd>' + (source ? '<a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer">' + esc(platformLabel(resolution.platform) + ' public source') + '</a>' : 'Source review required') + '</dd></div><div><dt>Review state</dt><dd>' + esc(proposalReviewState(draft)) + '</dd></div></dl>' + details + '<footer class="mkt-card-footer"><p>' + esc(row.durable ? 'Saved on this device.' : 'Saved for this tab only.') + ' Not approved or priced.</p><div><button type="button" class="mkt-button is-secondary" data-proposal-review="' + esc(draft.draftId) + '">Review</button><button type="button" class="mkt-button is-quiet" data-proposal-edit="' + esc(draft.draftId) + '">Edit</button>' + deleteControls + '</div></footer></article>';
  }

  function catalogCounts() {
    var catalog = state.catalog || { people: [], contents: [], counts: {} };
    return { people: number(catalog.counts.people || catalog.counts.profiles) || catalog.people.length, contents: number(catalog.counts.contents || catalog.counts.works) || catalog.contents.length };
  }
  function tabButton(view, label, count) {
    return '<button type="button" role="tab" aria-selected="' + (state.view === view) + '" class="' + (state.view === view ? 'is-active' : '') + '" data-trades-view="' + view + '"><span>' + esc(label) + '</span><b>' + esc(formatExactCount(count)) + '</b></button>';
  }
  function headerHTML() {
    var counts = catalogCounts(), generated = formatDate(state.catalog && state.catalog.generatedAt);
    return '<header class="mkt-header"><div><span class="mkt-kicker">Backer Trades</span><h1>Trade future growth in creator accounts and work</h1><p>Source-backed creator accounts and original content from Discovery. Back, fade, or draft exact market rules around what grows next.</p></div></header><div class="mkt-catalog-line"><span class="mkt-paper-status"><i></i>Paper market · modeled quotes</span><span><b>' + esc(formatMoney(readAccount().cash)) + '</b> paper cash</span><span><b>' + esc(formatExactCount(counts.people)) + '</b> creator-account markets</span><span><b>' + esc(formatExactCount(counts.contents)) + '</b> work markets</span><span><b>' + esc(formatExactCount(counts.people + counts.contents)) + '</b> active contracts</span>' + (generated ? '<span>Observed ' + esc(generated) + '</span>' : '') + '<a href="backerdemo.html#market2">Open Discovery ↗</a><a href="backerdemo.html#market-archive">Archived demo market ↗</a></div><nav class="mkt-tabs" role="tablist" aria-label="Trades views">' + tabButton('feed', 'For you', counts.people + counts.contents) + tabButton('profiles', 'Profiles', counts.people) + tabButton('contents', 'Contents', counts.contents) + tabButton('positions', 'Your trades', listPositions().length) + tabButton('proposals', 'Proposals', proposalRows().length) + '</nav>';
  }
  function facetOptions(view, facet) {
    var map = Object.create(null);
    if (!state.catalog) return [];
    var kind = view === 'profiles' ? 'profile' : 'content';
    var rows = kind === 'profile' ? state.catalog.people : state.catalog.contents;
    rows.forEach(function (row) {
      var id = facet === 'metric' ? contractMetricKey(row) : contractProvider(kind, row);
      if (!id) return;
      if (!map[id]) map[id] = { id: id, label: facet === 'metric' ? contractMetricName(row) : platformLabel(id), count: 0 };
      map[id].count += 1;
    });
    return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
      return b.count - a.count || a.label.localeCompare(b.label);
    });
  }
  function toolbarHTML(view) {
    var noun = view === 'profiles' ? 'profiles' : 'contents';
    var providers = facetOptions(view, 'provider');
    var metrics = facetOptions(view, 'metric');
    return '<div class="mkt-toolbar"><label class="mkt-search"><span>Search all ' + noun + '</span><input type="search" data-trades-query value="' + esc(state.query) + '" placeholder="' + (view === 'profiles' ? 'Name, handle, or market question' : 'Title, creator, or market question') + '" autocomplete="off"/></label><label><span>Resolution source</span><select data-trades-provider><option value="all">All sources</option>' + providers.map(function (row) { return '<option value="' + esc(row.id) + '"' + (state.provider === row.id ? ' selected' : '') + '>' + esc(row.label + ' (' + formatExactCount(row.count) + ')') + '</option>'; }).join('') + '</select></label><label><span>Market metric</span><select data-trades-metric><option value="all">All metrics</option>' + metrics.map(function (row) { return '<option value="' + esc(row.id) + '"' + (state.metric === row.id ? ' selected' : '') + '>' + esc(row.label + ' (' + formatExactCount(row.count) + ')') + '</option>'; }).join('') + '</select></label><label><span>Order</span><select data-trades-sort><option value="personalized"' + (state.sort === 'personalized' ? ' selected' : '') + '>For you</option><option value="evidence"' + (state.sort === 'evidence' ? ' selected' : '') + '>Recent evidence</option><option value="price"' + (state.sort === 'price' ? ' selected' : '') + '>Highest price</option><option value="movement"' + (state.sort === 'movement' ? ' selected' : '') + '>Largest 24h move</option><option value="volume"' + (state.sort === 'volume' ? ' selected' : '') + '>Most paper volume</option><option value="name"' + (state.sort === 'name' ? ' selected' : '') + '>Name</option></select></label></div>';
  }
  function sortCatalog(kind, rows) {
    if (state.sort === 'personalized') return personalize(kind, rows);
    if (state.sort === 'name') return rows.slice().sort(function (a, b) { return subjectName(kind, a).localeCompare(subjectName(kind, b)); });
    if (state.sort === 'price') return rows.slice().sort(function (a, b) { return number(subjectSimulation(b) && subjectSimulation(b).supportPriceCents) - number(subjectSimulation(a) && subjectSimulation(a).supportPriceCents); });
    if (state.sort === 'movement') return rows.slice().sort(function (a, b) { return Math.abs(number(subjectSimulation(b) && subjectSimulation(b).move24hPoints) || 0) - Math.abs(number(subjectSimulation(a) && subjectSimulation(a).move24hPoints) || 0); });
    if (state.sort === 'volume') return rows.slice().sort(function (a, b) { return number(subjectSimulation(b) && subjectSimulation(b).simulatedVolume) - number(subjectSimulation(a) && subjectSimulation(a).simulatedVolume); });
    return rows.slice().sort(function (a, b) { return Date.parse(b.lastObservedAt || b.observedAt || b.publishedAt || 0) - Date.parse(a.lastObservedAt || a.observedAt || a.publishedAt || 0); });
  }
  function filterPeople() {
    var query = state.query.toLowerCase();
    return sortCatalog('profile', array(state.catalog && state.catalog.people).filter(function (person) {
      if (state.provider !== 'all' && contractProvider('profile', person) !== state.provider) return false;
      if (state.metric !== 'all' && contractMetricKey(person) !== state.metric) return false;
      return !query || [personName(person), person.handle, person.bio, contractProvider('profile', person), contractMetricName(person), subjectContract(person) && subjectContract(person).question].join(' ').toLowerCase().indexOf(query) >= 0;
    }));
  }
  function filterContents() {
    var query = state.query.toLowerCase();
    return sortCatalog('content', array(state.catalog && state.catalog.contents).filter(function (work) {
      if (state.provider !== 'all' && contractProvider('content', work) !== state.provider) return false;
      if (state.metric !== 'all' && contractMetricKey(work) !== state.metric) return false;
      return !query || [work.title, work.excerpt, personName(contentPerson(work)), contractProvider('content', work), contractMetricName(work), subjectContract(work) && subjectContract(work).question].join(' ').toLowerCase().indexOf(query) >= 0;
    }));
  }
  function hoistRouteSubject(kind, rows) {
    var expectedView = kind === 'profile' ? 'profiles' : 'contents';
    if (!state.routeSubjectId || state.view !== expectedView) return rows;
    var routed = lookupSubject(kind, state.routeSubjectId);
    if (!routed) return rows;
    return [routed].concat(rows.filter(function (row) {
      return subjectId(kind, row) !== state.routeSubjectId;
    }));
  }
  function gridHTML(kind, rows, limit) {
    var visible = limit == null ? rows : rows.slice(0, limit);
    if (!visible.length) return '<section class="mkt-empty"><span class="mkt-eyebrow">No matching subjects</span><h2>Try a broader source or search</h2><p>Search and filters run across the complete shared Discovery catalog.</p><button type="button" class="mkt-button is-secondary" data-clear-trades-filters>Clear filters</button></section>';
    return '<div class="mkt-catalog-grid is-' + kind + '">' + visible.map(kind === 'profile' ? personCard : contentCard).join('') + '</div>';
  }
  function sectionHTML(kind, title, copy, rows) {
    var view = kind === 'profile' ? 'profiles' : 'contents';
    return '<section class="mkt-feed-section"><div class="mkt-section-head"><div><span class="mkt-eyebrow">Same retained catalog as Discovery</span><h2>' + esc(title) + '</h2><p>' + esc(copy) + '</p></div><button type="button" class="mkt-text-action" data-trades-view="' + view + '">Browse all →</button></div>' + gridHTML(kind, rows, 6) + '</section>';
  }
  function feedHTML() {
    return '<section class="mkt-personalization"><div><b>For you · on this device</b><p>' + esc(personalizationSummary()) + '</p></div><div class="mkt-personalization-actions"><a href="backerdemo.html#market2">Refine Discovery</a><button type="button" aria-label="Reset personalization" data-reset-personalization>Reset feed</button></div></section>' + sectionHTML('profile', 'Profile markets', 'Back or fade attention around source-backed creator accounts, then draft exact resolution rules when you want a custom bet.', personalize('profile', state.catalog.people)) + sectionHTML('content', 'Content markets', 'Express conviction around retained original work while its creator, source, and native evidence stay attached.', personalize('content', state.catalog.contents));
  }
  function pageSlice(rows) {
    var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.page = Math.max(1, Math.min(pages, Math.floor(number(state.page) || 1)));
    var startIndex = (state.page - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(startIndex, startIndex + PAGE_SIZE), total: rows.length,
      page: state.page, pages: pages, start: rows.length ? startIndex + 1 : 0,
      end: Math.min(rows.length, startIndex + PAGE_SIZE)
    };
  }
  function paginationHTML(result, noun) {
    if (!result.total) return '';
    return '<nav class="mkt-pagination" aria-label="' + esc(noun + ' catalog pages') + '"><p aria-live="polite">Showing <b>' + esc(formatExactCount(result.start)) + '-' + esc(formatExactCount(result.end)) + '</b> of <b>' + esc(formatExactCount(result.total)) + '</b> matching ' + esc(noun) + '</p><div><button type="button" data-trades-page="previous"' + (result.page <= 1 ? ' disabled' : '') + '>Previous</button><label><span>Page</span><input type="number" min="1" max="' + result.pages + '" value="' + result.page + '" inputmode="numeric" data-trades-page-input aria-label="Page number"/></label><span>of ' + esc(formatExactCount(result.pages)) + '</span><button type="button" data-trades-page="next"' + (result.page >= result.pages ? ' disabled' : '') + '>Next</button></div></nav>';
  }
  function browseHTML(kind) {
    var isProfile = kind === 'profile', rows = hoistRouteSubject(kind, isProfile ? filterPeople() : filterContents());
    var result = pageSlice(rows), noun = isProfile ? 'creator-account markets' : 'work markets';
    return toolbarHTML(isProfile ? 'profiles' : 'contents') + '<section class="mkt-section-head is-browse"><div><span class="mkt-eyebrow">Complete retained catalog</span><h2>' + (isProfile ? 'Profile markets' : 'Content markets') + '</h2><p>Search every eligible contract, then Back, Fade, or write a custom outcome.</p></div></section>' + paginationHTML(result, noun) + gridHTML(kind, result.rows) + paginationHTML(result, noun);
  }
  function positionCard(position) {
    var snapshot = position.subjectSnapshot || {}, current = lookupSubject(position.subjectKind, position.subjectId), sim = current && subjectSimulation(current);
    var contract = position.contractSnapshot || {}, question = display(contract.question) || 'Saved paper market contract';
    var currentPrice = sim ? (position.side === 'BACK' ? sim.supportPriceCents : 100 - sim.supportPriceCents) : position.priceCents;
    var mark = position.quantity * currentPrice / 100, pnl = mark - position.cost, source = safeURL(snapshot.sourceUrl);
    return '<article class="mkt-position-card"><header><span class="mkt-position-side is-' + position.side.toLowerCase() + '">' + position.side + '</span><div><span>' + esc(position.subjectKind === 'profile' ? 'Profile market' : 'Content market') + '</span><h3>' + esc(snapshot.title || snapshot.name || position.subjectId) + '</h3><p>' + esc(platformLabel(snapshot.provider)) + ' · ' + esc(formatDate(position.createdAt)) + '</p></div><b class="' + (pnl >= 0 ? 'is-up' : 'is-down') + '">' + (pnl >= 0 ? '+' : '') + formatMoney(pnl) + '</b></header><section class="mkt-position-contract"><span>Contract</span><h4>' + esc(question) + '</h4>' + (contract.baselineLabel && contract.targetLabel ? '<p>' + esc(contract.baselineLabel) + ' baseline → ' + esc(contract.targetLabel) + ' target · ' + esc(formatDate(contract.cutoff)) + '</p>' : '') + '</section><div class="mkt-position-numbers"><div><span>Entry</span><b>' + position.priceCents + '¢</b></div><div><span>Current price</span><b>' + currentPrice + '¢</b></div><div><span>Cost</span><b>' + formatMoney(position.cost) + '</b></div><div><span>Mark</span><b>' + formatMoney(mark) + '</b></div></div><footer>' + (source ? '<a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer">View source</a>' : '') + '<span>Receipt ' + esc(position.receiptId) + '</span><span>Contract ' + esc(position.contractId || '') + '</span><a href="' + esc(position.proposalHref || '#') + '">Draft resolution rules</a></footer></article>';
  }
  function positionsHTML() {
    var rows = listPositions().slice().sort(function (a, b) { return clean(b.createdAt).localeCompare(clean(a.createdAt)); });
    if (!rows.length) return '<section class="mkt-empty"><span class="mkt-eyebrow">Your trades</span><h2>No paper trades yet</h2><p>Back or fade a source-backed creator account or retained work. You will review the quote and maximum loss before anything is saved.</p><button type="button" class="mkt-button is-primary" data-trades-view="feed">Explore markets</button></section>';
    var cost = 0, mark = 0;
    rows.forEach(function (position) {
      var current = lookupSubject(position.subjectKind, position.subjectId), sim = current && subjectSimulation(current);
      var currentPrice = sim ? (position.side === 'BACK' ? sim.supportPriceCents : 100 - sim.supportPriceCents) : position.priceCents;
      cost += number(position.cost) || 0;
      mark += (number(position.quantity) || 0) * (number(currentPrice) || 0) / 100;
    });
    var pnl = mark - cost;
    return '<section class="mkt-section-head"><div><span class="mkt-eyebrow">Device-local paper ledger</span><h2>Your trades</h2><p>Receipts keep the subject snapshot, model ID, observation IDs, quote, side, quantity, cost, and timestamp.</p></div><a class="mkt-button is-secondary" href="portfolio.html">Open Portfolio</a></section><div class="mkt-account-summary"><div><span>Paper cash</span><b>' + formatMoney(readAccount().cash) + '</b></div><div><span>Position cost</span><b>' + formatMoney(cost) + '</b></div><div><span>Current mark</span><b>' + formatMoney(mark) + '</b></div><div><span>Paper P&amp;L</span><b class="' + (pnl >= 0 ? 'is-up' : 'is-down') + '">' + (pnl >= 0 ? '+' : '') + formatMoney(pnl) + '</b></div></div><div class="mkt-position-grid">' + rows.map(positionCard).join('') + '</div>';
  }
  function proposalsHTML() {
    var rows = proposalRows(), selected = state.proposalId && proposalById(state.proposalId);
    if (!rows.length) return '<section class="mkt-empty"><span class="mkt-eyebrow">Proposals</span><h2>No custom bets on this device</h2><p>Choose a source-backed creator account or retained work, then define a measurable target, cutoff, and public resolution source.</p><button type="button" class="mkt-button is-primary" data-trades-view="feed">Find a subject</button></section>';
    return '<section class="mkt-section-head"><div><span class="mkt-eyebrow">Device-local proposal inbox</span><h2>Custom growth bets</h2><p>These drafts use retained catalog subjects. They are not approved or externally executable.</p></div><button type="button" class="mkt-button is-secondary" data-trades-view="feed">Draft another</button></section><div class="mkt-proposal-grid">' + rows.map(function (row) { return proposalCard(row, selected && selected.draft.draftId === row.draft.draftId); }).join('') + '</div>';
  }
  function loadingHTML() {
    return '<section class="mkt-loading" aria-live="polite" aria-busy="true"><span></span><div><b>Loading creator accounts and work</b><p>Source links, retained media, and public observations stay attached.</p></div></section><div class="mkt-skeleton-grid">' + new Array(6).fill('<span></span>').join('') + '</div>';
  }
  function errorHTML() {
    return '<section class="mkt-empty is-error"><span class="mkt-eyebrow">Catalog read paused</span><h2>Trades could not read the retained catalog</h2><p>' + esc(state.loadError) + '. No fixture profile or synthetic content was substituted.</p><button type="button" class="mkt-button is-primary" data-trades-retry>Retry catalog</button><a class="mkt-button is-secondary" href="backerdemo.html#market2">Open Discovery</a></section>';
  }
  function canvasHTML() {
    if (state.loading) return loadingHTML();
    if (state.loadError || !state.catalog) return errorHTML();
    if (state.routeMissing) return '<section class="mkt-empty is-route-missing"><span class="mkt-eyebrow">Not listed in Trades</span><h2>This Discovery subject has no eligible paper contract</h2><p>Trades lists source-backed creator accounts and retained works with media, a native observation, and a complete resolution contract. Account eligibility does not verify personhood or legal identity, and nothing else is substituted.</p><a class="mkt-button is-primary" href="backerdemo.html#market2">Return to Discovery</a><button type="button" class="mkt-button is-secondary" data-trades-view="feed">Explore listed markets</button></section>';
    if (state.view === 'profiles') return browseHTML('profile');
    if (state.view === 'contents') return browseHTML('content');
    if (state.view === 'positions') return positionsHTML();
    if (state.view === 'proposals') return proposalsHTML();
    return feedHTML();
  }

  function lookupSubject(kind, id) {
    var rows = kind === 'profile' ? array(state.catalog && state.catalog.people) : array(state.catalog && state.catalog.contents);
    return rows.filter(function (row) { return subjectId(kind, row) === clean(id); })[0] || null;
  }
  function ticketMath() {
    if (!state.ticket) return null;
    var row = lookupSubject(state.ticket.kind, state.ticket.id), sim = row && subjectSimulation(row), contract = row && validContract(row);
    if (!row || !sim || !contract || clean(sim.contractId) !== clean(contract.id)) return null;
    var support = Math.max(1, Math.min(99, number(sim.supportPriceCents) || 50));
    var price = state.ticket.side === 'BACK' ? support : 100 - support;
    var amount = Math.max(5, Math.min(10000, number(state.ticket.amount) || 25));
    var quantity = Math.round(amount / (price / 100) * 100) / 100;
    var estimatedPayout = Math.round(quantity * 100) / 100;
    return {
      row: row, sim: sim, contract: contract, price: price, amount: amount,
      quantity: quantity, maxLoss: amount, estimatedPayout: estimatedPayout,
      profitIfCorrect: Math.round((estimatedPayout - amount) * 100) / 100
    };
  }
  function ticketHTML() {
    if (!state.ticket && !state.receipt) return '';
    if (state.receipt) {
      var receipt = state.receipt, snapshot = receipt.subjectSnapshot, savedContract = receipt.contractSnapshot || {};
      return '<div class="mkt-ticket-layer" data-ticket-backdrop><section class="mkt-ticket is-receipt" role="dialog" aria-modal="true" aria-labelledby="mktTicketTitle" tabindex="-1"><button type="button" class="mkt-ticket-x" data-ticket-close aria-label="Close">×</button><span class="mkt-ticket-kicker">Paper trade receipt</span><h2 id="mktTicketTitle">' + esc(receipt.side + ' · ' + (snapshot.title || snapshot.name)) + '</h2><section class="mkt-ticket-contract"><span>Contract</span><h3>' + esc(savedContract.question || 'Saved paper market contract') + '</h3><p>' + esc(savedContract.baselineLabel || '') + (savedContract.baselineLabel && savedContract.targetLabel ? ' baseline → ' : '') + esc(savedContract.targetLabel || '') + (savedContract.cutoff ? ' target by ' + esc(formatDate(savedContract.cutoff)) : '') + '</p></section><p>Recorded on this device. No external order was sent and no real money moved.</p><dl><div><dt>Paper fill</dt><dd>' + receipt.priceCents + '¢</dd></div><div><dt>Cost / quantity</dt><dd>' + formatMoney(receipt.cost) + ' / ' + formatNumber(receipt.quantity) + '</dd></div><div><dt>Maximum loss</dt><dd>' + formatMoney(receipt.maxLoss) + '</dd></div><div><dt>Estimated payout if correct</dt><dd>' + formatMoney(receipt.estimatedPayout) + '</dd></div><div><dt>Profit if correct</dt><dd>' + formatMoney(receipt.profitIfCorrect) + '</dd></div><div><dt>Resolution rule</dt><dd>' + esc(savedContract.resolutionRule || '') + '</dd></div><div><dt>Resolution source</dt><dd><a href="' + esc(safeURL(savedContract.metricSourceUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc((savedContract.metricLabel || 'Native metric') + ' · ' + platformLabel(savedContract.metricProvider)) + ' ↗</a></dd></div><div><dt>Paper cash left</dt><dd>' + formatMoney(receipt.paperCashAfter) + '</dd></div><div><dt>Contract</dt><dd title="' + esc(receipt.contractId) + '">' + esc(shortId(receipt.contractId)) + '</dd></div><div><dt>Evidence observation</dt><dd title="' + esc(receipt.contractObservationId) + '">' + esc(shortId(receipt.contractObservationId)) + '</dd></div><div><dt>Receipt</dt><dd>' + esc(receipt.receiptId) + '</dd></div></dl><div class="mkt-ticket-actions"><button type="button" class="mkt-button is-secondary" data-ticket-close>Keep exploring</button><a class="mkt-button is-secondary" href="portfolio.html">Open Portfolio</a><button type="button" class="mkt-button is-primary" data-trades-view="positions">View your trades</button></div></section></div>';
    }
    var math = ticketMath();
    if (!math) return '';
    var row = math.row, kind = state.ticket.kind, title = subjectName(kind, row), source = subjectSource(kind, row), contract = math.contract;
    var account = readAccount(), canAfford = math.amount <= account.cash;
    return '<div class="mkt-ticket-layer" data-ticket-backdrop><section class="mkt-ticket" role="dialog" aria-modal="true" aria-labelledby="mktTicketTitle" tabindex="-1"><button type="button" class="mkt-ticket-x" data-ticket-close aria-label="Close">×</button><span class="mkt-ticket-kicker">Review paper trade</span><h2 class="mkt-ticket-subject" id="mktTicketTitle">' + esc(state.ticket.side + ' · ' + title) + '</h2><section class="mkt-ticket-contract"><span>Contract</span><h3>' + esc(contract.question) + '</h3><p><b>' + esc(contract.baseline.label) + '</b> baseline → <b>' + esc(contract.target.label) + '</b> target by ' + esc(formatDate(contract.cutoff)) + '</p></section><section class="mkt-ticket-quote" aria-label="Paper quote"><div><span>Side / price</span><strong>' + state.ticket.side + ' / ' + math.price + '¢</strong></div><div><span>Available cash</span><strong>' + formatMoney(account.cash) + '</strong></div></section><label class="mkt-ticket-amount"><span>Paper amount</span><input type="number" min="5" max="' + esc(Math.max(0, account.cash)) + '" step="5" value="' + esc(state.ticket.amount) + '" data-ticket-amount/></label><div class="mkt-ticket-totals"><div><span>Quantity</span><b data-ticket-quantity>' + formatNumber(math.quantity) + '</b></div><div><span>Maximum loss</span><b data-ticket-loss>' + formatMoney(math.maxLoss) + '</b></div><div><span>Estimated payout if correct</span><b data-ticket-payout>' + formatMoney(math.estimatedPayout) + '</b></div><div><span>Profit if correct</span><b data-ticket-profit>' + formatMoney(math.profitIfCorrect) + '</b></div></div><p class="mkt-ticket-error" data-ticket-error' + (canAfford && !state.ticket.error ? ' hidden' : '') + '>' + esc(state.ticket.error || 'Amount exceeds available paper cash.') + '</p><label class="mkt-ticket-ack"><input type="checkbox" data-ticket-ack' + (state.ticket.ack ? ' checked' : '') + '/><span>I understand this is a deterministic paper quote. No external order or real money is involved.</span></label><div class="mkt-ticket-actions"><a class="mkt-button is-secondary" href="' + esc(draftURL(kind, row)) + '" data-mkt-draft data-subject-kind="' + kind + '" data-subject-id="' + esc(subjectId(kind, row)) + '">Draft custom rules</a><button type="button" class="mkt-button is-primary" data-ticket-confirm' + (state.ticket.ack && canAfford ? '' : ' disabled') + '>Record paper position</button></div><details class="mkt-ticket-details" open><summary>Resolution and source details</summary><dl><div><dt>Native metric</dt><dd><a href="' + esc(safeURL(contract.metric.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc(contract.metric.label + ' · ' + platformLabel(contract.metric.provider)) + ' ↗</a></dd></div><div><dt>Observed baseline</dt><dd>' + esc(baselineEvidenceText(contract.baseline, contract.baseline.observedAt)) + '</dd></div><div><dt>Resolution rule</dt><dd>' + esc(contract.resolutionRule) + '</dd></div><div><dt>Resolution source</dt><dd><a href="' + esc(safeURL(contract.metric.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">Re-observe ' + esc(contract.metric.label + ' on ' + platformLabel(contract.metric.provider)) + ' ↗</a></dd></div><div><dt>Model</dt><dd>' + esc(math.sim.modelVersion || math.sim.methodology) + ' · hourly</dd></div><div><dt>Source subject</dt><dd><a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer">' + esc(platformLabel(subjectProvider(kind, row))) + ' public source ↗</a></dd></div></dl></details></section></div>';
  }
  function renderContent() {
    if (!mountedRoot) return;
    if (document.body && document.body.classList) document.body.classList.toggle('trades-ticket-open', Boolean(state.ticket || state.receipt));
    mountedRoot.innerHTML = '<div class="mkt">' + headerHTML() + '<main class="mkt-canvas" id="tradesPanel" role="tabpanel">' + canvasHTML() + '</main>' + ticketHTML() + '</div>';
    if (!firstCardPaintScheduled && mountedRoot.querySelector('.mkt-catalog-card')) {
      firstCardPaintScheduled = true;
      var timing = performanceState();
      timing.firstCardDOMAt = performanceNow();
      performanceMark('backer-trades:first-card-dom');
      root.requestAnimationFrame(function () {
        root.requestAnimationFrame(function () {
          timing.firstCardPaintedAt = performanceNow();
          performanceMark('backer-trades:first-card-painted');
          performanceMeasure('backer-trades:first-card-render', 'backer-trades:render-requested', 'backer-trades:first-card-painted');
        });
      });
    }
    if (state.ticket || state.receipt) {
      var layer = mountedRoot.querySelector('.mkt-ticket-layer');
      if (layer && layer.parentNode) Array.prototype.forEach.call(layer.parentNode.children, function (child) {
        if (child !== layer) { child.inert = true; child.setAttribute('aria-hidden', 'true'); }
      });
      root.requestAnimationFrame(function () { var dialog = mountedRoot.querySelector('.mkt-ticket'); if (dialog) dialog.focus && dialog.focus(); });
    }
    if (state.proposalId && !state.loading) root.requestAnimationFrame(function () { var selected = document.getElementById('proposal-' + state.proposalId); if (selected) selected.scrollIntoView({ block: 'nearest' }); });
    if (state.routeSubjectId && !state.loading) root.requestAnimationFrame(function () {
      var cards = mountedRoot.querySelectorAll('[data-mkt-subject-id]'), selected = null;
      Array.prototype.some.call(cards, function (card) { if (card.getAttribute('data-mkt-subject-id') === state.routeSubjectId) { selected = card; return true; } return false; });
      if (selected) { selected.classList.add('is-route-focus'); if (!state.ticket) selected.scrollIntoView({ block: 'center' }); }
    });
  }

  function rememberInterest(kind, row, action) {
    var person = subjectPerson(kind, row), pid = personId(person);
    if (!pid) return;
    var interest = { personId: pid, personName: personName(person), contentId: kind === 'content' ? contentId(row) : '', contentTitle: kind === 'content' ? display(row.title) : '', provider: subjectProvider(kind, row), category: clean(person.category).toLowerCase(), action: action || 'opened', at: new Date().toISOString() };
    var rows = readArray(DISCOVERY_INTEREST_KEY).filter(function (candidate) { return !(candidate && clean(candidate.personId) === interest.personId && clean(candidate.contentId) === interest.contentId && clean(candidate.action) === interest.action); });
    rows.unshift(interest);
    writeArray(DISCOVERY_INTEREST_KEY, rows.slice(0, 40));
  }
  function toggleWatch(id) {
    var set = readWatchSet();
    if (set.has(id)) set.delete(id); else set.add(id);
    if (!writeArray(WATCH_KEY, Array.from(set))) { toast('Watch preference could not be saved'); return; }
    var person = lookupSubject('profile', id);
    if (set.has(id)) rememberInterest('profile', person, 'watched');
    analytics('market_watch_changed', { creator_id: id, watched: set.has(id), source: 'trades' });
    toast(set.has(id) ? 'Added to Your People' : 'Removed from Your People');
    renderContent();
  }
  function toggleWorkWatch(id) {
    var set = readWorkWatchSet();
    if (set.has(id)) set.delete(id); else set.add(id);
    if (!writeArray(WORK_WATCH_KEY, Array.from(set))) { toast('Work watch preference could not be saved'); return; }
    var work = lookupSubject('content', id);
    if (set.has(id) && work) rememberInterest('content', work, 'watched');
    analytics('market_work_watch_changed', {
      subject_id: id,
      content_id: id,
      creator_id: work ? personId(subjectPerson('content', work)) : '',
      watched: set.has(id),
      source: 'trades'
    });
    toast(set.has(id) ? 'Added to watched work' : 'Removed from watched work');
    renderContent();
  }
  function resetPersonalization() {
    try {
      root.localStorage.setItem(PERSONALIZATION_RESET_KEY, new Date().toISOString());
      root.localStorage.removeItem(WATCH_KEY);
      root.localStorage.removeItem(WORK_WATCH_KEY);
      root.localStorage.removeItem(DISCOVERY_INTEREST_KEY);
    } catch (error) { toast('Personalization could not be reset'); return; }
    state.catalog = null;
    state.sort = 'personalized';
    state.page = 1;
    toast('Personalization reset; saved trades and proposals were kept');
    ensureCatalog(true).catch(function () {});
  }
  function openTicket(kind, id, side) {
    var row = lookupSubject(kind, id), sim = row && subjectSimulation(row), contract = row && validContract(row);
    if (!row || !sim || !contract || clean(sim.contractId) !== clean(contract.id)) { toast('This paper contract is not ready'); return; }
    ticketReturnFocus = { kind: kind, id: id, side: side };
    state.receipt = null;
    state.ticket = { kind: kind, id: id, side: side, amount: 25, ack: false };
    rememberInterest(kind, row, 'trade_reviewed');
    analytics('market_order_reviewed', { subject_id: id, subject_type: kind, side: side, source: 'trades' });
    renderContent();
  }
  function closeTicket() {
    var focusTarget = ticketReturnFocus;
    state.ticket = null;
    state.receipt = null;
    renderContent();
    root.requestAnimationFrame(function () {
      if (!focusTarget || !mountedRoot) return;
      var selector = '[data-mkt-trade="' + focusTarget.side + '"][data-subject-kind="' + focusTarget.kind + '"][data-subject-id="' + focusTarget.id + '"]';
      var trigger = mountedRoot.querySelector(selector);
      if (trigger && trigger.focus) trigger.focus();
    });
  }
  function positionSnapshot(kind, row) {
    var person = subjectPerson(kind, row);
    return Object.freeze({ name: personName(person), title: kind === 'content' ? display(row.title) : '', avatar: usableMedia(person.avatar || person.avatarUrl), thumbnail: kind === 'content' ? usableMedia(row.thumbnail || row.thumbnailUrl) : '', provider: subjectProvider(kind, row), sourceUrl: subjectSource(kind, row) });
  }
  function contractSnapshot(contract) {
    return Object.freeze({
      id: clean(contract.id), question: display(contract.question), claim: display(contract.claim),
      modelVersion: clean(contract.modelVersion), baselineValue: number(contract.baseline && contract.baseline.value),
      baselineLabel: display(contract.baseline && contract.baseline.label), baselineObservedAt: clean(contract.baseline && contract.baseline.observedAt),
      baselineFreshnessState: freshnessState(contract.baseline),
      targetValue: number(contract.target && contract.target.value), targetLabel: display(contract.target && contract.target.label),
      cutoff: clean(contract.cutoff), horizonDays: number(contract.horizonDays), metricKey: clean(contract.metric && contract.metric.key),
      metricLabel: display(contract.metric && contract.metric.label), metricUnit: clean(contract.metric && contract.metric.unit),
      metricProvider: clean(contract.metric && contract.metric.provider), metricSourceUrl: safeURL(contract.metric && contract.metric.sourceUrl),
      observationId: clean(contract.metric && contract.metric.observationId), resolutionRule: display(contract.resolutionRule)
    });
  }
  function persistTrade(position, nextAccount) {
    var previousPositions = null, previousAccount = null;
    try {
      previousPositions = root.localStorage.getItem(POSITION_KEY);
      previousAccount = root.localStorage.getItem(ACCOUNT_KEY);
      var positions = listPositions();
      positions.unshift(position);
      root.localStorage.setItem(POSITION_KEY, JSON.stringify(positions.slice(0, 200)));
      root.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(nextAccount));
      return true;
    } catch (error) {
      try {
        if (previousPositions == null) root.localStorage.removeItem(POSITION_KEY); else root.localStorage.setItem(POSITION_KEY, previousPositions);
        if (previousAccount == null) root.localStorage.removeItem(ACCOUNT_KEY); else root.localStorage.setItem(ACCOUNT_KEY, previousAccount);
      } catch (rollbackError) {}
      return false;
    }
  }
  function recordPosition() {
    var math = ticketMath();
    if (!math || !state.ticket || !state.ticket.ack) return;
    var account = readAccount();
    if (math.amount > account.cash) {
      state.ticket.error = 'Amount exceeds available paper cash of ' + formatMoney(account.cash) + '.';
      renderContent();
      return;
    }
    var kind = state.ticket.kind, row = math.row, id = subjectId(kind, row), now = new Date().toISOString(), contract = math.contract;
    var contractObservationId = clean(contract.metric && contract.metric.observationId);
    var receipt = {
      schemaVersion: POSITION_SCHEMA,
      id: 'trade_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      receiptId: 'SIM-' + Date.now().toString(36).toUpperCase(),
      subjectId: id,
      subjectKind: kind,
      personId: personId(subjectPerson(kind, row)),
      contentId: kind === 'content' ? contentId(row) : '',
      subjectSnapshot: positionSnapshot(kind, row),
      contractId: clean(contract.id),
      contractObservationId: contractObservationId,
      contractSnapshot: contractSnapshot(contract),
      observationIds: Array.from(new Set([contractObservationId].concat(validMetrics(subjectMetrics(kind, row)).map(function (metric) { return clean(metric.id); })).filter(Boolean))),
      modelId: clean(math.sim.modelVersion || math.sim.methodology),
      modelBucket: clean(math.sim.bucket),
      modelFingerprint: [clean(contract.id), clean(math.sim.modelVersion || math.sim.methodology), clean(math.sim.bucket), math.sim.supportPriceCents].join(':'),
      side: state.ticket.side,
      supportPriceCents: math.sim.supportPriceCents,
      priceCents: math.price,
      quote: { side: state.ticket.side, priceCents: math.price, supportPriceCents: math.sim.supportPriceCents, bucket: clean(math.sim.bucket) },
      quantity: math.quantity,
      cost: math.amount,
      maxLoss: math.maxLoss,
      estimatedPayout: math.estimatedPayout,
      profitIfCorrect: math.profitIfCorrect,
      status: 'OPEN_SIMULATION',
      isSimulation: true,
      createdAt: now,
      proposalHref: draftURL(kind, row)
    };
    var nextAccount = { schemaVersion: ACCOUNT_SCHEMA, startingCash: account.startingCash || STARTING_CASH, cash: Math.round((account.cash - math.amount) * 100) / 100, updatedAt: now };
    receipt.paperCashAfter = nextAccount.cash;
    if (!persistTrade(receipt, nextAccount)) { toast('Simulated trade could not be saved'); return; }
    state.ticket = null;
    state.receipt = receipt;
    rememberInterest(kind, row, 'simulated_trade');
    analytics('market_position_started', { subject_id: id, subject_type: kind, side: receipt.side, amount: receipt.cost, source: 'trades' });
    renderContent();
  }
  function proposalRoute(id) { root.location.href = 'backermarket.html?draft=' + encodeURIComponent(id) + '&source=trades'; }
  function editProposalRoute(id) { root.location.href = 'backercreate.html?edit=' + encodeURIComponent(id) + '&source=trades#draft'; }
  function finishProposalRemoval(id) { if (state.proposalId === id) state.proposalId = ''; state.pendingDeleteId = ''; writeURL(); renderContent(); toast('Local proposal deleted'); }
  function removeProposal(id) {
    var store = root.BackerMarketDraftStore;
    if (!store || typeof store.remove !== 'function') { toast('Proposal storage is not ready'); return; }
    try {
      var result = store.remove(id);
      if (result && typeof result.then === 'function') { result.then(function (value) { if (!value || value.ok !== false) finishProposalRemoval(id); else toast(value.message || 'Proposal was not deleted'); }); return; }
      if (result && result.ok === false) { toast(result.message || 'Proposal was not deleted'); return; }
      finishProposalRemoval(id);
    } catch (error) { toast('Proposal was not deleted'); }
  }
  function switchView(view) {
    if (VIEW_VALUES.indexOf(view) < 0) return;
    state.view = view; state.proposalId = ''; state.pendingDeleteId = ''; state.query = ''; state.provider = 'all'; state.metric = 'all'; state.sort = 'personalized'; state.page = 1; state.ticket = null; state.receipt = null; state.routeSubjectId = ''; state.routeSide = ''; state.routeHandled = ''; state.routeMissing = false;
    writeURL(); renderContent();
  }
  function clearRouteSubject() {
    state.routeSubjectId = '';
    state.routeSide = '';
    state.routeHandled = '';
    state.routeMissing = false;
  }
  function openDraft(kind, id) {
    var row = lookupSubject(kind, id);
    if (!row) return;
    rememberInterest(kind, row, 'drafted');
    analytics('market_draft_started', { subject_id: id, subject_type: kind, source: 'trades' });
    root.location.href = draftURL(kind, row);
  }
  function onClick(event) {
    var target = event.target.closest('button, a');
    if (!target) {
      if (event.target.hasAttribute && event.target.hasAttribute('data-ticket-backdrop')) closeTicket();
      return;
    }
    var view = target.getAttribute('data-trades-view');
    if (view) { event.preventDefault(); switchView(view); return; }
    var pageAction = target.getAttribute('data-trades-page');
    if (pageAction) {
      clearRouteSubject();
      state.page = Math.max(1, state.page + (pageAction === 'previous' ? -1 : 1));
      writeURL(); renderContent(); return;
    }
    if (target.hasAttribute('data-trades-more')) { clearRouteSubject(); state.page += 1; writeURL(); renderContent(); return; }
    if (target.hasAttribute('data-clear-trades-filters')) { clearRouteSubject(); state.query = ''; state.provider = 'all'; state.metric = 'all'; state.sort = 'personalized'; state.page = 1; writeURL(); renderContent(); return; }
    if (target.hasAttribute('data-reset-personalization')) { resetPersonalization(); return; }
    if (target.hasAttribute('data-trades-retry')) { ensureCatalog(true).catch(function () {}); return; }
    var watchId = target.getAttribute('data-mkt-watch');
    if (watchId) { toggleWatch(watchId); return; }
    var workWatchId = target.getAttribute('data-mkt-watch-work');
    if (workWatchId) { toggleWorkWatch(workWatchId); return; }
    if (target.hasAttribute('data-mkt-source-open')) {
      var sourceCard = target.closest('[data-mkt-subject-kind]');
      if (sourceCard) {
        var sourceKind = sourceCard.getAttribute('data-mkt-subject-kind');
        var sourceRow = lookupSubject(sourceKind, sourceCard.getAttribute('data-mkt-subject-id'));
        if (sourceRow) rememberInterest(sourceKind, sourceRow, 'source_opened');
      }
      return;
    }
    var tradeSide = target.getAttribute('data-mkt-trade');
    if (tradeSide) { openTicket(target.getAttribute('data-subject-kind'), target.getAttribute('data-subject-id'), tradeSide); return; }
    if (target.hasAttribute('data-mkt-draft')) { event.preventDefault(); openDraft(target.getAttribute('data-subject-kind'), target.getAttribute('data-subject-id')); return; }
    if (target.hasAttribute('data-ticket-close')) { closeTicket(); return; }
    if (target.hasAttribute('data-ticket-confirm')) { recordPosition(); return; }
    var proposalReview = target.getAttribute('data-proposal-review');
    if (proposalReview) { proposalRoute(proposalReview); return; }
    var proposalEdit = target.getAttribute('data-proposal-edit');
    if (proposalEdit) { editProposalRoute(proposalEdit); return; }
    var proposalDelete = target.getAttribute('data-proposal-delete');
    if (proposalDelete) { state.pendingDeleteId = proposalDelete; renderContent(); return; }
    if (target.hasAttribute('data-proposal-delete-cancel')) { state.pendingDeleteId = ''; renderContent(); return; }
    var proposalConfirm = target.getAttribute('data-proposal-delete-confirm');
    if (proposalConfirm) removeProposal(proposalConfirm);
  }
  function onChange(event) {
    if (event.target.matches('[data-trades-provider]')) { clearRouteSubject(); state.provider = event.target.value || 'all'; state.page = 1; writeURL(); renderContent(); return; }
    if (event.target.matches('[data-trades-metric]')) { clearRouteSubject(); state.metric = event.target.value || 'all'; state.page = 1; writeURL(); renderContent(); return; }
    if (event.target.matches('[data-trades-sort]')) { clearRouteSubject(); state.sort = event.target.value || 'personalized'; state.page = 1; writeURL(); renderContent(); return; }
    if (event.target.matches('[data-trades-page-input]')) { clearRouteSubject(); state.page = Math.max(1, Math.floor(number(event.target.value) || 1)); writeURL(); renderContent(); return; }
    if (event.target.matches('[data-ticket-ack]')) {
      if (state.ticket) state.ticket.ack = event.target.checked;
      var confirm = mountedRoot.querySelector('[data-ticket-confirm]'), math = ticketMath();
      if (confirm) confirm.disabled = !event.target.checked || !math || math.amount > readAccount().cash;
    }
  }
  function onInput(event) {
    if (event.target.matches('[data-trades-query]')) {
      clearRouteSubject(); state.query = event.target.value; state.page = 1; writeURL(); renderContent();
      var input = mountedRoot.querySelector('[data-trades-query]'); if (input) { input.focus(); input.setSelectionRange(state.query.length, state.query.length); }
      return;
    }
    if (event.target.matches('[data-ticket-amount]') && state.ticket) {
      state.ticket.amount = event.target.value;
      state.ticket.error = '';
      var math = ticketMath(), quantity = mountedRoot.querySelector('[data-ticket-quantity]'), loss = mountedRoot.querySelector('[data-ticket-loss]');
      var payout = mountedRoot.querySelector('[data-ticket-payout]'), profit = mountedRoot.querySelector('[data-ticket-profit]');
      if (math && quantity) quantity.textContent = formatNumber(math.quantity);
      if (math && loss) loss.textContent = formatMoney(math.maxLoss);
      if (math && payout) payout.textContent = formatMoney(math.estimatedPayout);
      if (math && profit) profit.textContent = formatMoney(math.profitIfCorrect);
      var canAfford = math && math.amount <= readAccount().cash;
      var confirm = mountedRoot.querySelector('[data-ticket-confirm]');
      if (confirm) confirm.disabled = !state.ticket.ack || !canAfford;
      var error = mountedRoot.querySelector('[data-ticket-error]');
      if (error) { error.hidden = canAfford; error.textContent = canAfford ? '' : 'Amount exceeds available paper cash.'; }
    }
  }
  function onKeydown(event) {
    if (!(state.ticket || state.receipt)) return;
    if (event.key === 'Escape') { event.preventDefault(); closeTicket(); return; }
    if (event.key !== 'Tab') return;
    var dialog = mountedRoot && mountedRoot.querySelector('.mkt-ticket');
    if (!dialog) return;
    var focusable = Array.prototype.filter.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'), function (node) {
      return node.getAttribute('aria-hidden') !== 'true';
    });
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length - 1], active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (active === last || !dialog.contains(active))) { event.preventDefault(); first.focus(); }
  }
  function onMediaError(event) {
    var image = event.target;
    if (!image.matches || !image.matches('[data-mkt-media]')) return;
    var media = image.closest('.mkt-card-media, .mkt-proposal-visual');
    if (media) { media.classList.remove('has-media'); media.classList.add('is-image-fallback'); }
    image.remove();
  }
  function render(target) {
    mountedRoot = target;
    var timing = performanceState();
    timing.renderRequestedAt = performanceNow();
    performanceMark('backer-trades:render-requested');
    readURL();
    if (!mountedRoot.dataset.tradesBound) {
      mountedRoot.dataset.tradesBound = 'true';
      mountedRoot.addEventListener('click', onClick);
      mountedRoot.addEventListener('change', onChange);
      mountedRoot.addEventListener('input', onInput);
      mountedRoot.addEventListener('keydown', onKeydown);
      mountedRoot.addEventListener('error', onMediaError, true);
    }
    renderContent();
    ensureCatalog(false).catch(function () {});
  }

  root.BackerTradesPositions = { schemaVersion: POSITION_SCHEMA, storageKey: POSITION_KEY, list: listPositions };
  root.BackerTradesAccount = { schemaVersion: ACCOUNT_SCHEMA, storageKey: ACCOUNT_KEY, startingCash: STARTING_CASH, read: readAccount };
  root.BackerTradesRoutes = { subjectURL: tradesURL };
  root.BackerMarket = { render: render, positions: root.BackerTradesPositions };
})(window);
