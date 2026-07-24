'use strict';

const { HttpError } = require('./errors');
const { headerValue } = require('./ip');

function setHeaders(res, headers) {
  Object.entries(headers || {}).forEach(([key, value]) => res.setHeader(key, value));
}

function sendJson(res, status, value, headers) {
  setHeaders(res, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {}));
  const body = JSON.stringify(value);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(value);
    return;
  }
  res.statusCode = status;
  res.end(body);
}

function sendText(res, status, body, headers) {
  setHeaders(res, headers || {});
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    res.status(status).send(body);
    return;
  }
  res.statusCode = status;
  res.end(body);
}

function noStoreHeaders(extra) {
  return Object.assign(
    {
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
      Expires: '0'
    },
    extra || {}
  );
}

function assertMethod(req, methods) {
  const method = String(req && req.method || '').toUpperCase();
  if (!methods.includes(method)) {
    const error = new HttpError(405, 'Method not allowed', 'method_not_allowed');
    error.allow = methods.join(', ');
    throw error;
  }
  return method;
}

async function streamBody(req, maximumBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) throw new HttpError(413, 'Payload too large', 'body_too_large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJsonBody(req, options) {
  const config = Object.assign({ maximumBytes: 8192, requireObject: true }, options || {});
  const contentType = String(headerValue(req && req.headers, 'content-type')).toLowerCase();
  if (!/^application\/json(?:\s*;|$)/.test(contentType)) {
    throw new HttpError(415, 'Unsupported media type', 'invalid_content_type');
  }
  const contentLength = Number(headerValue(req && req.headers, 'content-length'));
  if (Number.isFinite(contentLength) && contentLength > config.maximumBytes) {
    throw new HttpError(413, 'Payload too large', 'body_too_large');
  }
  let raw = req.body;
  if (raw == null && req && typeof req[Symbol.asyncIterator] === 'function') {
    raw = await streamBody(req, config.maximumBytes);
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw, 'utf8') > config.maximumBytes) {
      throw new HttpError(413, 'Payload too large', 'body_too_large');
    }
    try {
      raw = JSON.parse(raw);
    } catch (_error) {
      throw new HttpError(400, 'Invalid JSON', 'invalid_json');
    }
  } else {
    let serialized;
    try {
      serialized = JSON.stringify(raw);
    } catch (_error) {
      throw new HttpError(400, 'Invalid JSON', 'invalid_json');
    }
    if (!serialized || Buffer.byteLength(serialized, 'utf8') > config.maximumBytes) {
      throw new HttpError(413, 'Payload too large', 'body_too_large');
    }
  }
  if (
    config.requireObject &&
    (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.getPrototypeOf(raw) !== Object.prototype)
  ) {
    throw new HttpError(400, 'Invalid JSON', 'invalid_json_shape');
  }
  return raw;
}

function sanitizedDiagnostic(error) {
  return {
    name: String(error && error.name || 'Error').slice(0, 80),
    code: String(error && error.code || 'unknown').slice(0, 80)
  };
}

function handleError(res, error, scope) {
  if (error instanceof HttpError) {
    const headers = error.allow ? { Allow: error.allow } : {};
    sendJson(res, error.status, { error: error.publicMessage }, noStoreHeaders(headers));
    return;
  }
  console.error(`[${scope || 'api'}]`, sanitizedDiagnostic(error));
  sendJson(res, 500, { error: 'Internal server error' }, noStoreHeaders());
}

function createHandler(handler, scope) {
  return async function wrapped(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(res, error, scope);
    }
  };
}

module.exports = {
  assertMethod,
  createHandler,
  handleError,
  noStoreHeaders,
  readJsonBody,
  sendJson,
  sendText,
  setHeaders
};
