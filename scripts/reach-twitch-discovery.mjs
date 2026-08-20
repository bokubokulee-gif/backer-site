import { execFile } from 'node:child_process';
import { delimiter, dirname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function codedError(message, code) {
  return Object.assign(new Error(message), { code });
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

export function parseTwitchRouterDoctorJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('internet capability doctor returned invalid JSON', 'provider_response_invalid');
  }
  if (!parsed || !parsed.youtube || parsed.youtube.active_backend !== 'yt-dlp') {
    throw codedError('public video extractor is unavailable', 'provider_not_configured');
  }
  return parsed.youtube;
}

export function parseTwitchPlaylistJson(value, requestedHandle) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('Twitch extractor returned invalid JSON', 'provider_response_invalid');
  }
  const handle = String(requestedHandle || '').toLowerCase();
  if (!/^[a-z0-9_]{2,40}$/.test(handle) || String(parsed && parsed.id || '').toLowerCase() !== handle
    || !Array.isArray(parsed.entries)) {
    throw codedError('Twitch extractor returned an invalid channel playlist', 'provider_response_invalid');
  }
  const channelUrl = `https://www.twitch.tv/${handle}`;
  return parsed.entries.map((entry) => {
    const nativeId = String(entry && entry.id || '').trim();
    const title = String(entry && entry.title || '').trim();
    const canonicalUrl = String(entry && (entry.webpage_url || entry.url) || '').trim();
    const views = Number(entry && entry.view_count);
    if (!/^v?\d+$/.test(nativeId) || !title
      || !/^https:\/\/(?:www\.)?twitch\.tv\/videos\/\d+(?:[?#].*)?$/i.test(canonicalUrl)) return null;
    return {
      nativeId,
      title,
      canonicalUrl,
      thumbnailUrl: String(entry.thumbnail || ''),
      durationSeconds: Number.isFinite(Number(entry.duration)) ? Math.max(0, Math.round(Number(entry.duration))) : null,
      viewCount: Number.isFinite(views) && views >= 0 ? Math.round(views) : null,
      channelHandle: handle,
      channelUrl
    };
  }).filter(Boolean);
}

export async function verifyTwitchInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const agentReachBin = options.agentReachBin || process.env.BACKER_AGENT_REACH_BIN || 'agent-reach';
  const ytDlpBin = options.ytDlpBin || process.env.BACKER_YT_DLP_BIN || 'yt-dlp';
  const response = await run(execImpl, agentReachBin, ['doctor', '--json'], {
    env: routedEnvironment(options.env, [agentReachBin, ytDlpBin]),
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024
  });
  return parseTwitchRouterDoctorJson(response.stdout);
}

export async function fetchTwitchVodsWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const ytDlpBin = options.ytDlpBin || process.env.BACKER_YT_DLP_BIN || 'yt-dlp';
  const handle = String(options.handle || '').normalize('NFKC').toLowerCase().trim();
  if (!/^[a-z0-9_]{2,40}$/.test(handle)) {
    throw codedError('invalid reviewed Twitch handle', 'provider_response_invalid');
  }
  const resultLimit = Math.max(1, Math.min(12, Number.parseInt(options.resultLimit, 10) || 3));
  const channelUrl = `https://www.twitch.tv/${handle}/videos`;
  const response = await run(execImpl, ytDlpBin, [
    '--flat-playlist', '--playlist-end', String(resultLimit), '--dump-single-json', channelUrl
  ], {
    env: routedEnvironment(options.env, [ytDlpBin]),
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  });
  const rows = parseTwitchPlaylistJson(response.stdout, handle);
  if (!rows.length) throw codedError('reviewed Twitch channel returned no public VODs', 'no_matches');
  return { rows, handle, channelUrl: `https://www.twitch.tv/${handle}`, backend: 'yt-dlp' };
}
