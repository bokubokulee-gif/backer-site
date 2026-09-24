#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHftHandler, isLocalRequest } from '../server/hft-local-api.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTIFACT_ROOT = path.join(PROJECT_ROOT, '.public-artifact');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8' };

function fail(response, status) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(status === 403 ? 'Forbidden' : status === 405 ? 'Method not allowed' : 'Not found');
}

async function serveArtifact(request, response, root) {
  if (!['GET', 'HEAD'].includes(request.method)) return fail(response, 405);
  try {
    const pathname = decodeURIComponent(request.url.split('?')[0]);
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0')
      || pathname.split('/').some((part) => part.startsWith('.'))
      || /^\/(?:server|scripts|tests|docs|node_modules)(?:\/|$)/i.test(pathname)) return fail(response, 404);
    const requested = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    const resolved = await realpath(requested);
    if (!resolved.startsWith(`${root}${path.sep}`) || !Object.hasOwn(MIME, path.extname(resolved).toLowerCase())) return fail(response, 404);
    const info = await stat(resolved);
    if (!info.isFile()) return fail(response, 404);
    const data = request.method === 'HEAD' ? null : await readFile(resolved);
    response.writeHead(200, { 'Content-Type': MIME[path.extname(resolved).toLowerCase()], 'Content-Length': info.size,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' });
    response.end(data);
  } catch { fail(response, 404); }
}

/** Artifact root injection is for isolated tests; CLI always serves .public-artifact. */
export async function startHftPreview({ port = Number(process.env.BACKER_HFT_PORT || 4191), artifactRoot = ARTIFACT_ROOT,
  apiKey = process.env.TYPESAFE_API_KEY, fetchImpl = globalThis.fetch, ...handlerOptions } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid preview port');
  let root;
  try { root = await realpath(artifactRoot); if (!(await stat(root)).isDirectory()) throw new Error(); }
  catch { throw new Error('Build the public artifact first: node scripts/build-pages-artifact.mjs .public-artifact'); }
  let handler;
  const server = createServer((request, response) => {
    const actualPort = server.address().port;
    if (!isLocalRequest(request, actualPort)) return fail(response, 403);
    if (request.url.split('?')[0].startsWith('/api/')) return handler(request, response);
    return serveArtifact(request, response, root);
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 1000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      handler = createHftHandler({ ...handlerOptions, apiKey, fetchImpl, port: server.address().port });
      resolve();
    });
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const server = await startHftPreview();
    console.log(`HFT local preview: http://127.0.0.1:${server.address().port}/use-cases/high-frequency-trading.html`);
    console.log('Serving the built public artifact only. Inference requires a server-side TYPESAFE_API_KEY; synthetic fixtures remain available without it.');
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? 'Preview port is in use; set BACKER_HFT_PORT to another local port.' : error.message);
    process.exitCode = 1;
  }
}
