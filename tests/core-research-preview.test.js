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
  const publicFieldPresenter = path.join(ROOT, 'research-lab/assets/lab-public-v1.js');
  const rawPopulation = path.join(ROOT, 'research-lab/data/agents.json');
  const unusedFallback = path.join(ROOT, 'research-lab/data/events-fallback.json');
  const thesisAsset = fs.readdirSync(path.join(ROOT, 'research-lab/assets'))
    .find((file) => /^thesis-.*\.js$/.test(file));
  const contentStylesheet = fs.readdirSync(path.join(ROOT, 'research-lab/assets'))
    .find((file) => /^content-.*\.css$/.test(file));
  const labStylesheet = labPage.match(/\.\/assets\/(styles-[^"']+\.css)/)?.[1];
  const labScriptAsset = labPage.match(/\.\/assets\/(lab-[^"']+\.js)/)?.[1];

  assert.match(labPage, /img\/backer-mark\.png/);
  for (const page of [labPage, methodPage, thesisPage]) {
    assert.match(page, /class="backer-home-link" href="\.\.\/"/);
  }
  assert.match(methodPage, /class="content-brand-mark"[^>]*><img src="\.\/img\/backer-mark\.png"/);
  assert.match(thesisPage, /class="content-brand-mark"[^>]*><img src="\.\/img\/backer-mark\.png"/);
  assert.match(methodPage, /Continuous Learning of Human Attention and Experiments/);
  for (const sourceAsset of ['kalshi.png', 'polymarket.png', 'mastodon.svg', 'interviews.svg']) {
    assert.match(methodPage, new RegExp(`img\\/sources\\/${sourceAsset.replace('.', '\\.')}`));
    assert.equal(fs.existsSync(path.join(ROOT, 'research-lab/img/sources', sourceAsset)), true);
  }
  assert.doesNotMatch(methodPage, /content-brand-mark[^\n]*<i>/);
  assert.doesNotMatch(thesisPage, /content-brand-mark[^\n]*<i>/);
  assert.deepEqual(
    fs.readFileSync(path.join(ROOT, 'img/backer-mark.png')),
    fs.readFileSync(path.join(ROOT, 'research-lab/img/backer-mark.png')),
  );
  assert.match(labPage, /PMXT · PUBLIC SNAPSHOT/);
  assert.match(labPage, /RESEARCH PREVIEW/);
  assert.doesNotMatch(labPage, />[^<]*SYNTHETIC[^<]*</i);
  assert.equal(snapshot.normalizationLayer, 'UnifiedMarket@2.17.1');
  assert.equal(snapshot.provider.id, 'pmxt');
  assert.equal(fs.existsSync(compressedPopulation), false);
  assert.equal(fs.existsSync(publicFieldPresenter), true);
  assert.equal(fs.existsSync(rawPopulation), false);
  assert.equal(fs.existsSync(unusedFallback), false);
  assert.ok(thesisAsset);
  assert.ok(contentStylesheet);
  assert.ok(labStylesheet);
  assert.ok(labScriptAsset);
  const thesisScript = read(path.join('research-lab/assets', thesisAsset));
  const contentStyles = read(path.join('research-lab/assets', contentStylesheet));
  assert.doesNotMatch(thesisScript, /synthetic/i);
  for (const revisedCopy of [
    'Predicting human attention flow',
    'Attention is a flow, accumulates to asset',
    'Payment is an outcome',
    'What we learn from Prediction Markets',
    'Backer keeps those disciplines:',
    'Lab predicts',
    'What does discover attention flow early mean to us?',
    'Cause and effect in the data loop',
    'Prediction can change the future for the better',
    'Simulations learn continuously, like humans',
    'Inspirations',
  ]) {
    assert.match(thesisScript, new RegExp(revisedCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(contentStyles, /font-size:11\.5px/);
  assert.match(contentStyles, /font:500 10px\/1\.45 Manrope/);
  assert.match(contentStyles, /font-size:clamp\(44px,12\.2vw,60px\)/);
  assert.match(contentStyles, /h2#inspirations/);
  assert.match(contentStyles, /scroll-margin-top:178px/);
  const labStyles = read(path.join('research-lab/assets', labStylesheet));
  const labScript = read(path.join('research-lab/assets', labScriptAsset));
  assert.match(labStyles, /--muted-deep:\s*#918b82/);
  assert.match(labStyles, /font-size:10\.5px/);
  for (const clarityMarker of [
    'FORECAST WORKBENCH',
    'ATTENTION GRAPH',
    'OBSERVED',
    'SIMULATED',
    'NOT A REAL-WORLD OUTCOME',
    'NOT YET OBSERVED',
  ]) {
    assert.match(labPage, new RegExp(clarityMarker));
  }
  assert.match(labPage, /class="graph-stage-labels"/);
  assert.match(labStyles, /--workbench-w/);
  assert.match(labStyles, /\.graph-stage-labels/);
  assert.match(labScript, /Could see it/);
  assert.match(labScript, /Spread the signal/);
  assert.match(labScript, /width < 560/);
  for (const reviewedPublicArtifact of [
    'research-lab/index.html',
    'research-lab/assets/lab-public-v1.js',
    'research-lab/assets/method-public-v1.js',
    'research-lab/data/real-market-snapshot.json',
  ]) {
    assert.match(artifactBuilder, new RegExp(`'${reviewedPublicArtifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
  assert.doesNotMatch(artifactBuilder, /'research-lab\/data\/agents\.json\.gz'/);
  assert.doesNotMatch(artifactBuilder, /PUBLIC_DIRECTORIES|copyPublicDirectory/);
});
