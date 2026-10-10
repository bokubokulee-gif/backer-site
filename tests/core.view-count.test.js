const assert = require('node:assert/strict');
const { test } = require('node:test');
const core = require('../js/backer-view-count-core.js');

test('preserves the historical schedule and October 10 anchor', () => {
  assert.equal(core.countAt('2026-08-19'), 2305);
  assert.equal(core.countAt('2026-08-20'), 2305);
  assert.equal(core.countAt('2026-10-09'), 2555);
  assert.equal(core.countAt('2026-10-10'), 2560);
  assert.equal(core.countAt('2026-10-10T23:59:59.999Z'), 2560);
  assert.equal(core.countAt('2026-10-11'), 2560 + core.dailyIncrement('2026-10-11'));
});

test('daily increments remain between 6 and 23 and exactly recur for 20 years', () => {
  let previous = core.BASE;
  const observed = new Set();
  for (let day = 1; day <= 365 * 20; day++) {
    const at = core.ANCHOR_UTC + day * core.DAY_MS;
    const addition = core.dailyIncrement(at);
    const value = core.countAt(at);
    assert.ok(Number.isInteger(addition) && addition >= 6 && addition <= 23);
    assert.equal(value, previous + addition);
    previous = value;
    observed.add(addition);
  }
  assert.equal(observed.size, 18);
});

test('counts are identical across times and timezone representations of a UTC day', () => {
  const value = core.countAt('2026-10-11T00:00:00.000Z');
  assert.equal(value, core.countAt('2026-10-11T08:00:00+08:00'));
  assert.equal(value, core.countAt('2026-10-10T17:00:00-07:00'));
  assert.equal(value, core.countAt('2026-10-11T23:59:59.999Z'));
  assert.equal(core.countAt('2026-10-11T07:59:59+08:00'), 2560);
});

test('fresh consumers and out-of-order requests get the same cumulative schedule', () => {
  const values = ['2036-06-29', '2026-10-12', '2030-01-01'].map(core.countAt);
  delete require.cache[require.resolve('../js/backer-view-count-core.js')];
  const fresh = require('../js/backer-view-count-core.js');
  assert.deepEqual(['2036-06-29', '2026-10-12', '2030-01-01'].map(fresh.countAt), values);
});

test('rejects invalid or timezone-ambiguous inputs instead of displaying NaN', () => {
  for (const value of ['garbage', '2026-02-30', '2026-10-11T01:00:00', Infinity, NaN, new Date(NaN)]) {
    assert.throws(() => core.countAt(value), RangeError);
  }
  assert.throws(() => core.countAt({}), TypeError);
});

test('formats the reference count and schedules UTC midnight correctly', () => {
  assert.equal(core.formatCount(core.BASE), '2,560 views');
  assert.equal(core.millisecondsUntilNextDay('2026-10-10T23:59:59.000Z'), 1100);
  assert.equal(core.millisecondsUntilNextDay('2026-10-11T08:00:00+08:00'), core.DAY_MS + 100);
});

