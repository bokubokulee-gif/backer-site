/* =========================================================
   BACKER — mock data layer
   Creators (incl. ones the algorithm flags), partners, helpers.
   No network, no build. Everything is inline.
   ========================================================= */
window.BACKER = (function () {

  /* ---- platform icons (inline svg paths) ---- */
  const PLAT_IC = {
    youtube: '<path d="M22 12s0-3.5-.4-5a2.6 2.6 0 0 0-1.8-1.8C18 4.8 12 4.8 12 4.8s-6 0-7.8.4A2.6 2.6 0 0 0 2.4 7C2 8.5 2 12 2 12s0 3.5.4 5a2.6 2.6 0 0 0 1.8 1.8c1.8.4 7.8.4 7.8.4s6 0 7.8-.4A2.6 2.6 0 0 0 21.6 17c.4-1.5.4-5 .4-5z"/><path d="M10 15l5-3-5-3z"/>',
    tiktok: '<path d="M16 3v3.5a5 5 0 0 0 4 4M16 3h-3v11.5a3 3 0 1 1-3-3"/>',
    spotify: '<circle cx="12" cy="12" r="9"/><path d="M7.5 10c3-1 6.5-.6 9 1M8 13.5c2.2-.7 4.8-.4 6.8 1M8.5 16.5c1.6-.5 3.4-.3 4.8.7"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    substack: '<path d="M4 5h16M4 10h16M4 15l8 4 8-4v6"/>',
    twitch: '<path d="M4 3h16v11l-4 4h-4l-3 3v-3H4z"/><path d="M11 8v4M15 8v4"/>',
    github: '<path d="M9 19c-4 1.4-4-2-6-2m12 4v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6-1.4 6-6.3a4.9 4.9 0 0 0-1.4-3.4 4.5 4.5 0 0 0-.1-3.4s-1.1-.4-3.6 1.3a12.3 12.3 0 0 0-6.6 0C6.5 1.5 5.4 1.9 5.4 1.9a4.5 4.5 0 0 0-.1 3.4A4.9 4.9 0 0 0 4 8.7c0 4.8 3 6 6 6.3a3.4 3.4 0 0 0-.9 2.5V21"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    soundcloud: '<path d="M4 14v4M7 11v7M10 9v9M13 11v7M16 9c3 0 5 2 5 4.5S19 19 16 19h-3V9z"/>'
  };

  /* ---- creators ---- */
  const creators = [
    {
      id: 'kai', name: 'Kai Nakamura', handle: '@kai.papers', category: 'AI Research', cat: 'ai',
      hue: 168, blurb: 'Breaks down frontier ML papers into 6-minute explainers. Tiny audience, cult loyalty.',
      followers: 8400, monthlyViews: 96000, growth: 21,
      auth: 94, retention: { label: 'Very High', idx: 93 }, engQ: { score: 91, grade: 'A+' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 22,
      traj: [3.1, 3.6, 4.3, 5.2, 6.1, 7.2, 8.4],
      platforms: [['youtube', '@kai.papers', '8.4K'], ['x', '@kainakamura', '12.1K'], ['substack', 'kaipapers', '4.3K']],
      milestone: { metric: 'YouTube subscribers', target: 25000, current: 8400, deadline: '9 months', mult: 2.0 },
      raised: 40500, goal: 50000,
      ai: {
        intro: "Kai is one of the strongest <b>retention plays</b> on Backer right now. 93% retention index against an 8.4K base is rare — this is a small audience that watches everything.",
        catalysts: "Three catalysts: (1) <b>40% of viewers finish every video</b> — completion this high precedes algorithmic breakout. (2) Cross-platform pull: his X threads drive 31% of new YouTube subs organically. (3) The AI-explainer niche is expanding ~4×/yr with almost no high-trust supply.",
        risks: "Main risk is <b>cadence dependency</b> — output is tied to one person. A 2-week gap historically costs ~8% of velocity. No team, no buffer. Monetization is healthy (22%) but concentrated in a paid newsletter.",
        retention: "Cohort loyalty is the thesis. The Jan cohort still returns at <b>61% six months later</b> — 3× the category median. Sentiment trajectory is steadily positive; comment quality is unusually substantive (low semantic redundancy)."
      }
    },
    {
      id: 'elena', name: 'Elena Vance', handle: '@elenabuilds', category: 'Tech Education', cat: 'tech',
      hue: 28, blurb: 'Teaches non-engineers to ship real software. Calm, dense, rewatchable.',
      followers: 125000, monthlyViews: 512000, growth: 33,
      auth: 91, retention: { label: 'High', idx: 88 }, engQ: { score: 86, grade: 'A' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 18,
      traj: [48, 58, 71, 84, 97, 110, 125],
      platforms: [['youtube', '@elenabuilds', '125K'], ['instagram', '@elenabuilds', '64K'], ['github', 'elenav', '9.1K']],
      milestone: { metric: 'YouTube subscribers', target: 250000, current: 125000, deadline: '12 months', mult: 1.6 },
      raised: 34000, goal: 50000,
      ai: {
        intro: "Elena is a <b>momentum + quality</b> double-positive: +33% MoM with a retention index of 88. Growth this fast usually comes with falling retention. Hers is rising.",
        catalysts: "Her course funnel converts at 18% monetization propensity — high for tech-ed. Search demand for her core topics is up 2.2× YoY, and she ranks for them. A breakout single video would compound fast given her completion rates.",
        risks: "She's already at 125K, so you're paying for the back half of the curve, not day zero. The 1.6× milestone is achievable but not a moonshot. Velocity is clean — no anomalies.",
        retention: "88 retention index. Returning-viewer rate is 47% week-over-week. Audience skews 22–34, high-intent (they're here to learn), which correlates with low churn and strong paid conversion."
      }
    },
    {
      id: 'luna', name: 'Luna Reyes', handle: '@lunareyes', category: 'Music', cat: 'music',
      hue: 286, blurb: 'Bedroom pop, recorded in a Lisbon apartment. Quietly compounding on Spotify.',
      followers: 62000, monthlyViews: 410000, growth: 29,
      auth: 86, retention: { label: 'High', idx: 82 }, engQ: { score: 79, grade: 'A-' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 14,
      traj: [22, 28, 33, 40, 47, 55, 62],
      platforms: [['spotify', 'Luna Reyes', '62K'], ['soundcloud', 'lunareyes', '38K'], ['tiktok', '@lunamakesnoise', '91K']],
      milestone: { metric: 'Spotify monthly listeners', target: 200000, current: 62000, deadline: '12 months', mult: 1.8 },
      raised: 27000, goal: 50000,
      ai: {
        intro: "Luna is a classic <b>pre-virality music play</b>. 62K monthly listeners, but the save-rate and playlist-add velocity look like an artist about to be picked up by editorial.",
        catalysts: "Save-to-stream ratio is in the top 8% of her tier — listeners are collecting her tracks, not just passing through. One TikTok sound is at early-exponential. Editorial playlist adds tend to follow these signals by 60–90 days.",
        risks: "Music is hit-driven and harder to underwrite than recurring content. Income is diversified but thin (14% monetization). The 1.8× requires roughly tripling listeners — real, but momentum-dependent.",
        retention: "82 retention index via repeat-listener cohorts. 34% of last quarter's new listeners returned the following month — strong for music, where most discovery is one-and-done."
      }
    },
    {
      id: 'devon', name: 'Devon Park', handle: '@devonships', category: 'Indie Hackers', cat: 'indie',
      hue: 210, blurb: 'Ships a new micro-SaaS every two weeks in public. Builds in front of a tiny, paying crowd.',
      followers: 14000, monthlyViews: 88000, growth: 24,
      auth: 90, retention: { label: 'High', idx: 79 }, engQ: { score: 81, grade: 'A-' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 27,
      traj: [6.5, 7.8, 9.1, 10.4, 11.8, 12.9, 14],
      platforms: [['x', '@devonships', '14K'], ['github', 'devonp', '6.2K'], ['youtube', '@devonships', '5.1K']],
      milestone: { metric: 'Combined MRR across products', target: 20000, current: 6200, deadline: '12 months', mult: 1.9, money: true },
      raised: 23500, goal: 50000,
      ai: {
        intro: "Devon is a <b>monetization-first</b> bet. 27% propensity is exceptional — his audience is other builders who buy tools, not passive viewers.",
        catalysts: "Build-in-public creators with paying audiences have the shortest path to milestone revenue. He already runs 4 products at ~$6.2K MRR; the milestone is a 3× on a base that compounds with each launch.",
        risks: "Revenue is lumpy and launch-dependent. A few quiet weeks dent the trajectory. Small absolute audience means a single platform change (X reach throttling) matters more than for diversified creators.",
        retention: "79 retention index. His weekly 'ship log' has a 52% open-through rate. The audience is small but the highest-intent on the platform — they show up to buy, not browse."
      }
    },
    {
      id: 'mira', name: 'Mira Osei', handle: '@mira.draws', category: 'Digital Art', cat: 'art',
      hue: 330, blurb: 'Surreal daily illustrations. A style you recognize in one frame.',
      followers: 33000, monthlyViews: 240000, growth: 26,
      auth: 84, retention: { label: 'High', idx: 80 }, engQ: { score: 83, grade: 'A' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 12,
      traj: [14, 17, 20, 23, 27, 30, 33],
      platforms: [['instagram', '@mira.draws', '33K'], ['tiktok', '@miradraws', '58K'], ['x', '@mira_osei', '11K']],
      milestone: { metric: 'Instagram followers', target: 100000, current: 33000, deadline: '12 months', mult: 1.7 },
      raised: 19500, goal: 50000,
      ai: {
        intro: "Mira has the strongest <b>distinctiveness signal</b> in the art category — her work is identifiable without a watermark, which is the moat that survives algorithm changes.",
        catalysts: "Saves-per-post is 2.1× the illustration-category median (people collect her work). Print and commission demand is unmet. A licensing deal or a single viral piece would re-rate the milestone quickly.",
        risks: "Lowest monetization here (12%) — art audiences love but don't always pay. Authenticity at 84 is solid but not elite; a slice of TikTok reach is low-intent passersby.",
        retention: "80 retention index. Her daily cadence builds habit — 38% of followers engage weekly. Sentiment is overwhelmingly positive and the comment section is a genuine community, not a like-farm."
      }
    },
    {
      id: 'sam', name: 'Sam Whitfield', handle: '@samwrites', category: 'Writing', cat: 'writing',
      hue: 46, blurb: 'Long-form essays on technology and attention. Small list, devout readers.',
      followers: 9100, monthlyViews: 52000, growth: 17,
      auth: 92, retention: { label: 'Very High', idx: 90 }, engQ: { score: 88, grade: 'A' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 31,
      traj: [4.2, 5.0, 5.9, 6.6, 7.4, 8.2, 9.1],
      platforms: [['substack', 'samwrites', '9.1K'], ['x', '@samwrites', '18K']],
      milestone: { metric: 'Paid subscribers', target: 5000, current: 1180, deadline: '12 months', mult: 2.1 },
      raised: 36500, goal: 50000,
      ai: {
        intro: "Sam is the highest-<b>monetization</b> profile on the board (31%). Paid newsletters with this conversion are effectively annuities — the milestone is the most underwritable here.",
        catalysts: "1,180 paid subs already, growing without paid acquisition. Open rates above 60%. Essays get quoted by larger accounts, which is free top-of-funnel. The 2.1× is the highest multiple because the base is small but the unit economics are proven.",
        risks: "Slowest raw growth (+17%) — this is a compounding bet, not a spike. Heavily reliant on one author's output. Substack platform risk applies.",
        retention: "90 retention index — the highest on Backer. Paid churn under 3%/month. Readers don't just subscribe, they reply. This is the cleanest 'real audience' signal in the dataset."
      }
    },
    {
      id: 'priya', name: 'Priya Anand', handle: '@priya.eats', category: 'Cooking', cat: 'cooking',
      hue: 14, blurb: 'Single-pan weeknight cooking for people who hate cooking. Wildly practical.',
      followers: 47000, monthlyViews: 380000, growth: 20,
      auth: 89, retention: { label: 'High', idx: 83 }, engQ: { score: 85, grade: 'A' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 15,
      traj: [24, 28, 32, 36, 40, 43, 47],
      platforms: [['instagram', '@priya.eats', '47K'], ['youtube', '@priyaeats', '21K'], ['tiktok', '@priyaeats', '88K']],
      milestone: { metric: 'Combined following', target: 150000, current: 47000, deadline: '12 months', mult: 1.65 },
      raised: 30500, goal: 50000,
      ai: {
        intro: "Priya is a <b>broad-appeal utility</b> creator — recipes are evergreen, searchable, and saved. That makes her trajectory unusually predictable.",
        catalysts: "Save rates on her reels are exceptional — food utility content compounds through search and re-shares for years. A cookbook or app would convert her save-heavy audience well. Cross-platform presence is healthy and consistent.",
        risks: "Food is a crowded category; differentiation is execution, not concept. Monetization (15%) is mid. Growth is steady rather than explosive — a base hit, not a home run.",
        retention: "83 retention index, driven by saves and returns at mealtime. Weekly active rate of 41%. Her audience treats the account like a reference, which is stickier than entertainment viewing."
      }
    },
    {
      id: 'theo', name: 'Theo Brandt', handle: '@theoplays', category: 'Gaming', cat: 'gaming',
      hue: 256, blurb: 'High-energy roguelike streamer. Big numbers — but the signals are mixed.',
      followers: 210000, monthlyViews: 1400000, growth: 44,
      auth: 71, retention: { label: 'Medium', idx: 61 }, engQ: { score: 68, grade: 'B' },
      velocity: { label: 'Elevated', status: 'warn' }, monetization: 9,
      traj: [120, 132, 141, 150, 162, 184, 210],
      platforms: [['twitch', 'theoplays', '210K'], ['youtube', '@theoplays', '96K'], ['tiktok', '@theoclips', '140K']],
      milestone: { metric: 'Twitch followers', target: 500000, current: 210000, deadline: '9 months', mult: 1.5 },
      raised: 11500, goal: 50000, flagged: 'warn',
      ai: {
        intro: "Theo looks huge — 210K, +44% MoM — but Backer rates audience <b>quality at 71</b>. The velocity flag is <b>Elevated</b>, and you should know why before backing.",
        catalysts: "Real upside exists: raw viewership is large and the clips engine on TikTok genuinely works. If the inorganic share is a one-off (a raid or a bought boost that won't repeat), the underlying channel is still growing double digits.",
        risks: "<b>Two concerns.</b> (1) A follower spike of +22K in 36 hours doesn't match his organic baseline — possible purchased boost or bot raid. (2) Retention is only 61 and monetization 9% — a lot of reach isn't converting to loyalty. Treat the +44% as <b>~+28% organic</b> after adjustment.",
        retention: "61 retention index — the audience is broad but shallow. Returning-viewer rate dipped as raw follows spiked, which is the classic fingerprint of low-quality growth diluting a real core."
      }
    },
    {
      id: 'jordan', name: 'Jordan Cole', handle: '@jordancole.official', category: 'Lifestyle', cat: 'lifestyle',
      hue: 0, blurb: 'Aspirational lifestyle content. Backer flags this profile — here is the evidence.',
      followers: 180000, monthlyViews: 90000, growth: 88,
      auth: 38, retention: { label: 'Low', idx: 22 }, engQ: { score: 41, grade: 'D' },
      velocity: { label: 'Anomaly', status: 'neg' }, monetization: 4,
      traj: [40, 44, 49, 53, 60, 120, 180],
      platforms: [['instagram', '@jordancole.official', '180K'], ['tiktok', '@jordancole', '60K']],
      milestone: { metric: 'Instagram followers', target: 400000, current: 180000, deadline: '9 months', mult: 1.5 },
      raised: 4200, goal: 50000, flagged: 'neg',
      ai: {
        intro: "Backer recommends <b>caution</b>. Jordan shows 180K followers but an authenticity score of <b>38%</b> — the majority of this audience does not behave like real humans.",
        catalysts: "Honestly, few. If you back this, you're betting the real ~38% core can be grown organically from here. That's possible but it's a turnaround story, not an early-belief story.",
        risks: "<b>This is the cautionary case the protocol exists for.</b> 180K followers but only 90K monthly views — engagement is inverted. A +88% MoM spike with no corresponding view growth is the textbook signature of <b>purchased followers</b>. Comment analysis shows 71% semantic redundancy (bot-like). Velocity flag: <b>Anomaly</b>.",
        retention: "22 retention index. Almost no one comes back. This is reach without an audience — exactly the kind of fabricated metric that makes raw follower counts uninvestable, and exactly what Backer is built to expose."
      }
    },
    {
      id: 'marcus', name: 'Marcus Stillwater', handle: '@marcus.films', category: 'Film & Video', cat: 'video',
      hue: 192, blurb: 'Cinematic short documentaries about overlooked places. Festival-grade craft.',
      followers: 850000, monthlyViews: 2100000, growth: 18,
      auth: 88, retention: { label: 'High', idx: 85 }, engQ: { score: 84, grade: 'A' },
      velocity: { label: 'Normal', status: 'ok' }, monetization: 16,
      traj: [560, 610, 660, 710, 760, 805, 850],
      platforms: [['youtube', '@marcus.films', '850K'], ['instagram', '@marcus.films', '210K'], ['x', '@marcusfilms', '44K']],
      milestone: { metric: 'YouTube subscribers', target: 1200000, current: 850000, deadline: '12 months', mult: 1.4 },
      raised: 46000, goal: 50000,
      ai: {
        intro: "Marcus is the <b>blue-chip</b> on Backer — 850K, clean signals, high craft. Lower multiple (1.4×) because the risk is lower and the round is nearly full (92%).",
        catalysts: "Brand and streaming interest in his format is rising. His completion rate on 15-minute films is category-leading, which YouTube rewards heavily. A platform deal or a single festival breakout re-rates him fast.",
        risks: "You're late, not early — most of the easy growth is behind him, and the multiple reflects that. Production is expensive and slow, so output cadence is low (a risk if the algorithm favors frequency).",
        retention: "85 retention index, extraordinary for long-form. Average view duration over 11 minutes. This is a real, patient audience — the safest profile here, priced accordingly."
      }
    }
  ];

  /* ---- seed portfolio (matches the legacy demo: $7,500 in → $8,950, +19.33%) ---- */
  const seedPortfolio = [
    { id: 'marcus', invested: 5000, value: 6300, when: 'Oct 2025' },
    { id: 'elena', invested: 2500, value: 2650, when: 'Jan 2026' }
  ];

  /* ---- strategic partners (settlement / on-ramp / attestation) ---- */
  const partners = [
    {
      name: 'MoonPay', role: 'Fiat on-ramp & off-ramp', badge: 'Card → crypto in seconds',
      svg: '<svg viewBox="0 0 210 44" role="img" aria-label="MoonPay"><path d="M21 5a16 16 0 1 0 9.5 28.9A12.5 12.5 0 1 1 21 5Z" fill="currentColor"/><circle cx="33" cy="14" r="3.4" fill="currentColor"/><text x="46" y="30.5" font-family="Inter,sans-serif" font-size="25" font-weight="700" letter-spacing="-0.6" fill="currentColor">moonpay</text></svg>'
    },
    {
      name: 'Sign', role: 'On-chain attestation & payouts', badge: 'Backed by Binance',
      svg: '<svg viewBox="0 0 150 44" role="img" aria-label="Sign"><rect x="5" y="9" width="27" height="27" rx="9" fill="currentColor"/><path d="M12.5 23l4.6 4.6L26 16.5" fill="none" stroke="#0b0b0d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><text x="44" y="31" font-family="Inter,sans-serif" font-size="25" font-weight="700" letter-spacing="-0.4" fill="currentColor">Sign</text></svg>'
    },
    {
      name: 'Infinipay', role: 'Programmable settlement rails', badge: 'Milestone escrow',
      svg: '<svg viewBox="0 0 220 44" role="img" aria-label="Infinipay"><path d="M24 22c0-5-3.6-8.5-8-8.5S8 17 8 22s3.6 8.5 8 8.5c4.4 0 6.5-3.5 8-8.5m0 0c1.5 5 3.6 8.5 8 8.5 4.4 0 8-3.5 8-8.5s-3.6-8.5-8-8.5c-4.4 0-6.5 3.5-8 8.5Z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><text x="52" y="31" font-family="Inter,sans-serif" font-size="25" font-weight="700" letter-spacing="-0.6" fill="currentColor">Infinipay</text></svg>'
    }
  ];

  /* ---- the six algorithm outputs (for the marketing "Proof of Attention" grid) ---- */
  const scoreDefs = [
    { name: 'Authenticity Score', val: '91<span class="unit">%</span>', meter: 91, pos: true,
      ic: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
      desc: 'Estimated share of followers and viewers that are real human accounts — not bots, pods, or purchased reach.' },
    { name: 'Retention Index', val: '88', meter: 88, pos: true,
      ic: '<path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/><path d="M12 7v5l3 3"/>',
      desc: 'How consistently an audience returns — cohort loyalty over time. Reach is vanity; retention is the signal.' },
    { name: 'Engagement Quality', val: 'A', meter: 86,
      ic: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      desc: 'Weighted signal separating passive views from active community behavior — comments, saves, shares, replies.' },
    { name: 'Velocity Anomaly Flag', val: 'Clear', meter: 18,
      ic: '<path d="M13 2L3 14h7l-1 8 10-12h-7z"/>',
      desc: 'Real-time alerts on unnatural spikes — 2,000 likes in 90 minutes on an account that normally gets 40.' },
    { name: 'Monetization Propensity', val: '18<span class="unit">%</span>', meter: 64,
      ic: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      desc: 'From public signals, the estimated share of an audience likely to convert into paying supporters.' },
    { name: 'Growth Trajectory', val: '+33<span class="unit">%</span>', meter: 80, pos: true,
      ic: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
      desc: 'Current arc versus comparable creators at the same stage — adjusted for any inorganic velocity.' }
  ];

  /* ---- helpers ---- */
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1) + 'K';
    return String(n);
  }
  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function byId(id) { return creators.find(c => c.id === id); }
  function fundPct(c) { return Math.min(100, Math.round((c.raised / c.goal) * 100)); }

  return { creators, seedPortfolio, partners, scoreDefs, PLAT_IC, fmt, money, byId, fundPct };
})();
