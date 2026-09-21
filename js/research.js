(function () {
  'use strict';

  var stage = document.querySelector('.research-stage');
  var robot = document.getElementById('research-robot');
  var previews = document.querySelectorAll('[data-research-tab]');
  previews.forEach(function (link) {
    function highlight() {
      stage.dataset.preview = link.dataset.researchTab;
      if (robot) robot.dispatchEvent(new CustomEvent('research-preview-change', { detail: { preview: link.dataset.researchTab } }));
    }
    link.addEventListener('pointerenter', highlight);
    link.addEventListener('focus', highlight);
  });
  if (['trading', 'attention', 'simulation'].indexOf(location.hash.slice(1)) >= 0) {
    document.querySelector('.research-gateway--previews').open = true;
  }

  function mountRotatingLine(line, copy, staticWhenReduced) {
    if (!line || !copy) return;
    var button = line.querySelector('[data-action-word]');
    var current = line.querySelector('[data-action-current]');
    if (!button || !current) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var index = 0, timer = 0, paused = false, visible = true, animations = [];
    var prefix = line.querySelector('[data-action-prefix]');
    if (prefix) prefix.textContent = copy.prefix;
    line.setAttribute('aria-label', copy.accessibleLabel);
    current.textContent = copy.words[0] + copy.suffix;
    copy.words.forEach(function (word) {
      var measure = document.createElement('span');
      measure.className = 'research-action-measure';
      measure.setAttribute('aria-hidden', 'true');
      measure.textContent = word + copy.suffix;
      button.appendChild(measure);
    });
    function settle() {
      animations.forEach(function (animation) { animation.cancel(); });
      animations = [];
      var outgoing = button.querySelector('.research-action-outgoing');
      if (outgoing) outgoing.remove();
    }
    function next() {
      if (staticWhenReduced && reduced.matches) return;
      settle();
      var previous = current.textContent;
      index = (index + 1) % copy.words.length;
      current.textContent = copy.words[index] + copy.suffix;
      line.dataset.actionIndex = index;
      if (reduced.matches || !current.animate) return;
      var outgoing = document.createElement('span');
      outgoing.className = 'research-action-outgoing';
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.textContent = previous;
      button.appendChild(outgoing);
      var timing = {duration:240, easing:'cubic-bezier(.22,.7,.2,1)'};
      animations.push(current.animate([{opacity:0,transform:'translateY(.45em)'},{opacity:1,transform:'translateY(0)'}], timing));
      var leaving = outgoing.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-.45em)'}], timing);
      leaving.onfinish = function () { outgoing.remove(); };
      animations.push(leaving);
    }
    function sync() {
      window.clearInterval(timer);
      timer = 0;
      var label = paused ? copy.resumeLabel : copy.pauseLabel;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(paused));
      if (!paused && visible && !document.hidden && !(staticWhenReduced && reduced.matches)) timer = window.setInterval(next, 1000);
      else settle();
    }
    button.addEventListener('click', function () { paused = !paused; sync(); });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { window.clearInterval(timer); settle(); });
    window.addEventListener('pageshow', sync);
    reduced.addEventListener('change', staticWhenReduced ? sync : settle);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, {threshold:0.1}).observe(line);
    line.dataset.actionIndex = '0';
    line.dataset.actionCount = String(copy.words.length);
    sync();
  }
  function mountActionLines() {
    var locale = window.BackerI18n ? window.BackerI18n.locale : 'en';
    var editions = window.BackerLocalePacks && window.BackerLocalePacks.simulation && window.BackerLocalePacks.simulation.actionLine;
    if (editions) mountRotatingLine(document.querySelector('[data-research-actions]'), editions[locale] || editions.en, false);
    mountRotatingLine(document.querySelector('[data-research-principle]'), {
      words: ['Human attention', 'Capital allocation', 'Decision making', 'Conviction'],
      suffix: '',
      accessibleLabel: 'Human attention, capital allocation, decision making, and conviction follow where human attention accumulates.',
      pauseLabel: 'Pause rotating phrase',
      resumeLabel: 'Resume rotating phrase'
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountActionLines, {once:true});
  else mountActionLines();

  window.addEventListener('pageshow', function () { document.body.classList.remove('is-launching'); });
  var SPEED_PX_PER_SECOND = 16;
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
