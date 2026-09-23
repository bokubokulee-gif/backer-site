(function () {
  'use strict';
  var M = window.BackerHftModel;
  if (!M) return;
  var state = { study: 'fh', event: 'beat', profile: 0, history: true, stage: 'jev', age: 250, mix: 'balanced' };
  function t(value) { return window.BackerI18n ? window.BackerI18n.t(value) : value; }
  function byId(id) { return document.getElementById(id); }
  function text(id, value) { byId(id).textContent = t(value); }
  function el(tag, value, className) { var node = document.createElement(tag); if (value !== undefined) node.textContent = t(value); if (className) node.className = className; return node; }
  function signed(value) { return (value < 0 ? '−' : '+') + Math.abs(value).toFixed(1); }
  function pressed(selector, key, selected) { document.querySelectorAll(selector).forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset[key] === String(selected))); }); }
  function svgNode(tag, attrs, value) { var n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (value !== undefined) n.textContent = t(value); return n; }

  function renderField() {
    var svg = byId('investor-field');
    svg.setAttribute('viewBox', '0 0 480 256'); svg.replaceChildren();
    svg.appendChild(svgNode('circle', { cx: 240, cy: 38, r: 25, class: 'hft-event-halo' }));
    svg.appendChild(svgNode('circle', { cx: 240, cy: 38, r: 7, class: 'hft-event-point' }));
    [80, 240, 400].forEach(function (cx, profile) {
      var path = 'M240 65 C240 102 ' + cx + ' 82 ' + cx + ' 128';
      svg.appendChild(svgNode('path', { d: path, class: 'hft-field-thread' }));
      svg.appendChild(svgNode('path', { d: path, class: 'hft-field-pulse', style: '--delay:' + profile * 80 + 'ms' }));
      var values = M.response(state.event, profile, state.history);
      var group = svgNode('g', { class: 'hft-field-cluster', opacity: profile === state.profile ? 1 : 0.68 });
      group.appendChild(svgNode('rect', { x: cx - 63, y: 133, width: 126, height: 113, rx: 20, class: profile === state.profile ? 'hft-cluster-frame is-selected' : 'hft-cluster-frame' }));
      for (var j = 0; j < 24; j++) {
        var rank = (j + 0.5) / 24 * 100, action = 0, cumulative = values[0];
        while (rank > cumulative && action < 3) { action++; cumulative += values[action]; }
        var x = cx - 45 + (j % 6) * 18, y = 160 + Math.floor(j / 6) * 20;
        var attrs = { class: 'hft-person hft-action-' + action, style: '--delay:' + j * 16 + 'ms' };
        var mark;
        if (action === 1) mark = svgNode('rect', Object.assign(attrs, { x: x - 4, y: y - 4, width: 8, height: 8, rx: 1 }));
        else if (action === 2) mark = svgNode('path', Object.assign(attrs, { d: 'M' + x + ' ' + (y - 5) + 'l5 9h-10Z' }));
        else mark = svgNode('circle', Object.assign(attrs, { cx: x, cy: y, r: 4.5 }));
        group.appendChild(mark);
      }
      svg.appendChild(group);
    });
    svg.setAttribute('aria-label', t(M.events[state.event].label) + '. ' + t('Investor responses grouped by behavioral history'));
    byId('field-reading').textContent = t('Illustrative behavioral field') + ' · ' + t(M.profiles[state.profile].history);
  }

  function renderPopulation() {
    var mix = M.mixes[state.mix], result = M.population(state.event, state.mix, state.history);
    pressed('[data-mix]', 'mix', state.mix);
    var composition = byId('cohort-composition'); composition.replaceChildren();
    mix.weights.forEach(function (weight, i) {
      var row = el('button', undefined, 'hft-cohort-row');
      row.type = 'button'; row.dataset.cohort = String(i);
      row.setAttribute('aria-pressed', String(i === state.profile));
      row.addEventListener('click', function () {
        state.profile = i; renderResponse();
        byId('cohort-composition').querySelector('[data-cohort="' + i + '"]').focus();
      });
      row.append(el('small', '0' + (i + 1)), el('span', M.profiles[i].label), el('b', (weight * 100).toFixed(weight === 1 / 3 ? 1 : 0) + '%'));
      composition.appendChild(row);
    });
    var svg = byId('cohort-flow'), width = Math.max(260, svg.parentElement.clientWidth);
    var sx = 32, tx = width - 65, unit = 1.6, sourceY = 25, targetY = 25;
    var starts = [], ends = [];
    svg.setAttribute('viewBox', '0 0 ' + width + ' 284'); svg.replaceChildren();
    mix.weights.forEach(function (weight, i) {
      starts.push(sourceY);
      svg.appendChild(svgNode('rect', { x: sx - 4, y: sourceY, width: 4, height: weight * 100 * unit, class: 'hft-flow-source' }));
      svg.appendChild(svgNode('text', { x: 1, y: sourceY + weight * 50 * unit + 4, class: 'hft-flow-label' }, '0' + (i + 1)));
      sourceY += weight * 100 * unit + 27;
    });
    result.totals.forEach(function (value, i) {
      ends.push(targetY);
      svg.appendChild(svgNode('rect', { x: tx, y: targetY, width: 5, height: value * unit, class: 'hft-action-' + i }));
      svg.appendChild(svgNode('text', { x: tx + 13, y: targetY + value * unit / 2 + 4, class: 'hft-flow-number' }, value.toFixed(1)));
      targetY += value * unit + 18;
    });
    result.flows.forEach(function (row, i) {
      row.forEach(function (value, j) {
        var thick = value * unit, sy = starts[i], ty = ends[j], mid = (sx + tx) / 2;
        var d = 'M' + sx + ' ' + sy + 'C' + mid + ' ' + sy + ' ' + mid + ' ' + ty + ' ' + tx + ' ' + ty + 'v' + thick + 'C' + mid + ' ' + (ty + thick) + ' ' + mid + ' ' + (sy + thick) + ' ' + sx + ' ' + (sy + thick) + 'Z';
        var ribbon = svgNode('path', { d: d, class: 'hft-flow-ribbon hft-action-' + j, opacity: i === state.profile ? 0.66 : 0.25 });
        ribbon.appendChild(svgNode('title', {}, t(M.profiles[i].label) + ' → ' + t(M.actions[j]) + ': ' + value.toFixed(1)));
        svg.appendChild(ribbon); starts[i] += thick; ends[j] += thick;
      });
    });
    var labels = el('div', undefined, 'hft-flow-legend');
    M.actions.forEach(function (action, i) { var label = el('span'); var dot = el('i'); dot.dataset.action = String(i); label.append(dot, el('span', action)); labels.appendChild(label); });
    var oldLegend = svg.parentElement.querySelector('.hft-flow-legend');
    if (oldLegend) oldLegend.replaceWith(labels); else svg.after(labels);
    var body = byId('cohort-values'); body.replaceChildren();
    result.totals.forEach(function (value, i) { var row = el('tr'); var th = el('th', M.actions[i]); th.scope = 'row'; row.append(th, el('td', value.toFixed(1)), el('td', M.events[state.event].base[i].toFixed(1))); body.appendChild(row); });
    byId('cohort-tilt').textContent = signed(result.tilt);
    byId('cohort-summary').textContent = t(M.events[state.event].label) + ' · ' + t(mix.label) + ' · ' + t(state.history ? 'History included' : 'History removed') + '. ' + result.totals.map(function (v, i) { return t(M.actions[i]) + ' ' + v.toFixed(1); }).join(' / ');
  }

  function renderClock() {
    var svg = byId('freshness-clock'); var width = Math.max(260, svg.parentElement.clientWidth);
    var start = 18, end = width - 18, lifetime = start + (end - start) * 1000 / 1750;
    var current = start + (end - start) * state.age / 1750;
    svg.setAttribute('viewBox', '0 0 ' + width + ' 140'); svg.replaceChildren();
    svg.appendChild(svgNode('rect', { x: start, y: 55, width: lifetime - start, height: 22, rx: 3, class: 'hft-clock-valid' }));
    svg.appendChild(svgNode('line', { x1: lifetime, x2: end, y1: 66, y2: 66, class: 'hft-clock-expired' }));
    svg.appendChild(svgNode('line', { x1: lifetime, x2: lifetime, y1: 35, y2: 88, class: 'hft-clock-deadline' }));
    svg.appendChild(svgNode('text', { x: start, y: 111, class: 'hft-clock-label' }, '0 ms'));
    svg.appendChild(svgNode('text', { x: lifetime, y: 111, 'text-anchor': 'middle', class: 'hft-clock-label' }, '1,000 ms'));
    svg.appendChild(svgNode('text', { x: current, y: 25, 'text-anchor': 'middle', class: 'hft-clock-current-label' }, state.age + ' ms'));
    svg.appendChild(svgNode('circle', { cx: current, cy: 66, r: 9, class: 'hft-clock-marker ' + (state.age < 1000 ? '' : 'is-expired'), style: '--origin:' + (start - current) + 'px' }));
  }

  function renderAlpha() {
    var study = M.studies[state.study];
    var svg = byId('alpha-chart');
    var width = Math.max(260, svg.parentElement.clientWidth);
    var left = 18, right = width - 18;
    function x(value) { return left + (value + 60) / 160 * (right - left); }
    svg.setAttribute('viewBox', '0 0 ' + width + ' 208');
    svg.replaceChildren();
    [-40, 0, 40, 80].forEach(function (tick) {
      svg.appendChild(svgNode('line', { x1: x(tick), x2: x(tick), y1: 12, y2: 171, class: tick === 0 ? 'hft-zero' : 'hft-gridline' }));
      svg.appendChild(svgNode('text', { x: x(tick), y: 196, 'text-anchor': 'middle', class: 'hft-axis-label' }, String(tick)));
    });
    var rows = [ [study.early, study.earlySE, '2006–2017', 50], [study.late, study.lateSE, '2018–2024', 137] ];
    var body = byId('alpha-values'); body.replaceChildren();
    rows.forEach(function (row, i) {
      var range = M.interval(row[0], row[1]);
      svg.appendChild(svgNode('text', { x: left, y: row[3] - 22, class: 'hft-period-label' }, row[2]));
      svg.appendChild(svgNode('line', { x1: x(range[0]), x2: x(range[1]), y1: row[3], y2: row[3], class: 'hft-ci hft-ci-' + i }));
      range.forEach(function (v) { svg.appendChild(svgNode('line', { x1: x(v), x2: x(v), y1: row[3] - 6, y2: row[3] + 6, class: 'hft-ci-cap hft-ci-' + i })); });
      svg.appendChild(svgNode('circle', { cx: x(row[0]), cy: row[3], r: 6, class: 'hft-estimate hft-estimate-' + i }));
      svg.appendChild(svgNode('text', { x: x(row[0]), y: row[3] + 26, 'text-anchor': 'middle', class: 'hft-estimate-label' }, signed(row[0])));
      var tr = el('tr'); var th = el('th', row[2]); th.scope = 'row';
      tr.append(th, el('td', signed(row[0])), el('td', signed(range[0]) + ' … ' + signed(range[1]))); body.appendChild(tr);
    });
    pressed('[data-study]', 'study', state.study);
    byId('alpha-announcement').textContent = study.label + '. ' + t('Monthly relative alpha') + ': 2006–2017, ' + signed(study.early) + '; 2018–2024, ' + signed(study.late) + '. ' + t('Basis points per month · approximate 95% interval');
  }

  function renderResponse() {
    var event = M.events[state.event]; var profile = M.profiles[state.profile];
    var values = M.response(state.event, state.profile, state.history);
    pressed('[data-event]', 'event', state.event); pressed('[data-profile]', 'profile', state.profile);
    text('event-detail', event.detail); text('profile-history', profile.history);
    text('history-toggle', state.history ? 'History included' : 'History removed');
    byId('history-toggle').setAttribute('aria-pressed', String(state.history));
    var bars = byId('response-bars'); bars.replaceChildren();
    var table = byId('response-values'); table.replaceChildren();
    values.forEach(function (value, i) {
      var row = el('div', undefined, 'hft-probability-row');
      var label = el('span', M.actions[i]); var track = el('div', undefined, 'hft-probability-track');
      track.setAttribute('aria-hidden', 'true');
      var fill = el('i', undefined, 'hft-probability-fill'); fill.style.setProperty('--share', value + '%');
      var reference = el('i', undefined, 'hft-probability-reference'); reference.style.left = event.base[i] + '%';
      track.append(fill, reference); row.append(label, track, el('b', value + '%')); bars.appendChild(row);
      var tr = el('tr'); var th = el('th', M.actions[i]); th.scope = 'row'; tr.append(th, el('td', String(value)), el('td', String(event.base[i]))); table.appendChild(tr);
    });
    text('response-reading', state.history ? profile.reading : 'Without history, every profile uses the same event-only distribution. Every person now receives the same forecast.');
    renderField(); renderPopulation();
    byId('response-announcement').textContent = t(event.label) + '. ' + t(profile.label) + '. ' + t('Selected distribution') + ': ' + values.map(function (v, i) { return t(M.actions[i]) + ' ' + v + '%'; }).join('; ') + '.';
  }

  var STAGES = {
    evidence: {
      kind: 'Point-in-time inputs', title: 'Reconstruct the decision context.',
      body: 'Connect timestamped events with observed exposure, decisions, holdings and constraints. Build a history of the conditions under which each person acts.',
      note: 'Use consented or licensed records. Keep inferred motives separate from observed actions.',
      caption: 'Evidence record', rows: [['Observed', 'Event, exposure, order, position'], ['Recorded', 'Timestamp, source, consent scope'], ['Kept separate', 'Inferred motives and missing data']]
    },
    jev: {
      kind: 'Typed semantic judgments', title: 'A defined answer. Ready for code.',
      body: 'Jev selects from defined answers and returns probabilities. Interpret announcements, classify decision context and feed structured features into Backer’s behavioral model.',
      note: 'Model confidence describes the answer distribution. It is not a probability of profit.',
      caption: 'Illustrative Choice question', rows: [['Question', 'How does this announcement change the stated outlook?'], ['Options', 'Improves · unchanged · weakens · unclear'], ['Output', 'Selected option + probabilities + confidence']]
    },
    backer: {
      kind: 'Conditional behavioral model', title: 'Model the individual response.',
      body: 'Combine semantic features with observed histories, current positions and constraints. Estimate who adds, holds or reduces, and when they act. Calibrate against held-out decisions.',
      note: 'Jev supplies semantic features. Backer estimates and calibrates behavioral responses.',
      caption: 'Behavioral output', rows: [['Condition on', 'Event + history + current state'], ['Estimate', 'Action distribution + response horizon'], ['Attach', 'Coverage, uncertainty, model version']]
    },
    fund: {
      kind: 'Independent deterministic controls', title: 'Connect behavior to execution.',
      body: 'Apply behavioral context within the fund’s sizing, liquidity and execution rules. Check signal freshness, price impact and exposure before admitting an order.',
      note: 'Position sizing depends on expected return and risk, separately from model confidence.',
      caption: 'Execution checks', rows: [['Validate', 'Schema, timestamp and signal lifetime'], ['Constrain', 'Liquidity, exposure, turnover and costs'], ['Observe', 'Fills, realized outcomes and drift']]
    }
  };
  function renderStage() {
    var stage = STAGES[state.stage]; pressed('[data-stage]', 'stage', state.stage);
    text('stage-kind', stage.kind); text('stage-title', stage.title); text('stage-body', stage.body); text('stage-note', stage.note); text('contract-caption', stage.caption);
    var container = byId('contract-content'); container.replaceChildren();
    var dl = el('dl'); stage.rows.forEach(function (row) { var d = el('div'); d.append(el('dt', row[0]), el('dd', row[1])); dl.appendChild(d); }); container.appendChild(dl);
  }
  function renderFreshness() {
    pressed('[data-age]', 'age', state.age);
    var fresh = M.contextStatus(state.age, 1000) === 'fresh';
    text('freshness-result', fresh ? 'Fresh context → eligible for further checks' : 'Expired context → discard and refresh');
    byId('freshness-result').dataset.state = fresh ? 'fresh' : 'expired';
    renderClock();
  }
  document.querySelectorAll('[data-mix]').forEach(function (b) { b.addEventListener('click', function () { state.mix = b.dataset.mix; renderPopulation(); }); });
  document.querySelectorAll('[data-study]').forEach(function (b) { b.addEventListener('click', function () { state.study = b.dataset.study; renderAlpha(); }); });
  document.querySelectorAll('[data-event]').forEach(function (b) { b.addEventListener('click', function () { state.event = b.dataset.event; renderResponse(); }); });
  document.querySelectorAll('[data-profile]').forEach(function (b) { b.addEventListener('click', function () { state.profile = Number(b.dataset.profile); renderResponse(); }); });
  document.querySelectorAll('[data-stage]').forEach(function (b) { b.addEventListener('click', function () { state.stage = b.dataset.stage; renderStage(); }); });
  document.querySelectorAll('[data-age]').forEach(function (b) { b.addEventListener('click', function () { state.age = Number(b.dataset.age); renderFreshness(); }); });
  byId('history-toggle').addEventListener('click', function () { state.history = !state.history; renderResponse(); });
  byId('reset-response').addEventListener('click', function () { state.event = 'beat'; state.profile = 0; state.history = true; state.mix = 'balanced'; renderResponse(); });
  renderAlpha(); renderResponse(); renderStage(); renderFreshness();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { renderAlpha(); renderPopulation(); renderClock(); }).observe(byId('alpha-chart').parentElement);
}());
