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

const CAMERA_LIMITS = Object.freeze({ min: 0.52, max: 4.5, pitchMin: -1.08, pitchMax: 1.08 });
const DEFAULT_CAMERA = Object.freeze({ scale: 1, x: 0, y: 0, yaw: -0.34, pitch: 0.18, targetX: 0, targetY: 0, targetZ: 0 });
const WORLD = Object.freeze({ stageGap: 248, radiusY: 206, radiusZ: 178, depth: 1480 });
const REPLAY_END = 24;
const state = {
  scenario: 'baseline', mode: 'field', marketSource: 'all', markets: [FALLBACK_MARKET],
  selectedMarket: FALLBACK_MARKET, points: [], selectedPoint: null, hoveredPoint: null,
  focusedStage: null, tick: 1, playing: true, speed: 1, lastStep: 0, motionTime: 0, loopCount: 0,
  camera: { ...DEFAULT_CAMERA }, stageTransitionStart: 0, stageTransitionDuration: 720,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const field = $('#attention-field');
const mount = $('#scene-mount');
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Interactive three-dimensional anonymous attention field');
canvas.setAttribute('role', 'application');
canvas.setAttribute('aria-description', 'Drag to orbit the spatial field. Shift-drag to pan. Scroll or pinch to dolly. Click a marker to inspect its public stage. Use plus, minus, zero, or arrow keys for camera control.');
canvas.tabIndex = 0;
mount.append(canvas);
const context = canvas.getContext('2d', { alpha: true });
const gesture = { pointers: new Map(), drag: null, pinch: null, moved: false };

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeInOut(value) {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
    previousStage: null,
    a: seeded(index * 3 + 1),
    b: seeded(index * 3 + 2),
    c: seeded(index * 3 + 3),
    x: 0, y: 0, z: 0,
    screenX: 0, screenY: 0, screenScale: 1, cameraDepth: 0,
    renderStage: 0,
  }));
  drawField();
}

function transitionPointsToScenario() {
  if (!state.points.length) {
    rebuildPoints();
    return;
  }
  for (let index = 0; index < state.points.length; index += 1) {
    const point = state.points[index];
    point.previousStage = point.stage;
    point.stage = stageForIndex(index);
  }
  state.tick = 1;
  state.playing = true;
  state.motionTime = 0;
  state.lastStep = 0;
  state.stageTransitionStart = state.reducedMotion ? 0 : performance.now();
  updatePlaybackButton();
  updateTimeline();
  drawField();
}

