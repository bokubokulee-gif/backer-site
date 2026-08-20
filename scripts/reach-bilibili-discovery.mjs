import { execFile } from 'node:child_process';
import { delimiter, dirname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function codedError(message, code) {
  return Object.assign(new Error(message), { code });
}

function finiteCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
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
  return { rows: parseBilibiliHotJson(response.stdout), page, backend: 'bili-cli' };
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
  return { rows: parseBilibiliRankJson(response.stdout), day, backend: 'bili-cli' };
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
  return { rows: parseBilibiliUserSearchJson(response.stdout), query, page, backend: 'bili-cli' };
}
