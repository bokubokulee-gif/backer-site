'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle } = require('./_helpers');

function devPage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1;
}

function terms(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .split(/[^\p{L}\p{N}_-]+/u).filter(Boolean).slice(0, 10);
}

function matches(row, queryTerms) {
  if (!queryTerms.length) return true;
  const haystack = [row.title, row.description, row.tags, row.tag_list, row.user && row.user.name, row.user && row.user.username]
    .flat().filter(Boolean).join(' ').normalize('NFKC').toLowerCase();
  return queryTerms.some((term) => haystack.includes(term));
}

const dev = createProviderAdapter({
  id: 'dev',
  availability() {
    return { state: 'ready' };
  },
  async fetchPage(context) {
    const page = devPage(context.cursor);
    const perPage = Math.max(10, Math.min(100, context.providerLimit || 40));
    const queryTerms = terms(context.query);
    const parameters = { per_page: perPage, page };
    if (context.mode === 'trending') {
      parameters.top = Math.max(1, Math.min(365, context.ranking && context.ranking.windowDays || 30));
    } else if (queryTerms.length === 1 && /^[a-z0-9_-]{2,30}$/.test(queryTerms[0])) {
      parameters.tag = queryTerms[0];
    }
    const payload = await fetchJson(context.fetch, fixedUrl('https://dev.to', '/api/articles', parameters), {
      signal: context.signal,
      headers: { Accept: 'application/vnd.forem.api-v1+json' }
    });
    const rawRows = Array.isArray(payload) ? payload : [];
    const rows = rawRows.filter((row) => context.mode === 'trending' || matches(row, queryTerms));
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];
    const owners = new Map();

    for (const article of rows) {
      const user = article.user || {};
      const nativeId = String(user.user_id || user.id || user.username || '');
      if (!nativeId || !user.username) continue;
      let owner = owners.get(nativeId);
      if (!owner) {
        owner = identityBundle({
          provider: 'dev',
          nativeId,
          handle: user.username,
          displayName: user.name || user.username,
          bio: '',
          avatarUrl: user.profile_image_90 || user.profile_image,
          profileUrl: `https://dev.to/${encodeURIComponent(user.username)}`,
          observedAt
        });
        if (!owner) continue;
        owners.set(nativeId, owner);
        creators.push(owner.creator);
        platformIdentities.push(owner.identity);
      }
      const content = contentForIdentity({
        provider: 'dev',
        nativeId: String(article.id),
        contentType: 'article',
        title: article.title,
        excerpt: article.description || '',
        canonicalUrl: article.url,
        thumbnailUrl: article.cover_image || article.social_image,
        publishedAt: article.published_timestamp || article.published_at,
        observedAt
      }, owner);
      if (!content) continue;
      contentRecords.push(content);
      [
        ['likes', article.positive_reactions_count],
        ['reactions', article.public_reactions_count],
        ['comments', article.comments_count]
      ].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'content', entityId: content.id, provider: 'dev', metric,
        value, observedAt, sourceUrl: content.canonicalUrl
      }));
    }
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: rawRows.length === perPage ? String(page + 1) : null
    };
  }
});

module.exports = { dev, devPage, matches, terms };
