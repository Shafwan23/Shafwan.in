/* SHAFWAN® — the liquid gold smoke: a curl-advected density field in two
   ping-pong textures, drawn either as the pages' ambient accent (tone 0) or
   as the Lab's molten pool (tone 1). */
import { VERT_QUAD, NOISE, makeProgram } from './gl.js';

const SMOKE_SIM = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uDecay;
  uniform float uSub;
  uniform vec4 uSplat;      /* x,y (uv), radius, intensity */
  ${NOISE}
  void main() {
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 flow = curl(vUv * asp * 2.6 + uTime * 0.05) * 0.0016
              + vec2(0.0, 0.00055);
    /* multiplicative + subtractive decay so RGBA8 quantization
       cannot leave a permanent haze floor */
    vec3 prev = max(texture2D(uPrev, vUv - flow).rgb * uDecay - uSub, 0.0);
    if (uSplat.w > 0.001) {
      vec2 d = (vUv - uSplat.xy) * asp;
      float s = exp(-dot(d, d) / max(uSplat.z, 1e-4)) * uSplat.w;
      vec3 gold = vec3(0.86, 0.72, 0.46) + vec3(0.14, 0.1, 0.0) * noise(vUv * 9.0 + uTime);
      prev += gold * s;
    }
    /* clamp on the gold ratio, never to white: saturation stays molten */
    gl_FragColor = vec4(min(prev, vec3(0.94, 0.79, 0.52)), 1.0);
  }`;
const SMOKE_DRAW = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uTexel;
  uniform float uOpacity;
  uniform float uTone;      /* 0 = ambient accent · 1 = molten gold */
  void main() {
    vec3 c = texture2D(uTex, vUv).rgb;
    if (uTone > 0.5) {
      float d  = max(c.r, max(c.g, c.b));
      float dR = texture2D(uTex, vUv + vec2(uTexel.x, 0.0)).r;
      float dU = texture2D(uTex, vUv + vec2(0.0, uTexel.y)).r;
      /* directional gradient = a cheap specular sheen on the leading edge */
      float sheen = clamp((c.r - dR) * 5.0 + (dU - c.r) * 7.0, 0.0, 1.0);
      c = pow(c, vec3(0.85)) * 1.12;
      c += vec3(1.0, 0.9, 0.6) * pow(sheen, 1.7) * (0.3 + d) * 1.15;
    }
    float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(c * uOpacity, a * 0.85);
  }`;

export class Smoke {
  constructor(gl, w, h, opts = {}) {
    this.gl = gl;
    this.div = opts.div ?? 2;           /* res >> div */
    this.tone = opts.tone ?? 0;
    this.decayMul = opts.decayMul ?? 0.978;  /* per-frame @60fps */
    this.decaySub = opts.decaySub ?? 0.0028; /* kills RGBA8 residue */
    this.sim = makeProgram(gl, VERT_QUAD, SMOKE_SIM);
    this.draw = makeProgram(gl, VERT_QUAD, SMOKE_DRAW);
    this.ok = !!(this.sim && this.draw);
    if (!this.ok) return;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const U = (p, n) => gl.getUniformLocation(p, n);
    this.u = {
      prev: U(this.sim, 'uPrev'), res: U(this.sim, 'uRes'),
      time: U(this.sim, 'uTime'), decay: U(this.sim, 'uDecay'),
      sub: U(this.sim, 'uSub'), splat: U(this.sim, 'uSplat'),
      tex: U(this.draw, 'uTex'), texel: U(this.draw, 'uTexel'),
      opacity: U(this.draw, 'uOpacity'), tone: U(this.draw, 'uTone'),
    };
    this.aSim = gl.getAttribLocation(this.sim, 'aPos');
    this.aDraw = gl.getAttribLocation(this.draw, 'aPos');
    this.size(w, h);
    this.splat = { x: 0.5, y: 0.5, r: 0, i: 0 };
  }
  bindQuad(loc) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
  size(w, h) {
    const gl = this.gl;
    if (this.fbos) for (const f of this.fbos) { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fb); }
    this.w = Math.max(2, w >> this.div); this.h = Math.max(2, h >> this.div);
    this.fbos = [0, 1].map(() => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.w, this.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fb };
    });
    this.flip = 0;
  }
  step(time, dt) {
    const gl = this.gl;
    const src = this.fbos[this.flip], dst = this.fbos[this.flip ^= 1];
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.BLEND);
    gl.useProgram(this.sim);
    this.bindQuad(this.aSim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.u.prev, 0);
    gl.uniform2f(this.u.res, this.w, this.h);
    gl.uniform1f(this.u.time, time);
    gl.uniform1f(this.u.decay, Math.pow(this.decayMul, dt * 60));
    gl.uniform1f(this.u.sub, this.decaySub * dt * 60);
    const s = this.splat;
    gl.uniform4f(this.u.splat, s.x, s.y, s.r, s.i);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    s.i *= Math.pow(0.55, dt * 60);
    if (s.i < 0.002) s.i = 0;
    return dst.tex;
  }
  render(tex, opacity) {
    const gl = this.gl;
    gl.useProgram(this.draw);
    this.bindQuad(this.aDraw);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(this.u.tex, 0);
    gl.uniform2f(this.u.texel, 1 / this.w, 1 / this.h);
    gl.uniform1f(this.u.opacity, opacity);
    gl.uniform1f(this.u.tone, this.tone);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
