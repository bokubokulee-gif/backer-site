/* =========================================================
   BACKER — consent, GA4 adapter, first-party view collection
   Basic consent behavior: Google code is never loaded before
   an explicit analytics opt-in.
   ========================================================= */
(function () {
  'use strict';

  var Core = window.BackerAnalyticsCore;
  if (!Core || window.BackerAnalytics) return;

  var local = null;
  var session = null;
  try { local = window.localStorage; } catch (e) {}
  try { session = window.sessionStorage; } catch (e) {}

  var signal = Core.privacySignal(navigator, window);
  var storedConsent = null;
  var decision = 'rejected';
  var runtimeConfigAvailable = false;
  var runtimePolicyMatches = false;
  var publicViewCountsEnabled = false;
  var hideUnavailableAnalyticsUI = false;
  var runtimeConfigPromise = null;
  var runtimeReady = null;
  var initialCampaigns = Core.campaigns(window.location);
  var initialReferrer = Core.referrerHostname(document.referrer);
  var currentRoute = Core.initialRoute(window.location);
  var lastViewSignature = '';
  var lastViewAt = 0;
  var gaMeasurementId = '';
  var gaEnabled = false;
  var gaScriptRequested = false;
  var gaEnablePromise = null;
  var pendingGA = [];
  var countEl = null;
  var bannerEl = null;

  var DENIED_CONSENT = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', DENIED_CONSENT);
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  function accepted() {
    return runtimePolicyMatches &&
      decision === 'accepted' &&
      storedConsent &&
      storedConsent.decision === 'accepted';
  }

  function localDevelopment() {
    return /^(localhost|127\.0\.0\.1|::1)$/.test(window.location.hostname);
  }

  function validMeasurementId(value) {
    value = String(value || '').trim().toUpperCase();
    return /^G-[A-Z0-9]{5,20}$/.test(value) ? value : '';
  }

  function configuredMeasurementId() {
    var publicConfig = window.BACKER_PUBLIC_CONFIG || window.__BACKER_PUBLIC_CONFIG__ || {};
    var meta = document.querySelector('meta[name="backer-ga4-id"]');
    return validMeasurementId(
      publicConfig.GA4_MEASUREMENT_ID ||
      publicConfig.ga4MeasurementId ||
      (meta && meta.getAttribute('content'))
    );
  }

  function configuredPublicCountFlag() {
    var publicConfig = window.BACKER_PUBLIC_CONFIG || window.__BACKER_PUBLIC_CONFIG__ || {};
    var meta = document.querySelector('meta[name="backer-public-view-counts"]');
    return publicConfig.publicViewCountsEnabled === true ||
      !!(meta && String(meta.getAttribute('content')).trim().toLowerCase() === 'true');
  }

  function configuredUnavailableAnalyticsUIFlag() {
    var meta = document.querySelector('meta[name="backer-hide-unavailable-analytics-ui"]');
    return !!(meta && String(meta.getAttribute('content')).trim().toLowerCase() === 'true');
  }

  function analyticsUIEnabled() {
    return runtimeConfigAvailable || !hideUnavailableAnalyticsUI;
  }

  function fallbackRuntimeConfig() {
    return {
      ga4MeasurementId: configuredMeasurementId(),
      consentPolicyVersion: Core.POLICY_VERSION,
      publicViewCountsEnabled: configuredPublicCountFlag(),
      configurationAvailable: false
    };
  }

  function applyRuntimeConfig(config) {
    config = config || fallbackRuntimeConfig();
    hideUnavailableAnalyticsUI = configuredUnavailableAnalyticsUIFlag();
    runtimeConfigAvailable = config.configurationAvailable === true;
    runtimePolicyMatches = runtimeConfigAvailable &&
      String(config.consentPolicyVersion || '').trim() === Core.POLICY_VERSION;
    publicViewCountsEnabled = config.publicViewCountsEnabled === true;
    var hadStoredRecord = false;
    try { hadStoredRecord = !!(local && local.getItem(Core.CONSENT_KEY)); } catch (e) {}
    var matchingStoredConsent = Core.readConsent(local);
    if (!matchingStoredConsent && hadStoredRecord) {
      try { if (local) local.removeItem(Core.CONSENT_KEY); } catch (e) {}
      clearFirstPartyIdentity();
    }
    storedConsent = matchingStoredConsent;
    decision = runtimePolicyMatches
      ? Core.effectiveConsent(storedConsent, signal)
      : 'rejected';
    if (!runtimePolicyMatches) stopAnalytics(false);
    return {
      ga4MeasurementId: runtimePolicyMatches ? validMeasurementId(config.ga4MeasurementId) : '',
      consentPolicyVersion: Core.POLICY_VERSION,
      publicViewCountsEnabled: publicViewCountsEnabled,
      configurationAvailable: runtimeConfigAvailable,
      policyMatches: runtimePolicyMatches
    };
  }

  function loadRuntimeConfig() {
    if (runtimeConfigPromise) return runtimeConfigPromise;
    var fallback = fallbackRuntimeConfig();
    if (!window.fetch) {
      runtimeConfigPromise = Promise.resolve(applyRuntimeConfig(fallback));
      return runtimeConfigPromise;
    }

    var remote = fetch('/api/config', {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('runtime config unavailable');
      return response.json();
    }).then(function (config) {
      config = config || {};
      return {
        ga4MeasurementId: validMeasurementId(config.ga4MeasurementId || config.GA4_MEASUREMENT_ID),
        consentPolicyVersion: config.consentPolicyVersion,
        publicViewCountsEnabled: config.publicViewCountsEnabled === true,
        configurationAvailable: true
      };
    }).catch(function () {
      return fallback;
    });

    var timeout = new Promise(function (resolve) {
      window.setTimeout(function () { resolve(fallback); }, 2000);
    });
    runtimeConfigPromise = Promise.race([remote, timeout]).then(applyRuntimeConfig);
    return runtimeConfigPromise;
  }

  function runtimeMeasurementId() {
    return loadRuntimeConfig().then(function (config) {
      return config.ga4MeasurementId;
    });
  }

  function safePageLocation(route) {
    var origin = window.location.origin;
    if (!origin || origin === 'null') return route.path;
    return origin + route.path;
  }

  function analyticsPageTitle(route) {
    return route && route.pageKey === 'market_position'
      ? 'Backer Market'
      : Core.sanitizeTitle(document.title);
  }

  function gaConfigParams() {
    var params = {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: safePageLocation(currentRoute),
      page_path: currentRoute.path,
      page_title: analyticsPageTitle(currentRoute)
    };
    if (localDevelopment()) params.debug_mode = true;
    return params;
  }

  function injectGAScript(id) {
    if (gaScriptRequested || !id || !accepted()) return;
    gaScriptRequested = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onerror = function () { gaEnabled = false; };
    (document.head || document.documentElement).appendChild(script);
  }

  function enableGA() {
    if (!accepted()) return Promise.resolve(false);
    if (gaEnabled && gaMeasurementId) return Promise.resolve(true);
    if (gaEnablePromise) return gaEnablePromise;

    gaEnablePromise = runtimeMeasurementId().then(function (id) {
      if (!accepted() || !id) return false;
      gaMeasurementId = id;
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
      window.gtag('js', new Date());
      window.gtag('config', id, gaConfigParams());
      gaEnabled = true;
      injectGAScript(id);
      var queued = pendingGA.slice(0);
      pendingGA.length = 0;
      queued.forEach(function (item) { sendGA(item.name, item.props); });
      return true;
    }).catch(function () { return false; });
    return gaEnablePromise;
  }

  function sendGA(name, props) {
    if (!accepted()) return;
    if (!gaEnabled || !gaMeasurementId) {
      if (pendingGA.length < 50) pendingGA.push({ name: name, props: props || {} });
      enableGA();
      return;
    }
    var params = {};
    Object.keys(props || {}).forEach(function (key) { params[key] = props[key]; });
    params.send_to = gaMeasurementId;
    if (localDevelopment()) params.debug_mode = true;
    try { window.gtag('event', name, params); } catch (e) {}
  }

  function visitorId() {
    if (!accepted()) return '';
    var id = '';
    try { id = local && local.getItem(Core.VISITOR_KEY) || ''; } catch (e) {}
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      id = Core.uuid(window.crypto);
      try { if (local) local.setItem(Core.VISITOR_KEY, id); } catch (e) {}
    }
    return id;
  }

  function sessionId(now) {
    if (!accepted()) return '';
    now = now || Date.now();
    var record = null;
    try { record = JSON.parse(session && session.getItem(Core.SESSION_KEY) || 'null'); } catch (e) {}
    if (!record || !/^[0-9a-f-]{36}$/i.test(record.id) || !Number(record.lastAt) || now - Number(record.lastAt) > Core.SESSION_TTL_MS) {
      record = { id: Core.uuid(window.crypto), lastAt: now };
    } else {
      record.lastAt = now;
    }
    try { if (session) session.setItem(Core.SESSION_KEY, JSON.stringify(record)); } catch (e) {}
    return record.id;
  }

  function locale() {
    return Core.cleanToken((navigator.languages && navigator.languages[0]) || navigator.language || 'en', 24) || 'en';
  }

  function collectorPayload(route) {
    var utm = {};
    if (initialCampaigns.utmSource) utm.source = initialCampaigns.utmSource;
    if (initialCampaigns.utmMedium) utm.medium = initialCampaigns.utmMedium;
    if (initialCampaigns.utmCampaign) utm.campaign = initialCampaigns.utmCampaign;
    if (initialCampaigns.utmId) utm.id = initialCampaigns.utmId;
    return {
      eventId: Core.uuid(window.crypto),
      pageKey: route.pageKey,
      path: route.path,
      pageTitle: analyticsPageTitle(route),
      virtualView: route.virtualView,
      visitorId: visitorId(),
      sessionId: sessionId(Date.now()),
      referrerHostname: initialReferrer,
      utm: utm,
      deviceClass: Core.deviceClass(window.innerWidth || 0),
      locale: locale(),
      consentPolicyVersion: Core.POLICY_VERSION
    };
  }

  function postFirstPartyView(payload) {
    if (!accepted()) return;
    var json;
    try { json = JSON.stringify(payload); } catch (e) { return; }
    var sent = false;
    try {
      if (navigator.sendBeacon) {
        sent = navigator.sendBeacon('/api/analytics/view', new Blob([json], { type: 'application/json' }));
      }
    } catch (e) {}
    if (sent || !window.fetch) return;
    try {
      fetch('/api/analytics/view', {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: json
      }).catch(function () {});
    } catch (e) {}
  }

  function pageViewGAProps(route) {
    var props = {
      page_title: analyticsPageTitle(route),
      page_path: route.path,
      page_location: safePageLocation(route),
      virtual_view: route.virtualView
    };
    if (initialCampaigns.utmSource) props.campaign_source = initialCampaigns.utmSource;
    if (initialCampaigns.utmMedium) props.campaign_medium = initialCampaigns.utmMedium;
    if (initialCampaigns.utmCampaign) props.campaign_name = initialCampaigns.utmCampaign;
    if (initialCampaigns.utmId) props.campaign_id = initialCampaigns.utmId;
    return props;
  }

  function routeFunnelEvent(route) {
    if (route.virtualView === 'market') track('market_home_viewed', {});
    else if (route.virtualView === 'portfolio') track('portfolio_viewed', {});
    else if (route.virtualView === 'creator') track('creator_viewed', { creator_id: route.publicId });
  }

  function recordRoute(route) {
    currentRoute = route;
    if (!accepted()) return false;
    var now = Date.now();
    var signature = route.pageKey + '|' + route.path;
    if (signature === lastViewSignature && now - lastViewAt < 1500) return false;
    lastViewSignature = signature;
    lastViewAt = now;
    postFirstPartyView(collectorPayload(route));
    sendGA('page_view', pageViewGAProps(route));
    routeFunnelEvent(route);
    window.setTimeout(refreshPublicCount, 700);
    return true;
  }

  function virtualPageView(view, arg) {
    try { return recordRoute(Core.canonicalRoute(view, arg)); } catch (e) { return false; }
  }

  function track(name, props) {
    if (!accepted()) return false;
    var event = Core.normalizeEvent(name, props);
    if (!event) return false;
    sendGA(event.name, event.props);
    return true;
  }

  function clearAnalyticsCookies() {
    try {
      document.cookie.split(';').forEach(function (part) {
        var name = part.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) return;
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
        if (window.location.hostname) {
          document.cookie = name + '=; Max-Age=0; path=/; domain=' + window.location.hostname + '; SameSite=Lax';
        }
      });
    } catch (e) {}
  }

  function clearFirstPartyIdentity() {
    try { if (local) local.removeItem(Core.VISITOR_KEY); } catch (e) {}
    try { if (session) session.removeItem(Core.SESSION_KEY); } catch (e) {}
  }

  function dispatchConsentChange() {
    try {
      window.dispatchEvent(new CustomEvent('backer:consent-changed', {
        detail: { decision: decision, policyVersion: Core.POLICY_VERSION }
      }));
    } catch (e) {}
  }

  function stopAnalytics(wasAccepted) {
    pendingGA.length = 0;
    gaEnabled = false;
    gaEnablePromise = null;
    lastViewSignature = '';
    lastViewAt = 0;
    if (wasAccepted) {
      try {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
      } catch (e) {}
    }
    clearFirstPartyIdentity();
    clearAnalyticsCookies();
  }

  function setConsent(next) {
    if (next === 'accepted' && !runtimePolicyMatches) return false;
    var wasAccepted = accepted();
    storedConsent = Core.writeConsent(local, next, Date.now());
    decision = next;
    if (next === 'accepted') {
      enableGA();
      if (!wasAccepted) recordRoute(currentRoute);
    } else {
      stopAnalytics(wasAccepted);
    }
    hideConsentPanel();
    dispatchConsentChange();
    return true;
  }

  function consentCopy(settingsMode) {
    if (!runtimePolicyMatches) {
      return runtimeConfigAvailable
        ? 'Analytics is temporarily unavailable while Backer synchronizes its privacy policy configuration. Collection remains off.'
        : 'Analytics is unavailable in this static preview. Collection remains off; the public view total is a non-identifying formula-only preview.';
    }
    var signalCopy = (!storedConsent && (signal.gpc || signal.dnt))
      ? ' Your browser privacy signal is being honored, so analytics remains off unless you explicitly accept.'
      : '';
    if (settingsMode) {
      return accepted()
        ? 'Analytics is currently on. You can reject now to stop future GA4 and first-party analytics collection.'
        : 'Analytics is currently off. No GA4 or first-party analytics requests are sent unless you accept.';
    }
    return 'Backer uses optional analytics to understand consented traffic and improve the demo. Advertising analytics stays off.' + signalCopy;
  }

  function hideConsentPanel() {
    if (!bannerEl) return;
    bannerEl.remove();
    bannerEl = null;
  }

  function showConsentPanel(settingsMode) {
    hideConsentPanel();
    bannerEl = document.createElement('aside');
    bannerEl.className = 'backer-consent-panel' + (settingsMode ? ' is-settings' : '');
    bannerEl.setAttribute('aria-label', 'Analytics privacy choices');
    bannerEl.innerHTML =
      '<div class="backer-consent-copy">' +
        '<div class="backer-consent-heading">' +
          '<span class="backer-consent-dot" aria-hidden="true"></span>' +
          '<strong>' + (settingsMode ? 'Privacy settings' : 'Optional analytics') + '</strong>' +
        '</div>' +
        '<p>' + consentCopy(settingsMode) + ' <a href="privacy.html">Analytics &amp; privacy details</a></p>' +
      '</div>' +
      '<div class="backer-consent-actions">' +
        '<button type="button" class="backer-consent-reject" data-backer-consent="rejected">Reject</button>' +
        '<button type="button" class="backer-consent-accept" data-backer-consent="accepted"' +
          (runtimePolicyMatches ? '' : ' disabled aria-disabled="true" title="Analytics configuration unavailable"') +
        '>Accept analytics</button>' +
        (settingsMode ? '<button type="button" class="backer-consent-close" aria-label="Close privacy settings" data-backer-consent-close>×</button>' : '') +
      '</div>';
    document.body.appendChild(bannerEl);
    bannerEl.addEventListener('click', function (event) {
      var choice = event.target.closest('[data-backer-consent]');
      if (choice) { setConsent(choice.getAttribute('data-backer-consent')); return; }
      if (event.target.closest('[data-backer-consent-close]')) hideConsentPanel();
    });
    var focusTarget = bannerEl.querySelector(settingsMode ? '[data-backer-consent-close]' : '.backer-consent-accept');
    if (settingsMode && focusTarget) {
      try { focusTarget.focus({ preventScroll: true }); } catch (e) { focusTarget.focus(); }
    }
  }

  function mountPrivacySettings() {
    if (document.querySelector('.backer-privacy-settings')) return;
    var footerHost = document.querySelector('.footer .footer-bottom, footer.deck-foot, .privacy-footer .footer-bottom');
    if (footerHost) {
      var footerButton = document.createElement('button');
      footerButton.type = 'button';
      footerButton.id = 'backerPrivacySettings';
      footerButton.className = 'backer-privacy-settings is-footer';
      footerButton.textContent = 'Privacy settings';
      footerButton.addEventListener('click', function () { showConsentPanel(true); });
      footerHost.appendChild(footerButton);
    }
    if (footerHost && !document.getElementById('app')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.id = footerHost ? 'backerPrivacySettingsFloating' : 'backerPrivacySettings';
    button.className = 'backer-privacy-settings';
    button.textContent = 'Privacy settings';
    button.addEventListener('click', function () { showConsentPanel(true); });
    document.body.appendChild(button);
  }

  function formatCount(value) {
    try { return Math.round(value).toLocaleString('en-US') + ' views'; }
    catch (e) { return String(Math.round(value)) + ' views'; }
  }

  function setPublicCount(value, live) {
    if (!countEl) return;
    countEl.textContent = formatCount(value);
    countEl.classList.toggle('is-live', !!live);
    countEl.setAttribute('data-source', live ? 'aggregate' : 'baseline');
  }

  function refreshPublicCount() {
    if (!publicViewCountsEnabled || !countEl) return;
    setPublicCount(Core.publicCountFallback(Date.now()), false);
    if (!window.fetch) return;
    fetch('/api/analytics/public-count', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-cache',
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('unavailable');
      return response.json();
    }).then(function (data) {
      var value = Number(data && (data.count != null ? data.count : data.views != null ? data.views : data.total));
      if (!isFinite(value) || value < 0) return;
      setPublicCount(Math.floor(value), true);
    }).catch(function () {});
  }

  function mountBrandCount() {
    if (!publicViewCountsEnabled) return;
    if (document.querySelector('.backer-brand-lockup')) return;
    var brand = document.querySelector('header a.brand, header a.mdp-brand');
    if (!brand || !brand.parentNode) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'backer-brand-lockup';
    brand.parentNode.insertBefore(wrapper, brand);
    wrapper.appendChild(brand);
    countEl = document.createElement('span');
    countEl.className = 'backer-view-count';
    countEl.setAttribute('aria-live', 'polite');
    countEl.setAttribute('aria-label', 'Backer site views');
    wrapper.appendChild(countEl);
    refreshPublicCount();
  }

  function bindSearchEvents() {
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form || !form.matches) return;
      var source = '';
      if (form.matches('#heroSearch')) source = 'hero';
      else if (form.matches('#sxForm, #searchForm')) source = 'search';
      else if (form.matches('#mktNL')) source = 'market';
      if (source) track('search_submitted', { source: source });
    }, true);
  }

  function bindBackerEventBridge() {
    window.addEventListener('backer:track', function (event) {
      var detail = event && event.detail;
      if (!detail || typeof detail.event !== 'string') return;
      track(detail.event, detail.props || {});
    });
  }

  function reconcileConsentFromStorage() {
    var wasAccepted = accepted();
    storedConsent = Core.readConsent(local);
    decision = runtimePolicyMatches
      ? Core.effectiveConsent(storedConsent, signal)
      : 'rejected';

    if (accepted()) {
      enableGA();
      if (!wasAccepted) recordRoute(currentRoute);
      if (bannerEl) hideConsentPanel();
    } else {
      stopAnalytics(wasAccepted);
      if (analyticsUIEnabled() && (!storedConsent || !runtimePolicyMatches)) showConsentPanel(false);
      else if (analyticsUIEnabled() && bannerEl && bannerEl.classList.contains('is-settings')) showConsentPanel(true);
      else hideConsentPanel();
    }
    dispatchConsentChange();
  }

  function bindConsentStorage() {
    window.addEventListener('storage', function (event) {
      if (!event || event.key !== Core.CONSENT_KEY) return;
      runtimeReady.then(reconcileConsentFromStorage);
    });
  }

  function bootDOM() {
    runtimeReady.then(function () {
      mountBrandCount();
      if (analyticsUIEnabled()) {
        mountPrivacySettings();
        if (!storedConsent || !runtimePolicyMatches) showConsentPanel(false);
      }
      bindSearchEvents();
      if (accepted()) {
        enableGA();
        recordRoute(currentRoute);
      }
    });
  }

  runtimeReady = loadRuntimeConfig();
  window.BackerAnalytics = {
    track: track,
    virtualPageView: virtualPageView,
    openPrivacySettings: function () {
      return runtimeReady.then(function () {
        if (!analyticsUIEnabled()) return false;
        showConsentPanel(true);
        return true;
      });
    },
    consentDecision: function () { return accepted() ? 'accepted' : 'rejected'; },
    currentRoute: function () { return currentRoute; },
    refreshPublicCount: refreshPublicCount
  };

  bindBackerEventBridge();
  bindConsentStorage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootDOM);
  else bootDOM();
})();