function sizeCanvas() {
  const rect = mount.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

function targetStage(point, time) {
  if (!state.stageTransitionStart || point.previousStage === null) return point.stage;
  const progress = (time - state.stageTransitionStart) / state.stageTransitionDuration;
  if (progress >= 1) return point.stage;
  return point.previousStage + (point.stage - point.previousStage) * easeInOut(progress);
}

function visibleStage(point, time) {
  const destination = targetStage(point, time);
  if (state.tick >= REPLAY_END) return destination;
  const progress = clamp(state.tick / REPLAY_END, 0, 1);
  const stagger = point.c * 0.05;
  const journey = clamp((progress - stagger) / (1 - stagger), 0, 1);
  return destination * journey;
}

function isVerticalField(width, height) {
  return width < 560 || width / Math.max(1, height) < 0.72;
}

function stageWorldCenter(stage, vertical) {
  const axis = (stage - (STAGES.length - 1) / 2) * WORLD.stageGap;
  return vertical ? { x: 0, y: axis, z: 0 } : { x: axis, y: 0, z: 0 };
}

function pointWorldPosition(point, width, height, time) {
  const vertical = isVerticalField(width, height);
  const stage = visibleStage(point, time);
  const radial = Math.sqrt(point.a);
  const motion = state.motionTime * (0.00012 + point.c * 0.00007);
  const angle = point.b * Math.PI * 2 + (point.c - 0.5) * 0.3 + motion;
  const axial = (point.c - 0.5) * 82;
  const drift = Math.sin(state.motionTime * 0.0011 + point.c * Math.PI * 2) * 7;
  const center = stageWorldCenter(stage, vertical);
  if (vertical) {
    return {
      x: Math.cos(angle) * radial * WORLD.radiusZ,
      y: center.y + axial + drift,
      z: Math.sin(angle) * radial * WORLD.radiusZ * 0.92 + (point.a - 0.5) * 34,
      stage,
    };
  }
  return {
    x: center.x + axial + drift,
    y: Math.cos(angle) * radial * WORLD.radiusY,
    z: Math.sin(angle) * radial * WORLD.radiusZ + (point.a - 0.5) * 34,
    stage,
  };
}

function baseProjectionScale(width, height, vertical) {
  if (vertical) return Math.min((width - 34) / 430, (height - 82) / 1260);
  return Math.min((width - 54) / 1240, (height - 92) / 590);
}

function projectWorld(world, width, height) {
  const vertical = isVerticalField(width, height);
  const camera = state.camera;
  const dx = world.x - camera.targetX;
  const dy = world.y - camera.targetY;
  const dz = world.z - camera.targetZ;
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const yawX = cosYaw * dx - sinYaw * dz;
  const yawZ = sinYaw * dx + cosYaw * dz;
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  const viewY = cosPitch * dy - sinPitch * yawZ;
  const depth = sinPitch * dy + cosPitch * yawZ;
  const perspective = clamp(WORLD.depth / (WORLD.depth + depth), 0.42, 2.35);
  const scale = baseProjectionScale(width, height, vertical) * camera.scale * perspective;
  return {
    x: width * 0.5 + camera.x + yawX * scale,
    y: height * 0.5 + camera.y + viewY * scale,
    depth,
    scale,
    perspective,
    visible: WORLD.depth + depth > 90,
  };
}

function strokeWorldPath(worldPoints, width, height, { color = 'rgba(233, 189, 134, .16)', lineWidth = 0.8, close = false } = {}) {
  const projected = worldPoints.map((point) => projectWorld(point, width, height)).filter((point) => point.visible);
  if (projected.length < 2) return;
  context.beginPath();
  context.moveTo(projected[0].x, projected[0].y);
  for (let index = 1; index < projected.length; index += 1) context.lineTo(projected[index].x, projected[index].y);
  if (close) context.closePath();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
}

function stageRing(stage, radius, vertical, segments = 42) {
  const center = stageWorldCenter(stage, vertical);
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = index / segments * Math.PI * 2;
    if (vertical) return { x: Math.cos(angle) * radius, y: center.y, z: Math.sin(angle) * radius * 0.92 };
    return { x: center.x, y: Math.cos(angle) * radius, z: Math.sin(angle) * radius * 0.86 };
  });
}

function drawSpatialGrid(width, height) {
  const vertical = isVerticalField(width, height);
  context.save();
  const lineColor = 'rgba(233, 189, 134, .075)';
  if (vertical) {
    for (let y = -WORLD.stageGap * 2.6; y <= WORLD.stageGap * 2.6; y += WORLD.stageGap / 2) {
      strokeWorldPath([{ x: -230, y, z: 215 }, { x: 230, y, z: 215 }], width, height, { color: lineColor, lineWidth: 0.65 });
    }
    for (let x = -220; x <= 220; x += 55) {
      strokeWorldPath([{ x, y: -WORLD.stageGap * 2.65, z: 215 }, { x, y: WORLD.stageGap * 2.65, z: 215 }], width, height, { color: lineColor, lineWidth: 0.65 });
    }
  } else {
    for (let x = -WORLD.stageGap * 2.65; x <= WORLD.stageGap * 2.65; x += WORLD.stageGap / 2) {
      strokeWorldPath([{ x, y: 235, z: -265 }, { x, y: 235, z: 265 }], width, height, { color: lineColor, lineWidth: 0.65 });
    }
    for (let z = -240; z <= 240; z += 60) {
      strokeWorldPath([{ x: -WORLD.stageGap * 2.65, y: 235, z }, { x: WORLD.stageGap * 2.65, y: 235, z }], width, height, { color: lineColor, lineWidth: 0.65 });
    }
  }
  context.restore();
}

function drawStageVolumes(width, height) {
  const vertical = isVerticalField(width, height);
  context.save();
  for (let stage = 0; stage < STAGES.length; stage += 1) {
    const focused = state.focusedStage === stage;
    const dimmed = state.focusedStage !== null && !focused;
    for (const ratio of [0.43, 0.72, 1]) {
      strokeWorldPath(stageRing(stage, WORLD.radiusZ * ratio, vertical), width, height, {
        color: focused ? `rgba(233, 189, 134, ${0.18 + ratio * 0.18})` : `rgba(233, 189, 134, ${dimmed ? 0.035 : 0.065 + ratio * 0.045})`,
        lineWidth: focused && ratio === 1 ? 1.35 : 0.72,
        close: true,
      });
    }
  }
  const centers = STAGES.map((_, index) => stageWorldCenter(index, vertical));
  strokeWorldPath(centers, width, height, { color: 'rgba(233, 189, 134, .24)', lineWidth: 1 });
  context.restore();
}

