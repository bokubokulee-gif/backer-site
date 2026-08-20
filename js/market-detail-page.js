/* Dedicated market route: backermarket.html?market=<contract-or-creator-id>
   Optional: &creator=<creator-id>&instrument=milestone|pk|perps&source=<ref>.
   A shorthand such as ?market=pk&creator=kai is also supported. */
(function () {
  'use strict';

  var BACK_TO_MARKETS = 'backerdemo.html#market2';
  var DRAFT_STORAGE_PREFIX = 'backer_market_route_draft_v1:';
  var routeBackHref = BACK_TO_MARKETS;
  var VALID_INSTRUMENTS = ['milestone', 'pk', 'perps'];
  var terminalObserver = null;
  var activeDraftContext = null;

  function byId(id) { return document.getElementById(id); }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function isInstrument(value) {
    return VALID_INSTRUMENTS.indexOf(clean(value).toLowerCase()) >= 0;
  }

  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var url = new URL(raw, window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (error) { return ''; }
  }

  function finiteNumber(value) {
    var number = Number(value);
    return value !== '' && value != null && isFinite(number) ? number : null;
  }

  function draftError(message) {
    return { ok: false, message: message };
  }

  function storedDraft(id) {
    var raw;
    try { raw = sessionStorage.getItem(DRAFT_STORAGE_PREFIX + id); }
    catch (storageError) { return draftError('This browser session cannot read the saved proposal. Return to Market 2 and create it again.'); }
    if (!raw) return draftError('This proposal is not available in the current browser session. Return to Market 2 and create it again.');
    var draft;
    try { draft = JSON.parse(raw); }
    catch (parseError) { return draftError('The saved proposal is not valid JSON. Return to Market 2 and create it again.'); }
    if (!draft || Number(draft.schemaVersion) !== 1 || clean(draft.draftId) !== clean(id)) return draftError('The saved proposal has an unsupported version or identifier.');
    if (draft.executionMode !== 'simulation') return draftError('Only simulation proposals can open on this public route.');
    if (draft.instrument !== 'milestone' && draft.instrument !== 'pk') return draftError('This proposal uses an unsupported market instrument.');
    if (!draft.subject || !draft.subject.person || !clean(draft.subject.person.id) || !clean(draft.subject.person.name)) return draftError('The proposal is missing its referenced public identity.');
    if (!draft.outcome || clean(draft.outcome.question).length < 12 || !Array.isArray(draft.outcome.outcomes) || draft.outcome.outcomes.length < 2) return draftError('The proposal is missing a complete question or outcome set.');
    if (!draft.resolution || !clean(draft.resolution.metricKey) || !clean(draft.resolution.metricLabel)) return draftError('The proposal is missing a provider-native resolution metric.');
    var baseline = finiteNumber(draft.resolution.baseline && draft.resolution.baseline.value);
    var target = finiteNumber(draft.resolution.target && draft.resolution.target.value);
    if (baseline == null || baseline < 0 || target == null || target <= baseline) return draftError('The proposal baseline and growth target are invalid.');
    if (!safeURL(draft.resolution.sourceUrl)) return draftError('The proposal does not contain a valid HTTP or HTTPS resolution source.');
    if (!draft.resolution.deadline || isNaN(Date.parse(draft.resolution.deadline))) return draftError('The proposal does not contain a valid resolution cutoff.');
    if (!draft.rules || finiteNumber(draft.rules.graceHours) == null || finiteNumber(draft.rules.disputeHours) == null || !clean(draft.rules.deletionRule) || !clean(draft.rules.correctionRule) || !clean(draft.rules.voidRule)) return draftError('The proposal is missing required resolution safeguards.');
    var approved = draft.approvalStatus === 'approved_simulation'
      && draft.market && draft.market.lifecycle === 'OPEN'
      && draft.market.approvalStatus === 'approved_simulation'
      && finiteNumber(draft.market.quote) > 0
      && finiteNumber(draft.market.quote) < 100;
    return { ok: true, draft: draft, approved: approved, discovery: !approved };
  }

  function formatNumber(value) {
    var number = finiteNumber(value);
    return number == null ? 'Not set' : number.toLocaleString('en-US');
  }

  function formatDraftDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return clean(value) || 'Not set';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function draftTerminalContext(result, source) {
    var draft = result.draft;
    var person = draft.subject.person;
    var resolution = draft.resolution;
    var baseline = finiteNumber(resolution.baseline.value);
    var target = finiteNumber(resolution.target.value);
    var progress = target > 0 ? Math.max(0, Math.min(100, baseline / target * 100)) : 0;
    var contractId = 'DRAFT-' + clean(draft.draftId).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 32);
    var contract = {
      id: contractId,
      version: 'draft-v1',
      title: clean(draft.outcome.question),
      source: safeURL(resolution.sourceUrl),
      deadlineLabel: formatDraftDate(resolution.deadline),
      baseline: baseline,
      target: target,
      curLabel: formatNumber(baseline),
      tgtLabel: formatNumber(target),
      progressPct: progress,
      opensInDays: null
    };
    var creator = {
      id: 'draft-' + clean(person.id),
      name: clean(person.name),
      handle: clean(person.handle),
      avatar: safeURL(person.avatar),
      platforms: Array.isArray(person.platforms) ? person.platforms.map(function (platform) { return { id: clean(platform.id), handle: clean(platform.handle), url: safeURL(platform.url) }; }) : [],
      eligibility: clean(person.eligibility),
      consentStatus: clean(person.consentStatus),
      poa: { shown: false },
      milestone: { metric: clean(resolution.metricLabel), current: baseline, target: target },
      contract: contract,
      mkt: { state: result.discovery ? 'OPENING_SOON' : 'OPEN', contract: contract }
    };
    var outcomes = draft.outcome.outcomes;
    return {
      seed: 'draft_' + draft.draftId,
      id: draft.draftId,
      creator: creator,
      name: creator.name,
      handle: creator.handle,
      rival: draft.instrument === 'pk' && outcomes[1] ? clean(outcomes[1].label) : null,
      surface: 'market',
      defaultMarket: draft.instrument,
      routeSource: source,
      contractId: contractId,
      draft: draft
    };
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
    var fromMarket2 = source === 'market2' || source === 'market2-builder' || source === 'builder';
    var fromLocalArchive = source === 'market-archive';
    routeBackHref = source === 'portfolio_creator' ? 'portfolio.html?mode=creator' : source === 'portfolio' ? 'portfolio.html' : fromLocalArchive ? 'backerdemo.html#market-archive' : fromMarket2 ? 'backerdemo.html#market2' : BACK_TO_MARKETS;
    document.body.dataset.returnSource = fromPortfolio ? 'portfolio' : 'markets';
    var back = document.querySelector('.mdp-back');
    if (back) {
      back.href = routeBackHref;
      var label = back.querySelector('span:last-child');
      if (label) label.textContent = fromPortfolio ? 'Back to portfolio' : fromMarket2 ? 'Back to Market 2' : 'Back to markets';
    }
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function kv(label, value) {
    var row = element('div', 'pt-kv');
    row.appendChild(element('span', '', label));
    row.appendChild(element('b', '', value));
    return row;
  }

  function findBlock(surface, title) {
    var blocks = Array.prototype.slice.call(surface.querySelectorAll('.pt-block'));
    return blocks.filter(function (block) {
      var heading = block.querySelector('.pt-block-h h4');
      return heading && clean(heading.textContent).toLowerCase() === title.toLowerCase();
    })[0] || null;
  }

  function draftRuleLabel(value, labels) {
    return labels[value] || clean(value).replace(/_/g, ' ');
  }

  function fillExactRules(container, draft) {
    var resolution = draft.resolution;
    var rules = draft.rules;
    var outcomes = draft.outcome.outcomes.map(function (outcome) { return clean(outcome.label); }).join(' / ');
    var rows = [
      ['Question', clean(draft.outcome.question)],
      ['Outcomes', outcomes],
      ['Metric', clean(resolution.metricLabel) + ' on ' + clean(resolution.platform).toUpperCase()],
      ['Baseline', formatNumber(resolution.baseline.value) + ' at ' + formatDraftDate(resolution.baseline.observedAt)],
      ['Target', formatNumber(resolution.target.value)],
      ['Measurement cutoff', formatDraftDate(resolution.deadline)],
      ['Resolution source', safeURL(resolution.sourceUrl)],
      ['Provider grace', rules.graceHours + ' hours'],
      ['Deletion or private status', draftRuleLabel(rules.deletionRule, { pause_then_void: 'Pause through grace period, then void', last_valid_snapshot: 'Use the approved last valid snapshot' })],
      ['Provider correction', draftRuleLabel(rules.correctionRule, { latest_valid_before_cutoff: 'Use the latest valid correction before cutoff', freeze_at_cutoff: 'Freeze the retained value at cutoff' })],
      ['Tie rule', draft.instrument === 'pk' ? draftRuleLabel(rules.tieRule, { separate_outcome: 'Separate tie outcome', void_on_tie: 'Void and refund on an exact tie' }) : 'Not applicable'],
      ['Void and refund', draftRuleLabel(rules.voidRule, { refund_original_cost: 'Refund at original cost', refund_equal_value: 'Refund outcomes at equal value' })],
      ['Dispute window', rules.disputeHours + ' hours']
    ];
    container.replaceChildren();
    rows.forEach(function (row) { container.appendChild(kv(row[0], row[1])); });
    var note = element('p', 'pt-rule-callout', 'Proposal terms are versioned in this browser session. Backer must approve consent, provider access, policy, and settlement provenance before trading can open.');
    container.appendChild(note);
  }

  function sanitizeDiscoveryDraft(rootNode) {
    if (!activeDraftContext || !activeDraftContext.discovery) return false;
    var surface = rootNode.querySelector('.pt-market-surface');
    if (!surface) return false;
    var draft = activeDraftContext.draft;
    if (surface.dataset.draftSanitized === draft.draftId) return true;
    surface.dataset.draftSanitized = draft.draftId;
    surface.dataset.draftProposal = 'true';
    surface.dataset.marketStatus = 'OPENING_SOON';
    surface.dataset.marketOpen = 'false';
    surface.dataset.hasHistory = 'false';

    var question = surface.querySelector('.pt-name');
    if (question) question.textContent = clean(draft.outcome.question);
    var type = surface.querySelector('.pt-id-t .pt-sub');
    if (type) type.textContent = (draft.instrument === 'pk' ? 'PK MARKET' : 'MILESTONE') + ' PROPOSAL';
    var statusStats = Array.prototype.slice.call(surface.querySelectorAll('.pt-hstat'));
    statusStats.forEach(function (stat) {
      var small = stat.querySelector('small');
      var bold = stat.querySelector('b');
      if (small && bold && clean(small.textContent).toLowerCase() === 'status') bold.textContent = 'Opening soon';
    });

    var platformLegend = surface.querySelector('.pt-plats');
    if (platformLegend) {
      Array.prototype.slice.call(platformLegend.children).forEach(function (child) { if (!child.matches('[data-goto-poa]')) child.remove(); });
      platformLegend.appendChild(element('span', 'pt-plat', 'No executed trades or quotes yet'));
      platformLegend.appendChild(element('span', 'pt-plat', 'Draft ' + draft.draftId));
      platformLegend.appendChild(element('span', 'pt-plat', 'Cutoff ' + formatDraftDate(draft.resolution.deadline)));
    }

    var controls = surface.querySelector('.pt-controls');
    if (controls) {
      var tabs = controls.querySelector('.pt-market-tabs');
      if (tabs) {
        Array.prototype.slice.call(tabs.querySelectorAll('[data-mtype]')).forEach(function (button) {
          var selected = button.dataset.mtype === draft.instrument;
          button.hidden = !selected;
          button.disabled = true;
          button.setAttribute('aria-disabled', 'true');
        });
        controls.replaceChildren(tabs, element('div', 'pt-layer-legend', 'Proposal only: no market history'));
      } else controls.replaceChildren(element('div', 'pt-layer-legend', 'Proposal only: no market history'));
    }

    var disclosure = surface.querySelector('.pt-disc span');
    if (disclosure) disclosure.textContent = 'Proposal only. No executions, quotes, volume, or market-implied probability exists. Trading can open only after consent, policy, provider access, and settlement-source approval.';

    var chart = surface.querySelector('.pt-chartwrap');
    if (chart) {
      var chartEmpty = element('div', 'pt-empty pt-preopen-history');
      chartEmpty.appendChild(element('b', '', 'No executed market history.'));
      chartEmpty.appendChild(element('p', '', 'This discovery proposal has no candles, quotes, trades, volume, or inferred probability. The chart begins only after an approved simulation market records real simulation executions.'));
      chart.replaceChildren(chartEmpty);
    }

    var outcomeBlock = findBlock(surface, 'Outcomes');
    if (outcomeBlock) {
      var outcomeBody = outcomeBlock.querySelector('.pt-block-b');
      if (outcomeBody) {
        outcomeBody.replaceChildren();
        var outcomeText = draft.outcome.outcomes.map(function (outcome) { return clean(outcome.label); }).join(' / ');
        var outcomeEmpty = element('div', 'pt-empty');
        outcomeEmpty.appendChild(element('b', '', outcomeText));
        outcomeEmpty.appendChild(element('p', '', 'Outcomes are defined, but no price or normalized market probability exists before approval and opening.'));
        outcomeBody.appendChild(outcomeEmpty);
      }
    }

    var trade = surface.querySelector('.pt-side > .pt-trade');
    if (trade) {
      var tradeHead = element('div', 'pt-trade-h');
      tradeHead.appendChild(element('div', 'mk', draft.instrument === 'pk' ? 'PK market proposal' : 'Milestone proposal'));
      tradeHead.appendChild(element('h3', '', clean(draft.outcome.question)));
      tradeHead.appendChild(element('p', '', 'Opening soon. No executable quote exists.'));
      var tradeBody = element('div', 'pt-trade-b');
      var tradeEmpty = element('div', 'pt-empty');
      tradeEmpty.appendChild(element('b', '', 'This proposal is not tradable.'));
      tradeEmpty.appendChild(element('p', '', 'There is no order ticket, bid, ask, price, fee, maximum loss, or fill until Backer approves the market and an actual simulation quote exists.'));
      tradeBody.appendChild(tradeEmpty);
      tradeBody.appendChild(element('p', 'pt-sim', 'Simulation proposal only. No real money moves.'));
      trade.replaceChildren(tradeHead, tradeBody);
    }

    var community = surface.querySelector('[data-bmc-slot]');
    if (community) {
      var proposalBlock = element('div', 'pt-block');
      var proposalHead = element('div', 'pt-block-h');
      proposalHead.appendChild(element('h4', '', 'Proposal status'));
      proposalHead.appendChild(element('span', 'note', 'opening soon'));
      var proposalBody = element('div', 'pt-block-b');
      var proposalEmpty = element('div', 'pt-empty');
      proposalEmpty.appendChild(element('b', '', 'Discovery review is pending.'));
      proposalEmpty.appendChild(element('p', '', 'Community market activity remains unavailable because this proposal has no open market, trades, or quotes.'));
      proposalBody.appendChild(proposalEmpty);
      proposalBlock.append(proposalHead, proposalBody);
      community.replaceWith(proposalBlock);
    }

    var underlying = surface.querySelector('.pt-underlying .pt-block-b');
    if (underlying) {
      underlying.replaceChildren();
      underlying.appendChild(kv('Native metric', clean(draft.resolution.metricLabel)));
      underlying.appendChild(kv('Proposed baseline', formatNumber(draft.resolution.baseline.value) + ' at ' + formatDraftDate(draft.resolution.baseline.observedAt)));
      underlying.appendChild(kv('Target', formatNumber(draft.resolution.target.value)));
      underlying.appendChild(kv('Cutoff', formatDraftDate(draft.resolution.deadline)));
      underlying.appendChild(kv('Source', safeURL(draft.resolution.sourceUrl)));
      underlying.appendChild(element('p', 'pt-underlying-note', 'This is a proposal definition, not a measured progress series, market price, probability, or Proof of Attention score.'));
    }

    var about = findBlock(surface, 'About');
    if (about) {
      var aboutBody = about.querySelector('.pt-block-b');
      if (aboutBody) {
        aboutBody.replaceChildren();
        aboutBody.appendChild(element('p', 'pt-comp-def', 'A ' + (draft.subject.type === 'content-growth' ? 'content-growth' : 'person-growth') + ' proposal on one provider-native metric. Proof of Attention is separate underwriting context and never supplies a settlement value or pre-market price.'));
      }
    }
    var rules = findBlock(surface, 'Market rules');
    if (rules) {
      var rulesBody = rules.querySelector('.pt-block-b');
      if (rulesBody) fillExactRules(rulesBody, draft);
    }
    var fillBlock = findBlock(surface, 'Your fills & P&L');
    if (fillBlock) {
      var fillsBody = fillBlock.querySelector('.pt-block-b');
      if (fillsBody) {
        var fillsEmpty = element('div', 'pt-empty');
        fillsEmpty.appendChild(element('b', '', 'No fills exist.'));
        fillsEmpty.appendChild(element('p', '', 'The proposal is Opening soon and has no order ticket or execution history.'));
        fillsBody.replaceChildren(fillsEmpty);
      }
    }

    var sourceFooter = surface.querySelector('.pt-sources');
    if (sourceFooter) {
      var sourceRow = sourceFooter.querySelector('.row1');
      if (sourceRow) {
        sourceRow.replaceChildren();
        [['Draft', draft.draftId], ['Status', 'Opening soon'], ['Metric', clean(draft.resolution.metricLabel)], ['Cutoff', formatDraftDate(draft.resolution.deadline)], ['Settlement', safeURL(draft.resolution.sourceUrl)], ['Price basis', 'No executions or quotes yet']].forEach(function (row) {
          var span = element('span', '', row[0] + ' ');
          span.appendChild(element('b', '', row[1]));
          sourceRow.appendChild(span);
        });
      }
      var footerDisclosure = sourceFooter.querySelector('.disclosure');
      if (footerDisclosure) footerDisclosure.textContent = 'This local simulation proposal contains no real users, money, executions, quotes, volume, or market-implied probability. Public identity evidence does not create consent or settlement authority.';
      var acts = sourceFooter.querySelector('.acts');
      if (acts) Array.prototype.slice.call(acts.querySelectorAll('button')).forEach(function (button) { if (!button.hasAttribute('data-goto-poa')) button.remove(); });
    }

    Array.prototype.slice.call(surface.querySelectorAll('[data-order],[data-quote-action],[data-order-type]')).forEach(function (control) {
      control.removeAttribute('data-order');
      control.removeAttribute('data-quote-action');
      control.removeAttribute('data-order-type');
      if ('disabled' in control) control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    });
    return true;
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

    sanitizeDiscoveryDraft(root);

    root.setAttribute('role', 'main');
    root.setAttribute('aria-label', 'Backer market detail');
    var terminal = root.querySelector('.pt-term');
    if (terminal) {
      terminal.setAttribute('role', 'region');
      terminal.removeAttribute('aria-modal');
    }
    var close = root.querySelector('.pt-x[data-close]');
    if (close) close.setAttribute('aria-label', document.body.dataset.returnSource === 'portfolio' ? 'Back to portfolio' : 'Back to markets');
    if ((!activeDraftContext || !activeDraftContext.discovery) && window.BackerMarketCommunity && typeof window.BackerMarketCommunity.mount === 'function') {
      window.BackerMarketCommunity.mount(root);
    }

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
    var draftParam = clean(params.get('draft'));
    var marketParam = clean(params.get('market') || params.get('id'));
    var creatorParam = clean(params.get('creator'));
    var positionParam = clean(params.get('position'));
    var instrumentParam = clean(params.get('instrument')).toLowerCase();
    var source = clean(params.get('source')) || 'direct';
    configureReturn(source);
    var shorthandInstrument = isInstrument(marketParam) ? marketParam.toLowerCase() : '';
    var instrument = isInstrument(instrumentParam) ? instrumentParam : (shorthandInstrument || 'milestone');
    var lookupMarket = shorthandInstrument ? '' : marketParam;

    if (draftParam) {
      var draftResult = storedDraft(draftParam);
      if (!draftResult.ok) {
        showError('Proposal not found', draftResult.message);
        return;
      }
      if (!window.PoaTerminal || typeof window.PoaTerminal.open !== 'function') {
        showError('Market view unavailable', 'The full Backer market terminal did not load. Refresh the page or return to Market 2.');
        return;
      }
      activeDraftContext = draftResult;
      var requestedDraftInstrument = instrument === draftResult.draft.instrument ? instrument : draftResult.draft.instrument;
      var draftContext = draftTerminalContext(draftResult, source);
      draftContext.defaultMarket = requestedDraftInstrument;
      document.title = clean(draftResult.draft.outcome.question) + ' | Backer Market';
      document.body.dataset.marketId = draftResult.draft.draftId;
      document.body.dataset.creatorId = clean(draftResult.draft.subject.person.id);
      document.body.dataset.marketSource = source;
      document.body.dataset.draftStatus = draftResult.discovery ? 'discovery_proposal' : 'approved_simulation';
      try {
        window.PoaTerminal.open(draftContext);
        adaptTerminal();
        observeTerminal();
        window.dispatchEvent(new CustomEvent('backer:market-route-opened', { detail: { draftId: draftResult.draft.draftId, instrument: requestedDraftInstrument, source: source, approvalStatus: draftResult.draft.approvalStatus } }));
      } catch (draftOpenError) {
        activeDraftContext = null;
        showError('Could not open this proposal', 'The saved terms were valid, but the full market terminal could not render them. Return to Market 2 and try again.');
        return;
      }
      window.setTimeout(function () { if (!adaptTerminal()) showError('Proposal took too long to load', 'Refresh the page or return to Market 2 and open the proposal again.'); }, 2400);
      return;
    }

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
