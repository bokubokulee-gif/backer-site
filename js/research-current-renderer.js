/* A moving current follows the wire's arc length, with a soft wake and a crisp core. */
const SAMPLES = 48;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createCurrentRenderer(ctx) {
  const xs = new Float32Array(SAMPLES + 1);
  const ys = new Float32Array(SAMPLES + 1);
  const distances = new Float32Array(SAMPLES + 1);
  const halos = ['245,243,238', '233,189,134'].map(rgb => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const paint = canvas.getContext('2d');
    const gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${rgb},.8)`);
    gradient.addColorStop(.12, `rgba(${rgb},.3)`);
    gradient.addColorStop(.38, `rgba(${rgb},.08)`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 128, 128);
    return canvas;
  });

  return function drawCurrent(x0, y0, x1, y1, x2, y2, x3, y3, elapsed, phase, opacity, mobile, index) {
    // Sample the same curve as the underlying wire. Distance-based movement avoids
    // a pulse abruptly speeding up where the Bezier's handles are farther apart.
    xs[0] = x0;
    ys[0] = y0;
    distances[0] = 0;
    for (let n = 1; n <= SAMPLES; n++) {
      const t = n / SAMPLES;
      const u = 1 - t;
      xs[n] = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      ys[n] = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      distances[n] = distances[n - 1] + Math.hypot(xs[n] - xs[n - 1], ys[n] - ys[n - 1]);
    }
    const length = distances[SAMPLES];
    if (length < 1) return;
    const tailLength = mobile ? 44 : 82;
    const cycleLength = length + tailLength + (mobile ? 65 : 110);
    // Keep the clock independent of the wandering wire's length. Applying modulo
    // to elapsed distance and a changing length makes old cycles amplify each bend.
    const cycleSeconds = (mobile ? 7.6 : 6.8) / (.88 + phase * .24);
    const cyclePhase = (elapsed / cycleSeconds + phase) % 1;
    const headDistance = cyclePhase * cycleLength;
    if (headDistance > length + tailLength) return;
    const start = Math.max(0, headDistance - tailLength);
    const end = Math.min(length, headDistance);
    if (end - start < 1) return;
    let first = 1;
    while (first < SAMPLES && distances[first] < start) first++;
    let last = first;
    while (last < SAMPLES && distances[last] < end) last++;
    const startMix = clamp((start - distances[first - 1]) / Math.max(.001, distances[first] - distances[first - 1]), 0, 1);
    const endMix = clamp((end - distances[last - 1]) / Math.max(.001, distances[last] - distances[last - 1]), 0, 1);
    const tailX = xs[first - 1] + (xs[first] - xs[first - 1]) * startMix;
    const tailY = ys[first - 1] + (ys[first] - ys[first - 1]) * startMix;
    const headX = xs[last - 1] + (xs[last] - xs[last - 1]) * endMix;
    const headY = ys[last - 1] + (ys[last] - ys[last - 1]) * endMix;
    const fade = clamp(headDistance / 18, 0, 1) * clamp((length + tailLength - headDistance) / tailLength, 0, 1);
    const gold = index % 5 === 0;
    const rgb = gold ? '233,189,134' : '245,243,238';
    const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
    gradient.addColorStop(0, `rgba(${rgb},0)`);
    gradient.addColorStop(.24, `rgba(${rgb},.08)`);
    gradient.addColorStop(.64, `rgba(${rgb},.42)`);
    gradient.addColorStop(.92, `rgba(${rgb},1)`);
    gradient.addColorStop(1, 'rgba(255,253,245,.96)');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    for (let n = first; n < last; n++) ctx.lineTo(xs[n], ys[n]);
    ctx.lineTo(headX, headY);
    ctx.globalAlpha = opacity * fade * .06;
    ctx.lineWidth = mobile ? 8 : 12;
    ctx.stroke();
    ctx.globalAlpha = opacity * fade * .18;
    ctx.lineWidth = mobile ? 3.6 : 5;
    ctx.stroke();
    ctx.globalAlpha = opacity * fade * .96;
    ctx.lineWidth = mobile ? 1.15 : 1.5;
    ctx.stroke();
    // Bloom stays local to the leading charge, rather than blurring the whole wire.
    if (headDistance <= length) {
      const size = mobile ? 13 : 21;
      ctx.globalAlpha = opacity * fade * .58;
      ctx.drawImage(halos[gold ? 1 : 0], headX - size / 2, headY - size / 2, size, size);
    }
    ctx.restore();
  };
}
