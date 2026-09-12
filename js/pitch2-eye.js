/*!
 * Eye icon: AnimateIcons / Hugeicons (https://animateicons.in)
 * Author: Avijit Dey (@avijit07x)
 * Source: https://github.com/Avijit07x/animateicons
 * Native SVG animation adaptation for Backer.
 *
 * MIT License
 * Copyright (c) 2025 Avijit Dey
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  'use strict';

  function mount() {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resets = [];
    document.querySelectorAll('[data-p2-eye]').forEach(eye => {
      if (eye.dataset.p2EyeReady) return;
      const outline = eye.querySelector('.p2-asset-eye__outline');
      const pupil = eye.querySelector('.p2-asset-eye__pupil');
      if (!outline || !pupil || !outline.animate || !pupil.animate) return;
      eye.dataset.p2EyeReady = 'true';
      let animations = [];
      let touch = null;

      function reset() {
        animations.forEach(animation => animation.cancel());
        animations = [];
      }

      function play() {
        reset();
        if (motion.matches || document.hidden) return;
        // Ease each interval just as the supplied Motion keyframe arrays do.
        animations = [
          outline.animate([1, .1, 1].map(value => ({ transform: `scaleY(${value})`, easing: 'ease-in-out' })), { duration: 250 }),
          pupil.animate([-2, 2, -1, 1, 0].map(value => ({ transform: `translateX(${value}px)`, easing: 'ease-in-out' })), { duration: 1600 })
        ];
      }

      eye.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch') play();
      }, { passive: true });
      eye.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'touch' || touch) { touch = null; reset(); }
      }, { passive: true });
      eye.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
        play();
      }, { passive: true });
      eye.addEventListener('pointermove', event => {
        if (touch && touch.id === event.pointerId
          && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 9) {
          touch = null;
          reset();
        }
      }, { passive: true });
      // An accepted touch runs one 1.6-second cycle after release. Scrolling and
      // pointer cancellation reset immediately without blocking native gestures.
      eye.addEventListener('pointerup', () => { touch = null; }, { passive: true });
      eye.addEventListener('pointercancel', () => { touch = null; reset(); }, { passive: true });
      resets.push(() => { touch = null; reset(); });
    });

    const resetAll = () => resets.forEach(reset => reset());
    if (motion.addEventListener) motion.addEventListener('change', resetAll);
    else motion.addListener(resetAll);
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
