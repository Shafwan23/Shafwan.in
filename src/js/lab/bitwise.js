/*
 * 01 · BITWISE — an eight-bit register you drive by hand.
 * The server deals the rounds and re-scores the run from the solve times; the
 * score counted here is only the live readout. With no server it runs as practice.
 */

import { answerOf, dealRounds, roundPoints } from '../../../api/src/shared/bitwise-rules.js';
import { apiReady, play } from '../api.js';
import { offer } from './board.js';
import { FOCUS, tick, typing } from './shared.js';

const RUN_MS = 60000;
const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
const PRACTICE_ROUNDS = 160;
const hex2 = (v) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
const localRand = (n) => Math.floor(Math.random() * n);

/** The task line and prompt for a dealt round. */
function labelOf(r) {
  switch (r.k) {
    case 'dec': return { task: 'Match the decimal', label: `DEC <em>${r.v}</em>` };
    case 'hex': return { task: 'Match the hexadecimal', label: `HEX <em>${hex2(r.v)}</em>` };
    case 'and': return { task: 'Bitwise AND', label: `${hex2(r.a)} <em>&amp;</em> ${hex2(r.b)}` };
    case 'or': return { task: 'Bitwise OR', label: `${hex2(r.a)} <em>|</em> ${hex2(r.b)}` };
    case 'xor': return { task: 'Bitwise XOR', label: `${hex2(r.a)} <em>^</em> ${hex2(r.b)}` };
    case 'shl': return { task: 'Shift left, 8 bits wide', label: `${hex2(r.x)} <em>&lt;&lt;</em> ${r.n}` };
    case 'shr': return { task: 'Shift right', label: `${hex2(r.x)} <em>&gt;&gt;</em> ${r.n}` };
    default: return { task: 'One’s complement, 8 bits wide', label: `<em>~</em>${hex2(r.x)}` };
  }
}

