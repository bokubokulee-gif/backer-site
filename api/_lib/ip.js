'use strict';

const net = require('node:net');

function ipv4ToGroups(value) {
  const parts = value.split('.');
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)
  ) {
    return null;
  }
  return [
    ((Number(parts[0]) << 8) | Number(parts[1])).toString(16),
    ((Number(parts[2]) << 8) | Number(parts[3])).toString(16)
  ];
}

function expandIpv6(value) {
  let input = String(value).toLowerCase();
  const zoneIndex = input.indexOf('%');
  if (zoneIndex >= 0) input = input.slice(0, zoneIndex);
  if (input.includes('.')) {
    const lastColon = input.lastIndexOf(':');
    const ipv4Groups = ipv4ToGroups(input.slice(lastColon + 1));
    if (!ipv4Groups) return null;
    input = `${input.slice(0, lastColon)}:${ipv4Groups.join(':')}`;
  }
  if (!/^[0-9a-f:]+$/.test(input) || (input.match(/::/g) || []).length > 1) return null;
  const halves = input.split('::');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  if (left.some((group) => !group || group.length > 4) || right.some((group) => !group || group.length > 4)) {
    return null;
  }
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [
    ...left,
    ...Array.from({ length: Math.max(0, missing) }, () => '0'),
    ...right
  ].map((group) => Number.parseInt(group || '0', 16));
  if (groups.length !== 8 || groups.some((group) => !Number.isInteger(group) || group < 0 || group > 65535)) {
    return null;
  }
  return groups;
}

function compressIpv6(groups) {
  let bestStart = -1;
  let bestLength = 0;
  for (let index = 0; index < groups.length; ) {
    if (groups[index] !== 0) {
      index += 1;
      continue;
    }
    let end = index;
    while (end < groups.length && groups[end] === 0) end += 1;
    if (end - index > bestLength && end - index >= 2) {
      bestStart = index;
      bestLength = end - index;
    }
    index = end;
  }
  const values = groups.map((group) => group.toString(16));
  if (bestStart < 0) return values.join(':');
  const before = values.slice(0, bestStart).join(':');
  const after = values.slice(bestStart + bestLength).join(':');
  if (!before && !after) return '::';
  if (!before) return `::${after}`;
  if (!after) return `${before}::`;
  return `${before}::${after}`;
}

function normalizeIp(input) {
  if (input == null) return null;
  let value = String(input).trim();
  if (!value || value.length > 80 || value.includes(',')) return null;
  if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1);
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) value = mapped[1];
  const kind = net.isIP(value.split('%')[0]);
  if (kind === 4) {
    const parts = value.split('.').map(Number);
    return parts.join('.');
  }
  if (kind !== 6) return null;
  const groups = expandIpv6(value);
  return groups ? compressIpv6(groups) : null;
}

function maskIp(normalizedIp) {
  const value = normalizeIp(normalizedIp);
  if (!value) return null;
  if (net.isIP(value) === 4) {
    const parts = value.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  const groups = expandIpv6(value);
  return groups ? `${groups.slice(0, 3).map((group) => group.toString(16)).join(':')}::/48` : null;
}

function headerValue(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value || '';
}

function trustedClientIp(req, environment) {
  const env = environment || process.env;
  if (String(env.VERCEL || '') === '1') {
    return normalizeIp(headerValue(req && req.headers, 'x-vercel-forwarded-for'));
  }
  return normalizeIp(req && req.socket && req.socket.remoteAddress);
}

function trustedGeo(req, environment) {
  const env = environment || process.env;
  if (String(env.VERCEL || '') !== '1') return { country: null, region: null };
  const country = String(headerValue(req.headers, 'x-vercel-ip-country')).toUpperCase();
  const region = String(headerValue(req.headers, 'x-vercel-ip-country-region')).toUpperCase();
  return {
    country: /^[A-Z]{2}$/.test(country) ? country : null,
    region: /^[A-Z0-9-]{1,6}$/.test(region) ? region : null
  };
}

module.exports = {
  compressIpv6,
  expandIpv6,
  headerValue,
  maskIp,
  normalizeIp,
  trustedClientIp,
  trustedGeo
};
