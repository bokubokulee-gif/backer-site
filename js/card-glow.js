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
    '.mdp-status-card', '.pt-block', '.pt-strict-panel', '.waitlist-card',
    'details.research-gateway'
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
  var geometryObserver = null;
  var glowLayers = new Map();
  var radiusOwners = new WeakMap();
  var pendingGeometry = new Set();

  function radiusLength(value, size) {
    value = String(value || '0').trim();
    if (/^-?(?:\d*\.)?\d+(?:px|%)?$/.test(value)) {
      return Math.max(0, parseFloat(value) * (value.endsWith('%') ? size / 100 : 1));
    }
    // Computed radii can retain percentages inside calc/min/max/clamp expressions.
    var tokens = value.match(/(?:\d*\.)?\d+(?:e[-+]?\d+)?(?:px|%)?|[a-z]+|[()+*/,-]/gi) || [];
    var position = 0;
    function atom() {
      var token = tokens[position++];
      if (token === '+' || token === '-') return (token === '-' ? -1 : 1) * atom();
      if (token === '(') {
        var grouped = sum();
        if (tokens[position++] !== ')') return NaN;
        return grouped;
      }
      if (/^(?:calc|min|max|clamp)$/.test(token || '')) {
        if (tokens[position++] !== '(') return NaN;
        var values = [sum()];
        while (tokens[position] === ',') { position++; values.push(sum()); }
        if (tokens[position++] !== ')') return NaN;
        if (token === 'min') return Math.min.apply(Math, values);
        if (token === 'max') return Math.max.apply(Math, values);
        if (token === 'clamp') return Math.max(values[0], Math.min(values[1], values[2]));
        return values[0];
      }
      return parseFloat(token) * (token && token.endsWith('%') ? size / 100 : 1);
    }
    function product() {
      var result = atom();
      while (tokens[position] === '*' || tokens[position] === '/') {
        var operation = tokens[position++];
        var operand = atom();
        result = operation === '*' ? result * operand : result / operand;
      }
      return result;
    }
    function sum() {
      var result = product();
      while (tokens[position] === '+' || tokens[position] === '-') {
        var operation = tokens[position++];
        var operand = product();
        result = operation === '+' ? result + operand : result - operand;
      }
      return result;
    }
    var result = sum();
    return position === tokens.length && Number.isFinite(result) ? Math.max(0, result) : 0;
  }

  function cornerRadius(value, width, height) {
    var parts = [], start = 0, depth = 0;
    value = String(value || '0').trim();
    for (var i = 0; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
      else if (/\s/.test(value[i]) && !depth) {
        if (i > start) parts.push(value.slice(start, i));
        start = i + 1;
      }
    }
    if (start < value.length) parts.push(value.slice(start));
    return [radiusLength(parts[0], width), radiusLength(parts[1] || parts[0], height)];
  }

  function normalizedRadii(radii, width, height) {
    // CSS reduces all radii by one common factor when adjacent corners overlap.
    // A zero sum imposes no constraint, rather than shrinking every other corner.
    var sums = [radii[0][0] + radii[1][0], radii[3][0] + radii[2][0], radii[0][1] + radii[3][1], radii[1][1] + radii[2][1]];
    var scale = 1;
    for (var i = 0; i < sums.length; i++) if (sums[i] > 0) scale = Math.min(scale, (i < 2 ? width : height) / sums[i]);
    return radii.map(function (radius) { return [radius[0] * scale, radius[1] * scale]; });
  }

  function roundedRectPath(x, y, width, height, radii) {
    function n(value) { return String(Math.round(value * 10000) / 10000); }
    function point(a, b) { return n(a) + ' ' + n(b); }
    function arc(radius, a, b) {
      return radius[0] > 0 && radius[1] > 0
        ? ' A ' + point(radius[0], radius[1]) + ' 0 0 1 ' + point(a, b)
        : ' L ' + point(a, b);
    }
    return 'M ' + point(x + radii[0][0], y) +
      ' L ' + point(x + width - radii[1][0], y) + arc(radii[1], x + width, y + radii[1][1]) +
      ' L ' + point(x + width, y + height - radii[2][1]) + arc(radii[2], x + width - radii[2][0], y + height) +
      ' L ' + point(x + radii[3][0], y + height) + arc(radii[3], x, y + height - radii[3][1]) +
      ' L ' + point(x, y + radii[0][1]) + arc(radii[0], x + radii[0][0], y) + ' Z';
  }

  function ringClip(width, height, radii, inset) {
    var outer = normalizedRadii(radii, width, height);
    var path = roundedRectPath(0, 0, width, height, outer);
    var innerWidth = width - inset * 2;
    var innerHeight = height - inset * 2;
    if (innerWidth > 0 && innerHeight > 0) {
      var inner = outer.map(function (radius) { return [Math.max(0, radius[0] - inset), Math.max(0, radius[1] - inset)]; });
      path += ' ' + roundedRectPath(inset, inset, innerWidth, innerHeight, normalizedRadii(inner, innerWidth, innerHeight));
    }
    return 'path(evenodd, "' + path + '")';
  }

  function trackGlowLayer(layer) {
    if (!layer || !layer.isConnected || glowLayers.has(layer)) return;
    glowLayers.set(layer, '');
    pendingGeometry.add(layer);
    if (geometryObserver) geometryObserver.observe(layer);
  }

  function refreshGeometry() {
    glowLayers.forEach(function (_, layer) { pendingGeometry.add(layer); });
    schedule();
  }

  function paintGeometry() {
    pendingGeometry.forEach(function (layer) {
      if (!layer.isConnected) return;
      var style = window.getComputedStyle(layer);
      // CSS used dimensions stay in layout pixels under both transforms and CSS zoom.
      var width = parseFloat(style.width);
      var height = parseFloat(style.height);
      if (style.boxSizing !== 'border-box') {
        width += (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0) + (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
        height += (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
      }
      if (!Number.isFinite(width)) width = layer.offsetWidth || layer.clientWidth;
      if (!Number.isFinite(height)) height = layer.offsetHeight || layer.clientHeight;
      if (!(width > 0 && height > 0)) return;
      // Native details/summary inheritance can resolve the summary's radius to zero.
      // Its decoration follows the complete details card, whose corner geometry is authoritative.
      var radiusOwner = radiusOwners.get(layer);
      var radiusStyle = radiusOwner ? window.getComputedStyle(radiusOwner) : style;
      var radii = [radiusStyle.borderTopLeftRadius, radiusStyle.borderTopRightRadius, radiusStyle.borderBottomRightRadius, radiusStyle.borderBottomLeftRadius]
        .map(function (value) { return cornerRadius(value, width, height); });
      var inset = radiusLength(style.getPropertyValue('--card-glow-width') || '3px', Math.min(width, height));
      var signature = [width, height, inset];
      radii.forEach(function (radius) { signature.push(radius[0], radius[1]); });
      signature = signature.join(',');
      if (glowLayers.get(layer) === signature) return;
      glowLayers.set(layer, signature);
      layer.style.setProperty('--card-glow-clip', ringClip(width, height, radii, inset));
    });
    pendingGeometry.clear();
  }

  function schedule() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(paint);
  }

  function layerHost(card) {
    // Closed native details only render their summary. Keep the decoration there
    // while measuring the complete details card, including its expanded content.
    return card.matches('details.research-gateway') ? card.querySelector(':scope > summary') : card;
  }

  function attachLayer(state) {
    var host = layerHost(state.card);
    if (!host) return;
    host.classList.add('has-card-glow');
    if (host !== state.card) host.classList.add('card-glow-summary-host');
    if (host !== state.card) radiusOwners.set(state.layer, state.card);
    else radiusOwners.delete(state.layer);
    if (state.layer.parentNode !== host) {
      host.appendChild(state.layer);
      pendingGeometry.add(state.layer);
    }
    trackGlowLayer(state.layer);
    host.classList.toggle('is-card-glow-focused', state.focused);
    state.host = host;
  }

  function register(card) {
    if (registry.has(card) || !card.isConnected) return;
    if (!layerHost(card)) return;
    var layer = document.createElement('span');
    layer.className = 'backer-card-glow-layer';
    layer.setAttribute('aria-hidden', 'true');
    var staticPosition = window.getComputedStyle(card).position === 'static';
    if (staticPosition) card.classList.add('card-glow-relative');
    var state = { card: card, layer: layer, angle: 0, active: false, focused: false, touchUntil: 0 };
    attachLayer(state);
    registry.set(card, state);
    if (intersection) intersection.observe(card);
    else visible.add(state);
  }

  function scan(root) {
    if (!root || root.nodeType !== 1 || !root.isConnected) return;
    if (root.matches(SELECTOR)) register(root);
    root.querySelectorAll(SELECTOR).forEach(register);
    // Manual Research layers have their own animation clock and no pointer registry entry.
    if (root.matches('.backer-card-glow-layer')) trackGlowLayer(root);
    root.querySelectorAll('.backer-card-glow-layer').forEach(trackGlowLayer);
  }

  function reconcile() {
    if (pendingRemoval) {
      registry.forEach(function (state, card) {
        if (card.isConnected) {
          // A renderer may replace a card's contents while retaining its host.
          // Reattach the same layer rather than leaving an untracked bare card.
          attachLayer(state);
          return;
        }
        visible.delete(state);
        registry.delete(card);
        if (intersection) intersection.unobserve(card);
        if (touchCard === state) touchCard = null;
      });
      glowLayers.forEach(function (_, layer) {
        if (layer.isConnected) return;
        if (geometryObserver) geometryObserver.unobserve(layer);
        radiusOwners.delete(layer);
        pendingGeometry.delete(layer);
        glowLayers.delete(layer);
      });
      pendingRemoval = false;
    }
    pendingRoots.forEach(scan);
    pendingRoots.clear();
  }

  function closestCard(element) {
    var card = element && element.closest && element.closest('.has-card-glow');
    if (card && registry.has(card)) return registry.get(card);
    // A gateway summary owns the layer; links in expanded content also belong
    // to the surrounding registered details card.
    var gateway = element && element.closest && element.closest('details.research-gateway');
    return gateway ? registry.get(gateway) : null;
  }

  function setActive(state, active) {
    if (state.active === active) return;
    state.active = active;
    state.layer.style.setProperty('--card-glow-active', active ? '1' : '0');
  }

  function paint(now) {
    frame = 0;
    reconcile();
    paintGeometry();
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
        state.host.classList.toggle('is-card-glow-focused', focusActive);
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
    if ('ResizeObserver' in window) {
      geometryObserver = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) { pendingGeometry.add(entry.target); });
        schedule();
      });
    }
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
          if (node.nodeType === 1) pendingRoots.add(node);
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
    document.addEventListener('toggle', function (event) {
      if (event.target.matches('details.research-gateway')) {
        var state = registry.get(event.target);
        if (state) pendingGeometry.add(state.layer);
        schedule();
      }
    }, true);
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', refreshGeometry, { passive: true });
    window.addEventListener('pagehide', function (event) {
      if (event.persisted) return;
      if (geometryObserver) geometryObserver.disconnect();
      glowLayers.clear();
      pendingGeometry.clear();
    });
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
      refreshGeometry();
    },
    selector: SELECTOR
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
