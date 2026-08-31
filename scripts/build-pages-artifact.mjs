#!/usr/bin/env node

import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import { auditPublicArtifact, formatAudit, inspectPublicText } from './audit-public-artifact.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(process.argv[2] || '');

const PUBLIC_FILES = Object.freeze([
  '.nojekyll',
  'index.html',
  'admin/analytics/index.html',
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
  'css/admin-analytics.css',
  'css/analytics.css',
  'css/app-pages.css',
  'css/backer-dock.css',
  'css/bubble-text.css',
  'css/faq.css',
  'css/footer.css',
  'css/liquid-glass.css',
  'css/market-builder.css',
  'css/market-archive.css',
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
  'css/trades-portfolio.css',
  'css/waitlist.css',
  'js/admin-analytics.js',
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
  'js/market-archive.js',
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
  'js/search-engine.js',
  'js/sections.js',
  'js/shader.js',
  'js/site-menu.js',
  'js/theme.js',
  'js/thesis.js',
  'js/trades-catalog-model.js',
  'js/trades-portfolio.js',
  'js/trades-position-store.js',
  'js/waitlist.js',
  'js/vendor/cobe.mjs',
  'data/discovery-catalog.json',
  'data/landing-preview.json',
  'data/market2-people.json',
  'data/trades-eligible-accounts.json',
  'img/backer-mark.png',
  'img/pitch/altman.jpg',
  'img/pitch/andreessen.jpg',
  'img/pitch/creator.jpg',
  'img/pitch/dorsey.jpg',
  'img/pitch/kalshi.png',
  'img/pitch/karpathy.jpeg',
  'img/pitch/karpathy.png',
  'img/pitch/meta.png',
  'img/pitch/polymarket.png',
  'licenses/cobe-MIT.txt',
  'research-lab/assets/content-CYtyA-wJ.css',
  'research-lab/assets/dm-mono-latin-400-normal--0xN8mdc.woff',
  'research-lab/assets/dm-mono-latin-400-normal-4GdczIuU.woff2',
  'research-lab/assets/dm-mono-latin-ext-400-normal-1aZr6b2b.woff',
  'research-lab/assets/dm-mono-latin-ext-400-normal-C2zvOubV.woff2',
  'research-lab/assets/lab-public-v1.js',
  'research-lab/assets/lab-public-v2.css',
  'research-lab/assets/manrope-cyrillic-400-normal-BMzJvInZ.woff2',
  'research-lab/assets/manrope-cyrillic-400-normal-Dvx59UGC.woff',
  'research-lab/assets/manrope-cyrillic-500-normal-B1OEZity.woff2',
  'research-lab/assets/manrope-cyrillic-500-normal-CNwnNrRC.woff',
  'research-lab/assets/manrope-cyrillic-600-normal-DvRl3Mj-.woff2',
  'research-lab/assets/manrope-cyrillic-600-normal-It4mZcQk.woff',
  'research-lab/assets/manrope-greek-400-normal-CM4qok81.woff2',
  'research-lab/assets/manrope-greek-400-normal-DuX9RsAR.woff',
  'research-lab/assets/manrope-greek-500-normal-DyxYGEtJ.woff',
  'research-lab/assets/manrope-greek-500-normal-GeMIHyWm.woff2',
  'research-lab/assets/manrope-greek-600-normal-BoRV6lzK.woff2',
  'research-lab/assets/manrope-greek-600-normal-CF2i9ZRY.woff',
  'research-lab/assets/manrope-latin-400-normal-8tf8FM3T.woff',
  'research-lab/assets/manrope-latin-400-normal-PaqtzbVb.woff2',
  'research-lab/assets/manrope-latin-500-normal-BYYD-dBL.woff2',
  'research-lab/assets/manrope-latin-500-normal-DMZssgOp.woff',
  'research-lab/assets/manrope-latin-600-normal-4f0koTD-.woff2',
  'research-lab/assets/manrope-latin-600-normal-BqgrALkZ.woff',
  'research-lab/assets/manrope-latin-ext-400-normal-C-X6QNXX.woff',
  'research-lab/assets/manrope-latin-ext-400-normal-CMDvPJRp.woff2',
  'research-lab/assets/manrope-latin-ext-500-normal-EtoS1VaI.woff',
  'research-lab/assets/manrope-latin-ext-500-normal-dm74KBQw.woff2',
  'research-lab/assets/manrope-latin-ext-600-normal-_gBojHdJ.woff2',
  'research-lab/assets/manrope-latin-ext-600-normal-u5Pl7hTU.woff',
  'research-lab/assets/manrope-vietnamese-400-normal-D7E_mLGF.woff',
  'research-lab/assets/manrope-vietnamese-400-normal-DHb3EETF.woff2',
  'research-lab/assets/manrope-vietnamese-500-normal-DCXiE_xi.woff2',
  'research-lab/assets/manrope-vietnamese-500-normal-DaZ8i3XM.woff',
  'research-lab/assets/manrope-vietnamese-600-normal-C1J5PCl_.woff2',
  'research-lab/assets/manrope-vietnamese-600-normal-lA7a_7Ok.woff',
  'research-lab/assets/method-public-v1.js',
  'research-lab/assets/styles-B29Xo75-.js',
  'research-lab/assets/styles-D6FYb-UD.css',
  'research-lab/assets/thesis-6jy8lxCE.js',
  'research-lab/data/real-market-snapshot.json',
  'research-lab/img/backer-mark.png',
  'research-lab/img/sources/interviews.svg',
  'research-lab/img/sources/kalshi.png',
  'research-lab/img/sources/mastodon.svg',
  'research-lab/img/sources/polymarket.png',
  'research-lab/index.html',
  'research-lab/method.html',
  'research-lab/thesis.html'
]);

