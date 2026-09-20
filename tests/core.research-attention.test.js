'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('Research scroll story sits below its H1 and above the original interactive Research content', () => {
  const page = read('research.html');
  const heading = page.indexOf('id="research-title"');
  const experience = page.indexOf('class="attention-experience"');
  const continuation = page.indexOf('class="research-continuation"');
  const robot = page.indexOf('id="research-robot"');
  assert.ok(heading >= 0 && heading < experience && experience < continuation && continuation < robot);
  assert.equal([...page.matchAll(/<h1\b/g)].length, 1);
  assert.equal([...page.matchAll(/id="attention-canvas"/g)].length, 1);
  for (const hook of ['data-backer-site-menu', 'data-backer-dock', 'data-orbit-runner', 'data-research-actions', 'data-research-preview']) {
    assert.ok(page.includes(hook), `Missing original Research hook: ${hook}`);
  }
  assert.match(page, /src="js\/research\.js(?:\?|"|$)/);
  assert.match(page, /src="js\/research-robot\.mjs(?:\?|"|$)/);
  const summaries = [...page.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g)].map(match => match[1]);
  assert.equal(summaries.length, 2);
  assert.match(summaries[0], /See How it Works/);
  assert.match(summaries[1], /Simulation Research Preview/);
  for (const summary of summaries) assert.doesNotMatch(summary, /gateway-toggle|>\s*\+\s*</);
  for (const route of ['simulation.html', 'research-lab/', 'research-lab/attention-flow.html', 'research-lab/attention-simulation.html']) {
    assert.ok(page.includes(`href="${route}"`), `Original Research route missing: ${route}`);
  }
});

test('Embedded experience uses the requested copy without its standalone page chrome', () => {
  const page = read('research.html');
  const experience = page.slice(page.indexOf('class="attention-experience"'), page.indexOf('class="research-continuation"'));
  assert.match(experience, /We simulate a world configured to accumulated human attention and decision makings\./);
  assert.doesNotMatch(experience, /<header\b|<footer\b|<h1\b|motion-toggle|scene-label|Explore the model|Experience again/);
  assert.match(experience, /aria-label="Previous step"/);
  assert.match(experience, /aria-label="Next step"/);
  assert.equal([...experience.matchAll(/class="caption" data-step=/g)].length, 3);
});

test('Every local attention module, stylesheet dependency and font is included in the public artifact', () => {
  const builder = read('scripts/build-pages-artifact.mjs');
  const list = builder.match(/const PUBLIC_FILES = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(list, 'Public artifact must retain an explicit file allowlist');
  const allowed = new Set([...list[1].matchAll(/'([^']+)'/g)].map(match => match[1]));
  const page = read('research.html');
  const queue = [...page.matchAll(/(?:href|src)="((?:css|js)\/research-(?:attention|gateway)[^"?]*)(?:\?[^" ]*)?"/g)].map(match => match[1]);
  assert.ok(queue.some(name => name.endsWith('.js')) && queue.some(name => name.endsWith('.css')));
  const seen = new Set();
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    assert.ok(allowed.has(name), `${name} is missing from the public artifact`);
    assert.ok(fs.statSync(path.join(ROOT, name)).isFile(), `${name} is missing from source`);
    if (!/\.(?:css|m?js)$/.test(name)) continue;
    const source = read(name);
    const references = name.endsWith('.css')
      ? [...source.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(match => match[1])
      : [...source.matchAll(/\b(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const reference of references) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
      const local = path.posix.normalize(path.posix.join(path.posix.dirname(name), reference.split(/[?#]/)[0]));
      queue.push(local);
    }
  }
  assert.ok(seen.has('js/research-attention-scene.js'), 'Scene import was not traversed');
  assert.equal([...seen].filter(name => name.startsWith('fonts/attention/')).length, 4);
});
