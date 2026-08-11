#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(ROOT, 'marketplace-simulations', 'data', 'github-momentum.json');
const API_ROOT = 'https://api.github.com';
const GRAPHQL_URL = 'https://api.github.com/graphql';
const API_VERSION = '2026-03-10';
const SCHEMA_VERSION = 1;
const METHODOLOGY = 'backer-github-momentum-v1';

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function isoDay(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function rangeFor(now, days) {
  const end = new Date(now);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}

function normalizeRepository(raw) {
  if (!raw || !Number.isFinite(Number(raw.id)) || !raw.full_name || !raw.html_url || !raw.owner) return null;
  return {
    githubId: Number(raw.id),
    ownerGithubId: Number(raw.owner.id) || null,
    ownerLogin: String(raw.owner.login || ''),
    ownerType: String(raw.owner.type || ''),
    nameWithOwner: String(raw.full_name),
    url: String(raw.html_url),
    description: raw.description ? String(raw.description).slice(0, 280) : '',
    language: raw.language ? String(raw.language).slice(0, 80) : 'Open source',
    totalStars: Math.max(0, Number(raw.stargazers_count) || 0),
    totalForks: Math.max(0, Number(raw.forks_count) || 0),
    createdAt: raw.created_at ? new Date(raw.created_at).toISOString() : null,
    pushedAt: raw.pushed_at ? new Date(raw.pushed_at).toISOString() : null,
    archived: Boolean(raw.archived),
    avatarUrl: raw.owner.avatar_url ? String(raw.owner.avatar_url) : '',
    profileUrl: raw.owner.html_url ? String(raw.owner.html_url) : ''
  };
}

function normalizeUser(raw) {
  if (!raw || !Number.isFinite(Number(raw.id)) || !raw.login || !raw.html_url || !raw.avatar_url) return null;
  return {
    githubId: Number(raw.id),
    login: String(raw.login),
    displayName: raw.name ? String(raw.name).slice(0, 120) : String(raw.login),
    avatarUrl: String(raw.avatar_url),
    profileUrl: String(raw.html_url),
    bio: raw.bio ? String(raw.bio).slice(0, 280) : '',
    followerCount: Math.max(0, Number(raw.followers) || 0),
    publicRepos: Math.max(0, Number(raw.public_repos) || 0),
    eligibility: 'discovery-only'
  };
}

function scoreMomentum(input) {
  const stars = Math.log10(Math.max(1, Number(input.totalProjectStars) || 0) + 1) / 5;
  const followers = Math.log10(Math.max(1, Number(input.followerCount) || 0) + 1) / 5;
  const contributions = clamp((Number(input.publicContributions) || 0) / 80, 0, 1);
  const activeDays = clamp((Number(input.activeDays) || 0) / Math.max(1, Number(input.rangeDays) || 7), 0, 1);
  const consistency = clamp((Number(input.consistency) || 0) / 100, 0, 1);
  const freshness = clamp(Number(input.freshness) || 0, 0, 1);
  const concentrationPenalty = clamp(Number(input.concentrationPenalty) || 0, 0, 18);
  const value = 100 * (
    0.22 * stars +
    0.10 * followers +
    0.24 * contributions +
    0.18 * activeDays +
    0.16 * consistency +
    0.10 * freshness
  ) - concentrationPenalty;
  return Math.round(clamp(value, 0, 100) * 10) / 10;
}

function buildSeries(momentum, seed) {
  const last = clamp(momentum, 0, 100);
  const start = clamp(last - 26 - seed % 9, 4, 92);
  return Array.from({ length: 7 }, (_value, index) => {
    const t = index / 6;
    const curve = start + (last - start) * (t * t * (3 - 2 * t));
    const wobble = index === 0 || index === 6 ? 0 : ((seed + index * 7) % 5) - 2;
    return Math.round(clamp(curve + wobble, 0, 100));
  });
}

function concentrationPenalty(repositories) {
  const stars = repositories.map(repo => repo.totalStars).filter(Number.isFinite);
  const total = stars.reduce((sum, value) => sum + value, 0);
  if (!total || stars.length < 2) return 10;
  const share = Math.max(...stars) / total;
  return Math.round(clamp((share - 0.55) * 40, 0, 18) * 10) / 10;
}

function buildPersonSnapshot(user, repositories, contribution, range, capturedAt) {
  const sorted = repositories.slice().sort((a, b) => b.totalStars - a.totalStars || Date.parse(b.pushedAt || 0) - Date.parse(a.pushedAt || 0));
  const breakout = sorted[0];
  if (!breakout) return null;
  const totalProjectStars = sorted.reduce((sum, repo) => sum + repo.totalStars, 0);
  const totalProjectForks = sorted.reduce((sum, repo) => sum + repo.totalForks, 0);
  const pushedAgeDays = breakout.pushedAt ? Math.max(0, (capturedAt.getTime() - Date.parse(breakout.pushedAt)) / 86400000) : 60;
  const freshness = clamp(1 - pushedAgeDays / 45, 0, 1);
  const consistency = contribution.consistency;
  const penalty = concentrationPenalty(sorted);
  const momentum = scoreMomentum({
    totalProjectStars,
    followerCount: user.followerCount,
    publicContributions: contribution.total,
    activeDays: contribution.activeDays,
    rangeDays: contribution.rangeDays,
    consistency,
    freshness,
    concentrationPenalty: penalty
  });
  return {
    githubId: user.githubId,
    login: user.login,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileUrl: user.profileUrl,
    bio: user.bio,
    breakoutRepo: {
      githubId: breakout.githubId,
      nameWithOwner: breakout.nameWithOwner,
      url: breakout.url,
      description: breakout.description,
      language: breakout.language,
      totalStars: breakout.totalStars,
      totalForks: breakout.totalForks,
      pushedAt: breakout.pushedAt
    },
    repositories: sorted.map(repo => ({
      githubId: repo.githubId,
      nameWithOwner: repo.nameWithOwner,
      url: repo.url,
      relationship: repo.relationship || (repo.ownerGithubId === user.githubId ? 'owner' : 'contributor'),
      contributionCount: repo.contributionCount || null,
      totalStars: repo.totalStars,
      totalForks: repo.totalForks,
      pushedAt: repo.pushedAt
    })),
    signals: {
      followerCount: user.followerCount,
      totalProjectStars,
      totalProjectForks,
      publicContributions: contribution.total,
      activeDays: contribution.activeDays,
      contributionConsistency: consistency,
      repositoryConcentrationPenalty: penalty
    },
    metricsByRange: {
      '7d': {
        momentum,
        activity: `Active ${contribution.activeDays} of ${contribution.rangeDays} days`,
        activeDays: contribution.activeDays,
        consistency,
        series: buildSeries(momentum, user.githubId % 97)
      }
    },
    eligibility: 'discovery-only',
    provenance: { source: 'github-api', asOf: capturedAt.toISOString(), rangeStart: range.start.toISOString(), rangeEnd: range.end.toISOString() }
  };
}

function requestHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'Backer-GitHub-Momentum'
  };
}

