// Public-only presenter: authored scenario fixtures and anonymous visual markers.
// This file contains no participant profiles, ingestion credentials, LLM calls,
// fitted behavioral parameters, or authoritative forecast engine.
const COUNT = 5000;
const END = 72;
const STAGES = ['Reachable', 'Attending', 'Propagating', 'Returning', 'Committing'];
const SOURCES = ['X', 'Reddit', 'Instagram', 'YouTube', 'Forums', 'Search'];
const COHORTS = ['Topic specialist', 'Casual observer', 'Community bridge', 'Returning follower', 'New arrival'];
const TOPICS = {
  'open-agents': {
    label: 'open agent protocols', type: 'EMERGING', prevalence: '0.18', velocity: '+0.42σ', diversity: '5 / 6',
    headline: 'Forums and technical video carry the first bridge.',
    copy: 'A specialist-led example: discussion travels through community bridges before a smaller returning audience forms.',
    examples: {
      baseline: { metrics: [66.4, 13.6, 6.2, .57], shares: [23, 24, 5, 21, 19, 8], stages: [1680, 1330, 1000, 680, 310] },
      'diverse-ranking': { metrics: [70.2, 15.4, 6.8, .45], shares: [20, 21, 10, 21, 17, 11], stages: [1490, 1320, 1080, 770, 340] },
      'bridge-boost': { metrics: [75.6, 16.2, 7.4, .49], shares: [27, 23, 8, 22, 13, 7], stages: [1220, 1410, 1190, 810, 370] }
    }
  },
  'creator-release': {
    label: 'an independent creator release', type: 'RECURRING', prevalence: '0.31', velocity: '+0.16σ', diversity: '4 / 6',
    headline: 'A returning audience moves from video to participation.',
    copy: 'A loyalty-led example: video and visual feeds carry discovery; existing followers account for more of the return and commitment stages.',
    examples: {
      baseline: { metrics: [61.8, 22.4, 11.6, .68], shares: [12, 9, 33, 34, 5, 7], stages: [1910, 820, 570, 1120, 580] },
      'diverse-ranking': { metrics: [67.4, 23.2, 12.2, .52], shares: [16, 13, 28, 28, 7, 8], stages: [1630, 980, 620, 1160, 610] },
      'bridge-boost': { metrics: [72.2, 21.8, 10.8, .59], shares: [19, 12, 29, 28, 6, 6], stages: [1390, 1200, 780, 1090, 540] }
    }
  },
  'battery-claim': {
    label: 'a new battery claim', type: 'CONTESTED', prevalence: '0.09', velocity: '+1.26σ', diversity: '6 / 6',
    headline: 'Fast circulation does not imply durable attention.',
    copy: 'A contested-signal example: reposting outpaces return. A burst in discussion is not evidence of belief, endorsement, or purchase.',
    examples: {
      baseline: { metrics: [79.2, 8.4, 2.6, .73], shares: [42, 24, 9, 12, 7, 6], stages: [1040, 1350, 2060, 420, 130] },
      'diverse-ranking': { metrics: [74.8, 11.2, 3.4, .51], shares: [28, 25, 11, 17, 10, 9], stages: [1260, 1270, 1740, 560, 170] },
      'bridge-boost': { metrics: [85.4, 9.2, 2.8, .66], shares: [36, 27, 12, 13, 7, 5], stages: [730, 1410, 2260, 460, 140] }
    }
  }
};
const SCENARIOS = {
  baseline: { label: 'BASELINE', code: 'A / BASE', text: 'Reference fixture. Every number is an authored example, not a measured outcome.' },
  'diverse-ranking': { label: 'DIVERSE RANKING', code: 'B1 / MIX', text: 'Paired example: broader source exposure. Topic and audience size are held fixed; the displayed difference is assumed, not causal evidence.' },
  'bridge-boost': { label: 'BRIDGE BOOST', code: 'B2 / BRIDGE', text: 'Paired example: greater exposure through community bridges. Displayed differences are assumed, not observed treatment effects.' }
};

const $ = (id) => document.getElementById(id);
const canvas = $('attention-canvas');
const ctx = canvas.getContext('2d');
const chart = $('trajectory-canvas');
const chartCtx = chart.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = { topic: 'open-agents', scenario: 'baseline', hour: 0, playing: !reducedMotion.matches, speed: 1, selected: null, width: 0, height: 0 };
let lastTime = null;
let frame = null;
let lastAnnouncedHour = -1;
let chartSize = { width: 0, height: 0 };
let chartPaths = [];

