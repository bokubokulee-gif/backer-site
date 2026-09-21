'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '../js/card-glow.js'), 'utf8');

// Run the shipped controller against a small DOM adapter. Layout values come from
// fixtures; all registration, observation, replacement and path creation stay real.
function fixture() {
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, fn) { this.listeners.set(name, [...(this.listeners.get(name) || []), fn]); }
    removeEventListener(name, fn) { this.listeners.set(name, (this.listeners.get(name) || []).filter(item => item !== fn)); }
    dispatch(name, values = {}) { for (const fn of this.listeners.get(name) || []) fn({ target: this, ...values }); }
  }
  class Element extends Target {
    constructor(tag = 'div', className = '', metrics = null) {
      super();
      this.tagName = tag.toUpperCase(); this.nodeType = 1; this.className = className;
      this.children = []; this.parentNode = null; this.metrics = metrics; this.dataset = {};
      const properties = new Map();
      this.style = {
        setProperty(key, value) { properties.set(key, String(value)); },
        getPropertyValue(key) { return properties.get(key) || ''; },
        removeProperty(key) { properties.delete(key); },
      };
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
        remove: name => { this.className = this.className.split(/\s+/).filter(item => item !== name).join(' '); },
        toggle: (name, force) => {
          const enabled = force === undefined ? !this.classList.contains(name) : force;
          this.classList[enabled ? 'add' : 'remove'](name); return enabled;
        },
      };
    }
    get isConnected() { return this === body || Boolean(this.parentNode?.isConnected); }
    get parentElement() { return this.parentNode; }
    get owner() {
      if (this.metrics) return this;
      return this.parentNode?.owner || this;
    }
    get offsetWidth() { return this.owner.metrics?.width || 0; }
    get offsetHeight() { return this.owner.metrics?.height || 0; }
    get clientWidth() { return this.offsetWidth; }
    get clientHeight() { return this.offsetHeight; }
    setAttribute(name, value) { this[name] = String(value); }
    appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; return child; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(item => item !== this); this.parentNode = null; }
    matches(selectors) {
      return selectors.split(',').some(selector => {
        selector = selector.trim();
        const tag = selector.match(/^[a-z][a-z\d-]*/i)?.[0];
        const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(match => match[1]);
        return (!tag || tag.toUpperCase() === this.tagName) && classes.every(name => this.classList.contains(name));
      });
    }
    querySelectorAll(selector) {
      if (selector.startsWith(':scope > ')) return this.children.filter(child => child.matches(selector.slice(9)));
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest(selector) || null; }
    getBoundingClientRect() {
      const scale = this.owner.metrics?.scale || 1;
      return { x: 0, y: 0, left: 0, top: 0, width: this.offsetWidth * scale, height: this.offsetHeight * scale, right: this.offsetWidth * scale, bottom: this.offsetHeight * scale };
    }
  }
  const body = new Element('body');
  const document = new Target();
  Object.assign(document, {
    body, documentElement: body, hidden: false, readyState: 'complete', activeElement: null,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => body.querySelectorAll(selector),
  });
  const resizeObservers = [], mutationObservers = [], frames = new Map();
  let serial = 0;
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); resizeObservers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; mutationObservers.push(this); }
    observe() {}
    disconnect() {}
  }
  const window = new Target();
  Object.assign(window, {
    ResizeObserver,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: fn => { frames.set(++serial, fn); return serial; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: () => ++serial, clearTimeout() {},
    getComputedStyle(element) {
      const metrics = element.owner.metrics || {};
      const corners = element.computedRadii || element.parentNode?.computedRadii || metrics.radii || Array(4).fill('24px');
      return {
        width: `${metrics.width || 0}px`, height: `${metrics.height || 0}px`,
        position: 'relative', boxSizing: 'border-box',
        borderTopWidth: '0px', borderRightWidth: '0px', borderBottomWidth: '0px', borderLeftWidth: '0px',
        borderTopLeftRadius: corners[0], borderTopRightRadius: corners[1],
        borderBottomRightRadius: corners[2], borderBottomLeftRadius: corners[3],
        getPropertyValue: name => name === '--card-glow-width' ? String(metrics.stroke ?? 1.5) + 'px' : element.style.getPropertyValue(name),
      };
    },
  });
  function flush() {
    for (let count = 0; frames.size; count++) {
      assert.ok(count < 30, 'Geometry must settle without a perpetual animation/resize loop');
      const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(100));
    }
  }
  function resize(owner, values) {
    Object.assign(owner.metrics, values);
    for (const observer of resizeObservers) {
      const entries = [...observer.targets].filter(target => target.owner === owner).map(target => ({ target, contentRect: { width: target.offsetWidth, height: target.offsetHeight } }));
      if (entries.length) observer.callback(entries);
    }
    flush();
  }
  function mutate(addedNodes = [], removedNodes = []) {
    for (const observer of mutationObservers) observer.callback([{ addedNodes, removedNodes, target: body }]);
    flush();
  }
  function start() {
    vm.runInNewContext(SOURCE, { window, document, ResizeObserver, MutationObserver, performance: { now: () => 100 }, getComputedStyle: window.getComputedStyle });
    flush();
  }
  function addManual(metrics) {
    const card = body.appendChild(new Element('div', 'stage has-card-glow', metrics));
    const layer = card.appendChild(new Element('span', 'backer-card-glow-layer'));
    return { card, layer };
  }
  return { Element, body, window, start, flush, resize, mutate, addManual, resizeObservers };
}

