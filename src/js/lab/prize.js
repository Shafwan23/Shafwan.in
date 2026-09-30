/*
 * THE PRIZE — for whoever takes the top of a board.
 * A sealed envelope. Tap it: the seal cracks, gold flecks burst, and a note
 * rises with a few words chosen at random. All on the page, no libraries.
 */

const LINES = [
  'Records are only ever borrowed. This one is yours until someone braver comes along.',
  'Somewhere between the first tap and the last, you stopped playing and started proving it.',
  'Everyone else on this board is now chasing you. Enjoy the view from the first line.',
  'Speed is easy to admire and hard to keep. You kept it, all the way to the top.',
  'The machine kept the time, the server checked the sums, and both agree: nobody has done better.',
  'A record is a small monument. Yours went up today, on a page you found by chance.',
  'Most visitors read this page. You rewrote a line of it.',
  'Fast, sure, and unbothered. That is what the top of a board looks like.',
  'Whatever you were doing before this, you were clearly underusing your hands.',
  'The board remembers. So will I, the next time someone tells me the Lab is easy.',
];

const KICKERS = ['Sealed for the record holder', 'Not everyone gets one of these', 'Opened once, kept forever'];
const FLECK_COUNT = 56;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');

function flecks(host) {
  if (reduced()) return;
  const frag = document.createDocumentFragment();
  const colours = ['#C9A96A', '#E3C489', '#EDE8DF', '#F5D547'];
  for (let i = 0; i < FLECK_COUNT; i++) {
    const s = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 220;
    s.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--y', `${Math.sin(angle) * dist - 80}px`);
    s.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
    s.style.setProperty('--d', `${Math.round(Math.random() * 180)}ms`);
    s.style.setProperty('--s', `${4 + Math.round(Math.random() * 6)}px`);
    s.style.setProperty('--c', colours[i % colours.length]);
    frag.append(s);
  }
  host.replaceChildren(frag);
}

/**
 * Shows the prize for a new #1 and resolves when it is put away.
 * @param {{ game: string, score: number, unit: string, name: string | null }} record
 */
export function offerPrize(record) {
  const dlg = document.getElementById('prizeDialog');
  if (!dlg || typeof dlg.showModal !== 'function') return Promise.resolve();

  const seal = document.getElementById('prizeSeal');
  const open = document.getElementById('prizeOpen');
  const done = document.getElementById('prizeDone');
  const line = document.getElementById('prizeLine');
  const who = document.getElementById('prizeWho');
  const kicker = document.getElementById('prizeKicker');
  const fleckHost = document.getElementById('prizeFlecks');

  dlg.classList.remove('is-open');
  kicker.textContent = pick(KICKERS);
  line.textContent = pick(LINES);
  who.textContent = `${record.name || 'Anonymous'} · #1 on ${record.game} with ${record.score} ${record.unit}`;
  seal.textContent = new Date().getFullYear();
  fleckHost.replaceChildren();

  return new Promise((resolve) => {
    const finish = () => {
      open.onclick = done.onclick = null;
      dlg.removeEventListener('cancel', onCancel);
      if (dlg.open) dlg.close();
      resolve();
    };
    const onCancel = (e) => { e.preventDefault(); finish(); };
    open.onclick = () => {
      if (dlg.classList.contains('is-open')) return;
      dlg.classList.add('is-open');
      flecks(fleckHost);
      open.setAttribute('aria-expanded', 'true');
      setTimeout(() => done.focus(), reduced() ? 50 : 1400);
    };
    done.onclick = finish;
    dlg.addEventListener('cancel', onCancel);
    dlg.showModal();
    requestAnimationFrame(() => open.focus());
  });
}
