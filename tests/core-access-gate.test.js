'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policy = require('../js/access-gate');
const BASE = 'https://example.test/backer-site/backerdemo.html';

function element(attributes = {}, parent = null) {
  return {
    parent, attributes,
    getAttribute(name) { return Object.hasOwn(attributes, name) ? attributes[name] : null; },
    hasAttribute(name) { return Object.hasOwn(attributes, name); },
    matches(selectors) {
      return selectors.split(',').some(selector => {
        selector = selector.trim();
        if (selector === 'button' || selector === 'a') return attributes.tag === selector;
        if (selector === 'a[href]') return attributes.tag === 'a' && this.hasAttribute('href');
        if (selector.startsWith('#')) return attributes.id === selector.slice(1);
        const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
        return match && this.hasAttribute(match[1]) && (match[2] === undefined || attributes[match[1]] === match[2]);
      });
    },
    closest(selectors) { return this.matches(selectors) ? this : this.parent?.closest(selectors) || null; }
  };
}
function browserHarness(href = BASE, embedded = false) {
  const events = {}, routes = [], url = new URL(href);
  const location = {
    href, hash: url.hash, search: url.search, pathname: url.pathname,
    assign(to) { routes.push({ to, replace: false, top: false }); },
    replace(to) { routes.push({ to, replace: true, top: false }); }
  };
  const root = {
    location,
    document: {
      currentScript: { src: 'https://example.test/backer-site/js/access-gate.js?v=1' },
      addEventListener(type, listener, capture) { events[type] = { listener, capture }; }
    },
    addEventListener(type, listener) { events[type] = { listener }; },
    get localStorage() { throw new Error('Access policy must not treat device storage as authorization'); }
  };
  root.top = embedded ? { location: { assign(to) { routes.push({ to, replace: false, top: true }); }, replace(to) { routes.push({ to, replace: true, top: true }); } } } : root;
  policy.install(root);
  function fire(type, target, props = {}) {
    const event = { type, target, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...props };
    events[type].listener(event);
    return event;
  }
  return { root, events, routes, fire };
}

test('Portfolio, position deep links, side deep links and custom creation require waitlist', () => {
  const cases = [
    ['portfolio.html', 'portfolio'], ['portfolio.html?legacy=1&mode=creator', 'portfolio'],
    ['backerdemo.html#portfolio', 'portfolio'], ['backerdemo.html?view=portfolio', 'portfolio'],
    ['backerdemo.html#trades?view=positions', 'portfolio'],
    ['backerdemo.html#trades?view=profiles&subject=one&side=back', 'trade'],
    ['backerdemo.html#trades?view=contents&subject=one&side=FADE', 'trade'],
    ['backercreate.html#draft?person=one', 'create'],
    ['backerdemo.html#trades?view=proposals', 'create']
  ];
  for (const [route, reason] of cases) assert.equal(policy.reasonForURL(route, BASE), reason, route);
});

test('public events, subject detail, source links, filters, search and waitlist remain open', () => {
  const routes = [
    'backerdemo.html#trades', 'backerdemo.html#trades?view=profiles&subject=one',
    'backerdemo.html#trades?view=contents&q=ai&page=2', 'backerdemo.html#market2?person=one',
    'backerdemo.html#search?q=creator', 'backermarket.html?market=cooper&source=market-archive',
    'backermarket.html?draft=existing', 'pitch.html#market', 'waitlist.html?source=portfolio',
    'https://external.example/portfolio.html'
  ];
  for (const route of routes) assert.equal(policy.reasonForURL(route, BASE), '', route);
  assert.equal(policy.reasonForElement(element({ 'data-m2-trade': 'person', href: 'backerdemo.html#trades?view=profiles&subject=one', tag: 'a' }), BASE), '');
  assert.equal(policy.reasonForElement(element({ 'data-market-open': 'one', tag: 'button' }), BASE), '');
  assert.equal(policy.reasonForElement(element({ 'data-mkt-watch': 'one', tag: 'button' }), BASE), '');
});

