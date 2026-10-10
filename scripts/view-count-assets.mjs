import path from 'node:path';

// Every published HTML route receives the same local counter assets.
export function addViewCountAssets(html, relativePath) {
  if (html.includes('data-backer-view-assets')) return html;
  const prefix = path.posix.relative(path.posix.dirname(relativePath), '.') || '.';
  const version = '20261010';
  const core = `<script data-backer-view-assets src="${prefix}/js/backer-view-count-core.js?v=${version}"></script>`;
  const ui = `<link rel="stylesheet" href="${prefix}/css/backer-view-count.css?v=${version}" />\n<script src="${prefix}/js/backer-view-count.js?v=${version}" defer></script>`;
  return html.replace(/<head(?:\s[^>]*)?>/i, '$&\n' + core).replace(/<\/head>/i, ui + '\n</head>');
}