function drawConnectors(width, height) {
  const vertical = isVerticalField(width, height);
  context.save();
  context.setLineDash([1.5, 7]);
  context.lineDashOffset = -state.motionTime * 0.012;
  for (let stage = 0; stage < STAGES.length - 1; stage += 1) {
    const startCenter = stageWorldCenter(stage, vertical);
    const endCenter = stageWorldCenter(stage + 1, vertical);
    for (let index = 0; index < 18; index += 1) {
      const startAngle = seeded(stage * 211 + index * 7) * Math.PI * 2;
      const endAngle = seeded(stage * 337 + index * 11 + 19) * Math.PI * 2;
      const radius = 54 + seeded(stage * 43 + index) * 118;
      const points = [];
      for (let step = 0; step <= 10; step += 1) {
        const t = step / 10;
        const lift = Math.sin(t * Math.PI) * (46 + index * 1.7);
        if (vertical) {
          points.push({
            x: Math.cos(startAngle) * radius * (1 - t) + Math.cos(endAngle) * radius * t,
            y: startCenter.y * (1 - t) + endCenter.y * t,
            z: Math.sin(startAngle) * radius * (1 - t) + Math.sin(endAngle) * radius * t - lift,
          });
        } else {
          points.push({
            x: startCenter.x * (1 - t) + endCenter.x * t,
            y: Math.cos(startAngle) * radius * (1 - t) + Math.cos(endAngle) * radius * t - lift * 0.28,
            z: Math.sin(startAngle) * radius * (1 - t) + Math.sin(endAngle) * radius * t - lift,
          });
        }
      }
      strokeWorldPath(points, width, height, { color: 'rgba(233, 189, 134, .105)', lineWidth: 0.72 });
    }
  }
  if (state.playing) {
    const stageProgress = clamp(state.tick / REPLAY_END * (STAGES.length - 1), 0, STAGES.length - 1);
    const pulse = projectWorld(stageWorldCenter(stageProgress, vertical), width, height);
    if (pulse.visible) {
      context.beginPath();
      context.arc(pulse.x, pulse.y, 3.2, 0, Math.PI * 2);
      context.fillStyle = '#e9bd86';
      context.shadowColor = '#e9bd86';
      context.shadowBlur = 12;
      context.fill();
    }
  }
  context.setLineDash([]);
  context.restore();
}

function drawSpatialStageLabels(width, height) {
  const vertical = isVerticalField(width, height);
  context.save();
  context.font = '8px "DM Mono", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let stage = 0; stage < STAGES.length; stage += 1) {
    const center = stageWorldCenter(stage, vertical);
    const anchor = projectWorld(vertical ? { ...center, x: -WORLD.radiusZ - 34 } : { ...center, y: -WORLD.radiusY - 24 }, width, height);
    if (!anchor.visible || anchor.x < -90 || anchor.x > width + 90 || anchor.y < -30 || anchor.y > height + 30) continue;
    const label = `${String(stage + 1).padStart(2, '0')}  ${STAGES[stage].label}`;
    const labelWidth = context.measureText(label).width + 12;
    context.fillStyle = 'rgba(8, 8, 10, .78)';
    context.fillRect(anchor.x - labelWidth / 2, anchor.y - 9, labelWidth, 18);
    context.fillStyle = state.focusedStage === stage ? '#fff6e8' : '#d7cdbd';
    context.fillText(label, anchor.x, anchor.y);
  }
  context.restore();
}

