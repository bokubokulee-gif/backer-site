import { execFile } from 'node:child_process';
import { delimiter, dirname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const BILIBILI_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 BackerDiscovery/1.0';

function codedError(message, code) {
  return Object.assign(new Error(message), { code });
}

function finiteCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

export function normalizeBilibiliImageUrl(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  let parsed;
  try {
    parsed = new URL(source.startsWith('//') ? `https:${source}` : source.replace(/^http:/i, 'https:'));
  } catch (_error) {
    return '';
  }
  return parsed.protocol === 'https:' && /(^|\.)hdslb\.com$/i.test(parsed.hostname) ? parsed.href : '';
}

async function publicJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: { Accept: 'application/json', Referer: 'https://www.bilibili.com/', 'User-Agent': BILIBILI_USER_AGENT },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`Bilibili public metadata request failed with ${response.status}`);
  return response.json();
}

async function mapPool(rows, concurrency, task) {
  const output = new Array(rows.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await task(rows[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

export async function enrichBilibiliVideoRows(rows, options = {}) {
  return mapPool(rows || [], 6, async (row) => {
    try {
      const url = new URL('https://api.bilibili.com/x/web-interface/view');
      url.searchParams.set('bvid', row.videoId);
      const payload = await publicJson(url, options.fetchImpl);
      const data = payload && payload.code === 0 && payload.data || {};
      return {
        ...row,
        thumbnailUrl: normalizeBilibiliImageUrl(data.pic),
        ownerAvatarUrl: normalizeBilibiliImageUrl(data.owner && data.owner.face)
      };
    } catch (_error) {
      return row;
    }
  });
}

export async function enrichBilibiliUserRows(rows, query, page, options = {}) {
  try {
    const url = new URL('https://api.bilibili.com/x/web-interface/search/type');
    url.searchParams.set('search_type', 'bili_user');
    url.searchParams.set('keyword', query);
    url.searchParams.set('page', String(page));
    const payload = await publicJson(url, options.fetchImpl);
    const results = payload && payload.code === 0 && payload.data && Array.isArray(payload.data.result)
      ? payload.data.result : [];
    const avatarByOwner = new Map(results.map((result) => [String(result && result.mid || ''),
      normalizeBilibiliImageUrl(result && result.upic)]));
    return mapPool(rows || [], 2, async (row) => {
      const searchAvatar = avatarByOwner.get(row.ownerId) || '';
      if (searchAvatar) return { ...row, avatarUrl: searchAvatar };
      const cardUrl = new URL('https://api.bilibili.com/x/web-interface/card');
      cardUrl.searchParams.set('mid', row.ownerId);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const cardPayload = await publicJson(cardUrl, options.fetchImpl);
          const avatarUrl = normalizeBilibiliImageUrl(cardPayload && cardPayload.code === 0
            && cardPayload.data && cardPayload.data.card && cardPayload.data.card.face);
          if (avatarUrl) return { ...row, avatarUrl };
        } catch (_error) {
          // retry the same public card below
        }
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
      return row;
    });
  } catch (_error) {
    return rows || [];
  }
}

export async function fetchBilibiliOwnerAvatar(ownerIdValue, options = {}) {
  const ownerId = String(ownerIdValue || '').trim();
  if (!/^\d+$/.test(ownerId)) return '';
  const cardUrl = new URL('https://api.bilibili.com/x/web-interface/card');
  cardUrl.searchParams.set('mid', ownerId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const payload = await publicJson(cardUrl, options.fetchImpl);
      const avatar = normalizeBilibiliImageUrl(payload && payload.code === 0
        && payload.data && payload.data.card && payload.data.card.face);
      if (avatar) return avatar;
    } catch (_error) {
      // retry the public card after a bounded cool-down
    }
    await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
  }
  return '';
}

function routedEnvironment(environment, commands) {
  const source = environment || process.env;
  const commandDirectories = commands
    .map((command) => String(command || ''))
    .filter((command) => command.includes('/') || command.includes('\\'))
    .map((command) => dirname(command));
  return {
    ...source,
    PATH: Array.from(new Set(commandDirectories.concat(String(source.PATH || '').split(delimiter)).filter(Boolean)))
      .join(delimiter)
  };
}

export function parseBilibiliDoctorJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('internet capability doctor returned invalid JSON', 'provider_response_invalid');
  }
  const bilibili = parsed && parsed.bilibili;
  if (!bilibili || bilibili.active_backend !== 'bili-cli') {
    throw codedError('Bilibili public discovery backend is unavailable', 'provider_not_configured');
  }
  return bilibili;
}

