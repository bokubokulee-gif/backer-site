/* Backer Market Builder
   Creates source-backed simulation proposals without inventing provider metrics,
   market quotes, or creator consent. */
(function () {
  'use strict';

  var DATA_URL = 'data/market2-people.json';
  var STORAGE_PREFIX = 'backer_market_route_draft_v1:';
  var VALID_INSTRUMENTS = ['milestone', 'pk'];
  var STEPS = [
    { id: 'subject', label: 'Subject', note: 'Person or public work' },
    { id: 'outcome', label: 'Outcome', note: 'Question and sides' },
    { id: 'resolution', label: 'Resolution', note: 'Metric and cutoff' },
    { id: 'validation', label: 'Validation', note: 'Safeguards and access' },
    { id: 'preview', label: 'Preview', note: 'Review the proposal' }
  ];
  var PLATFORM_LABELS = { x: 'X', youtube: 'YouTube', instagram: 'Instagram', github: 'GitHub' };
  var NATIVE_METRIC_ALIASES = {
    public_repositories: ['public_repos'],
    repository_stars: ['stargazers_count'],
    repository_forks: ['forks_count'],
    repository_watchers: ['subscribers_count']
  };
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
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (error) { return ''; }
  }
  function safeImage(value) { return safeURL(value) || 'img/backer-mark.png?v=2'; }
  function platformLabel(id) { return PLATFORM_LABELS[id] || clean(id) || 'Platform'; }
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
  function selectedPerson() { return personById(state.values.personId) || (DATA.people && DATA.people[0]) || null; }
  function workKey(work, fallback, personId) {
    if (!work) return fallback;
    return work.id || (work.url ? slug((personId || state.values.personId || 'work') + '-' + work.url) : '') || slug(work.title) || fallback;
  }
  function selectedWork() {
    var person = selectedPerson();
    if (!person || state.values.scope !== 'content') return null;
    var candidates = [
      { key: 'recent', label: 'Latest work', work: person.recentWork },
      { key: 'breakout', label: 'Breakout work', work: person.breakoutWork }
    ].filter(function (item) { return item.work; });
    var needle = clean(state.values.contentKey).toLowerCase();
    return candidates.filter(function (item) {
      var normalizedId = workKey(item.work, item.key, person.id);
      return needle === item.key || needle === normalizedId || needle === slug(item.work.title) || needle === clean(item.work.url).toLowerCase();
    })[0] || candidates[0] || null;
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
    var group = state.values.scope === 'content' ? 'content' : 'person';
    return METRICS[platform] && METRICS[platform][group] ? METRICS[platform][group] : [];
  }
  function selectedMetric() {
    return metricList().filter(function (metric) { return metric.key === state.values.metricKey; })[0] || null;
  }
  function comparableURL(value) {
    var url = safeURL(value);
    if (!url) return '';
    try {
      var parsed = new URL(url);
      return (parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '')).toLowerCase();
    } catch (error) { return url.toLowerCase(); }
  }
  function countRows() {
    var person = selectedPerson();
    var work = selectedWork();
    var rows = [];
    function add(list) { if (Array.isArray(list)) rows = rows.concat(list); }
    var nativeSnapshot = person && DATA.nativeMetricSnapshots && DATA.nativeMetricSnapshots[person.id]
      ? DATA.nativeMetricSnapshots[person.id][state.values.platform]
      : null;
    if (nativeSnapshot && Array.isArray(nativeSnapshot.metrics)) {
      var workURL = work && work.work ? comparableURL(work.work.sourceUrl || work.work.url) : '';
      add(nativeSnapshot.metrics.filter(function (row) {
        if (!row || row.availability && row.availability !== 'observed') return false;
        if (state.values.scope === 'content') {
          if (row.subject !== 'repository' && row.subject !== 'content') return false;
          return !workURL || comparableURL(row.sourceUrl) === workURL;
        }
        return row.subject === 'account' || !row.subject;
      }).map(function (row) {
        return Object.assign({}, row, {
          observedAt: row.observedAt || nativeSnapshot.observedAt,
          sourceUrl: row.sourceUrl || nativeSnapshot.sourceUrl,
          nativeSnapshotState: nativeSnapshot.state,
          accessClass: row.accessClass || nativeSnapshot.accessClass
        });
      }));
    }
    if (work && work.work) add(work.work.publicCounts);
    if (person) {
      add(person.publicCounts);
      if (person.evidence) Object.keys(person.evidence).forEach(function (range) { add(person.evidence[range] && person.evidence[range].publicCounts); });
    }
    return rows;
  }
  function retainedMetricValue(metric) {
    if (!metric) return null;
    var aliases = NATIVE_METRIC_ALIASES[metric.key] || [];
    var needles = [metric.key, metric.label].concat(aliases).map(function (item) { return slug(item); });
    var found = countRows().filter(function (row) {
      var key = slug(row && (row.key || row.metric || row.label || row.name));
      return needles.indexOf(key) >= 0 && finiteNumber(row && (row.value != null ? row.value : row.count)) != null;
    })[0];
    if (!found) return null;
    return {
      value: finiteNumber(found.value != null ? found.value : found.count),
      asOf: found.asOf || found.observedAt || DATA.generatedAt,
      sourceUrl: safeURL(found.sourceUrl || found.url),
      sourceKey: clean(found.key || found.metric),
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
    if (metric.access === 'authorized' && clean(person && person.consentStatus) !== 'approved') {
      return { state: 'authorization_required', label: 'Creator authorization required', copy: metric.label + ' is not available from this public snapshot. It can be proposed, but not opened for trading.', retained: null };
    }
    if (retained) return { state: 'available', label: 'Retained source observation', copy: 'The snapshot contains a numeric observation with provenance. Eligibility and consent are checked separately.', retained: retained };
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

  function initialState() {
    var params = new URLSearchParams(window.location.search);
    var people = DATA && Array.isArray(DATA.people) ? DATA.people : [];
    var requestedPerson = clean(params.get('person') || params.get('creator'));
    var person = personById(requestedPerson) || people[0] || null;
    var requestedContent = clean(params.get('content'));
    var requestedScope = clean(params.get('scope') || params.get('subject'));
    var scope = requestedScope === 'content' || requestedScope === 'content-growth' || requestedContent ? 'content' : 'person';
    var requestedInstrument = clean(params.get('instrument')).toLowerCase();
    var instrument = VALID_INSTRUMENTS.indexOf(requestedInstrument) >= 0 ? requestedInstrument : 'milestone';
    var temp = {
      step: 0,
      maxStep: 0,
      receipt: null,
      errors: {},
      values: {
        scope: scope,
        personId: person ? person.id : '',
        contentKey: requestedContent || 'recent',
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
        selectedSide: instrument === 'pk' ? 'A' : 'YES',
        orderType: 'MARKET',
        stake: ''
      }
    };
    state = temp;
    syncSubjectDefaults(true);
    state.values.question = defaultQuestion();
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
    var workOptions = person ? [
      person.recentWork ? '<option value="recent" ' + (work && work.key === 'recent' ? 'selected' : '') + '>Latest: ' + esc(display(person.recentWork.title)) + '</option>' : '',
      person.breakoutWork ? '<option value="breakout" ' + (work && work.key === 'breakout' ? 'selected' : '') + '>Breakout: ' + esc(display(person.breakoutWork.title)) + '</option>' : ''
    ].join('') : '';
    return '<span class="mb-kicker">Choose the subject</span><h1>Start with the person, then define the event.</h1><p class="mb-lede">Backer keeps the human identity and original work in view while you write a measurable proposal. Public discovery does not imply consent to trade.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>What should this market follow?</h2></div><p>Person growth follows one native account metric. Content growth follows one public work.</p></div><div class="mb-choice-grid">' +
      '<button type="button" class="mb-choice ' + (state.values.scope === 'person' ? 'is-selected' : '') + '" data-action="scope" data-value="person"><b>Person growth</b><small>Followers, subscribers, channel views, or another native account metric.</small></button>' +
      '<button type="button" class="mb-choice ' + (state.values.scope === 'content' ? 'is-selected' : '') + '" data-action="scope" data-value="content"><b>Content growth</b><small>Views, likes, stars, forks, or another native metric on one work.</small></button></div></section>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field mb-span-2"><label for="mbPerson">Person</label><select class="mb-control" id="mbPerson" data-field="personId"' + invalidAttr('personId') + '>' + peopleOptions + '</select><small>Loaded from the dated Market 2 public identity snapshot.</small>' + errorText('personId') + '</div>' +
      (state.values.scope === 'content' ? '<div class="mb-field mb-span-2"><label for="mbContent">Public work</label><select class="mb-control" id="mbContent" data-field="contentKey"' + invalidAttr('contentKey') + '>' + workOptions + '</select><small>Only the original public URL and retained snapshot metadata are carried into the proposal.</small>' + errorText('contentKey') + '</div>' : '') + '</div></section>';
  }

  function stepOutcome() {
    var isPk = state.values.instrument === 'pk';
    return '<span class="mb-kicker">Define the outcome</span><h1>Write one neutral question people can understand.</h1><p class="mb-lede">A Milestone is binary. A PK market compares mutually exclusive outcomes using the same metric, window, and source standard.</p>' +
      '<section class="mb-section">' + personStrip() + '</section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Instrument</h2></div><p>Creator Perps require an approved internal market and cannot be composed here.</p></div><div class="mb-choice-grid"><button type="button" class="mb-choice ' + (!isPk ? 'is-selected' : '') + '" data-action="instrument" data-value="milestone"><b>Milestone</b><small>Yes or No on one exact target and deadline.</small></button><button type="button" class="mb-choice ' + (isPk ? 'is-selected' : '') + '" data-action="instrument" data-value="pk"><b>PK Market</b><small>Two comparable outcomes, with an explicit tie rule.</small></button></div></section>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field mb-span-2"><label for="mbQuestion">Market question</label><textarea class="mb-control" id="mbQuestion" maxlength="220" data-field="question"' + invalidAttr('question') + '>' + esc(display(state.values.question)) + '</textarea><small>Use a neutral, answerable sentence. Resolution details become the binding rule.</small>' + errorText('question') + '</div>' +
      (isPk ? '<div class="mb-field"><label for="mbOutcomeA">Outcome A</label><input class="mb-control" id="mbOutcomeA" maxlength="80" data-field="outcomeA" value="' + esc(display(state.values.outcomeA)) + '"' + invalidAttr('outcomeA') + '/>' + errorText('outcomeA') + '</div><div class="mb-field"><label for="mbOutcomeB">Outcome B</label><input class="mb-control" id="mbOutcomeB" maxlength="80" data-field="outcomeB" value="' + esc(display(state.values.outcomeB)) + '" placeholder="Name the comparison outcome"' + invalidAttr('outcomeB') + '/>' + errorText('outcomeB') + '</div>' : '<div class="mb-field"><label>Outcome one</label><input class="mb-control" value="Yes: reaches target" disabled/><small>Settles to $1 per share only if the written rule is met.</small></div><div class="mb-field"><label>Outcome two</label><input class="mb-control" value="No: misses target" disabled/><small>Settles to $1 per share if the written rule is not met.</small></div>') + '</div><button type="button" class="mb-source-link" data-action="generate-question">Use a source-specific question</button></section>';
  }

  function metricOptions() {
    return metricList().map(function (metric) {
      var selected = metric.key === state.values.metricKey;
      var suffix = metric.access === 'authorized' ? ' (authorization required)' : '';
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
    var person = selectedPerson();
    var platform = platformRecord(person, state.values.platform);
    var provider = DATA.providerStatus && DATA.providerStatus[state.values.platform] || {};
    var isContent = state.values.scope === 'content';
    return '<span class="mb-kicker">Define resolution</span><h1>Make the measurement exact before anyone takes a side.</h1><p class="mb-lede">Choose one provider-native metric. Backer will not merge unlike engagement signals or treat a manually entered number as observed evidence.</p>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field"><label for="mbPlatform">Platform</label><select class="mb-control" id="mbPlatform" data-field="platform" ' + (isContent ? 'disabled' : '') + invalidAttr('platform') + '>' + platformOptions() + '</select><small>' + (isContent ? 'Locked to the original work platform.' : 'Limited to linked public profiles in the snapshot.') + '</small>' + errorText('platform') + '</div><div class="mb-field"><label for="mbMetric">Native metric</label><select class="mb-control" id="mbMetric" data-field="metricKey"' + invalidAttr('metricKey') + '>' + metricOptions() + '</select><small>One native measurement only. Composite attention scores cannot settle a market.</small>' + errorText('metricKey') + '</div><div class="mb-span-2">' + availabilityPanel() + '</div></div></section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Baseline and target</h2></div><p>These values define the proposal. They are not labeled as observed unless the retained source contains them.</p></div><div class="mb-grid"><div class="mb-field"><label for="mbBaseline">Baseline value</label><input class="mb-control" id="mbBaseline" type="number" min="0" step="1" inputmode="numeric" data-field="baseline" value="' + esc(state.values.baseline) + '" placeholder="Enter an exact value"' + invalidAttr('baseline') + '/><small>' + (state.values.baselineProvenance === 'retained' ? 'Observed in the retained native snapshot at ' + display(state.values.baselineObservedAt) + '.' : 'Manual values remain unverified until a source snapshot is approved.') + '</small>' + errorText('baseline') + '</div><div class="mb-field"><label for="mbBaselineAt">Baseline timestamp</label><input class="mb-control" id="mbBaselineAt" type="date" data-field="baselineAt" value="' + esc(state.values.baselineAt) + '"' + invalidAttr('baselineAt') + '/><small>Use the date attached to the proposed baseline source.</small>' + errorText('baselineAt') + '</div><div class="mb-field"><label for="mbTarget">Target value</label><input class="mb-control" id="mbTarget" type="number" min="0" step="1" inputmode="numeric" data-field="target" value="' + esc(state.values.target) + '" placeholder="Enter an exact target"' + invalidAttr('target') + '/><small>' + (state.values.instrument === 'pk' ? 'Minimum qualifying value before highest-at-cutoff comparison.' : 'Must be greater than the baseline for a growth milestone.') + '</small>' + errorText('target') + '</div><div class="mb-field"><label for="mbDeadline">Measurement cutoff</label><input class="mb-control" id="mbDeadline" type="date" data-field="deadline" value="' + esc(state.values.deadline) + '"' + invalidAttr('deadline') + '/><small>Resolution uses the final valid observation at or before this cutoff.</small>' + errorText('deadline') + '</div></div></section>' +
      '<section class="mb-section"><div class="mb-field"><label for="mbSource">Official resolution source</label><input class="mb-control" id="mbSource" type="url" inputmode="url" data-field="sourceUrl" value="' + esc(state.values.sourceUrl) + '" placeholder="https://"' + invalidAttr('sourceUrl') + '/><small>Use the exact public profile, content, repository, or authorized provider endpoint that will be snapshotted.</small>' + errorText('sourceUrl') + '</div>' +
      (safeURL(state.values.sourceUrl) ? '<a class="mb-source-link" href="' + esc(safeURL(state.values.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">Open proposed source</a>' : '') +
      '<div class="mb-rule-stack"><div class="mb-rule-row"><span>Provider state</span><b>' + esc(display(provider.label || provider.state || 'Unknown')) + '</b></div><div class="mb-rule-row"><span>Retained as of</span><b>' + esc(humanDate(provider.asOf || DATA.generatedAt)) + '</b></div><div class="mb-rule-row"><span>Identity source</span><b>' + esc(display(platform && (platform.sourceUrl || platform.url) || state.values.sourceUrl || 'Not set')) + '</b></div></div></section>';
  }

  function validationReport() {
    var person = selectedPerson();
    var availability = metricAvailability();
    var errors = validateAll();
    var blockers = [];
    var warnings = [];
    var instrumentKey = state.values.instrument === 'pk' ? 'pk_market' : 'milestones';
    var instrument = person && person.instruments && person.instruments[instrumentKey] || {};
    if (person && person.eligibility !== 'eligible' && person.eligibility !== 'tradable') blockers.push({ code: 'discovery_only', label: 'Discovery profile', copy: 'Public discovery does not make a person tradable. Creator claim, consent, and policy review are still required.' });
    if (!person || person.consentStatus !== 'approved') blockers.push({ code: 'consent', label: 'Consent not approved', copy: 'The snapshot contains no approved consent record for an executable market.' });
    if (availability.state !== 'available') blockers.push({ code: 'metric', label: availability.label, copy: availability.copy });
    if (instrument.status !== 'available' && instrument.status !== 'open') blockers.push({ code: 'instrument', label: (instrument.label || (state.values.instrument === 'pk' ? 'PK Market' : 'Milestone')) + ' is not approved', copy: instrument.reason || 'This instrument has no approved settlement configuration for the selected person.' });
    if (!person || !person.poa || !person.poa.settlement || person.poa.settlement.status !== 'approved') blockers.push({ code: 'settlement', label: 'Settlement source not approved', copy: 'The proposal includes a source URL, but market operations have not approved it as an oracle.' });
    var quote = finiteNumber(instrument.quote != null ? instrument.quote : instrument.price);
    var feeRate = finiteNumber(instrument.feeRate);
    if (quote == null || quote <= 0 || quote >= 100) blockers.push({ code: 'quote', label: 'No executable quote', copy: 'Backer will not create a pre-market price from the baseline, target, or Proof of Attention.' });
    if (feeRate == null) blockers.push({ code: 'fee', label: 'No approved fee schedule', copy: 'Fees and maximum loss remain unavailable until this proposal is approved and quoted.' });
    if (DATA.isSnapshot) warnings.push({ label: 'Dated snapshot', copy: 'Provider links and evidence reflect the last-good snapshot as of ' + humanDate(DATA.generatedAt) + ', not a live feed.' });
    var executable = errors.length === 0 && blockers.length === 0;
    return { errors: errors, blockers: blockers, warnings: warnings, executable: executable, proposalAllowed: errors.length === 0, quote: quote, feeRate: feeRate };
  }

  function validationItems() {
    var report = validationReport();
    var html = '';
    if (!report.errors.length) html += '<div class="mb-validation-item"><span class="mb-validation-mark">OK</span><div><b>Resolution terms are structurally complete</b><p>The question, metric, baseline, target, cutoff, source, and safeguard rules are all present.</p></div></div>';
    report.errors.forEach(function (item) { html += '<div class="mb-validation-item is-error"><span class="mb-validation-mark">X</span><div><b>' + esc(item.message) + '</b><p>Return to ' + esc(STEPS[item.step].label) + ' to correct this field.</p></div></div>'; });
    report.blockers.forEach(function (item) { html += '<div class="mb-validation-item is-blocker"><span class="mb-validation-mark">!</span><div><b>' + esc(display(item.label)) + '</b><p>' + esc(display(item.copy)) + '</p></div></div>'; });
    report.warnings.forEach(function (item) { html += '<div class="mb-validation-item is-blocker"><span class="mb-validation-mark">i</span><div><b>' + esc(display(item.label)) + '</b><p>' + esc(display(item.copy)) + '</p></div></div>'; });
    return html;
  }

  function stepValidation() {
    return '<span class="mb-kicker">Resolution safeguards</span><h1>Decide what happens when the source is late, changed, or gone.</h1><p class="mb-lede">These rules are part of settlement, not fine print. They are shown to every participant before a position can be confirmed.</p>' +
      '<section class="mb-section"><div class="mb-grid"><div class="mb-field"><label for="mbGrace">Provider grace period</label><input class="mb-control" id="mbGrace" type="number" min="0" max="168" step="1" data-field="graceHours" value="' + esc(state.values.graceHours) + '"' + invalidAttr('graceHours') + '/><small>Hours to wait for a delayed provider observation.</small>' + errorText('graceHours') + '</div><div class="mb-field"><label for="mbDispute">Dispute window</label><input class="mb-control" id="mbDispute" type="number" min="1" max="168" step="1" data-field="disputeHours" value="' + esc(state.values.disputeHours) + '"' + invalidAttr('disputeHours') + '/><small>Hours after the provisional result for evidence review.</small>' + errorText('disputeHours') + '</div>' +
      '<div class="mb-field"><label for="mbDeletion">Deletion or private-content rule</label><select class="mb-control" id="mbDeletion" data-field="deletionRule"><option value="pause_then_void" ' + (state.values.deletionRule === 'pause_then_void' ? 'selected' : '') + '>Pause through grace, then void</option><option value="last_valid_snapshot" ' + (state.values.deletionRule === 'last_valid_snapshot' ? 'selected' : '') + '>Use approved last valid snapshot</option></select><small>No zero value is inferred from deletion or private status.</small></div>' +
      '<div class="mb-field"><label for="mbCorrection">Provider correction rule</label><select class="mb-control" id="mbCorrection" data-field="correctionRule"><option value="latest_valid_before_cutoff" ' + (state.values.correctionRule === 'latest_valid_before_cutoff' ? 'selected' : '') + '>Latest valid correction before cutoff</option><option value="freeze_at_cutoff" ' + (state.values.correctionRule === 'freeze_at_cutoff' ? 'selected' : '') + '>Freeze retained value at cutoff</option></select><small>Later corrections require a timestamped audit entry.</small></div>' +
      (state.values.instrument === 'pk' ? '<div class="mb-field"><label for="mbTie">Tie rule</label><select class="mb-control" id="mbTie" data-field="tieRule"><option value="separate_outcome" ' + (state.values.tieRule === 'separate_outcome' ? 'selected' : '') + '>Separate tie outcome</option><option value="void_on_tie" ' + (state.values.tieRule === 'void_on_tie' ? 'selected' : '') + '>Void and refund on exact tie</option></select><small>The rule applies to equal retained values at the cutoff.</small></div>' : '') +
      '<div class="mb-field"><label for="mbVoid">Void and refund rule</label><select class="mb-control" id="mbVoid" data-field="voidRule"><option value="refund_original_cost" ' + (state.values.voidRule === 'refund_original_cost' ? 'selected' : '') + '>Refund at original cost</option><option value="refund_equal_value" ' + (state.values.voidRule === 'refund_equal_value' ? 'selected' : '') + '>Refund outcomes at equal value</option></select><small>Applies when the source remains invalid or incomparable.</small></div></div></section>' +
      '<section class="mb-section"><div class="mb-section-head"><div><h2>Readiness check</h2></div><p>Blocking items prevent an executable market, but a complete discovery proposal can still be saved for review.</p></div><div class="mb-validation">' + validationItems() + '</div></section>';
  }

  function outcomesText() {
    if (state.values.instrument === 'pk') return [state.values.outcomeA, state.values.outcomeB].filter(Boolean).concat(state.values.tieRule === 'separate_outcome' ? ['Tie or no winner'] : []).join(' / ');
    return 'Yes: reaches target / No: misses target';
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
      ['Tie', state.values.instrument === 'pk' ? (state.values.tieRule === 'separate_outcome' ? 'Separate tie outcome' : 'Void and refund') : 'Not applicable'],
      ['Void', state.values.voidRule === 'refund_equal_value' ? 'Refund outcomes at equal value' : 'Refund at original cost'],
      ['Dispute', state.values.disputeHours + ' hour evidence review window']
    ];
  }
  function ruleStack() { return '<div class="mb-rule-stack">' + rulesRows().map(function (row) { return '<div class="mb-rule-row"><span>' + esc(display(row[0])) + '</span><b>' + esc(display(row[1])) + '</b></div>'; }).join('') + '</div>'; }
  function orderReview(compact) {
    var report = validationReport();
    var sideA = state.values.instrument === 'pk' ? state.values.outcomeA || 'Outcome A' : 'Yes';
    var sideB = state.values.instrument === 'pk' ? state.values.outcomeB || 'Outcome B' : 'No';
    var quote = report.executable ? report.quote : null;
    var stake = finiteNumber(state.values.stake);
    var fee = report.executable && stake != null ? stake * report.feeRate : null;
    var maxLoss = report.executable && stake != null ? stake + fee : null;
    return '<div class="mb-preview-ticket"><div class="mb-preview-ticket-head"><b>Position preview</b><span>' + (report.executable ? 'Approved simulation' : 'Locked until approval') + '</span></div><div class="mb-side-row"><button type="button" class="mb-side ' + (state.values.selectedSide === (state.values.instrument === 'pk' ? 'A' : 'YES') ? 'is-selected' : '') + '" data-action="side" data-value="' + (state.values.instrument === 'pk' ? 'A' : 'YES') + '" ' + (!report.executable ? 'disabled' : '') + '>' + esc(display(sideA)) + '</button><button type="button" class="mb-side ' + (state.values.selectedSide === (state.values.instrument === 'pk' ? 'B' : 'NO') ? 'is-selected' : '') + '" data-action="side" data-value="' + (state.values.instrument === 'pk' ? 'B' : 'NO') + '" ' + (!report.executable ? 'disabled' : '') + '>' + esc(display(sideB)) + '</button></div><div class="mb-ticket-grid"><div class="mb-ticket-cell"><small>Price</small><b>' + (quote == null ? 'No quote' : quote + ' cents') + '</b></div><div class="mb-ticket-cell"><small>Stake</small><b>' + (stake == null ? 'Not entered' : '$' + stake.toFixed(2)) + '</b></div><div class="mb-ticket-cell"><small>Estimated fees</small><b>' + (fee == null ? 'Unavailable' : '$' + fee.toFixed(2)) + '</b></div><div class="mb-ticket-cell"><small>Maximum loss</small><b>' + (maxLoss == null ? 'Unavailable' : '$' + maxLoss.toFixed(2)) + '</b></div></div>' + (!compact && report.executable ? '<div class="mb-field" style="margin-top:12px"><label for="mbStake">Simulation stake</label><input class="mb-control" id="mbStake" type="number" min="1" step="1" inputmode="numeric" data-field="stake" value="' + esc(state.values.stake) + '" placeholder="Enter stake"/></div>' : '') + '<p class="mb-preview-note">No real money moves. Price, fees, payout, and maximum loss remain blank until an approved market has an actual simulation quote.</p></div>';
  }
  function stepPreview() {
    var report = validationReport();
    return '<span class="mb-kicker">Review the proposal</span><h1>' + esc(display(state.values.question || canonicalQuestion())) + '</h1><p class="mb-lede">Check the exact settlement terms. ' + (report.executable ? 'This configuration has the required approval and quote to open a simulation ticket.' : 'This will be saved as a discovery proposal and will open in the full terminal as Opening soon.') + '</p><section class="mb-section"><div class="mb-section-head"><div><h2>Binding resolution terms</h2></div><p>Editing any field creates a new version of the local draft.</p></div>' + ruleStack() + '</section><section class="mb-section"><div class="mb-section-head"><div><h2>Familiar position flow</h2></div><p>Side, price, stake, fees, and maximum loss appear only after an actual approved quote exists.</p></div>' + orderReview(false) + '</section><section class="mb-section"><div class="mb-section-head"><div><h2>Approval boundary</h2></div></div><div class="mb-validation">' + validationItems() + '</div></section>';
  }

  function renderStage() {
    if (state.step === 0) return stepSubject();
    if (state.step === 1) return stepOutcome();
    if (state.step === 2) return stepResolution();
    if (state.step === 3) return stepValidation();
    return stepPreview();
  }
  function stepRail() {
    return '<aside class="mb-rail"><p class="mb-rail-label">Market proposal</p><ol class="mb-step-list">' + STEPS.map(function (step, index) {
      var klass = index === state.step ? 'is-active' : index < state.step ? 'is-complete' : '';
      var disabled = index > state.maxStep ? 'disabled' : '';
      return '<li><button type="button" class="mb-step-button ' + klass + '" data-action="step" data-value="' + index + '" ' + disabled + '><span class="mb-step-number">' + (index < state.step ? 'OK' : index + 1) + '</span><span class="mb-step-copy"><b>' + esc(step.label) + '</b><small>' + esc(step.note) + '</small></span></button></li>';
    }).join('') + '</ol><p class="mb-rail-note">This builder creates a versioned local simulation proposal. It does not create consent, a real-money product, or a market price.</p></aside>';
  }
  function previewPanel() {
    var person = selectedPerson();
    var metric = selectedMetric();
    var report = validationReport();
    return '<aside class="mb-preview" aria-label="Live market proposal preview"><div class="mb-preview-inner"><div class="mb-preview-label"><span>Live proposal</span><b>' + (report.executable ? 'Approved simulation' : 'Discovery only') + '</b></div><div class="mb-preview-shell"><div class="mb-preview-card"><div class="mb-preview-subject"><img src="' + esc(safeImage(person && person.avatar)) + '" alt=""/><div><small>' + esc(state.values.scope === 'content' ? 'Public work by ' + (person ? person.name : '') : 'Person growth') + '</small><b>' + esc(display(subjectName())) + '</b></div></div><div class="mb-preview-question"><small>' + esc(state.values.instrument === 'pk' ? 'PK Market' : 'Milestone') + '</small><h2>' + esc(display(state.values.question || canonicalQuestion())) + '</h2></div><div class="mb-preview-facts"><div class="mb-preview-fact"><small>Metric</small><b>' + esc(metric ? metric.label : 'Not set') + '</b></div><div class="mb-preview-fact"><small>Cutoff</small><b>' + esc(humanDate(state.values.deadline)) + '</b></div><div class="mb-preview-fact"><small>Baseline</small><b>' + esc(state.values.baseline || 'Not set') + '</b></div><div class="mb-preview-fact"><small>Target</small><b>' + esc(state.values.target || 'Not set') + '</b></div></div>' + orderReview(true) + '</div></div><p class="mb-preview-note">Proof of Attention remains a separate underwriting interface. It does not settle this proposal or supply a pre-market quote.</p></div></aside>';
  }
  function actions() {
    var report = validationReport();
    var isLast = state.step === STEPS.length - 1;
    var primaryLabel = isLast ? (report.executable ? 'Create simulated market' : 'Save discovery proposal') : 'Continue';
    var disabled = isLast && !report.proposalAllowed ? 'disabled' : '';
    return '<footer class="mb-actions"><div class="mb-action-status">' + (report.blockers.length ? '<b>' + report.blockers.length + ' opening blocker' + (report.blockers.length === 1 ? '' : 's') + '</b> remain. A complete proposal can still be saved.' : 'All approval checks passed for simulation.') + '</div><div class="mb-action-group">' + (state.step > 0 ? '<button type="button" class="mb-btn" data-action="previous">Back</button>' : '') + '<button type="button" class="mb-btn primary" data-action="' + (isLast ? 'save' : 'next') + '" ' + disabled + '>' + primaryLabel + '</button></div></footer>';
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
      if (!person) add('personId', 'Choose a person from the Market 2 snapshot.');
      if (state.values.scope === 'content' && !selectedWork()) add('contentKey', 'Choose a public work by this person.');
    } else if (step === 1) {
      if (VALID_INSTRUMENTS.indexOf(state.values.instrument) < 0) add('instrument', 'Choose Milestone or PK Market.');
      if (clean(state.values.question).length < 12) add('question', 'Write a neutral question with enough detail to understand the event.');
      if (clean(state.values.question).length > 220) add('question', 'Keep the market question under 220 characters.');
      if (state.values.instrument === 'pk') {
        if (!clean(state.values.outcomeA)) add('outcomeA', 'Name the first mutually exclusive outcome.');
        if (!clean(state.values.outcomeB)) add('outcomeB', 'Name the second mutually exclusive outcome.');
        if (clean(state.values.outcomeA).toLowerCase() === clean(state.values.outcomeB).toLowerCase()) add('outcomeB', 'PK outcomes must be distinct.');
      }
    } else if (step === 2) {
      if (availablePlatforms().indexOf(state.values.platform) < 0) add('platform', 'Choose a platform linked to this subject.');
      if (!selectedMetric()) add('metricKey', 'Choose one provider-native metric.');
      if (baseline == null || baseline < 0) add('baseline', 'Enter an exact non-negative baseline value.');
      if (!state.values.baselineAt || isNaN(Date.parse(state.values.baselineAt + 'T00:00:00Z'))) add('baselineAt', 'Enter the baseline observation date.');
      if (target == null || target < 0) add('target', 'Enter an exact non-negative target value.');
      if (baseline != null && target != null && target <= baseline) add('target', 'A growth target must be greater than the proposed baseline.');
      if (!state.values.deadline || isNaN(Date.parse(state.values.deadline + 'T23:59:59Z'))) add('deadline', 'Choose an exact measurement cutoff.');
      else if (Date.parse(state.values.deadline + 'T23:59:59Z') <= Date.now()) add('deadline', 'The measurement cutoff must be in the future.');
      if (!safeURL(state.values.sourceUrl)) add('sourceUrl', 'Enter a complete HTTP or HTTPS resolution source.');
    } else if (step === 3) {
      var grace = finiteNumber(state.values.graceHours);
      var dispute = finiteNumber(state.values.disputeHours);
      if (grace == null || grace < 0 || grace > 168) add('graceHours', 'Set a provider grace period from 0 to 168 hours.');
      if (dispute == null || dispute < 1 || dispute > 168) add('disputeHours', 'Set a dispute window from 1 to 168 hours.');
      if (!state.values.deletionRule) add('deletionRule', 'Choose a deletion or private-content rule.');
      if (!state.values.correctionRule) add('correctionRule', 'Choose a correction rule.');
      if (state.values.instrument === 'pk' && !state.values.tieRule) add('tieRule', 'Choose an explicit tie rule.');
      if (!state.values.voidRule) add('voidRule', 'Choose a void and refund rule.');
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
    var id = draftId();
    var now = new Date().toISOString();
    var approvalStatus = report.executable ? 'approved_simulation' : 'discovery_proposal';
    var outcomes = state.values.instrument === 'pk'
      ? [{ id: 'A', label: clean(state.values.outcomeA) }, { id: 'B', label: clean(state.values.outcomeB) }].concat(state.values.tieRule === 'separate_outcome' ? [{ id: 'TIE', label: 'Tie or no winner' }] : [])
      : [{ id: 'YES', label: 'Yes: reaches target' }, { id: 'NO', label: 'No: misses target' }];
    return {
      schemaVersion: 1,
      draftId: id,
      createdAt: now,
      updatedAt: now,
      source: 'market2-builder',
      executionMode: 'simulation',
      status: approvalStatus,
      approvalStatus: approvalStatus,
      subject: {
        type: state.values.scope === 'content' ? 'content-growth' : 'person-growth',
        person: {
          id: person.id,
          name: clean(person.name),
          handle: clean(person.handle),
          avatar: safeImage(person.avatar),
          category: clean(person.category),
          platforms: (person.platforms || []).map(function (item) { return { id: clean(item.id), handle: clean(item.handle), url: safeURL(item.url), sourceUrl: safeURL(item.sourceUrl), asOf: clean(item.asOf) }; }),
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
        selectedSide: clean(state.values.selectedSide)
      },
      resolution: {
        platform: state.values.platform,
        metricKey: metric.key,
        metricLabel: metric.label,
        unit: metric.unit,
        availability: availability.state,
        availabilityLabel: availability.label,
        baseline: {
          value: finiteNumber(state.values.baseline),
          observedAt: state.values.baselineProvenance === 'retained' && state.values.baselineObservedAt ? state.values.baselineObservedAt : state.values.baselineAt + 'T00:00:00Z',
          provenance: state.values.baselineProvenance === 'retained' ? 'retained_source_observation' : 'user_entered_unverified',
          sourceUrl: state.values.baselineProvenance === 'retained' && availability.retained ? availability.retained.sourceUrl : safeURL(state.values.sourceUrl)
        },
        target: { value: finiteNumber(state.values.target), direction: state.values.instrument === 'pk' ? 'highest_at_cutoff_above_minimum' : 'at_least' },
        deadline: state.values.deadline + 'T23:59:59Z',
        sourceUrl: safeURL(state.values.sourceUrl),
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
        lifecycle: report.executable ? 'OPEN' : 'OPENING_SOON',
        approvalStatus: approvalStatus,
        hasSyntheticQuote: false,
        quote: report.executable ? report.quote : null,
        feeRate: report.executable ? report.feeRate : null,
        stake: report.executable ? finiteNumber(state.values.stake) : null,
        maxLoss: null
      },
      validation: {
        structurallyValid: report.errors.length === 0,
        executable: report.executable,
        errors: report.errors.map(function (item) { return { field: item.field, message: item.message }; }),
        blockers: report.blockers.map(function (item) { return { code: item.code, label: item.label, copy: item.copy }; }),
        warnings: report.warnings
      },
      provenance: {
        market2SchemaVersion: DATA.schemaVersion,
        market2GeneratedAt: clean(DATA.generatedAt),
        dataMode: state.dataMode || 'snapshot',
        noAiImagery: true,
        noFabricatedMetrics: true
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
    try {
      sessionStorage.setItem(STORAGE_PREFIX + draft.draftId, JSON.stringify(draft));
    } catch (error) {
      showError('This browser could not save the proposal', 'Session storage is unavailable. Keep this tab open, allow site storage, and try again.');
      return;
    }
    state.receipt = draft;
    renderReceipt();
    try {
      window.dispatchEvent(new CustomEvent('backer:market-builder-created', { detail: { draftId: draft.draftId, instrument: draft.instrument, approvalStatus: draft.approvalStatus } }));
    } catch (eventError) {}
  }

  function renderReceipt() {
    var draft = state.receipt;
    var route = 'backermarket.html?draft=' + encodeURIComponent(draft.draftId) + '&instrument=' + encodeURIComponent(draft.instrument) + '&source=market2-builder';
    var discovery = draft.approvalStatus !== 'approved_simulation';
    root.innerHTML = '<section class="mb-receipt"><div class="mb-receipt-head"><span class="mb-receipt-status">' + (discovery ? 'Discovery proposal saved' : 'Simulation market created') + '</span><h1>' + (discovery ? 'The proposal is ready for review.' : 'The simulated market is ready.') + '</h1><p>' + (discovery ? 'Backer saved the exact question and settlement terms in this browser session. The full terminal will show Opening soon with no quote or order controls until consent, policy, source, and market approval are complete.' : 'The approved simulation can open the familiar position ticket in the full Backer market terminal.') + '</p></div><div class="mb-receipt-grid"><div class="mb-receipt-panel"><div class="mb-receipt-core"><span class="mb-receipt-id">' + esc(draft.draftId) + '</span><h2>' + esc(display(draft.outcome.question)) + '</h2>' + ruleStack() + '</div></div><div class="mb-receipt-panel"><div class="mb-receipt-core"><h2>Next</h2><div class="mb-validation-item ' + (discovery ? 'is-blocker' : '') + '"><span class="mb-validation-mark">' + (discovery ? '!' : 'OK') + '</span><div><b>' + (discovery ? 'Opening soon' : 'Open for simulation') + '</b><p>' + (discovery ? 'No price, orders, volume, or market-implied probability exists for this proposal.' : 'Review the quote, stake, fees, maximum loss, and confirmation before placing a simulated position.') + '</p></div></div><div class="mb-receipt-actions"><a class="mb-btn primary" href="' + esc(route) + '">Open in full market terminal</a><a class="mb-btn" href="backerdemo.html#market2">Return to Market 2</a><button type="button" class="mb-btn" data-action="edit-receipt">Edit proposal</button></div></div></div></div></section>';
    root.setAttribute('aria-busy', 'false');
    var primary = root.querySelector('.mb-btn.primary');
    if (primary) primary.focus();
  }

  function showError(title, copy) {
    if (!root) return;
    root.innerHTML = '<section class="mb-error-state"><span class="mb-kicker">Builder unavailable</span><h1>' + esc(title) + '</h1><p>' + esc(copy) + '</p><a class="mb-btn" href="backerdemo.html#market2">Return to Market 2</a></section>';
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
      state.values.contentKey = 'recent';
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
      state.values.contentKey = 'recent';
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
      state.values.selectedSide = state.values.instrument === 'pk' ? 'A' : 'YES';
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
    var bundled = window.BACKER_MARKET2_DATA || window.BackerMarket2Data || null;
    if (typeof window.fetch !== 'function') return Promise.resolve({ data: bundled, mode: 'bundled_fallback' });
    return window.fetch(DATA_URL, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .then(function (data) { if (!validData(data)) throw new Error('Invalid Market 2 snapshot'); return { data: data, mode: 'static_json' }; })
      .catch(function () { return { data: bundled, mode: 'bundled_fallback' }; });
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
    }).catch(function () {
      showError('The public identity snapshot did not load', 'Refresh this page from the Backer site. No market proposal was created.');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
