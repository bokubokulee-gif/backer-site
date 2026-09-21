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
    var index = 0, timer = 0, paused = false, visible = true, pageActive = true, animations = [];
    var measures = [], widthAnimation = null;
    var timing = {duration:240, easing:'cubic-bezier(.22,.7,.2,1)'};
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
      measures.push(measure);
    });
    function fitCurrentWord(fromWidth) {
      if (!copy.fitActiveWord) return;
      var width = measures[index].getBoundingClientRect().width;
      if (!(width > 0)) return;
      var target = (Math.ceil(width * 1000) / 1000) + 'px';
      if (button.style.width === target) return;
      if (widthAnimation) widthAnimation.cancel();
      widthAnimation = null;
      // Keep the final width in the style, so canceling a slide never restores the old word's gap.
      button.style.width = target;
      if (typeof fromWidth === 'number' && fromWidth > 0 && !reduced.matches && current.animate && button.animate) {
        widthAnimation = button.animate([{width:fromWidth + 'px'}, {width:target}], timing);
        animations.push(widthAnimation);
      }
    }
    function settle() {
      animations.forEach(function (animation) { animation.onfinish = null; animation.cancel(); });
      animations = [];
      widthAnimation = null;
      var outgoing = button.querySelector('.research-action-outgoing');
      if (outgoing) outgoing.remove();
    }
    function canRotate() {
      return !paused && visible && pageActive && !document.hidden && !(staticWhenReduced && reduced.matches);
    }
    function holdCurrentWord() {
      window.clearTimeout(timer);
      // The readable hold starts after the slide finishes, not when the new text is inserted.
      timer = canRotate() ? window.setTimeout(next, 1000) : 0;
    }
    function next() {
      timer = 0;
      if (!canRotate()) return;
      settle();
      var previousWidth = copy.fitActiveWord ? button.getBoundingClientRect().width : 0;
      var previous = current.textContent;
      index = (index + 1) % copy.words.length;
      current.textContent = copy.words[index] + copy.suffix;
      line.dataset.actionIndex = index;
      fitCurrentWord(previousWidth);
      if (reduced.matches || !current.animate) { holdCurrentWord(); return; }
      var outgoing = document.createElement('span');
      outgoing.className = 'research-action-outgoing';
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.textContent = previous;
      button.appendChild(outgoing);
      animations.push(current.animate([{opacity:0,transform:'translateY(.45em)'},{opacity:1,transform:'translateY(0)'}], timing));
      var leaving = outgoing.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-.45em)'}], timing);
      leaving.onfinish = function () { outgoing.remove(); holdCurrentWord(); };
      animations.push(leaving);
    }
    function sync() {
      window.clearTimeout(timer);
      timer = 0;
      settle();
      var label = paused ? copy.resumeLabel : copy.pauseLabel;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(paused));
      holdCurrentWord();
    }
    button.addEventListener('click', function () { paused = !paused; sync(); });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { pageActive = false; window.clearTimeout(timer); timer = 0; settle(); });
    window.addEventListener('pageshow', function () { pageActive = true; sync(); });
    reduced.addEventListener('change', sync);
    if (copy.fitActiveWord) {
      fitCurrentWord();
      // Observe the intrinsic word measures, not the animated button, to avoid resize feedback.
      if ('ResizeObserver' in window) {
        var wordObserver = new ResizeObserver(function () { fitCurrentWord(); });
        measures.forEach(function (measure) { wordObserver.observe(measure); });
      }
      window.addEventListener('resize', function () { fitCurrentWord(); }, {passive:true});
      window.addEventListener('pageshow', function () { fitCurrentWord(); });
      if (document.fonts) {
        if (document.fonts.ready) document.fonts.ready.then(function () { fitCurrentWord(); });
        if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { fitCurrentWord(); });
      }
    }
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
      words: ['Human', 'Capital', 'Conviction', 'Culture'],
      fitActiveWord: true,
      suffix: '',
      accessibleLabel: 'Human, capital, conviction, and culture follow where human attention accumulates.',
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
