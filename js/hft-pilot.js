/* Published-page refinement. All default outputs are authored synthetic fixtures. */
(function () {
  'use strict';
  var M = window.BackerHftModel;
  if (!M || !document.getElementById('fund-comparison')) return;
  var selection = { eventId: 'beat', profileId: 0, historyIncluded: true };
  var pathId = 'rebound', depthId = 'normal', fundAction = 'hold', inspected = 'hold';
  var judgment = M.fixtureJudgment(selection), pending = false, version = 0, controller;
  var byId = function (id) { return document.getElementById(id); };
  var t = function (value) { return window.BackerI18n ? window.BackerI18n.t(value) : value; };
  var labels = { add: 'Add', hold: 'Hold', reduce: 'Reduce', abstain: 'Abstain' };
  function el(tag, value, className) { var n = document.createElement(tag); if (value !== undefined) n.textContent = t(value); if (className) n.className = className; return n; }
  function number(value) { return new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value); }
  function svgNode(tag, attrs, value) { var n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (value !== undefined) n.textContent = t(value); return n; }
  function fact(label, value) { var row = el('div'); row.append(el('dt', label), el('dd', value)); return row; }
  function renderFund() {
    var focus = document.activeElement && document.activeElement.id;
    var result = M.compareAlternatives(selection.eventId, pathId, depthId);
    var current = result.branches.find(function (b) { return b.id === fundAction; });
    byId('fund-start').textContent = t(M.events[selection.eventId].label) + ' · ' + t('Starting fund account') + ': 100 ' + t('shares') + ' + $5,000 · ' + t('Starting price') + ': $' + number(result.initial.mark);
    document.querySelectorAll('[data-fund-path]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.fundPath === pathId)); });
    document.querySelectorAll('[data-fund-depth]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.fundDepth === depthId)); });
    var choices = byId('fund-actions'); choices.replaceChildren();
    result.branches.forEach(function (b) { var button = el('button', labels[b.id]); button.type = 'button'; button.id = 'fund-action-' + b.id; button.dataset.fundAction = b.id; button.setAttribute('aria-pressed', String(b.id === fundAction)); choices.append(button); });
    byId('fund-ledger').replaceChildren(
      fact('Filled / requested shares', current.filledShares + ' / ' + current.requestedShares),
      fact('Fee · USD', number(current.fee)), fact('Spread cost · USD', number(current.spreadCost)),
      fact('Remaining cash · USD', number(current.cash)), fact('Shares after fill', String(current.shares)),
      fact('End value · USD', number(current.finalValue)), fact('Difference from Hold · USD', number(current.incrementalVsHold))
    );
    var table = byId('fund-values'); table.replaceChildren();
    result.branches.forEach(function (b) { var row = el('tr'), heading = el('th', labels[b.id]); heading.scope = 'row'; row.append(heading, el('td', number(b.finalValue)), el('td', number(b.incrementalVsHold))); table.append(row); });
    var svg = byId('fund-chart'), all = result.branches.flatMap(function (b) { return b.points; });
    var bottom = Math.min.apply(null, all) - 15, top = Math.max.apply(null, all) + 15;
    var x = function (i) { return 90 + i / (result.path.length - 1) * 535; };
    var y = function (v) { return 245 - (v - bottom) / (top - bottom) * 205; };
    svg.replaceChildren(); svg.setAttribute('viewBox', '0 0 680 300');
    svg.append(svgNode('title', {}, 'Synthetic fund portfolio values under a shared authored path'));
    [bottom, (bottom + top) / 2, top].forEach(function (v) { svg.append(svgNode('line', { x1: 90, x2: 625, y1: y(v), y2: y(v), class: 'hft-gridline' }), svgNode('text', { x: 78, y: y(v) + 5, 'text-anchor': 'end', class: 'hft-fund-axis' }, String(Math.round(v)))); });
    result.branches.forEach(function (b) { var d = b.points.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(' '); svg.append(svgNode('path', { d: d, class: 'hft-fund-path hft-fund-' + b.id, 'data-selected': String(b.id === fundAction) })); });
    svg.append(svgNode('text', { x: 90, y: 285, class: 'hft-fund-axis' }, 'Start'), svgNode('text', { x: 625, y: 285, 'text-anchor': 'end', class: 'hft-fund-axis' }, 'Authored endpoint'));
    if (focus && byId(focus)) byId(focus).focus({ preventScroll: true });
  }
  function renderJudgment() {
    var focus = document.activeElement && document.activeElement.id;
    byId('typed-source').textContent = t(judgment.source === 'jev' ? 'Live Jev judgment · synthetic inputs' : 'Authored fixture · not a Jev judgment');
    byId('evaluate-jev').textContent = t(pending ? 'Evaluating frozen state…' : 'Evaluate with Jev');
    byId('evaluate-jev').setAttribute('aria-disabled', String(pending));
    var options = byId('typed-probabilities'); options.replaceChildren();
    ['add', 'hold', 'reduce', 'abstain'].forEach(function (id) { var b = el('button'); b.type = 'button'; b.id = 'inspect-' + id; b.dataset.inspect = id; b.setAttribute('aria-pressed', String(inspected === id)); b.append(el('span', labels[id]), el('strong', number(judgment.probabilities[id] * 100) + '%')); options.append(b); });
    if (focus && byId(focus)) byId(focus).focus({ preventScroll: true });
  }
  var errorText = {
    not_configured: 'Jev is not configured on this local server. The authored fixture remains visible.',
    upstream_unavailable: 'Jev is unavailable. No live judgment was applied.',
    invalid_response: 'The server returned an invalid judgment. The authored fixture remains visible.',
    timeout: 'The judgment timed out. No live result was applied.',
    invalid_request: 'The server rejected this fixture selection.',
    forbidden: 'The server rejected this request origin.',
    busy: 'The local adapter is busy. Try again shortly.',
    too_large: 'The request or response exceeded the local size limit.',
    method_not_allowed: 'The local adapter requires a JSON POST request.',
    unavailable: 'The local adapter is unavailable on this host. The authored fixture remains visible.'
  };
  async function evaluate() {
    if (pending) return;
    var captured = Object.assign({}, selection), mine = ++version;
    judgment = M.fixtureJudgment(selection); pending = true; var requestController = controller = new AbortController();
    var timer = setTimeout(function () { requestController.abort(); }, 12000);
    renderJudgment(); byId('typed-status').textContent = t('Evaluating the starting participant snapshot. The fund comparison stays unchanged.');
    try {
      var response = await fetch('/api/hft/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(captured), signal: requestController.signal });
      var data;
      try { data = await response.json(); } catch (_) { throw new Error('unavailable'); }
      if (mine !== version) return;
      if (!response.ok) throw new Error(data.error || 'unavailable');
      try { M.validateJudgment(data.judgment); } catch (_) { throw new Error('invalid_response'); }
      if (data.judgment.source !== 'jev' || !data.selection || Object.keys(captured).some(function (k) { return data.selection[k] !== captured[k]; })) throw new Error('invalid_response');
      judgment = data.judgment;
      byId('typed-status').textContent = t('Selected by model') + ': ' + t(labels[judgment.choice]) + ' · ' + t('Confidence') + ': ' + number(judgment.confidence) + ' · ' + judgment.model;
    } catch (error) {
      if (mine !== version) return;
      var key = error.name === 'AbortError' ? 'timeout' : error.message;
      byId('typed-status').textContent = t(errorText[key] || errorText.unavailable);
    } finally { clearTimeout(timer); if (mine === version) { pending = false; renderJudgment(); } }
  }
  window.addEventListener('backer:hft-selection', function (event) {
    var next = event.detail;
    if (Object.keys(selection).every(function (key) { return selection[key] === next[key]; })) return;
    selection = Object.assign({}, next); version++; if (controller) controller.abort(); pending = false;
    judgment = M.fixtureJudgment(selection); renderFund(); renderJudgment();
    byId('typed-status').textContent = t('Inputs changed. Previous judgments were cleared; the authored fixture is shown.');
  });
  document.addEventListener('click', function (event) {
    var b = event.target.closest('button'); if (!b) return;
    if (b.dataset.fundPath) { pathId = b.dataset.fundPath; renderFund(); }
    if (b.dataset.fundDepth) { depthId = b.dataset.fundDepth; renderFund(); }
    if (b.dataset.fundAction) { fundAction = b.dataset.fundAction; renderFund(); }
    if (b.dataset.inspect) { inspected = b.dataset.inspect; renderJudgment(); }
    if (b.id === 'evaluate-jev') evaluate();
  });
  var dialog = byId('research-api-dialog');
  byId('open-research-api').addEventListener('click', async function () {
    byId('api-selection').textContent = JSON.stringify(selection, null, 2);
    byId('api-contract').textContent = JSON.stringify(window.BackerHftContract, null, 2);
    byId('api-contract-status').textContent = t('Bundled local contract. Checking the optional adapter…');
    dialog.showModal(); byId('close-research-api').focus();
    try {
      var response = await fetch('/api/hft/contract', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('unavailable');
      var contract = await response.json();
      if (!contract.response || !contract.endpoint) throw new Error('invalid');
      byId('api-contract').textContent = JSON.stringify(contract, null, 2);
      byId('api-contract-status').textContent = t('Contract loaded from the local adapter. Availability does not establish model accuracy.');
    } catch (_) { byId('api-contract-status').textContent = t('Bundled contract shown. This host has no available local adapter.'); }
  });
  byId('close-research-api').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { byId('open-research-api').focus({ preventScroll: true }); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var controls = Array.from(dialog.querySelectorAll('button,[tabindex="0"]')), first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  renderFund(); renderJudgment();
}());
