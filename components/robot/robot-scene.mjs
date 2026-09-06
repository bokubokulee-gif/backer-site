import * as THREE from 'three';

// Geometry and expressions adapted from the supplied RobotHero component.
// This module owns only the robot canvas; the research controls stay in HTML.
export function mountResearchRobot(host) {
  if (!host) return () => {};

  const GOLD = '#e9bd86';
  const GREEN = '#56d39a';
  const status = host.querySelector('.robot-status') || host.closest('.research-robot-wrap')?.querySelector('.robot-status');
  const originalStatus = status?.textContent || '';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const disposables = new Set();
  const removeListeners = [];
  let renderer;
  let scene;
  let camera;
  let body;
  let head;
  let glassMaterial;
  let eyeMaterial;
  let tipMaterial;
  let haloMaterial;
  let resizeObserver;
  let intersectionObserver;
  let frame = 0;
  let heartTimer = 0;
  let stopped = false;
  let inView = true;
  let ready = false;
  let reduced = media.matches;
  let width = 0;
  let height = 0;
  let previousFrame = 0;
  let frameGate = 0;
  let lovedUntil = 0;
  let pointerDown = null;
  const look = { x: 0, y: 0 };
  const eyes = [];
  const initialPreview = host.dataset.preview || host.closest('[data-preview]')?.dataset.preview;
  const accent = new THREE.Color(initialPreview === 'attention' ? GREEN : GOLD);
  const accentTarget = accent.clone();
  const startedAt = performance.now();

  function own(resource) {
    disposables.add(resource);
    return resource;
  }

  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    removeListeners.push(() => target.removeEventListener(event, handler, options));
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function hint() {
    if (reduced) return 'Use arrow keys to look · Press Enter to say hello';
    return coarse.matches ? 'Touch to look · Tap to say hello' : 'Move your cursor · Tap to say hello';
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(heartTimer);
    frame = 0;
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    removeListeners.splice(0).forEach(remove => remove());
    disposables.forEach(resource => resource.dispose());
    disposables.clear();
    if (renderer) {
      renderer.domElement.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  }

  function unavailable() {
    host.dataset.robotState = 'unavailable';
    host.setAttribute('aria-disabled', 'true');
    host.tabIndex = -1;
    setStatus('Choose a research preview below');
    stop();
  }

  function requestFrame() {
    if (stopped || frame || !inView || document.hidden || !width || !height) return;
    frame = requestAnimationFrame(renderFrame);
  }

  function suspendOrResume() {
    if (document.hidden || !inView) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      previousFrame = 0;
      frameGate = 0;
      requestFrame();
    }
  }

  function drawPose(now, delta) {
    const elapsed = (now - startedAt) / 1000;
    const damping = reduced ? 1 : 1 - Math.exp(-10 * delta);
    const headDamping = reduced ? 1 : 1 - Math.exp(-15 * delta);
    // Small local movement keeps the robot within its reserved central stage.
    const idle = reduced ? 0 : Math.sin(elapsed * 1.35) * 0.011;
    body.position.x = THREE.MathUtils.lerp(body.position.x, look.x * 0.055, damping);
    body.position.y = THREE.MathUtils.lerp(body.position.y, -0.30 + idle, damping);
    body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -look.y * 0.055, damping);
    body.rotation.y = THREE.MathUtils.lerp(body.rotation.y, -look.x * 0.11, damping);
    body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, -look.x * 0.045, damping);
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, look.x * 0.39, headDamping);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -look.y * 0.19, headDamping);

    const loved = now < lovedUntil;
    const blinkPhase = (elapsed + 1.1) % 4.1;
    const blink = !reduced && !loved && blinkPhase < 0.25
      ? Math.max(0.075, 1 - Math.sin((blinkPhase / 0.25) * Math.PI)) : 1;
    eyes.forEach(eye => {
      eye.normal.visible = !loved;
      eye.heart.visible = loved;
      eye.group.scale.set(1.1, 1.1 * blink, 1.1);
    });

    accent.lerp(accentTarget, reduced ? 1 : 1 - Math.exp(-7 * delta));
    eyeMaterial.color.copy(accent);
    tipMaterial.color.copy(accent);
    tipMaterial.emissive.copy(accent);
    glassMaterial.uniforms.color.value.copy(accent);
    haloMaterial.color.copy(accent);
  }

  function renderFrame(now) {
    frame = 0;
    if (stopped || !inView || document.hidden) return;
    const interval = 1000 / 45;
    if (!reduced && frameGate && now - frameGate < interval - 0.5) {
      requestFrame();
      return;
    }
    const delta = previousFrame ? Math.min((now - previousFrame) / 1000, 0.08) : 1 / 45;
    previousFrame = now;
    frameGate = frameGate ? now - ((now - frameGate) % interval) : now;
    try {
      drawPose(now, delta);
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        host.dataset.robotState = 'ready';
        setStatus(hint());
      }
    } catch {
      unavailable();
      return;
    }
    if (!reduced) requestFrame();
  }

  function react() {
    if (stopped) return;
    lovedUntil = performance.now() + 1900;
    setStatus('Hello, curious human.');
    clearTimeout(heartTimer);
    heartTimer = window.setTimeout(() => {
      lovedUntil = 0;
      setStatus(hint());
      requestFrame();
    }, 1900);
    requestFrame();
  }

  function updatePointer(event) {
    if (stopped || event.target.closest?.('a, button, input, select')) return;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    look.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    look.y = THREE.MathUtils.clamp(1 - ((event.clientY - bounds.top) / bounds.height) * 2, -1, 1);
    requestFrame();
  }

  function resize() {
    if (stopped) return;
    const bounds = host.getBoundingClientRect();
    width = Math.round(bounds.width);
    height = Math.round(bounds.height);
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestFrame();
  }

  function material(properties) {
    return own(new THREE.MeshStandardMaterial(properties));
  }

  function mesh(parent, geometry, surface, position, rotation) {
    const result = new THREE.Mesh(own(geometry), surface);
    if (position) result.position.set(...position);
    if (rotation) result.rotation.set(...rotation);
    parent.add(result);
    return result;
  }

  function speckleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#f1eade';
    context.fillRect(0, 0, 256, 256);
    // A deterministic, low-contrast version of the source's procedural finish.
    let seed = 4197;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 2400; i += 1) {
      context.beginPath();
      context.arc(random() * 256, random() * 256, 0.3 + random() * 0.6, 0, Math.PI * 2);
      context.fillStyle = random() > 0.2 ? 'rgba(78,64,44,.25)' : 'rgba(255,251,243,.7)';
      context.fill();
    }
    const texture = own(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  function makeShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(0,0,0,.64)');
    gradient.addColorStop(0.45, 'rgba(0,0,0,.24)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = own(new THREE.CanvasTexture(canvas));
    const surface = own(new THREE.MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, opacity: 0.75,
    }));
    mesh(scene, new THREE.PlaneGeometry(1.35, 0.9), surface, [0, -0.744, 0], [-Math.PI / 2, 0, 0]);
  }

  function makeEar(parent, x, isLeft, surfaces) {
    const direction = isLeft ? -1 : 1;
    const ear = new THREE.Group();
    ear.position.set(x, 0, 0);
    ear.scale.setScalar(1.3);
    parent.add(ear);
    mesh(ear, new THREE.CylinderGeometry(0.04, 0.04, 0.025, 24), surfaces.earBase, null, [0, 0, Math.PI / 2]);
    mesh(ear, new THREE.TorusGeometry(0.032, 0.008, 10, 24), surfaces.gold, [direction * 0.012, 0, 0], [0, Math.PI / 2, 0]);
    mesh(ear, new THREE.CylinderGeometry(0.025, 0.025, 0.006, 24), surfaces.earCenter, [direction * 0.017, 0, 0], [0, 0, Math.PI / 2]);
    const antenna = new THREE.Group();
    antenna.position.set(direction * 0.015, 0.035, 0);
    antenna.rotation.x = -0.4;
    ear.add(antenna);
    mesh(antenna, new THREE.CylinderGeometry(0.006, 0.008, 0.02, 12), surfaces.gold, [0, 0.01, 0]);
    mesh(antenna, new THREE.CylinderGeometry(0.003, 0.003, 0.1, 8), surfaces.gold, [0, 0.06, 0]);
    mesh(antenna, new THREE.SphereGeometry(0.008, 12, 8), tipMaterial, [0, 0.11, 0]);
  }

  function eyePath(sign) {
    const path = new THREE.CurvePath();
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const gap = 0.005;
    const point = (x, y) => new THREE.Vector3(x, y * sign, 0);
    path.add(new THREE.LineCurve3(point(-w, gap), point(-w, h - r)));
    path.add(new THREE.QuadraticBezierCurve3(point(-w, h - r), point(-w, h), point(-w + r, h)));
    path.add(new THREE.LineCurve3(point(-w + r, h), point(w - r, h)));
    path.add(new THREE.QuadraticBezierCurve3(point(w - r, h), point(w, h), point(w, h - r)));
    path.add(new THREE.LineCurve3(point(w, h - r), point(w, gap)));
    return path;
  }

  function makeEye(x, yaw, topGeometry, bottomGeometry, heartGeometry) {
    const group = new THREE.Group();
    group.position.set(x, -0.02, 0.29);
    group.rotation.y = yaw;
    group.scale.setScalar(1.1);
    head.add(group);
    const normal = new THREE.Group();
    group.add(normal);
    // Both eyes share their geometries and material.
    normal.add(new THREE.Mesh(topGeometry, eyeMaterial));
    normal.add(new THREE.Mesh(bottomGeometry, eyeMaterial));
    const heart = new THREE.Mesh(heartGeometry, eyeMaterial);
    heart.visible = false;
    group.add(heart);
    eyes.push({ group, normal, heart });
  }

  try {
    host.dataset.robotState = 'loading';
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = 'robot-canvas research-robot-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' });
    host.prepend(canvas);
    listen(canvas, 'webglcontextlost', event => {
      event.preventDefault();
      unavailable();
    });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0.045, 2.82);
    camera.lookAt(0, -0.055, 0);
    scene.add(new THREE.HemisphereLight('#fff0d8', '#504938', 1.1));
    const key = new THREE.DirectionalLight('#ffe8c6', 2.6);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight('#fff4e3', 1.35);
    fill.position.set(-3, 1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#e9bd86', 3.1);
    rim.position.set(-1, 3, -3);
    scene.add(rim);

    const texture = speckleTexture();
    const chassis = material({ color: '#d8ccb8', map: texture, roughness: 0.52, metalness: 0.1 });
    const surfaces = {
      gold: material({ color: '#b49a72', roughness: 0.31, metalness: 0.54 }),
      earBase: material({ color: '#c9bda9', roughness: 0.43, metalness: 0.24 }),
      earCenter: material({ color: '#75654e', roughness: 0.65, metalness: 0.24 }),
    };
    eyeMaterial = own(new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }));
    tipMaterial = material({ color: accent, emissive: accent, emissiveIntensity: 0.4, roughness: 0.28, metalness: 0.2 });
    haloMaterial = own(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.09, depthWrite: false, toneMapped: false }));
    glassMaterial = own(new THREE.ShaderMaterial({
      uniforms: { color: { value: accent.clone() }, power: { value: 3.8 }, intensity: { value: 0.55 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float power;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDirection = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(dot(viewDirection, normal), 0.0), power);
          gl_FragColor = vec4(color, fresnel * intensity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }));

    body = new THREE.Group();
    body.position.y = -0.3;
    scene.add(body);
    mesh(body, new THREE.SphereGeometry(0.43, 48, 32, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85), chassis);
    mesh(body, new THREE.TorusGeometry(0.235, 0.025, 12, 48), surfaces.gold, [0, 0.34, 0], [Math.PI / 2, 0, 0]);
    const neckProfile = [
      [0.1, -0.05], [0.215, -0.05], [0.28, 0.02], [0.295, 0.045],
      [0.27, 0.055], [0.1, 0.055], [0.1, 0.055],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(body, new THREE.LatheGeometry(neckProfile, 48), surfaces.gold, [0, 0.38, 0]);
    head = new THREE.Group();
    head.position.y = 0.6;
    body.add(head);
    const face = material({ color: '#101110', roughness: 0.36, metalness: 0.16 });
    mesh(head, new THREE.SphereGeometry(0.28, 48, 32), face);
    mesh(head, new THREE.SphereGeometry(0.3, 48, 32), glassMaterial);

    class HeartCurve extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const a = t * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(a), 3);
        const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
        return target.set(x * 0.002, (y + 6) * 0.002, 0);
      }
    }
    const topGeometry = own(new THREE.TubeGeometry(eyePath(1), 20, 0.0042, 8, false));
    const bottomGeometry = own(new THREE.TubeGeometry(eyePath(-1), 20, 0.0042, 8, false));
    const heartGeometry = own(new THREE.TubeGeometry(new HeartCurve(), 48, 0.0038, 8, true));
    makeEye(-0.07, -0.2, topGeometry, bottomGeometry, heartGeometry);
    makeEye(0.07, 0.2, topGeometry, bottomGeometry, heartGeometry);
    makeEar(head, -0.29, true, surfaces);
    makeEar(head, 0.29, false, surfaces);
    // A subtle ground halo echoes the page's gold/green orbit without postprocessing.
    mesh(scene, new THREE.RingGeometry(0.37, 0.375, 72), haloMaterial, [0, -0.741, 0], [-Math.PI / 2, 0, 0]);
    makeShadow();

    listen(host, 'pointermove', updatePointer, { passive: true });
    listen(host, 'pointerleave', () => {
      look.x = look.y = 0;
      pointerDown = null;
      requestFrame();
    }, { passive: true });
    listen(host, 'pointerdown', event => {
      if (event.button !== 0 || event.target.closest?.('a, button, input, select')) return;
      updatePointer(event);
      pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
    }, { passive: true });
    listen(host, 'pointerup', event => {
      if (!pointerDown || pointerDown.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      if (distance < 12 && performance.now() - pointerDown.at < 700) react();
      pointerDown = null;
    }, { passive: true });
    listen(host, 'pointercancel', () => { pointerDown = null; }, { passive: true });
    listen(host, 'keydown', event => {
      if (event.target.closest?.('a, button, input, select') && event.target !== host) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) react();
      } else if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        if (event.key === 'ArrowLeft') look.x = Math.max(-1, look.x - 0.35);
        if (event.key === 'ArrowRight') look.x = Math.min(1, look.x + 0.35);
        if (event.key === 'ArrowUp') look.y = Math.min(1, look.y + 0.35);
        if (event.key === 'ArrowDown') look.y = Math.max(-1, look.y - 0.35);
        requestFrame();
      } else if (event.key === 'Escape') {
        look.x = look.y = 0;
        requestFrame();
      }
    });
    listen(host, 'blur', () => { look.x = look.y = 0; requestFrame(); });
    listen(host, 'research-preview-change', event => {
      accentTarget.set(event.detail?.preview === 'attention' ? GREEN : GOLD);
      requestFrame();
    });
    listen(media, 'change', () => {
      reduced = media.matches;
      if (!lovedUntil) setStatus(hint());
      previousFrame = 0;
      requestFrame();
    });
    listen(document, 'visibilitychange', suspendOrResume);
    listen(window, 'resize', resize, { passive: true });
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    }
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver(entries => {
        inView = entries[0]?.isIntersecting ?? true;
        suspendOrResume();
      }, { rootMargin: '80px' });
      intersectionObserver.observe(host);
    }
    resize();
  } catch {
    unavailable();
  }

  return () => {
    stop();
    host.dataset.robotState = 'unavailable';
    if (status) status.textContent = originalStatus;
  };
}