if (!process.argv[2] || destination === ROOT || destination === path.parse(destination).root) {
  throw new Error('Choose a dedicated empty Pages artifact directory');
}

const destinationParent = path.dirname(destination);
const destinationName = path.basename(destination);
await mkdir(destinationParent, { recursive: true });

let destinationExists = false;
try {
  const destinationInfo = await stat(destination);
  if (!destinationInfo.isDirectory()) throw new Error('Pages artifact destination must be a directory');
  if ((await readdir(destination)).length) throw new Error('Pages artifact directory must be empty');
  destinationExists = true;
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const stagingDirectory = await mkdtemp(path.join(destinationParent, `.${destinationName}.staging-`));

async function writePublicFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  if (!(await stat(source)).isFile()) throw new Error(`Missing allowlisted public file: ${relativePath}`);
  const target = path.join(stagingDirectory, relativePath);
  await mkdir(path.dirname(target), { recursive: true });

  const extension = path.extname(relativePath).toLowerCase();
  if (extension === '.js' || extension === '.mjs' || extension === '.css') {
    const input = await readFile(source, 'utf8');
    const sourceFindings = inspectPublicText(relativePath, input);
    if (sourceFindings.length) {
      const details = sourceFindings.map((item) => `[${item.code}] ${item.file}: ${item.message}`).join('\n');
      throw new Error(`Allowlisted source failed the pre-minification exposure scan:\n${details}`);
    }
    const output = await transform(input, {
      loader: extension === '.css' ? 'css' : 'js',
      format: extension === '.mjs' ? 'esm' : undefined,
      target: 'es2020',
      minify: true,
      sourcemap: false,
      legalComments: 'inline',
      charset: 'utf8'
    });
    await writeFile(target, output.code, 'utf8');
  } else {
    await copyFile(source, target);
  }
}

try {
  for (const relativePath of PUBLIC_FILES) await writePublicFile(relativePath);

  const audit = await auditPublicArtifact(stagingDirectory);
  console.log(formatAudit({ ...audit, root: destination }));
  if (audit.criticalCount) {
    throw new Error('Public release blocked. Resolve every critical exposure before publishing.');
  }

  if (destinationExists) await rmdir(destination);
  await rename(stagingDirectory, destination);
  console.log(`Built and audited allowlisted public artifact with ${PUBLIC_FILES.length} files.`);
} catch (error) {
  await rm(stagingDirectory, { recursive: true, force: true });
  throw error;
}
