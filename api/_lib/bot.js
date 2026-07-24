'use strict';

const { headerValue } = require('./ip');

const BOT_PATTERN =
  /(?:bot\b|\bcrawler\b|\bspider\b|\bslurp\b|\bpreview\b|\bheadless\b|\blighthouse\b|\bpagespeed\b|facebookexternalhit|whatsapp|curl\/|wget\/|python-requests|go-http-client)/i;

function classifyBot(headers) {
  const ua = String(headerValue(headers, 'user-agent')).slice(0, 512);
  const purpose = `${headerValue(headers, 'purpose')} ${headerValue(headers, 'sec-purpose')}`.trim();
  if (/\bprefetch\b/i.test(purpose)) return { isBot: true, reason: 'prefetch', userAgent: ua };
  if (BOT_PATTERN.test(ua)) return { isBot: true, reason: 'user_agent', userAgent: ua };
  if (!ua) return { isBot: true, reason: 'missing_user_agent', userAgent: '' };
  return { isBot: false, reason: null, userAgent: ua };
}

module.exports = { BOT_PATTERN, classifyBot };
