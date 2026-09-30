/*
 * TWO NAMES GET A WORD OF THEIR OWN before the board.
 * One is not allowed to stay on this site: it is refused every time, with a
 * modal, and the visitor picks another (the server refuses it too, in
 * api/src/names.js, so the modal is courtesy, not the lock). The other is the
 * owner's: a wink, then the run signs as usual.
 */

const RESERVED = 'sabeeha';
const OWNER = 'shafwan';

/* letters only, accents stripped, lower case: "Sa-bee.ha" -> "sabeeha" */
const lettersOf = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
/* every run of a letter shrinks to one, so stretched or thinned vowels read the same: "sabeeeha", "sabeha" -> "sabeha" */
const collapse = (s) => s.replace(/(.)\1+/g, '$1');
const words = (s) => s.split(/[\s.'’-]+/).map(lettersOf).filter(Boolean);
const same = (a, b) => collapse(a) === collapse(b);

/**
 * @param {unknown} raw what was typed
 * @returns {'reserved' | 'owner' | null}
 */
export function specialName(raw) {
  if (typeof raw !== 'string') return null;
  const whole = lettersOf(raw);
  if (!whole) return null;
  const parts = words(raw);
  if (same(whole, RESERVED) || parts.some((w) => same(w, RESERVED))) return 'reserved';
  if (same(whole, OWNER) || parts.some((w) => same(w, OWNER))) return 'owner';
  return null;
}

const COPY = {
  reserved: {
    kicker: 'Hold on',
    title: ['Not ', 'that name'],
    line: 'The name you entered is not allowed to stay on this website. Please choose another name for the board.',
    button: 'Choose another name',
  },
  owner: {
    kicker: 'Look who it is',
    title: ['Hey, ', 'leader'],
    line: 'Playing your own games, Shafwan? Good try. The board knows who built it, but a record is a record: go on and sign it.',
    button: 'Sign the board',
  },
};

/**
 * Shows the word for a special name on top of the board prompt and resolves
 * once it is dismissed (button or Escape). Without <dialog> support it
 * resolves at once and the board prompt carries on.
 * @param {'reserved' | 'owner'} kind
 */
export function tellSpecial(kind) {
  const dlg = document.getElementById('nameDialog');
  const copy = COPY[kind];
  if (!dlg || !copy || typeof dlg.showModal !== 'function') return Promise.resolve();
  document.getElementById('nameKicker').textContent = copy.kicker;
  const em = document.createElement('em');
  em.textContent = copy.title[1];
  document.getElementById('nameDialogTitle').replaceChildren(copy.title[0], em);
  document.getElementById('nameLine').textContent = copy.line;
  const ok = document.getElementById('nameOk');
  ok.textContent = copy.button;
  dlg.dataset.kind = kind;
  return new Promise((resolve) => {
    const done = () => {
      ok.onclick = null;
      dlg.removeEventListener('cancel', done);
      dlg.removeEventListener('close', done);
      if (dlg.open) dlg.close();
      resolve();
    };
    ok.onclick = done;
    dlg.addEventListener('cancel', done);
    dlg.addEventListener('close', done);
    dlg.showModal();
    requestAnimationFrame(() => ok.focus());
  });
}
