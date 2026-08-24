/* Backer AI Search.
   Restores the dedicated natural-language search surface while keeping every
   result bound to the retained Discovery catalog. No generated people,
   inferred metrics, or simulated search scores are created here. */
(function (root, factory) {
  'use strict';
  var api = factory(root || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerSearch = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';

  var CATALOG_URL = 'data/discovery-catalog.json';
  var RESULT_LIMIT = 12;
  var SUGGESTED_SEARCHES = [
    { label: 'AI educators', query: 'AI educators publishing explainers' },
    { label: 'GitHub developers', query: 'independent developers on GitHub' },
    { label: 'Bilibili music', query: 'music creators on Bilibili' },
    { label: 'Videos with views', query: 'original videos with retained views' },
    { label: 'Open-source maintainers', query: 'open source maintainers' },
    { label: 'Science explainers', query: 'science explainers' },
    { label: 'Design researchers', query: 'design researchers' },
    { label: 'Newsletter writers', query: 'newsletter writers' },
    { label: 'Podcast hosts', query: 'podcast hosts' },
    { label: 'Indie game creators', query: 'indie game creators' },
    { label: 'Robotics builders', query: 'robotics builders' },
    { label: 'Digital artists', query: 'digital artists' },
    { label: 'Software tutorials', query: 'software tutorials' },
    { label: 'Creative coding', query: 'creative coding' }
  ];
  /* Decorative historical orbit only. Search coverage is declared separately
     by the retained-catalog source controls below the input. */
  var ORBIT_PROVIDERS = ['youtube', 'tiktok', 'instagram', 'x', 'twitch'];
  var PROVIDER_LABELS = {
    bilibili: 'Bilibili', dev: 'DEV', github: 'GitHub', instagram: 'Instagram', kick: 'Kick',
    linkedin: 'LinkedIn', medium: 'Medium', patreon: 'Patreon', rss: 'RSS', soundcloud: 'SoundCloud',
    spotify: 'Spotify', substack: 'Substack', tiktok: 'TikTok', twitch: 'Twitch', x: 'X', youtube: 'YouTube'
  };
  var STOP_WORDS = new Set([
    'a', 'about', 'all', 'and', 'are', 'at', 'back', 'by', 'content', 'creator', 'creators', 'find',
    'for', 'from', 'have', 'ideally', 'in', 'is', 'me', 'of', 'on', 'or', 'people', 'person', 'posts',
    'show', 'that', 'the', 'their', 'them', 'to', 'under', 'want', 'who', 'with', 'work', 'works'
  ]);
  var ICONS = {
    youtube: '<path d="M22 12s0-3.5-.4-5a2.6 2.6 0 0 0-1.8-1.8C18 4.8 12 4.8 12 4.8s-6 0-7.8.4A2.6 2.6 0 0 0 2.4 7C2 8.5 2 12 2 12s0 3.5.4 5a2.6 2.6 0 0 0 1.8 1.8c1.8.4 7.8.4 7.8.4s6 0 7.8-.4A2.6 2.6 0 0 0 21.6 17c.4-1.5.4-5 .4-5z"/><path d="m10 15 5-3-5-3z"/>',
    tiktok: '<path d="M16 3v3.5a5 5 0 0 0 4 4M16 3h-3v11.5a3 3 0 1 1-3-3"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    github: '<path d="M9 19c-4 1.4-4-2-6-2m12 4v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6-1.4 6-6.3a4.9 4.9 0 0 0-1.4-3.4 4.5 4.5 0 0 0-.1-3.4s-1.1-.4-3.6 1.3a12.3 12.3 0 0 0-6.6 0C6.5 1.5 5.4 1.9 5.4 1.9a4.5 4.5 0 0 0-.1 3.4A4.9 4.9 0 0 0 4 8.7c0 4.8 3 6 6 6.3a3.4 3.4 0 0 0-.9 2.5V21"/>',
    twitch: '<path d="M4 3h16v11l-4 4h-4l-3 3v-3H4z"/><path d="M11 8v4M15 8v4"/>'
  };

  var rootElement = null;
  var index = null;
  var catalogRaw = null;
  var loadPromise = null;
  var tradeEligibilityPromise = null;
  var tradeEligibility = emptyTradeEligibility();
  var activeProviders = new Set();
  var currentQuery = '';
  var renderRevision = 0;

  function array(value) { return Array.isArray(value) ? value : []; }
  function clean(value) { return String(value == null ? '' : value).trim(); }
  function lower(value) { return clean(value).toLowerCase(); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var parsed = new URL(raw, root.location && root.location.href ? root.location.href : 'https://backer.example/');
      if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return '';
      return parsed.href;
    } catch (error) { return ''; }
  }
  function validISO(value) {
    if (!clean(value)) return '';
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  function newest(rows) {
    return array(rows).reduce(function (latest, row) {
      var candidate = validISO(row && row.observedAt);
      return candidate && candidate > latest ? candidate : latest;
    }, '');
  }
  function unique(values) {
    var seen = Object.create(null);
    return array(values).filter(function (value) {
      var key = lower(value);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function providerLabel(provider) {
    var key = lower(provider);
    return PROVIDER_LABELS[key] || clean(provider).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }
  function formatNumber(value) {
    var number = Number(value);
    if (!isFinite(number)) return '';
    if (Math.abs(number) >= 1000000) return (number / 1000000).toFixed(Math.abs(number) >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (Math.abs(number) >= 1000) return (number / 1000).toFixed(Math.abs(number) >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(number);
  }
  function formatDate(value) {
    var iso = validISO(value);
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
  }
  function initials(value) {
    return clean(value).split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || '?';
  }
  function icon(provider) {
    var key = lower(provider);
    if (ICONS[key]) return '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">' + ICONS[key] + '</svg>';
    return '<span class="sx-provider-monogram" aria-hidden="true">' + esc(providerLabel(key).slice(0, key === 'dev' ? 3 : 2)) + '</span>';
  }
  function metricLabel(value) {
    return clean(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }
  function evidenceMetric(rows) {
    var priorities = { followers: 100, subscribers: 100, views: 90, likes: 80, reactions: 75, comments: 70, shares: 60, stars: 55, forks: 50 };
    return array(rows).filter(function (row) {
      return row && lower(row.availability || 'available') === 'available' && isFinite(Number(row.value))
        && safeURL(row.sourceUrl) && validISO(row.observedAt);
    }).sort(function (a, b) {
      var metricA = lower(a.metric);
      var metricB = lower(b.metric);
      var scoreA = priorities[metricA] || (/view/.test(metricA) ? 85 : 20);
      var scoreB = priorities[metricB] || (/view/.test(metricB) ? 85 : 20);
      return scoreB - scoreA || validISO(b.observedAt).localeCompare(validISO(a.observedAt)) || clean(a.id).localeCompare(clean(b.id));
    })[0] || null;
  }
  function objectPush(map, key, value) {
    if (!map[key]) map[key] = [];
    map[key].push(value);
  }

  function emptyTradeEligibility() {
    return { profiles: new Set(), works: new Set(), available: false };
  }

  function buildTradeEligibility(model) {
    if (!model || !Array.isArray(model.people) || !Array.isArray(model.contents)) return emptyTradeEligibility();
    return {
      profiles: new Set(model.people.map(function (person) { return clean(person && person.id); }).filter(Boolean)),
      works: new Set(model.contents.map(function (work) { return clean(work && work.id); }).filter(Boolean)),
      available: true
    };
  }

  function tradeHref(row, eligibility) {
    if (!row || !eligibility || !eligibility.available) return '';
    if (row.kind === 'profile' && eligibility.profiles.has(row.id)) {
      return 'backerdemo.html#trades?view=profiles&subject=' + encodeURIComponent(row.id);
    }
    if (row.kind === 'work' && eligibility.works.has(row.id)) {
      return 'backerdemo.html#trades?view=contents&subject=' + encodeURIComponent(row.id);
    }
    return '';
  }

  function buildIndex(raw) {
    if (!raw || !Array.isArray(raw.creators) || !Array.isArray(raw.platformIdentities)
      || !Array.isArray(raw.contentRecords) || !Array.isArray(raw.metricObservations)) {
      throw new Error('Discovery catalog schema is incomplete');
    }
    var identitiesByCreator = Object.create(null);
    var identityById = Object.create(null);
    var contentByCreator = Object.create(null);
    var observationsByEntity = Object.create(null);
    var creatorById = Object.create(null);

    raw.platformIdentities.forEach(function (row) {
      if (!row || !clean(row.id) || !clean(row.creatorId)) return;
      identityById[row.id] = row;
      objectPush(identitiesByCreator, row.creatorId, row);
    });
    raw.contentRecords.forEach(function (row) {
      if (!row || !clean(row.id) || !clean(row.creatorId) || !safeURL(row.canonicalUrl)) return;
      objectPush(contentByCreator, row.creatorId, row);
    });
    raw.metricObservations.forEach(function (row) {
      if (!row || !clean(row.entityType) || !clean(row.entityId)) return;
      objectPush(observationsByEntity, lower(row.entityType) + ':' + row.entityId, row);
    });
    raw.creators.forEach(function (row) { if (row && clean(row.id)) creatorById[row.id] = row; });

    var profiles = raw.creators.map(function (creator) {
      var identities = array(identitiesByCreator[creator.id]).filter(function (identity) { return safeURL(identity.profileUrl); });
      if (!identities.length) return null;
      var primary = identityById[creator.primaryIdentityId] || identities[0];
      var profileObservations = [];
      identities.forEach(function (identity) {
        profileObservations = profileObservations.concat(array(observationsByEntity['identity:' + identity.id]));
      });
      var recentWorks = array(contentByCreator[creator.id]).slice().sort(function (a, b) {
        return validISO(b.observedAt || b.publishedAt).localeCompare(validISO(a.observedAt || a.publishedAt));
      });
      var providers = unique(identities.map(function (identity) { return identity.provider; }));
      var text = [creator.displayName, creator.bio]
        .concat(identities.map(function (identity) { return [identity.handle, identity.provider].join(' '); }))
        .concat(recentWorks.slice(0, 12).map(function (work) { return [work.title, work.excerpt, work.provider].join(' '); })).join(' ');
      return {
        kind: 'profile', id: creator.id, creatorId: creator.id, name: clean(creator.displayName) || clean(primary.handle),
        bio: clean(creator.bio), avatar: safeURL(creator.avatarUrl), sourceUrl: safeURL(primary.profileUrl),
        handle: clean(primary.handle), provider: lower(primary.provider), providers: providers.map(lower),
        metric: evidenceMetric(profileObservations), observedAt: newest(profileObservations) || validISO(creator.observedAt),
        works: recentWorks.length, searchText: lower(text)
      };
    }).filter(Boolean);

    var works = raw.contentRecords.map(function (work) {
      var creator = creatorById[work.creatorId];
      var sourceUrl = safeURL(work.canonicalUrl);
      if (!creator || !sourceUrl) return null;
      var text = [work.title, work.excerpt, work.provider, work.contentType, creator.displayName, creator.bio].join(' ');
      return {
        kind: 'work', id: work.id, creatorId: work.creatorId, name: clean(work.title) || 'Untitled source record',
        creatorName: clean(creator.displayName), excerpt: clean(work.excerpt), thumbnail: safeURL(work.thumbnailUrl),
        sourceUrl: sourceUrl, provider: lower(work.provider), providers: [lower(work.provider)],
        metric: evidenceMetric(observationsByEntity['content:' + work.id]),
        observedAt: validISO(work.observedAt || work.publishedAt), publishedAt: validISO(work.publishedAt), searchText: lower(text)
      };
    }).filter(Boolean);

    var counts = Object.create(null);
    profiles.forEach(function (row) { row.providers.forEach(function (provider) { counts[provider] = (counts[provider] || 0) + 1; }); });
    works.forEach(function (row) { counts[row.provider] = (counts[row.provider] || 0) + 1; });
    return {
      generatedAt: validISO(raw.generatedAt), profiles: profiles, works: works, providerCounts: counts,
      providers: Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
    };
  }

  function queryTokens(query) {
    return unique(lower(query).replace(/[^\p{L}\p{N}_.@+-]+/gu, ' ').split(/\s+/)).filter(function (token) {
      return token.length > 1 && !STOP_WORDS.has(token) && !/^\d+(?:\.\d+)?[kmb]?$/.test(token);
    });
  }
  function queryMode(query) {
    var normalized = lower(query);
    if (/\b(?:videos?|articles?|posts?|repos?|repositories|content|works?)\b/.test(normalized)) return 'works';
    if (/\b(?:people|person|profiles?|creators?|handles?)\b/.test(normalized)) return 'profiles';
    return 'all';
  }
  function scoreRow(row, query, tokens) {
    var text = row.searchText;
    var normalized = lower(query);
    var score = 0;
    if (normalized && text.indexOf(normalized) >= 0) score += 80;
    tokens.forEach(function (token) {
      if (lower(row.name) === token) score += 48;
      else if (lower(row.name).indexOf(token) === 0) score += 32;
      else if (lower(row.name).indexOf(token) >= 0) score += 24;
      else if (text.indexOf(token) >= 0) score += 10;
      if (row.providers.indexOf(token) >= 0 || lower(providerLabel(row.provider)) === token) score += 16;
    });
    if (score > 0) {
      if (row.metric) score += 2;
      if (row.kind === 'profile' && row.avatar) score += 1;
      if (row.kind === 'work' && row.thumbnail) score += 1;
    }
    return score;
  }
  function searchIndex(catalogIndex, query, providers) {
    var tokens = queryTokens(query);
    var mode = queryMode(query);
    var selected = providers && providers.size ? providers : new Set(catalogIndex.providers);
    function searchRows(rows) {
      return rows.filter(function (row) { return row.providers.some(function (provider) { return selected.has(provider); }); })
        .map(function (row) { return { row: row, score: scoreRow(row, query, tokens) }; })
        .filter(function (entry) { return !tokens.length || entry.score > 0; })
        .sort(function (a, b) {
          return b.score - a.score || b.row.observedAt.localeCompare(a.row.observedAt) || a.row.id.localeCompare(b.row.id);
        }).map(function (entry) { return entry.row; });
    }
    return {
      tokens: tokens, mode: mode,
      profiles: mode === 'works' ? [] : searchRows(catalogIndex.profiles),
      works: mode === 'profiles' ? [] : searchRows(catalogIndex.works)
    };
  }

  function orbitRing(size, duration, reverse, offset, providers) {
    var tier = size > 1000 ? ' is-outer' : size > 700 ? ' is-middle' : ' is-inner';
    var ringProviders = array(providers);
    var nodes = ringProviders.map(function (provider, position) {
      var angle = offset + Math.PI * 2 * position / ringProviders.length;
      var x = (Math.cos(angle) * 46).toFixed(3);
      var y = (Math.sin(angle) * 46).toFixed(3);
      return '<span class="sx-orbit-node" data-platform="' + provider + '" style="--sx-node-x:' + x + '%;--sx-node-y:' + y + '%"><span class="sx-app-icon">' + icon(provider) + '</span></span>';
    }).join('');
    return '<div class="sx-orbit-ring' + tier + (reverse ? ' is-reverse' : '') + '" style="--sx-orbit-size:' + size + 'px;--sx-orbit-duration:' + duration + 's">' + nodes + '</div>';
  }
  function suggestedSearchGroup(isDuplicate) {
    return '<div class="pills-group"' + (isDuplicate ? ' aria-hidden="true"' : '') + '>'
      + SUGGESTED_SEARCHES.map(function (suggestion) {
        if (isDuplicate) return '<span class="chip" data-ex="' + esc(suggestion.query) + '">' + esc(suggestion.label) + '</span>';
        return '<button type="button" class="chip" data-ex="' + esc(suggestion.query) + '">' + esc(suggestion.label) + '</button>';
      }).join('') + '</div>';
  }
  function heroHTML(query) {
    return '<div class="search-view sx">'
      + '<div class="sx-hero-stage"><div class="sx-orbit-scene" aria-hidden="true"><div class="sx-orbit-plane">'
      + orbitRing(1360, 92, false, -0.42, ORBIT_PROVIDERS.slice(0, 2))
      + orbitRing(920, 74, true, 0.2, ORBIT_PROVIDERS.slice(2, 4))
      + orbitRing(570, 58, false, -0.08, ORBIT_PROVIDERS.slice(4))
      + '</div></div><div class="sx-hero-shade" aria-hidden="true"></div><div class="sx-hero-content">'
      + '<div class="search-hero"><h1 aria-label="Backer AI Profile Discovery Agent"><span class="sx-hero-title-main">Backer AI</span><em class="sx-hero-title-sub">Profile Discovery Agent</em></h1>'
      + '<p class="sx-lede">Describe who or what you want to discover in natural language.</p></div>'
      + '<form class="big-search" id="sxForm"><svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
      + '<input id="sxInput" autocomplete="off" aria-label="Search retained creators and original work" placeholder="e.g. AI educators publishing explainers on YouTube" value="' + esc(query) + '"/>'
      + '<button class="send" type="submit" aria-label="Search"><svg viewBox="0 0 24 24" class="ic"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>'
      + '<div class="pills-shell search-ex-shell"><div class="pills search-ex" role="group" aria-label="Suggested searches"><div class="pills-track search-ex-track">'
      + suggestedSearchGroup(false) + suggestedSearchGroup(true)
      + '</div></div></div><div class="sx-plat-filter" id="sxProviderFilters" role="group" aria-label="Sources">'
      + '<span class="sx-plat-filter-label">Loading sources…</span></div></div></div>'
      + '<div id="sxOut"><div class="sx-notice" role="status"><span class="sx-spinner" aria-hidden="true"></span> Loading the retained Discovery catalog…</div></div>'
      + '<div class="sx-announce" aria-live="polite"></div></div>';
  }

  function canonicalURL(query) {
    if (!root.history || !root.location) return;
    try {
      var params = new URLSearchParams();
      if (query) params.set('q', query);
      root.history.replaceState(null, '', root.location.pathname + '#search' + (params.toString() ? '?' + params.toString() : ''));
    } catch (error) {}
  }
  function loadCatalog() {
    if (!loadPromise) {
      var model = root.BackerTradeCatalog;
      var source = model && typeof model.loadSourceJSON === 'function'
        ? model.loadSourceJSON(CATALOG_URL, 'Search catalog')
        : root.fetch(CATALOG_URL, { cache: 'no-store', credentials: 'same-origin' })
          .then(function (response) { if (!response.ok) throw new Error('Catalog request failed (' + response.status + ')'); return response.json(); });
      loadPromise = source
        .then(function (raw) { catalogRaw = raw; index = buildIndex(raw); return index; });
    }
    return loadPromise;
  }
  function loadTradeEligibility() {
    if (!tradeEligibilityPromise) {
      tradeEligibilityPromise = loadCatalog().then(function () {
        var model = root.BackerTradeCatalog;
        if (!model || typeof model.load !== 'function') return emptyTradeEligibility();
        return model.load({ catalog: catalogRaw }).then(buildTradeEligibility).catch(function () { return emptyTradeEligibility(); });
      }).catch(function () { return emptyTradeEligibility(); }).then(function (eligibility) {
        tradeEligibility = eligibility;
        return tradeEligibility;
      });
    }
    return tradeEligibilityPromise;
  }
  function renderProviderFilters() {
    var host = rootElement && rootElement.querySelector('#sxProviderFilters');
    if (!host || !index) return;
    host.innerHTML = '<span class="sx-plat-filter-label">Sources</span>' + index.providers.map(function (provider) {
      return '<button type="button" class="sx-plat-toggle" data-plat="' + esc(provider) + '" aria-pressed="' + activeProviders.has(provider) + '">' + icon(provider)
        + '<span>' + esc(providerLabel(provider)) + '</span></button>';
    }).join('');
    host.querySelectorAll('[data-plat]').forEach(function (button) {
      button.addEventListener('click', function () {
        var provider = button.dataset.plat;
        if (activeProviders.has(provider)) {
          if (activeProviders.size === 1) { announce('At least one retained source must stay selected.'); return; }
          activeProviders.delete(provider);
        } else activeProviders.add(provider);
        renderProviderFilters();
        renderResults(currentQuery);
      });
    });
  }
  function announce(message) {
    var element = rootElement && rootElement.querySelector('.sx-announce');
    if (element) element.textContent = message;
  }
  function metricHTML(metric) {
    if (!metric) return '<span class="sxr-evidence">Source link retained</span>';
    var lastGood = metric.freshness && String(metric.freshness.state || '').toLowerCase() === 'last_good';
    return '<a class="sxr-metric" href="' + esc(safeURL(metric.sourceUrl)) + '" target="_blank" rel="noopener noreferrer" aria-label="Open metric source">'
      + '<strong>' + esc(formatNumber(metric.value)) + '</strong> ' + esc(metricLabel(metric.metric).toLowerCase()) + '<span>'
      + esc(providerLabel(metric.provider)) + ' · ' + (lastGood ? 'Last good · observed ' : '')
      + esc(formatDate(metric.observedAt)) + '</span></a>';
  }
  function mediaHTML(row) {
    var source = row.kind === 'profile' ? row.avatar : row.thumbnail;
    var fallback = row.kind === 'profile' ? initials(row.name) : providerLabel(row.provider).slice(0, 2).toUpperCase();
    return '<div class="sxr-media ' + (row.kind === 'profile' ? 'is-profile' : 'is-work') + '">'
      + (source ? '<img src="' + esc(source) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add(\'is-fallback\')"/>' : '')
      + '<span>' + esc(fallback) + '</span></div>';
  }
  function resultCard(row, eligibility) {
    var route = 'backerdemo.html#market2?view=radar&person=' + encodeURIComponent(row.creatorId)
      + (row.kind === 'work' ? '&work=' + encodeURIComponent(row.id) : '');
    var tradeRoute = tradeHref(row, eligibility);
    var sourceLabel = providerLabel(row.provider);
    var description = row.kind === 'profile'
      ? (row.bio || (row.handle ? '@' + row.handle.replace(/^@/, '') : 'Public creator profile retained from ' + sourceLabel))
      : (row.excerpt || 'Original public work retained from ' + sourceLabel);
    return '<article class="sxr-card" data-search-kind="' + esc(row.kind) + '" data-search-subject="' + esc(row.id) + '" data-search-creator="' + esc(row.creatorId) + '">' + mediaHTML(row) + '<div class="sxr-card-body"><div class="sxr-card-top"><span class="sxr-provider">' + icon(row.provider) + esc(sourceLabel) + '</span>'
      + '<span class="sxr-date">' + esc(formatDate(row.publishedAt || row.observedAt)) + '</span></div>'
      + '<h3>' + esc(row.name) + '</h3>' + (row.kind === 'work' ? '<p class="sxr-by">by ' + esc(row.creatorName) + '</p>' : '')
      + '<p class="sxr-description">' + esc(description) + '</p>' + metricHTML(row.metric)
      + '<div class="sxr-actions"><a data-search-action="discovery" data-subject-id="' + esc(row.id) + '" href="' + esc(route) + '">Open in Discovery</a>'
      + (tradeRoute ? '<a data-search-action="trade" data-subject-id="' + esc(row.id) + '" href="' + esc(tradeRoute) + '">Trade growth</a>' : '')
      + '<a data-search-action="source" data-subject-id="' + esc(row.id) + '" href="' + esc(row.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Original source ↗</a></div>'
      + '</div></article>';
  }
  function resultKindLabel(kind) {
    return kind === 'profiles' ? 'profiles' : 'contents';
  }
  function resultsSection(kind, title, rows) {
    if (!rows.length) return '';
    var shown = Math.min(rows.length, RESULT_LIMIT);
    var label = resultKindLabel(kind);
    var more = rows.length > shown
      ? '<div class="sxr-more-row"><button type="button" class="sxr-more" data-sxr-more="' + kind + '" data-sxr-visible="' + shown + '" aria-controls="sxr-grid-' + kind + '" aria-label="Show ' + Math.min(RESULT_LIMIT, rows.length - shown) + ' more ' + label + '">'
        + '<span data-sxr-more-label>More ' + label + '</span><small data-sxr-more-count>' + shown.toLocaleString('en-US') + ' of ' + rows.length.toLocaleString('en-US') + ' shown</small>'
        + '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button></div>'
      : '';
    return '<section class="sxr-section" aria-labelledby="sxr-' + kind + '"><div class="sxr-section-head"><div><span class="sxr-kicker">Source-backed ' + label + '</span><h2 id="sxr-' + kind + '">' + esc(title) + '</h2></div>'
      + '<p><strong>' + rows.length.toLocaleString('en-US') + '</strong> catalog matches · <span data-sxr-progress="' + kind + '">showing ' + shown.toLocaleString('en-US') + '</span></p></div>'
      + '<div class="sxr-grid" id="sxr-grid-' + kind + '">' + rows.slice(0, shown).map(function (row) { return resultCard(row, tradeEligibility); }).join('') + '</div>' + more + '</section>';
  }
  function bindResultExpansion(result) {
    if (!rootElement) return;
    rootElement.querySelectorAll('[data-sxr-more]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.disabled) return;
        var kind = button.dataset.sxrMore;
        var rows = kind === 'profiles' ? result.profiles : result.works;
        var label = resultKindLabel(kind);
        var previous = Math.max(0, Number(button.dataset.sxrVisible) || RESULT_LIMIT);
        var next = Math.min(rows.length, previous + RESULT_LIMIT);
        var grid = rootElement.querySelector('#sxr-grid-' + kind);
        if (!grid || next <= previous) return;
        grid.insertAdjacentHTML('beforeend', rows.slice(previous, next).map(function (row) {
          return resultCard(row, tradeEligibility);
        }).join(''));
        var firstNewCard = grid.children[previous];
        button.dataset.sxrVisible = String(next);
        var progress = rootElement.querySelector('[data-sxr-progress="' + kind + '"]');
        if (progress) progress.textContent = 'showing ' + next.toLocaleString('en-US');
        var buttonLabel = button.querySelector('[data-sxr-more-label]');
        var count = button.querySelector('[data-sxr-more-count]');
        if (count) count.textContent = next.toLocaleString('en-US') + ' of ' + rows.length.toLocaleString('en-US') + ' shown';
        if (next >= rows.length) {
          button.disabled = true;
          button.classList.add('is-complete');
          button.removeAttribute('aria-label');
          if (buttonLabel) buttonLabel.textContent = 'All ' + label + ' shown';
        } else {
          button.setAttribute('aria-label', 'Show ' + Math.min(RESULT_LIMIT, rows.length - next) + ' more ' + label);
        }
        announce((next - previous) + ' more ' + label + ' shown. ' + next + ' of ' + rows.length + ' now visible.');
        if (firstNewCard) {
          firstNewCard.setAttribute('tabindex', '-1');
          firstNewCard.focus();
          firstNewCard.addEventListener('blur', function () { firstNewCard.removeAttribute('tabindex'); }, { once: true });
        }
      });
    });
  }
  function renderResults(query) {
    if (!rootElement || !index) return;
    currentQuery = clean(query);
    var out = rootElement.querySelector('#sxOut');
    var result = searchIndex(index, currentQuery, activeProviders);
    var total = result.profiles.length + result.works.length;
    var queryLabel = currentQuery ? '“' + currentQuery + '”' : 'the retained catalog';
    rootElement.querySelector('.search-view.sx').classList.add('has-results');
    out.innerHTML = '<div class="sxr-summary"><div><span>Backer AI search</span><h2>' + total.toLocaleString('en-US') + ' matches for ' + esc(queryLabel) + '</h2></div>'
      + '<p>Names, handles, bios, titles, excerpts, providers, and exact retained metrics only. Backer does not invent missing facts or infer private traits.</p></div>'
      + (total ? resultsSection('profiles', 'Profiles', result.profiles) + resultsSection('works', 'Contents', result.works)
        : '<div class="sx-notice sx-notice-block" role="status"><b>No retained record matches those words and selected sources.</b> Try a name, handle, topic, platform, or original-work title. Nothing was generated to fill the gap.</div>')
      + '<div class="sxr-provenance">' + index.profiles.length.toLocaleString('en-US') + ' source-linked profiles · '
      + index.works.length.toLocaleString('en-US') + ' original works up to date</div>';
    bindResultExpansion(result);
    canonicalURL(currentQuery);
    announce(total + ' retained catalog matches.');
  }
  function submit(query) {
    currentQuery = clean(query);
    var revision = ++renderRevision;
    var out = rootElement && rootElement.querySelector('#sxOut');
    if (out) out.innerHTML = '<div class="sx-notice" role="status"><span class="sx-spinner" aria-hidden="true"></span> Searching retained public records…</div>';
    return Promise.all([loadCatalog(), loadTradeEligibility()]).then(function () {
      if (revision !== renderRevision || !rootElement) return;
      if (!activeProviders.size) index.providers.forEach(function (provider) { activeProviders.add(provider); });
      renderProviderFilters();
      if (currentQuery) renderResults(currentQuery);
      else {
        if (out) out.innerHTML = '';
        canonicalURL('');
        announce('Retained catalog ready. Enter a search in natural language.');
      }
    }).catch(function (error) {
      if (revision !== renderRevision || !out) return;
      out.innerHTML = '<div class="sx-notice sx-notice-block" role="alert"><b>Search catalog could not load.</b> Refresh to retry. No fallback or generated profiles were substituted.</div>';
      announce('Search catalog could not load.');
    });
  }
  function render(container, query) {
    rootElement = container;
    currentQuery = clean(query);
    renderRevision += 1;
    container.innerHTML = heroHTML(currentQuery);
    canonicalURL(currentQuery);
    var form = container.querySelector('#sxForm');
    var input = container.querySelector('#sxInput');
    form.addEventListener('submit', function (event) { event.preventDefault(); submit(input.value); });
    container.querySelectorAll('[data-ex]').forEach(function (button) {
      button.addEventListener('click', function () { input.value = button.dataset.ex; submit(button.dataset.ex); });
    });
    submit(currentQuery);
  }

  return {
    render: render,
    search: function (query) { return loadCatalog().then(function () { return searchIndex(index, query, new Set(index.providers)); }); },
    __test: {
      CATALOG_URL: CATALOG_URL,
      RESULT_LIMIT: RESULT_LIMIT,
      SUGGESTED_SEARCHES: SUGGESTED_SEARCHES.slice(),
      buildIndex: buildIndex,
      buildTradeEligibility: buildTradeEligibility,
      queryTokens: queryTokens,
      queryMode: queryMode,
      resultCard: resultCard,
      resultsSection: resultsSection,
      searchIndex: searchIndex,
      tradeHref: tradeHref
    }
  };
});
