/*
 * THE RECORD BOARD — one global board per game, kept by the score server.
 * Only runs the server scored itself can be signed; names are checked there too.
 */

import { apiReady, getBoards, play } from '../api.js';
import { store } from './shared.js';

const MAX = 8;
const NAME_KEY = 'shafwan-hs-name';
const LABEL = { bitwise: 'Bitwise', compile: 'Compile', keystroke: 'Keystroke' };
const GAMES = Object.keys(LABEL);
const boards = { bitwise: [], compile: [], keystroke: [] };

function render(g, freshIdx = -1) {
  const ol = document.querySelector(`[data-hs-list="${g}"]`);
  if (!ol) return;
  const list = boards[g];
  const rows = [];
  for (let i = 0; i < MAX; i++) {
    const e = list[i];
    const li = document.createElement('li');
    li.className = 'hs-row' + (e ? (i === 0 ? ' top' : '') : ' empty') + (i === freshIdx ? ' fresh' : '');
    const r = document.createElement('span');
    r.className = 'hs-rank';
    r.textContent = i + 1;
    const n = document.createElement('span');
    n.className = 'hs-name';
    n.textContent = e ? e.name : '— — —';
    const sc = document.createElement('span');
    sc.className = 'hs-score';
    sc.textContent = e ? e.score : '—';
    li.append(r, n, sc);
    rows.push(li);
  }
  ol.replaceChildren(...rows);
  summary();
}

/* the readouts in the terminal header */
function summary() {
  let total = 0;
  const firsts = {};
  GAMES.forEach((g) => {
    const l = boards[g];
    total += l.length;
    if (l[0]) firsts[l[0].name] = (firsts[l[0].name] || 0) + 1;
  });
  const leader = Object.keys(firsts).sort((a, b) => firsts[b] - firsts[a])[0];
  const a = document.querySelector('[data-hs-held]');
  const b = document.querySelector('[data-hs-top]');
  if (a) a.textContent = String(total).padStart(2, '0');
  if (b) b.textContent = leader || '—';
}

const setNotes = (text) => document.querySelectorAll('[data-hs-note]').forEach((el) => { el.textContent = text; });

/** Loads the three boards from the server. */
export async function refreshBoards() {
  GAMES.forEach((g) => render(g));
  if (!apiReady) {
    setNotes('Offline · practice only');
    return;
  }
  setNotes('Loading the board…');
  try {
    const data = await getBoards();
    GAMES.forEach((g) => { boards[g] = Array.isArray(data?.[g]) ? data[g].slice(0, MAX) : []; });
    GAMES.forEach((g) => render(g));
    setNotes('Global · server-verified');
  } catch {
    setNotes('Board offline · try later');
  }
}

/* ---- the prompt ---- */

const dlg = document.getElementById('hsDialog');
const form = document.getElementById('hsForm');
const input = document.getElementById('hsName');
const errorEl = document.getElementById('hsError');
const saveBtn = document.getElementById('hsSave');
const skipBtn = document.getElementById('hsSkip');

function showError(text) {
  if (!errorEl) return;
  errorEl.textContent = text;
  errorEl.hidden = !text;
  input?.setAttribute('aria-invalid', text ? 'true' : 'false');
}

function setBusy(busy) {
  [saveBtn, skipBtn, input].forEach((el) => { if (el) el.disabled = busy; });
  if (saveBtn) saveBtn.textContent = busy ? 'Saving…' : 'Put me on the board';
}

/**
 * Offers a scored run a place on the board.
 * @param {string} g game
 * @param {string} runId the server's run
 * @param {{ score: number, place: number }} final the server's verdict
 * @returns {Promise<{ name: string, place: number } | null>} null if the visitor skipped
 */
export function offer(g, runId, final) {
  if (!final?.place || !dlg || typeof dlg.showModal !== 'function') return Promise.resolve(null);

  document.getElementById('hsRank').textContent = `#${final.place}`;
  document.getElementById('hsGame').textContent = LABEL[g];
  document.getElementById('hsScore').textContent = final.score;
  input.value = store.get(NAME_KEY) || '';
  showError('');
  setBusy(false);

  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      form.removeEventListener('submit', onSubmit);
      skipBtn.removeEventListener('click', onSkip);
      dlg.removeEventListener('cancel', onCancel);
      if (dlg.open) dlg.close();
      resolve(result);
    };
    const claimAs = async (name) => {
      setBusy(true);
      showError('');
      try {
        const res = await play(`/runs/${runId}/claim`, { name });
        boards[g] = res.board.slice(0, MAX);
        render(g, res.place - 1);
        if (name) store.set(NAME_KEY, res.name);
        done({ name: res.name, place: res.place });
      } catch (err) {
        setBusy(false);
        showError(err.message || 'That did not save. Try again.');
        input.focus();
      }
    };
    const onSubmit = (e) => { e.preventDefault(); claimAs(input.value); };
    const onSkip = () => claimAs(null);
    /* Escape leaves without signing */
    const onCancel = () => done(null);

    form.addEventListener('submit', onSubmit);
    skipBtn.addEventListener('click', onSkip);
    dlg.addEventListener('cancel', onCancel);
    dlg.showModal();
    requestAnimationFrame(() => { input.focus(); input.select(); });
  });
}
