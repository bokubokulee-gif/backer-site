'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');

async function policy() {
  return import(path.join(ROOT, 'scripts', 'audit-public-artifact.mjs'));
}

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'backer-public-audit-'));
}

function write(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

test('safe allowlisted browser projection passes the public-artifact policy', async () => {
  const root = fixture();
  write(root, 'index.html', '<!doctype html><title>Backer</title>');
  write(root, 'js/app.js', 'window.Backer = { public: true };');
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'data', 'landing-preview.json'), path.join(root, 'data', 'landing-preview.json'));

  const result = await (await policy()).auditPublicArtifact(root);
  assert.equal(result.criticalCount, 0);
});

test('source maps, internal trees, unreviewed data, and high-confidence secrets fail closed', async () => {
  const root = fixture();
  write(root, 'js/app.js.map', '{}');
  write(root, 'docs/internal.md', '# internal');
  write(root, 'data/raw-users.json', '[]');
  write(root, 'assets/exported-users.json', '[]');
  write(root, 'js/config.js', 'const apiKey = "ghp_123456789012345678901234567890123456";');
  write(root, 'js/oversized.js', 'x');
  fs.truncateSync(path.join(root, 'js', 'oversized.js'), 15_000_001);
  fs.symlinkSync(path.join(root, 'index.html'), path.join(root, 'js', 'linked-source.js'));

  const result = await (await policy()).auditPublicArtifact(root);
  const codes = new Set(result.findings.map((item) => item.code));
  for (const code of ['source_map', 'internal_tree', 'internal_markdown', 'unreviewed_public_data', 'github_token_literal', 'public_text_size_ceiling', 'public_symlink']) {
    assert.equal(codes.has(code), true, `${code} must block the release`);
  }
  assert.equal(result.findings.filter((item) => item.code === 'unreviewed_public_data').length, 2);
});

test('reviewed public data bytes cannot drift without an explicit manifest review', async () => {
  const root = fixture();
  write(root, 'data/landing-preview.json', JSON.stringify({ schemaVersion: 'unexpected-private-shape/v1' }));

  const result = await (await policy()).auditPublicArtifact(root);
  assert.equal(result.findings.some((item) => item.code === 'public_data_digest_drift'), true);
});

test('full Research corpus and client-side authoritative formulas are release blockers', async () => {
  const root = fixture();
  write(root, 'research-lab/data/agents.json.gz', zlib.gzipSync(JSON.stringify({ agents: [] })));
  write(root, 'research-lab/assets/lab-DPQGlpRQ.js', 'const version="backer-simulation-engine/v1"; const mechanism="SIMPLIFIED_CLOB_V1";');
  write(root, 'research-lab/assets/method-E5oJCIPr.js', 'window.runPairedExperiment = () => 1;');
  write(root, 'research-lab/assets/unexpected-chunk.js', 'window.publicResearch = true;');

  const result = await (await policy()).auditPublicArtifact(root);
  const codes = new Set(result.findings.map((item) => item.code));
  assert.equal(codes.has('full_research_population_public'), true);
  assert.equal(codes.has('research_engine_public'), true);
  assert.equal(codes.has('research_method_formula_public'), true);
  assert.equal(codes.has('research_script_digest_drift'), true);
  assert.equal(codes.has('unreviewed_research_script'), true);
});

test('allowlisted source secrets are detected before minification can rename identifiers', async () => {
  const { inspectPublicText } = await policy();
  const findings = inspectPublicText('js/config.js', 'const apiKey = "an-intentionally-long-secret-value";');
  assert.equal(findings.some((item) => item.code === 'assigned_secret_literal'), true);
});

test('public build is explicit, minified, source-map-free, and used by Vercel', () => {
  const builder = fs.readFileSync(path.join(ROOT, 'scripts', 'build-pages-artifact.mjs'), 'utf8');
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const packageManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const ignored = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  const manifestBlock = builder.match(/const PUBLIC_FILES = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(manifestBlock, 'public file manifest must remain statically inspectable');
  const publicFiles = [...manifestBlock[1].matchAll(/^\s*'([^']+)',?$/gm)].map((match) => match[1]);
  const ignoreRules = ignored.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && !line.startsWith('!'));

  assert.doesNotMatch(builder, /PUBLIC_DIRECTORIES|copyPublicDirectory/);
  assert.match(builder, /'admin\/analytics\/index\.html'/);
  assert.match(builder, /'css\/admin-analytics\.css'/);
  assert.match(builder, /'js\/admin-analytics\.js'/);
  assert.match(builder, /'research-lab\/assets\/lab-public-v1\.js'/);
  assert.match(builder, /'research-lab\/assets\/method-public-v1\.js'/);
  assert.doesNotMatch(builder, /'research-lab\/data\/agents\.json\.gz'/);
  assert.doesNotMatch(builder, /'research-lab\/assets\/lab-CsGj-wRf\.js'/);
  assert.doesNotMatch(builder, /'research-lab\/assets\/method-DDHZH2_6\.js'/);
  assert.match(builder, /auditPublicArtifact/);
  assert.match(builder, /inspectPublicText\(relativePath, input\)/);
  assert.match(builder, /minify:\s*true/);
  assert.match(builder, /sourcemap:\s*false/);
  assert.match(builder, /mkdtemp/);
  assert.match(builder, /rm\(stagingDirectory, \{ recursive: true, force: true \}\)/);
  assert.equal(vercel.public, false);
  assert.equal(vercel.outputDirectory, '.vercel-public');
  assert.match(vercel.buildCommand, /build-pages-artifact\.mjs/);
  assert.doesNotMatch(ignored, /^scripts\/build-pages-artifact\.mjs$/m);
  assert.doesNotMatch(ignored, /^js\/search-engine\.js$/m);
  assert.match(packageManifest.scripts['build:public'], /build-pages-artifact\.mjs/);
  assert.match(packageManifest.scripts['audit:public'], /build-pages-artifact\.mjs/);
  for (const publicFile of publicFiles) {
    assert.equal(ignoreRules.some((rule) => rule.endsWith('/') ? publicFile.startsWith(rule) : publicFile === rule), false, `${publicFile} must reach the Vercel build context`);
  }
});
