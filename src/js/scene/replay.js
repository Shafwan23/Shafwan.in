/* SHAFWAN® — the logo replay.
   On the home page, a click on the mark in the header takes the name apart
   and builds it again another way. Nine choreographies; one is picked at
   random and never the same twice running. This module plans a replay on
   the CPU (a start pose and a schedule for every dot) and holds the GLSL
   that plays it; scene.js owns the GL state, the clock and the frame loop.
   The opening on a page load is untouched: still the seam, then the name,
   then the particles taking over already formed. */

export const MODES = ['orbit', 'rain', 'vortex', 'monogram', 'print', 'beam', 'type', 'flip', 'tide'];

/* seconds the name rests in its start pose before it comes back */
const HOLD_S = { orbit: 0.55, rain: 0.15, vortex: 0.35, monogram: 0.75, print: 0.25, beam: 0.4, type: 0.2, flip: 0.35, tide: 0.2 };
/* the exit plays the entry schedule backwards, compressed this much */
export const OUT_DELAY_K = 0.3;
export const OUT_DUR_K = 0.5;
/* bounces and flashes have died down this long after the last dot lands */
const SETTLE_S = 1.6;
const RAIN_GRAVITY = 2200; /* px/s² */
const LETTERS = 7;
const TAU = Math.PI * 2;

const rand = (a, b) => a + Math.random() * (b - a);

