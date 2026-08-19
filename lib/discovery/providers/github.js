'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const { addMetric, contentForIdentity, fetchJson, fixedUrl, identityBundle } = require('./_helpers');

function pageNumber(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 1;
}

function githubQuery(context) {
  if (context.mode === 'trending') {
    const days = Math.max(1, Math.min(365, context.ranking && context.ranking.windowDays || 30));
    const since = new Date(context.now().getTime() - days * 86_400_000).toISOString().slice(0, 10);
    return `created:>=${since} archived:false`;
  }
  return `${context.query} in:name,description,readme archived:false`;
}

const github = createProviderAdapter({
  id: 'github',
  availability() {
    return { state: 'ready' };
  },
  async fetchPage(context) {
    const page = pageNumber(context.cursor);
    const perPage = Math.max(10, Math.min(100, context.providerLimit || 30));
    const url = fixedUrl('https://api.github.com', '/search/repositories', {
      q: githubQuery(context),
      sort: 'stars',
      order: 'desc',
      per_page: perPage,
      page
    });
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Backer-Discovery/1.0',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    const token = context.env.BACKER_GITHUB_TOKEN || context.env.GITHUB_TOKEN || context.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const payload = await fetchJson(context.fetch, url, { headers, signal: context.signal });
    const observedAt = context.now().toISOString();
    const creators = [];
    const platformIdentities = [];
    const contentRecords = [];
    const metricObservations = [];
    const owners = new Map();

    for (const repository of Array.isArray(payload.items) ? payload.items : []) {
      const owner = repository && repository.owner;
      const login = owner && owner.login;
      if (!login || !owner.html_url) continue;
      let identity = owners.get(String(owner.id || login));
      if (!identity) {
        identity = identityBundle({
          provider: 'github',
          nativeId: String(owner.id || login),
          handle: login,
          displayName: login,
          bio: '',
          avatarUrl: owner.avatar_url,
          profileUrl: owner.html_url,
          verified: null,
          observedAt
        });
        if (!identity) continue;
        owners.set(String(owner.id || login), identity);
        creators.push(identity.creator);
        platformIdentities.push(identity.identity);
      }
      const content = contentForIdentity({
        provider: 'github',
        nativeId: String(repository.id || repository.full_name),
        contentType: 'repository',
        title: repository.full_name || repository.name,
        excerpt: repository.description || '',
        canonicalUrl: repository.html_url,
        thumbnailUrl: owner.avatar_url,
        publishedAt: repository.created_at,
        observedAt
      }, identity);
      if (!content) continue;
      contentRecords.push(content);
      [
        ['stars', repository.stargazers_count],
        ['forks', repository.forks_count],
        ['watchers', repository.subscribers_count],
        ['open_issues', repository.open_issues_count]
      ].forEach(([metric, value]) => addMetric(metricObservations, {
        entityType: 'content',
        entityId: content.id,
        provider: 'github',
        metric,
        value,
        observedAt,
        sourceUrl: content.canonicalUrl
      }));
    }
    const itemCount = Array.isArray(payload.items) ? payload.items.length : 0;
    const total = Math.min(1000, Number(payload.total_count) || 0);
    return {
      creators,
      platformIdentities,
      contentRecords,
      metricObservations,
      nextCursor: itemCount === perPage && page * perPage < total ? String(page + 1) : null
    };
  }
});

module.exports = { github, githubQuery, pageNumber };
