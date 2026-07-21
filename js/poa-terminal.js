/* =====================================================================
   Proof of Attention — Creator Market Terminal
   Self-contained, no dependencies, no build step. Vanilla JS.

   Opens as a modal from any creator / PoA / event / bet click across the
   Backer site (backerdemo.html + portfolio.html) via a global capture-phase
   click delegate. Deterministic: every series is synthesised from a stable
   seed (no Math.random at runtime), so the demo replays identically.

   Semantic separation is strict:
     • Public Attention Velocity Index  — observed public-view activity (K-line)
     • PoA composition / confidence      — Backer estimates (ranged bands)
     • Market odds / price               — contract data (separate panel)
   These never share one candle, axis or score.
   ===================================================================== */
(function () {
  'use strict';
  if (window.PoaTerminal) return;

  /* ---------------- constants ---------------- */
  var NOW = Date.UTC(2026, 6, 21, 0, 0, 0);      // deterministic "as of latest" anchor
  var DAY = 86400000;
  var NDAYS = 120;
  var METHOD_IDX = 75;                            // methodology-version boundary (day index)
  var GAP_IDX = 57;                               // source-coverage gap start
  var CORR_IDX = 96;                              // public-count correction day
  var VIRAL_IDX = 84;                             // largest velocity spike
  var UPLOAD_IDX = [10, 28, 44, 60, 72, 84, 101, 113];
  var COL = {
    up: '#37c98b', down: '#e5605a', warn: '#f1b45a', accent: '#7ea6ff',
    accent2: '#b7d0ff', gray: '#5b5e66', ink: '#f4f2ec', muted: '#a7a9ad',
    muted2: '#74767b', faint: '#4c4e54', grid: 'rgba(255,255,255,.05)'
  };
  var PK_COLORS = [COL.accent, COL.warn, COL.up];
  var METHODS = ['poa_youtube_public_v1.8', 'poa_youtube_public_v2.0'];

  /* ---------------- utils ---------------- */
  function hashSeed(s) {
    s = String(s == null ? 'backer' : s);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function round(v, d) { var m = Math.pow(10, d || 0); return Math.round(v * m) / m; }
  function r5(v) { return Math.round(v / 5) * 5; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) {
    n = Number(n) || 0; var a = Math.abs(n);
    if (a >= 1e9) return round(n / 1e9, 1) + 'B';
    if (a >= 1e6) return round(n / 1e6, 1) + 'M';
    if (a >= 1e3) return round(n / 1e3, 1) + 'K';
    return String(Math.round(n));
  }
  function money(n) { n = Number(n) || 0; return '$' + (Math.abs(n) >= 1000 ? fmt(n) : round(n, 2)); }
  function tOf(idx) { return NOW - (NDAYS - 1 - idx) * DAY; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fdate(t) { var d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function fdatetime(t) { var d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + String(d.getUTCFullYear()).slice(2) + ' ' + (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':00 UTC'; }
  function gradeOf(sc) { return sc >= 68 ? 'HIGH' : sc >= 42 ? 'MEDIUM' : sc >= 20 ? 'LOW' : 'INSUFFICIENT'; }
  function track(ev, props) {
    try {
      window.dispatchEvent(new CustomEvent('backer:track', { detail: { event: ev, props: props || {} } }));
      if (window.__backerTrack) window.__backerTrack(ev, props || {});
    } catch (e) {}
  }

  /* =====================================================================
     MODEL SYNTHESIS  (deterministic per seed)
     ===================================================================== */
  var CACHE = {};
  var TITLE_POOL = ['Forgotten Stations', 'The Quiet Build', 'Field Notes 07', 'Why It Compounds',
    'Late Signal', 'Cold Open', 'The Long Cut', 'Baseline Drift', 'Second Pass', 'Night Shift',
    'Momentum, Explained', 'The Retention Cliff', 'Unlisted Draft', 'Slow Money'];

  function buildModel(ctx) {
    var seedKey = ctx.seed;
    if (CACHE[seedKey]) return CACHE[seedKey];
    var rng = mulberry32(hashSeed(seedKey));
    var c = ctx.creator || {};
    var name = ctx.name || c.name || 'Creator';
    var handle = ctx.handle || c.handle || ('@' + name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14));
    var hue = c.hue != null ? c.hue : Math.floor(rng() * 360);

    /* --- underwriting anchors from real fields when present, else deterministic --- */
    var auth = c.auth != null ? c.auth : Math.round(46 + rng() * 46);
    var growth = c.growth != null ? c.growth : Math.round(4 + rng() * 40);
    var followers = c.followers != null ? c.followers : Math.round(3000 + rng() * 400000);
    var monthlyViews = c.monthlyViews != null ? c.monthlyViews : Math.round(followers * (2 + rng() * 6));
    var mkt = c.mkt || null;
    var evScore = mkt && mkt.evidence ? mkt.evidence.score : Math.round(clamp(auth - 8 + (rng() - 0.5) * 26, 12, 92));
    var riskScore = mkt && mkt.poa && mkt.poa.components ? mkt.poa.components.risk : Math.round(clamp(100 - auth + (rng() - 0.5) * 24, 4, 88));
    var band = riskScore >= 55 ? 'risk' : auth >= 80 && evScore >= 60 ? 'strong' : evScore < 30 ? 'insufficient' : 'mixed';
    if (ctx.forceBand) band = ctx.forceBand;

    var baselineDaily = clamp(Math.round(monthlyViews / 30), 1500, 6000000);

    /* --- fixture-state flags (deterministic per seed) --- */
    var pick = hashSeed(seedKey) % 8;
    var oneHit = pick === 0 || (mkt && mkt.risk && mkt.risk.level === 'medium' && riskScore > 40);
    var shortsHeavy = pick === 1;
    var commentsBlackout = pick === 2 || band === 'insufficient';
    var lowConfStrong = pick === 3 && band !== 'risk';   // strong estimate / low confidence
    var insufficientBaseline = pick === 4;
    var measured = false;                                  // reserved: only creator-authorized fixtures

    /* --- Public Attention Velocity Index daily OHLC --- */
    var days = [];
    var walk = 96 + rng() * 20;
    var prevClose = walk;
    for (var i = 0; i < NDAYS; i++) {
      var status = 'VALID';
      var coverage = 100;
      // baseline drift from growth + mean reversion + noise
      var drift = (growth / 30) * 0.5;
      var noise = (rng() - 0.5) * 11;
      walk += drift + noise + (walk < 70 ? 2.5 : walk > 165 ? -4 : 0);
      // event-driven bumps
      var nearUp = UPLOAD_IDX.reduce(function (a, u) { return (i >= u && i <= u + 2) ? Math.max(a, 3 - (i - u)) : a; }, 0);
      walk += nearUp * (6 + rng() * 5);
      if (i === VIRAL_IDX) walk += 90 + rng() * 40;
      if (i > VIRAL_IDX && i < VIRAL_IDX + 12) walk -= (i - VIRAL_IDX) * (oneHit ? 9 : 4); // decay
      if (shortsHeavy && i % 5 === 0) walk += 10;
      walk = clamp(walk, 22, 330);
      var close = round(walk, 0);
      var open = round(prevClose, 0);
      var spread = 3 + Math.abs(close - open) * 0.6 + rng() * 6;
      var high = round(Math.max(open, close) + rng() * spread, 0);
      var low = round(Math.min(open, close) - rng() * spread, 0);
      low = Math.max(12, Math.min(low, Math.min(open, close) - 1));
      high = Math.max(high, Math.max(open, close) + 1);
      var vol = Math.round(baselineDaily * (close / 100) * (0.75 + rng() * 0.6));

      // coverage / correction / gap
      if (i >= GAP_IDX && i <= GAP_IDX + 1) { status = 'GAP'; }
      else if (i === CORR_IDX) { status = 'CORRECTION'; vol = -Math.round(baselineDaily * (0.10 + rng() * 0.08)); }
      else if (rng() < 0.06) { status = 'PARTIAL'; coverage = Math.round(60 + rng() * 28); }
      else if (insufficientBaseline && i < 30) { status = 'PARTIAL'; coverage = Math.round(45 + rng() * 25); }

      days.push({ idx: i, t: tOf(i), o: open, h: high, l: low, c: close, vol: vol, coverage: coverage, status: status });
      prevClose = close;
    }
    var baselineMedian = (function () {
      var arr = days.slice(0, 40).filter(function (d) { return d.status === 'VALID' || d.status === 'PARTIAL'; }).map(function (d) { return d.vol; }).sort(function (a, b) { return a - b; });
      return arr.length ? arr[Math.floor(arr.length / 2)] : baselineDaily;
    })();

    /* --- composition history (Backer estimate; ranges) --- */
    var comp = [];
    for (var j = 0; j < NDAYS; j++) {
      var conf = clamp(evScore - 6 + j / NDAYS * 12 + (commentsBlackout && j > 60 ? -14 : 0), 8, 94);
      if (lowConfStrong) conf = clamp(conf - 22, 8, 55);
      var core0 = clamp(auth - 6 + (j > METHOD_IDX ? 3 : 0) + Math.sin(j / 14) * 3, 20, 90);
      var anom0 = clamp(riskScore * 0.28 + (j >= VIRAL_IDX && j < VIRAL_IDX + 10 ? 6 : 0), 1, 40);
      var passive0 = clamp((100 - auth) * 0.55 + (shortsHeavy ? 8 : 0), 6, 46);
      var un0 = clamp(100 - core0 - anom0 - passive0, 4, 40);
      var sum = core0 + anom0 + passive0 + un0;
      var core = Math.round(core0 / sum * 100), passive = Math.round(passive0 / sum * 100), anom = Math.round(anom0 / sum * 100);
      var un = 100 - core - passive - anom;
      var w = conf >= 68 ? 6 : conf >= 42 ? 11 : 17;   // range half-width scales inverse to confidence
      comp.push({
        idx: j, t: tOf(j), conf: Math.round(conf), grade: gradeOf(conf),
        point: { core: core, passive: passive, anom: anom, un: un },
        method: j >= METHOD_IDX ? METHODS[1] : METHODS[0],
        ranges: {
          core: [r5(clamp(core - w, 0, 100)), r5(clamp(core + w, 0, 100))],
          passive: [r5(clamp(passive - w, 0, 100)), r5(clamp(passive + w, 0, 100))],
          anom: [r5(clamp(anom - Math.min(w, 8), 0, 100)), r5(clamp(anom + Math.min(w, 8), 0, 100))],
          un: [r5(clamp(un - w, 0, 100)), r5(clamp(un + w, 0, 100))]
        }
      });
    }

    /* --- synced diagnostic series --- */
    var momentum = [], concentration = [], commentBreadth = [], confidenceSeries = [];
    for (var k = 0; k < NDAYS; k++) {
      var mo = k === 0 ? 0 : days[k].c - days[k - 1].c;
      momentum.push({ idx: k, t: tOf(k), v: clamp(50 + mo * 1.4, 2, 100) });
      var conc = clamp(34 + (oneHit ? 26 : 0) + (k >= VIRAL_IDX && k < VIRAL_IDX + 14 ? 22 : 0) + Math.sin(k / 11) * 6, 12, 88);
      concentration.push({ idx: k, t: tOf(k), v: Math.round(conc) });
      var cb = clamp(auth * 0.7 + 14 + Math.sin(k / 9) * 6 - (commentsBlackout && k > 60 ? 40 : 0), 4, 96);
      commentBreadth.push({ idx: k, t: tOf(k), v: Math.round(cb) });
      confidenceSeries.push({ idx: k, t: tOf(k), v: comp[k].conf });
    }

    /* --- events --- */
    var events = [];
    var formats = ['LONG_FORM', 'SHORTS', 'LONG_FORM', 'LIVESTREAM', 'LONG_FORM', 'SHORTS', 'LONG_FORM', 'LONG_FORM'];
    UPLOAD_IDX.forEach(function (u, n) {
      var fmtN = shortsHeavy ? (n % 2 === 0 ? 'SHORTS' : 'LONG_FORM') : formats[n % formats.length];
      var title = TITLE_POOL[(hashSeed(seedKey) + n * 7) % TITLE_POOL.length];
      events.push({
        id: 'ev_up_' + u, idx: u, t: tOf(u), type: 'CONTENT_PUBLISHED', klass: 'ev-content',
        label: title + ' published', contentId: 'content_' + n, source: 'youtube_public_demo_fixture',
        coverage: 100, effect: n === (VIRAL_IDX >= u && VIRAL_IDX <= u + 2 ? n : -1) ? 'POSITIVE' : 'NEUTRAL',
        delta: '+' + fmt(days[u].vol) + ' captured views (interval)',
        explain: title + ' (' + fmtN.toLowerCase().replace('_', '-') + ') entered the tracked catalogue; velocity index moved to ' + days[u].c + ' over the following interval.'
      });
    });
    events.push({ id: 'ev_viral', idx: VIRAL_IDX, t: tOf(VIRAL_IDX), type: 'VELOCITY_SPIKE', klass: 'ev-spike',
      label: 'Velocity spike', source: 'youtube_public_demo_fixture', coverage: 100, effect: 'NEUTRAL',
      delta: 'Index ' + days[VIRAL_IDX - 1].c + ' → ' + days[VIRAL_IDX].c,
      explain: 'Captured public-view velocity reached ' + round(days[VIRAL_IDX].c / 100, 2) + '× the prior 28-day median. Movement only — not evidence of manipulation without corroborating signals.' });
    events.push({ id: 'ev_conc', idx: VIRAL_IDX + 3, t: tOf(VIRAL_IDX + 3), type: 'CONCENTRATION_CHANGE', klass: 'ev-risk',
      label: 'Concentration rose', source: 'derived', coverage: 100, effect: oneHit ? 'NEGATIVE' : 'NEUTRAL',
      delta: 'Top-item share → ' + concentration[VIRAL_IDX + 3].v + '%',
      explain: 'One upload accounts for a larger share of captured views. Raises creator-level concentration risk; not a fraud signal.' });
    events.push({ id: 'ev_gap', idx: GAP_IDX, t: tOf(GAP_IDX), type: 'SOURCE_GAP', klass: 'ev-data',
      label: 'Source-coverage gap', source: 'youtube_public_demo_fixture', coverage: 0, effect: 'NEUTRAL',
      delta: 'Snapshots unavailable ~48h',
      explain: 'Public snapshots were not retained for this window. No candle is drawn and values are not interpolated across the gap.' });
    events.push({ id: 'ev_corr', idx: CORR_IDX, t: tOf(CORR_IDX), type: 'PUBLIC_COUNT_CORRECTION', klass: 'ev-data',
      label: 'Public-count correction', source: 'youtube_public_demo_fixture', coverage: 100, effect: 'NEUTRAL',
      delta: fmt(days[CORR_IDX].vol) + ' view delta (correction)',
      explain: 'The platform revised public view counts downward. The negative delta is disclosed as a source correction, not silently zeroed.' });
    events.push({ id: 'ev_method', idx: METHOD_IDX, t: tOf(METHOD_IDX), type: 'METHODOLOGY_CHANGE', klass: 'ev-method',
      label: 'Methodology ' + METHODS[1], source: 'backer_methodology', coverage: 100, effect: 'NEUTRAL',
      delta: METHODS[0] + ' → ' + METHODS[1],
      explain: 'Composition methodology advanced to ' + METHODS[1] + '. Estimates before and after this boundary are not directly comparable — a visible discontinuity is expected.' });
    if (commentsBlackout) events.push({ id: 'ev_cmt', idx: 62, t: tOf(62), type: 'COMMENTS_UNAVAILABLE', klass: 'ev-data',
      label: 'Comments unavailable', source: 'youtube_public_demo_fixture', coverage: 100, effect: 'NEUTRAL',
      delta: 'Comment capture disabled',
      explain: 'Comment data became unavailable for this creator. Evidence confidence is lowered; this is not an allegation of manipulation.' });
    events.sort(function (a, b) { return a.idx - b.idx; });

    /* --- content contribution samples --- */
    var content = [];
    UPLOAD_IDX.forEach(function (u, n) {
      var isViral = VIRAL_IDX >= u && VIRAL_IDX <= u + 3;
      var fmtN = shortsHeavy ? (n % 2 === 0 ? 'SHORTS' : 'LONG_FORM') : formats[n % formats.length];
      var views = Math.round(days[u].vol * (isViral ? 4 : 0.6 + rng() * 1.4));
      var contribution = isViral ? (oneHit ? 52 : 34) : Math.round(4 + rng() * 12);
      content.push({
        id: 'content_' + n, title: TITLE_POOL[(hashSeed(seedKey) + n * 7) % TITLE_POOL.length],
        publishedAt: tOf(u), publishedIdx: u, format: fmtN,
        views: views, likes: Math.round(views * (0.03 + rng() * 0.03)), comments: commentsBlackout && n > 4 ? null : Math.round(views * (0.004 + rng() * 0.004)),
        contributionPct: contribution,
        engagementDepth: Math.round(clamp(auth - 8 + (rng() - 0.5) * 20, 20, 95)),
        diversity: commentsBlackout && n > 4 ? 'UNAVAILABLE' : (rng() > 0.7 ? 'NARROW' : 'BROAD'),
        flag: isViral && oneHit ? 'CONCENTRATION' : (fmtN === 'SHORTS' && shortsHeavy ? 'SHORTS-DEPENDENT' : null),
        conf: gradeOf(clamp(evScore + (rng() - 0.5) * 20, 10, 92)),
        effect: isViral ? (oneHit ? 'NEGATIVE' : 'POSITIVE') : (rng() > 0.6 ? 'POSITIVE' : 'NEUTRAL')
      });
    });
    content.sort(function (a, b) { return b.contributionPct - a.contributionPct; });

    /* --- market series (odds / price) — separate from attention K-line --- */
    var baseProb = mkt && mkt.contract ? clamp(mkt.contract.progressPct || 45, 10, 80) : clamp(38 + auth * 0.25, 12, 78);
    var mProb = [], mVol = [];
    for (var mi = 0; mi < NDAYS; mi++) {
      var p = clamp(baseProb + (days[mi].c - 100) * 0.22 + (mi > VIRAL_IDX ? 8 : 0) + Math.sin(mi / 20) * 4, 4, 96);
      mProb.push({ idx: mi, t: tOf(mi), v: Math.round(p) });
      mVol.push({ idx: mi, t: tOf(mi), v: Math.round(600 + Math.abs(days[mi].c - 100) * 40 + rng() * 900) });
    }
    var rivalName = ctx.rival || (mkt && mkt.contract ? 'Field rival' : 'Rival creator');
    var pkA = [], pkB = [];
    for (var pi = 0; pi < NDAYS; pi++) {
      var a = clamp(42 + (days[pi].c - 100) * 0.35 + (pi > VIRAL_IDX ? 15 : -4) + Math.sin(pi / 16) * 5, 8, 92);
      pkA.push({ idx: pi, t: tOf(pi), v: Math.round(a) });
      pkB.push({ idx: pi, t: tOf(pi), v: Math.round(100 - a) });
    }
    var perp = [];
    var pv = 100;
    for (var qi = 0; qi < NDAYS; qi++) {
      pv += (days[qi].c - (qi ? days[qi - 1].c : days[qi].c)) * 0.28 + (rng() - 0.5) * 2.4;
      pv = clamp(pv, 55, 175);
      var po = qi ? perp[qi - 1].c : pv - 1;
      var ph = Math.max(po, pv) + rng() * 3, pl = Math.min(po, pv) - rng() * 3;
      perp.push({ idx: qi, t: tOf(qi), o: round(po, 1), h: round(ph, 1), l: round(pl, 1), c: round(pv, 1), vol: Math.round(300 + rng() * 1400) });
    }

    /* --- bets (user positions) — pinned to timestamps --- */
    var bets = [];
    bets.push({ idx: 40, t: tOf(40), side: 'YES', market: 'milestone', size: 25, entry: mProb[40].v, entryLabel: mProb[40].v + '¢', status: 'OPEN', pnl: round((mProb[NDAYS - 1].v - mProb[40].v) * 0.25, 2) });
    if (band !== 'insufficient') bets.push({ idx: 70, t: tOf(70), side: 'LONG', market: 'perps', size: 60, entry: perp[70].c, entryLabel: 'idx ' + perp[70].c, status: 'OPEN', pnl: round((perp[NDAYS - 1].c - perp[70].c) * 0.6, 2) });
    // real user positions from market localStorage
    try {
      var raw = JSON.parse(localStorage.getItem('backer_portfolio_v1') || '[]');
      if (c.id) raw.forEach(function (pp) {
        if (pp.id === c.id) bets.push({ idx: 108, t: tOf(108), side: 'YES', market: 'milestone', size: pp.invested || 25, entry: mProb[108].v, entryLabel: mProb[108].v + '¢', status: 'OPEN', pnl: round((mProb[NDAYS - 1].v - mProb[108].v) * (pp.invested || 25) / 100, 2), real: true });
      });
    } catch (e) {}
    // portfolio-position focus (from a bet click on portfolio.html)
    if (ctx.position) {
      var P = ctx.position, m2 = P.inst === 'CONTENT_PK' ? 'pk' : P.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone';
      var sideP = P.perp ? P.perp.side : (P.pk ? 'YES' : 'YES');
      bets.push({ idx: 96, t: tOf(96), side: sideP, market: m2, size: P.stake || 25, entry: P.perp ? P.perp.entry : (mProb[96].v), entryLabel: P.perp ? ('idx ' + P.perp.entry) : (mProb[96].v + '¢'), status: P.status === 'ACTIVE' ? 'OPEN' : 'CLOSED', pnl: P.pnl != null ? round(P.pnl, 2) : 0, real: true });
      ctx.defaultMarket = m2;
    }

    /* --- evidence explorer --- */
    var topShare = content.length ? content[0].contributionPct : 20;
    function ev(cat, name, val, benchmark, sample, confG, effect, explain, unavailable) {
      return { cat: cat, name: name, val: val, benchmark: benchmark, sample: sample, conf: confG, effect: effect, explain: explain, unavailable: !!unavailable };
    }
    var evidence = [
      ev('Engagement depth', 'Median engagement rate', round(2 + auth * 0.06, 1) + '%', 'cohort 3.1%', fmt(monthlyViews) + ' views', gradeOf(auth), auth >= 70 ? 'POSITIVE' : 'NEUTRAL',
        'Public like+comment activity relative to captured views across sampled uploads.'),
      ev('Audience breadth', 'Unique commenters (90d)', commentsBlackout ? 'Unavailable' : fmt(Math.round(followers * 0.03)), 'size cohort', commentsBlackout ? '—' : '642 comments', commentsBlackout ? 'INSUFFICIENT' : gradeOf(auth - 4), commentsBlackout ? 'NEUTRAL' : 'POSITIVE',
        commentsBlackout ? 'Comment data unavailable for this creator — lowers evidence confidence. Not an allegation.' : 'Distinct comment authors observed across the underwriting window.', commentsBlackout),
      ev('Participation recurrence', 'Returning-commenter overlap', commentsBlackout ? 'Unavailable' : Math.round(18 + auth * 0.3) + '%', '22%', commentsBlackout ? '—' : '3 sampled uploads', commentsBlackout ? 'INSUFFICIENT' : 'MEDIUM', 'NEUTRAL',
        'Share of commenters appearing on more than one sampled upload — a durability proxy, not measured retention.', commentsBlackout),
      ev('Comment structure', 'Semantic redundancy', commentsBlackout ? 'Unavailable' : (riskScore > 45 ? 'Elevated' : 'Low'), 'Low', commentsBlackout ? '—' : '642 comments', commentsBlackout ? 'INSUFFICIENT' : 'MEDIUM', riskScore > 45 ? 'NEGATIVE' : 'POSITIVE',
        'Deterministic template check for repeated / low-variety comment text. Elevated redundancy lowers confidence only.', commentsBlackout),
      ev('Velocity integrity', 'Spike vs 28d median', round(days[VIRAL_IDX].c / 100, 2) + '×', '< 3×', 'daily snapshots', 'HIGH', 'NEUTRAL',
        'Largest captured-velocity spike this window. Movement is reported; it is not classified as manipulation without corroboration.'),
      ev('Content concentration', 'Top-item view share', topShare + '%', '< 30%', content.length + ' items', 'HIGH', topShare > 40 ? 'NEGATIVE' : 'NEUTRAL',
        'Share of captured views from the single largest upload. Higher share raises concentration risk.'),
      ev('Catalog durability', 'Median non-Shorts view floor', fmt(Math.round(baselineMedian * 0.7)), 'stable', 'catalogue', gradeOf(auth - 6), 'POSITIVE',
        'Persistent view floor on long-form uploads — a public durability proxy.'),
      ev('Cadence reliability', 'Upload cadence', round(NDAYS / UPLOAD_IDX.length, 1) + 'd', 'consistent', UPLOAD_IDX.length + ' uploads', 'HIGH', 'NEUTRAL',
        'Average interval between tracked uploads over the window.'),
      ev('Format dependence', 'Shorts share of reach', (shortsHeavy ? 58 : 22) + '%', '< 40%', 'catalogue', 'MEDIUM', shortsHeavy ? 'NEGATIVE' : 'POSITIVE',
        'Reliance on Shorts-format reach. High dependence limits durability uplift.'),
      ev('Data coverage', 'Source-request coverage', Math.round(days.filter(function (d) { return d.status === 'VALID'; }).length / NDAYS * 100) + '%', '> 90%', NDAYS + ' days', gradeOf(evScore), 'NEUTRAL',
        'Successful public snapshots vs expected snapshots across the window. Gaps and corrections are disclosed on the event rail.')
    ];

    /* --- durability --- */
    var durabilityState = band === 'insufficient' ? 'UNAVAILABLE' : (measured ? 'MEASURED' : 'PUBLIC_PROXY');
    var durProxies = [
      ['Returning-commenter overlap', commentsBlackout ? 'Unavailable' : Math.round(18 + auth * 0.3) + '%'],
      ['Median non-Shorts view floor', fmt(Math.round(baselineMedian * 0.7))],
      ['Catalog persistence', auth >= 70 ? 'Strong' : 'Moderate'],
      ['Top-content concentration', topShare + '%'],
      ['Upload cadence consistency', round(NDAYS / UPLOAD_IDX.length, 1) + 'd'],
      ['Shorts dependence', (shortsHeavy ? 'High' : 'Low')],
      ['View consistency', oneHit ? 'Uneven (one-hit)' : 'Even'],
      ['Channel maturity', Math.round(6 + rng() * 40) + ' mo']
    ];

    /* --- diagnostic indexes --- */
    var indexes = [
      { key: 'Attention Authenticity', score: auth, range: [r5(auth - 8), r5(Math.min(100, auth + 5))], grade: gradeOf(evScore), interp: 'Observed attention appears ' + (auth >= 75 ? 'largely credible' : auth >= 55 ? 'mixed' : 'weak') + ' on public signals.', pos: ['Distinct comment authors', 'Stable non-Shorts floor'], lim: 'No watch-time or device signals.' },
      { key: 'Attention Durability', score: Math.round(clamp(auth - (oneHit ? 22 : 8), 10, 92)), range: null, grade: 'MEDIUM', interp: (oneHit ? 'One-upload concentration limits durability confidence.' : 'Repeat participation supports moderate durability.'), pos: ['Returning-commenter overlap', 'Catalog persistence'], lim: 'Public proxies only — not measured retention.' },
      { key: 'Monetization Readiness', score: mkt && mkt.poa && mkt.poa.components ? mkt.poa.components.monetization : Math.round(clamp(auth * 0.6, 8, 88)), range: null, grade: gradeOf(evScore - 6), interp: 'Observable conversion potential from public funnels.', pos: ['High-intent audience', 'Search demand trend'], lim: 'No revenue data; inference only.' },
      { key: 'Manipulation / Platform Risk', score: riskScore, range: null, grade: gradeOf(evScore), inverse: true, interp: '100 = higher risk. ' + (riskScore >= 55 ? 'Material anomalies present.' : riskScore >= 30 ? 'Minor gaps.' : 'No material flag.'), pos: [], neg: ['Velocity spike dependence', 'Concentration change'], lim: 'Platform-private fraud labels unavailable.' }
    ];

    /* --- summary --- */
    var authLo = r5(clamp(auth - (lowConfStrong ? 20 : 10), 0, 100)), authHi = r5(clamp(auth + (lowConfStrong ? 12 : 5), 0, 100));
    var lastConf = comp[NDAYS - 1].conf;
    var summary = {
      authRange: band === 'insufficient' ? null : [authLo, authHi],
      confidence: { score: lastConf, grade: gradeOf(lastConf) },
      risk: { score: riskScore, level: riskScore >= 55 ? 'ELEVATED' : riskScore >= 30 ? 'MEDIUM' : 'LOW' },
      coverage: { videos: UPLOAD_IDX.length, comments: commentsBlackout ? 0 : 642, days: 90, score: Math.round(days.filter(function (d) { return d.status === 'VALID'; }).length / NDAYS * 100) },
      primaryEvidence: mkt && mkt.poa && mkt.poa.positive ? mkt.poa.positive : (auth >= 70 ? 'Stable non-Shorts engagement across sampled uploads.' : 'A credible audience core exists under the noise.'),
      primaryRisk: oneHit ? (content[0].contributionPct + '% of recent captured views came from one upload.') : (mkt && mkt.poa && mkt.poa.riskNote ? mkt.poa.riskNote : (riskScore >= 55 ? 'Public evidence shows material anomalies.' : 'Attention is moderately concentrated.'))
    };

    /* --- market meta --- */
    var progressPct = mkt && mkt.contract ? mkt.contract.progressPct : Math.round(baseProb);
    var markets = {
      milestone: {
        label: 'Milestone', question: mkt && mkt.contract ? mkt.contract.title : ('Will ' + name.split(' ')[0] + ' hit ' + fmt(followers * 3) + ' subscribers by Oct 31?'),
        deadline: mkt && mkt.contract ? (mkt.contract.deadlineLabel || 'Oct 31') : 'Oct 31, 2026',
        source: mkt && mkt.contract ? mkt.contract.source : 'YouTube public subscriber count',
        rules: 'Resolves YES if the disclosed public metric meets the target on or before the deadline.',
        prob: mProb, vol: mVol, mult: mkt && mkt.contract ? mkt.contract.mult : round(1 + (100 - baseProb) / 40, 2),
        cur: mProb[NDAYS - 1].v, prev: mProb[NDAYS - 8].v, progress: progressPct
      },
      pk: {
        label: 'PK', question: 'Which creator generates more views on the next upload?',
        outcomes: [
          { name: name.split(' ')[0], color: PK_COLORS[0], series: pkA, cur: pkA[NDAYS - 1].v, prev: pkA[NDAYS - 8].v },
          { name: rivalName, color: PK_COLORS[1], series: pkB, cur: pkB[NDAYS - 1].v, prev: pkB[NDAYS - 8].v }
        ],
        source: 'YouTube public 72h view counts', rules: 'Resolves to the outcome with the higher disclosed 72h view count.'
      },
      perps: {
        label: 'Perps', question: name.split(' ')[0] + ' Attention Index — perpetual', indexName: 'Creator Attention Index',
        ohlc: perp, funding: round((rng() - 0.5) * 0.06, 3), oi: Math.round(40000 + rng() * 180000),
        mark: perp[NDAYS - 1].c, source: 'Composite of public view velocity + engagement + cadence',
        drivers: ['View velocity', 'Engagement quality', 'Comment breadth', 'Cadence consistency', 'Content concentration']
      }
    };

    var model = {
      seed: seedKey, name: name, handle: handle, hue: hue, initials: (name.split(' ').slice(0, 2).map(function (x) { return x[0]; }).join('') || 'B').toUpperCase(),
      platforms: (c.platforms || [['youtube', handle, fmt(followers)]]).map(function (p) { return { id: p[0], label: p[0] }; }),
      band: band, evidence: { grade: gradeOf(evScore), score: evScore },
      status: mkt ? { label: (mkt.state || 'OPEN'), tone: mkt.state === 'OPEN' ? 'up' : 'gray' } : { label: 'ILLUSTRATIVE', tone: 'gray' },
      summary: summary, days: days, baselineMedian: baselineMedian, comp: comp,
      momentum: momentum, concentration: concentration, commentBreadth: commentBreadth, confidenceSeries: confidenceSeries,
      events: events, content: content, evidenceRows: evidence, durabilityState: durabilityState, durProxies: durProxies,
      indexes: indexes, markets: markets, bets: bets, method: METHODS[1],
      flags: { oneHit: oneHit, shortsHeavy: shortsHeavy, commentsBlackout: commentsBlackout, lowConfStrong: lowConfStrong },
      defaultMarket: ctx.defaultMarket || (mkt && mkt.contract ? 'milestone' : 'milestone'),
      focusBetIdx: ctx.position ? 96 : null
    };
    CACHE[seedKey] = model;
    return model;
  }

  /* =====================================================================
     CHART BUILDING (accessible inline SVG)
     ===================================================================== */
  function niceScale(min, max) {
    if (!(max > min)) { max = min + 1; }
    var pad = (max - min) * 0.08; return { min: min - pad, max: max + pad };
  }
  function aggregateCandles(list, weekly) {
    if (!weekly) return list.slice();
    var out = [], grp = [];
    for (var i = 0; i < list.length; i++) {
      grp.push(list[i]);
      if (grp.length === 7 || i === list.length - 1) {
        var valid = grp.filter(function (d) { return d.status !== 'GAP'; });
        if (valid.length) {
          out.push({ idx: valid[valid.length - 1].idx, t: valid[valid.length - 1].t,
            o: valid[0].o, h: Math.max.apply(null, valid.map(function (d) { return d.h; })),
            l: Math.min.apply(null, valid.map(function (d) { return d.l; })),
            c: valid[valid.length - 1].c, vol: valid.reduce(function (a, d) { return a + Math.max(0, d.vol); }, 0),
            coverage: Math.round(valid.reduce(function (a, d) { return a + d.coverage; }, 0) / valid.length),
            status: valid.some(function (d) { return d.status === 'PARTIAL'; }) ? 'PARTIAL' : 'VALID' });
        }
        grp = [];
      }
    }
    return out;
  }

  // Build the combined market + attention SVG. Returns {svg, geo}
  function buildChart(model, S) {
    var W = 1000, H = 430;
    var padL = 46, padR = 46, padT = 8, padB = 22;
    var priceTop = padT, priceH = 176;
    var volTop = priceTop + priceH + 6, volH = 34;
    var evTrackY = volTop + volH + 10;
    var attnTop = evTrackY + 14, attnH = 132;
    var axisY = attnTop + attnH + 6;
    H = axisY + padB;

    var rangeN = { '7d': 7, '30d': 30, '90d': 90, '1y': 120, 'all': 120 }[S.range] || 90;
    var asOf = S.asOf;                                  // full-series index (0..119)
    var start = Math.max(0, asOf + 1 - rangeN);
    var full = model.days.slice(start, asOf + 1);
    var candles = aggregateCandles(full, S.interval === '1w');
    if (!candles.length) candles = full.slice();
    var n = candles.length;
    var innerW = W - padL - padR;
    var bw = innerW / Math.max(n, 1);
    var idxToX = {};
    candles.forEach(function (d, i) { idxToX[d.idx] = padL + i * bw + bw / 2; });
    function xAt(fullIdx) {
      if (idxToX[fullIdx] != null) return idxToX[fullIdx];
      // nearest visible
      var best = null, bd = 1e9;
      candles.forEach(function (d) { var dd = Math.abs(d.idx - fullIdx); if (dd < bd) { bd = dd; best = d.idx; } });
      return best == null ? padL : idxToX[best];
    }

    var svg = '<svg class="pt-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" preserveAspectRatio="xMidYMid meet" aria-label="Creator market and attention chart">';
    // grid
    svg += '<g class="pt-grid">';
    for (var g = 0; g <= 4; g++) { var gy = priceTop + priceH / 4 * g; svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '"/>'; }
    for (var g2 = 0; g2 <= 3; g2++) { var gy2 = attnTop + attnH / 3 * g2; svg += '<line x1="' + padL + '" y1="' + gy2 + '" x2="' + (W - padR) + '" y2="' + gy2 + '"/>'; }
    svg += '</g>';

    /* ---- PRICE / ODDS PANEL ---- */
    var mtype = S.mtype;
    var pMin, pMax, priceLabel, priceSuffix = '';
    if (mtype === 'perps') {
      var pv = model.markets.perps.ohlc.filter(function (d) { return d.idx >= start && d.idx <= asOf; });
      var lo = Math.min.apply(null, pv.map(function (d) { return d.l; })), hi = Math.max.apply(null, pv.map(function (d) { return d.h; }));
      var sc = niceScale(lo, hi); pMin = sc.min; pMax = sc.max; priceLabel = 'Index level';
    } else { pMin = 0; pMax = 100; priceLabel = mtype === 'milestone' ? 'Implied probability' : 'Outcome probability'; priceSuffix = '%'; }
    function pY(v) { return priceTop + priceH - (v - pMin) / (pMax - pMin) * priceH; }
    // y labels
    svg += '<g class="pt-axis">';
    for (var yl = 0; yl <= 4; yl++) { var vv = pMin + (pMax - pMin) * (1 - yl / 4); svg += '<text x="' + (padL - 6) + '" y="' + (priceTop + priceH / 4 * yl + 3) + '" text-anchor="end">' + round(vv, mtype === 'perps' ? 0 : 0) + priceSuffix + '</text>'; }
    svg += '</g>';

    if (mtype === 'milestone') {
      var pts = candles.map(function (d) { var mv = model.markets.milestone.prob[d.idx]; return xAt(d.idx) + ',' + pY(mv ? mv.v : 50); });
      // volume
      var vmax = Math.max.apply(null, candles.map(function (d) { var v = model.markets.milestone.vol[d.idx]; return v ? v.v : 0; })) || 1;
      candles.forEach(function (d) { var v = model.markets.milestone.vol[d.idx]; var vh = (v ? v.v : 0) / vmax * volH; svg += '<rect x="' + (xAt(d.idx) - bw * 0.3) + '" y="' + (volTop + volH - vh) + '" width="' + (bw * 0.6) + '" height="' + vh + '" class="vol-up"/>'; });
      svg += '<polyline class="oddline" style="stroke:' + COL.accent + '" points="' + pts.join(' ') + '"/>';
      // area
      svg += '<polygon points="' + pts.join(' ') + ' ' + (padL + (n - 1 + 0.5) * bw) + ',' + (priceTop + priceH) + ' ' + (padL + 0.5 * bw) + ',' + (priceTop + priceH) + '" fill="' + COL.accent + '" opacity="0.06"/>';
    } else if (mtype === 'pk') {
      var vmax2 = 1;
      model.markets.pk.outcomes.forEach(function (o, oi) {
        var pts2 = candles.map(function (d) { var mv = o.series[d.idx]; return xAt(d.idx) + ',' + pY(mv ? mv.v : 50); });
        svg += '<polyline class="oddline" style="stroke:' + o.color + '" points="' + pts2.join(' ') + '"/>';
      });
    } else { // perps candles
      model.markets.perps.ohlc.forEach(function (d) {
        if (d.idx < start || d.idx > asOf) return;
        if (S.interval === '1w' && !idxToX[d.idx]) return;
        var x = xAt(d.idx), up = d.c >= d.o;
        var cw = Math.max(1.5, bw * 0.6);
        svg += '<line x1="' + x + '" y1="' + pY(d.h) + '" x2="' + x + '" y2="' + pY(d.l) + '" class="' + (up ? 'wick-up' : 'wick-down') + '"/>';
        var yo = pY(d.o), yc = pY(d.c);
        svg += '<rect x="' + (x - cw / 2) + '" y="' + Math.min(yo, yc) + '" width="' + cw + '" height="' + Math.max(1.5, Math.abs(yc - yo)) + '" class="' + (up ? 'candle-up' : 'candle-down') + '"/>';
      });
    }

    // event track markers
    model.events.forEach(function (e) {
      if (e.idx < start || e.idx > asOf) return;
      var x = xAt(e.idx);
      svg += '<g class="evt-mark pt-focusable" tabindex="0" role="button" data-ev="' + e.id + '" aria-label="Event: ' + esc(e.label) + ' ' + fdate(e.t) + '">';
      svg += '<line x1="' + x + '" y1="' + priceTop + '" x2="' + x + '" y2="' + evTrackY + '" stroke="rgba(255,255,255,.08)" stroke-dasharray="2 3"/>';
      var col = e.klass === 'ev-content' ? COL.accent : e.klass === 'ev-spike' ? COL.warn : e.klass === 'ev-risk' ? COL.down : e.klass === 'ev-method' ? COL.accent2 : COL.gray;
      svg += '<rect x="' + (x - 5) + '" y="' + (evTrackY - 5) + '" width="10" height="10" rx="2" fill="' + col + '"/>';
      svg += '</g>';
    });

    // bet markers on price panel
    model.bets.forEach(function (b, bi) {
      if (b.idx < start || b.idx > asOf) return;
      if (S.mtype !== b.market && !(b.market === 'milestone' && S.mtype === 'pk')) { /* still show as small tick */ }
      var x = xAt(b.idx);
      var yv = mtype === 'perps' ? (model.markets.perps.ohlc[b.idx] ? pY(model.markets.perps.ohlc[b.idx].c) : pY((pMin + pMax) / 2)) : pY(model.markets.milestone.prob[b.idx] ? model.markets.milestone.prob[b.idx].v : 50);
      var buy = b.side === 'YES' || b.side === 'LONG';
      var col = b.side === 'EXIT' ? COL.muted : buy ? COL.up : COL.down;
      var focus = model.focusBetIdx === b.idx;
      svg += '<g class="bet-mark pt-focusable" tabindex="0" role="button" data-bet="' + bi + '" aria-label="Bet ' + b.side + ' ' + money(b.size) + ' at ' + esc(b.entryLabel) + '">';
      var ty = buy ? yv + 12 : yv - 12;
      svg += '<path d="' + (buy ? 'M' + x + ',' + (yv + 4) + ' l-5,9 l10,0 Z' : 'M' + x + ',' + (yv - 4) + ' l-5,-9 l10,0 Z') + '" fill="' + col + '" stroke="#08090b" stroke-width="1"/>';
      if (focus) svg += '<circle cx="' + x + '" cy="' + yv + '" r="9" fill="none" stroke="' + col + '" stroke-width="1.5" opacity="0.8"/>';
      svg += '</g>';
    });

    /* ---- ATTENTION VELOCITY K-LINE (separate panel) ---- */
    var acands = candles;
    var alo = Math.min.apply(null, acands.map(function (d) { return d.l; })), ahi = Math.max.apply(null, acands.map(function (d) { return d.h; }));
    var asc = niceScale(alo, ahi);
    function aY(v) { return attnTop + attnH - (v - asc.min) / (asc.max - asc.min) * attnH; }
    svg += '<g class="pt-axis">';
    for (var al = 0; al <= 3; al++) { var av = asc.min + (asc.max - asc.min) * (1 - al / 3); svg += '<text x="' + (padL - 6) + '" y="' + (attnTop + attnH / 3 * al + 3) + '" text-anchor="end">' + Math.round(av) + '</text>'; }
    svg += '</g>';
    // baseline 100 line
    if (asc.min < 100 && asc.max > 100) svg += '<line x1="' + padL + '" y1="' + aY(100) + '" x2="' + (W - padR) + '" y2="' + aY(100) + '" stroke="' + COL.faint + '" stroke-dasharray="4 4"/><text class="pt-axis" x="' + (W - padR + 2) + '" y="' + (aY(100) + 3) + '" fill="' + COL.faint + '">100</text>';
    acands.forEach(function (d) {
      var x = xAt(d.idx), up = d.c >= d.o, cw = Math.max(1.5, bw * 0.58);
      if (d.status === 'GAP') return;
      var partial = d.status === 'PARTIAL' || d.status === 'CORRECTION';
      svg += '<line x1="' + x + '" y1="' + aY(d.h) + '" x2="' + x + '" y2="' + aY(d.l) + '" class="' + (up ? 'wick-up' : 'wick-down') + '"' + (partial ? ' stroke-dasharray="2 2"' : '') + '/>';
      var yo = aY(d.o), yc = aY(d.c);
      svg += '<rect x="' + (x - cw / 2) + '" y="' + Math.min(yo, yc) + '" width="' + cw + '" height="' + Math.max(1.2, Math.abs(yc - yo)) + '" class="' + (up ? 'candle-up' : 'candle-down') + (partial ? ' candle-hollow' : '') + '"' + (partial ? ' stroke-dasharray="2 2"' : '') + ' data-cidx="' + d.idx + '"/>';
    });
    // gap band shading
    model.days.forEach(function (d) { if (d.status === 'GAP' && d.idx >= start && d.idx <= asOf) { var x = xAt(d.idx); svg += '<rect class="gap-band" x="' + (x - bw / 2) + '" y="' + attnTop + '" width="' + bw + '" height="' + attnH + '"/>'; } });

    // x-axis labels
    svg += '<g class="pt-axis">';
    var step = Math.max(1, Math.floor(n / 6));
    candles.forEach(function (d, i) { if (i % step === 0 || i === n - 1) svg += '<text x="' + xAt(d.idx) + '" y="' + (axisY + 8) + '" text-anchor="middle">' + fdate(d.t) + '</text>'; });
    svg += '</g>';

    // panel captions
    svg += '<text class="pt-axis" x="' + padL + '" y="' + (priceTop + 10) + '" fill="' + COL.muted2 + '">' + priceLabel + '</text>';
    svg += '<text class="pt-axis" x="' + padL + '" y="' + (attnTop + 10) + '" fill="' + COL.muted2 + '">Public Attention Velocity Index · 100 = prior 28d median</text>';

    // crosshair + interaction overlay
    svg += '<g class="pt-crosshair" style="display:none"><line class="chx" x1="0" y1="' + priceTop + '" x2="0" y2="' + (attnTop + attnH) + '"/></g>';
    svg += '<rect class="pt-plot-overlay" x="' + padL + '" y="' + priceTop + '" width="' + innerW + '" height="' + (attnTop + attnH - priceTop) + '" fill="transparent"/>';
    svg += '</svg>';

    var geo = { padL: padL, bw: bw, candles: candles, start: start, asOf: asOf, W: W };
    return { svg: svg, geo: geo };
  }

  // small sparkline for synced mini panels
  function sparkline(series, start, asOf, color, band) {
    var W = 240, H = 34, pad = 2;
    var vis = series.filter(function (d) { return d.idx >= start && d.idx <= asOf; });
    if (!vis.length) return '';
    var lo = Math.min.apply(null, vis.map(function (d) { return d.v; })), hi = Math.max.apply(null, vis.map(function (d) { return d.v; }));
    if (hi === lo) hi = lo + 1;
    var n = vis.length, bw = (W - pad * 2) / Math.max(n - 1, 1);
    function y(v) { return pad + (H - pad * 2) - (v - lo) / (hi - lo) * (H - pad * 2); }
    var pts = vis.map(function (d, i) { return (pad + i * bw) + ',' + round(y(d.v), 1); });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
    if (band) svg += '<polygon class="spark-fill" style="fill:' + color + '" points="' + pts.join(' ') + ' ' + (pad + (n - 1) * bw) + ',' + H + ' ' + pad + ',' + H + '"/>';
    svg += '<polyline class="spark-line" style="stroke:' + color + '" points="' + pts.join(' ') + '"/></svg>';
    return svg;
  }

  // composition history ribbon (midpoint stacked)
  function compRibbon(comp, start, asOf) {
    var W = 640, H = 70;
    var vis = comp.filter(function (d) { return d.idx >= start && d.idx <= asOf; });
    if (!vis.length) return '';
    var n = vis.length, bw = W / n;
    var segs = [['core', COL.up], ['passive', COL.accent], ['anom', COL.warn], ['un', COL.gray]];
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
    vis.forEach(function (d, i) {
      var yAcc = 0;
      segs.forEach(function (s) {
        var h = d.point[s[0]] / 100 * H;
        svg += '<rect x="' + (i * bw) + '" y="' + yAcc + '" width="' + (bw + 0.5) + '" height="' + h + '" fill="' + s[1] + '" opacity="0.55"/>';
        yAcc += h;
      });
    });
    // methodology boundary
    var mb = vis.findIndex(function (d) { return d.idx === METHOD_IDX; });
    if (mb >= 0) svg += '<line x1="' + (mb * bw) + '" y1="0" x2="' + (mb * bw) + '" y2="' + H + '" stroke="' + COL.accent2 + '" stroke-dasharray="3 3"/>';
    svg += '</svg>';
    return svg;
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  var ICO = {
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M8 5v14M18 5l-8 7 8 7z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 5v14M6 5l8 7-8 7z"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'
  };

  var S = null;          // active state
  var ROOT = null;       // .poa-term-root element
  var lastFocus = null;

  function confDots(grade) {
    var lv = grade === 'HIGH' ? 3 : grade === 'MEDIUM' ? 2 : grade === 'LOW' ? 1 : 0;
    var s = '<span class="conf-dots" aria-label="' + grade + ' confidence">';
    for (var i = 0; i < 3; i++) s += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    return s + '</span>';
  }
  function bandWord(b) { return b === 'strong' ? 'Strong' : b === 'mixed' ? 'Mixed' : b === 'risk' ? 'Risk-flagged' : 'Insufficient'; }
  function bandTone(b) { return b === 'strong' ? 'up' : b === 'risk' ? 'down' : b === 'insufficient' ? 'gray' : 'warn'; }

  function tradePanel(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var h = '<div class="pt-trade"><div class="pt-trade-h"><div class="mk">' + (mt === 'milestone' ? 'Milestone contract' : mt === 'pk' ? 'PK · multi-outcome' : 'Creator perpetual · simulated') + '</div>';
    h += '<h3>' + esc(mk.question) + '</h3>';
    h += '<p>' + (mt === 'perps' ? ('Mark ' + mk.mark + ' · funding ' + (mk.funding >= 0 ? '+' : '') + mk.funding + '%') : mt === 'pk' ? ('Leader ' + esc(mk.outcomes[0].cur >= mk.outcomes[1].cur ? mk.outcomes[0].name : mk.outcomes[1].name)) : (mk.cur + '¢ YES · expiry ' + esc(mk.deadline))) + '</p></div><div class="pt-trade-b">';

    if (mt === 'milestone') {
      var yes = mk.cur, no = 100 - yes;
      h += '<div class="pt-side-toggle"><button class="pt-side-btn yes ' + (S.side === 'YES' ? 'on' : '') + '" data-side="YES"><small>Buy YES</small><b>' + yes + '¢</b></button>';
      h += '<button class="pt-side-btn no ' + (S.side === 'NO' ? 'on' : '') + '" data-side="NO"><small>Buy NO</small><b>' + no + '¢</b></button></div>';
      h += amountField();
      var px = S.side === 'NO' ? no : yes;
      var shares = round(S.amount / (px / 100), 1);
      h += '<div class="pt-kv"><span>Avg entry odds</span><b>' + px + '¢</b></div>';
      h += '<div class="pt-kv"><span>Current odds</span><b>' + yes + '¢ YES</b></div>';
      h += '<div class="pt-kv"><span>Shares</span><b>' + shares + '</b></div>';
      h += '<div class="pt-kv"><span>Max payout</span><b class="pos">' + money(shares) + '</b></div>';
      h += '<div class="pt-kv"><span>Payout multiple</span><b>' + mk.mult + '×</b></div>';
      h += '<div class="pt-kv"><span>Settlement</span><b>' + esc(mk.source) + '</b></div>';
      h += '<button class="pt-order ' + (S.side === 'NO' ? 'no' : 'yes') + '" data-order>Place simulated ' + S.side + '</button>';
    } else if (mt === 'pk') {
      h += '<div class="pt-ladder">';
      mk.outcomes.forEach(function (o, i) {
        var chg = o.cur - o.prev;
        h += '<div class="pt-ladder-row ' + (S.outcome === i ? 'on' : '') + '" data-outcome="' + i + '"><span class="lr-dot" style="background:' + o.color + '"></span><span class="lr-name">' + esc(o.name) + '</span><span class="lr-odds">' + o.cur + '¢</span><span class="lr-chg ' + (chg >= 0 ? 'up' : 'down') + '" style="color:' + (chg >= 0 ? COL.up : COL.down) + '">' + (chg >= 0 ? '+' : '') + chg + '</span></div>';
      });
      h += '</div>';
      h += amountField();
      var oc = mk.outcomes[S.outcome];
      h += '<div class="pt-kv"><span>Selected</span><b>' + esc(oc.name) + '</b></div>';
      h += '<div class="pt-kv"><span>Price</span><b>' + oc.cur + '¢</b></div>';
      h += '<div class="pt-kv"><span>Max payout</span><b class="pos">' + money(round(S.amount / (oc.cur / 100), 2)) + '</b></div>';
      h += '<div class="pt-kv"><span>Settlement</span><b>' + esc(mk.source) + '</b></div>';
      h += '<button class="pt-order yes" data-order>Buy ' + esc(oc.name) + '</button>';
    } else {
      h += '<div class="pt-side-toggle"><button class="pt-side-btn long ' + (S.side === 'LONG' ? 'on' : '') + '" data-side="LONG"><small>Long</small><b>' + mk.mark + '</b></button>';
      h += '<button class="pt-side-btn short ' + (S.side === 'SHORT' ? 'on' : '') + '" data-side="SHORT"><small>Short</small><b>' + mk.mark + '</b></button></div>';
      h += '<div class="pt-field"><label>Leverage</label><div class="pt-lev">' + [1, 2, 3, 5].map(function (l) { return '<button class="' + (S.leverage === l ? 'on' : '') + '" data-lev="' + l + '">' + l + '×</button>'; }).join('') + '</div></div>';
      h += amountField();
      var expo = S.amount * S.leverage;
      var liq = S.side === 'LONG' ? round(mk.mark * (1 - 0.85 / S.leverage), 1) : round(mk.mark * (1 + 0.85 / S.leverage), 1);
      h += '<div class="pt-kv"><span>Mark price</span><b>' + mk.mark + '</b></div>';
      h += '<div class="pt-kv"><span>Total exposure</span><b>' + money(expo) + '</b></div>';
      h += '<div class="pt-kv"><span>Est. liquidation</span><b class="warn">idx ' + liq + '</b></div>';
      h += '<div class="pt-kv"><span>Funding rate</span><b class="' + (mk.funding >= 0 ? 'pos' : 'neg') + '">' + (mk.funding >= 0 ? '+' : '') + mk.funding + '% /8h</b></div>';
      h += '<div class="pt-kv"><span>Open interest</span><b>' + money(mk.oi) + '</b></div>';
      h += '<button class="pt-order ' + (S.side === 'SHORT' ? 'short' : 'long') + '" data-order>' + S.side + ' ' + S.leverage + '× simulated</button>';
    }
    h += '<p class="pt-sim">Simulated · no real money moves. Contract data is separate from Proof-of-Attention estimates and never settles PoA.</p>';
    // depth
    h += '<div class="pt-depth"><div class="pt-kv"><span>24h volume</span><b>' + money(mt === 'perps' ? mk.oi * 1.4 : (mk.vol ? mk.vol[NDAYS - 1].v * 42 : 12000)) + '</b></div>';
    h += '<div class="pt-kv"><span>Spread</span><b>' + (mt === 'perps' ? '0.2' : '2') + (mt === 'perps' ? ' idx' : '¢') + '</b></div>';
    h += '<div class="pt-kv"><span>Liquidity</span><b>' + (m.evidence.grade === 'HIGH' ? 'Deep' : 'Moderate') + '</b></div></div>';
    h += '</div></div>';
    return h;
  }
  function amountField() {
    return '<div class="pt-field"><label>Simulated amount</label><div class="pt-amt"><span>$</span><input id="ptAmt" type="number" min="1" value="' + S.amount + '" inputmode="numeric" aria-label="Simulated amount"/></div>' +
      '<div class="pt-chips">' + [10, 25, 100, 250].map(function (v) { return '<button class="pt-chip ' + (S.amount === v ? 'on' : '') + '" data-amt="' + v + '">$' + v + '</button>'; }).join('') + '</div></div>';
  }

  function template(m) {
    var mt = S.mtype, asOfT = tOf(S.asOf);
    var last = m.days[S.asOf] || m.days[m.days.length - 1];
    var comp = m.comp[S.asOf] || m.comp[m.comp.length - 1];
    var chart = buildChart(m, S);
    S.geo = chart.geo;

    var h = '<div class="pt-scrim" data-close></div><div class="pt-term" role="dialog" aria-modal="true" aria-label="Proof of Attention terminal for ' + esc(m.name) + '">';

    /* header */
    h += '<div class="pt-head"><div class="pt-id"><div class="pt-av" style="background:hsl(' + m.hue + ' 55% 62%)">' + esc(m.initials) + '</div>';
    h += '<div class="pt-id-t"><div class="pt-name">' + esc(m.name) + '</div><div class="pt-sub">' + esc(m.handle) + ' · Proof of Attention</div>';
    h += '<div class="pt-plats">' + m.platforms.slice(0, 4).map(function (p) { return '<span class="pt-plat">' + esc(p.label) + '</span>'; }).join('') + '</div></div></div>';
    h += '<div class="pt-head-stats">';
    h += '<div class="pt-hstat"><small>PoA band</small><b class="tone-' + bandTone(m.band) + '">' + bandWord(m.band) + '</b></div>';
    h += '<div class="pt-hstat"><small>Evidence</small><b>' + m.evidence.grade[0] + m.evidence.grade.slice(1).toLowerCase() + ' ' + m.evidence.score + '</b></div>';
    h += '<div class="pt-hstat"><small>Market</small><b class="tone-' + m.status.tone + '">' + esc(m.status.label) + '</b></div>';
    h += '</div><button class="pt-x" data-close aria-label="Close terminal">' + ICO.x + '</button></div>';

    /* controls */
    h += '<div class="pt-controls">';
    h += '<div class="pt-tabs" role="tablist" aria-label="Market type">' + ['milestone', 'pk', 'perps'].map(function (t) {
      return '<button class="pt-tab ' + (mt === t ? 'on' : '') + '" role="tab" aria-selected="' + (mt === t) + '" data-mtype="' + t + '"><span class="dotmk"></span>' + m.markets[t].label + '</button>';
    }).join('') + '</div>';
    h += '<span class="pt-ctl-label">Range</span><div class="pt-seg" role="group" aria-label="Chart range">' + [['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['1y', '1Y'], ['all', 'ALL']].map(function (r) { return '<button class="' + (S.range === r[0] ? 'on' : '') + '" data-range="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>';
    h += '<span class="pt-ctl-label">Candle</span><div class="pt-seg" aria-label="Candle interval"><button disabled title="Intraday snapshots not retained in this fixture">4H</button><button class="' + (S.interval === '1d' ? 'on' : '') + '" data-interval="1d">1D</button><button class="' + (S.interval === '1w' ? 'on' : '') + '" data-interval="1w">1W</button></div>';
    // replay
    h += '<div class="spacer"></div><div class="pt-replay"><div class="pt-replay-btns">';
    h += '<button class="pt-rb" data-replay="prev" aria-label="Previous snapshot">' + ICO.prev + '</button>';
    h += '<button class="pt-rb play ' + (S.playing ? 'on' : '') + '" data-replay="play" aria-label="' + (S.playing ? 'Pause replay' : 'Play replay') + '">' + (S.playing ? ICO.pause : ICO.play) + '</button>';
    h += '<button class="pt-rb" data-replay="next" aria-label="Next snapshot">' + ICO.next + '</button>';
    h += '<button class="pt-rb" data-replay="reset" aria-label="Reset to latest">' + ICO.reset + '</button></div>';
    var pct = S.asOf / (NDAYS - 1) * 100;
    h += '<input class="pt-scrub" type="range" min="0" max="' + (NDAYS - 1) + '" value="' + S.asOf + '" style="--pct:' + pct + '%" aria-label="History scrubber" data-scrub/>';
    h += '<div class="pt-seg" aria-label="Replay speed">' + [1, 2, 4].map(function (sp) { return '<button class="' + (S.speed === sp ? 'on' : '') + '" data-speed="' + sp + '">' + sp + '×</button>'; }).join('') + '</div>';
    h += '<span class="pt-asof">As of <b>' + fdatetime(asOfT) + '</b></span></div>';
    h += '</div>';

    /* disclaimer */
    h += '<div class="pt-disc">' + ICO.info + '<span>Illustrative historical replay · <em>This chart shows changes in captured public attention activity. It is not a creator valuation, market price, probability, or measurement of audience authenticity.</em></span></div>';

    /* body */
    h += '<div class="pt-body"><div class="pt-main">';

    /* summary chips */
    h += '<div class="pt-summary">';
    h += '<div class="pt-scard"><small>Est. authentic attention</small><b>' + (m.summary.authRange ? m.summary.authRange[0] + '–' + m.summary.authRange[1] + '%' : 'Insufficient') + '</b><p>Range, not a point. Composition estimate.</p></div>';
    h += '<div class="pt-scard"><small>Evidence confidence</small><b>' + comp.grade[0] + comp.grade.slice(1).toLowerCase() + confDots(comp.grade) + '</b><p>' + comp.conf + ' / 100 at this timestamp.</p></div>';
    h += '<div class="pt-scard ' + (m.summary.risk.level === 'ELEVATED' ? 'risk' : m.summary.risk.level === 'MEDIUM' ? 'warn' : 'pos') + '"><small>Manipulation / platform risk</small><b>' + m.summary.risk.level[0] + m.summary.risk.level.slice(1).toLowerCase() + '</b><p>100 = higher risk · scored ' + m.summary.risk.score + '.</p></div>';
    h += '<div class="pt-scard pos"><small>Primary evidence</small><b style="font-size:11.5px;font-family:var(--pt-sans);line-height:1.35">' + esc(m.summary.primaryEvidence) + '</b></div>';
    h += '<div class="pt-scard warn"><small>Primary risk</small><b style="font-size:11.5px;font-family:var(--pt-sans);line-height:1.35">' + esc(m.summary.primaryRisk) + '</b></div>';
    h += '<div class="pt-scard"><small>Data coverage</small><b>' + m.summary.coverage.videos + ' vids · ' + (m.summary.coverage.comments || '0') + ' cmts</b><p>' + m.summary.coverage.days + ' days · ' + m.summary.coverage.score + '% source coverage.</p></div>';
    h += '</div>';

    /* chart */
    var mk = m.markets[mt];
    h += '<div class="pt-chartwrap"><div class="pt-chart-head"><div class="pt-chart-title">' + (mt === 'milestone' ? 'Market: implied probability' : mt === 'pk' ? 'Market: outcome probabilities' : 'Market: attention index (perp)') + '<em>+ Public Attention Velocity Index below</em></div>';
    h += '<div class="pt-chart-metrics">';
    if (mt === 'milestone') { var chg = mk.cur - mk.prev; h += '<span class="pt-cm">YES <b>' + mk.cur + '¢</b> <span class="' + (chg >= 0 ? 'up' : 'down') + '">' + (chg >= 0 ? '+' : '') + chg + '</span></span>'; }
    else if (mt === 'pk') { h += '<span class="pt-cm">' + esc(mk.outcomes[0].name) + ' <b>' + mk.outcomes[0].cur + '¢</b></span><span class="pt-cm">' + esc(mk.outcomes[1].name) + ' <b>' + mk.outcomes[1].cur + '¢</b></span>'; }
    else { h += '<span class="pt-cm">Mark <b>' + mk.mark + '</b></span><span class="pt-cm">OI <b>' + money(mk.oi) + '</b></span>'; }
    h += '<span class="pt-cm">Velocity <b>' + last.c + '</b></span><span class="pt-cm">Δview <b>' + fmt(Math.max(0, last.vol)) + '</b></span>';
    h += '</div></div>';
    h += '<figure class="pt-figure" tabindex="0" role="figure" aria-label="Market and attention chart. Use left and right arrows to move through time.">' + chart.svg;
    h += '<div class="pt-tip"></div>';
    h += '<figcaption class="pt-sr">Public Attention Velocity Index at ' + fdate(asOfT) + ' is ' + last.c + ' (100 = prior 28-day median). Market ' + (mt === 'milestone' ? 'implied probability ' + mk.cur + '%' : mt === 'perps' ? 'index ' + mk.mark : 'lead ' + mk.outcomes[0].cur + '%') + '.</figcaption>';
    h += '</figure>';
    // event rail
    h += '<div class="pt-rail">' + m.events.filter(function (e) { return e.idx <= S.asOf; }).map(function (e) {
      return '<button class="pt-rail-chip" data-ev="' + e.id + '"><span class="ev-dot ' + e.klass + '"></span>' + fdate(e.t) + ' · ' + esc(e.label) + '</button>';
    }).join('') + '</div>';
    h += '</div>';

    /* synced mini panels */
    h += '<div class="pt-minis">';
    h += miniPanel('PoA confidence', m.confidenceSeries, COL.accent, true);
    h += miniPanel('Attention momentum', m.momentum, COL.up, false);
    h += miniPanel('Content concentration', m.concentration, COL.warn, true);
    h += miniPanel('Comment breadth', m.commentBreadth, COL.accent2, false);
    h += '</div>';

    /* current composition */
    h += block('Composition at selected timestamp', 'Backer estimate · ranges, not exact', compBands(m, comp));
    // ribbon
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Composition history</h4><span class="note">midpoint ribbon · methodology boundary marked</span></div><div class="pt-block-b"><div class="pt-ribbon">' + compRibbon(m.comp, S.geo.start, S.asOf) + '</div><p class="pt-comp-def" style="margin-top:8px">Green credible core · blue passive/transient · amber anomalous · gray unassessed. The dashed line marks the ' + METHODS[1] + ' methodology change — estimates across it are not directly comparable.</p></div></div>';

    /* audit trail / drivers */
    h += block('Key drivers & audit trail', mt + ' market', auditTrail(m));

    /* content contributions */
    h += block('Content contribution', 'sorted by captured-view share', contentList(m));

    /* diagnostic indexes */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Underwriting indexes</h4><span class="note">not averaged into one number</span></div><div class="pt-block-b"><div class="pt-idx-grid">' + m.indexes.map(idxCard).join('') + '</div></div></div>';

    /* durability */
    h += durabilityBlock(m);

    /* evidence explorer */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Evidence explorer</h4><span class="note">' + (S.band ? 'filtered · ' + S.band : 'select a band to filter') + '</span></div><div class="pt-block-b" id="ptEvidence">' + evidenceList(m) + '</div></div>';

    h += '</div>'; // end main

    /* side */
    h += '<div class="pt-side">' + tradePanel(m);
    // position summary
    if (m.bets.length) {
      h += '<div class="pt-block"><div class="pt-block-h"><h4>Your positions</h4><span class="note">pinned to chart</span></div><div class="pt-block-b">';
      m.bets.forEach(function (b, i) {
        var buy = b.side === 'YES' || b.side === 'LONG';
        h += '<div class="pt-kv"><span><span style="color:' + (buy ? COL.up : COL.down) + '">' + (buy ? '▲' : '▼') + '</span> ' + b.side + ' ' + b.market + ' · ' + money(b.size) + '</span><b class="' + (b.pnl >= 0 ? 'pos' : 'neg') + '">' + (b.pnl >= 0 ? '+' : '') + money(b.pnl) + '</b></div>';
      });
      h += '<p class="pt-sim" style="text-align:left">Entry pins: ' + m.bets.map(function (b) { return b.entryLabel; }).join(' · ') + '. Markers appear on the market chart above and in portfolio replay.</p></div></div>';
    }
    h += '</div>'; // end side
    h += '</div>'; // end body

    /* sources footer */
    h += '<div class="pt-sources"><div class="row1"><span>Methodology <b>' + comp.method + '</b></span><span>Platform <b>YouTube (public)</b></span><span>Window <b>90D</b></span><span>As of <b>' + fdatetime(asOfT) + '</b></span><span>Computed <b>' + fdatetime(NOW) + '</b></span><span>Sampled <b>' + m.summary.coverage.videos + ' videos · ' + (m.summary.coverage.comments || 0) + ' comments</b></span></div>';
    h += '<div class="disclosure">Estimated composition from observable public signals. Backer cannot see device, IP, full-session behavior, traffic-source data, watch time, or platform-private fraud labels. Unavailable fields render as “Unavailable,” never zero.</div>';
    h += '<div class="acts"><button data-methodology>Methodology</button><button data-datatable>Open data table</button><button data-correction2>Report incorrect data</button><button data-limitations>Limitations</button></div></div>';

    /* event side card + live region */
    h += '<div class="pt-evcard" id="ptEvCard"></div>';
    h += '<div class="pt-sr" aria-live="polite" id="ptLive"></div>';
    h += '</div>';
    return h;
  }

  function miniPanel(label, series, color, band) {
    var d = series[S.asOf] || series[series.length - 1];
    return '<div class="pt-mini"><div class="pt-mini-h"><small>' + label + '</small><b>' + Math.round(d ? d.v : 0) + '</b></div>' + sparkline(series, S.geo.start, S.asOf, color, band) + '</div>';
  }
  function block(title, note, body) {
    return '<div class="pt-block"><div class="pt-block-h"><h4>' + title + '</h4><span class="note">' + note + '</span></div><div class="pt-block-b">' + body + '</div></div>';
  }
  function compBands(m, comp) {
    var defs = {
      core: ['Credible core', 'cseg-core', 'Attention that appears authentic and durable on public signals.'],
      passive: ['Passive / transient', 'cseg-passive', 'Real but low-intent or one-time exposure with weak persistence.'],
      anom: ['Anomalous signal', 'cseg-anom', 'Statistically unusual activity that warrants scrutiny — not an accusation.'],
      unassessed: ['Unassessed', 'cseg-unassessed', 'Attention Backer cannot yet classify from available public data.']
    };
    var keyMap = { core: 'core', passive: 'passive', anom: 'anom', unassessed: 'un' };
    return Object.keys(defs).map(function (k) {
      var rk = keyMap[k], point = comp.point[rk], rng = comp.ranges[rk];
      var selKey = { core: 'Credible core', passive: 'Passive / transient', anom: 'Anomalous signal', unassessed: 'Unassessed' }[k];
      var sel = S.band === selKey, dim = S.band && !sel;
      var lo = rng[0], hi = rng[1], w = Math.max(2, hi - lo);
      return '<div class="pt-comp-band ' + (sel ? 'sel' : '') + ' ' + (dim ? 'dim' : '') + '" data-band="' + esc(selKey) + '" tabindex="0" role="button" aria-pressed="' + sel + '">' +
        '<div class="pt-comp-top"><span class="cl"><i class="' + defs[k][1] + '"></i>' + defs[k][0] + '</span><span class="cv">' + point + '<small> · ' + lo + '–' + hi + '%</small></span></div>' +
        '<div class="pt-comp-track"><div class="pt-comp-range ' + defs[k][1] + '" style="left:' + lo + '%;width:' + w + '%;opacity:.4"></div><div class="pt-comp-point" style="left:' + point + '%"></div></div>' +
        '<p class="pt-comp-def">' + defs[k][2] + '</p></div>';
    }).join('') + '<p class="pt-comp-def" style="margin-top:2px;color:var(--pt-muted2)">Point estimates total 100. Ranges may overlap and are rounded to 5-point increments. Select a band to filter the Evidence explorer.</p>';
  }
  function auditTrail(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var items = [];
    if (mt === 'milestone') {
      items.push('Implied probability moved from <b>' + mk.prob[Math.max(0, S.asOf - 20)].v + '%</b> to <b class="' + (mk.cur >= mk.prob[Math.max(0, S.asOf - 20)].v ? 'up' : 'down') + '">' + mk.cur + '%</b> over the last 20 sampled days as attention velocity ' + (m.days[S.asOf].c > 100 ? 'held above baseline' : 'softened below baseline') + '.');
      items.push('Odds rose after uploads around ' + fdate(tOf(UPLOAD_IDX[4])) + ' outperformed the prior-28d baseline and comment diversity stayed ' + (m.flags.commentsBlackout ? 'partially observed' : 'broad') + '.');
    } else if (mt === 'pk') {
      items.push('<b>' + esc(mk.outcomes[0].name) + '</b> moved from <b>' + mk.outcomes[0].series[Math.max(0, S.asOf - 20)].v + '%</b> to <b class="up">' + mk.outcomes[0].cur + '%</b> after a new upload posted ' + round(m.days[VIRAL_IDX].c / 100, 1) + '× baseline view velocity within the window.');
      items.push('The crossover reflects captured public-view counts only; PoA composition is not used to move market odds.');
    } else {
      items.push('Creator Attention Index marked <b>' + mk.mark + '</b>; the index is driven by ' + mk.drivers.slice(0, 3).join(', ').toLowerCase() + ' and cadence — a continuous creator-attention instrument, not an event contract.');
      items.push('Funding is <b class="' + (mk.funding >= 0 ? 'up' : 'down') + '">' + (mk.funding >= 0 ? '+' : '') + mk.funding + '%</b>; longs ' + (mk.funding >= 0 ? 'pay' : 'receive') + ' this interval. Simulated only.');
    }
    items.push('Data note: ' + (m.summary.coverage.score) + '% source coverage across the window; the ' + fdate(tOf(GAP_IDX)) + ' gap and ' + fdate(tOf(CORR_IDX)) + ' public-count correction are disclosed on the event rail, not interpolated.');
    return '<div class="pt-audit">' + items.map(function (t) { return '<div class="pt-audit-item">' + t + '</div>'; }).join('') + '</div>';
  }
  function contentList(m) {
    return m.content.filter(function (ct) { return ct.publishedIdx <= S.asOf; }).map(function (ct) {
      var eff = ct.effect === 'POSITIVE' ? 'eff-pos' : ct.effect === 'NEGATIVE' ? 'eff-neg' : 'eff-neu';
      return '<div class="pt-content-row" data-content="' + ct.id + '"><div class="pt-thumb" style="background:hsl(' + m.hue + ' 40% 24%)"><i style="background:hsl(' + m.hue + ' 50% 40%)"></i></div>' +
        '<div class="pt-content-m"><div class="ct">' + esc(ct.title) + (ct.flag ? '<span class="flag-tag">' + ct.flag + '</span>' : '') + '</div>' +
        '<div class="cs">' + ct.format.toLowerCase().replace('_', '-') + ' · ' + fdate(ct.publishedAt) + ' · ' + fmt(ct.views) + ' views · ' + fmt(ct.likes) + ' likes · ' + (ct.comments == null ? 'comments n/a' : fmt(ct.comments) + ' cmts') + '</div></div>' +
        '<div class="pt-content-bar"><div class="pct ' + eff + '">' + ct.contributionPct + '%</div><div class="barh"><i style="width:' + ct.contributionPct + '%"></i></div></div></div>';
    }).join('') + '<p class="pt-comp-def" style="margin-top:8px">Contribution = share of captured public views during the selected window. Select an item on the chart events or here for its trajectory. Concentration flags describe distribution, never manipulation.</p>';
  }
  function idxCard(ix) {
    return '<div class="pt-idx"><div class="pt-idx-h"><small>' + ix.key + '</small><b class="' + (ix.inverse ? (ix.score >= 55 ? 'tone-down' : 'tone-up') : (ix.score >= 70 ? 'tone-up' : ix.score >= 45 ? 'tone-warn' : 'tone-down')) + '" style="color:' + (ix.inverse ? (ix.score >= 55 ? COL.down : COL.up) : (ix.score >= 70 ? COL.up : ix.score >= 45 ? COL.warn : COL.down)) + '">' + ix.score + '</b></div>' +
      '<div class="pt-idx-range">' + (ix.range ? ix.range[0] + '–' + ix.range[1] : '±band') + ' · confidence ' + ix.grade.toLowerCase() + (ix.inverse ? ' · 100 = higher risk' : '') + '</div>' +
      '<p>' + esc(ix.interp) + '</p>' +
      '<ul>' + (ix.pos || []).concat(ix.neg || []).slice(0, 2).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '<li class="lim">Limit: ' + esc(ix.lim) + '</li></ul></div>';
  }
  function durabilityBlock(m) {
    var st = m.durabilityState;
    var head = st === 'MEASURED' ? 'Measured Retention — creator-authorized analytics' : st === 'UNAVAILABLE' ? 'Retention unavailable' : 'Attention Durability — public-data proxies';
    var tag = st === 'MEASURED' ? 'measured' : st === 'UNAVAILABLE' ? 'unavail' : '';
    var body;
    if (st === 'UNAVAILABLE') {
      body = '<div class="pt-dur-note">The creator has not connected analytics, and evidence is insufficient for a calibrated durability estimate. Backer does not infer watch time or returning viewers from public view counts.</div>';
    } else if (st === 'MEASURED') {
      body = '<div class="pt-grid2">' + [['Avg. percentage viewed', '48%'], ['Returning-viewer rate', '31%'], ['Measured watch time', '11.4M min'], ['Traffic — browse/search', '54% / 22%']].map(function (r) { return '<div class="pt-kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div><div class="pt-dur-note">Source: creator-authorized YouTube Analytics. Stated as measured, not inferred.</div>';
    } else {
      body = '<div class="pt-grid2">' + m.durProxies.map(function (r) { return '<div class="pt-kv"><span>' + r[0] + '</span><b class="' + (r[1] === 'Unavailable' ? 'warn' : '') + '">' + r[1] + '</b></div>'; }).join('') + '</div><div class="pt-dur-note">These signals estimate durability. They do not measure viewer retention. Backer does not infer watch time from public view counts.</div>';
    }
    return '<div class="pt-block"><div class="pt-block-h"><h4>Durability</h4><span class="pt-dur-state ' + tag + '">' + head + '</span></div><div class="pt-block-b">' + body + '</div></div>';
  }
  function evidenceList(m) {
    var rows = m.evidenceRows.filter(function (e) { return !S.band || bandFilterMatch(S.band, e); });
    var byCat = {};
    rows.forEach(function (e) { (byCat[e.cat] = byCat[e.cat] || []).push(e); });
    var out = '';
    Object.keys(byCat).forEach(function (cat) {
      out += '<div class="pt-ev-cat">' + cat + '</div>';
      byCat[cat].forEach(function (e) {
        var effCol = e.effect === 'POSITIVE' ? COL.up : e.effect === 'NEGATIVE' ? COL.down : COL.muted;
        out += '<div class="pt-ev-row"><div class="pt-ev-top" data-evrow><span class="en">' + esc(e.name) + '<small>' + esc(e.sample) + '</small></span><span class="ev-val ' + (e.unavailable ? 'ev-unavail' : '') + '">' + esc(e.val) + '<small style="color:' + effCol + '">' + e.effect.toLowerCase() + ' · ' + (e.conf ? e.conf.toLowerCase() : '') + '</small></span></div>' +
          '<div class="pt-ev-detail">' + esc(e.explain) + ' <em style="color:var(--pt-muted2)">Benchmark: ' + esc(e.benchmark) + (e.unavailable ? ' · Unavailable — reduces confidence, not an allegation.' : '') + '</em></div></div>';
      });
    });
    return out;
  }
  function bandFilterMatch(band, e) {
    if (band === 'Credible core') return ['Engagement depth', 'Audience breadth', 'Catalog durability', 'Cadence reliability'].indexOf(e.cat) >= 0;
    if (band === 'Passive / transient') return ['Format dependence', 'Participation recurrence'].indexOf(e.cat) >= 0;
    if (band === 'Anomalous signal') return ['Velocity integrity', 'Comment structure', 'Content concentration'].indexOf(e.cat) >= 0;
    if (band === 'Unassessed') return ['Data coverage'].indexOf(e.cat) >= 0;
    return true;
  }

  /* =====================================================================
     PAINT + BIND
     ===================================================================== */
  function paint() {
    ROOT.innerHTML = template(S.model);
    bind();
  }
  function setLive(msg) { var l = document.getElementById('ptLive'); if (l) l.textContent = msg; }

  function bind() {
    var term = ROOT.querySelector('.pt-term');
    // close
    ROOT.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    // market type
    ROOT.querySelectorAll('[data-mtype]').forEach(function (el) { el.addEventListener('click', function () { S.mtype = el.dataset.mtype; S.side = S.mtype === 'perps' ? 'LONG' : 'YES'; S.outcome = 0; track('poa_mode_changed', { mtype: S.mtype }); paint(); }); });
    ROOT.querySelectorAll('[data-range]').forEach(function (el) { el.addEventListener('click', function () { S.range = el.dataset.range; track('poa_timeline_range_changed', { range: S.range }); paint(); }); });
    ROOT.querySelectorAll('[data-interval]').forEach(function (el) { el.addEventListener('click', function () { S.interval = el.dataset.interval; track('poa_candle_interval_changed', { interval: S.interval }); paint(); }); });
    ROOT.querySelectorAll('[data-speed]').forEach(function (el) { el.addEventListener('click', function () { S.speed = +el.dataset.speed; if (S.playing) startReplay(); paint(); }); });
    // replay
    ROOT.querySelectorAll('[data-replay]').forEach(function (el) { el.addEventListener('click', function () { replay(el.dataset.replay); }); });
    var scrub = ROOT.querySelector('[data-scrub]');
    if (scrub) scrub.addEventListener('input', function () { stopReplay(); S.asOf = +scrub.value; track('poa_timeline_scrubbed', { asOf: S.asOf }); paint(); });
    // trade
    ROOT.querySelectorAll('[data-side]').forEach(function (el) { el.addEventListener('click', function () { S.side = el.dataset.side; paint(); }); });
    ROOT.querySelectorAll('[data-outcome]').forEach(function (el) { el.addEventListener('click', function () { S.outcome = +el.dataset.outcome; paint(); }); });
    ROOT.querySelectorAll('[data-lev]').forEach(function (el) { el.addEventListener('click', function () { S.leverage = +el.dataset.lev; paint(); }); });
    ROOT.querySelectorAll('[data-amt]').forEach(function (el) { el.addEventListener('click', function () { S.amount = +el.dataset.amt; paint(); }); });
    var amt = ROOT.querySelector('#ptAmt'); if (amt) amt.addEventListener('input', function () { S.amount = clamp(Math.round(+amt.value || 1), 1, 100000); });
    var order = ROOT.querySelector('[data-order]'); if (order) order.addEventListener('click', placeOrder);
    // composition bands
    ROOT.querySelectorAll('[data-band]').forEach(function (el) {
      var fn = function () { S.band = S.band === el.dataset.band ? null : el.dataset.band; track('poa_composition_segment_selected', { band: S.band }); paint(); };
      el.addEventListener('click', fn);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
    });
    // evidence expand
    ROOT.querySelectorAll('[data-evrow]').forEach(function (el) { el.addEventListener('click', function () { el.parentElement.classList.toggle('open'); track('poa_evidence_expanded', {}); }); });
    // events
    ROOT.querySelectorAll('[data-ev]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); openEventCard(el.dataset.ev); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openEventCard(el.dataset.ev); } }); });
    ROOT.querySelectorAll('[data-content]').forEach(function (el) { el.addEventListener('click', function () { openContentCard(el.dataset.content); }); });
    ROOT.querySelectorAll('[data-bet]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); openBetCard(+el.dataset.bet); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openBetCard(+el.dataset.bet); } }); });
    // footer actions
    var mth = ROOT.querySelector('[data-methodology]'); if (mth) mth.addEventListener('click', function () { track('poa_methodology_viewed', {}); openInfoCard('Methodology', 'Public Attention Velocity Index (' + METHODS[1] + '): for each retained snapshot, each tracked item’s public view-count change since its previous valid snapshot is converted to a daily-equivalent rate, summed across the catalogue, and normalized so 100 = the creator’s median captured public-view velocity over the preceding 28 eligible days. Likes, comments, watch time, market prices and composition estimates are excluded from this index. PoA composition is a separate estimate expressed as ranges with an explicit confidence grade.'); });
    var lim = ROOT.querySelector('[data-limitations]'); if (lim) lim.addEventListener('click', function () { track('poa_limitations_viewed', {}); openInfoCard('Limitations', 'Estimated composition from observable public signals. For this YouTube public-data demo, Backer cannot see watch time, audience-retention curves, returning-viewer rate, traffic-source mix, device/IP, session behavior, demographics, cross-platform dedup, or platform-private fraud labels. Historical values before Backer began retaining snapshots are not reconstructed. All figures are illustrative.'); });
    var dt = ROOT.querySelector('[data-datatable]'); if (dt) dt.addEventListener('click', function () { track('poa_data_table_opened', {}); openDataTable(); });
    [ROOT.querySelector('[data-correction2]')].forEach(function (el) { if (el) el.addEventListener('click', function () { openInfoCard('Report incorrect data', 'Demo action — no report is sent. In production this opens a dispute referencing the selected timestamp (' + fdatetime(tOf(S.asOf)) + '), the affected series, and the source snapshot so underwriting can re-check the public data.'); }); });

    // chart hover / crosshair
    bindChart();
    // keyboard on figure
    var fig = ROOT.querySelector('.pt-figure');
    if (fig) fig.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stopReplay(); S.asOf = clamp(S.asOf - 1, 0, NDAYS - 1); paint(); focusFigure(); announce(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stopReplay(); S.asOf = clamp(S.asOf + 1, 0, NDAYS - 1); paint(); focusFigure(); announce(); }
    });
    // global esc
    ROOT.onkeydown = function (e) { if (e.key === 'Escape') { if (ROOT.querySelector('.pt-evcard.show')) { closeEventCard(); } else { close(); } } };
  }
  function focusFigure() { var f = ROOT.querySelector('.pt-figure'); if (f) try { f.focus(); } catch (e) {} }
  function announce() { var last = S.model.days[S.asOf]; setLive('As of ' + fdate(tOf(S.asOf)) + '. Velocity index ' + last.c + '. Evidence confidence ' + (S.model.comp[S.asOf].grade) + '.'); }

  function bindChart() {
    var svg = ROOT.querySelector('.pt-svg');
    var overlay = ROOT.querySelector('.pt-plot-overlay');
    var tip = ROOT.querySelector('.pt-tip');
    var cross = ROOT.querySelector('.pt-crosshair');
    if (!svg || !overlay || !tip) return;
    var geo = S.geo, m = S.model;
    function move(clientX, clientY) {
      var rect = svg.getBoundingClientRect();
      var scaleX = geo.W / rect.width;
      var svgX = (clientX - rect.left) * scaleX;
      // nearest candle
      var best = null, bd = 1e9;
      geo.candles.forEach(function (d, i) { var cx = geo.padL + i * geo.bw + geo.bw / 2; var dd = Math.abs(cx - svgX); if (dd < bd) { bd = dd; best = { d: d, cx: cx }; } });
      if (!best) return;
      cross.style.display = 'block';
      cross.querySelector('.chx').setAttribute('x1', best.cx);
      cross.querySelector('.chx').setAttribute('x2', best.cx);
      var d = best.d, mk = m.markets[S.mtype];
      var mval = S.mtype === 'milestone' ? mk.prob[d.idx].v + '¢' : S.mtype === 'perps' ? (mk.ohlc[d.idx] ? 'idx ' + mk.ohlc[d.idx].c : '—') : (mk.outcomes[0].name + ' ' + mk.outcomes[0].series[d.idx].v + '¢');
      var comp = m.comp[d.idx];
      var ev = m.events.filter(function (e) { return e.idx === d.idx; })[0];
      var html = '<div class="tt-time">' + fdatetime(d.t) + (d.status !== 'VALID' ? ' · ' + d.status : '') + '</div>';
      html += '<div class="tt-row"><span>Market</span><b>' + mval + '</b></div>';
      html += '<div class="tt-row"><span>Velocity index</span><b>' + d.c + '</b></div>';
      html += '<div class="tt-row"><span>Captured Δviews</span><b>' + (d.vol < 0 ? '<span class="down">' + fmt(d.vol) + '</span>' : fmt(d.vol)) + '</b></div>';
      html += '<div class="tt-row"><span>PoA estimate</span><b>' + comp.point.core + '/' + comp.point.passive + '/' + comp.point.anom + '/' + comp.point.un + '</b></div>';
      html += '<div class="tt-row"><span>Confidence</span><b class="' + (comp.grade === 'HIGH' ? 'up' : comp.grade === 'LOW' ? 'warn' : '') + '">' + comp.grade + '</b></div>';
      html += '<div class="tt-row"><span>Coverage</span><b>' + d.coverage + '%</b></div>';
      if (ev) html += '<div class="tt-note">◆ ' + esc(ev.label) + '</div>';
      tip.innerHTML = html;
      tip.classList.add('show');
      var wrap = ROOT.querySelector('.pt-figure').getBoundingClientRect();
      var tx = clientX - wrap.left + 14; if (tx > wrap.width - 200) tx = clientX - wrap.left - 200;
      tip.style.left = clamp(tx, 4, wrap.width - 190) + 'px';
      tip.style.top = clamp(clientY - wrap.top - 10, 4, wrap.height - 150) + 'px';
    }
    overlay.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    overlay.addEventListener('mouseleave', function () { tip.classList.remove('show'); cross.style.display = 'none'; });
    overlay.addEventListener('touchstart', function (e) { if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    overlay.addEventListener('touchmove', function (e) { if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  }

  /* ---- side cards ---- */
  function evCard() { return ROOT.querySelector('#ptEvCard'); }
  function showCard(html) { var c = evCard(); c.innerHTML = html; c.classList.add('show'); var x = c.querySelector('[data-evx]'); if (x) x.addEventListener('click', closeEventCard); }
  function closeEventCard() { var c = evCard(); if (c) { c.classList.remove('show'); c.innerHTML = ''; } }
  function cardHead(k, title) { return '<div class="pt-evcard-h"><div><div class="evk">' + esc(k) + '</div><h5>' + esc(title) + '</h5></div><button class="pt-x" data-evx aria-label="Close" style="margin-left:auto;width:30px;height:30px">' + ICO.x + '</button></div>'; }
  function openEventCard(id) {
    var e = S.model.events.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    track('poa_timeline_event_selected', { id: id });
    var h = cardHead(e.type.replace(/_/g, ' '), e.label);
    h += '<div class="pt-evcard-b"><div class="pt-kv"><span>Timestamp</span><b>' + fdatetime(e.t) + '</b></div>';
    h += '<div class="pt-kv"><span>Observed change</span><b>' + esc(e.delta) + '</b></div>';
    h += '<div class="pt-kv"><span>Source</span><b>' + esc(e.source) + '</b></div>';
    h += '<div class="pt-kv"><span>Coverage</span><b>' + e.coverage + '%</b></div>';
    h += '<div class="pt-kv"><span>Effect on PoA</span><b class="' + (e.effect === 'POSITIVE' ? 'pos' : e.effect === 'NEGATIVE' ? 'neg' : '') + '">' + e.effect.toLowerCase() + '</b></div>';
    h += '<p style="margin-top:9px">' + esc(e.explain) + '</p></div>';
    showCard(h);
  }
  function openContentCard(id) {
    var ct = S.model.content.filter(function (x) { return x.id === id; })[0]; if (!ct) return;
    track('poa_content_selected', { id: id });
    var h = cardHead('Content · ' + ct.format.toLowerCase().replace('_', '-'), ct.title);
    h += '<div class="pt-evcard-b"><div class="pt-kv"><span>Published</span><b>' + fdatetime(ct.publishedAt) + '</b></div>';
    h += '<div class="pt-kv"><span>Views / likes</span><b>' + fmt(ct.views) + ' / ' + fmt(ct.likes) + '</b></div>';
    h += '<div class="pt-kv"><span>Comments</span><b>' + (ct.comments == null ? 'Unavailable' : fmt(ct.comments)) + '</b></div>';
    h += '<div class="pt-kv"><span>Captured-view share</span><b>' + ct.contributionPct + '%</b></div>';
    h += '<div class="pt-kv"><span>Engagement depth</span><b>' + ct.engagementDepth + '</b></div>';
    h += '<div class="pt-kv"><span>Comment diversity</span><b>' + ct.diversity + '</b></div>';
    h += '<div class="pt-kv"><span>Evidence confidence</span><b>' + ct.conf + '</b></div>';
    h += '<div class="pt-kv"><span>Creator-level effect</span><b class="' + (ct.effect === 'POSITIVE' ? 'pos' : ct.effect === 'NEGATIVE' ? 'neg' : '') + '">' + ct.effect.toLowerCase() + '</b></div>';
    h += '<p style="margin-top:9px">This item contributed ' + ct.contributionPct + '% of captured views during the selected window' + (ct.flag === 'CONCENTRATION' ? ' and increased creator-level concentration risk.' : ct.flag === 'SHORTS-DEPENDENT' ? ' via Shorts-format reach, which limits durability uplift.' : '.') + '</p></div>';
    showCard(h);
  }
  function openBetCard(i) {
    var b = S.model.bets[i]; if (!b) return;
    var buy = b.side === 'YES' || b.side === 'LONG';
    var h = cardHead('Position · ' + b.market, b.side + ' ' + money(b.size) + (b.real ? ' (recorded)' : ''));
    h += '<div class="pt-evcard-b"><div class="pt-kv"><span>Placed</span><b>' + fdatetime(b.t) + '</b></div>';
    h += '<div class="pt-kv"><span>Side</span><b class="' + (buy ? 'pos' : 'neg') + '">' + b.side + '</b></div>';
    h += '<div class="pt-kv"><span>Entry</span><b>' + esc(b.entryLabel) + '</b></div>';
    h += '<div class="pt-kv"><span>Size</span><b>' + money(b.size) + '</b></div>';
    h += '<div class="pt-kv"><span>Status</span><b>' + b.status + '</b></div>';
    h += '<div class="pt-kv"><span>Simulated P/L</span><b class="' + (b.pnl >= 0 ? 'pos' : 'neg') + '">' + (b.pnl >= 0 ? '+' : '') + money(b.pnl) + '</b></div>';
    h += '<p style="margin-top:9px">Marker pinned to ' + fdate(b.t) + ' on the market chart. This position links back to the same timestamp in portfolio replay.</p></div>';
    showCard(h);
  }
  function openInfoCard(title, body) { showCard(cardHead('Info', title) + '<div class="pt-evcard-b"><p>' + esc(body) + '</p></div>'); }
  function openDataTable() {
    var rows = S.model.days.filter(function (d) { return d.idx <= S.asOf; }).slice(-40);
    var h = cardHead('Data table', 'Attention velocity — last ' + rows.length + ' days');
    h = '<div class="pt-evcard-h"><div><div class="evk">Accessible data</div><h5>Attention velocity + composition</h5></div><button class="pt-x" data-evx aria-label="Close" style="margin-left:auto;width:30px;height:30px">' + ICO.x + '</button></div>';
    h += '<div class="pt-evcard-b" style="padding:0"><div class="pt-table-wrap"><table class="pt-table"><thead><tr><th>Date</th><th>O</th><th>H</th><th>L</th><th>C</th><th>Δviews</th><th>Cov%</th><th>Core</th><th>Conf</th><th>Status</th></tr></thead><tbody>';
    rows.forEach(function (d) { var cp = S.model.comp[d.idx]; h += '<tr><td>' + fdate(d.t) + '</td><td>' + d.o + '</td><td>' + d.h + '</td><td>' + d.l + '</td><td>' + d.c + '</td><td>' + fmt(d.vol) + '</td><td>' + d.coverage + '</td><td>' + cp.point.core + '</td><td>' + cp.grade + '</td><td>' + d.status + '</td></tr>'; });
    h += '</tbody></table></div></div>';
    var c = evCard(); c.style.width = 'min(560px,calc(100% - 32px))'; showCard(h);
  }

  /* ---- order ---- */
  function placeOrder() {
    track('position_started_after_poa', { mtype: S.mtype, side: S.side, amount: S.amount });
    var m = S.model;
    var mtLabel = S.mtype === 'milestone' ? S.side + ' ' + money(S.amount) : S.mtype === 'pk' ? 'Buy ' + m.markets.pk.outcomes[S.outcome].name + ' ' + money(S.amount) : S.side + ' ' + S.leverage + '× ' + money(S.amount);
    // add a bet marker at current asOf and repaint
    var entry = S.mtype === 'perps' ? m.markets.perps.mark : (S.mtype === 'milestone' ? (S.side === 'NO' ? 100 - m.markets.milestone.cur : m.markets.milestone.cur) : m.markets.pk.outcomes[S.outcome].cur);
    m.bets.push({ idx: S.asOf, t: tOf(S.asOf), side: S.mtype === 'pk' ? 'YES' : S.side, market: S.mtype, size: S.amount, entry: entry, entryLabel: S.mtype === 'perps' ? 'idx ' + entry : entry + '¢', status: 'OPEN', pnl: 0, real: true });
    m.focusBetIdx = S.asOf;
    if (window.__backerToast) try { window.__backerToast('Simulated position recorded · ' + mtLabel); } catch (e) {}
    paint();
    setLive('Simulated position placed: ' + mtLabel + '. Marker added to the chart.');
  }

  /* ---- replay ---- */
  function replay(action) {
    if (action === 'prev') { stopReplay(); S.asOf = clamp(S.asOf - 1, 0, NDAYS - 1); paint(); }
    else if (action === 'next') { stopReplay(); S.asOf = clamp(S.asOf + 1, 0, NDAYS - 1); paint(); }
    else if (action === 'reset') { stopReplay(); S.asOf = NDAYS - 1; paint(); }
    else if (action === 'play') { if (S.playing) stopReplay(); else startReplay(); }
  }
  function startReplay() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setLive('Reduced motion is on — use step controls to replay.'); return; }
    stopReplay(); S.playing = true;
    if (S.asOf >= NDAYS - 1) S.asOf = Math.max(0, NDAYS - 1 - { '7d': 7, '30d': 30, '90d': 90, '1y': 120, 'all': 120 }[S.range] || 60);
    track('poa_replay_started', {});
    S.timer = setInterval(function () {
      S.asOf++;
      if (S.asOf >= NDAYS - 1) { S.asOf = NDAYS - 1; stopReplay(); paint(); return; }
      paint();
    }, 900 / S.speed);
    paint();
  }
  function stopReplay() { if (S.timer) { clearInterval(S.timer); S.timer = null; } if (S.playing) { S.playing = false; track('poa_replay_paused', {}); } }

  /* =====================================================================
     OPEN / CLOSE
     ===================================================================== */
  function ensureRoot() {
    if (ROOT) return ROOT;
    ROOT = document.createElement('div');
    ROOT.className = 'poa-term-root';
    ROOT.setAttribute('role', 'dialog');
    document.body.appendChild(ROOT);
    return ROOT;
  }
  function open(ctx) {
    ctx = ctx || {};
    ensureRoot();
    var seed = ctx.seed || (ctx.creator && ctx.creator.id) || (ctx.position && ('pos_' + ctx.position.id)) || ctx.id || ctx.name || 'creator';
    ctx.seed = seed;
    var model = buildModel(ctx);
    S = {
      model: model, mtype: model.defaultMarket, range: '90d', interval: '1d',
      asOf: NDAYS - 1, side: model.defaultMarket === 'perps' ? 'LONG' : 'YES', outcome: 0,
      amount: 25, leverage: 2, band: null, playing: false, timer: null, speed: 1, geo: {}
    };
    lastFocus = document.activeElement;
    ROOT.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    // Park the WebGL shader canvas while the modal is up — a full-screen
    // overlay composited over it causes rasterization stalls on this site.
    var bg = document.getElementById('bg'); if (bg) bg.style.visibility = 'hidden';
    paint();
    track('poa_viewed', { seed: seed });
    track('poa_timeline_viewed', { seed: seed });
    var x = ROOT.querySelector('.pt-x'); if (x) try { x.focus(); } catch (e) {}
  }
  function close() {
    stopReplay();
    if (ROOT) { ROOT.classList.remove('open'); ROOT.innerHTML = ''; }
    document.documentElement.style.overflow = '';
    var bg = document.getElementById('bg'); if (bg) bg.style.visibility = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  /* =====================================================================
     GLOBAL CLICK DELEGATE (capture phase) — opens terminal on any
     creator / PoA / event / bet click across the site.
     ===================================================================== */
  function resolveCreator(id) {
    if (window.BACKER && window.BACKER.byId) { var c = window.BACKER.byId(id); if (c) return c; }
    if (window.MKT && window.MKT.CONTRACTS) { var f = window.MKT.CONTRACTS.filter(function (x) { return x.id === id; })[0]; if (f) return f; }
    return null;
  }
  function openByCreator(id, extra) {
    var c = resolveCreator(id);
    open(Object.assign({ seed: id, creator: c || null, name: c ? c.name : id }, extra || {}));
  }
  function openByPosition(pid) {
    var list = window.__PORTFOLIO_POSITIONS || [];
    var p = list.filter(function (x) { return x.id === pid; })[0];
    if (!p) { openByCreator(pid); return; }
    var nm = p.pk ? p.pk.side : p.title;
    open({ seed: 'pos_' + p.id, name: nm, position: p, rival: p.pk ? (p.pk.side === p.pk.a ? p.pk.b : p.pk.a) : null, defaultMarket: p.inst === 'CONTENT_PK' ? 'pk' : p.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone' });
  }

  function onClickCapture(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.poa-term-root')) return;              // inside terminal → ignore
    var el;
    function claim() { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    if ((el = t.closest('[data-poa-term]'))) { claim(); openByCreator(el.getAttribute('data-poa-term') || el.dataset.creator || el.dataset.profile); return; }
    if ((el = t.closest('.prow[data-id]'))) { claim(); openByPosition(el.getAttribute('data-id')); return; }
    if ((el = t.closest('[data-poa]'))) { claim(); openByCreator(el.getAttribute('data-poa')); return; }
    if ((el = t.closest('[data-profile]'))) { claim(); openByCreator(el.getAttribute('data-profile')); return; }
    if ((el = t.closest('[data-creator]'))) {
      // ignore pure view-nav elements
      if (t.closest('[data-view],[data-nav]')) return;
      claim(); openByCreator(el.getAttribute('data-creator')); return;
    }
  }

  document.addEventListener('click', onClickCapture, true);

  window.PoaTerminal = { open: open, close: close, openByCreator: openByCreator, openByPosition: openByPosition, _build: buildModel };
})();
