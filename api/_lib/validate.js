'use strict';

const { domainToASCII } = require('node:url');
const { HttpError } = require('./errors');
const { canonicalizeRoute } = require('./routes');

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOP_LEVEL_FIELDS = new Set([
  'eventId',
  'pageKey',
  'path',
  'pageTitle',
  'virtualView',
  'visitorId',
  'sessionId',
  'referrerHostname',
  'utm',
  'deviceClass',
  'locale',
  'consentPolicyVersion'
]);
const UTM_FIELDS = new Set(['source', 'medium', 'campaign', 'id']);
const DEVICE_CLASSES = new Set(['mobile', 'tablet', 'desktop', 'other']);
const CAMPAIGN_VALUE = /^[a-zA-Z0-9][a-zA-Z0-9._~+% -]{0,79}$/;

function ownPlainObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function rejectUnknownFields(value, allowed) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new HttpError(400, 'Invalid analytics payload', 'unknown_field');
}

function requiredString(value, minimum, maximum) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean.length >= minimum && clean.length <= maximum ? clean : null;
}

function optionalCampaign(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, 'Invalid analytics payload', 'invalid_utm');
  const normalized = value.normalize('NFKC').trim();
  if (!CAMPAIGN_VALUE.test(normalized)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_utm');
  }
  return normalized;
}

function sanitizeReferrerHostname(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > 253 || /[/?#@\\\s]/.test(value)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_referrer');
  }
  const lower = value.toLowerCase().replace(/\.$/, '');
  if (lower === 'localhost') return lower;
  const ascii = domainToASCII(lower);
  if (
    !ascii ||
    ascii.length > 253 ||
    ascii.split('.').some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))
  ) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_referrer');
  }
  return ascii;
}

function validateViewPayload(payload, currentPolicyVersion) {
  if (!ownPlainObject(payload)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_payload');
  }
  rejectUnknownFields(payload, TOP_LEVEL_FIELDS);
  if (!UUID_V4.test(String(payload.eventId || ''))) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_event_id');
  }
  if (!UUID_V4.test(String(payload.visitorId || ''))) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_visitor_id');
  }
  if (!UUID_V4.test(String(payload.sessionId || ''))) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_session_id');
  }
  const route = canonicalizeRoute(payload.pageKey, payload.path);
  if (requiredString(payload.virtualView, 1, 32) !== route.virtualView) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_virtual_view');
  }
  if (!requiredString(payload.pageTitle, 1, 120)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_page_title');
  }
  if (payload.consentPolicyVersion !== currentPolicyVersion) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_consent_policy');
  }
  const deviceClass = String(payload.deviceClass || '').toLowerCase();
  if (!DEVICE_CLASSES.has(deviceClass)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_device_class');
  }
  const locale = requiredString(payload.locale, 2, 35);
  if (!locale || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(locale)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_locale');
  }
  if (!ownPlainObject(payload.utm)) {
    throw new HttpError(400, 'Invalid analytics payload', 'invalid_utm');
  }
  rejectUnknownFields(payload.utm, UTM_FIELDS);
  return {
    eventId: payload.eventId.toLowerCase(),
    pageKey: route.pageKey,
    canonicalPath: route.path,
    pageTitle: route.title,
    virtualView: route.virtualView,
    visitorId: payload.visitorId.toLowerCase(),
    sessionId: payload.sessionId.toLowerCase(),
    referrerHostname: sanitizeReferrerHostname(payload.referrerHostname),
    utmSource: optionalCampaign(payload.utm.source),
    utmMedium: optionalCampaign(payload.utm.medium),
    utmCampaign: optionalCampaign(payload.utm.campaign),
    utmId: optionalCampaign(payload.utm.id),
    deviceClass,
    locale,
    consentPolicyVersion: currentPolicyVersion
  };
}

function validatePasswordBody(payload) {
  if (!ownPlainObject(payload)) throw new HttpError(400, 'Invalid request', 'invalid_body');
  rejectUnknownFields(payload, new Set(['password']));
  if (typeof payload.password !== 'string' || payload.password.length < 1 || payload.password.length > 512) {
    throw new HttpError(400, 'Invalid request', 'invalid_password');
  }
  return payload.password;
}

function validateRevealBody(payload) {
  if (!ownPlainObject(payload)) throw new HttpError(400, 'Invalid request', 'invalid_body');
  rejectUnknownFields(payload, new Set(['viewId']));
  if (!UUID_V4.test(String(payload.viewId || ''))) {
    throw new HttpError(400, 'Invalid request', 'invalid_view_id');
  }
  return payload.viewId.toLowerCase();
}

module.exports = {
  CAMPAIGN_VALUE,
  DEVICE_CLASSES,
  TOP_LEVEL_FIELDS,
  UTM_FIELDS,
  UUID_V4,
  optionalCampaign,
  sanitizeReferrerHostname,
  validatePasswordBody,
  validateRevealBody,
  validateViewPayload
};
