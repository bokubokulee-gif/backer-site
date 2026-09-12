'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const ARTIFACT_SOURCE = fs.readFileSync(path.join(ROOT, 'scripts/build-pages-artifact.mjs'), 'utf8');
const PUBLIC_FILES_SOURCE = ARTIFACT_SOURCE.match(/const PUBLIC_FILES = Object\.freeze\(\[([\s\S]*?)\]\);/);
assert.ok(PUBLIC_FILES_SOURCE, 'the Pages build must expose its public file allowlist');
const PUBLIC_HTML = Array.from(PUBLIC_FILES_SOURCE[1].matchAll(/'([^']+\.html)'/g), (match) => match[1])
  .sort();
const DOCK_SOURCE = fs.readFileSync(path.join(ROOT, 'js/backer-dock.js'), 'utf8');

function occurrences(source, expression) {
  return Array.from(source.matchAll(expression)).length;
}

test('every public Backer HTML page mounts exactly one shared dock and no legacy dock', () => {
  assert.ok(PUBLIC_HTML.includes('research-lab/index.html'), 'the inventory must include nested research pages');
  assert.ok(PUBLIC_HTML.includes('admin/analytics/index.html'), 'the inventory must include the published admin entry');
  assert.ok(PUBLIC_HTML.includes('research-lab/attention-simulatoin.html'), 'the inventory must include published redirect aliases');

  for (const file of PUBLIC_HTML) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const styles = Array.from(source.matchAll(/<link\b[^>]*\bhref=["']([^"']*css\/backer-dock\.css(?:\?[^"']*)?)["'][^>]*>/g));
    const scripts = Array.from(source.matchAll(/<script\b[^>]*\bsrc=["']([^"']*js\/backer-dock\.js(?:\?[^"']*)?)["'][^>]*>/g));
    assert.equal(styles.length, 1, `${file} must load the shared dock stylesheet exactly once`);
    assert.equal(scripts.length, 1, `${file} must load the shared dock script exactly once`);
    for (const [match, expected] of [[styles[0], 'css/backer-dock.css'], [scripts[0], 'js/backer-dock.js']]) {
      const resolved = new URL(match[1], `https://example.test/backer-site/${file}`);
      assert.equal(resolved.origin, 'https://example.test', `${file} must use the local shared dock asset`);
      assert.equal(resolved.pathname, `/backer-site/${expected}`, `${file} must resolve ${expected} from the site root`);
      assert.ok(fs.existsSync(path.join(ROOT, expected)), `${file} must reference an existing ${expected}`);
    }
    assert.equal(
      occurrences(source, /<div\b[^>]*\bdata-backer-dock(?:\s|=|>)[^>]*>/g),
      1,
      `${file} must expose exactly one shared dock mount`
    );
    const hasLegacyDock = Array.from(source.matchAll(/<nav\b[^>]*\bclass=(["'])([^"']*)\1[^>]*>/gi))
      .some((match) => match[2].split(/\s+/).includes('dock'));
    assert.equal(hasLegacyDock, false, `${file} must not retain legacy nav.dock markup`);

    const mountAt = source.indexOf('data-backer-dock');
    const scriptAt = source.indexOf('js/backer-dock.js');
    assert.ok(mountAt >= 0 && scriptAt > mountAt, `${file} must create the mount before loading the dock script`);
  }
});

// Exercise the real startup code without a browser. The mock only supplies the
// layout/event surfaces used at startup; link markup and active state come from
// the component itself, so nested URL regressions remain observable.
function mountDock(pageURL, siteURL, { embedded = false } = {}) {
  const mounted = [];
  function element() {
    const attributes = new Map();
    const controls = new Map();
    const node = {
      attributes,
      style: { setProperty() {} },
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      offsetWidth: 320,
      offsetHeight: 56,
      setAttribute(name, value) { attributes.set(name, String(value)); },
      removeAttribute(name) { attributes.delete(name); },
      toggleAttribute(name, force) { if (force) attributes.set(name, ''); else attributes.delete(name); },
      addEventListener() {},
      appendChild(child) { mounted.push(child); },
      remove() {},
      contains() { return false; },
      getBoundingClientRect() { return { left: 0, top: 0, right: 320, bottom: 56, width: 320, height: 56 }; },
      querySelector(selector) {
        if (!controls.has(selector)) controls.set(selector, element());
        return controls.get(selector);
      },
      querySelectorAll(selector) {
        assert.equal(selector, '[data-route]');
        if (!node.links) {
          node.links = Array.from((node.innerHTML || '').matchAll(/<a\b([^>]+)>/g), (match) => {
            const link = element();
            for (const attribute of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) link.setAttribute(attribute[1], attribute[2]);
            link.dataset = { route: link.attributes.get('data-route') };
            return link;
          });
        }
        return node.links;
      }
    };
    return node;
  }
  const location = new URL(pageURL);
  const body = element();
  const document = {
    body,
    documentElement: element(),
    currentScript: { src: new URL('js/backer-dock.js?v=test', siteURL).href },
    readyState: 'complete',
    createElement: element,
    querySelector(selector) { return selector === '[data-backer-dock]' ? body : null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    dispatchEvent() {}
  };
  const window = { location, addEventListener() {} };
  window.self = window;
  window.top = embedded ? {} : window;
  vm.runInNewContext(DOCK_SOURCE, {
    document, window, location, URL, URLSearchParams,
    innerWidth: 1280, innerHeight: 800,
    localStorage: { getItem() { return null; }, setItem() {} },
    getComputedStyle() { return { getPropertyValue() { return ''; } }; },
    MutationObserver: class { observe() {} },
    CustomEvent: class {},
    requestAnimationFrame() { return 1; },
    setTimeout, clearTimeout
  }, { filename: 'backer-dock.js' });
  return mounted.filter((node) => node.className === 'backer-float-dock');
}

test('shared dock links resolve from the deployment root on public and nested routes', () => {
  for (const siteURL of ['https://bokubokulee-gif.github.io/backer-site/', 'http://localhost:4213/']) {
    for (const route of ['pitch.html', 'pitch2.html', 'research-lab/index.html', 'research-lab/method.html', 'admin/analytics/index.html']) {
      const docks = mountDock(new URL(route, siteURL).href, siteURL);
      assert.equal(docks.length, 1, `${siteURL}${route} must mount one shared dock`);
      const links = docks[0].querySelectorAll('[data-route]');
      assert.deepEqual(Object.fromEntries(links.map((link) => [link.dataset.route, link.attributes.get('href')])), {
        search: new URL('backerdemo.html#search', siteURL).href,
        discovery: new URL('backerdemo.html#market2', siteURL).href,
        home: new URL('backerdemo.html', siteURL).href,
        trades: new URL('backerdemo.html#trades', siteURL).href,
        portfolio: new URL('portfolio.html', siteURL).href
      }, `${route} must not send navigation into its own nested directory`);
    }
  }
});

test('shared dock active state belongs to app routes, not nested index pages or unrelated anchors', () => {
  const siteURL = 'https://bokubokulee-gif.github.io/backer-site/';
  const cases = [
    ['', 'home'], ['index.html', 'home'], ['backerdemo.html', 'home'],
    ['backerdemo.html#search', 'search'], ['backerdemo.html?view=search', 'search'],
    ['backerdemo.html#market2', 'discovery'], ['backerdemo.html#trades', 'trades'],
    ['backerdemo.html#market', 'trades'], ['backerdemo.html#market-archive', ''],
    ['backermarket.html', 'trades'], ['backermarket.html?source=market-archive', ''],
    ['backercreate.html', 'discovery'], ['portfolio.html', 'portfolio'],
    ['pitch.html#market2', ''], ['research-lab/', ''], ['research-lab/index.html', ''],
    ['research-lab/index.html#trades', ''], ['research-lab/method.html?view=search', ''],
    ['admin/analytics/index.html', ''], ['admin/analytics/index.html#search', '']
  ];
  for (const [route, expected] of cases) {
    const dock = mountDock(new URL(route, siteURL).href, siteURL)[0];
    const active = dock.querySelectorAll('[data-route]').filter((link) => link.attributes.get('aria-current') === 'page');
    assert.deepEqual(active.map((link) => link.dataset.route), expected ? [expected] : [], route || 'site root');
  }
});

test('shared dock does not duplicate outer navigation inside an embedded preview', () => {
  const siteURL = 'https://bokubokulee-gif.github.io/backer-site/';
  assert.equal(mountDock(new URL('backerdemo.html#trades', siteURL).href, siteURL, { embedded: true }).length, 0);
});

test('the public router keeps Trades canonical and preserves the pre-Trades demo archive', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const dock = fs.readFileSync(path.join(ROOT, 'js', 'backer-dock.js'), 'utf8');
  const artifact = fs.readFileSync(path.join(ROOT, 'scripts', 'build-pages-artifact.mjs'), 'utf8');
  const demoPage = fs.readFileSync(path.join(ROOT, 'backerdemo.html'), 'utf8');
  const detailPage = fs.readFileSync(path.join(ROOT, 'backermarket.html'), 'utf8');

  assert.match(app, /\^#trades\(\?:\\\?\|\$\)/, 'the public router must recognize #trades');
  assert.match(app, /\^#market-archive\(\?:\\\?\|\$\)[\s\S]*go\('market-archive'\)/, '#market-archive must render the preserved demo board');
  assert.match(app, /\^#market\(\?:\\\?\|\$\)[\s\S]*go\('trades'\)/, '#market must render Trades');
  assert.match(app, /js\/market-archive\.js/, 'the archived view must use an independent script');
  assert.match(app, /css\/market-archive\.css/, 'the archived view must use an independent stylesheet');
  assert.match(artifact, /'js\/market-archive\.js'/, 'the archived script must ship in the Pages artifact');
  assert.match(artifact, /'css\/market-archive\.css'/, 'the archived stylesheet must ship in the Pages artifact');
  assert.match(demoPage, /js\/app\.js\?v=[\w.-]+/, 'the public router must carry a cache key');
  assert.match(detailPage, /js\/market-detail-page\.js\?v=20260822-archive-1/, 'the archive return route must carry a new cache key');
  assert.match(dock, /linkHTML\('trades',\s*'backerdemo\.html#trades'/, 'the shared dock must link directly to canonical Trades');
  assert.match(dock, /\^#market-archive[\s\S]*return ''/, 'the archive must not claim the active Trades menu item');
  assert.match(dock, /\^#market\(\?:\\\?\|\$\)[\s\S]*return 'trades'/, 'the #market alias must still identify canonical Trades');
});

test('the shared dock yields to exclusive dialogs without disabling navigation globally', () => {
  const dock = fs.readFileSync(path.join(ROOT, 'js', 'backer-dock.js'), 'utf8');
  const styles = fs.readFileSync(path.join(ROOT, 'css', 'backer-dock.css'), 'utf8');

  assert.match(dock, /dialog\[open\], \[aria-modal="true"\]/, 'exclusive dialogs must participate in dock collision detection');
  assert.match(dock, /new MutationObserver\(scheduleModalCollisionCheck\)/, 'dock collision state must follow dynamically rendered dialogs');
  assert.match(dock, /dock\.toggleAttribute\('inert', yielding\)/, 'the dock must yield semantically while a modal owns interaction');
  assert.match(styles, /\.backer-float-dock\.is-yielding-to-modal\s*\{[\s\S]*visibility:\s*hidden/, 'yielding must remove the dock from the modal hit area');
  assert.doesNotMatch(styles, /body\.(?:is-modal-open|drawer-open)[^\{]*\{[^\}]*pointer-events:\s*none/, 'navigation must not rely on a global pointer-events suppression hack');
});