// Stable scatter only, not a behavioral or identity model.
function unit(index, salt) {
  let value = Math.imul(index + 1, 1597334677) ^ Math.imul(salt + 1, 3812015801);
  value = Math.imul(value ^ (value >>> 16), 2246822507);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
}
const markers = Array.from({ length: COUNT }, (_, index) => ({
  index, jitter: unit(index, 1), depth: unit(index, 2), phase: unit(index, 3) * Math.PI * 2,
  entry: Math.floor(unit(index, 4) * 6), cohort: Math.floor(unit(index, 5) * 5), x: 0, y: 0, stage: 0
}));
const example = () => TOPICS[state.topic].examples[state.scenario];
const progress = () => state.hour / END;

function stagePositionAt(marker, hour, fixture) {
  const counts = fixture.stages;
  let destination = 0;
  let cumulative = counts[0];
  while (marker.index >= cumulative && destination < 4) cumulative += counts[++destination];
  const journey = Math.min(1, Math.max(0, hour / END * 1.35 - marker.jitter * .35));
  const eased = journey * journey * (3 - 2 * journey);
  return destination * eased;
}

function placeMarker(marker) {
  const stagePosition = stagePositionAt(marker, state.hour, example());
  const usableWidth = Math.max(1, state.width - 40);
  const bandWidth = usableWidth / 5;
  marker.stage = Math.round(stagePosition);
  marker.x = 20 + bandWidth * (.5 + stagePosition) + (marker.jitter - .5) * bandWidth * .73;
  const wave = Math.sin(stagePosition * 2.3 + marker.phase + state.hour * .06);
  const spread = Math.max(60, state.height - 260);
  marker.y = 90 + marker.depth * spread + wave * (8 + marker.jitter * 15);
}