test('mouse, keyboard and middle-click stop commitment handlers before they run', () => {
  const actions = [
    ['data-mkt-trade', 'BACK'], ['data-mkt-trade', 'FADE'], ['data-ticket-confirm', ''],
    ['data-back-creator', 'cooper'], ['data-confirm', 'cooper'], ['data-position', 'cooper'],
    ['data-confirm-pos', 'cooper'], ['data-order', ''], ['data-confirm-order', ''],
    ['data-trade-side', 'BUY'], ['data-trade-side', 'SELL'], ['data-side', 'LONG'],
    ['data-quote-action', 'SELL'], ['data-mkt-draft', ''], ['data-m2-create', 'person']
  ];
  for (const [attribute, value] of actions) {
    for (const [type, props] of [['click', {}], ['keydown', { key: 'Enter' }], ['keydown', { key: ' ' }], ['auxclick', { button: 1 }]]) {
      const harness = browserHarness();
      const button = element({ [attribute]: value, tag: 'button' });
      const event = harness.fire(type, element({}, button), props);
      assert.equal(event.prevented, true, `${attribute} ${type}`);
      assert.equal(event.stopped, true);
      assert.equal(harness.events[type].capture, true);
      assert.match(harness.routes[0].to, /\/backer-site\/waitlist\.html\?source=(trade|create)$/);
    }
  }
});

test('Portfolio navigation, reload, hashchange and history navigation remain locked', () => {
  const cold = browserHarness(`${BASE}#trades?view=positions`);
  assert.equal(cold.routes[0].replace, true);
  assert.match(cold.routes[0].to, /source=portfolio$/);
  const live = browserHarness();
  const click = live.fire('click', element({ tag: 'a', href: 'portfolio.html?mode=creator' }));
  assert.equal(click.prevented, true);
  live.root.location.href = `${BASE}#portfolio`;
  live.fire('hashchange');
  live.fire('popstate');
  assert.equal(live.routes.length, 3);
  assert.ok(live.routes.every(route => /waitlist\.html\?source=portfolio$/.test(route.to)));
});

test('embedded actions use the outer page and repeated registration never unlocks trading', () => {
  const harness = browserHarness(BASE, true);
  assert.equal(harness.root.BackerAccessGate.requireWaitlist('trade'), true);
  assert.equal(harness.root.BackerAccessGate.requireWaitlist('trade'), true);
  assert.equal(harness.routes.length, 2);
  assert.ok(harness.routes.every(route => route.top && /source=trade$/.test(route.to)));
  assert.equal(Object.isFrozen(harness.root.BackerAccessGate), true);
});

function marketHarness(hash = '#trades', missingGate = false) {
  const routes = [], writes = [], listeners = {};
  const target = { dataset: {}, innerHTML: '', addEventListener(type, fn) { listeners[type] = fn; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  const root = {
    BackerTradeCatalog: { load: async () => ({ people: [], contents: [], counts: { people: 0, contents: 0 } }) },
    BackerMarketDraftStore: { list: () => [] },
    localStorage: { getItem() { return null; }, setItem(...args) { writes.push(args); }, removeItem(...args) { writes.push(args); } },
    location: { hash, href: `${BASE}${hash}`, pathname: '/backer-site/backerdemo.html', search: '' },
    history: { replaceState() {} }, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame(fn) { fn(); }
  };
  if (!missingGate) root.BackerAccessGate = { requireWaitlist(reason) { routes.push(reason); return true; } };
  const document = { getElementById() { return null; }, querySelector() { return null; }, head: { appendChild() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/market.js'), 'utf8'), { window: root, document, URL, URLSearchParams, Intl, Set, Map, Number, String, Math, Date, isFinite, encodeURIComponent });
  root.BackerMarket.render(target);
  return { routes, writes, target, listeners };
}

test('Trades delegates fail closed before tickets or writes, independently of capture interception', async () => {
  for (const missingGate of [false, true]) {
    const harness = marketHarness('#trades', missingGate);
    await new Promise(resolve => setImmediate(resolve));
    for (const attrs of [
      { 'data-mkt-trade': 'BACK', 'data-subject-kind': 'profile', 'data-subject-id': 'one' },
      { 'data-mkt-trade': 'FADE', 'data-subject-kind': 'content', 'data-subject-id': 'two' },
      { 'data-ticket-confirm': '' }, { 'data-mkt-draft': '' }
    ]) {
      harness.listeners.click({ target: element({ tag: 'button', ...attrs }), preventDefault() {} });
    }
    assert.deepEqual(harness.routes, missingGate ? [] : ['trade', 'trade', 'trade', 'create']);
    assert.deepEqual(harness.writes, []);
    assert.doesNotMatch(harness.target.innerHTML, /mkt-ticket-layer/);
  }
});

test('Trades direct position view does not mount a portfolio', () => {
  const harness = marketHarness('#trades?view=positions');
  assert.deepEqual(harness.routes, ['portfolio']);
  assert.equal(harness.target.innerHTML, '');
  assert.deepEqual(harness.writes, []);
});
