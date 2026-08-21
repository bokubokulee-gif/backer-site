/* Backer Market Builder
   Creates source-backed simulation proposals without inventing provider metrics,
   market quotes, or creator consent. */
(function () {
  'use strict';

  var DATA_URL = 'data/discovery-catalog.json';
  var VALID_INSTRUMENTS = ['milestone', 'pk'];
  var STEPS = [
    { id: 'subject', label: 'Subject', note: 'Person or public work' },
    { id: 'claim', label: 'Future claim', note: 'Metric, direction, and target' },
    { id: 'when', label: 'When', note: 'Measurement cutoff' },
    { id: 'resolution', label: 'How resolved', note: 'Source and edge cases' },
    { id: 'preview', label: 'Review proposal', note: 'Exact terms before saving' }
  ];
  var PLATFORM_LABELS = { x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub', dev: 'DEV', bilibili: 'Bilibili', twitch: 'Twitch', linkedin: 'LinkedIn', medium: 'Medium', substack: 'Substack', rss: 'RSS', tiktok: 'TikTok', spotify: 'Spotify', soundcloud: 'SoundCloud', patreon: 'Patreon', kick: 'Kick' };
  var METRICS = {
    x: {
      person: [
        { key: 'followers', label: 'Followers', unit: 'followers', access: 'public' }
      ],
      content: [
        { key: 'post_views', label: 'Post views', unit: 'views', access: 'public' },
        { key: 'post_likes', label: 'Post likes', unit: 'likes', access: 'public' },
        { key: 'post_replies', label: 'Post replies', unit: 'replies', access: 'public' },
        { key: 'post_reposts', label: 'Post reposts', unit: 'reposts', access: 'public' },
        { key: 'post_bookmarks', label: 'Post bookmarks', unit: 'bookmarks', access: 'authorized' }
      ]
    },
    youtube: {
      person: [
        { key: 'subscribers', label: 'Subscribers', unit: 'subscribers', access: 'public' },
        { key: 'channel_views', label: 'Channel views', unit: 'views', access: 'public' }
      ],
      content: [
        { key: 'video_views', label: 'Video views', unit: 'views', access: 'public' },
        { key: 'video_likes', label: 'Video likes', unit: 'likes', access: 'public' },
        { key: 'video_comments', label: 'Video comments', unit: 'comments', access: 'public' }
      ]
    },
    instagram: {
      person: [
        { key: 'followers', label: 'Followers', unit: 'followers', access: 'authorized' }
      ],
      content: [
        { key: 'media_likes', label: 'Media likes', unit: 'likes', access: 'authorized' },
        { key: 'media_comments', label: 'Media comments', unit: 'comments', access: 'authorized' },
        { key: 'media_saves', label: 'Media saves', unit: 'saves', access: 'authorized' },
        { key: 'media_reposts', label: 'Media reposts', unit: 'reposts', access: 'authorized' }
      ]
    },
    github: {
      person: [
        { key: 'followers', label: 'Followers', unit: 'followers', access: 'public' },
        { key: 'public_repositories', label: 'Public repositories', unit: 'repositories', access: 'public' }
      ],
      content: [
        { key: 'repository_stars', label: 'Repository stars', unit: 'stars', access: 'public' },
        { key: 'repository_forks', label: 'Repository forks', unit: 'forks', access: 'public' },
        { key: 'repository_watchers', label: 'Repository watchers', unit: 'watchers', access: 'public' }
      ]
    }
  };

  var root = document.getElementById('marketBuilder');
  var DATA = null;
  var state = null;

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
  function finiteNumber(value) {
    if (value === '' || value == null) return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, window.location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
    } catch (error) { return ''; }
  }
  function safeImage(value) { return safeURL(value) || 'img/backer-mark.png?v=2'; }
  function platformLabel(id) { return PLATFORM_LABELS[id] || clean(id).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) || 'Platform'; }
  function isoDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }
  function humanDate(value) {
    var date = new Date(value + (String(value).length === 10 ? 'T00:00:00Z' : ''));
    if (isNaN(date.getTime())) return display(value) || 'Not set';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  function nextMonthDate() {
    var date = new Date();
    date.setUTCDate(date.getUTCDate() + 30);
    return date.toISOString().slice(0, 10);
  }
  function slug(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function personById(id) {
    var people = DATA && Array.isArray(DATA.people) ? DATA.people : [];
    return people.filter(function (person) { return clean(person.id) === clean(id); })[0] || null;
  }
  function selectedPerson() { return personById(state && state.values && state.values.personId); }
  function workKey(work, fallback, personId) {
    if (!work) return fallback;
    return work.id || (work.url ? slug((personId || state.values.personId || 'work') + '-' + work.url) : '') || slug(work.title) || fallback;
  }
  function selectedWork() {
    var person = selectedPerson();
    if (!person || state.values.scope !== 'content') return null;
    var candidates = (Array.isArray(person.content) ? person.content : []).map(function (work, index) {
      return { key: workKey(work, 'work-' + index, person.id), label: 'Public work', work: work };
    });
    var needle = clean(state.values.contentKey).toLowerCase();
    return candidates.filter(function (item) {
      var normalizedId = workKey(item.work, item.key, person.id);
      return needle === clean(item.key).toLowerCase() || needle === clean(normalizedId).toLowerCase() || needle === clean(item.work.id).toLowerCase() || needle === slug(item.work.title) || needle === clean(item.work.url).toLowerCase();
    })[0] || null;
  }
  function platformRecord(person, platformId) {
    return person && Array.isArray(person.platforms)
      ? person.platforms.filter(function (item) { return clean(item.id) === platformId; })[0] || null
      : null;
  }
  function availablePlatforms() {
    var person = selectedPerson();
    var work = selectedWork();
    if (state.values.scope === 'content' && work && work.work && work.work.platform) return [work.work.platform];
    return person && Array.isArray(person.platforms) ? person.platforms.map(function (item) { return item.id; }).filter(Boolean) : [];
  }
  function metricList() {
    var platform = state.values.platform;
    var person = selectedPerson();
    var work = selectedWork();
    var observed = state.values.scope === 'content' && work && work.work ? work.work.publicCounts : person && person.metrics;
    var options = (Array.isArray(observed) ? observed : []).filter(function (row) {
      return row && clean(row.provider) === platform && clean(row.id) && finiteNumber(row.value) != null && clean(row.sourceUrl) && clean(row.observedAt);
    }).map(function (row) {
      return {
        key: 'observation:' + clean(row.id),
        nativeKey: clean(row.metric || row.key),
        label: clean(row.label || row.metric || row.key).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }),
        unit: clean(row.unit || 'count'),
        access: 'retained',
        observationId: clean(row.id),
        observation: row
      };
    });
    var seenNative = {};
    options.forEach(function (item) { seenNative[item.nativeKey] = true; });
    var group = state.values.scope === 'content' ? 'content' : 'person';
    var ideas = METRICS[platform] && METRICS[platform][group] ? METRICS[platform][group] : [];
    ideas.forEach(function (idea) {
      if (seenNative[idea.key]) return;
      options.push({ key: 'idea:' + idea.key, nativeKey: idea.key, label: idea.label, unit: idea.unit, access: 'unverified', observationId: '', observation: null, manualIdea: true });
    });
    if (state.values.metricKey && state.values.metricKey.indexOf('idea:') === 0 && !options.some(function (item) { return item.key === state.values.metricKey; })) {
      var requestedIdea = state.values.metricKey.slice(5) || 'provider_native_count';
      options.push({ key: state.values.metricKey, nativeKey: requestedIdea, label: requestedIdea.replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }), unit: 'count', access: 'unverified', observationId: '', observation: null, manualIdea: true });
    }
    if (!options.length) options.push({ key: 'idea:provider_native_count', nativeKey: 'provider_native_count', label: 'Provider native count', unit: 'count', access: 'unverified', observationId: '', observation: null, manualIdea: true });
    return options;
  }
  function selectedMetric() {
    return metricList().filter(function (metric) { return metric.key === state.values.metricKey; })[0] || null;
  }
  function retainedMetricValue(metric) {
    var found = metric && metric.observation;
    if (!found || !clean(found.id) || finiteNumber(found.value) == null || !safeURL(found.sourceUrl) || !clean(found.observedAt)) return null;
    return {
      value: finiteNumber(found.value != null ? found.value : found.count),
      asOf: found.asOf || found.observedAt || DATA.generatedAt,
      sourceUrl: safeURL(found.sourceUrl || found.url),
      sourceKey: clean(found.metric || found.key),
      observationId: clean(found.id),
      observation: found,
      accessClass: clean(found.accessClass),
      snapshotState: clean(found.nativeSnapshotState)
    };
  }
  function metricAvailability() {
    var metric = selectedMetric();
    var person = selectedPerson();
    var provider = DATA.providerStatus && DATA.providerStatus[state.values.platform] || {};
    var retained = retainedMetricValue(metric);
    if (!metric) return { state: 'ambiguous', label: 'Choose one native metric', copy: 'A market cannot resolve from an unspecified or combined engagement score.', retained: null };
    if (retained) return { state: 'available', label: 'Retained source observation', copy: 'The snapshot contains a numeric observation with provenance. Eligibility and consent are checked separately.', retained: retained };
    if (metric.manualIdea) return { state: 'unverified_idea', label: 'Unverified metric idea', copy: 'This provider-native metric has no retained numeric observation for the selected subject. It can be saved only as an unverified local idea.', retained: null };
    if (provider.state === 'permission_required') {
      return { state: 'permission_required', label: 'Provider access is not connected', copy: 'Backer retained the public identity link, not a verified numeric series. This can only be saved as a discovery proposal.', retained: null };
    }
    return { state: 'not_sampled', label: 'Metric not sampled in this snapshot', copy: 'No numeric baseline is retained. A value entered here is a proposed baseline and is not presented as an observed platform fact.', retained: null };
  }
  function subjectName() {
    var person = selectedPerson();
    var work = selectedWork();
    return state.values.scope === 'content' && work ? work.work.title : person ? person.name : 'this subject';
  }
  function canonicalQuestion() {
    var metric = selectedMetric();
    var label = metric ? metric.label.toLowerCase() : 'native metric';
    var deadline = state.values.deadline ? humanDate(state.values.deadline) : 'the stated deadline';
    var target = finiteNumber(state.values.target);
    if (state.values.instrument === 'pk') return 'Which outcome will record the highest ' + label + ' by ' + deadline + '?';
    return 'Will ' + subjectName() + ' reach at least ' + (target == null ? 'the stated target' : target.toLocaleString('en-US')) + ' ' + (metric ? metric.unit : label) + ' by ' + deadline + '?';
  }
  function defaultQuestion() {
    if (state.values.instrument === 'pk') return 'Which outcome will lead on the rule-defined native metric by the stated deadline?';
    return 'Will ' + subjectName() + ' meet the rule-defined growth target by the stated deadline?';
  }
  function defaultSourceURL() {
    var person = selectedPerson();
    var work = selectedWork();
    if (state.values.scope === 'content' && work && work.work) return safeURL(work.work.sourceUrl || work.work.url);
    var platform = platformRecord(person, state.values.platform);
    return safeURL(platform && (platform.sourceUrl || platform.url));
  }

  function routeParams() {
    var params = new URLSearchParams(window.location.search);
    var hash = clean(window.location.hash);
    var queryIndex = hash.indexOf('?');
    if (queryIndex >= 0) new URLSearchParams(hash.slice(queryIndex + 1)).forEach(function (value, key) { params.set(key, value); });
    return params;
  }

  function initialState() {
    var params = routeParams();
    var editId = clean(params.get('edit'));
    var editResult = editId && window.BackerMarketDraftStore ? window.BackerMarketDraftStore.read(editId) : null;
    if (editId && (!editResult || !editResult.ok)) throw new Error('Saved proposal was not found on this device');
    var editDraft = editResult && editResult.draft;
    var requestedPerson = clean(params.get('person') || params.get('creator'));
    if (editDraft) requestedPerson = clean(editDraft.subject && editDraft.subject.person && editDraft.subject.person.id);
    if (!requestedPerson) throw new Error('No discovery subject was specified');
    var person = personById(requestedPerson);
    if (!person) throw new Error('Subject no longer in the retained catalog');
    var requestedContent = editDraft ? clean(editDraft.subject && editDraft.subject.content && editDraft.subject.content.id) : clean(params.get('content'));
    var requestedScope = editDraft ? clean(editDraft.subject && editDraft.subject.type) : clean(params.get('scope') || params.get('subject'));
    var scope = requestedScope === 'content' || requestedScope === 'content-growth' || requestedContent ? 'content' : 'person';
    if (scope === 'content' && !requestedContent) throw new Error('No discovery work was specified');
    if (scope === 'content' && requestedContent && (!person || !window.BackerDiscoveryCatalog.workById(person, requestedContent))) throw new Error('Subject no longer in the retained catalog');
    var requestedInstrument = clean(editDraft ? editDraft.instrument : params.get('instrument')).toLowerCase();
    var instrument = VALID_INSTRUMENTS.indexOf(requestedInstrument) >= 0 ? requestedInstrument : 'milestone';
    var firstContent = person && Array.isArray(person.content) && person.content[0] ? person.content[0].id : '';
    var temp = {
      step: 0,
      maxStep: 0,
      receipt: null,
      editDraft: editDraft || null,
      storageMode: editResult && editResult.storage || '',
      errors: {},
      values: {
        scope: scope,
        personId: person ? person.id : '',
        contentKey: requestedContent || firstContent,
        instrument: instrument,
        question: '',
        outcomeA: person ? person.name : '',
        outcomeB: '',
        tieEnabled: true,
        platform: '',
        metricKey: '',
        baseline: '',
        baselineAt: isoDate(DATA.generatedAt) || isoDate(new Date()),
        baselineObservedAt: '',
        baselineProvenance: 'manual',
        target: '',
        direction: instrument === 'pk' ? 'highest_at_cutoff' : 'at_least',
        deadline: nextMonthDate(),
        sourceUrl: '',
        graceHours: '24',
        deletionRule: 'pause_then_void',
        correctionRule: 'latest_valid_before_cutoff',
        tieRule: 'separate_outcome',
        voidRule: 'refund_original_cost',
        disputeHours: '48',
        selectedSide: instrument === 'pk' ? 'A' : 'GROWS_TO_TARGET'
      }
    };
    state = temp;
    syncSubjectDefaults(true);
    if (editDraft) {
      var resolution = editDraft.resolution || {};
      var observation = resolution.observation;
      state.values.platform = clean(resolution.platform);
      var matchingMetric = metricList().filter(function (metric) { return observation && metric.observationId === clean(observation.id); })[0];
      state.values.instrument = editDraft.instrument;
      state.values.question = clean(editDraft.outcome && editDraft.outcome.question);
      state.values.outcomeA = clean(editDraft.outcome && editDraft.outcome.outcomes && editDraft.outcome.outcomes[0] && editDraft.outcome.outcomes[0].label);
      state.values.outcomeB = clean(editDraft.outcome && editDraft.outcome.outcomes && editDraft.outcome.outcomes[1] && editDraft.outcome.outcomes[1].label);
      state.values.metricKey = matchingMetric ? matchingMetric.key : 'idea:' + clean(resolution.metricKey || 'provider_native_count');
      state.values.baseline = String(resolution.baseline && resolution.baseline.value != null ? resolution.baseline.value : '');
      state.values.baselineAt = isoDate(resolution.baseline && resolution.baseline.observedAt) || state.values.baselineAt;
      state.values.baselineObservedAt = clean(resolution.baseline && resolution.baseline.observedAt);
      state.values.baselineProvenance = observation ? 'retained' : 'manual';
      state.values.target = String(resolution.target && resolution.target.value != null ? resolution.target.value : '');
      state.values.deadline = isoDate(resolution.deadline) || state.values.deadline;
      state.values.sourceUrl = safeURL(resolution.sourceUrl);
      Object.keys(editDraft.rules || {}).forEach(function (key) { if (state.values[key] !== undefined) state.values[key] = String(editDraft.rules[key]); });
    } else state.values.question = defaultQuestion();
    return temp;
  }

  function syncSubjectDefaults(force) {
    var person = selectedPerson();
    var work = selectedWork();
    var platforms = availablePlatforms();
    if (force || platforms.indexOf(state.values.platform) < 0) state.values.platform = platforms[0] || '';
    var metrics = metricList();
    if (force || !metrics.some(function (item) { return item.key === state.values.metricKey; })) state.values.metricKey = metrics[0] ? metrics[0].key : '';
    if (force || !state.values.sourceUrl) state.values.sourceUrl = defaultSourceURL();
    var retained = retainedMetricValue(selectedMetric());
    if (retained && (force || state.values.baseline === '')) {
      state.values.baseline = String(retained.value);
      state.values.baselineAt = isoDate(retained.asOf) || state.values.baselineAt;
      state.values.baselineObservedAt = retained.asOf;
      state.values.baselineProvenance = 'retained';
      if (retained.sourceUrl) state.values.sourceUrl = retained.sourceUrl;
    }
    if (force || !state.values.outcomeA) state.values.outcomeA = person ? person.name : '';
    if (work && state.values.scope === 'content' && force) state.values.outcomeA = work.work.title;
  }

  function fieldError(name) { return state.errors[name] || ''; }
  function invalidAttr(name) { return fieldError(name) ? ' aria-invalid="true"' : ''; }
  function errorText(name) { return '<span class="mb-field-error" data-error-for="' + esc(name) + '">' + esc(fieldError(name)) + '</span>'; }

  function personStrip() {
    var person = selectedPerson();
    if (!person) return '';
    var work = selectedWork();
    var html = '<div class="mb-person-strip"><img src="' + esc(safeImage(person.avatar)) + '" alt="' + esc(person.avatarAlt || person.name + ' public profile picture') + '"/><div class="mb-person-name"><b>' + esc(display(person.name)) + '</b><span>' + esc(display(person.handle || person.category || 'Public creator identity')) + '</span></div><span class="mb-person-state">Discovery only</span></div>';
    if (state.values.scope === 'content' && work && work.work) {
      html += '<div class="mb-work-strip"><img src="' + esc(safeImage(work.work.thumbnail || person.avatar)) + '" alt="Thumbnail for ' + esc(display(work.work.title)) + '"/><div><small>' + esc(work.label + ' on ' + platformLabel(work.work.platform)) + '</small><b>' + esc(display(work.work.title)) + '</b><a href="' + esc(safeURL(work.work.url)) + '" target="_blank" rel="noopener noreferrer">Open original public work</a></div></div>';
    }
    return html;
  }

  function stepSubject() {
    var person = selectedPerson();
    var peopleOptions = DATA.people.map(function (item) { return '<option value="' + esc(item.id) + '" ' + (item.id === state.values.personId ? 'selected' : '') + '>' + esc(display(item.name)) + ' ' + esc(display(item.handle || '')) + '</option>'; }).join('');
    var work = selectedWork();
    var workOptions = person ? (person.content || []).map(function (item) {
      return '<option value="' + esc(item.id) + '" ' + (work && work.work.id === item.id ? 'selected' : '') + '>' + esc(display(item.title)) + ' · ' + esc(platformLabel(item.platform)) + '</option>';
    }).join('') : '';
    return '<span class="mb-kicker">Choose the subject</span><h1>Start with the person or their exact work.</h1><p class="mb-lede">The selected profile or work stays attached to every step while you write a measurable growth proposal. Public discovery does not imply consent to trade.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>What should this proposal follow?</h2></div><p>Person growth follows one native account metric. Content growth follows one exact public work.</p></div><div class="mb-choice-grid">' +
      '<button type="button" class="mb-choice ' + (state.values.scope === 'person' ? 'is-selected' : '') + '" data-action="scope" data-value="person"><b>Person growth</b><small>Followers, subscribers, channel views, or another native account metric.</small></button>' +
      '<button type="button" class="mb-choice ' + (state.values.scope === 'content' ? 'is-selected' : '') + '" data-action="scope" data-value="content"><b>Content growth</b><small>Views, likes, stars, forks, or another native metric on one work.</small></button></div></section>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field mb-span-2"><label for="mbPerson">Person</label><select class="mb-control" id="mbPerson" data-field="personId"' + invalidAttr('personId') + '>' + peopleOptions + '</select><small>Loaded from Backer\'s retained public discovery catalog.</small>' + errorText('personId') + '</div>' +
      (state.values.scope === 'content' ? '<div class="mb-field mb-span-2"><label for="mbContent">Public work</label><select class="mb-control" id="mbContent" data-field="contentKey"' + invalidAttr('contentKey') + '>' + workOptions + '</select><small>Only the original public URL and retained snapshot metadata are carried into the proposal.</small>' + errorText('contentKey') + '</div>' : '') + '</div></section>';
  }

  function stepOutcome() {
    var isPk = state.values.instrument === 'pk';
    var availability = metricAvailability();
    return '<span class="mb-kicker">Future claim</span><h1>Describe one measurable way this person or work could grow.</h1><p class="mb-lede">The title is a short summary. The retained metric, source, cutoff, and edge-case rules determine how the proposal would be resolved.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Growth format</h2></div><p>Keep the proposal centered on the selected person or work.</p></div><div class="mb-choice-grid"><button type="button" class="mb-choice ' + (!isPk ? 'is-selected' : '') + '" data-action="instrument" data-value="milestone"><b>Growth milestone</b><small>Does one native metric grow from the retained baseline to an exact target?</small></button><button type="button" class="mb-choice ' + (isPk ? 'is-selected' : '') + '" data-action="instrument" data-value="pk"><b>Head-to-head growth</b><small>Compare two named subjects using the same metric, source standard, and cutoff.</small></button></div></section>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field"><label for="mbPlatform">Platform</label><select class="mb-control" id="mbPlatform" data-field="platform" ' + (state.values.scope === 'content' ? 'disabled' : '') + invalidAttr('platform') + '>' + platformOptions() + '</select><small>' + (state.values.scope === 'content' ? 'Locked to the original work platform.' : 'Limited to retained public profile identities.') + '</small>' + errorText('platform') + '</div><div class="mb-field"><label for="mbMetric">Native metric</label><select class="mb-control" id="mbMetric" data-field="metricKey"' + invalidAttr('metricKey') + '>' + metricOptions() + '</select><small>One provider-native measurement. Backer does not combine unlike signals.</small>' + errorText('metricKey') + '</div><div class="mb-span-2">' + availabilityPanel() + '</div>' +
      '<div class="mb-field"><label for="mbBaseline">Baseline value</label><input class="mb-control" id="mbBaseline" type="number" min="0" step="1" inputmode="numeric" data-field="baseline" value="' + esc(state.values.baseline) + '" placeholder="Enter an exact value"' + invalidAttr('baseline') + '/><small>' + (state.values.baselineProvenance === 'retained' ? 'Exact retained observation ' + display(state.values.baselineObservedAt) + '.' : 'Manual entry: unverified idea, not a platform observation.') + '</small>' + errorText('baseline') + '</div><div class="mb-field"><label for="mbTarget">Growth target</label><input class="mb-control" id="mbTarget" type="number" min="0" step="1" inputmode="numeric" data-field="target" value="' + esc(state.values.target) + '" placeholder="Greater than baseline"' + invalidAttr('target') + '/><small>The target must be greater than the baseline.</small>' + errorText('target') + '</div>' +
      '<div class="mb-field mb-span-2"><label for="mbQuestion">Proposal title</label><textarea class="mb-control" id="mbQuestion" maxlength="220" data-field="question"' + invalidAttr('question') + '>' + esc(display(state.values.question)) + '</textarea><small>This is the human-readable summary. The source and written rules remain controlling.</small>' + errorText('question') + '</div>' +
      (isPk ? '<div class="mb-field"><label for="mbOutcomeA">First subject</label><input class="mb-control" id="mbOutcomeA" maxlength="80" data-field="outcomeA" value="' + esc(display(state.values.outcomeA)) + '"' + invalidAttr('outcomeA') + '/>' + errorText('outcomeA') + '</div><div class="mb-field"><label for="mbOutcomeB">Second subject</label><input class="mb-control" id="mbOutcomeB" maxlength="80" data-field="outcomeB" value="' + esc(display(state.values.outcomeB)) + '" placeholder="Name the comparison subject"' + invalidAttr('outcomeB') + '/>' + errorText('outcomeB') + '</div>' : '<div class="mb-field"><label>Target reached</label><input class="mb-control" value="Grows to target" disabled/><small>The final valid observation meets or exceeds the target.</small></div><div class="mb-field"><label>Target not reached</label><input class="mb-control" value="Does not reach target" disabled/><small>The final valid observation remains below the target.</small></div>') + '</div><button type="button" class="mb-source-link" data-action="generate-question">Write a source-specific title</button><p class="mb-preview-note">' + esc(availability.state === 'available' ? 'This claim starts from an exact retained observation.' : 'This metric has no retained observation and will remain an unverified local idea.') + '</p></section>';
  }

  function metricOptions() {
    return metricList().map(function (metric) {
      var selected = metric.key === state.values.metricKey;
      var suffix = metric.observation ? ' (retained observation)' : ' (unverified idea)';
      return '<option value="' + esc(metric.key) + '" ' + (selected ? 'selected' : '') + '>' + esc(metric.label + suffix) + '</option>';
    }).join('');
  }
  function platformOptions() {
    return availablePlatforms().map(function (id) { return '<option value="' + esc(id) + '" ' + (id === state.values.platform ? 'selected' : '') + '>' + esc(platformLabel(id)) + '</option>'; }).join('');
  }
  function availabilityPanel() {
    var availability = metricAvailability();
    var ready = availability.state === 'available';
    return '<div class="mb-availability ' + (ready ? 'is-ready' : '') + '"><div><b>' + esc(availability.label) + '</b><br/>' + esc(display(availability.copy)) + '</div></div>';
  }

  function stepResolution() {
    var retained = metricAvailability().retained;
    var observedAt = retained ? retained.asOf : (state.values.baselineAt ? state.values.baselineAt + 'T00:00:00Z' : '');
    return '<span class="mb-kicker">When</span><h1>Set the measurement cutoff.</h1><p class="mb-lede">The cutoff ends the measurement window. Determination happens later, after Backer receives the final valid provider observation and applies the written grace period.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field mb-span-2"><label for="mbDeadline">Measurement cutoff</label><input class="mb-control" id="mbDeadline" type="date" data-field="deadline" value="' + esc(state.values.deadline) + '"' + invalidAttr('deadline') + '/><small>The final valid provider observation at or before 23:59:59 UTC on this date is used.</small>' + errorText('deadline') + '</div></div></section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Proposal timeline</h2></div><p>Cutoff and determination are deliberately separate.</p></div><div class="mb-rule-stack"><div class="mb-rule-row"><span>Baseline observed</span><b>' + esc(observedAt ? humanDate(observedAt) : 'Unverified manual entry') + '</b></div><div class="mb-rule-row"><span>Measurement cutoff</span><b>' + esc(humanDate(state.values.deadline)) + ' at 23:59:59 UTC</b></div><div class="mb-rule-row"><span>Provider grace period</span><b>' + esc(state.values.graceHours) + ' hours after cutoff</b></div><div class="mb-rule-row"><span>Determination</span><b>After the final valid observation is retained and edge-case rules are applied</b></div></div></section>';
  }

  function validationReport() {
    var availability = metricAvailability();
    var errors = validateAll();
    var blockers = [{ code: 'discovery_only', label: 'Local discovery proposal', copy: 'Saving this draft does not create creator consent, market approval, a price, an order, or real-money execution.' }];
    var warnings = [];
    if (availability.state !== 'available') blockers.push({ code: 'metric', label: availability.label, copy: availability.copy });
    if (DATA.isSnapshot) warnings.push({ label: 'Retained snapshot', copy: 'Source observations reflect the catalog as of ' + humanDate(DATA.generatedAt) + ', not a continuously live counter.' });
    return { errors: errors, blockers: blockers, warnings: warnings, executable: false, proposalAllowed: errors.length === 0, quote: null, feeRate: null };
  }

  function validationItems() {
    var report = validationReport();
    var html = '';
    if (!report.errors.length) html += '<div class="mb-validation-item"><span class="mb-validation-mark">OK</span><div><b>Proposal terms are structurally complete</b><p>The subject, future claim, cutoff, exact source, and edge-case rules are all present.</p></div></div>';
    report.errors.forEach(function (item) { html += '<div class="mb-validation-item is-error"><span class="mb-validation-mark">X</span><div><b>' + esc(item.message) + '</b><p>Return to ' + esc(STEPS[item.step].label) + ' to correct this field.</p></div></div>'; });
    report.blockers.forEach(function (item) { html += '<div class="mb-validation-item is-blocker"><span class="mb-validation-mark">!</span><div><b>' + esc(display(item.label)) + '</b><p>' + esc(display(item.copy)) + '</p></div></div>'; });
    report.warnings.forEach(function (item) { html += '<div class="mb-validation-item is-blocker"><span class="mb-validation-mark">i</span><div><b>' + esc(display(item.label)) + '</b><p>' + esc(display(item.copy)) + '</p></div></div>'; });
    return html;
  }

  function stepValidation() {
    var person = selectedPerson();
    var platform = platformRecord(person, state.values.platform);
    var provider = DATA.providerStatus && DATA.providerStatus[state.values.platform] || {};
    var availability = metricAvailability();
    var observation = availability.retained && availability.retained.observation;
    return '<span class="mb-kicker">How resolved</span><h1>Keep the source and edge cases explicit.</h1><p class="mb-lede">The proposal title is only a summary. This exact provider observation path and these written rules control any later determination.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-field"><label for="mbSource">Resolution source</label><input class="mb-control" id="mbSource" type="url" inputmode="url" data-field="sourceUrl" value="' + esc(state.values.sourceUrl) + '" placeholder="https://" ' + (observation ? 'disabled' : '') + invalidAttr('sourceUrl') + '/><small>' + (observation ? 'Locked to the exact retained observation source.' : 'Use the exact public profile, work, repository, or provider page attached to the selected subject.') + '</small>' + errorText('sourceUrl') + '</div>' +
      (safeURL(state.values.sourceUrl) ? '<a class="mb-source-link" href="' + esc(safeURL(state.values.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">Open retained source</a>' : '') +
      '<div class="mb-rule-stack"><div class="mb-rule-row"><span>Provider</span><b>' + esc(platformLabel(state.values.platform)) + '</b></div><div class="mb-rule-row"><span>Observation ID</span><b>' + esc(observation && observation.id || 'None retained - unverified idea') + '</b></div><div class="mb-rule-row"><span>Observed at</span><b>' + esc(observation ? humanDate(observation.observedAt) : 'Not retained') + '</b></div><div class="mb-rule-row"><span>Identity source</span><b>' + esc(display(platform && (platform.sourceUrl || platform.url) || state.values.sourceUrl || 'Not set')) + '</b></div><div class="mb-rule-row"><span>Provider run</span><b>' + esc(display(provider.publishState || provider.state || 'Retained catalog')) + '</b></div></div></section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Edge-case rules</h2></div><p>Missing access never becomes a zero. A delayed or deleted source follows these rules.</p></div><div class="mb-grid"><div class="mb-field"><label for="mbGrace">Provider grace period</label><input class="mb-control" id="mbGrace" type="number" min="0" max="168" step="1" data-field="graceHours" value="' + esc(state.values.graceHours) + '"' + invalidAttr('graceHours') + '/><small>Hours to wait after cutoff for a delayed valid observation.</small>' + errorText('graceHours') + '</div><div class="mb-field"><label for="mbDispute">Evidence review window</label><input class="mb-control" id="mbDispute" type="number" min="1" max="168" step="1" data-field="disputeHours" value="' + esc(state.values.disputeHours) + '"' + invalidAttr('disputeHours') + '/><small>Hours after a provisional determination to review source evidence.</small>' + errorText('disputeHours') + '</div>' +
      '<div class="mb-field"><label for="mbDeletion">Deletion or private-content rule</label><select class="mb-control" id="mbDeletion" data-field="deletionRule"><option value="pause_then_void" ' + (state.values.deletionRule === 'pause_then_void' ? 'selected' : '') + '>Pause through grace, then no result</option><option value="last_valid_snapshot" ' + (state.values.deletionRule === 'last_valid_snapshot' ? 'selected' : '') + '>Use approved last valid snapshot</option></select><small>No zero value is inferred from deletion or private status.</small></div>' +
      '<div class="mb-field"><label for="mbCorrection">Provider correction rule</label><select class="mb-control" id="mbCorrection" data-field="correctionRule"><option value="latest_valid_before_cutoff" ' + (state.values.correctionRule === 'latest_valid_before_cutoff' ? 'selected' : '') + '>Latest valid correction before cutoff</option><option value="freeze_at_cutoff" ' + (state.values.correctionRule === 'freeze_at_cutoff' ? 'selected' : '') + '>Freeze retained value at cutoff</option></select><small>Later corrections require a timestamped audit entry.</small></div>' +
      (state.values.instrument === 'pk' ? '<div class="mb-field"><label for="mbTie">Tie rule</label><select class="mb-control" id="mbTie" data-field="tieRule"><option value="separate_outcome" ' + (state.values.tieRule === 'separate_outcome' ? 'selected' : '') + '>Separate tie outcome</option><option value="void_on_tie" ' + (state.values.tieRule === 'void_on_tie' ? 'selected' : '') + '>No result on exact tie</option></select><small>The rule applies to equal retained values at the cutoff.</small></div>' : '') +
      '<div class="mb-field"><label for="mbVoid">Unresolved-source rule</label><select class="mb-control" id="mbVoid" data-field="voidRule"><option value="refund_original_cost" ' + (state.values.voidRule === 'refund_original_cost' ? 'selected' : '') + '>Record no proposal result</option><option value="refund_equal_value" ' + (state.values.voidRule === 'refund_equal_value' ? 'selected' : '') + '>Record outcomes as unresolved</option></select><small>This local draft has no funds to return.</small></div></div></section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Readiness check</h2></div><p>A complete local proposal can be saved for review. It does not open a market or create execution controls.</p></div><div class="mb-validation">' + validationItems() + '</div></section>';
  }

  function outcomesText() {
    if (state.values.instrument === 'pk') return [state.values.outcomeA, state.values.outcomeB].filter(Boolean).concat(state.values.tieRule === 'separate_outcome' ? ['Tie or no winner'] : []).join(' / ');
    return 'Grows to target / Does not reach target';
  }
  function rulesRows() {
    var metric = selectedMetric();
    var availability = metricAvailability();
    return [
      ['Question', state.values.question || 'Not set'],
      ['Outcomes', outcomesText()],
      ['Native metric', metric ? platformLabel(state.values.platform) + ' ' + metric.label : 'Not set'],
      ['Baseline', state.values.baseline ? Number(state.values.baseline).toLocaleString('en-US') + ' on ' + humanDate(state.values.baselineAt) : 'Not set'],
      ['Target', state.values.target ? Number(state.values.target).toLocaleString('en-US') : 'Not set'],
      ['Cutoff', humanDate(state.values.deadline)],
      ['Source', state.values.sourceUrl || 'Not set'],
      ['Metric state', availability.label],
      ['Provider delay', state.values.graceHours + ' hour grace period'],
      ['Deletion', state.values.deletionRule === 'last_valid_snapshot' ? 'Use approved last valid snapshot' : 'Pause through grace period, then void'],
      ['Correction', state.values.correctionRule === 'freeze_at_cutoff' ? 'Freeze retained value at cutoff' : 'Use latest valid correction before cutoff'],
      ['Tie', state.values.instrument === 'pk' ? (state.values.tieRule === 'separate_outcome' ? 'Separate tie outcome' : 'No result on exact tie') : 'Not applicable'],
      ['Unresolved source', state.values.voidRule === 'refund_equal_value' ? 'Record outcomes as unresolved' : 'Record no proposal result'],
      ['Dispute', state.values.disputeHours + ' hour evidence review window']
    ];
  }
  function ruleStack() { return '<div class="mb-rule-stack">' + rulesRows().map(function (row) { return '<div class="mb-rule-row"><span>' + esc(display(row[0])) + '</span><b>' + esc(display(row[1])) + '</b></div>'; }).join('') + '</div>'; }
  function proposalBoundary() {
    return '<div class="mb-preview-ticket"><div class="mb-preview-ticket-head"><b>Local proposal only</b><span>Saved on this device</span></div><p class="mb-preview-note">This draft records a future growth claim and its evidence rules. It has no price, order, probability, wallet, payout, or real-money execution.</p></div>';
  }
  function stepPreview() {
    return '<span class="mb-kicker">Review proposal</span><h1>' + esc(display(state.values.question || canonicalQuestion())) + '</h1><p class="mb-lede">Confirm the subject, future claim, cutoff, exact source, and edge cases before saving this local proposal.</p><section class="mb-section">' + personStrip() + '</section><section class="mb-section"><div class="mb-section-head"><div><h2>Resolution terms</h2></div><p>The title summarizes the proposal; these terms define it.</p></div>' + ruleStack() + '</section><section class="mb-section"><div class="mb-section-head"><div><h2>Proposal boundary</h2></div></div>' + proposalBoundary() + '</section><section class="mb-section"><div class="mb-section-head"><div><h2>Final check</h2></div></div><div class="mb-validation">' + validationItems() + '</div></section>';
  }

  function renderStage() {
    if (state.step === 0) return stepSubject();
    if (state.step === 1) return stepOutcome();
    if (state.step === 2) return stepResolution();
    if (state.step === 3) return stepValidation();
    return stepPreview();
  }
  function stepRail() {
    return '<aside class="mb-rail"><p class="mb-rail-label">Growth proposal</p><ol class="mb-step-list">' + STEPS.map(function (step, index) {
      var klass = index === state.step ? 'is-active' : index < state.step ? 'is-complete' : '';
      var disabled = index > state.maxStep ? 'disabled' : '';
      return '<li><button type="button" class="mb-step-button ' + klass + '" data-action="step" data-value="' + index + '" ' + disabled + '><span class="mb-step-number">' + (index < state.step ? 'OK' : index + 1) + '</span><span class="mb-step-copy"><b>' + esc(step.label) + '</b><small>' + esc(step.note) + '</small></span></button></li>';
    }).join('') + '</ol><p class="mb-rail-note">This builder saves a versioned local proposal. It does not create consent, a price, an order, or a real-money product.</p></aside>';
  }
  function previewPanel() {
    var person = selectedPerson();
    var metric = selectedMetric();
    return '<aside class="mb-preview" aria-label="Growth proposal preview"><div class="mb-preview-inner"><div class="mb-preview-label"><span>Proposal preview</span><b>Local draft</b></div><div class="mb-preview-shell"><div class="mb-preview-card"><div class="mb-preview-subject"><img src="' + esc(safeImage(person && person.avatar)) + '" alt=""/><div><small>' + esc(state.values.scope === 'content' ? 'Public work by ' + (person ? person.name : '') : 'Person growth') + '</small><b>' + esc(display(subjectName())) + '</b></div></div><div class="mb-preview-question"><small>' + esc(state.values.instrument === 'pk' ? 'Head-to-head growth' : 'Growth milestone') + '</small><h2>' + esc(display(state.values.question || canonicalQuestion())) + '</h2></div><div class="mb-preview-facts"><div class="mb-preview-fact"><small>Metric</small><b>' + esc(metric ? metric.label : 'Not set') + '</b></div><div class="mb-preview-fact"><small>Cutoff</small><b>' + esc(humanDate(state.values.deadline)) + '</b></div><div class="mb-preview-fact"><small>Baseline</small><b>' + esc(state.values.baseline || 'Not set') + '</b></div><div class="mb-preview-fact"><small>Target</small><b>' + esc(state.values.target || 'Not set') + '</b></div></div>' + proposalBoundary() + '</div></div><p class="mb-preview-note">Proof of Attention remains separate research evidence. It does not supply a proposal price or determine the result.</p></div></aside>';
  }
  function actions() {
    var report = validationReport();
    var isLast = state.step === STEPS.length - 1;
    var primaryLabel = isLast ? (state.editDraft ? 'Save changes' : 'Save proposal') : 'Continue';
    var disabled = isLast && !report.proposalAllowed ? 'disabled' : '';
    return '<footer class="mb-actions"><div class="mb-action-status">' + (report.errors.length ? '<b>Complete the required terms before saving.</b>' : 'Ready to save as a local discovery proposal.') + '</div><div class="mb-action-group">' + (state.step > 0 ? '<button type="button" class="mb-btn" data-action="previous">Back</button>' : '') + '<button type="button" class="mb-btn primary" data-action="' + (isLast ? 'save' : 'next') + '" ' + disabled + '>' + primaryLabel + '</button></div></footer>';
  }
  function render() {
    if (!root || !state) return;
    if (state.receipt) { renderReceipt(); return; }
    root.innerHTML = '<div class="mb-shell">' + stepRail() + '<div class="mb-workspace"><div class="mb-mobile-progress"><span>Step ' + (state.step + 1) + ' of ' + STEPS.length + '</span><b>' + esc(STEPS[state.step].label) + '</b></div><form class="mb-stage" id="mbStage" novalidate>' + renderStage() + '</form></div>' + previewPanel() + actions() + '</div>';
    root.setAttribute('aria-busy', 'false');
  }

  function validateStep(step) {
    var errors = [];
    var person = selectedPerson();
    var baseline = finiteNumber(state.values.baseline);
    var target = finiteNumber(state.values.target);
    function add(field, message) { errors.push({ field: field, message: message, step: step }); }
    if (step === 0) {
      if (!person) add('personId', 'Choose a person from the retained discovery catalog.');
      if (state.values.scope === 'content' && !selectedWork()) add('contentKey', 'Choose a public work by this person.');
    } else if (step === 1) {
      if (VALID_INSTRUMENTS.indexOf(state.values.instrument) < 0) add('instrument', 'Choose a growth milestone or head-to-head comparison.');
      if (availablePlatforms().indexOf(state.values.platform) < 0) add('platform', 'Choose a platform linked to this subject.');
      if (!selectedMetric()) add('metricKey', 'Choose one provider-native metric.');
      if (baseline == null || baseline < 0) add('baseline', 'Enter an exact non-negative baseline value.');
      if (target == null || target < 0) add('target', 'Enter an exact non-negative target value.');
      if (baseline != null && target != null && target <= baseline) add('target', 'A growth target must be greater than the baseline.');
      if (clean(state.values.question).length < 12) add('question', 'Write a clear future growth claim.');
      if (clean(state.values.question).length > 220) add('question', 'Keep the proposal title under 220 characters.');
      if (state.values.instrument === 'pk') {
        if (!clean(state.values.outcomeA)) add('outcomeA', 'Name the first comparison subject.');
        if (!clean(state.values.outcomeB)) add('outcomeB', 'Name the second comparison subject.');
        if (clean(state.values.outcomeA).toLowerCase() === clean(state.values.outcomeB).toLowerCase()) add('outcomeB', 'Comparison subjects must be distinct.');
      }
    } else if (step === 2) {
      if (!state.values.deadline || isNaN(Date.parse(state.values.deadline + 'T23:59:59Z'))) add('deadline', 'Choose an exact measurement cutoff.');
      else if (Date.parse(state.values.deadline + 'T23:59:59Z') <= Date.now()) add('deadline', 'The measurement cutoff must be in the future.');
    } else if (step === 3) {
      if (!safeURL(state.values.sourceUrl)) add('sourceUrl', 'Enter a complete HTTP or HTTPS resolution source.');
      var grace = finiteNumber(state.values.graceHours);
      var dispute = finiteNumber(state.values.disputeHours);
      if (grace == null || grace < 0 || grace > 168) add('graceHours', 'Set a provider grace period from 0 to 168 hours.');
      if (dispute == null || dispute < 1 || dispute > 168) add('disputeHours', 'Set a dispute window from 1 to 168 hours.');
      if (!state.values.deletionRule) add('deletionRule', 'Choose a deletion or private-content rule.');
      if (!state.values.correctionRule) add('correctionRule', 'Choose a correction rule.');
      if (state.values.instrument === 'pk' && !state.values.tieRule) add('tieRule', 'Choose an explicit tie rule.');
      if (!state.values.voidRule) add('voidRule', 'Choose an unresolved-source rule.');
    }
    return errors;
  }
  function validateAll() {
    var all = [];
    for (var i = 0; i < 4; i++) all = all.concat(validateStep(i));
    return all;
  }
  function setErrors(errors) {
    state.errors = {};
    errors.forEach(function (item) { if (!state.errors[item.field]) state.errors[item.field] = item.message; });
  }
  function focusFirstError() {
    window.requestAnimationFrame(function () {
      var target = root.querySelector('[aria-invalid="true"]');
      if (target && target.focus) target.focus();
    });
  }
  function goNext() {
    var errors = validateStep(state.step);
    if (errors.length) { setErrors(errors); render(); focusFirstError(); return; }
    state.errors = {};
    state.step = Math.min(STEPS.length - 1, state.step + 1);
    state.maxStep = Math.max(state.maxStep, state.step);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function draftId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return 'm2_' + window.crypto.randomUUID();
    return 'm2_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }
  function buildDraft() {
    var report = validationReport();
    var person = selectedPerson();
    var work = selectedWork();
    var metric = selectedMetric();
    var availability = metricAvailability();
    var existing = state.editDraft;
    var id = existing ? existing.draftId : draftId();
    var now = new Date().toISOString();
    var retained = state.values.baselineProvenance === 'retained' && availability.retained ? availability.retained : null;
    var observed = retained && retained.observation;
    var resolutionSource = retained ? retained.sourceUrl : safeURL(state.values.sourceUrl);
    var outcomes = state.values.instrument === 'pk'
      ? [{ id: 'A', label: clean(state.values.outcomeA) }, { id: 'B', label: clean(state.values.outcomeB) }].concat(state.values.tieRule === 'separate_outcome' ? [{ id: 'TIE', label: 'Tie or no winner' }] : [])
      : [{ id: 'GROWS_TO_TARGET', label: 'Grows to target' }, { id: 'DOES_NOT_REACH_TARGET', label: 'Does not reach target' }];
    return {
      schemaVersion: 2,
      draftId: id,
      createdAt: existing && existing.createdAt ? existing.createdAt : now,
      updatedAt: now,
      source: 'discovery-builder',
      executionMode: 'simulation',
      status: 'local_draft',
      approvalStatus: 'discovery_proposal',
      subject: {
        type: state.values.scope === 'content' ? 'content-growth' : 'person-growth',
        person: {
          id: person.id,
          name: clean(person.name),
          handle: clean(person.handle),
          avatar: safeImage(person.avatar),
          category: clean(person.category),
          identityKind: 'public_discovery',
          tradable: false,
          platforms: (person.platforms || []).map(function (item) { return { id: clean(item.id), provider: clean(item.provider || item.id), sourceIdentityId: clean(item.sourceIdentityId), nativeId: clean(item.nativeId), handle: clean(item.handle), url: safeURL(item.url), sourceUrl: safeURL(item.sourceUrl), observedAt: clean(item.observedAt) }; }),
          eligibility: clean(person.eligibility),
          claimStatus: clean(person.claimStatus),
          consentStatus: clean(person.consentStatus)
        },
        content: work && work.work ? {
          id: workKey(work.work, work.key, person.id),
          role: work.key,
          title: clean(work.work.title),
          type: clean(work.work.type),
          platform: clean(work.work.platform),
          url: safeURL(work.work.url),
          sourceUrl: safeURL(work.work.sourceUrl || work.work.url),
          thumbnail: safeImage(work.work.thumbnail || person.avatar),
          publishedAt: clean(work.work.publishedAt),
          observedAt: clean(work.work.observedAt),
          availability: clean(work.work.availability)
        } : null
      },
      instrument: state.values.instrument,
      outcome: {
        type: state.values.instrument === 'pk' ? 'multi' : 'binary',
        question: clean(state.values.question),
        outcomes: outcomes,
        selectedSide: null
      },
      resolution: {
        platform: state.values.platform,
        metricKey: metric.nativeKey,
        metricLabel: metric.label,
        unit: metric.unit,
        readiness: retained ? 'retained_observation' : 'unverified_idea',
        availability: retained ? 'retained_observation' : 'unverified_idea',
        availabilityLabel: retained ? 'Retained source observation' : 'Unverified metric idea',
        observation: observed ? {
          id: clean(observed.id),
          entityType: clean(observed.entityType),
          entityId: clean(observed.entityId),
          provider: clean(observed.provider),
          metric: clean(observed.metric || observed.key),
          value: finiteNumber(observed.value),
          unit: clean(observed.unit),
          observedAt: clean(observed.observedAt),
          sourceUrl: safeURL(observed.sourceUrl),
          methodologyVersion: clean(observed.methodologyVersion),
          window: observed.window == null ? null : clean(observed.window),
          visibility: clean(observed.visibility),
          access: clean(observed.access),
          availability: clean(observed.availability),
          freshness: observed.freshness && typeof observed.freshness === 'object' ? Object.assign({}, observed.freshness) : null,
          confidence: observed.confidence && typeof observed.confidence === 'object' ? Object.assign({}, observed.confidence) : null
        } : null,
        baseline: {
          value: finiteNumber(state.values.baseline),
          observedAt: retained && state.values.baselineObservedAt ? state.values.baselineObservedAt : state.values.baselineAt + 'T00:00:00Z',
          provenance: retained ? 'retained_source_observation' : 'user_entered_unverified',
          sourceUrl: resolutionSource
        },
        target: { value: finiteNumber(state.values.target), direction: state.values.instrument === 'pk' ? 'highest_at_cutoff_above_minimum' : 'at_least' },
        deadline: state.values.deadline + 'T23:59:59Z',
        sourceUrl: resolutionSource,
        providerState: DATA.providerStatus && DATA.providerStatus[state.values.platform] ? clean(DATA.providerStatus[state.values.platform].state) : 'unknown',
        sourceSnapshotAsOf: clean(DATA.generatedAt)
      },
      rules: {
        graceHours: finiteNumber(state.values.graceHours),
        deletionRule: state.values.deletionRule,
        correctionRule: state.values.correctionRule,
        tieRule: state.values.instrument === 'pk' ? state.values.tieRule : 'not_applicable',
        voidRule: state.values.voidRule,
        disputeHours: finiteNumber(state.values.disputeHours)
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
      validation: {
        structurallyValid: report.errors.length === 0,
        executable: false,
        errors: report.errors.map(function (item) { return { field: item.field, message: item.message }; }),
        blockers: report.blockers.map(function (item) { return { code: item.code, label: item.label, copy: item.copy }; }),
        warnings: report.warnings
      },
      provenance: {
        discoveryCatalogSchemaVersion: DATA.schemaVersion,
        discoveryCatalogGeneratedAt: clean(DATA.generatedAt),
        dataMode: state.dataMode || 'snapshot',
        noFabricatedMetrics: true,
        manualMetricUnverified: !retained
      }
    };
  }

  function saveDraft() {
    var errors = validateAll();
    if (errors.length) {
      setErrors(errors);
      state.step = errors[0].step;
      render();
      focusFirstError();
      return;
    }
    var draft = buildDraft();
    var result = window.BackerMarketDraftStore && window.BackerMarketDraftStore.save(draft);
    if (!result || !result.ok) {
      showError('This browser could not save the proposal', result && result.message || 'Local and tab storage are unavailable. Allow site storage and try again.');
      return;
    }
    state.editDraft = draft;
    state.storageMode = result.storage;
    state.storageDisclosure = result.disclosure;
    state.receipt = draft;
    renderReceipt();
    try {
      window.dispatchEvent(new CustomEvent('backer:market-builder-created', { detail: { draftId: draft.draftId, instrument: draft.instrument, approvalStatus: draft.approvalStatus } }));
    } catch (eventError) {}
  }

  function renderReceipt() {
    var draft = state.receipt;
    var tradesRoute = 'backerdemo.html#trades?view=proposals&proposal=' + encodeURIComponent(draft.draftId);
    var previewRoute = 'backermarket.html?draft=' + encodeURIComponent(draft.draftId) + '&source=trades';
    var disclosure = state.storageDisclosure || (state.storageMode === 'session' ? 'Saved for this tab only' : 'Saved on this device');
    root.innerHTML = '<section class="mb-receipt"><div class="mb-receipt-head"><span class="mb-receipt-status">Discovery proposal saved</span><h1>The proposal is ready for review.</h1><p>' + esc(disclosure) + '. The exact subject, future claim, cutoff, source, and edge-case rules were retained. No market, price, or position was created.</p></div><div class="mb-receipt-grid"><div class="mb-receipt-panel"><div class="mb-receipt-core"><span class="mb-receipt-id">' + esc(draft.draftId) + '</span><h2>' + esc(display(draft.outcome.question)) + '</h2>' + ruleStack() + '</div></div><div class="mb-receipt-panel"><div class="mb-receipt-core"><h2>Next</h2><div class="mb-validation-item is-blocker"><span class="mb-validation-mark">!</span><div><b>Local proposal only</b><p>It has no price, odds, orders, volume, payout, or real-money execution.</p></div></div><div class="mb-receipt-actions"><a class="mb-btn primary" href="' + esc(tradesRoute) + '">View in Trades</a><a class="mb-btn" href="' + esc(previewRoute) + '">Preview proposal terms</a><a class="mb-btn" href="backerdemo.html#market2">Return to Discovery</a><button type="button" class="mb-btn" data-action="edit-receipt">Edit proposal</button></div></div></div></div></section>';
    root.setAttribute('aria-busy', 'false');
    var primary = root.querySelector('.mb-btn.primary');
    if (primary) primary.focus();
  }

  function showError(title, copy) {
    if (!root) return;
    root.innerHTML = '<section class="mb-error-state"><span class="mb-kicker">Builder unavailable</span><h1>' + esc(title) + '</h1><p>' + esc(copy) + '</p><a class="mb-btn" href="backerdemo.html#market2">Return to Discovery</a></section>';
    root.setAttribute('aria-busy', 'false');
  }

  function updateField(field, value, rerender) {
    if (!(field in state.values)) return;
    state.values[field] = value;
    if (field === 'baseline' || field === 'baselineAt') {
      state.values.baselineProvenance = 'manual';
      state.values.baselineObservedAt = '';
    }
    delete state.errors[field];
    if (field === 'personId') {
      var changedPerson = selectedPerson();
      state.values.contentKey = changedPerson && changedPerson.content && changedPerson.content[0] ? changedPerson.content[0].id : '';
      state.values.platform = '';
      state.values.metricKey = '';
      state.values.baseline = '';
      state.values.baselineObservedAt = '';
      state.values.baselineProvenance = 'manual';
      state.values.sourceUrl = '';
      syncSubjectDefaults(true);
      state.values.question = defaultQuestion();
      rerender = true;
    } else if (field === 'contentKey') {
      state.values.platform = '';
      state.values.metricKey = '';
      state.values.baseline = '';
      state.values.baselineObservedAt = '';
      state.values.baselineProvenance = 'manual';
      state.values.sourceUrl = '';
      syncSubjectDefaults(true);
      rerender = true;
    } else if (field === 'platform') {
      state.values.metricKey = '';
      state.values.baseline = '';
      state.values.baselineObservedAt = '';
      state.values.baselineProvenance = 'manual';
      state.values.sourceUrl = '';
      syncSubjectDefaults(true);
      rerender = true;
    } else if (field === 'metricKey') {
      state.values.baseline = '';
      state.values.baselineObservedAt = '';
      state.values.baselineProvenance = 'manual';
      syncSubjectDefaults(true);
      rerender = true;
    }
    if (rerender) render();
    else refreshPreview();
  }
  function refreshPreview() {
    var preview = root.querySelector('.mb-preview');
    if (preview) preview.outerHTML = previewPanel();
  }

  function handleAction(button) {
    var action = button.dataset.action;
    var value = button.dataset.value;
    if (action === 'scope') {
      state.values.scope = value === 'content' ? 'content' : 'person';
      var currentPerson = selectedPerson();
      state.values.contentKey = currentPerson && currentPerson.content && currentPerson.content[0] ? currentPerson.content[0].id : '';
      state.values.platform = '';
      state.values.metricKey = '';
      state.values.baseline = '';
      state.values.baselineObservedAt = '';
      state.values.baselineProvenance = 'manual';
      state.values.sourceUrl = '';
      syncSubjectDefaults(true);
      state.values.question = defaultQuestion();
      render();
    } else if (action === 'instrument') {
      state.values.instrument = value === 'pk' ? 'pk' : 'milestone';
      state.values.direction = state.values.instrument === 'pk' ? 'highest_at_cutoff' : 'at_least';
      state.values.selectedSide = state.values.instrument === 'pk' ? 'A' : 'GROWS_TO_TARGET';
      state.values.question = defaultQuestion();
      render();
    } else if (action === 'generate-question') {
      state.values.question = canonicalQuestion();
      render();
      var question = document.getElementById('mbQuestion');
      if (question) question.focus();
    } else if (action === 'side') {
      state.values.selectedSide = value;
      render();
    } else if (action === 'step') {
      var step = Number(value);
      if (step <= state.maxStep && step >= 0 && step < STEPS.length) { state.step = step; state.errors = {}; render(); }
    } else if (action === 'previous') {
      state.step = Math.max(0, state.step - 1); state.errors = {}; render();
    } else if (action === 'next') {
      goNext();
    } else if (action === 'save') {
      saveDraft();
    } else if (action === 'edit-receipt') {
      state.receipt = null; state.step = STEPS.length - 1; render();
    }
  }

  function bind() {
    if (!root) return;
    root.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-action]');
      if (!button || !root.contains(button)) return;
      event.preventDefault();
      if (!button.disabled) handleAction(button);
    });
    root.addEventListener('input', function (event) {
      var field = event.target && event.target.dataset ? event.target.dataset.field : '';
      if (!field) return;
      updateField(field, event.target.value, false);
    });
    root.addEventListener('change', function (event) {
      var field = event.target && event.target.dataset ? event.target.dataset.field : '';
      if (!field) return;
      updateField(field, event.target.value, event.target.tagName === 'SELECT');
    });
    root.addEventListener('submit', function (event) { event.preventDefault(); goNext(); });
  }

  function validData(data) { return data && Array.isArray(data.people) && data.people.length > 0; }
  function loadData() {
    if (!window.BackerDiscoveryCatalog || typeof window.BackerDiscoveryCatalog.load !== 'function') return Promise.reject(new Error('The retained discovery catalog client did not load'));
    return window.BackerDiscoveryCatalog.load({ url: DATA_URL }).then(function (data) {
      if (!validData(data)) throw new Error('The retained discovery catalog is empty');
      return { data: data, mode: 'retained_catalog' };
    });
  }

  function boot() {
    if (!root) return;
    bind();
    loadData().then(function (result) {
      if (!validData(result.data)) {
        showError('The public identity snapshot did not load', 'Refresh this page from the Backer site. No market proposal was created.');
        return;
      }
      DATA = result.data;
      initialState();
      state.dataMode = result.mode;
      render();
    }).catch(function (error) {
      var message = clean(error && error.message) || 'The retained discovery catalog did not load';
      showError(message, 'The builder stopped instead of substituting another profile or work. Return to Discovery and choose an item that still exists in the retained catalog.');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