async function githubJson(fetchImpl, token, url, options) {
  const response = await fetchImpl(url, Object.assign({}, options || {}, {
    headers: Object.assign({}, requestHeaders(token), options && options.headers || {})
  }));
  if (!response.ok) {
    const error = new Error(`GitHub request failed with ${response.status}`);
    error.code = `github_${response.status}`;
    throw error;
  }
  return response.json();
}

async function searchRepositories(fetchImpl, token, query) {
  const url = new URL('/search/repositories', API_ROOT);
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', '100');
  const payload = await githubJson(fetchImpl, token, url);
  return (payload.items || []).map(normalizeRepository).filter(Boolean);
}

async function fetchContributors(fetchImpl, token, repository) {
  const url = `${API_ROOT}/repos/${repository.nameWithOwner}/contributors?per_page=5`;
  const payload = await githubJson(fetchImpl, token, url);
  return payload.filter(row => row && row.type === 'User' && Number(row.id)).map(row => ({
    githubId: Number(row.id),
    login: String(row.login),
    avatarUrl: String(row.avatar_url || ''),
    profileUrl: String(row.html_url || ''),
    contributionCount: Number(row.contributions) || 0
  }));
}

async function fetchContributionWindow(fetchImpl, token, login, range) {
  const query = `query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
      }
    }
  }`;
  const payload = await githubJson(fetchImpl, token, GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login, from: range.start.toISOString(), to: range.end.toISOString() } })
  });
  if (payload.errors || !payload.data || !payload.data.user) return { total: 0, activeDays: 0, consistency: 0, rangeDays: 7, partial: true };
  const collection = payload.data.user.contributionsCollection;
  const days = collection.contributionCalendar.weeks.flatMap(week => week.contributionDays).filter(day => {
    const time = Date.parse(`${day.date}T00:00:00Z`);
    return time >= range.start.getTime() && time <= range.end.getTime();
  });
  const activeDays = days.filter(day => day.contributionCount > 0).length;
  const counts = days.map(day => day.contributionCount);
  const mean = counts.length ? counts.reduce((sum, value) => sum + value, 0) / counts.length : 0;
  const variance = counts.length ? counts.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / counts.length : 0;
  const volatility = mean ? Math.sqrt(variance) / mean : 1;
  const consistency = Math.round(clamp(100 - volatility * 35, 0, 100));
  return {
    total: collection.contributionCalendar.totalContributions,
    activeDays,
    consistency,
    rangeDays: Math.max(1, days.length),
    partial: false
  };
}

