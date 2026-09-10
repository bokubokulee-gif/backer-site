/* One active, native research preview. No copies of model data or charts. */
(() => {
  'use strict';

  const root = document.querySelector('[data-research-theater]');
  if (!root) return;

  const studies = {
    flow: {
      title: 'Where does attention move next?',
      description: 'Follow attention across communities. Change how content is distributed and watch the authored scenario unfold.',
      url: 'research-lab/attention-flow.html',
      iframeTitle: 'Attention Flow: interactive illustrative attention field',
      hint: 'Change a scenario. Select a marker to inspect its path.',
      evidence: 'Illustrative scenario',
      boundary: '5,000 modeled markers. The readouts below come directly from this authored preview.',
      scenarios: [['baseline', 'Baseline'], ['diverse-ranking', 'Diverse ranking'], ['bridge-boost', 'Bridge-node boost']],
      metrics: [['Notice share', '#metric-notice'], ['Return share', '#metric-return'], ['Commit share', '#metric-commit']],
    },
    simulation: {
      title: 'Why does someone choose to act?',
      description: 'Enter a shared world of 50 fictional people. Inspect how content, memory, and social influence shape their next decision.',
      url: 'research-lab/attention-simulation.html',
      iframeTitle: 'Attention Simulation: 50 fictional people in interactive Backer World',
      hint: 'Select a person in the world to inspect their simulated decisions.',
      evidence: 'Fictional people · simulated behavior',
      boundary: 'A behavioral sandbox using public content. All decisions and trading activity are simulated.',
      scenarios: [],
      metrics: [],
    },
    trading: {
      title: 'When does conviction become a position?',
      description: 'Explore the path from exposure to commitment. Compare how social influence and friction change the published model projection.',
      url: 'research-lab/',
      iframeTitle: 'Trading Behavior: interactive modeled attention and commitment field',
      hint: 'Change a scenario. Drag the field or select a modeled trader.',
      evidence: 'Published model projection',
      boundary: 'Observed market signals and simulated behavior are separate layers. Outcomes have not been validated.',
      scenarios: [['baseline', 'Baseline'], ['social-proof', 'Social proof'], ['lower-friction', 'Lower friction']],
      metrics: [['Expected fills', '#forecast-expected'], ['Model book', '#simulated-book-probability']],
    },
  };

  // These styles only focus the embedded view; canonical research pages are unchanged.
  const sharedEmbedCSS = `
    html,body{height:100%!important;min-height:0!important;overflow:hidden!important}
    .skip-link,.topbar{display:none!important}
  `;
  const embedCSS = {
    flow: `${sharedEmbedCSS}
      .flow-app,.flow-layout{height:100%!important;min-height:0!important}
      .flow-layout{display:block!important}
      .flow-setup,.flow-readout,.flow-study,.flow-question-bar{display:none!important}
      .flow-field{height:100%!important;min-height:0!important;grid-template-rows:minmax(0,1fr) auto!important}
      .flow-canvas-wrap,#attention-canvas{min-height:0!important}
      .flow-playback{padding:13px 18px!important;gap:15px!important}
      .flow-stage-labels{top:23px!important;font-size:9px!important}
      .field-boundary-label{display:none!important}
      .field-boundary-label strong{display:none!important}
      .flow-count{display:none!important}
      .flow-time{flex-basis:auto!important;min-width:120px!important;flex:1!important}
      .flow-legend{bottom:15px!important}
      .marker-inspector{max-width:calc(100% - 28px)!important}
      @media(max-width:520px){
        .flow-stage-labels{top:20px!important;font-size:7px!important;letter-spacing:0!important}
        .flow-stage-labels b{display:block!important;margin:0 0 4px!important}
        .field-boundary-label{top:59px!important;left:12px!important;font-size:6px!important}
        .flow-legend{gap:10px!important;font-size:6px!important;left:12px!important}
        .flow-playback{padding:10px 12px!important;gap:10px!important;flex-wrap:wrap!important}
        .flow-playback-controls{gap:9px!important}
        .flow-playback-controls button{font-size:8px!important}
        .flow-playback-controls label{display:none!important}
        .flow-time{flex-basis:100%!important;display:flex!important}
      }
    `,
    trading: `${sharedEmbedCSS}
      :root{--topbar-h:0px!important;--dock-h:0px!important}
      .lab-app,.lab-grid{height:100%!important;min-height:0!important}
      .lab-grid{display:block!important}
      .control-rail,.run-dock,.forecast-surface,.mobile-profile-button{display:none!important}
      .field-stage{height:100%!important;--workbench-w:0px!important}
      .field-stage.is-flow-mode .scene-mount{display:block!important;inset:0!important;width:100%!important;height:100%!important}
      .field-stage.is-flow-mode .field-vignette,.field-stage.is-flow-mode .event-labels{display:block!important;inset:0!important}
      .field-stage.is-flow-mode .field-caption{display:flex!important;right:17px!important}
      .field-stage.is-flow-mode .field-key{display:flex!important;left:50%!important;transform:translateX(-50%)!important;bottom:12px!important;white-space:nowrap!important}
      .field-stage.is-flow-mode .loading-state{right:0!important}
      .field-stage.is-flow-mode .simulation-watermark{display:block!important;right:16px!important}
      .field-stage.is-flow-mode .graph-stage-labels{display:grid!important;right:0!important;bottom:48px!important;font-size:8px!important}
      .profile-panel{inset:0 0 0 auto!important;height:100%!important;max-width:100%!important}
      @media(max-width:520px){
        .field-caption{font-size:6px!important;left:12px!important;right:12px!important}
        .field-caption #field-source-line{max-width:155px!important;text-align:right!important}
        .field-stage.is-flow-mode .field-key{gap:8px!important;font-size:5px!important;max-width:calc(100% - 12px)!important;padding:7px!important}
        .field-stage.is-flow-mode .graph-stage-labels{font-size:6px!important;letter-spacing:0!important}
        .field-stage.is-flow-mode .graph-stage-labels b{display:none!important}
      }
    `,
  };

  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panel = root.querySelector('[role="tabpanel"]');
  const title = root.querySelector('[data-research-title]');
  const description = root.querySelector('[data-research-description]');
  const openLinks = root.querySelectorAll('[data-research-open]');
  const controls = root.querySelector('[data-research-scenarios]');
  const hint = root.querySelector('[data-research-hint]');
  const evidence = root.querySelector('[data-research-evidence]');
  const boundary = root.querySelector('[data-research-boundary]');
  const metrics = root.querySelector('[data-research-metrics]');
  const frameWrap = root.querySelector('[data-research-frame-wrap]');
  const mount = root.querySelector('[data-research-mount]');
  const loading = root.querySelector('[data-research-loading]');
  const loadingTitle = root.querySelector('[data-research-loading-title]');
  const loadingCopy = root.querySelector('[data-research-loading-copy]');
  const liveStatus = root.querySelector('[data-research-status]');
  let active = 'flow';
  let visible = false;
  let frame = null;
  let metricObserver = null;
  let loadTimeout = 0;
  let resizeFrame = 0;

  function clearPreview() {
    window.clearTimeout(loadTimeout);
    if (metricObserver) metricObserver.disconnect();
    metricObserver = null;
    mount.replaceChildren();
    frame = null;
    frameWrap.classList.remove('is-ready');
  }

  function readNativeMetrics(doc, study) {
    study.metrics.forEach(([, selector], index) => {
      const source = doc.querySelector(selector);
      const output = metrics.querySelector(`[data-metric-index="${index}"]`);
      if (source && output) output.textContent = source.textContent.trim() || '—';
    });
  }

  function resizeNativePreview() {
    if (!frame) return;
    try {
      const win = frame.contentWindow;
      win.dispatchEvent(new win.Event('resize'));
    } catch { /* Cross-origin hosted previews handle their own resize. */ }
  }

  function showLoadingFailure() {
    loadingTitle.textContent = 'The preview is taking longer to load.';
    loadingCopy.textContent = 'You can open the full research experience directly.';
    panel.setAttribute('aria-busy', 'false');
  }

  function loadPreview() {
    if (!visible || frame) return;
    const study = studies[active];
    const selectedStudy = active;
    loading.hidden = false;
    loadingTitle.textContent = 'Opening the research preview';
    loadingCopy.textContent = 'The interactive scene will appear here.';
    panel.setAttribute('aria-busy', 'true');
    frame = document.createElement('iframe');
    const currentFrame = frame;
    frame.className = 'p2r-frame';
    frame.title = study.iframeTitle;
    frame.allow = 'fullscreen';
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.addEventListener('error', showLoadingFailure);
    frame.addEventListener('load', () => {
      if (currentFrame !== frame || selectedStudy !== active) return;
      window.clearTimeout(loadTimeout);
      let nativeReady = false;
      try {
        const doc = frame.contentDocument;
        if (doc && doc.body && embedCSS[selectedStudy]) {
          const style = doc.createElement('style');
          style.textContent = embedCSS[selectedStudy];
          doc.head.appendChild(style);
          readNativeMetrics(doc, study);
          metricObserver = new MutationObserver(() => readNativeMetrics(doc, study));
          study.metrics.forEach(([, selector]) => {
            const node = doc.querySelector(selector);
            if (node) metricObserver.observe(node, { childList: true, characterData: true, subtree: true });
          });
          nativeReady = Boolean(doc.querySelector(selectedStudy === 'flow' ? '#attention-canvas' : '#scene-mount'));
        } else if (selectedStudy === 'simulation') {
          nativeReady = Boolean(doc && doc.querySelector('iframe'));
        }
      } catch { /* The permanent link remains available if the host changes origin. */ }
      if (!nativeReady) {
        showLoadingFailure();
        panel.setAttribute('aria-busy', 'false');
        return;
      }
      controls.querySelectorAll('button').forEach(button => { button.disabled = false; });
      frameWrap.classList.add('is-ready');
      loading.hidden = true;
      panel.setAttribute('aria-busy', 'false');
      liveStatus.textContent = `${study.iframeTitle} loaded.`;
      window.requestAnimationFrame(resizeNativePreview);
    });
    frame.src = study.url;
    mount.append(frame);
    loadTimeout = window.setTimeout(showLoadingFailure, 16000);
  }

  function activateStudy(key, focusTab = false) {
    const study = studies[key];
    if (!study) return;
    active = key;
    clearPreview();
    tabs.forEach(tab => {
      const selected = tab.dataset.researchTab === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        panel.setAttribute('aria-labelledby', tab.id);
        if (focusTab) tab.focus();
      }
    });
    title.textContent = study.title;
    description.textContent = study.description;
    hint.textContent = study.hint;
    evidence.textContent = study.evidence;
    boundary.textContent = study.boundary;
    openLinks.forEach(link => { link.href = study.url; });
    frameWrap.dataset.research = key;
    metrics.replaceChildren();
    study.metrics.forEach(([label], index) => {
      const item = document.createElement('div');
      item.className = 'p2r-metric';
      const term = document.createElement('dt');
      term.textContent = label;
      const value = document.createElement('dd');
      value.dataset.metricIndex = index;
      value.textContent = '—';
      item.append(term, value);
      metrics.append(item);
    });
    metrics.hidden = !study.metrics.length;
    controls.replaceChildren();
    controls.hidden = !study.scenarios.length;
    study.scenarios.forEach(([id, label], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'p2r-scenario';
      button.textContent = label;
      button.disabled = true;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        try {
          const source = frame.contentDocument.querySelector(`[data-scenario="${id}"]`);
          if (!source) return;
          source.click();
          controls.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          liveStatus.textContent = `${label} scenario selected.`;
        } catch { /* Full preview link remains available. */ }
      });
      controls.append(button);
    });
    loading.hidden = false;
    loadPreview();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.researchTab !== active) activateStudy(tab.dataset.researchTab);
    });
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault();
      activateStudy(tabs[target].dataset.researchTab, true);
    });
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resizeNativePreview);
    }).observe(frameWrap);
  }
  activateStudy(active);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      visible = true;
      loadPreview();
      observer.disconnect();
    }, { threshold: 0.01, rootMargin: '300px 0px' });
    observer.observe(frameWrap);
  } else {
    visible = true;
    loadPreview();
  }
})();
