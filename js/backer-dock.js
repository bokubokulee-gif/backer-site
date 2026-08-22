/* Backer shared floating navigation.
   One dependency-free component for every public page. */
(function () {
  'use strict';

  var STORAGE_KEY = 'backer_shared_dock_v1';
  var MARGIN = 12;
  var DRAG_THRESHOLD = 7;
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    discovery: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    trades: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V9m0 4h4M8 6v10m0-7h4m0 9V5m0 4h4m0 10V8m0 5h4m0 5V4"/></svg>',
    portfolio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19V5m0 14h18"/><path d="m7 15 4-4 3 2 5-7"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>',
    move: '<svg viewBox="0 0 14 28" aria-hidden="true"><circle cx="7" cy="5" r="1.8"/><circle cx="7" cy="14" r="1.8"/><circle cx="7" cy="23" r="1.8"/></svg>'
  };

  function safeParse(value) {
    try {
      var parsed = JSON.parse(value || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function readState() {
    var value = null;
    try { value = localStorage.getItem(STORAGE_KEY); } catch (error) {}
    var parsed = safeParse(value);
    if (!parsed) return { edge: 'bottom', crossAxisRatio: 0.5, minimized: false };
    return {
      edge: ['top', 'right', 'bottom', 'left'].indexOf(parsed.edge) >= 0 ? parsed.edge : 'bottom',
      crossAxisRatio: Math.max(0, Math.min(1, Number(parsed.crossAxisRatio !== undefined ? parsed.crossAxisRatio : parsed.offset) || 0)),
      minimized: parsed.minimized === true
    };
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }

  function routeKey() {
    var path = String(location.pathname || '').toLowerCase();
    var hash = String(location.hash || '').toLowerCase();
    var query = new URLSearchParams(location.search || '');
    if (/portfolio\.html$/.test(path)) return 'portfolio';
    if (/backermarket\.html$/.test(path) && query.get('source') === 'market-archive') return '';
    if (/backermarket\.html$/.test(path)) return 'trades';
    if (/backercreate\.html$/.test(path)) return 'discovery';
    if (/^#market-archive(?:\?|$)/.test(hash)) return '';
    if (/^#trades(?:\?|$)/.test(hash) || /^#market(?:\?|$)/.test(hash)) return 'trades';
    if (/^#search(?:\?|$)/.test(hash)) return 'search';
    if (/^#market2(?:\?|$)/.test(hash)) return 'discovery';
    if (query.get('view') === 'search') return 'search';
    if (/backerdemo\.html$/.test(path) || /\/$/.test(path) || /index\.html$/.test(path)) return 'home';
    return '';
  }

  function linkHTML(key, href, label, icon, extraClass) {
    return '<a class="backer-dock-link backer-dock-' + key + (extraClass ? ' ' + extraClass : '') + '" href="' + href + '" data-route="' + key + '" data-label="' + label + '" aria-label="' + label + '">' + icon + '</a>';
  }

  function buildDock() {
    document.querySelectorAll('nav.dock').forEach(function (oldDock) { oldDock.remove(); });
    var mount = document.querySelector('[data-backer-dock]');
    var dock = document.createElement('nav');
    dock.className = 'backer-float-dock';
    dock.setAttribute('aria-label', 'Backer navigation');
    dock.innerHTML =
      '<button class="backer-dock-move backer-dock-expanded" type="button" data-label="Move or minimize" aria-label="Move or minimize Backer navigation. Use arrow keys or drag.">' + ICONS.move + '</button>' +
      linkHTML('search', 'backerdemo.html#search', 'Search', ICONS.search, 'backer-dock-expanded') +
      linkHTML('discovery', 'backerdemo.html#market2', 'Discovery', ICONS.discovery, 'backer-dock-expanded') +
      linkHTML('home', 'backerdemo.html', 'Home', '<span class="backer-dock-orb" aria-hidden="true"></span>', 'backer-dock-home backer-dock-expanded') +
      linkHTML('trades', 'backerdemo.html#trades', 'Trades', ICONS.trades, 'backer-dock-expanded') +
      linkHTML('portfolio', 'portfolio.html', 'Portfolio', ICONS.portfolio, 'backer-dock-expanded') +
      '<button class="backer-dock-minimize backer-dock-expanded" type="button" data-label="Minimize" aria-label="Minimize navigation">' + ICONS.minimize + '</button>' +
      '<button class="backer-dock-restore" type="button" aria-label="Restore Backer navigation"><span class="backer-dock-orb" aria-hidden="true"></span></button>';
    (mount || document.body).appendChild(dock);
    return dock;
  }

  function start() {
    if (!document.body || document.querySelector('.backer-float-dock')) return;
    var state = readState();
    var dock = buildDock();
    var handle = dock.querySelector('.backer-dock-move');
    var minimize = dock.querySelector('.backer-dock-minimize');
    var restore = dock.querySelector('.backer-dock-restore');
    var drag = null;
    var modalCollision = null;
    var modalCollisionFrame = 0;

    function safeInsets() {
      var probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      document.body.appendChild(probe);
      var computed = getComputedStyle(probe);
      var values = {
        top: parseFloat(computed.paddingTop) || 0,
        right: parseFloat(computed.paddingRight) || 0,
        bottom: parseFloat(computed.paddingBottom) || 0,
        left: parseFloat(computed.paddingLeft) || 0
      };
      probe.remove();
      var topClearance = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bd-top-clearance')) || 0;
      values.top += topClearance;
      return values;
    }
    var currentSafe = safeInsets();

    function dimensions() {
      return { width: dock.offsetWidth, height: dock.offsetHeight };
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function setPixels(left, top) {
      var size = dimensions();
      var safe = currentSafe;
      var minLeft = MARGIN + safe.left;
      var maxLeft = Math.max(minLeft, innerWidth - size.width - MARGIN - safe.right);
      var minTop = MARGIN + safe.top;
      var maxTop = Math.max(minTop, innerHeight - size.height - MARGIN - safe.bottom);
      dock.style.transform = 'none';
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.left = clamp(left, minLeft, maxLeft) + 'px';
      dock.style.top = clamp(top, minTop, maxTop) + 'px';
    }

    function publishLayoutState() {
      var root = document.documentElement;
      var size = dimensions();
      var safe = currentSafe;
      var clearances = { top: 0, right: 0, bottom: 0, left: 0 };
      var dockSize = state.edge === 'top' || state.edge === 'bottom' ? size.height : size.width;
      var edgeSafe = state.edge === 'top' ? 0 : safe[state.edge];
      clearances[state.edge] = Math.ceil(dockSize + MARGIN + 12 + edgeSafe);
      root.setAttribute('data-backer-dock-edge', state.edge);
      root.setAttribute('data-backer-dock-minimized', String(state.minimized));
      Object.keys(clearances).forEach(function (edge) {
        root.style.setProperty('--backer-dock-clearance-' + edge, clearances[edge] + 'px');
      });
      document.dispatchEvent(new CustomEvent('backer:dockstate', {
        detail: {
          edge: state.edge,
          minimized: state.minimized,
          clearance: clearances[state.edge]
        }
      }));
    }

    function applyState() {
      dock.classList.toggle('is-minimized', state.minimized);
      dock.setAttribute('data-edge', state.edge);
      dock.setAttribute('data-orientation', state.edge === 'left' || state.edge === 'right' ? 'vertical' : 'horizontal');
      var size = dimensions();
      var safe = currentSafe;
      var minLeft = MARGIN + safe.left;
      var maxLeft = Math.max(minLeft, innerWidth - size.width - MARGIN - safe.right);
      var minTop = MARGIN + safe.top;
      var maxTop = Math.max(minTop, innerHeight - size.height - MARGIN - safe.bottom);
      var left = minLeft;
      var top = minTop;
      if (state.edge === 'top' || state.edge === 'bottom') {
        left = minLeft + state.crossAxisRatio * Math.max(0, maxLeft - minLeft);
        top = state.edge === 'top' ? minTop : maxTop;
      } else {
        left = state.edge === 'left' ? minLeft : maxLeft;
        top = minTop + state.crossAxisRatio * Math.max(0, maxTop - minTop);
      }
      setPixels(left, top);
      publishLayoutState();
    }

    function saveSnapped() {
      var rect = dock.getBoundingClientRect();
      var safe = currentSafe;
      var minLeft = MARGIN + safe.left;
      var maxLeft = Math.max(minLeft, innerWidth - rect.width - MARGIN - safe.right);
      var minTop = MARGIN + safe.top;
      var maxTop = Math.max(minTop, innerHeight - rect.height - MARGIN - safe.bottom);
      var distances = {
        left: rect.left - safe.left,
        right: innerWidth - rect.right - safe.right,
        top: rect.top - safe.top,
        bottom: innerHeight - rect.bottom - safe.bottom
      };
      state.edge = Object.keys(distances).sort(function (a, b) { return distances[a] - distances[b]; })[0];
      if (state.edge === 'top' || state.edge === 'bottom') {
        state.crossAxisRatio = clamp((rect.left - minLeft) / Math.max(1, maxLeft - minLeft), 0, 1);
      } else {
        state.crossAxisRatio = clamp((rect.top - minTop) / Math.max(1, maxTop - minTop), 0, 1);
      }
      writeState(state);
      applyState();
    }

    function updateActive() {
      var active = routeKey();
      dock.querySelectorAll('[data-route]').forEach(function (link) {
        if (link.dataset.route === active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }

    function visibleModal() {
      var candidates = document.querySelectorAll('dialog[open], [aria-modal="true"]');
      for (var index = candidates.length - 1; index >= 0; index -= 1) {
        var candidate = candidates[index];
        if (dock.contains(candidate) || !candidate.getClientRects().length) continue;
        var style = getComputedStyle(candidate);
        if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0) return candidate;
      }
      return null;
    }

    function syncModalCollision() {
      modalCollisionFrame = 0;
      var modal = visibleModal();
      var yielding = Boolean(modal);
      if (modalCollision === yielding) return;
      modalCollision = yielding;
      dock.classList.toggle('is-yielding-to-modal', yielding);
      dock.toggleAttribute('inert', yielding);
      if (yielding) dock.setAttribute('aria-hidden', 'true');
      else dock.removeAttribute('aria-hidden');
    }

    function scheduleModalCollisionCheck() {
      if (modalCollisionFrame) return;
      modalCollisionFrame = requestAnimationFrame(syncModalCollision);
    }

    var modalObserver = new MutationObserver(scheduleModalCollisionCheck);
    modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'aria-modal', 'aria-hidden', 'class', 'style']
    });

    function beginDrag(control, event) {
      if (event.button !== undefined && event.button !== 0) return;
      var rect = dock.getBoundingClientRect();
      drag = { control: control, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
      try { control.setPointerCapture(event.pointerId); } catch (error) {}
      event.preventDefault();
    }
    function moveDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      dock.classList.add('is-dragging');
      setPixels(drag.left + dx, drag.top + dy);
    }
    function finishDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var control = drag.control;
      try { control.releasePointerCapture(event.pointerId); } catch (error) {}
      var moved = drag.moved;
      drag = null;
      dock.classList.remove('is-dragging');
      if (moved) {
        control.__suppressClick = true;
        saveSnapped();
        setTimeout(function () { control.__suppressClick = false; }, 0);
      }
    }
    [handle, restore].forEach(function (control) {
      control.addEventListener('pointerdown', function (event) { beginDrag(control, event); });
      control.addEventListener('pointermove', moveDrag);
      control.addEventListener('pointerup', finishDrag);
      control.addEventListener('pointercancel', finishDrag);
    });
    handle.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault();
        minimize.click();
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        state.edge = 'bottom';
        state.crossAxisRatio = 0.5;
        writeState(state);
        applyState();
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) < 0) return;
      event.preventDefault();
      if (event.shiftKey) {
        state.edge = event.key === 'ArrowLeft' ? 'left' : event.key === 'ArrowRight' ? 'right' : event.key === 'ArrowUp' ? 'top' : 'bottom';
        writeState(state);
        applyState();
        return;
      }
      var rect = dock.getBoundingClientRect();
      var step = 12;
      var dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      var dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      setPixels(rect.left + dx, rect.top + dy);
      dock.classList.add('is-key-moving');
      clearTimeout(handle.__keyTimer);
      handle.__keyTimer = setTimeout(function () { dock.classList.remove('is-key-moving'); saveSnapped(); }, 220);
    });

    handle.addEventListener('click', function () {
      if (!handle.__suppressClick && !dock.classList.contains('is-dragging')) minimize.click();
    });

    dock.addEventListener('keydown', function (event) {
      var current = event.target.closest('[data-route]');
      if (!current || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) < 0) return;
      var links = Array.prototype.slice.call(dock.querySelectorAll('[data-route]'));
      var index = links.indexOf(current);
      if (index < 0) return;
      var backwards = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      event.preventDefault();
      links[(index + (backwards ? -1 : 1) + links.length) % links.length].focus();
    });

    minimize.addEventListener('click', function () {
      state.minimized = true;
      writeState(state);
      applyState();
      requestAnimationFrame(function () { restore.focus(); });
    });
    restore.addEventListener('click', function () {
      if (restore.__suppressClick || dock.classList.contains('is-dragging')) return;
      state.minimized = false;
      writeState(state);
      applyState();
      requestAnimationFrame(function () { handle.focus(); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !state.minimized && dock.contains(document.activeElement)) minimize.click();
    });
    document.addEventListener('focusin', function (event) {
      if (dock.contains(event.target) || !event.target.getBoundingClientRect) return;
      requestAnimationFrame(function () {
        if (modalCollision) return;
        var focused = event.target.getBoundingClientRect();
        var floating = dock.getBoundingClientRect();
        var overlaps = focused.right > floating.left && focused.left < floating.right && focused.bottom > floating.top && focused.top < floating.bottom;
        if (!overlaps) return;
        var delta = 0;
        if (state.edge === 'top') delta = focused.top - floating.bottom - 16;
        else if (state.edge === 'bottom') delta = focused.bottom - floating.top + 16;
        else {
          var focusedCenter = focused.top + focused.height / 2;
          var dockCenter = floating.top + floating.height / 2;
          delta = focusedCenter <= dockCenter ? focused.bottom - floating.top + 16 : focused.top - floating.bottom - 16;
        }
        var maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        var nextScroll = clamp(window.scrollY + delta, 0, maxScroll);
        if (Math.abs(nextScroll - window.scrollY) > 0.5) window.scrollTo({ top: nextScroll, behavior: 'auto' });
        else if (maxScroll > 0) event.target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      });
    });
    window.addEventListener('resize', function () { currentSafe = safeInsets(); applyState(); }, { passive: true });
    window.addEventListener('hashchange', function () { updateActive(); scheduleModalCollisionCheck(); });
    window.addEventListener('popstate', function () { updateActive(); scheduleModalCollisionCheck(); });
    document.addEventListener('backer:routechange', function () { updateActive(); scheduleModalCollisionCheck(); });

    applyState();
    updateActive();
    syncModalCollision();
    window.BackerDock = {
      minimize: function () { if (!state.minimized) minimize.click(); },
      restore: function () { if (state.minimized) restore.click(); },
      refresh: function () { updateActive(); scheduleModalCollisionCheck(); },
      storageKey: STORAGE_KEY
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
