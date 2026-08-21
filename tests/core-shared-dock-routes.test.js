'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_HTML = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name)
  .sort();

function occurrences(source, expression) {
  return Array.from(source.matchAll(expression)).length;
}

test('every public Backer HTML page mounts exactly one shared dock and no legacy dock', () => {
  assert.ok(PUBLIC_HTML.length >= 18, 'the public page inventory should not silently shrink');

  for (const file of PUBLIC_HTML) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.equal(
      occurrences(source, /(?:href=["'][^"']*css\/backer-dock\.css(?:\?[^"']*)?["'])/g),
      1,
      `${file} must load the shared dock stylesheet exactly once`
    );
    assert.equal(
      occurrences(source, /<div\b[^>]*\bdata-backer-dock(?:\s|=|>)[^>]*>/g),
      1,
      `${file} must expose exactly one shared dock mount`
    );
    assert.equal(
      occurrences(source, /(?:src=["'][^"']*js\/backer-dock\.js(?:\?[^"']*)?["'])/g),
      1,
      `${file} must load the shared dock script exactly once`
    );
    const hasLegacyDock = Array.from(source.matchAll(/<nav\b[^>]*\bclass=(["'])([^"']*)\1[^>]*>/gi))
      .some((match) => match[2].split(/\s+/).includes('dock'));
    assert.equal(hasLegacyDock, false, `${file} must not retain legacy nav.dock markup`);

    const mountAt = source.indexOf('data-backer-dock');
    const scriptAt = source.indexOf('js/backer-dock.js');
    assert.ok(mountAt >= 0 && scriptAt > mountAt, `${file} must create the mount before loading the dock script`);
  }
});

test('the public router keeps Trades canonical and supports both legacy market hashes', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const dock = fs.readFileSync(path.join(ROOT, 'js', 'backer-dock.js'), 'utf8');

  assert.match(app, /\^#trades\(\?:\\\?\|\$\)/, 'the public router must recognize #trades');
  assert.match(app, /\^#market-archive\(\?:\\\?\|\$\)[\s\S]*go\('trades'\)/, '#market-archive must render Trades');
  assert.match(app, /\^#market\(\?:\\\?\|\$\)[\s\S]*go\('trades'\)/, '#market must render Trades');
  assert.match(dock, /linkHTML\('trades',\s*'backerdemo\.html#trades'/, 'the shared dock must link directly to canonical Trades');
  assert.match(dock, /\^#market\(\?:-archive\)\?/, 'the dock active-route resolver must treat both legacy hashes as Trades');
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
