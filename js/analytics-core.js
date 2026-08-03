/* =========================================================
   BACKER — privacy-safe analytics primitives
   No network calls or DOM mutations live in this file.
   ========================================================= */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerAnalyticsCore = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var POLICY_VERSION = '2026-07-24';
  var CONSENT_KEY = 'backer_analytics_consent_v1';
  var VISITOR_KEY = 'backer_analytics_visitor_v1';
  var SESSION_KEY = 'backer_analytics_session_v1';
  var SESSION_TTL_MS = 30 * 60 * 1000;
  var PUBLIC_COUNT_BASE = 2049;
  var PUBLIC_COUNT_DAILY = 3;
  var PUBLIC_COUNT_ANCHOR_UTC = Date.UTC(2026, 6, 24);

  var EVENT_PROPS = {
    market_home_viewed: [],
    market_card_opened: ['market_id', 'creator_id', 'source'],
    market_filter_changed: ['filter', 'value', 'state', 'source'],
    market_sort_changed: ['sort', 'source'],
    market_poa_opened: ['market_id', 'creator_id', 'source'],
    market_position_started: ['market_id', 'creator_id', 'instrument', 'side', 'outcome', 'source'],
    market_position_completed: ['market_id', 'creator_id', 'instrument', 'side', 'outcome', 'source'],
    market_position_blocked: ['market_id', 'creator_id', 'instrument', 'reason', 'source'],
    signup_started: ['role', 'step', 'source'],
    signup_completed: ['role', 'source'],
    portfolio_viewed: [],
    creator_viewed: ['creator_id'],
    search_submitted: ['source'],
    poa_market_context_toggled: ['on'],
    market_instrument_changed: ['instrument'],
    poa_mode_changed: ['scope'],
    poa_timeline_range_changed: ['range'],
    poa_candle_interval_changed: ['interval'],
    poa_timeline_scrubbed: ['as_of'],
    poa_composition_segment_selected: ['band'],
    poa_evidence_expanded: [],
    poa_methodology_viewed: [],
    poa_limitations_viewed: [],
    poa_data_table_opened: [],
    poa_timeline_event_selected: ['content_id'],
    poa_content_selected: ['content_id'],
    poa_replay_started: [],
    poa_replay_paused: [],
    poa_timeline_viewed: ['creator_id']
  };

  function safeStorage(storage) {
    return storage && typeof storage.getItem === 'function' ? storage : null;
  }

  function readConsent(storage) {
    storage = safeStorage(storage);
    if (!storage) return null;
    try {
      var parsed = JSON.parse(storage.getItem(CONSENT_KEY) || 'null');
      if (!parsed || (parsed.decision !== 'accepted' && parsed.decision !== 'rejected')) return null;
      if (parsed.policyVersion !== POLICY_VERSION || typeof parsed.timestamp !== 'string') return null;
      return {
        decision: parsed.decision,
        policyVersion: parsed.policyVersion,
        timestamp: parsed.timestamp
      };
    } catch (e) {
      return null;
    }
  }

  function writeConsent(storage, decision, now) {
    storage = safeStorage(storage);
    if (!storage || (decision !== 'accepted' && decision !== 'rejected')) return null;
    var record = {
      decision: decision,
      policyVersion: POLICY_VERSION,
      timestamp: new Date(now == null ? Date.now() : now).toISOString()
    };
    try { storage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch (e) {}
    return record;
  }

  function privacySignal(navigatorLike, windowLike) {
    navigatorLike = navigatorLike || {};
    windowLike = windowLike || {};
    var dnt = navigatorLike.doNotTrack || windowLike.doNotTrack || navigatorLike.msDoNotTrack;
    return {
      gpc: navigatorLike.globalPrivacyControl === true,
      dnt: dnt === '1' || dnt === 1 || dnt === 'yes'
    };
  }

  function effectiveConsent(stored, signal) {
    if (stored && stored.decision === 'accepted') return 'accepted';
    if (stored && stored.decision === 'rejected') return 'rejected';
    return signal && (signal.gpc || signal.dnt) ? 'rejected' : 'rejected';
  }

  function uuid(cryptoLike) {
    cryptoLike = cryptoLike || {};
    if (typeof cryptoLike.randomUUID === 'function') return cryptoLike.randomUUID();
    var bytes = new Uint8Array(16);
    if (typeof cryptoLike.getRandomValues === 'function') cryptoLike.getRandomValues(bytes);
    else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var h = Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function cleanToken(value, max) {
    var out = String(value == null ? '' : value)
      .toLowerCase()
      .replace(/[^a-z0-9._:-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max || 64);
    return out;
  }

  function cleanPublicId(value) {
    var out = String(value == null ? '' : value).trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(out) ? out : '';
  }

  function cleanCampaign(value) {
    return String(value == null ? '' : value)
      .trim()
      .replace(/[^A-Za-z0-9._~-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  function sanitizeTitle(value) {
    return String(value == null ? 'Backer' : value)
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'Backer';
  }

  function safeURL(locationLike) {
    try {
      if (locationLike && locationLike.href) return new URL(locationLike.href);
      if (typeof locationLike === 'string') return new URL(locationLike, 'https://backer.invalid/');
    } catch (e) {}
    return new URL('https://backer.invalid/');
  }

  function initialRoute(locationLike) {
    var url = safeURL(locationLike);
    var file = (url.pathname.split('/').pop() || 'index.html').toLowerCase();
    var view;
    var arg = '';

    if (file === 'backerdemo.html' || file === '' || file === 'index.html') {
      var requested = url.searchParams.get('view');
      if (requested === 'market' || /^#market(?:\?|$)/.test(url.hash)) view = 'market';
      else if (requested === 'search') view = 'search';
      else view = 'home';
    } else if (file === 'backermarket.html') {
      if (url.searchParams.has('position')) {
        view = 'market_position';
      } else {
        view = 'market_detail';
        arg = cleanPublicId(url.searchParams.get('market') || '');
      }
    } else if (file === 'backerthesis.html') view = 'thesis';
    else if (file === 'pitch.html') view = 'pitch';
    else if (file === 'faq.html') view = 'faq';
    else if (file === 'waitlist.html') view = 'waitlist';
    else if (file === 'onboarding.html') view = 'onboarding';
    else if (file === 'signup.html') view = 'signup';
    else if (file === 'portfolio.html') view = 'portfolio';
    else if (file === 'privacy.html') view = 'privacy';
    else view = 'page';
    return canonicalRoute(view, arg);
  }

  function canonicalRoute(view, arg) {
    view = cleanToken(view, 32) || 'page';
    arg = cleanPublicId(arg);
    var path = '/';
    var pageKey = view;
    var virtualView = view;
    if (view === 'home') { path = '/'; pageKey = 'home'; }
    else if (view === 'market') path = '/market';
    else if (view === 'search') path = '/search';
    else if (view === 'creator') path = arg ? '/creator/' + arg : '/creator';
    else if (view === 'portfolio') path = '/portfolio';
    else if (view === 'market_detail') path = arg ? '/market/' + arg : '/market/detail';
    else if (view === 'market_position') path = '/market/position';
    else if (view === 'thesis') path = '/thesis';
    else if (view === 'pitch') path = '/pitch';
    else if (view === 'faq') path = '/faq';
    else if (view === 'waitlist') path = '/waitlist';
    else if (view === 'onboarding') path = '/onboarding';
    else if (view === 'signup') path = '/signup';
    else if (view === 'privacy') path = '/privacy';
    else path = '/page';
    return { pageKey: pageKey, path: path, virtualView: virtualView, publicId: arg };
  }

  function referrerHostname(referrer) {
    if (!referrer) return '';
    try { return cleanToken(new URL(referrer).hostname, 120); } catch (e) { return ''; }
  }

  function campaigns(locationLike) {
    var url = safeURL(locationLike);
    var map = [
      ['utm_source', 'utmSource'],
      ['utm_medium', 'utmMedium'],
      ['utm_campaign', 'utmCampaign'],
      ['utm_id', 'utmId']
    ];
    var out = {};
    map.forEach(function (pair) {
      var value = cleanCampaign(url.searchParams.get(pair[0]));
      if (value) out[pair[1]] = value;
    });
    return out;
  }

  function deviceClass(width) {
    width = Number(width) || 0;
    return width > 0 && width < 768 ? 'mobile' : width < 1100 ? 'tablet' : 'desktop';
  }

  function normalizeEvent(name, props) {
    name = cleanToken(name, 64).replace(/-/g, '_');
    props = props && typeof props === 'object' ? props : {};

    if (name === 'position_started_after_poa') {
      name = 'market_position_started';
      props = {
        instrument: props.mtype,
        side: props.side,
        outcome: props.outcome,
        source: 'poa'
      };
    } else if (name === 'poa_viewed') {
      name = 'market_poa_opened';
      props = {
        creator_id: props.seed,
        source: props.from || 'poa'
      };
    } else if (name === 'poa_timeline_scrubbed') {
      props = { as_of: props.asOf };
    } else if (name === 'poa_timeline_event_selected' || name === 'poa_content_selected') {
      props = { content_id: props.id };
    } else if (name === 'poa_timeline_viewed') {
      props = { creator_id: props.seed };
    }

    var allowed = EVENT_PROPS[name];
    if (!allowed) return null;
    var safe = {};
    allowed.forEach(function (key) {
      var value = props[key];
      if (value == null || value === '') return;
      if (typeof value === 'boolean') safe[key] = value;
      else if (typeof value === 'number' && isFinite(value)) safe[key] = Math.round(value);
      else {
        var token = cleanToken(value, 64);
        if (token) safe[key] = token;
      }
    });
    return { name: name, props: safe };
  }

  function publicCountFallback(now) {
    var d = new Date(now == null ? Date.now() : now);
    var today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var elapsed = Math.max(0, Math.floor((today - PUBLIC_COUNT_ANCHOR_UTC) / 86400000));
    return PUBLIC_COUNT_BASE + elapsed * PUBLIC_COUNT_DAILY;
  }

  return {
    POLICY_VERSION: POLICY_VERSION,
    CONSENT_KEY: CONSENT_KEY,
    VISITOR_KEY: VISITOR_KEY,
    SESSION_KEY: SESSION_KEY,
    SESSION_TTL_MS: SESSION_TTL_MS,
    EVENT_PROPS: EVENT_PROPS,
    readConsent: readConsent,
    writeConsent: writeConsent,
    privacySignal: privacySignal,
    effectiveConsent: effectiveConsent,
    uuid: uuid,
    cleanToken: cleanToken,
    cleanPublicId: cleanPublicId,
    sanitizeTitle: sanitizeTitle,
    initialRoute: initialRoute,
    canonicalRoute: canonicalRoute,
    referrerHostname: referrerHostname,
    campaigns: campaigns,
    deviceClass: deviceClass,
    normalizeEvent: normalizeEvent,
    publicCountFallback: publicCountFallback
  };
});
