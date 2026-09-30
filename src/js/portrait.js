/* THE DOT PORTRAIT (/about/) — the photo, rebuilt from dots.
   The cut-out photo is sampled on a grid and every sample becomes one dot in
   the pixel's own colour, with the shadows lifted so hair and shirt still read
   on the charcoal stage. WebGL draws the dots as point sprites: they gather in
   from the edges, breathe, tilt in shallow 3D with the pointer, part around it
   and ripple out from a tap. Without WebGL (or with motion off) the same dots
   are painted once on a 2D canvas. Without JavaScript the cut-out photo shows. */

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const motionOff = () => rmq.matches || document.documentElement.classList.contains('motion-off');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const FORM_MS = 1900;

const VERT = `
  attribute vec2 aPos;
  attribute vec3 aCol;
  attribute vec3 aSeed;
  uniform vec2 uRes;
  uniform float uForm;
  uniform float uTime;
  uniform vec2 uTilt;
  uniform vec2 uPointer;
  uniform vec3 uBurst;
  uniform float uSize;
  uniform float uScale;
  varying vec3 vCol;
  varying float vAlpha;
  void main() {
    vec2 target = aPos * uRes;
    vec2 c = uRes * 0.5;
    vec2 dir = normalize(target - c + vec2(0.001, 0.001));
    vec2 away = dir * uRes.y * (0.35 + aSeed.y * 0.55) + (aSeed.xy - 0.5) * uRes.y * 0.45;
    /* the dots gather from the outside in, the centre first */
    float f = clamp(uForm * 1.7 - 0.45 * length(target - c) / uRes.y - aSeed.x * 0.25, 0.0, 1.0);
    f = 1.0 - pow(1.0 - f, 3.0);
    vec2 pos = mix(target + away, target, f);
    pos += vec2(sin(uTime * 1.3 + aSeed.x * 40.0), cos(uTime * 1.1 + aSeed.y * 40.0)) * 0.55 * uScale * f;
    float depth = aSeed.z * 2.0 - 1.0;
    pos += depth * uTilt * 9.0 * uScale * f;
    vec2 dm = pos - uPointer;
    float dist = length(dm) + 1e-4;
    pos += (dm / dist) * exp(-dist / (34.0 * uScale)) * 16.0 * uScale;
    float age = uTime - uBurst.z;
    if (uBurst.z > 0.0 && age < 2.0) {
      vec2 db = pos - uBurst.xy;
      float dd = length(db) + 1e-4;
      float ring = exp(-abs(dd - age * 260.0 * uScale) / (30.0 * uScale));
      pos += (db / dd) * ring * exp(-age * 2.2) * 18.0 * uScale;
    }
    vCol = aCol;
    vAlpha = f;
    vec2 clip = (pos / uRes) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = uSize * (0.82 + 0.36 * aSeed.z) * (0.85 + 0.3 * f);
  }`;
const FRAG = `
  precision mediump float;
  varying vec3 vCol;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = dot(p, p);
    if (d > 0.25) discard;
    float soft = 1.0 - smoothstep(0.16, 0.25, d);
    gl_FragColor = vec4(vCol, soft * vAlpha);
  }`;

function makeProgram(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('portrait shader:', gl.getShaderInfoLog(sh)); return null; }
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/* one dot per grid cell of the drawn photo, alpha permitting */
function sample(img, w, h, pitch) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const pos = [], col = [], seed = [];
  for (let y = pitch / 2; y < h; y += pitch) {
    for (let x = pitch / 2; x < w; x += pitch) {
      const i = ((y | 0) * w + (x | 0)) * 4;
      if (d[i + 3] < 128) continue;
      let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      /* a little more colour than the flat photo has, then the shadows lifted onto a warm
         floor so black hair and a black shirt still read on the charcoal stage */
      r = lum + (r - lum) * 1.18; g = lum + (g - lum) * 1.18; b = lum + (b - lum) * 1.18;
      pos.push(x / w, y / h);
      col.push(0.17 + 0.83 * r, 0.14 + 0.86 * g, 0.11 + 0.89 * b);
      seed.push(Math.random(), Math.random(), lum);
    }
  }
  return { n: pos.length / 2, pos: new Float32Array(pos), col: new Float32Array(col), seed: new Float32Array(seed) };
}

