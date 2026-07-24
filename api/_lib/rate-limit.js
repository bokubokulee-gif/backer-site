'use strict';

const { HttpError } = require('./errors');

function bucketStart(now, windowMilliseconds) {
  return new Date(Math.floor(now.getTime() / windowMilliseconds) * windowMilliseconds);
}

async function consumeRateLimit(client, options) {
  const windowMilliseconds = options.windowMilliseconds || 60_000;
  const start = bucketStart(options.now, windowMilliseconds);
  const expiresAt = new Date(start.getTime() + windowMilliseconds * 2);
  const result = await client.query(
    `insert into analytics_rate_limits
       (scope, key_hash, bucket_start, request_count, expires_at)
     values ($1, $2, $3, 1, $4)
     on conflict (scope, key_hash, bucket_start)
     do update set
       request_count = analytics_rate_limits.request_count + 1,
       expires_at = greatest(analytics_rate_limits.expires_at, excluded.expires_at)
     returning request_count`,
    [options.scope, options.keyHash, start, expiresAt]
  );
  const count = Number(result.rows[0].request_count);
  if (count > options.limit) {
    throw new HttpError(429, 'Too many requests', 'rate_limited');
  }
  return count;
}

module.exports = { bucketStart, consumeRateLimit };
