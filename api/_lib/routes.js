'use strict';

const { HttpError } = require('./errors');

const STATIC_ROUTES = Object.freeze({
  home: { path: '/', title: 'Backer', virtualView: 'home' },
  market: { path: '/market', title: 'Backer Market', virtualView: 'market' },
  market2: { path: '/market2', title: 'Backer Market', virtualView: 'market2' },
  market_position: {
    path: '/market/position',
    title: 'Backer Market',
    virtualView: 'market_position'
  },
  search: { path: '/search', title: 'Backer Search', virtualView: 'search' },
  portfolio: { path: '/portfolio', title: 'Backer Portfolio', virtualView: 'portfolio' },
  thesis: { path: '/thesis', title: 'Backer Thesis', virtualView: 'thesis' },
  pitch: { path: '/pitch', title: 'Backer Pitch', virtualView: 'pitch' },
  faq: { path: '/faq', title: 'Backer FAQ', virtualView: 'faq' },
  signup: { path: '/signup', title: 'Join Backer', virtualView: 'signup' },
  privacy: { path: '/privacy', title: 'Backer Privacy', virtualView: 'privacy' }
});

const PUBLIC_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function stripQueryAndHash(path) {
  const raw = String(path || '').trim();
  const cut = raw.search(/[?#]/);
  const clean = cut >= 0 ? raw.slice(0, cut) : raw;
  if (!clean || clean.length > 180 || !clean.startsWith('/') || /[\u0000-\u001f\\]/.test(clean)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_route');
  }
  return clean.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}

function routeId(path, prefix) {
  if (!path.startsWith(`${prefix}/`)) return null;
  const id = path.slice(prefix.length + 1).toLowerCase();
  return PUBLIC_ID.test(id) ? id : null;
}

function canonicalizeRoute(pageKey, inputPath) {
  const key = String(pageKey || '').toLowerCase();
  const path = stripQueryAndHash(inputPath);
  if (STATIC_ROUTES[key]) return Object.assign({ pageKey: key }, STATIC_ROUTES[key]);
  if (key === 'creator') {
    const id = routeId(path, '/creator');
    if (!id) throw new HttpError(400, 'Invalid analytics payload', 'invalid_creator_route');
    return {
      pageKey: 'creator',
      path: `/creator/${id}`,
      title: 'Backer Creator',
      virtualView: 'creator'
    };
  }
  if (key === 'market_detail') {
    const id = routeId(path, '/market');
    if (!id) throw new HttpError(400, 'Invalid analytics payload', 'invalid_market_route');
    return {
      pageKey: 'market_detail',
      path: `/market/${id}`,
      title: 'Backer Market',
      virtualView: 'market_detail'
    };
  }
  throw new HttpError(400, 'Invalid analytics payload', 'unknown_page');
}

module.exports = {
  PUBLIC_ID,
  STATIC_ROUTES,
  canonicalizeRoute,
  stripQueryAndHash
};