function deduplicateRepositories(repositories) {
  const map = new Map();
  repositories.forEach(repo => {
    const existing = map.get(repo.githubId);
    if (!existing || repo.totalStars > existing.totalStars) map.set(repo.githubId, repo);
  });
  return Array.from(map.values());
}

async function buildSnapshot(options) {
  const config = Object.assign({ fetchImpl: globalThis.fetch, now: new Date(), peopleLimit: 16 }, options || {});
  if (typeof config.fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  if (!config.token) throw new Error('GITHUB_TOKEN is required');
  const capturedAt = new Date(config.now);
  const range = rangeFor(capturedAt, 7);
  const date = isoDay(range.start);
  const pushedQuery = `pushed:>=${date} fork:false archived:false stars:>=20`;
  const createdQuery = `created:>=${date} fork:false archived:false`;
  const [pushed, created] = await Promise.all([
    searchRepositories(config.fetchImpl, config.token, pushedQuery),
    searchRepositories(config.fetchImpl, config.token, createdQuery)
  ]);
  const repositories = deduplicateRepositories(pushed.concat(created)).slice(0, 80);
  const candidates = new Map();

  repositories.forEach(repo => {
    if (repo.ownerType !== 'User') return;
    candidates.set(repo.ownerGithubId, {
      githubId: repo.ownerGithubId,
      login: repo.ownerLogin,
      avatarUrl: repo.avatarUrl,
      profileUrl: repo.profileUrl,
      repositories: [Object.assign({ relationship: 'owner' }, repo)]
    });
  });

  const organizationRepos = repositories.filter(repo => repo.ownerType === 'Organization').slice(0, 10);
  for (const repo of organizationRepos) {
    try {
      const contributors = await fetchContributors(config.fetchImpl, config.token, repo);
      contributors.slice(0, 2).forEach(contributor => {
        const existing = candidates.get(contributor.githubId) || Object.assign({ repositories: [] }, contributor);
        existing.repositories.push(Object.assign({ relationship: 'contributor', contributionCount: contributor.contributionCount }, repo));
        candidates.set(contributor.githubId, existing);
      });
    } catch (_error) {
      // A contributor failure reduces coverage but does not discard the successful repository search.
    }
  }

  const rankedCandidates = Array.from(candidates.values()).sort((a, b) => {
    const starsA = a.repositories.reduce((sum, repo) => sum + repo.totalStars, 0);
    const starsB = b.repositories.reduce((sum, repo) => sum + repo.totalStars, 0);
    return starsB - starsA;
  }).slice(0, config.peopleLimit);

  const people = [];
  for (const candidate of rankedCandidates) {
    try {
      const [rawUser, contribution] = await Promise.all([
        githubJson(config.fetchImpl, config.token, `${API_ROOT}/users/${encodeURIComponent(candidate.login)}`),
        fetchContributionWindow(config.fetchImpl, config.token, candidate.login, range)
      ]);
      const user = normalizeUser(rawUser);
      if (!user) continue;
      const person = buildPersonSnapshot(user, candidate.repositories, contribution, range, capturedAt);
      if (person) people.push(person);
    } catch (_error) {
      // One profile must not prevent other successfully fetched people from reaching the snapshot.
    }
  }

  if (!people.length) {
    const error = new Error('GitHub sync produced no usable people');
    error.code = 'empty_snapshot';
    throw error;
  }

  people.sort((a, b) => b.metricsByRange['7d'].momentum - a.metricsByRange['7d'].momentum);
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: capturedAt.toISOString(),
    status: people.length < Math.min(config.peopleLimit, 8) ? 'partial' : 'fresh',
    range: { key: '7d', start: range.start.toISOString(), end: range.end.toISOString() },
    methodology: METHODOLOGY,
    notice: 'Backer GitHub Momentum is derived from official GitHub API snapshots. It is not GitHub Trending, a person valuation, or a settlement oracle.',
    people
  };
}

