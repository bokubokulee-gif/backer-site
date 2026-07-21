/* =========================================================
   BACKER — Creator markets: contract-first exchange homepage
   (Exchange Homepage PRDs, 2026-07-15). Owns the "market"
   view inside backerdemo.html.
   Page order: compact framing → browse/category rail →
   status ticker → tabs + controls → featured market row →
   All Markets compact grid + Backer Pulse right rail →
   Creator Radar / Resolved previews → methodology footer.
   Demo · simulated data — fixture catalog, fixed snapshot.
   ========================================================= */
window.BackerMarket = (function () {
  'use strict';
  const B = window.BACKER, M = window.BACKER_MKT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/</g, '&lt;');

  /* ---------------- view state ---------------- */
  const state = {
    view: 'markets',              // markets | radar | resolved
    browse: null,                 // trending|new|rising|ending|most-backed|high-poa|risk-watch
    window: M.DEFAULT_WINDOW,
    genre: null,
    platforms: [], scale: [], poa: [], multiple: [],
    evidence: 'all', risk: 'all',
    quickOpen: true, ending: false, u100: false,
    sort: 'pulse', shown: 12, featIdx: 0
  };
  let root = null, booted = false, lastTrigger = null;
  const sessionAdds = {};        // this-session simulated position overlay (display only)

  /* ---------------- watchlist (demo: localStorage) ---------------- */
  const WKEY = 'backer_watchlist_v1', PKEY = 'backer_portfolio_v1';
  function getWatch() { try { return new Set(JSON.parse(localStorage.getItem(WKEY) || '[]')); } catch (e) { return new Set(); } }
  function setWatch(set) { try { localStorage.setItem(WKEY, JSON.stringify([...set])); } catch (e) {} }
  let watch = getWatch();
  function getPositions() { try { return JSON.parse(localStorage.getItem(PKEY) || '[]'); } catch (e) { return []; } }

  function toast(msg, kind) {
    if (window.__backerToast) return window.__backerToast(msg, kind);
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400);
  }

  function focusTerminalTrigger(trigger) {
    if (!trigger || !trigger.focus) return;
    try { trigger.focus({ preventScroll: true }); } catch (e) { try { trigger.focus(); } catch (x) {} }
  }
  function openMarketTerminal(c, trigger) {
    if (!c) return;
    focusTerminalTrigger(trigger);
    window.location.href = 'backermarket.html?market=' + encodeURIComponent(c.id) + '&source=market';
  }
  function openPoaTerminal(c, trigger) {
    if (!c) return;
    focusTerminalTrigger(trigger);
    const terminal = window.PoaTerminal;
    const context = { seed: c.id, creator: c, name: c.name, surface: 'poa' };
    if (terminal && typeof terminal.open === 'function') { terminal.open(context); return; }
    if (terminal && typeof terminal.openByCreator === 'function') { terminal.openByCreator(c.id, context); return; }
    lastTrigger = trigger;
    openPoa(c);
  }

  /* ---------------- URL state (defaults omitted; legacy keys still read) ---------------- */
  function writeURL() {
    const p = [];
    if (state.view !== 'markets') p.push('view=' + state.view);
    if (state.browse) p.push('browse=' + state.browse);
    if (state.window !== M.DEFAULT_WINDOW) p.push('window=' + state.window);
    if (state.genre) p.push('genre=' + state.genre);
    if (state.platforms.length) p.push('platform=' + state.platforms.join(','));
    if (state.scale.length) p.push('scale=' + state.scale.join(','));
    if (state.poa.length) p.push('poa=' + state.poa.join(','));
    if (state.multiple.length) p.push('multiple=' + state.multiple.join(','));
    if (state.evidence !== 'all') p.push('evidence=' + state.evidence);
    if (state.risk !== 'all') p.push('risk=' + state.risk);
    if (!state.quickOpen) p.push('status=all');
    if (state.ending) p.push('ending=1');
    if (state.u100) p.push('u100=1');
    if (state.sort !== 'pulse') p.push('sort=' + state.sort);
    try { history.replaceState(null, '', location.pathname + location.search + (p.length ? '#market?' + p.join('&') : '#market')); } catch (e) {}
  }
  function readURL() {
    const h = location.hash;
    if (!/^#market\?/.test(h)) return;
    h.slice(8).split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (!v) return;
      if (k === 'view' && ['markets', 'radar', 'resolved'].includes(v)) state.view = v;
      else if (k === 'browse') state.browse = v;
      else if (k === 'window' && M.WINDOWS.includes(v)) state.window = v;
      else if (k === 'genre') state.genre = v;
      else if (k === 'platform') state.platforms = v.split(',');
      else if (k === 'scale') state.scale = v.split(',');
      else if (k === 'poa') state.poa = v.split(',');
      else if (k === 'multiple') state.multiple = v.split(',');
      else if (k === 'evidence') state.evidence = v;
      else if (k === 'risk') state.risk = v;
      else if (k === 'status' && v === 'all') state.quickOpen = false;
      else if (k === 'ending') state.ending = v === '1';
      else if (k === 'u100') state.u100 = v === '1';
      else if (k === 'sort') state.sort = v;
      else if (k === 'market') { // legacy state filter → nearest new state
        const st = v.toUpperCase();
        if (/RESOLVED/.test(st)) state.view = 'resolved';
        else if (/WATCH|NO_CONTRACT|REVIEW|PENDING/.test(st)) state.view = 'radar';
      }
    });
  }

  /* ---------------- filtering + sorting ---------------- */
  const RISK_ORDER = ['none', 'low', 'medium', 'elevated', 'severe'];
  const EV_MIN = { high: 80, medium: 60, low: 35 };
  const multBand = m => m >= 2 ? '2x' : m >= 1.5 ? '15x' : '1x';

  function baseFilter(c) {
    const m = c.mkt;
    if (state.genre && m.cat !== state.genre) return false;
    if (state.platforms.length && !m.profiles.some(p => state.platforms.includes(p.plat))) return false;
    if (state.scale.length && !state.scale.includes(m.tier.id)) return false;
    if (state.poa.length && !state.poa.includes(m.poa.band)) return false;
    if (state.evidence !== 'all' && m.evidence.score < EV_MIN[state.evidence]) return false;
    if (state.risk !== 'all' && RISK_ORDER.indexOf(m.risk.level) > RISK_ORDER.indexOf(state.risk)) return false;
    if (state.u100 && c.followers >= 1e5) return false;
    return true;
  }
  function marketList() {
    let list = M.CONTRACTS.filter(c => ['OPEN', 'OPENING_SOON', 'CLOSED'].includes(c.mkt.state) && baseFilter(c));
    if (state.quickOpen) list = list.filter(c => c.mkt.state === 'OPEN');
    if (state.ending) list = list.filter(c => c.mkt.state === 'OPEN' && c.contract.closeDays <= 30);
    if (state.multiple.length) list = list.filter(c => state.multiple.includes(multBand(c.contract.mult)));
    if (state.browse === 'new') list = list.filter(c => c.contract.isNew);
    else if (state.browse === 'ending') list = list.filter(c => c.mkt.state === 'OPEN' && c.contract.closeDays <= 30);
    else if (state.browse === 'high-poa') list = list.filter(c => c.mkt.poa.score >= 75 && c.mkt.evidence.score >= 60);
    else if (state.browse === 'risk-watch') list = list.filter(c => ['medium', 'elevated', 'severe'].includes(c.mkt.risk.level));
    return sortContracts(list);
  }
  function radarList() {
    return M.ALL.filter(c => M.RADAR_STATES.includes(c.mkt.state) && baseFilter(c))
      .sort((a, b) => b.mkt.windows[state.window].pulse.value - a.mkt.windows[state.window].pulse.value
        || b.mkt.evidence.score - a.mkt.evidence.score || (a.id < b.id ? -1 : 1));
  }
  function resolvedList() {
    return M.CONTRACTS.filter(c => c.mkt.state === 'RESOLVED' && baseFilter(c))
      .sort((a, b) => b.contract.simVol - a.contract.simVol);
  }
  function sortContracts(list) {
    const w = state.window;
    const by = f => list.slice().sort((a, b) => f(b) - f(a) || b.mkt.evidence.score - a.mkt.evidence.score || (a.id < b.id ? -1 : 1));
    switch (state.sort) {
      case 'trending': { const idx = {}; M.trendingList(w).forEach((c, i) => idx[c.id] = i); return list.slice().sort((a, b) => (idx[a.id] ?? 999) - (idx[b.id] ?? 999)); }
      case 'most-backed': return by(c => c.contract.simVol);
      case 'ending': return list.slice().sort((a, b) => (a.mkt.state === 'OPEN' ? a.contract.closeDays : 999) - (b.mkt.state === 'OPEN' ? b.contract.closeDays : 999));
      case 'newest': return list.slice().sort((a, b) => a.contract.listedDaysAgo - b.contract.listedDaysAgo);
      case 'poa': return by(c => c.mkt.poa.score * 1000 + c.mkt.evidence.score);
      case 'evidence': return by(c => c.mkt.evidence.score * 1000 + c.mkt.poa.score);
      case 'rising': return by(c => c.mkt.windows[w].pulse.comp.momentum * 1000 + c.mkt.windows[w].pulse.value);
      case 'risk': return list.slice().sort((a, b) => RISK_ORDER.indexOf(a.mkt.risk.level) - RISK_ORDER.indexOf(b.mkt.risk.level) || b.mkt.poa.score - a.mkt.poa.score);
      case 'multiple': return by(c => c.contract.mult);
      default: return by(c => c.mkt.windows[w].pulse.value);
    }
  }
  const SORTS = [
    ['pulse', 'Attention Pulse'], ['trending', 'Trending'], ['most-backed', 'Most backed'],
    ['ending', 'Ending soon'], ['newest', 'Newest'], ['poa', 'Strongest PoA'],
    ['evidence', 'Highest evidence'], ['rising', 'Fastest rising'], ['risk', 'Lowest risk'], ['multiple', 'Highest multiple']
  ];
  const BROWSE = [
    ['trending', 'Trending', 'trending'], ['new', 'New', 'newest'], ['rising', 'Rising', 'rising'],
    ['ending', 'Ending soon', 'ending'], ['most-backed', 'Most backed', 'most-backed'],
    ['high-poa', 'High PoA', 'poa'], ['risk-watch', 'Risk watch', 'risk']
  ];

  /* ---------------- tiny render helpers ---------------- */
  function initials(name) { return name.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
  function avatar(c, size) {
    return `<span class="mkt-av" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 32% 26%, hsl(${c.hue} 70% 62%), hsl(${c.hue + 26} 55% 32%) 64%, hsl(${c.hue + 8} 38% 15%));font-size:${Math.round(size * .36)}px;color:hsl(${c.hue} 60% 12%)">${initials(c.name)}</span>`;
  }
  function poaPill(c) {
    const m = c.mkt, band = m.poa.band;
    const txt = band === 'insufficient' ? '—' : m.poa.score;
    const g = m.evidence.grade[0];
    return `<button type="button" class="mkt-poa ${band}" data-mkt-poa-open="${c.id}" aria-label="Open Proof of Attention composition for ${esc(c.name)}; ${band === 'insufficient' ? 'insufficient evidence' : 'score ' + m.poa.score + ', evidence ' + m.evidence.grade}" title="PoA ${txt} · Evidence ${m.evidence.grade} — underwriting, not success odds"><i></i>${txt}<em>${g}</em></button>`;
  }
  function watchBtn(c, label) {
    const on = watch.has(c.id);
    return `<button class="mkt-watch ${on ? 'on' : ''}" data-watch="${c.id}" aria-pressed="${on}" aria-label="${on ? 'Remove from watchlist' : 'Add to watchlist'}" title="${on ? 'Watching' : 'Watch'}"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/></svg>${label ? `<span>${on ? 'Watching' : 'Watch'}</span>` : ''}</button>`;
  }
  function deltaTag(c, small) {
    const d = c.mkt.windows[state.window].delta;
    return `<span class="mkt-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '+' : ''}${d.toFixed(1)}${small ? `<small> Pulse ${state.window.toUpperCase()}</small>` : ''}</span>`;
  }
  const riskWord = { none: 'Low material risk', low: 'Low risk', medium: 'Mixed evidence', elevated: 'Elevated risk', severe: 'Material risk' };
  function riskTag(c) {
    const l = c.mkt.risk.level;
    return `<span class="mkt-risk ${l}" title="${esc(c.mkt.risk.label)}">${riskWord[l]}</span>`;
  }
  function safePublicEvidence(c) {
    const text = c && c.mkt && c.mkt.poa ? String(c.mkt.poa.positive || '') : '';
    if (!text || /watch\s*time|view\s*duration|retention|returning[-\s]*viewer/i.test(text)) {
      return 'Stable public engagement breadth across sampled content.';
    }
    return text;
  }
  function simVolOf(c) { return c.contract.simVol + (sessionAdds[c.id] || 0); }
  function backersOf(c) { return c.contract.backers + (sessionAdds[c.id] ? 1 : 0); }
  function freshTag(c) {
    const f = c.contract ? `upd ${c.contract.freshMin}m` : `${c.mkt.profiles[0].fresh.label.toLowerCase()} ${c.mkt.profiles[0].fresh.ago}`;
    return `<span class="mkt-fr" title="Relative to the fixed demo snapshot (${M.DEMO_SNAP_LABEL}). Fixture data — never a live claim.">${f} · demo</span>`;
  }
  function statusBadge(c) {
    const st = c.mkt.state, k = c.contract;
    if (st === 'OPEN' && k.closingSoon) return `<span class="mkt-badge closing">Closing soon</span>`;
    if (st === 'OPEN' && k.isNew) return `<span class="mkt-badge new">New</span>`;
    if (st === 'OPEN') return `<span class="mkt-badge open">Open</span>`;
    if (st === 'OPENING_SOON') return `<span class="mkt-badge soon">Opens in ${k.opensInDays}d</span>`;
    if (st === 'CLOSED') return `<span class="mkt-badge closed">Closed</span>`;
    if (st === 'RESOLVED') return k.outcome === 'HIT' ? `<span class="mkt-badge hit">Resolved · hit</span>` : `<span class="mkt-badge miss">Resolved · miss</span>`;
    return `<span class="mkt-badge closed">${M.STATES[st].label}</span>`;
  }
  function cardCTA(c) {
    const st = c.mkt.state;
    if (st === 'OPEN') return `<button type="button" class="mkt-cta" data-market-open="${c.id}" aria-label="Open market and back ${esc(c.name)} from $1">Back $1+</button>`;
    if (st === 'OPENING_SOON') return watchBtn(c, true);
    if (st === 'CLOSED') return `<button type="button" class="mkt-btn ghost sm" data-market-open="${c.id}">View contract</button>`;
    if (st === 'RESOLVED') return `<button type="button" class="mkt-btn ghost sm" data-market-open="${c.id}">View result</button>`;
    return '';
  }
  function sparkline(c, w, h) {
    const s = c.contract.spark, tgt = c.milestone.target;
    const max = Math.max(tgt, ...s), min = Math.min(...s);
    const rng = Math.max(1, max - min);
    const pts = s.map((v, i) => `${(i / (s.length - 1) * w).toFixed(1)},${(h - 4 - (v - min) / rng * (h - 8)).toFixed(1)}`).join(' ');
    const ty = (h - 4 - (tgt - min) / rng * (h - 8)).toFixed(1);
    return `<svg class="mkt-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Milestone progress trajectory: ${c.contract.curLabel} of ${c.contract.tgtLabel} target (${c.contract.progressPct}% milestone progress)">
      <line x1="0" y1="${ty}" x2="${w}" y2="${ty}" class="sp-target"/>
      <polyline points="${pts}" class="sp-line"/>
      <circle cx="${w}" cy="${(h - 4 - (s[s.length - 1] - min) / rng * (h - 8)).toFixed(1)}" r="2.5" class="sp-dot"/>
    </svg>`;
  }

  /* ---------------- standard market card (PRD §13) ---------------- */
  function card(c) {
    const m = c.mkt, k = c.contract, cat = M.catById(m.cat);
    const p0 = M.platById(m.profiles[0].plat);
    return `<article class="mkt-card st-${m.state.toLowerCase()}" data-row="${c.id}" data-market-card aria-label="${esc(k.title)} — ${esc(c.name)}">
      <button type="button" class="mkt-card-hit" data-market-open="${c.id}" aria-label="Open traded market for ${esc(c.name)}: ${esc(k.title)}"></button>
      <header class="mkt-card-h">
        <button type="button" class="mkt-name" data-mkt-poa-open="${c.id}" aria-label="Open Proof of Attention composition for ${esc(c.name)}">${avatar(c, 30)}<span><b>${esc(c.name)}</b><small>${p0 ? p0.name : ''} · ${cat ? cat.name : ''}</small></span></button>
        ${statusBadge(c)}${watchBtn(c)}
      </header>
      <h3 class="mkt-card-title"><button type="button" data-market-open="${c.id}" title="Open traded market">${esc(k.title)}</button></h3>
      <div class="mkt-prog" role="img" aria-label="Milestone progress: ${k.curLabel} of ${k.tgtLabel}, ${k.progressPct}%">
        <b>${k.curLabel}</b><span class="mkt-bar"><i style="width:${k.progressPct}%"></i></span><b>${k.tgtLabel}</b>
        <em title="Milestone progress — completion toward the target, not chance of success">${k.progressPct}%</em>
      </div>
      <div class="mkt-terms">
        <span class="t-mult"><b>${k.mult}×</b><small>payout</small></span>
        <span class="t-pulse">${deltaTag(c)}<small>Pulse ${state.window.toUpperCase()}</small></span>
        ${poaPill(c)}
        ${riskTag(c)}
      </div>
      <footer class="mkt-card-f">
        <span class="f-act">${k.simVol || sessionAdds[c.id] ? `${B.money(simVolOf(c))} <em>sim. vol.</em> · ${backersOf(c)} backers` : `${k.watchers} watching`} · ${freshTag(c)}</span>
        <span class="f-cta"><button type="button" class="mkt-link" data-market-open="${c.id}">Details</button>${cardCTA(c)}</span>
      </footer>
    </article>`;
  }

  /* ---------------- featured market (PRD §14) ---------------- */
  function featuredHTML() {
    const feats = M.featuredList(state.window);
    if (!feats.length) return '';
    state.featIdx = Math.max(0, Math.min(state.featIdx, feats.length - 1));
    const c = feats[state.featIdx], m = c.mkt, k = c.contract, cat = M.catById(m.cat);
    const p0 = M.platById(m.profiles[0].plat);
    return `<article class="mkt-feat" data-row="${c.id}" data-market-card aria-label="Featured market: ${esc(k.title)}">
      <button type="button" class="mkt-card-hit" data-market-open="${c.id}" aria-label="Open traded market for ${esc(c.name)}: ${esc(k.title)}"></button>
      <header class="mkt-card-h">
        <span class="mkt-feat-tag">Featured market</span>
        <button type="button" class="mkt-name" data-mkt-poa-open="${c.id}" aria-label="Open Proof of Attention composition for ${esc(c.name)}">${avatar(c, 34)}<span><b>${esc(c.name)}</b><small>${p0 ? p0.name : ''} · ${cat ? cat.name : ''}</small></span></button>
        ${statusBadge(c)}
        <span class="mkt-feat-nav"><button data-feat-prev aria-label="Previous featured market" ${state.featIdx === 0 ? 'disabled' : ''}>‹</button><em>${state.featIdx + 1} of ${feats.length}</em><button data-feat-next aria-label="Next featured market" ${state.featIdx === feats.length - 1 ? 'disabled' : ''}>›</button></span>
        ${watchBtn(c)}
      </header>
      <h3 class="mkt-feat-title"><button type="button" data-market-open="${c.id}">${esc(k.title)}</button></h3>
      <div class="mkt-prog big" role="img" aria-label="Milestone progress: ${k.curLabel} of ${k.tgtLabel}, ${k.progressPct}%">
        <b>${k.curLabel}</b><span class="mkt-bar"><i style="width:${k.progressPct}%"></i></span><b>${k.tgtLabel}</b>
        <em title="Milestone progress — completion toward the target, not chance of success">${k.progressPct}% progress</em>
      </div>
      <div class="mkt-feat-chart">
        <small>${esc(c.milestone.metric)} trajectory · fixture series to ${M.DEMO_SNAP_LABEL}</small>
        ${sparkline(c, 560, 64)}
      </div>
      <div class="mkt-terms big">
        <span class="t-mult"><b>${k.mult}×</b><small>payout multiple</small></span>
        <span class="t-pulse">${deltaTag(c)}<small>Pulse ${state.window.toUpperCase()}</small></span>
        ${poaPill(c)}
        ${riskTag(c)}
        <span class="t-close">${k.closeLabel ? `<b>${k.closeLabel}</b><small>entry closes</small>` : ''}</span>
      </div>
      <p class="mkt-feat-ev">+ ${esc(safePublicEvidence(c))}</p>
      <footer class="mkt-card-f">
        <span class="f-act">${B.money(simVolOf(c))} <em>sim. vol.</em> · ${backersOf(c)} backers · ${freshTag(c)}</span>
        <span class="f-cta"><button type="button" class="mkt-btn ghost sm" data-market-open="${c.id}">Details</button><button type="button" class="mkt-cta" data-market-open="${c.id}" aria-label="Open market and back ${esc(c.name)} from $1">Back $1+</button></span>
      </footer>
    </article>`;
  }

  /* ---------------- Creator Radar card (PRD §16 — no terms, ever) ---------------- */
  function radarCard(c) {
    const m = c.mkt, cat = M.catById(m.cat), st = M.STATES[m.state];
    const p0 = M.platById(m.profiles[0].plat);
    const win = m.windows[state.window];
    return `<article class="mkt-card mkt-rcard" data-row="${c.id}">
      <header class="mkt-card-h">
        <button type="button" class="mkt-name" data-mkt-poa-open="${c.id}" aria-label="Open Proof of Attention composition for ${esc(c.name)}">${avatar(c, 30)}<span><b>${esc(c.name)}</b><small>${p0 ? p0.name : ''} · ${cat ? cat.name : ''}</small></span></button>
        <span class="mkt-badge watch">${st.label}</span>${watchBtn(c)}
      </header>
      <div class="mkt-rcard-grid">
        <div><small>Reach</small><b>${B.fmt(c.followers)}</b></div>
        <div><small>Pulse ${state.window.toUpperCase()}</small><b>${win.pulse.value.toFixed(1)}</b> ${deltaTag(c)}</div>
        <div><small>PoA · Evidence</small>${poaPill(c)}</div>
        <div><small>Risk</small>${riskTag(c)}</div>
      </div>
      <p class="mkt-rcard-note">Watch-only research — no open contract. No terms are synthesized.</p>
      <footer class="mkt-card-f">
        <span class="f-act">${freshTag(c)}</span>
        <span class="f-cta"><button type="button" class="mkt-link" data-mkt-poa-open="${c.id}">Open PoA composition</button>${watchBtn(c, true)}</span>
      </footer>
    </article>`;
  }

  /* ---------------- Backer Pulse right rail (PRD §15) ---------------- */
  function railRow(c, i, val, sub, ctx) {
    return `<button type="button" class="mkt-rrow" data-mkt-poa-open="${c.id}" aria-label="Open Proof of Attention composition for ${esc(c.name)}">
      <span class="rr-rank">${String(i + 1).padStart(2, '0')}</span>
      <span class="rr-body"><b>${esc(c.name)}</b><small>${esc(ctx)}</small></span>
      <span class="rr-val"><b>${val}</b><small>${sub}</small></span>
    </button>`;
  }
  function railHTML() {
    const w = state.window, wl = w.toUpperCase();
    const mods = [];

    /* A — Your Market */
    const pos = getPositions();
    const watched = M.ALL.filter(c => watch.has(c.id));
    if (!pos.length && !watched.length) {
      mods.push(`<section class="mkt-rmod"><h4>Your market</h4>
        <p class="rm-copy">Backer runs simulated milestone markets — every position is practice capital, no real money moves.</p>
        <div class="rm-btns"><button class="mkt-btn sm" data-tab="radar">Build your watchlist</button><button class="mkt-btn ghost sm" data-scroll-method>How contracts work</button></div>
      </section>`);
    } else {
      const wRows = watched.slice().sort((a, b) => Math.abs(b.mkt.windows[w].delta) - Math.abs(a.mkt.windows[w].delta)).slice(0, 3)
        .map((c, i) => railRow(c, i, (c.mkt.windows[w].delta > 0 ? '+' : '') + c.mkt.windows[w].delta.toFixed(1), 'Pulse ' + wl, M.catById(c.mkt.cat).name)).join('');
      const invested = pos.reduce((n, p) => n + p.invested, 0);
      mods.push(`<section class="mkt-rmod"><h4>Your market</h4>
        ${pos.length ? `<p class="rm-copy">${pos.length} simulated position${pos.length > 1 ? 's' : ''} · ${B.money(invested)} <em>sim.</em> at stake.</p>` : ''}
        ${wRows}
        <button class="mkt-link rm-all" data-go-portfolio>View portfolio →</button>
      </section>`);
    }

    /* B — Backer AI Pulse (deterministic, source-backed) */
    const bullets = M.aiPulse(w).map(x => `<li>${esc(x.t)} <small>· ${x.src}</small></li>`).join('');
    mods.push(`<section class="mkt-rmod"><h4>Backer AI Pulse <span class="rm-note" title="Deterministic digest computed from structured fixture snapshots — every bullet carries its source context. No free-form generation.">ⓘ sourced</span></h4>
      <ul class="rm-bullets">${bullets}</ul>
      <small class="rm-stamp">Updated at demo snapshot · ${M.DEMO_SNAP_LABEL}</small>
    </section>`);

    /* C — Trending (documented formula) */
    const tr = M.trendingList(w).slice(0, 3);
    if (tr.length >= 3) mods.push(`<section class="mkt-rmod"><h4>Trending <span class="rm-note" title="0.40 sim-volume growth + 0.25 position starts + 0.15 watch adds (24H percentiles) + 0.20 Pulse delta. Separate from the default grid order.">ⓘ 24H</span></h4>
      ${tr.map((c, i) => railRow(c, i, c.contract.mult + '×', (c.mkt.windows[w].delta > 0 ? '+' : '') + c.mkt.windows[w].delta.toFixed(1) + ' Pulse', c.contract.progressPct + '% progress')).join('')}
      <button class="mkt-link rm-all" data-viewall="trending">View all →</button>
    </section>`);

    /* D — Top movers */
    const mv = M.moversList(w);
    if (mv.length >= 3) mods.push(`<section class="mkt-rmod"><h4>Top movers <span class="rm-note">Pulse pts / ${wl}</span></h4>
      ${mv.map((c, i) => railRow(c, i, (c.mkt.windows[w].delta > 0 ? '+' : '') + c.mkt.windows[w].delta.toFixed(1), 'pts / ' + wl, riskWord[c.mkt.risk.level])).join('')}
      <button class="mkt-link rm-all" data-viewall="rising">View all →</button>
    </section>`);

    /* E — Risk watch (material changes only) */
    const rw = M.riskWatchList();
    if (rw.length) mods.push(`<section class="mkt-rmod warn"><h4>Risk watch</h4>
      ${rw.map((x, i) => `<button type="button" class="mkt-rrow" data-mkt-poa-open="${x.c.id}" aria-label="Open Proof of Attention composition for ${esc(x.c.name)}"><span class="rr-rank warn">!</span><span class="rr-body"><b>${esc(x.c.name)}</b><small>${esc(x.msg)}</small></span></button>`).join('')}
      <button class="mkt-link rm-all" data-viewall="risk-watch">View all →</button>
    </section>`);

    /* compact links to remaining modules */
    const os = M.openingSoonList().length, nw = M.newList().length;
    mods.push(`<section class="mkt-rmod links"><h4>More</h4>
      <div class="rm-links">
        ${nw ? `<button class="mkt-link" data-viewall="new">New contracts (${nw})</button>` : ''}
        ${os ? `<button class="mkt-link" data-tab-open-soon>Opening soon (${os})</button>` : ''}
        <button class="mkt-link" data-viewall="most-backed">Highest simulated volume</button>
      </div>
    </section>`);

    return `<aside class="mkt-rail" aria-label="Backer Pulse — market intelligence">${mods.join('')}</aside>`;
  }

  /* inline Pulse strip for mobile (interleaves after 4th card) */
  function inlinePulse() {
    const tr = M.trendingList(state.window).slice(0, 3);
    if (tr.length < 3) return '';
    return `<div class="mkt-inline"><h4>Backer Pulse · Trending</h4>${tr.map((c, i) =>
      railRow(c, i, c.contract.mult + '×', (c.mkt.windows[state.window].delta > 0 ? '+' : '') + c.mkt.windows[state.window].delta.toFixed(1) + ' Pulse', c.contract.progressPct + '% progress')).join('')}</div>`;
  }

  /* ---------------- filters drawer ---------------- */
  function chip(group, val, label, active) { return `<button class="mkt-fchip ${active ? 'on' : ''}" data-f="${group}" data-v="${val}">${label}</button>`; }
  function drawerHTML() {
    const n = state.view === 'radar' ? radarList().length : state.view === 'resolved' ? resolvedList().length : marketList().length;
    return `<div class="mkt-drawer-h"><h3>Filter ${state.view === 'radar' ? 'Creator Radar' : 'markets'}</h3><button class="mkt-x" data-close-drawer aria-label="Close filters"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="mkt-drawer-b">
      <h5>Contract</h5>
      <div class="mkt-fgroup">${chip('open', '1', 'Open only', state.quickOpen)}${chip('ending', '1', 'Ending <30d', state.ending)}</div>
      <h5>Payout multiple</h5><div class="mkt-fgroup">${[['1x', '1.0–1.49×'], ['15x', '1.5–1.99×'], ['2x', '2.0×+']].map(x => chip('mult', x[0], x[1], state.multiple.includes(x[0]))).join('')}</div>
      <h5>Platform</h5><div class="mkt-fgroup">${M.PLATFORMS.map(p => chip('plat', p.id, p.name, state.platforms.includes(p.id))).join('')}</div>
      <h5>Creator scale</h5><div class="mkt-fgroup">${M.TIERS.map(t => chip('scale', t.id, t.label, state.scale.includes(t.id))).join('')}</div>
      <h5>PoA signal</h5><div class="mkt-fgroup">${[['strong', 'Strong'], ['mixed', 'Mixed'], ['risk', 'Elevated risk'], ['insufficient', 'Insufficient']].map(x => chip('poa', x[0], x[1], state.poa.includes(x[0]))).join('')}</div>
      <h5>Evidence Confidence</h5><div class="mkt-fgroup">${[['all', 'Any'], ['high', 'High only'], ['medium', 'Medium+'], ['low', 'Include Low']].map(x => chip('ev', x[0], x[1], state.evidence === x[0])).join('')}</div>
      <h5>Maximum risk</h5><div class="mkt-fgroup">${[['all', 'Any'], ['none', 'None'], ['low', 'Low'], ['medium', 'Medium'], ['elevated', 'Elevated']].map(x => chip('risk', x[0], x[1], state.risk === x[0])).join('')}</div>
    </div>
    <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-reset-filters>Reset</button><button class="mkt-btn accent" data-close-drawer>Show ${n} ${state.view === 'radar' ? 'creators' : 'markets'}</button></div>`;
  }
  function openDrawer() { const d = $('#mktDrawer', root); d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); d.innerHTML = `<div class="mkt-drawer-panel" role="dialog" aria-label="Filter market">${drawerHTML()}</div>`; }
  function refreshDrawer() { const d = $('#mktDrawer', root); if (d.classList.contains('open')) $('.mkt-drawer-panel', d).innerHTML = drawerHTML(); }
  function closeDrawer() { const d = $('#mktDrawer', root); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = ''; }

  /* ---------------- position drawer (PRD §18) ---------------- */
  function maxFor(c) {
    const m = c.mkt, evW = M.EV_GRADES[m.evidence.grade].w;
    const riskF = { none: 1, low: 1, medium: .6, elevated: .35, severe: .2 }[m.risk.level];
    return Math.max(50, Math.round(m.poa.score * 10 * Math.max(evW, .3) * riskF / 10) * 10);
  }
  function posPreview(c, amt) {
    const k = c.contract, max = maxFor(c);
    const bad = !(amt >= 1) ? 'Minimum simulated position is $1.' : amt > max ? `Above the $${max} position ceiling for this contract.` : null;
    const win = Math.round(amt * k.mult * 100) / 100;
    return `
      <div class="mkt-kv"><span>If milestone hits</span><b class="pos">${B.money(win)} simulated payout (+${B.money(Math.round((win - amt) * 100) / 100)})</b></div>
      <div class="mkt-kv"><span>If milestone misses</span><b class="neg">$0 — full simulated stake lost</b></div>
      ${bad ? `<p class="mkt-pos-err" role="alert">${bad}</p>` : ''}`;
  }
  function openPosition(c) {
    if (c.mkt.state !== 'OPEN') return;
    const k = c.contract, m = c.mkt, max = maxFor(c);
    const d = $('#mktPos', root);
    d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
    d.innerHTML = `<div class="mkt-drawer-panel mkt-pos-panel" role="dialog" aria-label="Take a simulated position">
      <div class="mkt-drawer-h">${avatar(c, 34)}<div class="mkt-poa-t"><h3>Simulated position</h3><small>${esc(c.name)} · ${esc(k.title)}</small></div><button class="mkt-x" data-close-pos aria-label="Close position drawer"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b" id="mktPosBody">
        <div class="mkt-kv"><span>Current → target</span><b>${k.curLabel} → ${k.tgtLabel} (${k.progressPct}% progress)</b></div>
        <div class="mkt-kv"><span>Milestone deadline</span><b>${k.deadlineLabel}</b></div>
        <div class="mkt-kv"><span>Entry closes</span><b>${k.closeLabel || '—'}</b></div>
        <div class="mkt-kv"><span>Payout multiple</span><b>${k.mult}× — fixed contract term, not market odds</b></div>
        <div class="mkt-kv"><span>PoA · Evidence</span><b>${m.poa.band === 'insufficient' ? 'Insufficient' : m.poa.score} · ${m.evidence.grade}</b></div>
        <div class="mkt-kv"><span>Primary risk</span><b>${esc(m.risk.label)}</b></div>
        <div class="mkt-kv"><span>Resolution source</span><b>${esc(k.source)}</b></div>
        <div class="mkt-kv"><span>Terms version</span><b>${k.id} · ${k.version}</b></div>
        <h5>Simulated amount</h5>
        <div class="mkt-amt"><span class="cur">$</span><input id="mktAmt" type="number" min="1" max="${max}" value="25" inputmode="numeric" aria-label="Simulated amount in dollars"/></div>
        <div class="mkt-fgroup">${[1, 5, 25, 100].map(v => `<button class="mkt-fchip ${v === 25 ? 'on' : ''}" data-amt-quick="${v}">$${v}</button>`).join('')}</div>
        <p class="mkt-pos-max">Position ceiling <b>$${max}</b> — scales with PoA confidence, evidence and contract risk. No universal cap.</p>
        <div id="mktPosPrev">${posPreview(c, 25)}</div>
        <p class="mkt-sim">Simulated position · no real money moves. You can lose the full simulated stake if the milestone misses.</p>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-close-pos>Cancel</button><button class="mkt-btn accent" data-confirm-pos="${c.id}">Confirm simulated position</button></div>
    </div>`;
    $('.mkt-x', d).focus();
  }
  function confirmPosition(c) {
    const inp = $('#mktAmt', root);
    const amt = Math.round(parseFloat(inp && inp.value) || 0);
    const max = maxFor(c);
    if (!(amt >= 1) || amt > max) { const pv = $('#mktPosPrev', root); if (pv) pv.innerHTML = posPreview(c, amt); return; }
    try {
      const raw = getPositions();
      const ex = raw.find(p => p.id === c.id);
      if (ex) ex.invested += amt; else raw.push({ id: c.id, invested: amt, when: 'Jul 2026' });
      localStorage.setItem(PKEY, JSON.stringify(raw));
    } catch (e) {}
    sessionAdds[c.id] = (sessionAdds[c.id] || 0) + amt;
    const d = $('#mktPos', root);
    $('.mkt-drawer-panel', d).innerHTML = `<div class="mkt-drawer-h"><div class="mkt-poa-t"><h3>Position recorded</h3><small>${esc(c.name)} · ${esc(c.contract.title)}</small></div><button class="mkt-x" data-close-pos aria-label="Close"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b">
        <p class="mkt-pos-ok" role="status">Your <b>${B.money(amt)}</b> simulated position is recorded against ${c.contract.id} · ${c.contract.version}.</p>
        <div class="mkt-kv"><span>If milestone hits</span><b class="pos">${B.money(Math.round(amt * c.contract.mult * 100) / 100)} simulated payout</b></div>
        <div class="mkt-kv"><span>If milestone misses</span><b class="neg">$0</b></div>
        <p class="mkt-sim">Simulated · no real money moves.</p>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-close-pos>Keep browsing</button><button class="mkt-btn accent" data-go-portfolio>View portfolio</button></div>`;
    refreshCanvas();
    toast('Simulated position recorded — view it in your portfolio');
  }
  function closePosition() { const d = $('#mktPos', root); if (!d) return; d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = ''; if (lastTrigger) { try { lastTrigger.focus(); } catch (e) {} lastTrigger = null; } }

  /* ---------------- PoA evidence panel ---------------- */
  function openPoa(c) {
    const m = c.mkt, p = m.poa;
    const leads = {
      strong: 'Broad, fresh evidence supports this underwriting estimate.',
      mixed: 'Evidence points to a mixed underwriting profile — read the risk line.',
      risk: 'Public evidence shows material anomalies or structural weakness.',
      insufficient: 'Backer does not have enough evidence for a calibrated estimate.'
    };
    const compRow = (label, v, inv) => {
      const grade = inv ? (v < 25 ? 'Low' : v < 50 ? 'Medium' : 'High') : (v >= 75 ? 'High' : v >= 50 ? 'Medium' : 'Low');
      return `<div class="mkt-kv"><span>${label}</span><b>${v} · ${grade}</b></div>`;
    };
    const platEv = m.profiles.map(pr => {
      const plat = M.platById(pr.plat);
      return `<div class="mkt-kv"><span>${plat ? plat.name : pr.plat} <em class="${pr.fresh.state === 'PROVIDER_DELAYED' ? 'neg' : ''}">${pr.fresh.label} ${pr.fresh.ago}</em></span><b>${pr.reachLabel} · ${pr.engRate}% eng</b></div>`;
    }).join('');
    const missing = [
      'True watch-time and retention are unavailable without creator authorization.',
      m.profiles.some(x => x.fresh.state === 'PROVIDER_DELAYED') ? 'Instagram evidence is provider-delayed; last-good snapshot in use.' : null,
      'Public-data inference; platform-private fraud signals are unavailable.'
    ].filter(Boolean).map(x => `<li>${x}</li>`).join('');
    const d = $('#mktPoa', root);
    d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
    d.innerHTML = `<div class="mkt-drawer-panel mkt-poa-panel" role="dialog" aria-label="Proof of Attention evidence">
      <div class="mkt-drawer-h"><div>${avatar(c, 34)}</div><div class="mkt-poa-t"><h3>Proof of Attention</h3><small>${esc(c.name)} · underwriting, not success odds</small></div><button class="mkt-x" data-close-poa aria-label="Close evidence panel"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b">
        <div class="mkt-poa-hero ${p.band}">
          <div><small>Underwriting score</small><b>${p.band === 'insufficient' ? '—' : p.score}</b></div>
          <div><small>Evidence Confidence</small><b>${m.evidence.grade} ${m.evidence.score}</b></div>
          ${p.band !== 'insufficient' ? `<div><small>Est. authentic attention</small><b>${p.range[0]}–${p.range[1]}%</b></div>` : ''}
          <div><small>Risk</small><b class="${m.risk.level}">${m.risk.level === 'none' ? 'None material' : m.risk.level[0].toUpperCase() + m.risk.level.slice(1)} ${p.components.risk}</b></div>
        </div>
        <p class="mkt-poa-lead">${leads[p.band]}</p>
        <h5>Primary evidence</h5>
        <p class="mkt-ev pos">+ ${esc(p.positive)}</p>
        <p class="mkt-ev ${m.risk.level === 'none' ? '' : 'neg'}">! ${esc(p.riskNote)}</p>
        <h5>Components</h5>
        ${compRow('Attention Authenticity', p.components.authenticity)}
        ${compRow('Attention Durability', p.components.durability)}
        ${compRow('Engagement Quality', p.components.engagementQuality)}
        ${compRow('Monetization Readiness', p.components.monetization)}
        ${compRow('Manipulation / Platform Risk', p.components.risk, true)}
        <div class="mkt-kv"><span>Data Coverage</span><b>${p.coverage}</b></div>
        <h5>Evidence by platform</h5>${platEv}
        <h5>Missing data &amp; limitations</h5><ul class="mkt-limits">${missing}</ul>
        <small class="mkt-vers">Public-data score · demo snapshot ${M.DEMO_SNAP_LABEL} · ${M.VERSIONS.poa}</small>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-correction>Report a correction</button><button class="mkt-btn" data-mkt-poa-open="${c.id}">Full underwriting profile →</button></div>
    </div>`;
    $('.mkt-x', d).focus();
  }
  function closePoa() { const d = $('#mktPoa', root); if (!d) return; d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = ''; }

  /* ---------------- main canvas ---------------- */
  function activeFilterChips() {
    const chips = [];
    const add = (label, fn) => chips.push({ label, fn });
    if (state.genre) add(M.catById(state.genre).name, () => { state.genre = null; });
    state.platforms.forEach(p => add(M.platById(p).name, () => { state.platforms = state.platforms.filter(x => x !== p); }));
    state.scale.forEach(s => add(M.TIERS.find(t => t.id === s).label, () => { state.scale = state.scale.filter(x => x !== s); }));
    state.poa.forEach(s => add('PoA: ' + s, () => { state.poa = state.poa.filter(x => x !== s); }));
    state.multiple.forEach(s => add('Multiple: ' + (s === '2x' ? '2.0×+' : s === '15x' ? '1.5–1.99×' : '1.0–1.49×'), () => { state.multiple = state.multiple.filter(x => x !== s); }));
    if (state.evidence !== 'all') add('Evidence: ' + state.evidence, () => { state.evidence = 'all'; });
    if (state.risk !== 'all') add('Risk ≤ ' + state.risk, () => { state.risk = 'all'; });
    if (state.u100) add('Under 100K', () => { state.u100 = false; });
    if (state.ending) add('Ending <30d', () => { state.ending = false; });
    return chips;
  }
  window.__mktChipRemove = [];

  function emptyState(n) {
    const chips = activeFilterChips();
    return `<div class="mkt-empty">
      <b>No ${state.view === 'radar' ? 'creators' : 'markets'} match the current constraints.</b>
      ${chips.length ? `<p>Active filters: ${chips.map(c => esc(c.label)).join(' · ')}.</p>` : ''}
      <div class="rm-btns">${chips.length ? '<button class="mkt-btn sm" data-clear-filters>Clear filters</button>' : ''}${state.view === 'markets' ? '<button class="mkt-btn ghost sm" data-tab="radar">Browse Creator Radar</button>' : ''}</div>
    </div>`;
  }

  function canvasHTML() {
    const w = state.window;
    if (state.view === 'radar') {
      const list = radarList(), slice = list.slice(0, state.shown);
      return `<div class="mkt-gridwrap">
        <p class="mkt-tab-lead">Creators worth monitoring before a contract opens — ranked by Attention Pulse ${w.toUpperCase()}, Evidence Confidence tie-break. Radar profiles never show contract terms.</p>
        ${list.length ? `<div class="mkt-grid radar">${slice.map(radarCard).join('')}</div>` : emptyState()}
        ${list.length > state.shown ? `<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12, list.length - state.shown)} more</button><span>${slice.length} of ${list.length}</span></div>` : `<div class="mkt-more"><span>${list.length} creators on radar</span></div>`}
      </div>`;
    }
    if (state.view === 'resolved') {
      const list = resolvedList(), slice = list.slice(0, state.shown);
      return `<div class="mkt-gridwrap">
        <p class="mkt-tab-lead">Resolved milestone contracts — outcome recorded from the independent resolution source. PoA never settles a contract.</p>
        ${list.length ? `<div class="mkt-grid">${slice.map(card).join('')}</div>` : emptyState()}
        ${list.length > state.shown ? `<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12, list.length - state.shown)} more</button></div>` : ''}
      </div>`;
    }
    /* markets */
    const feats = M.featuredList(w);
    const featured = feats.length ? feats[Math.max(0, Math.min(state.featIdx, feats.length - 1))] : null;
    let list = marketList();
    if (featured) list = list.filter(c => c.id !== featured.id);
    const side = featured && list.length ? list[0] : null;      // side card leaves the grid — no duplicate contracts
    const gridItems = side ? list.slice(1) : list;
    const slice = gridItems.slice(0, state.shown);
    const cardsHTML = slice.map((c, i) => card(c) + (i === 3 ? inlinePulse() : '')).join('');
    return `<div class="mkt-gridwrap">
      ${featured ? `<div class="mkt-featrow">${featuredHTML()}${side ? `<div class="mkt-feat-side">${card(side)}</div>` : ''}</div>` : ''}
      <div class="mkt-grid-h"><h2>All markets</h2><span>${list.length} contract${list.length === 1 ? '' : 's'}${state.browse ? ' · ' + BROWSE.find(b => b[0] === state.browse)[1] : ''} · sorted by ${SORTS.find(s => s[0] === state.sort)[1]}</span></div>
      ${gridItems.length ? `<div class="mkt-grid">${cardsHTML}</div>` : list.length ? '' : emptyState()}
      ${gridItems.length > state.shown ? `<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12, gridItems.length - state.shown)} more</button><span>${slice.length} of ${gridItems.length} eligible</span></div>` : list.length ? `<div class="mkt-more"><span>All ${list.length + (featured ? 1 : 0)} eligible contracts shown — empty inventory is honest inventory.</span></div>` : ''}
      ${radarPreview()}
    </div>`;
  }

  function radarPreview() {
    if (state.view !== 'markets') return '';
    const list = radarList().slice(0, 3);
    if (!list.length) return '';
    return `<section class="mkt-radar-prev">
      <div class="mkt-grid-h"><h2>Creator Radar</h2><span>watch-only research — no terms synthesized</span><button class="mkt-link" data-tab="radar">Open Radar →</button></div>
      <div class="mkt-grid radar">${list.map(radarCard).join('')}</div>
    </section>`;
  }

  /* ---------------- page chrome ---------------- */
  function tickerHTML() {
    return `<div class="mkt-ticker" role="status" aria-label="Market status">${M.tickerStats().map(s =>
      `<span class="mkt-tick ${s.warn ? 'warn' : ''}" title="${esc(s.tip)}">${esc(s.v)}</span>`).join('<i>·</i>')}</div>`;
  }
  function browseRailHTML() {
    return `<div class="mkt-browse" role="navigation" aria-label="Browse modes and categories">
      <div class="mkt-browse-in">
        ${BROWSE.map(b => `<button class="bchip ${state.browse === b[0] ? 'on' : ''}" data-browse="${b[0]}">${b[1]}</button>`).join('')}
        <span class="bsep" aria-hidden="true"></span>
        ${['all', ...M.TAXONOMY.map(t => t.id)].map(id => `<button class="bchip cat ${(!state.genre && id === 'all') || state.genre === id ? 'on' : ''}" data-cat="${id === 'all' ? '' : id}">${id === 'all' ? 'All' : M.catById(id).name}</button>`).join('')}
      </div>
    </div>`;
  }
  function controlsHTML() {
    const counts = { markets: marketList().length, radar: radarList().length, resolved: resolvedList().length };
    const chips = activeFilterChips();
    window.__mktChipRemove = chips.map(c => c.fn);
    return `
      <div class="mkt-controls">
        <div class="mkt-tabs" role="tablist" aria-label="Market view">
          ${[['markets', 'Markets'], ['radar', 'Creator Radar'], ['resolved', 'Resolved']].map(t =>
            `<button role="tab" aria-selected="${state.view === t[0]}" class="${state.view === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]} <em>${counts[t[0]]}</em></button>`).join('')}
        </div>
        <div class="mkt-tools">
          <div class="mkt-windows" role="tablist" aria-label="Time window">${M.WINDOWS.map(x => `<button role="tab" aria-selected="${x === state.window}" class="${x === state.window ? 'on' : ''}" data-window="${x}">${x.toUpperCase()}</button>`).join('')}</div>
          ${state.view === 'markets' ? `
          <div class="mkt-quick">
            <button class="qchip ${state.quickOpen ? 'on' : ''}" data-quick="open">Open</button>
            <button class="qchip ${state.ending ? 'on' : ''}" data-quick="ending">Ending &lt;30d</button>
            <button class="qchip ${state.platforms.includes('youtube') ? 'on' : ''}" data-quick="yt">YouTube</button>
            <button class="qchip ${state.u100 ? 'on' : ''}" data-quick="u100">Under 100K</button>
            <button class="qchip ${state.evidence === 'medium' ? 'on' : ''}" data-quick="ev">Medium+ evidence</button>
          </div>` : ''}
          <button class="mkt-btn ghost sm" data-open-drawer>Filters${chips.length ? ` <b>${chips.length}</b>` : ''}</button>
          <label class="mkt-sort">Sort <select id="mktSort" aria-label="Sort markets">${SORTS.map(s => `<option value="${s[0]}" ${s[0] === state.sort ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></label>
          <button class="mkt-btn ghost sm" data-share-board title="Copy a link that restores tab, browse mode, filters, sort and window">Share</button>
        </div>
      </div>
      ${chips.length ? `<div class="mkt-active-chips">${chips.map((c, i) => `<span class="mkt-achip">${esc(c.label)}<button data-chip-x="${i}" aria-label="Remove filter ${esc(c.label)}">×</button></span>`).join('')}<button class="mkt-clear" data-clear-filters>Clear all</button></div>` : ''}`;
  }
  function footerHTML() {
    return `<footer class="mkt-foot" id="mktMethod">
      <div class="mkt-foot-grid">
        <div><h4>How contracts work</h4><p>A milestone contract fixes a <b>target, deadline and payout multiple</b> against an independent resolution source. Hit the milestone by the deadline and the simulated payout follows the contract multiple; miss it and the simulated stake is lost. The multiple is a fixed contract term — <b>not market odds or a probability</b>.</p></div>
        <div><h4>Underwriting, separately</h4><p><b>Attention Pulse</b> is a cohort-normalized attention index — never a price. <b>Proof of Attention</b> is a versioned underwriting estimate shown beside its <b>Evidence Confidence</b>; it is advisory and never settles a contract. Milestone progress measures completion toward the target, not chance of success.</p></div>
        <div><h4>Simulation disclosure</h4><p><b>Simulated markets · no real money moves.</b> Every volume figure is labeled <code>sim. vol.</code> and sums recorded simulated positions. This page is a demo on a fixture catalog (<code>isFixture=true</code>) at a fixed snapshot — production requires source-backed data with provenance, and fixtures never enter production responses.</p></div>
      </div>
      <div class="mkt-foot-vers"><span>${M.VERSIONS.ranking}</span><span>${M.VERSIONS.pulse}</span><span>${M.VERSIONS.poa}</span><span>${M.VERSIONS.taxonomy}</span><span>Demo snapshot ${M.DEMO_SNAP_LABEL}</span></div>
    </footer>`;
  }

  function refreshCanvas() {
    $('#mktControls', root).innerHTML = controlsHTML();
    $('#mktCanvas', root).innerHTML = canvasHTML();
    $('#mktRailBox', root).innerHTML = state.view === 'markets' ? railHTML() : '';
    $('#mktStage', root).classList.toggle('has-rail', state.view === 'markets');
    writeURL();
  }
  function refreshAll() {
    $('#mktBrowse', root).innerHTML = browseRailHTML();
    $('#mktTicker', root).innerHTML = tickerHTML();
    refreshCanvas();
  }

  function render(app) {
    root = app;
    if (!booted) { readURL(); booted = true; }
    watch = getWatch();
    app.innerHTML = `
    <div class="mkt" id="mktRoot">
      <div class="mkt-framing">
        <div class="mkt-framing-l">
          <h1>Creator markets</h1>
          <p>Milestone contracts underwritten by Proof of Attention.</p>
        </div>
        <div class="mkt-framing-r">
          <span class="mkt-pill demo" title="Fixture catalog at a fixed snapshot — never production data.">Demo · simulated data</span>
          <span class="mkt-pill sim" title="Every position on this page is simulated.">Simulated markets · no real money moves</span>
          <form class="mkt-search" id="mktNL">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input id="mktNLInput" placeholder="Search creators, niches, or milestone markets…" aria-label="Search creators, niches, or milestone markets"/>
          </form>
        </div>
      </div>
      <div id="mktBrowse">${browseRailHTML()}</div>
      <div id="mktTicker">${tickerHTML()}</div>
      <div id="mktControls" class="mkt-controls-wrap">${controlsHTML()}</div>
      <div id="mktStage" class="mkt-stage ${state.view === 'markets' ? 'has-rail' : ''}">
        <section id="mktCanvas" class="mkt-canvas" aria-live="polite">${canvasHTML()}</section>
        <div id="mktRailBox">${state.view === 'markets' ? railHTML() : ''}</div>
      </div>
      ${footerHTML()}
      <div class="mkt-drawer" id="mktDrawer" aria-hidden="true"></div>
      <div class="mkt-drawer" id="mktPoa" aria-hidden="true"></div>
      <div class="mkt-drawer" id="mktPos" aria-hidden="true"></div>
    </div>`;
    bind(app);
    writeURL();
  }

  /* ---------------- events ---------------- */
  function setBrowse(b) {
    if (state.browse === b) { state.browse = null; state.sort = 'pulse'; }
    else { state.browse = b; const def = BROWSE.find(x => x[0] === b); state.sort = def ? def[2] : 'pulse'; if (state.view !== 'markets') state.view = 'markets'; }
    state.shown = 12; state.featIdx = 0;
  }
  function bind(app) {
    const rootEl = $('#mktRoot', app);
    rootEl.addEventListener('click', e => {
      const t = e.target;
      const has = sel => t.closest(sel);
      let el;

      if ((el = has('[data-watch]'))) {
        e.stopPropagation(); e.preventDefault();
        const id = el.dataset.watch;
        if (watch.has(id)) { watch.delete(id); toast('Removed from watchlist'); }
        else { watch.add(id); toast('Watching — updates appear in Your Market and your portfolio'); }
        setWatch(watch);
        $$(`[data-watch="${id}"]`, rootEl).forEach(b => {
          const on = watch.has(id);
          b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
          const sp = b.querySelector('span'); if (sp) sp.textContent = on ? 'Watching' : 'Watch';
        });
        return;
      }
      if ((el = has('[data-mkt-poa-open]'))) { e.stopPropagation(); e.preventDefault(); openPoaTerminal(B.byId(el.dataset.mktPoaOpen), el); return; }
      if ((el = has('[data-market-open]'))) { e.stopPropagation(); e.preventDefault(); openMarketTerminal(B.byId(el.dataset.marketOpen), el); return; }
      if ((el = has('[data-poa]'))) { e.stopPropagation(); e.preventDefault(); lastTrigger = el; openPoa(B.byId(el.dataset.poa)); return; }
      if ((el = has('[data-close-poa]'))) { e.stopPropagation(); closePoa(); return; }
      if ((el = has('[data-correction]'))) { e.stopPropagation(); closePoa(); toast('Correction request recorded — reviewed with source evidence'); return; }
      if ((el = has('[data-position]'))) { e.stopPropagation(); e.preventDefault(); lastTrigger = el; openPosition(B.byId(el.dataset.position)); return; }
      if ((el = has('[data-close-pos]'))) { e.stopPropagation(); closePosition(); return; }
      if ((el = has('[data-confirm-pos]'))) { e.stopPropagation(); confirmPosition(B.byId(el.dataset.confirmPos)); return; }
      if ((el = has('[data-amt-quick]'))) {
        e.stopPropagation();
        const v = el.dataset.amtQuick, inp = $('#mktAmt', rootEl);
        if (inp) { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); }
        $$('[data-amt-quick]', rootEl).forEach(b => b.classList.toggle('on', b === el));
        return;
      }
      if ((el = has('[data-go-portfolio]'))) { e.stopPropagation(); window.location.href = 'portfolio.html'; return; }
      if ((el = has('[data-profile]'))) { e.stopPropagation(); e.preventDefault(); closePoa(); closeDrawer(); closePosition(); window.__backerGo('creator', el.dataset.profile); return; }
      if ((el = has('[data-tab]'))) { e.stopPropagation(); state.view = el.dataset.tab; state.shown = 12; refreshCanvas(); return; }
      if ((el = has('[data-tab-open-soon]'))) { e.stopPropagation(); state.view = 'markets'; state.quickOpen = false; state.browse = null; state.sort = 'newest'; state.shown = 12; refreshCanvas(); toast('Showing all contract states — opening-soon markets included'); return; }
      if ((el = has('[data-browse]'))) { e.stopPropagation(); setBrowse(el.dataset.browse); refreshAll(); return; }
      if ((el = has('[data-viewall]'))) { e.stopPropagation(); state.view = 'markets'; setBrowse(el.dataset.viewall); if (!state.browse) setBrowse(el.dataset.viewall); refreshAll(); $('#mktCanvas', rootEl).scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if ((el = has('[data-window]'))) { e.stopPropagation(); state.window = el.dataset.window; refreshAll(); return; }
      if ((el = has('[data-cat]')) && el.dataset.cat !== undefined) {
        e.stopPropagation();
        state.genre = el.dataset.cat || null; state.shown = 12; state.featIdx = 0;
        refreshAll(); return;
      }
      if ((el = has('[data-quick]'))) {
        e.stopPropagation();
        const q = el.dataset.quick;
        if (q === 'open') state.quickOpen = !state.quickOpen;
        else if (q === 'ending') state.ending = !state.ending;
        else if (q === 'yt') state.platforms = state.platforms.includes('youtube') ? state.platforms.filter(x => x !== 'youtube') : state.platforms.concat('youtube');
        else if (q === 'u100') state.u100 = !state.u100;
        else if (q === 'ev') state.evidence = state.evidence === 'medium' ? 'all' : 'medium';
        state.shown = 12; refreshCanvas(); return;
      }
      if ((el = has('[data-feat-prev]'))) { e.stopPropagation(); state.featIdx = Math.max(0, state.featIdx - 1); refreshCanvas(); return; }
      if ((el = has('[data-feat-next]'))) { e.stopPropagation(); state.featIdx += 1; refreshCanvas(); return; }
      if ((el = has('[data-scroll-method]'))) { e.stopPropagation(); const f = $('#mktMethod', rootEl); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if ((el = has('[data-open-drawer]'))) { e.stopPropagation(); lastTrigger = el; openDrawer(); return; }
      if ((el = has('[data-close-drawer]'))) { e.stopPropagation(); closeDrawer(); refreshCanvas(); return; }
      if ((el = has('[data-reset-filters]')) || (el = has('[data-clear-filters]'))) {
        e.stopPropagation();
        state.genre = null; state.platforms = []; state.scale = []; state.poa = []; state.multiple = [];
        state.evidence = 'all'; state.risk = 'all'; state.u100 = false; state.ending = false; state.quickOpen = true;
        state.browse = null; state.sort = 'pulse'; state.shown = 12;
        refreshDrawer(); refreshAll(); return;
      }
      if ((el = has('[data-chip-x]'))) { e.stopPropagation(); const fn = window.__mktChipRemove[+el.dataset.chipX]; if (fn) fn(); state.shown = 12; refreshCanvas(); return; }
      if ((el = has('[data-f]'))) {
        e.stopPropagation();
        const g = el.dataset.f, v = el.dataset.v;
        const toggleIn = arr => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
        if (g === 'plat') state.platforms = toggleIn(state.platforms);
        else if (g === 'scale') state.scale = toggleIn(state.scale);
        else if (g === 'poa') state.poa = toggleIn(state.poa);
        else if (g === 'mult') state.multiple = toggleIn(state.multiple);
        else if (g === 'ev') state.evidence = v;
        else if (g === 'risk') state.risk = v;
        else if (g === 'open') state.quickOpen = !state.quickOpen;
        else if (g === 'ending') state.ending = !state.ending;
        state.shown = 12;
        refreshDrawer(); refreshCanvas(); return;
      }
      if ((el = has('[data-load-more]'))) { e.stopPropagation(); state.shown += 12; refreshCanvas(); return; }
      if ((el = has('[data-share-board]'))) {
        e.stopPropagation();
        try { navigator.clipboard && navigator.clipboard.writeText(location.href); } catch (x) {}
        toast('Link copied — restores tab, browse mode, filters, sort and window'); return;
      }
      if (t.id === 'mktDrawer') { closeDrawer(); refreshCanvas(); return; }
      if (t.id === 'mktPoa') { closePoa(); return; }
      if (t.id === 'mktPos') { closePosition(); return; }
    });
    rootEl.addEventListener('change', e => {
      if (e.target.id === 'mktSort') { state.sort = e.target.value; state.browse = null; state.shown = 12; refreshAll(); }
    });
    rootEl.addEventListener('input', e => {
      if (e.target.id === 'mktAmt') {
        const panel = e.target.closest('.mkt-pos-panel');
        const idBtn = panel && panel.querySelector('[data-confirm-pos]');
        if (!idBtn) return;
        const c = B.byId(idBtn.dataset.confirmPos);
        const pv = $('#mktPosPrev', rootEl);
        if (c && pv) pv.innerHTML = posPreview(c, Math.round(parseFloat(e.target.value) || 0));
      }
    });
    rootEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePoa(); closeDrawer(); closePosition(); }
    });
    const nl = $('#mktNL', rootEl);
    nl.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('#mktNLInput', rootEl).value.trim();
      window.__backerGo('search', q || 'high-confidence AI educators under 50K');
    });
    if (!window.__mktEscBound) { document.addEventListener('keydown', escGlobal); window.__mktEscBound = true; }
  }
  function escGlobal(e) { if (e.key === 'Escape' && root) { closePoa(); closeDrawer(); closePosition(); } }

  return { render };
})();
