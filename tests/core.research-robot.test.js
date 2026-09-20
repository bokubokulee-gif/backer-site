'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const THREE = require('three');

// Exercise the real scene and DOM handlers, replacing only WebGL and the browser event loop.
// Geometry/materials remain Three.js objects, so the accessory's placement is testable too.
function mountFixture() {
  class Target {
    constructor() {
      this.listeners = new Map();
      this.dataset = {};
      this.attributes = new Map();
      this.style = {};
      this.children = [];
      this.textContent = '';
    }
    addEventListener(type, callback) {
      this.listeners.set(type, [...(this.listeners.get(type) || []), callback]);
    }
    removeEventListener(type, callback) {
      this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== callback));
    }
    dispatch(type, values = {}) {
      const event = { target: this, button: 0, detail: 1, preventDefault() { this.defaultPrevented = true; }, ...values };
      for (const listener of this.listeners.get(type) || []) listener(event);
      return event;
    }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name); }
    prepend(child) { this.children.unshift(child); child.parentNode = this; }
    remove() { this.parentNode.children = this.parentNode.children.filter(child => child !== this); }
    closest() { return null; }
    contains(target) { return target === this || this.children.includes(target); }
    click() { this.dispatch('click', { detail: 0 }); }
    getBoundingClientRect() { return { left: 100, top: 100, right: 500, bottom: 400, width: 400, height: 300 }; }
  }
  const host = new Target();
  const greeting = new Target();
  host.closest = selector => selector === '.research-robot-wrap' ? { querySelector: () => greeting } : null;
  const document = new Target();
  document.hidden = false;
  document.createElement = () => {
    const canvas = new Target();
    canvas.getContext = () => ({
      fillRect() {}, beginPath() {}, arc() {}, fill() {},
      createRadialGradient: () => ({ addColorStop() {} }),
    });
    return canvas;
  };
  const media = new Target();
  media.matches = true;
  const window = new Target();
  Object.assign(window, { innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, matchMedia: () => media });
  class Observer { observe() {} disconnect() { this.disconnected = true; } }
  window.ResizeObserver = window.IntersectionObserver = Observer;
  let renderer;
  class Renderer {
    constructor() { renderer = this; this.domElement = new Target(); }
    setClearColor() {}
    setPixelRatio() {}
    setSize() {}
    render(scene, camera) { this.scene = scene; this.camera = camera; }
    dispose() { this.disposed = true; }
    forceContextLoss() {}
  }
  let now = 1000;
  let nextFrame = 0;
  const frames = new Map();
  const source = fs.readFileSync(path.join(__dirname, '../components/robot/robot-scene.mjs'), 'utf8')
    .replace(/^import \* as THREE from 'three';\s*/, '')
    .replace('export function mountResearchRobot', 'function mountResearchRobot');
  const factory = new Function('THREE', 'window', 'document', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver', 'IntersectionObserver',
    `${source}\nreturn mountResearchRobot;`);
  const mount = factory({ ...THREE, WebGLRenderer: Renderer }, window, document, { now: () => now },
    callback => { frames.set(++nextFrame, callback); return nextFrame; }, id => frames.delete(id), Observer, Observer);
  const dispose = mount(host);
  function flush() {
    const pending = [...frames.values()];
    frames.clear();
    now += 25;
    pending.forEach(callback => callback(now));
  }
  flush();
  assert.equal(host.dataset.robotState, 'ready', 'The real robot scene should initialize');
  const pointer = (type, values = {}) => ({ pointerId: 7, pointerType: type, isPrimary: true, clientX: 300, clientY: 240, target: host, ...values });
  return { host, document, window, greeting, renderer, frames, flush, dispose, pointer, advance: ms => { now += ms; } };
}

