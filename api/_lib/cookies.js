'use strict';

const { createHmac } = require('node:crypto');
const { safeEqualText } = require('./crypto');

const ADMIN_COOKIE = '__Host-backer_admin';

function parseCookies(header) {
  const output = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const separator = part.indexOf('=');
      if (separator < 1) return;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key && !Object.prototype.hasOwnProperty.call(output, key)) output[key] = value;
    });
  return output;
}

function cookieSignature(sessionSecret, unsigned) {
  return createHmac('sha256', sessionSecret).update(unsigned).digest('base64url');
}

function encodeAdminCookie(sessionSecret, sessionId, token) {
  const unsigned = `v1.${sessionId}.${token}`;
  return `${unsigned}.${cookieSignature(sessionSecret, unsigned)}`;
}

function decodeAdminCookie(sessionSecret, encoded) {
  const parts = String(encoded || '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const unsigned = parts.slice(0, 3).join('.');
  if (!safeEqualText(parts[3], cookieSignature(sessionSecret, unsigned))) return null;
  if (!/^[0-9a-f-]{36}$/i.test(parts[1]) || !/^[a-zA-Z0-9_-]{32,128}$/.test(parts[2])) return null;
  return { sessionId: parts[1].toLowerCase(), token: parts[2] };
}

function adminCookieHeader(value, maxAgeSeconds) {
  return [
    `${ADMIN_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ].join('; ');
}

function clearAdminCookieHeader() {
  return [
    `${ADMIN_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ].join('; ');
}

module.exports = {
  ADMIN_COOKIE,
  adminCookieHeader,
  clearAdminCookieHeader,
  decodeAdminCookie,
  encodeAdminCookie,
  parseCookies
};
