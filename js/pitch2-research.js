/* Three native research windows. Sources and model data stay in their original pages. */
(() => {
  'use strict';

  const root = document.querySelector('[data-research-cards]');
  if (!root) return;
  const liveStatus = document.querySelector('[data-research-status]');
  const studies = {
    flow: { url: 'research-lab/attention-flow.html', title: 'Attention flow: interactive illustrative field', ready: '#attention-canvas' },
    simulation: { url: 'research-lab/attention-simulation.html', title: 'Attention simulation: interactive Backer World', ready: 'iframe' },
    trading: { url: 'research-lab/', title: 'Trading behavior: interactive modeled attention field', ready: '#scene-mount' },
  };

  // Focus native scenes inside the cards. The standalone research pages are unchanged.
  const sharedEmbedCSS = `
    html,body{height:100%!important;min-height:0!important;overflow:hidden!important}
    .skip-link,.topbar{display:none!important}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
  `;
  const embedCSS = {
    flow: `${sharedEmbedCSS}
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
    `,
    simulation: `${sharedEmbedCSS}
      main{height:100%!important;overflow:hidden!important;position:relative!important}
      /* The hosted world's mobile layout places activity below the scene. Crop the
         wrapper around its native canvas; the hosted page remains fully interactive. */
      main>iframe{position:absolute!important;left:-52px!important;top:-50px!important;width:calc(100% + 52px)!important;height:calc(100% + 300px)!important;max-width:none!important}
    `,
    trading: `${sharedEmbedCSS}
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
    `,
  };

  const cards = Array.from(root.querySelectorAll('[data-research-card]'));
  const states = new Map();
  cards.forEach(card => {
    const key = card.dataset.researchCard;
    const study = studies[key];
    if (!study) return;
    states.set(card, { key, study, frame: null, timer: 0, resizeFrame: 0, nestedStarted: false });
  });

  function resizePreview(card) {
    const state = states.get(card);
    if (!state || !state.frame) return;
    try {
      const win = state.frame.contentWindow;
      win.dispatchEvent(new win.Event('resize'));
    } catch { /* Cross-origin inner previews resize with their own viewport. */ }
  }

  function loadPreview(card) {
    const state = states.get(card);
    if (!state || state.frame) return;
    const windowEl = card.querySelector('[data-research-window]');
    const mount = card.querySelector('[data-research-mount]');
    const loading = card.querySelector('[data-research-loading]');
    const loadingCopy = card.querySelector('[data-research-loading-copy]');
    const fail = () => {
      windowEl.setAttribute('aria-busy', 'false');
      loadingCopy.textContent = 'Open the full preview to explore this research.';
      loading.querySelector('.p2r-loading-line').hidden = true;
    };
    const frame = document.createElement('iframe');
    state.frame = frame;
    frame.className = 'p2r-frame';
    frame.title = state.study.title;
    frame.allow = 'fullscreen';
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    const showReady = () => {
      window.clearTimeout(state.timer);
      windowEl.classList.add('is-ready');
      windowEl.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      if (liveStatus) liveStatus.textContent = `${state.study.title} loaded.`;
      window.requestAnimationFrame(() => resizePreview(card));
    };
    frame.addEventListener('error', fail);
    frame.addEventListener('load', () => {
      let ready = false;
      try {
        const doc = frame.contentDocument;
        if (doc && doc.head && doc.querySelector(state.study.ready)) {
          const style = doc.createElement('style');
          style.textContent = embedCSS[state.key];
          doc.head.appendChild(style);
          if (state.key === 'simulation') {
            if (state.nestedStarted) return;
            state.nestedStarted = true;
            const hostedFrame = doc.querySelector('iframe');
            // Observe the hosted frame itself before navigating it. The wrapper's
            // load alone does not establish that the hosted world has rendered.
            hostedFrame.addEventListener('load', showReady, { once: true });
            hostedFrame.addEventListener('error', fail, { once: true });
            window.clearTimeout(state.timer);
            state.timer = window.setTimeout(fail, 18000);
            hostedFrame.src = hostedFrame.getAttribute('src');
            return;
          }
          ready = true;
        }
      } catch { /* The canonical preview links remain available if the host changes. */ }
      if (!ready) {
        fail();
        return;
      }
      showReady();
    });
    frame.src = state.study.url;
    mount.append(frame);
    state.timer = window.setTimeout(fail, 18000);
  }

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target.closest('[data-research-card]');
        const state = states.get(card);
        if (!state) return;
        window.cancelAnimationFrame(state.resizeFrame);
        state.resizeFrame = window.requestAnimationFrame(() => resizePreview(card));
      });
    });
    cards.forEach(card => resizeObserver.observe(card.querySelector('[data-research-window]')));
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadPreview(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '250px 0px' });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(loadPreview);
  }
})();
