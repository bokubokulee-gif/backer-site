'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');

function runtime({ url = 'https://example.test/backer-site/pitch.html', stored, storageError = false } = {}) {
  const writes = [];
  const redirects = [];
  const location = new URL(url);
  location.assign = value => redirects.push(value);
  const document = { documentElement: { dataset: {} }, readyState: 'loading', addEventListener() {} };
  const window = { document, location, localStorage: {
    getItem() { if (storageError) throw new Error('blocked'); return stored; },
    setItem(key, value) { if (storageError) throw new Error('blocked'); writes.push([key, value]); }
  }, BackerLocalePacks: { test: { messages: {
    'Join the waitlist': ['加入候补名单', '先行案内に登録', '사전 등록'],
    'Research': ['研究', '研究', '연구'],
    'Medium': ['中', '中', '보통']
  }, patterns: {
    '{0} of {1}': ['{0} / {1}', '{0} / {1}', '{0} / {1}'],
    'Showing {0} of {1} profiles.': ['显示 {1} 个档案中的 {0} 个。', '全{1}件中{0}件を表示。', '전체 {1}개 중 {0}개 표시.'],
    'Source: {0}': ['来源：{0}', '出典：{0}', '출처: {0}']
  } } } };
  vm.runInNewContext(source, { window, document, location, URL, Set, Map, WeakMap, Object, Array, String, RegExp });
  return { api: window.BackerI18n, document, writes, redirects, window };
}

test('English is the exact default; an explicit valid URL wins over saved locale', () => {
  const english = runtime();
  assert.equal(english.api.locale, 'en');
  assert.equal(english.api.t('  Join the waitlist\n'), '  Join the waitlist\n');
  const japanese = runtime({ url: 'https://example.test/pitch.html?lang=ja', stored: 'ko' });
  assert.equal(japanese.api.locale, 'ja');
  assert.equal(japanese.document.documentElement.lang, 'ja');
  assert.equal(japanese.api.t('Join the waitlist'), '先行案内に登録');
  assert.deepEqual(japanese.writes, [['backer_locale_v1', 'ja']]);
});

test('saved locale survives routes without a query; invalid locale and blocked storage are safe', () => {
  assert.equal(runtime({ stored: 'zh' }).document.documentElement.lang, 'zh-CN');
  assert.equal(runtime({ url: 'https://example.test/?lang=invalid', stored: 'ko' }).api.locale, 'ko');
  assert.equal(runtime({ storageError: true }).api.locale, 'en');
  assert.equal(runtime({ url: 'https://example.test/?lang=zh', storageError: true }).api.locale, 'zh');
});

test('native parameter order preserves values and source text outside the reviewed catalog', () => {
  const { api } = runtime({ stored: 'ja' });
  assert.equal(api.t('  Showing 12 of 103 profiles.\n'), '  全103件中12件を表示。\n');
  assert.equal(api.t('A creator’s original post title'), 'A creator’s original post title');
  assert.equal(api.t('@original_handle'), '@original_handle');
  assert.equal(api.t('https://example.org/research'), 'https://example.org/research');
  assert.equal(api.t('Source: Medium'), '出典：Medium');
});

test('language navigation preserves host, mount, route, query and hash', () => {
  const r = runtime({ url: 'https://example.test/backer-site/backerdemo.html?release=a#trades?topic=science', stored: 'ja' });
  r.api.switchLanguage('ko');
  assert.equal(r.redirects[0], 'https://example.test/backer-site/backerdemo.html?release=a&lang=ko#trades?topic=science');
  assert.equal(r.api.url('../backer-site/research.html#simulation'), 'https://example.test/backer-site/research.html?lang=ja#simulation');
  assert.equal(r.api.url('https://source.example/paper'), 'https://source.example/paper');
  r.api.switchLanguage('javascript:bad');
  assert.equal(r.redirects.length, 1);
});

test('all public pages load the same locale runtime and reviewed catalog assets', () => {
  const builder = fs.readFileSync(path.join(root, 'scripts/build-pages-artifact.mjs'), 'utf8');
  const pages = [...builder.matchAll(/^  '([^']+\.html)',?$/gm)].map(match => match[1]);
  assert.equal(pages.length, 27);
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /js\/i18n\.js\?v=/, page);
    assert.match(html, /css\/i18n\.css\?v=/, page);
    for (const pack of ['marketing', 'interface', 'research', 'supplement']) assert.ok(html.includes('js/locales/' + pack + '.js'), page + ': ' + pack);
  }
});
