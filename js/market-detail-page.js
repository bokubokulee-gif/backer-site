/* Dedicated market route: backermarket.html?market=<contract-or-creator-id>
   Optional: &creator=<creator-id>&instrument=milestone|pk|perps&source=<ref>.
   A shorthand such as ?market=pk&creator=kai is also supported. */
(function () {
  'use strict';

  var BACK_TO_MARKETS = 'backerdemo.html#market';
  var routeBackHref = BACK_TO_MARKETS;
  var VALID_INSTRUMENTS = ['milestone', 'pk', 'perps'];
  var terminalObserver = null;

  function byId(id) { return document.getElementById(id); }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function isInstrument(value) {
    return VALID_INSTRUMENTS.indexOf(clean(value).toLowerCase()) >= 0;
  }

  function contracts() {
    return window.BACKER_MKT && Array.isArray(window.BACKER_MKT.CONTRACTS)
      ? window.BACKER_MKT.CONTRACTS
      : [];
  }

  function resolveContract(rawId, creatorId) {
    var candidates = [rawId, creatorId].map(clean).filter(Boolean);
    var list = contracts();
    for (var i = 0; i < candidates.length; i++) {
      var needle = candidates[i].toLowerCase();
      var found = list.filter(function (creator) {
        var creatorKey = clean(creator && creator.id).toLowerCase();
        var contractKey = clean(creator && creator.contract && creator.contract.id).toLowerCase();
        return needle === creatorKey || needle === contractKey || needle === ('ct-' + creatorKey);
      })[0];
      if (found) return found;
    }
    return null;
  }

  function storedPosition(id) {
    try {
      var value = JSON.parse(sessionStorage.getItem('backer_market_route_position_v1') || 'null');
      return value && clean(value.id) === clean(id) ? value : null;
    } catch (error) { return null; }
  }

  function configureReturn(source) {
    var fromPortfolio = source === 'portfolio' || source === 'portfolio_creator';
    routeBackHref = source === 'portfolio_creator' ? 'portfolio.html?mode=creator' : source === 'portfolio' ? 'portfolio.html' : BACK_TO_MARKETS;
    document.body.dataset.returnSource = fromPortfolio ? 'portfolio' : 'markets';
    var back = document.querySelector('.mdp-back');
    if (back) {
      back.href = routeBackHref;
      var label = back.querySelector('span:last-child');
      if (label) label.textContent = fromPortfolio ? 'Back to portfolio' : 'Back to markets';
    }
  }

  function showError(title, copy) {
    var status = byId('marketPageStatus');
    var message = byId('marketPageMessage');
    var heading = byId('marketPageTitle');
    var body = byId('marketPageCopy');
    var actions = byId('marketPageActions');
    var suggestions = byId('marketPageSuggestions');

    document.body.classList.remove('mdp-ready');
    if (status) { status.hidden = false; status.setAttribute('aria-busy', 'false'); }
    if (message) message.classList.add('mdp-error');
    if (heading) heading.textContent = title;
    if (body) body.textContent = copy;
    if (actions) actions.hidden = false;
    if (suggestions) {
      suggestions.replaceChildren();
      contracts().slice(0, 6).forEach(function (creator) {
        var link = document.createElement('a');
        link.href = 'backermarket.html?market=' + encodeURIComponent(creator.contract.id);
        link.textContent = creator.contract.title;
        suggestions.appendChild(link);
      });
    }
  }

  function adaptTerminal() {
    var root = document.querySelector('.poa-term-root');
    if (!root || !root.classList.contains('open')) return false;

    root.setAttribute('role', 'main');
    root.setAttribute('aria-label', 'Backer market detail');
    var terminal = root.querySelector('.pt-term');
    if (terminal) {
      terminal.setAttribute('role', 'region');
      terminal.removeAttribute('aria-modal');
    }
    var close = root.querySelector('.pt-x[data-close]');
    if (close) close.setAttribute('aria-label', document.body.dataset.returnSource === 'portfolio' ? 'Back to portfolio' : 'Back to markets');

    var status = byId('marketPageStatus');
    if (status) { status.hidden = true; status.setAttribute('aria-busy', 'false'); }
    document.body.classList.add('mdp-ready');
    return true;
  }

  function observeTerminal() {
    var root = document.querySelector('.poa-term-root');
    if (!root || typeof MutationObserver === 'undefined') return;
    if (terminalObserver) terminalObserver.disconnect();
    terminalObserver = new MutationObserver(function () { adaptTerminal(); });
    terminalObserver.observe(root, { childList: true, subtree: true });
  }

  function leaveMarket() {
    window.location.assign(routeBackHref);
  }

  /* On this route, the shared terminal's close affordances are page-level
     navigation, not modal dismissal. Event cards retain their own close UI. */
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var close = target.closest('.poa-term-root [data-close]');
    if (!close) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    leaveMarket();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var openInspector = document.querySelector('.poa-term-root .pt-evcard.show');
    if (openInspector) return;
    var root = document.querySelector('.poa-term-root.open');
    if (!root) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    leaveMarket();
  }, true);

  function boot() {
    var params = new URLSearchParams(window.location.search);
    var marketParam = clean(params.get('market') || params.get('id'));
    var creatorParam = clean(params.get('creator'));
    var positionParam = clean(params.get('position'));
    var instrumentParam = clean(params.get('instrument')).toLowerCase();
    var source = clean(params.get('source')) || 'direct';
    configureReturn(source);
    var shorthandInstrument = isInstrument(marketParam) ? marketParam.toLowerCase() : '';
    var instrument = isInstrument(instrumentParam) ? instrumentParam : (shorthandInstrument || 'milestone');
    var lookupMarket = shorthandInstrument ? '' : marketParam;

    if (positionParam) {
      var position = storedPosition(positionParam);
      if (!position) {
        showError('Position not found', 'Return to your portfolio and open this position again so its simulated market context can be restored.');
        return;
      }
      if (!window.PoaTerminal || typeof window.PoaTerminal.open !== 'function') {
        showError('Market view unavailable', 'The interactive market terminal did not load. Refresh the page or return to your portfolio.');
        return;
      }
      var positionInstrument = position.inst === 'CONTENT_PK' ? 'pk' : position.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone';
      var positionName = position.pk ? position.pk.side : position.title;
      document.title = (position.sub || position.title) + ' — Backer Market';
      document.body.dataset.marketId = position.id;
      document.body.dataset.creatorId = positionName;
      document.body.dataset.marketSource = source;
      try {
        window.PoaTerminal.open({
          seed: 'pos_' + position.id,
          creator: position.creator || null,
          name: positionName,
          position: position,
          surface: 'market',
          rival: position.pk ? (position.pk.side === position.pk.a ? position.pk.b : position.pk.a) : null,
          defaultMarket: (isInstrument(instrumentParam) || shorthandInstrument) ? instrument : positionInstrument,
          routeSource: source
        });
        adaptTerminal();
        observeTerminal();
        window.dispatchEvent(new CustomEvent('backer:market-route-opened', { detail: { positionId: position.id, instrument: positionInstrument, source: source } }));
      } catch (positionError) {
        showError('Could not open this position', 'The position data loaded, but its market page could not be rendered. Return to your portfolio and try again.');
        return;
      }
      window.setTimeout(function () { if (!adaptTerminal()) showError('Market took too long to load', 'Refresh the page or return to your portfolio and open this position again.'); }, 2400);
      return;
    }

    if (!marketParam && !creatorParam) {
      showError('No market selected', 'Choose a Backer market to open its traded-odds history, outcomes, rules, and order ticket.');
      return;
    }
    if (!window.BACKER_MKT || !contracts().length) {
      showError('Market data unavailable', 'The market catalog did not load. Refresh the page or return to the market board.');
      return;
    }

    var creator = resolveContract(lookupMarket, creatorParam);
    if (!creator) {
      showError('Market not found', '“' + (lookupMarket || creatorParam) + '” does not match an available Backer contract.');
      return;
    }
    if (!window.PoaTerminal || typeof window.PoaTerminal.openByMarket !== 'function') {
      showError('Market view unavailable', 'The interactive market terminal did not load. Refresh the page or return to the market board.');
      return;
    }

    document.title = creator.contract.title + ' — Backer Market';
    document.body.dataset.marketId = creator.contract.id;
    document.body.dataset.creatorId = creator.id;
    document.body.dataset.marketSource = source;

    try {
      window.PoaTerminal.openByMarket(creator.id, {
        creator: creator,
        name: creator.name,
        surface: 'market',
        defaultMarket: instrument,
        routeSource: source,
        contractId: creator.contract.id
      });
      adaptTerminal();
      observeTerminal();
      window.dispatchEvent(new CustomEvent('backer:market-route-opened', {
        detail: { creatorId: creator.id, contractId: creator.contract.id, instrument: instrument, source: source }
      }));
    } catch (error) {
      showError('Could not open this market', 'The market data loaded, but the detail terminal could not be rendered. Return to markets and try again.');
      return;
    }

    window.setTimeout(function () {
      if (!adaptTerminal()) {
        showError('Market took too long to load', 'Refresh the page or return to the market board and open this contract again.');
      }
    }, 2400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
