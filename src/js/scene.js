/* SHAFWAN® — the scene engine. Raw WebGL, no libraries.
   One fixed canvas per page runs:
     · liquid gold smoke following the pointer (all pages)
     · particle typography for [data-scene-text] (home hero)
     · the burn-dissolve navigation wipe
   A contained instance powers the Lab "Liquid Gold" playground.
   Progressive enhancement: reduced motion, Data Saver, the site's own
   motion toggle, or missing WebGL → nothing changes, DOM text stays. */

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const motionOff = () =>
  rmq.matches || navigator.connection?.saveData ||
  localStorage.getItem('shafwan-motion') === 'off';

/* boot after the page has painted and gone idle: shader compiles and the
   text sampling are one long task, and running them before first paint held
   the whole page (and its real, readable headline) back by seconds */
const BOOT_IDLE_TIMEOUT_MS = 1200;
function bootWhenIdle() {
  if (motionOff()) return;
  const go = () => { if (!motionOff()) boot(); };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: BOOT_IDLE_TIMEOUT_MS });
  else setTimeout(go, 200);
}
function bootAfterLoad() {
  if (document.readyState === 'complete') bootWhenIdle();
  else addEventListener('load', bootWhenIdle, { once: true });
}

/* never boot inside a speculative prerender: it would waste a GL context
   and silently burn through the formation choreography before activation */
if (!motionOff()) {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', bootAfterLoad, { once: true });
  } else {
    bootAfterLoad();
  }
}

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;
function isSoftwareRenderer(gl) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return SOFTWARE_GL.test(String(name || ''));
}