function drawField(time = performance.now()) {
  const { width, height } = sizeCanvas();
  context.clearRect(0, 0, width, height);
  drawSpatialGrid(width, height);
  drawStageVolumes(width, height);
  drawConnectors(width, height);
  const projectedPoints = [];
  for (const point of state.points) {
    const world = pointWorldPosition(point, width, height, time);
    const projected = projectWorld(world, width, height);
    point.x = world.x; point.y = world.y; point.z = world.z;
    point.screenX = projected.x; point.screenY = projected.y;
    point.screenScale = projected.scale; point.cameraDepth = projected.depth;
    point.renderStage = world.stage;
    if (projected.visible && projected.x > -20 && projected.x < width + 20 && projected.y > -20 && projected.y < height + 20) projectedPoints.push(point);
  }
  projectedPoints.sort((first, second) => second.cameraDepth - first.cameraDepth);
  context.save();
  const loopFade = clamp(Math.min(state.tick / 0.7, (REPLAY_END - state.tick) / 0.7), 0.12, 1);
  for (const point of projectedPoints) {
    const selected = state.selectedPoint?.id === point.id;
    const hovered = state.hoveredPoint?.id === point.id;
    const stageIndex = clamp(Math.round(point.renderStage), 0, STAGES.length - 1);
    const dimmed = state.focusedStage !== null && stageIndex !== state.focusedStage;
    const depthFactor = clamp(WORLD.depth / (WORLD.depth + point.cameraDepth), 0.52, 1.65);
    const radius = selected ? 3.8 : (stageIndex >= 3 ? 1.32 : 0.86) * clamp(depthFactor * Math.sqrt(state.camera.scale), 0.68, 2.4);
    if (selected || hovered) {
      context.beginPath();
      context.arc(point.screenX, point.screenY, selected ? 7.5 : 5.5, 0, Math.PI * 2);
      context.strokeStyle = selected ? '#fff6e8' : '#e9bd86';
      context.lineWidth = selected ? 1.4 : 0.9;
      context.globalAlpha = 1;
      context.stroke();
    }
    context.beginPath();
    context.arc(point.screenX, point.screenY, radius, 0, Math.PI * 2);
    context.fillStyle = selected ? '#fff6e8' : STAGES[stageIndex].color;
    context.globalAlpha = selected ? loopFade : (dimmed ? 0.17 : clamp(0.42 + depthFactor * 0.28 + (stageIndex >= 3 ? 0.18 : 0), 0.34, 0.96)) * loopFade;
    context.fill();
  }
  context.restore();
  drawSpatialStageLabels(width, height);
}

function reachedCounts(counts) {
  return counts.map((_, index) => counts.slice(index).reduce((sum, value) => sum + value, 0));
}