test('Robot native click toggles head-mounted clear glasses while preserving the normal eyes', () => {
  const f = mountFixture();
  const glasses = f.renderer.scene.getObjectByName('research-robot-glasses');
  const leftEye = f.renderer.scene.getObjectByName('research-robot-eye-left');
  const rightEye = f.renderer.scene.getObjectByName('research-robot-eye-right');
  assert.ok(glasses && leftEye && rightEye);
  assert.equal(glasses.parent, leftEye.parent, 'Glasses follow the same rotating head as the eyes');
  assert.equal(glasses.visible, false);
  f.host.dispatch('click'); // No preceding pointerup: browser tools and native activation must work.
  f.flush();
  assert.equal(glasses.visible, true);
  assert.equal(f.host.getAttribute('aria-pressed'), 'true');
  assert.equal(f.host.dataset.robotGlasses, 'on');
  assert.equal(leftEye.children[0].visible, true);
  assert.equal(rightEye.children[0].visible, true);
  let clearLensCount = 0;
  glasses.traverse(part => {
    if (part.name === 'research-robot-clear-lens') {
      clearLensCount += 1;
      assert.ok(part.material.transparent && part.material.opacity < .08 && !part.material.depthWrite);
    }
  });
  assert.equal(clearLensCount, 2);
  f.host.dispatch('click');
  f.flush();
  assert.equal(glasses.visible, false);
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  assert.equal(f.greeting.textContent, '');
  f.dispose();
});

test('Robot touch and long pointer presses activate exactly once from the resulting click', () => {
  const f = mountFixture();
  f.host.dispatch('pointerdown', f.pointer('touch'));
  f.advance(1500); // A deliberate press should not fail an arbitrary 700ms timeout.
  f.document.dispatch('pointerup', f.pointer('touch'));
  assert.equal(f.host.getAttribute('aria-pressed'), 'false', 'pointerup must not toggle before click');
  f.host.dispatch('click', { pointerType: 'touch' });
  assert.equal(f.host.getAttribute('aria-pressed'), 'true');
  f.host.dispatch('pointerdown', f.pointer('mouse'));
  f.document.dispatch('pointerup', f.pointer('mouse'));
  f.host.dispatch('click');
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  f.dispose();
});

test('Robot suppresses drag/scroll clicks but the next tap and assistive click still work', () => {
  const f = mountFixture();
  f.host.dispatch('pointerdown', f.pointer('touch'));
  f.document.dispatch('pointermove', f.pointer('touch', { clientY: 290 }));
  f.document.dispatch('pointerup', f.pointer('touch'));
  f.host.dispatch('click', { pointerType: 'touch' });
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  f.host.dispatch('pointerdown', f.pointer('touch'));
  f.document.dispatch('pointercancel', f.pointer('touch'));
  f.host.dispatch('click', { pointerType: 'touch' });
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  f.host.dispatch('pointerdown', f.pointer('touch'));
  f.document.dispatch('pointerup', f.pointer('touch'));
  f.host.dispatch('click', { pointerType: 'touch' });
  assert.equal(f.host.getAttribute('aria-pressed'), 'true');
  f.host.dispatch('pointerdown', f.pointer('mouse'));
  f.document.dispatch('pointermove', f.pointer('mouse', { clientX: 360 }));
  f.document.dispatch('pointerup', f.pointer('mouse'));
  f.host.click(); // detail=0 accessibility activation is independent of stale pointer state.
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  f.dispose();
});

test('Robot Enter and Space share native click activation, ignore repeats, and dispose listeners', () => {
  const f = mountFixture();
  const enter = f.host.dispatch('keydown', { key: 'Enter', repeat: false });
  assert.equal(enter.defaultPrevented, true);
  assert.equal(f.host.getAttribute('aria-pressed'), 'true');
  f.host.dispatch('keydown', { key: 'Enter', repeat: true });
  assert.equal(f.host.getAttribute('aria-pressed'), 'true');
  const space = f.host.dispatch('keydown', { key: ' ', repeat: false });
  assert.equal(space.defaultPrevented, true);
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  const nestedButton = { closest() { return this; } };
  f.host.dispatch('click', { target: nestedButton });
  f.host.dispatch('keydown', { target: nestedButton, key: 'Enter' });
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
  f.dispose();
  assert.equal(f.renderer.disposed, true);
  assert.equal(f.frames.size, 0);
  f.host.dispatch('click');
  assert.equal(f.host.getAttribute('aria-pressed'), 'false');
});