function boot() {
  const VERT_QUAD = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const NOISE = `
    vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
    float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(dot(hash2(i),f),dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
                 mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y); }
    vec2 curl(vec2 p){ float e=0.12;
      float a=noise(p+vec2(0.0,e)), b=noise(p-vec2(0.0,e));
      float c=noise(p+vec2(e,0.0)), d=noise(p-vec2(e,0.0));
      return normalize(vec2(a-b, d-c) + 1e-4); }`;

  function makeProgram(gl, vs, fs) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('shader:', gl.getShaderInfoLog(sh)); return null;
      }
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }

  /* ---------- Fluid: curl-advected gold smoke ---------- */
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

  class Smoke {
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

  /* ---------- Particle typography ---------- */
  const PART_VERT = `
    attribute vec2 aTarget;
    attribute vec2 aSeed;
    uniform vec2 uRes;
    uniform vec4 uBox;
    uniform float uScrollY;
    uniform float uTime;
    uniform float uForm;
    uniform float uScatter;
    uniform vec2 uMouse;
    uniform float uEnergy;
    uniform vec3 uBurst;
    uniform float uDpr;
    varying float vSeed;
    varying float vAlpha;
    ${NOISE}
    void main() {
      vSeed = aSeed.x;
      vec2 target = uBox.xy + aTarget * uBox.zw;
      target.y -= uScrollY;

      float ang = aSeed.x * 6.28318 + uTime * (0.1 + aSeed.y * 0.2);
      vec2 chaos = vec2(aSeed.y, fract(aSeed.x * 7.31)) * uRes
                 + vec2(cos(ang), sin(ang)) * (60.0 + 240.0 * aSeed.x);

      float f = clamp(uForm * 1.5 - aSeed.x * 0.5, 0.0, 1.0);
      f = 1.0 - pow(1.0 - f, 3.0);
      vec2 pos = mix(chaos, target, f);

      vec2 idle = curl(target * 0.011 + uTime * 0.14) * (1.8 + 3.4 * aSeed.y);
      pos += idle * f;

      vec2 dm = pos - uMouse;
      float dist = length(dm) + 1e-4;
      pos += (dm / dist) * exp(-dist / 95.0) * 58.0 * uEnergy;

      float age = uTime - uBurst.z;
      if (age < 2.5 && uBurst.z > 0.0) {
        vec2 db = pos - uBurst.xy;
        float dd = length(db) + 1e-4;
        float ring = exp(-abs(dd - age * 340.0) / 46.0);
        pos += (db / dd) * ring * exp(-age * 1.9) * (34.0 + 30.0 * aSeed.y);
      }

      pos += curl(target * 0.03 + aSeed.x * 9.0) * uScatter * (140.0 + 260.0 * aSeed.y);
      pos.y -= uScatter * uScatter * 260.0 * (0.3 + aSeed.x);

      /* dust must exit, not veil the next section */
      vAlpha = f * smoothstep(0.85, 0.35, uScatter);
      vec2 clip = (pos / uRes) * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      gl_PointSize = (1.1 + 2.1 * aSeed.y + uEnergy * 0.6) * uDpr;
    }`;
  const PART_FRAG = `
    precision mediump float;
    varying float vSeed;
    varying float vAlpha;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = dot(p, p);
      if (d > 0.25) discard;
      float soft = 1.0 - smoothstep(0.05, 0.25, d);
      vec3 cream = vec3(0.93, 0.91, 0.87);
      vec3 gold  = vec3(0.85, 0.68, 0.40);
      vec3 c = mix(cream, gold, smoothstep(0.35, 0.9, vSeed));
      gl_FragColor = vec4(c, soft * vAlpha);
    }`;

  /* ---------- Burn wipe: a fire curtain descending from the top ---------- */
  const BURN_FRAG = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uBurn;
    uniform float uTime;
    uniform vec2 uRes;
    ${NOISE}
    void main() {
      vec2 uv = vUv * vec2(uRes.x / uRes.y, 1.0);
      float n = noise(uv * 3.1) * 0.55 + noise(uv * 8.0) * 0.3 + noise(uv * 22.0) * 0.15;
      /* field is smallest at the TOP, so the curtain descends */
      float field = (1.0 - vUv.y) * 0.82 + (n * 0.5 + 0.5) * 0.18;
      float front = uBurn * 1.25 - 0.08;
      float body = 1.0 - smoothstep(front - 0.015, front + 0.015, field);
      float dist = abs(field - front);
      float sparkle = 0.7 + 0.6 * noise(uv * 22.0 + uTime * 7.0);
      /* tight white-gold core + wide champagne halo */
      float core = smoothstep(0.014, 0.0, dist) * sparkle;
      float halo = smoothstep(0.06, 0.0, dist) * 0.4;
      vec3 stage = vec3(0.059, 0.055, 0.047);
      vec3 ember = vec3(1.0, 0.9, 0.6) * core + vec3(0.85, 0.66, 0.38) * halo;
      float a = clamp(body + core * 0.95 + halo * 0.6, 0.0, 1.0) * step(0.001, uBurn);
      gl_FragColor = vec4(stage * body + ember, a);
    }`;

  /* ═════════════ main scene ═════════════ */
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.remove(); return; }
  /* a CPU rasteriser (no usable GPU) turns every frame of this engine into
     main-thread work: the page would stutter, so keep the DOM-only version */
  if (isSoftwareRenderer(gl)) { canvas.remove(); return; }

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  let dpr = Math.min(devicePixelRatio || 1, 1.75);
  let W = 0, H = 0;
  function sizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  sizeCanvas();

  const smoke = new Smoke(gl, canvas.width, canvas.height, { div: 2, tone: 0 });
  const partProg = makeProgram(gl, PART_VERT, PART_FRAG);
  const burnProg = makeProgram(gl, VERT_QUAD, BURN_FRAG);
  if (!smoke.ok || !burnProg) { canvas.remove(); return; }

  /* cache particle/burn locations once */
  const PU = (n) => gl.getUniformLocation(partProg, n);
  const pu = partProg && {
    res: PU('uRes'), box: PU('uBox'), scrollY: PU('uScrollY'), time: PU('uTime'),
    form: PU('uForm'), scatter: PU('uScatter'), mouse: PU('uMouse'),
    energy: PU('uEnergy'), burst: PU('uBurst'), dpr: PU('uDpr'),
    aTarget: gl.getAttribLocation(partProg, 'aTarget'),
    aSeed: gl.getAttribLocation(partProg, 'aSeed'),
  };
  const bu = {
    burn: gl.getUniformLocation(burnProg, 'uBurn'),
    time: gl.getUniformLocation(burnProg, 'uTime'),
    res: gl.getUniformLocation(burnProg, 'uRes'),
    aPos: gl.getAttribLocation(burnProg, 'aPos'),
  };

  document.documentElement.classList.add('scene-on');

  /* --- particle text --- */
  const textEl = document.querySelector('[data-scene-text]');
  let particles = null;
  let formAt = 0;

  function buildParticles() {
    if (!textEl || !partProg || killed) return;
    const r = textEl.getBoundingClientRect();
    if (r.width < 10) return;
    const box = { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
    const scale = Math.min(1.5, dpr);
    const off = document.createElement('canvas');
    off.width = Math.round(r.width * scale);
    off.height = Math.round(r.height * scale);
    const ctx = off.getContext('2d', { willReadFrequently: true });
    const cs = getComputedStyle(textEl);
    const fontPx = parseFloat(cs.fontSize) * scale;
    const pct = parseFloat(cs.fontStretch) || 100;
    const stretch =
      pct <= 56 ? 'ultra-condensed' : pct <= 68 ? 'extra-condensed' :
      pct <= 78 ? 'condensed' : pct <= 90 ? 'semi-condensed' :
      pct < 106 ? 'normal' : pct < 118 ? 'semi-expanded' :
      pct < 137 ? 'expanded' : pct < 175 ? 'extra-expanded' : 'ultra-expanded';
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${stretch} ${fontPx}px ${cs.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const label = textEl.dataset.sceneText || textEl.textContent;
    const m = ctx.measureText(label);
    ctx.save();
    ctx.scale(off.width / Math.max(m.width, 1), 1);
    ctx.fillText(label, 0, off.height * 0.54);
    ctx.restore();

    const step = Math.max(2, Math.round((fine ? 3 : 5) * scale));
    const data = ctx.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          pts.push(x / off.width, y / off.height, Math.random(), Math.random());
        }
      }
    }
    const n = pts.length / 4;
    if (n < 100) return;
    if (particles) { gl.deleteBuffer(particles.tBuf); gl.deleteBuffer(particles.sBuf); }
    const targets = new Float32Array(n * 2), seeds = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      targets[i * 2] = pts[i * 4]; targets[i * 2 + 1] = pts[i * 4 + 1];
      seeds[i * 2] = pts[i * 4 + 2]; seeds[i * 2 + 1] = pts[i * 4 + 3];
    }
    const tBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
    gl.bufferData(gl.ARRAY_BUFFER, targets, gl.STATIC_DRAW);
    const sBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    particles = { n, tBuf, sBuf, box };
    if (!formAt) formAt = performance.now(); /* formation starts when it can be SEEN */
    document.documentElement.classList.add('scene-text-live');
  }

  /* --- state --- */
  let mouse = { x: W / 2, y: H / 2 };
  let energy = 0, energyT = 0;
  let scatter = 0, scatterT = 0;
  let burst = { x: 0, y: 0, t: -10 };
  let burn = 0, burnNav = null;
  let smokeHeat = 0;
  let lastInput = performance.now();
  let rafId = null;
  let killed = false;
  let frameSkip = false;

  function schedule() {
    if (!rafId && !killed && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  addEventListener('pointermove', (e) => {
    if (killed) return;
    const nx = e.clientX, ny = e.clientY;
    const sp = Math.hypot(nx - mouse.x, ny - mouse.y);
    energyT = Math.min(1, energyT + sp * 0.012);
    smoke.splat.x = nx / W;
    smoke.splat.y = 1 - ny / H;
    smoke.splat.r = 0.00045 + Math.min(sp, 90) * 0.000012;
    smoke.splat.i = Math.min(0.8, 0.06 + sp * 0.011);
    smokeHeat = Math.min(1, smokeHeat + sp * 0.01);
    mouse = { x: nx, y: ny };
    lastInput = performance.now();
    schedule();
  }, { passive: true });

  addEventListener('pointerdown', (e) => {
    if (killed || burnNav) return;
    burst = { x: e.clientX, y: e.clientY, t: performance.now() / 1000 % 1000 };
    smoke.splat.x = e.clientX / W;
    smoke.splat.y = 1 - e.clientY / H;
    smoke.splat.r = 0.003; smoke.splat.i = 1.1;
    smokeHeat = 1;
    lastInput = performance.now();
    schedule();
  }, { passive: true });

  addEventListener('scroll', () => {
    if (killed) return;
    if (particles) scatterT = Math.min(1, scrollY / Math.max(particles.box.h * 3.2, 1));
    lastInput = performance.now();
    schedule();
  }, { passive: true });

  let resizeTimer = 0, lastRW = innerWidth;
  addEventListener('resize', () => {
    if (killed) return;
    /* mobile URL-bar collapse fires height-only resizes mid-scroll — skip */
    if (coarse && innerWidth === lastRW) return;
    lastRW = innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      smoke.size(canvas.width, canvas.height);
      buildParticles();
      schedule();
    }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule(); /* single-flight: schedule() no-ops if a frame is pending */
  });

  /* --- burn navigation --- */
  function onLinkClick(e) {
    if (killed || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (e.detail === 0) return; /* keyboard activation: navigate instantly, no theater */
    const a = e.target.closest('a');
    if (!a) return;
    const rawHref = a.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#')) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.href.split('#')[0] === location.href.split('#')[0]) return; /* same page */
    e.preventDefault();
    burnNav = { href: url.href, at: performance.now() };
    canvas.classList.add('is-burning');
    document.documentElement.classList.add('is-burn-nav');
    /* the curtain owns the exit — silence the competing effects */
    burst.t = -10;
    smoke.splat.i *= 0.15;
    /* the timer is authoritative so a stalled rAF can never strand the click */
    setTimeout(() => { if (burnNav) location.href = burnNav.href; }, 460);
    schedule();
  }
  document.addEventListener('click', onLinkClick);
  addEventListener('pageshow', () => {
    burn = 0; burnNav = null;
    canvas.classList.remove('is-burning');
    document.documentElement.classList.remove('is-burn-nav');
    schedule();
  });

  /* --- teardown: reduced-motion mid-session, motion toggle, context loss --- */
  function teardown() {
    if (killed) return;
    killed = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.removeEventListener('click', onLinkClick);
    canvas.remove();
    document.documentElement.classList.remove('scene-on', 'scene-text-live', 'is-burn-nav');
  }
  rmq.addEventListener?.('change', (e) => { if (e.matches) teardown(); });
  addEventListener('shafwan:motion-off', teardown);
  canvas.addEventListener('webglcontextlost', teardown);

  /* --- frame loop --- */
  let last = performance.now();

  function frame(now) {
    rafId = null;
    if (killed || document.hidden) return;

    const heroVisible = particles && scrollY < particles.box.y + particles.box.h + H * 0.2;
    const idleFor = now - lastInput;
    const forming = particles && formAt && now - formAt < 2200;

    /* battery: 30fps while idle-breathing, full park when nothing can move */
    if (idleFor > 5000 && !burnNav && (frameSkip = !frameSkip)) { schedule(); return; }
    const parked =
      !burnNav && burn <= 0 && smokeHeat < 0.005 && smoke.splat.i === 0 &&
      energy < 0.01 && !forming &&
      (!particles || !heroVisible) &&
      Math.abs(scatterT - scatter) < 0.002 && idleFor > 1200;
    if (parked) return; /* events re-schedule() */

    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now / 1000) % 1000; /* wrap: fp16 uniforms stay smooth in long sessions */

    energy += (energyT - energy) * 0.09; energyT *= 0.94;
    scatter += (scatterT - scatter) * 0.08;
    smokeHeat *= Math.pow(0.985, dt * 60);
    burn = burnNav ? Math.min(1, (now - burnNav.at) / 420) : Math.max(0, burn - dt * 4);

    const smokeTex = smoke.step(t, dt);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    smoke.render(smokeTex, 0.62 + Math.max(smokeHeat, 0.02) * 0.25);

    if (particles && scatter < 0.9 && heroVisible) {
      gl.useProgram(partProg);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, particles.tBuf);
      gl.enableVertexAttribArray(pu.aTarget);
      gl.vertexAttribPointer(pu.aTarget, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, particles.sBuf);
      gl.enableVertexAttribArray(pu.aSeed);
      gl.vertexAttribPointer(pu.aSeed, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(pu.res, W, H);
      const b = particles.box;
      gl.uniform4f(pu.box, b.x, b.y, b.w, b.h);
      gl.uniform1f(pu.scrollY, scrollY);
      gl.uniform1f(pu.time, t);
      gl.uniform1f(pu.form, formAt ? Math.min(1, (now - formAt) / 1900) : 0);
      gl.uniform1f(pu.scatter, scatter);
      gl.uniform2f(pu.mouse, mouse.x, mouse.y);
      gl.uniform1f(pu.energy, fine ? energy : 0.0);
      gl.uniform3f(pu.burst, burst.x, burst.y, burst.t);
      gl.uniform1f(pu.dpr, dpr);
      gl.drawArrays(gl.POINTS, 0, particles.n);
      gl.disableVertexAttribArray(pu.aTarget);
      gl.disableVertexAttribArray(pu.aSeed);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    if (burn > 0.001) {
      gl.useProgram(burnProg);
      smoke.bindQuad(bu.aPos);
      gl.uniform1f(bu.burn, burn);
      gl.uniform1f(bu.time, t);
      gl.uniform2f(bu.res, W, H);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    schedule();
  }

  document.fonts.ready.then(() => { buildParticles(); schedule(); });
  schedule();

  /* ═════════════ Lab playground: molten gold, contained ═════════════ */
  const play = document.getElementById('playCanvas');
  if (play) {
    const pgl = play.getContext('webgl', { alpha: false, antialias: false });
    if (pgl) {
      /* half-res, molten shading, and ink that lingers so you can actually paint */
      const psmoke = new Smoke(pgl, 0, 0, { div: 1, tone: 1, decayMul: 0.9965, decaySub: 0.0004 });
      if (psmoke.ok) {
        let pRaf = null, pActive = false, pHeat = 0, pLastInput = performance.now();

        const sizePlay = () => {
          const r = play.getBoundingClientRect();
          const d = Math.min(devicePixelRatio || 1, 1.75);
          const wpx = Math.round(r.width * d);
          const hpx = Math.round(Math.max(r.width * 0.62, 280) * d);
          if (wpx === play.width && hpx === play.height) return;
          play.width = wpx; play.height = hpx;
          psmoke.size(wpx, hpx);
        };
        sizePlay();
        new ResizeObserver(sizePlay).observe(play.parentElement);

        const pSchedule = () => {
          if (!pRaf && pActive && !document.hidden && !killed) pRaf = requestAnimationFrame(pframe);
        };
        const splatAt = (e, force) => {
          const r = play.getBoundingClientRect();
          psmoke.splat.x = (e.clientX - r.left) / r.width;
          psmoke.splat.y = 1 - (e.clientY - r.top) / r.height;
          psmoke.splat.r = force ? 0.0045 : 0.0018;
          psmoke.splat.i = force ? 1.5 : 1.1;
          pHeat = 1;
          pLastInput = performance.now();
          pSchedule();
        };
        play.addEventListener('pointermove', (e) => splatAt(e, false), { passive: true });
        play.addEventListener('pointerdown', (e) => splatAt(e, true), { passive: true });

        new IntersectionObserver((entries) => {
          pActive = entries[entries.length - 1].isIntersecting;
          pSchedule();
        }).observe(play);
        document.addEventListener('visibilitychange', pSchedule);

        let pLast = performance.now();
        function pframe(now) {
          pRaf = null;
          if (!pActive || document.hidden || killed) return;
          const dt = Math.min((now - pLast) / 1000, 0.05);
          pLast = now;
          pHeat *= Math.pow(0.985, dt * 60);
          const tex = psmoke.step((now / 1000) % 1000, dt);
          pgl.bindFramebuffer(pgl.FRAMEBUFFER, null);
          pgl.viewport(0, 0, play.width, play.height);
          pgl.clearColor(0.059, 0.055, 0.047, 1);
          pgl.clear(pgl.COLOR_BUFFER_BIT);
          pgl.enable(pgl.BLEND);
          pgl.blendFunc(pgl.SRC_ALPHA, pgl.ONE_MINUS_SRC_ALPHA);
          psmoke.render(tex, 1.0);
          /* park once the pool has cooled and the pointer has rested */
          /* keep drawing while the pool is still visibly cooling */
          if (now - pLastInput < 14000) pSchedule();
        }
      }
    }
  }
}
