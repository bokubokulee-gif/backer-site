'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createContentRecord, createCreator } = require('../api/_lib/discovery-model');

const ROOT = path.join(__dirname, '..');

test('discovery media retains canonical source provenance and honest fallback roles', () => {
  const creator = createCreator({
    provider: 'youtube', nativeId: 'channel', displayName: 'Channel',
    profileUrl: 'https://www.youtube.com/channel/channel',
    avatarUrl: 'https://yt3.googleusercontent.com/avatar=s0',
    observedAt: '2026-08-20T00:00:00.000Z'
  });
  assert.equal(creator.avatarSourceUrl, 'https://www.youtube.com/channel/channel');
  const content = createContentRecord({
    provider: 'youtube', nativeId: 'video', creatorId: creator.id,
    platformIdentityId: 'identity_test', title: 'Video',
    canonicalUrl: 'https://www.youtube.com/watch?v=video',
    thumbnailUrl: 'https://i.ytimg.com/vi/video/hqdefault.jpg',
    thumbnailRole: 'creator_avatar_fallback',
    observedAt: '2026-08-20T00:00:00.000Z'
  });
  assert.equal(content.thumbnailSourceUrl, 'https://www.youtube.com/watch?v=video');
  assert.equal(content.thumbnailRole, 'creator_avatar_fallback');
});

test('retained catalog orders image-complete rows first without dropping incomplete records', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/discovery-catalog.json'), 'utf8'));
  const avatarCount = catalog.creators.filter((row) => row.avatarUrl).length;
  const thumbnailCount = catalog.contentRecords.filter((row) => row.thumbnailUrl).length;
  assert.deepEqual(catalog.creators.slice(0, avatarCount).filter((row) => !row.avatarUrl), []);
  assert.deepEqual(catalog.contentRecords.slice(0, thumbnailCount).filter((row) => !row.thumbnailUrl), []);
  assert.ok(catalog.creators.slice(avatarCount).every((row) => !row.avatarUrl));
  assert.ok(catalog.contentRecords.slice(thumbnailCount).every((row) => !row.thumbnailUrl));
  assert.ok(avatarCount / catalog.creators.length > 0.97, 'creator media coverage regressed below 97%');
  assert.ok(thumbnailCount / catalog.contentRecords.length > 0.98, 'content media coverage regressed below 98%');
  assert.ok(catalog.creators.filter((row) => row.avatarUrl).every((row) => /^https:\/\//.test(row.avatarSourceUrl)));
  assert.ok(catalog.contentRecords.filter((row) => row.thumbnailUrl).every((row) => /^https:\/\//.test(row.thumbnailSourceUrl)
    && ['content', 'publication_art', 'creator_avatar_fallback'].includes(row.thumbnailRole)));
});

test('Instagram remains an explicit connection-required provider when browser bridge is unavailable', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/discovery-catalog.json'), 'utf8'));
  const run = catalog.providerRuns.find((row) => row.provider === 'instagram');
  assert.ok(run, 'Instagram provider state must not disappear from the catalog');
  assert.equal(run.state, 'permission_required');
  assert.equal(run.publishState, 'unavailable');
  assert.equal(run.reasonCode, 'browser_extension_not_connected');
  assert.equal(catalog.platformIdentities.filter((row) => row.provider === 'instagram').length, 0);
});

test('Agent Reach media parsers accept only source-linked upstream image contracts', async () => {
  const instagram = await import('../scripts/reach-instagram-discovery.mjs');
  const youtube = await import('../scripts/reach-youtube-discovery.mjs');
  const bilibili = await import('../scripts/reach-bilibili-discovery.mjs');
  assert.throws(() => instagram.parseInstagramDoctor(JSON.stringify({ instagram: { active_backend: null } })),
    { code: 'provider_permission_required' });
  assert.throws(() => instagram.parseOpenCliDoctor('[MISSING] Extension: not connected'),
    { code: 'provider_permission_required' });
  const profile = instagram.parseInstagramProfileJson(JSON.stringify({
    username: 'sample.creator', name: 'Sample Creator',
    url: 'https://www.instagram.com/sample.creator/',
    profile_picture_url: 'https://scontent.cdninstagram.com/profile.jpg'
  }));
  assert.equal(profile.avatarUrl, 'https://scontent.cdninstagram.com/profile.jpg');
  assert.throws(() => instagram.parseInstagramProfileJson(JSON.stringify({
    username: 'sample.creator', url: 'https://www.instagram.com/sample.creator/',
    profile_picture_url: 'https://example.com/fake.jpg'
  })), { code: 'provider_response_invalid' });
  const channel = youtube.parseYtDlpChannelJson(JSON.stringify({
    id: 'UC1', channel_follower_count: 123456, thumbnails: [
      { id: 'banner_uncropped', url: 'https://yt3.googleusercontent.com/banner=s0' },
      { id: 'avatar_uncropped', url: 'https://yt3.googleusercontent.com/avatar=s0' }
    ]
  }));
  assert.equal(channel.avatarUrl, 'https://yt3.googleusercontent.com/avatar=s0');
  assert.equal(channel.subscriberCount, 123456);
  assert.equal(bilibili.normalizeBilibiliImageUrl('//i0.hdslb.com/bfs/face/example.jpg'),
    'https://i0.hdslb.com/bfs/face/example.jpg');
  assert.equal(bilibili.normalizeBilibiliImageUrl('https://example.com/fake.jpg'), '');
});

test('installed YouTube route carries the exact public channel follower count into discovered rows', async () => {
  const youtube = await import('../scripts/reach-youtube-discovery.mjs');
  const execImpl = async (command, args) => {
    if (String(command).includes('agent-reach')) {
      return { stdout: JSON.stringify({ youtube: { active_backend: 'yt-dlp' } }), stderr: '' };
    }
    if (args.some((value) => String(value).startsWith('ytsearch'))) {
      return {
        stdout: `${JSON.stringify({
          id: 'video-1', url: 'https://www.youtube.com/watch?v=video-1',
          webpage_url: 'https://www.youtube.com/watch?v=video-1', title: 'Real source video',
          channel_id: 'UC-real', channel: 'Real Creator', uploader_id: '@realcreator',
          uploader_url: 'https://www.youtube.com/@realcreator', view_count: 42,
          thumbnails: [{ url: 'https://i.ytimg.com/vi/video-1/hq720.jpg' }]
        })}\n`,
        stderr: ''
      };
    }
    return {
      stdout: JSON.stringify({
        id: 'UC-real', channel_id: 'UC-real', channel_follower_count: 987654,
        thumbnails: [{ id: 'avatar_uncropped', url: 'https://yt3.googleusercontent.com/real=s0' }]
      }),
      stderr: ''
    };
  };
  const result = await youtube.discoverYouTubeWithInstalledRouter({
    execImpl, agentReachBin: 'agent-reach', ytDlpBin: 'yt-dlp', queries: ['real creator'], resultLimit: 1
  });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].subscriberCount, 987654);
  assert.equal(result.rows[0].channelAvatarUrl, 'https://yt3.googleusercontent.com/real=s0');
});