export function initBitwise() {
  const wrap = document.getElementById('bwBits');
  if (!wrap) return;

  const stage = wrap.closest('.bw-stage');
  const promptEl = document.getElementById('bwPrompt');
  const taskEl = document.getElementById('bwTask');
  const meter = document.getElementById('bwMeter');
  const scoreEl = document.getElementById('bwScore');
  const streakEl = document.getElementById('bwStreak');
  const timeEl = document.getElementById('bwTime');
  const decEl = document.getElementById('bwDec');
  const hexEl = document.getElementById('bwHex');
  const binEl = document.getElementById('bwBin');
  const overlay = document.getElementById('bwOverlay');
  const msg = document.getElementById('bwMsg');
  const startBtn = document.getElementById('bwStart');
  const live = document.getElementById('bwLive');

  let bits = new Array(8).fill(0);
  let state = 'idle', score = 0, streak = 0, answer = 0, t0 = 0, roundT0 = 0, raf = 0, solved = 0;
  let rounds = [], roundIdx = 0, runId = null, solves = [];

  /* ---- the switches ---- */
  const btns = WEIGHTS.map((w, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bw-bit';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `Bit ${7 - i}, worth ${w}`);
    b.innerHTML = `<span class="bw-ix" aria-hidden="true">${7 - i}</span>` +
      '<span class="bw-led" aria-hidden="true"></span>' +
      `<span class="bw-w" aria-hidden="true">${w}</span>`;
    b.addEventListener('click', () => toggle(i));
    return b;
  });
  wrap.replaceChildren(...btns);

  const value = () => bits.reduce((v, b, i) => v + (b ? WEIGHTS[i] : 0), 0);

  function paint() {
    const v = value();
    bits.forEach((b, i) => btns[i].setAttribute('aria-pressed', b ? 'true' : 'false'));
    decEl.textContent = v;
    hexEl.textContent = hex2(v);
    binEl.textContent = v.toString(2).padStart(8, '0');
    return v;
  }

  function toggle(i) {
    bits[i] = bits[i] ? 0 : 1;
    const v = paint();
    if (state === 'run' && v === answer) win();
  }

  /* ---- rounds ---- */
  function nextRound() {
    const r = rounds[roundIdx];
    if (!r) { end(); return; }
    answer = answerOf(r);
    const { task, label } = labelOf(r);
    taskEl.textContent = task;
    promptEl.innerHTML = label;
    promptEl.classList.remove('swap');
    void promptEl.offsetWidth;
    promptEl.classList.add('swap');
    roundT0 = performance.now();
  }

  function win() {
    const now = performance.now();
    streak++;
    solved++;
    score += roundPoints(now - roundT0, streak);
    solves.push(Math.round(now - t0));
    roundIdx++;
    tick(scoreEl, score);
    const mult = Math.min(5, 1 + Math.floor(streak / 2) * 0.5);
    streakEl.textContent = '×' + mult;
    live.textContent = `Correct. ${score} points, chain ×${mult}.`;
    stage.classList.remove('solved');
    void stage.offsetWidth;
    stage.classList.add('solved');
    nextRound();
  }

  function frame(t) {
    if (state !== 'run') return;
    const left = Math.max(0, RUN_MS - (t - t0));
    meter.style.transform = `scaleX(${left / RUN_MS})`;
    const secs = Math.ceil(left / 1000);
    if (timeEl.textContent !== String(secs)) timeEl.textContent = secs;
    if (left <= 0) { end(); return; }
    raf = requestAnimationFrame(frame);
  }

  /* asks the server for a ranked run; falls back to a practice deal */
  async function deal() {
    runId = null;
    if (!apiReady) return { rounds: dealRounds(localRand, PRACTICE_ROUNDS), note: '' };
    try {
      const r = await play('/runs', { game: 'bitwise' });
      runId = r.runId;
      return { rounds: r.rounds, note: '' };
    } catch (err) {
      return { rounds: dealRounds(localRand, PRACTICE_ROUNDS), note: err.message };
    }
  }

  let practiceNote = '';
  async function start() {
    if (state === 'loading' || state === 'run') return;
    state = 'loading';
    startBtn.disabled = true;
    startBtn.textContent = 'Connecting…';
    const dealt = await deal();
    startBtn.disabled = false;
    rounds = dealt.rounds;
    practiceNote = dealt.note;

    bits = new Array(8).fill(0);
    paint();
    score = 0; streak = 0; solved = 0; roundIdx = 0; solves = [];
    scoreEl.textContent = '0';
    streakEl.textContent = '×1';
    timeEl.textContent = '60';
    state = 'run';
    FOCUS.claim('bitwise');
    overlay.hidden = true;
    t0 = performance.now();
    nextRound();
    raf = requestAnimationFrame(frame);
    btns[0].focus();
  }

  async function report() {
    if (!runId) {
      const why = practiceNote ? ` (${practiceNote})` : '';
      msg.textContent = `${solved} solved for ${score} points. Practice run, not ranked${why}.`;
      return;
    }
    msg.textContent = `${solved} solved. Verifying the run…`;
    try {
      const res = await play(`/runs/${runId}/finish`, { game: 'bitwise', solves });
      const { score: verified, place } = res.final;
      scoreEl.textContent = verified;
      msg.textContent = place
        ? `${res.solved} solved for ${verified} points. That is rank #${place}.`
        : `${res.solved} solved for ${verified} points. The board is unmoved.`;
      live.textContent = msg.textContent;
      if (!place) return;
      const signed = await offer('bitwise', runId, res.final);
      if (signed) {
        msg.textContent = signed.place
          ? `${verified} points — signed ${signed.name}, rank #${signed.place}.`
          : `${verified} points. Your better score already holds the board.`;
      }
    } catch (err) {
      msg.textContent = `${solved} solved, but the run could not be verified: ${err.message}`;
    }
  }

  function end() {
    if (state !== 'run') return;
    state = 'over';
    FOCUS.release('bitwise');
    cancelAnimationFrame(raf);
    meter.style.transform = 'scaleX(0)';
    timeEl.textContent = '0';
    taskEl.textContent = 'Register halted';
    startBtn.textContent = 'Run it back';
    overlay.hidden = false;
    live.textContent = `Time. ${score} points from ${solved} solved.`;
    report();
  }

  startBtn.addEventListener('click', start);

  addEventListener('keydown', (e) => {
    if (typing(e) || state !== 'run' || !FOCUS.has('bitwise')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 8) { e.preventDefault(); toggle(n - 1); return; }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      bits = new Array(8).fill(0);
      const v = paint();
      if (v === answer) win();
    }
  });

  /* the clock is wall-time, so hold it while the tab is away */
  let awayAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (state !== 'run') return;
    if (document.hidden) { awayAt = performance.now(); cancelAnimationFrame(raf); }
    else if (awayAt) {
      const gap = performance.now() - awayAt;
      t0 += gap; roundT0 += gap; awayAt = 0;
      raf = requestAnimationFrame(frame);
    }
  });

  paint();
}
