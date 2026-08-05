(function () {
  'use strict';

  function clearDistance(letters) {
    letters.forEach(function (letter) {
      letter.removeAttribute('data-distance');
    });
  }

  function mountBubbleText(root) {
    var text = root.textContent;
    var fragment = document.createDocumentFragment();
    var letters = [];
    var activeIndex = -1;

    root.setAttribute('aria-label', text);
    root.textContent = '';

    Array.from(text).forEach(function (character, index) {
      var letter = document.createElement('span');
      letter.className = 'bubble-letter';
      letter.dataset.bubbleIndex = String(index);
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letters.push(letter);
      fragment.appendChild(letter);
    });

    root.appendChild(fragment);

    function applyDistance(index) {
      if (activeIndex === index) return;
      activeIndex = index;
      letters.forEach(function (letter, letterIndex) {
        var distance = Math.abs(letterIndex - index);
        if (distance <= 2) letter.setAttribute('data-distance', String(distance));
        else letter.removeAttribute('data-distance');
      });
    }

    root.addEventListener('pointerover', function (event) {
      var letter = event.target.closest('.bubble-letter');
      if (!letter || !root.contains(letter)) return;
      applyDistance(Number(letter.dataset.bubbleIndex));
    });
    root.addEventListener('pointerleave', function () {
      activeIndex = -1;
      clearDistance(letters);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-bubble-text]').forEach(mountBubbleText);
  });
})();
