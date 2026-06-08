/* =========================================================
   BACKER — shader background
   Ported verbatim from the original `shader-lines.tsx`
   (Three.js GLSL) to raw WebGL, so it needs no Three.js,
   no build step, and runs fully offline.
   The fragment shader is the original, unchanged.
   ========================================================= */
(function () {
  'use strict';

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  // --- original fragment shader from shader-lines.tsx (unchanged) ---
  const FRAG = `
    #define TWO_PI 6.2831853072
    #define PI 3.14159265359
    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    float random (in float x) { return fract(sin(x)*1e4); }
    float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main(void) {
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

      vec2 fMosaicScal = vec2(4.0, 2.0);
      vec2 vScreenSize = vec2(256.0, 256.0);
      uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
      uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

      float t = time * 0.06 + random(uv.x) * 0.4;
      float lineWidth = 0.0008;

      vec3 color = vec3(0.0);
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          color[j] += lineWidth * float(i*i) / abs(fract(t - 0.01*float(j) + float(i)*0.01) * 1.0 - length(uv));
        }
      }
      gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
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
