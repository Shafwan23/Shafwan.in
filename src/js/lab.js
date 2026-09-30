/* SHAFWAN® — The Lab. Three technical drills and a record board. Zero libraries. */

/* ═══════════════════════════════════════════════════════════════════════
   THE RECORD BOARD
   Eight slots a game, kept in localStorage. Beat the last slot and the
   machine stops and asks who you are, arcade-style.
   ═══════════════════════════════════════════════════════════════════════ */
const HS = (() => {
  const MAX = 8;
  const NAME_KEY = 'shafwan-hs-name';
  const LABEL = { bitwise: 'Bitwise', compile: 'Compile', keystroke: 'Keystroke' };
  const key = (g) => `shafwan-hs-${g}`;

  const read = (g) => {
    try {
      const v = JSON.parse(localStorage.getItem(key(g)) || '[]');
      if (!Array.isArray(v)) return [];
      return v
        .filter((e) => e && typeof e.score === 'number' && isFinite(e.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX);
    } catch { return []; }
  };
  const write = (g, list) => {
    try { localStorage.setItem(key(g), JSON.stringify(list.slice(0, MAX))); } catch { /* private mode */ }
  };

  /* 1-based rank this score would take, or 0 if it doesn't make the board */
  function rankFor(g, score) {
    if (!(score > 0)) return 0;
    const list = read(g);
    const i = list.findIndex((e) => score > e.score);
    if (i !== -1) return i + 1;
    return list.length < MAX ? list.length + 1 : 0;
  }

  function render(g, freshIdx = -1) {
    const ol = document.querySelector(`[data-hs-list="${g}"]`);
    if (!ol) return;
    const list = read(g);
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
    const reset = document.querySelector(`[data-hs-reset="${g}"]`);
    if (reset) reset.hidden = list.length === 0;
    summary();
  }

  /* the readouts in the terminal header */
  function summary() {
    const games = Object.keys(LABEL);
    let total = 0;
    const firsts = {};
    games.forEach((g) => {
      const l = read(g);
      total += l.length;
      if (l[0]) firsts[l[0].name] = (firsts[l[0].name] || 0) + 1;
    });
    const leader = Object.keys(firsts).sort((a, b) => firsts[b] - firsts[a])[0];
    const a = document.querySelector('[data-hs-held]');
    const b = document.querySelector('[data-hs-top]');
    if (a) a.textContent = String(total).padStart(2, '0');
    if (b) b.textContent = leader || '—';
  }

  /* ---- the prompt ---- */
  const dlg = document.getElementById('hsDialog');
  const form = document.getElementById('hsForm');
  const input = document.getElementById('hsName');

  function commit(g, score, name) {
    const clean = (name || '').replace(/\s+/g, ' ').trim().slice(0, 14) || 'ANONYMOUS';
    try { localStorage.setItem(NAME_KEY, clean); } catch { /* ignore */ }
    const list = read(g);
    list.push({ name: clean, score, at: Date.now() });
    list.sort((a, b) => b.score - a.score || a.at - b.at);
    const trimmed = list.slice(0, MAX);
    write(g, trimmed);
    render(g, trimmed.findIndex((e) => e.score === score && e.name === clean));
    return clean;
  }

  /* offer(game, score) -> Promise<string|null> — resolves with the saved name */
  function offer(g, score) {
    const rank = rankFor(g, score);
    if (!rank) return Promise.resolve(null);

    if (!dlg || typeof dlg.showModal !== 'function') {
      const name = window.prompt(`New high score — rank #${rank} on ${LABEL[g]} with ${score}. Name for the board?`, lastName());
      return Promise.resolve(name === null ? commit(g, score, 'ANONYMOUS') : commit(g, score, name));
    }

    document.getElementById('hsRank').textContent = `#${rank}`;
    document.getElementById('hsGame').textContent = LABEL[g];
    document.getElementById('hsScore').textContent = score;
    input.value = lastName();

    return new Promise((resolve) => {
      let settled = false;
      const done = (name) => {
        if (settled) return;
        settled = true;
        dlg.removeEventListener('close', onClose);
        form.removeEventListener('submit', onSubmit);
        skip.removeEventListener('click', onSkip);
        resolve(commit(g, score, name));
      };
      const onSubmit = (e) => { e.preventDefault(); const v = input.value; dlg.close(); done(v); };
      const onSkip = () => { dlg.close(); done('ANONYMOUS'); };
      /* Escape counts as staying anonymous */
      const onClose = () => done('ANONYMOUS');
      const skip = document.getElementById('hsSkip');
      form.addEventListener('submit', onSubmit);
      skip.addEventListener('click', onSkip);
      dlg.addEventListener('close', onClose);
      dlg.showModal();
      requestAnimationFrame(() => { input.focus(); input.select(); });
    });
  }

  const lastName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };

  /* clear, with a confirming second click */
  document.querySelectorAll('[data-hs-reset]').forEach((btn) => {
    const g = btn.dataset.hsReset;
    let armed = 0;
    btn.addEventListener('click', () => {
      if (Date.now() - armed < 4000) {
        try { localStorage.removeItem(key(g)); } catch { /* ignore */ }
        btn.textContent = 'Clear';
        armed = 0;
        render(g);
        return;
      }
      armed = Date.now();
      btn.textContent = 'Sure?';
      setTimeout(() => { if (btn.textContent === 'Sure?') btn.textContent = 'Clear'; }, 4000);
    });
  });

  Object.keys(LABEL).forEach((g) => render(g));
  return { offer, rankFor, render, best: (g) => (read(g)[0] || {}).score || 0 };
})();

