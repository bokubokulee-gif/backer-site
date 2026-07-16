/* =========================================================
   BACKER — application logic (vanilla JS, no deps)
   Background is driven by js/shader.js (ported WebGL effect).
   ========================================================= */
(function () {
  'use strict';
  const B = window.BACKER;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');

  /* ---------------- small helpers ---------------- */
  function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  function avatarBg(h) {
    return `radial-gradient(circle at 32% 26%, hsl(${h} 75% 64%), hsl(${h + 28} 58% 34%) 62%, hsl(${h + 10} 40% 16%))`;
  }
  function authColors(auth) {
    if (auth >= 80) return { bg: 'rgba(134,227,184,.92)', fg: '#0a1f15', word: 'real' };
    if (auth >= 60) return { bg: 'rgba(243,180,78,.92)', fg: '#241600', word: 'mixed' };
    return { bg: 'rgba(255,111,107,.95)', fg: '#2a0808', word: 'flagged' };
  }
  function statusColor(s) { return s === 'ok' ? '#56d39a' : s === 'warn' ? '#f3b44e' : '#ff6f6b'; }

  /* ---------------- per-creator cover canvas ---------------- */
  function renderCover(canvas) {
    const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height; const hue = +canvas.dataset.hue;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${hue} 40% 11%)`); g.addColorStop(1, `hsl(${hue + 22} 32% 5%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.08, 0, W * 0.5, H * 0.08, H * 1.25);
    rg.addColorStop(0, `hsla(${hue}, 82%, 60%, .34)`); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 64; i++) {
      const x = Math.random() * W; const center = 1 - Math.abs(x / W - 0.5) * 2;
      const h = H * (0.3 + Math.random() * 0.7); const y = (H - h) * Math.random(); const w = 0.6 + Math.random() * 1.9;
      const col = Math.random() < 0.18 ? `hsl(${hue + 170} 55% 72%)` : `hsl(${hue} 72% ${60 + Math.random() * 24}%)`;
      const lg = ctx.createLinearGradient(0, y, 0, y + h);
      lg.addColorStop(0, 'transparent'); lg.addColorStop(.5, col); lg.addColorStop(1, 'transparent');
      ctx.globalAlpha = (0.02 + center * 0.13) * (0.4 + Math.random()); ctx.fillStyle = lg; ctx.fillRect(x, y, w, h);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function mountCovers(root) {
    $$('.cover-canvas', root).forEach(c => { if (!c.dataset.drawn) { renderCover(c); c.dataset.drawn = '1'; } });
  }

  /* ---------------- charts ---------------- */
  function chartPaths(vals, w, h, pad) {
    const min = Math.min(...vals), max = Math.max(...vals), rng = (max - min) || 1;
    const pts = vals.map((v, i) => [pad + i * (w - 2 * pad) / (vals.length - 1), h - pad - ((v - min) / rng) * (h - 2 * pad)]);
    let line = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
      line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
    return { line, area, last: pts[pts.length - 1] };
  }
  function chartSVG(vals, color) {
    const w = 640, h = 200, pad = 16, id = 'g' + Math.random().toString(36).slice(2, 7);
    const { line, area, last } = chartPaths(vals, w, h, pad);
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:200px;display:block">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="${color}"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="9" fill="${color}" opacity=".22"/>
    </svg>`;
  }
  function ringSVG(pct, color) {
    const r = 52, c = 2 * Math.PI * r, off = c * (1 - pct / 100), id = 'r' + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 120 120" width="118" height="118">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".72"/>
      </linearGradient></defs>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="11"/>
      <circle class="ring-fill" cx="60" cy="60" r="${r}" fill="none" stroke="url(#${id})" stroke-width="11"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${off}"
        style="filter:drop-shadow(0 0 6px ${color})"/>
    </svg>`;
  }

  /* ---------------- portfolio state (localStorage) ---------------- */
  const PKEY = 'backer_portfolio_v1';
  function getPortfolio() {
    try { const raw = localStorage.getItem(PKEY); if (raw) return JSON.parse(raw); } catch (e) {}
    const seed = B.seedPortfolio.slice(); savePortfolio(seed); return seed;
  }
  function savePortfolio(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  function markValue(pos) {
    if (pos.value != null) return pos.value;
    const c = B.byId(pos.id); if (!c) return pos.invested;
    const f = 1 + Math.max(-0.25, Math.min(0.6, (c.auth - 70) / 300 + c.growth / 900));
    return pos.invested * f;
  }
  function addPosition(id, amount) {
    const p = getPortfolio();
    const existing = p.find(x => x.id === id && !x.value);
    if (existing) existing.invested += amount;
    else p.push({ id, invested: amount, when: 'Jun 2026' });
    savePortfolio(p);
  }
  function portfolioStats() {
    const p = getPortfolio();
    let inv = 0, val = 0, authSum = 0;
    p.forEach(pos => { inv += pos.invested; val += markValue(pos); const c = B.byId(pos.id); authSum += (c ? c.auth : 70); });
    const ret = inv ? (val - inv) / inv * 100 : 0;
    const grade = ret >= 15 ? 'A+' : ret >= 8 ? 'A' : ret >= 3 ? 'B+' : ret >= 0 ? 'B' : 'C';
    const pctile = ret >= 15 ? 7 : ret >= 8 ? 14 : ret >= 3 ? 28 : 45;
    return { p, inv, val, ret, grade, pctile, count: p.length };
  }

  /* ---------------- creator card ---------------- */
  function card(c) {
    const pct = B.fundPct(c), ac = authColors(c.auth);
    return `<article class="ccard" data-creator="${c.id}">
      <div class="ccard-cover">
        <canvas class="cover-canvas" data-hue="${c.hue}" width="600" height="280"></canvas>
        <span class="ccard-auth" style="background:${ac.bg};color:${ac.fg}">${c.auth}% ${ac.word}</span>
        <span class="ccard-cat">${c.category}</span>
      </div>
      <div class="ccard-body">
        <div class="ccard-id">
          <span class="ccard-avatar" style="background:${avatarBg(c.hue)};display:grid;place-items:center;font-weight:700;font-size:14px;color:hsl(${c.hue} 60% 14%)">${initials(c.name)}</span>
          <div><div class="ccard-name">${c.name}</div><div class="ccard-handle">${c.handle}</div></div>
        </div>
        <div class="ccard-stats">
          <div class="cstat"><div class="cstat-label">Followers</div><div class="cstat-val">${B.fmt(c.followers)}</div></div>
          <div class="cstat"><div class="cstat-label">Monthly views</div><div class="cstat-val">${B.fmt(c.monthlyViews)}</div></div>
          <div class="cstat"><div class="cstat-label">Growth</div><div class="cstat-val ${c.growth > 0 ? 'pos' : ''}">+${c.growth}%</div></div>
        </div>
        <div class="ccard-fund">
          <div class="fund-row"><span>Raised <b>${B.money(c.raised)}</b> / ${B.money(c.goal)}</span><span>up to <b>${c.milestone.mult}×</b></span></div>
          <div class="fund-bar"><i style="width:${pct}%"></i></div>
        </div>
      </div>
    </article>`;
  }

  /* =====================================================
     VIEWS
     ===================================================== */
  const dock = $('#dock');
  function setDock(view) {
    $$('.dock-btn', dock).forEach(b => b.classList.toggle('active', b.dataset.view === view));
  }

  function go(view, arg) {
    if (view === 'portfolio') { window.location.href = 'portfolio.html'; return; }
    if (view === 'home') {
      document.body.classList.remove('body-app', 'mkt-full');
      app.classList.add('hidden'); app.setAttribute('aria-hidden', 'true');
      $$('.dock-btn', dock).forEach(b => b.classList.remove('active'));
      $('.dock-home').classList.add('active');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    document.body.classList.add('body-app');
    document.body.classList.toggle('mkt-full', view === 'market'); // market view escapes the 1180px app cap
    app.classList.remove('hidden'); app.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (view === 'market') { renderMarket(); setDock('market'); }
    else if (view === 'creator') { renderCreator(arg); setDock('market'); }
    else if (view === 'portfolio') { renderPortfolio('investor'); setDock('portfolio'); }
    else if (view === 'search') { renderSearch(arg || ''); setDock('search'); }
  }
  window.__backerGo = go;

  /* ---------- MARKET ---------- */
  let activeFilter = 'all';
  const FILTERS = [['all', 'All'], ['ai', 'AI Research'], ['tech', 'Tech Education'], ['music', 'Music'], ['indie', 'Indie Hackers'], ['art', 'Digital Art'], ['gaming', 'Gaming'], ['cooking', 'Cooking'], ['writing', 'Writing'], ['video', 'Film']];
  function renderMarket() {
    // Creator Attention Marketplace (js/market.js) owns this view when present
    if (window.BackerMarket) { window.BackerMarket.render(app); return; }
    const list = activeFilter === 'all' ? B.creators : B.creators.filter(c => c.cat === activeFilter);
    app.innerHTML = `
      <div class="app-head">
        <div><h1>Marketplace</h1><p>Discover and back the next generation of high-growth creators — every profile underwritten by Proof of Attention.</p></div>
        <div class="app-tools">
          <div class="app-searchbar"><svg viewBox="0 0 24 24" class="ic"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="mktSearch" placeholder="Search creators…"/></div>
        </div>
      </div>
      <div class="filters">${FILTERS.map(f => `<button class="chip ${f[0] === activeFilter ? 'active' : ''}" data-filter="${f[0]}">${f[1]}</button>`).join('')}</div>
      <div class="creator-grid" id="grid">${list.map(card).join('')}</div>`;
    mountCovers(app);
    const s = $('#mktSearch');
    s.addEventListener('input', () => {
      const q = s.value.toLowerCase().trim();
      const f = (activeFilter === 'all' ? B.creators : B.creators.filter(c => c.cat === activeFilter))
        .filter(c => !q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
      $('#grid').innerHTML = f.length ? f.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><svg viewBox="0 0 24 24" class="ic"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>No creators match “${s.value}”.</div>`;
      mountCovers(app);
    });
  }

  /* ---------- CREATOR DETAIL ---------- */
  function renderCreator(id) {
    const c = B.byId(id); if (!c) return renderMarket();
    const trajColor = statusColor(c.velocity.status);
    const authColor = c.auth >= 80 ? '#56d39a' : c.auth >= 60 ? '#f3b44e' : '#ff6f6b';
    const ac = authColors(c.auth);
    const monthsTraj = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    // market state gates every contract surface (PRD: no synthesized terms)
    const mstate = c.mkt ? c.mkt.state : 'OPEN';
    const stateInfo = (window.BACKER_MKT && window.BACKER_MKT.STATES[mstate]) || { label: 'Open' };
    const investable = mstate === 'OPEN' && !!c.milestone;
    const hasTerms = !!c.milestone && ['OPEN', 'OPENING_SOON', 'CLOSED', 'RESOLVED'].includes(mstate);
    const msTarget = c.milestone ? (c.milestone.money ? B.money(c.milestone.target) : B.fmt(c.milestone.target)) : '';
    const msCurrent = c.milestone ? (c.milestone.money ? B.money(c.milestone.current) : B.fmt(c.milestone.current)) : '';
    const msPct = c.milestone ? Math.min(100, Math.round(c.milestone.current / c.milestone.target * 100)) : 0;
    const flagBanner = c.flagged ? `<div class="metric" style="grid-column:1/-1;border-color:${c.flagged === 'neg' ? 'rgba(255,111,107,.4)' : 'rgba(243,180,78,.4)'};background:${c.flagged === 'neg' ? 'rgba(255,111,107,.07)' : 'rgba(243,180,78,.06)'}">
        <div class="metric-label" style="color:${c.flagged === 'neg' ? '#ff6f6b' : '#f3b44e'}"><svg viewBox="0 0 24 24" class="ic" style="width:14px;height:14px"><path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg> Backer caution flag</div>
        <div class="metric-sub" style="font-size:13px;margin-top:8px;color:var(--ink)">${c.flagged === 'neg' ? 'This profile shows strong signatures of purchased engagement. We surface it on purpose — to show the protocol working. Read the AI assessment before considering a position.' : 'Audience quality is mixed and velocity is elevated. The headline growth is likely inflated. Adjust your expectations accordingly.'}</div>
      </div>` : '';

    app.innerHTML = `
      <a class="back-link" data-view="market"><svg viewBox="0 0 24 24" class="ic"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Back to marketplace</a>
      <div class="detail">
        <div class="detail-main">
          <div class="dhero">
            <div class="dhero-cover"><canvas class="cover-canvas" data-hue="${c.hue}" width="900" height="340"></canvas><div class="dhero-grad"></div></div>
            <div class="dhero-body">
              <span class="dhero-avatar" style="background:${avatarBg(c.hue)};display:grid;place-items:center;font-weight:700;font-size:30px;color:hsl(${c.hue} 60% 14%)">${initials(c.name)}</span>
              <div class="dhero-meta">
                <h1>${c.name}</h1><div class="handle">${c.handle}</div>
                <div class="dhero-tags"><span class="dtag">${c.category}</span><span class="dtag">Growth +${c.growth}% MoM</span><span class="dtag" style="color:${ac.bg};border-color:${ac.bg}">${c.mkt ? 'PoA ' + c.mkt.poa.score + ' · ' + c.mkt.evidence.grade + ' evidence' : c.auth + '% authentic'}</span>${c.mkt ? `<span class="dtag">${stateInfo.label}</span>` : ''}</div>
              </div>
              <div class="dhero-actions"><button class="btn btn-ghost" data-share>Share</button></div>
            </div>
            <div class="platforms">${c.platforms.map(p => `<div class="plat"><svg viewBox="0 0 24 24" class="ic">${B.PLAT_IC[p[0]] || ''}</svg><b>${p[2]}</b><span>${p[1]}</span></div>`).join('')}</div>
          </div>

          <div class="score-block">
            <div class="score-block-head"><h3>Proof of Attention — underwriting</h3><span class="verified"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg> Open protocol · re-scored daily</span></div>
            <div class="auth-hero">
              <div class="ring">${ringSVG(c.auth, authColor)}<div class="ring-label"><b>${c.auth}%</b><span>authentic</span></div></div>
              <div class="auth-copy"><h4>${c.auth >= 80 ? 'A genuinely human audience' : c.auth >= 60 ? 'Partly inflated audience' : 'Largely fabricated audience'}</h4><p>${c.blurb}</p></div>
            </div>
            <div class="metric-grid">
              <div class="metric"><div class="metric-label">Retention Index</div><div class="metric-val ${c.retention.idx >= 75 ? 'pos' : c.retention.idx >= 45 ? 'warn' : 'neg'}">${c.retention.label}</div><div class="metric-sub">${c.retention.idx}/100 cohort loyalty</div></div>
              <div class="metric"><div class="metric-label">Engagement Quality</div><div class="metric-val ${c.engQ.score >= 78 ? 'pos' : c.engQ.score >= 55 ? 'warn' : 'neg'}">${c.engQ.grade}</div><div class="metric-sub">${c.engQ.score}/100 active community</div></div>
              <div class="metric"><div class="metric-label">Velocity Flag</div><div class="metric-val ${c.velocity.status === 'ok' ? 'pos' : c.velocity.status === 'warn' ? 'warn' : 'neg'}">${c.velocity.label}</div><div class="metric-sub">${c.velocity.status === 'ok' ? 'organic growth pattern' : 'unnatural spike detected'}</div></div>
              <div class="metric"><div class="metric-label">Monetization Propensity</div><div class="metric-val">${c.monetization}%</div><div class="metric-sub">likely to convert to paying</div></div>
              ${flagBanner}
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-head"><h3>Growth Trajectory</h3><span class="badge-pos" style="color:${trajColor};background:${trajColor}22"><svg viewBox="0 0 24 24" class="ic"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg> +${c.growth}% MoM${c.velocity.status !== 'ok' ? ' · adj.' : ''}</span></div>
            ${chartSVG(c.traj, trajColor)}
            <div class="chart-x">${monthsTraj.map(m => `<span>${m}</span>`).join('')}</div>
          </div>

          ${hasTerms ? `<div class="terms">
            <h3>Milestone terms${mstate !== 'OPEN' ? ` · ${stateInfo.label}` : ''}</h3>
            <div class="term-row">
              <div class="term-ic"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg></div>
              <div class="term-info"><b>Reach ${msTarget} ${c.milestone.metric} in ${c.milestone.deadline}</b><p>Currently ${msCurrent} · ${msPct}% of the way there</p>
                <div class="term-prog"><div class="fund-bar"><i style="width:${msPct}%"></i></div></div>
              </div>
              <div class="term-mult">${c.milestone.mult}×</div>
            </div>
            <p class="metric-sub" style="margin-top:6px">If the milestone is met by the deadline, early backers receive ${c.milestone.mult}× their simulated stake. If it isn't, the simulated stake is lost. Simulated positions — no real money moves.</p>
          </div>` : `<div class="terms">
            <h3>Market state — ${stateInfo.label}</h3>
            <p class="metric-sub">No approved milestone contract exists for this creator. Backer tracks the attention and underwriting evidence above; contract terms are never synthesized. Watch this creator to be notified if a contract opens.</p>
          </div>`}
        </div>

        <aside class="aside">
          ${investable ? `<div class="invest">
            <h3>Back ${c.name.split(' ')[0]}</h3>
            <p class="sub">Take a simulated position from $1. You're betting on the milestone above.</p>
            <div class="amount"><span class="cur">$</span><input id="investAmt" type="number" min="1" value="25" inputmode="numeric"/></div>
            <div class="quick"><button data-quick="5">$5</button><button data-quick="25">$25</button><button data-quick="100">$100</button><button data-quick="250">$250</button></div>
            <div class="proj">
              <div class="proj-row"><span>Payout multiple</span><b>${c.milestone.mult}×</b></div>
              <div class="proj-row"><span>If milestone hits</span><b class="pos" id="projPayout">$0</b></div>
              <div class="proj-row"><span>Potential profit</span><b class="pos" id="projProfit">$0</b></div>
              <div class="proj-row"><span>If it misses</span><b id="projLoss">-$0</b></div>
            </div>
            <button class="btn btn-accent" id="backBtn" data-back-creator="${c.id}">Back this creator</button>
            <p class="invest-foot">Simulated · no real money moves. Ceiling scales with PoA confidence and contract risk. Backing early creators can lose the full simulated stake.</p>
          </div>` : `<div class="invest">
            <h3>${stateInfo.label}</h3>
            <p class="sub">Position controls appear only for a valid open simulated milestone contract. Attention and underwriting evidence stay fully visible either way.</p>
            <button class="btn btn-ghost" data-view="market" style="width:100%;justify-content:center">Back to the market</button>
          </div>`}

          <div class="ai-panel">
            <div class="ai-head"><span class="ai-orb"></span><div><b>Backer AI</b><span>Underwriting copilot</span></div></div>
            <div class="ai-body" id="aiBody"><div class="ai-msg bot">${c.ai.intro}</div></div>
            <div class="ai-suggest" id="aiSuggest">
              <button data-ai="catalysts">Growth catalysts</button>
              <button data-ai="risks">Biggest risks</button>
              <button data-ai="retention">Is the audience real?</button>
            </div>
            <form class="ai-input" id="aiForm"><input id="aiInput" placeholder="Ask about retention, risks, fit…" autocomplete="off"/><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" class="ic"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>
          </div>
        </aside>
      </div>`;
    mountCovers(app);
    // animate ring
    requestAnimationFrame(() => { const rf = $('.ring-fill', app); if (rf) rf.style.strokeDashoffset = rf.dataset.off; });
    if (investable) mountInvest(c);
    mountAI(c);
  }

  function mountInvest(c) {
    const amt = $('#investAmt');
    function upd() {
      let v = parseFloat(amt.value) || 0; if (v < 0) v = 0;
      $('#projPayout').textContent = B.money(v * c.milestone.mult);
      $('#projProfit').textContent = '+' + B.money(v * (c.milestone.mult - 1));
      $('#projLoss').textContent = '-' + B.money(v);
    }
    amt.addEventListener('input', upd); upd();
    $$('.quick button', app).forEach(b => b.addEventListener('click', () => { amt.value = b.dataset.quick; upd(); }));
  }

  function aiReply(c, q) {
    q = q.toLowerCase();
    if (/risk|danger|concern|downside|wrong/.test(q)) return c.ai.risks;
    if (/real|bot|fake|authentic|trust|retention|loyal|come back|sticky/.test(q)) return c.ai.retention;
    if (/grow|catalyst|upside|why|bull|potential|break/.test(q)) return c.ai.catalysts;
    if (/compar|versus|vs|other|benchmark/.test(q)) return `Against peers at the same stage, ${c.name.split(' ')[0]} sits in the <b>${c.auth >= 85 ? 'top decile' : c.auth >= 70 ? 'upper half' : 'bottom quartile'}</b> on authenticity (${c.auth}%) and <b>${c.retention.idx >= 80 ? 'top decile' : c.retention.idx >= 55 ? 'mid' : 'bottom'}</b> on retention. ${c.ai.catalysts}`;
    return c.ai.intro;
  }
  function mountAI(c) {
    const body = $('#aiBody'), form = $('#aiForm'), input = $('#aiInput');
    function ask(q) {
      body.insertAdjacentHTML('beforeend', `<div class="ai-msg user">${q.replace(/</g, '&lt;')}</div>`);
      const typing = document.createElement('div'); typing.className = 'ai-msg bot'; typing.innerHTML = '<div class="ai-typing"><i></i><i></i><i></i></div>';
      body.appendChild(typing); body.scrollTop = body.scrollHeight;
      setTimeout(() => { typing.innerHTML = aiReply(c, q); body.scrollTop = body.scrollHeight; }, 750);
    }
    $$('#aiSuggest button', app).forEach(b => b.addEventListener('click', () => {
      const map = { catalysts: 'What are the key growth catalysts?', risks: 'What are the biggest risks here?', retention: 'How real is this audience?' };
      ask(map[b.dataset.ai]);
    }));
    form.addEventListener('submit', e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; ask(v); input.value = ''; });
  }

  /* ---------- INVEST MODAL ---------- */
  function openInvestModal(c) {
    const amt = parseFloat($('#investAmt') ? $('#investAmt').value : 25) || 0;
    if (amt < 1) { toast('Minimum stake is $1', 'warn'); return; }
    const payout = amt * c.milestone.mult, profit = amt * (c.milestone.mult - 1);
    const msTarget = c.milestone.money ? B.money(c.milestone.target) : B.fmt(c.milestone.target);
    const partnerLogos = B.partners.map(p => `<span style="color:var(--muted)">${p.svg}</span>`).join('');
    openModal(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic" style="background:rgba(244,171,99,.14);color:var(--accent)"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg></div>
      <h2>Confirm your backing</h2>
      <p>You're taking a <b style="color:var(--ink)">${B.money(amt)}</b> position in ${c.name}.</p>
      <div class="modal-receipt">
        <div class="receipt-row"><span>Creator</span><b>${c.name} · ${c.handle}</b></div>
        <div class="receipt-row"><span>Your stake</span><b>${B.money(amt)}</b></div>
        <div class="receipt-row"><span>Milestone</span><b>${msTarget} in ${c.milestone.deadline}</b></div>
        <div class="receipt-row"><span>Payout if hit</span><b class="pos">${B.money(payout)} (${c.milestone.mult}×)</b></div>
        <div class="receipt-row"><span>Potential profit</span><b class="pos">+${B.money(profit)}</b></div>
      </div>
      <button class="btn btn-accent" data-confirm="${c.id}" data-amt="${amt}">Confirm simulated position · ${B.money(amt)}</button>
      <div class="modal-pay">Simulated · no real money moves · ${partnerLogos}</div>
    `);
  }
  function showSuccess(c, amt) {
    const payout = amt * c.milestone.mult;
    openModal(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic"><svg viewBox="0 0 24 24" class="ic"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h2>You're backing ${c.name.split(' ')[0]}.</h2>
      <p>Your ${B.money(amt)} simulated position is recorded. You were here early — that's the whole point.</p>
      <div class="modal-receipt">
        <div class="receipt-row"><span>Position</span><b>${B.money(amt)} in ${c.name}</b></div>
        <div class="receipt-row"><span>Pays out</span><b class="pos">${B.money(payout)} if milestone hits</b></div>
        <div class="receipt-row"><span>Status</span><b>Simulated · no real money moves</b></div>
      </div>
      <button class="btn btn-primary" data-view="portfolio" data-close>View my portfolio</button>
      <button class="btn btn-ghost" data-close style="margin-top:10px">Keep exploring</button>
    `);
  }

  /* ---------- PORTFOLIO ---------- */
  function renderPortfolio(mode) {
    const s = portfolioStats();
    const toggle = `<div class="toggle"><button class="${mode === 'investor' ? 'active' : ''}" data-port-mode="investor">Investor</button><button class="${mode === 'creator' ? 'active' : ''}" data-port-mode="creator">Creator</button></div>`;

    if (mode === 'creator') {
      app.innerHTML = `
        <div class="app-head"><div><h1>Cooper</h1><p>@endurance</p></div>${toggle}</div>
        <div class="ipo">
          <div class="ipo-ic"><svg viewBox="0 0 24 24" class="ic"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
          <h2>Start your Personal IPO</h2>
          <p>Turn your audience into shareholders. Verify your profile, set milestone terms, and raise early capital from the people who believe in you most.</p>
          <button class="btn btn-accent btn-lg" id="applyRaise">Apply to raise</button>
        </div>`;
      $('#applyRaise').addEventListener('click', openRaiseModal);
      return;
    }

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Now'];
    const a = s.inv * 0.9, b = s.val;
    const perf = [a, a * 1.04, b * 0.82, b * 0.88, b * 0.9, b * 0.97, b];
    const holdings = s.p.map(pos => {
      const c = B.byId(pos.id); if (!c) return '';
      const val = markValue(pos), ret = (val - pos.invested) / pos.invested * 100;
      const cls = ret >= 0 ? 'pos' : 'neg';
      return `<div class="holding" data-creator="${c.id}">
        <span class="holding-av" style="background:${avatarBg(c.hue)};display:grid;place-items:center;font-weight:700;font-size:13px;color:hsl(${c.hue} 60% 14%)">${initials(c.name)}</span>
        <div class="holding-info"><b>${c.name}</b><span>${c.handle} · invested ${pos.when}</span></div>
        <div class="holding-val"><b>${B.money(val)}</b><span class="${cls}">${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%</span></div>
      </div>`;
    }).join('');

    app.innerHTML = `
      <div class="app-head">
        <div style="display:flex;align-items:center;gap:16px">
          <span class="dhero-avatar" style="width:60px;height:60px;border-radius:16px;background:${avatarBg(210)};display:grid;place-items:center;font-weight:700;font-size:22px;color:hsl(210 60% 16%);border:none">C</span>
          <div><h1 style="font-size:30px">Cooper</h1><p style="margin-top:2px">@endurance · proof-of-taste portfolio</p></div>
        </div>${toggle}
      </div>
      <div class="port-stats">
        <div class="pcard"><div class="pcard-label">Total asset value</div><div class="pcard-val">${B.money(s.val)}</div><div class="pcard-sub">across ${s.count} position${s.count > 1 ? 's' : ''}</div></div>
        <div class="pcard"><div class="pcard-label">Taste grade</div><div class="pcard-val grade">${s.grade}</div><div class="pcard-sub">Top ${s.pctile}% early believer</div></div>
        <div class="pcard"><div class="pcard-label">Total invested</div><div class="pcard-val">${B.money(s.inv)}</div><div class="pcard-sub">cost basis</div></div>
        <div class="pcard"><div class="pcard-label">Return</div><div class="pcard-val ${s.ret >= 0 ? 'pos' : ''}">${s.ret >= 0 ? '+' : ''}${s.ret.toFixed(2)}%</div><div class="pcard-sub ${s.ret >= 0 ? 'pos' : ''}">${s.ret >= 0 ? '▲' : '▼'} unrealized</div></div>
      </div>
      <div class="port-low">
        <div class="chart-card"><div class="chart-head"><h3>Performance history</h3><span class="badge-pos">${s.ret >= 0 ? '+' : ''}${s.ret.toFixed(1)}%</span></div>${chartSVG(perf, '#56d39a')}<div class="chart-x">${months.map(m => `<span>${m}</span>`).join('')}</div></div>
        <div>
          <div class="holdings">${holdings || '<div class="empty">No positions yet.</div>'}</div>
          <button class="btn btn-ghost" data-view="market" style="width:100%;justify-content:center;margin-top:14px">Find more creators</button>
        </div>
      </div>`;
  }

  function openRaiseModal() {
    openModal(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic" style="background:rgba(244,171,99,.14);color:var(--accent)"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <h2>Apply to raise</h2>
      <p>Link your platforms — we run Proof of Attention and propose milestone terms within 48 hours.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin:20px 0">
        <input class="ai-input" style="all:unset;display:block;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--ink);font-size:14px" placeholder="Primary platform URL (e.g. youtube.com/@you)"/>
        <input style="all:unset;display:block;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--ink);font-size:14px" placeholder="Milestone you want to raise against"/>
      </div>
      <button class="btn btn-accent" data-raise-submit>Submit application</button>
    `);
  }

  /* ---------- AI SEARCH ---------- */
  const SYN = {
    ai: ['ai', 'researcher', 'paper', 'ml', 'machine learning', 'llm'], tech: ['tech', 'education', 'teach', 'learn', 'course', 'code', 'engineer', 'software', 'developer'],
    music: ['music', 'song', 'artist', 'spotify', 'rapper', 'producer', 'soundcloud', 'pop'], indie: ['indie', 'hacker', 'build', 'saas', 'founder', 'ship', 'startup'],
    art: ['art', 'artist', 'illustrat', 'draw', 'design', 'visual'], gaming: ['gaming', 'game', 'stream', 'twitch', 'esports'],
    cooking: ['cook', 'recipe', 'food', 'chef', 'eat', 'kitchen'], writing: ['writ', 'essay', 'substack', 'newsletter', 'blog', 'author'],
    video: ['film', 'video', 'documentary', 'cinema', 'director'], lifestyle: ['lifestyle', 'fitness', 'gym', 'workout', 'wellness']
  };
  function rankCreators(q) {
    q = q.toLowerCase();
    const wantSmall = /under|small|<|less than|tiny|early|day zero|nano|micro/.test(q);
    const wantRetention = /retention|loyal|sticky|return|completion|engaged/.test(q);
    const wantStudent = /student|college|university|campus/.test(q);
    return B.creators.map(c => {
      let score = 0;
      for (const [cat, words] of Object.entries(SYN)) if (c.cat === cat) words.forEach(w => { if (q.includes(w)) score += 3; });
      if (q.includes(c.name.toLowerCase()) || q.includes(c.handle.replace('@', ''))) score += 5;
      if (wantSmall && c.followers < 50000) score += 2;
      if (wantRetention) score += c.retention.idx / 40;
      if (wantStudent && (c.cat === 'tech' || c.cat === 'ai')) score += 1;
      score += c.auth / 100;
      return { c, score };
    }).sort((x, y) => y.score - x.score);
  }
  function renderSearch(query) {
    // Multi-platform PRD engine (js/search-engine.js) owns this view when present
    if (window.BackerSearch) { window.BackerSearch.render(app, query); return; }
    app.innerHTML = `
      <div class="search-view">
        <div class="search-hero"><h1>AI Search Agent</h1><p>Describe the kind of creator you want to back. The agent traverses public data across platforms and ranks by authenticity and trajectory.</p></div>
        <form class="big-search" id="searchForm">
          <svg viewBox="0 0 24 24" class="ic" style="width:20px;height:20px"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input id="searchInput" placeholder="e.g. fitness creators under 5K, posting 3× a week, retention-heavy, ideally students" value="${(query || '').replace(/"/g, '&quot;')}"/>
          <button class="send" type="submit" aria-label="Search"><svg viewBox="0 0 24 24" class="ic"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
        <div class="search-ex">
          <button class="chip" data-ex="AI researchers under 10K with very loyal audiences">AI researchers · loyal</button>
          <button class="chip" data-ex="indie hackers shipping weekly with paying audiences">indie hackers · paying</button>
          <button class="chip" data-ex="undiscovered music artists about to break out">music · pre-breakout</button>
          <button class="chip" data-ex="show me a creator with fake followers">expose a fake</button>
        </div>
        <div id="searchOut"></div>
      </div>`;
    const form = $('#searchForm'), input = $('#searchInput');
    form.addEventListener('submit', e => { e.preventDefault(); runAgent(input.value.trim()); });
    $$('.search-ex .chip', app).forEach(ch => ch.addEventListener('click', () => { input.value = ch.dataset.ex; runAgent(ch.dataset.ex); }));
    if (query) runAgent(query);
  }
  function runAgent(q) {
    if (!q) return;
    const out = $('#searchOut');
    const steps = [
      'Parsing intent and constraints…',
      'Traversing public data across YouTube, TikTok, Spotify, Substack…',
      'Running Proof of Attention — authenticity, retention, velocity…',
      'Ranking candidates by adjusted trajectory…'
    ];
    out.innerHTML = `<div class="agent-log">${steps.map((s, i) => `<div class="agent-step" style="animation-delay:${i * 0.5}s"><span class="${i < steps.length - 1 ? 'spin' : 'ic-check'}"></span>${s}</div>`).join('')}</div>`;
    const stepEls = $$('.agent-step', out);
    stepEls.forEach((el, i) => setTimeout(() => {
      const sp = el.querySelector('.spin, .ic-check');
      if (sp) sp.outerHTML = '<svg viewBox="0 0 24 24" class="ic" style="width:16px;height:16px;color:var(--pos)"><path d="M20 6 9 17l-5-5"/></svg>';
    }, (i + 1) * 500));
    setTimeout(() => {
      const ranked = rankCreators(q).slice(0, 6).map(r => r.c);
      out.insertAdjacentHTML('beforeend', `<div class="results-head"><svg viewBox="0 0 24 24" class="ic" style="width:15px;height:15px;color:var(--accent)"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg> ${ranked.length} candidates ranked by authenticity & trajectory</div><div class="creator-grid">${ranked.map(card).join('')}</div>`);
      mountCovers(out);
    }, steps.length * 500 + 350);
  }

  /* ---------------- modal + toast ---------------- */
  const modalRoot = $('#modalRoot');
  function openModal(html) {
    modalRoot.innerHTML = `<div class="modal">${html}</div>`;
    modalRoot.classList.remove('hidden'); modalRoot.setAttribute('aria-hidden', 'false');
  }
  function closeModal() { modalRoot.classList.add('hidden'); modalRoot.setAttribute('aria-hidden', 'true'); modalRoot.innerHTML = ''; }
  modalRoot.addEventListener('click', e => { if (e.target === modalRoot) closeModal(); });

  const toastEl = $('#toast'); let toastT;
  function toast(msg, kind) {
    toastEl.innerHTML = `<svg viewBox="0 0 24 24" class="ic" style="color:${kind === 'warn' ? 'var(--warn)' : 'var(--pos)'}">${kind === 'warn' ? '<path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' : '<path d="M20 6 9 17l-5-5"/>'}</svg>${msg}`;
    toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  window.__backerToast = toast;

  /* ---------------- global click delegation ---------------- */
  document.addEventListener('click', e => {
    const t = e.target;
    const close = t.closest('[data-close]');
    const confirmBtn = t.closest('[data-confirm]');
    const backBtn = t.closest('[data-back-creator]');
    const creatorEl = t.closest('[data-creator]');
    const viewEl = t.closest('[data-view]');
    const navHome = t.closest('[data-nav="home"]');
    const scrollEl = t.closest('[data-scroll]');
    const filterEl = t.closest('[data-filter]');
    const portMode = t.closest('[data-port-mode]');
    const raiseSubmit = t.closest('[data-raise-submit]');
    const shareEl = t.closest('[data-share]');

    if (confirmBtn) { const c = B.byId(confirmBtn.dataset.confirm); const amt = parseFloat(confirmBtn.dataset.amt); addPosition(c.id, amt); showSuccess(c, amt); toast(`Position opened in ${c.name.split(' ')[0]}`); return; }
    if (raiseSubmit) { closeModal(); toast('Application received — we’ll be in touch'); return; }
    if (backBtn) { openInvestModal(B.byId(backBtn.dataset.backCreator)); return; }
    if (shareEl) { toast('Share link copied to clipboard'); try { navigator.clipboard && navigator.clipboard.writeText(location.href); } catch (x) {} return; }

    if (close && viewEl) { closeModal(); go(viewEl.dataset.view); return; }
    if (close) { closeModal(); return; }

    if (filterEl) { activeFilter = filterEl.dataset.filter; renderMarket(); return; }
    if (portMode) { renderPortfolio(portMode.dataset.portMode); return; }
    if (navHome) { e.preventDefault(); go('home'); return; }
    if (creatorEl && !viewEl) { go('creator', creatorEl.dataset.creator); return; }
    if (viewEl) { e.preventDefault(); go(viewEl.dataset.view); return; }
    if (scrollEl) { e.preventDefault(); const tgt = document.getElementById(scrollEl.dataset.scroll); if (tgt) tgt.scrollIntoView({ behavior: 'smooth' }); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalRoot.classList.contains('hidden')) closeModal(); });

  /* ---------------- hero search + pills ---------------- */
  function initHero() {
    const f = $('#heroSearch'), i = $('#heroSearchInput');
    if (f) f.addEventListener('submit', e => { e.preventDefault(); go('search', i.value.trim() || 'high-retention creators about to break out'); });
    $$('#heroPills .pill').forEach(p => p.addEventListener('click', () => go('search', p.dataset.q)));
  }

  /* ---------------- marketing injections ---------------- */
  function initInjections() {
    const sg = $('#scoreGrid');
    if (sg) sg.innerHTML = B.scoreDefs.map(s => `
      <div class="score-card reveal">
        <div class="score-top"><div class="score-name">${s.name}</div><div class="score-ic"><svg viewBox="0 0 24 24" class="ic">${s.ic}</svg></div></div>
        <div class="score-val">${s.val}</div>
        <div class="score-desc">${s.desc}</div>
        <div class="score-meter ${s.pos ? 'pos' : ''}"><i style="width:${s.meter}%"></i></div>
      </div>`).join('');
    const ls = $('#logoStrip');
    if (ls) ls.innerHTML = B.partners.map(p => `
      <div class="logo-card reveal">${p.svg}<div class="logo-role">${p.role}</div><div class="logo-badge">${p.badge}</div></div>`).join('');
  }

  /* ---------------- nav scroll state + reveal ---------------- */
  function initNav() {
    const nav = $('#nav');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    const obs = () => $$('#site .reveal:not(.in)').forEach(el => io.observe(el));
    obs(); setTimeout(obs, 100);
  }
  function initTyped() {
    $$('.typed').forEach(el => {
      const full = el.dataset.typed; let i = 0;
      const io = new IntersectionObserver((ents) => {
        if (ents[0].isIntersecting) {
          io.disconnect();
          const tick = () => { el.textContent = full.slice(0, i++); if (i <= full.length) setTimeout(tick, 38); };
          tick();
        }
      }, { threshold: 0.6 });
      io.observe(el);
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    getPortfolio(); // seed
    initNav();
    initReveal();
    initInjections();
    initHero();
    initTyped();
    $('.dock-home').classList.add('active');
    // deep-link from portfolio.html dock (e.g. index.html?view=market)
    // and shareable marketplace state links (#market?window=…&genre=…)
    try {
      var dl = new URLSearchParams(location.search).get('view');
      if (dl && (dl === 'market' || dl === 'search')) go(dl);
      else if (/^#market/.test(location.hash)) go('market');
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
