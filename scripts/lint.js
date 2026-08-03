#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const JS_ROOTS = ['api', 'js', 'scripts', 'tests'];
const CANONICAL_PAGES = [
  'backerdemo.html',
  'backermarket.html',
  'backerthesis.html',
  'pitch.html',
  'faq.html',
  'waitlist.html',
  'onboarding.html',
  'signup.html',
  'portfolio.html',
  'privacy.html'
];
const REDIRECT_PAGES = [
  'index.html',
  'thesis.html',
  'thesiss.html',
  'thesisss.html',
  'thesisd.html',
  'thesisdd.html'
];
const PUBLIC_SECRET_NAMES = [
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANALYTICS_HASH_SECRET',
  'ANALYTICS_IP_ENCRYPTION_KEY_B64',
  'ANALYTICS_ADMIN_PASSWORD_HASH',
  'ANALYTICS_SESSION_SECRET',
  'CRON_SECRET'
];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function checkJavaScript() {
  const files = JS_ROOTS.flatMap((directory) => walk(path.join(ROOT, directory)))
    .filter((file) => /\.(?:c?js|mjs)$/.test(file));
  files.forEach((file) => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) fail(result.stderr || `Syntax check failed: ${file}`);
  });
}

function checkJson() {
  ['package.json', 'vercel.json'].forEach((name) => {
    try {
      JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
    } catch (error) {
      fail(`${name}: ${error.message}`);
    }
  });
}

function checkInlineScripts() {
  CANONICAL_PAGES.concat(REDIRECT_PAGES).forEach((name) => {
    const html = fs.readFileSync(path.join(ROOT, name), 'utf8');
    const scripts = html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of scripts) {
      try {
        new vm.Script(match[1], { filename: name });
      } catch (error) {
        fail(`${name}: ${error.message}`);
      }
    }
  });
}

function checkAnalyticsPlacement() {
  CANONICAL_PAGES.forEach((name) => {
    const html = fs.readFileSync(path.join(ROOT, name), 'utf8');
    if (!/js\/analytics-core\.js/.test(html) || !/js\/analytics\.js/.test(html)) {
      fail(`${name}: missing shared analytics adapter`);
    }
  });
  REDIRECT_PAGES.forEach((name) => {
    const html = fs.readFileSync(path.join(ROOT, name), 'utf8');
    if (/js\/analytics(?:-core)?\.js/.test(html)) {
      fail(`${name}: redirect aliases must not initialize analytics`);
    }
  });
}

function checkBrowserSecrets() {
  const publicFiles = [
    ...walk(path.join(ROOT, 'js')),
    ...walk(path.join(ROOT, 'css')),
    ...CANONICAL_PAGES.map((name) => path.join(ROOT, name))
  ];
  publicFiles.forEach((file) => {
    if (!/\.(?:html|css|js)$/.test(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    PUBLIC_SECRET_NAMES.forEach((name) => {
      if (source.includes(name)) fail(`${path.relative(ROOT, file)}: public asset names server secret ${name}`);
    });
  });
}

checkJavaScript();
checkJson();
checkInlineScripts();
checkAnalyticsPlacement();
checkBrowserSecrets();

if (!process.exitCode) process.stdout.write('Backer lint checks passed.\n');