/* a shared little flourish: pulse a HUD number when it changes */
function tick(el, value) {
  if (!el) return;
  el.textContent = value;
  el.classList.add('tick');
  setTimeout(() => el.classList.remove('tick'), 260);
}

const typing = (e) => e.target && e.target.closest('input, textarea, select, [contenteditable], .type-text');

/* only the cabinet you last started answers the number keys */
const FOCUS = {
  who: null,
  claim(g) { this.who = g; },
  release(g) { if (this.who === g) this.who = null; },
  has(g) { return this.who === g; },
};

/* ═══════════════════════════════════════════════════════════════════════
   01 · BITWISE — an eight-bit register you drive by hand
   Decimal, hex, AND, OR, XOR, shifts and one's complement. Sixty seconds.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
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

  const RUN_MS = 60000;
  const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
  let bits = new Array(8).fill(0);
  let state = 'idle', score = 0, streak = 0, answer = 0, t0 = 0, roundT0 = 0, raf = 0, solved = 0;

  /* ---- build the switches ---- */
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
  const hex2 = (v) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');

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
  const rnd = (n) => Math.floor(Math.random() * n);
  const KINDS = ['dec', 'dec', 'dec', 'hex', 'hex', 'and', 'or', 'xor', 'shl', 'shr', 'not'];

  function makeRound() {
    const k = KINDS[rnd(KINDS.length)];
    const a = rnd(256), b = rnd(256);
    switch (k) {
      case 'dec': { const v = 1 + rnd(255); return { task: 'Match the decimal', label: `DEC <em>${v}</em>`, answer: v }; }
      case 'hex': { const v = 1 + rnd(255); return { task: 'Match the hexadecimal', label: `HEX <em>${hex2(v)}</em>`, answer: v }; }
      case 'and': return { task: 'Bitwise AND', label: `${hex2(a)} <em>&amp;</em> ${hex2(b)}`, answer: a & b };
      case 'or': return { task: 'Bitwise OR', label: `${hex2(a)} <em>|</em> ${hex2(b)}`, answer: a | b };
      case 'xor': return { task: 'Bitwise XOR', label: `${hex2(a)} <em>^</em> ${hex2(b)}`, answer: a ^ b };
      case 'shl': { const x = 1 + rnd(63), n = 1 + rnd(2); return { task: 'Shift left, 8 bits wide', label: `${hex2(x)} <em>&lt;&lt;</em> ${n}`, answer: (x << n) & 255 }; }
      case 'shr': { const x = 16 + rnd(240), n = 1 + rnd(3); return { task: 'Shift right', label: `${hex2(x)} <em>&gt;&gt;</em> ${n}`, answer: x >> n }; }
      default: { const x = rnd(256); return { task: 'One’s complement, 8 bits wide', label: `<em>~</em>${hex2(x)}`, answer: (~x) & 255 }; }
    }
  }

  function nextRound() {
    let r, guard = 0;
    do { r = makeRound(); } while (r.answer === value() && ++guard < 40);
    answer = r.answer;
    taskEl.textContent = r.task;
    promptEl.innerHTML = r.label;
    promptEl.classList.remove('swap');
    void promptEl.offsetWidth;
    promptEl.classList.add('swap');
    roundT0 = performance.now();
  }

  const mult = () => Math.min(5, 1 + Math.floor(streak / 2) * 0.5);

  function win() {
    const bonus = Math.max(0, Math.round(150 - (performance.now() - roundT0) / 40));
    streak++;
    solved++;
    score += Math.round((100 + bonus) * mult());
    tick(scoreEl, score);
    streakEl.textContent = '×' + mult();
    live.textContent = `Correct. ${score} points, chain ×${mult()}.`;
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
    if (left <= 0) return end();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    bits = new Array(8).fill(0);
    paint();
    score = 0; streak = 0; solved = 0;
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

  async function end() {
    state = 'over';
    FOCUS.release('bitwise');
    cancelAnimationFrame(raf);
    meter.style.transform = 'scaleX(0)';
    timeEl.textContent = '0';
    taskEl.textContent = 'Register halted';
    const rank = HS.rankFor('bitwise', score);
    msg.textContent = rank
      ? `${solved} solved for ${score} points. That is rank #${rank}.`
      : `${solved} solved for ${score} points. The board is unmoved.`;
    startBtn.textContent = 'Run it back';
    overlay.hidden = false;
    live.textContent = `Time. ${score} points from ${solved} solved.`;
    if (rank) {
      const name = await HS.offer('bitwise', score);
      msg.textContent = `${score} points — signed ${name}, rank #${rank}.`;
    }
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
})();

