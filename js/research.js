(function () {
  'use strict';

  var stage = document.querySelector('.research-stage');
  var tablist = document.querySelector('.research-preview-options');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-research-tab]'));
  var robot = document.getElementById('research-robot');
  if (tablist && tabs.length) {
    function selectPreview(key, focus, updateHash) {
      stage.dataset.preview = key;
      tabs.forEach(function (tab) {
        var selected = tab.dataset.researchTab === key;
        tab.setAttribute('aria-describedby', 'preview-description-' + tab.dataset.researchTab);
        tab.tabIndex = 0;
        tab.classList.toggle('is-selected', selected);
        var panel = document.getElementById('preview-panel-' + tab.dataset.researchTab);
        panel.hidden = !selected;
        if (selected && focus) tab.focus();
      });
      if (robot) robot.dispatchEvent(new CustomEvent('research-preview-change', { detail: { preview: key } }));
      if (updateHash) history.replaceState(null, '', '#' + key);
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener('pointerenter', function () { selectPreview(tab.dataset.researchTab, false, false); });
      tab.addEventListener('focus', function () { selectPreview(tab.dataset.researchTab, false, false); });
      tab.addEventListener('keydown', function (event) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(event.key) < 0) return;
        event.preventDefault();
        var next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + 1) % tabs.length;
        selectPreview(tabs[next].dataset.researchTab, true, true);
      });
    });
    function fromHash() { selectPreview(location.hash === '#attention' ? 'attention' : 'trading', false, false); }
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  window.addEventListener('pageshow', function () { document.body.classList.remove('is-launching'); });
  var SPEED_PX_PER_SECOND = 2;
  var orbit = document.querySelector('.research-orbit');
  if (!orbit) return;
  var previewLinks = document.querySelectorAll('[data-research-preview]');

  var runners = Array.prototype.slice.call(orbit.querySelectorAll('[data-orbit-runner]'));

  function syncVelocity() {
    runners.forEach(function (runner) {
      var dot = runner.querySelector('b');
      if (!dot) return;
      var orbitRect = runner.getBoundingClientRect();
      var dotRect = dot.getBoundingClientRect();
      var centerX = orbitRect.left + (orbitRect.width / 2);
      var centerY = orbitRect.top + (orbitRect.height / 2);
      var dotX = dotRect.left + (dotRect.width / 2);
      var dotY = dotRect.top + (dotRect.height / 2);
      var radius = Math.hypot(dotX - centerX, dotY - centerY);
      var duration = (2 * Math.PI * radius) / SPEED_PX_PER_SECOND;
      runner.style.setProperty('--orbit-duration', duration.toFixed(2) + 's');
    });
  }

  window.requestAnimationFrame(syncVelocity);
  if ('ResizeObserver' in window) {
    new ResizeObserver(syncVelocity).observe(orbit);
  } else {
    window.addEventListener('resize', syncVelocity, { passive: true });
  }

  previewLinks.forEach(function (previewLink) {
    previewLink.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      document.body.classList.add('is-launching');
      window.setTimeout(function () { window.location.assign(previewLink.href); }, 360);
    });
  });
})();