/* a random mode that is not the one played last */
export function pickMode(last, random = Math.random) {
  const pool = MODES.filter((m) => m !== last);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/* Which letter each dot belongs to. The sampled word is cut at the empty
   columns between glyphs; `bucket` is one sampling step in box units, so a
   gap of one step already counts. If that does not give seven letters (a
   font whose letters touch), the word is sliced into seven equal parts. */
export function detectLetters(targets, n, bucket) {
  const res = Math.max(8, Math.round(1 / bucket));
  const filled = new Uint8Array(res + 1);
  let minX = 1, maxX = 0;
  for (let i = 0; i < n; i++) {
    const x = targets[i * 2];
    filled[Math.min(res, Math.max(0, Math.round(x * res)))] = 1;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const groups = [];
  let start = -1, last = -1;
  for (let c = 0; c <= res; c++) {
    if (filled[c]) { if (start < 0) start = c; last = c; }
    else if (start >= 0) { groups.push([start / res, last / res]); start = -1; }
  }
  if (start >= 0) groups.push([start / res, last / res]);
  const exact = groups.length === LETTERS;
  const span = (maxX - minX) / LETTERS;
  const bounds = exact ? groups : Array.from({ length: LETTERS }, (_, k) => [minX + span * k, minX + span * (k + 1)]);
  const index = new Uint8Array(n), centre = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = targets[i * 2];
    let k = bounds.findIndex(([, right]) => x <= right + 1e-6);
    if (k < 0) k = LETTERS - 1;
    index[i] = k;
    centre[i] = (bounds[k][0] + bounds[k][1]) / 2;
  }
  return { index, centre, exact };
}

/* one glyph as dot offsets from its own centre, in px: the S of the seal */
export function sampleGlyph(text, font, size, step) {
  const side = Math.ceil(size * 1.5);
  const off = document.createElement('canvas');
  off.width = off.height = side;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Float32Array(0);
  ctx.font = font;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, side / 2, side / 2);
  const data = ctx.getImageData(0, 0, side, side).data;
  const pts = [];
  let minX = side, maxX = 0, minY = side, maxY = 0;
  for (let y = 0; y < side; y += step) {
    for (let x = 0; x < side; x += step) {
      if (data[(y * side + x) * 4 + 3] <= 120) continue;
      pts.push(x, y);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  const out = new Float32Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) { out[i] = pts[i] - mx; out[i + 1] = pts[i + 1] - my; }
  return out;
}

/* The start pose and schedule of one dot, per mode. Each writes aA into
   d[o..o+3] (and may use the spare d[o+6], d[o+7]) and returns
   [delay, duration] in seconds. `p` describes the dot: xr/yr across the
   letters (0..1), vy its viewport y at the top of the page, letter/letterX
   its glyph, capH/capW the size of the letters, viewH the viewport, sz the
   motion scale, seal the offsets of the S glyph. */
const POSE = {
  /* a globe of dots spins up, then throws every grain out along an arc */
  orbit(d, o, p) {
    const y = 1 - 2 * Math.random(), r = Math.sqrt(Math.max(0, 1 - y * y)), th = rand(0, TAU);
    d[o] = Math.cos(th) * r; d[o + 1] = y; d[o + 2] = Math.sin(th) * r;
    d[o + 6] = rand(-140, 140) * p.sz;
    return [rand(0, 0.42), rand(1.0, 1.5)];
  },
  /* falls from above the top edge, left to right, and bounces once */
  rain(d, o, p) {
    const drop = p.vy + rand(10, p.viewH * 0.9);
    d[o] = drop;
    return [p.xr + rand(0, 0.32), Math.sqrt((2 * drop) / RAIN_GRAVITY)];
  },
  /* a pulsing core unwinds into the letters, one or two laps each */
  vortex(d, o, p) {
    d[o] = rand(0.03, 0.5) * p.capH; d[o + 1] = rand(0, TAU);
    d[o + 2] = Math.random() < 0.33 ? 2 : 1; d[o + 3] = rand(0.2, 1) * p.capH * 1.6;
    return [rand(0, 0.65), rand(1.5, 2.1)];
  },
  /* a seal (two rings and an S) morphs into the name with an overshoot */
  monogram(d, o, p) {
    const u = Math.random();
    if (u < 0.6) { d[o] = rand(0, TAU); d[o + 2] = u < 0.4 ? 0 : 1; }
    else {
      const g = p.seal, m = g.length >> 1;
      if (m) { const j = Math.floor(Math.random() * m) * 2; d[o] = g[j] + rand(-1.5, 1.5); d[o + 1] = g[j + 1] + rand(-1.5, 1.5); }
      d[o + 2] = 2;
    }
    return [p.xr * 0.75 + rand(0, 0.26), rand(0.9, 1.3)];
  },
  /* a print head sweeps across; every dot pops in bright as it passes */
  print(d, o, p) { return [p.xr * 2.1, 0.06]; },
  /* pours out of the mark in the header in a fanned arc */
  beam(d, o, p) {
    d[o] = rand(-1, 1) * p.capH * 1.2; d[o + 1] = rand(-0.15, 0.15) * p.capW;
    return [p.xr * 0.9 + rand(0, 0.3), rand(0.9, 1.3)];
  },
  /* letter by letter, dropped in from above with a bounce */
  type(d, o, p) { return [p.letter * 0.14 + rand(0, 0.06), 0.55 + rand(0, 0.1)]; },
  /* every letter turns on its own vertical axis */
  flip(d, o, p) { d[o] = p.letterX; return [p.letter * 0.1 + rand(0, 0.04), 0.9]; },
  /* rises from below the bottom edge, swaying, lower rows first */
  tide(d, o, p) {
    d[o] = p.viewH - p.vy + rand(10, p.viewH * 0.5); d[o + 1] = rand(0, TAU);
    return [(1 - p.yr) * 0.7 + rand(0, 0.25), rand(0.8, 1.1)];
  },
};

/* The plan for one replay: eight floats per dot (aA: the start pose; aB:
   delay, duration, two spare) and the timeline in seconds from the click.
   ctx: n, targets (box units), box (page px), caps (bounds of the letters
   in box units), letters (from detectLetters), viewH, and seal for the
   monogram. */
export function planReplay(mode, ctx) {
  const pose = POSE[mode];
  if (!pose) throw new Error(`unknown replay mode: ${mode}`);
  const { n, targets, box, caps, letters, viewH } = ctx;
  const base = {
    sz: Math.min(1, Math.max(0.3, box.w / 900)),
    capH: caps.h * box.h, capW: caps.w * box.w, viewH,
    seal: ctx.seal || new Float32Array(0),
  };
  const left = caps.cx - caps.w / 2, top = caps.cy - caps.h / 2;
  const data = new Float32Array(n * 8);
  let maxDelay = 0, maxDur = 0;
  for (let i = 0; i < n; i++) {
    const nx = targets[i * 2], ny = targets[i * 2 + 1];
    const p = {
      ...base,
      xr: caps.w > 0 ? (nx - left) / caps.w : 0,
      yr: caps.h > 0 ? (ny - top) / caps.h : 0,
      vy: box.y + ny * box.h,
      letter: letters.index[i], letterX: letters.centre[i],
    };
    const o = i * 8;
    const [delay, dur] = pose(data, o, p);
    data[o + 4] = delay; data[o + 5] = dur;
    if (delay > maxDelay) maxDelay = delay;
    if (dur > maxDur) maxDur = dur;
  }
  const outLen = maxDelay * OUT_DELAY_K + maxDur * OUT_DUR_K;
  const inStart = outLen + HOLD_S[mode];
  return { mode, index: MODES.indexOf(mode), data, outLen, hold: HOLD_S[mode], inStart, maxDelay, end: inStart + maxDelay + maxDur + SETTLE_S };
}

/* ---------- the GLSL, spliced into the particle vertex shader ---------- */
export const REPLAY_FUNCS = `
    float easeOutC(float k) { return 1.0 - pow(1.0 - k, 3.0); }
    float easeInOutC(float k) { return k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0; }
    float easeBackC(float k) { float c = 1.35; float j = k - 1.0; return 1.0 + (c + 1.0) * j * j * j + c * j * j; }`;

/* Runs inside main() with target (viewport px), sz, uMode, uReplay,
   uReplayT, uCentre, uMark, uBox, aA, aB in scope. Sets pos, f, show, grow
   and lift. p is the progress: 0 at the mode's start pose, 1 at home. The
   exit plays the schedule backwards and faster; `over` is the time since
   landing, for bounces and flashes. A spinning start pose freezes for a dot
   the moment that dot leaves it, so its path never jumps. */
export const REPLAY_BODY = `
        float p; float over = 100.0;   /* no landing flash or bounce on the way out */
        if (uReplay < uReplayT.z) {
          p = 1.0 - clamp((uReplay - (uReplayT.w - aB.x) * ${OUT_DELAY_K}) / (aB.y * ${OUT_DUR_K}), 0.0, 1.0);
        } else {
          float tIn = uReplay - uReplayT.z - aB.x;
          p = clamp(tIn / aB.y, 0.0, 1.0);
          over = max(0.0, tIn - aB.y);
        }
        float launch = min(uReplay, uReplayT.z + aB.x);
        vec2 c = uCentre.xy;
        show = 1.0;
        if (uMode < 0.5) {            /* ORBIT: a spinning globe throws every dot into place */
          float sp = launch * 1.2;
          vec3 v = aA.xyz;
          float x = v.x * cos(sp) + v.z * sin(sp), z = -v.x * sin(sp) + v.z * cos(sp);
          float y = v.y * 0.9394 - z * 0.3429, z2 = v.y * 0.3429 + z * 0.9394;
          float per = 1.0 / (1.0 + z2 * 0.35);
          vec2 s = c + vec2(x, y) * min(uCentre.z * 0.95, uCentre.w * 0.14) * per;
          vec2 d = target - c; float L = max(length(d), 1.0); vec2 nrm = d / L; vec2 q = vec2(-nrm.y, nrm.x);
          vec2 m = (s + target) * 0.5 + nrm * 80.0 * sz + q * aB.z;
          float e = easeOutC(p), u = 1.0 - e;
          pos = u * u * s + 2.0 * u * e * m + e * e * target;
          float zz = z2 * 0.5 + 0.5;   /* 1 = the near side of the globe */
          grow = (1.0 - p) * 0.15;
          lift = zz * (1.0 - p) * 0.7;
          show = mix(1.0, mix(0.08, 0.75, zz * zz), 1.0 - p);   /* the far side fades, so the globe reads as a ball */
        } else if (uMode < 1.5) {     /* RAIN: falls from the sky, bounces once */
          pos = vec2(target.x, mix(target.y - aA.x, target.y, p * p));
          pos.y -= abs(sin(over * 12.0)) * 16.0 * sz * exp(-over * 4.2);
          lift = exp(-over * 3.0) * step(0.999, p);
        } else if (uMode < 2.5) {     /* VORTEX: spirals out of a pulsing core */
          vec2 d = target - c; float rT = length(d); float aT = atan(d.y, d.x);
          float r0 = aA.x * (1.0 + 0.25 * sin(uReplay * 9.0));
          float da = aT - aA.y; da -= 6.28318 * floor((da + 3.14159) / 6.28318);
          float e = easeInOutC(p);
          float r = mix(r0, rT, e) + sin(3.14159 * e) * aA.w * (1.0 - e * 0.5);
          float a = aA.y + (da + 6.28318 * aA.z) * e;
          pos = c + vec2(cos(a), sin(a)) * r;
          grow = (1.0 - p) * 0.25;
          lift = (1.0 - p) * 0.5;
          show = mix(1.0, 0.4, 1.0 - p);   /* the core glows instead of burning white */
        } else if (uMode < 3.5) {     /* MONOGRAM: two rings and an S, morphing out with an overshoot */
          vec2 s; float rS = uCentre.z * 0.7;
          if (aA.z < 0.5) { float a = aA.x + launch * 0.8; s = c + vec2(cos(a), sin(a)) * rS; }
          else if (aA.z < 1.5) { float a = aA.x - launch * 0.56; s = c + vec2(cos(a), sin(a)) * rS * 0.86; }
          else s = c + aA.xy * (1.0 + 0.035 * sin(uReplay * 4.0));
          pos = mix(s, target, easeBackC(p));
          lift = (1.0 - p) * 0.55;
        } else if (uMode < 4.5) {     /* PRINT: the head sweeps across and each dot pops in */
          pos = target;
          show = smoothstep(0.0, 1.0, p);
          float pop = exp(-over * 4.3) * step(0.999, p);
          grow = pop * 1.3;
          lift = pop;
        } else if (uMode < 5.5) {     /* BEAM: pours out of the mark in the header */
          vec2 s = uMark;
          vec2 d = target - s; float L = max(length(d), 1.0); vec2 nrm = d / L; vec2 q = vec2(-nrm.y, nrm.x);
          vec2 m = (s + target) * 0.5 + q * aA.x + nrm * aA.y;
          float e = easeOutC(p), u = 1.0 - e;
          pos = u * u * s + 2.0 * u * e * m + e * e * target;
          grow = (1.0 - p) * 0.6;
          lift = (1.0 - p) * 0.8;
          show = smoothstep(0.0, 0.08, p);
        } else if (uMode < 6.5) {     /* TYPE: letter by letter, dropped in from above */
          pos = vec2(target.x, mix(target.y - uCentre.z * 1.6, target.y, easeBackC(p)));
          show = smoothstep(0.0, 0.15, p);
          lift = exp(-over * 4.0) * step(0.999, p) * 0.8;
        } else if (uMode < 7.5) {     /* FLIP: every letter turns on its own axis */
          float th = (1.0 - easeInOutC(p)) * 3.14159;
          float lc = uBox.x + aA.x * uBox.z;
          float dx = target.x - lc;
          float z = dx * sin(th);
          float per = 1.0 / (1.0 + z * 0.0012 / sz);
          pos = vec2(lc + dx * cos(th) * per, c.y + (target.y - c.y) * per);
          lift = clamp(-z * 0.004 / sz, 0.0, 0.6);
          show = 0.55 + 0.45 * abs(cos(th));
        } else {                      /* TIDE: rises from below, swaying */
          float e = easeOutC(p);
          pos = vec2(target.x + sin(p * 6.28318 + aA.y) * 22.0 * sz * (1.0 - p), mix(target.y + aA.x, target.y, e));
          lift = exp(-over * 3.0) * step(0.999, p) * 0.7;
        }
        f = p;`;
