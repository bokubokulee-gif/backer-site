'use strict';

const { createProviderAdapter } = require('../../../api/_lib/discovery-provider');
const {
  canonicalUrl,
  createContentRecord,
  createCreator,
  createMetricObservation,
  createPlatformIdentity,
  createProviderRun,
  dedupeDiscoveryBundle
} = require('../../../api/_lib/discovery-model');

const SNAPSHOT_OBSERVED_AT = '2026-08-20T00:00:00.000Z';
const REVIEWED_SNAPSHOT_PROVIDERS = Object.freeze([
  'x', 'tiktok', 'spotify', 'soundcloud', 'patreon', 'kick', 'linkedin'
]);

const REVIEWED_PUBLIC_SNAPSHOT = deepFreeze({
  schemaVersion: 1,
  observedAt: SNAPSHOT_OBSERVED_AT,
  providers: [
    {
      provider: 'x',
      access: 'public_source',
      methodologyVersion: 'x-official-oembed-reviewed-v1',
      confidence: { level: 'high', basis: 'official_oembed_metadata' },
      creators: [
        { nativeId: 'Interior', handle: 'Interior', displayName: 'US Department of the Interior', profileUrl: 'https://x.com/Interior' },
        { nativeId: 'thejustinwelsh', handle: 'thejustinwelsh', displayName: 'Justin Welsh', profileUrl: 'https://x.com/thejustinwelsh' },
        { nativeId: 'nathanbarry', handle: 'nathanbarry', displayName: 'Nathan Barry', profileUrl: 'https://x.com/nathanbarry', bio: 'Founder and CEO at Kit.' },
        { nativeId: 'realricky', handle: 'realricky', displayName: 'realricky', profileUrl: 'https://x.com/realricky' },
        { nativeId: 'RafalTomal', handle: 'RafalTomal', displayName: 'Rafal Tomal', profileUrl: 'https://x.com/RafalTomal' }
      ],
      content: [
        { ownerNativeId: 'Interior', nativeId: '463440424141459456', contentType: 'post', title: 'Public lands sunset post', canonicalUrl: 'https://x.com/Interior/status/463440424141459456' },
        {
          ownerNativeId: 'thejustinwelsh', nativeId: '1648711142586318849', contentType: 'post',
          title: 'A simple 3-step plan for creating useful content',
          excerpt: 'Pick one thing to learn, capture the important learning, and share your take.',
          canonicalUrl: 'https://x.com/thejustinwelsh/status/1648711142586318849', publishedAt: '2023-04-19T11:32:00.000Z'
        },
        { ownerNativeId: 'realricky', nativeId: '1801409943460827171', contentType: 'post', title: 'Public post quoting Nathan Barry', canonicalUrl: 'https://x.com/realricky/status/1801409943460827171' },
        { ownerNativeId: 'RafalTomal', nativeId: '1874927854175318362', contentType: 'post', title: '2024 highlights', canonicalUrl: 'https://x.com/RafalTomal/status/1874927854175318362' }
      ],
      metrics: []
    },
    {
      provider: 'tiktok',
      access: 'public_source',
      methodologyVersion: 'tiktok-official-oembed-reviewed-v1',
      confidence: { level: 'high', basis: 'official_oembed_metadata' },
      creators: [
        { nativeId: 'scout2015', handle: 'scout2015', displayName: 'Scout & Suki', profileUrl: 'https://www.tiktok.com/@scout2015' },
        { nativeId: 'sidehustlereview', handle: 'sidehustlereview', displayName: 'sidehustlereview', profileUrl: 'https://www.tiktok.com/@sidehustlereview' },
        { nativeId: 'tiffanylaurenjones', handle: 'tiffanylaurenjones', displayName: 'Tiffany Lauren Jones', profileUrl: 'https://www.tiktok.com/@tiffanylaurenjones' },
        { nativeId: 'noaamaaria', handle: 'noaamaaria', displayName: 'noaamaaria', profileUrl: 'https://www.tiktok.com/@noaamaaria' },
        { nativeId: 'dileks_journal', handle: 'dileks_journal', displayName: "Dilek's Journal", profileUrl: 'https://www.tiktok.com/@dileks_journal' }
      ],
      content: [
        { ownerNativeId: 'scout2015', nativeId: '6718335390845095173', contentType: 'video', title: 'Public video by Scout & Suki', canonicalUrl: 'https://www.tiktok.com/@scout2015/video/6718335390845095173' },
        { ownerNativeId: 'sidehustlereview', nativeId: '7654295436513135902', contentType: 'video', title: 'How the Creator Economy Is Changing: Make Money Without ...', canonicalUrl: 'https://www.tiktok.com/@sidehustlereview/video/7654295436513135902' },
        { ownerNativeId: 'tiffanylaurenjones', nativeId: '7639560629451328781', contentType: 'video', title: 'Creator Economy Wealth Transfer: Build Audience First', canonicalUrl: 'https://www.tiktok.com/@tiffanylaurenjones/video/7639560629451328781' },
        { ownerNativeId: 'noaamaaria', nativeId: '7655362339738357014', contentType: 'video', title: 'me & my sacred rituals against the world #selfcare #journaling', canonicalUrl: 'https://www.tiktok.com/@noaamaaria/video/7655362339738357014' },
        { ownerNativeId: 'dileks_journal', nativeId: '7655344132239625502', contentType: 'video', title: 'I waste way too much time re-recording voiceovers. So I tried Fish Audio...', canonicalUrl: 'https://www.tiktok.com/@dileks_journal/video/7655344132239625502' }
      ],
      metrics: []
    },
    {
      provider: 'spotify',
      access: 'public_source',
      methodologyVersion: 'spotify-official-oembed-reviewed-v1',
      confidence: { level: 'high', basis: 'official_oembed_metadata' },
      creators: [
        { nativeId: 'show:3YT4bw7YOEBaPtqmxbX0Nw', displayName: 'Reed Duchscher and Blake Robbins', handle: '3YT4bw7YOEBaPtqmxbX0Nw', profileUrl: 'https://open.spotify.com/show/3YT4bw7YOEBaPtqmxbX0Nw', bio: 'Hosts of Creator Economics.' },
        { nativeId: 'show:6pCqIzZEe4NjqXKKY4OFdy', displayName: 'The Creator Economy', handle: '6pCqIzZEe4NjqXKKY4OFdy', profileUrl: 'https://open.spotify.com/show/6pCqIzZEe4NjqXKKY4OFdy' },
        { nativeId: 'show:4Ak1KMRHnEFjPpyuxN2Iwq', displayName: 'Cure Media', handle: '4Ak1KMRHnEFjPpyuxN2Iwq', profileUrl: 'https://open.spotify.com/show/4Ak1KMRHnEFjPpyuxN2Iwq', bio: 'Publisher of Inside the Creator Economy.' },
        { nativeId: 'show:5zvS9GjiznjWm2r6zeStbI', displayName: 'Creator Systems AI', handle: '5zvS9GjiznjWm2r6zeStbI', profileUrl: 'https://open.spotify.com/show/5zvS9GjiznjWm2r6zeStbI' },
        { nativeId: 'show:1pJ1lkfMfgIzOpGf8cNRyx', displayName: 'Paola Vivoli', handle: '1pJ1lkfMfgIzOpGf8cNRyx', profileUrl: 'https://open.spotify.com/show/1pJ1lkfMfgIzOpGf8cNRyx', bio: 'Host of The New Creator Economy.' },
        { nativeId: 'show:5BuGSJ5OnOp6xnWNKqARcb', displayName: 'Creator Economy Live', handle: '5BuGSJ5OnOp6xnWNKqARcb', profileUrl: 'https://open.spotify.com/show/5BuGSJ5OnOp6xnWNKqARcb' }
      ],
      content: [
        { ownerNativeId: 'show:3YT4bw7YOEBaPtqmxbX0Nw', nativeId: 'show:3YT4bw7YOEBaPtqmxbX0Nw', contentType: 'podcast_show', title: 'Creator Economics', excerpt: "Latest embedded title observed: How This Gecko Became the Internet's Unofficial Therapist.", canonicalUrl: 'https://open.spotify.com/show/3YT4bw7YOEBaPtqmxbX0Nw' },
        { ownerNativeId: 'show:6pCqIzZEe4NjqXKKY4OFdy', nativeId: 'show:6pCqIzZEe4NjqXKKY4OFdy', contentType: 'podcast_show', title: 'The Creator Economy', excerpt: 'Latest embedded title observed: Can creators become politicians?', canonicalUrl: 'https://open.spotify.com/show/6pCqIzZEe4NjqXKKY4OFdy' },
        { ownerNativeId: 'show:4Ak1KMRHnEFjPpyuxN2Iwq', nativeId: 'show:4Ak1KMRHnEFjPpyuxN2Iwq', contentType: 'podcast_show', title: 'Inside the Creator Economy', excerpt: 'Latest embedded title observed: How IKEA Rebuilt Brand Tracking for Growth.', canonicalUrl: 'https://open.spotify.com/show/4Ak1KMRHnEFjPpyuxN2Iwq' },
        { ownerNativeId: 'show:5zvS9GjiznjWm2r6zeStbI', nativeId: 'show:5zvS9GjiznjWm2r6zeStbI', contentType: 'podcast_show', title: 'Creator Systems AI', excerpt: "Latest embedded title observed: 50,000 Followers and Nobody's Buying — Here's Why.", canonicalUrl: 'https://open.spotify.com/show/5zvS9GjiznjWm2r6zeStbI' },
        { ownerNativeId: 'show:1pJ1lkfMfgIzOpGf8cNRyx', nativeId: 'show:1pJ1lkfMfgIzOpGf8cNRyx', contentType: 'podcast_show', title: 'The New Creator Economy', excerpt: 'Latest embedded title observed: Sélim Benayat, Co-Founder and CEO of Bento.', canonicalUrl: 'https://open.spotify.com/show/1pJ1lkfMfgIzOpGf8cNRyx' },
        { ownerNativeId: 'show:5BuGSJ5OnOp6xnWNKqARcb', nativeId: 'show:5BuGSJ5OnOp6xnWNKqARcb', contentType: 'podcast_show', title: 'Creator Economy Live', excerpt: "Latest embedded title observed: Episode 99 - Inside the NFL's Creator Playbook - Live from New York.", canonicalUrl: 'https://open.spotify.com/show/5BuGSJ5OnOp6xnWNKqARcb' }
      ],
      metrics: []
    },
    {
      provider: 'soundcloud',
      access: 'public_source',
      methodologyVersion: 'soundcloud-official-oembed-reviewed-v1',
      confidence: { level: 'high', basis: 'official_oembed_and_public_page_metadata' },
      creators: [
        { nativeId: 'creatorcast', handle: 'creatorcast', displayName: 'Creatorcast', profileUrl: 'https://soundcloud.com/creatorcast', bio: 'Will Haddock · Atlanta.' },
        { nativeId: 'stephenwolfram', handle: 'stephenwolfram', displayName: 'Stephen Wolfram', profileUrl: 'https://soundcloud.com/stephenwolfram' },
        { nativeId: 'commonsku', handle: 'commonsku', displayName: 'skucast - official podcast of commonsku', profileUrl: 'https://soundcloud.com/commonsku' },
        { nativeId: 'janessa-boehm', handle: 'janessa-boehm', displayName: 'Janessa Boehm', profileUrl: 'https://soundcloud.com/janessa-boehm' },
        { nativeId: 'romatreradio', handle: 'romatreradio', displayName: 'Roma Tre Radio', profileUrl: 'https://soundcloud.com/romatreradio' },
        { nativeId: 'user-360916019', handle: 'user-360916019', displayName: 'Creator Economy Podcast', profileUrl: 'https://soundcloud.com/user-360916019' }
      ],
      content: [
        { ownerNativeId: 'commonsku', nativeId: 'episode-326-how-to-thrive-in-an-emotion-driven-economy-with-kyla-scanlon', contentType: 'audio', title: 'Episode 326: How to Thrive in an Emotion-Driven Economy with Kyla Scanlon', excerpt: 'Business · all rights reserved.', canonicalUrl: 'https://soundcloud.com/commonsku/episode-326-how-to-thrive-in-an-emotion-driven-economy-with-kyla-scanlon', publishedAt: '2024-10-11T18:03:32.000Z' },
        { ownerNativeId: 'janessa-boehm', nativeId: 'the-ultimate-guide-for-every-3', contentType: 'audio', title: 'The Ultimate Guide for Every Creator', excerpt: 'Technology · all rights reserved.', canonicalUrl: 'https://soundcloud.com/janessa-boehm/the-ultimate-guide-for-every-3', publishedAt: '2025-07-03T05:16:30.000Z' },
        { ownerNativeId: 'romatreradio', nativeId: 'follow-up-tiktok-e-il-futuro-dei-creator', contentType: 'audio', title: 'Follow-up: TikTok e il futuro dei creator', excerpt: 'Technology · all rights reserved.', canonicalUrl: 'https://soundcloud.com/romatreradio/follow-up-tiktok-e-il-futuro-dei-creator', publishedAt: '2022-03-24T15:33:43.000Z' },
        { ownerNativeId: 'user-360916019', nativeId: 'analysing-trends-and-spotting-opportunities-by-pioneering-in-the-creator-economy-with-hugo-amsellem', contentType: 'audio', title: 'Analysing Trends and Spotting Opportunities with Hugo Amsellem', excerpt: 'Business · all rights reserved.', canonicalUrl: 'https://soundcloud.com/user-360916019/analysing-trends-and-spotting-opportunities-by-pioneering-in-the-creator-economy-with-hugo-amsellem', publishedAt: '2021-07-13T13:34:53.000Z' }
      ],
      metrics: []
    },
    {
      provider: 'patreon',
      access: 'public_page',
      methodologyVersion: 'patreon-reviewed-unlocked-public-post-v1',
      confidence: { level: 'high', basis: 'unlocked_public_post_body' },
      creators: [
        { nativeId: 'author:creator-original-76891481', displayName: 'DMDave', profileUrl: 'https://www.patreon.com/posts/creator-original-76891481' },
        { nativeId: 'author:cargo-my-first-80180900', displayName: 'Jim Zub', profileUrl: 'https://www.patreon.com/posts/cargo-my-first-80180900' },
        { nativeId: 'author:milestone-goal-1-4185402', displayName: 'Matthew Bogart', profileUrl: 'https://www.patreon.com/posts/milestone-goal-1-4185402' },
        { nativeId: 'author:original-koe-ni-55026823', displayName: 'Sankyuu ML Subs', profileUrl: 'https://www.patreon.com/posts/original-koe-ni-55026823' },
        { nativeId: 'author:nibelheim-free-21753279', displayName: 'M. J. Gallagher', profileUrl: 'https://www.patreon.com/posts/nibelheim-free-21753279' }
      ],
      content: [
        { ownerNativeId: 'author:creator-original-76891481', nativeId: '76891481', publicAccess: 'unlocked', contentType: 'post', title: 'Creator Original Open License Preview', excerpt: 'A public preview of the Creator Original Open License.', canonicalUrl: 'https://www.patreon.com/posts/creator-original-76891481', publishedAt: '2023-01-06T00:00:00.000Z' },
        { ownerNativeId: 'author:cargo-my-first-80180900', nativeId: '80180900', publicAccess: 'unlocked', contentType: 'post', title: 'CARGO: My First Comic Script', excerpt: 'A public comic script shared for art practice and portfolio work.', canonicalUrl: 'https://www.patreon.com/posts/cargo-my-first-80180900', publishedAt: '2023-03-17T00:00:00.000Z' },
        { ownerNativeId: 'author:milestone-goal-1-4185402', nativeId: '4185402', publicAccess: 'unlocked', contentType: 'post', title: 'MILESTONE GOAL REACHED - Shock Waves #1', excerpt: 'A public post sharing the first comic the creator published.', canonicalUrl: 'https://www.patreon.com/posts/milestone-goal-1-4185402', publishedAt: '2016-01-25T00:00:00.000Z' },
        { ownerNativeId: 'author:original-koe-ni-55026823', nativeId: '55026823', publicAccess: 'unlocked', contentType: 'post', title: 'ORIGINAL KOE NI NATTE', excerpt: 'A public English translation post.', canonicalUrl: 'https://www.patreon.com/posts/original-koe-ni-55026823', publishedAt: '2021-08-17T00:00:00.000Z' },
        { ownerNativeId: 'author:nibelheim-free-21753279', nativeId: '21753279', publicAccess: 'unlocked', contentType: 'post', title: "'The Nibelheim Incident' - free download", excerpt: 'A public free-download post for a fan-created novella.', canonicalUrl: 'https://www.patreon.com/posts/nibelheim-free-21753279', publishedAt: '2018-10-01T00:00:00.000Z' }
      ],
      metrics: []
    },
    {
      provider: 'kick',
      access: 'public_page',
      methodologyVersion: 'kick-reviewed-public-page-v1',
      confidence: { level: 'high', basis: 'explicit_public_page_label' },
      creators: [
        { nativeId: 'karebearxp', handle: 'karebearxp', displayName: 'KarebearXp', profileUrl: 'https://kick.com/karebearxp', bio: 'Variety BR PVP gamer and full-time content creator.' },
        { nativeId: 'mattlafff', handle: 'mattlafff', displayName: 'MATTLAFFF', profileUrl: 'https://kick.com/mattlafff' },
        { nativeId: 'derangeddelusion', handle: 'derangeddelusion', displayName: 'Derangeddelusion', profileUrl: 'https://kick.com/derangeddelusion' },
        { nativeId: 'x9nium', handle: 'x9nium', displayName: 'x9nium', profileUrl: 'https://kick.com/x9nium' },
        { nativeId: 'irongoddess', handle: 'irongoddess', displayName: 'IronGoddess', profileUrl: 'https://kick.com/irongoddess' },
        { nativeId: 'streamzonefts', handle: 'streamzonefts', displayName: 'StreamzoneFTS', profileUrl: 'https://kick.com/streamzonefts' }
      ],
      content: [
        { ownerNativeId: 'karebearxp', nativeId: 'live:2026-08-20', contentType: 'live_stream_snapshot', title: '[BIRTHDAY MONTH] GamerPlug Day !gp Never Game Alone or with Randoms AGAIN', excerpt: 'Fortnite · English.', canonicalUrl: 'https://kick.com/karebearxp' },
        { ownerNativeId: 'karebearxp', nativeId: '10650b09-0bb3-4ec4-9c40-6b27cfeae045', contentType: 'video', title: 'Public KarebearXp VOD', excerpt: 'Fortnite.', canonicalUrl: 'https://kick.com/karebearxp/videos/10650b09-0bb3-4ec4-9c40-6b27cfeae045' },
        { ownerNativeId: 'derangeddelusion', nativeId: 'stream-listing:2026-08-20', contentType: 'video_listing_snapshot', title: 'Feral Friday: Let the Bad Decisions Commence!', excerpt: 'Call of Duty: Warzone.', canonicalUrl: 'https://kick.com/derangeddelusion' },
        { ownerNativeId: 'irongoddess', nativeId: 'videos:2026-08-20', contentType: 'video_listing_snapshot', title: 'R.E.D. Fridays = REMEMBER EVERYONE DEPLOYED', canonicalUrl: 'https://kick.com/irongoddess/videos' },
        { ownerNativeId: 'mattlafff', nativeId: 'clip_01GZBA37S8HVC8FPXD6HRFYQM2', contentType: 'clip', title: 'Public MATTLAFFF clip', excerpt: 'Call of Duty: Warzone.', canonicalUrl: 'https://kick.com/mattlafff/clips/clip_01GZBA37S8HVC8FPXD6HRFYQM2' }
      ],
      metrics: [
        { entityType: 'identity', ownerNativeId: 'mattlafff', metric: 'followers', value: 24600, sourceUrl: 'https://kick.com/mattlafff', labelVerified: true },
        { entityType: 'identity', ownerNativeId: 'derangeddelusion', metric: 'followers', value: 9400, sourceUrl: 'https://kick.com/derangeddelusion', labelVerified: true },
        { entityType: 'identity', ownerNativeId: 'x9nium', metric: 'followers', value: 9400, sourceUrl: 'https://kick.com/x9nium', labelVerified: true },
        { entityType: 'content', contentNativeId: '10650b09-0bb3-4ec4-9c40-6b27cfeae045', metric: 'views', value: 321, sourceUrl: 'https://kick.com/karebearxp/videos/10650b09-0bb3-4ec4-9c40-6b27cfeae045', labelVerified: true },
        { entityType: 'content', contentNativeId: 'videos:2026-08-20', metric: 'views', value: 421, sourceUrl: 'https://kick.com/irongoddess/videos', labelVerified: true },
        { entityType: 'content', contentNativeId: 'clip_01GZBA37S8HVC8FPXD6HRFYQM2', metric: 'views', value: 190, sourceUrl: 'https://kick.com/mattlafff/clips/clip_01GZBA37S8HVC8FPXD6HRFYQM2', labelVerified: true }
      ]
    },
    {
      provider: 'linkedin',
      access: 'public_page',
      methodologyVersion: 'linkedin-reviewed-public-page-v1',
      confidence: { level: 'high', basis: 'explicit_public_page_label' },
      creators: [
        { nativeId: 'biagranja', handle: 'biagranja', displayName: 'Bia Granja', profileUrl: 'https://www.linkedin.com/in/biagranja', bio: 'Founder at Creator Economy Rocks · Los Angeles.' },
        { nativeId: 'stevenbartlett-123', handle: 'stevenbartlett-123', displayName: 'Steven Bartlett', profileUrl: 'https://uk.linkedin.com/in/stevenbartlett-123', bio: 'Founder at Steven.com · United Kingdom.' },
        { nativeId: 'justinwelsh', handle: 'justinwelsh', displayName: 'Justin Welsh', profileUrl: 'https://www.linkedin.com/in/justinwelsh', bio: 'Writer and entrepreneur.' },
        { nativeId: 'ciler-demiralp', handle: 'ciler-demiralp', displayName: 'Casey Ciler Askan', profileUrl: 'https://www.linkedin.com/in/ciler-demiralp' },
        { nativeId: 'ash-maurya', handle: 'ash-maurya', displayName: 'Ash Maurya', profileUrl: 'https://www.linkedin.com/in/ash-maurya' }
      ],
      content: [
        { ownerNativeId: 'ciler-demiralp', nativeId: '7404464664266633216-WXbh', contentType: 'post', title: 'The biggest newsletter advice you need to hear', canonicalUrl: 'https://www.linkedin.com/posts/ciler-demiralp_the-biggest-newsletter-advice-you-need-to-activity-7404464664266633216-WXbh' },
        { ownerNativeId: 'ash-maurya', nativeId: 'welcome-founder-economy-ash-maurya-z7pnc', contentType: 'article', title: 'Welcome to the Founder Economy', canonicalUrl: 'https://www.linkedin.com/pulse/welcome-founder-economy-ash-maurya-z7pnc', publishedAt: '2026-03-25T00:00:00.000Z' }
      ],
      metrics: [
        { entityType: 'identity', ownerNativeId: 'biagranja', metric: 'followers', value: 135000, sourceUrl: 'https://www.linkedin.com/in/biagranja', labelVerified: true },
        { entityType: 'identity', ownerNativeId: 'stevenbartlett-123', metric: 'followers', value: 3000000, sourceUrl: 'https://uk.linkedin.com/in/stevenbartlett-123', labelVerified: true }
      ]
    }
  ]
});

