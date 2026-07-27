/* =========================================================
   BACKER — Multi-Platform AI Creator Search (demo engine)
   Merged implementation of the two Search PRDs:
   - match_v1.0.0-demo   (9-component query-fit, renormalized)
   - poa_v1.0.0-demo     (5-component Proof of Attention)
   - evidence_v1.0.0-demo(5-factor Evidence Confidence)
   Four concepts stay separate: Match Confidence, Observed
   Attention, PoA, Evidence Confidence. Deterministic seeded
   catalog — clearly labeled simulated data. No network.
   ========================================================= */
window.BackerSearch = (function () {
  'use strict';

  /* ---------------- config ---------------- */
  const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'x', 'twitch'];
  const PLAT_LABEL = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', x: 'X', twitch: 'Twitch' };
  const PLAT_CAP = 150;               // per-platform session cap (PRD A §6.1)
  const INITIAL = 10;                 // 10 → +20 → +30 → +40 → +50 …
  const MIN_SAMPLE = { tiktok: 12, youtube: 5, instagram: 8, x: 20, twitch: 8 };
  const VERSIONS = { match: 'match_v1.0.0-demo', poa: 'poa_v1.0.0-demo', evidence: 'evidence_v1.0.0-demo', parser: 'parser_v1.0.0-demo', catalog: 'cat_demo_2026_07_15' };
  const STREAM_DELAY = { youtube: 350, tiktok: 700, instagram: 1050, x: 1400, twitch: 1750 };
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- deterministic PRNG ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------------- taxonomy ---------------- */
  const TOPICS = ['ai', 'tech_education', 'music', 'gaming', 'cooking', 'fitness', 'art', 'finance', 'science', 'film', 'writing', 'comedy'];
  const TOPIC_LABEL = { ai: 'AI', tech_education: 'Tech education', music: 'Music', gaming: 'Gaming', cooking: 'Cooking', fitness: 'Fitness', art: 'Art & design', finance: 'Finance', science: 'Science', film: 'Film', writing: 'Writing', comedy: 'Comedy' };
  const TOPIC_ADJ = { ai: ['tech_education', 'science'], tech_education: ['ai', 'science'], science: ['ai', 'tech_education'], music: ['art'], art: ['music', 'film'], film: ['art', 'writing'], writing: ['film'], gaming: ['comedy'], comedy: ['gaming'], cooking: ['fitness'], fitness: ['cooking'], finance: [] };
  const TYPES = ['educator', 'streamer', 'musician', 'artist', 'builder', 'reviewer', 'analyst', 'coach', 'comedian', 'filmmaker'];
  const TYPE_LABEL = { educator: 'Educator', streamer: 'Streamer', musician: 'Musician', artist: 'Artist', builder: 'Builder', reviewer: 'Reviewer', analyst: 'Analyst', coach: 'Coach', comedian: 'Comedian', filmmaker: 'Filmmaker' };
  const TYPE_ADJ = { educator: ['coach', 'analyst'], coach: ['educator'], analyst: ['educator', 'reviewer'], reviewer: ['analyst'], musician: ['artist'], artist: ['musician', 'filmmaker'], filmmaker: ['artist'], streamer: ['comedian'], comedian: ['streamer'], builder: ['educator'] };
  const FORMATS = { shorts: 'Short-form video', long_video: 'Long-form video', livestream: 'Livestreams', tutorial: 'Tutorials', explainer: 'Explainers', thread: 'Threads', review: 'Reviews', vlog: 'Vlogs' };
  const STAGES = ['nascent', 'emerging', 'pre_breakout', 'established'];
  const STAGE_LABEL = { nascent: 'Nascent', emerging: 'Emerging', pre_breakout: 'Pre-breakout', established: 'Established' };
  const LANGS = { en: 'English', es: 'Spanish', pt: 'Portuguese', de: 'German', ja: 'Japanese', fr: 'French' };

  /* ---------------- simulated catalog ----------------
     Deterministic (fixed seed): every visitor sees the same
     catalog, and re-running a query reproduces the session. */
  const FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Kenji', 'Ines', 'Omar', 'Priya', 'Felix', 'Nadia', 'Theo', 'Sana', 'Marco', 'Wren', 'Diego', 'Amara', 'Jonas', 'Yuki', 'Lena', 'Ravi', 'Clara', 'Tomas', 'Aisha', 'Nico', 'Freya', 'Dev', 'Rosa', 'Elias', 'Mina', 'Callum', 'Bea', 'Hana', 'Silas', 'Tessa', 'Kofi', 'Lucia', 'Emil', 'Noor', 'Grant'];
  const LAST = ['Okafor', 'Lindqvist', 'Marchetti', 'Tanaka', 'Reyes', 'Novak', 'Haddad', 'Kowalski', 'Iyer', 'Fontaine', 'Berg', 'Almeida', 'Castillo', 'Nguyen', 'Petrov', 'Sato', 'Moreau', 'Silva', 'Weber', 'Cruz', 'Ito', 'Larsen', 'Duarte', 'Meyer', 'Rahman', 'Costa', 'Vega', 'Klein', 'Ferreira', 'Andersen', 'Romero', 'Baptiste', 'Herrera', 'Zhou', 'Egede', 'Mbeki', 'Sorensen', 'Ohara', 'Vasquez', 'Lund'];
  const TOPIC_W = { ai: 15, tech_education: 12, gaming: 12, music: 10, cooking: 8, fitness: 8, art: 8, finance: 6, science: 6, film: 5, writing: 5, comedy: 5 };
  const TYPE_BY_TOPIC = { ai: ['educator', 'analyst', 'builder'], tech_education: ['educator', 'builder', 'coach'], music: ['musician', 'artist'], gaming: ['streamer', 'reviewer', 'comedian'], cooking: ['educator', 'coach'], fitness: ['coach', 'educator'], art: ['artist', 'educator'], finance: ['analyst', 'educator'], science: ['educator', 'analyst'], film: ['filmmaker', 'reviewer'], writing: ['educator', 'analyst'], comedy: ['comedian', 'streamer'] };
  const FMT_BY_PLAT = { youtube: ['long_video', 'explainer', 'tutorial', 'shorts', 'review', 'vlog'], tiktok: ['shorts', 'explainer', 'tutorial', 'vlog'], instagram: ['shorts', 'tutorial', 'vlog', 'explainer'], x: ['thread', 'explainer', 'review'], twitch: ['livestream', 'tutorial'] };

  function pickWeighted(rnd, weights) {
    const entries = Object.entries(weights);
    let total = 0; for (const [, w] of entries) total += w;
    let roll = rnd() * total;
    for (const [k, w] of entries) { roll -= w; if (roll <= 0) return k; }
    return entries[0][0];
  }

  function buildCatalog() {
    const rnd = mulberry32(20260715);
    const accounts = [];
    let serial = 1000;
    for (const plat of PLATFORMS) {
      for (let i = 0; i < 192; i++) {
        const topic = pickWeighted(rnd, TOPIC_W);
        const topics = [topic];
        if (rnd() < 0.45) {
          const adj = TOPIC_ADJ[topic];
          if (adj.length) topics.push(adj[Math.floor(rnd() * adj.length)]);
        }
        const typePool = TYPE_BY_TOPIC[topic];
        const type = plat === 'twitch' && rnd() < 0.5 ? 'streamer' : typePool[Math.floor(rnd() * typePool.length)];
        // log-uniform followers, ~60% under 100K
        const followers = Math.round(Math.pow(10, 3 + rnd() * 3.35) / 10) * 10;
        const growth = Math.round((rnd() * 38 - 4) * 10) / 10;          // % MoM
        const stage = followers < 8000 ? 'nascent'
          : followers < 60000 ? (growth > 18 ? 'pre_breakout' : 'emerging')
          : followers < 400000 ? (growth > 22 ? 'pre_breakout' : 'established') : 'established';
        const lang = rnd() < 0.82 ? 'en' : pickWeighted(rnd, { es: 4, pt: 2, de: 2, ja: 2, fr: 2 });
        const geo = rnd() < 0.72 ? pickWeighted(rnd, { US: 8, UK: 3, CA: 2, DE: 2, BR: 2, JP: 2, IN: 2, AU: 1 }) : null;
        const fmtPool = FMT_BY_PLAT[plat];
        const formats = [fmtPool[Math.floor(rnd() * Math.min(2, fmtPool.length))]];
        if (rnd() < 0.6) { const f2 = fmtPool[Math.floor(rnd() * fmtPool.length)]; if (!formats.includes(f2)) formats.push(f2); }
        const cadence = Math.round((0.5 + rnd() * rnd() * 12) * 10) / 10;  // posts or streams / week
        const posts30 = Math.max(1, Math.round(cadence * 4.3 * (0.7 + rnd() * 0.6)));
        // latent quality drives PoA components + engagement realism
        const q = 0.2 + rnd() * 0.78;
        const er = 0.004 + q * 0.09 * (followers < 30000 ? 1.5 : followers < 300000 ? 1 : 0.55);
        const exposure = Math.round(followers * cadence * 4.3 * (0.25 + rnd() * 1.4));
        const oa = buildObserved(plat, rnd, followers, exposure, er, posts30);
        const comp = (base, spread) => Math.max(4, Math.min(98, Math.round(100 * (q + (rnd() - 0.5) * spread))));
        const poaComp = {
          depth: comp(0, 0.3),
          consistency: comp(0, 0.35),
          growth: rnd() < 0.15 ? null : comp(0, 0.4),
          community: rnd() < 0.25 ? null : comp(0, 0.35),
          corroboration: rnd() < 0.4 ? null : comp(0, 0.4)
        };
        const freshHours = Math.round(1 + rnd() * rnd() * 190);
        const srcRoll = rnd();
        const source = srcRoll < 0.15
          ? { label: 'Creator-authorized (simulated)', reliability: 1.0 }
          : srcRoll < 0.7
            ? { label: 'Official platform API (simulated)', reliability: 0.95 }
            : { label: 'Licensed provider (simulated)', reliability: 0.9 };
        const fi = Math.floor(rnd() * FIRST.length), li = Math.floor(rnd() * LAST.length);
        const name = FIRST[fi] + ' ' + LAST[li];
        const handle = '@' + (FIRST[fi] + LAST[li]).toLowerCase().slice(0, 14) + (serial % 97 > 60 ? String(serial % 97) : '');
        accounts.push({
          id: plat + '_' + serial, platform: plat, externalId: 'sim-' + serial,
          name, handle, hue: Math.floor(rnd() * 360),
          topics, type, followers, growth, stage, lang, geo, formats, cadence, posts30,
          oa, poaComp, freshHours, source,
          multilingual: rnd() < 0.18
        });
        serial++;
      }
    }
    // precompute PoA + Evidence Confidence per account
    for (const a of accounts) scoreAttention(a);
    return accounts;
  }

  function buildObserved(plat, rnd, followers, exposure, er, posts30) {
    const j = f => Math.max(0, Math.round(f * (0.8 + rnd() * 0.5)));
    if (plat === 'youtube') return { headlineMetric: 'video views', metrics: { 'Video views': exposure, 'Likes': j(exposure * er * 3), 'Comments': rnd() < 0.08 ? null : j(exposure * er * 0.5) }, sample: posts30 };
    if (plat === 'tiktok') return { headlineMetric: 'video views', metrics: { 'Video views': exposure, 'Likes': j(exposure * er * 4), 'Comments': j(exposure * er * 0.4), 'Shares': j(exposure * er * 0.5), 'Favorites': rnd() < 0.2 ? null : j(exposure * er * 0.6) }, sample: posts30 };
    if (plat === 'instagram') return { headlineMetric: 'plays', metrics: { 'Plays': exposure, 'Likes': j(exposure * er * 3.4), 'Comments': j(exposure * er * 0.3), 'Shares': rnd() < 0.15 ? null : j(exposure * er * 0.4), 'Saves': rnd() < 0.15 ? null : j(exposure * er * 0.8) }, sample: posts30 };
    if (plat === 'x') return { headlineMetric: 'impressions', metrics: { 'Impressions': exposure, 'Likes': j(exposure * er * 2.4), 'Replies': j(exposure * er * 0.35), 'Reposts': j(exposure * er * 0.5), 'Quotes': rnd() < 0.2 ? null : j(exposure * er * 0.12), 'Bookmarks': rnd() < 0.25 ? null : j(exposure * er * 0.4) }, sample: posts30 };
    const hours = Math.max(4, Math.round(followers * er * 14 * (0.5 + rnd())));
    return { headlineMetric: 'viewer-hours', metrics: { 'Viewer-hours': hours, 'Avg concurrent viewers': Math.max(2, Math.round(hours / 30)), 'Chat messages': rnd() < 0.25 ? null : j(hours * 22), 'New followers': j(followers * 0.02) }, sample: posts30 };
  }

  /* ---------------- PoA + Evidence Confidence ----------------
     PoA (PRD A model): depth 25 · consistency 20 · growth 20 ·
     community 20 · corroboration 15, renormalized over available.
     Evidence (PRD B formula): .30 coverage + .25 freshness +
     .20 reliability + .15 sample + .10 corroboration. */
  const POA_W = { depth: 25, consistency: 20, growth: 20, community: 20, corroboration: 15 };
  const POA_NAMES = { depth: 'Engagement depth', consistency: 'Cross-content consistency', growth: 'Growth coherence', community: 'Community quality', corroboration: 'Cross-signal corroboration' };

  function scoreAttention(a) {
    let wSum = 0, vSum = 0, avail = 0;
    for (const k in POA_W) {
      const v = a.poaComp[k];
      if (v !== null) { wSum += POA_W[k]; vSum += v * POA_W[k]; avail++; }
    }
    const poaValue = wSum ? Math.round(vSum / wSum) : null;

    const metricVals = Object.values(a.oa.metrics);
    const coverage = metricVals.filter(v => v !== null).length / metricVals.length;
    const freshness = a.freshHours <= 24 ? 1 : a.freshHours <= 168 ? 0.85 : a.freshHours <= 336 ? 0.65 : 0.35;
    const sample = Math.min(1, a.posts30 / MIN_SAMPLE[a.platform]);
    const corrob = a.poaComp.corroboration !== null ? 0.5 + a.poaComp.corroboration / 200 : 0.25;
    const ec = Math.round(100 * (0.30 * coverage + 0.25 * freshness + 0.20 * a.source.reliability + 0.15 * sample + 0.10 * corrob));

    a.evidence = { value: ec, tier: ec >= 80 ? 'Strong' : ec >= 60 ? 'Moderate' : ec >= 35 ? 'Limited' : 'Insufficient', factors: { 'Source coverage': coverage, 'Freshness': freshness, 'Source reliability': a.source.reliability, 'Sample sufficiency': sample, 'Corroboration': corrob } };
    // numeric PoA only with ≥3 components, sample met, and EC ≥ 60
    const numericOK = avail >= 3 && sample >= 1 && ec >= 60;
    a.poa = {
      value: poaValue, shown: numericOK,
      tier: !numericOK ? 'Insufficient evidence' : poaValue >= 80 ? 'Strong signal' : poaValue >= 60 ? 'Moderate signal' : poaValue >= 40 ? 'Mixed signal' : 'Limited signal',
      available: avail
    };
  }

  /* ---------------- intent parser (deterministic) ---------------- */
  const TOPIC_KW = {
    ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'neural'],
    tech_education: ['coding', 'programming', 'software', 'developer', 'tech education', 'engineering', 'code'],
    music: ['music', 'musician', 'song', 'band', 'producer', 'rapper', 'singer'],
    gaming: ['gaming', 'gamer', 'esports', 'speedrun', 'game'],
    cooking: ['cooking', 'recipe', 'food', 'chef', 'baking', 'kitchen'],
    fitness: ['fitness', 'workout', 'gym', 'yoga', 'training', 'wellness'],
    art: ['art', 'illustration', 'design', 'drawing', 'painting', 'visual'],
    finance: ['finance', 'investing', 'money', 'stocks', 'crypto', 'economics'],
    science: ['science', 'physics', 'biology', 'chemistry', 'space', 'astronomy'],
    film: ['film', 'cinema', 'documentary', 'video essay', 'movie'],
    writing: ['writing', 'writer', 'essay', 'newsletter', 'author', 'poetry'],
    comedy: ['comedy', 'funny', 'sketch', 'humor', 'satire']
  };
  const TYPE_KW = { educator: ['educator', 'teacher', 'teach', 'explains', 'explainer', 'professor', 'tutor'], streamer: ['streamer', 'streams', 'streaming'], musician: ['musician', 'artist', 'singer', 'band', 'producer'], builder: ['builder', 'indie hacker', 'founder', 'maker', 'ships', 'shipping'], reviewer: ['reviewer', 'reviews'], analyst: ['analyst', 'analysis', 'researcher'], coach: ['coach', 'trainer'], comedian: ['comedian'], filmmaker: ['filmmaker', 'director'] };
  const FMT_KW = { shorts: ['short-form', 'shorts', 'short videos', 'reels', 'clips'], long_video: ['long-form', 'long form', 'deep dives', 'long videos'], livestream: ['livestream', 'live stream', 'streams live'], tutorial: ['tutorial', 'how-to', 'how to'], explainer: ['explainer', 'explainers', 'breakdowns'], thread: ['threads', 'thread'], review: ['reviews'], vlog: ['vlog', 'vlogs'] };
  const SENSITIVE = ['race', 'ethnicity', 'religion', 'religious', 'sexual orientation', 'gay creators', 'health condition', 'disability', 'pregnant', 'political affiliation', 'immigration status'];
  const UNSUPPORTED = [['income', 'Creator income'], ['revenue', 'Creator revenue'], ['watch time', 'True watch time'], ['demographics', 'Private audience demographics'], ['email', 'Contact data'], ['age of audience', 'Audience age data']];

  function parseNum(s) {
    const m = String(s).replace(/,/g, '').match(/([\d.]+)\s*(k|m)?/i);
    if (!m) return null;
    let n = parseFloat(m[1]);
    if (/k/i.test(m[2] || '')) n *= 1e3;
    if (/m/i.test(m[2] || '')) n *= 1e6;
    return Math.round(n);
  }

  function parseIntent(raw) {
    const q = ' ' + raw.toLowerCase().replace(/\s+/g, ' ').trim() + ' ';
    const intent = { raw, topics: [], types: [], platforms: PLATFORMS.slice(), followerMin: null, followerMax: null, formats: [], cadence: null, stage: null, lang: null, geo: null, engQuality: false, exclusions: [], unsupported: [], blocked: [], broad: false };

    for (const s of SENSITIVE) if (q.includes(s)) intent.blocked.push(s);

    for (const [kw, label] of UNSUPPORTED) if (q.includes(kw)) intent.unsupported.push(label);

    // follower range
    let m = q.match(/(?:under|below|less than|fewer than|<|smaller than|max(?:imum)?(?: of)?)\s*([\d.,]+\s*[km]?)/);
    if (m) intent.followerMax = parseNum(m[1]);
    m = q.match(/(?:over|above|at least|more than|>|min(?:imum)?(?: of)?)\s*([\d.,]+\s*[km]?)/);
    if (m) intent.followerMin = parseNum(m[1]);
    m = q.match(/between\s*([\d.,]+\s*[km]?)\s*(?:and|-|–)\s*([\d.,]+\s*[km]?)/);
    if (m) { intent.followerMin = parseNum(m[1]); intent.followerMax = parseNum(m[2]); }
    if (/\b(nano|micro|tiny|small|early|day zero|undiscovered)\b/.test(q) && !intent.followerMax) intent.followerMax = 50000;

    // exclusions ("no crypto", "not gaming", "without sponsors")
    const exm = q.match(/(?:\bno\b|\bnot\b|without|exclude|excluding)\s+(\w[\w -]{2,20})/g) || [];
    for (const ex of exm) {
      const frag = ex.replace(/^(no|not|without|exclude|excluding)\s+/, '');
      for (const t of TOPICS) if (TOPIC_KW[t].some(k => frag.includes(k))) intent.exclusions.push(t);
    }

    // topics + types (skip excluded topics)
    for (const t of TOPICS) if (!intent.exclusions.includes(t) && TOPIC_KW[t].some(k => q.includes(k))) intent.topics.push(t);
    for (const t in TYPE_KW) if (TYPE_KW[t].some(k => q.includes(k))) intent.types.push(t);

    // platform scope: pre-search toggles, overridden when the query names platforms
    intent.platforms = PLATFORMS.filter(p => platformFilter.has(p));
    const named = PLATFORMS.filter(p => q.includes(p) || (p === 'x' && /\bon x\b|\btwitter\b/.test(q)));
    if (named.length) {
      intent.platforms = named;
      platformFilter.clear();
      named.forEach(p => platformFilter.add(p));
      syncPlatformToggles();
    }

    // formats, cadence, stage, language, geo
    for (const f in FMT_KW) if (FMT_KW[f].some(k => q.includes(k))) intent.formats.push(f);
    if (/daily|every day/.test(q)) intent.cadence = 7;
    else { m = q.match(/(\d+)\s*(?:x|times)\s*(?:a|per)\s*week/); if (m) intent.cadence = +m[1]; else if (/weekly|every week/.test(q)) intent.cadence = 1; }
    if (/about to break ?out|pre-?breakout|breakout|blowing up|taking off/.test(q)) intent.stage = 'pre_breakout';
    else if (/emerging|up-?and-?coming|rising/.test(q)) intent.stage = 'emerging';
    else if (/established|proven/.test(q)) intent.stage = 'established';
    for (const code in LANGS) if (q.includes(LANGS[code].toLowerCase() + '-language') || q.includes(LANGS[code].toLowerCase() + ' language') || (code !== 'en' && q.includes(LANGS[code].toLowerCase()))) intent.lang = code;
    m = q.match(/\bin (?:the )?(us|uk|canada|germany|brazil|japan|india|australia)\b/);
    if (m) intent.geo = { us: 'US', uk: 'UK', canada: 'CA', germany: 'DE', brazil: 'BR', japan: 'JP', india: 'IN', australia: 'AU' }[m[1]];

    // engagement-quality language → PoA preference (labeled estimate)
    intent.engQuality = /loyal|sticky|retention|engaged|authentic|real (audience|engagement|fans)|strong communit|die-?hard|cult/.test(q);

    intent.broad = !intent.topics.length && !intent.types.length && intent.followerMax === null && intent.followerMin === null && !intent.formats.length;
    return intent;
  }

  /* ---------------- expansion-command detection ---------------- */
  function parseExpansion(raw, session) {
    if (!session) return null;
    const q = raw.toLowerCase();
    if (!/\b(more|additional|expand|another)\b/.test(q)) return null;
    const plats = PLATFORMS.filter(p => q.includes(p) || (p === 'x' && /\bon x\b/.test(q)));
    const all = /everywhere|all platforms|every platform/.test(q);
    if (!plats.length && !all) return null;
    const m = q.match(/(\d+)/);
    return { scope: all ? session.intent.platforms : plats, quantity: m ? +m[1] : null };
  }

  /* ---------------- eligibility + Match Confidence ----------------
     Hard gates run before scoring; preferences never override a
     hard failure; missing soft data scores 0.5 and reads unknown. */
  function topicFit(a, wanted) {
    let best = 0;
    for (const t of wanted) {
      if (a.topics.includes(t)) best = Math.max(best, a.topics[0] === t ? 1 : 0.85);
      else if (a.topics.some(at => (TOPIC_ADJ[t] || []).includes(at))) best = Math.max(best, 0.55);
    }
    return best;
  }
  function typeFit(a, wanted) {
    let best = 0;
    for (const t of wanted) {
      if (a.type === t) best = 1;
      else if ((TYPE_ADJ[t] || []).includes(a.type)) best = Math.max(best, 0.75);
    }
    return best;
  }

  const MATCH_W = { topic: 0.32, category: 0.12, followersStage: 0.14, format: 0.10, cadence: 0.08, language: 0.08, geography: 0.05, audience: 0.06, engQuality: 0.05 };

  function evaluate(a, intent) {
    // hard gates
    if (!intent.platforms.includes(a.platform)) return null;
    if (intent.followerMax !== null && a.followers > intent.followerMax) return null;
    if (intent.followerMin !== null && a.followers < intent.followerMin) return null;
    if (intent.topics.length && topicFit(a, intent.topics) < 0.55) return null;
    if (intent.types.length && typeFit(a, intent.types) < 0.75) return null;
    if (intent.exclusions.some(t => a.topics.includes(t))) return null;
    if (intent.lang && a.lang !== intent.lang && !a.multilingual) return null;

    // soft components: {fit, active, unknown}
    const comp = {};
    comp.topic = { active: !!intent.topics.length, fit: intent.topics.length ? topicFit(a, intent.topics) : 0, unknown: false };
    comp.category = { active: !!intent.types.length, fit: intent.types.length ? typeFit(a, intent.types) : 0, unknown: false };
    const stageFit = intent.stage ? (a.stage === intent.stage ? 1 : Math.abs(STAGES.indexOf(a.stage) - STAGES.indexOf(intent.stage)) === 1 ? 0.6 : 0) : 1;
    comp.followersStage = { active: intent.followerMax !== null || intent.followerMin !== null || !!intent.stage, fit: 0.6 * 1 + 0.4 * stageFit, unknown: false };
    comp.format = { active: !!intent.formats.length, fit: intent.formats.length ? (a.formats.filter(f => intent.formats.includes(f)).length ? (intent.formats.includes(a.formats[0]) ? 1 : 0.6) : 0.1) : 0, unknown: false };
    comp.cadence = { active: intent.cadence !== null, fit: intent.cadence !== null ? Math.exp(-Math.abs(Math.log((a.cadence + 0.1) / (intent.cadence + 0.1)))) : 0, unknown: false };
    comp.language = { active: !!intent.lang, fit: intent.lang ? (a.lang === intent.lang ? 1 : 0.8) : 0, unknown: false };
    comp.geography = { active: !!intent.geo, fit: a.geo ? (a.geo === intent.geo ? 1 : 0) : 0.5, unknown: !a.geo };
    comp.audience = { active: false, fit: 0, unknown: false };
    // engagement-quality preference uses OBSERVED signals only (PoA excluded from Match)
    if (intent.engQuality) {
      const vals = Object.values(a.oa.metrics);
      const exposure = vals[0];
      if (exposure === null || exposure === 0) comp.engQuality = { active: true, fit: 0.5, unknown: true };
      else {
        const interactions = vals.slice(1).reduce((s, v) => s + (v || 0), 0);
        comp.engQuality = { active: true, fit: Math.min(1, (interactions / exposure) / 0.08), unknown: false };
      }
    } else comp.engQuality = { active: false, fit: 0, unknown: false };

    let wSum = 0, fitSum = 0, unknownW = 0;
    for (const k in MATCH_W) {
      if (!comp[k].active) continue;
      wSum += MATCH_W[k];
      fitSum += MATCH_W[k] * (comp[k].unknown ? 0.5 : comp[k].fit);
      if (comp[k].unknown) unknownW += MATCH_W[k];
    }
    let match = wSum ? Math.round(100 * fitSum / wSum) : 55; // broad query → neutral base
    if (wSum && unknownW / wSum > 0.25) match = Math.min(match, 79); // unknown cap (PRD B D-010)
    return { account: a, match, comp, unknownW: wSum ? unknownW / wSum : 0 };
  }

  /* ---------------- ranking (tie order: Match → PoA → EC → freshness → ID) ---------------- */
  function rankCompare(x, y) {
    if (y.match !== x.match) return y.match - x.match;
    const px = x.account.poa.shown ? x.account.poa.value : -1;
    const py = y.account.poa.shown ? y.account.poa.value : -1;
    if (py !== px) return py - px;
    if (y.account.evidence.value !== x.account.evidence.value) return y.account.evidence.value - x.account.evidence.value;
    if (x.account.freshHours !== y.account.freshHours) return x.account.freshHours - y.account.freshHours;
    return x.account.externalId < y.account.externalId ? -1 : 1;
  }

  /* ---------------- why-this-matches (grounded in parsed intent) ---------------- */
  function whyText(r, intent) {
    const bits = [];
    if (intent.topics.length) bits.push(TOPIC_LABEL[intent.topics[0]] + (r.comp.topic.fit >= 0.85 ? ' content (strong fit)' : ' adjacent content'));
    if (intent.types.length) bits.push(TYPE_LABEL[r.account.type].toLowerCase());
    if (intent.followerMax !== null) bits.push(fmtK(r.account.followers) + ' followers, under the ' + fmtK(intent.followerMax) + ' cap');
    else if (intent.followerMin !== null) bits.push(fmtK(r.account.followers) + ' followers');
    if (intent.formats.length && r.comp.format.fit >= 0.6) bits.push(FORMATS[intent.formats[0]].toLowerCase());
    if (intent.cadence !== null) bits.push('posts ~' + r.account.cadence + '×/week');
    if (intent.stage) bits.push(STAGE_LABEL[r.account.stage].toLowerCase() + ' stage');
    if (intent.engQuality) bits.push(r.comp.engQuality.unknown ? 'engagement-quality evidence limited' : 'strong observed engagement signals');
    return bits.length ? bits.join(' · ') : 'Broad query — ranked by overall profile fit';
  }

  /* ---------------- session ---------------- */
  let CATALOG = null;
  let session = null;
  let seq = 0;
  const platformFilter = new Set(PLATFORMS);   // pre-search platform selection

  function newSession(intent) {
    if (!CATALOG) CATALOG = buildCatalog();
    seq++;
    const s = { id: 'ss_demo_' + seq, revision: 1, intent, createdAt: new Date(), platforms: {} };
    for (const p of intent.platforms) {
      const ranked = CATALOG.filter(a => a.platform === p).map(a => evaluate(a, intent)).filter(Boolean).sort(rankCompare).slice(0, PLAT_CAP);
      s.platforms[p] = { ranked, shown: 0, nextBatch: 20, state: 'loading', capReached: false };
    }
    return s;
  }

  /* ---------------- formatting helpers ---------------- */
  function fmtK(n) {
    if (n === null || n === undefined) return 'Unavailable';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function fmtFresh(h) { return h <= 1 ? 'Updated 1h ago' : h < 48 ? 'Updated ' + h + 'h ago' : 'Updated ' + Math.round(h / 24) + 'd ago'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function headline(a) {
    const v = a.oa.metrics[Object.keys(a.oa.metrics)[0]];
    return v === null ? 'Attention data unavailable' : fmtK(v) + ' ' + a.oa.headlineMetric + ' · 30d';
  }

  /* ---------------- rendering ---------------- */
  let root = null, announcer = null;

  function orbitRing(size, duration, reverse, offset) {
    const tier = size > 1000 ? ' is-outer' : size > 700 ? ' is-middle' : ' is-inner';
    const nodes = PLATFORMS.map((platform, index) => {
      const angle = offset + (Math.PI * 2 * index / PLATFORMS.length);
      const x = (Math.cos(angle) * 46).toFixed(3);
      const y = (Math.sin(angle) * 46).toFixed(3);
      return `<span class="sx-orbit-node" data-platform="${platform}" style="--sx-node-x:${x}%;--sx-node-y:${y}%"><span class="sx-app-icon"><svg viewBox="0 0 24 24" class="ic">${(window.BACKER.PLAT_IC[platform] || '')}</svg></span></span>`;
    }).join('');
    return `<div class="sx-orbit-ring${tier}${reverse ? ' is-reverse' : ''}" style="--sx-orbit-size:${size}px;--sx-orbit-duration:${duration}s">${nodes}</div>`;
  }

  function render(container, query) {
    root = container;
    session = null;
    container.innerHTML = `
      <div class="search-view sx">
        <div class="sx-hero-stage">
          <div class="sx-orbit-scene" aria-hidden="true">
            <div class="sx-orbit-plane">
              ${orbitRing(1360, 92, false, -0.42)}
              ${orbitRing(920, 74, true, 0.2)}
              ${orbitRing(570, 58, false, -0.08)}
            </div>
          </div>
          <div class="sx-hero-shade" aria-hidden="true"></div>
          <div class="sx-hero-content">
            <div class="search-hero">
              <h1 aria-label="Backer AI — Creator Discovery Agent">
                <span class="sx-hero-title-main">Backer AI</span>
                <em class="sx-hero-title-sub">Creator Discovery Agent</em>
              </h1>
              <p class="sx-lede">Describe what creators you want to back in natural language.</p>
            </div>
            <form class="big-search" id="sxForm">
              <svg viewBox="0 0 24 24" class="ic" style="width:20px;height:20px"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input id="sxInput" autocomplete="off" placeholder="e.g. AI educators under 100K followers with loyal audiences" value="${esc(query || '')}"/>
              <button class="send" type="submit" aria-label="Search"><svg viewBox="0 0 24 24" class="ic"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
            </form>
            <div class="pills-shell search-ex-shell">
              <div class="pills search-ex" role="group" aria-label="Suggested creator searches">
                <div class="pills-track search-ex-track">
                  <div class="pills-group">
                    <button type="button" class="chip" data-ex="AI educators under 100K followers with loyal audiences">AI educators · loyal</button>
                    <button type="button" class="chip" data-ex="indie builders shipping weekly on YouTube and X">builders · weekly</button>
                    <button type="button" class="chip" data-ex="musicians about to break out, under 50K">music · pre-breakout</button>
                    <button type="button" class="chip" data-ex="Spanish-language cooking creators">cooking · Spanish</button>
                  </div>
                  <div class="pills-group" aria-hidden="true">
                    <span class="chip" data-ex="AI educators under 100K followers with loyal audiences">AI educators · loyal</span>
                    <span class="chip" data-ex="indie builders shipping weekly on YouTube and X">builders · weekly</span>
                    <span class="chip" data-ex="musicians about to break out, under 50K">music · pre-breakout</span>
                    <span class="chip" data-ex="Spanish-language cooking creators">cooking · Spanish</span>
                  </div>
                </div>
              </div>
              <button class="pills-toggle search-ex-toggle" type="button" aria-pressed="false" aria-label="Pause scrolling suggestions"><span aria-hidden="true">Ⅱ</span></button>
            </div>
            <div class="sx-plat-filter" role="group" aria-label="Platforms to search">
              <span class="sx-plat-filter-label">Search on</span>
              ${PLATFORMS.map(p => `<button type="button" class="sx-plat-toggle" data-plat="${p}" aria-pressed="${platformFilter.has(p)}"><svg viewBox="0 0 24 24" class="ic">${(window.BACKER.PLAT_IC[p] || "")}</svg>${PLAT_LABEL[p]}</button>`).join('')}
            </div>
          </div>
        </div>
        <div id="sxOut"></div>
        <div class="sx-announce" aria-live="polite"></div>
      </div>`;
    announcer = root.querySelector('.sx-announce');
    const form = root.querySelector('#sxForm'), input = root.querySelector('#sxInput');
    form.addEventListener('submit', e => { e.preventDefault(); submit(input.value.trim()); });
    if (window.__backerBindPromptMarquee) window.__backerBindPromptMarquee(root, input, submit);
    root.querySelectorAll('.sx-plat-toggle').forEach(b => b.addEventListener('click', () => togglePlatform(b.dataset.plat)));
    if (query) submit(query);
  }

  function syncPlatformToggles() {
    root.querySelectorAll('.sx-plat-toggle').forEach(b => b.setAttribute('aria-pressed', String(platformFilter.has(b.dataset.plat))));
  }

  function togglePlatform(p) {
    if (platformFilter.has(p)) {
      if (platformFilter.size === 1) { announce('At least one platform must stay selected'); return; }
      platformFilter.delete(p);
    } else platformFilter.add(p);
    syncPlatformToggles();
    // refine a live search: re-run the same intent on the new platform set
    if (session) {
      const it = session.intent;
      it.platforms = PLATFORMS.filter(x => platformFilter.has(x));
      const rev = session.revision + 1;
      session = newSession(it);
      session.revision = rev;
      renderSession();
      announce('Platform scope updated, revision ' + rev);
    }
  }

  function announce(msg) { if (announcer) announcer.textContent = msg; }

  function revealResults(out) {
    requestAnimationFrame(() => {
      out.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function submit(q) {
    if (!q) return;
    const expand = parseExpansion(q, session);
    if (expand) { runExpansion(expand); return; }
    const intent = parseIntent(q);
    const out = root.querySelector('#sxOut');
    if (intent.blocked.length) {
      out.innerHTML = `<div class="sx-notice sx-notice-block" role="alert"><b>This request can’t be used for targeting.</b> Backer doesn’t search by ${esc(intent.blocked.join(', '))} — protected and sensitive traits are never inferred for creator or audience targeting. Content-topic searches (what a creator publishes about) are supported.</div>`;
      revealResults(out);
      return;
    }
    if (intent.followerMin !== null && intent.followerMax !== null && intent.followerMin > intent.followerMax) {
      out.innerHTML = `<div class="sx-notice sx-notice-block" role="alert"><b>Conflicting constraints.</b> “At least ${fmtK(intent.followerMin)}” and “under ${fmtK(intent.followerMax)}” can’t both hold. Edit the query to resolve the range.</div>`;
      revealResults(out);
      return;
    }
    session = newSession(intent);
    renderSession();
    revealResults(out);
  }

  /* ---------- chips ---------- */
  function chipRow(intent) {
    const req = [], pref = [], other = [];
    const chip = (arr, key, label, note) => arr.push({ key, label, note });
    intent.topics.forEach(t => chip(req, 'topic:' + t, TOPIC_LABEL[t]));
    intent.types.forEach(t => chip(req, 'type:' + t, TYPE_LABEL[t]));
    if (intent.followerMax !== null) chip(req, 'fmax', 'Under ' + fmtK(intent.followerMax));
    if (intent.followerMin !== null) chip(req, 'fmin', 'Over ' + fmtK(intent.followerMin));
    if (intent.lang) chip(req, 'lang', LANGS[intent.lang]);
    intent.exclusions.forEach(t => chip(req, 'excl:' + t, 'No ' + TOPIC_LABEL[t]));
    intent.formats.forEach(f => chip(pref, 'fmt:' + f, FORMATS[f]));
    if (intent.cadence !== null) chip(pref, 'cad', '~' + intent.cadence + '×/week');
    if (intent.stage) chip(pref, 'stage', STAGE_LABEL[intent.stage]);
    if (intent.geo) chip(pref, 'geo', intent.geo + ' (sourced only)');
    if (intent.engQuality) chip(pref, 'engq', 'Strong engagement quality', 'PoA-adjacent estimate — accounts with limited evidence are labeled');
    intent.unsupported.forEach(u => chip(other, 'unsup', u));

    const g = (title, list, cls, removable) => list.length ? `<div class="sx-chip-group"><span class="sx-chip-title">${title}</span>${list.map(c =>
      `<span class="sx-chip ${cls}" ${c.note ? `title="${esc(c.note)}"` : ''}>${esc(c.label)}${removable ? `<button class="sx-chip-x" data-chip="${c.key}" aria-label="Remove ${esc(c.label)}">×</button>` : ''}</span>`).join('')}</div>` : '';
    return `<div class="sx-chips">${g('Required', req, 'sx-chip-req', true)}${g('Preferred', pref, 'sx-chip-pref', true)}${g('Not used in this search', other, 'sx-chip-unsup', false)}
      ${intent.broad ? '<div class="sx-chip-group"><span class="sx-chip sx-chip-unsup">Broad search — add topics, size, or format to narrow</span></div>' : ''}</div>`;
  }

  function removeChip(key) {
    const it = session.intent;
    const [kind, val] = key.split(':');
    if (kind === 'topic') it.topics = it.topics.filter(t => t !== val);
    else if (kind === 'type') it.types = it.types.filter(t => t !== val);
    else if (kind === 'excl') it.exclusions = it.exclusions.filter(t => t !== val);
    else if (kind === 'fmt') it.formats = it.formats.filter(f => f !== val);
    else if (key === 'fmax') it.followerMax = null;
    else if (key === 'fmin') it.followerMin = null;
    else if (key === 'lang') it.lang = null;
    else if (key === 'cad') it.cadence = null;
    else if (key === 'stage') it.stage = null;
    else if (key === 'geo') it.geo = null;
    else if (key === 'engq') it.engQuality = false;
    const rev = session.revision + 1;
    session = newSession(it);
    session.revision = rev;
    renderSession();
    announce('Search updated, revision ' + rev);
  }

  /* ---------- session view ---------- */
  function renderSession() {
    const out = root.querySelector('#sxOut');
    const s = session;
    out.innerHTML = `
      <div class="sx-demo-note">Demo catalog — ${CATALOG.length} simulated accounts with full provenance modeling. Production search requires licensed platform data paths (see launch gates); no real accounts are shown here.</div>
      ${chipRow(s.intent)}
      <div class="sx-strip" role="navigation" aria-label="Platform results">${s.intent.platforms.map(p => `<button class="sx-strip-tab" data-goto="${p}"><svg viewBox="0 0 24 24" class="ic">${(window.BACKER.PLAT_IC[p] || "")}</svg>${PLAT_LABEL[p]} <span class="sx-strip-n" id="sxN-${p}">…</span></button>`).join('')}</div>
      ${s.intent.platforms.map(p => sectionShell(p)).join('')}
      <div class="sx-global">
        <button class="sx-expand-all" id="sxExpandAll" hidden></button>
        <div class="sx-foot">Session ${s.id} · rev ${s.revision} · frozen ${s.createdAt.toISOString().slice(0, 16).replace('T', ' ')} UTC · ${VERSIONS.match} · ${VERSIONS.poa} · ${VERSIONS.evidence} · ordering: Match → PoA → Evidence → freshness → stable ID · cap ${PLAT_CAP}/platform</div>
      </div>`;
    out.querySelectorAll('.sx-chip-x').forEach(b => b.addEventListener('click', () => removeChip(b.dataset.chip)));
    out.querySelectorAll('.sx-strip-tab').forEach(b => b.addEventListener('click', () => {
      const el = document.getElementById('sxSec-' + b.dataset.goto);
      if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    }));
    document.getElementById('sxExpandAll').addEventListener('click', expandAll);
    // stream platforms independently
    s.intent.platforms.forEach(p => {
      const delay = REDUCED ? 0 : STREAM_DELAY[p];
      setTimeout(() => { if (session === s) revealPlatform(p); }, delay);
    });
  }

  function sectionShell(p) {
    return `<section class="sx-section" id="sxSec-${p}" aria-busy="true">
      <div class="sx-sec-head">
        <h2><svg viewBox="0 0 24 24" class="ic">${(window.BACKER.PLAT_IC[p] || "")}</svg>${PLAT_LABEL[p]}</h2>
        <span class="sx-sec-meta" id="sxMeta-${p}"><span class="sx-spinner" aria-hidden="true"></span>Searching…</span>
      </div>
      <div class="sx-rows" id="sxRows-${p}"></div>
      <div class="sx-sec-foot" id="sxFoot-${p}"></div>
    </section>`;
  }

  function revealPlatform(p) {
    const ps = session.platforms[p];
    ps.state = 'ready';
    appendSlice(p, INITIAL, true);
    announce(PLAT_LABEL[p] + ' results ready, ' + ps.shown + ' shown');
    updateGlobalButton();
  }

  function appendSlice(p, count, initial) {
    const ps = session.platforms[p];
    const rows = document.getElementById('sxRows-' + p);
    const slice = ps.ranked.slice(ps.shown, ps.shown + count);
    slice.forEach((r, i) => rows.insertAdjacentHTML('beforeend', rowHTML(r, ps.shown + i + 1, p)));
    ps.shown += slice.length;
    if (ps.shown >= ps.ranked.length) ps.state = ps.ranked.length >= PLAT_CAP ? 'cap' : 'exhausted';
    rows.parentElement.setAttribute('aria-busy', 'false');
    rows.querySelectorAll('[data-search-poa]:not([data-wired])').forEach(b => {
      b.dataset.wired = '1';
      b.addEventListener('click', () => openSearchPoa(p, b.dataset.searchPoa, b));
    });
    updateSectionChrome(p);
    if (!initial) announce('Added ' + slice.length + ' ' + PLAT_LABEL[p] + ' results, ' + ps.shown + ' total');
  }

  function updateSectionChrome(p) {
    const ps = session.platforms[p];
    const meta = document.getElementById('sxMeta-' + p), foot = document.getElementById('sxFoot-' + p), n = document.getElementById('sxN-' + p);
    const eligible = ps.ranked.length;
    n.textContent = ps.shown;
    const freshest = ps.ranked.length ? Math.min.apply(null, ps.ranked.slice(0, ps.shown).map(r => r.account.freshHours)) : null;
    meta.innerHTML = eligible === 0
      ? 'No eligible accounts'
      : `${ps.shown} shown · ${eligible} eligible${freshest !== null ? ' · freshest data ' + (freshest <= 1 ? '1h' : freshest < 48 ? freshest + 'h' : Math.round(freshest / 24) + 'd') + ' old' : ''}`;
    if (eligible === 0) {
      foot.innerHTML = `<div class="sx-empty">No ${PLAT_LABEL[p]} account passes every required constraint. Try removing a required chip — hard constraints are never loosened automatically.</div>`;
    } else if (ps.state === 'exhausted') {
      foot.innerHTML = `<div class="sx-exhausted">All ${eligible} eligible ${PLAT_LABEL[p]} accounts shown — inventory exhausted for this snapshot.</div>`;
    } else if (ps.state === 'cap') {
      foot.innerHTML = `<div class="sx-exhausted">Session cap of ${PLAT_CAP} reached for ${PLAT_LABEL[p]} — more candidates may exist.</div>`;
    } else {
      const next = Math.min(ps.nextBatch, ps.ranked.length - ps.shown);
      foot.innerHTML = `<button class="sx-expand" data-plat="${p}">Find ${next} more on ${PLAT_LABEL[p]}</button>`;
      foot.querySelector('.sx-expand').addEventListener('click', e => expandPlatform(p, null, e.currentTarget));
    }
    updateGlobalButton();
  }

  function expandPlatform(p, explicitQty, btn) {
    const ps = session.platforms[p];
    if (ps.state === 'expanding' || ps.shown >= ps.ranked.length) return;
    ps.state = 'expanding';
    if (btn) { btn.disabled = true; btn.textContent = 'Expanding ' + PLAT_LABEL[p] + '…'; }
    const qty = explicitQty || ps.nextBatch;
    setTimeout(() => {
      appendSlice(p, qty, false);
      if (ps.state === 'expanding') ps.state = 'ready';
      if (explicitQty) ps.nextBatch = Math.max(ps.nextBatch, 10 * Math.ceil((explicitQty + 1) / 10));
      else ps.nextBatch += 10;             // 20 → 30 → 40 → 50 …
      updateSectionChrome(p);
    }, REDUCED ? 0 : 420);
  }

  function updateGlobalButton() {
    const btn = document.getElementById('sxExpandAll');
    if (!btn) return;
    const pending = session.intent.platforms.filter(p => {
      const ps = session.platforms[p];
      return ps.state !== 'loading' && ps.shown < ps.ranked.length;
    });
    if (pending.length < 2) { btn.hidden = true; return; }
    btn.hidden = false;
    // label lists the ACTUAL per-platform request (PRD A journey E)
    btn.textContent = 'Show more everywhere — ' + pending.map(p => {
      const ps = session.platforms[p];
      return '+' + Math.min(ps.nextBatch, ps.ranked.length - ps.shown) + ' ' + PLAT_LABEL[p];
    }).join(' · ');
  }

  function expandAll() {
    session.intent.platforms.forEach(p => {
      const ps = session.platforms[p];
      if (ps.state !== 'loading' && ps.state !== 'expanding' && ps.shown < ps.ranked.length) expandPlatform(p, null, document.querySelector(`#sxFoot-${p} .sx-expand`));
    });
  }

  function runExpansion(cmd) {
    const targets = cmd.scope.filter(p => session.platforms[p]);
    if (!targets.length) return;
    announce('Interpreted as an expansion command');
    targets.forEach(p => expandPlatform(p, cmd.quantity, document.querySelector(`#sxFoot-${p} .sx-expand`)));
  }

  /* ---------- result rows ---------- */
  function rowHTML(r, rank, p) {
    const a = r.account;
    const poaLabel = a.poa.shown ? a.poa.value + ' · ' + a.poa.tier : 'Insufficient evidence';
    return `<div class="sx-row">
      <button type="button" class="sx-row-hit" data-search-poa="${a.id}" aria-label="Open Proof of Attention composition for ${esc(a.name)}"></button>
      <span class="sx-rank">${rank}</span>
      <span class="sx-ava" style="background:linear-gradient(135deg,hsl(${a.hue} 45% 26%),hsl(${(a.hue + 40) % 360} 50% 16%))" aria-hidden="true">${esc(a.name.split(' ').map(w => w[0]).join(''))}</span>
      <div class="sx-id">
        <div class="sx-name">${esc(a.name)} <span class="sx-demo-tag" title="Simulated account — demo catalog">demo</span></div>
        <div class="sx-handle">${esc(a.handle)} · ${TYPE_LABEL[a.type]} · ${a.topics.map(t => TOPIC_LABEL[t]).join(', ')}</div>
        <div class="sx-why">Why: ${esc(whyText(r, session.intent))}</div>
      </div>
      <div class="sx-metrics">
        <span class="sx-followers">${fmtK(a.followers)} followers</span>
        <span class="sx-oa">${esc(headline(a))}</span>
        <span class="sx-fresh">${fmtFresh(a.freshHours)}</span>
      </div>
      <div class="sx-scores">
        <span class="sx-match" title="Match Confidence (Beta calibration) — how well this account satisfies the interpreted request">Match ${r.match}</span>
        <button type="button" class="sx-poa-btn" data-search-poa="${a.id}" aria-label="Open Proof of Attention composition for ${esc(a.name)}">PoA: ${poaLabel}</button>
        <span class="sx-ec sx-ec-${a.evidence.tier.toLowerCase()}">Evidence: ${a.evidence.tier}</span>
      </div>
    </div>`;
  }

  /* ---------- PoA drawer ---------- */
  let drawerEl = null, drawerReturn = null;

  function openSearchPoa(p, acctId, trigger) {
    const platform = session && session.platforms[p];
    const result = platform && platform.ranked.find(x => x.account.id === acctId);
    if (!result) return;
    const a = result.account;
    if (trigger && trigger.focus) {
      try { trigger.focus({ preventScroll: true }); } catch (e) { try { trigger.focus(); } catch (x) {} }
    }
    const terminal = window.PoaTerminal;
    const context = { seed: a.id, creator: a, name: a.name, handle: a.handle, surface: 'poa' };
    if (terminal && typeof terminal.open === 'function') { terminal.open(context); return; }
    if (terminal && typeof terminal.openByCreator === 'function') { terminal.openByCreator(a.id, context); return; }
    openDrawer(p, acctId, trigger);
  }

  function openDrawer(p, acctId, trigger) {
    const r = session.platforms[p].ranked.find(x => x.account.id === acctId);
    if (!r) return;
    const a = r.account;
    closeDrawer();
    drawerReturn = trigger;
    const bar = (label, v, max) => `<div class="sx-bar-row"><span>${label}</span><div class="sx-bar"><div class="sx-bar-fill" style="width:${Math.round(v / max * 100)}%"></div></div><span class="sx-bar-v">${typeof v === 'number' && max === 1 ? Math.round(v * 100) + '%' : v}</span></div>`;
    const compRows = Object.keys(POA_W).map(k => {
      const v = a.poaComp[k];
      return `<tr><td>${POA_NAMES[k]}</td><td>${v === null ? '<span class="sx-unavail">Unavailable</span>' : v + ' / 100'}</td><td>${POA_W[k]}%</td></tr>`;
    }).join('');
    const oaRows = Object.entries(a.oa.metrics).map(([k, v]) =>
      `<tr><td>${k}</td><td>${v === null ? '<span class="sx-unavail">Unavailable</span>' : fmtK(v)}</td><td>30d · ${a.oa.sample} items</td></tr>`).join('');
    const missing = Object.keys(POA_W).filter(k => a.poaComp[k] === null).map(k => POA_NAMES[k]);
    drawerEl = document.createElement('div');
    drawerEl.className = 'sx-drawer-wrap';
    drawerEl.innerHTML = `
      <div class="sx-drawer-scrim"></div>
      <aside class="sx-drawer" role="dialog" aria-modal="true" aria-label="Proof of Attention details for ${esc(a.name)}">
        <button class="sx-drawer-close" aria-label="Close">×</button>
        <div class="sx-drawer-head">
          <span class="sx-ava" style="background:linear-gradient(135deg,hsl(${a.hue} 45% 26%),hsl(${(a.hue + 40) % 360} 50% 16%))">${esc(a.name.split(' ').map(w => w[0]).join(''))}</span>
          <div><h3 tabindex="-1" id="sxDrawerTitle">${esc(a.name)}</h3><div class="sx-handle">${esc(a.handle)} · ${PLAT_LABEL[p]} · simulated account</div></div>
        </div>
        <div class="sx-drawer-scores">
          <div class="sx-ds"><span class="sx-ds-label">Proof of Attention</span><span class="sx-ds-val">${a.poa.shown ? a.poa.value : '—'}</span><span class="sx-ds-tier">${a.poa.tier}</span></div>
          <div class="sx-ds"><span class="sx-ds-label">Evidence Confidence</span><span class="sx-ds-val">${a.evidence.value}</span><span class="sx-ds-tier">${a.evidence.tier}</span></div>
        </div>
        ${a.poa.shown ? '' : `<div class="sx-notice">Numeric PoA is hidden: it requires at least 3 available components, the platform minimum sample, and Evidence Confidence ≥ 60. Available evidence is shown below — nothing is estimated to fill the gap.</div>`}
        <h4>Evidence Confidence factors</h4>
        ${Object.entries(a.evidence.factors).map(([k, v]) => bar(k, Math.round(v * 100) / 100, 1)).join('')}
        <h4>Observed Attention — platform-native, last 30 days</h4>
        <table class="sx-table"><thead><tr><th>Metric</th><th>Value</th><th>Window · sample</th></tr></thead><tbody>${oaRows}</tbody></table>
        <p class="sx-fine">Raw source measurements. Metrics are never summed across types or platforms; missing values are shown as Unavailable, never zero.</p>
        <h4>PoA components (${VERSIONS.poa})</h4>
        <table class="sx-table"><thead><tr><th>Component</th><th>Score</th><th>Weight</th></tr></thead><tbody>${compRows}</tbody></table>
        ${missing.length ? `<p class="sx-fine">Missing: ${missing.join(', ')} — weights renormalize over available components; missing coverage lowers Evidence Confidence instead of being guessed.</p>` : ''}
        <h4>Provenance</h4>
        <p class="sx-fine">Source: ${a.source.label} · reliability ${a.source.reliability.toFixed(2)} · ${fmtFresh(a.freshHours).toLowerCase()} · stable ID ${a.externalId} · catalog ${VERSIONS.catalog}</p>
        <h4>Limitations</h4>
        <p class="sx-fine">PoA estimates the strength of substantive attention signals. It is not a fraud score and no tier means “real” or “fake.” This demo uses a simulated catalog; production requires licensed data paths per platform.</p>
        <button class="sx-report">Report incorrect data</button>
      </aside>`;
    document.body.appendChild(drawerEl);
    drawerEl.querySelector('.sx-drawer-scrim').addEventListener('click', closeDrawer);
    drawerEl.querySelector('.sx-drawer-close').addEventListener('click', closeDrawer);
    drawerEl.querySelector('.sx-report').addEventListener('click', e => {
      e.currentTarget.outerHTML = '<p class="sx-fine sx-report-ok">Correction case recorded (demo) — in production this opens a tracked case with source snapshots and score versions.</p>';
    });
    document.addEventListener('keydown', drawerKey);
    drawerEl.querySelector('#sxDrawerTitle').focus();
  }
  function drawerKey(e) { if (e.key === 'Escape') closeDrawer(); }
  function closeDrawer() {
    if (!drawerEl) return;
    document.removeEventListener('keydown', drawerKey);
    drawerEl.remove(); drawerEl = null;
    if (drawerReturn && document.contains(drawerReturn)) drawerReturn.focus();
    drawerReturn = null;
  }

  return { render };
})();
