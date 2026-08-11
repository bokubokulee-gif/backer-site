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
  function metricNumber(value) {
    if (typeof value === 'number') return value;
    var raw = String(value == null ? '' : value).replace(/[$,\s]/g, '').toUpperCase();
    var mult = /B$/.test(raw) ? 1e9 : /M$/.test(raw) ? 1e6 : /K$/.test(raw) ? 1e3 : 1;
    return (Number(raw.replace(/[KMB]$/, '')) || 0) * mult;
  }
  function money(n) { n = Number(n) || 0; return '$' + (Math.abs(n) >= 1000 ? fmt(n) : round(n, 2)); }
  function tOf(idx) { return NOW - (NDAYS - 1 - idx) * DAY; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fdate(t) { var d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function fdatetime(t) { var d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + String(d.getUTCFullYear()).slice(2) + ' ' + (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':00 UTC'; }
  function gradeOf(sc) { return sc >= 68 ? 'HIGH' : sc >= 42 ? 'MEDIUM' : sc >= 20 ? 'LOW' : 'INSUFFICIENT'; }
  function lastValid(list) {
    for (var i = list.length - 1; i >= 0; i--) if (list[i] && list[i].status !== 'GAP') return list[i];
    return null;
  }

  /* Market fixtures are deterministic and intentionally independent from PoA
     and public-attention series. Each candle represents executed trades only. */
  function makeOddsCandles(key, startPrice, endPrice) {
    var out = [], prev = clamp(startPrice, 3, 97);
    var phase = (hashSeed(key) % 29) / 4;
    var gapAt = 48 + (hashSeed(key + '_gap') % 18);
    for (var i = 0; i < NDAYS; i++) {
      var progress = i / (NDAYS - 1);
      var center = startPrice + (endPrice - startPrice) * progress + Math.sin((i + phase) / 8) * 3.1 + Math.cos((i + phase) / 19) * 1.7;
      var close = round(clamp(center, 3, 97), 1);
      var open = round(prev, 1);
      var isGap = i === gapAt || i === gapAt + 1;
      if (isGap) {
        out.push({ idx: i, t: tOf(i), o: open, h: open, l: open, c: open, last: null, bid: null, ask: null, quoteMid: null, vol: 0, tradeCount: 0, coverage: 100, status: 'GAP' });
        continue;
      }
      var wick = 1.1 + ((i + hashSeed(key)) % 5) * 0.35 + Math.abs(close - open) * 0.28;
      var high = round(clamp(Math.max(open, close) + wick, 0.5, 99.5), 1);
      var low = round(clamp(Math.min(open, close) - wick * 0.8, 0.5, 99.5), 1);
      var spread = round(1.4 + ((i + hashSeed(key + '_spread')) % 4) * 0.35, 1);
      var bid = round(clamp(close - spread / 2, 0.5, 99), 1);
      var ask = round(clamp(close + spread / 2, 1, 99.5), 1);
      var vol = 520 + ((i * 137 + hashSeed(key + '_vol')) % 1450) + Math.round(Math.abs(close - open) * 130);
      var trades = 12 + ((i * 17 + hashSeed(key + '_trades')) % 64);
      out.push({ idx: i, t: tOf(i), o: open, h: high, l: low, c: close, last: close, bid: bid, ask: ask, quoteMid: round((bid + ask) / 2, 1), vol: vol, tradeCount: trades, coverage: 100, status: 'VALID' });
      prev = close;
    }
    return out;
  }
  function complementOddsCandles(list) {
    return list.map(function (d) {
      if (d.status === 'GAP') return { idx: d.idx, t: d.t, o: 100 - d.o, h: 100 - d.l, l: 100 - d.h, c: 100 - d.c, last: null, bid: null, ask: null, quoteMid: null, vol: 0, tradeCount: 0, coverage: d.coverage, status: 'GAP' };
      if (d.status === 'SETTLED') return { idx: d.idx, t: d.t, o: round(100 - d.o, 1), h: round(100 - d.l, 1), l: round(100 - d.h, 1), c: round(100 - d.c, 1), last: round(100 - d.c, 1), bid: null, ask: null, quoteMid: null, vol: 0, tradeCount: 0, coverage: d.coverage, status: 'SETTLED', settlementIdx: d.settlementIdx };
      return { idx: d.idx, t: d.t, o: round(100 - d.o, 1), h: round(100 - d.l, 1), l: round(100 - d.h, 1), c: round(100 - d.c, 1), last: round(100 - d.c, 1), bid: round(100 - d.ask, 1), ask: round(100 - d.bid, 1), quoteMid: round(100 - d.quoteMid, 1), vol: d.vol, tradeCount: d.tradeCount, coverage: d.coverage, status: d.status };
    });
  }
  function makePkCandles(key) {
    var all = [[], [], []], prev = [44, 41, 15];
    var gapAt = 62 + (hashSeed(key + '_pk_gap') % 10);
    for (var i = 0; i < NDAYS; i++) {
      var a0 = 43 + i * 0.07 + Math.sin((i + 2) / 9) * 6;
      var a1 = 42 - i * 0.045 + Math.cos((i + 7) / 11) * 5;
      var a2 = 15 + Math.sin((i + 4) / 14) * 2.2;
      var total = a0 + a1 + a2;
      var closes = [round(a0 / total * 100, 1), round(a1 / total * 100, 1), 0];
      closes[2] = round(100 - closes[0] - closes[1], 1);
      for (var k = 0; k < 3; k++) {
        var isGap = i === gapAt;
        var open = prev[k], close = closes[k];
        if (isGap) {
          all[k].push({ idx: i, t: tOf(i), o: open, h: open, l: open, c: open, last: null, bid: null, ask: null, quoteMid: null, vol: 0, tradeCount: 0, coverage: 100, status: 'GAP' });
          continue;
        }
        var wick = 0.9 + ((i + k * 3) % 4) * 0.3;
        var spread = round(1.6 + ((i + k) % 3) * 0.4, 1);
        var bid = round(clamp(close - spread / 2, 0.5, 99), 1), ask = round(clamp(close + spread / 2, 1, 99.5), 1);
        all[k].push({ idx: i, t: tOf(i), o: open, h: round(clamp(Math.max(open, close) + wick, 0.5, 99.5), 1), l: round(clamp(Math.min(open, close) - wick, 0.5, 99.5), 1), c: close, last: close, bid: bid, ask: ask, quoteMid: round((bid + ask) / 2, 1), vol: 360 + ((i * 83 + k * 251) % 980), tradeCount: 8 + ((i * 11 + k * 7) % 44), coverage: 100, status: 'VALID' });
        prev[k] = close;
      }
    }
    return all;
  }
  function makePerpCandles(key) {
    var out = [], prev = 96 + (hashSeed(key) % 9);
    for (var i = 0; i < NDAYS; i++) {
      var close = round(clamp(98 + i * 0.12 + Math.sin((i + 3) / 8) * 5 + Math.cos((i + 9) / 21) * 3, 62, 168), 1);
      var open = round(prev, 1), wick = 1.3 + (i % 5) * 0.4;
      out.push({ idx: i, t: tOf(i), o: open, h: round(Math.max(open, close) + wick, 1), l: round(Math.min(open, close) - wick * 0.8, 1), c: close, last: close, bid: round(close - 0.2, 1), ask: round(close + 0.2, 1), quoteMid: close, mark: round(close + Math.sin(i / 5) * 0.15, 1), index: round(close - Math.cos(i / 7) * 0.25, 1), vol: 460 + ((i * 149 + hashSeed(key + '_perp_vol')) % 1700), tradeCount: 18 + ((i * 13) % 72), coverage: 100, status: 'VALID' });
      prev = close;
    }
    return out;
  }
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
    var position = ctx.position || null;
    var positionMarketType = position ? (position.inst === 'CONTENT_PK' ? 'pk' : position.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone') : null;
    var name = ctx.name || c.name || 'Creator';
    var handle = ctx.handle || c.handle || ('@' + name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14));
    var hue = c.hue != null ? c.hue : Math.floor(rng() * 360);
    var poaUnavailable = !!(c.poa && c.poa.shown === false);

    /* --- underwriting anchors from real fields when present, else deterministic --- */
    var auth = poaUnavailable ? 50 : c.auth != null ? c.auth : c.poa && c.poa.value != null ? c.poa.value : Math.round(46 + rng() * 46);
    var growth = c.growth != null ? c.growth : Math.round(4 + rng() * 40);
    var followers = c.followers != null ? c.followers : Math.round(3000 + rng() * 400000);
    var observedMetrics = c.oa && c.oa.metrics ? c.oa.metrics : {};
    var observedViews = observedMetrics['Video views'] || observedMetrics['Views'] || observedMetrics['Post views'] || null;
    var monthlyViews = c.monthlyViews != null ? c.monthlyViews : observedViews != null ? observedViews : Math.round(followers * (2 + rng() * 6));
    var mkt = c.mkt || null;
    var contract = c.contract || (mkt && mkt.contract) || null;
    var marketState = position
      ? (position.status === 'ACTIVE' ? 'OPEN' : /^CLOSED_(WON|LOST)$/.test(position.status || '') ? 'RESOLVED' : 'CLOSED')
      : (mkt && mkt.state ? mkt.state : 'ILLUSTRATIVE');
    var evScore = mkt && mkt.evidence ? mkt.evidence.score : c.evidence && c.evidence.value != null ? c.evidence.value : Math.round(clamp(auth - 8 + (rng() - 0.5) * 26, 12, 92));
    var riskScore = mkt && mkt.poa && mkt.poa.components ? mkt.poa.components.risk : Math.round(clamp(100 - auth + (rng() - 0.5) * 24, 4, 88));
    var band = riskScore >= 55 ? 'risk' : auth >= 80 && evScore >= 60 ? 'strong' : evScore < 30 ? 'insufficient' : 'mixed';
    if (poaUnavailable) band = 'insufficient';
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
      if (poaUnavailable) { conf = Math.min(conf, 18); core = 0; passive = 0; anom = 0; un = 100; }
      comp.push({
        idx: j, t: tOf(j), conf: Math.round(conf), grade: gradeOf(conf),
        point: { core: core, passive: passive, anom: anom, un: un },
        method: j >= METHOD_IDX ? METHODS[1] : METHODS[0],
        ranges: poaUnavailable ? { core: [0, 0], passive: [0, 0], anom: [0, 0], un: [100, 100] } : {
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

    /* --- market fixtures — traded data, never derived from attention / PoA --- */
    var positionProgress = position && position.ms && position.ms.progress != null
      ? Number(position.ms.progress)
      : position && position.status === 'CLOSED_WON' ? 100
        : position && position.ms && position.ms.result && position.ms.target
          ? clamp(Number(String(position.ms.result).replace(/[^0-9.]/g, '')) / Math.max(1, Number(String(position.ms.target).replace(/[^0-9.]/g, ''))) * 100, 0, 100)
          : null;
    var progressPct = contract ? clamp(contract.progressPct == null ? 45 : contract.progressPct, 0, 100) : positionProgress == null ? 42 : clamp(positionProgress, 0, 100);
    var contractMult = contract ? Number(contract.mult || 1.8) : 1.8;
    var endProb = clamp(24 + progressPct * 0.62 - (contractMult - 1) * 7 + (hashSeed(seedKey + '_market') % 9), 8, 91);
    var startProb = clamp(endProb - 8 + (hashSeed(seedKey + '_open') % 13), 6, 92);
    var yesCandles = makeOddsCandles(seedKey + '_yes', startProb, endProb);
    var milestoneSettlement = contract && marketState === 'RESOLVED' ? contract.outcome
      : position && position.inst === 'MILESTONE_CONTRACT' && position.status === 'CLOSED_WON' ? 'HIT'
        : position && position.inst === 'MILESTONE_CONTRACT' && position.status === 'CLOSED_LOST' ? 'MISS' : null;
    var settlementIdx = NDAYS - 1;
    if (milestoneSettlement && contract && contract.deadlineLabel) {
      var cutoffTime = Date.parse(contract.deadlineLabel + ' 00:00:00 UTC');
      if (!isNaN(cutoffTime)) settlementIdx = clamp(Math.round((cutoffTime - tOf(0)) / DAY), 0, NDAYS - 1);
    }
    if (milestoneSettlement) {
      var settleYes = milestoneSettlement === 'HIT' ? 100 : 0;
      var settleOpen = settlementIdx > 0 ? yesCandles[settlementIdx - 1].c : yesCandles[0].o;
      for (var settleI = settlementIdx; settleI < NDAYS; settleI++) {
        var settlePoint = yesCandles[settleI];
        var firstSettlement = settleI === settlementIdx;
        yesCandles[settleI] = Object.assign({}, settlePoint, {
          o: firstSettlement ? settleOpen : settleYes,
          h: firstSettlement ? Math.max(settleOpen, settleYes) : settleYes,
          l: firstSettlement ? Math.min(settleOpen, settleYes) : settleYes,
          c: settleYes, last: settleYes, bid: null, ask: null, quoteMid: null,
          vol: 0, tradeCount: 0, status: 'SETTLED', settlementIdx: settlementIdx
        });
      }
    }
    var noCandles = complementOddsCandles(yesCandles);
    var mProb = yesCandles.map(function (d) { return { idx: d.idx, t: d.t, v: d.c }; });
    var mVol = yesCandles.map(function (d) { return { idx: d.idx, t: d.t, v: d.vol }; });
    var rivalName = position && position.pk ? position.pk.b : (ctx.rival || (contract ? 'Field rival' : 'Rival creator'));
    var pkCandles = makePkCandles(seedKey + '_pk');
    var perp = makePerpCandles(seedKey + '_perp');
    if (position && position.pk && marketState === 'RESOLVED') {
      var pickedOutcome = position.pk.side === position.pk.b ? 1 : 0;
      var winningOutcome = position.status === 'CLOSED_WON' ? pickedOutcome : (pickedOutcome === 0 ? 1 : 0);
      pkCandles.forEach(function (series, si) {
        var p0 = series[NDAYS - 1], pOpen = series[NDAYS - 2].c, pClose = si === winningOutcome ? 100 : 0;
        series[NDAYS - 1] = Object.assign({}, p0, { o: pOpen, h: Math.max(pOpen, pClose), l: Math.min(pOpen, pClose), c: pClose, last: pClose, bid: null, ask: null, quoteMid: null, vol: 0, tradeCount: 0, status: 'SETTLED', settlementIdx: NDAYS - 1 });
      });
    }
    if (position && position.perp && position.perp.current != null) {
      var perpPoint = perp[NDAYS - 1], perpOpen = perp[NDAYS - 2].c, perpCurrent = Number(position.perp.current);
      perp[NDAYS - 1] = Object.assign({}, perpPoint, { o: perpOpen, h: Math.max(perpOpen, perpCurrent), l: Math.min(perpOpen, perpCurrent), c: perpCurrent, last: perpCurrent, mark: perpCurrent, index: perpCurrent, bid: round(perpCurrent - 0.2, 1), ask: round(perpCurrent + 0.2, 1), quoteMid: perpCurrent, status: 'VALID' });
    }

    /* --- user fills — exact timestamps, no synthetic fills in "Your fills" --- */
    var bets = [];
    try {
      var raw = JSON.parse(localStorage.getItem('backer_portfolio_v1') || '[]');
      if (c.id) raw.forEach(function (pp) {
        if (pp.id !== c.id) return;
        if (pp.fills && pp.fills.length) {
          pp.fills.forEach(function (f, fi) {
            var idx = clamp(f.idx == null ? 108 + fi : f.idx, 0, NDAYS - 1);
            var market = f.market || 'milestone', outcome = f.outcome || 'YES', action = f.action || 'BUY';
            var entry = Number(f.entry || f.price || (market === 'perps' ? perp[idx].c : outcome === 'NO' ? noCandles[idx].c : yesCandles[idx].c));
            var rawSize = Number(f.size || f.gross || 25);
            var qty = Number(f.quantity || (rawSize / Math.max(market === 'perps' ? entry : entry / 100, 0.01)));
            var size = Number(f.size || f.gross || 25), fee = Number(f.fee == null ? round(size * 0.006, 2) : f.fee);
            bets.push({ idx: idx, t: Number(f.t || tOf(idx)), placedAt: Number(f.placedAt || tOf(idx) - 120000), side: market === 'perps' ? (f.side || 'LONG') : outcome, action: action, outcome: outcome, outcomeLabel: f.outcomeLabel || outcome, market: market, size: size, quantity: qty, entry: entry, entryLabel: market === 'perps' ? 'idx ' + entry : entry + '¢', fee: fee, funding: Number(f.funding || 0), realized: Number(f.realized || 0), status: f.status || 'OPEN', pnl: Number(f.pnl || 0), orderId: f.orderId || ('ORD-' + c.id.toUpperCase() + '-' + (fi + 1)), fillId: f.fillId || ('FILL-' + c.id.toUpperCase() + '-' + (fi + 1)), real: true });
          });
        } else {
          var idx0 = 108, entry0 = yesCandles[idx0].c, invested0 = Number(pp.invested || 25);
          var qty0 = round(invested0 / (entry0 / 100), 2), current0 = Number(pp.value == null ? qty0 * yesCandles[NDAYS - 1].c / 100 : pp.value);
          bets.push({ idx: idx0, t: tOf(idx0), placedAt: tOf(idx0) - 180000, side: 'YES', action: 'BUY', outcome: 'YES', outcomeLabel: 'YES · reaches target', market: 'milestone', size: invested0, quantity: qty0, entry: entry0, entryLabel: entry0 + '¢ estimated', fee: round(invested0 * 0.006, 2), realized: 0, status: 'ESTIMATED_LEGACY', pnl: round(current0 - invested0, 2), orderId: 'LEGACY-' + c.id.toUpperCase(), fillId: 'LEGACY-' + c.id.toUpperCase(), estimated: true, real: true });
        }
      });
    } catch (e) {}
    // portfolio-position focus (from a bet click on portfolio.html)
    if (ctx.position) {
      var P = position, m2 = positionMarketType;
      var sideP = P.perp ? P.perp.side : (P.pk ? 'YES' : 'YES');
      var entryP = P.perp ? P.perp.entry : (m2 === 'pk' ? pkCandles[0][96].c : yesCandles[96].c);
      var sizeP = Number(P.stake || P.invested || 25);
      var pkOutcome = P.pk ? (P.pk.side === P.pk.b ? 'B' : 'A') : 'YES';
      var positionQty = P.perp && P.perp.units != null ? Number(P.perp.units) : round(sizeP / Math.max(entryP / 100, 0.01), 2);
      bets.push({ idx: 96, t: tOf(96), placedAt: tOf(96) - 120000, side: sideP, action: P.perp && P.perp.side === 'SHORT' ? 'SELL' : 'BUY', outcome: P.pk ? pkOutcome : 'YES', outcomeLabel: P.pk ? P.pk.side : (P.perp ? P.perp.side : 'YES · reaches target'), market: m2, size: sizeP, quantity: positionQty, entry: entryP, entryLabel: P.perp ? ('idx ' + entryP) : (entryP + '¢'), fee: P.perp ? 0 : round(sizeP * 0.006, 2), funding: P.perp ? Number(P.perp.funding || 0) : 0, realized: P.realized || 0, status: P.status === 'ACTIVE' ? 'OPEN' : 'CLOSED', pnl: P.pnl != null ? round(P.pnl, 2) : 0, orderId: P.orderId || ('ORD-' + String(P.id).toUpperCase()), fillId: P.fillId || ('FILL-' + String(P.id).toUpperCase()), real: true });
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
    evidence.forEach(function (row, evidenceIndex) { row.availableIdx = Math.min(NDAYS - 1, 8 + evidenceIndex * 9); });

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
    if (poaUnavailable) indexes = indexes.map(function (ix) { return { key: ix.key, score: null, range: null, grade: 'INSUFFICIENT', inverse: ix.inverse, interp: 'Unavailable — the retained public evidence does not support a calibrated estimate.', pos: [], neg: [], lim: 'More retained observations are required.' }; });

    /* --- summary --- */
    var authLo = r5(clamp(auth - (lowConfStrong ? 20 : 10), 0, 100)), authHi = r5(clamp(auth + (lowConfStrong ? 12 : 5), 0, 100));
    var lastConf = comp[NDAYS - 1].conf;
    var summary = {
      authRange: band === 'insufficient' ? null : [authLo, authHi],
      confidence: { score: lastConf, grade: gradeOf(lastConf) },
      risk: poaUnavailable ? { score: null, level: 'UNASSESSED' } : { score: riskScore, level: riskScore >= 55 ? 'ELEVATED' : riskScore >= 30 ? 'MEDIUM' : 'LOW' },
      coverage: { videos: UPLOAD_IDX.length, comments: commentsBlackout ? 0 : 642, days: 90, score: Math.round(days.filter(function (d) { return d.status === 'VALID'; }).length / NDAYS * 100) },
      primaryEvidence: poaUnavailable ? 'Insufficient retained evidence for an underwriting conclusion.' : (auth >= 70 ? 'Stable public engagement breadth across sampled uploads.' : 'A credible audience core appears in the retained public signals.'),
      primaryRisk: poaUnavailable ? 'Risk remains unassessed until source coverage improves.' : (oneHit ? (content[0].contributionPct + '% of recent captured views came from one upload.') : (mkt && mkt.poa && mkt.poa.riskNote ? mkt.poa.riskNote : (riskScore >= 55 ? 'Public evidence shows material anomalies.' : 'Attention is moderately concentrated.')))
    };

    /* --- market meta --- */
    var yesLast = lastValid(yesCandles), noLast = lastValid(noCandles);
    var contractId = contract ? contract.id : ('MKT-' + String(seedKey).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 18));
    var contractVersion = contract ? contract.version : 'v1.0';
    var metricMoney = !!(c.milestone && c.milestone.money);
    var underlyingStart = contract ? Number(contract.baseline || 0) : position && position.ms ? metricNumber(position.ms.start) : Math.round(followers);
    var underlyingTarget = c.milestone && c.milestone.target != null ? Number(c.milestone.target) : position && position.ms ? metricNumber(position.ms.target) : Math.round(followers * 3);
    var underlyingLatest = c.milestone && c.milestone.current != null ? Number(c.milestone.current)
      : position && position.ms && position.ms.result ? metricNumber(position.ms.result)
        : underlyingStart + (underlyingTarget - underlyingStart) * progressPct / 100;
    if (milestoneSettlement === 'HIT') underlyingLatest = Math.max(underlyingLatest, underlyingTarget);
    var underlyingFormat = function (v) { return metricMoney ? money(v) : fmt(v); };
    var underlyingObservations = [];
    var observationEndIdx = milestoneSettlement && contract ? settlementIdx : NDAYS - 1;
    for (var oi = 0; oi < NDAYS; oi++) {
      var observedShare = Math.pow(Math.min(oi, observationEndIdx) / Math.max(1, observationEndIdx), 0.82);
      var observedValue = underlyingStart + (underlyingLatest - underlyingStart) * observedShare;
      var observedProgress = underlyingTarget > 0 ? clamp(observedValue / underlyingTarget * 100, 0, 100) : 0;
      underlyingObservations.push({ idx: oi, t: tOf(oi), value: observedValue, valueLabel: oi >= observationEndIdx && contract ? contract.curLabel : underlyingFormat(observedValue), progress: round(observedProgress, 1) });
    }
    if (milestoneSettlement === 'HIT') underlyingObservations[NDAYS - 1].valueLabel = contract ? contract.curLabel : underlyingFormat(underlyingLatest);
    var markets = {
      milestone: {
        label: 'Milestone', question: position && positionMarketType === 'milestone' ? (position.sub || position.title) : contract ? contract.title : ('Will ' + name.split(' ')[0] + ' hit ' + fmt(followers * 3) + ' subscribers by Oct 31?'),
        deadline: position && positionMarketType === 'milestone' ? (position.deadline || 'On resolution') : contract ? (contract.deadlineLabel || 'Oct 31') : 'Oct 31, 2026',
        source: position && positionMarketType === 'milestone' ? 'Portfolio demo fixture · disclosed public milestone' : contract ? contract.source : 'YouTube public subscriber count',
        state: position && positionMarketType !== 'milestone' ? 'OPEN' : marketState,
        hasTradeHistory: marketState !== 'OPENING_SOON',
        opensInDays: contract ? contract.opensInDays : null,
        settlementOutcome: milestoneSettlement,
        settlementIdx: milestoneSettlement ? settlementIdx : null,
        underlyingMetric: position && position.ms ? (position.sub || 'Public milestone metric') : c.milestone && c.milestone.metric ? c.milestone.metric : 'Public milestone metric',
        currentLabel: underlyingObservations[NDAYS - 1].valueLabel,
        targetLabel: contract ? contract.tgtLabel : underlyingFormat(underlyingTarget),
        underlyingProgress: progressPct,
        observations: underlyingObservations,
        rules: 'Resolves YES if the disclosed public metric meets the target on or before the deadline.',
        id: contractId, version: contractVersion, openedAt: 'Apr 01, 2026 00:00 UTC', listedAt: marketState === 'OPENING_SOON' ? 'Jul 15, 2026 09:00 UTC' : null, dataLatency: '15 min delayed fixture',
        prob: mProb, vol: mVol, candles: yesCandles,
        outcomes: [
          { id: 'YES', name: 'YES · reaches target', color: COL.up, candles: yesCandles, series: mProb, cur: yesLast.c, prev: yesCandles[NDAYS - 8].c, bid: yesLast.bid, ask: yesLast.ask, norm: yesLast.c },
          { id: 'NO', name: 'NO · misses target', color: COL.gray, candles: noCandles, series: noCandles.map(function (d) { return { idx: d.idx, t: d.t, v: d.c }; }), cur: noLast.c, prev: noCandles[NDAYS - 8].c, bid: noLast.bid, ask: noLast.ask, norm: noLast.c }
        ],
        mult: contractMult, cur: yesLast.c, prev: yesCandles[NDAYS - 8].c, progress: progressPct
      },
      pk: {
        label: 'PK', question: position && position.pk ? (position.title + ' · ' + position.pk.metric) : 'Which outcome records the most rule-defined views in the next upload window?',
        state: position && positionMarketType === 'pk' ? marketState : 'OPEN',
        settlementIdx: position && positionMarketType === 'pk' && marketState === 'RESOLVED' ? NDAYS - 1 : null,
        outcomes: [
          { id: 'A', name: position && position.pk ? position.pk.a : name.split(' ')[0], color: PK_COLORS[0], candles: pkCandles[0], series: pkCandles[0].map(function (d) { return { idx: d.idx, t: d.t, v: d.c }; }), cur: lastValid(pkCandles[0]).c, prev: pkCandles[0][NDAYS - 8].c, bid: lastValid(pkCandles[0]).bid, ask: lastValid(pkCandles[0]).ask, norm: lastValid(pkCandles[0]).c },
          { id: 'B', name: rivalName, color: PK_COLORS[1], candles: pkCandles[1], series: pkCandles[1].map(function (d) { return { idx: d.idx, t: d.t, v: d.c }; }), cur: lastValid(pkCandles[1]).c, prev: pkCandles[1][NDAYS - 8].c, bid: lastValid(pkCandles[1]).bid, ask: lastValid(pkCandles[1]).ask, norm: lastValid(pkCandles[1]).c },
          { id: 'TIE', name: 'Tie / no winner', color: PK_COLORS[2], candles: pkCandles[2], series: pkCandles[2].map(function (d) { return { idx: d.idx, t: d.t, v: d.c }; }), cur: lastValid(pkCandles[2]).c, prev: pkCandles[2][NDAYS - 8].c, bid: lastValid(pkCandles[2]).bid, ask: lastValid(pkCandles[2]).ask, norm: lastValid(pkCandles[2]).c }
        ],
        id: 'PK-' + contractId, version: 'v1.0', deadline: position && position.pk ? (position.deadline || 'Rule-defined window') : 'Next eligible upload + 72h', openedAt: 'May 10, 2026 00:00 UTC', dataLatency: '15 min delayed fixture',
        source: position && position.pk ? ('Portfolio demo fixture · ' + position.pk.metric) : 'YouTube public 72h view counts', rules: 'Resolves to the outcome with the highest comparable public 72h view count. Tie is a separate outcome.'
      },
      perps: {
        label: 'Perps', question: (position && position.perp ? position.title : name.split(' ')[0]) + ' Attention Index — perpetual', indexName: 'Creator Attention Index',
        state: position && positionMarketType === 'perps' ? marketState : 'OPEN',
        id: 'PERP-' + contractId, version: 'v1.1', openedAt: 'Mar 15, 2026 00:00 UTC', dataLatency: '5 min delayed fixture',
        ohlc: perp, funding: round(((hashSeed(seedKey + '_funding') % 61) - 30) / 1000, 3), oi: 40000 + (hashSeed(seedKey + '_oi') % 180000),
        mark: lastValid(perp).mark, index: lastValid(perp).index, source: 'Backer Creator Attention Index v1.1',
        drivers: ['View velocity', 'Engagement quality', 'Comment breadth', 'Cadence consistency', 'Content concentration']
      }
    };

    var platformRows = c.platforms || (c.platform ? [[c.platform, handle, fmt(followers)]] : [['youtube', handle, fmt(followers)]]);
    var model = {
      seed: seedKey, creatorId: c.id || null, name: name, handle: handle, hue: hue, initials: (name.split(' ').slice(0, 2).map(function (x) { return x[0]; }).join('') || 'B').toUpperCase(),
      platforms: platformRows.map(function (p) { var id = Array.isArray(p) ? p[0] : (p.id || p); return { id: id, label: id }; }),
      band: band, poaUnavailable: poaUnavailable, evidence: { grade: poaUnavailable ? 'INSUFFICIENT' : gradeOf(evScore), score: poaUnavailable ? null : evScore },
      status: { label: marketState, tone: marketState === 'OPEN' ? 'up' : 'gray' },
      summary: summary, days: days, baselineMedian: baselineMedian, comp: comp,
      momentum: momentum, concentration: concentration, commentBreadth: commentBreadth, confidenceSeries: confidenceSeries,
      events: events, content: content, evidenceRows: evidence, durabilityState: durabilityState, durProxies: durProxies,
      indexes: indexes, markets: markets, bets: bets, method: METHODS[1],
      flags: { oneHit: oneHit, shortsHeavy: shortsHeavy, commentsBlackout: commentsBlackout, lowConfStrong: lowConfStrong },
      defaultMarket: ctx.defaultMarket || 'milestone',
      defaultOutcome: position && position.pk && position.pk.side === position.pk.b ? 1 : 0,
      defaultSide: position && position.perp ? position.perp.side : null,
      focusBetIdx: ctx.position ? 96 : null,
      hasMarket: !!contract || bets.length > 0 || !!ctx.position
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

  function selectedMarketOutcome(model, state) {
    if (state.mtype === 'milestone') return model.markets.milestone.outcomes[state.side === 'NO' ? 1 : 0];
    if (state.mtype === 'pk') return model.markets.pk.outcomes[state.outcome] || model.markets.pk.outcomes[0];
    return null;
  }

  function eventsForSurface(model, state) {
    if (state.surface !== 'market') return model.events;
    var market = model.markets[state.mtype];
    return model.events.filter(function (event) {
      return event.type === 'CONTENT_PUBLISHED' && (market.settlementIdx == null || event.idx <= market.settlementIdx);
    });
  }

  function candleAt(series, idx) {
    if (!series || !series.length) return null;
    for (var i = Math.min(idx, series.length - 1); i >= 0; i--) {
      if (series[i] && series[i].status !== 'GAP') return series[i];
    }
    return lastValid(series);
  }

  function outcomeQuoteAt(outcome, idx) {
    var point = candleAt(outcome.candles, idx), prior = candleAt(outcome.candles, Math.max(0, idx - 7));
    return {
      id: outcome.id, name: outcome.name, color: outcome.color, candles: outcome.candles, series: outcome.series,
      cur: point ? point.c : outcome.cur, prev: prior ? prior.c : outcome.prev,
      bid: point && point.bid != null ? point.bid : outcome.bid,
      ask: point && point.ask != null ? point.ask : outcome.ask,
      norm: point ? point.c : outcome.norm, point: point
    };
  }

  function perpQuoteAt(market, idx) {
    var point = candleAt(market.ohlc, idx) || lastValid(market.ohlc);
    return {
      point: point, last: point.c,
      mark: point.mark != null ? point.mark : point.c,
      index: point.index != null ? point.index : point.c,
      bid: point.bid, ask: point.ask
    };
  }

  // Build a single-focus SVG. surface 'market' => traded odds/price K-line.
  // surface 'poa' => Public Attention Velocity K-line. Returns {svg, geo}.
  function buildChart(model, S) {
    var W = 1000;
    var padL = 48, padR = 50, padT = 12, padB = 22;
    var mainTop = padT, mainH = 244;
    var volTop = mainTop + mainH + 8, volH = 34;
    var evTrackY = volTop + volH + 12;
    var axisY = evTrackY + 6;
    var H = axisY + padB;
    var market = S.surface === 'market';
    var mtype = S.mtype;

    var rangeN = { '7d': 7, '30d': 30, '90d': 90, '1y': 120, 'all': 120 }[S.range] || 90;
    var asOf = S.asOf, start = Math.max(0, asOf + 1 - rangeN);
    var selectedOutcome = market ? selectedMarketOutcome(model, S) : null;
    var sourceSeries = model.days;
    if (market && mtype === 'perps') sourceSeries = model.markets.perps.ohlc;
    else if (market && selectedOutcome) sourceSeries = selectedOutcome.candles;
    var full = sourceSeries.slice(start, asOf + 1);
    if (market) full = full.filter(function (d) { return d.status !== 'SETTLED'; });
    var candles = aggregateCandles(full, S.interval === '1w');
    if (!candles.length) candles = full.slice();
    var n = candles.length, innerW = W - padL - padR, bw = innerW / Math.max(n, 1);
    var idxToX = {};
    candles.forEach(function (d, i) { idxToX[d.idx] = padL + i * bw + bw / 2; });
    function xAt(fi) { if (idxToX[fi] != null) return idxToX[fi]; var best = null, bd = 1e9; candles.forEach(function (d) { var dd = Math.abs(d.idx - fi); if (dd < bd) { bd = dd; best = d.idx; } }); return best == null ? padL : idxToX[best]; }

    var chartTitle = market ? 'Market traded-price history' : 'Public attention velocity history';
    var chartDesc = market ? 'Candles show executed open, high, low and close for the selected outcome. Comparison outcomes are lines; fills are markers.' : 'Candles show retained public-attention velocity observations. Composition and market prices are not part of this axis.';
    var svg = '<svg class="pt-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" preserveAspectRatio="xMidYMid meet" aria-label="' + chartTitle + '"><title>' + chartTitle + '</title><desc>' + chartDesc + '</desc>';
    svg += '<g class="pt-grid">';
    for (var g = 0; g <= 4; g++) { var gy = mainTop + mainH / 4 * g; svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '"/>'; }
    svg += '</g>';

    /* y-scale */
    var yMin, yMax, yLabel, ySuf = '';
    if (market) {
      if (mtype === 'perps') {
        var pv = model.markets.perps.ohlc.filter(function (d) { return d.idx >= start && d.idx <= asOf; });
        var lo = Math.min.apply(null, pv.map(function (d) { return d.l; })), hi = Math.max.apply(null, pv.map(function (d) { return d.h; }));
        var sc = niceScale(lo, hi); yMin = sc.min; yMax = sc.max; yLabel = 'Executed price / mark (index pts)';
      } else { yMin = 0; yMax = 100; ySuf = '¢'; yLabel = selectedOutcome ? selectedOutcome.name + ' last trade' : 'Outcome last trade'; }
    } else {
      var alo = Math.min.apply(null, candles.map(function (d) { return d.l; })), ahi = Math.max.apply(null, candles.map(function (d) { return d.h; }));
      var sc2 = niceScale(alo, ahi); yMin = sc2.min; yMax = sc2.max; yLabel = 'Observed Attention Velocity · 100 = prior 28d median';
    }
    function Y(v) { return mainTop + mainH - (v - yMin) / (yMax - yMin) * mainH; }
    svg += '<g class="pt-axis">';
    for (var yl = 0; yl <= 4; yl++) { var vv = yMin + (yMax - yMin) * (1 - yl / 4); svg += '<text x="' + (padL - 6) + '" y="' + (mainTop + mainH / 4 * yl + 3) + '" text-anchor="end">' + Math.round(vv) + ySuf + '</text>'; }
    svg += '</g>';

    /* ---- MAIN SERIES ---- */
    if (market) {
      var marketOutcomes = mtype === 'milestone' ? model.markets.milestone.outcomes : mtype === 'pk' ? model.markets.pk.outcomes : [];
      marketOutcomes.forEach(function (o) {
        if (selectedOutcome && o.id === selectedOutcome.id) return;
        var pts = candles.filter(function (d) { return o.candles[d.idx] && o.candles[d.idx].status !== 'GAP'; }).map(function (d) { return xAt(d.idx) + ',' + Y(o.candles[d.idx].c); });
        svg += '<polyline class="oddline" style="stroke:' + o.color + ';opacity:.5;stroke-dasharray:3 3" points="' + pts.join(' ') + '"/>';
      });
      var vmaxM = Math.max.apply(null, candles.map(function (d) { return Math.abs(d.vol || 0); })) || 1;
      candles.forEach(function (d) {
        if (d.status === 'GAP') return;
        var x = xAt(d.idx), up = d.c >= d.o, cw = Math.max(1.6, bw * 0.58);
        var vh = Math.min(volH, Math.abs(d.vol || 0) / vmaxM * volH);
        svg += '<rect x="' + (x - bw * 0.3) + '" y="' + (volTop + volH - vh) + '" width="' + (bw * 0.6) + '" height="' + Math.max(1, vh) + '" class="' + (up ? 'vol-up' : 'vol-down') + '"/>';
        svg += '<line x1="' + x + '" y1="' + Y(d.h) + '" x2="' + x + '" y2="' + Y(d.l) + '" class="' + (up ? 'wick-up' : 'wick-down') + '"/>';
        var yo = Y(d.o), yc = Y(d.c);
        svg += '<rect x="' + (x - cw / 2) + '" y="' + Math.min(yo, yc) + '" width="' + cw + '" height="' + Math.max(1.4, Math.abs(yc - yo)) + '" class="' + (up ? 'candle-up' : 'candle-down') + '"/>';
      });
      sourceSeries.forEach(function (d) { if (d.status === 'GAP' && d.idx >= start && d.idx <= asOf) { var xg = xAt(d.idx); svg += '<rect class="gap-band" x="' + (xg - bw / 2) + '" y="' + mainTop + '" width="' + bw + '" height="' + mainH + '"/>'; } });
      if (mtype === 'perps') {
        var markPts = candles.map(function (d) { var p = model.markets.perps.ohlc[d.idx]; return xAt(d.idx) + ',' + Y(p.mark); });
        var indexPts = candles.map(function (d) { var p = model.markets.perps.ohlc[d.idx]; return xAt(d.idx) + ',' + Y(p.index); });
        svg += '<polyline class="oddline" style="stroke:' + COL.accent + ';opacity:.75" points="' + markPts.join(' ') + '"/>';
        svg += '<polyline class="oddline" style="stroke:' + COL.warn + ';opacity:.55;stroke-dasharray:3 3" points="' + indexPts.join(' ') + '"/>';
      }
    } else {
      if (yMin < 100 && yMax > 100) svg += '<line x1="' + padL + '" y1="' + Y(100) + '" x2="' + (W - padR) + '" y2="' + Y(100) + '" stroke="' + COL.faint + '" stroke-dasharray="4 4"/><text class="pt-axis" x="' + (W - padR + 2) + '" y="' + (Y(100) + 3) + '" fill="' + COL.faint + '">100</text>';
      var vmaxA = Math.max.apply(null, candles.map(function (d) { return Math.abs(d.vol); })) || 1;
      candles.forEach(function (d) { var neg = d.vol < 0; var vh = Math.min(volH, Math.abs(d.vol) / vmaxA * volH); svg += '<rect x="' + (xAt(d.idx) - bw * 0.3) + '" y="' + (neg ? volTop : volTop + volH - vh) + '" width="' + (bw * 0.6) + '" height="' + Math.max(1, vh) + '" class="' + (neg ? 'vol-down' : 'vol-up') + '"/>'; });
      candles.forEach(function (d) { if (d.status === 'GAP') return; var x = xAt(d.idx), up = d.c >= d.o, cw = Math.max(1.5, bw * 0.58); var partial = d.status === 'PARTIAL' || d.status === 'CORRECTION'; svg += '<line x1="' + x + '" y1="' + Y(d.h) + '" x2="' + x + '" y2="' + Y(d.l) + '" class="' + (up ? 'wick-up' : 'wick-down') + '"' + (partial ? ' stroke-dasharray="2 2"' : '') + '/>'; var yo = Y(d.o), yc = Y(d.c); svg += '<rect x="' + (x - cw / 2) + '" y="' + Math.min(yo, yc) + '" width="' + cw + '" height="' + Math.max(1.2, Math.abs(yc - yo)) + '" class="' + (up ? 'candle-up' : 'candle-down') + (partial ? ' candle-hollow' : '') + '"' + (partial ? ' stroke-dasharray="2 2"' : '') + ' data-cidx="' + d.idx + '"/>'; });
      model.days.forEach(function (d) { if (d.status === 'GAP' && d.idx >= start && d.idx <= asOf) { var x = xAt(d.idx); svg += '<rect class="gap-band" x="' + (x - bw / 2) + '" y="' + mainTop + '" width="' + bw + '" height="' + mainH + '"/>'; } });
    }

    /* event markers on lower track */
    eventsForSurface(model, S).forEach(function (e) { if (e.idx < start || e.idx > asOf) return; var x = xAt(e.idx); var col = e.klass === 'ev-content' ? COL.accent : e.klass === 'ev-spike' ? COL.warn : e.klass === 'ev-risk' ? COL.down : e.klass === 'ev-method' ? COL.accent2 : COL.gray; svg += '<g class="evt-mark pt-focusable" tabindex="0" role="button" data-ev="' + e.id + '" aria-label="Event: ' + esc(e.label) + ' ' + fdate(e.t) + '"><line x1="' + x + '" y1="' + mainTop + '" x2="' + x + '" y2="' + evTrackY + '" stroke="rgba(255,255,255,.07)" stroke-dasharray="2 3"/><rect x="' + (x - 5) + '" y="' + (evTrackY - 5) + '" width="10" height="10" rx="2" fill="' + col + '"/></g>'; });

    /* fill markers — market surface only, matched to this contract */
    if (market) {
      model.bets.forEach(function (b, bi) {
        if (b.idx < start || b.idx > asOf || b.market !== mtype) return;
        if (selectedOutcome && b.outcome && b.outcome !== selectedOutcome.id && b.outcome !== selectedOutcome.name && b.side !== selectedOutcome.id) return;
        var x = xAt(b.idx), yv = Y(Number(b.entry));
        var buy = b.action === 'BUY' || b.side === 'YES' || b.side === 'LONG';
        var col = b.side === 'EXIT' ? COL.muted : buy ? COL.up : COL.down;
        var focus = model.focusBetIdx === b.idx;
        svg += '<g class="bet-mark pt-focusable" tabindex="0" role="button" data-bet="' + bi + '" aria-label="Fill ' + (b.action || '') + ' ' + (b.outcome || b.side) + ' ' + money(b.size) + ' at ' + esc(b.entryLabel) + '">';
        svg += '<line x1="' + x + '" y1="' + mainTop + '" x2="' + x + '" y2="' + (mainTop + mainH) + '" stroke="' + col + '" stroke-dasharray="1 4" opacity="0.35"/>';
        svg += '<circle cx="' + x + '" cy="' + yv + '" r="5" fill="' + (b.real && !b.estimated ? col : '#08090b') + '" stroke="' + col + '" stroke-width="1.6"/>';
        if (focus) svg += '<circle cx="' + x + '" cy="' + yv + '" r="9" fill="none" stroke="' + col + '" stroke-width="1.4" opacity="0.7"/>';
        svg += '</g>';
      });
    }

    /* x-axis */
    svg += '<g class="pt-axis">';
    var step = Math.max(1, Math.floor(n / 6));
    candles.forEach(function (d, i) { if (i % step === 0 || i === n - 1) svg += '<text x="' + xAt(d.idx) + '" y="' + (axisY + 8) + '" text-anchor="middle">' + fdate(d.t) + '</text>'; });
    svg += '</g>';
    svg += '<text class="pt-axis" x="' + padL + '" y="' + (mainTop + 10) + '" fill="' + COL.muted2 + '">' + yLabel + '</text>';

    svg += '<g class="pt-crosshair" style="display:none"><line class="chx" x1="0" y1="' + mainTop + '" x2="0" y2="' + (mainTop + mainH) + '"/></g>';
    svg += '<rect class="pt-plot-overlay" x="' + padL + '" y="' + mainTop + '" width="' + innerW + '" height="' + mainH + '" fill="transparent"/>';
    svg += '</svg>';
    return { svg: svg, geo: { padL: padL, bw: bw, candles: candles, start: start, asOf: asOf, W: W } };
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
  var cardLastFocus = null;
  var modalSiblings = [];

  function confDots(grade) {
    var lv = grade === 'HIGH' ? 3 : grade === 'MEDIUM' ? 2 : grade === 'LOW' ? 1 : 0;
    var s = '<span class="conf-dots" aria-label="' + grade + ' confidence">';
    for (var i = 0; i < 3; i++) s += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    return s + '</span>';
  }
  function bandWord(b) { return b === 'strong' ? 'Strong' : b === 'mixed' ? 'Mixed' : b === 'risk' ? 'Risk-flagged' : 'Insufficient'; }
  function bandTone(b) { return b === 'strong' ? 'up' : b === 'risk' ? 'down' : b === 'insufficient' ? 'gray' : 'warn'; }
  function lifecycleLabel(s) {
    var v = String(s || 'OPEN').toUpperCase();
    return { OPEN: 'Open', OPENING_SOON: 'Opening soon', CLOSED: 'Closed', CLOSED_PARTIAL: 'Partially closed', RESOLVED: 'Settled', HIT: 'Settled — won', MISS: 'Settled — lost', VOID: 'Voided — refunded', LIQUIDATED: 'Liquidated', ILLUSTRATIVE: 'Illustrative' }[v] || v.charAt(0) + v.slice(1).toLowerCase();
  }
  function marketLifecycle(m, marketType) {
    var mk = m.markets[marketType];
    var state = mk && mk.state ? mk.state : m.status.label;
    return { label: state, tone: state === 'OPEN' ? 'up' : state === 'OPENING_SOON' ? 'warn' : 'gray', open: state === 'OPEN' };
  }
  function settledAtPlayhead(market, idx) {
    return !!(market && market.state === 'RESOLVED' && idx >= (market.settlementIdx == null ? NDAYS - 1 : market.settlementIdx));
  }
  function signedMoney(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + money(Math.abs(v)); }
  function positionStats(m, marketType) {
    var fills = m.bets.filter(function (b) { return b.market === marketType && b.real && Number(b.idx) <= S.asOf; });
    var mk = m.markets[marketType], current = marketType === 'perps' ? perpQuoteAt(mk, S.asOf).mark : 0;
    var selected = marketType === 'perps' ? null : selectedMarketOutcome(m, S);
    if (selected) fills = fills.filter(function (b) { return !b.outcome || b.outcome === selected.id || b.outcome === selected.name || b.side === selected.id; });
    fills.sort(function (a, b) { return Number(a.t || 0) - Number(b.t || 0); });
    var qty = 0, avg = 0, grossBuys = 0, grossSells = 0, fees = 0, funding = 0, margin = 0, realized = 0;
    var pnlFactor = marketType === 'perps' ? 1 : 0.01;
    fills.forEach(function (b) {
      var q = Math.abs(Number(b.quantity || (b.size / Math.max(marketType === 'perps' ? b.entry : b.entry / 100, 0.01))));
      var sign = b.action === 'SELL' || b.side === 'SHORT' ? -1 : 1, delta = q * sign, entry = Number(b.entry || 0);
      fees += Number(b.fee || 0);
      funding += Number(b.funding || 0);
      margin += Number(b.size || 0);
      if (sign > 0) grossBuys += Number(b.size || 0); else grossSells += Number(b.size || 0);
      if (qty === 0 || (qty > 0 && delta > 0) || (qty < 0 && delta < 0)) {
        avg = (Math.abs(qty) * avg + q * entry) / Math.max(Math.abs(qty) + q, 0.0001);
        qty += delta;
      } else {
        var closing = Math.min(Math.abs(qty), q);
        realized += closing * (entry - avg) * (qty > 0 ? 1 : -1) * pnlFactor;
        var remainder = q - closing;
        qty += delta;
        if (Math.abs(qty) < 0.0001) { qty = 0; avg = 0; }
        else if (remainder > 0) avg = entry;
      }
    });
    if (marketType !== 'perps') {
      current = selected ? outcomeQuoteAt(selected, S.asOf).cur : 0;
    }
    var lifecycle = marketLifecycle(m, marketType), settled = settledAtPlayhead(mk, S.asOf);
    var unrealized = qty * (current - avg) * pnlFactor;
    var net = realized + unrealized + funding - fees;
    var potentialPayout = marketType === 'perps' ? null : settled ? Math.max(0, qty) * current / 100 : Math.max(0, qty);
    return { fills: fills, quantity: qty, average: avg, current: current, invested: grossBuys, proceeds: grossSells, margin: margin, fees: fees, funding: funding, realized: realized, unrealized: unrealized, net: net, potentialPayout: potentialPayout, maxNet: potentialPayout == null ? null : potentialPayout + grossSells - grossBuys - fees, settled: settled };
  }

  function tradePanel(m) {
    var mt = S.mtype, mk = m.markets[mt], atLatest = S.asOf === NDAYS - 1;
    var lifecycle = marketLifecycle(m, mt), tradingOpen = lifecycle.open;
    var isSettledAtPlayhead = settledAtPlayhead(mk, S.asOf);
    var pq = mt === 'perps' ? perpQuoteAt(mk, S.asOf) : null;
    var h = '<div class="pt-trade"><div class="pt-trade-h"><div class="mk">' + (mt === 'milestone' ? 'Milestone contract' : mt === 'pk' ? 'PK · multi-outcome' : 'Creator perpetual · simulated') + '</div>';
    h += '<h3>' + esc(mk.question) + '</h3>';
    h += '<p>' + (mk.hasTradeHistory === false ? ('Opens' + (mk.opensInDays ? ' in ' + mk.opensInDays + ' days' : ' soon') + ' · no executions or quotes yet') : isSettledAtPlayhead ? ('Settled at the ' + esc(mk.deadline) + ' cutoff · no executable quote') : lifecycle.label === 'RESOLVED' ? ('Historical replay before settlement · read-only') : mt === 'perps' ? ('Mark ' + pq.mark + ' · index ' + pq.index + ' · funding ' + (mk.funding >= 0 ? '+' : '') + mk.funding + '%') : ('Last trade, bid and ask are distinct · ' + esc(mk.deadline))) + '</p></div><div class="pt-trade-b">';

    if (mk.hasTradeHistory === false) {
      h += '<div class="pt-empty"><b>This market has not opened.</b><p>No orders, executed trades, bid/ask quotes, volume, or market-implied probabilities exist yet. Add it to your watchlist from the market board.</p></div>';
      h += '<p class="pt-sim">The underlying milestone below can update before trading opens; it is not a pre-market quote.</p></div></div>';
      return h;
    }
    if (!tradingOpen) {
      var lifecycleSelected = mt === 'perps' ? null : selectedMarketOutcome(m, S);
      var lifecycleQuote = lifecycleSelected ? outcomeQuoteAt(lifecycleSelected, S.asOf) : null;
      var lifecycleHeading = isSettledAtPlayhead ? 'This market is settled.' : lifecycle.label === 'RESOLVED' ? 'Historical replay · before settlement.' : 'Trading is closed.';
      var lifecycleCopy = isSettledAtPlayhead && lifecycleQuote
        ? esc(lifecycleSelected.name) + ' has a final settlement value of ' + lifecycleQuote.cur + '¢. No executable bid or ask remains.'
        : lifecycle.label === 'RESOLVED' ? 'The selected-time price is historical and predates the final outcome. Replay never backfills the later settlement value.' : 'The last displayed price is historical and no longer executable. New orders are unavailable.';
      h += '<div class="pt-empty"><b>' + lifecycleHeading + '</b><p>' + lifecycleCopy + '</p></div>';
      h += '<div class="pt-kv"><span>Status</span><b>' + esc(lifecycleLabel(lifecycle.label)) + '</b></div><div class="pt-kv"><span>Cutoff / cadence</span><b>' + esc(mk.deadline || 'Continuous') + '</b></div><div class="pt-kv"><span>Settlement source</span><b>' + esc(mk.source) + '</b></div>';
      h += '<p class="pt-sim">Historical prices and any final settlement value are read-only. No simulated order can be placed.</p></div></div>';
      return h;
    }

    if (mt !== 'perps') {
      var oc = outcomeQuoteAt(selectedMarketOutcome(m, S), S.asOf);
      h += '<div class="pt-side-toggle" role="tablist" aria-label="Order side"><button class="pt-side-btn yes ' + (S.tradeSide === 'BUY' ? 'on' : '') + '" data-trade-side="BUY" role="tab" aria-selected="' + (S.tradeSide === 'BUY') + '"><small>Buy</small><b>' + oc.ask + '¢ ask</b></button>';
      h += '<button class="pt-side-btn no ' + (S.tradeSide === 'SELL' ? 'on' : '') + '" data-trade-side="SELL" role="tab" aria-selected="' + (S.tradeSide === 'SELL') + '"><small>Sell</small><b>' + oc.bid + '¢ bid</b></button></div>';
      if (mt === 'milestone') {
        var yesQ = outcomeQuoteAt(mk.outcomes[0], S.asOf), noQ = outcomeQuoteAt(mk.outcomes[1], S.asOf);
        h += '<div class="pt-ladder"><div class="pt-ladder-row ' + (S.side === 'YES' ? 'on' : '') + '" data-side="YES" tabindex="0" role="button"><span class="lr-dot" style="background:' + COL.up + '"></span><span class="lr-name">YES · reaches target</span><span class="lr-odds">' + yesQ.cur + '¢</span></div><div class="pt-ladder-row ' + (S.side === 'NO' ? 'on' : '') + '" data-side="NO" tabindex="0" role="button"><span class="lr-dot" style="background:' + COL.gray + '"></span><span class="lr-name">NO · misses target</span><span class="lr-odds">' + noQ.cur + '¢</span></div></div>';
      } else {
        h += '<div class="pt-ladder">';
        mk.outcomes.forEach(function (o, i) { var oq = outcomeQuoteAt(o, S.asOf), chg = oq.cur - oq.prev; h += '<div class="pt-ladder-row ' + (S.outcome === i ? 'on' : '') + '" data-outcome="' + i + '" tabindex="0" role="button"><span class="lr-dot" style="background:' + o.color + '"></span><span class="lr-name">' + esc(o.name) + '</span><span class="lr-odds">' + oq.cur + '¢</span><span class="lr-chg" style="color:' + (chg >= 0 ? COL.up : COL.down) + '">' + (chg >= 0 ? '+' : '') + round(chg, 1) + '</span></div>'; });
        h += '</div>';
      }
      h += orderTypeField();
      h += amountField(S.tradeSide === 'SELL' ? 'Sale notional' : 'Order value');
      var execPx = S.orderType === 'LIMIT' ? clamp(Number(S.limitPrice || (S.tradeSide === 'BUY' ? oc.ask : oc.bid)), 1, 99) : (S.tradeSide === 'BUY' ? oc.ask : oc.bid);
      var shares = round(S.amount / Math.max(execPx / 100, 0.01), 2), fee = round(S.amount * 0.006, 2);
      h += '<div class="pt-book"><div><small>Last</small><b>' + oc.cur + '¢</b></div><div><small>Bid</small><b>' + oc.bid + '¢</b></div><div><small>Ask</small><b>' + oc.ask + '¢</b></div><div><small>Spread</small><b>' + round(oc.ask - oc.bid, 1) + '¢</b></div></div>';
      h += '<div class="pt-kv"><span>Selected outcome</span><b>' + esc(oc.name) + '</b></div>';
      h += '<div class="pt-kv"><span>Estimated execution</span><b>' + execPx + '¢</b></div>';
      h += '<div class="pt-kv"><span>Quantity / shares</span><b>' + shares + '</b></div>';
      h += '<div class="pt-kv"><span>Gross ' + (S.tradeSide === 'BUY' ? 'cost' : 'proceeds') + '</span><b>' + money(S.amount) + '</b></div>';
      h += '<div class="pt-kv"><span>Estimated fee</span><b>' + money(fee) + '</b></div>';
      h += '<div class="pt-kv"><span>Position effect</span><b class="' + (S.tradeSide === 'BUY' ? 'pos' : 'neg') + '">' + (S.tradeSide === 'BUY' ? '+' : '−') + shares + ' shares</b></div>';
      h += '<div class="pt-kv"><span>Potential settlement payout</span><b>' + money(S.tradeSide === 'BUY' ? shares : 0) + '</b></div>';
      h += '<div class="pt-kv"><span>Maximum net profit</span><b class="pos">' + money(S.tradeSide === 'BUY' ? Math.max(0, shares - S.amount - fee) : Math.max(0, S.amount - fee)) + '</b></div>';
      h += '<div class="pt-kv"><span>Settlement source</span><b>' + esc(mk.source) + '</b></div>';
      var heldShares = positionStats(m, mt).quantity;
      var canSell = S.tradeSide !== 'SELL' || (heldShares > 0 && shares <= heldShares + 0.001);
      var orderClass = !atLatest ? ' history' : !tradingOpen || !canSell ? ' unavailable' : '';
      var orderAttr = !atLatest ? 'data-replay="reset"' : tradingOpen && canSell ? 'data-order' : 'disabled aria-disabled="true"';
      var orderLabel = !atLatest ? 'Return to latest to trade' : !tradingOpen ? lifecycleLabel(lifecycle.label) + ' · trading unavailable' : !canSell ? 'Insufficient held shares to sell' : S.tradeSide + ' ' + esc(oc.name) + ' · simulated';
      h += '<button class="pt-order ' + (S.tradeSide === 'SELL' ? 'no' : 'yes') + orderClass + '" ' + orderAttr + '>' + orderLabel + '</button>';
    } else {
      h += '<div class="pt-side-toggle"><button class="pt-side-btn long ' + (S.side === 'LONG' ? 'on' : '') + '" data-side="LONG"><small>Long</small><b>' + pq.mark + '</b></button>';
      h += '<button class="pt-side-btn short ' + (S.side === 'SHORT' ? 'on' : '') + '" data-side="SHORT"><small>Short</small><b>' + pq.mark + '</b></button></div>';
      h += orderTypeField();
      h += '<div class="pt-field"><label>Leverage</label><div class="pt-lev">' + [1, 2, 3, 5].map(function (l) { return '<button class="' + (S.leverage === l ? 'on' : '') + '" data-lev="' + l + '">' + l + '×</button>'; }).join('') + '</div></div>';
      h += amountField('Margin');
      var expo = S.amount * S.leverage;
      var liq = S.side === 'LONG' ? round(pq.mark * (1 - 0.85 / S.leverage), 1) : round(pq.mark * (1 + 0.85 / S.leverage), 1);
      h += '<div class="pt-book"><div><small>Last</small><b>' + pq.last + '</b></div><div><small>Mark</small><b>' + pq.mark + '</b></div><div><small>Index</small><b>' + pq.index + '</b></div><div><small>Basis</small><b>' + round(pq.mark - pq.index, 2) + '</b></div></div>';
      h += '<div class="pt-kv"><span>Mark price</span><b>' + pq.mark + '</b></div>';
      h += '<div class="pt-kv"><span>Total exposure</span><b>' + money(expo) + '</b></div>';
      h += '<div class="pt-kv"><span>Est. liquidation</span><b class="warn">idx ' + liq + '</b></div>';
      h += '<div class="pt-kv"><span>Funding rate</span><b class="' + (mk.funding >= 0 ? 'pos' : 'neg') + '">' + (mk.funding >= 0 ? '+' : '') + mk.funding + '% /8h</b></div>';
      h += '<div class="pt-kv"><span>Open interest</span><b>' + money(mk.oi) + '</b></div>';
      h += '<button class="pt-order ' + (S.side === 'SHORT' ? 'short' : 'long') + (!atLatest ? ' history' : !tradingOpen ? ' unavailable' : '') + '" ' + (!atLatest ? 'data-replay="reset"' : tradingOpen ? 'data-order' : 'disabled aria-disabled="true"') + '>' + (!atLatest ? 'Return to latest to trade' : !tradingOpen ? lifecycleLabel(lifecycle.label) + ' · trading unavailable' : S.side + ' ' + S.leverage + '× simulated') + '</button>';
    }
    h += '<p class="pt-sim">Simulated · no real money moves. Contract data is separate from Proof-of-Attention estimates and never settles PoA.</p>';
    // depth
    var bookPoint = mt === 'perps' ? pq.point : outcomeQuoteAt(selectedMarketOutcome(m, S), S.asOf).point;
    var spread = mt === 'perps' ? round((pq.ask || pq.mark) - (pq.bid || pq.mark), 2) : round((bookPoint.ask || 0) - (bookPoint.bid || 0), 1);
    h += '<div class="pt-depth"><div class="pt-kv"><span>24h volume</span><b>' + money(Math.max(0, Number(bookPoint.vol || 0))) + '</b></div>';
    h += '<div class="pt-kv"><span>Displayed spread</span><b>' + spread + (mt === 'perps' ? ' idx' : '¢') + '</b></div>';
    h += '<div class="pt-kv"><span>Executed trades</span><b>' + Number(bookPoint.tradeCount || 0) + '</b></div></div>';
    h += '</div></div>';
    return h;
  }
  function orderTypeField() {
    var isPerp = S.mtype === 'perps';
    var unit = isPerp ? 'idx' : '¢';
    var max = isPerp ? 9999 : 99;
    var h = '<div class="pt-field"><label>Order type</label><div class="pt-lev"><button class="' + (S.orderType === 'MARKET' ? 'on' : '') + '" data-order-type="MARKET">Market</button><button class="' + (S.orderType === 'LIMIT' ? 'on' : '') + '" data-order-type="LIMIT">Limit</button></div></div>';
    if (S.orderType === 'LIMIT') h += '<div class="pt-field"><label for="ptLimit">Limit price</label><div class="pt-amt"><span>' + unit + '</span><input id="ptLimit" type="number" min="1" max="' + max + '" step="0.1" value="' + S.limitPrice + '" inputmode="decimal" aria-label="Limit price in ' + (isPerp ? 'index points' : 'cents') + '"/></div></div>';
    return h;
  }
  function amountField(label) {
    return '<div class="pt-field"><label>' + esc(label || 'Simulated amount') + '</label><div class="pt-amt"><span>$</span><input id="ptAmt" type="number" min="1" value="' + S.amount + '" inputmode="numeric" aria-label="' + esc(label || 'Simulated amount') + '"/></div>' +
      '<div class="pt-chips">' + [10, 25, 100, 250].map(function (v) { return '<button class="pt-chip ' + (S.amount === v ? 'on' : '') + '" data-amt="' + v + '">$' + v + '</button>'; }).join('') + '</div></div>';
  }

  function template(m) { return S.surface === 'market' ? templateMarket(m) : templatePoa(m); }

  /* shared time controls (range / interval / replay / scrubber) */
  function timeControls() {
    var pct = S.asOf / (NDAYS - 1) * 100;
    var h = '<span class="pt-ctl-label">Range</span><div class="pt-seg" role="group" aria-label="Chart range">' + [['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['1y', '1Y'], ['all', 'ALL']].map(function (r) { return '<button class="' + (S.range === r[0] ? 'on' : '') + '" data-range="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>';
    h += '<span class="pt-ctl-label">Interval</span><div class="pt-seg" aria-label="Candle interval"><button disabled title="Intraday snapshots not retained in this fixture">6H</button><button class="' + (S.interval === '1d' ? 'on' : '') + '" data-interval="1d">1D</button><button class="' + (S.interval === '1w' ? 'on' : '') + '" data-interval="1w">1W</button></div>';
    h += '<div class="spacer"></div><div class="pt-replay"><div class="pt-replay-btns">';
    h += '<button class="pt-rb" data-replay="prev" aria-label="Previous observation">' + ICO.prev + '</button>';
    h += '<button class="pt-rb play ' + (S.playing ? 'on' : '') + '" data-replay="play" aria-label="' + (S.playing ? 'Pause replay' : 'Play replay') + '">' + (S.playing ? ICO.pause : ICO.play) + '</button>';
    h += '<button class="pt-rb" data-replay="next" aria-label="Next observation">' + ICO.next + '</button>';
    h += '<button class="pt-rb" data-replay="reset" aria-label="Jump to latest">' + ICO.reset + '</button></div>';
    h += '<input class="pt-scrub" type="range" min="0" max="' + (NDAYS - 1) + '" value="' + S.asOf + '" style="--pct:' + pct + '%" aria-label="History scrubber" aria-valuetext="' + fdatetime(tOf(S.asOf)) + '" data-scrub/>';
    h += '<div class="pt-seg" aria-label="Replay speed">' + [1, 2, 4].map(function (sp) { return '<button class="' + (S.speed === sp ? 'on' : '') + '" data-speed="' + sp + '">' + sp + '×</button>'; }).join('') + '</div>';
    h += '<span class="pt-asof">As of <b>' + fdatetime(tOf(S.asOf)) + '</b></span></div>';
    return h;
  }
  function chartFigure(m, headHTML, srText) {
    var chart = buildChart(m, S); S.geo = chart.geo;
    var h = '<div class="pt-chartwrap">' + headHTML;
    h += '<figure class="pt-figure" tabindex="0" role="figure" aria-label="Time-series chart. Use left and right arrows to move through time.">' + chart.svg + '<div class="pt-tip"></div><figcaption class="pt-sr">' + srText + '</figcaption></figure>';
    h += '<div class="pt-rail">' + eventsForSurface(m, S).filter(function (e) { return e.idx <= S.asOf; }).map(function (e) { return '<button class="pt-rail-chip" data-ev="' + e.id + '"><span class="ev-dot ' + e.klass + '"></span>' + fdate(e.t) + ' · ' + esc(e.label) + '</button>'; }).join('') + '</div></div>';
    return h;
  }

  /* ============================ POA COMPOSITION SURFACE (creator) ============ */
  function templatePoa(m) {
    var asOfT = tOf(S.asOf);
    var last = m.days[S.asOf] || m.days[m.days.length - 1];
    var comp = m.comp[S.asOf] || m.comp[m.comp.length - 1];
    var hasMkt = m.hasMarket;
    var isLatest = S.asOf === NDAYS - 1;
    var visibleContentCount = m.content.filter(function (ct) { return ct.publishedIdx <= S.asOf; }).length;
    var visibleComments = m.poaUnavailable ? 0 : Math.round(m.summary.coverage.comments * visibleContentCount / Math.max(1, m.content.length));
    var observedDays = Math.min(90, S.asOf + 1);
    var observedCoverage = Math.round(m.days.slice(0, S.asOf + 1).filter(function (d) { return d.status === 'VALID'; }).length / Math.max(1, S.asOf + 1) * 100);
    var riskScoreAt = m.poaUnavailable ? null : Math.round(clamp(comp.point.anom * 1.6 + Math.max(0, m.concentration[S.asOf].v - 25) * 0.45, 4, 92));
    var riskLevelAt = riskScoreAt == null ? 'UNASSESSED' : riskScoreAt >= 55 ? 'ELEVATED' : riskScoreAt >= 30 ? 'MEDIUM' : 'LOW';
    var bandAt = m.poaUnavailable ? 'insufficient' : riskScoreAt >= 55 ? 'risk' : comp.point.core >= 70 && comp.conf >= 60 ? 'strong' : comp.conf < 30 ? 'insufficient' : 'mixed';
    var evidenceReadAt = m.poaUnavailable ? 'Insufficient retained evidence for an underwriting conclusion.' : comp.point.core >= 65 ? 'Broad public engagement supports the credible-core range at this timestamp.' : 'Retained public signals remain mixed at this timestamp.';
    var riskReadAt = m.poaUnavailable ? 'Risk remains unassessed until source coverage improves.' : m.concentration[S.asOf].v + '% content concentration is the main disclosed watch item.';

    var h = '<div class="pt-scrim" data-close></div><div class="pt-term pt-poa-surface" role="dialog" aria-modal="true" aria-label="Proof of Attention composition for ' + esc(m.name) + '">';
    /* header */
    h += '<div class="pt-head"><div class="pt-id"><div class="pt-av" style="background:hsl(' + m.hue + ' 55% 62%)">' + esc(m.initials) + '</div>';
    h += '<div class="pt-id-t"><h1 class="pt-name">Proof of Attention</h1><div class="pt-sub">Observed public attention and how Backer’s underwriting estimate changed over time.</div>';
    h += '<div class="pt-plats"><span class="pt-plat">' + esc(m.name) + ' · ' + esc(m.handle) + '</span>' + m.platforms.slice(0, 4).map(function (p) { return '<span class="pt-plat">' + esc(p.label) + '</span>'; }).join('') + '</div></div></div>';
    h += '<div class="pt-head-stats">';
    h += '<div class="pt-hstat"><small>PoA band</small><b class="tone-' + bandTone(bandAt) + '">' + bandWord(bandAt) + '</b></div>';
    h += '<div class="pt-hstat"><small>Evidence</small><b>' + (m.poaUnavailable ? 'Insufficient' : comp.grade[0] + comp.grade.slice(1).toLowerCase() + ' ' + comp.conf) + '</b></div>';
    if (hasMkt) h += '<button class="pt-hstat pt-link" data-goto-market aria-label="Open market view">' + '<small>Market</small><b class="tone-up">View ↗</b></button>';
    h += '</div><button class="pt-x" data-close aria-label="Close">' + ICO.x + '</button></div>';
    /* controls */
    h += '<div class="pt-controls">';
    h += '<div class="pt-layer-legend" aria-label="Proof of Attention scope"><span>Creator aggregate</span><span>Content evidence below</span></div>';
    h += timeControls() + '</div>';
    /* disclaimer */
    h += '<div class="pt-disc">' + ICO.info + '<span>Illustrative historical demo series · <em>This chart shows changes in captured public attention activity. It is not a creator valuation, market price, probability, or measurement of audience authenticity.</em></span></div>';

    h += '<div class="pt-body"><div class="pt-main">';
    /* summary chips */
    h += '<div class="pt-summary">';
    h += '<div class="pt-scard"><small>Est. authentic attention</small><b>' + (m.poaUnavailable ? 'Insufficient' : comp.ranges.core[0] + '–' + comp.ranges.core[1] + '%') + '</b><p>Selected-time range, not a point.</p></div>';
    h += '<div class="pt-scard"><small>Evidence confidence</small><b>' + comp.grade[0] + comp.grade.slice(1).toLowerCase() + confDots(comp.grade) + '</b><p>' + comp.conf + ' / 100 as of this timestamp.</p></div>';
    h += '<div class="pt-scard ' + (riskLevelAt === 'ELEVATED' ? 'risk' : riskLevelAt === 'MEDIUM' || riskLevelAt === 'UNASSESSED' ? 'warn' : 'pos') + '"><small>Manipulation / platform risk</small><b>' + riskLevelAt[0] + riskLevelAt.slice(1).toLowerCase() + '</b><p>' + (riskScoreAt == null ? 'Not scored · insufficient evidence.' : '100 = higher risk · scored ' + riskScoreAt + ' as of this timestamp.') + '</p></div>';
    h += '<div class="pt-scard"><small>Observed velocity</small><b>' + last.c + '</b><p>' + fmt(Math.max(0, last.vol)) + ' captured Δviews · ' + last.coverage + '% coverage.</p></div>';
    h += '<div class="pt-scard"><small>Data coverage</small><b>' + visibleContentCount + ' items · ' + visibleComments + ' cmts</b><p>' + observedDays + ' days · ' + observedCoverage + '% source as of playhead.</p></div>';
    h += '</div>';
    /* chart (attention only) */
    var cHead = '<div class="pt-chart-head"><div class="pt-chart-title">Observed Attention Velocity<em>sampled public view-count change ÷ elapsed time</em></div><div class="pt-chart-metrics"><span class="pt-cm">Index <b>' + last.c + '</b></span><span class="pt-cm">Δviews <b>' + fmt(Math.max(0, last.vol)) + '</b></span><span class="pt-cm">Coverage <b>' + last.coverage + '%</b></span><span class="pt-cm">Confidence <b class="' + (comp.grade === 'HIGH' ? 'up' : comp.grade === 'LOW' ? 'down' : '') + '">' + comp.grade + '</b></span></div></div>';
    h += chartFigure(m, cHead, 'Observed Attention Velocity at ' + fdate(asOfT) + ' is ' + last.c + ' (100 = prior 28-day median), captured view change ' + fmt(Math.max(0, last.vol)) + ', coverage ' + last.coverage + '%.');
    /* mini panels */
    h += '<div class="pt-minis">' + miniPanel('PoA confidence', m.confidenceSeries, COL.accent, true) + miniPanel('Attention momentum', m.momentum, COL.up, false) + miniPanel('Content concentration', m.concentration, COL.warn, true) + miniPanel('Comment breadth', m.commentBreadth, COL.accent2, false) + '</div>';
    /* composition history ribbon */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Composition history</h4><span class="note">midpoint illustration — ranges in the inspector</span></div><div class="pt-block-b"><div class="pt-ribbon">' + compRibbon(m.comp, S.geo.start, S.asOf) + '</div><p class="pt-comp-def" style="margin-top:8px">Green credible core · blue passive/transient · amber anomalous · gray unassessed. The dashed line marks the ' + METHODS[1] + ' methodology change — estimates across it are not directly comparable.</p></div></div>';
    /* content contributions */
    h += block('Content contribution', 'sorted by captured-view share', contentList(m));
    /* indexes */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Underwriting indexes</h4><span class="note">not averaged into one number</span></div><div class="pt-block-b">' + (isLatest ? '<div class="pt-idx-grid">' + m.indexes.map(idxCard).join('') + '</div>' : '<div class="pt-empty"><b>Latest-snapshot diagnostics hidden during replay.</b><p>The point-in-time composition, confidence, coverage and content above remain synchronized to the playhead; indexes without retained historical snapshots are not backfilled.</p></div>') + '</div></div>';
    /* durability */
    h += isLatest ? durabilityBlock(m) : '<div class="pt-block"><div class="pt-block-h"><h4>Durability</h4><span class="pt-dur-state unavail">Historical detail unavailable</span></div><div class="pt-block-b"><div class="pt-dur-note">Durability proxy details were not retained for this timestamp, so Backer does not reconstruct them with later evidence.</div></div></div>';
    /* evidence explorer */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Evidence explorer</h4><span class="note">' + (S.band ? 'filtered · ' + S.band : 'select a band to filter') + '</span></div><div class="pt-block-b" id="ptEvidence">' + evidenceList(m) + '</div></div>';
    h += '</div>'; // end main

    /* right inspector — selected-time composition */
    h += '<div class="pt-side">';
    h += '<div class="pt-trade"><div class="pt-trade-h"><div class="mk">Underwriting inspector</div><h3>Composition · As of ' + fdate(asOfT) + '</h3><p>Estimate + uncertainty at this timestamp</p></div><div class="pt-trade-b">' + compBands(m, comp) + '</div></div>';
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Read</h4></div><div class="pt-block-b"><p class="pt-comp-def" style="margin:0 0 7px"><b style="color:var(--pt-up)">Evidence for:</b> ' + esc(evidenceReadAt) + '</p><p class="pt-comp-def" style="margin:0"><b style="color:var(--pt-warn)">Watch:</b> ' + esc(riskReadAt) + '</p></div></div>';
    if (hasMkt) h += '<button class="pt-order yes" data-goto-market style="margin-top:2px">View Backer market for ' + esc(m.name.split(' ')[0]) + ' →</button><p class="pt-sim">Market odds are separate from Proof of Attention and never settle it.</p>';
    h += '</div>'; // end side
    h += '</div>'; // end body

    h += poaFooter(m, comp, asOfT);
    h += '<div class="pt-evcard" id="ptEvCard" aria-hidden="true"></div><div class="pt-sr" aria-live="polite" id="ptLive"></div></div>';
    return h;
  }
  function poaFooter(m, comp, asOfT) {
    var platform = m.platforms.length ? String(m.platforms[0].label || 'public').toLowerCase() : 'public';
    var platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1) + ' (public)';
    var methodLabel = platform === 'youtube' ? comp.method : 'poa_' + platform.replace(/[^a-z0-9]+/g, '_') + '_public_demo_v2.0';
    var itemCount = m.content.filter(function (ct) { return ct.publishedIdx <= S.asOf; }).length;
    var commentCount = m.poaUnavailable ? 0 : Math.round(m.summary.coverage.comments * itemCount / Math.max(1, m.content.length));
    var h = '<div class="pt-sources"><div class="row1"><span>Methodology <b>' + esc(methodLabel) + '</b></span><span>Platform <b>' + esc(platformLabel) + '</b></span><span>Window <b>90D</b></span><span>As of <b>' + fdatetime(asOfT) + '</b></span><span>Computed <b>' + fdatetime(NOW) + '</b></span><span>Sampled as of playhead <b>' + itemCount + ' content items · ' + commentCount + ' public comments</b></span></div>';
    h += '<div class="disclosure">Estimated composition from observable public signals. Backer cannot see device, IP, full-session behavior, traffic-source data, watch time, or platform-private fraud labels. Unavailable fields render as “Unavailable,” never zero.</div>';
    h += '<div class="acts"><button data-methodology>Methodology</button><button data-datatable>Open data table</button><button data-correction2>Report incorrect data</button><button data-limitations>Limitations</button></div></div>';
    return h;
  }

  /* ============================ MARKET SURFACE (bet — Kalshi-style) ========== */
  function templateMarket(m) {
    var mt = S.mtype, mk = m.markets[mt], asOfT = tOf(S.asOf);
    var lifecycle = marketLifecycle(m, mt);
    var isSettledAtPlayhead = settledAtPlayhead(mk, S.asOf);
    var selected = selectedMarketOutcome(m, S);
    var selectedQuote = selected ? outcomeQuoteAt(selected, S.asOf) : null;
    var perpQuote = mt === 'perps' ? perpQuoteAt(mk, S.asOf) : null;
    var ps = positionStats(m, mt);
    var myBets = ps.fills;
    var hasEstimatedFill = myBets.some(function (b) { return b.estimated; });
    var typeLabel = mt === 'milestone' ? 'Milestone market' : mt === 'pk' ? 'PK market · multi-outcome' : 'Creator perpetual · simulated';

    var h = '<div class="pt-scrim" data-close></div><div class="pt-term pt-market-surface" role="dialog" aria-modal="true" aria-label="Market for ' + esc(m.name) + '">';
    /* header */
    h += '<div class="pt-head"><div class="pt-id"><div class="pt-av" style="background:hsl(' + m.hue + ' 55% 62%)">' + esc(m.initials) + '</div>';
    h += '<div class="pt-id-t"><div class="pt-sub" style="color:var(--pt-accent)">' + typeLabel.toUpperCase() + '</div><h1 class="pt-name">' + esc(mk.question) + '</h1>';
    /* outcome legend */
    var legend = '';
    if (mt === 'pk') legend = mk.outcomes.map(function (o) { var q = outcomeQuoteAt(o, S.asOf); return '<span class="pt-plat" style="border-color:' + o.color + '"><span style="color:' + o.color + '">●</span> ' + esc(o.name) + ' ' + q.norm + '%</span>'; }).join('');
    else if (mt === 'milestone' && mk.hasTradeHistory === false) legend = '<span class="pt-plat">No executed trades or quotes yet</span>';
    else if (mt === 'milestone') { var yq = outcomeQuoteAt(mk.outcomes[0], S.asOf), nq = outcomeQuoteAt(mk.outcomes[1], S.asOf); legend = '<span class="pt-plat"><span style="color:var(--pt-up)">●</span> YES ' + yq.norm + '%</span><span class="pt-plat"><span style="color:var(--pt-gray)">●</span> NO ' + nq.norm + '%</span>'; }
    else legend = '<span class="pt-plat">Mark ' + perpQuote.mark + '</span><span class="pt-plat">Funding ' + (mk.funding >= 0 ? '+' : '') + mk.funding + '%</span>';
    h += '<div class="pt-plats"><button class="pt-plat pt-creator-chip" data-goto-poa aria-label="Open Proof of Attention for ' + esc(m.name) + '">' + esc(m.name) + ' · ' + esc(m.handle) + ' ↗</button>' + legend + '<span class="pt-plat">' + esc(mk.id) + ' · ' + esc(mk.version) + '</span><span class="pt-plat">As of ' + fdatetime(asOfT) + '</span></div></div></div>';
    h += '<div class="pt-head-stats"><button class="pt-hstat pt-link" data-goto-poa aria-label="Open Proof of Attention"><small>Underwriting</small><b class="tone-' + bandTone(m.band) + '">Proof of Attention ↗</b></button>';
    h += '<div class="pt-hstat"><small>Status</small><b class="tone-' + lifecycle.tone + '">' + esc(lifecycleLabel(lifecycle.label)) + '</b></div>';
    h += '<div class="pt-hstat"><small>Data</small><b>' + esc(mk.dataLatency) + '</b></div>';
    h += '</div><button class="pt-x" data-close aria-label="Close">' + ICO.x + '</button></div>';
    /* controls */
    h += '<div class="pt-controls"><div class="pt-tabs pt-market-tabs" role="tablist" aria-label="Market instrument"><button class="pt-tab ' + (mt === 'milestone' ? 'on' : '') + '" data-mtype="milestone" role="tab" aria-selected="' + (mt === 'milestone') + '" tabindex="' + (mt === 'milestone' ? '0' : '-1') + '"><span class="dotmk"></span>Milestone</button><button class="pt-tab ' + (mt === 'pk' ? 'on' : '') + '" data-mtype="pk" role="tab" aria-selected="' + (mt === 'pk') + '" tabindex="' + (mt === 'pk' ? '0' : '-1') + '"><span class="dotmk"></span>PK</button><button class="pt-tab ' + (mt === 'perps' ? 'on' : '') + '" data-mtype="perps" role="tab" aria-selected="' + (mt === 'perps') + '" tabindex="' + (mt === 'perps' ? '0' : '-1') + '"><span class="dotmk"></span>Perps</button></div><span class="pt-ctl-label">Visible</span><div class="pt-layer-legend" aria-label="Visible chart layers"><span>' + (mk.hasTradeHistory === false ? 'No trades yet' : 'Market OHLC') + '</span><span>Content events</span><span>My fills</span></div>' + timeControls() + '</div>';
    /* disclaimer */
    h += '<div class="pt-disc">' + ICO.info + '<span>' + (mk.hasTradeHistory === false ? 'Listed pre-open contract · <em>No executions, quotes, volume, or market-implied probability exists yet. Underlying progress is not a pre-market price.</em>' : 'Illustrative demo market history · <em>Market odds reflect traded prices, not Backer’s independent probability estimate. Creator-attention signals provide context and do not settle this contract.</em>') + '</span></div>';

    h += '<div class="pt-body"><div class="pt-main">';
    /* position ribbon */
    if (myBets.length) {
      h += '<div class="pt-summary">';
      h += '<div class="pt-scard"><small>Your position</small><b>' + round(ps.quantity, 2) + '</b><p>' + myBets.length + ' record' + (myBets.length > 1 ? 's' : '') + ' · weighted avg ' + round(ps.average, 1) + (mt === 'perps' ? ' idx' : '¢') + (hasEstimatedFill ? ' · includes labeled legacy estimate' : '') + '</p></div>';
      h += '<div class="pt-scard"><small>' + (mt === 'perps' ? 'Margin committed' : 'Invested / proceeds') + '</small><b>' + money(mt === 'perps' ? ps.margin : ps.invested) + '</b><p>' + (mt === 'perps' ? 'Funding net ' + signedMoney(ps.funding) : (ps.proceeds ? money(ps.proceeds) + ' sale proceeds' : 'No realized sale proceeds')) + '.</p></div>';
      h += '<div class="pt-scard ' + (ps.unrealized >= 0 ? 'pos' : 'risk') + '"><small>' + (ps.settled ? 'Settlement P&L' : 'Unrealized P&L') + '</small><b>' + signedMoney(ps.unrealized) + '</b><p>' + (ps.settled ? 'Final settlement ' : 'Current ' + (mt === 'perps' ? 'mark ' : 'last ')) + ps.current + (mt === 'perps' ? '' : '¢') + '.</p></div>';
      h += '<div class="pt-scard ' + (ps.net >= 0 ? 'pos' : 'risk') + '"><small>Net P&L</small><b>' + signedMoney(ps.net) + '</b><p>Realized ' + signedMoney(ps.realized) + (mt === 'perps' ? ' · funding ' + signedMoney(ps.funding) : '') + ' · fees ' + money(ps.fees) + '.</p></div>';
      if (mt !== 'perps') h += '<div class="pt-scard"><small>' + (ps.settled ? 'Final payout' : 'Settlement payout') + '</small><b>' + money(ps.potentialPayout) + '</b><p>' + (ps.settled ? 'Net result ' : 'Maximum net profit ') + signedMoney(ps.maxNet) + '.</p></div>';
      h += '<div class="pt-scard"><small>' + (mt === 'perps' ? 'Next funding' : 'Time remaining') + '</small><b style="font-size:12px">' + (mt === 'perps' ? 'in 6h' : esc(mk.deadline || 'On event')) + '</b><p>' + esc((mk.source || '').slice(0, 52)) + '</p></div>';
      h += '</div>';
    }
    /* chart (market only) */
    var cHeadM = '<div class="pt-chart-head"><div class="pt-chart-title">' + (mt === 'perps' ? 'Executed contract price' : esc(selected.name) + ' last trade') + '<em>OHLC from executed trades · comparison outcomes are lines</em></div><div class="pt-chart-metrics">';
    if (mt !== 'perps') { var chg = selectedQuote.cur - selectedQuote.prev; cHeadM += isSettledAtPlayhead ? '<span class="pt-cm">Final settlement <b>' + selectedQuote.cur + '¢</b></span><span class="pt-cm">Executable quote <b>—</b></span>' : '<span class="pt-cm">Last <b>' + selectedQuote.cur + '¢</b> <span class="' + (chg >= 0 ? 'up' : 'down') + '">' + (chg >= 0 ? '+' : '') + round(chg, 1) + '</span></span><span class="pt-cm">Bid <b>' + selectedQuote.bid + '¢</b></span><span class="pt-cm">Ask <b>' + selectedQuote.ask + '¢</b></span><span class="pt-cm">Normalized <b>' + selectedQuote.norm + '%</b></span>'; }
    else { cHeadM += '<span class="pt-cm">Mark <b>' + perpQuote.mark + '</b></span><span class="pt-cm">Funding <b class="' + (mk.funding >= 0 ? 'up' : 'down') + '">' + (mk.funding >= 0 ? '+' : '') + mk.funding + '%</b></span><span class="pt-cm">OI <b>' + money(mk.oi) + '</b></span>'; }
    cHeadM += '</div></div>';
    if (mk.hasTradeHistory === false) {
      h += '<div class="pt-chartwrap"><div class="pt-empty pt-preopen-history"><b>No executed market history.</b><p>This contract is listed for discovery but has not opened for trading. The page will begin drawing OHLC candles only after real simulated executions exist.</p></div></div>';
    } else {
      h += chartFigure(m, cHeadM, (mt === 'perps' ? 'Perpetual mark ' + perpQuote.mark : isSettledAtPlayhead ? selected.name + ' settled at ' + selectedQuote.cur + ' cents; the chart ends at the last executable interval before cutoff' : selected.name + ' traded at ' + selectedQuote.cur + ' cents, bid ' + selectedQuote.bid + ', ask ' + selectedQuote.ask) + ' as of ' + fdate(asOfT) + '. Stored fills use solid markers at execution time and price; explicitly estimated legacy records use hollow markers.');
    }
    /* outcome table */
    h += outcomeTable(m);
    /* community + market-wide activity are mounted by market-community.js.
       Keeping the fixture renderer separate lets the shared terminal repaint
       without mixing public discussion with the user's private fill ledger. */
    var communityOutcomes = mt === 'perps'
      ? ['Long', 'Short']
      : mk.outcomes.map(function (outcome) { return outcome.name; });
    var communityPrice = mt === 'perps'
      ? (perpQuote ? perpQuote.mark : '')
      : (selectedQuote ? selectedQuote.cur : '');
    var communityOutcomePrices = mt === 'perps'
      ? [communityPrice, communityPrice]
      : mk.outcomes.map(function (outcome) { return outcomeQuoteAt(outcome, S.asOf).cur; });
    h += '<section class="bmc-shell" data-bmc-slot'
      + ' data-market-key="' + esc(mk.id + ':' + mt) + '"'
      + ' data-market-id="' + esc(mk.id) + '"'
      + ' data-creator="' + esc(m.name) + '"'
      + ' data-handle="' + esc(m.handle) + '"'
      + ' data-question="' + esc(mk.question) + '"'
      + ' data-instrument="' + esc(mt) + '"'
      + ' data-outcomes="' + esc(JSON.stringify(communityOutcomes)) + '"'
      + ' data-outcome-prices="' + esc(JSON.stringify(communityOutcomePrices)) + '"'
      + ' data-selected-outcome="' + esc(selected ? selected.name : (S.side || 'Long')) + '"'
      + ' data-current-price="' + esc(communityPrice) + '"'
      + ' data-deadline="' + esc(mk.deadline || 'Continuous') + '"'
      + ' data-target="' + esc(mk.targetLabel || mk.indexName || 'the rule-defined target') + '"'
      + ' data-source="' + esc(mk.source || 'the settlement source') + '"'
      + ' data-market-status="' + esc(lifecycle.label) + '"'
      + ' data-market-open="' + (lifecycle.open ? 'true' : 'false') + '"'
      + ' data-has-history="' + (mk.hasTradeHistory === false ? 'false' : 'true') + '"'
      + ' aria-label="Market community and activity">'
      + '<div class="bmc-loading" aria-live="polite">Opening community…</div></section>';
    /* contract observation / reference index — deliberately separate from traded odds */
    h += underlyingBlock(m);
    /* about + rules */
    h += block('About', 'context', aboutBlock(m));
    h += block('Market rules', 'settlement', rulesBlock(m));
    /* activity / fills */
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Your fills &amp; P&amp;L</h4><span class="note">' + (hasEstimatedFill ? 'legacy entries labeled as estimates' : 'simulated execution receipts') + '</span></div><div class="pt-block-b">';
    if (!myBets.length) {
      h += '<div class="pt-empty"><b>No fills for this selected outcome.</b><p>' + (mk.hasTradeHistory === false ? 'This contract has not opened, so no order ticket or execution history exists.' : lifecycle.open ? 'Place a simulated order from the ticket. Its fill marker, fees and P&amp;L will appear here.' : 'This market is read-only; no new fills can be recorded.') + '</p></div>';
    } else {
      myBets.forEach(function (b) {
        var buy = b.action !== 'SELL' && b.side !== 'SHORT', bi = m.bets.indexOf(b);
        var resultCell = b.estimated ? '<b style="color:var(--pt-warn)">Estimate</b><small>not an execution P&amp;L</small>' : '<b class="' + (Number(b.pnl || 0) >= 0 ? 'pos' : 'neg') + '">' + signedMoney(Number(b.pnl || 0)) + '</b><small>fee ' + money(b.fee || 0) + '</small>';
        h += '<button class="pt-fill-row" data-bet="' + bi + '"><span class="fill-action" style="color:' + (buy ? COL.up : COL.down) + '">' + (buy ? '▲ ' : '▼ ') + esc(b.action || b.side) + '</span><span><b>' + esc(b.outcomeLabel || b.outcome || b.side) + ' · ' + money(b.size) + ' @ ' + esc(b.entryLabel) + '</b><small>' + fdatetime(b.t) + ' · ' + esc(b.fillId || 'fill') + '</small></span><span>' + resultCell + '</span></button>';
      });
    }
    h += '</div></div>';
    h += '</div>'; // end main

    /* right trade panel */
    h += '<div class="pt-side">' + tradePanel(m);
    h += '<div class="pt-block"><div class="pt-block-h"><h4>Underwriting context</h4><span class="note">separate terminal</span></div><div class="pt-block-b"><p class="pt-comp-def" style="margin:0">Proof of Attention answers a creator-underwriting question, not a market-pricing question. Its composition, evidence, confidence and limitations open on a separate attention axis.</p><button class="pt-order" data-goto-poa style="background:var(--pt-surface2);color:var(--pt-ink);margin-top:9px">Open Proof of Attention →</button><p class="pt-sim">Advisory only. PoA never settles this contract and is never plotted on the traded-price chart.</p></div></div>';
    h += '</div>'; // end side
    h += '</div>'; // end body

    /* footer */
    h += '<div class="pt-sources"><div class="row1"><span>Contract <b>' + esc(mk.id) + ' · ' + esc(mk.version) + '</b></span><span>' + (mk.hasTradeHistory === false ? 'Listed' : 'Opened') + ' <b>' + esc(mk.hasTradeHistory === false ? (mk.listedAt || 'Pre-open listing') : mk.openedAt) + '</b></span><span>' + (mt === 'perps' ? 'Instrument' : 'Expiry / resolution') + ' <b>' + esc(mk.deadline || 'Continuous') + '</b></span><span>Settlement <b>' + esc((mk.source || 'YouTube public data')) + '</b></span><span>Price basis <b>' + (mk.hasTradeHistory === false ? 'No executions or quotes yet' : isSettledAtPlayhead ? 'Final settlement value; no executable quote' : mt === 'perps' ? 'Executed / mark / index' : 'Last trade; normalized probability is non-executable') + '</b></span><span>As of <b>' + fdatetime(asOfT) + ' · ' + esc(mk.dataLatency) + '</b></span></div>';
    h += '<div class="disclosure">Market odds reflect traded prices, not Backer’s independent probability estimate. Creator-attention signals provide context and do not settle this contract. Seeded community profiles, comments, reactions, and market activity are generated demo fixtures and do not represent real users or trades; browser-session posts are local. No real money moves.</div>';
    h += '<div class="acts"><button data-goto-poa>Proof of Attention</button><button data-datatable>Open data table</button><button data-correction2>Report incorrect data</button></div></div>';
    h += '<div class="pt-evcard" id="ptEvCard" aria-hidden="true"></div><div class="pt-sr" aria-live="polite" id="ptLive"></div></div>';
    return h;
  }
  function outcomeTable(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var lifecycle = marketLifecycle(m, mt);
    var isSettledAtPlayhead = settledAtPlayhead(mk, S.asOf);
    var h = '<div class="pt-block"><div class="pt-block-h"><h4>Outcomes</h4><span class="note">normalized probability ≠ executable quote</span></div><div class="pt-block-b">';
    if (mk.hasTradeHistory === false) {
      return h + '<div class="pt-empty"><b>YES · reaches target / NO · misses target</b><p>Quotes and normalized market probabilities will appear only after trading opens. No pre-market odds are inferred from milestone progress or Proof of Attention.</p></div></div></div>';
    }
    if (mt !== 'perps') {
      h += '<div class="pt-otc-head" aria-hidden="true"><span>Outcome</span><span>Normalized</span><span>Last</span><span>Bid</span><span>Ask</span><span>Trade</span></div>';
      var outs = mk.outcomes;
      outs.forEach(function (o, i) {
        var q = outcomeQuoteAt(o, S.asOf);
        var isSelected = mt === 'pk' ? S.outcome === i : S.side === o.id;
        var selectAttr = mt === 'pk' ? 'data-outcome="' + i + '"' : 'data-side="' + o.id + '"';
        var bidText = isSettledAtPlayhead ? '—' : q.bid + '¢';
        var askText = isSettledAtPlayhead ? '—' : q.ask + '¢';
        var tradeCell = lifecycle.open ? '<span class="otc-actions"><button data-quote-action="BUY" data-quote-outcome="' + i + '" data-quote-id="' + o.id + '">Buy</button><button data-quote-action="SELL" data-quote-outcome="' + i + '" data-quote-id="' + o.id + '">Sell</button></span>' : '<span class="otc-actions"><em>' + (isSettledAtPlayhead ? 'Settled' : lifecycle.label === 'RESOLVED' ? 'Historical' : 'Closed') + '</em></span>';
        h += '<div class="pt-otc-row ' + (isSelected ? 'sel' : '') + '" role="group" aria-label="' + esc(o.name) + ' market outcome"><button class="otc-name otc-select" ' + selectAttr + ' aria-pressed="' + isSelected + '" aria-label="Select ' + esc(o.name) + ' for the chart and position"><i class="lr-dot" style="background:' + o.color + '"></i>' + esc(o.name) + '</button><span class="otc-pct"><small>' + (isSettledAtPlayhead ? 'Final value' : 'Normalized') + '</small>' + q.norm + '%</span><span class="otc-num"><small>' + (isSettledAtPlayhead ? 'Settlement' : 'Last') + '</small>' + q.cur + '¢</span><span class="otc-num"><small>Bid</small>' + bidText + '</span><span class="otc-num"><small>Ask</small>' + askText + '</span>' + tradeCell + '</div>';
      });
    } else {
      var pq = perpQuoteAt(mk, S.asOf);
      [['Last price', pq.last], ['Mark price', pq.mark], ['Index price', pq.index], ['Basis', round(pq.mark - pq.index, 2) + ' idx'], ['Funding rate / 8h', (mk.funding >= 0 ? '+' : '') + mk.funding + '%'], ['Open interest', money(mk.oi)], ['24h volume', money(pq.point.vol || 0)]].forEach(function (r) { h += '<div class="pt-kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; });
    }
    h += '<p class="pt-comp-def" style="margin-top:8px">' + (mt === 'perps' ? 'Perpetual has no binary settlement. Last, mark and index are distinct; funding transfers between longs and shorts.' : 'Normalized chance and the executable quote are distinct. Zero-trade intervals show as gaps, not synthetic candles.') + '</p></div></div>';
    return h;
  }
  function underlyingBlock(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var h = '<div class="pt-block pt-underlying"><div class="pt-block-h"><h4>' + (mt === 'milestone' ? 'Underlying milestone' : mt === 'pk' ? 'Official measurement' : 'Reference index') + '</h4><span class="note">separate from traded odds</span></div><div class="pt-block-b">';
    if (mt === 'milestone') {
      var observation = mk.observations && mk.observations[S.asOf] ? mk.observations[S.asOf] : { valueLabel: mk.currentLabel, progress: mk.underlyingProgress, t: tOf(S.asOf) };
      h += '<div class="pt-underlying-lead"><div><small>' + esc(mk.underlyingMetric) + '</small><b>' + esc(observation.valueLabel) + ' <em>of</em> ' + esc(mk.targetLabel) + '</b></div><strong>' + round(observation.progress, 1) + '%</strong></div>';
      h += '<div class="pt-progress-track" role="progressbar" aria-label="Underlying milestone progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + round(observation.progress, 1) + '"><i style="width:' + round(observation.progress, 1) + '%"></i></div>';
      h += '<div class="pt-grid2 pt-underlying-meta"><div class="pt-kv"><span>Observed</span><b>' + esc(observation.valueLabel) + '</b></div><div class="pt-kv"><span>Observation time</span><b>' + fdatetime(observation.t) + '</b></div><div class="pt-kv"><span>Target</span><b>' + esc(mk.targetLabel) + '</b></div><div class="pt-kv"><span>Cutoff</span><b>' + esc(mk.deadline) + '</b></div><div class="pt-kv"><span>Source</span><b>' + esc(mk.source) + '</b></div></div>';
      h += '<p class="pt-underlying-note">This bar reports observed progress toward the public milestone. It is not a probability, a traded price, or a Proof-of-Attention score. Only the written market rules and retained source snapshot determine settlement.</p>';
    } else if (mt === 'pk') {
      h += '<div class="pt-measure-state"><span>Current measurement state</span><b>Awaiting the next eligible upload window</b></div>';
      h += '<div class="pt-grid2 pt-underlying-meta"><div class="pt-kv"><span>Metric</span><b>Comparable public 72h views</b></div><div class="pt-kv"><span>Window</span><b>' + esc(mk.deadline) + '</b></div><div class="pt-kv"><span>Oracle</span><b>' + esc(mk.source) + '</b></div><div class="pt-kv"><span>Tie handling</span><b>Explicit third outcome</b></div></div>';
      h += '<p class="pt-underlying-note">No official result is available yet. The colored lines above are traded outcome prices; they are not creator view counts. Timestamped public measurements appear here only after the rule-defined window closes.</p>';
    } else {
      var pq = perpQuoteAt(mk, S.asOf), basis = round(pq.mark - pq.index, 2);
      h += '<div class="pt-underlying-lead"><div><small>' + esc(mk.indexName) + '</small><b>Index ' + pq.index + ' <em>· mark ' + pq.mark + '</em></b></div><strong class="' + (basis >= 0 ? 'pos' : 'neg') + '">' + (basis >= 0 ? '+' : '') + basis + '</strong></div>';
      h += '<div class="pt-grid2 pt-underlying-meta"><div class="pt-kv"><span>Reference index</span><b>' + pq.index + '</b></div><div class="pt-kv"><span>Contract mark</span><b>' + pq.mark + '</b></div><div class="pt-kv"><span>Mark–index basis</span><b>' + (basis >= 0 ? '+' : '') + basis + ' idx</b></div><div class="pt-kv"><span>Methodology</span><b>' + esc(mk.source) + '</b></div></div>';
      h += '<p class="pt-underlying-note">The reference index and traded contract price are independent series. This instrument has no binary probability or YES/NO settlement, and the index is not an authenticity score.</p>';
    }
    h += '</div></div>';
    return h;
  }
  function aboutBlock(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var lifecycle = marketLifecycle(m, mt);
    var first = m.name.split(' ')[0];
    var body = mt === 'milestone' ? ('This contract resolves on ' + first + '’s disclosed public metric at the stated cutoff. Traded prices, public milestone observations, and Backer’s underwriting remain separate: underwriting is advisory context and never settles the contract.')
      : mt === 'pk' ? ('A head-to-head market on the rule-defined engagement metric for ' + mk.outcomes.map(function (o) { return esc(o.name); }).join(' vs ') + '. Only the contract-defined comparable metric is used to resolve. Creator-attention signals provide context only.')
        : ('A continuous instrument tracking the ' + esc(mk.indexName) + ', derived from ' + mk.drivers.slice(0, 4).join(', ').toLowerCase() + '. It is not equity, not a probability, and not an authenticity score.');
    return '<p style="font-size:12px;color:var(--pt-muted);line-height:1.6;margin:0 0 10px">' + body + '</p>' +
      '<div class="pt-grid2"><div class="pt-kv"><span>Market type</span><b>' + (mt === 'milestone' ? 'Binary milestone' : mt === 'pk' ? 'Mutually exclusive outcomes' : 'Perpetual contract') + '</b></div><div class="pt-kv"><span>Lifecycle</span><b>' + esc(lifecycleLabel(lifecycle.label)) + '</b></div><div class="pt-kv"><span>Reference metric / index</span><b>' + esc(mk.source) + '</b></div><div class="pt-kv"><span>Resolution / cadence</span><b>' + esc(mk.deadline || 'Continuous; 8h funding') + '</b></div></div>' +
      '<p class="pt-rule-callout">Market consensus and Proof of Attention answer different questions. PoA provides creator-underwriting context; it is never an outcome oracle and is never plotted on this price axis.</p>';
  }
  function rulesBlock(m) {
    var mt = S.mtype, mk = m.markets[mt];
    var rows = mt === 'milestone' ? [['Resolves YES if', esc(mk.question).replace(/^Will\s+/, '')], ['Oracle / settlement source', esc(mk.source)], ['Measurement cutoff', esc(mk.deadline) + ' · final retained public snapshot'], ['Payout', '$1 per YES share if true; $0 if false'], ['Pause / reopen', 'Pause on a stale or unavailable oracle; reopen after two valid snapshots'], ['Void / refund', 'Invalid, permanently unavailable, or cancelled source events refund at original cost']]
      : mt === 'pk' ? [['Resolves to', 'the outcome with the highest rule-defined comparable metric'], ['Metric / oracle', esc(mk.source)], ['Tie handling', '“Tie / no winner” resolves if leading outcomes are equal at the cutoff'], ['Delay / deletion', 'Measurement pauses during platform outage, deletion, or private status; a 24h grace period applies'], ['Invalid event', 'Cancelled or incomparable events void and refund all open shares'], ['Dispute process', 'Timestamped source snapshots are rechecked before final settlement']]
        : [['Mark price', 'contract-defined fair mark used for P&L and liquidation'], ['Index', esc(mk.source) + ' · versioned contributor weights'], ['Funding', 'periodic transfer between longs and shorts every 8h'], ['Liquidation', 'position closes when margin falls below maintenance requirement'], ['Stale-index halt', 'new orders pause if index contributors are stale or disagree materially'], ['Reopen / safeguards', 'reopen after fresh quorum; manipulation review can exclude a contributor']];
    return rows.map(function (r) { return '<div class="pt-kv"><span>' + r[0] + '</span><b style="max-width:62%;text-align:right;white-space:normal">' + r[1] + '</b></div>'; }).join('') + '<p class="pt-rule-callout">Data latency: ' + esc(mk.dataLatency) + '. Fallback and disputes use immutable source snapshots. <button data-correction2>Report incorrect data</button></p>';
  }
  function first0(m) { return m.name.split(' ')[0]; }

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
    var visible = m.content.filter(function (ct) { return ct.publishedIdx <= S.asOf; }).map(function (ct) {
      var age = Math.max(1, S.asOf - ct.publishedIdx + 1), maturity = clamp(age / 20, 0.08, 1);
      return { ct: ct, age: age, views: Math.max(1, Math.round(ct.views * maturity)), likes: Math.max(0, Math.round(ct.likes * maturity)), comments: ct.comments == null ? null : Math.max(0, Math.round(ct.comments * maturity)) };
    });
    var totalViews = visible.reduce(function (sum, row) { return sum + row.views; }, 0) || 1;
    return visible.map(function (row) {
      var ct = row.ct, contribution = Math.round(row.views / totalViews * 100), matured = row.age >= 3;
      var eff = !matured ? 'eff-neu' : ct.effect === 'POSITIVE' ? 'eff-pos' : ct.effect === 'NEGATIVE' ? 'eff-neg' : 'eff-neu';
      return '<div class="pt-content-row" data-content="' + ct.id + '" tabindex="0" role="button" aria-label="Open content evidence for ' + esc(ct.title) + '"><div class="pt-thumb" style="background:hsl(' + m.hue + ' 40% 24%)"><i style="background:hsl(' + m.hue + ' 50% 40%)"></i></div>' +
        '<div class="pt-content-m"><div class="ct">' + esc(ct.title) + (matured && ct.flag ? '<span class="flag-tag">' + ct.flag + '</span>' : '') + '</div>' +
        '<div class="cs">' + ct.format.toLowerCase().replace('_', '-') + ' · ' + fdate(ct.publishedAt) + ' · ' + fmt(row.views) + ' captured views · ' + fmt(row.likes) + ' likes · ' + (row.comments == null ? 'comments n/a' : fmt(row.comments) + ' cmts') + '</div></div>' +
        '<div class="pt-content-bar"><div class="pct ' + eff + '">' + contribution + '%</div><div class="barh"><i style="width:' + contribution + '%"></i></div></div></div>';
    }).join('') + '<p class="pt-comp-def" style="margin-top:8px">Contribution = share of captured public views during the selected window. Select an item on the chart events or here for its trajectory. Concentration flags describe distribution, never manipulation.</p>';
  }
  function idxCard(ix) {
    if (ix.score == null) return '<div class="pt-idx"><div class="pt-idx-h"><small>' + ix.key + '</small><b style="color:var(--pt-gray)">Unavailable</b></div><div class="pt-idx-range">confidence insufficient</div><p>' + esc(ix.interp) + '</p><ul><li class="lim">Limit: ' + esc(ix.lim) + '</li></ul></div>';
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
    var rows = m.evidenceRows.filter(function (e) { return e.availableIdx <= S.asOf && (!S.band || bandFilterMatch(S.band, e)); });
    var byCat = {};
    rows.forEach(function (e) { (byCat[e.cat] = byCat[e.cat] || []).push(e); });
    var out = '';
    Object.keys(byCat).forEach(function (cat) {
      out += '<div class="pt-ev-cat">' + cat + '</div>';
      byCat[cat].forEach(function (e) {
        var effCol = e.effect === 'POSITIVE' ? COL.up : e.effect === 'NEGATIVE' ? COL.down : COL.muted;
        out += '<div class="pt-ev-row"><div class="pt-ev-top" data-evrow tabindex="0" role="button" aria-expanded="false"><span class="en">' + esc(e.name) + '<small>' + esc(e.sample) + '</small></span><span class="ev-val ' + (e.unavailable ? 'ev-unavail' : '') + '">' + esc(e.val) + '<small style="color:' + effCol + '">' + e.effect.toLowerCase() + ' · ' + (e.conf ? e.conf.toLowerCase() : '') + '</small></span></div>' +
          '<div class="pt-ev-detail">' + esc(e.explain) + ' <em style="color:var(--pt-muted2)">Benchmark: ' + esc(e.benchmark) + (e.unavailable ? ' · Unavailable — reduces confidence, not an allegation.' : '') + '</em></div></div>';
      });
    });
    return out || '<div class="pt-empty"><b>No retained evidence at this playhead.</b><p>Step forward to reveal observations in timestamp order; later evidence is never backfilled into this historical view.</p></div>';
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
    var focusToken = capturePaintFocus();
    ROOT.innerHTML = template(S.model);
    bind();
    restorePaintFocus(focusToken);
  }
  function capturePaintFocus() {
    var active = document.activeElement;
    if (!ROOT || !active || !ROOT.contains(active)) return null;
    if (active.id) return { selector: '#' + active.id, index: 0 };
    var attrs = ['data-mtype', 'data-scope', 'data-range', 'data-interval', 'data-speed', 'data-replay', 'data-scrub', 'data-side', 'data-outcome', 'data-trade-side', 'data-quote-action', 'data-order-type', 'data-lev', 'data-amt', 'data-band', 'data-order', 'data-goto-poa', 'data-goto-market'];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!active.hasAttribute || !active.hasAttribute(attr)) continue;
      var raw = active.getAttribute(attr);
      var value = String(raw == null ? '' : raw).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var selector = '[' + attr + '="' + value + '"]';
      var matches = Array.prototype.slice.call(ROOT.querySelectorAll(selector));
      return { selector: selector, index: Math.max(0, matches.indexOf(active)) };
    }
    if (active.classList && active.classList.contains('pt-figure')) return { selector: '.pt-figure', index: 0 };
    return null;
  }
  function restorePaintFocus(token) {
    if (!token || !ROOT) return;
    var matches;
    try { matches = ROOT.querySelectorAll(token.selector); } catch (focusSelectorErr) { return; }
    var target = matches[Math.min(token.index || 0, Math.max(0, matches.length - 1))];
    if (target) try { target.focus(); } catch (focusErr) {}
  }
  function setLive(msg) { var l = document.getElementById('ptLive'); if (l) l.textContent = msg; }

  function bind() {
    var term = ROOT.querySelector('.pt-term');
    // Keep the ticket first in keyboard order on compact layouts while grid areas
    // retain the familiar chart-left / ticket-right desktop composition.
    if (term && (term.classList.contains('pt-market-surface') || term.classList.contains('pt-poa-surface'))) {
      var marketBody = term.querySelector('.pt-body');
      var marketMain = marketBody && marketBody.querySelector('.pt-main');
      var marketSide = marketBody && marketBody.querySelector('.pt-side');
      if (marketBody && marketMain && marketSide) marketBody.insertBefore(marketSide, marketMain);
    }
    // close
    ROOT.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    // surface cross-links + scope
    ROOT.querySelectorAll('[data-goto-poa]').forEach(function (el) { el.addEventListener('click', function () { S.surface = 'poa'; S.band = null; track('poa_viewed', { from: 'market' }); paint(); focusTop(); }); });
    ROOT.querySelectorAll('[data-goto-market]').forEach(function (el) { el.addEventListener('click', function () { S.surface = 'market'; track('poa_market_context_toggled', { on: true }); paint(); focusTop(); }); });
    function activateMarketTab(nextType, restoreFocus) {
      S.mtype = nextType;
      S.side = S.mtype === 'perps' ? (S.model.defaultSide || 'LONG') : 'YES';
      S.outcome = S.mtype === 'pk' ? (S.model.defaultOutcome || 0) : 0;
      S.tradeSide = 'BUY'; S.orderType = 'MARKET';
      var selected = selectedMarketOutcome(S.model, S);
      if (selected) S.limitPrice = outcomeQuoteAt(selected, S.asOf).ask;
      else if (S.mtype === 'perps') S.limitPrice = perpQuoteAt(S.model.markets.perps, S.asOf).mark;
      if (document.body && document.body.classList.contains('mdp-page') && window.history && window.URL) {
        try { var routeURL = new URL(window.location.href); routeURL.searchParams.set('instrument', S.mtype); history.replaceState(null, '', routeURL.pathname + routeURL.search); } catch (routeErr) {}
      }
      track('market_instrument_changed', { instrument: S.mtype }); paint();
      if (restoreFocus) {
        var activeTab = ROOT.querySelector('[data-mtype="' + S.mtype + '"]');
        if (activeTab) try { activeTab.focus(); } catch (focusErr) {}
      }
    }
    var marketTabs = Array.prototype.slice.call(ROOT.querySelectorAll('[data-mtype]'));
    marketTabs.forEach(function (el, index) {
      el.addEventListener('click', function () { activateMarketTab(el.dataset.mtype, true); });
      el.addEventListener('keydown', function (e) {
        var nextIndex = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (index + 1) % marketTabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (index - 1 + marketTabs.length) % marketTabs.length;
        else if (e.key === 'Home') nextIndex = 0;
        else if (e.key === 'End') nextIndex = marketTabs.length - 1;
        if (nextIndex != null) {
          e.preventDefault();
          activateMarketTab(marketTabs[nextIndex].dataset.mtype, true);
        }
      });
    });
    ROOT.querySelectorAll('[data-scope]').forEach(function (el) { el.addEventListener('click', function () { S.scope = el.dataset.scope; track('poa_mode_changed', { scope: S.scope }); paint(); }); });
    ROOT.querySelectorAll('[data-range]').forEach(function (el) { el.addEventListener('click', function () { S.range = el.dataset.range; track('poa_timeline_range_changed', { range: S.range }); paint(); }); });
    ROOT.querySelectorAll('[data-interval]').forEach(function (el) { el.addEventListener('click', function () { S.interval = el.dataset.interval; track('poa_candle_interval_changed', { interval: S.interval }); paint(); }); });
    ROOT.querySelectorAll('[data-speed]').forEach(function (el) { el.addEventListener('click', function () { S.speed = +el.dataset.speed; if (S.playing) startReplay(); paint(); }); });
    // replay
    ROOT.querySelectorAll('[data-replay]').forEach(function (el) { el.addEventListener('click', function () { replay(el.dataset.replay); }); });
    var scrub = ROOT.querySelector('[data-scrub]');
    if (scrub) {
      scrub.addEventListener('input', function () {
        stopReplay(); S.asOf = +scrub.value;
        scrub.style.setProperty('--pct', (S.asOf / (NDAYS - 1) * 100) + '%');
        scrub.setAttribute('aria-valuetext', fdatetime(tOf(S.asOf)));
        var asOfLabel = ROOT.querySelector('.pt-asof b'); if (asOfLabel) asOfLabel.textContent = fdatetime(tOf(S.asOf));
      });
      scrub.addEventListener('change', function () { track('poa_timeline_scrubbed', { asOf: S.asOf }); paint(); });
    }
    // trade
    ROOT.querySelectorAll('[data-side]').forEach(function (el) { var fnSide = function () { S.side = el.dataset.side; paint(); }; el.addEventListener('click', fnSide); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fnSide(); } }); });
    ROOT.querySelectorAll('[data-outcome]').forEach(function (el) { var fnOutcome = function () { S.outcome = +el.dataset.outcome; paint(); }; el.addEventListener('click', fnOutcome); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fnOutcome(); } }); });
    ROOT.querySelectorAll('[data-trade-side]').forEach(function (el) { el.addEventListener('click', function () { S.tradeSide = el.dataset.tradeSide; paint(); }); });
    ROOT.querySelectorAll('[data-quote-action]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); S.tradeSide = el.dataset.quoteAction; if (S.mtype === 'pk') S.outcome = +el.dataset.quoteOutcome; else S.side = el.dataset.quoteId; paint(); var orderButton = ROOT.querySelector('[data-order]'); if (orderButton) try { orderButton.focus(); } catch (err) {} }); });
    ROOT.querySelectorAll('[data-order-type]').forEach(function (el) { el.addEventListener('click', function () { S.orderType = el.dataset.orderType; paint(); }); });
    ROOT.querySelectorAll('[data-lev]').forEach(function (el) { el.addEventListener('click', function () { S.leverage = +el.dataset.lev; paint(); }); });
    ROOT.querySelectorAll('[data-amt]').forEach(function (el) { el.addEventListener('click', function () { S.amount = +el.dataset.amt; paint(); }); });
    var amt = ROOT.querySelector('#ptAmt'); if (amt) amt.addEventListener('input', function () { S.amount = clamp(Math.round(+amt.value || 1), 1, 100000); });
    var limit = ROOT.querySelector('#ptLimit'); if (limit) limit.addEventListener('input', function () { S.limitPrice = clamp(round(+limit.value || 1, 1), 1, S.mtype === 'perps' ? 9999 : 99); });
    var order = ROOT.querySelector('[data-order]'); if (order) order.addEventListener('click', openOrderReview);
    // composition bands
    ROOT.querySelectorAll('[data-band]').forEach(function (el) {
      var fn = function () { S.band = S.band === el.dataset.band ? null : el.dataset.band; track('poa_composition_segment_selected', { band: S.band }); paint(); };
      el.addEventListener('click', fn);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
    });
    // evidence expand
    ROOT.querySelectorAll('[data-evrow]').forEach(function (el) {
      var toggleEvidence = function () { var open = el.parentElement.classList.toggle('open'); el.setAttribute('aria-expanded', String(open)); track('poa_evidence_expanded', {}); };
      el.addEventListener('click', toggleEvidence);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEvidence(); } });
    });
    // events
    ROOT.querySelectorAll('[data-ev]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); openEventCard(el.dataset.ev); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openEventCard(el.dataset.ev); } }); });
    ROOT.querySelectorAll('[data-content]').forEach(function (el) { var openContent = function () { openContentCard(el.dataset.content); }; el.addEventListener('click', openContent); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openContent(); } }); });
    ROOT.querySelectorAll('[data-bet]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); openBetCard(+el.dataset.bet); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openBetCard(+el.dataset.bet); } }); });
    // footer actions
    var mth = ROOT.querySelector('[data-methodology]'); if (mth) mth.addEventListener('click', function () { track('poa_methodology_viewed', {}); openInfoCard('Methodology', 'Public Attention Velocity Index: for each retained snapshot, each tracked item’s public view-count change since its previous valid snapshot is converted to a daily-equivalent rate, summed across the catalogue, and normalized so 100 = the creator’s median captured public-view velocity over the preceding 28 eligible days. Likes, comments, watch time, market prices and composition estimates are excluded from this index. PoA composition is a separate estimate expressed as ranges with an explicit confidence grade.'); });
    var lim = ROOT.querySelector('[data-limitations]'); if (lim) lim.addEventListener('click', function () { var p = S.model.platforms.length ? S.model.platforms[0].label : 'platform'; track('poa_limitations_viewed', {}); openInfoCard('Limitations', 'Estimated composition from observable public signals in this illustrative ' + p + ' fixture. Backer cannot see watch time, audience-retention curves, returning-viewer rate, traffic-source mix, device/IP, session behavior, demographics, cross-platform dedup, or platform-private fraud labels. Historical values before Backer began retaining snapshots are not reconstructed. All figures are illustrative.'); });
    var dt = ROOT.querySelector('[data-datatable]'); if (dt) dt.addEventListener('click', function () { track('poa_data_table_opened', {}); openDataTable(); });
    ROOT.querySelectorAll('[data-correction2]').forEach(function (el) { el.addEventListener('click', function () { openInfoCard('Report incorrect data', 'Demo action — no report is sent. In production this opens a dispute referencing the selected timestamp (' + fdatetime(tOf(S.asOf)) + '), the affected series, and the source snapshot so the market or underwriting record can be re-checked.'); }); });

    // chart hover / crosshair
    bindChart();
    // keyboard on figure
    var fig = ROOT.querySelector('.pt-figure');
    if (fig) fig.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stopReplay(); S.asOf = clamp(S.asOf - 1, 0, NDAYS - 1); paint(); focusFigure(); announce(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stopReplay(); S.asOf = clamp(S.asOf + 1, 0, NDAYS - 1); paint(); focusFigure(); announce(); }
      else if (e.key === 'Home') { e.preventDefault(); stopReplay(); S.asOf = 0; paint(); focusFigure(); announce(); }
      else if (e.key === 'End') { e.preventDefault(); stopReplay(); S.asOf = NDAYS - 1; paint(); focusFigure(); announce(); }
    });
    // dialog focus containment + escape
    ROOT.onkeydown = function (e) {
      if (e.key === 'Escape') { if (ROOT.querySelector('.pt-evcard.show')) { closeEventCard(); } else { close(); } return; }
      if (e.key !== 'Tab' || (document.body && document.body.classList.contains('mdp-page'))) return;
      var focusScope = ROOT;
      var focusable = Array.prototype.slice.call(focusScope.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (!focusScope.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
  }
  function focusFigure() { var f = ROOT.querySelector('.pt-figure'); if (f) try { f.focus(); } catch (e) {} }
  function focusTop() { if (ROOT) ROOT.scrollTop = 0; var b = ROOT && ROOT.querySelector('.pt-body'); if (b) b.scrollTop = 0; var x = ROOT && ROOT.querySelector('.pt-x'); if (x) try { x.focus(); } catch (e) {} }
  function announce() {
    if (S.surface === 'market') {
      if (S.mtype === 'perps') { var pq = perpQuoteAt(S.model.markets.perps, S.asOf); setLive('As of ' + fdate(tOf(S.asOf)) + '. Perpetual mark ' + pq.mark + ', index ' + pq.index + '.'); }
      else { var activeMarket = S.model.markets[S.mtype], oq = outcomeQuoteAt(selectedMarketOutcome(S.model, S), S.asOf); setLive(settledAtPlayhead(activeMarket, S.asOf) ? ('As of ' + fdate(tOf(S.asOf)) + '. ' + oq.name + ' final settlement ' + oq.cur + ' cents. No executable bid or ask remains.') : ('As of ' + fdate(tOf(S.asOf)) + '. ' + oq.name + ' last ' + oq.cur + ' cents, bid ' + oq.bid + ', ask ' + oq.ask + '.')); }
      return;
    }
    var last = S.model.days[S.asOf]; setLive('As of ' + fdate(tOf(S.asOf)) + '. Velocity index ' + last.c + '. Evidence confidence ' + (S.model.comp[S.asOf].grade) + '.');
  }

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
      var d = best.d, mk = m.markets[S.mtype], comp = m.comp[d.idx];
      var ev = m.events.filter(function (e) { return e.idx === d.idx; })[0];
      var html = '<div class="tt-time">' + fdatetime(d.t) + (d.status !== 'VALID' ? ' · ' + d.status : '') + '</div>';
      if (S.surface === 'market') {
        var marketPoint = S.mtype === 'perps' ? mk.ohlc[d.idx] : selectedMarketOutcome(m, S).candles[d.idx];
        if (!marketPoint || marketPoint.status === 'GAP') {
          html += '<div class="tt-note">No executed trades in this interval. The chart preserves the gap.</div>';
        } else {
          html += '<div class="tt-row"><span>O / H / L / C</span><b>' + marketPoint.o + ' / ' + marketPoint.h + ' / ' + marketPoint.l + ' / ' + marketPoint.c + (S.mtype === 'perps' ? '' : '¢') + '</b></div>';
          html += '<div class="tt-row"><span>Volume / trades</span><b>' + fmt(marketPoint.vol) + ' / ' + marketPoint.tradeCount + '</b></div>';
          html += '<div class="tt-row"><span>Bid / ask</span><b>' + marketPoint.bid + ' / ' + marketPoint.ask + (S.mtype === 'perps' ? '' : '¢') + '</b></div>';
          html += '<div class="tt-row"><span>Mid / spread</span><b>' + marketPoint.quoteMid + ' / ' + round(marketPoint.ask - marketPoint.bid, 2) + '</b></div>';
          if (S.mtype === 'perps') html += '<div class="tt-row"><span>Mark / index</span><b>' + marketPoint.mark + ' / ' + marketPoint.index + '</b></div>';
        }
        var intervalFill = m.bets.filter(function (b) { return b.market === S.mtype && b.idx === d.idx && b.real; })[0];
        if (intervalFill) html += '<div class="tt-note">● Your fill: ' + esc(intervalFill.action || intervalFill.side) + ' ' + money(intervalFill.size) + ' @ ' + esc(intervalFill.entryLabel) + '</div>';
        html += '<div class="tt-note">Source latency: ' + esc(mk.dataLatency) + '</div>';
      } else {
        html += '<div class="tt-row"><span>Velocity O/C</span><b>' + d.o + ' → ' + d.c + '</b></div>';
        html += '<div class="tt-row"><span>High/Low</span><b>' + d.h + ' / ' + d.l + '</b></div>';
        html += '<div class="tt-row"><span>Captured Δviews</span><b>' + (d.vol < 0 ? '<span class="down">' + fmt(d.vol) + '</span>' : fmt(d.vol)) + '</b></div>';
        html += '<div class="tt-row"><span>PoA (core/pas/anom/un)</span><b>' + comp.point.core + '/' + comp.point.passive + '/' + comp.point.anom + '/' + comp.point.un + '</b></div>';
        html += '<div class="tt-row"><span>Confidence</span><b class="' + (comp.grade === 'HIGH' ? 'up' : comp.grade === 'LOW' ? 'warn' : '') + '">' + comp.grade + '</b></div>';
        html += '<div class="tt-row"><span>Coverage</span><b>' + d.coverage + '%</b></div>';
      }
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
  function showCard(html) {
    if (S && S.playing) {
      stopReplay();
      var replayButton = ROOT.querySelector('[data-replay="play"]');
      if (replayButton) { replayButton.classList.remove('on'); replayButton.setAttribute('aria-label', 'Play replay'); replayButton.innerHTML = ICO.play; }
    }
    var c = evCard();
    cardLastFocus = document.activeElement && ROOT.contains(document.activeElement) ? document.activeElement : null;
    c.innerHTML = html; c.classList.add('show'); c.setAttribute('role', 'dialog'); c.setAttribute('aria-labelledby', 'ptEvCardTitle'); c.setAttribute('aria-hidden', 'false');
    var x = c.querySelector('[data-evx]');
    if (x) { x.addEventListener('click', closeEventCard); try { x.focus(); } catch (focusErr) {} }
  }
  function closeEventCard() {
    var c = evCard();
    if (c) { c.classList.remove('show'); c.innerHTML = ''; c.style.width = ''; c.removeAttribute('role'); c.removeAttribute('aria-labelledby'); c.setAttribute('aria-hidden', 'true'); }
    if (cardLastFocus && ROOT.contains(cardLastFocus)) try { cardLastFocus.focus(); } catch (focusErr) {}
    cardLastFocus = null;
  }
  function cardHead(k, title) { return '<div class="pt-evcard-h"><div><div class="evk">' + esc(k) + '</div><h5 id="ptEvCardTitle">' + esc(title) + '</h5></div><button class="pt-x" data-evx aria-label="Close details">' + ICO.x + '</button></div>'; }
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
    var age = Math.max(1, S.asOf - ct.publishedIdx + 1), maturity = clamp(age / 20, 0.08, 1);
    var viewsAt = Math.max(1, Math.round(ct.views * maturity)), likesAt = Math.max(0, Math.round(ct.likes * maturity)), commentsAt = ct.comments == null ? null : Math.max(0, Math.round(ct.comments * maturity));
    var visibleTotal = S.model.content.filter(function (x) { return x.publishedIdx <= S.asOf; }).reduce(function (sum, x) { return sum + Math.max(1, Math.round(x.views * clamp(Math.max(1, S.asOf - x.publishedIdx + 1) / 20, 0.08, 1))); }, 0) || 1;
    var contributionAt = Math.round(viewsAt / visibleTotal * 100);
    track('poa_content_selected', { id: id });
    var h = cardHead('Content · ' + ct.format.toLowerCase().replace('_', '-'), ct.title);
    h += '<div class="pt-evcard-b"><div class="pt-kv"><span>Published</span><b>' + fdatetime(ct.publishedAt) + '</b></div>';
    h += '<div class="pt-kv"><span>Captured views / likes</span><b>' + fmt(viewsAt) + ' / ' + fmt(likesAt) + '</b></div>';
    h += '<div class="pt-kv"><span>Comments</span><b>' + (commentsAt == null ? 'Unavailable' : fmt(commentsAt)) + '</b></div>';
    h += '<div class="pt-kv"><span>Captured-view share</span><b>' + contributionAt + '%</b></div>';
    h += '<div class="pt-kv"><span>Engagement depth</span><b>' + ct.engagementDepth + '</b></div>';
    h += '<div class="pt-kv"><span>Comment diversity</span><b>' + ct.diversity + '</b></div>';
    h += '<div class="pt-kv"><span>Evidence confidence</span><b>' + ct.conf + '</b></div>';
    h += '<div class="pt-kv"><span>Creator-level effect</span><b class="' + (ct.effect === 'POSITIVE' ? 'pos' : ct.effect === 'NEGATIVE' ? 'neg' : '') + '">' + ct.effect.toLowerCase() + '</b></div>';
    h += '<p style="margin-top:9px">This item contributed ' + contributionAt + '% of captured views during the selected playhead window' + (age >= 3 && ct.flag === 'CONCENTRATION' ? ' and increased creator-level concentration risk.' : age >= 3 && ct.flag === 'SHORTS-DEPENDENT' ? ' via Shorts-format reach, which limits durability uplift.' : '.') + '</p></div>';
    showCard(h);
  }
  function openBetCard(i) {
    var b = S.model.bets[i]; if (!b) return;
    var buy = b.action !== 'SELL' && b.side !== 'SHORT';
    var h = cardHead((b.estimated ? 'Legacy position estimate · ' : 'Fill receipt · ') + b.market, (b.action || b.side) + ' ' + (b.outcomeLabel || b.outcome || b.side) + ' · ' + money(b.size));
    h += '<div class="pt-evcard-b"><div class="pt-kv"><span>Order ID</span><b>' + esc(b.orderId || '—') + '</b></div><div class="pt-kv"><span>Fill ID</span><b>' + esc(b.fillId || '—') + '</b></div>';
    h += '<div class="pt-kv"><span>Order placed</span><b>' + fdatetime(b.placedAt || b.t) + '</b></div><div class="pt-kv"><span>Filled</span><b>' + fdatetime(b.t) + '</b></div>';
    h += '<div class="pt-kv"><span>Action / outcome</span><b class="' + (buy ? 'pos' : 'neg') + '">' + esc(b.action || b.side) + ' · ' + esc(b.outcomeLabel || b.outcome || b.side) + '</b></div>';
    h += '<div class="pt-kv"><span>Order type / requested</span><b>' + esc(b.orderType || 'MARKET') + (b.requestedPrice ? ' · ' + b.requestedPrice + '¢' : '') + '</b></div>';
    h += '<div class="pt-kv"><span>Executed odds / price</span><b>' + esc(b.entryLabel) + '</b></div>';
    h += '<div class="pt-kv"><span>Quantity</span><b>' + round(Number(b.quantity || 0), 2) + '</b></div><div class="pt-kv"><span>Gross ' + (buy ? 'cost' : 'proceeds') + '</span><b>' + money(b.size) + '</b></div><div class="pt-kv"><span>Fee</span><b>' + money(b.fee || 0) + '</b></div>';
    h += '<div class="pt-kv"><span>Position effect</span><b class="' + (buy ? 'pos' : 'neg') + '">' + (buy ? '+' : '−') + round(Number(b.quantity || 0), 2) + '</b></div><div class="pt-kv"><span>Post-fill position</span><b>' + round(Number(b.postSize == null ? b.quantity || 0 : b.postSize), 2) + '</b></div>';
    h += '<div class="pt-kv"><span>Status</span><b>' + b.status + '</b></div>';
    h += '<div class="pt-kv"><span>Realized / fill P&amp;L</span><b class="' + (Number(b.pnl || 0) >= 0 ? 'pos' : 'neg') + '">' + (b.estimated ? 'Unavailable / unavailable' : signedMoney(Number(b.realized || 0)) + ' / ' + signedMoney(Number(b.pnl || 0))) + '</b></div>';
    h += '<p style="margin-top:9px">' + (b.estimated ? 'This record predates fill-level storage. Timestamp and entry are explicitly estimated from the legacy demo position; they are not presented as an execution receipt.' : 'Solid marker = executed fill at the exact timestamp and price. This simulated execution receipt links to the same event in your activity ledger.') + '</p></div>';
    showCard(h);
  }
  function openInfoCard(title, body) { showCard(cardHead('Info', title) + '<div class="pt-evcard-b"><p>' + esc(body) + '</p></div>'); }
  function openDataTable() {
    var market = S.surface === 'market', series = S.model.days, title = 'Attention velocity + composition';
    if (market && S.model.markets[S.mtype].hasTradeHistory === false) {
      openInfoCard('No trade data', 'This listed contract has not opened. It has no executions, quotes, volume, or OHLC intervals to display.');
      return;
    }
    if (market) series = S.mtype === 'perps' ? S.model.markets.perps.ohlc : selectedMarketOutcome(S.model, S).candles;
    var rows = series.filter(function (d) { return d.idx <= S.asOf && (!market || d.status !== 'SETTLED'); }).slice(-40);
    if (market) title = (S.mtype === 'perps' ? 'Perpetual executed prices' : selectedMarketOutcome(S.model, S).name + ' traded odds') + ' · last ' + rows.length + ' intervals';
    var h = '<div class="pt-evcard-h"><div><div class="evk">Accessible data</div><h5 id="ptEvCardTitle">' + esc(title) + '</h5></div><button class="pt-x" data-evx aria-label="Close data table">' + ICO.x + '</button></div>';
    if (market) {
      h += '<div class="pt-evcard-b" style="padding:0"><div class="pt-table-wrap"><table class="pt-table"><thead><tr><th>Date</th><th>O</th><th>H</th><th>L</th><th>C</th><th>Volume</th><th>Trades</th><th>Bid</th><th>Ask</th><th>Mid</th><th>Status</th></tr></thead><tbody>';
      rows.forEach(function (d) { h += '<tr><td>' + fdate(d.t) + '</td><td>' + (d.status === 'GAP' ? '—' : d.o) + '</td><td>' + (d.status === 'GAP' ? '—' : d.h) + '</td><td>' + (d.status === 'GAP' ? '—' : d.l) + '</td><td>' + (d.status === 'GAP' ? '—' : d.c) + '</td><td>' + fmt(d.vol) + '</td><td>' + d.tradeCount + '</td><td>' + (d.bid == null ? '—' : d.bid) + '</td><td>' + (d.ask == null ? '—' : d.ask) + '</td><td>' + (d.quoteMid == null ? '—' : d.quoteMid) + '</td><td>' + d.status + '</td></tr>'; });
    } else {
      h += '<div class="pt-evcard-b" style="padding:0"><div class="pt-table-wrap"><table class="pt-table"><thead><tr><th>Date</th><th>O</th><th>H</th><th>L</th><th>C</th><th>Δviews</th><th>Cov%</th><th>Core</th><th>Conf</th><th>Status</th></tr></thead><tbody>';
      rows.forEach(function (d) { var cp = S.model.comp[d.idx]; h += '<tr><td>' + fdate(d.t) + '</td><td>' + d.o + '</td><td>' + d.h + '</td><td>' + d.l + '</td><td>' + d.c + '</td><td>' + fmt(d.vol) + '</td><td>' + d.coverage + '</td><td>' + cp.point.core + '</td><td>' + cp.grade + '</td><td>' + d.status + '</td></tr>'; });
    }
    h += '</tbody></table></div></div>';
    var c = evCard(); c.style.width = 'min(560px,calc(100% - 32px))'; showCard(h);
  }

  /* ---- order ---- */
  function openOrderReview() {
    if (S.asOf !== NDAYS - 1) {
      replay('reset');
      setLive('Returned to the latest market snapshot. Review the current quote before placing a simulated order.');
      return;
    }
    var lifecycle = marketLifecycle(S.model, S.mtype);
    if (!lifecycle.open) {
      setLive(lifecycleLabel(lifecycle.label) + ' markets do not accept new orders. No fill was recorded.');
      return;
    }
    var m = S.model, isPerp = S.mtype === 'perps', selected = isPerp ? null : selectedMarketOutcome(m, S);
    var action = isPerp ? (S.side === 'SHORT' ? 'SELL' : 'BUY') : S.tradeSide;
    var selectedQuote = isPerp ? null : outcomeQuoteAt(selected, S.asOf), perpQuote = isPerp ? perpQuoteAt(m.markets.perps, S.asOf) : null;
    var quoted = isPerp ? perpQuote.mark : (action === 'BUY' ? selectedQuote.ask : selectedQuote.bid);
    var requestedPrice = S.orderType === 'LIMIT' ? clamp(Number(S.limitPrice || quoted), 1, isPerp ? 9999 : 99) : null;
    var entry = quoted;
    var quantity = isPerp ? round(S.amount * S.leverage / Math.max(entry, 0.01), 4) : round(S.amount / Math.max(entry / 100, 0.01), 2);
    var fee = round(S.amount * (isPerp ? 0.0008 : 0.006), 2);
    var outcomeLabel = isPerp ? S.side : selected.name;
    var market = m.markets[S.mtype];
    var h = cardHead('Review simulated order', action + ' ' + outcomeLabel);
    h += '<div class="pt-evcard-b pt-order-review">';
    h += '<div class="pt-kv"><span>Market</span><b>' + esc(market.question) + '</b></div>';
    h += '<div class="pt-kv"><span>Outcome / side</span><b class="' + (action === 'BUY' ? 'pos' : 'neg') + '">' + esc(action + ' ' + outcomeLabel) + '</b></div>';
    h += '<div class="pt-kv"><span>Order type</span><b>' + esc(S.orderType) + (requestedPrice == null ? '' : ' · limit ' + requestedPrice + (isPerp ? ' idx' : '¢')) + '</b></div>';
    h += '<div class="pt-kv"><span>Displayed execution</span><b>' + entry + (isPerp ? ' idx' : '¢') + '</b></div>';
    h += '<div class="pt-kv"><span>Amount / quantity</span><b>' + money(S.amount) + ' / ' + quantity + '</b></div>';
    h += '<div class="pt-kv"><span>Estimated fee</span><b>' + money(fee) + '</b></div>';
    h += '<div class="pt-kv"><span>Maximum loss</span><b class="neg">' + money(S.amount + fee) + '</b></div>';
    if (isPerp) {
      h += '<div class="pt-kv"><span>Exposure / leverage</span><b>' + money(S.amount * S.leverage) + ' / ' + S.leverage + '×</b></div>';
      h += '<div class="pt-kv"><span>Funding</span><b>' + (market.funding >= 0 ? '+' : '') + market.funding + '% /8h</b></div>';
    } else {
      h += '<div class="pt-kv"><span>Possible settlement payout</span><b class="pos">' + money(action === 'BUY' ? quantity : 0) + '</b></div>';
    }
    h += '<div class="pt-kv"><span>Closes / resolves</span><b>' + esc(market.deadline || 'Continuous') + '</b></div>';
    h += '<div class="pt-kv"><span>Settlement source</span><b>' + esc(market.source) + '</b></div>';
    h += '<label class="pt-review-ack"><input type="checkbox" data-order-ack /><span>I reviewed the outcome, maximum loss, and written resolution source.</span></label>';
    h += '<button class="pt-order yes" type="button" data-confirm-order disabled>Confirm simulated order</button>';
    h += '<p class="pt-sim">The quote is checked again at confirmation. No real money moves.</p></div>';
    showCard(h);
    var card = evCard();
    var ack = card && card.querySelector('[data-order-ack]');
    var confirm = card && card.querySelector('[data-confirm-order]');
    if (ack && confirm) ack.addEventListener('change', function () { confirm.disabled = !ack.checked; });
    if (confirm) confirm.addEventListener('click', function () {
      if (!ack || !ack.checked) return;
      closeEventCard();
      placeOrder(true);
    });
    track('market_order_reviewed', { mtype: S.mtype, side: action, outcome: outcomeLabel, amount: S.amount, orderType: S.orderType });
  }

  function placeOrder(confirmed) {
    if (!confirmed) { openOrderReview(); return; }
    if (S.asOf !== NDAYS - 1) {
      replay('reset');
      setLive('Returned to the latest market snapshot. Review the current quote before placing a simulated order.');
      return;
    }
    var lifecycle = marketLifecycle(S.model, S.mtype);
    if (!lifecycle.open) {
      setLive(lifecycleLabel(lifecycle.label) + ' markets do not accept new orders. No fill was recorded.');
      return;
    }
    var m = S.model, isPerp = S.mtype === 'perps', selected = isPerp ? null : selectedMarketOutcome(m, S);
    var action = isPerp ? (S.side === 'SHORT' ? 'SELL' : 'BUY') : S.tradeSide;
    var selectedQuote = isPerp ? null : outcomeQuoteAt(selected, S.asOf), perpQuote = isPerp ? perpQuoteAt(m.markets.perps, S.asOf) : null;
    var quoted = isPerp ? perpQuote.mark : (action === 'BUY' ? selectedQuote.ask : selectedQuote.bid);
    var requestedPrice = S.orderType === 'LIMIT' ? clamp(Number(S.limitPrice || quoted), 1, isPerp ? 9999 : 99) : null;
    if (S.orderType === 'LIMIT') {
      var marketable = action === 'BUY' ? requestedPrice >= quoted : requestedPrice <= quoted;
      if (!marketable) {
        var limitMsg = 'Limit order is not immediately marketable at the displayed quote; no fill was recorded.';
        if (window.__backerToast) try { window.__backerToast(limitMsg); } catch (limitToastErr) {}
        setLive(limitMsg);
        return;
      }
    }
    var entry = quoted; // marketable limits receive the displayed quote, never a worse user-entered limit
    var quantity = isPerp ? round(S.amount * S.leverage / Math.max(entry, 0.01), 4) : round(S.amount / (entry / 100), 2);
    var fee = round(S.amount * (isPerp ? 0.0008 : 0.006), 2);
    var beforeStats = positionStats(m, S.mtype), before = beforeStats.quantity, sign = action === 'SELL' ? -1 : 1;
    if (!isPerp && action === 'SELL' && (before <= 0 || quantity > before + 0.001)) {
      var sellMsg = 'This simulated sell exceeds the held shares for the selected outcome. No fill was recorded.';
      if (window.__backerToast) try { window.__backerToast(sellMsg); } catch (sellToastErr) {}
      setLive(sellMsg);
      return;
    }
    var closingQty = before && before * sign < 0 ? Math.min(Math.abs(before), quantity) : 0;
    var realizedAtFill = closingQty * (entry - beforeStats.average) * (before > 0 ? 1 : -1) * (isPerp ? 1 : 0.01);
    var seq = m.bets.length + 1, stamp = tOf(S.asOf);
    var outcomeId = isPerp ? S.side : selected.id, outcomeLabel = isPerp ? S.side : selected.name;
    var fill = { idx: S.asOf, t: stamp, placedAt: stamp - 120000, side: isPerp ? S.side : selected.id, action: action, outcome: outcomeId, outcomeLabel: outcomeLabel, market: S.mtype, size: S.amount, quantity: quantity, entry: entry, entryLabel: isPerp ? 'idx ' + entry : entry + '¢', requestedPrice: requestedPrice, orderType: S.orderType, fee: fee, realized: round(realizedAtFill, 2), postSize: round(before + sign * quantity, 2), status: 'FILLED', pnl: round(realizedAtFill - fee, 2), orderId: 'ORD-' + String(m.seed).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) + '-' + seq, fillId: 'FILL-' + String(m.seed).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) + '-' + seq, real: true };
    track('position_started_after_poa', { mtype: S.mtype, side: action, outcome: outcomeId, amount: S.amount });
    m.bets.push(fill);
    m.focusBetIdx = S.asOf;
    if (m.creatorId) {
      try {
        var raw = JSON.parse(localStorage.getItem('backer_portfolio_v1') || '[]');
        var pos = raw.filter(function (p) { return p.id === m.creatorId; })[0];
        if (!pos) { pos = { id: m.creatorId, invested: 0, when: 'Jul 2026', fills: [] }; raw.push(pos); }
        pos.fills = pos.fills || [];
        pos.fills.push({ idx: fill.idx, t: fill.t, placedAt: fill.placedAt, market: fill.market, action: fill.action, outcome: fill.outcome, outcomeLabel: fill.outcomeLabel, side: fill.side, size: fill.size, gross: fill.size, quantity: fill.quantity, entry: fill.entry, fee: fill.fee, realized: fill.realized, status: fill.status, orderType: fill.orderType, requestedPrice: fill.requestedPrice, orderId: fill.orderId, fillId: fill.fillId, postSize: fill.postSize, pnl: fill.pnl });
        pos.invested = Math.max(0, Number(pos.invested || 0) + (action === 'BUY' ? S.amount : -S.amount));
        if (pos.value != null && action === 'BUY') pos.value = Number(pos.value) + S.amount;
        localStorage.setItem('backer_portfolio_v1', JSON.stringify(raw));
      } catch (persistErr) {}
    }
    var mtLabel = action + ' ' + outcomeLabel + ' ' + money(S.amount);
    if (window.__backerToast) try { window.__backerToast('Simulated fill recorded · ' + mtLabel); } catch (e) {}
    var receiptIndex = m.bets.length - 1;
    paint();
    openBetCard(receiptIndex);
    setLive('Simulated fill recorded: ' + mtLabel + ' at ' + fill.entryLabel + '. Marker and receipt added to the market history.');
  }

  /* ---- replay ---- */
  function replay(action) {
    if (action === 'prev') { stopReplay(); S.asOf = clamp(S.asOf - 1, 0, NDAYS - 1); paint(); }
    else if (action === 'next') { stopReplay(); S.asOf = clamp(S.asOf + 1, 0, NDAYS - 1); paint(); }
    else if (action === 'reset') { stopReplay(); S.asOf = NDAYS - 1; paint(); }
    else if (action === 'play') { if (S.playing) { stopReplay(); paint(); } else startReplay(); }
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
    ROOT.setAttribute('role', 'presentation');
    document.body.appendChild(ROOT);
    return ROOT;
  }
  function setModalBackgroundInert(active) {
    if (document.body && document.body.classList.contains('mdp-page')) return;
    if (active) {
      if (modalSiblings.length) return;
      Array.prototype.slice.call(document.body.children).forEach(function (el) {
        if (el === ROOT || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
        modalSiblings.push({ el: el, inert: !!el.inert, hadAria: el.hasAttribute('aria-hidden'), aria: el.getAttribute('aria-hidden') });
        el.inert = true;
        el.setAttribute('aria-hidden', 'true');
      });
    } else {
      modalSiblings.forEach(function (item) {
        item.el.inert = item.inert;
        if (item.hadAria) item.el.setAttribute('aria-hidden', item.aria);
        else item.el.removeAttribute('aria-hidden');
      });
      modalSiblings = [];
    }
  }
  function open(ctx) {
    ctx = ctx || {};
    ensureRoot();
    var seed = ctx.seed || (ctx.creator && ctx.creator.id) || (ctx.position && ('pos_' + ctx.position.id)) || ctx.id || ctx.name || 'creator';
    ctx.seed = seed;
    delete CACHE[seed];
    var model = buildModel(ctx);
    S = {
      model: model, surface: ctx.surface || (ctx.position ? 'market' : 'poa'), scope: 'creator',
      mtype: model.defaultMarket, range: '90d', interval: '1d',
      asOf: NDAYS - 1, side: model.defaultMarket === 'perps' ? (model.defaultSide || 'LONG') : 'YES', outcome: model.defaultOutcome || 0,
      tradeSide: 'BUY', orderType: 'MARKET', limitPrice: 50,
      amount: 25, leverage: 2, band: null, playing: false, timer: null, speed: 1, geo: {}
    };
    var initialOutcome = selectedMarketOutcome(model, S);
    if (initialOutcome) S.limitPrice = initialOutcome.ask;
    lastFocus = document.activeElement;
    ROOT.classList.add('open');
    setModalBackgroundInert(true);
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
    setModalBackgroundInert(false);
    document.documentElement.style.overflow = '';
    var bg = document.getElementById('bg'); if (bg) bg.style.visibility = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  document.addEventListener('keydown', function (e) {
    if (!ROOT || !ROOT.classList.contains('open') || (document.body && document.body.classList.contains('mdp-page'))) return;
    if (e.key === 'Escape' && !ROOT.contains(document.activeElement)) { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab' || ROOT.contains(document.activeElement)) return;
    var scope = ROOT.querySelector('.pt-evcard.show') || ROOT;
    var focusable = Array.prototype.slice.call(scope.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (el) { return el.offsetParent !== null; });
    if (!focusable.length) return;
    e.preventDefault();
    (e.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
  }, true);

  /* =====================================================================
     GLOBAL CLICK DELEGATE (capture phase) — opens terminal on any
     creator / PoA / event / bet click across the site.
     ===================================================================== */
  function resolveCreator(id) {
    if (window.__BACKER_EXTRA_CREATORS && window.__BACKER_EXTRA_CREATORS[id]) return window.__BACKER_EXTRA_CREATORS[id];
    if (window.BACKER && window.BACKER.byId) { var c = window.BACKER.byId(id); if (c) return c; }
    if (window.BACKER_MKT && window.BACKER_MKT.CONTRACTS) { var f = window.BACKER_MKT.CONTRACTS.filter(function (x) { return x.id === id; })[0]; if (f) return f; }
    return null;
  }
  function openByCreator(id, extra) {
    var c = resolveCreator(id);
    open(Object.assign({ seed: id, creator: c || null, name: c ? c.name : id }, extra || {}));
  }
  function openByMarket(id, extra) {
    var c = resolveCreator(id);
    open(Object.assign({ seed: id, creator: c || null, name: c ? c.name : id, surface: 'market', defaultMarket: 'milestone' }, extra || {}));
  }
  function positionContext(p) {
    var nm = p.pk ? p.pk.side : p.title;
    return { seed: 'pos_' + p.id, creator: p.creator || null, name: nm, position: p, surface: 'market', rival: p.pk ? (p.pk.side === p.pk.a ? p.pk.b : p.pk.a) : null, defaultMarket: p.inst === 'CONTENT_PK' ? 'pk' : p.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone' };
  }
  function openByPosition(pid) {
    var list = window.__PORTFOLIO_POSITIONS || [];
    var p = list.filter(function (x) { return x.id === pid; })[0];
    if (!p) { openByCreator(pid); return; }
    open(positionContext(p));
  }
  function openPositionRoute(pid, suppliedPosition, routeSource) {
    var list = window.__PORTFOLIO_POSITIONS || [];
    var p = suppliedPosition || list.filter(function (x) { return x.id === pid; })[0];
    if (!p) { openByPosition(pid); return; }
    try { sessionStorage.setItem('backer_market_route_position_v1', JSON.stringify(p)); }
    catch (storageErr) { open(positionContext(p)); return; }
    var instrument = p.inst === 'CONTENT_PK' ? 'pk' : p.inst === 'CREATOR_PERP_SIM' ? 'perps' : 'milestone';
    window.location.href = 'backermarket.html?position=' + encodeURIComponent(p.id) + '&instrument=' + instrument + '&source=' + encodeURIComponent(routeSource || 'portfolio');
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
    if ((el = t.closest('[data-poa]'))) { claim(); openByCreator(el.getAttribute('data-poa')); return; }
    if ((el = t.closest('[data-profile]'))) { claim(); openByCreator(el.getAttribute('data-profile')); return; }
    if ((el = t.closest('[data-creator]'))) {
      // ignore pure view-nav elements
      if (t.closest('[data-view],[data-nav]')) return;
      claim(); openByCreator(el.getAttribute('data-creator')); return;
    }
    if ((el = t.closest('[data-market-term]'))) { claim(); openByMarket(el.getAttribute('data-market-term') || el.dataset.creator || el.dataset.profile); return; }
    if ((el = t.closest('[data-position]'))) { claim(); openByMarket(el.getAttribute('data-position')); return; }
    if ((el = t.closest('.prow[data-id]'))) { claim(); openPositionRoute(el.getAttribute('data-id')); return; }
  }

  document.addEventListener('click', onClickCapture, true);

  window.PoaTerminal = { open: open, close: close, openByCreator: openByCreator, openByMarket: openByMarket, openByPosition: openByPosition, openPositionRoute: openPositionRoute, _build: buildModel };
})();