const PROVIDER_HOSTS = Object.freeze({
  x: new Set(['x.com']),
  tiktok: new Set(['www.tiktok.com']),
  spotify: new Set(['open.spotify.com']),
  soundcloud: new Set(['soundcloud.com']),
  patreon: new Set(['www.patreon.com']),
  kick: new Set(['kick.com']),
  linkedin: new Set(['www.linkedin.com', 'uk.linkedin.com'])
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function acceptedSourceUrl(provider, value) {
  const normalized = canonicalUrl(value);
  if (!normalized) return null;
  return PROVIDER_HOSTS[provider] && PROVIDER_HOSTS[provider].has(new URL(normalized).hostname)
    ? normalized : null;
}

function invalidSnapshot(message) {
  return Object.assign(new Error(message), { code: 'provider_response_invalid' });
}

function importReviewedPublicSnapshot(snapshot = REVIEWED_PUBLIC_SNAPSHOT, providerFilter = REVIEWED_SNAPSHOT_PROVIDERS) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Date.parse(snapshot.observedAt)
    || !Array.isArray(snapshot.providers)) throw invalidSnapshot('reviewed public snapshot is invalid');
  const requested = new Set(providerFilter || REVIEWED_SNAPSHOT_PROVIDERS);
  const bundle = { creators: [], platformIdentities: [], contentRecords: [], metricObservations: [] };
  const providerRuns = [];
  const acquisitionCheckpoints = {};

  for (const source of snapshot.providers) {
    const provider = source && source.provider;
    if (!requested.has(provider)) continue;
    if (!REVIEWED_SNAPSHOT_PROVIDERS.includes(provider)) throw invalidSnapshot('reviewed snapshot provider is invalid');
    const observedAt = snapshot.observedAt;
    const owners = new Map();
    const contentByNativeId = new Map();
    const before = {
      creators: bundle.creators.length,
      contentRecords: bundle.contentRecords.length,
      metricObservations: bundle.metricObservations.length
    };

    for (const row of source.creators || []) {
      const profileUrl = acceptedSourceUrl(provider, row.profileUrl);
      if (!profileUrl) throw invalidSnapshot(`reviewed ${provider} profile URL is invalid`);
      const creator = createCreator({ ...row, provider, observedAt });
      const identity = creator && createPlatformIdentity({
        creatorId: creator.id, provider, nativeId: row.nativeId, handle: row.handle,
        profileUrl, verified: row.verified, observedAt
      });
      if (!creator || !identity) throw invalidSnapshot(`reviewed ${provider} creator is invalid`);
      creator.primaryIdentityId = identity.id;
      owners.set(row.nativeId, { creator, identity });
      bundle.creators.push(creator);
      bundle.platformIdentities.push(identity);
    }

    for (const row of source.content || []) {
      if (provider === 'patreon' && row.publicAccess !== 'unlocked') {
        throw invalidSnapshot('Patreon snapshot contains non-public content');
      }
      const owner = owners.get(row.ownerNativeId);
      const sourceUrl = acceptedSourceUrl(provider, row.canonicalUrl);
      const content = owner && sourceUrl && createContentRecord({
        ...row, provider, canonicalUrl: sourceUrl,
        creatorId: owner.creator.id, platformIdentityId: owner.identity.id, observedAt
      });
      if (!content) throw invalidSnapshot(`reviewed ${provider} content is invalid`);
      contentByNativeId.set(row.nativeId, content);
      bundle.contentRecords.push(content);
    }

    for (const row of source.metrics || []) {
      if (!['kick', 'linkedin'].includes(provider) || row.labelVerified !== true
        || !['followers', 'views'].includes(row.metric)) {
        throw invalidSnapshot(`reviewed ${provider} metric lacks an explicit public label`);
      }
      const owner = owners.get(row.ownerNativeId);
      const content = contentByNativeId.get(row.contentNativeId);
      const entity = row.entityType === 'identity' ? owner && owner.identity
        : row.entityType === 'content' ? content : null;
      const sourceUrl = acceptedSourceUrl(provider, row.sourceUrl);
      const metric = entity && sourceUrl && createMetricObservation({
        entityType: row.entityType, entityId: entity.id, provider, metric: row.metric,
        value: row.value, unit: 'count', observedAt, visibility: 'public', access: source.access,
        availability: 'available', sourceUrl, methodologyVersion: source.methodologyVersion,
        freshness: { state: 'snapshot', sourceUpdatedAt: null, expiresAt: null },
        confidence: source.confidence
      });
      if (!metric) throw invalidSnapshot(`reviewed ${provider} metric is invalid`);
      bundle.metricObservations.push(metric);
    }

    const counts = {
      creators: bundle.creators.length - before.creators,
      contentRecords: bundle.contentRecords.length - before.contentRecords,
      metricObservations: bundle.metricObservations.length - before.metricObservations
    };
    providerRuns.push(createProviderRun({
      provider, state: 'succeeded', publishState: 'last_good',
      startedAt: observedAt, finishedAt: observedAt, observedAt, lastSuccessAt: observedAt,
      reasonCode: 'reviewed_public_snapshot', pagesRead: 0, hasMore: false, resultCounts: counts
    }));
    acquisitionCheckpoints[provider] = {
      state: 'exhausted', scopeKey: `${provider}:${source.methodologyVersion}`,
      updatedAt: observedAt, reasonCode: 'reviewed_public_snapshot'
    };
  }

  return {
    ...dedupeDiscoveryBundle(bundle),
    providerRuns: providerRuns.filter(Boolean),
    acquisitionCheckpoints
  };
}

function catalogOnlyAdapter(provider) {
  return createProviderAdapter({
    id: provider,
    availability() {
      return { state: 'not_configured', reasonCode: 'provider_not_configured' };
    },
    async fetchPage() {
      throw invalidSnapshot('catalog-only snapshot adapter cannot perform a live fetch');
    }
  });
}

const REVIEWED_SNAPSHOT_ADAPTERS = Object.freeze(Object.fromEntries(
  REVIEWED_SNAPSHOT_PROVIDERS.map((provider) => [provider, catalogOnlyAdapter(provider)])
));

module.exports = {
  REVIEWED_PUBLIC_SNAPSHOT,
  REVIEWED_SNAPSHOT_ADAPTERS,
  REVIEWED_SNAPSHOT_PROVIDERS,
  SNAPSHOT_OBSERVED_AT,
  acceptedSourceUrl,
  importReviewedPublicSnapshot
};
