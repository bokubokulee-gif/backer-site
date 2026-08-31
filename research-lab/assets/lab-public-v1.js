const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STAGES = Object.freeze([
  { id: 'exposed', label: 'EXPOSED', meaning: 'Could see it', color: '#a9a39a' },
  { id: 'attending', label: 'ATTENDING', meaning: 'Gave it attention', color: '#d2c1a8' },
  { id: 'propagating', label: 'PROPAGATING', meaning: 'Spread the signal', color: '#e9bd86' },
  { id: 'committed', label: 'COMMITTED', meaning: 'Took a costly action', color: '#e39a43' },
  { id: 'filled', label: 'FILLED', meaning: 'Reached the modeled outcome', color: '#58d3a0' },
]);

const SCENARIOS = Object.freeze({
  baseline: {
    code: 'A / BASE', label: 'BASELINE', note: 'No modeled condition changed.',
    description: 'Observed market prior; no intervention applied.',
    stageCounts: [3345, 1275, 310, 70, 0], expected: 869, interval: [821, 917], probability: 0.78,
    book: 0.68, delta: 'REFERENCE SNAPSHOT',
    drivers: ['Current causal stage', 'Trading propensity', 'Attention availability'],
  },
  'social-proof': {
    code: 'B1 / SOCIAL', label: 'SOCIAL PROOF', note: 'Published scenario: influence rises from 1.0× to 1.5×.',
    description: 'A reviewed aggregate projection with stronger visible social proof.',
    stageCounts: [3030, 1320, 450, 170, 30], expected: 1114, interval: [1048, 1181], probability: 0.91,
    book: 0.73, delta: '+245 VS BASELINE',
    drivers: ['Visible peer commitment', 'Signal repetition', 'Trading propensity'],
  },
  'lower-friction': {
    code: 'B2 / FRICTION', label: 'LOWER FRICTION', note: 'Published scenario: action friction falls from 1.0× to 0.5×.',
    description: 'A reviewed aggregate projection with fewer steps between belief and commitment.',
    stageCounts: [3140, 1210, 420, 190, 40], expected: 1238, interval: [1162, 1310], probability: 0.94,
    book: 0.76, delta: '+369 VS BASELINE',
    drivers: ['Lower action friction', 'Commitment readiness', 'Current causal stage'],
  },
  'diverse-reach': {
    code: 'B3 / REACH', label: 'DIVERSE REACH', note: 'Published scenario: reach broadens across less-connected clusters.',
    description: 'A reviewed aggregate projection with broader, less concentrated exposure.',
    stageCounts: [2870, 1430, 510, 160, 30], expected: 1047, interval: [982, 1113], probability: 0.87,
    book: 0.71, delta: '+178 VS BASELINE',
    drivers: ['Broader network coverage', 'Attention availability', 'Signal diversity'],
  },
});

const INFO = Object.freeze({
  scene: 'Forecast pairs the complete field with a readable workbench. Network enlarges the field. Markets keeps source selection in view.',
  counterfactual: 'A declared condition changed in a published aggregate scenario. It is not an observed real-world intervention.',
  baseline: 'The reference model snapshot with no declared intervention.',
  'social-proof': 'A reviewed scenario output in which visible peer influence is stronger.',
  'trade-friction': 'A reviewed scenario output in which fewer steps separate intent from commitment.',
  'diverse-reach': 'A reviewed scenario output in which exposure is spread across more clusters.',
  'market-universe': 'Dated public Kalshi and Polymarket observations normalized into a shared display shape.',
  'behavior-lens': 'Individual profile filters are unavailable in the public build because the full research population is not browser-shipped.',
  'observed-yes': 'The venue-displayed probability captured with the source observation.',
  'observed-volume': 'The venue activity field retained with its original measurement boundary.',
  'model-book': 'A published model snapshot. The computation that produced it does not execute in this browser.',
  'filled-contract-proxy': 'Expected modeled agents reaching the filled-contract proxy within the stated horizon.',
  'clear-threshold': 'Published probability that the modeled result clears the predeclared threshold.',
  'modeled-drivers': 'Plain-language labels accompanying the published model output; they are not causal proof.',
});

