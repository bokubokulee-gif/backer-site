#!/usr/bin/env node

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(process.argv[2] || '');

const PUBLIC_FILES = Object.freeze([
  '.nojekyll',
  'index.html',
  'backercreate.html',
  'backerdemo.html',
  'backermarket.html',
  'backerthesis.html',
  'faq.html',
  'onboarding.html',
  'pitch.html',
  'portfolio.html',
  'privacy.html',
  'research.html',
  'signup.html',
  'thesis.html',
  'thesisd.html',
  'thesisdd.html',
  'thesiss.html',
  'thesisss.html',
  'waitlist.html',
  'css/analytics.css',
  'css/app-pages.css',
  'css/backer-dock.css',
  'css/bubble-text.css',
  'css/faq.css',
  'css/footer.css',
  'css/liquid-glass.css',
  'css/market-builder.css',
  'css/market-community.css',
  'css/market-detail-page.css',
  'css/market.css',
  'css/market2.css',
  'css/onboarding.css',
  'css/poa-terminal.css',
  'css/research.css',
  'css/search.css',
  'css/signup-refine.css',
  'css/site-menu.css',
  'css/styles.css',
  'css/theme.css',
  'css/thesis.css',
  'css/waitlist.css',
  'js/analytics-core.js',
  'js/analytics.js',
  'js/app.js',
  'js/backer-dock.js',
  'js/bubble-text.js',
  'js/data.js',
  'js/discovery-catalog-client.js',
  'js/faq-page.js',
  'js/flickering-footer.js',
  'js/globe-live.mjs',
  'js/liquid-glass.js',
  'js/market-builder.js',
  'js/market-community.js',
  'js/market-data.js',
  'js/market-draft-store.js',
  'js/market-detail-page.js',
  'js/market.js',
  'js/market2-data.js',
  'js/market2.js',
  'js/onboarding.js',
  'js/poa-preview.js',
  'js/poa-terminal.js',
  'js/research.js',
  'js/sections.js',
  'js/shader.js',
  'js/site-menu.js',
  'js/theme.js',
  'js/thesis.js',
  'js/waitlist.js',
  'js/vendor/cobe.mjs',
  'data/discovery-catalog.json',
  'data/market2-people.json',
  'img/backer-mark.png',
  'img/pitch/altman.jpg',
  'img/pitch/andreessen.jpg',
  'img/pitch/creator.jpg',
  'img/pitch/dorsey.jpg',
  'img/pitch/kalshi.png',
  'img/pitch/karpathy.jpeg',
  'img/pitch/karpathy.png',
  'img/pitch/meta.png',
  'img/pitch/polymarket.png'
]);

if (!process.argv[2] || destination === ROOT || destination === path.parse(destination).root) {
  throw new Error('Choose a dedicated empty Pages artifact directory');
}

await mkdir(destination, { recursive: true });
if ((await readdir(destination)).length) throw new Error('Pages artifact directory must be empty');

for (const relativePath of PUBLIC_FILES) {
  const source = path.join(ROOT, relativePath);
  if (!(await stat(source)).isFile()) throw new Error(`Missing allowlisted public file: ${relativePath}`);
  const target = path.join(destination, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}

console.log(`Built allowlisted Pages artifact with ${PUBLIC_FILES.length} files.`);
