/* =========================================================
   BACKER — shader background
   Dot-matrix reveal, ported from the `sign-in-flow-1`
   component (21st.dev · erikx) — its CanvasRevealEffect /
   DotMatrix (Three.js GLSL) reworked into raw WebGL1, so it
   needs no Three.js, no build step, and runs fully offline.

   Why the change: the previous shader-lines effect drew
   bright radial streaks that washed out the copy. This dot
   field is dark and sparse, so text stays readable on every
   tab (thesis / signup / portfolio / product) that loads it.
   ========================================================= */
(function () {
  'use strict';

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  // --- dot-matrix twinkle, from sign-in-flow-1's CanvasRevealEffect ---
  // White dots on black, each grid cell flickering between a small set of
  // opacities (0.3 / 0.5 / 0.8 / 1.0) on a slow random cycle — the same
  // look as the reference, expressed without array uniforms so it compiles
  // on WebGL1. The page CSS (#bg opacity + .vignette + .grain) supplies the
  // same dimming the reference gets from its radial mask + black gradient.
  const FRAG = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    float PHI = 1.61803398874989484820459;

    float random(vec2 xy) {
      return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
    }

    void main(void) {
      float u_total_size = 18.0;   // grid cell size, device px
      float u_dot_size   = 2.0;    // dot size within the cell, device px

      vec2 st = gl_FragCoord.xy;
      st.x -= abs(floor((mod(resolution.x, u_total_size) - u_dot_size) * 0.5));
      st.y -= abs(floor((mod(resolution.y, u_total_size) - u_dot_size) * 0.5));

      float opacity = step(0.0, st.x);
      opacity *= step(0.0, st.y);

      vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

      float frequency = 5.0;
      float show_offset = random(st2);
      float rand = random(st2 * floor((time / frequency) + show_offset + frequency) + 1.0);

      // stepped opacities — matches the CanvasRevealEffect default ramp
      float idx = floor(rand * 10.0);
      float ov = 0.3;
      ov = mix(ov, 0.5, step(3.0, idx));
      ov = mix(ov, 0.8, step(6.0, idx));
      ov = mix(ov, 1.0, step(9.0, idx));
      opacity *= ov;

      // carve the dot out of the cell
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = vec3(1.0); // white dots, matching sign-in-flow-1's colors
      gl_FragColor = vec4(color * opacity, 1.0);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function init() {
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    let gl;
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) { canvas.style.display = 'none'; return; } // graceful fallback to solid black

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    gl.useProgram(prog);

    // full-screen quad (triangle strip over clip space)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'resolution');
    const uTime = gl.getUniformLocation(prog, 'time');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w; canvas.height = h;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    resize();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

    let time = 1.0, raf, running = true;
    function frame() {
      if (!running) return;
      time += 0.05;                 // matches the original animate() increment
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    frame();
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) { cancelAnimationFrame(raf); frame(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
