import createGlobe from './vendor/cobe.mjs';

const root = document.querySelector('[data-globe-live]');
const canvas = root && root.querySelector('[data-globe-canvas]');

if (root && canvas) {
  const markers = [
    { id: 'sf', location: [37.78, -122.44] },
    { id: 'london', location: [51.51, -0.13] },
    { id: 'tokyo', location: [35.68, 139.65] },
    { id: 'paris', location: [48.86, 2.35] },
    { id: 'sydney', location: [-33.87, 151.21] },
    { id: 'nyc', location: [40.71, -74.01] }
  ];
  const speed = 0.0022;
  const baseTheta = 0.2;
  const globeScale = 0.97;
  const markerElevation = 0.015;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labelHost = root.querySelector('[data-globe-labels]');
  const network = root.closest('.val-asset-network');
  const markerLabels = [];

  let globe = null;
  let frameId = 0;
  let lastFrame = 0;
  let phi = 0;
  let phiOffset = 0;
  let thetaOffset = 0;
  let dragPhi = 0;
  let dragTheta = 0;
  let pointerStart = null;
  let inView = false;
  let destroyed = false;
  let labelSize = 0;
  let rendererUnavailable = false;

  if (labelHost) {
    markers.slice(0, 3).forEach((marker) => {
      const label = document.createElement('span');
      label.className = 'val-globe-label';
      label.setAttribute('aria-hidden', 'true');
      label.dataset.markerId = marker.id;

      const dot = document.createElement('i');
      dot.className = 'val-globe-label-dot';
      const live = document.createElement('b');
      live.textContent = 'FLOW';

      label.append(dot, live);
      labelHost.appendChild(label);
      markerLabels.push({ label, marker });
    });
  }

  function projectMarker(location) {
    const latitude = location[0] * Math.PI / 180;
    const longitude = location[1] * Math.PI / 180 - Math.PI;
    const cosLatitude = Math.cos(latitude);
    const radius = 0.8 + markerElevation;
    const point = [
      -cosLatitude * Math.cos(longitude) * radius,
      Math.sin(latitude) * radius,
      cosLatitude * Math.sin(longitude) * radius
    ];
    const globePhi = phi + phiOffset + dragPhi;
    const globeTheta = baseTheta + thetaOffset + dragTheta;
    const cosTheta = Math.cos(globeTheta);
    const cosPhi = Math.cos(globePhi);
    const sinTheta = Math.sin(globeTheta);
    const sinPhi = Math.sin(globePhi);
    const projectedX = cosPhi * point[0] + sinPhi * point[2];
    const projectedY = sinPhi * sinTheta * point[0] + cosTheta * point[1] -
      cosPhi * sinTheta * point[2];
    const depth = -sinPhi * cosTheta * point[0] + sinTheta * point[1] +
      cosPhi * cosTheta * point[2];

    return {
      x: (projectedX * globeScale + 1) / 2,
      y: (-projectedY * globeScale + 1) / 2,
      visible: depth >= 0 || projectedX * projectedX + projectedY * projectedY >= 0.64
    };
  }

  function updateMarkerLabels() {
    if (!labelHost || !markerLabels.length) return;
    const size = labelSize || labelHost.clientWidth;
    if (!size) return;
    labelSize = size;
    markerLabels.forEach(({ label, marker }) => {
      const position = projectMarker(marker.location);
      label.style.setProperty('--marker-x', `${position.x * size}px`);
      label.style.setProperty('--marker-y', `${position.y * size}px`);
      label.classList.toggle('is-visible', position.visible);
    });
  }

  function updateGlobe() {
    if (!globe) return;
    globe.update({
      phi: phi + phiOffset + dragPhi,
      theta: baseTheta + thetaOffset + dragTheta
    });
    updateMarkerLabels();
  }

  function render(now) {
    frameId = 0;
    if (!globe || !inView || document.hidden || destroyed) return;
    const elapsed = lastFrame ? Math.min(2, (now - lastFrame) / 16.667) : 1;
    lastFrame = now;
    if (!pointerStart && !reduceMotion) phi += speed * elapsed;
    updateGlobe();
    if (!reduceMotion || pointerStart) frameId = requestAnimationFrame(render);
  }

  function startRendering() {
    if (!globe || frameId || !inView || document.hidden || destroyed) return;
    lastFrame = 0;
    if (reduceMotion && !pointerStart) {
      updateGlobe();
    } else {
      if (network) network.classList.add('is-globe-spinning');
      frameId = requestAnimationFrame(render);
    }
  }

  function stopRendering() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
    if (network) network.classList.remove('is-globe-spinning');
  }

  function renderedFrameVisible() {
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!context || !canvas.width || !canvas.height) return false;
      const pixel = new Uint8Array(4);
      context.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel);
      return pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 8;
    } catch (_error) {
      return false;
    }
  }

  function showFallback(message) {
    stopRendering();
    root.classList.remove('is-ready');
    root.classList.add('is-fallback');
    if (message) console.warn(message);
  }

  function initGlobe() {
    if (globe || destroyed || rendererUnavailable) return;
    const size = Math.round(canvas.clientWidth);
    if (!size) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    try {
      root.classList.remove('is-ready', 'is-fallback');
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size,
        height: size,
        phi: 0,
        theta: baseTheta,
        dark: 1,
        diffuse: 1.35,
        scale: globeScale,
        mapSamples: 16000,
        mapBrightness: 8,
        mapBaseBrightness: 0,
        baseColor: [0.95, 0.95, 0.95],
        markerColor: [1, 0.985, 0.96],
        glowColor: [0.96, 0.95, 0.92],
        markerElevation,
        markers: markers.map((marker) => ({
          location: marker.location,
          size: 0.024,
          color: [1, 0.985, 0.96]
        })),
        arcs: [],
        arcColor: [1, 0.985, 0.96],
        arcWidth: 0.35,
        arcHeight: 0.18,
        opacity: 0.98
      });
      updateGlobe();
      if (!renderedFrameVisible()) {
        try { globe.destroy(); } catch (_error) {}
        globe = null;
        rendererUnavailable = true;
        showFallback('Backer globe renderer did not produce a WebGL frame; retaining the visual poster.');
        return;
      }
      root.classList.add('is-ready');
      startRendering();
    } catch (error) {
      globe = null;
      rendererUnavailable = true;
      showFallback('Backer globe renderer could not initialize; retaining the visual poster.');
    }
  }

  function resizeGlobe() {
    const size = Math.round(canvas.clientWidth);
    if (!size) return;
    labelSize = labelHost ? Math.round(labelHost.clientWidth) : size;
    if (!globe) {
      initGlobe();
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    globe.update({ width: size, height: size, devicePixelRatio: dpr });
    updateGlobe();
  }

  function endPointer(event) {
    if (!pointerStart) return;
    phiOffset += dragPhi;
    thetaOffset = Math.max(-0.42, Math.min(0.42, thetaOffset + dragTheta));
    dragPhi = 0;
    dragTheta = 0;
    pointerStart = null;
    root.classList.remove('is-grabbing');
    try { canvas.releasePointerCapture(event.pointerId); } catch (_error) { /* no-op */ }
    startRendering();
  }

  canvas.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
    root.classList.add('is-grabbing');
    try { canvas.setPointerCapture(event.pointerId); } catch (_error) { /* no-op */ }
    startRendering();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointerStart) return;
    dragPhi = (event.clientX - pointerStart.x) / 300;
    dragTheta = (event.clientY - pointerStart.y) / 1000;
    updateGlobe();
  });
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stopRendering();
    try { if (globe) globe.destroy(); } catch (_error) {}
    globe = null;
    rendererUnavailable = true;
    showFallback('Backer globe WebGL context was lost; retaining the visual poster until recovery.');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    rendererUnavailable = false;
    root.classList.remove('is-ready', 'is-fallback');
    initGlobe();
  });

  const resizeObserver = new ResizeObserver(resizeGlobe);
  resizeObserver.observe(canvas);

  const visibilityObserver = new IntersectionObserver((entries) => {
    inView = Boolean(entries[0] && entries[0].isIntersecting);
    if (inView) {
      initGlobe();
      startRendering();
    } else {
      stopRendering();
    }
  }, { threshold: 0.08, rootMargin: '120px 0px 120px 0px' });
  visibilityObserver.observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRendering();
    } else {
      startRendering();
    }
  });

  window.addEventListener('pagehide', (event) => {
    stopRendering();
    if (event.persisted) return;
    destroyed = true;
    visibilityObserver.disconnect();
    resizeObserver.disconnect();
    if (globe) globe.destroy();
    globe = null;
  });

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || destroyed) return;
    startRendering();
  });
}