const FALLBACK_MARKET = Object.freeze({
  id: 'polymarket:fed-september-no-change', title: 'Fed decision in September: No change',
  shortTitle: 'Fed: no change in September', category: 'Economics', probability: 0.68,
  volume: 54796110, volumeMetric: 'cumulative_event_volume', platform: 'Polymarket',
  sourceUrl: 'https://polymarket.com/event/fed-decision-in-september-762',
  observedAt: '2026-08-27T12:59:36.000Z', source: { adapter: 'polymarket' },
});

const state = {
  scenario: 'baseline', mode: 'field', marketSource: 'all', markets: [FALLBACK_MARKET],
  selectedMarket: FALLBACK_MARKET, points: [], selectedPoint: null, tick: 0, playing: false,
  speed: 1, lastStep: 0, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const field = $('#attention-field');
const mount = $('#scene-mount');
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Five-stage anonymous attention field projection');
mount.append(canvas);
const context = canvas.getContext('2d', { alpha: true });

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function compactNumber(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
}

function sourceKey(market) {
  return String(market.platform || market.source?.adapter || market.source || 'Market').toLowerCase();
}

function sourceLabel(market) {
  const key = sourceKey(market);
  return key.includes('kalshi') ? 'KALSHI' : key.includes('poly') ? 'POLYMARKET' : key.toUpperCase();
}

function seeded(index) {
  let value = (index + 1) * 2654435761 >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 4294967295;
}

function stageForIndex(index) {
  const counts = SCENARIOS[state.scenario].stageCounts;
  let cursor = 0;
  for (let stage = 0; stage < counts.length; stage += 1) {
    cursor += counts[stage];
    if (index < cursor) return stage;
  }
  return 0;
}

function rebuildPoints() {
  state.points = Array.from({ length: 5000 }, (_, index) => ({
    id: index + 1,
    stage: stageForIndex(index),
    a: seeded(index * 3 + 1),
    b: seeded(index * 3 + 2),
    c: seeded(index * 3 + 3),
    x: 0,
    y: 0,
  }));
  drawField();
}

function sizeCanvas() {
  const rect = mount.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function pointPosition(point, width, height) {
  const vertical = width < 560;
  const stage = point.stage;
  const radial = Math.sqrt(point.a);
  const angle = point.b * Math.PI * 2;
  const wobble = Math.sin(state.tick * 0.025 + point.c * Math.PI * 2) * (state.playing ? 1.4 : 0);
  if (vertical) {
    const lane = height / 5;
    return {
      x: width * 0.5 + Math.cos(angle) * radial * Math.min(width * 0.34, lane * 0.6) + wobble,
      y: lane * (stage + 0.5) + Math.sin(angle) * radial * lane * 0.34,
    };
  }
  const lane = width / 5;
  return {
    x: lane * (stage + 0.5) + Math.cos(angle) * radial * lane * 0.34,
    y: height * 0.5 + Math.sin(angle) * radial * Math.min(height * 0.36, lane * 0.95) + wobble,
  };
}

function drawConnectors(width, height) {
  const vertical = width < 560;
  context.save();
  context.strokeStyle = 'rgba(233, 189, 134, .13)';
  context.lineWidth = 0.7;
  for (let stage = 0; stage < 4; stage += 1) {
    for (let index = 0; index < 18; index += 1) {
      const offset = (seeded(stage * 43 + index) - 0.5) * (vertical ? width * 0.5 : height * 0.56);
      context.beginPath();
      if (vertical) {
        const y1 = height / 5 * (stage + 0.65);
        const y2 = height / 5 * (stage + 1.35);
        context.moveTo(width * 0.5 + offset, y1);
        context.bezierCurveTo(width * 0.5 - offset * 0.3, (y1 + y2) / 2, width * 0.5 + offset * 0.3, (y1 + y2) / 2, width * 0.5 - offset, y2);
      } else {
        const x1 = width / 5 * (stage + 0.65);
        const x2 = width / 5 * (stage + 1.35);
        context.moveTo(x1, height * 0.5 + offset);
        context.bezierCurveTo((x1 + x2) / 2, height * 0.5 - offset * 0.3, (x1 + x2) / 2, height * 0.5 + offset * 0.3, x2, height * 0.5 - offset);
      }
      context.stroke();
    }
  }
  context.restore();
}

function drawField() {
  const { width, height } = sizeCanvas();
  context.clearRect(0, 0, width, height);
  drawConnectors(width, height);
  for (const point of state.points) {
    const position = pointPosition(point, width, height);
    point.x = position.x;
    point.y = position.y;
    const selected = state.selectedPoint?.id === point.id;
    context.beginPath();
    context.arc(point.x, point.y, selected ? 4 : point.stage >= 3 ? 1.25 : 0.82, 0, Math.PI * 2);
    context.fillStyle = selected ? '#fff6e8' : `${STAGES[point.stage].color}${point.stage >= 3 ? 'd8' : '9e'}`;
    context.fill();
  }
}

function reachedCounts(counts) {
  return counts.map((_, index) => counts.slice(index).reduce((sum, value) => sum + value, 0));
}

function renderScenario() {
  const scenario = SCENARIOS[state.scenario];
  const market = state.selectedMarket;
  const reached = reachedCounts(scenario.stageCounts);
  $('#scenario-code').textContent = scenario.code;
  $('#scenario-description').textContent = scenario.description;
  $('#forecast-scenario-label').textContent = scenario.label;
  $('#forecast-scenario-note').textContent = scenario.note;
  $('#selected-situation-source').textContent = sourceLabel(market);
  $('#selected-situation-title').textContent = market.shortTitle || market.title;
  $('#forecast-question').textContent = 'Within the next 24 model steps, how many of 5,000 modeled traders are expected to hold a filled contract?';
  $('#observed-probability').textContent = `${Math.round((market.probability || 0) * 100)}¢`;
  $('#observed-volume-label').textContent = market.volumeMetric === '24_hour_volume' ? '24H VOLUME' : 'CUM. VOLUME';
  $('#observed-volume').textContent = compactNumber(market.volume || market.volume24h || 0);
  $('#selected-situation-link').href = market.sourceUrl || '#';
  $('#simulated-book-probability').textContent = `${Math.round(scenario.book * 100)}¢`;
  $('#forecast-expected').textContent = scenario.expected.toLocaleString();
  $('#forecast-interval').textContent = `90% published interval ${scenario.interval[0].toLocaleString()}–${scenario.interval[1].toLocaleString()}`;
  $('#forecast-threshold-label').textContent = 'P(≥750 BY T+24)';
  $('#forecast-probability').textContent = `${Math.round(scenario.probability * 100)}%`;
  $('#forecast-delta').textContent = scenario.delta;
  $('#forecast-driver-list').innerHTML = scenario.drivers.map((driver, index) => `<li><b>${String(index + 1).padStart(2, '0')}</b>${escapeHtml(driver)}</li>`).join('');
  $('#causal-stage-grid').innerHTML = STAGES.map((stage, index) => {
    const prior = index === 0 ? 5000 : reached[index - 1];
    const conversion = index === 0 ? 100 : Math.round(reached[index] / Math.max(1, prior) * 100);
    return `<article class="causal-stage" style="--stage-color:${stage.color}">
      <span class="causal-stage-index">${String(index + 1).padStart(2, '0')}</span>
      <strong>${stage.label}</strong>
      <span class="causal-stage-count">${reached[index].toLocaleString()}</span>
      <span class="causal-stage-reached">${escapeHtml(stage.meaning)}</span>
      <span class="causal-stage-conversion">${conversion}% OF PRIOR STAGE</span>
      <i class="causal-stage-drop" style="width:${Math.max(4, conversion)}%;background:${stage.color}"></i>
    </article>`;
  }).join('');
  $$('.scenario-choice').forEach((button) => {
    const active = button.dataset.scenario === state.scenario;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });
  $('#metric-active').textContent = scenario.stageCounts.slice(1).reduce((sum, value) => sum + value, 0).toLocaleString();
  $('#metric-trades').textContent = reached[3].toLocaleString();
  $('#metric-volume').textContent = `$${compactNumber((market.volume || 0) * 0.000024)}`;
  $('#metric-cascade').textContent = scenario.stageCounts[2].toLocaleString();
  rebuildPoints();
}

function visibleMarkets() {
  const query = $('#market-search').value.trim().toLowerCase();
  return state.markets.filter((market) => {
    const sourceMatches = state.marketSource === 'all' || sourceKey(market).includes(state.marketSource);
    const text = `${market.title} ${market.category} ${sourceLabel(market)}`.toLowerCase();
    return sourceMatches && (!query || text.includes(query));
  });
}

function selectMarket(id) {
  state.selectedMarket = state.markets.find((market) => String(market.id) === String(id)) || state.markets[0];
  renderMarkets();
  renderScenario();
}

function renderMarkets() {
  const markets = visibleMarkets();
  const selected = state.selectedMarket;
  $('#visible-event-count').textContent = state.markets.length.toLocaleString();
  $('#market-results-count').textContent = `${markets.length} RESULTS`;
  $('#market-empty-state').hidden = Boolean(markets.length);
  $('#selected-market-meta').textContent = `${sourceLabel(selected)} · ${selected.category || 'MARKET'}`;
  $('#selected-market-title').textContent = selected.title;
  $('#selected-market-activity').textContent = `${Math.round((selected.probability || 0) * 100)}¢ · ${compactNumber(selected.volume || 0)} volume`;
  $('#selected-market-source').href = selected.sourceUrl || '#';
  $('#event-filters').innerHTML = markets.slice(0, 20).map((market, index) => {
    const active = String(market.id) === String(selected.id);
    return `<button class="event-filter${active ? ' is-active' : ''}" type="button" role="radio" aria-checked="${active}" data-event-filter="${escapeHtml(market.id)}">
      <span class="event-number">${sourceLabel(market).startsWith('K') ? 'K' : 'P'}${String(index + 1).padStart(2, '0')}</span>
      <span class="event-copy"><span class="event-meta">${sourceLabel(market)} · ${escapeHtml(market.category || 'Market')}</span><span class="event-name">${escapeHtml(market.title)}</span></span>
      <span class="event-stats"><strong class="event-price">${Math.round((market.probability || 0) * 100)}¢</strong><small>${compactNumber(market.volume || 0)}</small></span>
    </button>`;
  }).join('');
}

function showMarker(point) {
  if (!point) return;
  state.selectedPoint = point;
  const stage = STAGES[point.stage];
  const market = state.selectedMarket;
  $('#profile-empty').hidden = true;
  $('#profile-content').hidden = false;
  $('#profile-panel').classList.add('is-open');
  $('.lab-grid').classList.remove('profile-is-empty');
  $('#profile-index').textContent = `${String(point.id).padStart(4, '0')} / 5,000`;
  $('#profile-avatar').textContent = String(point.id).padStart(2, '0').slice(-2);
  $('#profile-cohort').textContent = stage.label;
  $('#profile-name').textContent = `Public marker ${point.id.toLocaleString()}`;
  $('#profile-context').textContent = 'Anonymous visual marker · aggregate projection only';
  $('#profile-tick').textContent = `T+${String(state.tick).padStart(3, '0')}`;
  $('#profile-action').textContent = stage.label;
  $('#profile-reason').textContent = `${stage.meaning}. Individual profile attributes and decision traces are withheld from the public build.`;
  $('#profile-belief').textContent = '—';
  $('#profile-market').textContent = `${Math.round((market.probability || 0) * 100)}¢`;
  $('#profile-confidence').textContent = '—';
  $('#profile-context-grid').innerHTML = `<div><dt>Public stage</dt><dd>${stage.label}</dd></div><div><dt>Projection</dt><dd>${SCENARIOS[state.scenario].label}</dd></div><div><dt>Identity</dt><dd>Not published</dd></div>`;
  $('#trait-bars').innerHTML = '<p class="trait-row">Research traits are evaluated outside the public browser artifact.</p>';
  $('#profile-event').textContent = sourceLabel(market);
  $('#profile-cash').textContent = 'WITHHELD';
  $('#profile-position').textContent = '—';
  $('#profile-entry').textContent = '—';
  $('#memory-list').innerHTML = '<li><time>PUBLIC</time><span>No individual memory or behavioral history is shipped.</span></li>';
  $('#profile-reflection').textContent = 'This panel explains the selected marker’s aggregate stage without exposing a modeled person record.';
  drawField();
}

function closeMarker() {
  state.selectedPoint = null;
  $('#profile-panel').classList.remove('is-open');
  $('.lab-grid').classList.add('profile-is-empty');
  drawField();
}

function nearestPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let nearest = null;
  let distance = 12 * 12;
  for (const point of state.points) {
    const candidate = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (candidate < distance) { distance = candidate; nearest = point; }
  }
  return nearest;
}

function setMode(mode) {
  state.mode = mode;
  field.classList.toggle('is-flow-mode', mode === 'field');
  $('#field-mode-label').textContent = mode === 'field' ? 'ATTENTION GRAPH' : mode === 'cascade' ? 'FULL ATTENTION NETWORK' : 'MARKET SIGNAL FIELD';
  $$('[data-scene-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.sceneMode === mode));
  $('#mobile-controls-toggle').setAttribute('aria-expanded', 'false');
  $('.control-rail').classList.remove('is-open');
  requestAnimationFrame(drawField);
}

function updateTimeline() {
  const progress = state.tick % 120 / 120;
  const phases = ['EXPOSURE', 'ATTENTION', 'COMMITMENT', 'REFLECTION'];
  $('#tick-label').textContent = `T+${String(state.tick).padStart(3, '0')}`;
  $('#phase-label').textContent = phases[Math.min(3, Math.floor(progress * 4))];
  $('#timeline-progress').style.width = `${progress * 100}%`;
  $('#timeline-marker').style.left = `${progress * 100}%`;
  if (state.selectedPoint) $('#profile-tick').textContent = `T+${String(state.tick).padStart(3, '0')}`;
}

function animate(time) {
  if (state.playing && time - state.lastStep > 500 / state.speed) {
    state.tick = (state.tick + 1) % 120;
    state.lastStep = time;
    updateTimeline();
    drawField();
  }
  requestAnimationFrame(animate);
}

function wireControls() {
  $('#scenario-control').addEventListener('click', (event) => {
    const choice = event.target.closest('[data-scenario]');
    if (!choice) return;
    state.scenario = choice.dataset.scenario;
    renderScenario();
  });
  $$('[data-scene-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.sceneMode)));
  $('#market-search').addEventListener('input', renderMarkets);
  $('#market-source-filter').addEventListener('click', (event) => {
    const button = event.target.closest('[data-market-source]');
    if (!button) return;
    state.marketSource = button.dataset.marketSource;
    $$('[data-market-source]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderMarkets();
  });
  $('#event-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-event-filter]');
    if (button) selectMarket(button.dataset.eventFilter);
  });
  $('#agent-search').addEventListener('input', (event) => {
    const id = Number(event.target.value.replace(/\D/g, ''));
    const results = $('#search-results');
    if (!id || id > 5000) { results.hidden = true; return; }
    results.innerHTML = `<button type="button" role="option" data-marker="${id}"><strong>Marker ${id.toLocaleString()}</strong><small>${STAGES[state.points[id - 1]?.stage || 0].label} · PUBLIC AGGREGATE</small></button>`;
    results.hidden = false;
  });
  $('#search-results').addEventListener('click', (event) => {
    const button = event.target.closest('[data-marker]');
    if (button) { showMarker(state.points[Number(button.dataset.marker) - 1]); $('#search-results').hidden = true; }
  });
  canvas.addEventListener('click', (event) => showMarker(nearestPoint(event)));
  canvas.addEventListener('mousemove', (event) => {
    const point = nearestPoint(event);
    const hover = $('#hover-card');
    if (!point) { hover.hidden = true; return; }
    hover.innerHTML = `<strong>MARKER ${point.id.toLocaleString()}</strong><span>${STAGES[point.stage].label} · PUBLIC STAGE</span>`;
    hover.style.left = `${event.clientX - field.getBoundingClientRect().left + 12}px`;
    hover.style.top = `${event.clientY - field.getBoundingClientRect().top + 12}px`;
    hover.hidden = false;
  });
  canvas.addEventListener('mouseleave', () => { $('#hover-card').hidden = true; });
  $('#select-random').addEventListener('click', () => showMarker(state.points[Math.floor(seeded(state.tick + 91) * state.points.length)]));
  $('#mobile-open-profile').addEventListener('click', () => showMarker(state.points[Math.floor(seeded(state.tick + 31) * state.points.length)]));
  $('#close-profile').addEventListener('click', closeMarker);
  $('#play-toggle').textContent = 'PLAY';
  $('#play-toggle').setAttribute('aria-label', 'Play public projection animation');
  $('#play-toggle').addEventListener('click', () => {
    state.playing = !state.playing;
    $('#play-toggle').textContent = state.playing ? 'PAUSE' : 'PLAY';
  });
  $('#step-once').addEventListener('click', () => { state.tick = (state.tick + 1) % 120; updateTimeline(); drawField(); });
  $('#reset-run').addEventListener('click', () => { state.tick = 0; state.playing = false; $('#play-toggle').textContent = 'PLAY'; updateTimeline(); drawField(); });
  $('#speed-control').addEventListener('change', (event) => { state.speed = Number(event.target.value) || 1; });
  $('#mobile-controls-toggle').addEventListener('click', () => {
    const rail = $('.control-rail');
    const open = !rail.classList.contains('is-open');
    rail.classList.toggle('is-open', open);
    $('#mobile-controls-toggle').setAttribute('aria-expanded', String(open));
  });
  $$('.info-trigger').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const tooltip = $('#research-tooltip');
    const rect = button.getBoundingClientRect();
    tooltip.textContent = INFO[button.dataset.info] || 'Published Research preview definition.';
    tooltip.style.left = `${Math.min(innerWidth - 260, Math.max(12, rect.left))}px`;
    tooltip.style.top = `${Math.min(innerHeight - 130, rect.bottom + 8)}px`;
    tooltip.hidden = false;
  }));
  document.addEventListener('click', (event) => { if (!event.target.closest('.info-trigger')) $('#research-tooltip').hidden = true; });
  $('#source-status').addEventListener('click', () => {
    $('#source-dialog-content').innerHTML = `<article class="source-card"><header><strong>PUBLIC MARKET SNAPSHOT</strong><span>OBSERVED</span></header><p>Dated public market observations retain their original source links and measurement boundary.</p></article><article class="source-card"><header><strong>AGGREGATE MODEL OUTPUT</strong><span>PUBLISHED</span></header><p>The browser receives reviewed scenario summaries and anonymous field markers—not the full population, memories, or research formulas.</p></article><article class="source-card"><header><strong>OUTCOME</strong><span>PENDING</span></header><p>Forecasts remain unvalidated until compared with a resolved real-world outcome.</p></article>`;
    $('#source-dialog').showModal();
  });
  $('#close-source-dialog').addEventListener('click', () => $('#source-dialog').close());
  new ResizeObserver(drawField).observe(mount);
}

async function loadMarkets() {
  try {
    const response = await fetch('./data/real-market-snapshot.json');
    if (!response.ok) throw new Error('snapshot unavailable');
    const payload = await response.json();
    const markets = Array.isArray(payload) ? payload : payload.events;
    if (Array.isArray(markets) && markets.length) {
      state.markets = markets;
      state.selectedMarket = markets[0];
    }
  } catch {
    state.markets = [FALLBACK_MARKET];
    state.selectedMarket = FALLBACK_MARKET;
  }
  $('#source-status').textContent = 'PMXT · PUBLIC SNAPSHOT';
  $('#field-source-line').textContent = `PMXT-COMPATIBLE SNAPSHOT · ${state.markets.length} MARKETS · 5,000 ANONYMOUS MARKERS`;
  $('#simulation-slate-count').textContent = `${Math.min(8, state.markets.length)} PUBLISHED`;
  renderMarkets();
  renderScenario();
  $('#loading-state').hidden = true;
}

wireControls();
updateTimeline();
renderScenario();
loadMarkets();
requestAnimationFrame(animate);
