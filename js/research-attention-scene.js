/* A persistent, wandering population. A single external clock drives motion and scroll. */
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
  const seeds = new Float32Array(COUNT * 3);
  const pointSize = new Float32Array(COUNT);
  const color = new Uint8Array(COUNT);
  const px = new Float32Array(COUNT);
  const py = new Float32Array(COUNT);
  const pz = new Float32Array(COUNT);
  const alpha = new Float32Array(COUNT);
  const radius = new Float32Array(COUNT);
  const emphasis = new Float32Array(COUNT);
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
    // Keep identities and their neighbours across every viewport. Irregular cells plus
    // overlapping flight paths provide even coverage without visible rows or resets.
    const u = ((i % 36) + .03 + seeds[i * 3] * .94) / 36 * 2 - 1;
    const v = (Math.floor(i / 36) + .03 + seeds[i * 3 + 1] * .94) / 32 * 2 - 1;
    gridX[i] = u;
    gridY[i] = v;
    const longitude = u * Math.PI * .98;
    const latitude = clamp(v * .977, -.996, .996);
    const ring = Math.sqrt(1 - latitude * latitude);
    const shell = .26 + .72 * Math.cbrt(seeds[i * 3 + 2]);
    sphereX[i] = Math.sin(longitude) * ring * shell;
    sphereY[i] = latitude * shell;
    sphereZ[i] = Math.cos(longitude) * ring * shell;
    const radial = Math.sqrt(1 - Math.abs(latitude));
    diskX[i] = Math.sin(longitude) * radial;
    diskZ[i] = Math.cos(longitude) * radial;
  }
  for (let j = 0; j < PATH_COUNT; j++) {
    pathBend[j] = (random() - .5) * .34;
    pathDrift[j] = (random() - .5) * .46;
    pathPhase[j] = random();
    pathDepth[j] = (random() - .5) * 1.24;
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
      const phase = pathPhase[j] * TAU;
      const breeze = Math.sin(elapsed * .19 + phase) * .035 + Math.sin(elapsed * .31 + phase * 1.7) * .018;
      const curl = Math.cos(elapsed * .26 + phase * 1.3) * .030;
      // The entire curve wanders with its person. Pulses use these same control
      // points, so they always follow the visible current as it changes shape.
      const x1 = x0 + (pathBend[j] * .45 + breeze * .75) * width;
      const y1 = y0 - sceneHeight * (.30 + Math.sin(elapsed * .17 + phase) * .055);
      const x2 = x0 + (pathBend[j] * .85 + pathDrift[j] * .18 - breeze + curl) * width;
      const y2 = -height * .14 + Math.sin(elapsed * .21 + phase) * height * .035;
      const x3 = x0 + (pathDrift[j] + breeze * .65) * width;
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
    const gridWidth = width * 1.025;
    const gridHeight = mobile ? sceneHeight + 62 : height * .97;
    const diskThickness = mobile ? clamp(sceneHeight * .095, 15, 34) : height * .060;
    const cameraDistance = Math.max(sphereRadius * 4.7, width * 1.14, 400);
    const baseRadius = mobile ? clamp(width * .0038, 1.3, 1.8) : clamp(width * .00235, 2.15, 3.25);
    const emphasisRadiusGain = mobile ? .62 : .46;
    const lowerFade = mobile ? Math.max(height - 203, sceneTop + sceneHeight + 30) : height + 15;
    const focusX = Math.sin(elapsed * .17) * .14 + Math.sin(elapsed * .083) * .045;
    const focusY = Math.sin(elapsed * .13) * .15;
    const focusBreath = 1 + Math.sin(elapsed * .27) * .085;
    bucketHeads.fill(-1);

    for (let i = 0; i < COUNT; i++) {
      const a = seeds[i * 3];
      const b = seeds[i * 3 + 1];
      const c = seeds[i * 3 + 2];
      const u = gridX[i];
      const v = gridY[i];
      const orbit = elapsed * (.26 + b * .36) + a * TAU;
      const wander = elapsed * (.37 + a * .27) + c * TAU;
      // Broad currents share a spatial field; each person also has a different
      // looping path and a smaller, faster flutter. All are continuous in time.
      const driftX = Math.sin(v * 3.6 + elapsed * .23) * .050
        + Math.cos(u * 4.1 + v * 1.7 - elapsed * .17) * .024
        + Math.cos(orbit) * (.045 + c * .035) + Math.sin(wander) * .027
        + Math.sin(elapsed * (1.25 + a * .90) + c * TAU) * .010;
      const driftY = Math.cos(u * 3.4 - elapsed * .21) * .060
        + Math.sin(v * 3.1 - u * 1.6 + elapsed * .14) * .025
        + Math.sin(orbit) * (.060 + b * .040) + Math.cos(wander) * .024
        + Math.cos(elapsed * (1.05 + b * .86) + a * TAU) * .016;
      const driftZ = Math.sin(wander + u * 2.2) * .105
        + Math.cos(orbit * .73 + v * 2.5) * .065;
      const populationX = u + driftX;
      const populationY = v + driftY;
      const flowX = diskX[i] + driftX * .64;
      const flowZ = diskZ[i] + driftZ * .50;
      const objectX = (sphereX[i] + driftX * .82) * sphereRadius * (1 - flatten) + flowX * diskRadius * flatten;
      const objectY = (sphereY[i] + driftY * .82) * sphereRadius * (1 - flatten)
        + ((b - .5) * diskThickness + driftY * sphereRadius * .65) * flatten;
      const objectZ = (sphereZ[i] + driftZ * .70) * sphereRadius * (1 - flatten) + flowZ * diskRadius * flatten;
      const rotatedX = objectX * cosRotation + objectZ * sinRotation;
      const rotatedZ = -objectX * sinRotation + objectZ * cosRotation;
      const tiltedY = objectY * cosPitch - rotatedZ * sinPitch;
      const tiltedZ = objectY * sinPitch + rotatedZ * cosPitch;
      const worldX = populationX * gridWidth * .5 * (1 - wrap) + rotatedX * wrap;
      const worldY = populationY * gridHeight * .5 * (1 - wrap) + tiltedY * wrap;
      const worldZ = driftZ * Math.min(width, gridHeight) * .09 * (1 - wrap) + tiltedZ * wrap;
      const perspective = cameraDistance / (cameraDistance - worldZ);
      const x = width * .5 + worldX * perspective;
      const y = centerY + worldY * perspective;
      const depth = clamp(.5 + worldZ / (Math.max(sphereRadius, diskRadius * flatten) * 2.1), 0, 1);
      const focusDX = populationX - focusX;
      const focusDY = populationY - focusY;
      const populationFocus = Math.exp(-(focusDX * focusDX / .105 + focusDY * focusDY / .20) * 2.1 / focusBreath);
      const flowDX = flowX - focusX * 1.15;
      const flowDZ = flowZ - focusY * .75;
      const flowFocus = Math.exp(-(flowDX * flowDX * 5.5 + flowDZ * flowDZ * 2.2) / focusBreath);
      const focus = populationFocus * (1 - flatten) + flowFocus * flatten;
      // Give the selected population a clear core with a smooth falloff, especially on mobile.
      const selected = smooth((focus - .10) / .55);
      const edgeX = smooth(Math.min(x + 10, width + 10 - x) / (width * .06));
      const edgeY = smooth(Math.min(y + 18, lowerFade - y) / 34);
      const gridOpacity = .12 + selected * .84;
      const sphereOpacity = .11 + depth * depth * .28 + selected * .60;
      const diskOpacity = .14 + depth * .21 + selected * .50;
      px[i] = x;
      py[i] = y;
      pz[i] = depth;
      emphasis[i] = selected;
      alpha[i] = clamp((gridOpacity * (1 - wrap) + sphereOpacity * sphereAmount + diskOpacity * flatten) * edgeX * edgeY, 0, 1);
      radius[i] = baseRadius * pointSize[i] * (.92 + selected * emphasisRadiusGain) * perspective
        * (1 - wrap * .25 + wrap * depth * .56 + flatten * .22);
      const bucket = clamp(Math.floor(depth * 7.999), 0, 7);
      nextPoint[i] = bucketHeads[bucket];
      bucketHeads[bucket] = i;
    }
    drawPaths(smooth((progress - 1.16) / .69));
    for (let bucket = 0; bucket < 8; bucket++) {
      for (let i = bucketHeads[bucket]; i !== -1; i = nextPoint[i]) {
        if (alpha[i] < .008) continue;
        const spriteOffset = (pz[i] < .29 && wrap > .3) || (flatten > .5 && pz[i] > .86) ? 3 : 0;
        const size = radius[i] * 4.8;
        const x = px[i] - size * .5;
        const y = py[i] - size * .5;
        if (color[i] === 2) {
          // Green remains a quiet background accent; selected people resolve continuously to cream.
          ctx.globalAlpha = alpha[i] * .7 * (1 - emphasis[i]);
          ctx.drawImage(sprites[spriteOffset + 2], x, y, size, size);
          if (emphasis[i] > .001) {
            ctx.globalAlpha = alpha[i] * emphasis[i];
            ctx.drawImage(sprites[spriteOffset], x, y, size, size);
          }
        } else {
          ctx.globalAlpha = alpha[i];
          ctx.drawImage(sprites[spriteOffset + color[i]], x, y, size, size);
        }
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
