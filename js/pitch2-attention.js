/* A decorative second beat after the shared headline letter interaction. */
(() => {
  'use strict';

  const BUBBLE_BEAT = 420;
  const TURN_TIME = 320;
  const EYES_HOLD = 1050;
  const TEXT_HOLD = 900;
  const TAP_SLOP = 9;

  function mount() {
    const root = document.querySelector('.hero-title .p2-headline-effect[data-bubble-text]');
    if (!root || root.dataset.attentionReady) return;
    const letters = [...root.querySelectorAll('.bubble-letter')];
    const phrase = letters.map(letter => letter.textContent.replace(/\u00a0/g, ' ')).join('');
    const match = /\battention\b/.exec(phrase);
    if (!match) return;
    const word = letters.slice(match.index, match.index + match[0].length);
    if (word.length !== 9) return;

    // Keep all original glyphs flat and in order: pitch2.js measures their offsets
    // and the existing gradient rules depend on their nth-child positions.
    word.forEach(letter => letter.classList.add('p2-attention-letter'));
    const eyes = document.createElement('span');
    eyes.className = 'p2-attention-eyes';
    eyes.setAttribute('aria-hidden', 'true');
    eyes.textContent = '👀';
    root.appendChild(eyes);
    root.dataset.attentionReady = 'true';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let bounds;
    let timer = 0;
    let generation = 0;
    let hovering = false;
    let touch = null;

    function clearTimer() {
      clearTimeout(timer);
      timer = 0;
      generation += 1;
    }

    function restore() {
      clearTimer();
      hovering = false;
      root.classList.remove('p2-attention-is-eyes');
    }

    function later(callback, delay) {
      const current = generation;
      timer = setTimeout(() => {
        timer = 0;
        if (current === generation && !reducedMotion.matches && !document.hidden) callback();
      }, delay);
    }

    function showEyes() {
      root.classList.add('p2-attention-is-eyes');
      later(() => {
        root.classList.remove('p2-attention-is-eyes');
        if (hovering) later(showEyes, TURN_TIME + TEXT_HOLD);
      }, TURN_TIME + EYES_HOLD);
    }

    function begin(repeat) {
      if (reducedMotion.matches || document.hidden) return;
      clearTimer();
      hovering = repeat;
      root.classList.remove('p2-attention-is-eyes');
      later(showEyes, BUBBLE_BEAT);
    }

    function measure() {
      const first = word[0];
      const last = word[word.length - 1];
      // offset metrics ignore the running bubble transform, so the emoji remains
      // centered on the original word while its letters move independently.
      bounds = {
        left: first.offsetLeft,
        top: Math.min(...word.map(letter => letter.offsetTop)),
        width: last.offsetLeft + last.offsetWidth - first.offsetLeft,
        height: Math.max(...word.map(letter => letter.offsetHeight))
      };
      eyes.style.left = `${bounds.left}px`;
      eyes.style.top = `${bounds.top}px`;
      eyes.style.width = `${bounds.width}px`;
      eyes.style.height = `${bounds.height}px`;
    }

    function overWord(event) {
      if (!bounds || !root.offsetWidth || !root.offsetHeight) return false;
      const rect = root.getBoundingClientRect();
      const x = (event.clientX - rect.left) * root.offsetWidth / rect.width;
      const y = (event.clientY - rect.top) * root.offsetHeight / rect.height;
      return x >= bounds.left && x <= bounds.left + bounds.width
        && y >= bounds.top && y <= bounds.top + bounds.height;
    }

    function isTapPointer(event) {
      return event.pointerType === 'touch' || event.pointerType === 'pen';
    }

    function trackHover(event) {
      if (isTapPointer(event)) return;
      const inside = !event.buttons && overWord(event);
      if (inside && !hovering) begin(true);
      else if (!inside && hovering) restore();
    }

    root.addEventListener('pointerover', trackHover, { passive: true });
    root.addEventListener('pointermove', event => {
      trackHover(event);
      if (touch && event.pointerId === touch.id
        && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > TAP_SLOP) {
        touch = null;
        restore();
      }
    }, { passive: true });
    root.addEventListener('pointerleave', event => {
      if (!isTapPointer(event)) restore();
      // Touch pointerleave follows pointerup; let an accepted tap finish its one
      // cycle. Leaving while still pressed does cancel the pending tap.
      else if (touch) { touch = null; restore(); }
    }, { passive: true });
    root.addEventListener('pointerdown', event => {
      if (!isTapPointer(event)) return;
      restore();
      touch = overWord(event) ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    }, { passive: true });
    root.addEventListener('pointerup', event => {
      if (!touch || touch.id !== event.pointerId) return;
      const tapped = Math.hypot(event.clientX - touch.x, event.clientY - touch.y) <= TAP_SLOP && overWord(event);
      touch = null;
      if (tapped) begin(false);
    }, { passive: true });
    root.addEventListener('pointercancel', () => { touch = null; restore(); }, { passive: true });
    document.addEventListener('pointerdown', event => {
      if (!root.contains(event.target)) { touch = null; restore(); }
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { touch = null; restore(); } });
    window.addEventListener('blur', () => { touch = null; restore(); });
    const motionChanged = () => { touch = null; restore(); };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChanged);
    else reducedMotion.addListener(motionChanged);

    measure();
    if (document.fonts) document.fonts.ready.then(measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(root);
    else window.addEventListener('resize', measure, { passive: true });
  }

  // This deferred file follows pitch2.js. The shared splitter's DOMContentLoaded
  // listener must finish before we tag the original letters.
  if (document.readyState === 'complete') mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
