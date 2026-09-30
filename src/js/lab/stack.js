/*
 * 01 · STACK — hold a growing sequence in your head.
 * Four tiles light up in order; tap them back. Each level adds one. The server
 * deals the sequence and re-scores the run from the taps and times; the score
 * counted here is only the live readout. With no server it runs as practice.
 */

import {
  GAP_MS, LEVEL_PAUSE_MS, MAX_LEVELS, MAX_SCORE, dealSequence, lengthAt, levelPoints, showMsAt,
} from '../../../api/src/shared/stack-rules.js';
import { apiReady, play } from '../api.js';
import { offer } from './board.js';
import { FOCUS, flash, tick, typing } from './shared.js';

const localRand = (n) => Math.floor(Math.random() * n);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TILE_NAMES = ['gold', 'blue', 'coral', 'green'];

export function initStack() {
  const grid = document.getElementById('stGrid');
  if (!grid) return;

  const stage = grid.closest('.st-stage');
  const taskEl = document.getElementById('stTask');
  const depthEl = document.getElementById('stDepth');
  const stepsEl = document.getElementById('stSteps');
  const scoreEl = document.getElementById('stScore');
  const levelEl = document.getElementById('stLevel');
  const bestEl = document.getElementById('stBest');
  const overlay = document.getElementById('stOverlay');
  const msg = document.getElementById('stMsg');
  const startBtn = document.getElementById('stStart');
  const live = document.getElementById('stLive');
  const verdict = document.getElementById('stVerdict');

  /* idle -> loading -> show | input -> over */
  let state = 'idle', sequence = [], level = 1, step = 0, score = 0, best = 0;
  let t0 = 0, runId = null, taps = [], practiceNote = '', showToken = 0;

  const tiles = [0, 1, 2, 3].map((i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `st-tile st-tile--${TILE_NAMES[i]}`;
    b.setAttribute('aria-label', `Tile ${i + 1}`);
    b.innerHTML = `<span class="st-key" aria-hidden="true">${i + 1}</span>`;
    b.addEventListener('pointerdown', (e) => { if (e.button === 0) press(i); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(i); } });
    /* the tap flash must end, or the tile could never show a later light-up */
    b.addEventListener('animationend', () => b.classList.remove('tap'));
    return b;
  });
  grid.replaceChildren(...tiles);

  function light(i, ms) {
    tiles[i].classList.add('lit');
    return wait(ms).then(() => tiles[i].classList.remove('lit'));
  }

  function paintSteps(length) {
    stepsEl.replaceChildren(...Array.from({ length }, (_, i) => {
      const s = document.createElement('i');
      if (i < step) s.className = 'ok';
      return s;
    }));
  }

  /* the machine's turn: play the sequence so far */
  async function show() {
    state = 'show';
    const mine = ++showToken;
    const length = lengthAt(level);
    step = 0;
    grid.classList.add('showing');
    levelEl.textContent = `${level}/${MAX_LEVELS}`;
    depthEl.textContent = `Depth ${level} — ${length} tiles`;
    taskEl.textContent = 'Watch';
    paintSteps(length);
    await wait(500);
    for (let i = 0; i < length; i++) {
      if (showToken !== mine || state !== 'show') return;
      await light(sequence[i], showMsAt(level));
      await wait(GAP_MS);
    }
    if (showToken !== mine || state !== 'show') return;
    grid.classList.remove('showing');
    state = 'input';
    taskEl.textContent = 'Your turn';
    live.textContent = `Level ${level}: repeat ${length} tiles.`;
  }

  function press(i) {
    if (state !== 'input') return;
    const now = performance.now();
    taps.push({ k: i, t: Math.round(now - t0) });
    tiles[i].classList.remove('tap');
    void tiles[i].offsetWidth;
    tiles[i].classList.add('tap');
    setTimeout(() => tiles[i].classList.remove('tap'), 320);   /* belt and braces if animationend never fires */

    if (i !== sequence[step]) { miss(i); return; }
    step++;
    paintSteps(lengthAt(level));
    if (step < lengthAt(level)) return;
    cleared();
  }

  function cleared() {
    state = 'show';
    const length = lengthAt(level);
    const levelTaps = taps.slice(-length);
    const took = levelTaps[length - 1].t - levelTaps[0].t;
    const points = levelPoints(took, length);
    score += points;
    tick(scoreEl, score);
    live.textContent = `Cleared depth ${level}. ${points} points, ${score} total.`;
    flash(verdict, stage, { right: true, word: took < length * 500 ? 'Quick!' : 'Cleared', points: `+${points}`, note: '', quick: true });
    if (level >= MAX_LEVELS) { end(true); return; }
    level++;
    setTimeout(() => { if (state === 'show') show(); }, LEVEL_PAUSE_MS);
  }

  function miss(i) {
    const wanted = sequence[step];
    tiles[wanted].classList.add('lit');
    setTimeout(() => tiles[wanted].classList.remove('lit'), 900);
    live.textContent = `Miss. Tile ${wanted + 1} was next.`;
    flash(verdict, stage, {
      right: false,
      word: 'Miss',
      points: `depth ${level - 1}`,
      note: `Step ${step + 1} was tile <b>${wanted + 1}</b>, not ${i + 1}.`,
    });
    end(false);
  }

  async function deal() {
    runId = null;
    if (!apiReady) return { sequence: dealSequence(localRand), note: '' };
    try {
      const r = await play('/runs', { game: 'stack' });
      runId = r.runId;
      return { sequence: r.sequence, note: '' };
    } catch (err) {
      return { sequence: dealSequence(localRand), note: err.message };
    }
  }

  async function start() {
    if (state !== 'idle' && state !== 'over') return;
    state = 'loading';
    startBtn.disabled = true;
    startBtn.textContent = 'Connecting…';
    const dealt = await deal();
    startBtn.disabled = false;
    sequence = dealt.sequence;
    practiceNote = dealt.note;
    level = 1; step = 0; score = 0; taps = [];
    scoreEl.textContent = '0';
    FOCUS.claim('stack');
    overlay.hidden = true;
    t0 = performance.now();
    show();
  }

  function keepBest(value) {
    if (value <= best) return;
    best = value;
    tick(bestEl, best);
  }

  async function report(complete) {
    const depth = complete ? MAX_LEVELS : level - 1;
    if (!runId) {
      const why = practiceNote ? ` (${practiceNote})` : '';
      msg.textContent = `Depth ${depth} for ${score} points. Practice run, not ranked${why}.`;
      return;
    }
    msg.textContent = `Depth ${depth}. Verifying the run…`;
    try {
      const res = await play(`/runs/${runId}/finish`, { game: 'stack', taps });
      const { score: verified, place } = res.final;
      scoreEl.textContent = verified;
      keepBest(res.depth);
      msg.textContent = place
        ? `Depth ${res.depth} for ${verified} points. That is rank #${place}.`
        : `Depth ${res.depth} for ${verified} points. The board is unmoved.`;
      live.textContent = msg.textContent;
      const signed = await offer('stack', runId, res.final);
      if (signed) {
        msg.textContent = signed.place
          ? `${verified} points — signed ${signed.name}, rank #${signed.place}.`
          : `${verified} points. Your better score already holds the board.`;
      }
    } catch (err) {
      msg.textContent = `Depth ${depth}, but the run could not be verified: ${err.message}`;
    }
  }

  function end(complete) {
    state = 'over';
    showToken++;
    FOCUS.release('stack');
    grid.classList.remove('showing');
    const depth = complete ? MAX_LEVELS : level - 1;
    keepBest(depth);
    taskEl.textContent = complete ? 'Stack cleared' : 'Stack overflow';
    depthEl.textContent = complete ? `Depth ${MAX_LEVELS} — the whole stack` : `Depth ${depth}`;
    startBtn.textContent = 'Run it back';
    setTimeout(() => { overlay.hidden = false; report(complete); }, complete ? 900 : 1500);
  }

  startBtn.addEventListener('click', start);

  addEventListener('keydown', (e) => {
    if (typing(e) || state !== 'input' || !FOCUS.has('stack')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) { e.preventDefault(); press(n - 1); }
  });

  msg.textContent = `Four tiles light up in order. Tap them back. Every level adds one; a wrong tap ends the run. Fifteen levels, ${MAX_SCORE} points at most.`;
  paintSteps(lengthAt(1));
}
