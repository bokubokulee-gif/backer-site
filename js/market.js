/* =========================================================
   BACKER — Creator Attention Marketplace view (Master PRD)
   Owns the "market" view inside backerdemo.html.
   Page order (§9.1): framing + windows → status strip →
   Global Attention Board → Rising → Highest-Confidence →
   Category markets → Platform markets → methodology footer.
   Desktop = dense semantic table; mobile = compact cards.
   ========================================================= */
window.BackerMarket = (function () {
  'use strict';
  const B = window.BACKER, M = window.BACKER_MKT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/</g, '&lt;');

  /* ---------------- view state ---------------- */
  const state = {
    window: M.DEFAULT_WINDOW, genre: null, sub: null,
    platforms: [], scale: [], poa: [], evidence: 'all', states: [], risk: 'all',
    sort: 'pulse', shown: 50, expanded: {}
  };
  let root = null, booted = false;

  /* ---------------- snapshot time (demo: computed at load) ---------------- */
  const NOW = new Date();
  const SNAP = new Date(Math.floor(NOW.getTime() / 36e5) * 36e5);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const snapLabel = `${SNAP.getUTCDate()} ${MONTHS[SNAP.getUTCMonth()]} ${SNAP.getUTCFullYear()} ${String(SNAP.getUTCHours()).padStart(2, '0')}:00 UTC`;
  const updatedAgo = Math.max(2, Math.round((NOW - SNAP) / 6e4)) + ' min ago';

  /* ---------------- watchlist (demo: localStorage) ---------------- */
  const WKEY = 'backer_watchlist_v1';
  function getWatch() { try { return new Set(JSON.parse(localStorage.getItem(WKEY) || '[]')); } catch (e) { return new Set(); } }
  function setWatch(set) { try { localStorage.setItem(WKEY, JSON.stringify([...set])); } catch (e) {} }
  let watch = getWatch();

  function toast(msg, kind) {
    if (window.__backerToast) return window.__backerToast(msg, kind);
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------------- URL state (§10.5 — defaults omitted) ---------------- */
  function writeURL() {
    const p = [];
    if (state.window !== M.DEFAULT_WINDOW) p.push('window=' + state.window);
    if (state.genre) p.push('genre=' + state.genre);
    if (state.sub) p.push('subcategory=' + state.sub);
    if (state.platforms.length) p.push('platform=' + state.platforms.join(','));
    if (state.scale.length) p.push('scale=' + state.scale.join(','));
    if (state.poa.length) p.push('poa=' + state.poa.join(','));
    if (state.evidence !== 'all') p.push('evidence=' + state.evidence);
    if (state.states.length) p.push('market=' + state.states.join(',').toLowerCase());
    if (state.risk !== 'all') p.push('risk=' + state.risk);
    if (state.sort !== 'pulse') p.push('sort=' + state.sort);
    try { history.replaceState(null, '', location.pathname + location.search + (p.length ? '#market?' + p.join('&') : '#market')); } catch (e) {}
  }
  function readURL() {
    const h = location.hash;
    if (!/^#market\?/.test(h)) return;
    h.slice(8).split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (!v) return;
      if (k === 'window' && M.WINDOWS.includes(v)) state.window = v;
      else if (k === 'genre') state.genre = v;
      else if (k === 'subcategory') state.sub = v;
      else if (k === 'platform') state.platforms = v.split(',');
      else if (k === 'scale') state.scale = v.split(',');
      else if (k === 'poa') state.poa = v.split(',');
      else if (k === 'evidence') state.evidence = v;
      else if (k === 'market') state.states = v.split(',').map(s => s.toUpperCase());
      else if (k === 'risk') state.risk = v;
      else if (k === 'sort') state.sort = v;
    });
  }

  /* ---------------- filtering + sorting ---------------- */
  const RISK_ORDER = ['none', 'low', 'medium', 'elevated', 'severe'];
  const EV_MIN = { high: 80, medium: 60, low: 35 };
  function eligible() {
    return M.ALL.filter(c => {
      const m = c.mkt;
      if (state.genre && m.cat !== state.genre) return false;
      if (state.sub && m.sub !== state.sub) return false;
      if (state.platforms.length && !m.profiles.some(p => state.platforms.includes(p.plat))) return false;
      if (state.scale.length && !state.scale.includes(m.tier.id)) return false;
      if (state.poa.length && !state.poa.includes(m.poa.band)) return false;
      if (state.evidence !== 'all' && m.evidence.score < EV_MIN[state.evidence]) return false;
      if (state.states.length && !state.states.includes(m.state)) return false;
      if (state.risk !== 'all' && RISK_ORDER.indexOf(m.risk.level) > RISK_ORDER.indexOf(state.risk)) return false;
      return true;
    });
  }
  const SORTS = [
    ['pulse', 'Attention Pulse'], ['engagement', 'Total engagement'], ['rising', 'Fastest rising'],
    ['poa', 'Strongest PoA'], ['confidence', 'Highest confidence'], ['followers', 'Most followers'],
    ['small-rising', 'Smallest rising creators'], ['backed', 'Most backed'], ['deadline', 'Milestone deadline']
  ];
  function sortList(list) {
    const w = state.window;
    const by = f => list.slice().sort((a, b) => f(b) - f(a) || b.mkt.evidence.score - a.mkt.evidence.score || (a.id < b.id ? -1 : 1));
    switch (state.sort) {
      case 'engagement': return by(c => c.mkt.windows[w].pulse.comp.volume);
      case 'rising': return by(c => c.mkt.windows[w].pulse.comp.momentum * 1000 + c.mkt.windows[w].pulse.value);
      case 'poa': return by(c => c.mkt.poa.score * 1000 + c.mkt.evidence.score);
      case 'confidence': return by(c => c.mkt.evidence.score * 1000 + c.mkt.poa.score);
      case 'followers': return by(c => c.followers);
      case 'small-rising': return by(c => (c.followers < 5e4 ? 1e6 : 0) + c.mkt.windows[w].pulse.comp.momentum * 1000 + c.mkt.windows[w].pulse.value);
      case 'backed': return by(c => ['OPEN', 'CLOSED', 'RESOLVED'].includes(c.mkt.state) ? c.raised : -1);
      case 'deadline': return list.slice().sort((a, b) => (parseInt(a.milestone && a.mkt.state === 'OPEN' ? a.milestone.deadline : 99) - parseInt(b.milestone && b.mkt.state === 'OPEN' ? b.milestone.deadline : 99)));
      default: return M.sortBoard(list, w, false);
    }
  }

  /* ---------------- tiny render helpers ---------------- */
  function initials(name) { return name.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
  function avatar(c, size) {
    return `<span class="mkt-av" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 32% 26%, hsl(${c.hue} 70% 62%), hsl(${c.hue + 26} 55% 32%) 64%, hsl(${c.hue + 8} 38% 15%));font-size:${Math.round(size * .36)}px;color:hsl(${c.hue} 60% 12%)">${initials(c.name)}</span>`;
  }
  function moveBadge(r) {
    if (r.isNew) return '<span class="mkt-move new" aria-label="New entrant">NEW</span>';
    if (r.move > 0) return `<span class="mkt-move up" aria-label="Up ${r.move} ranks">▲${r.move}</span>`;
    if (r.move < 0) return `<span class="mkt-move down" aria-label="Down ${-r.move} ranks">▼${-r.move}</span>`;
    return '<span class="mkt-move flat" aria-label="Unchanged">—</span>';
  }
  function poaPill(c) {
    const m = c.mkt, band = m.poa.band;
    const txt = band === 'insufficient' ? '—' : m.poa.score;
    const g = m.evidence.grade[0];
    return `<button class="mkt-poa ${band}" data-poa="${c.id}" aria-label="Proof of Attention ${band === 'insufficient' ? 'insufficient evidence' : m.poa.score + ', evidence ' + m.evidence.grade}" title="PoA ${txt} · Evidence ${m.evidence.grade}"><i></i>${txt}<em>${g}</em></button>`;
  }
  function pulseCell(c) {
    const win = c.mkt.windows[state.window];
    const d = win.delta;
    return `<b class="mkt-pulse-v">${win.pulse.value.toFixed(1)}</b><span class="mkt-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '+' : ''}${d.toFixed(1)}</span>${win.pulse.provisional ? '<span class="mkt-prov" title="Evidence Confidence below 35 — provisional Pulse, capped at 70">Provisional</span>' : ''}`;
  }
  function stateChip(c) {
    const st = M.STATES[c.mkt.state];
    let sub = '';
    if (c.mkt.state === 'OPEN' && c.milestone) sub = `<span>${c.milestone.mult}× · ${c.milestone.deadline}</span>`;
    else if (c.mkt.state === 'RESOLVED') sub = '<span>outcome recorded</span>';
    return `<span class="mkt-state ${st.cls}">${st.label}</span>${sub}`;
  }
  function watchBtn(c, label) {
    const on = watch.has(c.id);
    return `<button class="mkt-watch ${on ? 'on' : ''}" data-watch="${c.id}" aria-pressed="${on}" aria-label="${on ? 'Remove from watchlist' : 'Add to watchlist'}" title="${on ? 'Watching' : 'Watch'}"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/></svg>${label ? `<span>${on ? 'Watching' : 'Watch'}</span>` : ''}</button>`;
  }
  function platChip(p) {
    const plat = M.platById(p.plat);
    const cls = p.fresh.state === 'PROVIDER_DELAYED' ? 'delayed' : p.fresh.state === 'LIVE' ? 'live' : '';
    return `<span class="mkt-plat ${cls}" title="${plat ? plat.name : p.plat} · ${p.reachLabel} · ${p.fresh.label} ${p.fresh.ago}"><svg viewBox="0 0 24 24">${B.PLAT_IC[p.plat] || ''}</svg>${p.reachLabel}</span>`;
  }
  function obsCell(c) {
    const m = c.mkt, win = m.windows[state.window], p0 = m.profiles[0];
    return `<b>${B.fmt(win.volume)}</b> <span class="mkt-unit">${p0.unit}</span><span class="mkt-sub2">${p0.engRate}% eng · ${p0.fresh.state === 'PROVIDER_DELAYED' ? 'provider delayed' : p0.fresh.ago}</span>`;
  }

  /* ---------------- board row (desktop) ---------------- */
  function row(c, i, rmap) {
    const m = c.mkt, r = rmap[c.id] || { rank: i + 1, move: 0 };
    const open = !!state.expanded[c.id];
    const cat = M.catById(m.cat);
    return `<tr class="mkt-row ${open ? 'is-open' : ''}" data-row="${c.id}">
      <td class="mkt-c-rank"><b>${String(i + 1).padStart(2, '0')}</b>${moveBadge(r)}</td>
      <td class="mkt-c-id"><button class="mkt-name" data-profile="${c.id}">${avatar(c, 34)}<span><b>${esc(c.name)}</b><small>${esc(c.handle)}${m.unified ? ' · <i class="mkt-uni" title="Unified cross-platform identity · Identity Confidence ' + m.identity.toFixed(2) + '">Unified</i>' : ''}</small></span></button></td>
      <td class="mkt-c-plats">${m.profiles.map(platChip).join('')}</td>
      <td class="mkt-c-cat"><b>${cat ? cat.name : m.cat}</b><small>${M.subName(m.sub)}</small></td>
      <td class="mkt-c-obs">${obsCell(c)}</td>
      <td class="mkt-c-pulse">${pulseCell(c)}</td>
      <td class="mkt-c-poa">${poaPill(c)}</td>
      <td class="mkt-c-risk ${m.risk.level}">${esc(m.risk.label)}</td>
      <td class="mkt-c-state">${stateChip(c)}</td>
      <td class="mkt-c-act">${watchBtn(c)}${m.state === 'OPEN' ? `<button class="mkt-cta" data-profile="${c.id}">Position</button>` : ''}<button class="mkt-exp" data-expand="${c.id}" aria-expanded="${open}" aria-controls="exp-${c.id}" aria-label="${open ? 'Collapse' : 'Expand'} evidence for ${esc(c.name)}" title="${open ? 'Collapse' : 'Expand'} row"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button></td>
    </tr>${open ? expandedRow(c) : ''}`;
  }

  /* ---------------- expanded row (§26.2) ---------------- */
  function expandedRow(c) {
    const m = c.mkt, win = m.windows[state.window], comp = win.pulse.comp, d = win.pulse.detail;
    const compRows = [['Volume percentile', comp.volume], ['Engagement percentile', comp.engagement], ['Momentum percentile', comp.momentum], ['Persistence percentile', comp.persistence], ['Freshness percentile', comp.freshness]]
      .map(x => `<div class="mkt-kv"><span>${x[0]}</span><b>${Math.round(x[1])}</b></div>`).join('');
    const platEv = m.profiles.map(p => {
      const plat = M.platById(p.plat);
      return `<div class="mkt-plat-ev">
        <div class="mkt-plat-ev-h"><svg viewBox="0 0 24 24">${B.PLAT_IC[p.plat] || ''}</svg><b>${plat ? plat.name : p.plat}</b><span class="${p.fresh.state === 'PROVIDER_DELAYED' ? 'neg' : ''}">${p.fresh.label} ${p.fresh.ago}</span></div>
        <div class="mkt-plat-ev-b">${p.reachLabel} reach · ${B.fmt(Math.round(win.volume * (p.primary ? .72 : .28 / Math.max(1, m.profiles.length - 1))))} ${p.unit} · ${p.engRate}% engagement</div>
      </div>`;
    }).join('');
    const terms = c.milestone && ['OPEN', 'OPENING_SOON', 'CLOSED', 'RESOLVED'].includes(m.state)
      ? `<div class="mkt-kv"><span>Milestone</span><b>${c.milestone.money ? B.money(c.milestone.target) : B.fmt(c.milestone.target)} ${esc(c.milestone.metric)}</b></div>
         <div class="mkt-kv"><span>Deadline · multiple</span><b>${c.milestone.deadline} · ${c.milestone.mult}×</b></div>
         ${m.state === 'OPEN' ? `<div class="mkt-kv"><span>Simulated backing</span><b>${B.money(c.raised)} / ${B.money(c.goal)}</b></div><p class="mkt-sim">Simulated · no real money moves</p>` : ''}`
      : `<p class="mkt-noterms">${M.STATES[m.state].label} — no approved milestone contract. No terms are synthesized.</p>`;
    return `<tr class="mkt-exprow" id="exp-${c.id}"><td colspan="10"><div class="mkt-expand">
      <div><h4>Platform evidence</h4>${platEv}<div class="mkt-kv" style="margin-top:8px"><span>Identity Confidence</span><b>${m.identity.toFixed(2)}</b></div></div>
      <div><h4>Attention Pulse components</h4>${compRows}
        <div class="mkt-kv sumline"><span>Base Pulse</span><b>${win.pulse.base.toFixed(1)}</b></div>
        <div class="mkt-kv"><span>Bounded adjustments</span><b>${win.pulse.adj >= 0 ? '+' : ''}${win.pulse.adj.toFixed(1)}</b></div>
        <div class="mkt-kv sumline"><span>Attention Pulse — ${M.WIN_LABEL[state.window]}</span><b>${win.pulse.value.toFixed(1)}</b></div>
        <small class="mkt-vers">${M.VERSIONS.pulse} · cohort: ${M.catById(m.cat).name} × ${m.tier.label}</small></div>
      <div><h4>Underwriting &amp; market</h4>
        <div class="mkt-kv"><span>PoA underwriting</span><b>${m.poa.band === 'insufficient' ? 'Insufficient evidence' : m.poa.score}</b></div>
        <div class="mkt-kv"><span>Evidence Confidence</span><b>${m.evidence.grade} ${m.evidence.score}</b></div>
        ${m.poa.band !== 'insufficient' ? `<div class="mkt-kv"><span>Est. authentic attention</span><b>${m.poa.range[0]}–${m.poa.range[1]}%</b></div>` : ''}
        <p class="mkt-ev pos">+ ${esc(m.poa.positive)}</p>
        <p class="mkt-ev ${m.risk.level === 'none' ? '' : 'neg'}">! ${esc(m.poa.riskNote)}</p>
        <button class="mkt-btn ghost" data-poa="${c.id}">Open PoA evidence</button>
        <div style="margin-top:10px">${terms}</div>
        <div class="mkt-exp-actions">${watchBtn(c, true)}<button class="mkt-btn" data-profile="${c.id}">Open profile →</button></div>
        <small class="mkt-vers">Snapshot ${snapLabel} · ${M.VERSIONS.ranking} · ${M.VERSIONS.poa} · ${M.VERSIONS.taxonomy}</small></div>
    </div></td></tr>`;
  }

  /* ---------------- mobile card (§15.9) ---------------- */
  function mobileCard(c, i, rmap) {
    const m = c.mkt, r = rmap[c.id] || { rank: i + 1, move: 0 };
    return `<article class="mkt-mcard" data-row="${c.id}">
      <div class="mkt-mcard-top">
        <span class="mkt-mrank">${String(i + 1).padStart(2, '0')} ${moveBadge(r)}</span>
        ${watchBtn(c)}
      </div>
      <button class="mkt-name" data-profile="${c.id}">${avatar(c, 40)}<span><b>${esc(c.name)}</b><small>${esc(c.handle)} · ${M.catById(m.cat).name}</small></span></button>
      <div class="mkt-mcard-plats">${m.profiles.map(platChip).join('')}</div>
      <div class="mkt-mcard-grid">
        <div><small>Pulse · ${state.window}</small>${pulseCell(c)}</div>
        <div><small>Observed</small>${obsCell(c)}</div>
        <div><small>PoA · Evidence</small>${poaPill(c)}</div>
        <div><small>Risk</small><span class="mkt-c-risk ${m.risk.level}">${esc(m.risk.label)}</span></div>
      </div>
      <div class="mkt-mcard-foot">${stateChip(c)}<span class="mkt-mcard-actions">${m.state === 'OPEN' ? `<button class="mkt-cta" data-profile="${c.id}">Position</button>` : ''}<button class="mkt-btn ghost" data-poa="${c.id}">Evidence</button></span></div>
    </article>`;
  }

  /* ---------------- modules ---------------- */
  function miniRow(c, i, extra) {
    return `<div class="mkt-mini" data-row="${c.id}">
      <span class="mkt-mini-rank">${i + 1}</span>
      <button class="mkt-name" data-profile="${c.id}">${avatar(c, 30)}<span><b>${esc(c.name)}</b><small>${M.catById(c.mkt.cat).name} · ${B.fmt(c.followers)} reach</small></span></button>
      <span class="mkt-mini-extra">${extra}</span>
      ${poaPill(c)}${watchBtn(c)}
    </div>`;
  }
  function risingModule() {
    const list = M.risingList(state.window).slice(0, 5);
    if (!list.length) return '';
    return `<section class="mkt-module" id="mktRising">
      <div class="mkt-module-h"><h2>Rising before the world prices them</h2>
        <span class="mkt-module-note" title="Rising identifies attention acceleration and evidence quality. It does not forecast contract payout.">ⓘ acceleration, not a return forecast</span></div>
      <div class="mkt-minis">${list.map((c, i) => miniRow(c, i, `<b>M${Math.round(c.mkt.windows[state.window].pulse.comp.momentum)}</b><small>momentum</small><b>${c.mkt.windows[state.window].pulse.value.toFixed(1)}</b><small>Pulse</small>`)).join('')}</div>
    </section>`;
  }
  function hcModule() {
    const list = M.highConfidenceList(state.window).slice(0, 5);
    if (!list.length) return '';
    return `<section class="mkt-module">
      <div class="mkt-module-h"><h2>Highest-confidence attention</h2><span class="mkt-module-note">PoA ≥75 · Evidence ≥80 · no severe flag</span></div>
      <div class="mkt-minis">${list.map((c, i) => miniRow(c, i, `<b>${c.mkt.evidence.score}</b><small>evidence</small><b>${c.mkt.poa.score}</b><small>PoA</small>`)).join('')}</div>
    </section>`;
  }
  function categoryModules() {
    const counts = {};
    M.ALL.forEach(c => { counts[c.mkt.cat] = (counts[c.mkt.cat] || 0) + 1; });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 6);
    const cards = top.map(catId => {
      const cat = M.catById(catId);
      const inCat = M.sortBoard(M.ALL.filter(c => c.mkt.cat === catId), state.window, false);
      const leader = inCat[0];
      const riser = inCat.slice().sort((a, b) => b.mkt.windows[state.window].pulse.comp.momentum - a.mkt.windows[state.window].pulse.comp.momentum)[0];
      const hc = inCat.slice().sort((a, b) => b.mkt.evidence.score - a.mkt.evidence.score)[0];
      return `<div class="mkt-catcard">
        <div class="mkt-catcard-h"><h3>${cat.name}</h3><span>${counts[catId]} rank-eligible</span></div>
        <div class="mkt-kv"><span>Leader</span><b>${esc(leader.name)} · ${leader.mkt.windows[state.window].pulse.value.toFixed(1)}</b></div>
        <div class="mkt-kv"><span>Fastest riser</span><b>${esc(riser.name)} · M${Math.round(riser.mkt.windows[state.window].pulse.comp.momentum)}</b></div>
        <div class="mkt-kv"><span>Highest confidence</span><b>${esc(hc.name)} · ${hc.mkt.evidence.score}</b></div>
        <div class="mkt-minis tight">${inCat.slice(0, 3).map((c, i) => miniRow(c, i, `<b>${c.mkt.windows[state.window].pulse.value.toFixed(1)}</b><small>Pulse</small>`)).join('')}</div>
        <button class="mkt-btn ghost" data-cat="${catId}">Open category market →</button>
      </div>`;
    }).join('');
    return `<section class="mkt-module"><div class="mkt-module-h"><h2>Category markets</h2><span class="mkt-module-note">${M.VERSIONS.taxonomy} · primary-cohort Pulse</span></div><div class="mkt-catgrid">${cards}</div></section>`;
  }
  function platformModules() {
    const cards = M.PLATFORMS.map(p => {
      const onPlat = M.sortBoard(M.ALL.filter(c => c.mkt.profiles.some(x => x.plat === p.id)), state.window, false);
      const rows = onPlat.slice(0, 3).map((c, i) => {
        const prof = c.mkt.profiles.find(x => x.plat === p.id);
        return miniRow(c, i, `<b>${prof.reachLabel}</b><small>${p.reachWord}</small><b>${c.mkt.windows[state.window].pulse.value.toFixed(1)}</b><small>Pulse</small>`);
      }).join('');
      return `<div class="mkt-platcard">
        <div class="mkt-platcard-h"><svg viewBox="0 0 24 24">${B.PLAT_IC[p.id] || ''}</svg><h3>${p.name}</h3><span class="mkt-status ${p.status}"><i></i>${p.statusLabel}</span></div>
        <p class="mkt-platcard-unit">Ranked in ${p.unit} — raw values are never added across platforms.</p>
        <div class="mkt-minis tight">${rows}</div>
        <button class="mkt-btn ghost" data-plat="${p.id}">Open ${p.name} board →</button>
      </div>`;
    }).join('');
    return `<section class="mkt-module"><div class="mkt-module-h"><h2>Platform markets</h2><span class="mkt-module-note">platform-appropriate units · independent degradation</span></div><div class="mkt-platgrid">${cards}</div></section>`;
  }
  function methodologyFooter() {
    return `<footer class="mkt-foot">
      <div class="mkt-foot-grid">
        <div><h4>Ranking methodology</h4><p>Default rank is <b>Attention Pulse — 7 days</b>: cohort-normalized percentiles of volume (30%), engagement rate (20%), momentum (20%), persistence (20%) and content freshness (10%), with bounded PoA adjustments and risk, evidence and freshness penalties. Raw follower count never determines default rank.</p></div>
        <div><h4>Proof of Attention</h4><p>PoA is a versioned underwriting estimate — authenticity, durability, engagement quality, monetization readiness, manipulation risk — always shown beside its <b>Evidence Confidence</b>. It is advisory: a weak score never delists a creator, and PoA never settles a contract.</p></div>
        <div><h4>Simulation disclosure</h4><p>All positions are <b>simulated — no real money moves</b>. Contract terms render only from authoritative milestone records; watch-only creators show no invented terms. This page is a demo running a fixture catalog (<code>isFixture=true</code>); production requires source-backed data with provenance.</p></div>
      </div>
      <div class="mkt-foot-vers"><span>${M.VERSIONS.ranking}</span><span>${M.VERSIONS.pulse}</span><span>${M.VERSIONS.poa}</span><span>${M.VERSIONS.taxonomy}</span><span>Snapshot ${snapLabel}</span></div>
    </footer>`;
  }

  /* ---------------- filters drawer ---------------- */
  function chip(group, val, label, active) { return `<button class="mkt-fchip ${active ? 'on' : ''}" data-f="${group}" data-v="${val}">${label}</button>`; }
  function drawerHTML() {
    const n = sortList(eligible()).length;
    return `<div class="mkt-drawer-h"><h3>Filter market</h3><button class="mkt-x" data-close-drawer aria-label="Close filters"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="mkt-drawer-b">
      <h5>Platform</h5><div class="mkt-fgroup">${M.PLATFORMS.map(p => chip('plat', p.id, p.name, state.platforms.includes(p.id))).join('')}</div>
      <h5>Creator scale</h5><div class="mkt-fgroup">${M.TIERS.map(t => chip('scale', t.id, t.label, state.scale.includes(t.id))).join('')}</div>
      <h5>PoA signal</h5><div class="mkt-fgroup">${[['strong', 'Strong'], ['mixed', 'Mixed'], ['risk', 'Elevated risk'], ['insufficient', 'Insufficient']].map(x => chip('poa', x[0], x[1], state.poa.includes(x[0]))).join('')}</div>
      <h5>Evidence Confidence</h5><div class="mkt-fgroup">${[['all', 'Any'], ['high', 'High only'], ['medium', 'Medium+'], ['low', 'Include Low']].map(x => chip('ev', x[0], x[1], state.evidence === x[0])).join('')}</div>
      <h5>Market state</h5><div class="mkt-fgroup">${Object.keys(M.STATES).map(s => chip('state', s, M.STATES[s].label, state.states.includes(s))).join('')}</div>
      <h5>Maximum risk</h5><div class="mkt-fgroup">${[['all', 'Any'], ['none', 'None'], ['low', 'Low'], ['medium', 'Medium'], ['elevated', 'Elevated']].map(x => chip('risk', x[0], x[1], state.risk === x[0])).join('')}</div>
    </div>
    <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-reset-filters>Reset</button><button class="mkt-btn accent" data-close-drawer>Show ${n} creators</button></div>`;
  }
  function openDrawer() { const d = $('#mktDrawer', root); d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); d.innerHTML = `<div class="mkt-drawer-panel" role="dialog" aria-label="Filter market">${drawerHTML()}</div>`; }
  function refreshDrawer() { const d = $('#mktDrawer', root); if (d.classList.contains('open')) $('.mkt-drawer-panel', d).innerHTML = drawerHTML(); }
  function closeDrawer() { const d = $('#mktDrawer', root); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = ''; }

  /* ---------------- PoA evidence panel (§26.5) ---------------- */
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
      <div class="mkt-drawer-h"><div>${avatar(c, 34)}</div><div class="mkt-poa-t"><h3>Proof of Attention</h3><small>${esc(c.name)} · ${m.unified ? 'unified profile' : 'platform profile'}</small></div><button class="mkt-x" data-close-poa aria-label="Close evidence panel"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
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
        <small class="mkt-vers">Public-data score · computed ${snapLabel} · ${M.VERSIONS.poa}</small>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-correction>Report a correction</button><button class="mkt-btn" data-profile="${c.id}">Full underwriting profile →</button></div>
    </div>`;
    $('.mkt-x', d).focus();
  }
  function closePoa() { const d = $('#mktPoa', root); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = ''; }

  /* ---------------- board + page render ---------------- */
  function activeFilterChips() {
    const chips = [];
    const add = (label, fn) => chips.push({ label, fn });
    if (state.genre) add(M.catById(state.genre).name, () => { state.genre = null; state.sub = null; });
    if (state.sub) add(M.subName(state.sub), () => { state.sub = null; });
    state.platforms.forEach(p => add(M.platById(p).name, () => { state.platforms = state.platforms.filter(x => x !== p); }));
    state.scale.forEach(s => add(M.TIERS.find(t => t.id === s).label, () => { state.scale = state.scale.filter(x => x !== s); }));
    state.poa.forEach(s => add('PoA: ' + s, () => { state.poa = state.poa.filter(x => x !== s); }));
    if (state.evidence !== 'all') add('Evidence: ' + state.evidence, () => { state.evidence = 'all'; });
    state.states.forEach(s => add(M.STATES[s].label, () => { state.states = state.states.filter(x => x !== s); }));
    if (state.risk !== 'all') add('Risk ≤ ' + state.risk, () => { state.risk = 'all'; });
    return chips;
  }
  window.__mktChipRemove = [];

  function boardHTML() {
    const list = sortList(eligible());
    const rmap = M.ranks(state.window).map;
    const slice = list.slice(0, state.shown);
    const chips = activeFilterChips();
    window.__mktChipRemove = chips.map(c => c.fn);
    const openCount = list.filter(c => c.mkt.state === 'OPEN').length;
    return `
      <div class="mkt-board-h">
        <h2 id="mktBoardTitle">${state.genre ? M.catById(state.genre).name + ' attention board' : 'Global Attention Board'}</h2>
        <div class="mkt-board-tools">
          <button class="mkt-btn ghost" data-open-drawer>Filters${chips.length ? ` <b>${chips.length}</b>` : ''}</button>
          <label class="mkt-sort">Sort <select id="mktSort">${SORTS.map(s => {
            const disabled = (s[0] === 'backed' || s[0] === 'deadline') && !openCount;
            return `<option value="${s[0]}" ${s[0] === state.sort ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${s[1]}${disabled ? ' (no contracts)' : ''}</option>`;
          }).join('')}</select></label>
          <button class="mkt-btn ghost" data-share-board title="Copy a link that restores filters, sort and window">Share</button>
        </div>
      </div>
      ${chips.length ? `<div class="mkt-active-chips">${chips.map((c, i) => `<span class="mkt-achip">${esc(c.label)}<button data-chip-x="${i}" aria-label="Remove filter ${esc(c.label)}">×</button></span>`).join('')}<button class="mkt-clear" data-clear-filters>Clear filters</button></div>` : ''}
      <div class="mkt-table-wrap">
        <table class="mkt-table" aria-describedby="mktBoardTitle">
          <thead><tr>
            <th scope="col">Rank</th><th scope="col">Creator</th><th scope="col">Platforms · reach</th><th scope="col">Category</th>
            <th scope="col">Observed · ${state.window}</th><th scope="col">Pulse Δ</th><th scope="col">PoA</th>
            <th scope="col">Risk</th><th scope="col">Market</th><th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr></thead>
          <tbody>${slice.map((c, i) => row(c, i, rmap)).join('')}</tbody>
        </table>
      </div>
      <div class="mkt-cards">${slice.map((c, i) => mobileCard(c, i, rmap)).join('')}</div>
      <div class="mkt-board-f">
        ${list.length > state.shown ? `<button class="mkt-btn" data-load-more>Load ${Math.min(50, list.length - state.shown)} more</button>` : ''}
        <span>Showing ${Math.min(state.shown, list.length)} of ${list.length} eligible · Snapshot ${snapLabel}</span>
      </div>
      ${list.length === 0 ? '<div class="mkt-empty">No creators match the current filters. Loosen evidence, risk or scale to widen the market.</div>' : ''}`;
  }

  function refreshBoard() { $('#mktBoard', root).innerHTML = boardHTML(); writeURL(); }
  function refreshAll() {
    $('#mktBoard', root).innerHTML = boardHTML();
    $('#mktModules', root).innerHTML = risingModule() + hcModule() + categoryModules() + platformModules() + methodologyFooter();
    writeURL();
  }

  function render(app) {
    root = app;
    if (!booted) { readURL(); booted = true; }
    const strip = M.statusStrip();
    app.innerHTML = `
    <div class="mkt" id="mktRoot">
      <div class="mkt-framing">
        <div class="mkt-framing-l">
          <h1>Where attention is moving.</h1>
          <p>Discover creators earning credible attention before the market fully prices them.</p>
          <p class="mkt-protocol">Attention has scale. What it lacks is underwriting.</p>
        </div>
        <div class="mkt-framing-r">
          <form class="mkt-search" id="mktNL">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input id="mktNLInput" placeholder="Try: high-confidence AI educators under 50K" aria-label="Search creators in natural language"/>
            <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
          </form>
          <div class="mkt-winrow">
            <div class="mkt-windows" role="tablist" aria-label="Time window">${M.WINDOWS.map(w => `<button role="tab" aria-selected="${w === state.window}" class="${w === state.window ? 'on' : ''}" data-window="${w}">${w.toUpperCase()}</button>`).join('')}</div>
            <span class="mkt-fresh" title="Snapshot ${snapLabel}"><i></i>Rankings updated ${updatedAgo}</span>
          </div>
        </div>
      </div>
      <div class="mkt-strip">${strip.map(s => `<div class="mkt-stat" title="${esc(s.tip)}"><b>${s.v}</b><span>${s.l}</span></div>`).join('')}</div>
      <div class="mkt-genres">${['all', ...M.TAXONOMY.map(t => t.id)].map(id => `<button class="chip ${(!state.genre && id === 'all') || state.genre === id ? 'active' : ''}" data-cat="${id === 'all' ? '' : id}">${id === 'all' ? 'All markets' : M.catById(id).name}</button>`).join('')}</div>
      <section id="mktBoard" class="mkt-board" aria-live="polite">${boardHTML()}</section>
      <div id="mktModules">${risingModule() + hcModule() + categoryModules() + platformModules() + methodologyFooter()}</div>
      <div class="mkt-drawer" id="mktDrawer" aria-hidden="true"></div>
      <div class="mkt-drawer" id="mktPoa" aria-hidden="true"></div>
    </div>`;
    bind(app);
    writeURL();
  }

  /* ---------------- events ---------------- */
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
        else { watch.add(id); toast('Watching — updates will appear in your portfolio'); }
        setWatch(watch);
        $$(`[data-watch="${id}"]`, rootEl).forEach(b => {
          const on = watch.has(id);
          b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
          const sp = b.querySelector('span'); if (sp) sp.textContent = on ? 'Watching' : 'Watch';
        });
        return;
      }
      if ((el = has('[data-poa]'))) { e.stopPropagation(); e.preventDefault(); openPoa(B.byId(el.dataset.poa)); return; }
      if ((el = has('[data-close-poa]'))) { e.stopPropagation(); closePoa(); return; }
      if ((el = has('[data-correction]'))) { e.stopPropagation(); closePoa(); toast('Correction request recorded — reviewed with source evidence'); return; }
      if ((el = has('[data-profile]'))) { e.stopPropagation(); e.preventDefault(); closePoa(); closeDrawer(); window.__backerGo('creator', el.dataset.profile); return; }
      if ((el = has('[data-expand]'))) {
        e.stopPropagation(); e.preventDefault();
        const id = el.dataset.expand;
        state.expanded[id] = !state.expanded[id];
        refreshBoard(); return;
      }
      if ((el = has('[data-window]'))) { e.stopPropagation(); state.window = el.dataset.window; $$('[data-window]', rootEl).forEach(b => { b.classList.toggle('on', b.dataset.window === state.window); b.setAttribute('aria-selected', b.dataset.window === state.window); }); refreshAll(); return; }
      if ((el = has('[data-cat]')) && el.dataset.cat !== undefined) {
        e.stopPropagation();
        state.genre = el.dataset.cat || null; state.sub = null; state.shown = 50;
        $$('.mkt-genres .chip', rootEl).forEach(b => b.classList.toggle('active', (b.dataset.cat || null) === state.genre || (!state.genre && b.dataset.cat === '')));
        refreshBoard();
        $('#mktBoard', rootEl).scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if ((el = has('[data-plat]'))) { e.stopPropagation(); state.platforms = [el.dataset.plat]; state.shown = 50; refreshBoard(); $('#mktBoard', rootEl).scrollIntoView({ behavior: 'smooth' }); return; }
      if ((el = has('[data-open-drawer]'))) { e.stopPropagation(); openDrawer(); return; }
      if ((el = has('[data-close-drawer]'))) { e.stopPropagation(); closeDrawer(); refreshBoard(); return; }
      if ((el = has('[data-reset-filters]')) || (el = has('[data-clear-filters]'))) {
        e.stopPropagation();
        state.genre = null; state.sub = null; state.platforms = []; state.scale = []; state.poa = [];
        state.evidence = 'all'; state.states = []; state.risk = 'all'; state.shown = 50;
        $$('.mkt-genres .chip', rootEl).forEach(b => b.classList.toggle('active', b.dataset.cat === ''));
        refreshDrawer(); refreshBoard(); return;
      }
      if ((el = has('[data-chip-x]'))) { e.stopPropagation(); const fn = window.__mktChipRemove[+el.dataset.chipX]; if (fn) fn(); state.shown = 50; refreshBoard(); return; }
      if ((el = has('[data-f]'))) {
        e.stopPropagation();
        const g = el.dataset.f, v = el.dataset.v;
        const toggleIn = arr => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
        if (g === 'plat') state.platforms = toggleIn(state.platforms);
        else if (g === 'scale') state.scale = toggleIn(state.scale);
        else if (g === 'poa') state.poa = toggleIn(state.poa);
        else if (g === 'ev') state.evidence = v;
        else if (g === 'state') state.states = toggleIn(state.states);
        else if (g === 'risk') state.risk = v;
        state.shown = 50;
        refreshDrawer(); refreshBoard(); return;
      }
      if ((el = has('[data-load-more]'))) { e.stopPropagation(); state.shown += 50; refreshBoard(); return; }
      if ((el = has('[data-share-board]'))) {
        e.stopPropagation();
        try { navigator.clipboard && navigator.clipboard.writeText(location.href); } catch (x) {}
        toast('Link copied — restores filters, sort and window'); return;
      }
      // drawer backdrop click
      if (t.id === 'mktDrawer') { closeDrawer(); refreshBoard(); return; }
      if (t.id === 'mktPoa') { closePoa(); return; }
    });
    rootEl.addEventListener('change', e => {
      if (e.target.id === 'mktSort') { state.sort = e.target.value; state.shown = 50; refreshBoard(); }
    });
    rootEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePoa(); closeDrawer(); }
    });
    const nl = $('#mktNL', rootEl);
    nl.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('#mktNLInput', rootEl).value.trim();
      window.__backerGo('search', q || 'high-confidence AI educators under 50K');
    });
    if (!window.__mktEscBound) { document.addEventListener('keydown', escGlobal); window.__mktEscBound = true; }
  }
  function escGlobal(e) { if (e.key === 'Escape' && root) { closePoa(); closeDrawer(); } }

  return { render };
})();
