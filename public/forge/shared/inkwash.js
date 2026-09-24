// Ink-wash renderer for a square Ising lattice, as a factory so more than one
// piece can draw with it. The approach is Spin's (see
// docs/superpowers/specs/2026-09-24-spin-design.md, "Ink wash"): the worker's
// ±1 spins are blended over recent frames into a smooth field (EMA) so domains
// breathe rather than flicker; a WebGL2 shader draws the field with a soft
// upscale, a contrast curve that keeps it inky rather than grey, ground→bone
// with a copper tint on the domain walls, and film grain. Without WebGL the
// Canvas 2D path draws the same field, plainer: no grain, no copper.
//
// Spin keeps its own inline copy of this shader for now; its visuals were
// approved as they stand and are not touched by this module existing.

// Read an "r g b" token off :root. A missing token costs the page its colours
// and says so on the console; it must not abort the module.
export function rgbToken(name, fallback, tag = 'forge') {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/[\s,]+/).map(Number);
  if (parts.length !== 3 || !parts.every(Number.isFinite)) {
    console.error(`${tag}: ${name} is not an "r g b" triplet (got "${raw}") — using the fallback`);
    return fallback;
  }
  return parts;
}

const unit = (rgb) => rgb.map((v) => v / 255);

// createInkWash(canvas, n, { ground, bone, copper, copperWeight, grain, tag })
// → { renderer, blend(spins, ema, hard), paint(), resize(width, height) }
// `renderer` is 'webgl' or 'canvas'. The canvas is expected to be square on the
// page; a non-square canvas is cover-fitted and cropped on the long axis.
export function createInkWash(canvas, n, opts) {
  const { ground, bone, copper, copperWeight = 0.35, grain = 0.04, tag = 'forge' } = opts;
  const field = new Float32Array(n * n);
  const tex8 = new Uint8Array(n * n);
  let renderer = 'none';

  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  let glState = null;
  if (gl) {
    const vs = `#version 300 es
      in vec2 p; out vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
    const fs = `#version 300 es
      precision highp float;
      uniform sampler2D u_field; uniform vec2 u_res; uniform float u_time; uniform float u_tex;
      uniform vec3 u_ground, u_bone, u_copper; uniform float u_copperw, u_grain;
      in vec2 v; out vec4 o;
      float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float side = max(u_res.x, u_res.y);
        vec2 px = (v * u_res - (u_res - vec2(side)) * 0.5) / side;
        vec2 texel = vec2(1.0 / u_tex);
        float t = texture(u_field, px).r * 0.5
                + texture(u_field, px + vec2(texel.x, 0.0)).r * 0.125
                + texture(u_field, px - vec2(texel.x, 0.0)).r * 0.125
                + texture(u_field, px + vec2(0.0, texel.y)).r * 0.125
                + texture(u_field, px - vec2(0.0, texel.y)).r * 0.125;
        t = 0.5 + 0.5 * tanh(4.0 * (t - 0.5));
        vec3 col = mix(u_ground, u_bone, t);
        float wall = pow(4.0 * t * (1.0 - t), 1.5);
        col += (u_copper - (u_ground + u_bone) * 0.5) * wall * u_copperw;
        col += (hash(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * u_grain;
        o = vec4(col, 1.0);
      }`;
    const compile = (type, src) => {
      const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    try {
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, n, n, 0, gl.RED, gl.UNSIGNED_BYTE, tex8);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      const u = (name) => gl.getUniformLocation(prog, name);
      gl.uniform1i(u('u_field'), 0);
      gl.uniform1f(u('u_tex'), n);
      gl.uniform1f(u('u_copperw'), copperWeight);
      gl.uniform1f(u('u_grain'), grain);
      gl.uniform3fv(u('u_ground'), unit(ground)); gl.uniform3fv(u('u_bone'), unit(bone)); gl.uniform3fv(u('u_copper'), unit(copper));
      glState = { tex, uRes: u('u_res'), uTime: u('u_time') };
      renderer = 'webgl';
    } catch (e) { console.warn(`${tag}: WebGL unavailable, drawing with canvas instead`, e); glState = null; }
  }

  let ctx = null, back = null, bctx = null, img = null;
  if (!glState) {
    ctx = canvas.getContext('2d', { alpha: false });
    back = document.createElement('canvas'); back.width = n; back.height = n;
    bctx = back.getContext('2d', { alpha: false }); img = bctx.createImageData(n, n);
    renderer = 'canvas';
  }

  function blend(spins, ema, hard) {
    const k = 1 - ema;
    for (let i = 0; i < field.length; i++) {
      const f = hard ? spins[i] : field[i] * k + spins[i] * ema;
      field[i] = f;
      tex8[i] = ((f + 1) * 127.5) | 0;
    }
  }
  function paint() {
    if (glState) {
      gl.bindTexture(gl.TEXTURE_2D, glState.tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, n, gl.RED, gl.UNSIGNED_BYTE, tex8);
      gl.uniform1f(glState.uTime, performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return;
    }
    const d = img.data;
    for (let i = 0, j = 0; i < field.length; i++, j += 4) {
      let t = (field[i] + 1) / 2; t = 0.5 + 0.5 * Math.tanh(4.0 * (t - 0.5));
      d[j] = ground[0] + (bone[0] - ground[0]) * t; d[j + 1] = ground[1] + (bone[1] - ground[1]) * t; d[j + 2] = ground[2] + (bone[2] - ground[2]) * t; d[j + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    const side = Math.max(canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(back, (canvas.width - side) / 2, (canvas.height - side) / 2, side, side);
  }
  function resize(width, height) {
    canvas.width = width; canvas.height = height;
    if (glState) { gl.viewport(0, 0, width, height); gl.uniform2f(glState.uRes, width, height); }
  }
  return { get renderer() { return renderer; }, blend, paint, resize };
}
