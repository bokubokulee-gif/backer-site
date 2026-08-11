'use strict';

const { latestMarket2People } = require('../_lib/market2-repository');
const { assertMethod, createHandler, sendJson } = require('../_lib/http');

function createMarket2PeopleHandler(dependencies) {
  const deps = dependencies || {};
  return createHandler(async (req, res) => {
    assertMethod(req, ['GET']);
    const query = req && req.query || {};
    const result = await (deps.latestMarket2People || latestMarket2People)(query, deps.repositoryDependencies);
    const generatedAt = new Date(result.snapshot.generatedAt);
    sendJson(res, 200, result.snapshot, {
      'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=43200',
      'Last-Modified': Number.isFinite(generatedAt.getTime())
        ? generatedAt.toUTCString()
        : new Date(0).toUTCString(),
      'X-Backer-Data-Source': result.source,
      'X-Backer-Data-State': result.snapshot.status,
      'X-Content-Type-Options': 'nosniff'
    });
  }, 'market2-people');
}

module.exports = createMarket2PeopleHandler();
module.exports.createMarket2PeopleHandler = createMarket2PeopleHandler;
