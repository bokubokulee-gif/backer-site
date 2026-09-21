'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/research-attention-scene.js'), 'utf8');
const noop = () => {};

// Integrate the actual cached radial gradient, rather than reproducing the scene's
// centering weights. This measures the brightness and area sent to the canvas.
function gradientMass(stops) {
  const values = stops.map(([r, color]) => {
    const [red, green, blue, alpha] = color.match(/[\d.]+/g).map(Number);
    return [r, alpha * (.2126 * red + .7152 * green + .0722 * blue)];
  });
  let mass = 0;
  for (let i = 1; i < values.length; i++) {
    const [r0, a0] = values[i - 1];
    const [r1, a1] = values[i];
    const slope = (a1 - a0) / (r1 - r0);
    mass += (a0 - slope * r0) * (r1 * r1 - r0 * r0) / 2 + slope * (r1 ** 3 - r0 ** 3) / 3;
  }
  return mass;
}

function fixture(width, height) {
  let points = [], wires = [], recording = true, now = 0, resize;
  const gradient = () => ({ stops: [], addColorStop(...stop) { this.stops.push(stop); } });
  const ctx = {
    globalAlpha: 1, setTransform: noop, fillRect: noop, beginPath: noop, lineTo: noop, stroke: noop,
    createRadialGradient: gradient,
    clearRect() { if (recording) { points = []; wires = []; } },
    moveTo(x, y) { this.start = [x, y]; },
    bezierCurveTo() { if (recording) wires.push(this.start); },
    drawImage(sprite, x, y, w, h) {
      if (recording) points.push({ x: x + w / 2, y: y + h / 2, size: w, alpha: this.globalAlpha, light: sprite.mass * w * h * this.globalAlpha });
    },
  };
  const document = {
    hidden: false, addEventListener: noop, removeEventListener: noop,
    createElement() {
      const sprite = {};
      const paint = { createRadialGradient: gradient, fillRect() { sprite.mass = gradientMass(this.fillStyle.stops); } };
      sprite.getContext = () => paint;
      return sprite;
    },
  };
  const create = vm.runInNewContext(
    source.replace(/^import\s+[^;]+;\s*/m, '').replace('export function createAttentionScene', 'function createAttentionScene') + '\ncreateAttentionScene;',
    {
      Math, document, window: { devicePixelRatio: 2, addEventListener: noop, removeEventListener: noop },
      ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} disconnect() {} },
      // Electrical pulse rendering has its own tests. Keep real wire geometry here.
      createCurrentRenderer: () => noop,
    },
  );
  const canvas = { clientWidth: width, clientHeight: height, getContext: () => ctx };
  const scene = create(canvas);
  return {
    scene,
    frame(progress) {
      scene.setProgress(progress);
      scene.setPaused(true);
      scene.setPaused(false);
      recording = true;
      scene.render(now);
      recording = false;
      scene.setPaused(true);
      return { points, wires };
    },
    advance(seconds) {
      recording = false;
      scene.setPaused(false);
      scene.render(now);
      const end = now + seconds * 1000;
      while (now < end) { now = Math.min(now + 50, end); scene.render(now); }
      scene.setPaused(true);
    },
    resize(w, h) {
      canvas.clientWidth = w; canvas.clientHeight = h;
      resize([{ contentRect: { width: w, height: h } }]);
    },
  };
}

function visibleGeometry(points) {
  let min = Infinity, max = -Infinity, light = 0, moment = 0;
  for (const point of points) {
    assert.ok([point.x, point.y, point.size, point.alpha, point.light].every(Number.isFinite));
    assert.ok(point.alpha >= 0 && point.alpha <= 1);
    if (point.light <= 0) continue;
    min = Math.min(min, point.x); max = Math.max(max, point.x);
    light += point.light; moment += point.x * point.light;
  }
  return { boundsCenter: (min + max) / 2, visualCenter: moment / light, width: max - min };
}

test('Final particle plane stays visually centered over time and wires follow its corrected anchors', () => {
  for (const [width, height] of [[319, 560], [484, 747], [760, 320], [1360, 883]]) {
    const run = fixture(width, height);
    for (const elapsed of [0, 1, 3]) {
      run.advance(elapsed === 3 ? 2 : elapsed);
      const frame = run.frame(2);
      const geometry = visibleGeometry(frame.points);
      assert.ok(Math.abs(geometry.boundsCenter - width / 2) < .01, 'Both ends of the plane must balance around the card midpoint');
      assert.ok(Math.abs(geometry.visualCenter - width / 2) < .1, 'Large nearby particles must not pull visible brightness off center');
      assert.ok(geometry.width > width * .7 && geometry.width < width, 'Centering must preserve the broad population plane');
      assert.ok(frame.wires.length >= 20, 'Exercise the upward flows');
      for (const [x, y] of frame.wires) {
        assert.ok(frame.points.some(point => Math.hypot(point.x - x, point.y - y) < .001), 'A wire must start on its rendered particle');
      }
    }
    run.scene.destroy();
  }
});

test('Flow centering leaves earlier phases reversible and survives a resize round trip', () => {
  const run = fixture(484, 747);
  run.advance(1);
  for (const progress of [0, .5, 1]) {
    const accepted = run.frame(progress);
    run.frame(2);
    assert.deepEqual(run.frame(progress), accepted, 'The final-plane correction must not leak into the earlier shapes');
  }
  const settled = run.frame(2);
  run.resize(1360, 883); run.frame(2);
  run.resize(484, 747);
  assert.deepEqual(run.frame(2), settled, 'Resize must retain the same population, depth and wire anchors');
  run.scene.destroy();
});
