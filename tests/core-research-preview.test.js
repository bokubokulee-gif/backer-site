'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('Research entry opens the dedicated preview with Backer interaction states', () => {
  const page = read('research.html');
  const styles = read('css/research.css');
  const behavior = read('js/research.js');

  assert.match(page, /href="research-lab\/"/);
  assert.match(page, />\s*Research Preview\s*</);
  assert.doesNotMatch(page, /coming soon/i);
  assert.match(page, /img\/backer-mark\.png/);
  assert.match(styles, /\.research-preview:focus-visible/);
  assert.match(styles, /body\.is-launching/);
  assert.match(behavior, /data-research-preview/);
});

test('Published Lab carries the Backer mark and the bounded PMXT layer', () => {
  const labPage = read('research-lab/index.html');
  const methodPage = read('research-lab/method.html');
  const thesisPage = read('research-lab/thesis.html');
  const snapshot = JSON.parse(read('research-lab/data/real-market-snapshot.json'));
  const artifactBuilder = read('scripts/build-pages-artifact.mjs');
  const compressedPopulation = path.join(ROOT, 'research-lab/data/agents.json.gz');
  const rawPopulation = path.join(ROOT, 'research-lab/data/agents.json');
  const unusedFallback = path.join(ROOT, 'research-lab/data/events-fallback.json');
  const thesisAsset = fs.readdirSync(path.join(ROOT, 'research-lab/assets'))
    .find((file) => /^thesis-.*\.js$/.test(file));
  const contentStylesheet = fs.readdirSync(path.join(ROOT, 'research-lab/assets'))
    .find((file) => /^content-.*\.css$/.test(file));
  const labStylesheet = fs.readdirSync(path.join(ROOT, 'research-lab/assets'))
    .find((file) => /^styles-.*\.css$/.test(file));

  assert.match(labPage, /img\/backer-mark\.png/);
  for (const page of [labPage, methodPage, thesisPage]) {
    assert.match(page, /class="backer-home-link" href="\.\.\/"/);
  }
  assert.match(methodPage, /class="content-brand-mark"[^>]*><img src="\.\/img\/backer-mark\.png"/);
  assert.match(thesisPage, /class="content-brand-mark"[^>]*><img src="\.\/img\/backer-mark\.png"/);
  assert.doesNotMatch(methodPage, /content-brand-mark[^\n]*<i>/);
  assert.doesNotMatch(thesisPage, /content-brand-mark[^\n]*<i>/);
  assert.deepEqual(
    fs.readFileSync(path.join(ROOT, 'img/backer-mark.png')),
    fs.readFileSync(path.join(ROOT, 'research-lab/img/backer-mark.png')),
  );
  assert.match(labPage, /PMXT · CONNECTING/);
  assert.match(labPage, /RESEARCH PREVIEW/);
  assert.doesNotMatch(labPage, />[^<]*SYNTHETIC[^<]*</i);
  assert.equal(snapshot.normalizationLayer, 'UnifiedMarket@2.17.1');
  assert.equal(snapshot.provider.id, 'pmxt');
  assert.equal(fs.existsSync(compressedPopulation), true);
  assert.equal(fs.existsSync(rawPopulation), false);
  assert.equal(fs.existsSync(unusedFallback), false);
  assert.ok(thesisAsset);
  assert.ok(contentStylesheet);
  assert.ok(labStylesheet);
  assert.doesNotMatch(read(path.join('research-lab/assets', thesisAsset)), /synthetic/i);
  assert.match(read(path.join('research-lab/assets', contentStylesheet)), /font-size:11\.5px/);
  assert.match(read(path.join('research-lab/assets', contentStylesheet)), /font:500 10px\/1\.45 Manrope/);
  assert.match(read(path.join('research-lab/assets', labStylesheet)), /--muted-deep:\s*#918b82/);
  assert.match(read(path.join('research-lab/assets', labStylesheet)), /font-size:10\.5px/);
  assert.match(artifactBuilder, /'research-lab'/);
});