/* the still version: the same dots, painted once */
function paintStill(canvas, pts, w, h, pitch, dpr) {
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  for (let i = 0; i < pts.n; i++) {
    const r = pitch * (0.41 + 0.18 * pts.seed[i * 3 + 2]);
    ctx.fillStyle = `rgb(${(pts.col[i * 3] * 255) | 0} ${(pts.col[i * 3 + 1] * 255) | 0} ${(pts.col[i * 3 + 2] * 255) | 0})`;
    ctx.beginPath();
    ctx.arc(pts.pos[i * 2] * w, pts.pos[i * 2 + 1] * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mount(fig) {
  const frame = fig.querySelector('.dots-frame');
  const img = fig.querySelector('.dots-src');
  const canvas = fig.querySelector('.dots-canvas');
  const countEl = fig.querySelector('[data-dot-count]');
  if (!frame || !img || !canvas) return;

  /* a 2px grid on desktop (about 28k dots at 410px): the face reads as a photo from arm's length and as dots up close */
  const pitchFor = (w) => (w > 360 ? 2 : 1.8);
  let gl = null, prog = null, loc = null, bufs = null, pts = null;
  let w = 0, h = 0, dpr = 1, pitch = 3;
  let formAt = 0, raf = null, visible = false, killed = false;
  let pointer = { x: -1e5, y: -1e5 }, tilt = { x: 0, y: 0 }, tiltT = { x: 0, y: 0 };
  let burst = { x: 0, y: 0, t: -10 };
  let lastMove = 0;

  const measure = () => {
    w = Math.round(frame.clientWidth); h = Math.round(frame.clientHeight);
    dpr = Math.min(2, devicePixelRatio || 1);
    pitch = pitchFor(w);
  };

  const still = () => {
    measure();
    pts = sample(img, w, h, pitch);
    paintStill(canvas, pts, w, h, pitch, dpr);
    if (countEl) countEl.textContent = pts.n.toLocaleString('en');
    fig.classList.add('is-live', 'is-still');
  };

  const upload = () => {
    if (bufs) for (const b of Object.values(bufs)) gl.deleteBuffer(b);
    bufs = {};
    for (const [name, data] of [['pos', pts.pos], ['col', pts.col], ['seed', pts.seed]]) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      bufs[name] = b;
    }
  };

  const rebuild = (formed) => {
    measure();
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    pts = sample(img, w, h, pitch);
    upload();
    if (countEl) countEl.textContent = pts.n.toLocaleString('en');
    formAt = formed ? performance.now() - FORM_MS : performance.now();
  };

  const schedule = () => { if (!raf && visible && !killed && !document.hidden) raf = requestAnimationFrame(frame_); };

  function frame_(now) {
    raf = null;
    if (killed || !visible || document.hidden) return;
    const t = (now / 1000) % 1000;
    tilt.x += (tiltT.x - tilt.x) * 0.07; tilt.y += (tiltT.y - tilt.y) * 0.07;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.pos); gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.col); gl.enableVertexAttribArray(loc.aCol); gl.vertexAttribPointer(loc.aCol, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.seed); gl.enableVertexAttribArray(loc.aSeed); gl.vertexAttribPointer(loc.aSeed, 3, gl.FLOAT, false, 0, 0);
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform1f(loc.uForm, Math.min(1, (now - formAt) / FORM_MS));
    gl.uniform1f(loc.uTime, t);
    gl.uniform2f(loc.uTilt, tilt.x, tilt.y);
    gl.uniform2f(loc.uPointer, pointer.x, pointer.y);
    gl.uniform3f(loc.uBurst, burst.x, burst.y, burst.t);
    gl.uniform1f(loc.uSize, pitch * dpr * 1.12);
    gl.uniform1f(loc.uScale, dpr * (w / 380));
    gl.drawArrays(gl.POINTS, 0, pts.n);
    schedule();
  }

  const local = (e) => { const r = frame.getBoundingClientRect(); return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height }; };

  const live = () => {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return false;
    prog = makeProgram(gl, VERT, FRAG);
    if (!prog) return false;
    loc = {};
    for (const a of ['aPos', 'aCol', 'aSeed']) loc[a] = gl.getAttribLocation(prog, a);
    for (const u of ['uRes', 'uForm', 'uTime', 'uTilt', 'uPointer', 'uBurst', 'uSize', 'uScale']) loc[u] = gl.getUniformLocation(prog, u);
    rebuild(false);
    fig.classList.add('is-live');

    frame.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const p = local(e);
      pointer = { x: p.x, y: p.y };
      if (fine) tiltT = { x: (p.nx - 0.5) * 2, y: (p.ny - 0.5) * 2 };
      lastMove = performance.now();
      schedule();
    }, { passive: true });
    frame.addEventListener('pointerleave', () => { pointer = { x: -1e5, y: -1e5 }; tiltT = { x: 0, y: 0 }; schedule(); });
    frame.addEventListener('pointerdown', (e) => {
      const p = local(e);
      burst = { x: p.x, y: p.y, t: (performance.now() / 1000) % 1000 };
      schedule();
    }, { passive: true });

    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; schedule(); }, { threshold: 0.1 }).observe(frame);
    document.addEventListener('visibilitychange', schedule);

    let resizeTimer = 0, lastW = w;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (killed) return; if (Math.round(frame.clientWidth) !== lastW) { lastW = Math.round(frame.clientWidth); rebuild(true); schedule(); } }, 200);
    }).observe(frame);

    const stop = () => {
      if (killed) return;
      killed = true;
      if (raf) cancelAnimationFrame(raf);
      /* the dots stay, as a still */
      const still2d = document.createElement('canvas');
      still2d.className = canvas.className;
      canvas.replaceWith(still2d);
      paintStill(still2d, pts, w, h, pitch, dpr);
      fig.classList.add('is-still');
    };
    rmq.addEventListener?.('change', (e) => { if (e.matches) stop(); });
    addEventListener('shafwan:motion-off', stop);
    canvas.addEventListener('webglcontextlost', stop);
    return true;
  };

  const start = () => {
    if (!img.naturalWidth) return;
    if (motionOff() || !live()) still();
  };
  if (img.complete && img.naturalWidth) start();
  else { img.addEventListener('load', start, { once: true }); img.addEventListener('error', () => {}, { once: true }); }
}

document.querySelectorAll('[data-dot-portrait]').forEach(mount);
