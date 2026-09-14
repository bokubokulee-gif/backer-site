'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '../js/site-menu.js'), 'utf8');
const DESTINATIONS = [
  'backerdemo.html#market2',
  'backerdemo.html#trades',
  'backerdemo.html#search',
  'waitlist.html?source=portfolio',
  'research.html',
  'backerthesis.html',
  'pitch.html',
  'faq.html',
  'privacy.html'
];

// Supply only the DOM methods used during startup. Capture the complete markup
// assigned by the real build() path; do not reconstruct navigation from source.
function renderMenu(siteURL, page, { deferred = false } = {}) {
  const controls = new Map();
  function control(key) {
    if (!controls.has(key)) controls.set(key, {
      dataset: {}, textContent: '', hidden: false,
      classList: { add() {}, remove() {} },
      addEventListener() {}, setAttribute() {}, focus() {},
      querySelector(selector) { return control(`${key} ${selector}`); },
      querySelectorAll() { return []; },
      contains() { return false; }
    });
    return controls.get(key);
  }
  const host = {
    innerHTML: '',
    querySelector(selector) { return control(selector); },
    closest(selector) { return selector === 'header' ? control('header') : null; }
  };
  const documentListeners = new Map();
  const location = new URL(page, siteURL);
  const document = {
    currentScript: { src: new URL('js/site-menu.js?v=20260914-host-1', siteURL).href },
    readyState: deferred ? 'loading' : 'complete',
    body: control('body'),
    querySelectorAll(selector) {
      assert.equal(selector, '[data-backer-site-menu]');
      return [host];
    },
    addEventListener(type, callback) { documentListeners.set(type, callback); }
  };
  const window = {
    location,
    matchMedia() { return { matches: false, addEventListener() {} }; },
    requestAnimationFrame(callback) { callback(); },
    setTimeout() { return 1; }
  };
  vm.runInNewContext(SOURCE, { window, document, URL, URLSearchParams });
  if (deferred) {
    assert.equal(host.innerHTML, '', 'rendering waits for DOMContentLoaded');
    // currentScript is unavailable inside a later DOMContentLoaded callback.
    document.currentScript = null;
    documentListeners.get('DOMContentLoaded')();
  }
  assert.match(host.innerHTML, /backer-menu__rail/, 'desktop navigation must render');
  assert.match(host.innerHTML, /backer-menu__sheet/, 'mobile navigation must render');
  const links = Array.from(host.innerHTML.matchAll(/<a\b([^>]*\bhref="([^"]+)"[^>]*)>/g), match => ({
    href: match[2],
    current: /\baria-current="page"/.test(match[1]),
    attributes: match[1]
  }));
  assert.equal(links.length, 19, 'desktop, mobile, direct Research and launch links must all be captured');
  return { markup: host.innerHTML, links };
}

function assertNavigation(siteURL, result) {
  const root = new URL(siteURL);
  const expected = DESTINATIONS.map(route => new URL(route, siteURL).href).sort();
  assert.deepEqual([...new Set(result.links.map(link => link.href))].sort(), expected);
  for (const link of result.links) {
    const target = new URL(link.href);
    assert.equal(target.origin, root.origin, `${link.href} must stay on the current deployment host`);
    assert.ok(target.pathname.startsWith(root.pathname), `${link.href} must retain the deployment mount prefix`);
  }
  const counts = Object.fromEntries(expected.map(href => [href, result.links.filter(link => link.href === href).length]));
  for (const route of DESTINATIONS) {
    assert.equal(counts[new URL(route, siteURL).href], route === 'backerdemo.html#trades' ? 3 : 2,
      `${route} must be correct in both desktop and mobile navigation`);
  }
}

for (const { label, root, page } of [
  { label: 'Vercel root', root: 'https://backer-preview.vercel.app/', page: 'pitch.html?release=test#market' },
  { label: 'GitHub mount', root: 'https://bokubokulee-gif.github.io/backer-site/', page: 'backerdemo.html#home' },
  { label: 'nested GitHub page', root: 'https://bokubokulee-gif.github.io/backer-site/', page: 'research-lab/method.html' },
  { label: 'nested Vercel page', root: 'https://backer-preview.vercel.app/', page: 'admin/analytics/index.html' },
  { label: 'localhost root', root: 'http://127.0.0.1:4221/', page: 'pitch2.html#market' },
  { label: 'localhost mounted preview', root: 'http://localhost:4221/backer-preview/', page: 'research-lab/index.html' }
]) {
  test(`site menu uses the actual host and mount prefix on ${label}`, () => {
    assertNavigation(root, renderMenu(root, page));
  });
}

test('deferred menu startup retains the script mount after currentScript disappears', () => {
  const root = 'https://backer-preview.vercel.app/';
  assertNavigation(root, renderMenu(root, 'research-lab/index.html', { deferred: true }));
});

test('Trades and Discovery hashes remain intact, with correct current-state links', () => {
  const root = 'https://backer-preview.vercel.app/';
  for (const [view, query] of [['trades', '?view=contents&page=2'], ['market2', '?person=creator-one'], ['search', '?q=research']]) {
    const result = renderMenu(root, `backerdemo.html#${view}${query}`);
    assertNavigation(root, result);
    const current = result.links.filter(link => link.current);
    assert.equal(current.length, 2, 'desktop and mobile copies both mark the current product route');
    assert.ok(current.every(link => link.href === `${root}backerdemo.html#${view}`));
  }
});
