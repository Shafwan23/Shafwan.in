/*
 * 03 · KEYSTROKE — raw speed on real code.
 * Focusing the line opens a run on the server, which starts its own clock then,
 * so the time reported at the end can never be shorter than the time that passed.
 */

import { TEXTS, wpmOf } from '../../../api/src/shared/keystroke-texts.js';
import { apiReady, play } from '../api.js';
import { offer } from './board.js';
import { store, tick } from './shared.js';

const BEST_KEY = 'shafwan-keystroke-best';
const IDLE_NOTE = 'Click the line and start typing. The clock starts on your first key.';

export function initKeystroke() {
  const box = document.getElementById('typeText');
  if (!box) return;
  const wpmEl = document.getElementById('typeWpm');
  const accEl = document.getElementById('typeAcc');
  const bestEl = document.getElementById('typeBest');
  const newBtn = document.getElementById('typeNew');
  const note = document.getElementById('typeNote');

  let line = -1, text = '', pos = 0, errors = 0, typed = 0, t0 = 0, done = false, timer = 0;
  /* none -> pending -> ready | practice */
  let run = { state: 'none', id: null };
  let best = Number(store.get(BEST_KEY)) || 0;
  bestEl.textContent = best;

  function load() {
    let next = Math.floor(Math.random() * TEXTS.length);
    if (next === line) next = (next + 1) % TEXTS.length;
    line = next;
    text = TEXTS[line];
    pos = 0; errors = 0; typed = 0; t0 = 0; done = false;
    run = { state: 'none', id: null };
    clearInterval(timer);
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
    note.textContent = IDLE_NOTE;
    render();
  }

  function render() {
    box.replaceChildren(...[...text].map((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      if (i < pos) s.className = 'ok';
      else if (i === pos && !done) s.className = 'cur';
      return s;
    }));
  }

  /* opens a ranked run for this line; without a server it stays practice */
  function openRun() {
    if (run.state !== 'none' || done) return;
    if (!apiReady) { run = { state: 'practice', id: null }; return; }
    const mine = { state: 'pending', id: null };
    run = mine;
    note.textContent = 'Connecting to the score server…';
    play('/runs', { game: 'keystroke', line })
      .then((r) => {
        if (run !== mine) return;
        run = { state: 'ready', id: r.runId };
        note.textContent = IDLE_NOTE;
      })
      .catch((err) => {
        if (run !== mine) return;
        run = { state: 'practice', id: null };
        note.textContent = `Practice mode, not ranked: ${err.message}`;
      });
  }

  function stats() {
    if (!t0) return 0;
    const wpm = wpmOf(pos, performance.now() - t0);
    wpmEl.textContent = wpm;
    accEl.textContent = `${typed ? Math.max(0, Math.round(((typed - errors) / typed) * 100)) : 100}%`;
    return wpm;
  }

  function keepBest(wpm) {
    if (wpm <= best) return;
    best = wpm;
    store.set(BEST_KEY, best);
    tick(bestEl, best);
  }

  async function verify(elapsedMs, localWpm) {
    note.textContent = 'Verifying the run…';
    try {
      const res = await play(`/runs/${run.id}/finish`, { game: 'keystroke', elapsedMs, typed, errors });
      const { score: wpm, place } = res.final;
      wpmEl.textContent = wpm;
      keepBest(wpm);
      note.textContent = place ? `${wpm} WPM — rank #${place} on the board.` : `${wpm} WPM. Press "New line" to go again.`;
      if (!place) return;
      const signed = await offer('keystroke', run.id, res.final);
      if (signed) {
        note.textContent = signed.place
          ? `${wpm} WPM — signed ${signed.name}, rank #${signed.place}.`
          : `${wpm} WPM. Your better score already holds the board.`;
      }
    } catch (err) {
      note.textContent = `${localWpm} WPM, but it could not be verified: ${err.message}`;
    }
  }

  function finish() {
    done = true;
    clearInterval(timer);
    const elapsedMs = Math.round(performance.now() - t0);
    const wpm = stats() || 0;
    render();
    if (run.state === 'ready') { verify(elapsedMs, wpm); return; }
    keepBest(wpm);
    note.textContent = `${wpm} WPM. Practice run, not ranked. Press "New line" to go again.`;
  }

  box.addEventListener('focus', openRun);

  box.addEventListener('keydown', (e) => {
    if (done) return;
    if (run.state === 'pending') {
      if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
      note.textContent = 'One moment, connecting to the score server…';
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (pos > 0) { pos--; render(); }
      return;
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (!t0) {
      t0 = performance.now();
      timer = setInterval(stats, 1000);
      note.textContent = 'Typing…';
    }
    typed++;
    if (e.key === text[pos]) {
      pos++;
      stats();
      if (pos >= text.length) { finish(); return; }
      render();
    } else {
      errors++;
      stats();
      const cur = box.children[pos];
      if (cur) {
        cur.classList.add('bad');
        setTimeout(() => cur.classList.remove('bad'), 220);
      }
    }
  });

  newBtn.addEventListener('click', () => { load(); box.focus(); openRun(); });
  load();
}
