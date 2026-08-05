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

    root.setAttribute('aria-label', text);
    root.textContent = '';

    Array.from(text).forEach(function (character, index) {
      var letter = document.createElement('span');
      letter.className = 'bubble-letter';
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letter.addEventListener('pointerenter', function () {
        root.querySelectorAll('.bubble-letter').forEach(function (item, itemIndex) {
          var distance = Math.abs(itemIndex - index);
          if (distance <= 2) item.setAttribute('data-distance', String(distance));
          else item.removeAttribute('data-distance');
        });
      });
      fragment.appendChild(letter);
    });

    root.appendChild(fragment);
    var letters = root.querySelectorAll('.bubble-letter');
    root.addEventListener('pointerleave', function () {
      clearDistance(letters);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-bubble-text]').forEach(mountBubbleText);
  });
})();