/* ═══════════════════════════════════════════════════════════════════════
   02 · COMPILE — engineering recall against a twelve second clock
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
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

  /* q: the question (may carry <code>), a: answers, i: the right index */
  const BANK = [
    { c: 'Complexity', q: 'Average time to look a key up in a hash table?', a: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], i: 0 },
    { c: 'Complexity', q: 'Worst-case time complexity of quicksort?', a: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], i: 0 },
    { c: 'Complexity', q: 'Binary search over a sorted array of n items?', a: ['O(log n)', 'O(1)', 'O(n)', 'O(√n)'], i: 0 },
    { c: 'Complexity', q: 'Best possible worst case for a comparison sort?', a: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'], i: 0 },
    { c: 'Complexity', q: 'Reaching the k-th node of a singly linked list costs?', a: ['O(k)', 'O(1)', 'O(log k)', 'O(k log k)'], i: 0 },
    { c: 'Complexity', q: 'Space complexity of a recursive in-order traversal of a balanced BST?', a: ['O(log n)', 'O(1)', 'O(n)', 'O(n log n)'], i: 0 },

    { c: 'HTTP', q: 'Which status code means the resource moved permanently?', a: ['301', '302', '307', '410'], i: 0 },
    { c: 'HTTP', q: 'The client is authenticated but not allowed. Which code?', a: ['403', '401', '400', '409'], i: 0 },
    { c: 'HTTP', q: 'What does <code>429</code> tell the client?', a: ['Too many requests', 'Gateway timeout', 'Payload too large', 'Conflict'], i: 0 },
    { c: 'HTTP', q: 'Which method is idempotent but not safe?', a: ['PUT', 'GET', 'POST', 'CONNECT'], i: 0 },
    { c: 'HTTP', q: 'A <code>304</code> response means…', a: ['Not modified — use your cache', 'Permanently deleted', 'Switching protocols', 'Partial content'], i: 0 },
    { c: 'HTTP', q: 'Which header carries the caching policy for a response?', a: ['Cache-Control', 'Content-Policy', 'Expect', 'Vary-Cache'], i: 0 },

    { c: 'Git', q: 'Which command replays your commits onto a new base?', a: ['git rebase', 'git merge', 'git reflog', 'git stash'], i: 0 },
    { c: 'Git', q: 'Undo the last commit but keep every change staged?', a: ['git reset --soft HEAD~1', 'git reset --hard HEAD~1', 'git revert HEAD', 'git checkout HEAD~1'], i: 0 },
    { c: 'Git', q: 'Which command makes a new commit that undoes an old one?', a: ['git revert', 'git reset', 'git restore', 'git clean'], i: 0 },
    { c: 'Git', q: 'What does <code>git cherry-pick</code> do?', a: ['Applies one commit onto the current branch', 'Deletes a branch safely', 'Squashes a branch into one commit', 'Rewrites author metadata'], i: 0 },
    { c: 'Git', q: 'Where does git record where HEAD has been?', a: ['The reflog', 'The index', 'The stash', 'The packfile'], i: 0 },

    { c: 'CSS', q: 'Specificity of <code>#nav .item a</code> as (id, class, type)?', a: ['1, 1, 1', '1, 0, 2', '0, 2, 1', '1, 2, 0'], i: 0 },
    { c: 'CSS', q: 'Which unit is relative to the root font size?', a: ['rem', 'em', 'ex', 'vh'], i: 0 },
    { c: 'CSS', q: '<code>z-index</code> applies to which elements?', a: ['Positioned elements, and flex or grid items', 'Every element', 'Only absolutely positioned ones', 'Only elements with opacity below 1'], i: 0 },
    { c: 'CSS', q: 'Which property creates a new stacking context on its own?', a: ['opacity below 1', 'overflow: hidden', 'display: block', 'float: left'], i: 0 },
    { c: 'CSS', q: 'Which two properties can the compositor animate without layout or paint?', a: ['transform and opacity', 'width and height', 'top and left', 'margin and padding'], i: 0 },

    { c: 'JavaScript', q: 'What does <code>typeof null</code> return?', a: ["'object'", "'null'", "'undefined'", "'number'"], i: 0 },
    { c: 'JavaScript', q: '<code>0.1 + 0.2 === 0.3</code> evaluates to…', a: ['false', 'true', 'NaN', 'It throws'], i: 0 },
    { c: 'JavaScript', q: 'Which of these does <em>not</em> return a new array?', a: ['forEach', 'map', 'filter', 'slice'], i: 0 },
    { c: 'JavaScript', q: '<code>Promise.allSettled</code> resolves with…', a: ['An array of status objects, always', 'The first result to settle', 'Only the fulfilled values', 'A rejection on the first failure'], i: 0 },
    { c: 'JavaScript', q: 'A <code>let</code> binding is scoped to…', a: ['The enclosing block', 'The enclosing function', 'The module', 'The global object'], i: 0 },
    { c: 'JavaScript', q: 'Which runs first after the current task: a promise callback or a <code>setTimeout(…, 0)</code>?', a: ['The promise callback', 'The timeout', 'Whichever was queued first', 'They run in parallel'], i: 0 },
    { c: 'JavaScript', q: '<code>[] == false</code> evaluates to…', a: ['true', 'false', 'undefined', 'It throws'], i: 0 },

    { c: 'SQL', q: 'Which join keeps every row of the left table?', a: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN', 'RIGHT JOIN'], i: 0 },
    { c: 'SQL', q: 'Which clause filters rows <em>after</em> aggregation?', a: ['HAVING', 'WHERE', 'FILTER', 'QUALIFY'], i: 0 },
    { c: 'SQL', q: 'An index mainly trades away…', a: ['Write speed and storage', 'Read speed', 'Transaction safety', 'Referential integrity'], i: 0 },
    { c: 'SQL', q: 'What does the "I" in ACID stand for?', a: ['Isolation', 'Integrity', 'Idempotence', 'Indexing'], i: 0 },

    { c: 'The wire', q: 'Which port does HTTPS use by default?', a: ['443', '80', '8080', '22'], i: 0 },
    { c: 'The wire', q: 'DNS queries travel over which transport by default?', a: ['UDP', 'TCP', 'ICMP', 'QUIC'], i: 0 },
    { c: 'The wire', q: 'TCP guarantees…', a: ['Ordered, reliable delivery', 'Low latency', 'Encryption', 'Multicast'], i: 0 },
    { c: 'The wire', q: 'HTTP/3 runs on top of…', a: ['QUIC over UDP', 'TCP with TLS 1.3', 'SCTP', 'WebSockets'], i: 0 },

    { c: 'Regex', q: 'What does <code>\\b</code> match?', a: ['A zero-width word boundary', 'A literal backspace', 'Any blank character', 'The start of a line'], i: 0 },
    { c: 'Regex', q: 'Which quantifier is lazy?', a: ['*?', '*', '+', '{2,}'], i: 0 },

    { c: 'Security', q: 'Prepared statements primarily prevent…', a: ['SQL injection', 'Cross-site scripting', 'CSRF', 'Clickjacking'], i: 0 },
    { c: 'Security', q: '<code>HttpOnly</code> on a cookie stops…', a: ['JavaScript from reading it', 'It being sent cross-site', 'It being stored on disk', 'It being sent over HTTP'], i: 0 },
    { c: 'Security', q: 'Which is the right way to store user passwords?', a: ['A slow salted hash like bcrypt or argon2', 'SHA-256', 'AES encryption', 'Base64'], i: 0 },

    { c: 'Systems', q: '<code>1 << 10</code> equals…', a: ['1024', '512', '2048', '110'], i: 0 },
    { c: 'Systems', q: 'A UTF-8 code point takes at most how many bytes?', a: ['4', '2', '3', '6'], i: 0 },
    { c: 'Systems', q: '<code>chmod 755</code> gives the owner…', a: ['Read, write and execute', 'Read and write', 'Read and execute', 'Everything but execute'], i: 0 },
    { c: 'Systems', q: 'A race condition needs at least…', a: ['Two threads touching shared state, one writing', 'Two processes on one core', 'A lock held too long', 'An unhandled interrupt'], i: 0 },
    { c: 'Systems', q: 'Which structure gives first-in, first-out order?', a: ['Queue', 'Stack', 'Heap', 'Trie'], i: 0 },
    { c: 'Systems', q: 'The root of a binary heap always holds…', a: ['The minimum or maximum of the set', 'The median', 'The most recently added item', 'The deepest leaf'], i: 0 },
  ];

  const PER_Q = 12000;
  const LEN = 119.4; /* 2πr, r = 19 */
  let deck = [], idx = 0, score = 0, streak = 0, solved = 0, lives = 3;
  let state = 'idle', qT0 = 0, raf = 0, locked = false, current = null;

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const mult = () => Math.min(4, 1 + Math.floor(streak / 3) * 0.5);

  function buildRail(n) {
    railEl.replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
  }

  function markRail(i, ok) {
    const t = railEl.children[i];
    if (t) { t.classList.remove('now'); t.classList.add(ok ? 'ok' : 'no'); }
    const next = railEl.children[i + 1];
    if (next) next.classList.add('now');
  }

  function paintLives() {
    [...livesEl.querySelectorAll('i')].forEach((el, i) => el.classList.toggle('out', i >= lives));
    livesEl.querySelector('.sr-only').textContent = `Lives left: ${lives}`;
  }

  function ask() {
    const item = deck[idx];
    if (!item || lives <= 0) return end();
    const order = shuffle(item.a.map((text, i) => ({ text, ok: i === item.i })));
    current = { item, order };
    locked = false;

    catEl.textContent = `${item.c} — ${String(idx + 1).padStart(2, '0')} of ${String(deck.length).padStart(2, '0')}`;
    progEl.textContent = `question ${idx + 1} of ${deck.length}`;
    if (railEl.children[idx]) railEl.children[idx].classList.add('now');
    qEl.innerHTML = item.q;
    qEl.classList.remove('swap');
    void qEl.offsetWidth;
    qEl.classList.add('swap');

    optsEl.replaceChildren(...order.map((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cp-opt';
      b.innerHTML = `<span class="cp-key" aria-hidden="true">${i + 1}</span><span class="cp-text"></span>`;
      b.querySelector('.cp-text').textContent = o.text;
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
    if (left <= 0) return answer(-1);
    raf = requestAnimationFrame(clock);
  }

  function answer(i) {
    if (locked || state !== 'run') return;
    locked = true;
    cancelAnimationFrame(raf);
    const btns = [...optsEl.children];
    const rightIdx = current.order.findIndex((o) => o.ok);
    const right = i === rightIdx;

    btns.forEach((b, n) => {
      b.disabled = true;
      if (n === rightIdx) b.classList.add('right');
      else if (n === i) b.classList.add('wrong');
    });

    if (right) {
      const left = Math.max(0, PER_Q - (performance.now() - qT0));
      streak++;
      solved++;
      score += Math.round((100 + Math.round((left / PER_Q) * 120)) * mult());
      tick(scoreEl, score);
      streakEl.textContent = '×' + mult();
      solvedEl.textContent = solved;
      live.textContent = `Correct. ${score} points.`;
      noteEl.textContent = 'Correct.';
    } else {
      streak = 0;
      lives--;
      streakEl.textContent = '×1';
      paintLives();
      const answerText = current.order[rightIdx].text;
      noteEl.textContent = i === -1 ? `Out of time — it was ${answerText}.` : `No — it was ${answerText}.`;
      live.textContent = noteEl.textContent;
    }

    markRail(idx, right);
    idx++;
    setTimeout(() => {
      if (state !== 'run') return;
      if (lives <= 0 || idx >= deck.length) end();
      else ask();
    }, right ? 700 : 1500);
  }

  function start() {
    deck = shuffle(BANK);
    buildRail(deck.length);
    idx = 0; score = 0; streak = 0; solved = 0; lives = 3;
    scoreEl.textContent = '0';
    streakEl.textContent = '×1';
    solvedEl.textContent = '0';
    paintLives();
    state = 'run';
    FOCUS.claim('compile');
    overlay.hidden = true;
    noteEl.textContent = 'Keys 1–4 answer. The clock is worth points.';
    ask();
  }

  async function end() {
    state = 'over';
    FOCUS.release('compile');
    cancelAnimationFrame(raf);
    arc.style.strokeDashoffset = LEN;
    countEl.textContent = '0';
    catEl.textContent = 'Halted';
    progEl.textContent = `${solved} of ${deck.length} answered`;
    optsEl.replaceChildren();
    qEl.textContent = lives > 0 ? 'Deck cleared. Every question answered.' : 'Out of lives.';
    const rank = HS.rankFor('compile', score);
    msg.textContent = rank
      ? `${solved} correct for ${score} points. That is rank #${rank}.`
      : `${solved} correct for ${score} points. The board holds.`;
    startBtn.textContent = 'Run it back';
    overlay.hidden = false;
    if (rank) {
      const name = await HS.offer('compile', score);
      msg.textContent = `${score} points — signed ${name}, rank #${rank}.`;
    }
  }

  startBtn.addEventListener('click', start);

  addEventListener('keydown', (e) => {
    if (typing(e) || state !== 'run' || locked || !FOCUS.has('compile')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= optsEl.children.length) { e.preventDefault(); answer(n - 1); }
  });

  /* rAF stops while hidden, so credit the time back instead of timing out */
  let hidAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (state !== 'run') return;
    if (document.hidden) { hidAt = performance.now(); cancelAnimationFrame(raf); }
    else if (hidAt) { qT0 += performance.now() - hidAt; hidAt = 0; if (!locked) raf = requestAnimationFrame(clock); }
  });

  paintLives();
  buildRail(BANK.length);
  progEl.textContent = `${BANK.length} questions`;
})();

