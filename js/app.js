(function(){"use strict";let o=window.BACKER||null;const d=(t,e=document)=>e.querySelector(t),k=(t,e=document)=>Array.from(e.querySelectorAll(t)),v=d("#app");let S=null,T=null,E=null,P=null,A=null,_=!1,D=0,C="home";window.__backerLegacyArchiveAllowed=!0;function O(){return o||window.BACKER?(o=window.BACKER,Promise.resolve(o)):(A||(A=new Promise((t,e)=>{const s=document.createElement("script");s.src="js/data.js?v=20260821-lazy-1",s.dataset.backerLegacyData="true",s.onload=()=>{o=window.BACKER||null,o?t(o):e(new Error("Legacy homepage data did not initialize"))},s.onerror=()=>e(new Error("Legacy homepage data unavailable")),document.head.appendChild(s)}).catch(t=>{throw document.querySelectorAll("script[data-backer-legacy-data]").forEach(e=>e.remove()),A=null,t})),A)}async function z(){_||(await O(),I(),Le(),_=!0)}function te(){const t=document.querySelector("link[data-backer-trades]");return t&&t.dataset.backerStyleReady==="true"?Promise.resolve():(t&&t.remove(),new Promise((e,s)=>{const a=document.createElement("link");a.rel="stylesheet",a.href="css/market.css?v=20260831-trades-news-2",a.dataset.backerTrades="true",a.media="print",a.onload=()=>{a.dataset.backerStyleReady="true",a.media="all",a.disabled=C!=="trades",e()},a.onerror=()=>s(new Error("Trades stylesheet unavailable")),document.head.appendChild(a)}))}function ae(){const t=document.querySelector("link[data-backer-legacy-market]");return t&&t.dataset.backerStyleReady==="true"?Promise.resolve():(t&&t.remove(),new Promise((e,s)=>{const a=document.createElement("link");a.rel="stylesheet",a.href="css/market-archive.css?v=20260822-1",a.dataset.backerLegacyMarket="true",a.media="print",a.onload=()=>{a.dataset.backerStyleReady="true",a.media="all",a.disabled=C!=="market-archive",e()},a.onerror=()=>s(new Error("Legacy market archive stylesheet unavailable")),document.head.appendChild(a)}))}function R(t,e){return e==="catalog"&&window.BackerTradeCatalog||e==="store"&&window.BackerMarketDraftStore||e==="view"&&window.BackerMarket?Promise.resolve():new Promise((s,a)=>{const i=document.createElement("script");i.src=t,i.dataset.backerTrades=e,i.onload=s,i.onerror=()=>a(new Error("Trades script unavailable: "+t)),document.head.appendChild(i)})}function F(t,e){return e==="data"&&window.BACKER_MKT||e==="view"&&window.BackerLegacyMarket?Promise.resolve():new Promise((s,a)=>{const i=document.createElement("script");i.src=t,i.dataset.backerLegacyMarket=e,i.onload=s,i.onerror=()=>a(new Error("Legacy market archive script unavailable: "+t)),document.head.appendChild(i)})}function se(){if(!S){const t=Promise.all([R("js/market-draft-store.js?v=20260821-1","store"),R("js/trades-catalog-model.js?v=20260826-perf-1","catalog")]);S=Promise.all([te(),t]).then(()=>R("js/market.js?v=20260831-trades-news-2","view")).then(()=>{T=null}).catch(e=>{throw document.querySelectorAll('link[data-backer-trades]:not([data-backer-style-ready="true"])').forEach(s=>s.remove()),document.querySelectorAll("script[data-backer-trades]").forEach(s=>s.remove()),S=null,e})}return S}function ie(){return E||(E=O().then(()=>ae()).then(()=>F("js/market-data.js?v=3","data")).then(()=>F("js/market-archive.js?v=20260822-1","view")).then(()=>{P=null}).catch(t=>{throw document.querySelectorAll('link[data-backer-legacy-market]:not([data-backer-style-ready="true"])').forEach(e=>e.remove()),document.querySelectorAll("script[data-backer-legacy-market]").forEach(e=>e.remove()),E=null,t})),E}function re(t){var e=document.querySelector("link[data-backer-trades]"),s=document.querySelector("link[data-backer-legacy-market]");e&&e.dataset.backerStyleReady==="true"&&(e.disabled=t!=="trades"),s&&s.dataset.backerStyleReady==="true"&&(s.disabled=t!=="market-archive")}function G(t,e){try{window.BackerAnalytics&&window.BackerAnalytics.virtualPageView(t,e)}catch{}}function $(t,e){try{window.BackerAnalytics&&window.BackerAnalytics.track(t,e||{})}catch{}}function j(t){return t.split(" ").slice(0,2).map(e=>e[0]).join("").toUpperCase()}function B(t){return`radial-gradient(circle at 32% 26%, hsl(${t} 75% 64%), hsl(${t+28} 58% 34%) 62%, hsl(${t+10} 40% 16%))`}function N(t){return t>=80?{bg:"rgba(134,227,184,.92)",fg:"#0a1f15",word:"real"}:t>=60?{bg:"rgba(243,180,78,.92)",fg:"#241600",word:"mixed"}:{bg:"rgba(255,111,107,.95)",fg:"#2a0808",word:"flagged"}}function oe(t){return t==="ok"?"#56d39a":t==="warn"?"#f3b44e":"#ff6f6b"}function ne(t,e,s){const a=d(".search-ex",t),i=d(".search-ex-toggle",t);a&&(a.addEventListener("click",r=>{const n=r.target.closest("[data-ex]");!n||!a.contains(n)||(e.value=n.dataset.ex,$("search_submitted",{source:"suggestion"}),s(n.dataset.ex))}),i&&i.addEventListener("click",()=>{const r=a.classList.toggle("is-paused");i.setAttribute("aria-pressed",String(r)),i.setAttribute("aria-label",r?"Resume scrolling suggestions":"Pause scrolling suggestions"),i.querySelector("span").textContent=r?"▶":"Ⅱ"}))}window.__backerBindPromptMarquee=ne;function ce(t){const e=t.getContext("2d"),s=t.width,a=t.height,i=+t.dataset.hue,r=e.createLinearGradient(0,0,s,a);r.addColorStop(0,`hsl(${i} 40% 11%)`),r.addColorStop(1,`hsl(${i+22} 32% 5%)`),e.fillStyle=r,e.fillRect(0,0,s,a);const n=e.createRadialGradient(s*.5,a*.08,0,s*.5,a*.08,a*1.25);n.addColorStop(0,`hsla(${i}, 82%, 60%, .34)`),n.addColorStop(1,"transparent"),e.fillStyle=n,e.fillRect(0,0,s,a),e.globalCompositeOperation="lighter";for(let c=0;c<64;c++){const l=Math.random()*s,f=1-Math.abs(l/s-.5)*2,p=a*(.3+Math.random()*.7),g=(a-p)*Math.random(),b=.6+Math.random()*1.9,m=Math.random()<.18?`hsl(${i+170} 55% 72%)`:`hsl(${i} 72% ${60+Math.random()*24}%)`,u=e.createLinearGradient(0,g,0,g+p);u.addColorStop(0,"transparent"),u.addColorStop(.5,m),u.addColorStop(1,"transparent"),e.globalAlpha=(.02+f*.13)*(.4+Math.random()),e.fillStyle=u,e.fillRect(l,g,b,p)}e.globalAlpha=1,e.globalCompositeOperation="source-over"}function le(t){k(".cover-canvas",t).forEach(e=>{e.dataset.drawn||(ce(e),e.dataset.drawn="1")})}function de(t,e,s,a){const i=Math.min(...t),r=Math.max(...t),n=r-i||1,c=t.map((p,g)=>[a+g*(e-2*a)/(t.length-1),s-a-(p-i)/n*(s-2*a)]);let l=`M${c[0][0]},${c[0][1]}`;for(let p=1;p<c.length;p++){const[g,b]=c[p-1],[m,u]=c[p],ee=(g+m)/2;l+=` C${ee},${b} ${ee},${u} ${m},${u}`}const f=`${l} L${c[c.length-1][0]},${s-a} L${c[0][0]},${s-a} Z`;return{line:l,area:f,last:c[c.length-1]}}function V(t,e){const r="g"+Math.random().toString(36).slice(2,7),{line:n,area:c,last:l}=de(t,640,200,16);return`<svg viewBox="0 0 640 200" preserveAspectRatio="none" style="width:100%;height:200px;display:block">
      <defs><linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${e}" stop-opacity=".28"/><stop offset="1" stop-color="${e}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${c}" fill="url(#${r})"/>
      <path d="${n}" fill="none" stroke="${e}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${l[0]}" cy="${l[1]}" r="4.5" fill="${e}"/>
      <circle cx="${l[0]}" cy="${l[1]}" r="9" fill="${e}" opacity=".22"/>
    </svg>`}function ue(t,e){const a=2*Math.PI*52,i=a*(1-t/100),r="r"+Math.random().toString(36).slice(2,7);return`<svg viewBox="0 0 120 120" width="118" height="118">
      <defs><linearGradient id="${r}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${e}" stop-opacity=".72"/>
      </linearGradient></defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="11"/>
      <circle class="ring-fill" cx="60" cy="60" r="52" fill="none" stroke="url(#${r})" stroke-width="11"
        stroke-linecap="round" stroke-dasharray="${a}" stroke-dashoffset="${a}" data-off="${i}"
        style="filter:drop-shadow(0 0 6px ${e})"/>
    </svg>`}const K="backer_portfolio_v1";function I(){try{const e=localStorage.getItem(K);if(e)return JSON.parse(e)}catch{}const t=o.seedPortfolio.slice();return U(t),t}function U(t){try{localStorage.setItem(K,JSON.stringify(t))}catch{}}function Y(t){if(t.value!=null)return t.value;const e=o.byId(t.id);if(!e)return t.invested;const s=1+Math.max(-.25,Math.min(.6,(e.auth-70)/300+e.growth/900));return t.invested*s}function ve(t,e){const s=I(),a=s.find(i=>i.id===t&&!i.value);a?a.invested+=e:s.push({id:t,invested:e,when:"Jun 2026"}),U(s)}function he(){const t=I();let e=0,s=0,a=0;t.forEach(c=>{e+=c.invested,s+=Y(c);const l=o.byId(c.id);a+=l?l.auth:70});const i=e?(s-e)/e*100:0,r=i>=15?"A+":i>=8?"A":i>=3?"B+":i>=0?"B":"C",n=i>=15?7:i>=8?14:i>=3?28:45;return{p:t,inv:e,val:s,ret:i,grade:r,pctile:n,count:t.length}}function Be(t){const e=o.fundPct(t),s=N(t.auth);return`<article class="ccard" data-creator="${t.id}">
      <div class="ccard-cover">
        <canvas class="cover-canvas" data-hue="${t.hue}" width="600" height="280"></canvas>
        <span class="ccard-auth" style="background:${s.bg};color:${s.fg}">${t.auth}% ${s.word}</span>
        <span class="ccard-cat">${t.category}</span>
      </div>
      <div class="ccard-body">
        <div class="ccard-id">
          <span class="ccard-avatar" style="background:${B(t.hue)};display:grid;place-items:center;font-weight:700;font-size:14px;color:hsl(${t.hue} 60% 14%)">${j(t.name)}</span>
          <div><div class="ccard-name">${t.name}</div><div class="ccard-handle">${t.handle}</div></div>
        </div>
        <div class="ccard-stats">
          <div class="cstat"><div class="cstat-label">Followers</div><div class="cstat-val">${o.fmt(t.followers)}</div></div>
          <div class="cstat"><div class="cstat-label">Monthly views</div><div class="cstat-val">${o.fmt(t.monthlyViews)}</div></div>
          <div class="cstat"><div class="cstat-label">Growth</div><div class="cstat-val ${t.growth>0?"pos":""}">+${t.growth}%</div></div>
        </div>
        <div class="ccard-fund">
          <div class="fund-row"><span>Raised <b>${o.money(t.raised)}</b> / ${o.money(t.goal)}</span><span>up to <b>${t.milestone.mult}×</b></span></div>
          <div class="fund-bar"><i style="width:${e}%"></i></div>
        </div>
      </div>
    </article>`}const x=d("#dock");function w(t){x&&k(".dock-btn",x).forEach(e=>e.classList.toggle("active",e.dataset.view===t)),document.dispatchEvent(new CustomEvent("backer:routechange",{detail:{view:t}})),window.BackerDock&&typeof window.BackerDock.refresh=="function"&&window.BackerDock.refresh()}async function h(t,e){t==="market"&&(t="trades");const s=++D;let a=null;if(t==="trades")try{await se()}catch(r){T=r}if(t==="market-archive")try{await ie()}catch(r){P=r}if(t==="home"||t==="creator")try{await z()}catch(r){a=r}if(s===D){if(document.dispatchEvent(new CustomEvent("backer:routewillchange",{detail:{view:t}})),C=t,re(t),t==="portfolio"){window.location.href="portfolio.html";return}if(t==="home"){if(a&&console.error(a),document.body.classList.remove("body-app","mkt-full","mkt2-full","search-full"),v.classList.add("hidden"),v.setAttribute("aria-hidden","true"),x){k(".dock-btn",x).forEach(r=>r.classList.remove("active"));var i=d(".dock-home",x);i&&i.classList.add("active")}try{history.replaceState(null,"",location.pathname)}catch{}window.scrollTo({top:0,behavior:"instant"}),G("home"),w("home");return}if(document.body.classList.add("body-app"),document.body.classList.toggle("mkt-full",t==="trades"||t==="market-archive"||t==="market2"),document.body.classList.toggle("mkt2-full",t==="market2"),document.body.classList.toggle("search-full",t==="search"),v.classList.remove("hidden"),v.setAttribute("aria-hidden","false"),window.scrollTo({top:0,behavior:"instant"}),t==="creator"&&a){v.innerHTML='<div class="mkt-fatal" role="alert"><b>This profile could not load.</b><span>Refresh to retry the legacy profile data.</span></div>';return}t==="market2"?(pe(),w("market2")):t==="trades"?(J(),w("trades")):t==="market-archive"?(me(),w("trades")):t==="creator"?(fe(e),w("market2")):t==="portfolio"?(W("investor"),w("portfolio")):t==="search"&&(xe(e||""),w("search")),G(t==="market-archive"?"market":t,e)}}window.__backerGo=h;function pe(){if(window.BackerMarket2&&typeof window.BackerMarket2.render=="function"){try{if(!/^#market2(?:\?|$)/.test(location.hash)||new URLSearchParams(location.search).get("view")==="market"){var t=new URLSearchParams(location.search);t.delete("view"),history.replaceState(null,"",location.pathname+(t.toString()?"?"+t.toString():"")+"#market2")}}catch{}window.BackerMarket2.render(v);return}v.innerHTML='<div class="m2-fatal" role="alert"><b>Discovery could not load.</b><span>The creator discovery module did not initialize. Refresh this page to try again.</span></div>'}function J(){if(window.BackerMarket){window.BackerMarket.render(v);return}v.innerHTML='<div class="mkt-fatal" role="alert"><b>Trades could not load.</b><span>'+(T?"Refresh to retry the retained catalog, paper quotes, and your device-local proposals.":"The Trades module did not initialize.")+'</span><a href="backerdemo.html#market2">Return to Discovery</a></div>'}function me(){if(window.BackerLegacyMarket&&typeof window.BackerLegacyMarket.render=="function"){window.BackerLegacyMarket.render(v);var t=v.querySelector(".mkt");t&&(t.dataset.marketSurface="archive");return}v.innerHTML='<div class="mkt-fatal" role="alert"><b>The archived demo market could not load.</b><span>'+(P?"Refresh to retry the preserved fixture board.":"The preserved market module did not initialize.")+'</span><a href="backerdemo.html#trades">Open Trades</a></div>'}function fe(t){const e=o.byId(t);if(!e)return J();const s=oe(e.velocity.status),a=e.auth>=80?"#56d39a":e.auth>=60?"#f3b44e":"#ff6f6b",i=N(e.auth),r=["Dec","Jan","Feb","Mar","Apr","May","Jun"],n=e.mkt?e.mkt.state:"OPEN",c=window.BACKER_MKT&&window.BACKER_MKT.STATES[n]||{label:"Open"},l=n==="OPEN"&&!!e.milestone,f=!!e.milestone&&["OPEN","OPENING_SOON","CLOSED","RESOLVED"].includes(n),p=e.milestone?e.milestone.money?o.money(e.milestone.target):o.fmt(e.milestone.target):"",g=e.milestone?e.milestone.money?o.money(e.milestone.current):o.fmt(e.milestone.current):"",b=e.milestone?Math.min(100,Math.round(e.milestone.current/e.milestone.target*100)):0,m=e.flagged?`<div class="metric" style="grid-column:1/-1;border-color:${e.flagged==="neg"?"rgba(255,111,107,.4)":"rgba(243,180,78,.4)"};background:${e.flagged==="neg"?"rgba(255,111,107,.07)":"rgba(243,180,78,.06)"}">
        <div class="metric-label" style="color:${e.flagged==="neg"?"#ff6f6b":"#f3b44e"}"><svg viewBox="0 0 24 24" class="ic" style="width:14px;height:14px"><path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg> Backer caution flag</div>
        <div class="metric-sub" style="font-size:13px;margin-top:8px;color:var(--ink)">${e.flagged==="neg"?"This profile shows strong signatures of purchased engagement. We surface it on purpose — to show the protocol working. Read the AI assessment before considering a position.":"Audience quality is mixed and velocity is elevated. The headline growth is likely inflated. Adjust your expectations accordingly."}</div>
      </div>`:"";v.innerHTML=`
      <a class="back-link" data-view="market2"><svg viewBox="0 0 24 24" class="ic"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Back to marketplace</a>
      <div class="detail">
        <div class="detail-main">
          <div class="dhero">
            <div class="dhero-cover"><canvas class="cover-canvas" data-hue="${e.hue}" width="900" height="340"></canvas><div class="dhero-grad"></div></div>
            <div class="dhero-body">
              <span class="dhero-avatar" style="background:${B(e.hue)};display:grid;place-items:center;font-weight:700;font-size:30px;color:hsl(${e.hue} 60% 14%)">${j(e.name)}</span>
              <div class="dhero-meta">
                <h1>${e.name}</h1><div class="handle">${e.handle}</div>
                <div class="dhero-tags"><span class="dtag">${e.category}</span><span class="dtag">Growth +${e.growth}% MoM</span><span class="dtag" style="color:${i.bg};border-color:${i.bg}">${e.mkt?"PoA "+e.mkt.poa.score+" · "+e.mkt.evidence.grade+" evidence":e.auth+"% authentic"}</span>${e.mkt?`<span class="dtag">${c.label}</span>`:""}</div>
              </div>
              <div class="dhero-actions"><button class="btn btn-ghost" data-share>Share</button></div>
            </div>
            <div class="platforms">${e.platforms.map(u=>`<div class="plat"><svg viewBox="0 0 24 24" class="ic">${o.PLAT_IC[u[0]]||""}</svg><b>${u[2]}</b><span>${u[1]}</span></div>`).join("")}</div>
          </div>

          <div class="score-block">
            <div class="score-block-head"><h3>Proof of Attention — underwriting</h3><span class="verified"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg> Open protocol · re-scored daily</span></div>
            <div class="auth-hero">
              <div class="ring">${ue(e.auth,a)}<div class="ring-label"><b>${e.auth}%</b><span>authentic</span></div></div>
              <div class="auth-copy"><h4>${e.auth>=80?"A genuinely human audience":e.auth>=60?"Partly inflated audience":"Largely fabricated audience"}</h4><p>${e.blurb}</p></div>
            </div>
            <div class="metric-grid">
              <div class="metric"><div class="metric-label">Retention Index</div><div class="metric-val ${e.retention.idx>=75?"pos":e.retention.idx>=45?"warn":"neg"}">${e.retention.label}</div><div class="metric-sub">${e.retention.idx}/100 cohort loyalty</div></div>
              <div class="metric"><div class="metric-label">Engagement Quality</div><div class="metric-val ${e.engQ.score>=78?"pos":e.engQ.score>=55?"warn":"neg"}">${e.engQ.grade}</div><div class="metric-sub">${e.engQ.score}/100 active community</div></div>
              <div class="metric"><div class="metric-label">Velocity Flag</div><div class="metric-val ${e.velocity.status==="ok"?"pos":e.velocity.status==="warn"?"warn":"neg"}">${e.velocity.label}</div><div class="metric-sub">${e.velocity.status==="ok"?"organic growth pattern":"unnatural spike detected"}</div></div>
              <div class="metric"><div class="metric-label">Monetization Propensity</div><div class="metric-val">${e.monetization}%</div><div class="metric-sub">likely to convert to paying</div></div>
              ${m}
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-head"><h3>Growth Trajectory</h3><span class="badge-pos" style="color:${s};background:${s}22"><svg viewBox="0 0 24 24" class="ic"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg> +${e.growth}% MoM${e.velocity.status!=="ok"?" · adj.":""}</span></div>
            ${V(e.traj,s)}
            <div class="chart-x">${r.map(u=>`<span>${u}</span>`).join("")}</div>
          </div>

          ${f?`<div class="terms">
            <h3>Milestone terms${n!=="OPEN"?` · ${c.label}`:""}</h3>
            <div class="term-row">
              <div class="term-ic"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg></div>
              <div class="term-info"><b>Reach ${p} ${e.milestone.metric} in ${e.milestone.deadline}</b><p>Currently ${g} · ${b}% of the way there</p>
                <div class="term-prog"><div class="fund-bar"><i style="width:${b}%"></i></div></div>
              </div>
              <div class="term-mult">${e.milestone.mult}×</div>
            </div>
            <p class="metric-sub" style="margin-top:6px">If the milestone is met by the deadline, early backers receive ${e.milestone.mult}× their simulated stake. If it isn't, the simulated stake is lost. Simulated positions — no real money moves.</p>
          </div>`:`<div class="terms">
            <h3>Market state — ${c.label}</h3>
            <p class="metric-sub">No approved milestone contract exists for this creator. Backer tracks the attention and underwriting evidence above; contract terms are never synthesized. Watch this creator to be notified if a contract opens.</p>
          </div>`}
        </div>

        <aside class="aside">
          ${l?`<div class="invest">
            <h3>Back ${e.name.split(" ")[0]}</h3>
            <p class="sub">Take a simulated position from $1. You're betting on the milestone above.</p>
            <div class="amount"><span class="cur">$</span><input id="investAmt" type="number" min="1" value="25" inputmode="numeric"/></div>
            <div class="quick"><button data-quick="5">$5</button><button data-quick="25">$25</button><button data-quick="100">$100</button><button data-quick="250">$250</button></div>
            <div class="proj">
              <div class="proj-row"><span>Payout multiple</span><b>${e.milestone.mult}×</b></div>
              <div class="proj-row"><span>If milestone hits</span><b class="pos" id="projPayout">$0</b></div>
              <div class="proj-row"><span>Potential profit</span><b class="pos" id="projProfit">$0</b></div>
              <div class="proj-row"><span>If it misses</span><b id="projLoss">-$0</b></div>
            </div>
            <button class="btn btn-accent" id="backBtn" data-back-creator="${e.id}">Back this creator</button>
            <p class="invest-foot">Simulated · no real money moves. Ceiling scales with PoA confidence and contract risk. Backing early creators can lose the full simulated stake.</p>
          </div>`:`<div class="invest">
            <h3>${c.label}</h3>
            <p class="sub">Position controls appear only for a valid open simulated milestone contract. Attention and underwriting evidence stay fully visible either way.</p>
            <button class="btn btn-ghost" data-view="market2" style="width:100%;justify-content:center">Back to the market</button>
          </div>`}

          <div class="ai-panel">
            <div class="ai-head"><span class="ai-orb"></span><div><b>Backer AI</b><span>Underwriting copilot</span></div></div>
            <div class="ai-body" id="aiBody"><div class="ai-msg bot">${e.ai.intro}</div></div>
            <div class="ai-suggest" id="aiSuggest">
              <button data-ai="catalysts">Growth catalysts</button>
              <button data-ai="risks">Biggest risks</button>
              <button data-ai="retention">Is the audience real?</button>
            </div>
            <form class="ai-input" id="aiForm"><input id="aiInput" placeholder="Ask about retention, risks, fit…" autocomplete="off"/><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" class="ic"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>
          </div>
        </aside>
      </div>`,le(v),requestAnimationFrame(()=>{const u=d(".ring-fill",v);u&&(u.style.strokeDashoffset=u.dataset.off)}),l&&ge(e),ye(e)}function ge(t){const e=d("#investAmt");function s(){let a=parseFloat(e.value)||0;a<0&&(a=0),d("#projPayout").textContent=o.money(a*t.milestone.mult),d("#projProfit").textContent="+"+o.money(a*(t.milestone.mult-1)),d("#projLoss").textContent="-"+o.money(a)}e.addEventListener("input",s),s(),k(".quick button",v).forEach(a=>a.addEventListener("click",()=>{e.value=a.dataset.quick,s()}))}function be(t,e){return e=e.toLowerCase(),/risk|danger|concern|downside|wrong/.test(e)?t.ai.risks:/real|bot|fake|authentic|trust|retention|loyal|come back|sticky/.test(e)?t.ai.retention:/grow|catalyst|upside|why|bull|potential|break/.test(e)?t.ai.catalysts:/compar|versus|vs|other|benchmark/.test(e)?`Against peers at the same stage, ${t.name.split(" ")[0]} sits in the <b>${t.auth>=85?"top decile":t.auth>=70?"upper half":"bottom quartile"}</b> on authenticity (${t.auth}%) and <b>${t.retention.idx>=80?"top decile":t.retention.idx>=55?"mid":"bottom"}</b> on retention. ${t.ai.catalysts}`:t.ai.intro}function ye(t){const e=d("#aiBody"),s=d("#aiForm"),a=d("#aiInput");function i(r){e.insertAdjacentHTML("beforeend",`<div class="ai-msg user">${r.replace(/</g,"&lt;")}</div>`);const n=document.createElement("div");n.className="ai-msg bot",n.innerHTML='<div class="ai-typing"><i></i><i></i><i></i></div>',e.appendChild(n),e.scrollTop=e.scrollHeight,setTimeout(()=>{n.innerHTML=be(t,r),e.scrollTop=e.scrollHeight},750)}k("#aiSuggest button",v).forEach(r=>r.addEventListener("click",()=>{i({catalysts:"What are the key growth catalysts?",risks:"What are the biggest risks here?",retention:"How real is this audience?"}[r.dataset.ai])})),s.addEventListener("submit",r=>{r.preventDefault();const n=a.value.trim();n&&(i(n),a.value="")})}function ke(t){const e=parseFloat(d("#investAmt")?d("#investAmt").value:25)||0;if(e<1){$("market_position_blocked",{creator_id:t.id,instrument:"milestone",reason:"below-minimum",source:"creator"}),L("Minimum stake is $1","warn");return}$("market_position_started",{creator_id:t.id,instrument:"milestone",source:"creator"});const s=e*t.milestone.mult,a=e*(t.milestone.mult-1),i=t.milestone.money?o.money(t.milestone.target):o.fmt(t.milestone.target);q(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic" style="background:rgba(244,171,99,.14);color:var(--accent)"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg></div>
      <h2>Confirm your backing</h2>
      <p>You're taking a <b style="color:var(--ink)">${o.money(e)}</b> position in ${t.name}.</p>
      <div class="modal-receipt">
        <div class="receipt-row"><span>Creator</span><b>${t.name} · ${t.handle}</b></div>
        <div class="receipt-row"><span>Your stake</span><b>${o.money(e)}</b></div>
        <div class="receipt-row"><span>Milestone</span><b>${i} in ${t.milestone.deadline}</b></div>
        <div class="receipt-row"><span>Payout if hit</span><b class="pos">${o.money(s)} (${t.milestone.mult}×)</b></div>
        <div class="receipt-row"><span>Potential profit</span><b class="pos">+${o.money(a)}</b></div>
      </div>
      <button class="btn btn-accent" data-confirm="${t.id}" data-amt="${e}">Confirm simulated position · ${o.money(e)}</button>
      <div class="modal-pay">Simulated · no real money moves</div>
    `)}function we(t,e){const s=e*t.milestone.mult;q(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic"><svg viewBox="0 0 24 24" class="ic"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h2>You're backing ${t.name.split(" ")[0]}.</h2>
      <p>Your ${o.money(e)} simulated position is recorded. You were here early — that's the whole point.</p>
      <div class="modal-receipt">
        <div class="receipt-row"><span>Position</span><b>${o.money(e)} in ${t.name}</b></div>
        <div class="receipt-row"><span>Pays out</span><b class="pos">${o.money(s)} if milestone hits</b></div>
        <div class="receipt-row"><span>Status</span><b>Simulated · no real money moves</b></div>
      </div>
      <button class="btn btn-primary" data-view="portfolio" data-close>View my portfolio</button>
      <button class="btn btn-ghost" data-close style="margin-top:10px">Keep exploring</button>
    `)}function W(t){const e=he(),s=`<div class="toggle"><button class="${t==="investor"?"active":""}" data-port-mode="investor">Investor</button><button class="${t==="creator"?"active":""}" data-port-mode="creator">Creator</button></div>`;if(t==="creator"){v.innerHTML=`
        <div class="app-head"><div><h1>Cooper</h1><p>@endurance</p></div>${s}</div>
        <div class="ipo">
          <div class="ipo-ic"><svg viewBox="0 0 24 24" class="ic"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
          <h2>Start your Personal IPO</h2>
          <p>Turn your audience into shareholders. Verify your profile, set milestone terms, and raise early capital from the people who believe in you most.</p>
          <button class="btn btn-accent btn-lg" id="applyRaise">Apply to raise</button>
        </div>`,d("#applyRaise").addEventListener("click",$e);return}const a=["Oct","Nov","Dec","Jan","Feb","Mar","Now"],i=e.inv*.9,r=e.val,n=[i,i*1.04,r*.82,r*.88,r*.9,r*.97,r],c=e.p.map(l=>{const f=o.byId(l.id);if(!f)return"";const p=Y(l),g=(p-l.invested)/l.invested*100,b=g>=0?"pos":"neg";return`<div class="holding" data-creator="${f.id}">
        <span class="holding-av" style="background:${B(f.hue)};display:grid;place-items:center;font-weight:700;font-size:13px;color:hsl(${f.hue} 60% 14%)">${j(f.name)}</span>
        <div class="holding-info"><b>${f.name}</b><span>${f.handle} · invested ${l.when}</span></div>
        <div class="holding-val"><b>${o.money(p)}</b><span class="${b}">${g>=0?"+":""}${g.toFixed(1)}%</span></div>
      </div>`}).join("");v.innerHTML=`
      <div class="app-head">
        <div style="display:flex;align-items:center;gap:16px">
          <span class="dhero-avatar" style="width:60px;height:60px;border-radius:16px;background:${B(210)};display:grid;place-items:center;font-weight:700;font-size:22px;color:hsl(210 60% 16%);border:none">C</span>
          <div><h1 style="font-size:30px">Cooper</h1><p style="margin-top:2px">@endurance · proof-of-taste portfolio</p></div>
        </div>${s}
      </div>
      <div class="port-stats">
        <div class="pcard"><div class="pcard-label">Total asset value</div><div class="pcard-val">${o.money(e.val)}</div><div class="pcard-sub">across ${e.count} position${e.count>1?"s":""}</div></div>
        <div class="pcard"><div class="pcard-label">Taste grade</div><div class="pcard-val grade">${e.grade}</div><div class="pcard-sub">Top ${e.pctile}% early believer</div></div>
        <div class="pcard"><div class="pcard-label">Total invested</div><div class="pcard-val">${o.money(e.inv)}</div><div class="pcard-sub">cost basis</div></div>
        <div class="pcard"><div class="pcard-label">Return</div><div class="pcard-val ${e.ret>=0?"pos":""}">${e.ret>=0?"+":""}${e.ret.toFixed(2)}%</div><div class="pcard-sub ${e.ret>=0?"pos":""}">${e.ret>=0?"▲":"▼"} unrealized</div></div>
      </div>
      <div class="port-low">
        <div class="chart-card"><div class="chart-head"><h3>Performance history</h3><span class="badge-pos">${e.ret>=0?"+":""}${e.ret.toFixed(1)}%</span></div>${V(n,"#56d39a")}<div class="chart-x">${a.map(l=>`<span>${l}</span>`).join("")}</div></div>
        <div>
          <div class="holdings">${c||'<div class="empty">No positions yet.</div>'}</div>
          <button class="btn btn-ghost" data-view="market2" style="width:100%;justify-content:center;margin-top:14px">Find more creators</button>
        </div>
      </div>`}function $e(){q(`
      <button class="modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" class="ic"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div class="modal-ic" style="background:rgba(244,171,99,.14);color:var(--accent)"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <h2>Apply to raise</h2>
      <p>Link your platforms — we run Proof of Attention and propose milestone terms within 48 hours.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin:20px 0">
        <input class="ai-input" style="all:unset;display:block;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--ink);font-size:14px" placeholder="Primary platform URL (e.g. youtube.com/@you)"/>
        <input style="all:unset;display:block;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--ink);font-size:14px" placeholder="Milestone you want to raise against"/>
      </div>
      <button class="btn btn-accent" data-raise-submit>Submit application</button>
    `)}function xe(t){if(window.BackerSearch&&typeof window.BackerSearch.render=="function"){window.BackerSearch.render(v,t);return}v.innerHTML=`
      <div class="search-view sx" data-search-state="asset-error">
        <div id="sxOut">
          <div class="sx-notice sx-notice-block" role="alert">
            <b>Backer AI Search could not load.</b>
            The retained Discovery search asset is unavailable. Refresh to retry. No fallback profiles, works, or metrics were substituted.
          </div>
        </div>
      </div>`}const y=d("#modalRoot");function q(t){y.innerHTML=`<div class="modal">${t}</div>`,y.classList.remove("hidden"),y.setAttribute("aria-hidden","false")}function M(){y.classList.add("hidden"),y.setAttribute("aria-hidden","true"),y.innerHTML=""}y.addEventListener("click",t=>{t.target===y&&M()});const H=d("#toast");let Q;function L(t,e){H.innerHTML=`<svg viewBox="0 0 24 24" class="ic" style="color:${e==="warn"?"var(--warn)":"var(--pos)"}">${e==="warn"?'<path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>':'<path d="M20 6 9 17l-5-5"/>'}</svg>${t}`,H.classList.add("show"),clearTimeout(Q),Q=setTimeout(()=>H.classList.remove("show"),2600)}window.__backerToast=L,document.addEventListener("click",t=>{const e=t.target,s=e.closest("[data-close]"),a=e.closest("[data-confirm]"),i=e.closest("[data-back-creator]"),r=e.closest("[data-creator]"),n=e.closest("[data-view]"),c=e.closest('[data-nav="home"]'),l=e.closest('#navLinks a[href^="#"]'),f=e.closest("[data-scroll]"),p=e.closest("[data-port-mode]"),g=e.closest("[data-raise-submit]"),b=e.closest("[data-share]");if(a){const m=o.byId(a.dataset.confirm),u=parseFloat(a.dataset.amt);ve(m.id,u),$("market_position_completed",{creator_id:m.id,instrument:"milestone",source:"creator"}),we(m,u),L(`Position opened in ${m.name.split(" ")[0]}`);return}if(g){M(),L("Application received — we’ll be in touch");return}if(i){ke(o.byId(i.dataset.backCreator));return}if(b){L("Share link copied to clipboard");try{navigator.clipboard&&navigator.clipboard.writeText(location.href)}catch{}return}if(s&&n){M(),h(n.dataset.view);return}if(s){M();return}if(p){W(p.dataset.portMode);return}if(l&&document.body.classList.contains("body-app")){t.preventDefault();const m=l.getAttribute("href").slice(1);h("home");try{history.replaceState(null,"",location.pathname+"#"+m)}catch{}requestAnimationFrame(()=>{const u=document.getElementById(m);u&&u.scrollIntoView({behavior:"smooth"})});return}if(c){t.preventDefault(),h("home");return}if(r&&!n){h("creator",r.dataset.creator);return}if(n){t.preventDefault(),h(n.dataset.view);return}if(f){t.preventDefault();const m=document.getElementById(f.dataset.scroll);m&&m.scrollIntoView({behavior:"smooth"});return}}),document.addEventListener("keydown",t=>{t.key==="Escape"&&!y.classList.contains("hidden")&&M()});function Me(){const t=d("#heroSearch"),e=d("#heroSearchInput");t&&t.addEventListener("submit",i=>{i.preventDefault(),h("search",e.value.trim()||"high-retention creators about to break out")});const s=d("#heroPills"),a=d("#heroPillsToggle");s&&s.addEventListener("click",i=>{const r=i.target.closest("[data-q]");r&&($("search_submitted",{source:"suggestion"}),h("search",r.dataset.q))}),s&&a&&a.addEventListener("click",()=>{const i=s.classList.toggle("is-paused");a.setAttribute("aria-pressed",String(i)),a.setAttribute("aria-label",i?"Resume scrolling suggestions":"Pause scrolling suggestions"),a.querySelector("span").textContent=i?"▶":"Ⅱ"})}function Le(){const t=d("#scoreGrid");t&&(t.innerHTML=o.scoreDefs.map(e=>`
      <div class="score-card reveal">
        <div class="score-top"><div class="score-name">${e.name}</div><div class="score-ic"><svg viewBox="0 0 24 24" class="ic">${e.ic}</svg></div></div>
        <div class="score-val">${e.val}</div>
        <div class="score-desc">${e.desc}</div>
        <div class="score-meter ${e.pos?"pos":""}"><i style="width:${e.meter}%"></i></div>
      </div>`).join(""))}function Se(){const t=d("#nav"),e=()=>t.classList.toggle("scrolled",window.scrollY>20);window.addEventListener("scroll",e,{passive:!0}),e()}function Ee(){const t=new IntersectionObserver(s=>{s.forEach(a=>{a.isIntersecting&&(a.target.classList.add("in"),t.unobserve(a.target))})},{threshold:.12,rootMargin:"0px 0px -40px 0px"}),e=()=>k("#site .reveal:not(.in)").forEach(s=>t.observe(s));e(),setTimeout(e,100)}function Ae(){k(".typed").forEach(t=>{const e=t.dataset.typed;let s=0;const a=new IntersectionObserver(i=>{if(i[0].isIntersecting){a.disconnect();const r=()=>{t.textContent=e.slice(0,s++),s<=e.length&&setTimeout(r,38)};r()}},{threshold:.6});a.observe(t)})}function Z(){var t=new URLSearchParams(location.search).get("view");if(t==="market"||t==="trades")return h("trades"),!0;if(t==="market-archive")return h("market-archive"),!0;if(t==="market2")return h("market2"),!0;if(t==="search")return h("search",new URLSearchParams(location.search).get("q")||""),!0;if(/^#search(?:\?|$)/.test(location.hash)){var e=location.hash.indexOf("?"),s=new URLSearchParams(e>=0?location.hash.slice(e+1):"");return h("search",s.get("q")||""),!0}if(/^#market2(?:\?|$)/.test(location.hash)){var a=location.hash.indexOf("?"),i=new URLSearchParams(a>=0?location.hash.slice(a+1):"");if(i.get("focus")==="search")return h("search",i.get("q")||""),!0}return/^#trades(?:\?|$)/.test(location.hash)?(h("trades"),!0):/^#market2(?:\?|$)/.test(location.hash)?(h("market2"),!0):/^#market-archive(?:\?|$)/.test(location.hash)?(h("market-archive"),!0):/^#market(?:\?|$)/.test(location.hash)?(h("trades"),!0):!1}function X(){Se(),Ee(),Me(),Ae();var t=d(".dock-home");t&&t.classList.add("active");try{Z()||z().catch(e=>console.error(e))}catch{}}window.addEventListener("hashchange",()=>{try{Z()}catch{}}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",X):X()})();
