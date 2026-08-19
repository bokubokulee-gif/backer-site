'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { compactText, safeHttpsUrl } = require('../../../api/_lib/discovery-model');
const { fetchJson, identityBundle } = require('./_helpers');

function linkedinApproved(env) {
  return String(env.BACKER_LINKEDIN_APPROVED_ACCESS || '').toLowerCase() === 'true';
}

function linkedinToken(env) {
  return env.BACKER_LINKEDIN_ACCESS_TOKEN || env.LINKEDIN_ACCESS_TOKEN || '';
}

function configuredProfiles(raw) {
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch (_error) { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((row) => {
    if (!row || row.authorized !== true) return null;
    const subject = compactText(row.subject || row.sub, 200);
    const profileUrl = safeHttpsUrl(row.profileUrl || row.url);
    if (!subject || !profileUrl || new URL(profileUrl).hostname !== 'www.linkedin.com') return null;
    return {
      subject,
      profileUrl,
      handle: compactText(row.handle, 120),
      name: compactText(row.name, 160)
    };
  }).filter(Boolean).slice(0, 20);
}

const linkedin = createProviderAdapter({
  id: 'linkedin',
  availability(env) {
    if (!linkedinApproved(env)) return { state: 'permission_required', reasonCode: 'commercial_access_not_approved' };
    if (!linkedinToken(env)) return { state: 'not_configured', reasonCode: 'credentials_missing' };
    return configuredProfiles(env.BACKER_LINKEDIN_PROFILES_JSON).length
      ? { state: 'ready' }
      : { state: 'permission_required', reasonCode: 'authorized_accounts_not_configured' };
  },
  async fetchPage(context) {
    if (context.cursor) return {
      creators: [], platformIdentities: [], contentRecords: [], metricObservations: [], nextCursor: null,
      reasonCode: 'authorized_self_only'
    };
    const payload = await fetchJson(context.fetch, new URL('https://api.linkedin.com/v2/userinfo'), {
      signal: context.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${linkedinToken(context.env)}` }
    });
    const profile = configuredProfiles(context.env.BACKER_LINKEDIN_PROFILES_JSON)
      .find((row) => row.subject === String(payload.sub || ''));
    if (!profile) {
      return {
        creators: [], platformIdentities: [], contentRecords: [], metricObservations: [], nextCursor: null,
        reasonCode: 'authorized_self_only'
      };
    }
    const displayName = compactText(payload.name, 160) || profile.name || profile.handle;
    const searchable = `${displayName} ${profile.handle}`.normalize('NFKC').toLowerCase();
    const matches = context.mode === 'trending' || String(context.query || '').normalize('NFKC').toLowerCase()
      .split(/\s+/).filter(Boolean).some((term) => searchable.includes(term));
    if (!matches) {
      return {
        creators: [], platformIdentities: [], contentRecords: [], metricObservations: [], nextCursor: null,
        reasonCode: 'authorized_self_only'
      };
    }
    const observedAt = context.now().toISOString();
    const owner = identityBundle({
      provider: 'linkedin', nativeId: profile.subject, handle: profile.handle,
      displayName, bio: '', avatarUrl: payload.picture, profileUrl: profile.profileUrl,
      verified: payload.email_verified, observedAt
    });
    return {
      creators: owner ? [owner.creator] : [],
      platformIdentities: owner ? [owner.identity] : [],
      contentRecords: [],
      metricObservations: [],
      nextCursor: null,
      reasonCode: 'authorized_self_only'
    };
  }
});

module.exports = { configuredProfiles, linkedin, linkedinApproved, linkedinToken };
