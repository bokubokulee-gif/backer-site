/* =========================================================
   BACKER — Creator Attention Marketplace data layer
   Implements the Master PRD concepts on top of js/data.js:
   - Attention Pulse (§12.4 formula: base percentiles +
     bounded PoA adjustments − penalties), per time window
   - Separate objects: Raw Reach / Observed Attention /
     Pulse / PoA / Evidence Confidence / market state
   - Versioned taxonomy, freshness states, rank movement
   - Deterministic fixture generator (isFixture=true) so the
     board reads like a market terminal. Demo only — the PRD
     forbids fixtures in production.
   ========================================================= */
window.BACKER_MKT = (function () {
  'use strict';
  const B = window.BACKER;

  const VERSIONS = { pulse: 'pulse_1.0.0', poa: 'poa_2.0.0', taxonomy: 'taxonomy_1.0.0', ranking: 'ranking_1.0.0' };
  const WINDOWS = ['24h', '7d', '30d', '90d'];
  const DEFAULT_WINDOW = '7d';

  /* ---------------- deterministic PRNG ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(key) { return mulberry32(hash(key)); }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------------- taxonomy (PRD §11.2 subset) ---------------- */
  const TAXONOMY = [
    { id: 'knowledge', name: 'Knowledge', subs: ['artificial-intelligence', 'technology', 'science', 'mathematics', 'economics', 'history'] },
    { id: 'gaming', name: 'Gaming', subs: ['streaming', 'esports', 'game-analysis', 'speedrunning', 'variety-gaming'] },
    { id: 'music', name: 'Music', subs: ['artists', 'producers', 'vocalists', 'music-education'] },
    { id: 'business', name: 'Business', subs: ['startups', 'entrepreneurship', 'marketing', 'small-business'] },
    { id: 'art-design', name: 'Art & design', subs: ['illustration', 'digital-art', 'photography', 'graphic-design'] },
    { id: 'books-writing', name: 'Books & writing', subs: ['essays', 'newsletters', 'authors', 'poetry'] },
    { id: 'food', name: 'Food', subs: ['recipes', 'cooking-technique', 'baking', 'food-science'] },
    { id: 'lifestyle', name: 'Lifestyle', subs: ['daily-life', 'travel', 'productivity', 'wellness'] },
    { id: 'film-video', name: 'Film & video', subs: ['documentary', 'video-essays', 'filmmaking', 'animation'] },
    { id: 'fitness', name: 'Fitness', subs: ['strength', 'running', 'yoga', 'nutrition'] },
    { id: 'beauty', name: 'Beauty', subs: ['makeup', 'skincare', 'hair', 'beauty-commentary'] },
    { id: 'comedy', name: 'Comedy', subs: ['sketch', 'satire', 'stand-up', 'commentary-comedy'] },
    { id: 'fashion', name: 'Fashion', subs: ['styling', 'streetwear', 'sustainable-fashion'] },
    { id: 'sports', name: 'Sports', subs: ['analysis', 'coaching', 'athlete', 'action-sports'] }
  ];
  const catById = id => TAXONOMY.find(t => t.id === id);
  const subName = s => s.split('-').map((w, i) => i === 0 ? w[0].toUpperCase() + w.slice(1) : w).join(' ').replace('Artificial intelligence', 'Artificial intelligence');

  /* the five-platform product contract (PRD §1) + provider status for the demo snapshot */
  const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', unit: 'views', reachWord: 'subscribers', status: 'operational', statusLabel: 'Operational' },
    { id: 'tiktok', name: 'TikTok', unit: 'views', reachWord: 'followers', status: 'limited', statusLabel: 'Coverage limited' },
    { id: 'instagram', name: 'Instagram', unit: 'interactions', reachWord: 'followers', status: 'delayed', statusLabel: 'Provider delayed' },
    { id: 'x', name: 'X', unit: 'impressions', reachWord: 'followers', status: 'operational', statusLabel: 'Operational' },
    { id: 'twitch', name: 'Twitch', unit: 'viewer-min', reachWord: 'followers', status: 'live', statusLabel: 'Live tracking' }
  ];
  const OFF_CONTRACT_UNITS = { spotify: 'streams', substack: 'reads', github: 'stars', soundcloud: 'plays' };
  const platById = id => PLATFORMS.find(p => p.id === id);

  const TIERS = [
    { id: 'under-10k', label: 'Under 10K', lo: 0, hi: 1e4 },
    { id: '10k-50k', label: '10K–50K', lo: 1e4, hi: 5e4 },
    { id: '50k-100k', label: '50K–100K', lo: 5e4, hi: 1e5 },
    { id: '100k-500k', label: '100K–500K', lo: 1e5, hi: 5e5 },
    { id: '500k-1m', label: '500K–1M', lo: 5e5, hi: 1e6 },
    { id: '1m-plus', label: '1M+', lo: 1e6, hi: 5e7 }
  ];
  function tierOf(reach) { return TIERS.find(t => reach >= t.lo && reach < t.hi) || TIERS[TIERS.length - 1]; }

  const STATES = {
    OPEN: { label: 'Open', cta: 'Position', cls: 'open' },
    OPENING_SOON: { label: 'Opening soon', cta: 'Watch opening', cls: 'soon' },
    WATCH_ONLY: { label: 'Watch-only', cta: 'Watch', cls: 'watch' },
    APPLICATION_PENDING: { label: 'Application pending', cta: 'Watch review', cls: 'watch' },
    UNDER_REVIEW: { label: 'Under review', cta: 'Watch review', cls: 'review' },
    NO_CONTRACT: { label: 'No contract', cta: 'Watch', cls: 'watch' },
    CLOSED: { label: 'Closed', cta: 'View contract', cls: 'closed' },
    RESOLVED: { label: 'Resolved', cta: 'View result', cls: 'closed' }
  };

  const EV_GRADES = { High: { w: 1, pen: 0 }, Medium: { w: .75, pen: 3 }, Low: { w: .35, pen: 8 }, Insufficient: { w: 0, pen: 15 } };
  function evGrade(score) { return score >= 80 ? 'High' : score >= 60 ? 'Medium' : score >= 35 ? 'Low' : 'Insufficient'; }
  function riskLevel(score) { return score >= 75 ? 'severe' : score >= 50 ? 'elevated' : score >= 30 ? 'medium' : score >= 15 ? 'low' : 'none'; }

  /* =========================================================
     Attention Pulse — PRD §12.4, computed for real
     ========================================================= */
  function computePulse(m, wobble) {
    // component percentiles 0–100 (already cohort-normalized in the fixture data)
    const comp = {
      volume: clamp(m.comp.volume + wobble.v, 0, 100),
      engagement: clamp(m.comp.engagement + wobble.e, 0, 100),
      momentum: clamp(m.comp.momentum + wobble.m, 0, 100),
      persistence: clamp(m.comp.persistence + wobble.p, 0, 100),
      freshness: clamp(m.comp.freshness + wobble.f, 0, 100)
    };
    const base = .30 * comp.volume + .20 * comp.engagement + .20 * comp.momentum + .20 * comp.persistence + .10 * comp.freshness;
    const evW = EV_GRADES[m.evidence.grade].w;
    const authAdj = clamp((m.poa.components.authenticity - 50) * .16, -8, 8) * evW;
    const durAdj = clamp((m.poa.components.durability - 50) * .08, -4, 4) * evW;
    const riskPen = clamp(m.poa.components.risk * .20, 0, 20) * Math.max(evW, m.poa.riskEvidenceW || 0);
    const evPen = EV_GRADES[m.evidence.grade].pen;
    const freshPen = m.freshPen || 0;   // provider data freshness (Aging 5 / Stale 15)
    const concPen = m.concPen || 0;     // one-hit concentration 0–12
    let pulse = clamp(base + authAdj + durAdj - riskPen - evPen - freshPen - concPen, 0, 100);
    const provisional = m.evidence.score < 35;
    if (provisional) pulse = Math.min(pulse, 70);
    return {
      value: Math.round(pulse * 10) / 10, base: Math.round(base * 10) / 10, comp,
      adj: Math.round((authAdj + durAdj - riskPen - evPen - freshPen - concPen) * 10) / 10,
      detail: { authAdj, durAdj, riskPen, evPen, freshPen, concPen }, provisional
    };
  }

  /* window scaling for observed attention volumes (base = 30 days) */
  const WIN_SCALE = { '24h': 1 / 26, '7d': 1 / 4.1, '30d': 1, '90d': 2.72 };
  const WIN_LABEL = { '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days' };

  /* =========================================================
     Hand-authored market layers for the original ten creators
     (tuned so the PRD narrative shows: quality beats raw size,
     risk stays visible, contracts are separate from listing)
     ========================================================= */
  const HAND = {
    kai: {
      cat: 'knowledge', sub: 'artificial-intelligence', secondary: ['books-writing'], state: 'OPEN', identity: .97, isNew: false,
      comp: { volume: 58, engagement: 96, momentum: 88, persistence: 92, freshness: 95 },
      evidence: 84, poa: { auth: 93, dur: 91, engq: 91, mon: 55, risk: 8 },
      positive: 'Six-month cohorts still return at 61% — 3× the category median.',
      riskNote: 'Single-author cadence dependency.'
    },
    elena: {
      cat: 'knowledge', sub: 'technology', secondary: ['business'], state: 'OPEN', identity: .96, isNew: false,
      comp: { volume: 84, engagement: 90, momentum: 91, persistence: 88, freshness: 92 },
      evidence: 88, poa: { auth: 91, dur: 88, engq: 86, mon: 62, risk: 10 },
      positive: 'Momentum and retention rising together across 9 uploads.',
      riskNote: 'No material flag.'
    },
    luna: {
      cat: 'music', sub: 'artists', secondary: [], state: 'OPEN', identity: .93, isNew: false,
      comp: { volume: 76, engagement: 82, momentum: 86, persistence: 74, freshness: 88 },
      evidence: 71, poa: { auth: 86, dur: 80, engq: 79, mon: 44, risk: 14 },
      positive: 'Save-to-stream ratio in the top 8% of her size cohort.',
      riskNote: 'Hit-driven category; persistence below peers.'
    },
    devon: {
      cat: 'business', sub: 'startups', secondary: ['knowledge'], state: 'OPEN', identity: .95, isNew: false,
      comp: { volume: 47, engagement: 89, momentum: 78, persistence: 85, freshness: 93 },
      evidence: 79, poa: { auth: 90, dur: 79, engq: 81, mon: 78, risk: 11 },
      positive: 'Highest-intent audience on the board — 52% ship-log open-through.',
      riskNote: 'Revenue lumpy and launch-dependent.'
    },
    mira: {
      cat: 'art-design', sub: 'illustration', secondary: [], state: 'OPENING_SOON', identity: .91, isNew: false,
      comp: { volume: 66, engagement: 85, momentum: 80, persistence: 90, freshness: 96 },
      evidence: 73, poa: { auth: 84, dur: 80, engq: 83, mon: 38, risk: 13 },
      positive: 'Saves-per-post 2.1× the illustration cohort median.',
      riskNote: 'Slice of TikTok reach is low-intent pass-through.'
    },
    sam: {
      cat: 'books-writing', sub: 'newsletters', secondary: ['knowledge'], state: 'OPEN', identity: .94, isNew: false,
      comp: { volume: 41, engagement: 97, momentum: 64, persistence: 95, freshness: 84 },
      evidence: 86, poa: { auth: 92, dur: 90, engq: 88, mon: 84, risk: 6 },
      positive: 'Paid churn under 3%/month; open rates above 60%.',
      riskNote: 'Slow raw growth; single-author output.'
    },
    priya: {
      cat: 'food', sub: 'recipes', secondary: ['lifestyle'], state: 'OPEN', identity: .95, isNew: false,
      comp: { volume: 74, engagement: 84, momentum: 72, persistence: 91, freshness: 90 },
      evidence: 81, poa: { auth: 89, dur: 83, engq: 85, mon: 48, risk: 9 },
      positive: 'Reference-style saves compound through search for years.',
      riskNote: 'Crowded category; steady rather than explosive.'
    },
    theo: {
      cat: 'gaming', sub: 'streaming', secondary: [], state: 'UNDER_REVIEW', identity: .92, isNew: false,
      comp: { volume: 93, engagement: 58, momentum: 90, persistence: 62, freshness: 97 },
      evidence: 66, poa: { auth: 71, dur: 61, engq: 68, mon: 28, risk: 55 }, riskEvidenceW: .8, concPen: 6,
      positive: 'Raw viewership large; clips engine genuinely works.',
      riskNote: 'Follower spike outside organic baseline; viral spike dependence.'
    },
    jordan: {
      cat: 'lifestyle', sub: 'daily-life', secondary: [], state: 'WATCH_ONLY', identity: .88, isNew: false,
      comp: { volume: 62, engagement: 18, momentum: 84, persistence: 25, freshness: 70 },
      evidence: 44, poa: { auth: 38, dur: 22, engq: 41, mon: 10, risk: 82 }, riskEvidenceW: .9,
      positive: 'A real ~38% audience core exists under the noise.',
      riskNote: 'Subscriber-view mismatch · suspicious comment cluster.'
    },
    marcus: {
      cat: 'film-video', sub: 'documentary', secondary: [], state: 'OPEN', identity: .98, isNew: false,
      comp: { volume: 90, engagement: 88, momentum: 58, persistence: 89, freshness: 72 },
      evidence: 90, poa: { auth: 88, dur: 85, engq: 84, mon: 52, risk: 7 },
      positive: 'Average view duration over 11 minutes on long-form.',
      riskNote: 'Low output cadence; production-heavy format.'
    }
  };

  /* =========================================================
     Fixture generator — deterministic, isFixture=true
     ========================================================= */
  const FIRST = ['Ava', 'Noah', 'Yuki', 'Mateo', 'Ines', 'Tariq', 'Sofia', 'Felix', 'Nadia', 'Omar', 'Freya', 'Dante', 'Leila', 'Hugo', 'Wren', 'Anders', 'Chloe', 'Ravi', 'Marta', 'Kenji', 'Zara', 'Tomas', 'Aisha', 'Nils', 'Paloma', 'Ezra', 'Ida', 'Marco', 'Suki', 'Jonas', 'Amara', 'Theo', 'Vera', 'Lucas', 'Nina', 'Elias', 'Rosa', 'Kwame', 'Hana', 'Piotr', 'Lena', 'Diego', 'Maren', 'Arjun', 'Silje', 'Bruno', 'Eve', 'Casper', 'Iris', 'Milan'];
  const LAST = ['Okafor', 'Lindqvist', 'Tanaka', 'Alvarez', 'Moreau', 'Haddad', 'Costa', 'Bauer', 'Petrov', 'Ferreira', 'Nakano', 'Silva', 'Novak', 'Ito', 'Dubois', 'Kaya', 'Berg', 'Rossi', 'Mensah', 'Kim', 'Varga', 'Sato', 'Iversen', 'Marino', 'Cruz', 'Weiss', 'Nakamura', 'Ortiz', 'Vang', 'Fontaine', 'Adeyemi', 'Klein', 'Sorensen', 'Duarte', 'Egede', 'Halvorsen', 'Reyes', 'Larsen', 'Bianchi', 'Osei'];
  const CAT_PLATS = {
    knowledge: ['youtube', 'x', 'tiktok'], gaming: ['twitch', 'youtube', 'tiktok'], music: ['youtube', 'tiktok', 'instagram'],
    business: ['x', 'youtube', 'instagram'], 'art-design': ['instagram', 'tiktok', 'youtube'], 'books-writing': ['x', 'instagram', 'youtube'],
    food: ['instagram', 'tiktok', 'youtube'], lifestyle: ['instagram', 'tiktok', 'youtube'], 'film-video': ['youtube', 'instagram', 'x'],
    fitness: ['instagram', 'youtube', 'tiktok'], beauty: ['instagram', 'tiktok', 'youtube'], comedy: ['tiktok', 'instagram', 'youtube'],
    fashion: ['instagram', 'tiktok', 'x'], sports: ['youtube', 'x', 'tiktok']
  };
  const BLURBS = {
    knowledge: 'Turns dense technical topics into scannable explainers.', gaming: 'Consistent streams with a chat that actually talks back.',
    music: 'Independent releases compounding through short-form discovery.', business: 'Builds in public and documents the numbers.',
    'art-design': 'A recognizable visual style, posted on a steady cadence.', 'books-writing': 'Long-form writing with a small, devout readership.',
    food: 'Practical cooking that gets saved, not just watched.', lifestyle: 'Everyday content with an unusually loyal core.',
    'film-video': 'Slow, high-craft video with festival-grade retention.', fitness: 'Programs and progress logs with repeat viewership.',
    beauty: 'Reviews and technique with a high-trust comment section.', comedy: 'Original characters with quotable, re-shared bits.',
    fashion: 'Styling with strong save rates and returning viewers.', sports: 'Analysis that the fan community argues with weekly.'
  };
  const POSITIVES = [
    'Broad commenter distribution across recent uploads.', 'Repeat engagement from the same accounts week over week.',
    'Diverse traffic across content rather than one hit.', 'Steady posting cadence with rising per-post engagement.',
    'Cross-platform momentum aligned in the same window.', 'Engagement depth above the size-cohort median.'
  ];
  const RISK_NOTES = {
    none: 'No material flag.', low: 'Minor gaps in evidence coverage.', medium: 'Shorts-heavy reach; durability uplift limited.',
    elevated: 'Viral spike dependence in the current window.', severe: 'Subscriber-view mismatch · suspicious comment cluster.'
  };

  function genCreators(count) {
    const out = [];
    const stateBag = [];
    // weighted market states for generated fixtures (contracts are the minority — PRD conflict #11)
    const push = (s, n) => { for (let i = 0; i < n; i++) stateBag.push(s); };
    push('WATCH_ONLY', 46); push('NO_CONTRACT', 38); push('OPEN', 16); push('OPENING_SOON', 7);
    push('UNDER_REVIEW', 6); push('APPLICATION_PENDING', 5); push('CLOSED', 4); push('RESOLVED', 3);

    for (let i = 0; i < count; i++) {
      const r = rng('creator' + i);
      const first = FIRST[Math.floor(r() * FIRST.length)], last = LAST[Math.floor(r() * LAST.length)];
      const name = first + ' ' + last;
      const id = 'fx-' + i;
      const cat = TAXONOMY[Math.floor(r() * TAXONOMY.length)];
      const sub = cat.subs[Math.floor(r() * cat.subs.length)];
      // size skews small — the wedge is pre-priced attention
      const tierPick = r();
      const tier = TIERS[tierPick < .30 ? 0 : tierPick < .55 ? 1 : tierPick < .72 ? 2 : tierPick < .88 ? 3 : tierPick < .96 ? 4 : 5];
      const reach = Math.round(tier.lo + (tier.hi - tier.lo) * (0.08 + r() * 0.84));
      const growth = Math.round(4 + r() * 34);
      const handle = '@' + (first + '.' + last).toLowerCase().replace(/[^a-z.]/g, '');
      const hue = Math.floor(r() * 360);

      const nPlat = r() < .38 ? 1 : r() < .8 ? 2 : 3;
      const plats = CAT_PLATS[cat.id].slice(0, nPlat);
      const platforms = plats.map((p, pi) => {
        const share = pi === 0 ? 1 : (0.15 + r() * 0.6);
        return [p, handle.replace('.', pi ? '_' : '.'), B.fmt(Math.round(reach * share))];
      });

      const evScore = Math.round(30 + r() * 62);
      const grade = evGrade(evScore);
      const riskRoll = r();
      const riskScore = riskRoll < .55 ? Math.round(4 + r() * 12) : riskRoll < .82 ? Math.round(16 + r() * 14) : riskRoll < .94 ? Math.round(32 + r() * 16) : riskRoll < .985 ? Math.round(52 + r() * 18) : Math.round(76 + r() * 14);
      const auth = clamp(Math.round(92 - riskScore * .6 - r() * 10), 25, 96);
      const state = stateBag[Math.floor(r() * stateBag.length)];
      const monthlyViews = Math.round(reach * (1.5 + r() * 7));

      const comp = {
        volume: clamp(Math.round(18 + 62 * (Math.log10(monthlyViews + 10) - 3.5) / 3.5 + r() * 18), 4, 99),
        engagement: clamp(Math.round(auth * .7 + r() * 32), 8, 99),
        momentum: clamp(Math.round(growth * 2.2 + r() * 22), 5, 99),
        persistence: clamp(Math.round(30 + r() * 62), 5, 99),
        freshness: clamp(Math.round(45 + r() * 52), 10, 100)
      };
      const retention = clamp(Math.round(auth * .8 + r() * 20), 15, 96);
      const engQscore = clamp(Math.round(comp.engagement * .9 + r() * 10), 20, 97);
      const monet = Math.round(4 + r() * 26);
      const lvl = riskLevel(riskScore);

      const c = {
        id, name, handle, isFixture: true,
        category: cat.name + ' / ' + subName(sub), cat: cat.id, hue,
        blurb: BLURBS[cat.id],
        followers: reach, monthlyViews, growth,
        auth, retention: { label: retention >= 75 ? 'High' : retention >= 45 ? 'Medium' : 'Low', idx: retention },
        engQ: { score: engQscore, grade: engQscore >= 85 ? 'A' : engQscore >= 70 ? 'B+' : engQscore >= 55 ? 'B' : 'C' },
        velocity: lvl === 'severe' ? { label: 'Anomaly', status: 'neg' } : lvl === 'elevated' ? { label: 'Elevated', status: 'warn' } : { label: 'Normal', status: 'ok' },
        monetization: monet,
        traj: Array.from({ length: 7 }, (_, k) => Math.round(reach / 1000 * (1 - growth / 100 * (6 - k) / 6) * 10) / 10),
        platforms,
        raised: 0, goal: 50000,
        ai: {
          intro: `${first} is a ${cat.name.toLowerCase()} creator at ${B.fmt(reach)} reach. PoA underwrites the observed attention at <b>${auth}</b> with ${grade.toLowerCase()} evidence confidence — read the evidence panel before forming a view.`,
          catalysts: `Momentum percentile ${comp.momentum} inside the ${cat.name} × ${tier.label} cohort. ${POSITIVES[Math.floor(r() * POSITIVES.length)]}`,
          risks: RISK_NOTES[lvl] + (lvl === 'none' ? ' Evidence coverage is the main watch item.' : ' Size the position accordingly.'),
          retention: `Retention index ${retention}. ${retention >= 70 ? 'The audience returns — this is durable attention, not pass-through reach.' : 'Returning-viewer behavior is thin; most reach is single-visit.'}`
        }
      };
      if (state === 'OPEN' || state === 'OPENING_SOON' || state === 'CLOSED' || state === 'RESOLVED') {
        const mult = Math.round((1.4 + r() * .8) * 20) / 20;
        const target = Math.round(reach * (1.8 + r() * 1.4) / 100) * 100;
        const p0 = platById(plats[0]);
        c.milestone = { metric: p0.name + ' ' + p0.reachWord, target, current: reach, deadline: [6, 9, 12][Math.floor(r() * 3)] + ' months', mult };
        c.raised = Math.round((state === 'OPEN' ? .2 + r() * .7 : state === 'OPENING_SOON' ? 0 : .9 + r() * .1) * 50000);
      }
      c.mkt = buildMkt(c, {
        cat: cat.id, sub, secondary: [], state, identity: Math.round((0.82 + r() * 0.17) * 100) / 100,
        isNew: r() < .05, comp, evidence: evScore,
        poa: { auth, dur: retention, engq: engQscore, mon: clamp(monet * 2.6, 5, 95), risk: riskScore },
        riskEvidenceW: lvl === 'severe' || lvl === 'elevated' ? .85 : 0,
        concPen: lvl === 'elevated' ? Math.round(r() * 8) : 0,
        positive: POSITIVES[Math.floor(r() * POSITIVES.length)],
        riskNote: RISK_NOTES[lvl]
      });
      out.push(c);
    }
    return out;
  }

  /* =========================================================
     Market layer builder — shared by hand + generated creators
     ========================================================= */
  function freshnessFor(platId, seedKey) {
    const p = platById(platId);
    if (p && p.status === 'delayed') return { state: 'PROVIDER_DELAYED', label: 'Provider delayed', ago: 'last-good 26h ago' };
    const r = rng('fresh' + seedKey);
    if (p && p.status === 'limited' && r() < .4) return { state: 'AGING', label: 'Aging', ago: Math.round(28 + r() * 30) + 'h ago' };
    if (p && p.status === 'live' && r() < .5) return { state: 'LIVE', label: 'Live', ago: 'now' };
    return { state: 'RECENT', label: 'Updated', ago: r() < .5 ? Math.round(1 + r() * 9) + 'h ago' : Math.round(10 + r() * 46) + 'm ago' };
  }

  function buildMkt(c, h) {
    const evScore = h.evidence, grade = evGrade(evScore);
    const lvl = riskLevel(h.poa.risk);
    const poaScore = Math.round(.42 * h.poa.auth + .25 * h.poa.dur + .18 * h.poa.engq + .15 * (100 - h.poa.risk));
    const band = grade === 'Insufficient' ? 'insufficient' : lvl === 'severe' ? 'risk' : poaScore >= 72 && lvl !== 'elevated' ? 'strong' : 'mixed';
    const range = [clamp(Math.round((h.poa.auth - 8) / 5) * 5, 5, 95), clamp(Math.round((h.poa.auth + 7) / 5) * 5, 10, 99)];
    const parsePct = s => { const n = parseFloat(String(s).replace(/[KM]/, '')); return String(s).includes('M') ? n * 1e6 : String(s).includes('K') ? n * 1e3 : n; };

    const profiles = c.platforms.map((p, i) => {
      const fresh = freshnessFor(p[0], c.id + p[0]);
      return {
        plat: p[0], handle: p[1], reachLabel: p[2], reach: parsePct(p[2]),
        unit: (platById(p[0]) || {}).unit || OFF_CONTRACT_UNITS[p[0]] || 'views',
        primary: i === 0, fresh,
        engRate: Math.round((1.2 + rng('eng' + c.id + p[0])() * 6.5) * 10) / 10
      };
    });

    // per-window snapshots — pulse recomputed with the real formula, delta vs prior comparable snapshot
    const windows = {};
    WINDOWS.forEach(w => {
      const wr = rng(c.id + w);
      const wobble = { v: (wr() - .5) * 10, e: (wr() - .5) * 8, m: (wr() - .5) * (w === '24h' ? 22 : w === '90d' ? 6 : 12), p: (wr() - .5) * 8, f: (wr() - .5) * 6 };
      const m = {
        comp: h.comp, evidence: { grade, score: evScore },
        poa: { components: { authenticity: h.poa.auth, durability: h.poa.dur, risk: h.poa.risk } },
        riskEvidenceW: h.riskEvidenceW || 0, concPen: h.concPen || 0,
        freshPen: profiles[0].fresh.state === 'PROVIDER_DELAYED' ? 5 : profiles[0].fresh.state === 'AGING' ? 5 : 0
      };
      const now = computePulse(m, wobble);
      const prevWobble = { v: wobble.v + (wr() - .5) * 9, e: wobble.e + (wr() - .5) * 7, m: wobble.m + (wr() - .5) * 14, p: wobble.p + (wr() - .5) * 6, f: wobble.f + (wr() - .5) * 5 };
      const prev = computePulse(m, prevWobble);
      const vol = Math.round(c.monthlyViews * WIN_SCALE[w] * (0.82 + wr() * 0.4));
      windows[w] = { pulse: now, prevPulse: prev.value, delta: Math.round((now.value - prev.value) * 10) / 10, volume: vol };
    });

    return {
      cat: h.cat, sub: h.sub, secondary: h.secondary || [], state: h.state,
      tier: tierOf(c.followers), identity: h.identity, isNew: !!h.isNew,
      unified: h.identity >= .90 && profiles.length >= 2,
      evidence: { grade, score: evScore },
      poa: {
        score: poaScore, band, range,
        components: { authenticity: h.poa.auth, durability: h.poa.dur, engagementQuality: h.poa.engq, monetization: h.poa.mon, risk: h.poa.risk },
        coverage: clamp(evScore + Math.round((rng('cov' + c.id)() - .3) * 14), 20, 98),
        positive: h.positive, riskNote: h.riskNote, riskEvidenceW: h.riskEvidenceW || 0
      },
      risk: { level: riskLevel(h.poa.risk), label: h.riskNote && riskLevel(h.poa.risk) !== 'none' ? h.riskNote.split('·')[0].split(';')[0].trim() : 'No material flag' },
      profiles, windows, concPen: h.concPen || 0
    };
  }

  /* ---------------- assemble the index ---------------- */
  B.creators.forEach(c => {
    const h = HAND[c.id];
    if (h) { c.isFixture = true; c.mkt = buildMkt(c, h); }
  });
  const generated = genCreators(130);
  generated.forEach(c => B.creators.push(c));
  const ALL = B.creators.filter(c => c.mkt);

  /* ---------------- ranking (PRD §13.2) ---------------- */
  function rankKey(c, w, usePrev) {
    const win = c.mkt.windows[w];
    return [usePrev ? win.prevPulse : win.pulse.value, c.mkt.evidence.score, win.pulse.comp.volume];
  }
  function sortBoard(list, w, usePrev) {
    return list.slice().sort((a, b) => {
      const ka = rankKey(a, w, usePrev), kb = rankKey(b, w, usePrev);
      for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
      return a.id < b.id ? -1 : 1;
    });
  }
  const rankCache = {};
  function ranks(w) {
    if (rankCache[w]) return rankCache[w];
    const cur = sortBoard(ALL, w, false), prev = sortBoard(ALL, w, true);
    const prevIdx = {}; prev.forEach((c, i) => prevIdx[c.id] = i + 1);
    const map = {};
    cur.forEach((c, i) => {
      const rank = i + 1, was = prevIdx[c.id];
      map[c.id] = { rank, move: c.mkt.isNew ? null : was - rank, isNew: c.mkt.isNew };
    });
    rankCache[w] = { order: cur, map };
    return rankCache[w];
  }

  /* ---------------- module qualification ---------------- */
  function risingList(w) {
    return ALL.filter(c => {
      const m = c.mkt, win = m.windows[w];
      return c.followers < 1e5 && win.pulse.comp.momentum >= 72 && m.poa.score >= 65 && m.evidence.score >= 60 && m.poa.components.risk < 50 && m.risk.level !== 'severe';
    }).sort((a, b) => scoreRising(b, w) - scoreRising(a, w));
  }
  function scoreRising(c, w) {
    const m = c.mkt, win = m.windows[w];
    const evW = EV_GRADES[m.evidence.grade].w;
    return .45 * win.pulse.comp.momentum + .25 * win.pulse.value + .15 * m.poa.score * evW + .10 * win.pulse.comp.persistence + .05 * (100 - m.poa.components.monetization);
  }
  function highConfidenceList(w) {
    return ALL.filter(c => {
      const m = c.mkt;
      return m.poa.score >= 75 && m.evidence.score >= 80 && m.risk.level !== 'severe' && m.poa.components.risk < 40;
    }).sort((a, b) => hcScore(b, w) - hcScore(a, w));
  }
  function hcScore(c, w) { const m = c.mkt; return .5 * m.evidence.score + .3 * m.poa.score + .2 * m.windows[w].pulse.value; }

  /* ---------------- market status strip (computed from the index) ---------------- */
  function statusStrip() {
    const profiles = ALL.reduce((n, c) => n + c.mkt.profiles.length, 0);
    const updated = ALL.filter(c => c.mkt.profiles.some(p => p.fresh.state === 'RECENT' || p.fresh.state === 'LIVE')).length;
    const open = ALL.filter(c => c.mkt.state === 'OPEN').length;
    const cats = new Set(ALL.map(c => c.mkt.cat)).size;
    const hc = Math.round(ALL.filter(c => c.mkt.evidence.grade === 'High').length / ALL.length * 100);
    const operational = PLATFORMS.filter(p => p.status !== 'delayed').length;
    return [
      { v: ALL.length.toLocaleString(), l: 'creators indexed', tip: 'Creator entities in the demo fixture catalog (isFixture=true).' },
      { v: profiles.toLocaleString(), l: 'platform profiles', tip: 'Linked platform accounts across the index.' },
      { v: updated.toLocaleString(), l: 'updated last 24h', tip: 'Creators with at least one LIVE or RECENT platform snapshot.' },
      { v: String(open), l: 'open simulated contracts', tip: 'Valid open milestone contracts. Simulated — no real money moves.' },
      { v: operational + ' of 5', l: 'platforms operational', tip: 'Instagram is provider-delayed in this snapshot; last-good values served.' },
      { v: String(cats), l: 'active categories', tip: 'Top-level taxonomy categories with rank-eligible profiles (' + VERSIONS.taxonomy + ').' },
      { v: hc + '%', l: 'high evidence confidence', tip: 'Share of rank-eligible profiles graded High on Evidence Confidence.' }
    ];
  }

  /* =========================================================
     Contract layer — Exchange Homepage PRDs (2026-07-15).
     Milestone contracts as first-class fixture records with a
     FIXED demo snapshot (no generated "fresh" timestamps).
     Demo · simulated data — fixtures never enter production.
     ========================================================= */
  const DEMO_SNAP_LABEL = '15 Jul 2026 09:00 UTC';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const LASTD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function deadlineLabel(mOffset) { // month-end N months after the Jul 2026 snapshot
    const m = 6 + mOffset, y = 2026 + Math.floor(m / 12), mi = m % 12;
    return MON[mi] + ' ' + LASTD[mi] + ', ' + y;
  }
  function dateFromDays(d) {
    const t = new Date(Date.UTC(2026, 6, 15 + d));
    return MON[t.getUTCMonth()] + ' ' + t.getUTCDate() + ', ' + t.getUTCFullYear();
  }

  const CONTRACT_STATES = ['OPEN', 'OPENING_SOON', 'CLOSED', 'RESOLVED'];
  ALL.forEach(c => {
    if (!c.milestone || !CONTRACT_STATES.includes(c.mkt.state)) return;
    const r = rng('ct' + c.id);
    const st = c.mkt.state;
    const mOff = parseInt(c.milestone.deadline) || 9;
    const cur = c.milestone.current, tgt = c.milestone.target;
    const baseline = Math.round(cur * (0.55 + r() * 0.3));
    const progress = clamp(cur / tgt, 0, 1);
    const closeDays = st === 'OPEN' ? Math.round(8 + r() * 80) : 0;
    const simVol = st === 'OPENING_SOON' ? 0 : Math.max(400, c.raised);
    const backers = simVol ? Math.max(3, Math.round(simVol / (40 + r() * 140))) : 0;
    const spark = [];
    for (let i = 0; i <= 10; i++) {
      const wob = 1 + (rng('sp' + c.id + i)() - .5) * 0.06;
      spark.push(Math.max(0, Math.round((baseline + (cur - baseline) * Math.pow(i / 10, 0.9)) * wob)));
    }
    spark[10] = cur;
    const p0 = platById(c.mkt.profiles[0].plat);
    const fmtV = v => c.milestone.money ? B.money(v) : B.fmt(v);
    c.contract = {
      id: 'ct-' + c.id, version: 'v1.' + (1 + Math.floor(r() * 4)),
      title: 'Reach ' + fmtV(tgt) + ' ' + c.milestone.metric + ' by ' + deadlineLabel(mOff),
      deadlineLabel: deadlineLabel(mOff),
      closeDays, closingSoon: st === 'OPEN' && closeDays <= 21,
      closeLabel: st === 'OPEN' ? dateFromDays(closeDays) : null,
      opensInDays: st === 'OPENING_SOON' ? Math.round(2 + r() * 12) : null,
      listedDaysAgo: Math.round(1 + r() * 60),
      baseline, progress, progressPct: Math.round(progress * 100),
      curLabel: fmtV(cur), tgtLabel: fmtV(tgt), money: !!c.milestone.money,
      mult: c.milestone.mult,
      simVol, backers, watchers: Math.round(20 + r() * 400),
      volDelta: Math.round((r() - 0.35) * 60), posDelta: Math.round((r() - 0.3) * 50), watchDelta: Math.round((r() - 0.3) * 40),
      freshMin: Math.round(4 + r() * 110),
      source: (p0 ? p0.name : 'Platform') + ' public metrics — independent resolution source',
      outcome: st === 'RESOLVED' ? (r() < 0.6 ? 'HIT' : 'MISS') : null,
      spark
    };
    if (c.contract.listedDaysAgo <= 7 && st === 'OPEN') c.contract.isNew = true;
  });
  const CONTRACTS = ALL.filter(c => c.contract);
  const RADAR_STATES = ['WATCH_ONLY', 'NO_CONTRACT', 'APPLICATION_PENDING', 'UNDER_REVIEW', 'OPENING_SOON'];

  function pctIn(sortedAsc, v) {
    if (sortedAsc.length < 2) return 50;
    let n = 0; for (let i = 0; i < sortedAsc.length; i++) if (sortedAsc[i] <= v) n++;
    return (n - 1) / (sortedAsc.length - 1) * 100;
  }
  const asc = a => a.slice().sort((x, y) => x - y);

  /* Trending — PRD §15.3C: 0.40 sim-volume growth + 0.25 position starts
     + 0.20 Pulse delta + 0.15 watch adds (percentiles, open contracts only) */
  function trendingList(w) {
    const open = CONTRACTS.filter(c => c.mkt.state === 'OPEN');
    const vs = asc(open.map(c => c.contract.volDelta)), ps = asc(open.map(c => c.contract.posDelta));
    const ds = asc(open.map(c => c.mkt.windows[w].delta)), ws = asc(open.map(c => c.contract.watchDelta));
    return open.map(c => ({
      c, score: .40 * pctIn(vs, c.contract.volDelta) + .25 * pctIn(ps, c.contract.posDelta)
        + .20 * pctIn(ds, c.mkt.windows[w].delta) + .15 * pctIn(ws, c.contract.watchDelta)
    })).sort((a, b) => b.score - a.score || (a.c.id < b.c.id ? -1 : 1)).map(x => x.c);
  }

  /* Featured — PRD §14.3: 0.35 Pulse pct + 0.25 activity pct + 0.20 evidence
     + 0.10 freshness + 0.10 editorial, material-risk exclusion, Medium+ evidence */
  function featuredList(w) {
    const elig = CONTRACTS.filter(c => c.mkt.state === 'OPEN' && c.mkt.evidence.score >= 60
      && c.mkt.risk.level !== 'severe' && c.mkt.risk.level !== 'elevated');
    const pls = asc(elig.map(c => c.mkt.windows[w].pulse.value)), acts = asc(elig.map(c => c.contract.simVol));
    return elig.map(c => ({
      c, score: .35 * pctIn(pls, c.mkt.windows[w].pulse.value) + .25 * pctIn(acts, c.contract.simVol)
        + .20 * c.mkt.evidence.score + .10 * clamp(100 - c.contract.freshMin, 0, 100) + .10 * 50
    })).sort((a, b) => b.score - a.score || (a.c.id < b.c.id ? -1 : 1)).slice(0, 4).map(x => x.c);
  }

  function moversList(w) {
    return CONTRACTS.filter(c => c.mkt.state === 'OPEN')
      .slice().sort((a, b) => Math.abs(b.mkt.windows[w].delta) - Math.abs(a.mkt.windows[w].delta)).slice(0, 3);
  }
  function openingSoonList() {
    return CONTRACTS.filter(c => c.mkt.state === 'OPENING_SOON').sort((a, b) => a.contract.opensInDays - b.contract.opensInDays);
  }
  function newList() { return CONTRACTS.filter(c => c.contract.isNew).sort((a, b) => a.contract.listedDaysAgo - b.contract.listedDaysAgo); }
  function volumeList() { return CONTRACTS.filter(c => c.mkt.state === 'OPEN').slice().sort((a, b) => b.contract.simVol - a.contract.simVol).slice(0, 3); }

  /* Risk Watch — material changes only */
  function riskWatchList() {
    const items = [];
    CONTRACTS.filter(c => c.mkt.state === 'OPEN' && (c.mkt.risk.level === 'elevated' || c.mkt.risk.level === 'severe'))
      .slice(0, 2).forEach(c => items.push({ c, msg: c.mkt.risk.label, kind: 'risk' }));
    const delayed = CONTRACTS.find(c => c.mkt.state === 'OPEN' && c.mkt.profiles.some(p => p.fresh.state === 'PROVIDER_DELAYED'));
    if (delayed) items.push({ c: delayed, msg: 'Instagram provider-delayed · last-good snapshot in use', kind: 'delay' });
    const lowEv = CONTRACTS.find(c => c.mkt.state === 'OPEN' && c.mkt.evidence.grade === 'Low');
    if (lowEv) items.push({ c: lowEv, msg: 'Evidence Confidence Low — read the evidence panel', kind: 'evidence' });
    return items.slice(0, 3);
  }

  /* AI Pulse — deterministic source-backed digest (no free-form generation) */
  function aiPulse(w) {
    const open = CONTRACTS.filter(c => c.mkt.state === 'OPEN');
    const byCat = {};
    open.forEach(c => { (byCat[c.mkt.cat] = byCat[c.mkt.cat] || []).push(c.mkt.windows[w].delta); });
    let topCat = null, topAvg = -1e9;
    Object.keys(byCat).forEach(k => {
      if (byCat[k].length < 2) return;
      const avg = byCat[k].reduce((a, b) => a + b, 0) / byCat[k].length;
      if (avg > topAvg) { topAvg = avg; topCat = k; }
    });
    const medPlus = open.filter(c => c.mkt.evidence.score >= 60).length;
    const bullets = [];
    if (topCat) bullets.push({ t: catById(topCat).name + ' contracts lead ' + WIN_LABEL[w] + ' Attention Pulse movement (' + (topAvg >= 0 ? '+' : '') + topAvg.toFixed(1) + ' pts avg).', src: 'ranking snapshot' });
    bullets.push({ t: medPlus + ' of ' + open.length + ' open contracts carry Medium+ Evidence Confidence.', src: 'evidence grades' });
    if (CONTRACTS.some(c => c.mkt.state === 'OPEN' && c.mkt.profiles.some(p => p.fresh.state === 'PROVIDER_DELAYED')))
      bullets.push({ t: 'One or more open markets operate on delayed Instagram data; last-good snapshots served.', src: 'provider status' });
    return bullets.slice(0, 3);
  }

  /* Market status ticker — real internal fixture aggregates only */
  function tickerStats() {
    const open = CONTRACTS.filter(c => c.mkt.state === 'OPEN');
    const closing = open.filter(c => c.contract.closeDays <= 30).length;
    const vol = CONTRACTS.reduce((n, c) => n + c.contract.simVol, 0);
    const medPlus = open.length ? Math.round(open.filter(c => c.mkt.evidence.score >= 60).length / open.length * 100) : 0;
    return [
      { v: open.length + ' open contracts', tip: 'Valid open milestone contracts in the fixture catalog.' },
      { v: closing + ' closing within 30 days', tip: 'Open contracts whose entry window closes within 30 days of the demo snapshot.' },
      { v: B.money(vol) + ' simulated volume', tip: 'Sum of simulated position amounts. Simulated — no real money moves.' },
      { v: medPlus + '% Medium+ evidence', tip: 'Share of open contracts at Evidence Confidence Medium or High.' },
      { v: 'Instagram provider-delayed', tip: 'Last-good snapshots served for Instagram-sourced metrics.', warn: true },
      { v: 'Demo snapshot ' + DEMO_SNAP_LABEL, tip: 'Fixed fixture snapshot — this demo never generates fresh-looking timestamps.' }
    ];
  }

  return {
    VERSIONS, WINDOWS, DEFAULT_WINDOW, WIN_LABEL, TAXONOMY, PLATFORMS, TIERS, STATES, EV_GRADES,
    catById, subName, platById, tierOf, ALL, ranks, sortBoard, risingList, highConfidenceList, statusStrip,
    CONTRACTS, RADAR_STATES, DEMO_SNAP_LABEL, dateFromDays,
    trendingList, featuredList, moversList, openingSoonList, newList, volumeList, riskWatchList, aiPulse, tickerStats
  };
})();