function renderScenario({ transitionGraph = false } = {}) {
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
    const focused = state.focusedStage === index;
    return `<button class="causal-stage${focused ? ' is-focused' : ''}" type="button" data-focus-stage="${index}" aria-pressed="${focused}" style="--stage-color:${stage.color}">
      <span class="causal-stage-index">${String(index + 1).padStart(2, '0')}</span>
      <strong>${stage.label}</strong>
      <span class="causal-stage-count">${reached[index].toLocaleString()}</span>
      <span class="causal-stage-reached">${escapeHtml(stage.meaning)}</span>
      <span class="causal-stage-conversion">${conversion}% OF PRIOR STAGE</span>
      <span class="causal-stage-drop" aria-hidden="true"><i style="--conversion:${Math.max(0, conversion)}%"></i></span>
    </button>`;
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
  if (!state.points.length) rebuildPoints();
  else if (transitionGraph) transitionPointsToScenario();
  else drawField();
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

function showMarker(point, { focus = false } = {}) {
  if (!point) return;
  state.selectedPoint = point;
  const stageIndex = clamp(Math.round(point.renderStage ?? point.stage), 0, STAGES.length - 1);
  const stage = STAGES[stageIndex];
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
  $('#profile-tick').textContent = `T+${String(Math.floor(state.tick)).padStart(3, '0')}`;
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
  if (focus) focusPoint(point);
  drawField();
}

function closeMarker() {
  state.selectedPoint = null;
  $('#profile-panel').classList.remove('is-open');
  $('.lab-grid').classList.add('profile-is-empty');
  drawField();
}

function eventCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function nearestPoint(event) {
  const screen = eventCanvasPoint(event);
  let nearest = null;
  let distance = Math.pow(11 + Math.min(9, state.camera.scale * 1.5), 2);
  for (const point of state.points) {
    const candidate = (point.screenX - screen.x) ** 2 + (point.screenY - screen.y) ** 2;
    if (candidate < distance) { distance = candidate; nearest = point; }
  }
  return nearest;
}

function constrainCamera() {
  const rect = mount.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  state.camera.scale = clamp(state.camera.scale, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
  state.camera.pitch = clamp(state.camera.pitch, CAMERA_LIMITS.pitchMin, CAMERA_LIMITS.pitchMax);
  state.camera.x = clamp(state.camera.x, -width * 0.86, width * 0.86);
  state.camera.y = clamp(state.camera.y, -height * 0.86, height * 0.86);
  state.camera.targetX = clamp(state.camera.targetX, -WORLD.stageGap * 2.35, WORLD.stageGap * 2.35);
  state.camera.targetY = clamp(state.camera.targetY, -WORLD.stageGap * 2.35, WORLD.stageGap * 2.35);
  state.camera.targetZ = clamp(state.camera.targetZ, -WORLD.radiusZ, WORLD.radiusZ);
}

function updateCameraUI() {
  const changed = Math.abs(state.camera.scale - DEFAULT_CAMERA.scale) > 0.005
    || Math.abs(state.camera.x) > 1 || Math.abs(state.camera.y) > 1
    || Math.abs(state.camera.yaw - DEFAULT_CAMERA.yaw) > 0.01
    || Math.abs(state.camera.pitch - DEFAULT_CAMERA.pitch) > 0.01
    || Math.abs(state.camera.targetX) > 1 || Math.abs(state.camera.targetY) > 1 || Math.abs(state.camera.targetZ) > 1;
  $('#zoom-level').textContent = `${state.camera.scale.toFixed(2)}×`;
  canvas.dataset.zoom = state.camera.scale.toFixed(3);
  canvas.dataset.cameraX = state.camera.x.toFixed(1); canvas.dataset.cameraY = state.camera.y.toFixed(1);
  canvas.dataset.cameraYaw = state.camera.yaw.toFixed(3); canvas.dataset.cameraPitch = state.camera.pitch.toFixed(3);
  canvas.dataset.cameraTarget = `${state.camera.targetX.toFixed(1)},${state.camera.targetY.toFixed(1)},${state.camera.targetZ.toFixed(1)}`;
  $('#reset-camera').hidden = !changed;
  $('#zoom-reset').disabled = !changed;
  field.classList.toggle('has-camera-change', changed);
}

function applyCamera() {
  constrainCamera();
  updateCameraUI();
  drawField();
}

function zoomAt(nextScale, anchor) {
  const previousScale = state.camera.scale;
  const scale = clamp(nextScale, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
  if (Math.abs(scale - previousScale) < 0.0001) return;
  const rect = mount.getBoundingClientRect();
  const ratio = scale / previousScale;
  const relativeX = anchor.x - rect.width * 0.5 - state.camera.x;
  const relativeY = anchor.y - rect.height * 0.5 - state.camera.y;
  state.camera.scale = scale;
  state.camera.x += relativeX * (1 - ratio);
  state.camera.y += relativeY * (1 - ratio);
  applyCamera();
}

function zoomFromCenter(multiplier) {
  const rect = mount.getBoundingClientRect();
  zoomAt(state.camera.scale * multiplier, { x: rect.width / 2, y: rect.height / 2 });
}

function resetCamera() {
  Object.assign(state.camera, DEFAULT_CAMERA);
  state.focusedStage = null;
  $$('.causal-stage').forEach((item) => {
    item.classList.remove('is-focused');
    item.setAttribute('aria-pressed', 'false');
  });
  updateCameraUI();
  drawField();
}

function focusStage(stageIndex) {
  const index = clamp(Number(stageIndex) || 0, 0, STAGES.length - 1);
  const rect = mount.getBoundingClientRect();
  const vertical = isVerticalField(rect.width, rect.height);
  state.focusedStage = state.focusedStage === index ? null : index;
  if (state.focusedStage === null) {
    resetCamera();
    return;
  }
  const center = stageWorldCenter(index, vertical);
  state.camera.scale = 2.05;
  state.camera.x = 0; state.camera.y = 0;
  state.camera.targetX = center.x; state.camera.targetY = center.y; state.camera.targetZ = center.z;
  $$('.causal-stage').forEach((item) => {
    const active = Number(item.dataset.focusStage) === state.focusedStage;
    item.classList.toggle('is-focused', active);
    item.setAttribute('aria-pressed', String(active));
  });
  applyCamera();
}

function focusPoint(point) {
  state.camera.scale = Math.max(2.25, state.camera.scale);
  state.camera.x = 0; state.camera.y = 0;
  state.camera.targetX = point.x;
  state.camera.targetY = point.y;
  state.camera.targetZ = point.z;
  applyCamera();
}

function showHover(event) {
  const point = nearestPoint(event);
  if (state.hoveredPoint?.id !== point?.id) {
    state.hoveredPoint = point;
    drawField();
  }
  const hover = $('#hover-card');
  if (!point) {
    hover.hidden = true;
    canvas.style.cursor = gesture.moved ? 'grabbing' : 'grab';
    return;
  }
  const stageIndex = clamp(Math.round(point.renderStage ?? point.stage), 0, STAGES.length - 1);
  hover.innerHTML = `<strong>MARKER ${point.id.toLocaleString()}</strong><span>${STAGES[stageIndex].label} · PUBLIC STAGE · ${state.camera.scale.toFixed(2)}× DOLLY</span>`;
  const fieldRect = field.getBoundingClientRect();
  hover.style.left = `${clamp(event.clientX - fieldRect.left + 12, 8, fieldRect.width - 210)}px`;
  hover.style.top = `${clamp(event.clientY - fieldRect.top + 12, 40, fieldRect.height - 70)}px`;
  hover.hidden = false;
  canvas.style.cursor = 'pointer';
}

function setMode(mode) {
  state.mode = mode;
  Object.assign(state.camera, DEFAULT_CAMERA);
  state.focusedStage = null;
  field.classList.toggle('is-flow-mode', mode === 'field');
  $$('[data-scene-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.sceneMode === mode));
  $('#mobile-controls-toggle').setAttribute('aria-expanded', 'false');
  $('.control-rail').classList.remove('is-open');
  updatePlaybackButton();
  requestAnimationFrame(applyCamera);
}

function updatePlaybackButton() {
  const button = $('#play-toggle');
  button.textContent = state.playing ? 'PAUSE' : 'PLAY';
  button.setAttribute('aria-pressed', String(state.playing));
  button.setAttribute('aria-label', state.playing ? 'Pause public projection replay' : 'Play public projection replay');
  canvas.dataset.motion = state.playing ? 'running' : 'paused';
  field.classList.toggle('is-simulating', state.playing);
  const baseLabel = state.mode === 'field' ? 'Attention Field' : state.mode === 'cascade' ? 'Full Attention Network' : 'Market Signal Field';
  $('#field-mode-label').textContent = baseLabel;
}

function updatePlaybackMetrics() {
  const counts = [0, 0, 0, 0, 0];
  for (const point of state.points) counts[clamp(Math.round(point.renderStage ?? point.stage), 0, 4)] += 1;
  const active = counts.slice(1).reduce((sum, value) => sum + value, 0);
  const trades = counts[3] + counts[4];
  $('#metric-active').textContent = active.toLocaleString();
  $('#metric-trades').textContent = trades.toLocaleString();
  $('#metric-cascade').textContent = counts[2].toLocaleString();
}

function updateTimeline() {
  const progress = clamp(state.tick / REPLAY_END, 0, 1);
  const phases = ['EXPOSURE', 'ATTENTION', 'COMMITMENT', 'REFLECTION'];
  const tick = Math.floor(state.tick);
  $('#tick-label').textContent = `T+${String(tick).padStart(3, '0')}`;
  $('#phase-label').textContent = phases[Math.min(3, Math.floor(progress * 4))];
  $('#timeline-progress').style.width = `${progress * 100}%`;
  $('#timeline-marker').style.left = `${progress * 100}%`;
  if (state.selectedPoint) {
    const stageIndex = clamp(Math.round(state.selectedPoint.renderStage ?? state.selectedPoint.stage), 0, 4);
    $('#profile-tick').textContent = `T+${String(tick).padStart(3, '0')}`;
    $('#profile-action').textContent = STAGES[stageIndex].label;
    $('#profile-cohort').textContent = STAGES[stageIndex].label;
  }
  updatePlaybackMetrics();
}

function animate(time) {
  if (state.playing) {
    if (!state.lastStep) state.lastStep = time;
    const elapsed = Math.min(80, time - state.lastStep);
    state.motionTime += elapsed * state.speed;
    state.tick += elapsed * state.speed * 0.002;
    if (state.tick >= REPLAY_END) {
      state.tick %= REPLAY_END;
      state.loopCount += 1;
    }
    state.lastStep = time;
    drawField(time);
    updateTimeline();
    if (state.stageTransitionStart && time - state.stageTransitionStart >= state.stageTransitionDuration) {
      state.stageTransitionStart = 0;
      for (const point of state.points) point.previousStage = null;
    }
  } else if (state.stageTransitionStart) {
    drawField(time);
    if (time - state.stageTransitionStart >= state.stageTransitionDuration) {
      state.stageTransitionStart = 0;
      for (const point of state.points) point.previousStage = null;
      drawField(time);
    }
  }
  requestAnimationFrame(animate);
}

function beginPinch() {
  const [first, second] = [...gesture.pointers.values()];
  if (!first || !second) return;
  const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  gesture.pinch = {
    distance: Math.max(1, distance),
    scale: state.camera.scale,
    center,
    cameraX: state.camera.x,
    cameraY: state.camera.y,
  };
}

function handlePointerDown(event) {
  if (event.button > 2) return;
  const point = eventCanvasPoint(event);
  gesture.pointers.set(event.pointerId, point);
  gesture.moved = false;
  canvas.setPointerCapture?.(event.pointerId);
  $('#hover-card').hidden = true;
  state.hoveredPoint = null;
  if (gesture.pointers.size === 1) {
    gesture.drag = {
      x: point.x, y: point.y,
      mode: event.shiftKey || event.altKey || event.metaKey || event.button === 1 || event.button === 2 ? 'pan' : 'orbit',
      cameraX: state.camera.x, cameraY: state.camera.y,
      yaw: state.camera.yaw, pitch: state.camera.pitch,
    };
  } else if (gesture.pointers.size === 2) {
    beginPinch();
  }
}

function handlePointerMove(event) {
  if (!gesture.pointers.has(event.pointerId)) {
    showHover(event);
    return;
  }
  const point = eventCanvasPoint(event);
  gesture.pointers.set(event.pointerId, point);
  if (gesture.pointers.size >= 2 && gesture.pinch) {
    const [first, second] = [...gesture.pointers.values()];
    const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
    const nextScale = clamp(gesture.pinch.scale * distance / gesture.pinch.distance, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
    const ratio = nextScale / gesture.pinch.scale;
    const rect = mount.getBoundingClientRect();
    const relativeX = gesture.pinch.center.x - rect.width * 0.5 - gesture.pinch.cameraX;
    const relativeY = gesture.pinch.center.y - rect.height * 0.5 - gesture.pinch.cameraY;
    state.camera.scale = nextScale;
    state.camera.x = center.x - rect.width * 0.5 - relativeX * ratio;
    state.camera.y = center.y - rect.height * 0.5 - relativeY * ratio;
    gesture.moved = true;
    field.classList.add('is-graph-panning');
    applyCamera();
    return;
  }
  if (!gesture.drag) return;
  const deltaX = point.x - gesture.drag.x;
  const deltaY = point.y - gesture.drag.y;
  if (!gesture.moved && Math.hypot(deltaX, deltaY) < 3) return;
  gesture.moved = true;
  if (gesture.drag.mode === 'pan') {
    state.camera.x = gesture.drag.cameraX + deltaX;
    state.camera.y = gesture.drag.cameraY + deltaY;
  } else {
    state.camera.yaw = gesture.drag.yaw + deltaX * 0.006;
    state.camera.pitch = clamp(gesture.drag.pitch + deltaY * 0.005, CAMERA_LIMITS.pitchMin, CAMERA_LIMITS.pitchMax);
  }
  field.classList.add('is-graph-panning');
  applyCamera();
}

function handlePointerEnd(event) {
  const shouldSelect = gesture.pointers.size === 1 && !gesture.moved && event.type === 'pointerup';
  gesture.pointers.delete(event.pointerId);
  canvas.releasePointerCapture?.(event.pointerId);
  if (gesture.pointers.size === 1) {
    const remaining = [...gesture.pointers.values()][0];
    gesture.drag = {
      x: remaining.x, y: remaining.y, mode: 'orbit',
      cameraX: state.camera.x, cameraY: state.camera.y,
      yaw: state.camera.yaw, pitch: state.camera.pitch,
    };
    gesture.pinch = null;
    gesture.moved = true;
  } else if (!gesture.pointers.size) {
    gesture.drag = null;
    gesture.pinch = null;
    field.classList.remove('is-graph-panning');
    canvas.style.cursor = 'grab';
    if (shouldSelect) showMarker(nearestPoint(event));
  }
}

function handleGraphKey(event) {
  const rect = mount.getBoundingClientRect();
  const center = { x: rect.width / 2, y: rect.height / 2 };
  if (event.key === '+' || event.key === '=') zoomAt(state.camera.scale * 1.2, center);
  else if (event.key === '-' || event.key === '_') zoomAt(state.camera.scale / 1.2, center);
  else if (event.key === '0') resetCamera();
  else if (event.key === 'ArrowLeft' && event.shiftKey) { state.camera.x += 42; applyCamera(); }
  else if (event.key === 'ArrowRight' && event.shiftKey) { state.camera.x -= 42; applyCamera(); }
  else if (event.key === 'ArrowUp' && event.shiftKey) { state.camera.y += 42; applyCamera(); }
  else if (event.key === 'ArrowDown' && event.shiftKey) { state.camera.y -= 42; applyCamera(); }
  else if (event.key === 'ArrowLeft') { state.camera.yaw -= 0.1; applyCamera(); }
  else if (event.key === 'ArrowRight') { state.camera.yaw += 0.1; applyCamera(); }
  else if (event.key === 'ArrowUp') { state.camera.pitch = clamp(state.camera.pitch - 0.08, CAMERA_LIMITS.pitchMin, CAMERA_LIMITS.pitchMax); applyCamera(); }
  else if (event.key === 'ArrowDown') { state.camera.pitch = clamp(state.camera.pitch + 0.08, CAMERA_LIMITS.pitchMin, CAMERA_LIMITS.pitchMax); applyCamera(); }
  else return;
  event.preventDefault();
}

function wireControls() {
  $('#scenario-control').addEventListener('click', (event) => {
    const choice = event.target.closest('[data-scenario]');
    if (!choice) return;
    if (choice.dataset.scenario === state.scenario) return;
    state.scenario = choice.dataset.scenario;
    renderScenario({ transitionGraph: true });
  });
  $$('[data-scene-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.sceneMode)));
  $('#causal-stage-grid').addEventListener('click', (event) => {
    const stage = event.target.closest('[data-focus-stage]');
    if (stage) focusStage(stage.dataset.focusStage);
  });
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
    if (button) { showMarker(state.points[Number(button.dataset.marker) - 1], { focus: true }); $('#search-results').hidden = true; }
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const anchor = eventCanvasPoint(event);
    const normalized = clamp(event.deltaY, -140, 140);
    zoomAt(state.camera.scale * Math.exp(-normalized * 0.003), anchor);
    showHover(event);
  }, { passive: false });
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerEnd);
  canvas.addEventListener('pointercancel', handlePointerEnd);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('pointerleave', () => {
    if (gesture.pointers.size) return;
    state.hoveredPoint = null;
    $('#hover-card').hidden = true;
    canvas.style.cursor = 'grab';
    drawField();
  });
  canvas.addEventListener('keydown', handleGraphKey);
  $('#zoom-in').addEventListener('click', () => zoomFromCenter(1.25));
  $('#zoom-out').addEventListener('click', () => zoomFromCenter(0.8));
  $('#zoom-reset').addEventListener('click', resetCamera);
  $('#reset-camera').addEventListener('click', resetCamera);
  $('#select-random').addEventListener('click', () => showMarker(state.points[Math.floor(seeded(Math.floor(state.tick) + 91) * state.points.length)], { focus: true }));
  $('#mobile-open-profile').addEventListener('click', () => showMarker(state.points[Math.floor(seeded(Math.floor(state.tick) + 31) * state.points.length)]));
  $('#close-profile').addEventListener('click', closeMarker);
  updatePlaybackButton();
  $('#play-toggle').addEventListener('click', () => {
    if (state.playing) {
      state.playing = false;
      state.lastStep = 0;
    } else {
      if (state.tick >= REPLAY_END) state.tick = 1;
      state.playing = true;
      state.lastStep = 0;
    }
    updatePlaybackButton();
    drawField();
    updateTimeline();
  });
  $('#step-once').addEventListener('click', () => {
    state.playing = false;
    state.lastStep = 0;
    state.tick = state.tick >= REPLAY_END ? 1 : Math.min(REPLAY_END, Math.floor(state.tick) + 1);
    updatePlaybackButton();
    drawField();
    updateTimeline();
  });
  $('#reset-run').addEventListener('click', () => {
    state.tick = 1;
    state.playing = true;
    state.motionTime = 0;
    state.loopCount = 0;
    state.lastStep = 0;
    updatePlaybackButton();
    drawField();
    updateTimeline();
  });
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
renderScenario();
updateTimeline();
updateCameraUI();
loadMarkets();
requestAnimationFrame(animate);
