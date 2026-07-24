'use strict';

class HttpError extends Error {
  constructor(status, publicMessage, code) {
    super(publicMessage);
    this.name = 'HttpError';
    this.status = status;
    this.publicMessage = publicMessage;
    this.code = code || 'request_error';
  }
}

function invariant(condition, status, message, code) {
  if (!condition) throw new HttpError(status, message, code);
}

module.exports = { HttpError, invariant };
