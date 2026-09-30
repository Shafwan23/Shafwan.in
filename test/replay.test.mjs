import test from 'node:test';
import assert from 'node:assert/strict';
import { MODES, pickMode, detectLetters, planReplay, OUT_DELAY_K, OUT_DUR_K } from '../src/js/scene/replay.js';

/* a synthetic word: seven letters of 20 columns, one empty column between
   them, twelve rows; box units are column / res and row / rows */
const COLS = 20, GAP = 1, ROWS = 12;
const RES = 7 * COLS + 6 * GAP;
function word() {
  const pts = [];
  for (let k = 0; k < 7; k++) {
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) pts.push((k * (COLS + GAP) + c) / RES, r / ROWS);
    }
  }
  return { targets: new Float32Array(pts), n: pts.length / 2, bucket: 1 / RES };
}
function ctxFor(w) {
  const box = { x: 40, y: 200, w: 1200, h: 260 };
  const caps = { cx: 0.5, cy: 0.5, w: 1, h: 1 };
  const letters = detectLetters(w.targets, w.n, w.bucket);
  return { n: w.n, targets: w.targets, box, caps, letters, viewH: 800, seal: new Float32Array([0, 0, 10, 10]) };
}

test('pickMode never repeats the last mode and stays inside the list', () => {
  for (const last of MODES) {
    for (let i = 0; i < 40; i++) {
      const m = pickMode(last);
      assert.notEqual(m, last);
      assert.ok(MODES.includes(m));
    }
  }
  assert.equal(pickMode('orbit', () => 0), 'rain');
  assert.equal(pickMode('orbit', () => 0.999999), 'tide');
});

test('detectLetters cuts the word at the empty columns into seven letters', () => {
  const w = word();
  const { index, centre, exact } = detectLetters(w.targets, w.n, w.bucket);
  assert.equal(exact, true);
  for (let i = 0; i < w.n; i++) {
    const expected = Math.floor((w.targets[i * 2] * RES + 0.5) / (COLS + GAP));
    assert.equal(index[i], expected);
    const left = expected * (COLS + GAP), right = left + COLS - 1;
    assert.ok(Math.abs(centre[i] - (left + right) / 2 / RES) < 1e-6);
  }
});

test('detectLetters falls back to seven equal slices when the letters touch', () => {
  const pts = [];
  for (let c = 0; c < 140; c++) pts.push(c / 140, 0.5);
  const targets = new Float32Array(pts);
  const { index, exact } = detectLetters(targets, 140, 1 / 140);
  assert.equal(exact, false);
  assert.equal(index[0], 0);
  assert.equal(index[139], 6);
  assert.equal(index[70], 3);
});

test('planReplay lays out eight floats per dot and an ordered timeline for every mode', () => {
  const w = word();
  const ctx = ctxFor(w);
  for (const mode of MODES) {
    const plan = planReplay(mode, ctx);
    assert.equal(plan.index, MODES.indexOf(mode));
    assert.equal(plan.data.length, w.n * 8);
    let maxDelay = 0, maxDur = 0;
    for (let i = 0; i < w.n; i++) {
      const delay = plan.data[i * 8 + 4], dur = plan.data[i * 8 + 5];
      assert.ok(delay >= 0, `${mode}: delay`);
      assert.ok(dur > 0, `${mode}: duration`);
      maxDelay = Math.max(maxDelay, delay); maxDur = Math.max(maxDur, dur);
    }
    assert.ok(Math.abs(plan.maxDelay - maxDelay) < 1e-6);
    assert.ok(Math.abs(plan.outLen - (maxDelay * OUT_DELAY_K + maxDur * OUT_DUR_K)) < 1e-6);
    assert.ok(plan.inStart > plan.outLen, `${mode}: hold`);
    assert.ok(plan.end > plan.inStart + maxDelay + maxDur, `${mode}: settle`);
  }
});

test('print sweeps left to right, rain starts above the top edge, type and flip go letter by letter', () => {
  const w = word();
  const ctx = ctxFor(w);
  const first = 0, last = w.n - 1;   /* the word is built left to right */
  const print = planReplay('print', ctx);
  assert.ok(print.data[first * 8 + 4] < print.data[last * 8 + 4]);
  const rain = planReplay('rain', ctx);
  for (let i = 0; i < w.n; i += 97) {
    const vy = ctx.box.y + w.targets[i * 2 + 1] * ctx.box.h;
    assert.ok(rain.data[i * 8] > vy, 'rain drop height clears the viewport top');
  }
  for (const mode of ['type', 'flip']) {
    const plan = planReplay(mode, ctx);
    const perLetter = Array.from({ length: 7 }, () => Infinity);
    for (let i = 0; i < w.n; i++) {
      const k = ctx.letters.index[i];
      perLetter[k] = Math.min(perLetter[k], plan.data[i * 8 + 4]);
    }
    for (let k = 1; k < 7; k++) assert.ok(perLetter[k] > perLetter[k - 1], `${mode}: letter ${k} after ${k - 1}`);
  }
  const flip = planReplay('flip', ctx);
  assert.ok(Math.abs(flip.data[0] - ctx.letters.centre[0]) < 1e-6);
});

test('planReplay rejects an unknown mode', () => {
  assert.throws(() => planReplay('sparkle', ctxFor(word())), /unknown replay mode/);
});
