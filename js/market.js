/* Backer Trades
   Approved demo simulations and device-local discovery proposals remain
   deliberately separate. Public discovery records never become contracts here. */
(function (root) {
  'use strict';

  var B = root.BACKER || {};
  var M = root.BACKER_MKT || {};
  var VIEW_VALUES = ['open', 'proposals', 'resolved'];
  var WATCH_KEY = 'backer_watchlist_v1';
  var DISCOVERY_WATCH_KEY = 'backer_market2_watch_v1';
  var DISCOVERY_INTEREST_KEY = 'backer_discovery_interest_v1';
  var POSITION_KEY = 'backer_portfolio_v1';
  var PAGE_SIZE = 12;
  var mountedRoot = null;
  var state = {
    view: 'open',
    query: '',
    category: 'all',
    sort: 'personalized',
    window: M.DEFAULT_WINDOW || '7d',
    shown: PAGE_SIZE,
    proposalId: '',
    pendingDeleteId: ''
  };

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function display(value) { return clean(value).replace(/[\u2013\u2014]/g, ' - '); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function number(value) {
    var parsed = Number(value);
    return value === '' || value == null || !isFinite(parsed) ? null : parsed;
  }
  function fmt(value) {
    var parsed = number(value);
    if (parsed == null) return display(value) || 'Not set';
    if (typeof B.fmt === 'function') return B.fmt(parsed);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(parsed);
  }
  function money(value) {
    var parsed = number(value) || 0;
    if (typeof B.money === 'function') return B.money(parsed);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parsed);
  }
  function humanDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return display(value) || 'Not set';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, root.location && root.location.href ? root.location.href : 'https://backer.invalid/');
      return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
    } catch (error) { return ''; }
  }
  function safeImage(value) { return safeURL(value) || 'img/backer-mark.png?v=2'; }
  function initials(value) {
    var parts = display(value).split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'B';
  }
  function platformLabel(value) {
    var id = clean(value).toLowerCase();
    var known = { x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub', dev: 'DEV', twitch: 'Twitch', linkedin: 'LinkedIn', medium: 'Medium', substack: 'Substack', rss: 'RSS', tiktok: 'TikTok', spotify: 'Spotify', soundcloud: 'SoundCloud', patreon: 'Patreon', kick: 'Kick', bilibili: 'Bilibili' };
    return known[id] || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) || 'Public source';
  }
  function analytics(event, props) {
    try { if (root.BackerAnalytics) root.BackerAnalytics.track(event, props || {}); } catch (error) {}
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
  function readSet(key) {
    return new Set(readArray(key).map(function (item) {
      return clean(item && typeof item === 'object' ? (item.id || item.creatorId || item.personId) : item);
    }).filter(Boolean));
  }
  function writeSet(key, set) {
    try { root.localStorage.setItem(key, JSON.stringify(Array.from(set))); return true; }
    catch (error) { return false; }
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

  function readURL() {
    var hash = clean(root.location && root.location.hash);
    var queryIndex = hash.indexOf('?');
    var params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
    var next = clean(params.get('view'));
    state.view = VIEW_VALUES.indexOf(next) >= 0 ? next : 'open';
    state.sort = state.view === 'resolved' ? 'activity' : 'personalized';
    state.proposalId = clean(params.get('proposal'));
    if (state.proposalId) state.view = 'proposals';
  }
  function writeURL() {
    var params = new URLSearchParams();
    if (state.view !== 'open') params.set('view', state.view);
    if (state.view === 'proposals' && state.proposalId) params.set('proposal', state.proposalId);
    var hash = '#trades' + (params.toString() ? '?' + params.toString() : '');
    try { root.history.replaceState(null, '', root.location.pathname + root.location.search + hash); } catch (error) {}
  }

  function fixturePlatform(contract) {
    var profile = contract && contract.mkt && array(contract.mkt.profiles)[0];
    var platform = profile && profile.plat;
    var row = typeof M.platById === 'function' ? M.platById(platform) : null;
    return row && row.name ? row.name : platformLabel(platform);
  }
  function fixtureCategory(contract) {
    var id = contract && contract.mkt && contract.mkt.cat;
    var row = typeof M.catById === 'function' ? M.catById(id) : null;
    return row && row.name ? row.name : platformLabel(id || 'Creator growth');
  }
  function openFixtures() {
    return array(M.CONTRACTS).filter(function (contract) {
      return contract && contract.contract && contract.mkt && (contract.mkt.state === 'OPEN' || contract.mkt.state === 'OPENING_SOON');
    });
  }
  function resolvedFixtures() {
    return array(M.CONTRACTS).filter(function (contract) {
      return contract && contract.contract && contract.mkt && contract.mkt.state === 'RESOLVED';
    });
  }

  function deviceSignals() {
    var watches = readSet(WATCH_KEY);
    var discoveryWatches = readSet(DISCOVERY_WATCH_KEY);
    var positions = readArray(POSITION_KEY);
    var proposals = proposalRows();
    var interests = readArray(DISCOVERY_INTEREST_KEY).filter(function (row) {
      return row && typeof row === 'object' && (clean(row.personId) || clean(row.provider) || clean(row.category));
    }).slice(0, 40);
    var positionIds = new Set();
    positions.forEach(function (position) {
      [position && position.id, position && position.marketId, position && position.creatorId, position && position.personId].forEach(function (value) {
        value = clean(value); if (value) positionIds.add(value);
      });
    });
    return { watches: watches, discoveryWatches: discoveryWatches, positionIds: positionIds, positionCount: positions.length, proposals: proposals, interests: interests };
  }
  function proposalSubjectTokens(rows) {
    var ids = new Set();
    var names = new Set();
    var platforms = new Set();
    rows.forEach(function (row) {
      var draft = row.draft || {};
      var person = draft.subject && draft.subject.person || {};
      var content = draft.subject && draft.subject.content || {};
      [person.id, content.id].forEach(function (value) { value = clean(value); if (value) ids.add(value.toLowerCase()); });
      [person.name, content.title].forEach(function (value) { value = clean(value); if (value) names.add(value.toLowerCase()); });
      var platform = clean(draft.resolution && draft.resolution.platform); if (platform) platforms.add(platform.toLowerCase());
    });
    return { ids: ids, names: names, platforms: platforms };
  }
  function personalizedFixtures(list) {
    var signals = deviceSignals();
    var subjects = proposalSubjectTokens(signals.proposals);
    var interestNames = new Set();
    var interestTerms = new Set();
    var interestPlatforms = new Set();
    var interestCategories = new Set();
    signals.interests.forEach(function (interest) {
      var name = clean(interest.personName).toLowerCase();
      var contentTitle = clean(interest.contentTitle).toLowerCase();
      var provider = clean(interest.provider).toLowerCase();
      var category = clean(interest.category).toLowerCase();
      if (name) { interestNames.add(name); interestTerms.add(name); }
      if (contentTitle) interestTerms.add(contentTitle);
      if (provider) interestPlatforms.add(provider);
      if (category) interestCategories.add(category);
    });
    var indexed = list.map(function (contract, index) {
      var score = 0;
      var id = clean(contract.id);
      var name = clean(contract.name).toLowerCase();
      var platforms = array(contract.mkt && contract.mkt.profiles).map(function (profile) { return clean(profile.plat).toLowerCase(); });
      var category = clean(contract.mkt && contract.mkt.cat).toLowerCase();
      var categoryLabel = clean(fixtureCategory(contract)).toLowerCase();
      var contractText = [name, clean(contract.contract && contract.contract.title).toLowerCase(), clean(contract.contract && contract.contract.source).toLowerCase()].join(' ');
      var freshMinutes = number(contract.contract && contract.contract.freshMin);
      if (signals.watches.has(id)) score += 10000;
      if (signals.positionIds.has(id) || signals.positionIds.has('ct-' + id)) score += 9000;
      if (subjects.ids.has(id.toLowerCase()) || subjects.names.has(name)) score += 8000;
      if (signals.discoveryWatches.has(id)) score += 7500;
      if (interestNames.has(name)) score += 7000;
      if (Array.from(interestTerms).some(function (term) { return term && contractText.indexOf(term) >= 0; })) score += 2500;
      if (platforms.some(function (platform) { return interestPlatforms.has(platform); })) score += 500;
      if ((category && interestCategories.has(category)) || Array.from(interestCategories).some(function (interestCategory) {
        return interestCategory && (categoryLabel.indexOf(interestCategory) >= 0 || interestCategory.indexOf(categoryLabel) >= 0);
      })) score += 350;
      if (platforms.some(function (platform) { return subjects.platforms.has(platform); })) score += 200;
      if (freshMinutes !== null) score += Math.max(0, 100 - Math.min(100, freshMinutes / 14.4));
      return { contract: contract, score: score, index: index };
    });
    indexed.sort(function (a, b) { return b.score - a.score || a.index - b.index || clean(a.contract.id).localeCompare(clean(b.contract.id)); });
    return { list: indexed.map(function (item) { return item.contract; }), signals: signals };
  }
  function personalizationCopy(signals) {
    var parts = [];
    if (signals.watches.size) parts.push(signals.watches.size + ' watched');
    if (signals.discoveryWatches.size) parts.push(signals.discoveryWatches.size + ' Discovery watch' + (signals.discoveryWatches.size === 1 ? '' : 'es'));
    if (signals.positionCount) parts.push(signals.positionCount + ' simulated position' + (signals.positionCount === 1 ? '' : 's'));
    if (signals.proposals.length) parts.push(signals.proposals.length + ' saved proposal' + (signals.proposals.length === 1 ? '' : 's'));
    var recentActions = signals.interests.filter(function (interest) { return clean(interest && interest.action) !== 'watched'; }).length;
    if (recentActions) parts.push(recentActions + ' recent Discovery action' + (recentActions === 1 ? '' : 's'));
    if (!parts.length) return 'Ordered by fixture evidence recency until you watch a subject, save a proposal, or open a simulated position.';
    return 'Ordered from ' + parts.join(', ') + '. Nothing leaves this device.';
  }

  function filteredFixtures(resolved) {
    var list = resolved ? resolvedFixtures() : openFixtures();
    var query = state.query.toLowerCase();
    if (query) list = list.filter(function (contract) {
      return [contract.name, contract.contract && contract.contract.title, fixturePlatform(contract), fixtureCategory(contract)].some(function (value) {
        return display(value).toLowerCase().indexOf(query) >= 0;
      });
    });
    if (state.category !== 'all') list = list.filter(function (contract) { return clean(contract.mkt && contract.mkt.cat) === state.category; });
    if (!resolved && state.sort === 'personalized') return personalizedFixtures(list);
    list = list.slice().sort(function (a, b) {
      if (state.sort === 'cutoff') return number(a.contract.closeDays) - number(b.contract.closeDays);
      if (state.sort === 'progress') return number(b.contract.progressPct) - number(a.contract.progressPct);
      if (state.sort === 'activity') return number(b.contract.simVol) - number(a.contract.simVol);
      return display(a.name).localeCompare(display(b.name));
    });
    return { list: list, signals: deviceSignals() };
  }

  function fixtureAvatar(contract) {
    var hue = number(contract.hue);
    if (hue == null) hue = 34;
    return '<span class="mkt-subject-avatar is-fixture" style="--mkt-hue:' + hue + '" aria-hidden="true">' + esc(initials(contract.name)) + '</span>';
  }
  function proposalVisual(draft) {
    var person = draft.subject && draft.subject.person || {};
    var content = draft.subject && draft.subject.content || null;
    var image = content && (content.thumbnail || content.image || content.avatar) || person.avatar || person.image;
    return '<img class="mkt-subject-avatar is-real" src="' + esc(safeImage(image)) + '" alt="" loading="lazy" decoding="async"/>';
  }
  function statusLabel(contract) {
    if (contract.mkt.state === 'OPEN') return 'Open simulation';
    if (contract.mkt.state === 'OPENING_SOON') return 'Opening soon';
    if (contract.mkt.state === 'RESOLVED') return contract.contract.outcome === 'HIT' ? 'Resolved: target reached' : 'Resolved: target not reached';
    return 'Approved demo fixture';
  }
  function sourceText(value) {
    return display(value).replace(/\s+-\s+independent resolution source$/i, '') || 'Public source metric';
  }

  function fixtureCard(contract, resolved) {
    var term = contract.contract;
    var isOpen = contract.mkt.state === 'OPEN';
    var cutoff = isOpen && term.closeLabel ? term.closeLabel : term.deadlineLabel;
    var action = resolved
      ? '<button type="button" class="mkt-button is-secondary" data-fixture-review="' + esc(contract.id) + '">View result</button>'
      : '<button type="button" class="mkt-button is-secondary" data-fixture-review="' + esc(contract.id) + '">Review contract</button>' +
        (isOpen ? '<button type="button" class="mkt-button is-primary" data-fixture-position="' + esc(contract.id) + '">Open simulated position</button>' : '');
    return '<article class="mkt-contract-card" data-market-card="' + esc(contract.id) + '">' +
      '<header class="mkt-subject">' + fixtureAvatar(contract) + '<div class="mkt-subject-copy"><span class="mkt-eyebrow">Approved demo fixture</span><h3>' + esc(display(contract.name)) + '</h3><p>' + esc(fixturePlatform(contract) + ' / ' + fixtureCategory(contract)) + '</p></div><span class="mkt-status">' + esc(statusLabel(contract)) + '</span></header>' +
      '<div class="mkt-claim"><span>People-growth milestone</span><h2>' + esc(display(term.title)) + '</h2></div>' +
      '<div class="mkt-number-grid" aria-label="Milestone terms"><div><span>Current</span><b>' + esc(term.curLabel) + '</b></div><div><span>Target</span><b>' + esc(term.tgtLabel) + '</b></div><div><span>Cutoff</span><b>' + esc(display(cutoff)) + '</b></div></div>' +
      '<div class="mkt-progress" aria-label="' + esc(term.progressPct + ' percent milestone progress') + '"><span><i style="width:' + Math.max(0, Math.min(100, number(term.progressPct) || 0)) + '%"></i></span><b>' + esc(term.progressPct) + '% progress</b></div>' +
      '<dl class="mkt-rules"><div><dt>Resolution source</dt><dd>' + esc(sourceText(term.source)) + '</dd></div><div><dt>Rule</dt><dd>Reaches the stated target by the cutoff using the named public metric.</dd></div></dl>' +
      '<footer class="mkt-card-footer"><div class="mkt-fixture-terms"><span><b>' + esc(term.mult) + 'x</b> fixed demo term</span><span><b>' + esc(money(term.simVol)) + '</b> simulated activity</span><span><b>' + esc(term.backers) + '</b> participants</span></div><div class="mkt-card-actions">' + action + '</div></footer>' +
    '</article>';
  }

  function proposalReviewState(draft) {
    var readiness = clean(draft.resolution && draft.resolution.readiness);
    return readiness === 'retained_observation' ? 'Source observation retained' : 'Unverified metric idea';
  }
  function proposalTitle(draft) {
    var subject = draft.subject || {};
    var content = subject.content;
    return content && content.title ? content.title : subject.person && subject.person.name ? subject.person.name : 'Saved subject';
  }
  function proposalPerson(draft) {
    var person = draft.subject && draft.subject.person;
    return person && person.name ? person.name : 'Public creator';
  }
  function proposalCard(row, expanded) {
    var draft = row.draft;
    var resolution = draft.resolution || {};
    var baseline = resolution.baseline || {};
    var target = resolution.target || {};
    var rules = draft.rules || {};
    var question = draft.outcome && draft.outcome.question || 'Creator-growth milestone proposal';
    var title = proposalTitle(draft);
    var contentByline = draft.subject && draft.subject.content ? 'Original work by ' + proposalPerson(draft) : 'Person growth';
    var isPendingDelete = state.pendingDeleteId === draft.draftId;
    var deleteControls = isPendingDelete
      ? '<span class="mkt-delete-confirm" role="group" aria-label="Confirm proposal deletion"><span>Delete this local proposal?</span><button type="button" class="mkt-button is-quiet" data-proposal-delete-cancel="' + esc(draft.draftId) + '">Cancel</button><button type="button" class="mkt-button is-danger" data-proposal-delete-confirm="' + esc(draft.draftId) + '">Delete</button></span>'
      : '<button type="button" class="mkt-button is-quiet" data-proposal-delete="' + esc(draft.draftId) + '">Delete</button>';
    var details = expanded ? '<div class="mkt-proposal-details"><h4>Resolution safeguards</h4><dl class="mkt-rules"><div><dt>Correction rule</dt><dd>' + esc(display(rules.correctionRule)) + '</dd></div><div><dt>Deletion rule</dt><dd>' + esc(display(rules.deletionRule)) + '</dd></div><div><dt>Review window</dt><dd>' + esc(fmt(rules.disputeHours)) + ' hours</dd></div><div><dt>Void rule</dt><dd>' + esc(display(rules.voidRule)) + '</dd></div></dl><p>Local proposal only. Review is required before any separate market approval.</p></div>' : '';
    return '<article class="mkt-proposal-card ' + (expanded ? 'is-expanded' : '') + '" id="proposal-' + esc(draft.draftId) + '">' +
      '<header class="mkt-subject">' + proposalVisual(draft) + '<div class="mkt-subject-copy"><span class="mkt-eyebrow">' + esc(contentByline) + '</span><h3>' + esc(display(title)) + '</h3><p>' + esc(platformLabel(resolution.platform) + ' / Local proposal') + '</p></div><span class="mkt-status is-proposal">Your proposal</span></header>' +
      '<div class="mkt-claim"><span>Future milestone</span><h2>' + esc(display(question)) + '</h2></div>' +
      '<div class="mkt-number-grid is-proposal" aria-label="Proposal terms"><div><span>Baseline</span><b>' + esc(fmt(baseline.value)) + '</b></div><div><span>Target</span><b>' + esc(fmt(target.value)) + '</b></div><div><span>Cutoff</span><b>' + esc(humanDate(resolution.deadline)) + '</b></div><div><span>Metric</span><b>' + esc(display(resolution.metricLabel || resolution.unit)) + '</b></div></div>' +
      '<dl class="mkt-rules"><div><dt>Resolution source</dt><dd><a href="' + esc(safeURL(resolution.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc(platformLabel(resolution.platform) + ' public source') + '</a></dd></div><div><dt>Review state</dt><dd>' + esc(proposalReviewState(draft)) + '</dd></div></dl>' +
      details +
      '<footer class="mkt-card-footer"><p class="mkt-local-note">' + esc(row.durable ? 'Saved on this device' : 'Saved for this tab only') + '. Not approved or priced.</p><div class="mkt-card-actions"><button type="button" class="mkt-button is-secondary" data-proposal-review="' + esc(draft.draftId) + '">Review proposal</button><button type="button" class="mkt-button is-quiet" data-proposal-edit="' + esc(draft.draftId) + '">Edit</button>' + deleteControls + '</div></footer>' +
    '</article>';
  }

  function categories() {
    var map = {};
    openFixtures().concat(resolvedFixtures()).forEach(function (contract) {
      var id = clean(contract.mkt && contract.mkt.cat);
      if (id) map[id] = fixtureCategory(contract);
    });
    return Object.keys(map).sort(function (a, b) { return map[a].localeCompare(map[b]); }).map(function (id) { return { id: id, label: map[id] }; });
  }
  function fixtureToolbar() {
    return '<div class="mkt-toolbar" aria-label="Trade filters"><label class="mkt-search"><span>Search simulations</span><input type="search" data-trades-query value="' + esc(state.query) + '" placeholder="Creator or milestone" autocomplete="off"/></label><label><span>Category</span><select data-trades-category><option value="all">All categories</option>' + categories().map(function (row) { return '<option value="' + esc(row.id) + '"' + (state.category === row.id ? ' selected' : '') + '>' + esc(row.label) + '</option>'; }).join('') + '</select></label><label><span>Order</span><select data-trades-sort>' + (state.view === 'resolved' ? '<option value="activity">Most activity</option><option value="name">Creator name</option>' : '<option value="personalized"' + (state.sort === 'personalized' ? ' selected' : '') + '>For you</option><option value="cutoff"' + (state.sort === 'cutoff' ? ' selected' : '') + '>Cutoff soonest</option><option value="progress"' + (state.sort === 'progress' ? ' selected' : '') + '>Closest to target</option><option value="activity"' + (state.sort === 'activity' ? ' selected' : '') + '>Most activity</option><option value="name"' + (state.sort === 'name' ? ' selected' : '') + '>Creator name</option>') + '</select></label></div>';
  }

  function tabButton(view, label, count) {
    return '<button type="button" role="tab" aria-selected="' + (state.view === view) + '" class="' + (state.view === view ? 'is-active' : '') + '" data-trades-view="' + view + '"><span>' + esc(label) + '</span><b>' + esc(count) + '</b></button>';
  }
  function headerHTML() {
    var proposalCount = proposalRows().length;
    return '<header class="mkt-header"><div><span class="mkt-kicker">Backer Trades</span><h1>People-growth simulations</h1><p>Review creator and content milestones without turning discovery records into approved markets.</p></div><div class="mkt-disclosure"><b>Demo simulations · no real money</b><span>Approved fixtures and your local proposals stay separate.</span></div></header>' +
      '<nav class="mkt-tabs" role="tablist" aria-label="Trades views">' + tabButton('open', 'Open simulations', openFixtures().length) + tabButton('proposals', 'Your proposals', proposalCount) + tabButton('resolved', 'Resolved', resolvedFixtures().length) + '</nav>';
  }
  function emptyHTML(kind) {
    if (kind === 'proposals') return '<section class="mkt-empty"><span class="mkt-eyebrow">Your proposals</span><h2>No proposals on this device</h2><p>Choose a real creator or original work in Discovery, then write a measurable future milestone.</p><a class="mkt-button is-primary" href="backerdemo.html#market2">Find a profile in Discovery</a></section>';
    return '<section class="mkt-empty"><span class="mkt-eyebrow">No matching simulations</span><h2>Try a broader search</h2><p>The approved fixture catalog has no result for the current search and category.</p><button type="button" class="mkt-button is-secondary" data-clear-trades-filters>Clear filters</button></section>';
  }
  function openViewHTML() {
    var result = filteredFixtures(false);
    var shown = result.list.slice(0, state.shown);
    return fixtureToolbar() + '<section class="mkt-personalization"><div><b>For you · on this device</b><p>' + esc(personalizationCopy(result.signals)) + '</p></div><a href="backerdemo.html#market2">Refine in Discovery</a></section>' +
      (shown.length ? '<div class="mkt-contract-grid">' + shown.map(function (contract) { return fixtureCard(contract, false); }).join('') + '</div>' : emptyHTML('fixtures')) +
      (result.list.length > shown.length ? '<div class="mkt-more"><button type="button" class="mkt-button is-secondary" data-trades-more>Show more</button><span>' + shown.length + ' of ' + result.list.length + ' simulations</span></div>' : '');
  }
  function proposalsViewHTML() {
    var rows = proposalRows();
    var selected = state.proposalId && proposalById(state.proposalId);
    if (state.proposalId && !selected) state.proposalId = '';
    if (!rows.length) return emptyHTML('proposals');
    return '<section class="mkt-section-head"><div><span class="mkt-eyebrow">Device-local inbox</span><h2>Your growth proposals</h2><p>These drafts are not approved markets and do not have a quote, stake, or payout.</p></div><a class="mkt-button is-secondary" href="backerdemo.html#market2">Draft from Discovery</a></section><div class="mkt-proposal-grid">' + rows.map(function (row) { return proposalCard(row, selected && selected.draft.draftId === row.draft.draftId); }).join('') + '</div>';
  }
  function resolvedViewHTML() {
    var result = filteredFixtures(true);
    var shown = result.list.slice(0, state.shown);
    return fixtureToolbar() + '<section class="mkt-section-head"><div><span class="mkt-eyebrow">Closed demo fixtures</span><h2>Resolved people-growth simulations</h2><p>Each result keeps its named milestone, cutoff, source, and rule visible.</p></div></section>' + (shown.length ? '<div class="mkt-contract-grid">' + shown.map(function (contract) { return fixtureCard(contract, true); }).join('') + '</div>' : emptyHTML('fixtures')) + (result.list.length > shown.length ? '<div class="mkt-more"><button type="button" class="mkt-button is-secondary" data-trades-more>Show more</button><span>' + shown.length + ' of ' + result.list.length + ' simulations</span></div>' : '');
  }
  function canvasHTML() {
    if (state.view === 'proposals') return proposalsViewHTML();
    if (state.view === 'resolved') return resolvedViewHTML();
    return openViewHTML();
  }
  function renderContent() {
    if (!mountedRoot) return;
    mountedRoot.innerHTML = '<div class="mkt">' + headerHTML() + '<main class="mkt-canvas" id="tradesPanel" role="tabpanel">' + canvasHTML() + '</main></div>';
    if (state.proposalId) {
      root.requestAnimationFrame(function () {
        var selected = document.getElementById('proposal-' + state.proposalId);
        if (selected) selected.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  function fixtureById(id) {
    return array(M.CONTRACTS).filter(function (contract) { return clean(contract.id) === clean(id); })[0] || null;
  }
  function fixtureRoute(id) {
    root.location.href = 'backermarket.html?market=' + encodeURIComponent(id) + '&source=trades';
  }
  function proposalRoute(id) {
    root.location.href = 'backermarket.html?draft=' + encodeURIComponent(id) + '&source=trades';
  }
  function editProposalRoute(id) {
    root.location.href = 'backercreate.html?edit=' + encodeURIComponent(id) + '&source=trades#draft';
  }
  function toggleWatch(id) {
    var set = readSet(WATCH_KEY);
    if (set.has(id)) set.delete(id); else set.add(id);
    if (!writeSet(WATCH_KEY, set)) { toast('Watch preference could not be saved'); return; }
    toast(set.has(id) ? 'Added to your device watchlist' : 'Removed from your device watchlist');
    renderContent();
  }
  function removeProposal(id) {
    var store = root.BackerMarketDraftStore;
    if (!store || typeof store.remove !== 'function') { toast('Proposal storage is not ready'); return; }
    try {
      var result = store.remove(id);
      if (result && typeof result.then === 'function') {
        result.then(function (value) { if (!value || value.ok !== false) finishProposalRemoval(id); else toast(value.message || 'Proposal was not deleted'); });
        return;
      }
      if (result && result.ok === false) { toast(result.message || 'Proposal was not deleted'); return; }
      finishProposalRemoval(id);
    } catch (error) { toast('Proposal was not deleted'); }
  }
  function finishProposalRemoval(id) {
    if (state.proposalId === id) state.proposalId = '';
    state.pendingDeleteId = '';
    writeURL();
    renderContent();
    toast('Local proposal deleted');
  }

  function onClick(event) {
    var target = event.target.closest('button, a');
    if (!target || !mountedRoot || !mountedRoot.contains(target)) return;
    var view = target.getAttribute('data-trades-view');
    if (view) {
      state.view = view;
      state.proposalId = '';
      state.pendingDeleteId = '';
      state.query = '';
      state.category = 'all';
      state.sort = view === 'resolved' ? 'activity' : 'personalized';
      state.shown = PAGE_SIZE;
      writeURL(); renderContent();
      return;
    }
    if (target.hasAttribute('data-trades-more')) { state.shown += PAGE_SIZE; renderContent(); return; }
    if (target.hasAttribute('data-clear-trades-filters')) { state.query = ''; state.category = 'all'; state.sort = state.view === 'resolved' ? 'activity' : 'personalized'; state.shown = PAGE_SIZE; renderContent(); return; }
    var reviewId = target.getAttribute('data-fixture-review');
    if (reviewId) { analytics('market_card_opened', { market_id: reviewId, creator_id: reviewId, source: 'trades' }); fixtureRoute(reviewId); return; }
    var positionId = target.getAttribute('data-fixture-position');
    if (positionId) {
      var contract = fixtureById(positionId);
      if (!contract || !contract.isFixture || contract.mkt.state !== 'OPEN') return;
      analytics('market_position_started', { market_id: positionId, creator_id: positionId, instrument: 'milestone', source: 'trades' });
      fixtureRoute(positionId); return;
    }
    var watchId = target.getAttribute('data-fixture-watch');
    if (watchId) { toggleWatch(watchId); return; }
    var proposalReview = target.getAttribute('data-proposal-review');
    if (proposalReview) { state.proposalId = proposalReview; writeURL(); proposalRoute(proposalReview); return; }
    var proposalEdit = target.getAttribute('data-proposal-edit');
    if (proposalEdit) { editProposalRoute(proposalEdit); return; }
    var proposalDelete = target.getAttribute('data-proposal-delete');
    if (proposalDelete) { state.pendingDeleteId = proposalDelete; renderContent(); return; }
    if (target.hasAttribute('data-proposal-delete-cancel')) { state.pendingDeleteId = ''; renderContent(); return; }
    var proposalConfirm = target.getAttribute('data-proposal-delete-confirm');
    if (proposalConfirm) { removeProposal(proposalConfirm); }
  }
  function onChange(event) {
    if (event.target.matches('[data-trades-category]')) { state.category = event.target.value || 'all'; state.shown = PAGE_SIZE; analytics('market_filter_changed', { filter_type: 'category', source: 'trades' }); renderContent(); return; }
    if (event.target.matches('[data-trades-sort]')) { state.sort = event.target.value || 'personalized'; state.shown = PAGE_SIZE; analytics('market_sort_changed', { sort: state.sort, source: 'trades' }); renderContent(); }
  }
  function onInput(event) {
    if (!event.target.matches('[data-trades-query]')) return;
    state.query = event.target.value;
    state.shown = PAGE_SIZE;
    renderContent();
    var input = mountedRoot.querySelector('[data-trades-query]');
    if (input) { input.focus(); input.setSelectionRange(state.query.length, state.query.length); }
  }

  function render(target) {
    mountedRoot = target;
    readURL();
    if (!mountedRoot.dataset.tradesBound) {
      mountedRoot.dataset.tradesBound = 'true';
      mountedRoot.addEventListener('click', onClick);
      mountedRoot.addEventListener('change', onChange);
      mountedRoot.addEventListener('input', onInput);
    }
    renderContent();
  }

  root.BackerMarket = { render: render };
})(window);
