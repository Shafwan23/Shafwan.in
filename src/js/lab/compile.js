/*
 * 02 · COMPILE — engineering recall against a twelve second clock.
 * The question bank and its answers live on the server: each answer is judged,
 * timed and scored there, so this page never knows the right option in advance.
 */

import { ApiFailure, apiReady, play } from '../api.js';
import { offer } from './board.js';
import { FOCUS, tick, typing } from './shared.js';

const PER_Q = 12000;
const LEN = 119.4; /* 2πr, r = 19 */
const pad = (n) => String(n).padStart(2, '0');

/* The server's questions may carry <code> and <em>; everything else is escaped. */
function safeHtml(text) {
  const escaped = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/&lt;(\/?)(code|em)&gt;/g, '<$1$2>');
}

export function initCompile() {
  const optsEl = document.getElementById('cpOpts');
  if (!optsEl) return;

  const qEl = document.getElementById('cpQ');
  const catEl = document.getElementById('cpCat');
  const livesEl = document.getElementById('cpLives');
  const arc = document.getElementById('cpArc');
  const countEl = document.getElementById('cpCount');
  const scoreEl = document.getElementById('cpScore');
  const streakEl = document.getElementById('cpStreak');
  const solvedEl = document.getElementById('cpSolved');
  const overlay = document.getElementById('cpOverlay');
  const msg = document.getElementById('cpMsg');
  const startBtn = document.getElementById('cpStart');
  const noteEl = document.getElementById('cpNote');
  const railEl = document.getElementById('cpRail');
  const progEl = document.getElementById('cpProgress');
  const live = document.getElementById('cpLive');

  let state = 'idle', runId = null, question = null, qT0 = 0, raf = 0, locked = false;
  let lives = 3, solved = 0, total = 48;

  function buildRail(n) {
    railEl.replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
  }

  function markRail(i, ok) {
    const t = railEl.children[i];
    if (t) { t.classList.remove('now'); t.classList.add(ok ? 'ok' : 'no'); }
  }

  function paintLives() {
    [...livesEl.querySelectorAll('i')].forEach((el, i) => el.classList.toggle('out', i >= lives));
    livesEl.querySelector('.sr-only').textContent = `Lives left: ${lives}`;
  }

  function show(q) {
    question = q;
    locked = false;
    catEl.textContent = `${q.category} — ${pad(q.number)} of ${pad(q.total)}`;
    progEl.textContent = `question ${q.number} of ${q.total}`;
    railEl.children[q.number - 1]?.classList.add('now');
    qEl.innerHTML = safeHtml(q.html);
    qEl.classList.remove('swap');
    void qEl.offsetWidth;
    qEl.classList.add('swap');

    optsEl.replaceChildren(...q.options.map((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cp-opt';
      b.innerHTML = `<span class="cp-key" aria-hidden="true">${i + 1}</span><span class="cp-text"></span>`;
      b.querySelector('.cp-text').textContent = text;
      b.addEventListener('click', () => answer(i));
      return b;
    }));

    qT0 = performance.now();
    raf = requestAnimationFrame(clock);
  }

  function clock(t) {
    if (state !== 'run' || locked) return;
    const left = Math.max(0, PER_Q - (t - qT0));
    arc.style.strokeDashoffset = LEN * (1 - left / PER_Q);
    const secs = Math.ceil(left / 1000);
    if (countEl.textContent !== String(secs)) countEl.textContent = secs;
    if (left <= 0) { answer(-1); return; }
    raf = requestAnimationFrame(clock);
  }

  function verdict(reply, picked) {
    [...optsEl.children].forEach((b, n) => {
      if (n === reply.rightIndex) b.classList.add('right');
      else if (n === picked) b.classList.add('wrong');
    });
    solved = reply.solved;
    lives = reply.lives;
    tick(scoreEl, reply.score);
    streakEl.textContent = '×' + reply.chain;
    solvedEl.textContent = solved;
    paintLives();
    noteEl.textContent = reply.right ? 'Correct.'
      : picked === -1 || reply.late ? `Out of time — it was ${reply.rightText}.` : `No — it was ${reply.rightText}.`;
    live.textContent = reply.right ? `Correct. ${reply.score} points.` : noteEl.textContent;
    markRail(question.number - 1, reply.right);
  }

  async function answer(i) {
    if (locked || state !== 'run') return;
    locked = true;
    cancelAnimationFrame(raf);
    [...optsEl.children].forEach((b) => { b.disabled = true; });
    let reply;
    try {
      reply = await play(`/runs/${runId}/answer`, { choice: i, number: question.number });
    } catch (err) {
      stop(`The run stopped: ${err.message}`);
      return;
    }
    verdict(reply, i);
    setTimeout(() => {
      if (state !== 'run') return;
      if (reply.final) end(reply.final);
      else show(reply.next);
    }, reply.right ? 700 : 1500);
  }

  async function start() {
    if (state === 'loading' || state === 'run') return;
    state = 'loading';
    startBtn.disabled = true;
    startBtn.textContent = 'Connecting…';
    try {
      if (!apiReady) throw new ApiFailure(0, 'offline', 'The question server is not connected yet.');
      const r = await play('/runs', { game: 'compile' });
      runId = r.runId;
      total = r.question.total;
      lives = r.lives;
      solved = 0;
      buildRail(total);
      paintLives();
      scoreEl.textContent = '0';
      streakEl.textContent = '×1';
      solvedEl.textContent = '0';
      state = 'run';
      FOCUS.claim('compile');
      overlay.hidden = true;
      noteEl.textContent = 'Keys 1–4 answer. The clock is worth points.';
      show(r.question);
    } catch (err) {
      state = 'idle';
      msg.textContent = `${err.message} Bitwise and Keystroke still run as practice.`;
      startBtn.textContent = 'Try again';
    } finally {
      startBtn.disabled = false;
    }
  }

  function halt() {
    state = 'over';
    FOCUS.release('compile');
    cancelAnimationFrame(raf);
    arc.style.strokeDashoffset = LEN;
    countEl.textContent = '0';
    catEl.textContent = 'Halted';
    optsEl.replaceChildren();
    startBtn.textContent = 'Run it back';
    overlay.hidden = false;
  }

  function stop(text) {
    halt();
    qEl.textContent = 'Connection lost.';
    msg.textContent = text;
  }

  async function end(final) {
    halt();
    progEl.textContent = `${solved} of ${total} answered`;
    qEl.textContent = lives > 0 ? 'Deck cleared. Every question answered.' : 'Out of lives.';
    msg.textContent = final.place
      ? `${solved} correct for ${final.score} points. That is rank #${final.place}.`
      : `${solved} correct for ${final.score} points. The board holds.`;
    if (!final.place) return;
    const signed = await offer('compile', runId, final);
    if (signed) {
      msg.textContent = signed.place
        ? `${final.score} points — signed ${signed.name}, rank #${signed.place}.`
        : `${final.score} points. Your better score already holds the board.`;
    }
  }

  startBtn.addEventListener('click', start);

  addEventListener('keydown', (e) => {
    if (typing(e) || state !== 'run' || locked || !FOCUS.has('compile')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= optsEl.children.length) { e.preventDefault(); answer(n - 1); }
  });

  paintLives();
  buildRail(total);
  progEl.textContent = `${total} questions`;
}
