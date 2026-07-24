'use strict';

const { HttpError } = require('./errors');

let pool;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new HttpError(503, 'Service unavailable', 'missing_database_url');
  // `pg` is required lazily so pure unit tests do not need a live database or installed driver.
  const { Pool } = require('pg');
  const options = {
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    application_name: 'backer-analytics'
  };
  if (process.env.DATABASE_SSL === 'disable') options.ssl = false;
  else if (process.env.DATABASE_SSL === 'require') {
    options.ssl = { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' };
  }
  return new Pool(options);
}

function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

async function query(text, values) {
  return getPool().query(text, values);
}

async function withTransaction(work) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try {
      await client.query('rollback');
    } catch (_rollbackError) {
      // Preserve the original failure without logging connection or query details.
    }
    throw error;
  } finally {
    client.release();
  }
}

function resetPoolForTests() {
  pool = undefined;
}

module.exports = { getPool, query, resetPoolForTests, withTransaction };
