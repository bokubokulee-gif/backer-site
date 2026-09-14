/* Directional border interaction adapted from the supplied React GlowingEffect.
   One document-level scheduler serves static cards and dynamically rendered grids. */
(function () {
  'use strict';
  if (window.BackerCardGlow) return;

  var SELECTOR = [
    '.mkt-catalog-card', '.mkt-proposal-card', '.mkt-position-card',
    '.mkt-personalization', '.mkt-empty', '.mkt-contract',
    '.m2-profile-card', '.m2-feed-card', '.m2-work-card', '.m2-rail-card',
    '.m2-instrument-module', '.m2-proof-callout', '.m2-ticket',
    '.sxr-card', '.q-card', '.surface', '.mini-card', '.benefit', '.score-card',
    '.val-lane', '.val-chart', '.val-fact', '.val-node-mkt',
    '.person', '.p2r-card', '.p2m-window', '.p2-creator-share',
    '.p2-business-questions', '.p2-decision-panel',
    '.ccard', '.chart-card', '.score-block', '.terms', '.ai-panel',
    '.claim', '.open-note', '.proof-glass',
    '.mdp-status-card', '.pt-block', '.pt-strict-panel', '.waitlist-card'
  ].join(',');
  var PROXIMITY = 64;
  var INACTIVE_ZONE = 0.01;
  var TOUCH_DURATION = 650;
  var registry = new Map();
  var visible = new Set();
  var pendingRoots = new Set();
  var pendingRemoval = false;
  var frame = 0;
  var lastFrame = 0;
  var pointer = { x: 0, y: 0, valid: false };
  var keyboardInput = false;
  var touchCard = null;
  var touchTimer = 0;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var coarse = window.matchMedia('(pointer: coarse)');
  var intersection = null;

  function schedule() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(paint);
  }

  function register(card) {
    if (registry.has(card) || !card.isConnected) return;
    var layer = document.createElement('span');
    layer.className = 'backer-card-glow-layer';
    layer.setAttribute('aria-hidden', 'true');
    var staticPosition = window.getComputedStyle(card).position === 'static';
    if (staticPosition) card.classList.add('card-glow-relative');
    card.classList.add('has-card-glow');
    card.appendChild(layer);
    var state = { card: card, layer: layer, angle: 0, active: false, focused: false, touchUntil: 0 };
    registry.set(card, state);
    if (intersection) intersection.observe(card);
    else visible.add(state);
  }

  function scan(root) {
    if (!root || root.nodeType !== 1 || !root.isConnected) return;
    if (root.matches(SELECTOR)) register(root);
    root.querySelectorAll(SELECTOR).forEach(register);
  }

  function reconcile() {
    if (pendingRemoval) {
      registry.forEach(function (state, card) {
        if (card.isConnected) {
          // A renderer may replace a card's contents while retaining its host.
          // Reattach the same layer rather than leaving an untracked bare card.
          if (state.layer.parentNode !== card) card.appendChild(state.layer);
          return;
        }
        visible.delete(state);
        registry.delete(card);
        if (intersection) intersection.unobserve(card);
        if (touchCard === state) touchCard = null;
      });
      pendingRemoval = false;
    }
    pendingRoots.forEach(scan);
    pendingRoots.clear();
  }

  function closestCard(element) {
    var card = element && element.closest && element.closest('.has-card-glow');
    return card ? registry.get(card) : null;
  }

  function setActive(state, active) {
    if (state.active === active) return;
    state.active = active;
    state.layer.style.setProperty('--card-glow-active', active ? '1' : '0');
  }

  function paint(now) {
    frame = 0;
    reconcile();
    var elapsed = lastFrame ? Math.min(48, now - lastFrame) : 16;
    lastFrame = now;
    var focused = keyboardInput ? closestCard(document.activeElement) : null;
    var reads = [];
    visible.forEach(function (state) {
      reads.push({ state: state, rect: state.card.getBoundingClientRect() });
    });
    var settling = false;
    reads.forEach(function (entry) {
      var state = entry.state;
      var rect = entry.rect;
      var hasSize = rect.width > 0 && rect.height > 0;
      var focusActive = hasSize && state === focused;
      var touchActive = hasSize && state.touchUntil > now;
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
      var near = hasSize && pointer.valid &&
        pointer.x > rect.left - PROXIMITY && pointer.x < rect.right + PROXIMITY &&
        pointer.y > rect.top - PROXIMITY && pointer.y < rect.bottom + PROXIMITY &&
        distance >= Math.min(rect.width, rect.height) * 0.5 * INACTIVE_ZONE;
      var active = focusActive || touchActive || near;
      if (state.focused !== focusActive) {
        state.focused = focusActive;
        state.card.classList.toggle('is-card-glow-focused', focusActive);
      }
      setActive(state, active);
      if (!active || focusActive || motion.matches) return;

      var target = Math.atan2(pointer.y - centerY, pointer.x - centerX) * 180 / Math.PI + 90;
      var delta = ((target - state.angle + 180) % 360 + 360) % 360 - 180;
      // Exponential easing keeps rapid retargeting continuous across 0/360 degrees.
      if (Math.abs(delta) > 0.08) {
        state.angle += delta * (1 - Math.exp(-elapsed / 150));
        settling = true;
      } else state.angle += delta;
      state.angle = ((state.angle % 360) + 360) % 360;
      state.layer.style.setProperty('--card-glow-angle', state.angle.toFixed(3));
    });
    if (settling) schedule();
    else lastFrame = 0;
  }

  function clearPointer() {
    pointer.valid = false;
    schedule();
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || (coarse.matches && event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.valid = true;
    schedule();
  }

  function onPointerDown(event) {
    keyboardInput = false;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (event.pointerType !== 'touch' && !coarse.matches) {
      pointer.valid = true;
      schedule();
      return;
    }
    pointer.valid = false;
    if (touchCard) touchCard.touchUntil = 0;
    touchCard = closestCard(event.target);
    if (touchCard) touchCard.touchUntil = performance.now() + TOUCH_DURATION;
    window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(schedule, TOUCH_DURATION + 20);
    schedule();
  }

  function start() {
    if (!document.body) return;
    if ('IntersectionObserver' in window) {
      intersection = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = registry.get(entry.target);
          if (!state) return;
          if (entry.isIntersecting) visible.add(state);
          else {
            visible.delete(state);
            setActive(state, false);
          }
        });
        schedule();
      }, { rootMargin: PROXIMITY + 'px' });
    }
    scan(document.body);
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.removedNodes.length) pendingRemoval = true;
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && !node.classList.contains('backer-card-glow-layer')) pendingRoots.add(node);
        });
      });
      if (pendingRoots.size || pendingRemoval) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerout', function (event) {
      if (!event.relatedTarget) clearPointer();
    }, { passive: true });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' || event.key.indexOf('Arrow') === 0) {
        keyboardInput = true;
        pointer.valid = false;
        schedule();
      }
    });
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('blur', clearPointer);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        lastFrame = 0;
        pointer.valid = false;
      } else schedule();
    });
    if (motion.addEventListener) motion.addEventListener('change', schedule);
    else if (motion.addListener) motion.addListener(schedule);
    schedule();
  }

  window.BackerCardGlow = {
    refresh: function () {
      if (document.body) pendingRoots.add(document.body);
      schedule();
    },
    selector: SELECTOR
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
