'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const BASES = ['https://backer-site.vercel.app/', 'https://bokubokulee-gif.github.io/backer-site/'];
const IMAGE = 'img/backer-social-20260926.png';
const ALIASES = {
  'index.html': 'backerdemo.html',
  'portfolio.html': 'waitlist.html',
  'thesis.html': 'backerthesis.html',
  'thesiss.html': 'backerthesis.html',
  'thesisss.html': 'backerthesis.html',
  'thesisd.html': 'signup.html',
  'thesisdd.html': 'signup.html',
  'research-lab/attention-simulatoin.html': 'research-lab/attention-simulation.html'
};

function publicFiles() {
  const builder = fs.readFileSync(path.join(ROOT, 'scripts/build-pages-artifact.mjs'), 'utf8');
  const manifest = builder.match(/const PUBLIC_FILES = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(manifest, 'audit allowlist remains statically inspectable');
  return [...manifest[1].matchAll(/^\s*'([^']+)',?$/gm)].map((match) => match[1]);
}

function metaValues(html, name) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].filter(([tag]) => {
    return tag.match(/\b(?:property|name)="([^"]+)"/i)?.[1] === name;
  }).map(([tag]) => tag.match(/\bcontent="([^"]*)"/i)?.[1]);
}

test('both complete public artifacts contain crawler-readable cards with host-correct URLs', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'backer-social-build-'));
  try {
    const files = publicFiles();
    assert.ok(files.includes(IMAGE));
    assert.ok(files.includes('robots.txt'));
    for (const [index, base] of BASES.entries()) {
      const output = path.join(temporary, `host-${index}`);
      const args = ['scripts/build-pages-artifact.mjs', output];
      // Exercise the production default and the explicit GitHub Pages option.
      if (index) args.push('--site-url', base);
      const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PUBLIC_SITE_URL: '' } });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout, /Critical findings: 0/);

      for (const page of files.filter((file) => file.endsWith('.html'))) {
        const html = fs.readFileSync(path.join(output, page), 'utf8');
        if (page.startsWith('admin/')) {
          assert.equal(html, fs.readFileSync(path.join(ROOT, page), 'utf8'));
          assert.equal(metaValues(html, 'twitter:card').length, 0);
          continue;
        }
        const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];
        const expected = {
          'og:type': 'website',
          'og:site_name': 'Backer AI',
          'og:url': new URL(ALIASES[page] || page, base).href,
          'og:image': new URL(IMAGE, base).href,
          'og:image:secure_url': new URL(IMAGE, base).href,
          'og:image:type': 'image/png',
          'og:image:width': '1200',
          'og:image:height': '630',
          'twitter:card': 'summary_large_image',
          'twitter:site': '@backer_ai',
          'twitter:image': new URL(IMAGE, base).href
        };
        for (const [key, value] of Object.entries(expected)) assert.deepEqual(metaValues(head, key), [value], `${base}${page}: ${key}`);
        for (const key of ['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']) {
          const values = metaValues(head, key);
          assert.equal(values.length, 1, `${page}: exactly one ${key}`);
          assert.ok(values[0].length > 10, `${page}: meaningful ${key}`);
        }
        assert.doesNotMatch(metaValues(head, 'og:title')[0], /redirecting/i);
        assert.equal(metaValues(head, 'og:description')[0], metaValues(head, 'description')[0]);
        assert.equal(metaValues(head, 'twitter:image:alt')[0], metaValues(head, 'og:image:alt')[0]);
        const original = fs.readFileSync(path.join(ROOT, ALIASES[page] || page), 'utf8');
        assert.equal(metaValues(head, 'og:title')[0], original.match(/<title>([\s\S]*?)<\/title>/i)[1], `${page}: authored destination title`);
        assert.equal(metaValues(head, 'description')[0], metaValues(original, 'description')[0], `${page}: authored destination description`);
        assert.deepEqual([...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((match) => match[1]), [expected['og:url']]);
        assert.equal(html.slice(html.indexOf('</head>')), fs.readFileSync(path.join(ROOT, page), 'utf8').slice(fs.readFileSync(path.join(ROOT, page), 'utf8').indexOf('</head>')), `${page}: body stays unchanged`);
      }
      const image = fs.readFileSync(path.join(output, IMAGE));
      assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(image.readUInt32BE(16), 1200);
      assert.equal(image.readUInt32BE(20), 630);
      assert.ok(image.length < 5_000_000, 'X image remains under 5 MB');
      const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
      assert.match(robots, /User-agent: \*\s+Allow: \/\s/);
      assert.doesNotMatch(robots, /Disallow: \/\s*$/m);
      assert.match(robots, /Disallow: \/admin\//);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('metadata replacement is idempotent and escapes authored copy without touching scripts', async () => {
  const { addSocialMetadata } = await import('../scripts/social-metadata.mjs');
  const source = '<html><head><title>A &amp; B &quot;research&quot; $&amp;</title><meta content="Decisions &amp; their &quot;consequences&quot;." name="description"><meta property="og:image" content="old.png"><meta name="twitter:card" content="summary"><script>const example = \'<meta name="description" content="Wrong script example">\';</script></head><body>Visible page</body></html>';
  const first = addSocialMetadata(source, 'nested/page.html', { siteUrl: BASES[1] });
  assert.equal(addSocialMetadata(first, 'nested/page.html', { siteUrl: BASES[1] }), first);
  assert.deepEqual(metaValues(first, 'og:title'), ['A &amp; B &quot;research&quot; $&amp;']);
  assert.deepEqual(metaValues(first, 'og:description'), ['Decisions &amp; their &quot;consequences&quot;.']);
  assert.match(first, /const example = '<meta name="description" content="Wrong script example">';/);
  assert.deepEqual(metaValues(first, 'og:image'), [BASES[1] + IMAGE]);
});

test('invalid bases and incomplete future public pages fail closed; valid bases retain subpaths', async () => {
  const { addSocialMetadata, normalizeSiteUrl } = await import('../scripts/social-metadata.mjs');
  for (const value of ['http://example.com', '/backer-site/', 'https://user:secret@example.com', 'https://example.com/?x=1', 'https://example.com/#fragment']) {
    assert.throws(() => normalizeSiteUrl(value));
  }
  assert.equal(normalizeSiteUrl('https://example.com/backer-site'), 'https://example.com/backer-site/');
  assert.throws(() => addSocialMetadata('<head><title>New page</title></head>', 'new.html'), /needs a title and description/);
  const alias = '<head><title>Redirect</title><meta http-equiv="refresh" content="0; url=b.html"></head>';
  assert.throws(() => addSocialMetadata(alias, 'a.html'), /not an allowlisted public page/);
  assert.throws(() => addSocialMetadata(alias, 'b.html'), /Circular/);
});

test('Twitter text respects its limits while Open Graph retains full page copy', async () => {
  const { addSocialMetadata } = await import('../scripts/social-metadata.mjs');
  const title = 'A careful research question about attention and behavior across different market conditions';
  const description = 'This page explains how attention and behavior connect. '.repeat(6);
  const output = addSocialMetadata(`<head><title>${title}</title><meta name="description" content="${description}"></head>`, 'page.html');
  assert.equal(metaValues(output, 'og:title')[0], title);
  assert.equal(metaValues(output, 'og:description')[0], description.trim());
  assert.ok([...metaValues(output, 'twitter:title')[0]].length <= 70);
  assert.ok([...metaValues(output, 'twitter:description')[0]].length <= 200);
});
