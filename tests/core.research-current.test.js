'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/research-current-renderer.js'), 'utf8');

function makeRenderer() {
  let operations = [];
  let head = null;
  const stack = [];
  const finite = values => values.forEach(value => assert.ok(Number.isFinite(value), `Nonfinite drawing argument: ${value}`));
  const gradient = () => ({ addColorStop(offset) { finite([offset]); assert.ok(offset >= 0 && offset <= 1); } });
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    createLinearGradient(...values) { finite(values); return gradient(); },
    beginPath() { operations.push(['begin']); },
    moveTo(...values) { finite(values); operations.push(['move', ...values]); },
    lineTo(...values) { finite(values); operations.push(['line', ...values]); },
    stroke() {
      finite([this.globalAlpha, this.lineWidth]);
      operations.push(['stroke', this.globalAlpha, this.lineWidth]);
    },
    drawImage(image, x, y, width, height) {
      finite([x, y, width, height, this.globalAlpha]);
      head = { x: x + width / 2, y: y + height / 2, alpha: this.globalAlpha };
      operations.push(['halo', x, y, width, height, this.globalAlpha]);
    },
    save() { stack.push({ globalAlpha: this.globalAlpha, globalCompositeOperation: this.globalCompositeOperation }); },
    restore() { assert.ok(stack.length); Object.assign(this, stack.pop()); },
  };
  const document = {
    createElement() {
      return { getContext: () => ({ createRadialGradient(...values) { finite(values); return gradient(); }, fillRect(...values) { finite(values); } }) };
    },
  };
  const create = vm.runInNewContext(
    source.replace('export function createCurrentRenderer', 'function createCurrentRenderer') + '\ncreateCurrentRenderer;',
    { document },
  );
  const render = create(ctx);
  return (...args) => {
    operations = [];
    head = null;
    render(...args);
    assert.equal(stack.length, 0);
    assert.equal(ctx.globalCompositeOperation, 'source-over');
    return { operations, head };
  };
}

function wireAt(seconds) {
  // An upward wire continuously stretches as its particle anchor drifts.
  const bottom = 550 + 40 * Math.sin(seconds * .4);
  const top = -250;
  return [100, bottom, 100, bottom + (top - bottom) / 3, 100, bottom + (top - bottom) * 2 / 3, 100, top];
}

test('Current continues upward after many cycles on a wire whose length changes', () => {
  for (const mobile of [false, true]) {
    const draw = makeRenderer();
    let previous = null;
    let visibleTransitions = 0;
    for (let frame = 0; frame <= 240 * 60; frame++) {
      const elapsed = frame / 60;
      const { head } = draw(...wireAt(elapsed), elapsed, .37, 1, mobile, 0);
      const visible = point => point && point.y > 30 && point.y < 500 && point.alpha > .25;
      // A completed pulse returns below the viewport; never compare across that gap.
      if (visible(head) && visible(previous)) {
        assert.ok(head.y <= previous.y + .0001, `Current reversed at ${elapsed}s (${mobile ? 'mobile' : 'desktop'})`);
        visibleTransitions++;
      }
      previous = head;
    }
    assert.ok(visibleTransitions > 3000, 'The test must cover many visible flights and wraps');
  }
});

test('Constant elapsed time gives identical current geometry and brightness', () => {
  const draw = makeRenderer();
  for (const mobile of [false, true]) {
    const args = [...wireAt(2), 2, .37, .8, mobile, 5];
    const paused = draw(...args);
    assert.ok(paused.operations.length > 0);
    draw(...wireAt(170), 170, .73, .8, mobile, 2);
    assert.deepEqual(draw(...args), paused);
  }
  assert.deepEqual(draw(0, 0, 0, 0, 0, 0, 0, 0, 1, .3, 1, false, 0), { operations: [], head: null });
});
