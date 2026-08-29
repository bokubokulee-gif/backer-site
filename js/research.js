(function () {
  'use strict';

  var SPEED_PX_PER_SECOND = 2;
  var orbit = document.querySelector('.research-orbit');
  if (!orbit) return;
  var previewLink = document.querySelector('[data-research-preview]');

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

  if (previewLink) {
    previewLink.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      document.body.classList.add('is-launching');
      window.setTimeout(function () { window.location.assign(previewLink.href); }, 360);
    });
  }
})();
