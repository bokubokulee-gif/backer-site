/* =========================================================
   BACKER MARKET 2
   People-first discovery, evidence, and market eligibility.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'backer_market2_watch_v1';
  var INSTRUMENTS = [
    { id: 'milestones', label: 'Milestones', terminal: 'milestone', description: 'A rule-defined target with a fixed measurement source and deadline.' },
    { id: 'pk_market', label: 'PK Market', terminal: 'pk', description: 'A comparable, mutually exclusive market between creator outcomes.' },
    { id: 'creator_arena', label: 'Creator Arena', terminal: 'pk', description: 'A people-first comparison view whose executable layer is PK Market.' },
    { id: 'creator_perps', label: 'Creator Perps', terminal: 'perps', description: 'Continuous simulated exposure to a separate creator attention index.' }
  ];
  var PLATFORM_LABELS = { x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub' };
  var PLATFORM_MARKS = { x: 'X', youtube: 'YT', instagram: 'IG', github: 'GH' };
  var CONFIDENCE_ORDER = { high: 4, medium: 3, low: 2, insufficient: 1, unavailable: 0 };
  var root = null;
  var DATA = null;
  var searchTimer = null;
  var state = {
    view: 'radar',
    range: '7d',
    platforms: [],
    quick: [],
    sort: 'attention',
    selectedId: '',
    instrument: 'milestones',
    query: '',
    drawer: false,
    category: [],
    eligibility: 'all',
    confidence: 'all',
    peerId: '',
    watched: [],
    dataMode: '',
    loadingResolved: false
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function display(value) {
    return String(value == null ? '' : value).replace(/[\u2013\u2014]/g, ' - ');
  }

  function readable(value, fallback) {
    if (Array.isArray(value)) {
      var rows = value.map(function (item) { return readable(item, ''); }).filter(Boolean);
      return rows.length ? rows.join(' ') : (fallback || '');
    }
    if (value && typeof value === 'object') return value.label || value.copy || value.reason || value.status || fallback || '';
    return value == null || value === '' ? (fallback || '') : String(value);
  }

  function safeURL(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    try {
      var url = new URL(raw, window.location.href);
      return /^(https?:|\/)/.test(url.protocol === 'http:' || url.protocol === 'https:' ? url.href : raw) ? raw : '';
    } catch (e) { return ''; }
  }

  function people() {
    return DATA && Array.isArray(DATA.people) ? DATA.people : [];
  }

  function personById(id) {
    return people().filter(function (person) { return person.id === id; })[0] || null;
  }

  function selectedPerson() {
    return personById(state.selectedId) || people()[0] || null;
  }

  function evidenceFor(person) {
    if (!person || !person.evidence) return {};
    return person.evidence[state.range] || person.evidence[DATA.defaultWindow] || person.evidence['7d'] || {};
  }

  function instrumentFor(person) {
    return INSTRUMENTS.filter(function (item) { return item.id === state.instrument; })[0] || INSTRUMENTS[0];
  }

  function instrumentData(person, id) {
    return person && person.instruments && person.instruments[id] ? person.instruments[id] : {};
  }

  function initials(name) {
    return String(name || 'B').split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
  }

  function formatDate(value, withTime) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'Time not retained';
    try {
      return new Intl.DateTimeFormat('en-US', withTime ? {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
      } : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
    } catch (e) { return date.toISOString().slice(0, 10); }
  }

  function domainLabel(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return 'Source'; }
  }

  function platformIds(person) {
    return (person && Array.isArray(person.platforms) ? person.platforms : []).map(function (platform) {
      return typeof platform === 'string' ? platform : platform.id;
    }).filter(Boolean);
  }

  function isEligible(person) {
    return Boolean(person && person.eligibility === 'eligible');
  }

  function isResolved(person) {
    if (!person || !person.instruments) return false;
    return Object.keys(person.instruments).some(function (key) {
      return person.instruments[key] && person.instruments[key].status === 'resolved';
    });
  }

  function confidenceValue(person) {
    var evidence = evidenceFor(person);
    var value = evidence.confidence || (person.poa && person.poa.confidence) || 'unavailable';
    if (typeof value === 'object') value = value.label || value.grade || 'unavailable';
    value = String(value || 'unavailable').toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function humanState(value) {
    var key = String(value || '').toLowerCase();
    if (key === 'partial_coverage' || key === 'partial-coverage') return 'Partial';
    if (key === 'permission_required' || key === 'permission-required') return 'Permission required';
    if (key === 'empty_window' || key === 'empty-window') return 'No range data';
    if (key === 'snapshot') return 'Retained snapshot';
    if (key === 'live') return 'Live';
    return key ? key.replace(/[_-]+/g, ' ').replace(/^./, function (letter) { return letter.toUpperCase(); }) : 'Retained';
  }

  function shortSignal(evidence) {
    var providerRank = evidence && evidence.providerRank;
    if (providerRank !== null && providerRank !== undefined && providerRank !== '' && Number.isFinite(Number(providerRank))) {
      return '#' + providerRank + ' native';
    }
    var stateLabel = humanState(evidence && evidence.state);
    return stateLabel === 'Partial' ? 'Observed' : stateLabel;
  }

  function confidenceRank(person) {
    return CONFIDENCE_ORDER[confidenceValue(person).toLowerCase()] || 0;
  }

  function nativeRank(person, fallback) {
    var evidence = evidenceFor(person);
    var value = evidence.providerRank || evidence.nativeRank || person.providerRank;
    if (Number.isFinite(Number(value))) return Number(value);
    var label = String(evidence.label || '');
    var match = label.match(/#?(\d+)/);
    return match ? Number(match[1]) : fallback + 100;
  }

  function loadWatched() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      state.watched = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) { state.watched = []; }
  }

  function saveWatched() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.watched)); } catch (e) {}
  }

  function isWatched(id) {
    return state.watched.indexOf(id) >= 0;
  }

  function toggleWatch(id) {
    if (!id) return;
    var index = state.watched.indexOf(id);
    if (index >= 0) state.watched.splice(index, 1);
    else state.watched.push(id);
    saveWatched();
    track('market_filter_changed', { filter: 'watch', value: index >= 0 ? 'removed' : 'added', state: id, source: 'market2' });
  }

  function parseHash() {
    var parts = String(location.hash || '').split('?');
    if (parts[0] !== '#market2') return;
    var params = new URLSearchParams(parts.slice(1).join('?'));
    if (['markets', 'radar', 'resolved'].indexOf(params.get('view')) >= 0) state.view = params.get('view');
    if (['24h', '7d', '30d', '90d'].indexOf(params.get('range')) >= 0) state.range = params.get('range');
    if (params.get('platforms')) state.platforms = params.get('platforms').split(',').filter(function (id) { return PLATFORM_LABELS[id]; });
    if (params.get('quick')) state.quick = params.get('quick').split(',').filter(Boolean);
    if (params.get('sort')) state.sort = params.get('sort');
    if (params.get('person')) state.selectedId = params.get('person');
    if (INSTRUMENTS.some(function (item) { return item.id === params.get('instrument'); })) state.instrument = params.get('instrument');
    if (params.get('categories')) state.category = params.get('categories').split(',').filter(Boolean);
    if (params.get('eligibility')) state.eligibility = params.get('eligibility');
    if (params.get('confidence')) state.confidence = params.get('confidence');
    if (params.get('peer')) state.peerId = params.get('peer');
    state.dataMode = params.get('data') || '';
  }

  function stateURL() {
    var params = new URLSearchParams();
    params.set('view', state.view);
    params.set('range', state.range);
    if (state.platforms.length) params.set('platforms', state.platforms.join(','));
    if (state.quick.length) params.set('quick', state.quick.join(','));
    params.set('sort', state.sort);
    if (state.selectedId) params.set('person', state.selectedId);
    params.set('instrument', state.instrument);
    if (state.category.length) params.set('categories', state.category.join(','));
    if (state.eligibility !== 'all') params.set('eligibility', state.eligibility);
    if (state.confidence !== 'all') params.set('confidence', state.confidence);
    if (state.peerId) params.set('peer', state.peerId);
    if (state.dataMode) params.set('data', state.dataMode);
    return location.origin + location.pathname + '#market2?' + params.toString();
  }

  function syncHash() {
    try {
      var url = stateURL().replace(location.origin, '');
      history.replaceState(null, '', url);
    } catch (e) {}
  }

  function track(event, props) {
    try {
      props = props || {};
      if (window.BackerAnalytics) window.BackerAnalytics.track(event, props);
      window.dispatchEvent(new CustomEvent('backer:track', { detail: { event: event, props: props } }));
    } catch (e) {}
  }

  function toast(copy, kind) {
    if (window.__backerToast) window.__backerToast(copy, kind);
  }

  function matchesQuick(person) {
    if (state.quick.indexOf('open') >= 0 && !isEligible(person)) return false;
    if (state.quick.indexOf('claimed') >= 0 && person.claimStatus !== 'claimed') return false;
    if (state.quick.indexOf('medium') >= 0 && confidenceRank(person) < CONFIDENCE_ORDER.medium) return false;
    if (state.quick.indexOf('under100k') >= 0) {
      var size = Number(person.audienceSize || person.followers || 0);
      if (!size || size >= 100000) return false;
    }
    if (state.quick.indexOf('ending30') >= 0) {
      var ending = Object.keys(person.instruments || {}).some(function (key) {
        return Number(person.instruments[key] && person.instruments[key].daysToClose) > 0 && Number(person.instruments[key].daysToClose) < 30;
      });
      if (!ending) return false;
    }
    return true;
  }

  function filteredPeople() {
    if (state.dataMode === 'empty') return [];
    var query = state.query.toLowerCase().trim();
    var list = people().filter(function (person) {
      if (state.view === 'markets' && !isEligible(person)) return false;
      if (state.view === 'radar' && isResolved(person)) return false;
      if (state.view === 'resolved' && !isResolved(person)) return false;
      var ids = platformIds(person);
      if (state.platforms.length && !state.platforms.some(function (id) { return ids.indexOf(id) >= 0; })) return false;
      if (state.category.length && state.category.indexOf(person.category) < 0) return false;
      if (state.eligibility === 'eligible' && !isEligible(person)) return false;
      if (state.eligibility === 'discovery_only' && isEligible(person)) return false;
      if (state.confidence !== 'all' && confidenceValue(person).toLowerCase() !== state.confidence) return false;
      if (!matchesQuick(person)) return false;
      if (query) {
        var work = [person.recentWork, person.breakoutWork].map(function (item) { return item && item.title; }).filter(Boolean).join(' ');
        var haystack = [person.name, person.handle, person.category, person.bio, work, ids.join(' ')].join(' ').toLowerCase();
        if (haystack.indexOf(query) < 0) return false;
      }
      return true;
    });

    return list.map(function (person, index) { return { person: person, index: index }; }).sort(function (a, b) {
      if (state.sort === 'native') return nativeRank(a.person, a.index) - nativeRank(b.person, b.index);
      if (state.sort === 'watched') return Number(isWatched(b.person.id)) - Number(isWatched(a.person.id));
      if (state.sort === 'evidence') return confidenceRank(b.person) - confidenceRank(a.person);
      if (state.sort === 'newest') return Date.parse((b.person.recentWork || {}).publishedAt || 0) - Date.parse((a.person.recentWork || {}).publishedAt || 0);
      if (state.sort === 'risk') return String((a.person.poa || {}).risk || '').localeCompare(String((b.person.poa || {}).risk || ''));
      return nativeRank(a.person, a.index) - nativeRank(b.person, b.index);
    }).map(function (entry) { return entry.person; });
  }

  function avatarHTML(person, className, eager) {
    var src = safeURL(person && person.avatar);
    var name = display(person && person.name);
    var typeClass = className === 'is-row' ? 'm2-person-avatar' : className === 'is-hero' ? 'm2-dossier-avatar' : className === 'is-ticket' ? 'm2-ticket-avatar' : className === 'is-arena' ? 'm2-arena-avatar' : className === 'is-mobile' ? 'm2-mobile-avatar' : 'm2-avatar';
    return '<span class="' + typeClass + ' ' + esc(className || '') + '">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(name) + ' profile" loading="' + (eager ? 'eager' : 'lazy') + '" referrerpolicy="no-referrer" />' : '') +
      '<span class="m2-avatar-fallback" aria-hidden="true">' + esc(initials(name)) + '</span></span>';
  }

  function platformMarks(person, links) {
    return (person.platforms || []).map(function (platform) {
      var item = typeof platform === 'string' ? { id: platform } : platform;
      var label = PLATFORM_LABELS[item.id] || item.id;
      var mark = '<span class="m2-platform-mark is-' + esc(item.id) + '" title="' + esc(label) + '">' + esc(PLATFORM_MARKS[item.id] || label.slice(0, 2)) + '</span>';
      if (links && safeURL(item.url)) return '<a class="m2-platform-link m2-profile-link" href="' + esc(item.url) + '" target="_blank" rel="noreferrer">' + mark + '<span>' + esc(display(item.handle || label)) + '</span></a>';
      return mark;
    }).join('');
  }

  function watchButton(person, compact) {
    var watched = isWatched(person.id);
    return '<button class="m2-watch ' + (compact ? 'm2-watch-small is-compact' : 'm2-secondary-button') + (watched ? ' is-active' : '') + '" type="button" data-m2-watch="' + esc(person.id) + '" aria-pressed="' + watched + '"><span aria-hidden="true">' + (watched ? '●' : '+') + '</span>' + (watched ? 'Watching' : 'Watch') + '</button>';
  }

  function statusBadge(person) {
    if (isEligible(person)) return '<span class="m2-status m2-eligibility-label is-eligible"><i></i>Eligible market</span>';
    return '<span class="m2-status m2-eligibility-label is-discovery"><i></i>Discovery only</span>';
  }

  function viewCounts() {
    return {
      markets: people().filter(isEligible).length,
      radar: people().filter(function (person) { return !isResolved(person); }).length,
      resolved: people().filter(isResolved).length
    };
  }

  function commandHTML() {
    var counts = viewCounts();
    return '<header class="m2-command">' +
      '<div class="m2-command-brand m2-command-copy"><span class="m2-eyebrow m2-kicker">Backer people market</span><h1>People gaining attention</h1><p>Follow the work. Read the proof. Then decide whether to take a position.</p></div>' +
      '<div class="m2-command-actions m2-command-side"><label class="m2-search"><span class="m2-visually-hidden">Search people and work</span><input id="m2Search" type="search" value="' + esc(state.query) + '" placeholder="Search people, handles, or work" autocomplete="off" /><kbd>/</kbd></label><div class="m2-command-links m2-command-nav"><button type="button" data-m2-show-watched>Your People <b>' + state.watched.length + '</b></button><a href="portfolio.html">Portfolio</a></div></div>' +
      '<nav class="m2-view-tabs" aria-label="Market views">' +
        [['markets', 'Markets'], ['radar', 'Creator Radar'], ['resolved', 'Resolved']].map(function (item) {
          return '<button type="button" data-m2-view="' + item[0] + '" class="' + (state.view === item[0] ? 'is-active' : '') + '" aria-pressed="' + (state.view === item[0]) + '">' + item[1] + ' <span>' + counts[item[0]] + '</span></button>';
        }).join('') +
      '</nav></header>';
  }

  function filterHTML() {
    var quick = [
      ['open', 'Open'], ['ending30', 'Ending <30d'], ['under100k', 'Under 100K'], ['medium', 'Medium+ evidence'], ['claimed', 'Claimed creators']
    ];
    return '<section class="m2-filterbar" aria-label="Marketplace filters">' +
      '<div class="m2-filter-scroll m2-filter-secondary"><div class="m2-segment m2-window-filters" aria-label="Signals observed">' +
        ['24h', '7d', '30d', '90d'].map(function (range) { return '<button type="button" data-m2-range="' + range + '" class="' + (state.range === range ? 'is-active' : '') + '" aria-pressed="' + (state.range === range) + '">' + range.toUpperCase() + '</button>'; }).join('') +
      '</div><span class="m2-filter-divider"></span><div class="m2-platform-filters" aria-label="Platforms">' +
        Object.keys(PLATFORM_LABELS).map(function (id) { var active = state.platforms.indexOf(id) >= 0; return '<button type="button" data-m2-platform="' + id + '" class="' + (active ? 'is-active' : '') + '" aria-pressed="' + active + '">' + PLATFORM_LABELS[id] + '</button>'; }).join('') +
      '</div><span class="m2-filter-divider"></span><div class="m2-quick-filters">' +
        quick.map(function (item) { var active = state.quick.indexOf(item[0]) >= 0; return '<button type="button" data-m2-quick="' + item[0] + '" class="' + (active ? 'is-active' : '') + '" aria-pressed="' + active + '">' + item[1] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="m2-filter-actions"><button class="m2-filter-button" type="button" data-m2-filters><span aria-hidden="true">☷</span>Filters' + (state.category.length || state.eligibility !== 'all' || state.confidence !== 'all' ? '<b></b>' : '') + '</button><label class="m2-sort"><span>Sort</span><select data-m2-sort><option value="attention"' + (state.sort === 'attention' ? ' selected' : '') + '>Attention movement</option><option value="native"' + (state.sort === 'native' ? ' selected' : '') + '>Platform-native rank</option><option value="watched"' + (state.sort === 'watched' ? ' selected' : '') + '>Most watched</option><option value="evidence"' + (state.sort === 'evidence' ? ' selected' : '') + '>Highest evidence</option><option value="newest"' + (state.sort === 'newest' ? ' selected' : '') + '>Newest work</option><option value="risk"' + (state.sort === 'risk' ? ' selected' : '') + '>Lowest risk</option></select></label><button class="m2-share m2-share-button" type="button" data-m2-share>Share</button></div>' +
    '</section>';
  }

  function bannerHTML() {
    if (state.dataMode === 'error') return '<div class="m2-banner m2-state-banner is-error" role="status"><b>Provider refresh failed.</b><span>The retained launch snapshot stays visible with its original timestamps.</span><button type="button" data-m2-retry>Retry</button></div>';
    if (state.dataMode === 'stale' || (DATA && DATA.status === 'stale')) return '<div class="m2-banner m2-state-banner is-warning" role="status"><b>Data delayed.</b><span>Last-good evidence remains visible. No timestamps are made to look fresh.</span></div>';
    if (DATA && DATA.isSnapshot) return '<div class="m2-banner m2-state-banner" role="status"><b>Real public launch snapshot.</b><span>Profiles and work link to original sources. Trading remains gated by creator verification.</span><time>' + esc(formatDate(DATA.generatedAt, true)) + '</time></div>';
    return '';
  }

  function skeletonHTML() {
    return '<div class="m2-workspace is-loading" aria-busy="true"><aside class="m2-people"><div class="m2-panel-head"><span class="m2-skeleton is-title"></span></div>' + new Array(6).fill('<span class="m2-skeleton is-row"></span>').join('') + '</aside><main class="m2-dossier"><span class="m2-skeleton is-hero"></span><span class="m2-skeleton is-copy"></span><span class="m2-skeleton is-work"></span></main><aside class="m2-right"><span class="m2-skeleton is-ticket"></span><span class="m2-skeleton is-rail"></span></aside></div>';
  }

  function peopleHTML(list) {
    var selected = selectedPerson();
    var sourceText = DATA && DATA.notice ? DATA.notice : 'Source timestamps remain attached to every profile.';
    if (!list.length) {
      return '<aside class="m2-people"><div class="m2-panel-head m2-pane-head"><div><span class="m2-panel-kicker m2-kicker">Signals observed</span><h2>No matching people</h2></div><span class="m2-pane-count">0</span></div><div class="m2-list-empty m2-empty"><div class="m2-empty-inner"><h3>' + (state.view === 'markets' ? 'No verified markets in this snapshot.' : 'No one matches these filters.') + '</h3><p>' + (state.view === 'markets' ? 'Public discovery does not automatically create a tradable market.' : 'Try another platform, time window, or filter.') + '</p><button class="m2-primary-button" type="button" data-m2-open-radar>' + (state.view === 'markets' ? 'Open Creator Radar' : 'Clear filters') + '</button></div></div></aside>';
    }
    return '<aside class="m2-people" aria-labelledby="m2PeopleTitle"><div class="m2-panel-head m2-pane-head"><div><span class="m2-panel-kicker m2-kicker">Signals observed · ' + state.range.toUpperCase() + '</span><h2 id="m2PeopleTitle">People gaining attention</h2></div><span class="m2-pane-count">' + list.length + '</span></div><p class="m2-source-line m2-list-provenance">' + esc(display(sourceText)) + '</p><div class="m2-person-list">' + list.map(function (person, index) {
      var evidence = evidenceFor(person);
      var active = selected && selected.id === person.id;
      var reason = evidence.whyNow || evidence.label || 'Public work is gaining attention on a retained source.';
      var signal = shortSignal(evidence);
      return '<article class="m2-person-row' + (active ? ' is-selected' : '') + '" aria-selected="' + active + '"><button type="button" class="m2-person-select m2-person-button" data-m2-select="' + esc(person.id) + '" aria-pressed="' + active + '">' + avatarHTML(person, 'is-row', index < 5) + '<span class="m2-person-copy"><span class="m2-person-name-line"><span class="m2-person-name">' + esc(display(person.name)) + '</span><span class="m2-person-handle">' + esc(display(person.handle)) + '</span></span><span class="m2-person-field">' + esc(display(person.category)) + '</span><span class="m2-person-why">' + esc(display(reason)) + '</span><span class="m2-person-platforms">' + platformMarks(person, false) + '</span></span><span class="m2-person-signal m2-row-side"><b class="m2-movement">' + esc(display(signal)) + '</b><small class="m2-rank-label">' + esc(display(confidenceValue(person))) + ' evidence</small></span></button><div class="m2-person-foot">' + watchButton(person, true) + '</div></article>';
    }).join('') + '</div></aside>';
  }

  function workHTML(person, work, label) {
    work = work || {};
    var url = safeURL(work.url || work.sourceUrl);
    var thumb = safeURL(work.thumbnail || person.avatar);
    var platform = PLATFORM_LABELS[work.platform] || work.platform || 'Public source';
    var title = display(work.title || 'Work link retained on the source platform');
    return '<article class="m2-work-card' + (label === 'Breakout work' ? ' is-breakout' : '') + '"><a href="' + esc(url || '#') + '"' + (url ? ' target="_blank" rel="noreferrer"' : ' aria-disabled="true"') + ' class="m2-work-media">' + (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />' : '') + '<span class="m2-work-fallback">' + esc(initials(person.name)) + '</span><span class="m2-work-play" aria-hidden="true">↗</span></a><div class="m2-work-copy m2-work-body"><div class="m2-work-top m2-work-meta"><span>' + esc(label) + '</span><b class="m2-work-platform is-' + esc(work.platform || '') + '">' + esc(platform) + '</b></div><h4><a href="' + esc(url || '#') + '"' + (url ? ' target="_blank" rel="noreferrer"' : '') + '>' + esc(title) + '</a></h4><p>' + esc(display(work.providerLabel || work.type || 'Public work')) + '</p><div class="m2-work-source"><time>' + esc(formatDate(work.publishedAt, false)) + '</time><span>Observed ' + esc(formatDate(work.observedAt || work.publishedAt, false)) + '</span></div></div></article>';
  }

  function proofHTML(person) {
    var evidence = evidenceFor(person);
    var poa = person.poa || {};
    var urls = [].concat(evidence.sourceUrls || [], poa.sourceUrls || []).filter(Boolean).filter(function (url, index, all) { return all.indexOf(url) === index; });
    var facts = [
      ['Public evidence', readable(poa.publicEvidence, evidence.whyNow || 'Public source evidence is retained with its timestamp.')],
      ['Backer interpretation', readable(poa.backerInterpretation, 'Backer interpretation is kept separate from provider-native ordering.')],
      ['Executable market', readable(poa.executableMarket, isEligible(person) ? 'Instrument approval is recorded separately.' : 'No market. Discovery does not imply consent or eligibility.')],
      ['Settlement', readable(poa.settlement, 'Only written market rules and a named oracle can settle a contract.')]
    ];
    return '<section class="m2-poa-section" aria-labelledby="m2ProofTitle"><div class="m2-section-head"><div><span class="m2-panel-kicker m2-kicker">Proof before exposure</span><h3 id="m2ProofTitle">Proof of Attention</h3></div><button class="m2-text-button" type="button" data-m2-proof>Read methodology</button></div><div class="m2-proof m2-poa-panel"><div class="m2-poa-summary"><div class="m2-poa-score"><strong>' + esc(display(confidenceValue(person))) + '</strong><span>Evidence confidence</span><small>Not a market price, probability, or settlement oracle.</small></div><div class="m2-poa-interpretation"><h4>Evidence stays attached to the person and the work.</h4><p>' + esc(display(poa.backerInterpretation || 'Backer interpretation is kept separate from provider-native ordering and contract pricing.')) + '</p></div></div><div class="m2-poa-layers">' + facts.map(function (fact) { return '<div class="m2-poa-layer"><small>' + fact[0] + '</small><strong>' + esc(display(fact[1])) + '</strong><span>Source boundary retained</span></div>'; }).join('') + '</div><dl class="m2-evidence-grid"><div class="m2-evidence-row"><dt>Coverage</dt><dd>' + esc(evidence.coverageGaps ? 'Gaps disclosed' : humanState(evidence.state)) + '</dd></div><div class="m2-evidence-row"><dt>Snapshot</dt><dd>' + esc(formatDate(evidence.asOf || poa.asOf || DATA.generatedAt, false)) + '</dd></div><div class="m2-evidence-row"><dt>Market status</dt><dd>' + (isEligible(person) ? 'Eligible' : 'Discovery only') + '</dd></div><div class="m2-evidence-row"><dt>Method</dt><dd>' + esc(display(poa.methodologyVersion || (DATA.methodology && DATA.methodology.version) || 'Source-specific')) + '</dd></div></dl>' + (urls.length ? '<div class="m2-source-links"><span>Original sources</span>' + urls.slice(0, 6).map(function (url) { return '<a href="' + esc(url) + '" target="_blank" rel="noreferrer">' + esc(domainLabel(url)) + ' ↗</a>'; }).join('') + '</div>' : '') + (evidence.coverageGaps ? '<p class="m2-coverage-gaps">' + esc(display(evidence.coverageGaps)) + '</p>' : '') + '</div></section>';
  }

  function arenaHTML(person) {
    var candidates = people().filter(function (candidate) { return candidate.id !== person.id; });
    var peer = personById(state.peerId) || candidates[0] || null;
    if (peer && state.peerId !== peer.id) state.peerId = peer.id;
    if (!peer) return '';
    var firstEvidence = evidenceFor(person);
    var peerEvidence = evidenceFor(peer);
    function arenaPerson(side, canSelect) {
      var evidence = evidenceFor(side);
      return '<article class="m2-arena-creator">' + avatarHTML(side, 'is-arena', false) + '<div><h3>' + esc(display(side.name)) + '</h3><p>' + esc(display(evidence.whyNow || evidence.label || 'Public evidence retained.')) + '</p><span class="m2-person-platforms">' + platformMarks(side, false) + '</span>' + (canSelect ? '<select class="m2-arena-select" data-m2-peer aria-label="Compare with another person">' + candidates.map(function (candidate) { return '<option value="' + esc(candidate.id) + '"' + (candidate.id === peer.id ? ' selected' : '') + '>' + esc(display(candidate.name)) + '</option>'; }).join('') + '</select>' : '') + '</div></article>';
    }
    return '<section class="m2-arena"><div class="m2-arena-head"><div><span class="m2-panel-kicker m2-kicker">Creator Arena</span><h2>Compare people, not vanity totals</h2></div><p>A friendly research view. The executable layer uses PK Market only after both sides and the measurement rules are approved.</p></div><div class="m2-arena-stage">' + arenaPerson(person, false) + '<div class="m2-arena-versus">PERSON<br />VS<br />PERSON</div>' + arenaPerson(peer, true) + '<div class="m2-arena-question"><div><small>PK Market readiness</small><strong>' + (isEligible(person) && isEligible(peer) ? 'Both people have an eligible market path.' : 'Comparison is open. Trading remains gated by creator verification.') + '</strong></div><button class="m2-primary-button" type="button" data-m2-jump-ticket>' + (isEligible(person) && isEligible(peer) ? 'Open PK Market' : 'Watch both people') + '</button></div></div><div class="m2-arena-comparison"><div>Signal</div><div>' + esc(display(firstEvidence.label || 'Observed')) + '</div><div>' + esc(display(peerEvidence.label || 'Observed')) + '</div><div>Evidence</div><div><strong>' + esc(display(confidenceValue(person))) + '</strong></div><div><strong>' + esc(display(confidenceValue(peer))) + '</strong></div><div>Latest work</div><div>' + esc(display((person.recentWork || {}).title || 'Source link')) + '</div><div>' + esc(display((peer.recentWork || {}).title || 'Source link')) + '</div><div>Market</div><div>' + (isEligible(person) ? 'Eligible' : 'Discovery only') + '</div><div>' + (isEligible(peer) ? 'Eligible' : 'Discovery only') + '</div></div></section>';
  }

  function dossierHTML(person) {
    if (!person) return '<main class="m2-dossier"><div class="m2-list-empty"><b>Select a person to begin.</b></div></main>';
    var evidence = evidenceFor(person);
    var why = evidence.whyNow || evidence.label || 'Public work is gaining attention on its source platform.';
    var showArena = state.instrument === 'creator_arena';
    return '<main class="m2-dossier" aria-labelledby="m2DossierTitle"><section class="m2-dossier-hero">' + avatarHTML(person, 'is-hero', true) + '<div class="m2-identity"><p class="m2-identity-handle">' + esc(display(person.handle)) + ' · ' + esc(display(person.category)) + '</p><h2 id="m2DossierTitle">' + esc(display(person.name)) + '</h2><p class="m2-identity-description">' + esc(display(person.bio)) + '</p><div class="m2-profile-links">' + platformMarks(person, true) + statusBadge(person) + '<span class="m2-claim-label">' + esc(display(person.claimStatus || 'unclaimed')) + '</span></div><div class="m2-dossier-actions">' + watchButton(person, false) + '<button class="m2-secondary-button" type="button" data-m2-compare="' + esc(person.id) + '">Compare</button><button class="m2-primary-button" type="button" data-m2-jump-ticket>' + (isEligible(person) ? 'Trade' : 'Market status') + '</button></div></div></section><section class="m2-why m2-why-now"><span class="m2-panel-kicker">Why attention is moving · ' + state.range.toUpperCase() + '</span><div><p>' + esc(display(why)) + '</p><div class="m2-why-meta"><span>' + esc(display(evidence.label || 'Public signal')) + '</span><time>As of ' + esc(formatDate(evidence.asOf || DATA.generatedAt, true)) + '</time></div></div></section><section class="m2-attention-metrics"><div class="m2-metric"><small>Native signal</small><strong>' + esc(shortSignal(evidence)) + '</strong><span>Provider-supplied or source-specific</span></div><div class="m2-metric"><small>Evidence confidence</small><strong>' + esc(display(confidenceValue(person))) + '</strong><span>Not a probability</span></div><div class="m2-metric"><small>Coverage</small><strong>' + esc(humanState(evidence.state)) + '</strong><span>' + (evidence.coverageGaps ? 'Gaps disclosed' : 'Source boundary retained') + '</span></div><div class="m2-metric"><small>Market status</small><strong>' + (isEligible(person) ? 'Eligible' : 'Watch only') + '</strong><span>Consent and review gated</span></div></section><section class="m2-work m2-work-section"><div class="m2-section-head"><div><span class="m2-panel-kicker m2-kicker">The work behind the movement</span><h3>Recent and breakout work</h3></div><p>Original links, provider labels, and observed times.</p></div><div class="m2-work-grid">' + workHTML(person, person.recentWork, 'Latest work') + workHTML(person, person.breakoutWork, 'Breakout work') + '</div></section>' + proofHTML(person) + (showArena ? arenaHTML(person) : '') + '</main>';
  }

  function ticketHTML(person) {
    var instrument = instrumentFor(person);
    var terms = instrumentData(person, instrument.id);
    var available = isEligible(person) && ['open', 'eligible'].indexOf(terms.status) >= 0;
    var termCopy = terms.description || terms.copy || terms.reason || instrument.description;
    var terminalHref = 'backermarket.html?market=' + encodeURIComponent(person.id) + '&creator=' + encodeURIComponent(person.id) + '&instrument=' + encodeURIComponent(instrument.terminal) + '&source=market2';
    return '<section class="m2-ticket m2-trade-ticket" id="m2Ticket" aria-labelledby="m2TicketTitle"><header class="m2-ticket-head"><span>Position builder</span>' + statusBadge(person) + '</header><div class="m2-ticket-person">' + avatarHTML(person, 'is-ticket', false) + '<div><b id="m2TicketTitle">' + esc(display(person.name)) + '</b><small>' + esc(display(person.handle)) + '</small></div></div><div class="m2-instruments m2-instrument-tabs" role="tablist" aria-label="Market instruments">' + INSTRUMENTS.map(function (item) { return '<button type="button" role="tab" data-m2-instrument="' + item.id + '" class="' + (state.instrument === item.id ? 'is-active' : '') + '" aria-selected="' + (state.instrument === item.id) + '">' + item.label + '</button>'; }).join('') + '</div><p class="m2-ticket-prompt">' + (available ? esc(display(terms.title || 'Approved market terms')) : esc(instrument.label + ' is not open yet')) + '</p><p class="m2-ticket-question">' + esc(display(termCopy)) + '</p>' + (available ? '<div class="m2-field"><label for="m2Amount">Simulated stake</label><div class="m2-amount-wrap"><span>$</span><input id="m2Amount" type="number" min="1" value="25" inputmode="decimal" /></div></div><dl class="m2-ticket-summary"><div><dt>Last trade</dt><dd>' + esc(display(terms.lastTrade || 'See terminal')) + '</dd></div><div><dt>Closes</dt><dd>' + esc(display(terms.closeLabel || 'See rules')) + '</dd></div><div><dt>Evidence</dt><dd>' + esc(display(confidenceValue(person))) + '</dd></div></dl><div class="m2-ticket-actions"><a class="m2-primary-button" href="' + esc(terminalHref) + '">Open full terminal <span>↗</span></a></div>' : '<div class="m2-gate m2-eligibility-boundary"><h3>Creator verification required</h3><p>Public discovery can be watched and researched. Trading opens only after claim, consent, identity checks, and instrument review.</p></div><dl class="m2-ticket-summary"><div><dt>Signals observed</dt><dd>' + state.range.toUpperCase() + '</dd></div><div><dt>Market closes</dt><dd>Not scheduled</dd></div><div><dt>Current action</dt><dd>Watch and research</dd></div></dl><div class="m2-ticket-actions">' + watchButton(person, false) + '</div>') + '<p class="m2-ticket-disclosure">Attention evidence provides context. It is not a price, probability, settlement source, or creator consent.</p></section>';
  }

  function providerRisks() {
    var status = DATA && DATA.providerStatus ? DATA.providerStatus : {};
    var items = Object.keys(status).map(function (id) {
      var value = status[id] || {};
      return { id: id, label: PLATFORM_LABELS[id] || id, state: value.state || value.status || 'snapshot', copy: value.detail || value.label || 'Launch snapshot retained.' };
    }).filter(function (item) { return item.state !== 'operational' && item.state !== 'ready'; });
    return items;
  }

  function railList(list, type) {
    return list.slice(0, 3).map(function (person, index) {
      var evidence = evidenceFor(person);
      return '<button class="m2-rail-row" type="button" data-m2-select="' + esc(person.id) + '"><span class="m2-rail-rank">0' + (index + 1) + '</span><span class="m2-rail-person"><b>' + esc(display(person.name)) + '</b><small>' + esc(display(type === 'mover' ? evidence.label || 'Public movement' : evidence.whyNow || evidence.label || 'Observed')) + '</small></span><span class="m2-rail-value">' + esc(display(evidence.providerRank ? '#' + evidence.providerRank : confidenceValue(person))) + '<small>' + (evidence.providerRank ? 'native' : 'evidence') + '</small></span></button>';
    }).join('');
  }

  function rightRailHTML(person, list) {
    var risks = providerRisks();
    var watchedPeople = people().filter(function (candidate) { return isWatched(candidate.id); });
    var positions = 0;
    try { positions = JSON.parse(localStorage.getItem('backer_portfolio_v1') || '[]').length || 0; } catch (e) {}
    return '<aside class="m2-right" aria-label="Market and intelligence">' + ticketHTML(person) + '<div class="m2-intelligence"><section class="m2-rail-card m2-rail-module m2-your-market"><div class="m2-rail-head m2-module-head"><h3>Your market</h3></div><p class="m2-module-copy"><b>' + watchedPeople.length + '</b> watched people · <b>' + positions + '</b> simulated positions.</p><div class="m2-watch-stack">' + watchedPeople.slice(0, 4).map(function (candidate) { return avatarHTML(candidate, 'is-stack', false); }).join('') + '</div><div class="m2-module-links"><a class="m2-module-link" href="portfolio.html">View portfolio →</a></div></section><section class="m2-rail-card m2-rail-module"><div class="m2-rail-head m2-module-head"><h3>Backer AI Pulse</h3><span>ⓘ sourced</span></div><ul class="m2-pulse-list m2-ai-bullets"><li><b>' + list.length + ' people</b> match this ' + state.range.toUpperCase() + ' source view.</li><li>Provider-native ordering stays separate from market prices and Backer interpretation.</li><li>' + (isEligible(person) ? 'The selected person has an approved market path.' : 'The selected person is research and Watch only until verification.') + '</li></ul><p class="m2-module-copy">Updated at retained snapshot · ' + esc(formatDate(DATA.generatedAt, true)) + '</p></section><section class="m2-rail-card m2-rail-module"><div class="m2-rail-head m2-module-head"><h3>Trending</h3><span>ⓘ ' + state.range.toUpperCase() + '</span></div><div class="m2-rail-list">' + railList(list, 'trend') + '</div><div class="m2-module-links"><button class="m2-module-link" type="button" data-m2-scroll-people>View all →</button></div></section><section class="m2-rail-card m2-rail-module"><div class="m2-rail-head m2-module-head"><h3>Top movers</h3><span>Native signals</span></div><div class="m2-rail-list">' + railList(list.slice().reverse(), 'mover') + '</div><div class="m2-module-links"><button class="m2-module-link" type="button" data-m2-scroll-people>View all →</button></div></section><section class="m2-rail-card m2-rail-module m2-risk is-risk"><div class="m2-rail-head m2-module-head"><h3>Risk watch</h3></div>' + (risks.length ? '<div class="m2-rail-list">' + risks.slice(0, 3).map(function (risk) { return '<div class="m2-rail-row is-risk"><span class="m2-rail-rank">!</span><span class="m2-rail-person"><b>' + esc(risk.label) + '</b><small>' + esc(display(risk.copy)) + '</small></span></div>'; }).join('') + '</div>' : '<p class="m2-module-copy">All retained provider states are disclosed at the snapshot level.</p>') + '<div class="m2-module-links"><button class="m2-module-link" type="button" data-m2-proof>View methodology →</button></div></section><section class="m2-rail-card m2-rail-module m2-more"><div class="m2-rail-head m2-module-head"><h3>More</h3></div><div class="m2-module-links"><button class="m2-module-link" type="button" data-m2-view="markets">Open markets (' + viewCounts().markets + ')</button><button class="m2-module-link" type="button" data-m2-view="radar">Creator Radar (' + viewCounts().radar + ')</button><a class="m2-module-link" href="docs/MARKETPLACE_MARKET2_PRD.md">Marketplace principles</a><a class="m2-module-link" href="backerdemo.html#market">Classic market</a></div></section></div></aside>';
  }

  function drawerHTML() {
    if (!state.drawer) return '';
    var categories = people().map(function (person) { return person.category; }).filter(function (value, index, all) { return value && all.indexOf(value) === index; }).sort();
    return '<div class="m2-drawer-backdrop is-open" aria-hidden="false" data-m2-drawer-backdrop><section class="m2-filter-drawer" role="dialog" aria-modal="true" aria-labelledby="m2DrawerTitle"><header class="m2-drawer-head"><div><span class="m2-panel-kicker m2-kicker">Refine the people view</span><h2 id="m2DrawerTitle">Filters</h2></div><button class="m2-drawer-close" type="button" data-m2-close-drawer aria-label="Close filters">×</button></header><div class="m2-drawer-body"><fieldset class="m2-filter-group"><legend>Platform</legend>' + Object.keys(PLATFORM_LABELS).map(function (id) { return '<label><input type="checkbox" data-m2-drawer-platform="' + id + '"' + (state.platforms.indexOf(id) >= 0 ? ' checked' : '') + ' /><span>' + PLATFORM_LABELS[id] + '</span></label>'; }).join('') + '</fieldset><fieldset class="m2-filter-group"><legend>Creator category</legend>' + categories.map(function (category) { return '<label><input type="checkbox" data-m2-category="' + esc(category) + '"' + (state.category.indexOf(category) >= 0 ? ' checked' : '') + ' /><span>' + esc(display(category)) + '</span></label>'; }).join('') + '</fieldset><fieldset class="m2-filter-group"><legend>Trading eligibility</legend><label><input type="radio" name="m2Eligibility" value="all" data-m2-eligibility' + (state.eligibility === 'all' ? ' checked' : '') + ' /><span>All people</span></label><label><input type="radio" name="m2Eligibility" value="eligible" data-m2-eligibility' + (state.eligibility === 'eligible' ? ' checked' : '') + ' /><span>Eligible markets</span></label><label><input type="radio" name="m2Eligibility" value="discovery_only" data-m2-eligibility' + (state.eligibility === 'discovery_only' ? ' checked' : '') + ' /><span>Discovery only</span></label></fieldset><fieldset class="m2-filter-group"><legend>Evidence confidence</legend>' + ['all', 'high', 'medium', 'low', 'insufficient'].map(function (value) { return '<label><input type="radio" name="m2Confidence" value="' + value + '" data-m2-confidence' + (state.confidence === value ? ' checked' : '') + ' /><span>' + (value === 'all' ? 'All grades' : value.charAt(0).toUpperCase() + value.slice(1)) + '</span></label>'; }).join('') + '</fieldset></div><footer class="m2-drawer-footer"><button class="m2-clear-button" type="button" data-m2-clear-drawer>Clear all</button><button class="m2-primary-button" type="button" data-m2-apply-drawer>Show people</button></footer></section></div>';
  }

  function mobileTicketHTML(person) {
    var label = instrumentFor(person).label;
    return '<div class="m2-mobile-ticket">' + avatarHTML(person, 'is-mobile', false) + '<span class="m2-mobile-copy"><b>' + esc(display(person.name)) + '</b><small>' + esc(label) + '</small></span><button class="m2-primary-button" type="button" data-m2-jump-ticket>' + (isEligible(person) ? 'Trade' : 'Watch') + '</button></div>';
  }

  function methodologyHTML() {
    return '<footer class="m2-method" id="m2Method"><div><span class="m2-panel-kicker m2-kicker">How this view stays trustworthy</span><h2>Discovery, evidence, and trading are separate states.</h2><p>Backer links to original public work, labels snapshot freshness, preserves provider-native restrictions, and never treats a public profile as consent to trade.</p><a class="m2-text-button" href="docs/MARKETPLACE_MARKET2_PRD.md">Read the full product requirements →</a></div><dl><div><dt>People</dt><dd>Real public profiles and original work links</dd></div><div><dt>Evidence</dt><dd>Source-specific, dated, and policy-aware</dd></div><div><dt>Markets</dt><dd>Claimed, verified, and instrument-approved only</dd></div></dl></footer>';
  }

  function bindImageFallbacks() {
    root.querySelectorAll('.m2-avatar img, .m2-work-media img').forEach(function (image) {
      function fail() { if (image.parentElement) image.parentElement.classList.add('has-image-error', 'is-image-fallback'); }
      image.addEventListener('error', fail, { once: true });
      if (image.complete && !image.naturalWidth) fail();
    });
  }

  function ensureSelection(list) {
    if (!list.length) return;
    if (!list.some(function (person) { return person.id === state.selectedId; })) state.selectedId = list[0].id;
    if (!state.peerId || state.peerId === state.selectedId || !personById(state.peerId)) {
      var peer = people().filter(function (person) { return person.id !== state.selectedId; })[0];
      state.peerId = peer ? peer.id : '';
    }
  }

  function draw(focusSearch) {
    if (!root || !DATA) return;
    document.body.classList.toggle('mkt2-drawer-open', state.drawer);
    var list = filteredPeople();
    ensureSelection(list);
    var person = selectedPerson();
    var loading = state.dataMode === 'loading' && !state.loadingResolved;
    root.innerHTML = '<div class="market2-shell">' + commandHTML() + filterHTML() + bannerHTML() + (loading ? skeletonHTML() : '<div class="m2-workspace">' + peopleHTML(list) + dossierHTML(person) + rightRailHTML(person, list.length ? list : people()) + '</div>') + methodologyHTML() + drawerHTML() + (person ? mobileTicketHTML(person) : '') + '</div>';
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    bindImageFallbacks();
    syncHash();
    if (focusSearch) {
      var input = document.getElementById('m2Search');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }
    if (state.drawer) {
      var close = root.querySelector('[data-m2-close-drawer]');
      if (close) close.focus();
    }
    if (loading) {
      window.setTimeout(function () { state.loadingResolved = true; draw(false); }, 900);
    }
  }

  function toggleInArray(array, value) {
    var index = array.indexOf(value);
    if (index >= 0) array.splice(index, 1);
    else array.push(value);
  }

  function clickHandler(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var el;
    if ((el = target.closest('[data-m2-select]'))) {
      state.selectedId = el.getAttribute('data-m2-select');
      draw(false);
      track('market_card_opened', { creator_id: state.selectedId, source: 'market2' });
      return;
    }
    if ((el = target.closest('[data-m2-view]'))) {
      state.view = el.getAttribute('data-m2-view');
      draw(false);
      return;
    }
    if ((el = target.closest('[data-m2-range]'))) {
      state.range = el.getAttribute('data-m2-range');
      draw(false);
      track('market_filter_changed', { filter: 'range', value: state.range, state: state.view, source: 'market2' });
      return;
    }
    if ((el = target.closest('[data-m2-platform]'))) {
      toggleInArray(state.platforms, el.getAttribute('data-m2-platform'));
      draw(false);
      return;
    }
    if ((el = target.closest('[data-m2-quick]'))) {
      toggleInArray(state.quick, el.getAttribute('data-m2-quick'));
      draw(false);
      return;
    }
    if ((el = target.closest('[data-m2-watch]'))) {
      var id = el.getAttribute('data-m2-watch');
      toggleWatch(id);
      draw(false);
      toast(isWatched(id) ? 'Added to Your People' : 'Removed from Your People');
      return;
    }
    if ((el = target.closest('[data-m2-instrument]'))) {
      state.instrument = el.getAttribute('data-m2-instrument');
      draw(false);
      track('market_instrument_changed', { instrument: state.instrument });
      return;
    }
    if (target.closest('[data-m2-filters]')) { state.drawer = true; draw(false); return; }
    if (target.closest('[data-m2-close-drawer]') || target.matches('[data-m2-drawer-backdrop]')) { state.drawer = false; draw(false); return; }
    if (target.closest('[data-m2-apply-drawer]')) { state.drawer = false; draw(false); return; }
    if (target.closest('[data-m2-clear-drawer]')) {
      state.platforms = []; state.category = []; state.eligibility = 'all'; state.confidence = 'all'; draw(false); return;
    }
    if (target.closest('[data-m2-open-radar]')) {
      if (state.view === 'markets') state.view = 'radar';
      state.platforms = []; state.quick = []; state.category = []; state.eligibility = 'all'; state.confidence = 'all'; state.query = ''; draw(false); return;
    }
    if (target.closest('[data-m2-share]')) {
      var url = stateURL();
      try { navigator.clipboard.writeText(url); toast('Marketplace link copied'); }
      catch (e) { toast('Share link is ready'); }
      return;
    }
    if (target.closest('[data-m2-jump-ticket]')) {
      var ticket = document.getElementById('m2Ticket');
      if (ticket) ticket.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (target.closest('[data-m2-compare]')) {
      state.instrument = 'creator_arena';
      draw(false);
      var arena = root.querySelector('.m2-arena');
      if (arena) arena.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (target.closest('[data-m2-proof]')) {
      var method = document.getElementById('m2Method');
      if (method) method.scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('market_poa_opened', { creator_id: state.selectedId, source: 'market2' });
      return;
    }
    if (target.closest('[data-m2-scroll-people]')) {
      var panel = root.querySelector('.m2-people');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (target.closest('[data-m2-show-watched]')) {
      state.sort = 'watched';
      state.query = '';
      draw(false);
      return;
    }
    if (target.closest('[data-m2-retry]')) {
      state.dataMode = '';
      draw(false);
    }
  }

  function inputHandler(event) {
    var target = event.target;
    if (target.id === 'm2Search') {
      window.clearTimeout(searchTimer);
      state.query = target.value;
      searchTimer = window.setTimeout(function () { draw(true); }, 100);
    }
  }

  function changeHandler(event) {
    var target = event.target;
    if (target.matches('[data-m2-sort]')) { state.sort = target.value; draw(false); track('market_sort_changed', { sort: state.sort, source: 'market2' }); return; }
    if (target.matches('[data-m2-peer]')) { state.peerId = target.value; draw(false); return; }
    if (target.matches('[data-m2-drawer-platform]')) { toggleInArray(state.platforms, target.getAttribute('data-m2-drawer-platform')); return; }
    if (target.matches('[data-m2-category]')) { toggleInArray(state.category, target.getAttribute('data-m2-category')); return; }
    if (target.matches('[data-m2-eligibility]')) { state.eligibility = target.value; return; }
    if (target.matches('[data-m2-confidence]')) { state.confidence = target.value; }
  }

  function keyHandler(event) {
    if (event.key === '/' && !/input|textarea|select/i.test((event.target || {}).tagName || '')) {
      var search = document.getElementById('m2Search');
      if (search) { event.preventDefault(); search.focus(); }
    }
    if (event.key === 'Escape' && state.drawer) { state.drawer = false; draw(false); }
  }

  function render(app) {
    DATA = window.BACKER_MARKET2_DATA || window.BackerMarket2Data;
    root = app;
    document.title = 'People gaining attention | Backer Market';
    if (!DATA || !Array.isArray(DATA.people)) {
      app.innerHTML = '<div class="m2-fatal" role="alert"><b>Creator data unavailable.</b><span>The retained marketplace snapshot did not load. Refresh to reconnect.</span></div>';
      return;
    }
    loadWatched();
    parseHash();
    if (!state.selectedId || !personById(state.selectedId)) state.selectedId = people()[0] ? people()[0].id : '';
    if (!app.dataset.market2Bound) {
      app.addEventListener('click', clickHandler);
      app.addEventListener('input', inputHandler);
      app.addEventListener('change', changeHandler);
      document.addEventListener('keydown', keyHandler);
      app.dataset.market2Bound = 'true';
    }
    draw(false);
    track('market_home_viewed', { source: 'market2' });
  }

  window.BackerMarket2 = { render: render, stateURL: stateURL };
})();
