export const DEFAULT_SITE_URL = 'https://backer-site.vercel.app/';
export const SOCIAL_IMAGE_PATH = 'img/backer-social-20260926.png';
export const SOCIAL_IMAGE_ALT = 'Backer AI — Predict where attention flows.';

// Keep script/style bodies and comments opaque while inspecting static head tags.
const HEAD_TAGS = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<(?:meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

export function normalizeSiteUrl(value = DEFAULT_SITE_URL) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Social metadata site URL must be an absolute HTTPS base without credentials, query or fragment');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

function decodeHtml(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key.startsWith('#')) {
      const point = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    return entities[key.toLowerCase()] ?? entity;
  });
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function cardText(value, maximum) {
  if ([...value].length <= maximum) return value;
  const shortened = [...value].slice(0, maximum - 1).join('');
  return `${shortened.replace(/\s+\S*$/, '').trimEnd()}…`;
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(([, key, double, single, unquoted]) => [key.toLowerCase(), decodeHtml(double ?? single ?? unquoted)]));
}

function getHead(html, pagePath) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  if (!head) throw new Error(`Public page has no static head: ${pagePath}`);
  return head;
}

function readPageCopy(pagePath, pages, seen = new Set()) {
  if (seen.has(pagePath)) throw new Error(`Circular social metadata redirect: ${pagePath}`);
  seen.add(pagePath);
  const html = pages.get(pagePath);
  if (html === undefined) throw new Error(`Social metadata redirect is not an allowlisted public page: ${pagePath}`);
  const head = getHead(html, pagePath)[1];
  let description = '';
  let redirect = '';
  for (const [tag] of head.matchAll(HEAD_TAGS)) {
    if (!/^<meta\b/i.test(tag)) continue;
    const attrs = attributes(tag);
    if (attrs.name?.toLowerCase() === 'description') description = attrs.content?.trim() || '';
    if (attrs['http-equiv']?.toLowerCase() === 'refresh') {
      redirect = attrs.content?.match(/;\s*url\s*=\s*(.*)$/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
    }
  }
  if (redirect) {
    const target = new URL(redirect, `https://backer.invalid/${pagePath}`);
    if (target.origin !== 'https://backer.invalid') throw new Error(`External social metadata redirect requires reviewed copy: ${pagePath}`);
    return readPageCopy(decodeURIComponent(target.pathname.slice(1)), pages, seen);
  }
  const title = decodeHtml(head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] || '').trim();
  if (!title || !description) throw new Error(`Public page needs a title and description for social sharing: ${pagePath}`);
  return { title, description, canonicalPath: pagePath };
}

export function addSocialMetadata(html, pagePath, { siteUrl = DEFAULT_SITE_URL, pages = new Map([[pagePath, html]]) } = {}) {
  // Protected analytics pages retain their existing noindex policy and no card.
  if (pagePath.startsWith('admin/')) return html;
  const base = normalizeSiteUrl(siteUrl);
  const { title, description, canonicalPath } = readPageCopy(pagePath, pages);
  const pageUrl = new URL(canonicalPath, base).href;
  const imageUrl = new URL(SOCIAL_IMAGE_PATH, base).href;
  const head = getHead(html, pagePath);
  const cleaned = head[1].replace(HEAD_TAGS, (tag) => {
    if (!/^<(?:meta|link)\b/i.test(tag)) return tag;
    const attrs = attributes(tag);
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (/^<meta\b/i.test(tag) && (key.startsWith('og:') || key.startsWith('twitter:') || key === 'description')) return '';
    if (/^<link\b/i.test(tag) && attrs.rel?.toLowerCase().split(/\s+/).includes('canonical')) return '';
    return tag;
  }).replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/i, () => `<title>${escapeHtml(title)}</title>`);
  const metas = [
    ['name', 'description', description],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Backer AI'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', pageUrl],
    ['property', 'og:image', imageUrl],
    ['property', 'og:image:secure_url', imageUrl],
    ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', SOCIAL_IMAGE_ALT],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:site', '@backer_ai'],
    ['name', 'twitter:title', cardText(title, 70)],
    ['name', 'twitter:description', cardText(description, 200)],
    ['name', 'twitter:image', imageUrl],
    ['name', 'twitter:image:alt', SOCIAL_IMAGE_ALT]
  ].map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`).join('\n');
  const outputHead = `${cleaned.replace(/^[\t ]+$/gm, '').trimEnd()}\n<link rel="canonical" href="${escapeHtml(pageUrl)}" />\n${metas}\n`;
  return html.replace(head[0], () => head[0].replace(head[1], () => outputHead));
}
