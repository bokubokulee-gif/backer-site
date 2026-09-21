import * as THREE from 'three';

// Geometry and expressions adapted from the supplied RobotHero component.
// This module owns only the robot canvas; the research controls stay in HTML.
export function mountResearchRobot(host) {
  if (!host) return () => {};

  const GOLD = '#e9bd86';
  const GREEN = '#56d39a';
  const greeting = host.closest('.research-robot-wrap')?.querySelector('.robot-greeting');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const disposables = new Set();
  const removeListeners = [];
  let renderer;
  let scene;
  let camera;
  let body;
  let head;
  let glasses;
  let glassMaterial;
  let eyeMaterial;
  let tipMaterial;
  let haloMaterial;
  let resizeObserver;
  let intersectionObserver;
  let frame = 0;
  let stopped = false;
  let inView = true;
  let ready = false;
  let reduced = media.matches;
  let width = 0;
  let height = 0;
  let previousFrame = 0;
  let frameGate = 0;
  let glassesOn = false;
  let lastPointer = null;
  let pointerDown = null;
  let suppressPointerClick = false;
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

  function stop() {
    if (stopped) return;
    stopped = true;
    if (greeting) greeting.textContent = '';
    cancelAnimationFrame(frame);
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

    const blinkPhase = (elapsed + 1.1) % 4.1;
    const blink = !reduced && blinkPhase < 0.25
      ? Math.max(0.075, 1 - Math.sin((blinkPhase / 0.25) * Math.PI)) : 1;
    eyes.forEach(eye => {
      eye.group.scale.set(1.1, 1.1 * blink, 1.1);
    });
    glasses.visible = glassesOn;

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
      }
    } catch {
      unavailable();
      return;
    }
    if (!reduced) requestFrame();
  }

  function react() {
    if (stopped) return;
    glassesOn = !glassesOn;
    glasses.visible = glassesOn;
    host.dataset.robotGlasses = glassesOn ? 'on' : 'off';
    host.setAttribute('aria-pressed', String(glassesOn));
    if (greeting) greeting.textContent = glassesOn ? 'A clearer view to the future.' : '';
    requestFrame();
  }

  function resetLook() {
    lastPointer = null;
    if (pointerDown) suppressPointerClick = true;
    pointerDown = null;
    look.x = look.y = 0;
    requestFrame();
  }

  function updateLook() {
    if (!lastPointer || stopped) return;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dx = lastPointer.x - centerX;
    const dy = lastPointer.y - centerY;
    // Map each side of the robot to the viewport edge, not the canvas edge.
    // This keeps the head responsive after the pointer leaves the robot area.
    look.x = THREE.MathUtils.clamp(dx / Math.max(1, dx < 0 ? centerX : window.innerWidth - centerX), -1, 1);
    look.y = THREE.MathUtils.clamp(-dy / Math.max(1, dy < 0 ? centerY : window.innerHeight - centerY), -1, 1);
    requestFrame();
  }

  function updatePointer(event) {
    if (stopped || event.isPrimary === false) return;
    if (pointerDown && event.pointerId === pointerDown.id &&
        Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) >= 12) {
      pointerDown.moved = true;
    }
    // Mouse and pen hover track pagewide. Touch only controls the robot itself.
    if (event.pointerType === 'touch' && !host.contains(event.target)) return;
    lastPointer = { x: event.clientX, y: event.clientY };
    updateLook();
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
    updateLook();
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

  function makeEye(x, yaw, topGeometry, bottomGeometry) {
    const group = new THREE.Group();
    group.name = x < 0 ? 'research-robot-eye-left' : 'research-robot-eye-right';
    group.position.set(x, -0.02, 0.29);
    group.rotation.y = yaw;
    group.scale.setScalar(1.1);
    head.add(group);
    const normal = new THREE.Group();
    group.add(normal);
    // Both eyes share their geometries and material.
    normal.add(new THREE.Mesh(topGeometry, eyeMaterial));
    normal.add(new THREE.Mesh(bottomGeometry, eyeMaterial));
    eyes.push({ group, normal });
  }

  function makeGlasses() {
    glasses = new THREE.Group();
    glasses.name = 'research-robot-glasses';
    glasses.visible = false;
    head.add(glasses);
    const frameSurface = material({
      color: GOLD, roughness: 0.24, metalness: 0.62,
      emissive: '#4a2d12', emissiveIntensity: 0.12,
    });
    const lensSurface = own(new THREE.MeshBasicMaterial({
      color: '#fff2dc', transparent: true, opacity: 0.045,
      depthWrite: false, toneMapped: false,
    }));
    class LensRimCurve extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const angle = t * Math.PI * 2;
        return target.set(Math.cos(angle) * 0.067, Math.sin(angle) * 0.055, 0);
      }
    }
    const rimGeometry = own(new THREE.TubeGeometry(new LensRimCurve(), 56, 0.0056, 8, true));
    const lensGeometry = own(new THREE.CircleGeometry(1, 48));
    for (const direction of [-1, 1]) {
      const lens = new THREE.Group();
      lens.position.set(direction * 0.079, -0.02, 0.323);
      lens.rotation.y = direction * 0.13;
      glasses.add(lens);
      lens.add(new THREE.Mesh(rimGeometry, frameSurface));
      const pane = new THREE.Mesh(lensGeometry, lensSurface);
      pane.name = 'research-robot-clear-lens';
      pane.scale.set(0.065, 0.053, 1);
      pane.position.z = -0.001;
      lens.add(pane);
      const temple = new THREE.CatmullRomCurve3([
        new THREE.Vector3(direction * 0.145, -0.02, 0.316),
        new THREE.Vector3(direction * 0.224, -0.01, 0.245),
        new THREE.Vector3(direction * 0.286, -0.015, 0.11),
        new THREE.Vector3(direction * 0.28, -0.043, 0.04),
      ]);
      mesh(glasses, new THREE.TubeGeometry(temple, 24, 0.0043, 8, false), frameSurface);
    }
    const bridge = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.027, 0.009, 0.33),
      new THREE.Vector3(0, 0.028, 0.345),
      new THREE.Vector3(0.027, 0.009, 0.33),
    );
    mesh(glasses, new THREE.TubeGeometry(bridge, 18, 0.005, 8, false), frameSurface);
  }

  function makeBodyMark() {
    // Four alpha contours traced from img/backer-mark.png, simplified within two
    // source pixels. Preserve its open rays: there is no badge or backing disk.
    const contours = [
      [[48,166], [57,141], [81,99], [98,78], [132,48], [167,28], [201,16], [233,10], [275,10], [46,293], [39,260], [38,225], [41,195]],
      [[242,212], [67,330], [60,332], [55,319], [61,313], [372,46], [377,44], [390,53], [423,86], [424,92]],
      [[311,301], [82,366], [72,354], [72,351], [79,348], [470,184], [476,224], [475,255]],
      [[344,366], [438,359], [411,395], [372,427], [330,448], [277,460], [224,458], [171,442], [134,421], [97,387]],
    ];
    const scale = 0.000625;
    const shapes = contours.map(contour => {
      const shape = new THREE.Shape();
      contour.forEach(([x, y], index) => {
        const point = [(x - 257) * scale, (235 - y) * scale];
        if (index) shape.lineTo(...point);
        else shape.moveTo(...point);
      });
      shape.closePath();
      return shape;
    });
    const source = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.009, steps: 1, bevelEnabled: true,
      bevelThickness: 0.0032, bevelSize: 0.0028, bevelSegments: 3,
    });
    const positions = source.getAttribute('position');
    const normals = source.getAttribute('normal');
    const surfaces = [[], []];
    const vertex = index => [positions.getX(index), positions.getY(index), positions.getZ(index),
      normals.getX(index), normals.getY(index), normals.getZ(index)];
    const midpoint = (a, b) => a.map((value, index) => (value + b[index]) * 0.5);
    const edgeLengthSquared = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    function subdivide(a, b, c, output) {
      const ab = edgeLengthSquared(a, b);
      const bc = edgeLengthSquared(b, c);
      const ca = edgeLengthSquared(c, a);
      // Short cap triangles follow the sphere instead of cutting a flat chord
      // through the cream body. The bevel normals are interpolated as well.
      if (Math.max(ab, bc, ca) > 0.025 ** 2) {
        if (ab >= bc && ab >= ca) {
          const mid = midpoint(a, b);
          subdivide(a, mid, c, output); subdivide(mid, b, c, output);
        } else if (bc >= ca) {
          const mid = midpoint(b, c);
          subdivide(a, b, mid, output); subdivide(a, mid, c, output);
        } else {
          const mid = midpoint(c, a);
          subdivide(a, b, mid, output); subdivide(mid, b, c, output);
        }
        return;
      }
      output.push(a, b, c);
    }
    source.groups.forEach(group => {
      const output = surfaces[group.materialIndex];
      for (let index = group.start; index < group.start + group.count; index += 3) {
        subdivide(vertex(index), vertex(index + 1), vertex(index + 2), output);
      }
    });
    source.dispose();
    const geometry = new THREE.BufferGeometry();
    const curvedPositions = [];
    const curvedNormals = [];
    const normal = new THREE.Vector3();
    let offset = 0;
    surfaces.forEach((vertices, materialIndex) => {
      vertices.forEach(([x, y, z, nx, ny, nz]) => {
        const surfaceZ = Math.sqrt(0.43 ** 2 - x * x - y * y);
        curvedPositions.push(x, y, surfaceZ + z + 0.0008);
        // Inverse-transpose of the curved projection preserves real bevel
        // highlights as the body turns; the mark is actual surface geometry.
        normal.set(nx + x / surfaceZ * nz, ny + y / surfaceZ * nz, nz).normalize();
        curvedNormals.push(normal.x, normal.y, normal.z);
      });
      geometry.addGroup(offset, vertices.length, materialIndex);
      offset += vertices.length;
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(curvedPositions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(curvedNormals, 3));
    geometry.computeBoundingSphere();
    const faceSurface = material({ color: '#ddcfb6', roughness: 0.4, metalness: 0.16 });
    const edgeSurface = material({ color: '#b29d7b', roughness: 0.46, metalness: 0.24 });
    const mark = mesh(body, geometry, [faceSurface, edgeSurface]);
    mark.name = 'research-robot-body-mark';
    mark.castShadow = true;
    mark.userData.source = 'img/backer-mark.png';
    mark.userData.reliefDepth = 0.0122;
  }

  function isNestedControl(event) {
    const control = event.target?.closest?.('a, button, input, select, textarea, [contenteditable="true"]');
    return Boolean(control && control !== host);
  }

  try {
    host.dataset.robotState = 'loading';
    host.dataset.robotGlasses = 'off';
    host.setAttribute('aria-pressed', 'false');
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
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
    // Only the small relief casts a shadow. A bounded 512px map supplies its
    // contact shading without changing the existing head/glasses lighting.
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    Object.assign(key.shadow.camera, { left: -0.8, right: 0.8, top: 0.8, bottom: -0.8, near: 1, far: 10 });
    key.shadow.bias = -0.0001;
    key.shadow.normalBias = 0.001;
    key.shadow.radius = 1.5;
    own(key.shadow);
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
    const casing = mesh(body, new THREE.SphereGeometry(0.43, 48, 32, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85), chassis);
    casing.name = 'research-robot-chassis';
    casing.receiveShadow = true;
    makeBodyMark();
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

    const topGeometry = own(new THREE.TubeGeometry(eyePath(1), 20, 0.0042, 8, false));
    const bottomGeometry = own(new THREE.TubeGeometry(eyePath(-1), 20, 0.0042, 8, false));
    makeEye(-0.07, -0.2, topGeometry, bottomGeometry);
    makeEye(0.07, 0.2, topGeometry, bottomGeometry);
    makeGlasses();
    makeEar(head, -0.29, true, surfaces);
    makeEar(head, 0.29, false, surfaces);
    // A subtle ground halo echoes the page's gold/green orbit without postprocessing.
    mesh(scene, new THREE.RingGeometry(0.37, 0.375, 72), haloMaterial, [0, -0.741, 0], [-Math.PI / 2, 0, 0]);
    makeShadow();

    listen(document, 'pointermove', updatePointer, { passive: true, capture: true });
    listen(document, 'pointerleave', resetLook, { passive: true });
    listen(window, 'blur', resetLook);
    listen(window, 'scroll', updateLook, { passive: true, capture: true });
    listen(host, 'pointerdown', event => {
      if (event.button !== 0 || event.isPrimary === false || isNestedControl(event)) return;
      updatePointer(event);
      pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      suppressPointerClick = false;
    }, { passive: true });
    listen(document, 'pointerup', event => {
      if (!pointerDown || pointerDown.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      suppressPointerClick = pointerDown.moved || distance >= 12;
      pointerDown = null;
    }, { passive: true, capture: true });
    listen(document, 'pointercancel', event => {
      if (!pointerDown || pointerDown.id !== event.pointerId) return;
      pointerDown = null;
      suppressPointerClick = true;
    }, { passive: true, capture: true });
    // Native click is the single activation path: pointer, touch and assistive clicks all work.
    listen(host, 'click', event => {
      if ((event.button !== undefined && event.button !== 0) || isNestedControl(event)) return;
      const dragged = suppressPointerClick && event.detail !== 0;
      suppressPointerClick = false;
      if (!dragged) react();
    });
    listen(host, 'keydown', event => {
      if (isNestedControl(event)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) host.click();
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
    listen(host, 'research-preview-change', event => {
      accentTarget.set(event.detail?.preview === 'attention' ? GREEN : GOLD);
      requestFrame();
    });
    listen(media, 'change', () => {
      reduced = media.matches;
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
  };
}
