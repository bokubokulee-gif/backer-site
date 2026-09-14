/* Backer public preview access policy.
   Browsing stays open. Portfolio and commitment actions lead to the waitlist.
   Joining the waitlist never grants trading access; this is not authentication. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.install(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var ACTIONS = [
    '[data-mkt-trade]', '[data-ticket-confirm]', '[data-back-creator]', '[data-confirm]',
    '[data-position]', '[data-confirm-pos]', '[data-order]', '[data-confirm-order]',
    '[data-trade-side]', '[data-quote-action]', '[data-side]', '[data-outcome]',
    '[data-mkt-draft]', '[data-m2-create]', '[data-proposal-edit]', '[data-raise-submit]',
    '[data-action="save"]', '#applyRaise'
  ].join(',');
  var PORTFOLIO = '[data-view="portfolio"],[data-nav="portfolio"],[data-route="portfolio"],[data-go-portfolio],[data-port-mode],[data-trades-view="positions"]';

  function reasonForURL(raw, base) {
    var url;
    try { url = new URL(raw, base); } catch (error) { return ''; }
    var origin;
    try { origin = new URL(base).origin; } catch (error) { return ''; }
    if (url.origin !== origin) return '';
    var file = url.pathname.split('/').pop().toLowerCase();
    var hash = url.hash.slice(1);
    var split = hash.indexOf('?');
    var view = (split < 0 ? hash : hash.slice(0, split)).toLowerCase();
    var hashParams = new URLSearchParams(split < 0 ? '' : hash.slice(split + 1));
    var queryView = String(url.searchParams.get('view') || '').toLowerCase();
    if (file === 'waitlist.html') return '';
    if (file === 'portfolio.html' || view === 'portfolio' || queryView === 'portfolio') return 'portfolio';
    if (file === 'backercreate.html') return 'create';
    if (file !== 'backerdemo.html' && file !== 'index.html' && file !== '') return '';
    if (view === 'trades' || view === 'market' || queryView === 'trades' || queryView === 'market') {
      var selectedView = String(hashParams.get('view') || queryView).toLowerCase();
      if (selectedView === 'positions') return 'portfolio';
      if (selectedView === 'proposals' || hashParams.has('proposal')) return 'create';
      var side = String(hashParams.get('side') || url.searchParams.get('side') || '').toLowerCase();
      if (side === 'back' || side === 'fade') return 'trade';
    }
    return '';
  }

  function reasonForElement(target, base) {
    if (!target || !target.closest) return '';
    if (target.closest(PORTFOLIO)) return 'portfolio';
    if (target.closest('[data-trades-view="proposals"]')) return 'create';
    var action = target.closest(ACTIONS);
    if (action) return action.matches('[data-mkt-draft],[data-m2-create],[data-proposal-edit],[data-raise-submit],[data-action="save"],#applyRaise') ? 'create' : 'trade';
    var anchor = target.closest('a[href]');
    return anchor ? reasonForURL(anchor.getAttribute('href'), base) : '';
  }

  function install(root) {
    if (root.BackerAccessGate) return root.BackerAccessGate;
    var script = root.document.currentScript;
    var siteRoot = new URL('../', script && script.src || new URL('js/access-gate.js', root.location.href).href);

    function requireWaitlist(reason, replace) {
      var url = new URL('waitlist.html', siteRoot);
      url.searchParams.set('source', reason === 'portfolio' ? 'portfolio' : reason === 'create' ? 'create' : 'trade');
      // An embedded Market preview must open the full-page registration screen.
      var destination = root;
      try { if (root.top && root.top !== root) destination = root.top; } catch (error) {}
      try {
        if (replace) destination.location.replace(url.href);
        else destination.location.assign(url.href);
      } catch (error) {
        if (replace) root.location.replace(url.href);
        else root.location.assign(url.href);
      }
      return true;
    }
    var gate = Object.freeze({ requireWaitlist: requireWaitlist });
    root.BackerAccessGate = gate;

    function intercept(event) {
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      if (event.type === 'auxclick' && event.button !== 1) return;
      var reason = reasonForElement(event.target, root.location.href);
      if (!reason) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      requireWaitlist(reason);
    }
    root.document.addEventListener('click', intercept, true);
    root.document.addEventListener('auxclick', intercept, true);
    root.document.addEventListener('keydown', intercept, true);

    function guardRoute() {
      var reason = reasonForURL(root.location.href, root.location.href);
      if (reason) requireWaitlist(reason, true);
    }
    root.addEventListener('hashchange', guardRoute);
    root.addEventListener('popstate', guardRoute);
    guardRoute();
    return gate;
  }

  return Object.freeze({ reasonForURL: reasonForURL, reasonForElement: reasonForElement, install: install });
});