function drawField() {
  if (!ctx || !state.width) return;
  ctx.clearRect(0, 0, state.width, state.height);
  const band = (state.width - 40) / 5;
  // Sparse illustrative paths provide context without implying observed edges.
  ctx.strokeStyle = 'rgba(233,189,134,.065)';
  ctx.lineWidth = .7;
  for (let row = 0; row < 14; row++) {
    const y = 125 + row * Math.max(10, state.height - 285) / 14;
    ctx.beginPath(); ctx.moveTo(20 + band * .5, y);
    for (let stage = 1; stage < 5; stage++) {
      const x = 20 + band * (.5 + stage);
      ctx.bezierCurveTo(x - band * .65, y + Math.sin(row + stage) * 65, x - band * .4, y - Math.cos(row) * 45, x, y + Math.sin(row) * 15);
    }
    ctx.stroke();
  }
  const colors = ['rgba(151,124,94,.30)', 'rgba(233,189,134,.67)', 'rgba(240,200,151,.74)', 'rgba(248,224,191,.8)', 'rgba(255,246,227,.95)'];
  for (const marker of markers) placeMarker(marker);
  for (let stage = 0; stage < 5; stage++) {
    ctx.beginPath();
    for (const marker of markers) {
      if (marker.stage !== stage) continue;
      const radius = marker.cohort === 2 ? 1.25 : .7;
      ctx.moveTo(marker.x + radius, marker.y);
      ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = colors[stage]; ctx.fill();
  }
  if (state.selected !== null) {
    const marker = markers[state.selected];
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff6e3'; ctx.lineWidth = 1; ctx.stroke();
    if ($('marker-stage').textContent !== STAGES[marker.stage]) $('marker-stage').textContent = STAGES[marker.stage];
  }
  canvas.dataset.modelHour = String(Math.floor(state.hour));
  canvas.dataset.motion = state.playing ? 'running' : 'paused';
}

function drawChart() {
  if (!chartCtx || !chartSize.width) return;
  const { width, height } = chartSize;
  chartCtx.clearRect(0, 0, width, height);
  chartCtx.strokeStyle = 'rgba(255,255,255,.07)';
  chartCtx.lineWidth = 1;
  for (let row = 1; row < 4; row++) { chartCtx.beginPath(); chartCtx.moveTo(0, row * height / 4); chartCtx.lineTo(width, row * height / 4); chartCtx.stroke(); }
  for (const [position, values] of chartPaths.entries()) {
    chartCtx.beginPath();
    for (let step = 0; step <= 72; step++) {
      const t = step / 72;
      const value = values[step];
      const x = 2 + t * (width - 4), y = height - 5 - value * (height - 10);
      if (!step) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
    }
    chartCtx.strokeStyle = position ? '#e9bd86' : '#817564';
    chartCtx.setLineDash(position ? [] : [3, 4]); chartCtx.lineWidth = 1.5; chartCtx.stroke();
  }
  chartCtx.setLineDash([]);
  chartCtx.beginPath(); chartCtx.moveTo(progress() * chartSize.width, 0); chartCtx.lineTo(progress() * chartSize.width, height);
  chartCtx.strokeStyle = 'rgba(245,243,238,.4)'; chartCtx.lineWidth = 1; chartCtx.stroke();
}

function updateTime(announce = false) {
  const clockText = `${String(Math.floor(state.hour)).padStart(2, '0')} / 72`;
  if ($('flow-hour').textContent !== clockText) $('flow-hour').textContent = clockText;
  $('flow-progress').style.width = `${progress() * 100}%`;
  const hour = Math.floor(state.hour / 24) * 24;
  if (announce || hour !== lastAnnouncedHour) {
    const counts = [0, 0, 0, 0, 0];
    for (const marker of markers) counts[marker.stage]++;
    $('flow-summary').textContent = `Illustrative ${SCENARIOS[state.scenario].label.toLowerCase()} example at model hour ${Math.floor(state.hour)}. ${counts.map((count, i) => `${count} ${STAGES[i].toLowerCase()}`).join(', ')}. Not an observed human outcome.`;
    lastAnnouncedHour = hour;
  }
}

function paint() { drawField(); drawChart(); updateTime(); }
function tick(time) {
  frame = null;
  if (!state.playing || document.hidden) { lastTime = null; return; }
  if (lastTime !== null) state.hour = Math.min(END, state.hour + Math.min((time - lastTime) / 1000, .1) * state.speed * 2.4);
  lastTime = time;
  paint();
  if (state.hour >= END) setPlaying(false);
  else frame = requestAnimationFrame(tick);
}
function setPlaying(playing) {
  state.playing = playing;
  $('flow-play').setAttribute('aria-pressed', String(playing));
  $('flow-play').querySelector('b').textContent = playing ? 'PAUSE' : 'PLAY';
  $('flow-play').querySelector('span').textContent = playing ? 'II' : '▶';
  lastTime = null;
  if (frame !== null) cancelAnimationFrame(frame);
  frame = playing && !document.hidden ? requestAnimationFrame(tick) : null;
  canvas.dataset.motion = playing ? 'running' : 'paused';
}

function updateReadout() {
  const topic = TOPICS[state.topic], fixture = example(), baseline = topic.examples.baseline;
  // Compute the chart from the same marker-stage mapping, once per selection.
  chartPaths = [baseline, fixture].map((record) => Array.from({ length: END + 1 }, (_, hour) => {
    let noticed = 0;
    for (const marker of markers) if (Math.round(stagePositionAt(marker, hour, record)) > 0) noticed++;
    return noticed / COUNT;
  }));
  $('topic-class').textContent = topic.type;
  $('flow-question').textContent = `How might attention for ${topic.label} distribute across platforms and persist over 72 model hours?`;
  $('baseline-prevalence').textContent = topic.prevalence;
  $('baseline-velocity').textContent = topic.velocity;
  $('baseline-diversity').textContent = topic.diversity;
  $('scenario-code').textContent = SCENARIOS[state.scenario].code;
  $('scenario-explainer').textContent = SCENARIOS[state.scenario].text;
  $('readout-scenario').textContent = SCENARIOS[state.scenario].label;
  $('readout-headline').textContent = topic.headline;
  $('readout-copy').textContent = topic.copy;
  ['notice', 'return', 'commit', 'concentration'].forEach((key, index) => {
    const hhi = (record) => record.shares.reduce((sum, share) => sum + (share / 100) ** 2, 0);
    const value = index === 3 ? hhi(fixture) : fixture.metrics[index];
    const delta = value - (index === 3 ? hhi(baseline) : baseline.metrics[index]);
    $('metric-' + key).textContent = index === 3 ? value.toFixed(3) : value.toFixed(1) + '%';
    $('delta-' + key).textContent = state.scenario === 'baseline' ? '72h fixed example' : `${delta >= 0 ? '+' : ''}${delta.toFixed(index === 3 ? 3 : 1)}${index === 3 ? '' : ' pp'} vs example A`;
  });
  SOURCES.forEach((source, index) => {
    $('share-' + index).textContent = fixture.shares[index] + '%';
    $('share-bar-' + index).style.width = fixture.shares[index] + '%';
  });
  chart.setAttribute('aria-label', `Illustrative notice-share path for ${topic.label}, ending at ${fixture.metrics[0]} percent after 72 model hours. Dashed line: baseline; solid line: selected example. Not fitted to observed data.`);
  canvas.setAttribute('aria-label', `5,000 anonymous visual markers for ${topic.label}. ${SCENARIOS[state.scenario].label.toLowerCase()} example, not a forecast. Press Enter to inspect a marker; arrow keys to select another.`);
  canvas.dataset.topic = state.topic;
  canvas.dataset.scenario = state.scenario;
}

function inspect(index) {
  state.selected = index;
  const marker = markers[index];
  $('marker-inspector').hidden = false;
  $('marker-id').textContent = `M-${String(index + 1).padStart(4, '0')}`;
  $('marker-cohort').textContent = COHORTS[marker.cohort];
  $('marker-source').textContent = SOURCES[marker.entry];
  $('marker-stage').textContent = STAGES[marker.stage];
  drawField();
}
function closeInspector() { state.selected = null; $('marker-inspector').hidden = true; drawField(); }

for (const [id, key] of [['topic-choices', 'topic'], ['scenario-choices', 'scenario']]) {
  const buttons = [...$(id).querySelectorAll('button')];
  function choose(button) {
    state[key] = button.dataset[key];
    for (const candidate of buttons) {
      const selected = candidate === button;
      candidate.classList.toggle('is-active', selected);
      candidate.setAttribute('aria-checked', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }
    state.hour = 0; lastTime = null; closeInspector(); updateReadout(); paint(); updateTime(true);
  }
  buttons.forEach((button, index) => {
    button.tabIndex = button.getAttribute('aria-checked') === 'true' ? 0 : -1;
    button.addEventListener('click', () => choose(button));
    button.addEventListener('keydown', (event) => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % buttons.length;
      else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault(); buttons[next].focus(); choose(buttons[next]);
    });
  });
}
$('flow-play').addEventListener('click', () => { if (state.hour >= END) state.hour = 0; setPlaying(!state.playing); paint(); });
$('flow-step').addEventListener('click', () => { setPlaying(false); state.hour = Math.min(END, Math.floor(state.hour / 6) * 6 + 6); paint(); updateTime(true); });
$('flow-reset').addEventListener('click', () => { state.hour = 0; closeInspector(); setPlaying(!reducedMotion.matches); paint(); updateTime(true); });
$('flow-speed').addEventListener('change', (event) => { state.speed = Number(event.target.value); });
$('close-marker').addEventListener('click', () => { closeInspector(); canvas.focus(); });
canvas.addEventListener('click', (event) => {
  const bounds = canvas.getBoundingClientRect();
  const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
  let nearest = null, distance = 24 * 24;
  for (const marker of markers) {
    const candidate = (marker.x - x) ** 2 + (marker.y - y) ** 2;
    if (candidate < distance) { distance = candidate; nearest = marker.index; }
  }
  if (nearest !== null) inspect(nearest); else closeInspector();
});
canvas.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeInspector(); return; }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(state.selected ?? 0); }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); inspect(((state.selected ?? 0) + (event.key === 'ArrowRight' ? 1 : COUNT - 1)) % COUNT); }
});
document.addEventListener('visibilitychange', () => { lastTime = null; if (frame !== null) cancelAnimationFrame(frame); frame = state.playing && !document.hidden ? requestAnimationFrame(tick) : null; });
reducedMotion.addEventListener('change', (event) => { if (event.matches) setPlaying(false); });

function resizeCanvas(element, context) {
  const bounds = element.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  element.width = Math.round(bounds.width * ratio); element.height = Math.round(bounds.height * ratio);
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: bounds.width, height: bounds.height };
}
const observer = new ResizeObserver(() => {
  const size = resizeCanvas(canvas, ctx); state.width = size.width; state.height = size.height;
  chartSize = resizeCanvas(chart, chartCtx); paint();
});
observer.observe(canvas.parentElement);
observer.observe(chart.parentElement);
if (!ctx || !chartCtx) {
  $('flow-summary').classList.remove('sr-only');
  $('flow-summary').textContent = 'Canvas is unavailable. The authored 72-hour aggregate examples remain available in the readout.';
  setPlaying(false);
} else { updateReadout(); setPlaying(state.playing); }
