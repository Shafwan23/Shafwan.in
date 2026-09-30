/*
 * 03 · KEYSTROKE — raw speed on real code, in the language you pick.
 * A real (invisible) <input> receives the typing, so phones open their keyboard
 * and desktop keys arrive the same way. Focusing it opens a run on the server,
 * which starts its own clock then, so the time reported at the end can never
 * be shorter than the time that passed.
 */

import { LANGS, LANG_LABEL, LINES, wpmOf } from '../../../api/src/shared/keystroke-texts.js';
import { apiReady, play } from '../api.js';
import { offer } from './board.js';
import { store, tick } from './shared.js';

const BEST_KEY = 'shafwan-keystroke-best';
const LANG_KEY = 'shafwan-keystroke-lang';
const IDLE_NOTE = 'Tap the line and start typing. The clock starts on your first key.';
const PICK_NOTE = 'Pick a language above to get a line.';
const coarse = matchMedia('(pointer: coarse)').matches;

export function initKeystroke() {
  const box = document.getElementById('typeText');
  const input = document.getElementById('typeInput');
  if (!box || !input) return;
  const wpmEl = document.getElementById('typeWpm');
  const accEl = document.getElementById('typeAcc');
  const bestEl = document.getElementById('typeBest');
  const newBtn = document.getElementById('typeNew');
  const note = document.getElementById('typeNote');
  const langBtns = [...document.querySelectorAll('.type-lang')];

  let lang = null, line = -1, text = '', pos = 0, errors = 0, typed = 0, t0 = 0, done = false, timer = 0;
  /* none -> pending -> ready | practice */
  let run = { state: 'none', id: null };
  let best = Number(store.get(BEST_KEY)) || 0;
  bestEl.textContent = best;

  function render() {
    box.replaceChildren(...[...text].map((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      if (i < pos) s.className = 'ok';
      else if (i === pos && !done) s.className = 'cur';
      return s;
    }));
  }

  function load() {
    const lines = LINES[lang];
    let next = Math.floor(Math.random() * lines.length);
    if (next === line && lines.length > 1) next = (next + 1) % lines.length;
    line = next;
    text = lines[line];
    pos = 0; errors = 0; typed = 0; t0 = 0; done = false;
    run = { state: 'none', id: null };
    clearInterval(timer);
    input.value = '';
    input.disabled = false;
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
    note.textContent = IDLE_NOTE;
    box.classList.remove('waiting');
    render();
  }

  function choose(next, { focus = true } = {}) {
    if (!LANGS.includes(next)) return;
    lang = next;
    store.set(LANG_KEY, lang);
    langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    load();
    if (focus) input.focus();   /* inside the tap handler, so phones open the keyboard */
  }

  /* opens a ranked run for this line; without a server it stays practice */
  function openRun() {
    if (!lang || run.state !== 'none' || done) return;
    if (!apiReady) { run = { state: 'practice', id: null }; return; }
    const mine = { state: 'pending', id: null };
    run = mine;
    note.textContent = 'Connecting to the score server…';
    play('/runs', { game: 'keystroke', lang, line })
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

  /* keep the line clear of the phone keyboard once it has opened */
  function keepInView() {
    if (!coarse) return;
    const vv = window.visualViewport;
    const settle = () => box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (vv) {
      const once = () => { vv.removeEventListener('resize', once); settle(); };
      vv.addEventListener('resize', once);
      setTimeout(() => { vv.removeEventListener('resize', once); settle(); }, 700);
    } else {
      setTimeout(settle, 400);
    }
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
      note.textContent = place ? `${wpm} WPM in ${LANG_LABEL[lang]} — rank #${place} on the board.` : `${wpm} WPM. Press "New line" to go again.`;
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
    input.disabled = true;      /* closes the phone keyboard so the record prompt is in view */
    if (run.state === 'ready') { verify(elapsedMs, wpm); return; }
    keepBest(wpm);
    note.textContent = `${wpm} WPM. Practice run, not ranked. Press "New line" to go again.`;
  }

  function startClock() {
    if (t0) return;
    t0 = performance.now();
    timer = setInterval(stats, 1000);
    note.textContent = 'Typing…';
  }

  function wrongKey() {
    errors++;
    stats();
    const cur = box.children[pos];
    if (cur) {
      cur.classList.add('bad');
      setTimeout(() => cur.classList.remove('bad'), 220);
    }
  }

  /*
   * The input's value is always the correctly typed prefix. On every change,
   * anything beyond that prefix is new typing (one key, or a burst from a phone
   * keyboard); anything shorter is a backspace. Wrong keys never stay in the box.
   */
  function sync() {
    if (!lang || done) { input.value = ''; return; }
    if (run.state === 'pending') {
      input.value = text.slice(0, pos);
      note.textContent = 'One moment, connecting to the score server…';
      return;
    }
    const value = input.value;
    const canon = text.slice(0, pos);
    if (value.startsWith(canon)) {
      const fresh = value.slice(pos);
      if (fresh) startClock();
      for (const ch of fresh) {
        typed++;
        if (ch === text[pos]) {
          pos++;
          if (pos >= text.length) { finish(); return; }
        } else {
          wrongKey();
          break;
        }
      }
    } else {
      let keep = 0;
      while (keep < value.length && keep < pos && value[keep] === text[keep]) keep++;
      pos = keep;
    }
    stats();
    render();
    const want = text.slice(0, pos);
    if (input.value !== want) input.value = want;
  }

  input.addEventListener('input', sync);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === 'Tab') return;
    if ((e.ctrlKey || e.metaKey) && /^[avxz]$/i.test(e.key)) e.preventDefault();  /* no pasting a line in */
  });
  input.addEventListener('paste', (e) => e.preventDefault());
  input.addEventListener('focus', () => {
    if (!lang) { note.textContent = PICK_NOTE; return; }
    openRun();
    keepInView();
  });

  /* the visible line is a picture of the input: a tap on it focuses the input */
  box.addEventListener('pointerdown', (e) => { e.preventDefault(); input.focus(); });

  langBtns.forEach((b) => b.addEventListener('click', () => choose(b.dataset.lang)));
  newBtn.addEventListener('click', () => {
    if (!lang) { note.textContent = PICK_NOTE; langBtns[0]?.focus(); return; }
    load();
    input.focus();
  });

  /* the placeholder line, until a language is picked */
  text = 'pick a language to get a line';
  render();
  const remembered = store.get(LANG_KEY);
  if (LANGS.includes(remembered)) choose(remembered, { focus: false });
  else note.textContent = PICK_NOTE;
}
