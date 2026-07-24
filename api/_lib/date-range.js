'use strict';

const { HttpError } = require('./errors');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!DATE.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && isoDate(date) === value ? date : null;
}

function queryValue(req, name) {
  if (req && req.query && Object.prototype.hasOwnProperty.call(req.query, name)) {
    const value = req.query[name];
    return Array.isArray(value) ? value[0] : value;
  }
  try {
    return new URL(req.url || '/', 'http://localhost').searchParams.get(name);
  } catch (_error) {
    return null;
  }
}

function parseAnalyticsRange(req, nowValue) {
  const now = nowValue || new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const range = String(queryValue(req, 'range') || '7d').toLowerCase();
  let start;
  let endDate;
  if (range === 'custom') {
    start = parseDate(String(queryValue(req, 'from') || ''));
    endDate = parseDate(String(queryValue(req, 'to') || ''));
    if (!start || !endDate) throw new HttpError(400, 'Invalid date range', 'invalid_date_range');
  } else {
    const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 0;
    if (!days) throw new HttpError(400, 'Invalid date range', 'invalid_date_range');
    start = new Date(today.getTime() - (days - 1) * DAY_MS);
    endDate = today;
  }
  if (endDate < start || endDate.getTime() - start.getTime() > 89 * DAY_MS) {
    throw new HttpError(400, 'Invalid date range', 'date_range_too_large');
  }
  const endExclusive = new Date(endDate.getTime() + DAY_MS);
  return {
    label: range,
    from: isoDate(start),
    to: isoDate(endDate),
    start,
    endExclusive
  };
}

module.exports = { DAY_MS, isoDate, parseAnalyticsRange, parseDate, queryValue };
