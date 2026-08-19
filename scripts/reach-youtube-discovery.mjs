import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function codedError(message, code) {
  return Object.assign(new Error(message), { code });
}

export function parseDoctorJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('internet capability doctor returned invalid JSON', 'provider_response_invalid');
  }
  const youtube = parsed && parsed.youtube;
  if (!youtube || youtube.active_backend !== 'yt-dlp') {
    throw codedError('YouTube discovery backend is unavailable', 'provider_not_configured');
  }
  return youtube;
}

export function parseYtDlpJsonLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_error) {
        return null;
      }
    })
    .filter((row) => row && row.id && row.channel_id && row.title && row.url)
    .map((row) => ({
      videoId: String(row.id),
      videoUrl: String(row.webpage_url || row.url),
      title: String(row.title),
      description: String(row.description || ''),
      channelId: String(row.channel_id),
      channelName: String(row.channel || row.uploader || row.channel_id),
      channelHandle: String(row.uploader_id || row.channel_id),
      channelUrl: String(row.uploader_url || row.channel_url
        || `https://www.youtube.com/channel/${encodeURIComponent(row.channel_id)}`),
      thumbnailUrl: Array.isArray(row.thumbnails) && row.thumbnails.length
        ? String(row.thumbnails.at(-1).url || '')
        : '',
      viewCount: Number.isFinite(Number(row.view_count)) ? Number(row.view_count) : null,
      verified: row.channel_is_verified === true ? true : null
    }));
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

export async function discoverYouTubeWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const agentReachBin = options.agentReachBin || process.env.BACKER_AGENT_REACH_BIN || 'agent-reach';
  const ytDlpBin = options.ytDlpBin || process.env.BACKER_YT_DLP_BIN || 'yt-dlp';
  const queries = Array.from(new Set((options.queries || []).map((value) => String(value).trim()).filter(Boolean)));
  const resultLimit = Math.max(1, Math.min(50, Number.parseInt(options.resultLimit, 10) || 12));
  if (!queries.length) return { rows: [], pagesRead: 0, backend: 'yt-dlp' };

  const doctor = await run(execImpl, agentReachBin, ['doctor', '--json'], {
    env: options.env || process.env,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024
  });
  parseDoctorJson(doctor.stdout);

  const outputs = await Promise.all(queries.map((query) => run(execImpl, ytDlpBin, [
    '--js-runtimes', 'node',
    '--flat-playlist',
    '--dump-json',
    `ytsearch${resultLimit}:${query}`
  ], {
    env: options.env || process.env,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  })));

  const rowsByVideo = new Map();
  outputs.forEach((output) => {
    parseYtDlpJsonLines(output.stdout).forEach((row) => rowsByVideo.set(row.videoId, row));
  });
  return { rows: Array.from(rowsByVideo.values()), pagesRead: queries.length, backend: 'yt-dlp' };
}
