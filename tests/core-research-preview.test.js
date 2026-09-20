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
  assert.match(page, /Trading Behavior Research Preview/);
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
  const labStylesheet = labPage.match(/\.\/assets\/(styles-[^"']+\.css)/)?.[1];
  const labScriptAsset = labPage.match(/\.\/assets\/(lab-[^"']+\.js)/)?.[1];

  assert.match(labPage, /img\/backer-mark\.png/);
  assert.match(labPage, /class="backer-home-link" href="\.\.\/research\.html"/);
  for (const page of [methodPage, thesisPage]) {
    assert.match(page, /class="paper-brand"/);
    assert.match(page, /img\/backer-mark\.png/);
    assert.match(page, /<article>/);
    assert.match(page, /class="paper-body"/);
    assert.match(page, /class="paper-sources"/);
    assert.doesNotMatch(page, /assets\/(?:thesis-[^"']+|method-public-v1)\.js/);
  }
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
  assert.ok(labStylesheet);
  assert.ok(labScriptAsset);
  const labStyles = read(path.join('research-lab/assets', labStylesheet));
  const labScript = read(path.join('research-lab/assets', labScriptAsset));
  assert.match(labStyles, /--muted-deep:\s*#918b82/);
  assert.match(labStyles, /font-size:10\.5px/);
  for (const clarityMarker of [
    'FORECAST WORKBENCH',
    'Attention Field',
    'OBSERVED',
    'SIMULATED',
    'NOT A REAL-WORLD OUTCOME',
    'NOT YET OBSERVED',
  ]) {
    assert.match(labPage, new RegExp(clarityMarker));
  }
  assert.match(labPage, /class="graph-stage-labels"/);
  assert.match(labPage, /id="zoom-level"/);
  assert.match(labPage, /DRAG TO ORBIT/);
  assert.match(labPage, /SCROLL \/ PINCH TO DOLLY/);
  assert.match(labPage, /ORBIT · DOLLY · PAN · CLICK TO INSPECT/);
  assert.match(labStyles, /--workbench-w/);
  assert.match(labStyles, /\.graph-stage-labels/);
  assert.match(labScript, /Could see it/);
  assert.match(labScript, /Spread the signal/);
  assert.match(labScript, /width < 560/);
  assert.match(labScript, /function pointWorldPosition/);
  assert.match(labScript, /function projectWorld/);
  assert.match(labScript, /camera\.yaw/);
  assert.match(labScript, /camera\.pitch/);
  assert.match(labScript, /cameraDepth/);
  assert.match(labScript, /sort\(\(first, second\) => second\.cameraDepth - first\.cameraDepth\)/);
  assert.match(labScript, /mode: event\.shiftKey[^\n]+\? 'pan' : 'orbit'/);
  assert.match(labScript, /tick: 1, playing: true/);
  assert.match(labScript, /state\.motionTime \+= elapsed \* state\.speed/);
  assert.match(labScript, /state\.tick %= REPLAY_END/);
  assert.match(labScript, /context\.lineDashOffset = -state\.motionTime/);
  assert.match(labScript, /canvas\.dataset\.motion = state\.playing \? 'running' : 'paused'/);
  assert.match(labScript, /addEventListener\('wheel'/);
  assert.match(labScript, /addEventListener\('pointerdown'/);
  assert.match(labScript, /beginPinch/);
  assert.match(labScript, /data-focus-stage/);
  assert.match(labScript, /if \(state\.tick >= REPLAY_END\) state\.tick = 1/);
  assert.match(labScript, /state\.tick = state\.tick >= REPLAY_END \? 1/);
  for (const reviewedPublicArtifact of [
    'research-lab/index.html',
    'research-lab/assets/lab-public-v1.js',
    'research-lab/assets/lab-public-v2.css',
    'research-lab/assets/research-papers.js',
    'research-lab/data/real-market-snapshot.json',
  ]) {
    assert.match(artifactBuilder, new RegExp(`'${reviewedPublicArtifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
  assert.doesNotMatch(artifactBuilder, /'research-lab\/data\/agents\.json\.gz'/);
  assert.doesNotMatch(artifactBuilder, /PUBLIC_DIRECTORIES|copyPublicDirectory/);
});
