/* Shared presentation localization. English copy and underlying data remain unchanged. */
(function () {
  'use strict';
  if (window.BackerI18n) return;
  var LANGUAGES = ['en', 'zh', 'ja', 'ko'];
  var LABELS = { en: 'English', zh: '简体中文', ja: '日本語', ko: '한국어' };
  var currentURL = new URL(window.location.href);
  var requested = currentURL.searchParams.get('lang');
  // A fresh visit always opens the original English edition.
  // Explicit language choices travel with internal links instead of browser storage.
  var locale = LANGUAGES.indexOf(requested) >= 0 ? requested : 'en';
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  document.documentElement.dataset.backerLocale = locale;
  var localeIndex = LANGUAGES.indexOf(locale) - 1;
  var messages = Object.create(null);
  var patterns = [];
  var compiled = false;
  var ready = false;
  var textStates = new WeakMap();
  var attributeStates = new WeakMap();
  var pending = new Set();
  var frame = 0;
  var SKIP = 'script,style,code,pre,[translate="no"],[data-i18n-skip],[data-backer-language],.m2-person-name,.m2-profile-handle,#m2DossierTitle,.m2-feed-body h3,.m2-feed-byline b,.m2-work-body h4,.mkt-provider,#mbPlatform option,.mb-person-name b,.mb-work-strip b,#mbPerson option,#mbWork option,.m2-ledger-provider b,.m2-work-meta b,.mini-auth,.mini-name,.mini-work,.sxr-card h3,.sxr-provider,.bubble-letter,[data-swapping="true"]';
  var ATTRIBUTES = ['aria-label', 'aria-description', 'title', 'placeholder', 'alt', 'data-label'];
  var SOURCE_NAMES = new Set(['Backer','Medium','YouTube','GitHub','Bilibili','Twitch','X','Reddit','Instagram','Substack','DEV','Spotify','Kick','Patreon','SoundCloud','TikTok','LinkedIn','RSS','Kalshi','Polymarket']);

  function normalize(value) { return String(value).replace(/\s+/g, ' ').trim(); }
  function compileCatalogs() {
    patterns = [];
    Object.keys(window.BackerLocalePacks || {}).forEach(function (name) {
      var pack = window.BackerLocalePacks[name];
      Object.assign(messages, pack.messages || {});
      Object.keys(pack.patterns || {}).forEach(function (source) {
        var ids = [];
        var expression = source.split(/(\{\d+\})/).map(function (part) {
          if (/^\{\d+\}$/.test(part)) { ids.push(part); return '(.+?)'; }
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        patterns = patterns.filter(function (rule) { return rule.source !== source; });
        patterns.push({ source:source, specificity:source.replace(/\{\d+\}/g, '').length, expression: new RegExp('^' + expression + '$'), ids: ids, values: pack.patterns[source] });
      });
    });
    patterns.sort(function (a,b) { return b.specificity - a.specificity; });
    compiled = Object.keys(window.BackerLocalePacks || {}).length > 0;
  }

  function translate(value) {
    if (locale === 'en' || value === null || value === undefined) return value;
    if (!compiled) compileCatalogs();
    var original = String(value);
    var key = normalize(original);
    if (!key) return original;
    var entry = messages[key];
    var translated = entry && entry[localeIndex];
    if (translated === undefined) {
      for (var i = 0; i < patterns.length; i += 1) {
        var rule = patterns[i];
        var match = rule.expression.exec(key);
        if (!match) continue;
        translated = rule.values[localeIndex].replace(/\{\d+\}/g, function (token) {
          var position = rule.ids.indexOf(token);
          if (position < 0) return token;
          var capture = match[position + 1];
          return SOURCE_NAMES.has(capture) ? capture : (messages[normalize(capture)] || [])[localeIndex] || capture;
        });
        break;
      }
    }
    if (translated === undefined) return original;
    return original.match(/^\s*/)[0] + translated + original.match(/\s*$/)[0];
  }

  function excluded(element) {
    return !element || !!element.closest(SKIP);
  }

  function translateText(node) {
    if (excluded(node.parentElement)) return;
    if (node.parentElement.closest('input,textarea')) return;
    var value = node.nodeValue;
    var previous = textStates.get(node);
    if (previous === value) return;
    var next = translate(value);
    if (node.parentElement.matches('#backButton,#backToRole,[data-action="back"],[data-action="previous"],[data-back]') && normalize(value) === 'Back') {
      next = ['返回', '戻る', '이전'][localeIndex];
    }
    if (next !== value) { textStates.set(node, next); node.nodeValue = next; }
  }

  function localeURL(value) {
    var url;
    try { url = new URL(value, window.location.href); } catch (_) { return value; }
    if (url.origin !== location.origin && url.origin !== 'https://backer-attention-simulation.nzhang425.chatgpt.site') return value;
    if (!/^https?:$/.test(url.protocol)) return value;
    url.searchParams.set('lang', locale);
    return url.href;
  }

  function translateElement(element) {
    if (excluded(element)) return;
    var state = attributeStates.get(element) || {};
    ATTRIBUTES.forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var value = element.getAttribute(name);
      if (state[name] === value) return;
      var next = translate(value);
      if (next !== value) { state[name] = next; element.setAttribute(name, next); }
    });
    attributeStates.set(element, state);
    if (element.tagName === 'IFRAME' && element.hasAttribute('src')) {
      var frameURL = localeURL(element.getAttribute('src'));
      var embeddedURL = new URL(frameURL, location.href);
      if (embeddedURL.origin === 'https://backer-attention-simulation.nzhang425.chatgpt.site') {
        embeddedURL.searchParams.set('backerEmbed', '1');
        frameURL = embeddedURL.href;
      }
      if (frameURL !== element.src) element.src = frameURL;
    }
    if (element.tagName === 'A' && element.hasAttribute('href')) {
      var href = element.getAttribute('href');
      if (href && href[0] !== '#' && !element.hasAttribute('download')) {
        var url;
        try { url = new URL(href, location.href); } catch (_) { return; }
        if (url.origin === location.origin && /(?:\.html|\/)$/i.test(url.pathname) && (locale !== 'en' || requested)) {
          var nextURL = localeURL(href);
          if (nextURL !== element.href) element.href = nextURL;
        }
      }
    }
  }

  function translateRoot(root) {
    if (!root || !root.isConnected) return;
    if (root.nodeType === 3) { if (locale !== 'en') translateText(root); return; }
    if (root.nodeType !== 1 || excluded(root)) return;
    translateElement(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (node.nodeType === 1 && excluded(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 1) translateElement(node);
      else if (locale !== 'en') translateText(node);
    }
  }

  function schedule() {
    if (!ready || frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      var roots = Array.from(pending);
      pending.clear();
      roots.forEach(function (root) {
        if (!roots.some(function (other) { return other !== root && other.nodeType === 1 && other.contains(root); })) translateRoot(root);
      });
    });
  }

  function applyRich() {
    if (locale === 'en') return;
    Object.keys(window.BackerLocalePacks || {}).forEach(function (name) {
      var rich = window.BackerLocalePacks[name].rich || {};
      Object.keys(rich).forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (element) {
          var value = rich[selector][localeIndex];
          if (value !== undefined) element.innerHTML = value;
        });
      });
    });
  }

  function switchLanguage(next) {
    if (LANGUAGES.indexOf(next) < 0 || next === locale) return;
    var url = new URL(location.href);
    url.searchParams.set('lang', next);
    window.location.assign(url.href);
  }

  function mountControl() {
    if (document.querySelector('[data-backer-language]')) return;
    var control = document.createElement('div');
    control.className = 'backer-locale';
    control.setAttribute('data-backer-language', '');
    control.setAttribute('translate', 'no');
    var label = document.createElement('label');
    label.className = 'backer-locale__label';
    label.htmlFor = 'backer-language';
    label.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span>' + LABELS[locale] + '</span><svg class="backer-locale__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
    var select = document.createElement('select');
    select.id = 'backer-language';
    select.setAttribute('aria-label', {en:'Website language',zh:'网站语言',ja:'表示言語',ko:'표시 언어'}[locale]);
    LANGUAGES.forEach(function (language) {
      var option = document.createElement('option');
      option.value = language;
      option.lang = language === 'zh' ? 'zh-CN' : language;
      option.textContent = LABELS[language];
      option.selected = language === locale;
      select.appendChild(option);
    });
    select.addEventListener('change', function () { switchLanguage(select.value); });
    control.append(label, select);
    var header = document.querySelector('header.nav,header.topbar,header.mdp-nav,header.mb-nav,header.onboarding-header');
    if (header && header.closest('[hidden]')) header = null;
    if (header) {
      header.classList.add('backer-locale-header');
      header.appendChild(control);
    } else {
      control.classList.add('backer-locale--floating');
      document.body.appendChild(control);
      if (document.body.classList.contains('backer-dock-workspace')) document.body.classList.add('backer-locale-standalone');
    }
  }

  function start() {
    compileCatalogs();
    applyRich();
    translateRoot(document.documentElement);
    mountControl();
    ready = true;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') mutation.addedNodes.forEach(function (node) { if (node.nodeType === 1 || node.nodeType === 3) pending.add(node); });
        else pending.add(mutation.target);
      });
      schedule();
    });
    observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRIBUTES.concat(['href','src'])});
  }

  window.BackerI18n = { locale:locale, formatLocale:locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'ko-KR', t:translate, url:localeURL, switchLanguage:switchLanguage, refresh:function (root) { if (ready) translateRoot(root || document.body); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
}());
