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
    throw codedError(stderr || error.message || 'Instagram upstream command failed',
      error && error.code === 'ETIMEDOUT' ? 'provider_timeout' : 'provider_command_failed');
  }
}

export function parseInstagramDoctor(value) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('internet capability doctor returned invalid JSON', 'provider_response_invalid');
  }
  const instagram = parsed && parsed.instagram;
  if (!instagram || instagram.active_backend !== 'opencli') {
    throw codedError('Instagram requires a connected, user-controlled browser session', 'provider_permission_required');
  }
  return instagram;
}

export function parseOpenCliDoctor(value) {
  const report = String(value || '');
  if (!/\[OK\]\s+Extension:\s+connected/i.test(report)) {
    throw codedError('OpenCLI browser extension is not connected', 'provider_permission_required');
  }
  return { connected: true };
}

function instagramUrl(value, kind) {
  try {
    const parsed = new URL(String(value || '').trim());
    if (parsed.protocol !== 'https:' || !/(^|\.)instagram\.com$/i.test(parsed.hostname)) return '';
    if (kind === 'profile' && !/^\/[A-Za-z0-9._]+\/?$/.test(parsed.pathname)) return '';
    return parsed.href;
  } catch (_error) {
    return '';
  }
}

function instagramImage(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:' && /(^|\.)cdninstagram\.com$/i.test(parsed.hostname) ? parsed.href : '';
  } catch (_error) {
    return '';
  }
}

export function parseInstagramProfileJson(value) {
  let source;
  try {
    source = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('Instagram profile response was invalid JSON', 'provider_response_invalid');
  }
  const row = Array.isArray(source) ? source[0] : source;
  const username = String(row && (row.username || row.handle) || '').replace(/^@/, '').trim();
  const profileUrl = instagramUrl(row && (row.url || row.profile_url), 'profile');
  const avatarUrl = instagramImage(row && (row.profile_pic_url || row.profile_picture_url || row.avatar_url));
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username) || !profileUrl || !avatarUrl) {
    throw codedError('Instagram adapter did not return a source-linked profile image', 'provider_response_invalid');
  }
  return {
    nativeId: username.toLowerCase(),
    handle: username,
    displayName: String(row.full_name || row.name || username),
    bio: String(row.bio || row.biography || ''),
    profileUrl,
    avatarUrl,
    verified: typeof row.verified === 'boolean' ? row.verified : null
  };
}

export function parseInstagramPostsJson(value, owner) {
  let source;
  try {
    source = JSON.parse(String(value || ''));
  } catch (_error) {
    throw codedError('Instagram post response was invalid JSON', 'provider_response_invalid');
  }
  const rows = Array.isArray(source) ? source : source && Array.isArray(source.items) ? source.items : [];
  return rows.map((row) => {
    const canonicalUrl = instagramUrl(row && (row.url || row.permalink), 'content');
    const thumbnailUrl = instagramImage(row && (row.thumbnail_url || row.display_url || row.image_url));
    const nativeId = String(row && (row.id || row.shortcode) || '').trim();
    if (!canonicalUrl || !thumbnailUrl || !nativeId) return null;
    return {
      nativeId,
      title: String(row.caption || `Instagram post by ${owner.displayName}`).trim().slice(0, 280),
      excerpt: String(row.caption || '').trim(),
      canonicalUrl,
      thumbnailUrl,
      publishedAt: row.date || row.taken_at || null
    };
  }).filter(Boolean);
}

export async function verifyInstagramInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const agentReachBin = options.agentReachBin || process.env.BACKER_AGENT_REACH_BIN || 'agent-reach';
  const opencliBin = options.opencliBin || process.env.BACKER_OPENCLI_BIN || 'opencli';
  const env = routedEnvironment(options.env, [agentReachBin, opencliBin]);
  const doctor = await run(execImpl, agentReachBin, ['doctor', '--json'], {
    env, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024
  });
  parseInstagramDoctor(doctor.stdout);
  const opencli = await run(execImpl, opencliBin, ['doctor'], {
    env, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024
  });
  parseOpenCliDoctor(opencli.stdout);
  return { backend: 'opencli', connected: true };
}

export async function discoverInstagramWithInstalledRouter(options = {}) {
  const execImpl = options.execImpl || execFileAsync;
  const opencliBin = options.opencliBin || process.env.BACKER_OPENCLI_BIN || 'opencli';
  const queries = Array.from(new Set((options.queries || []).map((value) => String(value).trim()).filter(Boolean)));
  const env = routedEnvironment(options.env, [opencliBin]);
  await verifyInstagramInstalledRouter({ ...options, execImpl, opencliBin, env });
  const profiles = new Map();
  const content = [];
  for (const query of queries) {
    const search = await run(execImpl, opencliBin, ['instagram', 'search', query, '-f', 'json'], {
      env, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024
    });
    let results;
    try {
      results = JSON.parse(search.stdout);
    } catch (_error) {
      throw codedError('Instagram search response was invalid JSON', 'provider_response_invalid');
    }
    for (const hit of Array.isArray(results) ? results.slice(0, 8) : []) {
      const handle = String(hit && (hit.username || hit.handle) || '').replace(/^@/, '').trim();
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle) || profiles.has(handle.toLowerCase())) continue;
      const profileResponse = await run(execImpl, opencliBin, ['instagram', 'profile', handle, '-f', 'json'], {
        env, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024
      });
      const profile = parseInstagramProfileJson(profileResponse.stdout);
      profiles.set(profile.nativeId, profile);
      const postsResponse = await run(execImpl, opencliBin, ['instagram', 'user', handle, '-f', 'json'], {
        env, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024
      });
      content.push(...parseInstagramPostsJson(postsResponse.stdout, profile)
        .map((row) => ({ ...row, ownerNativeId: profile.nativeId })));
    }
  }
  return { profiles: Array.from(profiles.values()), content, backend: 'opencli', pagesRead: queries.length };
}