test('shared renderer adopts existing badges, refreshes on wake, and cleans up timers', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const listeners = new Map();
  const timers = new Map();
  const attributes = new Map();
  const classes = new Set(['backer-view-count']);
  let nextTimer = 0;
  let now = Date.UTC(2026, 9, 10, 23, 59, 59);
  const badge = {
    textContent: 'old', hidden: true,
    classList: { add: (...values) => values.forEach(v => classes.add(v)), remove: (...values) => values.forEach(v => classes.delete(v)) },
    setAttribute: (name, value) => attributes.set(name, value),
  };
  const eventTarget = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name) => listeners.delete(name),
  };
  const document = {
    ...eventTarget, readyState: 'complete', visibilityState: 'visible', currentScript: null,
    querySelectorAll: selector => selector === '[data-backer-view-count], .backer-view-count' ? [badge] : [],
  };
  const window = {
    ...eventTarget,
    BackerViewCountCore: { ...core, countAt: value => core.countAt(value == null ? now : value), millisecondsUntilNextDay: () => core.millisecondsUntilNextDay(now) },
    setTimeout: (handler, delay) => { const id = ++nextTimer; timers.set(id, {handler, delay}); return id; },
    clearTimeout: id => timers.delete(id),
  };
  const source = fs.readFileSync(require.resolve('../js/backer-view-count.js'), 'utf8');
  vm.runInNewContext(source, {window, document});
  assert.equal(badge.textContent, '2,560 views');
  assert.equal(attributes.get('data-source'), 'scheduled_display');
  assert.match(attributes.get('aria-label'), /not measured traffic/);
  assert.equal(badge.title, core.DISCLOSURE);
  assert.equal(timers.size, 1);
  assert.equal([...timers.values()][0].delay, 1100);
  const api = window.BackerViewCount;
  vm.runInNewContext(source, {window, document});
  assert.equal(window.BackerViewCount, api);
  assert.equal(timers.size, 1);
  now = Date.UTC(2026, 9, 12, 15);
  listeners.get('focus')();
  assert.equal(badge.textContent, core.formatCount(core.countAt(now)));
  assert.equal(timers.size, 1);
  api.stop();
  assert.equal(timers.size, 0);
  assert.equal(listeners.size, 0);
});

test('every published nonredirect HTML route has one set of correctly relative counter assets', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { spawnSync } = require('node:child_process');
  const root = path.resolve(__dirname, '..');
  const builder = fs.readFileSync(path.join(root, 'scripts/build-pages-artifact.mjs'), 'utf8');
  const manifest = builder.match(/const PUBLIC_FILES = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(manifest, 'the public allowlist remains inspectable');
  const pages = [...manifest[1].matchAll(/^\s*'([^']+\.html)',?$/gm)].map(match => match[1]);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'backer-counter-build-'));
  const output = path.join(temporary, 'public');
  let checked = 0;
  try {
    const built = spawnSync(process.execPath, ['scripts/build-pages-artifact.mjs', output], { cwd: root, encoding: 'utf8' });
    assert.equal(built.status, 0, built.stdout + built.stderr);
    for (const page of pages) {
      const html = fs.readFileSync(path.join(output, page), 'utf8');
      if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) continue;
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
      assert.ok(head, `${page}: has a head`);
      const tags = [...head.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(match => match[0]);
      for (const asset of ['js/backer-view-count-core.js', 'js/backer-view-count.js', 'css/backer-view-count.css']) {
        const matching = tags.filter(tag => tag.includes(asset));
        assert.equal(matching.length, 1, `${page}: exactly one ${asset}`);
        const reference = matching[0].match(/\b(?:src|href)=["']([^"']+)["']/)?.[1];
        assert.ok(reference && !reference.startsWith('/'), `${page}: a relative asset path`);
        assert.equal(path.posix.normalize(path.posix.join(path.posix.dirname(page), reference.split('?')[0])), asset, `${page}: ${asset} resolves at the site root`);
      }
      assert.ok(head.indexOf('backer-view-count-core.js') < head.indexOf('backer-view-count.js'), `${page}: core loads before UI`);
      assert.match(tags.find(tag => tag.includes('js/backer-view-count.js')), /\bdefer\b/, `${page}: UI waits for parsed HTML`);
      checked++;
    }
    assert.ok(checked >= 25, `checked ${checked} current nonredirect routes`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('asset injection is idempotent and retains authored page body', async () => {
  const { addViewCountAssets } = await import('../scripts/view-count-assets.mjs');
  const source = '<html><head data-theme="dark"><title>Backer</title></head><body><header>Brand</header><main>Page</main></body></html>';
  for (const page of ['backerdemo.html', 'research-lab/method.html', 'admin/analytics/index.html']) {
    const first = addViewCountAssets(source, page);
    assert.equal(addViewCountAssets(first, page), first);
    assert.equal(first.slice(first.indexOf('</head>')), source.slice(source.indexOf('</head>')));
    assert.equal((first.match(/data-backer-view-assets/g) || []).length, 1);
  }
});
