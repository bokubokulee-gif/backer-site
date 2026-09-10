/* The existing Market remains native and scrollable; a click opens it in full. */
(() => {
  'use strict';
  const preview = document.querySelector('[data-market-preview]');
  if (!preview) return;
  const windowEl = preview.querySelector('[data-market-window]');
  const mount = preview.querySelector('[data-market-mount]');
  const loading = preview.querySelector('[data-market-loading]');
  const loadingCopy = preview.querySelector('[data-market-loading-copy]');
  const target = new URL('backerdemo.html#trades', document.baseURI).href;
  const viewportWidth = 1440;
  let previewScale = 1;
  let started = false;

  // Keep the iframe's desktop viewport fixed. Only its complete rendered surface
  // scales, so responsive breakpoints, native text, navigation and cards stay exact.
  const resizePreview = width => {
    if (!(width > 0)) return;
    previewScale = Math.min(1, width / viewportWidth);
    mount.style.setProperty('--p2m-scale', String(previewScale));
  };
  resizePreview(mount.getBoundingClientRect().width);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => resizePreview(entry.contentRect.width));
    });
    observer.observe(mount);
  } else window.addEventListener('resize', () => resizePreview(mount.getBoundingClientRect().width), { passive: true });

  function load() {
    if (started) return;
    started = true;
    windowEl.setAttribute('aria-busy', 'true');
    const frame = document.createElement('iframe');
    frame.className = 'p2m-frame';
    frame.title = 'Backer Market preview. Scroll to explore; click to enter the full market.';
    frame.tabIndex = -1;
    frame.loading = 'eager';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    let observer;
    let timer;
    const fail = () => {
      windowEl.setAttribute('aria-busy', 'false');
      loadingCopy.textContent = 'The market preview could not load. Open Backer Market directly.';
    };
    const enter = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(target);
    };

    frame.addEventListener('error', fail);
    frame.addEventListener('load', () => {
      let doc;
      try { doc = frame.contentDocument; } catch { fail(); return; }
      if (!doc || !doc.body) { fail(); return; }
      try {
        // Preserve the complete native UI. Only correct its iframe scroll root.
        const style = doc.createElement('style');
        style.textContent = `
          html{height:100%!important;overflow-y:auto!important;overscroll-behavior-y:contain;scroll-behavior:auto!important}
          body{min-height:100%!important;overflow:visible!important}
        `;
        doc.head.appendChild(style);

        let gesture = null;
        let moved = false;
        doc.addEventListener('pointerdown', event => {
          gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, scale: previewScale };
          moved = false;
        }, { capture: true, passive: true });
        doc.addEventListener('pointermove', event => {
          if (!gesture || gesture.id !== event.pointerId) return;
          // Pointer coordinates are in the fixed iframe viewport. Convert movement
          // back to visible CSS pixels so drag tolerance stays stable at every size.
          if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) * gesture.scale > 9) moved = true;
        }, { capture: true, passive: true });
        doc.addEventListener('pointercancel', () => { moved = true; gesture = null; }, { capture: true, passive: true });
        doc.addEventListener('click', event => {
          // Native wheel and touch scrolling are untouched. Drag selection is not a click-through.
          event.preventDefault();
          event.stopImmediatePropagation();
          const selection = doc.getSelection();
          if (moved || (selection && !selection.isCollapsed)) { gesture = null; return; }
          gesture = null;
          window.location.assign(target);
        }, true);
        doc.addEventListener('submit', enter, true);
        doc.addEventListener('keydown', event => {
          if (event.key === 'Enter' || (event.key === ' ' && event.target.closest('button,a,input,select,textarea'))) enter(event);
        }, true);

        const check = () => {
          try {
            if (doc.querySelector('.mkt-fatal, .mkt-empty.is-error')) { fail(); if (observer) observer.disconnect(); return; }
            if (!doc.querySelector('#app .mkt .mkt-catalog-card')) return;
            windowEl.classList.add('is-ready');
            windowEl.setAttribute('aria-busy', 'false');
            loading.hidden = true;
            window.clearTimeout(timer);
            if (observer) observer.disconnect();
          } catch { fail(); if (observer) observer.disconnect(); }
        };
        observer = new MutationObserver(check);
        observer.observe(doc.body, { childList: true, subtree: true });
        check();
      } catch { fail(); if (observer) observer.disconnect(); }
    });
    timer = window.setTimeout(fail, 25000);
    frame.src = target;
    mount.appendChild(frame);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: '400px 0px', threshold: 0.01 });
    observer.observe(preview);
  } else load();
})();
