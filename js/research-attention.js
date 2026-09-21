import { createAttentionScene } from './research-attention-scene.js?v=20260921-focus-1';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

/** The Research embed owns its controls, scroll presentation, canvas and two border lights. */
export function initAttentionExperience(root) {
  if (!root || root.dataset.attentionInitialized === 'true') return null;
  const find = selector => root.querySelector(selector);
  const track = find('.experience-track');
  const stage = find('.stage');
  const stageWrap = find('.stage-wrap');
  const story = find('.story-controls');
  const topbar = find('.stage-topbar');
  const canvas = find('#attention-canvas');
  const previous = find('.previous');
  const next = find('.next');
  const captions = [...root.querySelectorAll('.caption')];
  const steps = [...root.querySelectorAll('.step-button')];
  if (!track || !stage || !stageWrap || !story || !canvas || !previous || !next || !captions.length) return null;
  root.dataset.attentionInitialized = 'true';

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = createAttentionScene(canvas);
  const glows = [...root.querySelectorAll('.has-card-glow')].map((card, i) => {
    let layer = card.querySelector(':scope > .backer-card-glow-layer');
    if (!layer) {
      layer = document.createElement('span');
      layer.className = 'backer-card-glow-layer';
      layer.setAttribute('aria-hidden', 'true');
      card.appendChild(layer);
    }
    return { card, layer, angle: 145 + i * 120, target: 145, near: false };
  });
  const cleanup = [];
  let reduced = preference.matches;
  let activeStep = -1;
  let geometry = { start: 0, span: 1, expandStart: 0, expandEnd: 1, narrow: false };
  let frame = 0;
  let lastTime = 0;
  let presentationScroll = window.scrollY;
  let scrollVelocity = 0;
  let previousScroll = -1;
  let destroyed = false;
  let visible = false;
  let uiVisible = false;
  let attentionFocused = false;
  let floatingDock = document.querySelector('.backer-float-dock');
  let observedWidth = -1;
  let intersectionObserver = null;

  function on(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  }
  function schedule() {
    if (!frame && !destroyed && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function setAttentionFocused(focused) {
    // The shared dock keeps its own collapsed position/state; only temporary interactivity changes.
    if (!floatingDock?.isConnected) {
      floatingDock = document.querySelector('.backer-float-dock');
      if (floatingDock) floatingDock.inert = focused;
    }
    if (attentionFocused === focused) return;
    attentionFocused = focused;
    document.body.classList.toggle('is-attention-focused', focused);
    if (floatingDock) floatingDock.inert = focused;
  }
  function measure() {
    if (destroyed) return;
    const inset = parseFloat(getComputedStyle(stageWrap).top) || 0;
    // offsetTop is relative to an offset parent; this embed can sit anywhere inside Research.
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    geometry.start = trackTop - inset;
    geometry.span = Math.max(1, track.offsetHeight - stageWrap.offsetHeight);
    geometry.expandStart = Math.max(0, trackTop - window.innerHeight * .66);
    geometry.expandEnd = geometry.start + window.innerHeight * .065;
    geometry.narrow = window.innerWidth <= 760;
    const width = stage.clientWidth;
    if (width !== observedWidth) {
      observedWidth = width;
      stage.style.setProperty('--frame-width', `${width}px`);
    }
    previousScroll = -1;
    schedule();
  }
  function toSceneProgress(ratio) {
    if (ratio < .16) return 0;
    if (ratio < .44) return (ratio - .16) / .28;
    if (ratio < .56) return 1;
    if (ratio < .87) return 1 + (ratio - .56) / .31;
    return 2;
  }
  function updateCaption(index) {
    if (index === activeStep) return;
    activeStep = index;
    stage.dataset.activeStep = String(index + 1);
    captions.forEach((caption, i) => {
      const active = i === index;
      caption.style.opacity = active ? '1' : '0';
      caption.style.transform = active ? 'translateY(0)' : `translateY(${i < index ? -9 : 9}px)`;
      caption.setAttribute('aria-hidden', String(!active));
      caption.inert = !active;
    });
    steps.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = index === 0;
    next.setAttribute('aria-label', index === 2 ? 'Replay experience' : 'Next step');
    if (next.firstElementChild) next.firstElementChild.textContent = '→';
  }
  function goToStep(index) {
    if (!Number.isFinite(index)) return;
    measure();
    const positions = [.09, .50, .93];
    window.scrollTo({
      top: geometry.start + geometry.span * positions[clamp(Math.round(index), 0, 2)],
      behavior: reduced ? 'instant' : 'smooth',
    });
  }
  function updateFrame(growth) {
    const sx = reduced ? 1 : (geometry.narrow ? .93 + growth * .07 : .831 + growth * .169);
    const sy = reduced ? 1 : (geometry.narrow ? .90 + growth * .10 : .69 + growth * .31);
    const ui = reduced ? 1 : smoothstep((growth - .90) / .10);
    stage.style.setProperty('--stage-x', sx.toFixed(5));
    stage.style.setProperty('--stage-y', sy.toFixed(5));
    stage.style.setProperty('--canvas-compensation', (sx / sy).toFixed(5));
    stage.style.setProperty('--ui-x', (1 / sx).toFixed(5));
    stage.style.setProperty('--ui-y', (1 / sy).toFixed(5));
    stage.style.setProperty('--scene-ui', ui.toFixed(4));
    if ((ui > .85) !== uiVisible) {
      uiVisible = ui > .85;
      story.inert = !uiVisible;
      story.style.pointerEvents = uiVisible ? '' : 'none';
      if (topbar) topbar.inert = !uiVisible;
    }
  }
  function animate(now) {
    frame = 0;
    if (destroyed || document.hidden || !visible) return;
    const dt = Math.min(.05, Math.max(.001, (now - (lastTime || now - 16.67)) / 1000));
    lastTime = now;
    const targetScroll = window.scrollY;
    if (reduced) { presentationScroll = targetScroll; scrollVelocity = 0; }
    else {
      // Native scrolling remains intact; this spring only eases the visual presentation.
      const omega = 2 / .22;
      const delta = presentationScroll - targetScroll;
      const decay = Math.exp(-omega * dt);
      const moment = (scrollVelocity + omega * delta) * dt;
      presentationScroll = targetScroll + (delta + moment) * decay;
      scrollVelocity = (scrollVelocity - omega * moment) * decay;
      if (Math.abs(presentationScroll - targetScroll) < .015 && Math.abs(scrollVelocity) < .03) presentationScroll = targetScroll;
    }
    const ratio = clamp((presentationScroll - geometry.start) / geometry.span);
    const progress = toSceneProgress(ratio);
    const growth = smoothstep((presentationScroll - geometry.expandStart) / Math.max(1, geometry.expandEnd - geometry.expandStart));
    // Use the real scroll position at release so the dock returns before the next section appears.
    setAttentionFocused(growth > .90 && targetScroll >= geometry.start && targetScroll < geometry.start + geometry.span);
    if (presentationScroll !== previousScroll) {
      scene.setProgress(reduced ? Math.round(progress) : progress);
      updateCaption(Math.round(progress));
      updateFrame(growth);
      previousScroll = presentationScroll;
    }
    for (let i = 0; i < glows.length; i++) {
      const glow = glows[i];
      const targetAngle = glow.near ? glow.target : 145 + ratio * 210 + i * 120;
      const delta = ((targetAngle - glow.angle + 540) % 360) - 180;
      glow.angle += reduced ? delta : delta * (1 - Math.exp(-dt / .18));
      glow.layer.style.setProperty('--card-glow-angle', glow.angle.toFixed(2));
      glow.layer.style.setProperty('--card-glow-active', glow.near ? '1' : i ? '.42' : '.68');
    }
    scene.render(now);
    // With reduced motion, scroll/resize/pointer events request only the frames that change.
    if (!reduced) schedule();
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    scene.setPaused(true);
    setAttentionFocused(false);
  }
  function resume() {
    if (destroyed || !visible || document.hidden) return;
    presentationScroll = window.scrollY;
    scrollVelocity = 0;
    previousScroll = -1;
    lastTime = 0;
    scene.setPaused(false);
    measure();
    schedule();
  }
  function setVisible(nextVisible) {
    if (visible === nextVisible) return;
    visible = nextVisible;
    if (visible) resume();
    else { stop(); glows.forEach(glow => { glow.near = false; }); }
  }
  function checkVisibility() {
    const rect = root.getBoundingClientRect();
    setVisible(rect.bottom > 0 && rect.top < window.innerHeight);
  }
  function syncMotionPreference() {
    reduced = preference.matches;
    scene.setReducedMotion(reduced);
    previousScroll = -1;
    measure();
    schedule();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    scene.destroy();
    resizeObserver.disconnect();
    intersectionObserver?.disconnect();
    cleanup.forEach(remove => remove());
    delete root.dataset.attentionInitialized;
  }

  steps.forEach(button => on(button, 'click', () => goToStep(Number(button.dataset.target))));
  on(previous, 'click', () => goToStep(Math.max(0, activeStep - 1)));
  on(next, 'click', () => goToStep(activeStep === 2 ? 0 : activeStep + 1));
  on(stage, 'keydown', event => {
    if (event.target !== stage) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goToStep(Math.min(2, activeStep + 1)); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToStep(Math.max(0, activeStep - 1)); }
  });
  on(root, 'pointermove', event => {
    if (!visible || event.pointerType === 'touch') return;
    for (const glow of glows) {
      const rect = glow.card.getBoundingClientRect();
      glow.near = event.clientX > rect.left - 64 && event.clientX < rect.right + 64 && event.clientY > rect.top - 64 && event.clientY < rect.bottom + 64;
      glow.target = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI + 90;
    }
    schedule();
  }, { passive: true });
  on(root, 'pointerleave', () => { glows.forEach(glow => { glow.near = false; }); schedule(); });
  on(preference, 'change', syncMotionPreference);
  on(document, 'visibilitychange', () => { if (document.hidden) stop(); else resume(); });
  on(window, 'scroll', () => { if (!intersectionObserver) checkVisibility(); schedule(); }, { passive: true });
  on(window, 'resize', () => { measure(); if (!intersectionObserver) checkVisibility(); }, { passive: true });
  on(window, 'load', measure, { once: true });
  on(window, 'pageshow', () => { checkVisibility(); if (visible) resume(); });
  on(window, 'pagehide', event => { stop(); if (!event.persisted) destroy(); });
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(track);
  resizeObserver.observe(stageWrap);
  const intro = find('.intro');
  if (intro) resizeObserver.observe(intro);
  // Font/image/content changes above the embed can move its document position without resizing it.
  if (document.body) resizeObserver.observe(document.body);
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => {
      if (entries.length) setVisible(entries[0].isIntersecting);
    }, { threshold: 0 });
    intersectionObserver.observe(root);
  }
  measure();
  syncMotionPreference();
  updateCaption(0);
  story.inert = true;
  story.style.pointerEvents = 'none';
  if (topbar) topbar.inert = true;
  scene.setPaused(true);
  checkVisibility();
  if (document.fonts?.ready) document.fonts.ready.then(() => { if (!destroyed) measure(); });
  return { destroy };
}

for (const root of document.querySelectorAll('.attention-experience')) initAttentionExperience(root);
