(()=>{"use strict";const c=document.querySelector("[data-research-cards]");if(!c)return;const f=document.querySelector("[data-research-status]"),b={flow:{url:"research-lab/attention-flow.html",title:"Attention flow: interactive illustrative field",ready:"#attention-canvas"},simulation:{url:"research-lab/attention-simulation.html",title:"Attention simulation: interactive Backer World",ready:"iframe"},trading:{url:"research-lab/",title:"Trading behavior: interactive modeled attention field",ready:"#scene-mount"}},d=`
    html,body{height:100%!important;min-height:0!important;overflow:hidden!important}
    .skip-link,.topbar{display:none!important}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
  `,x={flow:`${d}
      .flow-app,.flow-layout{height:100%!important;min-height:0!important}
      .flow-layout{display:block!important}
      .flow-setup,.flow-readout,.flow-study,.flow-question-bar{display:none!important}
      .flow-field{height:100%!important;min-height:0!important;grid-template-rows:minmax(0,1fr) auto!important}
      .flow-canvas-wrap,#attention-canvas{min-height:0!important}
      .flow-stage-labels{top:17px!important;left:12px!important;right:12px!important;font-size:7px!important;letter-spacing:0!important}
      .flow-stage-labels b{display:block!important;margin:0 0 4px!important;font-size:8px!important}
      .field-boundary-label,.flow-count,.flow-legend{display:none!important}
      .flow-playback{padding:9px 12px!important;gap:9px!important;flex-wrap:wrap!important}
      .flow-playback-controls{gap:10px!important;justify-content:space-between!important;width:100%!important}
      .flow-playback-controls button{font-size:9px!important;min-height:30px!important}
      .flow-playback-controls label{display:none!important}
      .flow-time{flex:1 0 100%!important;min-width:0!important;display:flex!important;font-size:7px!important}
      .marker-inspector{max-width:calc(100% - 24px)!important;right:12px!important;top:52px!important;font-size:10px!important}
    `,simulation:d,trading:`${d}
      :root{--topbar-h:0px!important;--dock-h:0px!important}
      .lab-app,.lab-grid{height:100%!important;min-height:0!important}
      .lab-grid{display:block!important}
      .control-rail,.run-dock,.forecast-surface,.mobile-profile-button{display:none!important}
      .field-stage{height:100%!important;min-height:0!important;--workbench-w:0px!important}
      .field-stage.is-flow-mode .scene-mount{display:block!important;inset:0!important;width:100%!important;height:100%!important}
      .field-stage.is-flow-mode .field-vignette,.field-stage.is-flow-mode .event-labels{display:block!important;inset:0!important}
      .field-stage.is-flow-mode .loading-state{right:0!important}
      .field-caption,.field-key,.simulation-watermark,.graph-gesture-hint{display:none!important}
      .field-stage.is-flow-mode .graph-stage-labels{display:grid!important;inset:auto 8px 16px!important;font-size:6px!important;letter-spacing:0!important}
      .graph-stage-labels b{display:none!important}
      .graph-camera-controls{top:12px!important;right:12px!important;left:auto!important;max-width:calc(100% - 24px)!important;gap:4px!important}
      .graph-camera-controls button{min-width:28px!important;min-height:28px!important;font-size:11px!important}
      .graph-camera-controls output{font-size:9px!important}
      .profile-panel{inset:0 0 0 auto!important;width:100%!important;height:100%!important;max-width:100%!important;overflow:auto!important}
    `},s=Array.from(c.querySelectorAll("[data-research-card]")),l=new Map;s.forEach(e=>{const t=e.dataset.researchCard,r=b[t];r&&l.set(e,{key:t,study:r,frame:null,timer:0,resizeFrame:0,nestedStarted:!1})});function u(e){const t=l.get(e);if(!(!t||!t.frame))try{const r=t.frame.contentWindow;r.dispatchEvent(new r.Event("resize"))}catch{}}function h(e){const t=l.get(e);if(!t||t.frame)return;const r=e.querySelector("[data-research-window]"),p=e.querySelector("[data-research-mount]"),i=e.querySelector("[data-research-loading]"),v=e.querySelector("[data-research-loading-copy]"),n=()=>{r.setAttribute("aria-busy","false"),v.textContent="Open the full preview to explore this research.",i.querySelector(".p2r-loading-line").hidden=!0},a=document.createElement("iframe");t.frame=a,a.className="p2r-frame",a.title=t.study.title,a.allow="fullscreen",a.setAttribute("referrerpolicy","strict-origin-when-cross-origin");const w=()=>{window.clearTimeout(t.timer),r.classList.add("is-ready"),r.setAttribute("aria-busy","false"),i.hidden=!0,f&&(f.textContent=`${t.study.title} loaded.`),window.requestAnimationFrame(()=>u(e))};a.addEventListener("error",n),a.addEventListener("load",()=>{let g=!1;try{const o=a.contentDocument;if(o&&o.head&&o.querySelector(t.study.ready)){const y=o.createElement("style");if(y.textContent=x[t.key],o.head.appendChild(y),t.key==="simulation"){if(t.nestedStarted)return;t.nestedStarted=!0;const m=o.querySelector("iframe");m.addEventListener("load",w,{once:!0}),m.addEventListener("error",n,{once:!0}),window.clearTimeout(t.timer),t.timer=window.setTimeout(n,18e3),m.src=m.getAttribute("src");return}g=!0}}catch{}if(!g){n();return}w()}),a.src=t.study.url,p.append(a),t.timer=window.setTimeout(n,18e3)}if("ResizeObserver"in window){const e=new ResizeObserver(t=>{t.forEach(r=>{const p=r.target.closest("[data-research-card]"),i=l.get(p);i&&(window.cancelAnimationFrame(i.resizeFrame),i.resizeFrame=window.requestAnimationFrame(()=>u(p)))})});s.forEach(t=>e.observe(t.querySelector("[data-research-window]")))}if("IntersectionObserver"in window){const e=new IntersectionObserver(t=>{t.forEach(r=>{r.isIntersecting&&(h(r.target),e.unobserve(r.target))})},{threshold:.01,rootMargin:"250px 0px"});s.forEach(t=>e.observe(t))}else s.forEach(h)})();
