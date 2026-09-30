/* /404 — the missing reel.
   Shows the path that was asked for, typed out and struck through, and the
   closest scenes on the site: a small fuzzy match against the real routes,
   with synonyms for the words people actually type. */

const ROUTES = [
  ['/', 'Home', 'the front of house', ['home', 'index', 'start']],
  ['/work/', 'Work', 'four case studies', ['projects', 'portfolio', 'cases', 'case', 'project', 'works']],
  ['/work/famysys/', 'Full stack at Famysys', 'case study 01', ['famysys', 'fullstack']],
  ['/work/servicenow/', 'ServiceNow ITSM', 'case study 02', ['servicenow', 'itsm', 'sumz']],
  ['/work/myfundbox/', 'MYFUNDBOX', 'case study 03', ['myfundbox', 'billing']],
  ['/work/sih-2023/', 'SIH 2023', 'case study 04', ['sih', 'hackathon', 'isro']],
  ['/experience/', 'Experience', 'the record', ['resume', 'cv', 'career', 'jobs', 'record', 'xp']],
  ['/about/', 'About', 'the person', ['me', 'bio', 'profile', 'who']],
  ['/lab/', 'Lab', 'three brain games', ['games', 'play', 'game', 'lab']],
  ['/contact/', 'Contact', 'the inbox', ['email', 'hire', 'talk', 'mail', 'reach']],
];
const DEFAULTS = [1, 6, 9]; /* Work, Experience, Contact */

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/* how close is the asked-for path to one route: 1 is a hit, 0 is nothing alike */
function score(query, [href, name, note, words]) {
  const keys = [norm(href), norm(name), norm(note), ...words];
  const tokens = query.split(' ').filter(Boolean);
  let best = 0;
  for (const key of keys) {
    if (!key) continue;
    for (const t of tokens) {
      if (t === key) best = Math.max(best, 1);
      else if (t.length > 2 && (key.includes(t) || t.includes(key))) best = Math.max(best, 0.8);
      else if (t.length >= 4 && key.length >= 4) best = Math.max(best, 1 - lev(t, key) / Math.max(t.length, key.length));
    }
  }
  return best;
}

function suggest(path) {
  const q = norm(path);
  if (!q) return { picks: DEFAULTS.map((i) => ROUTES[i]), matched: false };
  const ranked = ROUTES.map((r) => ({ r, s: score(q, r) })).sort((a, b) => b.s - a.s);
  if (ranked[0].s < 0.6) return { picks: DEFAULTS.map((i) => ROUTES[i]), matched: false };
  return { picks: ranked.slice(0, 3).filter((x) => x.s >= 0.45).map((x) => x.r), matched: true };
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');

/* the ticket: the path, typed */
const ticket = document.getElementById('lostPath');
const asked = decodeURIComponent(location.pathname + location.search).slice(0, 80) || '/';
if (ticket) {
  if (reduced()) ticket.textContent = asked;
  else {
    ticket.textContent = '';
    let i = 0;
    const tick = () => { ticket.textContent = asked.slice(0, ++i); if (i < asked.length) setTimeout(tick, 34); };
    setTimeout(tick, 900);
  }
}

/* the closest scenes */
const list = document.getElementById('lostList');
const hint = document.getElementById('lostHint');
if (list) {
  const { picks, matched } = suggest(location.pathname);
  list.classList.toggle('is-match', matched);
  if (hint) hint.textContent = matched ? 'Closest scenes on the reel' : 'Scenes worth the walk';
  list.replaceChildren(...picks.map(([href, name, note]) => {
    const a = document.createElement('a');
    a.href = href;
    a.innerHTML = `<span class="lost-name"></span><span class="caps"></span>`;
    a.firstChild.textContent = name;
    a.lastChild.textContent = note;
    return a;
  }));
}
