'use strict';

const { HttpError } = require('../_lib/errors');
const { createHandler } = require('../_lib/http');

const ROUTES = Object.freeze({
  export: require('../_lib/admin-routes/export'),
  login: require('../_lib/admin-routes/login'),
  logout: require('../_lib/admin-routes/logout'),
  reauth: require('../_lib/admin-routes/reauth'),
  recent: require('../_lib/admin-routes/recent'),
  reveal: require('../_lib/admin-routes/reveal'),
  session: require('../_lib/admin-routes/session'),
  summary: require('../_lib/admin-routes/summary')
});

function routeName(req) {
  const queryValue = req && req.query && req.query.route;
  const candidate = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (typeof candidate === 'string' && candidate) return candidate;

  const rawUrl = String(req && req.url || '');
  const path = rawUrl.split('?')[0];
  const match = path.match(/^\/api\/admin\/([^/]+)\/?$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch (_error) {
    return '';
  }
}

function createAdminRouteHandler(dependencies) {
  const routes = dependencies && dependencies.routes || ROUTES;
  return createHandler(async (req, res) => {
    const route = routeName(req);
    const handler = Object.prototype.hasOwnProperty.call(routes, route) && routes[route];
    if (typeof handler !== 'function') {
      throw new HttpError(404, 'Not found', 'not_found');
    }
    await handler(req, res);
  }, 'admin-router');
}

module.exports = createAdminRouteHandler();
module.exports.createAdminRouteHandler = createAdminRouteHandler;
module.exports.routeName = routeName;
