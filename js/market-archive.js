window.BackerLegacyMarket=(function(){"use strict";const h=window.BACKER,d=window.BACKER_MKT,u=(t,e=document)=>e.querySelector(t),J=(t,e=document)=>Array.from(e.querySelectorAll(t)),m=t=>String(t).replace(/</g,"&lt;");function w(t,e){try{window.BackerAnalytics&&window.BackerAnalytics.track(t,e||{})}catch{}}const a={view:"markets",browse:null,window:d.DEFAULT_WINDOW,genre:null,platforms:[],scale:[],poa:[],multiple:[],evidence:"all",risk:"all",quickOpen:!0,ending:!1,u100:!1,sort:"pulse",shown:12,featIdx:0};let v=null,E=null;const x={},Q="backer_watchlist_v1",X="backer_portfolio_v1";function Z(){try{return new Set(JSON.parse(localStorage.getItem(Q)||"[]"))}catch{return new Set}}function wt(t){try{localStorage.setItem(Q,JSON.stringify([...t]))}catch{}}let P=Z();function tt(){try{return JSON.parse(localStorage.getItem(X)||"[]")}catch{return[]}}function M(t,e){if(window.__backerToast)return window.__backerToast(t,e);const s=u("#toast");s&&(s.textContent=t,s.classList.add("show"),setTimeout(()=>s.classList.remove("show"),2400))}function et(t){if(!(!t||!t.focus))try{t.focus({preventScroll:!0})}catch{try{t.focus()}catch{}}}function gt(t,e){t&&(et(e),w("market_card_opened",{market_id:t.id,creator_id:t.id,source:"market"}),window.location.href="backermarket.html?market="+encodeURIComponent(t.id)+"&source=market-archive")}function $t(t,e){if(!t)return;et(e);const s=window.PoaTerminal,n={seed:t.id,creator:t,name:t.name,surface:"poa"};if(s&&typeof s.open=="function"){s.open(n);return}if(s&&typeof s.openByCreator=="function"){s.openByCreator(t.id,n);return}E=e,pt(t)}function at(){const t=[];a.view!=="markets"&&t.push("view="+a.view),a.browse&&t.push("browse="+a.browse),a.window!==d.DEFAULT_WINDOW&&t.push("window="+a.window),a.genre&&t.push("genre="+a.genre),a.platforms.length&&t.push("platform="+a.platforms.join(",")),a.scale.length&&t.push("scale="+a.scale.join(",")),a.poa.length&&t.push("poa="+a.poa.join(",")),a.multiple.length&&t.push("multiple="+a.multiple.join(",")),a.evidence!=="all"&&t.push("evidence="+a.evidence),a.risk!=="all"&&t.push("risk="+a.risk),a.quickOpen||t.push("status=all"),a.ending&&t.push("ending=1"),a.u100&&t.push("u100=1"),a.sort!=="pulse"&&t.push("sort="+a.sort);try{history.replaceState(null,"",location.pathname+location.search+(t.length?"#market-archive?"+t.join("&"):"#market-archive"))}catch{}}function yt(){const t=location.hash;if(!/^#market-archive\?/.test(t))return;const e=new URLSearchParams(t.slice(16)),s=(f,$)=>{const y=e.get(f);return $.includes(y)?y:null},n=(f,$)=>{const y=new Set($);return(e.get(f)||"").split(",").filter((ht,jt,Ft)=>y.has(ht)&&Ft.indexOf(ht)===jt)},l=s("view",["markets","radar","resolved"]),o=s("browse",N.map(f=>f[0])),i=s("window",d.WINDOWS),r=s("genre",d.TAXONOMY.map(f=>f.id)),c=s("sort",F.map(f=>f[0])),k=s("evidence",["all","high","medium","low"]),b=s("risk",["all","none","low","medium","elevated"]);l&&(a.view=l),o&&(a.browse=o),i&&(a.window=i),r&&(a.genre=r),a.platforms=n("platform",d.PLATFORMS.map(f=>f.id)),a.scale=n("scale",d.TIERS.map(f=>f.id)),a.poa=n("poa",["strong","mixed","risk","insufficient"]),a.multiple=n("multiple",["1x","15x","2x"]),k&&(a.evidence=k),b&&(a.risk=b),e.get("status")==="all"&&(a.quickOpen=!1),a.ending=e.get("ending")==="1",a.u100=e.get("u100")==="1",c&&(a.sort=c);const p=e.get("market");if(p){const f=p.toUpperCase();/RESOLVED/.test(f)?a.view="resolved":/WATCH|NO_CONTRACT|REVIEW|PENDING/.test(f)&&(a.view="radar")}}function Pt(){a.view="markets",a.browse=null,a.window=d.DEFAULT_WINDOW,a.genre=null,a.platforms=[],a.scale=[],a.poa=[],a.multiple=[],a.evidence="all",a.risk="all",a.quickOpen=!0,a.ending=!1,a.u100=!1,a.sort="pulse",a.shown=12,a.featIdx=0}const R=["none","low","medium","elevated","severe"],Lt={high:80,medium:60,low:35},Et=t=>t>=2?"2x":t>=1.5?"15x":"1x";function H(t){const e=t.mkt;return!(a.genre&&e.cat!==a.genre||a.platforms.length&&!e.profiles.some(s=>a.platforms.includes(s.plat))||a.scale.length&&!a.scale.includes(e.tier.id)||a.poa.length&&!a.poa.includes(e.poa.band)||a.evidence!=="all"&&e.evidence.score<Lt[a.evidence]||a.risk!=="all"&&R.indexOf(e.risk.level)>R.indexOf(a.risk)||a.u100&&t.followers>=1e5)}function q(){let t=d.CONTRACTS.filter(e=>["OPEN","OPENING_SOON","CLOSED"].includes(e.mkt.state)&&H(e));return a.quickOpen&&(t=t.filter(e=>e.mkt.state==="OPEN")),a.ending&&(t=t.filter(e=>e.mkt.state==="OPEN"&&e.contract.closeDays<=30)),a.multiple.length&&(t=t.filter(e=>a.multiple.includes(Et(e.contract.mult)))),a.browse==="new"?t=t.filter(e=>e.contract.isNew):a.browse==="ending"?t=t.filter(e=>e.mkt.state==="OPEN"&&e.contract.closeDays<=30):a.browse==="high-poa"?t=t.filter(e=>e.mkt.poa.score>=75&&e.mkt.evidence.score>=60):a.browse==="risk-watch"&&(t=t.filter(e=>["medium","elevated","severe"].includes(e.mkt.risk.level))),Mt(t)}function C(){return d.ALL.filter(t=>d.RADAR_STATES.includes(t.mkt.state)&&H(t)).sort((t,e)=>e.mkt.windows[a.window].pulse.value-t.mkt.windows[a.window].pulse.value||e.mkt.evidence.score-t.mkt.evidence.score||(t.id<e.id?-1:1))}function j(){return d.CONTRACTS.filter(t=>t.mkt.state==="RESOLVED"&&H(t)).sort((t,e)=>e.contract.simVol-t.contract.simVol)}function Mt(t){const e=a.window,s=n=>t.slice().sort((l,o)=>n(o)-n(l)||o.mkt.evidence.score-l.mkt.evidence.score||(l.id<o.id?-1:1));switch(a.sort){case"trending":{const n={};return d.trendingList(e).forEach((l,o)=>n[l.id]=o),t.slice().sort((l,o)=>(n[l.id]??999)-(n[o.id]??999))}case"most-backed":return s(n=>n.contract.simVol);case"ending":return t.slice().sort((n,l)=>(n.mkt.state==="OPEN"?n.contract.closeDays:999)-(l.mkt.state==="OPEN"?l.contract.closeDays:999));case"newest":return t.slice().sort((n,l)=>n.contract.listedDaysAgo-l.contract.listedDaysAgo);case"poa":return s(n=>n.mkt.poa.score*1e3+n.mkt.evidence.score);case"evidence":return s(n=>n.mkt.evidence.score*1e3+n.mkt.poa.score);case"rising":return s(n=>n.mkt.windows[e].pulse.comp.momentum*1e3+n.mkt.windows[e].pulse.value);case"risk":return t.slice().sort((n,l)=>R.indexOf(n.mkt.risk.level)-R.indexOf(l.mkt.risk.level)||l.mkt.poa.score-n.mkt.poa.score);case"multiple":return s(n=>n.contract.mult);default:return s(n=>n.mkt.windows[e].pulse.value)}}const F=[["pulse","Attention Pulse"],["trending","Trending"],["most-backed","Most backed"],["ending","Ending soon"],["newest","Newest"],["poa","Strongest PoA"],["evidence","Highest evidence"],["rising","Fastest rising"],["risk","Lowest risk"],["multiple","Highest multiple"]],N=[["trending","Trending","trending"],["new","New","newest"],["rising","Rising","rising"],["ending","Ending soon","ending"],["most-backed","Most backed","most-backed"],["high-poa","High PoA","poa"],["risk-watch","Risk watch","risk"]];function Ot(t){return t.split(" ").slice(0,2).map(e=>e[0]).join("").toUpperCase()}function A(t,e){return`<span class="mkt-av" style="width:${e}px;height:${e}px;background:radial-gradient(circle at 32% 26%, hsl(${t.hue} 70% 62%), hsl(${t.hue+26} 55% 32%) 64%, hsl(${t.hue+8} 38% 15%));font-size:${Math.round(e*.36)}px;color:hsl(${t.hue} 60% 12%)">${Ot(t.name)}</span>`}function V(t){const e=t.mkt,s=e.poa.band,n=s==="insufficient"?"—":e.poa.score,l=e.evidence.grade[0];return`<button type="button" class="mkt-poa ${s}" data-mkt-poa-open="${t.id}" aria-label="Open Proof of Attention composition for ${m(t.name)}; ${s==="insufficient"?"insufficient evidence":"score "+e.poa.score+", evidence "+e.evidence.grade}" title="PoA ${n} · Evidence ${e.evidence.grade} — underwriting, not success odds"><i></i>${n}<em>${l}</em></button>`}function _(t,e){const s=P.has(t.id);return`<button class="mkt-watch ${s?"on":""}" data-watch="${t.id}" aria-pressed="${s}" aria-label="${s?"Remove from watchlist":"Add to watchlist"}" title="${s?"Watching":"Watch"}"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/></svg>${e?`<span>${s?"Watching":"Watch"}</span>`:""}</button>`}function W(t,e){const s=t.mkt.windows[a.window].delta;return`<span class="mkt-delta ${s>0?"up":s<0?"down":"flat"}">${s>0?"+":""}${s.toFixed(1)}${e?`<small> Pulse ${a.window.toUpperCase()}</small>`:""}</span>`}const st={none:"Low material risk",low:"Low risk",medium:"Mixed evidence",elevated:"Elevated risk",severe:"Material risk"};function U(t){const e=t.mkt.risk.level;return`<span class="mkt-risk ${e}" title="${m(t.mkt.risk.label)}">${st[e]}</span>`}function St(t){const e=t&&t.mkt&&t.mkt.poa?String(t.mkt.poa.positive||""):"";return!e||/watch\s*time|view\s*duration|retention|returning[-\s]*viewer/i.test(e)?"Stable public engagement breadth across sampled content.":e}function nt(t){return t.contract.simVol+(x[t.id]||0)}function it(t){return t.contract.backers+(x[t.id]?1:0)}function Y(t){const e=t.contract?`upd ${t.contract.freshMin}m`:`${t.mkt.profiles[0].fresh.label.toLowerCase()} ${t.mkt.profiles[0].fresh.ago}`;return`<span class="mkt-fr" title="Relative to the fixed demo snapshot (${d.DEMO_SNAP_LABEL}). Fixture data — never a live claim.">${e} · demo</span>`}function ot(t){const e=t.mkt.state,s=t.contract;return e==="OPEN"&&s.closingSoon?'<span class="mkt-badge closing">Closing soon</span>':e==="OPEN"&&s.isNew?'<span class="mkt-badge new">New</span>':e==="OPEN"?'<span class="mkt-badge open">Open</span>':e==="OPENING_SOON"?`<span class="mkt-badge soon">Opens in ${s.opensInDays}d</span>`:e==="CLOSED"?'<span class="mkt-badge closed">Closed</span>':e==="RESOLVED"?s.outcome==="HIT"?'<span class="mkt-badge hit">Resolved · hit</span>':'<span class="mkt-badge miss">Resolved · miss</span>':`<span class="mkt-badge closed">${d.STATES[e].label}</span>`}function xt(t){const e=t.mkt.state;return e==="OPEN"?`<button type="button" class="mkt-cta" data-market-open="${t.id}" aria-label="Open a simulated position on ${m(t.name)}">Open position</button>`:e==="OPENING_SOON"?_(t,!0):e==="CLOSED"?`<button type="button" class="mkt-btn ghost sm" data-market-open="${t.id}">View contract</button>`:e==="RESOLVED"?`<button type="button" class="mkt-btn ghost sm" data-market-open="${t.id}">View result</button>`:""}function At(t,e,s){const n=t.contract.spark,l=t.milestone.target,o=Math.max(l,...n),i=Math.min(...n),r=Math.max(1,o-i),c=n.map((b,p)=>`${(p/(n.length-1)*e).toFixed(1)},${(s-4-(b-i)/r*(s-8)).toFixed(1)}`).join(" "),k=(s-4-(l-i)/r*(s-8)).toFixed(1);return`<svg class="mkt-spark" viewBox="0 0 ${e} ${s}" preserveAspectRatio="none" role="img" aria-label="Milestone progress trajectory: ${t.contract.curLabel} of ${t.contract.tgtLabel} target (${t.contract.progressPct}% milestone progress)">
      <line x1="0" y1="${k}" x2="${e}" y2="${k}" class="sp-target"/>
      <polyline points="${c}" class="sp-line"/>
      <circle cx="${e}" cy="${(s-4-(n[n.length-1]-i)/r*(s-8)).toFixed(1)}" r="2.5" class="sp-dot"/>
    </svg>`}function rt(t){const e=t.mkt,s=t.contract,n=d.catById(e.cat),l=d.platById(e.profiles[0].plat);return`<article class="mkt-card st-${e.state.toLowerCase()}" data-row="${t.id}" data-market-card aria-label="${m(s.title)} — ${m(t.name)}">
      <button type="button" class="mkt-card-hit" data-market-open="${t.id}" aria-label="Open traded market for ${m(t.name)}: ${m(s.title)}"></button>
      <header class="mkt-card-h">
        <button type="button" class="mkt-name" data-mkt-poa-open="${t.id}" aria-label="Open Proof of Attention composition for ${m(t.name)}">${A(t,30)}<span><b>${m(t.name)}</b><small>${l?l.name:""} · ${n?n.name:""}</small></span></button>
        ${ot(t)}${_(t)}
      </header>
      <h3 class="mkt-card-title"><button type="button" data-market-open="${t.id}" title="Open traded market">${m(s.title)}</button></h3>
      <div class="mkt-prog" role="img" aria-label="Milestone progress: ${s.curLabel} of ${s.tgtLabel}, ${s.progressPct}%">
        <b>${s.curLabel}</b><span class="mkt-bar"><i style="width:${s.progressPct}%"></i></span><b>${s.tgtLabel}</b>
        <em title="Milestone progress — completion toward the target, not chance of success">${s.progressPct}%</em>
      </div>
      <div class="mkt-terms">
        <span class="t-mult"><b>${s.mult}×</b><small>fixed term</small></span>
        <span class="t-pulse">${W(t)}<small>Pulse ${a.window.toUpperCase()}</small></span>
        ${V(t)}
        ${U(t)}
      </div>
      <footer class="mkt-card-f">
        <span class="f-act">${s.simVol||x[t.id]?`${h.money(nt(t))} <em>sim. vol.</em> · ${it(t)} backers`:`${s.watchers} watching`} · ${Y(t)}</span>
        <span class="f-cta"><button type="button" class="mkt-link" data-market-open="${t.id}">Details</button>${xt(t)}</span>
      </footer>
    </article>`}function _t(){const t=d.featuredList(a.window);if(!t.length)return"";a.featIdx=Math.max(0,Math.min(a.featIdx,t.length-1));const e=t[a.featIdx],s=e.mkt,n=e.contract,l=d.catById(s.cat),o=d.platById(s.profiles[0].plat);return`<article class="mkt-feat" data-row="${e.id}" data-market-card aria-label="Featured market: ${m(n.title)}">
      <button type="button" class="mkt-card-hit" data-market-open="${e.id}" aria-label="Open traded market for ${m(e.name)}: ${m(n.title)}"></button>
      <header class="mkt-card-h">
        <span class="mkt-feat-tag">Featured market</span>
        <button type="button" class="mkt-name" data-mkt-poa-open="${e.id}" aria-label="Open Proof of Attention composition for ${m(e.name)}">${A(e,34)}<span><b>${m(e.name)}</b><small>${o?o.name:""} · ${l?l.name:""}</small></span></button>
        ${ot(e)}
        <span class="mkt-feat-nav"><button data-feat-prev aria-label="Previous featured market" ${a.featIdx===0?"disabled":""}>‹</button><em>${a.featIdx+1} of ${t.length}</em><button data-feat-next aria-label="Next featured market" ${a.featIdx===t.length-1?"disabled":""}>›</button></span>
        ${_(e)}
      </header>
      <h3 class="mkt-feat-title"><button type="button" data-market-open="${e.id}">${m(n.title)}</button></h3>
      <div class="mkt-prog big" role="img" aria-label="Milestone progress: ${n.curLabel} of ${n.tgtLabel}, ${n.progressPct}%">
        <b>${n.curLabel}</b><span class="mkt-bar"><i style="width:${n.progressPct}%"></i></span><b>${n.tgtLabel}</b>
        <em title="Milestone progress — completion toward the target, not chance of success">${n.progressPct}% progress</em>
      </div>
      <div class="mkt-feat-chart">
        <small>${m(e.milestone.metric)} trajectory · fixture series to ${d.DEMO_SNAP_LABEL}</small>
        ${At(e,560,64)}
      </div>
      <div class="mkt-terms big">
        <span class="t-mult"><b>${n.mult}×</b><small>fixed sim term</small></span>
        <span class="t-pulse">${W(e)}<small>Pulse ${a.window.toUpperCase()}</small></span>
        ${V(e)}
        ${U(e)}
        <span class="t-close">${n.closeLabel?`<b>${n.closeLabel}</b><small>entry closes</small>`:""}</span>
      </div>
      <p class="mkt-feat-ev">+ ${m(St(e))}</p>
      <footer class="mkt-card-f">
        <span class="f-act">${h.money(nt(e))} <em>sim. vol.</em> · ${it(e)} backers · ${Y(e)}</span>
        <span class="f-cta"><button type="button" class="mkt-btn ghost sm" data-market-open="${e.id}">Details</button><button type="button" class="mkt-cta" data-market-open="${e.id}" aria-label="Open a simulated position on ${m(e.name)}">Open position</button></span>
      </footer>
    </article>`}function lt(t){const e=t.mkt,s=d.catById(e.cat),n=d.STATES[e.state],l=d.platById(e.profiles[0].plat),o=e.windows[a.window];return`<article class="mkt-card mkt-rcard" data-row="${t.id}">
      <header class="mkt-card-h">
        <button type="button" class="mkt-name" data-mkt-poa-open="${t.id}" aria-label="Open Proof of Attention composition for ${m(t.name)}">${A(t,30)}<span><b>${m(t.name)}</b><small>${l?l.name:""} · ${s?s.name:""}</small></span></button>
        <span class="mkt-badge watch">${n.label}</span>${_(t)}
      </header>
      <div class="mkt-rcard-grid">
        <div><small>Reach</small><b>${h.fmt(t.followers)}</b></div>
        <div><small>Pulse ${a.window.toUpperCase()}</small><b>${o.pulse.value.toFixed(1)}</b> ${W(t)}</div>
        <div><small>PoA · Evidence</small>${V(t)}</div>
        <div><small>Risk</small>${U(t)}</div>
      </div>
      <p class="mkt-rcard-note">Watch-only research — no open contract. No terms are synthesized.</p>
      <footer class="mkt-card-f">
        <span class="f-act">${Y(t)}</span>
        <span class="f-cta"><button type="button" class="mkt-link" data-mkt-poa-open="${t.id}">Open PoA composition</button>${_(t,!0)}</span>
      </footer>
    </article>`}function D(t,e,s,n,l){return`<button type="button" class="mkt-rrow" data-mkt-poa-open="${t.id}" aria-label="Open Proof of Attention composition for ${m(t.name)}">
      <span class="rr-rank">${String(e+1).padStart(2,"0")}</span>
      <span class="rr-body"><b>${m(t.name)}</b><small>${m(l)}</small></span>
      <span class="rr-val"><b>${s}</b><small>${n}</small></span>
    </button>`}function dt(){const t=a.window,e=t.toUpperCase(),s=[],n=tt(),l=d.ALL.filter(p=>P.has(p.id));if(!n.length&&!l.length)s.push(`<section class="mkt-rmod"><h4>Your market</h4>
        <p class="rm-copy">Backer runs simulated milestone markets — every position is practice capital, no real money moves.</p>
        <div class="rm-btns"><button class="mkt-btn sm" data-tab="radar">Build your watchlist</button><button class="mkt-btn ghost sm" data-scroll-method>How contracts work</button></div>
      </section>`);else{const p=l.slice().sort(($,y)=>Math.abs(y.mkt.windows[t].delta)-Math.abs($.mkt.windows[t].delta)).slice(0,3).map(($,y)=>D($,y,($.mkt.windows[t].delta>0?"+":"")+$.mkt.windows[t].delta.toFixed(1),"Pulse "+e,d.catById($.mkt.cat).name)).join(""),f=n.reduce(($,y)=>$+y.invested,0);s.push(`<section class="mkt-rmod"><h4>Your market</h4>
        ${n.length?`<p class="rm-copy">${n.length} simulated position${n.length>1?"s":""} · ${h.money(f)} <em>sim.</em> at stake.</p>`:""}
        ${p}
        <button class="mkt-link rm-all" data-go-portfolio>View portfolio →</button>
      </section>`)}const o=d.aiPulse(t).map(p=>`<li>${m(p.t)} <small>· ${p.src}</small></li>`).join("");s.push(`<section class="mkt-rmod"><h4>Backer AI Pulse <span class="rm-note" title="Deterministic digest computed from structured fixture snapshots — every bullet carries its source context. No free-form generation.">ⓘ sourced</span></h4>
      <ul class="rm-bullets">${o}</ul>
      <small class="rm-stamp">Updated at demo snapshot · ${d.DEMO_SNAP_LABEL}</small>
    </section>`);const i=d.trendingList(t).slice(0,3);i.length>=3&&s.push(`<section class="mkt-rmod"><h4>Trending <span class="rm-note" title="0.40 sim-volume growth + 0.25 position starts + 0.15 watch adds (24H percentiles) + 0.20 Pulse delta. Separate from the default grid order.">ⓘ 24H</span></h4>
      ${i.map((p,f)=>D(p,f,p.contract.mult+"×",(p.mkt.windows[t].delta>0?"+":"")+p.mkt.windows[t].delta.toFixed(1)+" Pulse",p.contract.progressPct+"% progress")).join("")}
      <button class="mkt-link rm-all" data-viewall="trending">View all →</button>
    </section>`);const r=d.moversList(t);r.length>=3&&s.push(`<section class="mkt-rmod"><h4>Top movers <span class="rm-note">Pulse pts / ${e}</span></h4>
      ${r.map((p,f)=>D(p,f,(p.mkt.windows[t].delta>0?"+":"")+p.mkt.windows[t].delta.toFixed(1),"pts / "+e,st[p.mkt.risk.level])).join("")}
      <button class="mkt-link rm-all" data-viewall="rising">View all →</button>
    </section>`);const c=d.riskWatchList();c.length&&s.push(`<section class="mkt-rmod warn"><h4>Risk watch</h4>
      ${c.map((p,f)=>`<button type="button" class="mkt-rrow" data-mkt-poa-open="${p.c.id}" aria-label="Open Proof of Attention composition for ${m(p.c.name)}"><span class="rr-rank warn">!</span><span class="rr-body"><b>${m(p.c.name)}</b><small>${m(p.msg)}</small></span></button>`).join("")}
      <button class="mkt-link rm-all" data-viewall="risk-watch">View all →</button>
    </section>`);const k=d.openingSoonList().length,b=d.newList().length;return s.push(`<section class="mkt-rmod links"><h4>More</h4>
      <div class="rm-links">
        ${b?`<button class="mkt-link" data-viewall="new">New contracts (${b})</button>`:""}
        ${k?`<button class="mkt-link" data-tab-open-soon>Opening soon (${k})</button>`:""}
        <button class="mkt-link" data-viewall="most-backed">Highest simulated volume</button>
      </div>
    </section>`),`<aside class="mkt-rail" aria-label="Backer Pulse — market intelligence">${s.join("")}</aside>`}function Tt(){const t=d.trendingList(a.window).slice(0,3);return t.length<3?"":`<div class="mkt-inline"><h4>Backer Pulse · Trending</h4>${t.map((e,s)=>D(e,s,e.contract.mult+"×",(e.mkt.windows[a.window].delta>0?"+":"")+e.mkt.windows[a.window].delta.toFixed(1)+" Pulse",e.contract.progressPct+"% progress")).join("")}</div>`}function L(t,e,s,n){return`<button class="mkt-fchip ${n?"on":""}" data-f="${t}" data-v="${e}">${s}</button>`}function ct(){const t=a.view==="radar"?C().length:a.view==="resolved"?j().length:q().length;return`<div class="mkt-drawer-h"><h3>Filter ${a.view==="radar"?"Creator Radar":"markets"}</h3><button class="mkt-x" data-close-drawer aria-label="Close filters"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="mkt-drawer-b">
      <h5>Contract</h5>
      <div class="mkt-fgroup">${L("open","1","Open only",a.quickOpen)}${L("ending","1","Ending <30d",a.ending)}</div>
      <h5>Payout multiple</h5><div class="mkt-fgroup">${[["1x","1.0–1.49×"],["15x","1.5–1.99×"],["2x","2.0×+"]].map(e=>L("mult",e[0],e[1],a.multiple.includes(e[0]))).join("")}</div>
      <h5>Platform</h5><div class="mkt-fgroup">${d.PLATFORMS.map(e=>L("plat",e.id,e.name,a.platforms.includes(e.id))).join("")}</div>
      <h5>Creator scale</h5><div class="mkt-fgroup">${d.TIERS.map(e=>L("scale",e.id,e.label,a.scale.includes(e.id))).join("")}</div>
      <h5>PoA signal</h5><div class="mkt-fgroup">${[["strong","Strong"],["mixed","Mixed"],["risk","Elevated risk"],["insufficient","Insufficient"]].map(e=>L("poa",e[0],e[1],a.poa.includes(e[0]))).join("")}</div>
      <h5>Evidence Confidence</h5><div class="mkt-fgroup">${[["all","Any"],["high","High only"],["medium","Medium+"],["low","Include Low"]].map(e=>L("ev",e[0],e[1],a.evidence===e[0])).join("")}</div>
      <h5>Maximum risk</h5><div class="mkt-fgroup">${[["all","Any"],["none","None"],["low","Low"],["medium","Medium"],["elevated","Elevated"]].map(e=>L("risk",e[0],e[1],a.risk===e[0])).join("")}</div>
    </div>
    <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-reset-filters>Reset</button><button class="mkt-btn accent" data-close-drawer>Show ${t} ${a.view==="radar"?"creators":"markets"}</button></div>`}function It(){const t=u("#mktDrawer",v);t.classList.add("open"),t.setAttribute("aria-hidden","false"),t.innerHTML=`<div class="mkt-drawer-panel" role="dialog" aria-label="Filter market">${ct()}</div>`}function mt(){const t=u("#mktDrawer",v);t.classList.contains("open")&&(u(".mkt-drawer-panel",t).innerHTML=ct())}function T(){const t=u("#mktDrawer",v);t&&(t.classList.remove("open"),t.setAttribute("aria-hidden","true"),t.innerHTML="")}function K(t){const e=t.mkt,s=d.EV_GRADES[e.evidence.grade].w,n={none:1,low:1,medium:.6,elevated:.35,severe:.2}[e.risk.level];return Math.max(50,Math.round(e.poa.score*10*Math.max(s,.3)*n/10)*10)}function B(t,e){const s=t.contract,n=K(t),l=e>=1?e>n?`Above the $${n} position ceiling for this contract.`:null:"Minimum simulated position is $1.",o=Math.round(e*s.mult*100)/100;return`
      <div class="mkt-kv"><span>If milestone hits</span><b class="pos">${h.money(o)} simulated payout (+${h.money(Math.round((o-e)*100)/100)})</b></div>
      <div class="mkt-kv"><span>If milestone misses</span><b class="neg">$0 — full simulated stake lost</b></div>
      ${l?`<p class="mkt-pos-err" role="alert">${l}</p>`:""}`}function Rt(t){if(t.mkt.state!=="OPEN"){w("market_position_blocked",{market_id:t.id,creator_id:t.id,instrument:"milestone",reason:"market-closed",source:"market"});return}w("market_position_started",{market_id:t.id,creator_id:t.id,instrument:"milestone",source:"market"});const e=t.contract,s=t.mkt,n=K(t),l=u("#mktPos",v);l.classList.add("open"),l.setAttribute("aria-hidden","false"),l.innerHTML=`<div class="mkt-drawer-panel mkt-pos-panel" role="dialog" aria-label="Take a simulated position">
      <div class="mkt-drawer-h">${A(t,34)}<div class="mkt-poa-t"><h3>Simulated position</h3><small>${m(t.name)} · ${m(e.title)}</small></div><button class="mkt-x" data-close-pos aria-label="Close position drawer"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b" id="mktPosBody">
        <div class="mkt-kv"><span>Current → target</span><b>${e.curLabel} → ${e.tgtLabel} (${e.progressPct}% progress)</b></div>
        <div class="mkt-kv"><span>Milestone deadline</span><b>${e.deadlineLabel}</b></div>
        <div class="mkt-kv"><span>Entry closes</span><b>${e.closeLabel||"—"}</b></div>
        <div class="mkt-kv"><span>Payout multiple</span><b>${e.mult}× — fixed contract term, not market odds</b></div>
        <div class="mkt-kv"><span>PoA · Evidence</span><b>${s.poa.band==="insufficient"?"Insufficient":s.poa.score} · ${s.evidence.grade}</b></div>
        <div class="mkt-kv"><span>Primary risk</span><b>${m(s.risk.label)}</b></div>
        <div class="mkt-kv"><span>Resolution source</span><b>${m(e.source)}</b></div>
        <div class="mkt-kv"><span>Terms version</span><b>${e.id} · ${e.version}</b></div>
        <h5>Simulated amount</h5>
        <div class="mkt-amt"><span class="cur">$</span><input id="mktAmt" type="number" min="1" max="${n}" value="25" inputmode="numeric" aria-label="Simulated amount in dollars"/></div>
        <div class="mkt-fgroup">${[1,5,25,100].map(o=>`<button class="mkt-fchip ${o===25?"on":""}" data-amt-quick="${o}">$${o}</button>`).join("")}</div>
        <p class="mkt-pos-max">Position ceiling <b>$${n}</b> — scales with PoA confidence, evidence and contract risk. No universal cap.</p>
        <div id="mktPosPrev">${B(t,25)}</div>
        <p class="mkt-sim">Simulated position · no real money moves. You can lose the full simulated stake if the milestone misses.</p>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-close-pos>Cancel</button><button class="mkt-btn accent" data-confirm-pos="${t.id}">Confirm simulated position</button></div>
    </div>`,u(".mkt-x",l).focus()}function Ct(t){const e=u("#mktAmt",v),s=Math.round(parseFloat(e&&e.value)||0),n=K(t);if(!(s>=1)||s>n){w("market_position_blocked",{market_id:t.id,creator_id:t.id,instrument:"milestone",reason:s>=1?"above-ceiling":"below-minimum",source:"market"});const o=u("#mktPosPrev",v);o&&(o.innerHTML=B(t,s));return}try{const o=tt(),i=o.find(r=>r.id===t.id);i?i.invested+=s:o.push({id:t.id,invested:s,when:"Jul 2026"}),localStorage.setItem(X,JSON.stringify(o))}catch{w("market_position_blocked",{market_id:t.id,creator_id:t.id,instrument:"milestone",reason:"storage-failed",source:"market"});const i=u("#mktPosPrev",v);i&&(i.innerHTML=B(t,s)+'<p class="mkt-pos-err" role="alert">The simulated position was not saved. Check browser storage and try again.</p>'),M("Position not saved — browser storage is unavailable");return}x[t.id]=(x[t.id]||0)+s,w("market_position_completed",{market_id:t.id,creator_id:t.id,instrument:"milestone",source:"market"});const l=u("#mktPos",v);u(".mkt-drawer-panel",l).innerHTML=`<div class="mkt-drawer-h"><div class="mkt-poa-t"><h3>Position recorded</h3><small>${m(t.name)} · ${m(t.contract.title)}</small></div><button class="mkt-x" data-close-pos aria-label="Close"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b">
        <p class="mkt-pos-ok" role="status">Your <b>${h.money(s)}</b> simulated position is recorded against ${t.contract.id} · ${t.contract.version}.</p>
        <div class="mkt-kv"><span>If milestone hits</span><b class="pos">${h.money(Math.round(s*t.contract.mult*100)/100)} simulated payout</b></div>
        <div class="mkt-kv"><span>If milestone misses</span><b class="neg">$0</b></div>
        <p class="mkt-sim">Simulated · no real money moves.</p>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-close-pos>Keep browsing</button><button class="mkt-btn accent" data-go-portfolio>View portfolio</button></div>`,g(),M("Simulated position recorded — view it in your portfolio")}function I(){const t=u("#mktPos",v);if(t&&(t.classList.remove("open"),t.setAttribute("aria-hidden","true"),t.innerHTML="",E)){try{E.focus()}catch{}E=null}}function pt(t){const e=t.mkt,s=e.poa,n={strong:"Broad, fresh evidence supports this underwriting estimate.",mixed:"Evidence points to a mixed underwriting profile — read the risk line.",risk:"Public evidence shows material anomalies or structural weakness.",insufficient:"Backer does not have enough evidence for a calibrated estimate."},l=(c,k,b)=>{const p=b?k<25?"Low":k<50?"Medium":"High":k>=75?"High":k>=50?"Medium":"Low";return`<div class="mkt-kv"><span>${c}</span><b>${k} · ${p}</b></div>`},o=e.profiles.map(c=>{const k=d.platById(c.plat);return`<div class="mkt-kv"><span>${k?k.name:c.plat} <em class="${c.fresh.state==="PROVIDER_DELAYED"?"neg":""}">${c.fresh.label} ${c.fresh.ago}</em></span><b>${c.reachLabel} · ${c.engRate}% eng</b></div>`}).join(""),i=["True watch-time and retention are unavailable without creator authorization.",e.profiles.some(c=>c.fresh.state==="PROVIDER_DELAYED")?"Instagram evidence is provider-delayed; last-good snapshot in use.":null,"Public-data inference; platform-private fraud signals are unavailable."].filter(Boolean).map(c=>`<li>${c}</li>`).join(""),r=u("#mktPoa",v);r.classList.add("open"),r.setAttribute("aria-hidden","false"),r.innerHTML=`<div class="mkt-drawer-panel mkt-poa-panel" role="dialog" aria-label="Proof of Attention evidence">
      <div class="mkt-drawer-h"><div>${A(t,34)}</div><div class="mkt-poa-t"><h3>Proof of Attention</h3><small>${m(t.name)} · underwriting, not success odds</small></div><button class="mkt-x" data-close-poa aria-label="Close evidence panel"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="mkt-drawer-b">
        <div class="mkt-poa-hero ${s.band}">
          <div><small>Underwriting score</small><b>${s.band==="insufficient"?"—":s.score}</b></div>
          <div><small>Evidence Confidence</small><b>${e.evidence.grade} ${e.evidence.score}</b></div>
          ${s.band!=="insufficient"?`<div><small>Est. authentic attention</small><b>${s.range[0]}–${s.range[1]}%</b></div>`:""}
          <div><small>Risk</small><b class="${e.risk.level}">${e.risk.level==="none"?"None material":e.risk.level[0].toUpperCase()+e.risk.level.slice(1)} ${s.components.risk}</b></div>
        </div>
        <p class="mkt-poa-lead">${n[s.band]}</p>
        <h5>Primary evidence</h5>
        <p class="mkt-ev pos">+ ${m(s.positive)}</p>
        <p class="mkt-ev ${e.risk.level==="none"?"":"neg"}">! ${m(s.riskNote)}</p>
        <h5>Components</h5>
        ${l("Attention Authenticity",s.components.authenticity)}
        ${l("Attention Durability",s.components.durability)}
        ${l("Engagement Quality",s.components.engagementQuality)}
        ${l("Monetization Readiness",s.components.monetization)}
        ${l("Manipulation / Platform Risk",s.components.risk,!0)}
        <div class="mkt-kv"><span>Data Coverage</span><b>${s.coverage}</b></div>
        <h5>Evidence by platform</h5>${o}
        <h5>Missing data &amp; limitations</h5><ul class="mkt-limits">${i}</ul>
        <small class="mkt-vers">Public-data score · demo snapshot ${d.DEMO_SNAP_LABEL} · ${d.VERSIONS.poa}</small>
      </div>
      <div class="mkt-drawer-f"><button class="mkt-btn ghost" data-correction>Report a correction</button><button class="mkt-btn" data-mkt-poa-open="${t.id}">Full underwriting profile →</button></div>
    </div>`,u(".mkt-x",r).focus()}function O(){const t=u("#mktPoa",v);t&&(t.classList.remove("open"),t.setAttribute("aria-hidden","true"),t.innerHTML="")}function ut(){const t=[],e=(s,n)=>t.push({label:s,fn:n});return a.genre&&e(d.catById(a.genre).name,()=>{a.genre=null}),a.platforms.forEach(s=>e(d.platById(s).name,()=>{a.platforms=a.platforms.filter(n=>n!==s)})),a.scale.forEach(s=>e(d.TIERS.find(n=>n.id===s).label,()=>{a.scale=a.scale.filter(n=>n!==s)})),a.poa.forEach(s=>e("PoA: "+s,()=>{a.poa=a.poa.filter(n=>n!==s)})),a.multiple.forEach(s=>e("Multiple: "+(s==="2x"?"2.0×+":s==="15x"?"1.5–1.99×":"1.0–1.49×"),()=>{a.multiple=a.multiple.filter(n=>n!==s)})),a.evidence!=="all"&&e("Evidence: "+a.evidence,()=>{a.evidence="all"}),a.risk!=="all"&&e("Risk ≤ "+a.risk,()=>{a.risk="all"}),a.u100&&e("Under 100K",()=>{a.u100=!1}),a.ending&&e("Ending <30d",()=>{a.ending=!1}),t}window.__mktChipRemove=[];function G(t){const e=ut();return`<div class="mkt-empty">
      <b>No ${a.view==="radar"?"creators":"markets"} match the current constraints.</b>
      ${e.length?`<p>Active filters: ${e.map(s=>m(s.label)).join(" · ")}.</p>`:""}
      <div class="rm-btns">${e.length?'<button class="mkt-btn sm" data-clear-filters>Clear filters</button>':""}${a.view==="markets"?'<button class="mkt-btn ghost sm" data-tab="radar">Browse Creator Radar</button>':""}</div>
    </div>`}function kt(){const t=a.window;if(a.view==="radar"){const r=C(),c=r.slice(0,a.shown);return`<div class="mkt-gridwrap">
        <p class="mkt-tab-lead">Creators worth monitoring before a contract opens — ranked by Attention Pulse ${t.toUpperCase()}, Evidence Confidence tie-break. Radar profiles never show contract terms.</p>
        ${r.length?`<div class="mkt-grid radar">${c.map(lt).join("")}</div>`:G()}
        ${r.length>a.shown?`<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12,r.length-a.shown)} more</button><span>${c.length} of ${r.length}</span></div>`:`<div class="mkt-more"><span>${r.length} creators on radar</span></div>`}
      </div>`}if(a.view==="resolved"){const r=j(),c=r.slice(0,a.shown);return`<div class="mkt-gridwrap">
        <p class="mkt-tab-lead">Resolved milestone contracts — outcome recorded from the independent resolution source. PoA never settles a contract.</p>
        ${r.length?`<div class="mkt-grid">${c.map(rt).join("")}</div>`:G()}
        ${r.length>a.shown?`<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12,r.length-a.shown)} more</button></div>`:""}
      </div>`}const e=d.featuredList(t),s=e.length?e[Math.max(0,Math.min(a.featIdx,e.length-1))]:null;let n=q();s&&(n=n.filter(r=>r.id!==s.id));const l=n,o=l.slice(0,a.shown),i=o.map((r,c)=>rt(r)+(c===3?Tt():"")).join("");return`<div class="mkt-gridwrap">
      ${s?`<div class="mkt-featrow">${_t()}</div>`:""}
      <div class="mkt-grid-h"><h2>All markets</h2><span>${n.length} contract${n.length===1?"":"s"}${a.browse?" · "+N.find(r=>r[0]===a.browse)[1]:""} · sorted by ${F.find(r=>r[0]===a.sort)[1]}</span></div>
      ${l.length?`<div class="mkt-grid">${i}</div>`:n.length?"":G()}
      ${l.length>a.shown?`<div class="mkt-more"><button class="mkt-btn" data-load-more>Show ${Math.min(12,l.length-a.shown)} more</button><span>${o.length} of ${l.length} eligible</span></div>`:n.length?`<div class="mkt-more"><span>All ${n.length+(s?1:0)} eligible contracts shown — empty inventory is honest inventory.</span></div>`:""}
      ${Nt()}
    </div>`}function Nt(){if(a.view!=="markets")return"";const t=C().slice(0,3);return t.length?`<section class="mkt-radar-prev">
      <div class="mkt-grid-h"><h2>Creator Radar</h2><span>watch-only research — no terms synthesized</span><button class="mkt-link" data-tab="radar">Open Radar →</button></div>
      <div class="mkt-grid radar">${t.map(lt).join("")}</div>
    </section>`:""}function ft(){return`<div class="mkt-ticker" role="status" aria-label="Market status">${d.tickerStats().map(t=>`<span class="mkt-tick ${t.warn?"warn":""}" title="${m(t.tip)}">${m(t.v)}</span>`).join("<i>·</i>")}</div>`}function vt(){return`<div class="mkt-browse" role="navigation" aria-label="Browse modes and categories">
      <div class="mkt-browse-in">
        ${N.map(t=>`<button class="bchip ${a.browse===t[0]?"on":""}" data-browse="${t[0]}">${t[1]}</button>`).join("")}
        <span class="bsep" aria-hidden="true"></span>
        ${["all",...d.TAXONOMY.map(t=>t.id)].map(t=>`<button class="bchip cat ${!a.genre&&t==="all"||a.genre===t?"on":""}" data-cat="${t==="all"?"":t}">${t==="all"?"All":d.catById(t).name}</button>`).join("")}
      </div>
    </div>`}function bt(){const t={markets:q().length,radar:C().length,resolved:j().length},e=ut();return window.__mktChipRemove=e.map(s=>s.fn),`
      <div class="mkt-controls">
        <div class="mkt-tabs" role="tablist" aria-label="Market view">
          ${[["markets","Markets"],["radar","Creator Radar"],["resolved","Resolved"]].map(s=>`<button role="tab" aria-selected="${a.view===s[0]}" class="${a.view===s[0]?"on":""}" data-tab="${s[0]}">${s[1]} <em>${t[s[0]]}</em></button>`).join("")}
        </div>
        <div class="mkt-tools">
          <div class="mkt-windows" role="tablist" aria-label="Time window">${d.WINDOWS.map(s=>`<button role="tab" aria-selected="${s===a.window}" class="${s===a.window?"on":""}" data-window="${s}">${s.toUpperCase()}</button>`).join("")}</div>
          ${a.view==="markets"?`
          <div class="mkt-quick">
            <button class="qchip ${a.quickOpen?"on":""}" data-quick="open">Open</button>
            <button class="qchip ${a.ending?"on":""}" data-quick="ending">Ending &lt;30d</button>
            <button class="qchip ${a.platforms.includes("youtube")?"on":""}" data-quick="yt">YouTube</button>
            <button class="qchip ${a.u100?"on":""}" data-quick="u100">Under 100K</button>
            <button class="qchip ${a.evidence==="medium"?"on":""}" data-quick="ev">Medium+ evidence</button>
          </div>`:""}
          <button class="mkt-btn ghost sm" data-open-drawer>Filters${e.length?` <b>${e.length}</b>`:""}</button>
          <label class="mkt-sort">Sort <select id="mktSort" aria-label="Sort markets">${F.map(s=>`<option value="${s[0]}" ${s[0]===a.sort?"selected":""}>${s[1]}</option>`).join("")}</select></label>
          <button class="mkt-btn ghost sm" data-share-board title="Copy a link that restores tab, browse mode, filters, sort and window">Share</button>
        </div>
      </div>
      ${e.length?`<div class="mkt-active-chips">${e.map((s,n)=>`<span class="mkt-achip">${m(s.label)}<button data-chip-x="${n}" aria-label="Remove filter ${m(s.label)}">×</button></span>`).join("")}<button class="mkt-clear" data-clear-filters>Clear all</button></div>`:""}`}function Dt(){return`<footer class="mkt-foot" id="mktMethod">
      <div class="mkt-foot-grid">
        <div><h4>How contracts work</h4><p>A milestone contract fixes a <b>target, deadline and payout multiple</b> against an independent resolution source. Hit the milestone by the deadline and the simulated payout follows the contract multiple; miss it and the simulated stake is lost. The multiple is a fixed contract term — <b>not market odds or a probability</b>.</p></div>
        <div><h4>Underwriting, separately</h4><p><b>Attention Pulse</b> is a cohort-normalized attention index — never a price. <b>Proof of Attention</b> is a versioned underwriting estimate shown beside its <b>Evidence Confidence</b>; it is advisory and never settles a contract. Milestone progress measures completion toward the target, not chance of success.</p></div>
        <div><h4>Simulation disclosure</h4><p><b>Simulated markets · no real money moves.</b> Every volume figure is labeled <code>sim. vol.</code> and sums recorded simulated positions. This page is a demo on a fixture catalog (<code>isFixture=true</code>) at a fixed snapshot — production requires source-backed data with provenance, and fixtures never enter production responses.</p></div>
      </div>
      <div class="mkt-foot-vers"><span>${d.VERSIONS.ranking}</span><span>${d.VERSIONS.pulse}</span><span>${d.VERSIONS.poa}</span><span>${d.VERSIONS.taxonomy}</span><span>Demo snapshot ${d.DEMO_SNAP_LABEL}</span></div>
    </footer>`}function g(){u("#mktControls",v).innerHTML=bt(),u("#mktCanvas",v).innerHTML=kt(),u("#mktRailBox",v).innerHTML=a.view==="markets"?dt():"",u("#mktStage",v).classList.toggle("has-rail",a.view==="markets"),at()}function S(){u("#mktBrowse",v).innerHTML=vt(),u("#mktTicker",v).innerHTML=ft(),g()}function Bt(t){v=t,Pt(),yt(),P=Z(),t.innerHTML=`
    <div class="mkt" id="mktRoot">
      <div class="mkt-framing">
        <div class="mkt-framing-l">
          <h1>Live Markets</h1>
        </div>
        <div class="mkt-framing-r">
          <form class="mkt-search" id="mktNL">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input id="mktNLInput" placeholder="Search people, platforms, markets..." aria-label="Search people, platforms, markets"/>
          </form>
        </div>
      </div>
      <div id="mktBrowse">${vt()}</div>
      <div id="mktTicker">${ft()}</div>
      <div id="mktControls" class="mkt-controls-wrap">${bt()}</div>
      <div id="mktStage" class="mkt-stage ${a.view==="markets"?"has-rail":""}">
        <section id="mktCanvas" class="mkt-canvas" aria-live="polite">${kt()}</section>
        <div id="mktRailBox">${a.view==="markets"?dt():""}</div>
      </div>
      ${Dt()}
      <div class="mkt-drawer" id="mktDrawer" aria-hidden="true"></div>
      <div class="mkt-drawer" id="mktPoa" aria-hidden="true"></div>
      <div class="mkt-drawer" id="mktPos" aria-hidden="true"></div>
    </div>`,Ht(t),at()}function z(t){if(a.browse===t)a.browse=null,a.sort="pulse";else{a.browse=t;const e=N.find(s=>s[0]===t);a.sort=e?e[2]:"pulse",a.view!=="markets"&&(a.view="markets")}a.shown=12,a.featIdx=0,w("market_filter_changed",{filter:"browse",value:a.browse||"all",source:"market"})}function Ht(t){const e=u("#mktRoot",t);e.addEventListener("click",n=>{const l=n.target,o=r=>l.closest(r);let i;if(i=o("[data-watch]")){n.stopPropagation(),n.preventDefault();const r=i.dataset.watch;P.has(r)?(P.delete(r),M("Removed from watchlist")):(P.add(r),M("Watching — updates appear in Your Market and your portfolio")),wt(P),J(`[data-watch="${r}"]`,e).forEach(c=>{const k=P.has(r);c.classList.toggle("on",k),c.setAttribute("aria-pressed",k);const b=c.querySelector("span");b&&(b.textContent=k?"Watching":"Watch")});return}if(i=o("[data-mkt-poa-open]")){n.stopPropagation(),n.preventDefault(),$t(h.byId(i.dataset.mktPoaOpen),i);return}if(i=o("[data-market-open]")){n.stopPropagation(),n.preventDefault(),gt(h.byId(i.dataset.marketOpen),i);return}if(i=o("[data-poa]")){n.stopPropagation(),n.preventDefault(),E=i,pt(h.byId(i.dataset.poa));return}if(i=o("[data-close-poa]")){n.stopPropagation(),O();return}if(i=o("[data-correction]")){n.stopPropagation(),O(),M("Correction request recorded — reviewed with source evidence");return}if(i=o("[data-position]")){n.stopPropagation(),n.preventDefault(),E=i,Rt(h.byId(i.dataset.position));return}if(i=o("[data-close-pos]")){n.stopPropagation(),I();return}if(i=o("[data-confirm-pos]")){n.stopPropagation(),Ct(h.byId(i.dataset.confirmPos));return}if(i=o("[data-amt-quick]")){n.stopPropagation();const r=i.dataset.amtQuick,c=u("#mktAmt",e);c&&(c.value=r,c.dispatchEvent(new Event("input",{bubbles:!0}))),J("[data-amt-quick]",e).forEach(k=>k.classList.toggle("on",k===i));return}if(i=o("[data-go-portfolio]")){n.stopPropagation(),window.location.href="portfolio.html";return}if(i=o("[data-profile]")){n.stopPropagation(),n.preventDefault(),O(),T(),I(),window.__backerGo("creator",i.dataset.profile);return}if(i=o("[data-tab]")){n.stopPropagation(),a.view=i.dataset.tab,a.shown=12,w("market_filter_changed",{filter:"tab",value:a.view,source:"market"}),g();return}if(i=o("[data-tab-open-soon]")){n.stopPropagation(),a.view="markets",a.quickOpen=!1,a.browse=null,a.sort="newest",a.shown=12,g(),M("Showing all contract states — opening-soon markets included");return}if(i=o("[data-browse]")){n.stopPropagation(),z(i.dataset.browse),S();return}if(i=o("[data-viewall]")){n.stopPropagation(),a.view="markets",z(i.dataset.viewall),a.browse||z(i.dataset.viewall),S(),u("#mktCanvas",e).scrollIntoView({behavior:"smooth",block:"start"});return}if(i=o("[data-window]")){n.stopPropagation(),a.window=i.dataset.window,w("market_filter_changed",{filter:"window",value:a.window,source:"market"}),S();return}if((i=o("[data-cat]"))&&i.dataset.cat!==void 0){n.stopPropagation(),a.genre=i.dataset.cat||null,a.shown=12,a.featIdx=0,w("market_filter_changed",{filter:"genre",value:a.genre||"all",source:"market"}),S();return}if(i=o("[data-quick]")){n.stopPropagation();const r=i.dataset.quick;r==="open"?a.quickOpen=!a.quickOpen:r==="ending"?a.ending=!a.ending:r==="yt"?a.platforms=a.platforms.includes("youtube")?a.platforms.filter(c=>c!=="youtube"):a.platforms.concat("youtube"):r==="u100"?a.u100=!a.u100:r==="ev"&&(a.evidence=a.evidence==="medium"?"all":"medium"),w("market_filter_changed",{filter:"quick",value:r,source:"market"}),a.shown=12,g();return}if(i=o("[data-feat-prev]")){n.stopPropagation(),a.featIdx=Math.max(0,a.featIdx-1),g();return}if(i=o("[data-feat-next]")){n.stopPropagation(),a.featIdx+=1,g();return}if(i=o("[data-scroll-method]")){n.stopPropagation();const r=u("#mktMethod",e);r&&r.scrollIntoView({behavior:"smooth",block:"start"});return}if(i=o("[data-open-drawer]")){n.stopPropagation(),E=i,It();return}if(i=o("[data-close-drawer]")){n.stopPropagation(),T(),g();return}if((i=o("[data-reset-filters]"))||(i=o("[data-clear-filters]"))){n.stopPropagation(),a.genre=null,a.platforms=[],a.scale=[],a.poa=[],a.multiple=[],a.evidence="all",a.risk="all",a.u100=!1,a.ending=!1,a.quickOpen=!0,a.browse=null,a.sort="pulse",a.shown=12,w("market_filter_changed",{filter:"all",value:"reset",source:"market"}),mt(),S();return}if(i=o("[data-chip-x]")){n.stopPropagation();const r=window.__mktChipRemove[+i.dataset.chipX];r&&r(),a.shown=12,g();return}if(i=o("[data-f]")){n.stopPropagation();const r=i.dataset.f,c=i.dataset.v,k=b=>b.includes(c)?b.filter(p=>p!==c):b.concat(c);r==="plat"?a.platforms=k(a.platforms):r==="scale"?a.scale=k(a.scale):r==="poa"?a.poa=k(a.poa):r==="mult"?a.multiple=k(a.multiple):r==="ev"?a.evidence=c:r==="risk"?a.risk=c:r==="open"?a.quickOpen=!a.quickOpen:r==="ending"&&(a.ending=!a.ending),w("market_filter_changed",{filter:r,value:c,source:"market"}),a.shown=12,mt(),g();return}if(i=o("[data-load-more]")){n.stopPropagation(),a.shown+=12,g();return}if(i=o("[data-share-board]")){n.stopPropagation();try{navigator.clipboard&&navigator.clipboard.writeText(location.href)}catch{}M("Link copied — restores tab, browse mode, filters, sort and window");return}if(l.id==="mktDrawer"){T(),g();return}if(l.id==="mktPoa"){O();return}if(l.id==="mktPos"){I();return}}),e.addEventListener("change",n=>{n.target.id==="mktSort"&&(a.sort=n.target.value,a.browse=null,a.shown=12,w("market_sort_changed",{sort:a.sort,source:"market"}),S())}),e.addEventListener("input",n=>{if(n.target.id==="mktAmt"){const l=n.target.closest(".mkt-pos-panel"),o=l&&l.querySelector("[data-confirm-pos]");if(!o)return;const i=h.byId(o.dataset.confirmPos),r=u("#mktPosPrev",e);i&&r&&(r.innerHTML=B(i,Math.round(parseFloat(n.target.value)||0)))}}),e.addEventListener("keydown",n=>{n.key==="Escape"&&(O(),T(),I())}),u("#mktNL",e).addEventListener("submit",n=>{n.preventDefault();const l=u("#mktNLInput",e).value.trim();window.__backerGo("search",l||"high-confidence AI educators under 50K")}),window.__mktEscBound||(document.addEventListener("keydown",qt),window.__mktEscBound=!0)}function qt(t){t.key==="Escape"&&v&&v.querySelector('.mkt[data-market-surface="archive"]')&&(O(),T(),I())}return{render:Bt}})();