/* ═══════════════════════════════════════════════════════════════════════
   03 · KEYSTROKE — raw speed on real code
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  const box = document.getElementById('typeText');
  if (!box) return;
  const wpmEl = document.getElementById('typeWpm');
  const accEl = document.getElementById('typeAcc');
  const bestEl = document.getElementById('typeBest');
  const newBtn = document.getElementById('typeNew');
  const note = document.getElementById('typeNote');
  const BEST_KEY = 'shafwan-keystroke-best';

  const TEXTS = [
    "const portfolio = { design: 'premium', code: 'clean', experience: 'immersive' };",
    "function createAwesome(idea) { return idea.map(x => x.enhance()).filter(x => x.isWow()); }",
    "import { creativity, passion, coffee } from 'developer-essentials';",
    "async function buildTheFuture() { await learn(); await create(); return impact; }",
    "const skills = [...frontend, ...backend, ...devops].sort((a, b) => b.passion - a.passion);",
    "for (let i = 0; i < bits.length; i++) value |= bits[i] << (7 - i);",
    "SELECT name, count(*) FROM records GROUP BY name HAVING count(*) > 1 ORDER BY 2 DESC;",
  ];

  let text, pos, errors, typed, t0, done, timer;
  let best = +(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = best;

  function load(next = true) {
    if (next) text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    pos = 0; errors = 0; typed = 0; t0 = 0; done = false;
    clearInterval(timer);
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
    note.textContent = 'Click the line and start typing. The clock starts on your first key.';
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

  function stats() {
    if (!t0) return 0;
    const mins = (performance.now() - t0) / 60000;
    const wpm = mins > 0 ? Math.round((pos / 5) / mins) : 0;
    wpmEl.textContent = wpm;
    accEl.textContent = `${typed ? Math.max(0, Math.round(((typed - errors) / typed) * 100)) : 100}%`;
    return wpm;
  }

  async function finish() {
    done = true;
    clearInterval(timer);
    const wpm = stats() || 0;
    if (wpm > best) {
      best = wpm;
      localStorage.setItem(BEST_KEY, best);
      tick(bestEl, best);
    }
    render();
    const rank = HS.rankFor('keystroke', wpm);
    note.textContent = rank
      ? `${wpm} WPM — rank #${rank} on the board.`
      : `${wpm} WPM. Press "New line" to go again.`;
    if (rank) {
      const name = await HS.offer('keystroke', wpm);
      note.textContent = `${wpm} WPM — signed ${name}, rank #${rank}.`;
    }
  }

  box.addEventListener('keydown', (e) => {
    if (done) return;
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

  newBtn.addEventListener('click', () => { load(true); box.focus(); });
  load(true);
})();
