'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

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
  assert.match(method, /class="method-protocol-link" href="\.\/validation\.html"/);
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
  assert.match(page, /does not run 5,000 language-model agents/);
  assert.match(page, /target environment is 5,000 generative agents/);
  assert.match(page, /opt-in audience panel/);
  assert.match(page, /Agent Reach/);
  assert.match(page, /MiroFish \/ OASIS/);
  assert.equal((page.match(/role="radiogroup"/g) || []).length, 2);
  assert.equal((page.match(/role="radio"/g) || []).length, 6);
  assert.doesNotMatch(page, /Observed fixture|PUBLIC SIGNAL FIXTURE/);
  assert.doesNotMatch(read('research-lab/assets/attention-flow-public-v1.js'), /\bfetch\s*\(|XMLHttpRequest|\.\/data\/agents|localStorage|sessionStorage/);
});
