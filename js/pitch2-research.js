/* Recorded research scenes keep the pitch light; links open the complete live studies. */
(() => {
  'use strict';

  const root = document.querySelector('[data-research-cards]');
  if (!root) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = [];

  function updateControl(state) {
    const playing = (!state.video.paused && !state.video.ended) || (state.playPending && shouldPlay(state));
    state.button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} recorded ${state.title} preview`);
    state.button.title = playing ? 'Pause preview' : 'Play preview';
    state.icon.textContent = playing ? 'Ⅱ' : '▶';
  }

  function loadSource(state) {
    if (state.loaded || state.failed) return;
    state.loaded = true;
    state.video.src = state.video.dataset.src;
    // preload="none" leaves transfer to the visible playback request.
    state.video.load();
  }

  function shouldPlay(state) {
    return state.visible && !document.hidden && !state.failed && !state.manuallyPaused
      && !state.autoplayBlocked && (!reducedMotion.matches || state.manualMotion);
  }

  function syncPlayback(state) {
    if (!shouldPlay(state)) {
      state.video.pause();
      updateControl(state);
      return;
    }
    loadSource(state);
    if (state.playPending || !state.video.paused) return;
    state.playPending = true;
    const request = state.video.play();
    updateControl(state);
    if (request && typeof request.then === 'function') {
      request.catch(error => {
        // An offscreen pause can abort a pending play. Autoplay denial keeps a usable Play button.
        if (error.name !== 'AbortError') state.autoplayBlocked = true;
      }).finally(() => {
        state.playPending = false;
        updateControl(state);
        // A rapid leave/re-enter can pause the pending request before it settles.
        if (shouldPlay(state) && state.video.paused) syncPlayback(state);
      });
    } else {
      state.playPending = false;
      updateControl(state);
    }
  }

  function failPreview(state) {
    state.failed = true;
    state.video.pause();
    state.window.classList.remove('has-frame');
    state.button.hidden = true;
  }

  root.querySelectorAll('[data-research-card]').forEach(card => {
    const windowEl = card.querySelector('[data-research-window]');
    const video = card.querySelector('[data-research-video]');
    const button = card.querySelector('[data-research-playback]');
    if (!windowEl || !video || !button) return;
    const state = {
      window: windowEl,
      video,
      button,
      icon: button.querySelector('[data-research-playback-icon]'),
      title: video.dataset.title,
      loaded: false,
      visible: false,
      failed: false,
      manuallyPaused: false,
      manualMotion: false,
      autoplayBlocked: false,
      playPending: false,
    };
    states.push(state);
    video.muted = true;
    video.defaultMuted = true;
    video.addEventListener('loadeddata', () => {
      if (!state.failed) windowEl.classList.add('has-frame');
    });
    video.addEventListener('playing', () => {
      if (!shouldPlay(state)) video.pause();
      else windowEl.classList.add('has-frame');
      updateControl(state);
    });
    video.addEventListener('pause', () => updateControl(state));
    video.addEventListener('error', () => failPreview(state));
    button.addEventListener('click', () => {
      if ((!video.paused || state.playPending) && !state.manuallyPaused && !state.autoplayBlocked) {
        state.manuallyPaused = true;
        state.manualMotion = false;
      } else {
        state.manuallyPaused = false;
        state.manualMotion = true;
        state.autoplayBlocked = false;
        const bounds = windowEl.getBoundingClientRect();
        state.visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      }
      syncPlayback(state);
    });
    button.hidden = false;
    updateControl(state);
  });

  if ('IntersectionObserver' in window) {
    const sourceObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const state = states.find(item => item.window === entry.target);
        if (state) loadSource(state);
        sourceObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '250px 0px' });
    const visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = states.find(item => item.window === entry.target);
        if (!state) return;
        state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.05;
        syncPlayback(state);
      });
    }, { threshold: [0, 0.05] });
    states.forEach(state => {
      sourceObserver.observe(state.window);
      visibilityObserver.observe(state.window);
    });
  } else {
    // Preserve visible-only playback in browsers without IntersectionObserver.
    let visibilityFrame = 0;
    const checkVisibility = () => {
      visibilityFrame = 0;
      states.forEach(state => {
        const bounds = state.window.getBoundingClientRect();
        if (bounds.bottom > -250 && bounds.top < window.innerHeight + 250) loadSource(state);
        state.visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
        syncPlayback(state);
      });
    };
    const scheduleVisibility = () => {
      if (!visibilityFrame) visibilityFrame = window.requestAnimationFrame(checkVisibility);
    };
    window.addEventListener('scroll', scheduleVisibility, { passive: true });
    window.addEventListener('resize', scheduleVisibility, { passive: true });
    checkVisibility();
  }
  document.addEventListener('visibilitychange', () => states.forEach(syncPlayback));
  reducedMotion.addEventListener('change', () => {
    states.forEach(state => {
      state.manualMotion = false;
      syncPlayback(state);
    });
  });
})();
