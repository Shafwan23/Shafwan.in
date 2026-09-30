/* SHAFWAN® — the scene engine. Raw WebGL, no libraries.
   One fixed canvas per page runs:
     · liquid gold smoke following the pointer (all pages)
     · particle typography for [data-scene-text] (home hero)
     · the burn-dissolve navigation wipe
   A contained instance powers the Lab "Liquid Gold" playground.
   Progressive enhancement: reduced motion, Data Saver, the site's own
   motion toggle, or missing WebGL → nothing changes, DOM text stays. */

import { VERT_QUAD, NOISE, makeProgram } from './scene/gl.js';
import { Smoke } from './scene/smoke.js';
import { MODES, OUT_DELAY_K, pickMode, detectLetters, sampleGlyph, planReplay, REPLAY_FUNCS, REPLAY_BODY } from './scene/replay.js';

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
/* storage can throw when site data is blocked; treat that as motion on */
const storedMotionOff = () => { try { return localStorage.getItem('shafwan-motion') === 'off'; } catch { return false; } };
const motionOff = () =>
  rmq.matches || navigator.connection?.saveData ||
  storedMotionOff();

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
  /* ---------- Particle typography ---------- */
  const PART_VERT = `
    attribute vec2 aTarget;
    attribute vec3 aSeed;     /* x colour + chaos · y size + chaos · z alpha */
    attribute vec4 aA;        /* replay: the start pose (meaning per mode) */
    attribute vec4 aB;        /* replay: delay, duration, two spare */
    uniform vec2 uRes;
    uniform vec4 uBox;
    uniform float uScrollY;
    uniform float uTime;
    uniform float uForm;
    uniform float uScatter;
    uniform vec2 uTilt;       /* where the pointer is across the viewport, -1..1 */
    uniform vec3 uLight;      /* x, y (page px), radius: the light that roams the name */
    uniform vec3 uBurst;
    uniform float uDpr;
    uniform float uMode;      /* the replay choreography, -1 while none plays */
    uniform float uReplay;    /* seconds since the mark was clicked */
    uniform vec4 uReplayT;    /* exit length, hold, entry start, longest delay (s) */
    uniform vec4 uCentre;     /* centre of the letters (viewport px), cap height, cap width */
    uniform vec2 uMark;       /* the mark in the header, viewport px */
    varying float vSeed;
    varying float vAlpha;
    varying float vLum;
    ${NOISE}
    ${REPLAY_FUNCS}
    void main() {
      vSeed = aSeed.x;
      vec2 home = uBox.xy + aTarget * uBox.zw;   /* page px */
      vec2 target = home - vec2(0.0, uScrollY);
      /* motion scales with the word: on a phone the letters are a fifth of the
         desktop size, and the same pixels of breathing would smear them */
      float sz = clamp(uBox.z / 900.0, 0.3, 1.0);

      vec2 pos; float f; float show; float grow = 0.0; float lift = 0.0;
      if (uMode < -0.5) {
        /* the opening: dust from everywhere gathers into the name */
        float ang = aSeed.x * 6.28318 + uTime * (0.1 + aSeed.y * 0.2);
        vec2 chaos = vec2(aSeed.y, fract(aSeed.x * 7.31)) * uRes
                   + vec2(cos(ang), sin(ang)) * (60.0 + 240.0 * aSeed.x);
        f = clamp(uForm * 1.5 - aSeed.x * 0.5, 0.0, 1.0);
        f = 1.0 - pow(1.0 - f, 3.0);
        pos = mix(chaos, target, f);
        show = f;
      } else {
        /* the replay: from this mode's start pose back home, see replay.js */
        ${REPLAY_BODY}
      }

      vec2 idle = curl(target * 0.011 + uTime * 0.14) * (1.8 + 3.4 * aSeed.y) * sz;
      pos += idle * f;

      /* Orbit: the whole name tilts with the pointer. Every dot sits at its
         own depth, so the letters shear in shallow 3D rather than slide. */
      float depth = sin(home.x * 0.021 + home.y * 0.01) * cos(home.y * 0.033);
      pos += depth * uTilt * vec2(14.0, 9.0) * sz * f;
      float lum = clamp(1.0 - length(home - uLight.xy) / uLight.z, 0.0, 1.0) * f;
      lum = max(lum, lift);   /* a replay flashes its own highlights */
      vLum = lum;

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
      vAlpha = show * smoothstep(0.85, 0.35, uScatter) * aSeed.z;
      vec2 clip = (pos / uRes) * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      gl_PointSize = (1.1 + 2.1 * aSeed.y) * (0.9 + 0.6 * lum) * (1.0 + grow) * uDpr;
    }`;
  const PART_FRAG = `
    precision mediump float;
    varying float vSeed;
    varying float vAlpha;
    varying float vLum;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = dot(p, p);
      if (d > 0.25) discard;
      float soft = 1.0 - smoothstep(0.05, 0.25, d);
      vec3 cream = vec3(0.93, 0.91, 0.87);
      vec3 gold  = vec3(0.85, 0.68, 0.40);
      vec3 c = mix(cream, gold, smoothstep(0.35, 0.9, vSeed));
      c = mix(c, vec3(1.0, 0.96, 0.84), smoothstep(0.4, 0.7, vLum));   /* under the light: near white */
      gl_FragColor = vec4(c, soft * vAlpha * (1.0 + 0.45 * vLum));
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
    form: PU('uForm'), scatter: PU('uScatter'), tilt: PU('uTilt'),
    light: PU('uLight'), burst: PU('uBurst'), dpr: PU('uDpr'),
    mode: PU('uMode'), replay: PU('uReplay'), replayT: PU('uReplayT'), centre: PU('uCentre'), mark: PU('uMark'),
    aTarget: gl.getAttribLocation(partProg, 'aTarget'),
    aSeed: gl.getAttribLocation(partProg, 'aSeed'),
    aA: gl.getAttribLocation(partProg, 'aA'),
    aB: gl.getAttribLocation(partProg, 'aB'),
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
  const FORM_MS = 1900;
  let particles = null;
  let formAt = 0;

  /* On a load that plays the opening seam, CSS first rebuilds the DOM name
     from its two halves. The particles wait for the last letter to land,
     then take over already formed, so the name never jumps or re-forms. */
  const heroJoin = document.getAnimations().filter((a) => /^hero-join-/.test(a.animationName));
  let heroJoining = heroJoin.length > 0;
  if (heroJoining) {
    Promise.all(heroJoin.map((a) => a.finished)).catch(() => {}).then(() => {
      heroJoining = false;
      if (killed) return;
      formAt = performance.now() - FORM_MS;
      buildParticles();
      schedule();
    });
  }

  /* the headline's font at another size, for canvas sampling */
  function titleFont(px) {
    const cs = getComputedStyle(textEl);
    const pct = parseFloat(cs.fontStretch) || 100;
    const stretch =
      pct <= 56 ? 'ultra-condensed' : pct <= 68 ? 'extra-condensed' :
      pct <= 78 ? 'condensed' : pct <= 90 ? 'semi-condensed' :
      pct < 106 ? 'normal' : pct < 118 ? 'semi-expanded' :
      pct < 137 ? 'expanded' : pct < 175 ? 'extra-expanded' : 'ultra-expanded';
    return `${cs.fontStyle} ${cs.fontWeight} ${stretch} ${px}px ${cs.fontFamily}`;
  }

  function buildParticles() {
    if (!textEl || !partProg || killed || heroJoining) return;
    const r = textEl.getBoundingClientRect();
    if (r.width < 10) return;
    const box = { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
    const scale = Math.min(1.5, dpr);
    const off = document.createElement('canvas');
    off.width = Math.round(r.width * scale);
    off.height = Math.round(r.height * scale);
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.font = titleFont(parseFloat(getComputedStyle(textEl).fontSize) * scale);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const label = textEl.dataset.sceneText || textEl.textContent;
    const m = ctx.measureText(label);
    ctx.save();
    ctx.scale(off.width / Math.max(m.width, 1), 1);
    ctx.fillText(label, 0, off.height * 0.54);
    ctx.restore();

    const step = Math.max(2, Math.round(3 * scale));   /* the same grain on touch: the word is small there, so the count stays low */
    const data = ctx.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          const nx = x / off.width, ny = y / off.height;
          pts.push(nx, ny, Math.random(), Math.random());
          if (nx < minX) minX = nx;
          if (nx > maxX) maxX = nx;
          if (ny < minY) minY = ny;
          if (ny > maxY) maxY = ny;
        }
      }
    }
    const n = pts.length / 4;
    if (n < 100) return;
    endReplay();   /* a plan is per dot count; a new sampling voids it */
    freeParticles();
    const targets = new Float32Array(n * 2), seeds = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      targets[i * 2] = pts[i * 4]; targets[i * 2 + 1] = pts[i * 4 + 1];
      seeds[i * 3] = pts[i * 4 + 2]; seeds[i * 3 + 1] = pts[i * 4 + 3]; seeds[i * 3 + 2] = 1;
    }
    /* the letters' own bounds in box units: the roaming light is laid out
       from the glyphs, not from the taller line box */
    const caps = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
    particles = {
      n, tBuf: upload(targets, gl.STATIC_DRAW), sBuf: upload(seeds, gl.STATIC_DRAW), box, caps,
      targets, letters: detectLetters(targets, n, step / off.width),   /* kept on the CPU for the replay planner */
    };
    if (!formAt) formAt = performance.now(); /* formation starts when it can be SEEN */
    document.documentElement.classList.add('scene-text-live');
  }

  function upload(data, usage) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return buf;
  }
  function freeParticles() {
    if (!particles) return;
    gl.deleteBuffer(particles.tBuf); gl.deleteBuffer(particles.sBuf);
  }
  function drawPoints(tBuf, sBuf, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
    gl.vertexAttribPointer(pu.aTarget, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sBuf);
    gl.vertexAttribPointer(pu.aSeed, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  /* --- state --- */
  let mouse = { x: W / 2, y: H / 2 };
  /* Orbit tilt: the pointer's place across the viewport, -1..1, eased */
  let tilt = { x: 0, y: 0 }, tiltT = { x: 0, y: 0 };
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
    if (fine) tiltT = { x: (nx / W - 0.5) * 2, y: (ny / H - 0.5) * 2 };
    smoke.splat.x = nx / W;
    smoke.splat.y = 1 - ny / H;
    smoke.splat.r = 0.00045 + Math.min(sp, 90) * 0.000012;
    smoke.splat.i = Math.min(0.8, 0.06 + sp * 0.011);
    smokeHeat = Math.min(1, smokeHeat + sp * 0.01);
    mouse = { x: nx, y: ny };
    lastInput = performance.now();
    schedule();
  }, { passive: true });

  /* the name settles flat again once the pointer leaves the window */
  document.addEventListener('pointerleave', () => { if (!killed) { tiltT = { x: 0, y: 0 }; schedule(); } });

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

  /* --- the logo replay: on the home page the mark rebuilds the name a new way ---
     The opening on a load is untouched (seam, then the name, then the dots).
     A click on the mark, once the name stands, takes it apart along one of
     nine choreographies and brings it back: never the same one twice
     running. Without a live scene the mark stays a plain link home. */
  const brand = document.querySelector('.site-head .brand');
  const mark = brand?.querySelector('.brand-mark');
  const heroTitle = textEl?.closest('.hero-title');
  const onHome = !!(brand && heroTitle && new URL(brand.href, location.href).pathname === location.pathname);
  let replay = null, pendingMode = null, lastMode = null;
  try { lastMode = sessionStorage.getItem('shafwan-replay'); } catch { /* storage blocked: any mode will do */ }

  function requestReplay(mode) {
    if (killed || !onHome || !particles || heroJoining || burnNav || replay || pendingMode) return false;
    if (!formAt || performance.now() - formAt < FORM_MS) return false;   /* let the opening finish */
    pendingMode = MODES.includes(mode) ? mode : pickMode(lastMode);
    burst.t = -10;   /* the click's ripple would fight the choreography */
    if (scrollY > 0) scrollTo({ top: 0, left: 0, behavior: 'smooth' });   /* the frame loop starts it at the top */
    lastInput = performance.now();
    schedule();
    return true;
  }
  function onBrandClick(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (killed || !particles || heroJoining || burnNav) return;   /* no live name: the link reloads home as before */
    e.preventDefault();
    requestReplay();
  }
  if (onHome) brand.addEventListener('click', onBrandClick);
  /* scripts can ask for a replay, by mode or at random: dispatchEvent(new CustomEvent('shafwan:replay', { detail: { mode: 'rain' } })) */
  addEventListener('shafwan:replay', (e) => requestReplay(e.detail?.mode));

  function beginReplay(mode) {
    const { box, caps } = particles;
    const capH = caps.h * box.h;
    const seal = mode === 'monogram' ? sampleGlyph('S', titleFont(capH * 0.97), capH * 0.97, Math.max(2, Math.round(capH / 60))) : null;
    const plan = planReplay(mode, { n: particles.n, targets: particles.targets, box, caps, letters: particles.letters, viewH: H, seal });
    const mr = (mark || brand).getBoundingClientRect();
    replay = { plan, at: performance.now(), buf: upload(plan.data, gl.DYNAMIC_DRAW), mark: { x: mr.left + mr.width / 2, y: mr.top + mr.height / 2 }, head: null, headX: 0, headW: 0 };
    lastMode = mode;
    try { sessionStorage.setItem('shafwan-replay', mode); } catch { /* fine: the pick just repeats more often */ }
    if (mode === 'print') replay.head = printHead(box, caps);
    if (mode === 'beam') mark?.classList.add('is-beaming');
  }
  function endReplay() {
    if (!replay) return;
    gl.deleteBuffer(replay.buf);
    replay.head?.remove();
    mark?.classList.remove('is-beaming');
    replay = null;
  }
  /* PRINT: a hairline print head in the DOM, moved from the frame loop */
  function printHead(box, caps) {
    const el = document.createElement('i');
    el.className = 'hero-printhead';
    const hr = heroTitle.getBoundingClientRect();
    const capH = caps.h * box.h;
    el.style.top = `${box.y + (caps.cy - caps.h / 2) * box.h - capH * 0.12 - (hr.top + scrollY)}px`;
    el.style.height = `${capH * 1.24}px`;
    replay.headX = box.x + (caps.cx - caps.w / 2) * box.w - hr.left;
    replay.headW = caps.w * box.w;
    heroTitle.appendChild(el);
    return el;
  }
  function moveHead(rt) {
    const P = replay.plan;
    const frac = rt < P.outLen ? 1 - Math.min(1, rt / Math.max(P.maxDelay * OUT_DELAY_K, 1e-3))
      : rt < P.inStart ? 0 : Math.min(1, (rt - P.inStart) / Math.max(P.maxDelay, 1e-3));
    replay.head.style.transform = `translateX(${(replay.headX + frac * replay.headW).toFixed(1)}px)`;
    replay.head.style.opacity = rt > P.inStart + P.maxDelay + 0.25 ? '0' : '1';
  }

  /* --- teardown: reduced-motion mid-session, motion toggle, context loss --- */
  function teardown() {
    if (killed) return;
    killed = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.removeEventListener('click', onLinkClick);
    if (onHome) brand.removeEventListener('click', onBrandClick);
    endReplay();
    pendingMode = null;
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
    if (pendingMode && particles && !replay && scrollY < particles.box.h * 0.6) { beginReplay(pendingMode); pendingMode = null; }
    if (replay && now - replay.at > replay.plan.end * 1000) endReplay();
    const forming = particles && ((formAt && now - formAt < 2200) || replay || pendingMode);

    /* battery: 30fps while idle-breathing, full park when nothing can move */
    if (idleFor > 5000 && !burnNav && (frameSkip = !frameSkip)) { schedule(); return; }
    const parked =
      !burnNav && burn <= 0 && smokeHeat < 0.005 && smoke.splat.i === 0 &&
      !forming &&
      (!particles || !heroVisible) &&
      Math.abs(scatterT - scatter) < 0.002 && idleFor > 1200;
    if (parked) return; /* events re-schedule() */

    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now / 1000) % 1000; /* wrap: fp16 uniforms stay smooth in long sessions */

    tilt.x += (tiltT.x - tilt.x) * 0.06; tilt.y += (tiltT.y - tilt.y) * 0.06;
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
      gl.enableVertexAttribArray(pu.aTarget);
      gl.enableVertexAttribArray(pu.aSeed);
      gl.uniform2f(pu.res, W, H);
      const b = particles.box, caps = particles.caps;
      gl.uniform4f(pu.box, b.x, b.y, b.w, b.h);
      gl.uniform1f(pu.scrollY, scrollY);
      gl.uniform1f(pu.time, t);
      gl.uniform1f(pu.form, formAt ? Math.min(1, (now - formAt) / FORM_MS) : 0);
      gl.uniform1f(pu.scatter, scatter);
      gl.uniform2f(pu.tilt, tilt.x, tilt.y);
      /* the light wanders the letters on two slow, unrelated periods (18s and 9s) */
      const capH = caps.h * b.h;
      gl.uniform3f(pu.light,
        b.x + caps.cx * b.w + Math.cos(now * 0.00035) * caps.w * b.w * 0.5,
        b.y + caps.cy * b.h + Math.sin(now * 0.0007) * capH * 0.55,
        Math.max(1, capH * 1.25));
      gl.uniform3f(pu.burst, burst.x, burst.y, burst.t);
      gl.uniform1f(pu.dpr, dpr);
      gl.uniform4f(pu.centre, b.x + caps.cx * b.w, b.y + caps.cy * b.h - scrollY, capH, caps.w * b.w);
      if (replay) {
        const P = replay.plan, rt = (now - replay.at) / 1000;
        gl.uniform1f(pu.mode, P.index);
        gl.uniform1f(pu.replay, rt);
        gl.uniform4f(pu.replayT, P.outLen, P.hold, P.inStart, P.maxDelay);
        gl.uniform2f(pu.mark, replay.mark.x, replay.mark.y);
        gl.bindBuffer(gl.ARRAY_BUFFER, replay.buf);
        gl.enableVertexAttribArray(pu.aA); gl.vertexAttribPointer(pu.aA, 4, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(pu.aB); gl.vertexAttribPointer(pu.aB, 4, gl.FLOAT, false, 32, 16);
        if (replay.head) moveHead(rt);
      } else gl.uniform1f(pu.mode, -1);
      drawPoints(particles.tBuf, particles.sBuf, particles.n);
      if (replay) { gl.disableVertexAttribArray(pu.aA); gl.disableVertexAttribArray(pu.aB); }
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