// Decode the emitted path as geometry, avoiding assertions on formatting or source.
function contours(layer) {
  const clip = layer.style.getPropertyValue('--card-glow-clip');
  assert.match(clip, /^path\(evenodd,/);
  const pathData = clip.match(/["']([^"']+)["']/)?.[1];
  assert.ok(pathData, 'A usable clip path must be published');
  const tokens = pathData.match(/[MLAZ]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi);
  const result = []; let contour;
  const lengths = { M: 2, L: 2, A: 7, Z: 0 };
  for (let index = 0; index < tokens.length;) {
    const command = tokens[index++].toUpperCase();
    assert.ok(command in lengths, `Unexpected SVG command ${command}`);
    const values = tokens.slice(index, index + lengths[command]).map(Number); index += lengths[command];
    assert.ok(values.every(Number.isFinite));
    if (command === 'M') { contour = { points: [], arcs: [], curves: [], closed: false }; result.push(contour); }
    if (command === 'Z') contour.closed = true;
    else {
      const end = values.slice(-2);
      if (command === 'A') {
        contour.arcs.push(values.slice(0, 2));
        contour.curves.push({ radii: values.slice(0, 2), start: contour.points.at(-1), end });
      }
      contour.points.push(end);
    }
  }
  assert.ok(result.every(item => item.closed), 'Both boundaries must be closed');
  return result;
}
function close(actual, expected, message) { assert.ok(Math.abs(actual - expected) <= .002, `${message || 'geometry'}: expected ${expected}, got ${actual}`); }
function extent(contour) {
  return [Math.min(...contour.points.map(p => p[0])), Math.min(...contour.points.map(p => p[1])), Math.max(...contour.points.map(p => p[0])), Math.max(...contour.points.map(p => p[1]))];
}
function extentsEqual(contour, expected) { extent(contour).forEach((value, index) => close(value, expected[index], 'contour extent')); }
function radiiEqual(contour, expected) {
  const sort = pairs => [...pairs].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const actual = sort(contour.arcs), target = sort(expected);
  assert.equal(actual.length, target.length);
  actual.forEach((pair, index) => pair.forEach((value, axis) => close(value, target[index][axis], 'corner radius')));
}
function cornerRadii(contour) {
  const [left, top, right, bottom] = extent(contour);
  const result = {};
  for (const curve of contour.curves) {
    const endpoints = [curve.start, curve.end];
    const hasX = x => endpoints.some(point => Math.abs(point[0] - x) < .002);
    const hasY = y => endpoints.some(point => Math.abs(point[1] - y) < .002);
    const name = (hasY(top) ? 'top' : hasY(bottom) ? 'bottom' : '') + (hasX(left) ? 'Left' : hasX(right) ? 'Right' : '');
    result[name] = curve.radii;
  }
  return result;
}

test('manual attention glow retains a fractional 1.5px ring in untransformed layout coordinates', () => {
  const f = fixture();
  const { card, layer } = f.addManual({ width: 300.25, height: 156.5, stroke: 1.5, scale: 1.7, radii: Array(4).fill('24px 18px') });
  layer.style.setProperty('--card-glow-angle', '145'); layer.style.setProperty('--card-glow-active', '.68');
  f.start();
  const [outer, inner] = contours(layer);
  extentsEqual(outer, [0, 0, 300.25, 156.5]); extentsEqual(inner, [1.5, 1.5, 298.75, 155]);
  radiiEqual(outer, Array(4).fill([24, 18])); radiiEqual(inner, Array(4).fill([22.5, 16.5]));
  assert.equal(card.querySelectorAll('.backer-card-glow-layer').length, 1);
  assert.equal(layer.style.getPropertyValue('--card-glow-angle'), '145');
  assert.equal(layer.style.getPropertyValue('--card-glow-active'), '.68');
});

test('four independent elliptical and percentage corners resolve each axis before insetting', () => {
  const f = fixture();
  const { layer } = f.addManual({ width: 240, height: 120, stroke: 3, radii: ['10% 25%', '36px 12px', '20% 10%', '12px 24px'] });
  f.start();
  const [outer, inner] = contours(layer);
  radiiEqual(outer, [[24, 30], [36, 12], [48, 12], [12, 24]]);
  radiiEqual(inner, [[21, 27], [33, 9], [45, 9], [9, 21]]);
  assert.deepEqual(cornerRadii(outer), { topRight: [36, 12], bottomRight: [48, 12], bottomLeft: [12, 24], topLeft: [24, 30] });
  assert.deepEqual(cornerRadii(inner), { topRight: [33, 9], bottomRight: [45, 9], bottomLeft: [9, 21], topLeft: [21, 27] });
});

test('oversized corners obey the CSS overlap clamp while preserving the fractional inner boundary', () => {
  const f = fixture();
  const { layer } = f.addManual({ width: 100, height: 60, stroke: 1.5, radii: Array(4).fill('100% 100%') });
  f.start();
  const [outer, inner] = contours(layer);
  radiiEqual(outer, Array(4).fill([50, 30])); radiiEqual(inner, Array(4).fill([48.5, 28.5]));
  extentsEqual(inner, [1.5, 1.5, 98.5, 58.5]);
});

test('a square edge does not collapse the rounded corners on the opposite edge', () => {
  const f = fixture();
  const { layer } = f.addManual({ width: 120, height: 80, stroke: 1.5, radii: ['0px', '0px', '20px', '20px'] });
  f.start();
  const [outer, inner] = contours(layer);
  radiiEqual(outer, [[20, 20], [20, 20]]); radiiEqual(inner, [[18.5, 18.5], [18.5, 18.5]]);
  extentsEqual(outer, [0, 0, 120, 80]); extentsEqual(inner, [1.5, 1.5, 118.5, 78.5]);
});

test('closed and expanded details use the entire card dimensions while retaining a summary-hosted layer', () => {
  const f = fixture();
  const card = f.body.appendChild(new f.Element('details', 'research-gateway', { width: 620, height: 146, stroke: 3, radii: Array(4).fill('18px') }));
  const summary = card.appendChild(new f.Element('summary'));
  // Native details can resolve an inherited summary/layer radius to zero. The
  // decoration still belongs to the rounded details card, including when open.
  summary.computedRadii = Array(4).fill('0px');
  f.start();
  const layer = summary.querySelector('.backer-card-glow-layer');
  assert.ok(layer);
  assert.equal(f.window.getComputedStyle(summary).borderTopLeftRadius, '0px');
  assert.equal(f.window.getComputedStyle(layer).borderTopLeftRadius, '0px');
  const [closedOuter, closedInner] = contours(layer);
  extentsEqual(closedOuter, [0, 0, 620, 146]);
  radiiEqual(closedOuter, Array(4).fill([18, 18]));
  radiiEqual(closedInner, Array(4).fill([15, 15]));
  f.resize(card, { height: 612 });
  const [openOuter, openInner] = contours(layer);
  extentsEqual(openOuter, [0, 0, 620, 612]);
  extentsEqual(openInner, [3, 3, 617, 609]);
  radiiEqual(openOuter, Array(4).fill([18, 18]));
  radiiEqual(openInner, Array(4).fill([15, 15]));
  assert.equal(layer.parentNode, summary);
});

test('dynamic card replacement restores one layer and recomputes geometry for the resized card', () => {
  const f = fixture();
  const card = f.body.appendChild(new f.Element('div', 'surface', { width: 320, height: 180, stroke: 1.5 }));
  f.start();
  const layer = card.querySelector('.backer-card-glow-layer');
  assert.ok(layer);
  layer.remove();
  Object.assign(card.metrics, { width: 460, height: 210 });
  f.mutate([], [layer]);
  f.window.BackerCardGlow.refresh(); f.flush();
  assert.equal(card.querySelectorAll('.backer-card-glow-layer').length, 1);
  assert.equal(layer.parentNode, card);
  extentsEqual(contours(layer)[0], [0, 0, 460, 210]);
});

test('a manual layer that becomes visible receives geometry on its first nonzero resize', () => {
  const f = fixture();
  const { card, layer } = f.addManual({ width: 0, height: 0, stroke: 1.5 });
  f.start();
  assert.doesNotMatch(layer.style.getPropertyValue('--card-glow-clip'), /NaN|Infinity/);
  f.resize(card, { width: 320, height: 188 });
  extentsEqual(contours(layer)[0], [0, 0, 320, 188]);
});

test('new manual layers are discovered after startup and detached layers are released', () => {
  const f = fixture();
  f.start();
  const { card, layer } = f.addManual({ width: 555, height: 156, stroke: 1.5 });
  f.mutate([card]);
  extentsEqual(contours(layer)[0], [0, 0, 555, 156]);
  assert.ok(f.resizeObservers.some(observer => observer.targets.has(layer)));
  const replacement = card.appendChild(new f.Element('span', 'backer-card-glow-layer'));
  layer.remove();
  f.mutate([replacement], [layer]);
  extentsEqual(contours(replacement)[0], [0, 0, 555, 156]);
  assert.ok(f.resizeObservers.every(observer => !observer.targets.has(layer)));
  assert.equal(card.querySelectorAll('.backer-card-glow-layer').length, 1);
});