async function atomicWriteJson(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const temporary = `${targetPath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporary, targetPath);
}

async function persistSnapshot(snapshot, connectionString) {
  if (!connectionString) return;
  const pgModule = await import('pg');
  const Pool = pgModule.Pool || pgModule.default && pgModule.default.Pool;
  const pool = new Pool({ connectionString, max: 1, allowExitOnIdle: true, application_name: 'backer-github-momentum' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const run = await client.query(
      `insert into github_ingestion_runs
         (started_at, completed_at, status, schema_version, methodology_version, people_count, repository_count)
       values ($1, $1, $2, $3, $4, $5, $6)
       returning id`,
      [snapshot.generatedAt, snapshot.status === 'fresh' ? 'succeeded' : 'partial', snapshot.schemaVersion, snapshot.methodology, snapshot.people.length, snapshot.people.reduce((sum, person) => sum + person.repositories.length, 0)]
    );
    for (const person of snapshot.people) {
      await client.query(
        `insert into github_people
           (github_id, login, display_name, avatar_url, profile_url, bio, eligibility, source, first_seen_at, last_seen_at)
         values ($1, $2, $3, $4, $5, $6, 'discovery-only', 'github-api', $7, $7)
         on conflict (github_id) do update set
           login = excluded.login,
           display_name = excluded.display_name,
           avatar_url = excluded.avatar_url,
           profile_url = excluded.profile_url,
           bio = excluded.bio,
           last_seen_at = excluded.last_seen_at`,
        [person.githubId, person.login, person.displayName, person.avatarUrl, person.profileUrl, person.bio, snapshot.generatedAt]
      );
      for (const repo of person.repositories) {
        const detail = repo.githubId === person.breakoutRepo.githubId ? person.breakoutRepo : repo;
        await client.query(
          `insert into github_repositories
             (github_id, name_with_owner, repository_url, description, primary_language, total_stars, total_forks, pushed_at, captured_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           on conflict (github_id) do update set
             name_with_owner = excluded.name_with_owner,
             repository_url = excluded.repository_url,
             description = excluded.description,
             primary_language = excluded.primary_language,
             total_stars = excluded.total_stars,
             total_forks = excluded.total_forks,
             pushed_at = excluded.pushed_at,
             captured_at = excluded.captured_at`,
          [repo.githubId, repo.nameWithOwner, repo.url, detail.description || '', detail.language || 'Open source', repo.totalStars, repo.totalForks, repo.pushedAt, snapshot.generatedAt]
        );
        await client.query(
          `insert into github_person_repositories
             (person_github_id, repository_github_id, relationship, contribution_count, captured_at)
           values ($1, $2, $3, $4, $5)
           on conflict (person_github_id, repository_github_id) do update set
             relationship = excluded.relationship,
             contribution_count = excluded.contribution_count,
             captured_at = excluded.captured_at`,
          [person.githubId, repo.githubId, repo.relationship, repo.contributionCount, snapshot.generatedAt]
        );
      }
      const metric = person.metricsByRange['7d'];
      await client.query(
        `insert into github_daily_person_snapshots
           (person_github_id, snapshot_date, captured_at, follower_count, total_project_stars,
            total_project_forks, public_contributions, active_days, contribution_consistency,
            backer_momentum, methodology_version, source_status)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         on conflict (person_github_id, snapshot_date) do update set
           captured_at = excluded.captured_at,
           follower_count = excluded.follower_count,
           total_project_stars = excluded.total_project_stars,
           total_project_forks = excluded.total_project_forks,
           public_contributions = excluded.public_contributions,
           active_days = excluded.active_days,
           contribution_consistency = excluded.contribution_consistency,
           backer_momentum = excluded.backer_momentum,
           methodology_version = excluded.methodology_version,
           source_status = excluded.source_status`,
        [person.githubId, snapshot.generatedAt.slice(0, 10), snapshot.generatedAt, person.signals.followerCount, person.signals.totalProjectStars, person.signals.totalProjectForks, person.signals.publicContributions, person.signals.activeDays, person.signals.contributionConsistency, metric.momentum, snapshot.methodology, snapshot.status === 'fresh' ? 'fresh' : 'partial']
      );
    }
    await client.query('commit');
    return run.rows[0].id;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const snapshot = await buildSnapshot({ token });
  if (process.env.DATABASE_URL) await persistSnapshot(snapshot, process.env.DATABASE_URL);
  await atomicWriteJson(OUTPUT_PATH, snapshot);
  process.stdout.write(`GitHub momentum snapshot updated with ${snapshot.people.length} people.\n`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().catch(error => {
    const code = error && error.code ? String(error.code) : 'sync_failed';
    process.stderr.write(`GitHub momentum sync failed (${code}). Last-good JSON was preserved.\n`);
    process.exitCode = 1;
  });
}

export {
  API_VERSION,
  METHODOLOGY,
  SCHEMA_VERSION,
  atomicWriteJson,
  buildPersonSnapshot,
  buildSeries,
  buildSnapshot,
  concentrationPenalty,
  deduplicateRepositories,
  isoDay,
  normalizeRepository,
  normalizeUser,
  rangeFor,
  scoreMomentum
};
