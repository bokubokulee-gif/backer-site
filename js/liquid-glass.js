/* =========================================================
   BACKER — liquid-glass refraction filter
   Injects the shared SVG distortion filter (#liquid-glass)
   that the .layer / .tile / .opener / .role-card writing
   blocks reference from their backdrop-filter chain.

   The SVG warps the frosted backdrop seen through each panel,
   giving the iOS "liquid glass" refraction. Browsers that don't
   support url() in backdrop-filter (Safari / Firefox) simply fall
   back to the CSS blur + specular highlights — still glassy, just
   without the liquid warp. No build step, runs fully offline.
   ========================================================= */
(function () {
  'use strict';

  function inject() {
    if (document.getElementById('liquid-glass-defs')) return;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'liquid-glass-defs');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

    // Low-frequency fractal noise → blurred → drives a gentle displacement
    // of the backdrop. Subtle scale so large panels refract softly rather
    // than smearing the text-bearing surface behind them.
    svg.innerHTML =
      '<filter id="liquid-glass" x="-25%" y="-25%" width="150%" height="150%" ' +
      'color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.009 0.012" ' +
          'numOctaves="2" seed="42" result="noise"/>' +
        '<feGaussianBlur in="noise" stdDeviation="2.2" result="smoothNoise"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="48" ' +
          'xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';

    (document.body || document.documentElement).appendChild(svg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
