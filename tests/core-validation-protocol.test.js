'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('Reading styles are delivered after page styles on every refined Lab surface', () => {
  for (const file of ['validation.html', 'attention-flow.html']) {
    const page = read(`research-lab/${file}`);
    const styles = [...page.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(match => match[0]);
    const readingIndex = styles.findIndex(style => /assets\/readability-v1\.css/.test(style));
    assert.ok(readingIndex >= 0, `${file} must load the shared reading styles`);
    const pageStyles = styles.filter(style => !/css\/(?:backer-dock|i18n)\.css/.test(style));
    assert.match(pageStyles.at(-1), file === 'attention-flow.html' ? /assets\/research-notes-20260920\.css/ : /assets\/readability-v1\.css/,
      `${file} must apply reading styles after all Lab page styles`);
    const languageIndex = styles.findIndex(style => /css\/i18n\.css/.test(style));
    assert.ok(languageIndex > readingIndex,
      `${file} must apply language typography after the shared reading defaults`);
  }
  assert.match(read('scripts/build-pages-artifact.mjs'), /'research-lab\/assets\/readability-v1\.css'/);
  const method = read('research-lab/method.html');
  assert.match(method, /assets\/research-papers\.css/);
  assert.ok(method.indexOf('assets/research-papers.css') < method.indexOf('css/i18n.css'), 'paper typography precedes language typography');
});

test('Validation protocol separates the current population from the unstarted study', () => {
  const page = read('research-lab/validation.html');
  assert.match(page, /Today: 5,000 modeled agents/);
  assert.match(page, /consented trader study, not yet started/);
  assert.match(page, /No participant-linked histories/);
  assert.match(page, /participants set by power analysis/);
  assert.match(page, /No inference across this line/);
  for (const stage of ['sampling', 'interviews', 'repeat', 'holdouts', 'randomized', 'calibration', 'subgroups']) {
    assert.match(page, new RegExp(`href="#${stage}"`));
    assert.match(page, new RegExp(`id="${stage}"`));
  }
  assert.equal((page.match(/class="protocol-record"/g) || []).length, 7);
  assert.match(page, /human randomization unit, assignment, spillover assumptions/);
  assert.match(page, /2411\.10109v1/);
});

test('Both previews and Method have working local navigation to the new research pages', () => {
  const method = read('research-lab/method.html');
  assert.match(method, /href="\.\/validation\.html"/);
  assert.match(method, /href="\.\/attention-flow\.html"/);
  assert.match(read('research.html'), /href="research-lab\/attention-flow\.html"/);
  assert.match(read('research-lab/index.html'), /href="\.\/attention-flow\.html"/);
  for (const file of ['research-lab/validation.html', 'research-lab/attention-flow.html']) {
    const page = read(file);
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${file} must not duplicate IDs`);
    for (const [, url] of page.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
      if (/^(https?:|data:)/.test(url)) continue;
      const target = path.resolve(ROOT, path.dirname(file), url.split(/[?#]/)[0]);
      assert.equal(fs.existsSync(target), true, `${file} missing ${url}`);
    }
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `${file} missing anchor ${id}`);
  }
});

test('Attention Flow declares the fixture boundary beside its controls and proposed study', () => {
  const page = read('research-lab/attention-flow.html');
  assert.match(page, /RESEARCH PREVIEW 02/);
  assert.match(page, /data-agent-count="5000"/);
  assert.match(page, /0 LIVE \/ 6 PLANNED/);
  assert.match(page, /All values in this preview are authored examples/);
  assert.match(page, /animates 5,000 anonymous markers over authored scenarios/);
  assert.match(page, /A fitted model would require dated observations, explicit sampling weights and later outcomes withheld from development/);
  assert.match(page, /consented diaries, browser-data donations/);
  assert.match(page, /Agent Reach/);
  assert.match(page, /MiroFish \/ OASIS/);
  assert.equal((page.match(/role="radiogroup"/g) || []).length, 2);
  assert.equal((page.match(/role="radio"/g) || []).length, 6);
  assert.doesNotMatch(page, /Observed fixture|PUBLIC SIGNAL FIXTURE/);
  assert.doesNotMatch(read('research-lab/assets/attention-flow-public-v1.js'), /\bfetch\s*\(|XMLHttpRequest|\.\/data\/agents|localStorage|sessionStorage/);
});
