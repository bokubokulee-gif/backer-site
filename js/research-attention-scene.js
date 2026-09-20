/* A persistent population. Scroll bends its surface; a single external clock renders it. */
const COUNT = 1152;
const PATH_COUNT = 42;
const TAU = Math.PI * 2;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const smooth = n => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };
const RGB = ['245,243,238', '233,189,134', '86,211,154'];
const COLORS = ['#f5f3ee', '#e9bd86', '#56d39a'];

export function createAttentionScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { render() {}, setProgress() {}, setPaused() {}, setReducedMotion() {}, destroy() {} };

  let seed = 716203;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const gridX = new Float32Array(COUNT);
  const gridY = new Float32Array(COUNT);
  const sphereX = new Float32Array(COUNT);
  const sphereY = new Float32Array(COUNT);
  const sphereZ = new Float32Array(COUNT);
  const diskX = new Float32Array(COUNT);
  const diskZ = new Float32Array(COUNT);
  const selection = new Float32Array(COUNT);
  const diskFocus = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT * 3);
  const pointSize = new Float32Array(COUNT);
  const color = new Uint8Array(COUNT);
  const px = new Float32Array(COUNT);
  const py = new Float32Array(COUNT);
  const pz = new Float32Array(COUNT);
  const alpha = new Float32Array(COUNT);
  const radius = new Float32Array(COUNT);
  const pathAnchor = new Uint16Array(PATH_COUNT);
  const pathBend = new Float32Array(PATH_COUNT);
  const pathDrift = new Float32Array(PATH_COUNT);
  const pathPhase = new Float32Array(PATH_COUNT);
  const pathDepth = new Float32Array(PATH_COUNT);
  // Eight fixed depth buckets avoid a sort and avoid fresh arrays in the animation loop.
  const bucketHeads = new Int32Array(8);
  const nextPoint = new Int32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    seeds[i * 3] = random();
    seeds[i * 3 + 1] = random();
    seeds[i * 3 + 2] = random();
    pointSize[i] = .86 + random() * .24;
    const tint = random();
    color[i] = tint < .09 ? 1 : tint < .115 ? 2 : 0;
  }
  for (let j = 0; j < PATH_COUNT; j++) {
    pathBend[j] = (random() - .5) * .34;
    pathDrift[j] = (random() - .5) * .46;
    pathPhase[j] = random();
    pathDepth[j] = (random() - .5) * 1.24;
  }

  // Rasterize the optical falloff once. Each frame paints images rather than thousands of arcs.
  const sprites = [];
  for (let softness = 0; softness < 2; softness++) {
    for (let c = 0; c < 3; c++) {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 48;
      const paint = sprite.getContext('2d');
      const glow = paint.createRadialGradient(24, 24, 0, 24, 24, 24);
      glow.addColorStop(0, `rgba(${RGB[c]},1)`);
      glow.addColorStop(softness ? .20 : .38, `rgba(${RGB[c]},${softness ? '.86' : '1'})`);
      glow.addColorStop(softness ? .43 : .46, `rgba(${RGB[c]},${softness ? '.40' : '.88'})`);
      glow.addColorStop(.54, `rgba(${RGB[c]},${softness ? '.15' : '.12'})`);
      glow.addColorStop(.70, `rgba(${RGB[c]},0)`);
      glow.addColorStop(1, `rgba(${RGB[c]},0)`);
      paint.fillStyle = glow;
      paint.fillRect(0, 0, 48, 48);
      sprites.push(sprite);
    }
  }

  let width = 1;
  let height = 1;
  let dpr = 1;
  let mobile = false;
  let sceneHeight = 1;
  let sceneTop = 0;
  let sphereRadius = 1;
  let diskRadius = 1;
  let progress = 0;
  let paused = false;
  let reducedMotion = false;
  let destroyed = false;
  let elapsed = 0;
  let previousTime = null;
  let dirty = true;
  let ambient = null;

  function resize(contentRect) {
    if (destroyed) return;
    // CSS expansion transforms must never change the backing resolution or point coordinates.
    const nextWidth = Math.max(1, contentRect?.width || canvas.clientWidth || 1);
    const nextHeight = Math.max(1, contentRect?.height || canvas.clientHeight || 1);
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    mobile = width < 760 || height < 460;
    sceneTop = mobile ? 49 : 43;
    sceneHeight = Math.max(120, height - (mobile ? 245 : 210) - sceneTop);
    sphereRadius = mobile
      ? Math.min(width * .395, sceneHeight * .56)
      : Math.min(width * .34, height * .415);
    diskRadius = width * .405;
    const gridWidth = width * 1.025;
    const gridHeight = mobile ? sceneHeight + 62 : height * .97;
    const columns = Math.max(12, Math.round(Math.sqrt(COUNT * gridWidth / gridHeight)));
    const rows = Math.ceil(COUNT / columns);

    for (let i = 0; i < COUNT; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const u = col / (columns - 1) * 2 - 1;
      const v = row / (rows - 1) * 2 - 1;
      gridX[i] = u * gridWidth * .5;
      gridY[i] = v * gridHeight * .5;
      // Neighbours stay neighbours: a planar population wraps around longitude, not random targets.
      const longitude = u * Math.PI * .98 + (seeds[i * 3] - .5) * .12;
      const latitude = clamp(v * .977 + (seeds[i * 3 + 1] - .5) * .055, -.996, .996);
      const ring = Math.sqrt(1 - latitude * latitude);
      const shell = .958 + seeds[i * 3 + 2] * .042;
      sphereX[i] = Math.sin(longitude) * ring * shell;
      sphereY[i] = latitude * shell;
      sphereZ[i] = Math.cos(longitude) * ring * shell;
      // Flatten along the same meridians. Equal-area radii prevent a dense, noisy outer rim.
      const radial = Math.sqrt(1 - Math.abs(latitude));
      diskX[i] = Math.sin(longitude) * radial;
      diskZ[i] = Math.cos(longitude) * radial;
      selection[i] = Math.exp(-(u * u / .105 + v * v / .20) * 2.1);
      diskFocus[i] = Math.exp(-(diskX[i] * diskX[i] * 5.5 + diskZ[i] * diskZ[i] * 2.2));
    }
    for (let j = 0; j < PATH_COUNT; j++) {
      const targetX = -.91 + j / (PATH_COUNT - 1) * 1.82;
      let nearest = 0;
      let distance = Infinity;
      for (let i = 0; i < COUNT; i++) {
        const dx = diskX[i] - targetX;
        const dz = diskZ[i] - pathDepth[j];
        const candidate = dx * dx + dz * dz;
        if (candidate < distance) { distance = candidate; nearest = i; }
      }
      pathAnchor[j] = nearest;
    }
    ambient = ctx.createRadialGradient(width * .5, height * .43, 0, width * .5, height * .43, width * .48);
    ambient.addColorStop(0, 'rgba(233,189,134,.021)');
    ambient.addColorStop(.6, 'rgba(245,243,238,.005)');
    ambient.addColorStop(1, 'rgba(245,243,238,0)');
    dirty = true;
  }

  function drawPaths(opacity) {
    if (opacity < .002) return;
    const lineWidth = mobile ? .70 : .82;
    for (let j = 0; j < PATH_COUNT; j++) {
      const anchor = pathAnchor[j];
      const x0 = px[anchor];
      const y0 = py[anchor];
      const x1 = x0 + pathBend[j] * width * .23;
      const y1 = y0 - sceneHeight * .43;
      const x2 = x0 + (pathBend[j] * .65 + pathDrift[j] * .18) * width;
      const y2 = -height * .14;
      const x3 = x0 + pathDrift[j] * width;
      const y3 = -height * .45;
      ctx.strokeStyle = j % 11 === 0 ? COLORS[1] : j % 19 === 0 ? COLORS[2] : COLORS[0];
      ctx.globalAlpha = opacity * (.14 + j % 5 * .024);
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.stroke();
      const t = (elapsed * (.041 + j % 3 * .004) + pathPhase[j]) % 1;
      const inv = 1 - t;
      const x = inv * inv * inv * x0 + 3 * inv * inv * t * x1 + 3 * inv * t * t * x2 + t * t * t * x3;
      const y = inv * inv * inv * y0 + 3 * inv * inv * t * y1 + 3 * inv * t * t * y2 + t * t * t * y3;
      const tx = 3 * inv * inv * (x1 - x0) + 6 * inv * t * (x2 - x1) + 3 * t * t * (x3 - x2);
      const ty = 3 * inv * inv * (y1 - y0) + 6 * inv * t * (y2 - y1) + 3 * t * t * (y3 - y2);
      const length = Math.sqrt(tx * tx + ty * ty) || 1;
      const glint = mobile ? 4 : 6;
      ctx.globalAlpha = opacity * Math.sin(t * Math.PI) * .64;
      ctx.lineWidth = mobile ? 1 : 1.25;
      ctx.beginPath();
      ctx.moveTo(x - tx / length * glint, y - ty / length * glint);
      ctx.lineTo(x + tx / length * glint, y + ty / length * glint);
      ctx.stroke();
    }
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    if (ambient) { ctx.fillStyle = ambient; ctx.fillRect(0, 0, width, height); }
    const wrap = smooth(progress);
    const flatten = smooth(progress - 1);
    const sphereAmount = wrap * (1 - flatten);
    const rotation = elapsed * .024 * wrap;
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    // The camera first looks down into the changing field, then settles almost level with it.
    const pitch = -.075 - Math.sin(flatten * Math.PI) * .42 + flatten * .04;
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    const gridCenter = mobile ? sceneTop + sceneHeight * .51 : height * .47;
    const sphereCenter = mobile ? sceneTop + sceneHeight * .51 : height * .46;
    const diskCenter = mobile ? sceneTop + sceneHeight * .69 : height * .565;
    const centerY = gridCenter + (sphereCenter - gridCenter) * wrap + (diskCenter - sphereCenter) * flatten;
    const cameraDistance = Math.max(sphereRadius * 4.7, width * 1.14, 400);
    const baseRadius = mobile ? clamp(width * .0038, 1.3, 1.8) : clamp(width * .00235, 2.15, 3.25);
    const lowerFade = mobile ? Math.max(height - 203, sceneTop + sceneHeight + 30) : height + 15;
    bucketHeads.fill(-1);

    for (let i = 0; i < COUNT; i++) {
      const objectX = sphereX[i] * sphereRadius * (1 - flatten) + diskX[i] * diskRadius * flatten;
      const objectY = sphereY[i] * sphereRadius * (1 - flatten) + (seeds[i * 3] - .5) * 7 * flatten;
      const objectZ = sphereZ[i] * sphereRadius * (1 - flatten) + diskZ[i] * diskRadius * flatten;
      const rotatedX = objectX * cosRotation + objectZ * sinRotation;
      const rotatedZ = -objectX * sinRotation + objectZ * cosRotation;
      const tiltedY = objectY * cosPitch - rotatedZ * sinPitch;
      const tiltedZ = objectY * sinPitch + rotatedZ * cosPitch;
      const worldX = gridX[i] * (1 - wrap) + rotatedX * wrap;
      const worldY = gridY[i] * (1 - wrap) + tiltedY * wrap;
      const worldZ = tiltedZ * wrap;
      const perspective = cameraDistance / (cameraDistance - worldZ);
      const x = width * .5 + worldX * perspective;
      const y = centerY + worldY * perspective;
      const depth = clamp(.5 + tiltedZ / (Math.max(sphereRadius, diskRadius * flatten) * 2.1), 0, 1);
      const focus = selection[i] * (1 - flatten) + diskFocus[i] * flatten;
      const edgeX = smooth(Math.min(x + 10, width + 10 - x) / (width * .06));
      const edgeY = smooth(Math.min(y + 18, lowerFade - y) / 34);
      const gridOpacity = .23 + selection[i] * .74;
      const sphereOpacity = .16 + depth * depth * .41 + selection[i] * .46;
      const diskOpacity = .21 + depth * .30 + diskFocus[i] * .25;
      px[i] = x;
      py[i] = y;
      pz[i] = depth;
      alpha[i] = clamp((gridOpacity * (1 - wrap) + sphereOpacity * sphereAmount + diskOpacity * flatten) * edgeX * edgeY, 0, 1);
      radius[i] = baseRadius * pointSize[i] * (1 + focus * .16) * perspective
        * (1 - wrap * .25 + wrap * depth * .56 + flatten * .22);
      const bucket = clamp(Math.floor(depth * 7.999), 0, 7);
      nextPoint[i] = bucketHeads[bucket];
      bucketHeads[bucket] = i;
    }
    drawPaths(smooth((progress - 1.16) / .69));
    for (let bucket = 0; bucket < 8; bucket++) {
      for (let i = bucketHeads[bucket]; i !== -1; i = nextPoint[i]) {
        if (alpha[i] < .008) continue;
        ctx.globalAlpha = alpha[i] * (color[i] === 2 ? .7 : 1);
        const sprite = sprites[((pz[i] < .29 && wrap > .3) || (flatten > .5 && pz[i] > .86) ? 3 : 0) + color[i]];
        const size = radius[i] * 4.8;
        ctx.drawImage(sprite, px[i] - size * .5, py[i] - size * .5, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function render(nowMs = performance.now()) {
    if (destroyed) return false;
    if (document.hidden) { previousTime = null; return false; }
    const moving = !paused && !reducedMotion;
    if (moving && previousTime !== null) elapsed += clamp((nowMs - previousTime) / 1000, 0, .05);
    previousTime = nowMs;
    if (!dirty && !moving) return false;
    paint();
    dirty = false;
    return true;
  }
  function onResize() { resize(); }
  function onVisibility() { previousTime = null; dirty = true; }
  const observer = new ResizeObserver(entries => {
    if (entries.length) resize(entries[0].contentRect);
  });
  observer.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize, { passive: true });
  resize();
  render(0);

  return {
    render,
    setProgress(value) {
      if (destroyed || !Number.isFinite(value)) return;
      const next = clamp(value, 0, 2);
      if (next === progress) return;
      progress = next;
      dirty = true;
    },
    setPaused(value) {
      if (paused === Boolean(value)) return;
      paused = Boolean(value);
      previousTime = null;
      dirty = true;
    },
    setReducedMotion(value) {
      if (reducedMotion === Boolean(value)) return;
      reducedMotion = Boolean(value);
      previousTime = null;
      dirty = true;
    },
    destroy() {
      destroyed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    },
  };
}