function parseVideoCollection(value, location) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('Bilibili backend returned invalid JSON', 'provider_response_invalid');
  }
  const source = parsed && parsed.ok === true && parsed.data && Array.isArray(location(parsed.data))
    ? location(parsed.data)
    : null;
  if (!source) throw codedError('Bilibili backend returned an invalid page', 'provider_response_invalid');
  return source.map((row) => {
    const owner = row && row.owner || {};
    const videoId = String(row && (row.bvid || row.id) || '').trim();
    const ownerId = String(owner.id || '').trim();
    const title = String(row && row.title || '').trim();
    if (!/^BV[0-9A-Za-z]+$/.test(videoId) || !/^\d+$/.test(ownerId) || !title) return null;
    const stats = row.stats && typeof row.stats === 'object' ? row.stats : {};
    return {
      videoId,
      videoUrl: `https://www.bilibili.com/video/${videoId}`,
      title,
      description: String(row.description || ''),
      ownerId,
      ownerName: String(owner.name || ownerId),
      ownerUrl: `https://space.bilibili.com/${ownerId}`,
      durationSeconds: finiteCount(row.duration_seconds),
      metrics: {
        views: finiteCount(stats.view),
        danmaku: finiteCount(stats.danmaku),
        likes: finiteCount(stats.like),
        coins: finiteCount(stats.coin),
        favorites: finiteCount(stats.favorite),
        shares: finiteCount(stats.share)
      }
    };
  }).filter(Boolean);
}

export function parseBilibiliHotJson(value) {
  return parseVideoCollection(value, (data) => data.items);
}

export function parseBilibiliRankJson(value) {
  return parseVideoCollection(value, (data) => data.items);
}

export function parseBilibiliUserSearchJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('Bilibili backend returned invalid JSON', 'provider_response_invalid');
  }
  if (!parsed || parsed.ok !== true || !Array.isArray(parsed.data)) {
    throw codedError('Bilibili backend returned an invalid user page', 'provider_response_invalid');
  }
  return parsed.data.map((row) => {
    const ownerId = String(row && row.id || '').trim();
    const ownerName = String(row && row.name || '').trim();
    if (!/^\d+$/.test(ownerId) || !ownerName) return null;
    return {
      ownerId,
      ownerName,
      ownerUrl: `https://space.bilibili.com/${ownerId}`,
      bio: String(row.sign || ''),
      metrics: {
        followers: finiteCount(row.fans),
        videos: finiteCount(row.videos)
      }
    };
  }).filter(Boolean);
}

async function run(execImpl, command, args, options) {
  try {
    return await execImpl(command, args, options);
  } catch (error) {
    const stderr = String(error && error.stderr || '').trim();
    const wrapped = codedError(stderr || error.message || 'upstream command failed', 'provider_command_failed');
    wrapped.cause = error;
    throw wrapped;
  }
}

export async function verifyBilibiliInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const agentReachBin = options.agentReachBin || process.env.BACKER_AGENT_REACH_BIN || 'agent-reach';
  const biliBin = options.biliBin || process.env.BACKER_BILI_BIN || 'bili';
  const response = await run(execImpl, agentReachBin, ['doctor', '--json'], {
    env: routedEnvironment(options.env, [agentReachBin, biliBin]),
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024
  });
  return parseBilibiliDoctorJson(response.stdout);
}

export async function fetchBilibiliHotPageWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const biliBin = options.biliBin || process.env.BACKER_BILI_BIN || 'bili';
  const page = Math.max(1, Number.parseInt(options.page, 10) || 1);
  const resultLimit = Math.max(1, Math.min(100, Number.parseInt(options.resultLimit, 10) || 20));
  const response = await run(execImpl, biliBin, [
    'hot', '--page', String(page), '--max', String(resultLimit), '--json'
  ], {
    env: routedEnvironment(options.env, [biliBin]),
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 16 * 1024 * 1024
  });
  const rows = await enrichBilibiliVideoRows(parseBilibiliHotJson(response.stdout), options);
  return { rows, page, backend: 'bili-cli' };
}

export async function fetchBilibiliRankWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const biliBin = options.biliBin || process.env.BACKER_BILI_BIN || 'bili';
  const day = Number(options.day) === 7 ? 7 : 3;
  const resultLimit = Math.max(1, Math.min(100, Number.parseInt(options.resultLimit, 10) || 20));
  const response = await run(execImpl, biliBin, [
    'rank', '--day', String(day), '--max', String(resultLimit), '--json'
  ], {
    env: routedEnvironment(options.env, [biliBin]),
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 16 * 1024 * 1024
  });
  const rows = await enrichBilibiliVideoRows(parseBilibiliRankJson(response.stdout), options);
  return { rows, day, backend: 'bili-cli' };
}

export async function fetchBilibiliUsersWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const biliBin = options.biliBin || process.env.BACKER_BILI_BIN || 'bili';
  const query = String(options.query || '').normalize('NFKC').trim().slice(0, 80);
  if (!query) return { rows: [], query, backend: 'bili-cli' };
  const page = Math.max(1, Number.parseInt(options.page, 10) || 1);
  const resultLimit = Math.max(1, Math.min(100, Number.parseInt(options.resultLimit, 10) || 20));
  const response = await run(execImpl, biliBin, [
    'search', query, '--type', 'user', '--page', String(page), '--max', String(resultLimit), '--json'
  ], {
    env: routedEnvironment(options.env, [biliBin]),
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 16 * 1024 * 1024
  });
  const rows = await enrichBilibiliUserRows(parseBilibiliUserSearchJson(response.stdout), query, page, options);
  return { rows, query, page, backend: 'bili-cli' };
}
