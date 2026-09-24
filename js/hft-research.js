(function () {
  'use strict';
  var M = window.BackerHftModel;
  if (!M) return;
  var state = { study: 'fh', event: 'beat', profile: 0, history: true, stage: 'setup', age: 250, mix: 'balanced', record: 2, heroAction: null, ledger: { shares: 100, cash: 5000 }, steps: 0 };
  function t(value) { return window.BackerI18n ? window.BackerI18n.t(value) : value; }
  function byId(id) { return document.getElementById(id); }
  function text(id, value) { byId(id).textContent = t(value); }
  function el(tag, value, className) { var node = document.createElement(tag); if (value !== undefined) node.textContent = t(value); if (className) node.className = className; return node; }
  function signed(value) { return (value < 0 ? '−' : '+') + Math.abs(value).toFixed(1); }
  function pressed(selector, key, selected) { document.querySelectorAll(selector).forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset[key] === String(selected))); }); }
  function svgNode(tag, attrs, value) { var n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (value !== undefined) n.textContent = t(value); return n; }

  function renderMemory() {
    var profile = M.profiles[state.profile], timeline = byId('memory-timeline');
    timeline.replaceChildren();
    profile.records.forEach(function (record, i) {
      var button = el('button', record.date); button.type = 'button'; button.dataset.record = String(i);
      button.setAttribute('aria-pressed', String(state.record === i));
      button.addEventListener('click', function () { state.record = i; renderMemory(); renderField(); byId('memory-timeline').querySelector('[data-record="' + i + '"]').focus(); });
      timeline.appendChild(button);
    });
    var record = profile.records[state.record];
    text('memory-event', record.event); text('memory-action', record.action); text('memory-context', record.context);
    byId('memory-timeline').closest('.hft-memory').classList.toggle('is-withheld', !state.history);
  }
  function resetDecision() { state.heroAction = null; state.ledger = { shares: 100, cash: 5000 }; state.steps = 0; }
  function renderDecision() {
    var profile = M.profiles[state.profile], action = M.decision(state.event, state.profile, state.ledger, state.history);
    text('decision-trader', profile.id); text('decision-history', state.history ? profile.history : 'Behavioral history withheld; only the market situation is supplied.');
    text('decision-event', M.events[state.event].label); text('decision-market', M.markets[state.event].context);
    byId('decision-shares').textContent = state.ledger.shares;
    byId('decision-cash').textContent = state.ledger.cash.toLocaleString('en-US');
    byId('decision-count').textContent = state.steps + ' / 3';
    var options = byId('decision-options'); options.replaceChildren();
    [['add', 'Add 10 shares'], ['hold', 'Keep the position'], ['reduce', 'Reduce 10 shares'], ['insufficient', 'Insufficient evidence']].forEach(function (entry) {
      var option = el('span', entry[1]); option.dataset.selected = String(action === entry[0]); if (action === entry[0]) option.setAttribute('aria-current', 'true'); options.appendChild(option);
    });
    text('decision-result', 'The highlighted choice is an authored example, not a live Jev answer.');
    byId('advance-decision').disabled = state.steps >= 3;
  }

  function renderField() {
    var svg = byId('investor-field'), canvas = svg.parentElement;
    var width = canvas.clientWidth, mid = 110, gate = Math.max(160, width * .52);
    var profile = M.profiles[state.profile], values = M.heroResponse(state.event, state.profile, state.history);
    var base = M.heroResponse(state.event, state.profile, false);
    var chosen = state.heroAction === null ? values.indexOf(Math.max.apply(null, values)) : state.heroAction;
    var projection = M.heroProjection(state.event, chosen), record = profile.records[state.record];
    var positions = [24, Math.max(68, width * .20), Math.max(112, width * .36)];
    var records = byId('hero-records'), outcomes = byId('hero-outcomes');
    svg.setAttribute('viewBox', '0 0 ' + width + ' 244'); svg.replaceChildren(); records.replaceChildren(); outcomes.replaceChildren();
    canvas.classList.toggle('is-withheld', !state.history);
    svg.appendChild(svgNode('line', { x1: 0, y1: mid, x2: gate - 24, y2: mid, class: 'hft-lens-axis' }));
    var historyPath = svgNode('path', { d: 'M24 ' + mid + ' H' + (gate - 24), class: 'hft-lens-history-path' }); svg.appendChild(historyPath);
    profile.records.forEach(function (entry, i) {
      var x = positions[i], y = mid - entry.change * 1.35;
      svg.appendChild(svgNode('line', { x1: x, x2: x, y1: mid, y2: y, class: 'hft-lens-stem', 'data-selected': String(i === state.record) }));
      var button = el('button', undefined, 'hft-lens-record'); button.type = 'button'; button.dataset.heroRecord = String(i);
      button.style.left = x + 'px'; button.style.top = y + 'px';
      button.setAttribute('aria-pressed', String(i === state.record)); button.setAttribute('aria-label', t(entry.date) + ': ' + t(entry.event) + '. ' + t(entry.action));
      var amount = entry.change === 0 ? '0' : (entry.change > 0 ? '+' : '−') + Math.abs(entry.change);
      button.append(el('strong', amount), el('small', entry.date));
      button.addEventListener('click', function () { state.record = i; renderField(); renderMemory(); byId('hero-records').querySelector('[data-hero-record="' + i + '"]').focus(); }); records.append(button);
    });
    svg.appendChild(svgNode('line', { x1: gate, x2: gate, y1: 20, y2: 207, class: 'hft-lens-boundary' }));
    svg.appendChild(svgNode('rect', { x: gate - 23, y: mid - 19, width: 46, height: 38, rx: 2, class: 'hft-lens-gate' }));
    svg.appendChild(svgNode('text', { x: gate, y: mid + 5, 'text-anchor': 'middle', class: 'hft-lens-jev' }, 'Jev'));
    [42, 110, 178].forEach(function (y, i) {
      var end = width - 80, start = gate + 25, curve = start + Math.max(12, (end - start) * .45);
      var path = 'M' + start + ' ' + mid + ' C' + curve + ' ' + mid + ' ' + (end - 26) + ' ' + y + ' ' + end + ' ' + y;
      svg.appendChild(svgNode('path', { d: path, class: 'hft-lens-branch hft-lens-choice-' + i, 'stroke-width': 2 + values[i] * .15, 'data-selected': String(i === chosen) }));
      var button = el('button', undefined, 'hft-lens-outcome hft-lens-choice-' + i); button.type = 'button'; button.dataset.heroAction = String(i); button.style.top = y + 'px';
      button.setAttribute('aria-pressed', String(i === chosen)); button.setAttribute('aria-label', t(M.actions[i]) + ': ' + values[i] + '%. ' + t('Explore a possible next action'));
      button.append(el('span', M.actions[i]), el('strong', values[i] + '%'));
      button.addEventListener('click', function () { state.heroAction = i; renderField(); byId('hero-outcomes').querySelector('[data-hero-action="' + i + '"]').focus(); }); outcomes.append(button);
    });
    var lift = values[chosen] - base[chosen];
    text('hero-history-toggle', state.history ? 'Withhold history' : 'Restore history'); byId('hero-history-toggle').setAttribute('aria-pressed', String(state.history));
    text('hero-record-date', record.date); text('hero-record-action', record.action);
    byId('hero-record-context').textContent = t(record.event) + ' ' + t(record.context);
    byId('hero-lift').textContent = (lift > 0 ? '+' : lift < 0 ? '−' : '') + Math.abs(lift) + ' ' + t('pp');
    byId('hero-comparison').textContent = t(M.actions[chosen]) + ': ' + base[chosen] + '% → ' + values[chosen] + '%';
    byId('hero-next-shares').textContent = '100 → ' + projection.shares + ' ' + t('shares');
    byId('hero-next-cash').textContent = '$5,000 → $' + projection.cash.toLocaleString('en-US') + ' · ' + t('cash');
    svg.setAttribute('aria-label', t(profile.id) + '. ' + t(M.events[state.event].label) + '. ' + t(state.history ? 'History included' : 'History removed') + '. ' + values.map(function (v, i) { return t(M.actions[i]) + ' ' + v + '%'; }).join(', '));
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
        state.profile = i; resetDecision(); renderResponse();
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
    renderField(); renderPopulation(); renderMemory(); renderDecision(); renderStage();
    byId('response-announcement').textContent = t(event.label) + '. ' + t(profile.label) + '. ' + t('Selected distribution') + ': ' + values.map(function (v, i) { return t(M.actions[i]) + ' ' + v + '%'; }).join('; ') + '.';
  }

  var STAGES = {
    setup: { kind: '01 / The connection', title: 'One model. A precise interface.', body: 'Install the TypeSafe skill and Python SDK. Keep the API key on the server, use the direct endpoint, and pin a model version so every experiment can be reproduced.', note: 'Interactive reference workflow. Values and outputs are authored examples; this page makes no live Jev requests.' },
    snapshot: { kind: '02 / The input', title: 'A market snapshot becomes personal.', body: 'Code computes prices, spreads, exposure and available cash. Backer adds the individual’s observed decisions and the information they had at the time. Freeze that record before asking Jev.', note: 'Only evidence available at the cutoff enters the request. Later outcomes stay in the evaluation set.' },
    questions: { kind: '03 / The judgment battery', title: 'One state. Several precise questions.', body: 'Ask action, confirmation and reaction speed together. Each question sees the same frozen state and returns its own typed answer. Independent questions share a request; a question that needs an earlier answer waits for the next request.', note: 'Choice selects an action. Noul estimates whether a condition holds. Score locates the state on a defined rubric. None returns a conversation.' },
    policy: { kind: '04 / The policy', title: 'The model judges. Code decides what happens.', body: 'The simulator checks freshness and feasibility before using an answer. Cash, holdings and scenario rules remain deterministic. A fund consuming the signal keeps its own exposure limits, risk vetoes and execution policy.', note: 'Confidence thresholds are calibrated on held-out decisions. A concentrated distribution is not proof that a prediction is correct.' },
    advance: { kind: '05 / The next situation', title: 'Update the state. Run the next decision.', body: 'Apply a simulated fill, account for costs, update holdings and cash, then advance the market clock. Send the new state in a separate Jev request. Repeat across individuals and paths to build the population response.', note: 'The public demonstration uses fixed ten-share fills without fees. Research runs must model spreads, fees, impact and missed fills. Simulated actions never become observed history.' },
    evaluate: { kind: '06 / The evidence', title: 'Measure the behavior. Then measure the edge.', body: 'Compare rules, a frontier model, Jev, and Jev with calibrated abstention on identical histories and market situations. Remove individual history to measure its contribution. Hold out traders, events and future periods.', note: 'Promote a model when it improves observed outcomes within the latency and cost budget. Pin the new version and retain the previous benchmark.' }
  };
  var guideOrder = Object.keys(STAGES), primitive = 'choice', delivery = 'healthy';
  function guideRows(rows) { var dl = el('dl', undefined, 'hft-guide-facts'); rows.forEach(function (pair) { var row = el('div'); row.append(el('dt', pair[0]), el('dd', pair[1])); dl.append(row); }); return dl; }
  function guideCode(value) { var pre = el('pre'); pre.tabIndex = 0; var code = document.createElement('code'); code.textContent = value; pre.append(code); return pre; }
  function guideBar(label, value) { var row = el('div', undefined, 'hft-guide-bar'); var track = el('i'); track.style.setProperty('--fill', value + '%'); row.append(el('span', label), track, el('b', value + '%')); return row; }
  function renderGuideVisual() {
    var visual = byId('guide-visual'); visual.replaceChildren();
    if (state.stage === 'setup') {
      visual.append(guideCode('npx skills add typesafe-ai/skills --skill typesafe-ai\npip install typesafe-sdk==0.7.1'), guideRows([['Server environment', 'TYPESAFE_API_KEY'], ['Direct endpoint', 'POST /v1/systemone'], ['Pinned model', 'jev-1.13.0']]));
    } else if (state.stage === 'snapshot') {
      var flow = el('div', undefined, 'hft-snapshot-flow');
      ['Observed history', 'Current account', 'Visible market'].forEach(function (v) { flow.append(el('span', v)); });
      flow.append(el('strong', 'One timestamped state')); visual.append(flow);
      visual.append(guideRows([['Individual', M.profiles[state.profile].id], ['History', state.history ? M.profiles[state.profile].history : 'History removed'], ['Situation', M.events[state.event].detail], ['Shares / cash · USD', state.ledger.shares + ' / ' + state.ledger.cash.toLocaleString('en-US')], ['Market price · USD', String(M.markets[state.event].price)]]));
    } else if (state.stage === 'questions') {
      var branches = el('div', undefined, 'hft-judgment-branches'); branches.setAttribute('role', 'group'); branches.setAttribute('aria-label', t('Inspect a typed question'));
      [['choice', 'Choice'], ['noul', 'Noul'], ['score', 'Score']].forEach(function (entry) { var b = el('button', entry[1]); b.type = 'button'; b.dataset.primitive = entry[0]; b.setAttribute('aria-pressed', String(primitive === entry[0])); b.addEventListener('click', function () { primitive = entry[0]; renderGuideVisual(); byId('guide-visual').querySelector('[data-primitive="' + primitive + '"]').focus(); }); branches.append(b); });
      visual.append(el('p', 'Same frozen state → independent judgments', 'hft-guide-state-line'), branches);
      var result = el('div', undefined, 'hft-judgment-result'); result.setAttribute('aria-live', 'polite');
      if (primitive === 'choice') { result.append(el('h4', 'What would this individual do next?')); [['Add',58],['Hold',26],['Reduce',10],['Insufficient evidence',6]].forEach(function (v) { result.append(guideBar(v[0], v[1])); }); }
      if (primitive === 'noul') { result.append(el('h4', 'Will they wait for a second confirming signal?'), guideBar('Probability of yes', 22), el('p', 'A yes/no probability. It is neither intensity nor a separate confidence score.')); }
      if (primitive === 'score') { result.append(el('h4', 'How quickly would they change exposure?'), el('strong', '2.35 / 3', 'hft-guide-big-number'), guideRows([['0', 'No change this session'], ['1', 'More than 60 minutes later'], ['2', '15 to 60 minutes later'], ['3', 'Less than 15 minutes later']]), el('p', 'A probability-weighted rubric value, not a duration in minutes.')); }
      visual.append(result, el('small', 'Authored outputs for one example request.'));
    } else if (state.stage === 'policy') {
      var modes = [['healthy','On time'],['uncertain','Low confidence'],['late','Past deadline'],['offline','Jev unavailable'],['limit','Hard limit']];
      var controls = el('div', undefined, 'hft-options hft-guide-modes'); controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', t('Test a policy condition'));
      modes.forEach(function (entry) { var b = el('button', entry[1]); b.type = 'button'; b.dataset.delivery = entry[0]; b.setAttribute('aria-pressed', String(delivery === entry[0])); b.addEventListener('click', function () { delivery = entry[0]; renderGuideVisual(); byId('guide-visual').querySelector('[data-delivery="' + delivery + '"]').focus(); }); controls.append(b); });
      var outcomes = {healthy:['Apply the feasible simulated action','Continue after checking available cash, holdings and scenario limits.'],uncertain:['Record an abstention','Use a threshold evaluated on the cost of each error. Do not invent a trade.'],late:['Discard the answer','Refresh the evidence and ask again. A retry never resets the original deadline.'],offline:['Use the explicit fallback','Run a tested deterministic baseline or stop this path. Log the service failure.'],limit:['Stop this path','The hard rule overrides the model. Downstream funds apply their own risk response.']};
      var outcome = el('div', undefined, 'hft-policy-outcome'); outcome.dataset.condition = delivery; outcome.setAttribute('role','status'); outcome.append(el('small','Code-owned outcome'),el('h4',outcomes[delivery][0]),el('p',outcomes[delivery][1])); visual.append(controls,outcome);
    } else if (state.stage === 'advance') {
      var next = M.step(state.event,state.profile,state.ledger,state.history);
      visual.append(el('p','One illustrative next step', 'hft-guide-state-line'),guideRows([['Shares held',state.ledger.shares + ' → ' + next.shares],['Available cash · USD',state.ledger.cash.toLocaleString('en-US') + ' → ' + next.cash.toLocaleString('en-US')],['Observed records','Unchanged'],['Next request','Updated account + next market snapshot']]));
      var jump = el('a','Try the decision loop ↑','sim-link'); jump.href='#decision-loop'; visual.append(jump);
    } else {
      visual.append(guideRows([['Behavioral accuracy','Brier score · log loss · action timing'],['Calibration','Predicted probabilities vs observed frequencies'],['Economic value','Net P&L · drawdown · slippage · capacity'],['Operating budget','Tail latency · coverage · cost per decision']]));
      var loop = el('div',undefined,'hft-calibration-loop'); ['Predict','Observe','Compare','Recalibrate'].forEach(function(v){loop.append(el('span',v));}); visual.append(loop);
    }
  }
  function renderStage() {
    var stage = STAGES[state.stage], index = guideOrder.indexOf(state.stage); pressed('[data-stage]', 'stage', state.stage);
    text('stage-kind',stage.kind); text('stage-title',stage.title); text('stage-body',stage.body); text('stage-note',stage.note);
    byId('guide-position').textContent = '0' + (index + 1) + ' / 06'; text('guide-next', index === 5 ? 'Back to the start ↺' : 'Next step →'); renderGuideVisual();
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
  document.querySelectorAll('[data-event]').forEach(function (b) { b.addEventListener('click', function () { state.event = b.dataset.event; resetDecision(); renderResponse(); }); });
  document.querySelectorAll('[data-profile]').forEach(function (b) { b.addEventListener('click', function () { state.profile = Number(b.dataset.profile); resetDecision(); renderResponse(); }); });
  document.querySelectorAll('[data-stage]').forEach(function (b) { b.addEventListener('click', function () { state.stage = b.dataset.stage; renderStage(); }); });
  document.querySelectorAll('[data-age]').forEach(function (b) { b.addEventListener('click', function () { state.age = Number(b.dataset.age); renderFreshness(); }); });
  byId('hero-history-toggle').addEventListener('click', function () { state.history = !state.history; resetDecision(); renderResponse(); });
  byId('history-toggle').addEventListener('click', function () { state.history = !state.history; resetDecision(); renderResponse(); });
  byId('reset-response').addEventListener('click', function () { state.event = 'beat'; state.profile = 0; state.history = true; state.mix = 'balanced'; state.record = 2; resetDecision(); renderResponse(); });
  byId('advance-decision').addEventListener('click', function () { if (state.steps < 3) { state.ledger = M.step(state.event, state.profile, state.ledger, state.history); state.steps++; renderDecision(); renderStage(); } });
  byId('reset-decision').addEventListener('click', function () { resetDecision(); renderDecision(); renderStage(); renderField(); });
  byId('guide-next').addEventListener('click', function () { state.stage = guideOrder[(guideOrder.indexOf(state.stage) + 1) % guideOrder.length]; renderStage(); });
  renderAlpha(); renderResponse(); renderStage(); renderFreshness();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { renderAlpha(); renderPopulation(); renderClock(); renderField(); }).observe(byId('alpha-chart').parentElement);
}());
