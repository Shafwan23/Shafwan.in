/* SHAFWAN® — shared runtime. Progressive enhancement only. */

document.documentElement.classList.add('js');

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Site-level motion switch (WCAG 2.2.2 pause mechanism) ---------- */
const MOTION_KEY = 'shafwan-motion';
/* storage can throw (blocked site data, some private modes); motion then just stays on */
const readMotion = () => { try { return localStorage.getItem(MOTION_KEY); } catch { return null; } };
const writeMotion = (value) => {
  try { if (value === null) localStorage.removeItem(MOTION_KEY); else localStorage.setItem(MOTION_KEY, value); } catch { /* not persisted */ }
};
const motionUserOff = () => readMotion() === 'off';
if (motionUserOff()) document.documentElement.classList.add('motion-off');

document.querySelectorAll('[data-foot-settings]').forEach((slot) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'motion-toggle';
  btn.setAttribute('aria-pressed', String(motionUserOff()));
  btn.textContent = motionUserOff() ? 'Motion: off' : 'Motion: on';
  btn.addEventListener('click', () => {
    if (motionUserOff()) {
      writeMotion(null);
      location.reload(); /* clean reboot of the effect engines */
    } else {
      writeMotion('off');
      document.documentElement.classList.add('motion-off');
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = 'Motion: off';
      dispatchEvent(new Event('shafwan:motion-off')); /* engines tear down live */
    }
  });
  slot.appendChild(btn);
});

/* ---------- Split headlines into words/chars ---------- */
document.querySelectorAll('[data-split]').forEach((el) => {
  let ci = 0;
  const split = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          for (const chr of word) {
            const c = document.createElement('span');
            c.className = 'ch';
            c.style.setProperty('--ci', ci++);
            c.dataset.c = chr; /* lets CSS redraw the glyph in halves (hero rebuild) */
            c.textContent = chr;
            w.appendChild(c);
          }
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) split(child);
    });
  };
  split(el);
});

/* ---------- Illuminated statement: one indexed span per word ----------
   The lighting itself is CSS (scroll-driven `animation-timeline: view()`);
   this only supplies the words and their running index. */
document.querySelectorAll('[data-illuminate]').forEach((el) => {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'wd';
          w.style.setProperty('--i', i++);
          w.textContent = word;
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
});

/* ---------- Reveal on view ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('[data-reveal], [data-split], [data-rule], [data-reveal-group], [data-sweep], [data-mask]')
  .forEach((el) => io.observe(el));

/* ---------- Header: shrink + hide on scroll down ---------- */
const head = document.querySelector('.site-head');
let ticking = false;
const dressHead = () => head.classList.toggle('is-scrolled', scrollY > 24);
dressHead();
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { dressHead(); ticking = false; });
}, { passive: true });

/* ---------- Nav: a champagne pill that slides between items ---------- */
const nav = document.querySelector('.site-nav');
if (nav) {
  const links = [...nav.querySelectorAll('a')];
  const current = nav.querySelector('a[aria-current="page"]');
  const park = (el) => {
    if (!el) { nav.classList.remove('has-pill'); return; }
    nav.style.setProperty('--nx', `${el.offsetLeft}px`);
    nav.style.setProperty('--nw', `${el.offsetWidth}px`);
    nav.classList.add('has-pill');
  };
  const settle = () => park(current);
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => park(a));
    a.addEventListener('focus', () => park(a));
  });
  nav.addEventListener('pointerleave', settle);
  nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) settle(); });
  addEventListener('resize', settle, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(settle); else settle();
  settle();
}

/* ---------- The menu ---------- */
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('siteMenu');
if (menuBtn && menu) {
  let open = false;
  const setMenu = (next) => {
    if (next === open) return;
    open = next;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      const done = () => { if (!open) menu.hidden = true; menu.removeEventListener('transitionend', done); };
      menu.addEventListener('transitionend', done);
      setTimeout(done, 600); /* authoritative, in case the transition never fires */
      menuBtn.focus({ preventScroll: true });
    }
  };
  menuBtn.addEventListener('click', () => setMenu(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

/* ---------- The studio clock (the developer's own wall) ---------- */
const clocks = document.querySelectorAll('[data-clock]');
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const tick = () => {
    const t = fmt.format(new Date());
    clocks.forEach((el) => { el.textContent = t; });
  };
  tick();
  setInterval(tick, 20000);
}

/* ---------- Custom cursor ---------- */
if (fine && !rmq.matches && !motionUserOff()) {
  document.documentElement.classList.add('has-cursor');
  const dot = document.createElement('div');
  dot.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  const label = document.createElement('span');
  ring.appendChild(label);
  document.body.append(dot, ring);

  let rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry;
  let raf = null;
  const loop = () => {
    rx += (tx - rx) * 0.16;
    ry += (ty - ry) * 0.16;
    ring.style.transform = `translate(${rx - 0.5}px, ${ry - 0.5}px) translate(-50%,-50%)`;
    raf = (Math.abs(tx - rx) > 0.2 || Math.abs(ty - ry) > 0.2) ? requestAnimationFrame(loop) : null;
  };
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  addEventListener('pointerdown', () => ring.classList.add('is-press'));
  addEventListener('pointerup', () => ring.classList.remove('is-press'));

  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      label.textContent = el.dataset.cursor;
      ring.classList.add('is-label');
    });
    el.addEventListener('pointerleave', () => ring.classList.remove('is-label'));
  });
}

/* ---------- Dialogs hide the custom cursor (they sit in the top layer above it) ---------- */
{
  const sync = () => document.documentElement.classList.toggle('dialog-open', !!document.querySelector('dialog[open]'));
  const watch = new MutationObserver(sync);
  document.querySelectorAll('dialog').forEach((d) => watch.observe(d, { attributes: true, attributeFilter: ['open'] }));
  sync();
}

/* ---------- Magnetic elements ---------- */
if (fine && !rmq.matches && !motionUserOff()) {
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    const strength = 0.28;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.19,1,0.22,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
}

/* ---------- Pointer light (doorways) ----------
   One rAF-coalesced write of two custom properties; the gradient is CSS. */
if (fine && !rmq.matches && !motionUserOff()) {
  document.querySelectorAll('[data-spot]').forEach((el) => {
    let raf = null, x = 50, y = 50;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        el.style.setProperty('--px', x + '%');
        el.style.setProperty('--py', y + '%');
      });
    }, { passive: true });
  });
}

/* ---------- Magnetic words (the statement) ----------
   Words lean toward the cursor and take on a champagne glow. Rects are
   cached and offset by scroll delta, so a move costs no layout reads. */
if (fine && !rmq.matches && !motionUserOff()) {
  document.querySelectorAll('[data-word-magnet]').forEach((host) => {
    const words = [...host.querySelectorAll('.wd')];
    if (!words.length) return;

    const R = 190;              /* radius of influence, px */
    let pts = [], baseY = 0, live = false, raf = null, px = -9999, py = -9999;

    const measure = () => {
      baseY = scrollY;
      pts = words.map((w) => {
        const r = w.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    const apply = () => {
      raf = null;
      if (!pts.length) return;
      const dy = scrollY - baseY;
      for (let i = 0; i < words.length; i++) {
        const ax = px - pts[i].x;
        const ay = py - (pts[i].y - dy);
        const d = Math.hypot(ax, ay);
        const f = d < R ? 1 - d / R : 0;
        const w = words[i];
        if (!f) {
          if (w.style.transform) { w.style.transform = ''; w.style.textShadow = ''; }
          continue;
        }
        const e = f * f; /* ease the falloff so only the nearest few really move */
        w.style.transform = `translate(${ax * e * 0.10}px, ${ay * e * 0.10}px) scale(${1 + e * 0.045})`;
        w.style.textShadow = `0 0 ${30 * e}px rgba(201, 169, 106, ${0.65 * e})`;
      }
    };

    new IntersectionObserver((es) => {
      live = es[es.length - 1].isIntersecting;
      if (live) measure();
    }, { rootMargin: '20% 0px' }).observe(host);

    addEventListener('resize', () => { if (live) measure(); }, { passive: true });
    addEventListener('pointermove', (e) => {
      if (!live) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    addEventListener('scroll', () => {
      if (live && !raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  });
}

/* ---------- Odometer numerals ----------
   Each digit becomes a strip of 0–9 twice over; revealing the cell rolls the
   strip a full turn plus the target digit, staggered left to right. The
   readable value is a sibling .sr-only span, so this stays decoration. */
const odos = document.querySelectorAll('.odo[data-odo]');
if (odos.length) {
  odos.forEach((el) => {
    const frag = document.createDocumentFragment();
    let digit = 0;
    for (const chr of el.dataset.odo) {
      if (!/[0-9]/.test(chr)) {
        const lit = document.createElement('span');
        lit.className = 'odo-s';
        lit.textContent = chr;
        frag.appendChild(lit);
        continue;
      }
      const cell = document.createElement('span');
      cell.className = 'odo-d';
      const strip = document.createElement('span');
      strip.className = 'odo-strip';
      strip.style.setProperty('--i', digit++);
      strip.style.setProperty('--to', 10 + Number(chr));
      for (let turn = 0; turn < 2; turn++) {
        for (let n = 0; n <= 9; n++) {
          const row = document.createElement('span');
          row.textContent = n;
          strip.appendChild(row);
        }
      }
      cell.appendChild(strip);
      frag.appendChild(cell);
    }
    el.replaceChildren(frag);
  });

  const oio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      oio.unobserve(e.target);
      e.target.classList.add('in');
    }
  }, { threshold: 0.4 });
  odos.forEach((el) => oio.observe(el));
}

/* ---------- Count-up ---------- */
const counters = document.querySelectorAll('[data-count]');
if (counters.length) {
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      cio.unobserve(e.target);
      const end = +e.target.dataset.count;
      if (rmq.matches) { e.target.textContent = end.toLocaleString('en-US'); continue; }
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.5 });
  counters.forEach((el) => cio.observe(el));
}

/* ---------- Split-flap board ----------
   Each character gets its own cell so it can drop into place; the value stays
   a single readable string for assistive tech. */
document.querySelectorAll('[data-flap]').forEach((el) => {
  const text = el.dataset.flap;
  const frag = document.createDocumentFragment();
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  frag.appendChild(label);
  [...text].forEach((chr, i) => {
    const cell = document.createElement('span');
    cell.style.setProperty('--c', i);
    cell.setAttribute('aria-hidden', 'true');
    cell.textContent = chr === ' ' ? ' ' : chr;
    frag.appendChild(cell);
  });
  el.replaceChildren(frag);
});

/* ---------- The address decodes itself on approach ---------- */
if (!rmq.matches && !motionUserOff()) {
  const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789@.-_';
  document.querySelectorAll('[data-scramble] .ct-mail-text').forEach((el) => {
    const final = el.textContent;
    let raf = null, t0 = 0, running = false;
    const frame = (now) => {
      const p = Math.min((now - t0) / 1100, 1);
      const lock = Math.floor(p * final.length * 1.25);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        if (i < lock || final[i] === '@' || final[i] === '.') out += final[i];
        else out += GLYPHS[(Math.floor(now / 45) + i * 7) % GLYPHS.length];
      }
      el.textContent = out;
      if (p < 1) { raf = requestAnimationFrame(frame); }
      else { el.textContent = final; raf = null; running = false; }
    };
    const run = () => {
      if (running) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver((es, o) => {
      if (es[es.length - 1].isIntersecting) { run(); o.disconnect(); }
    }, { threshold: 0.6 }).observe(el);
    el.closest('[data-scramble]').addEventListener('pointerenter', run);
  });
}

/* ---------- Console boot line ---------- */
if (!rmq.matches && !motionUserOff()) {
  document.querySelectorAll('[data-type]').forEach((el) => {
    const text = el.dataset.type;
    el.textContent = '';
    let i = 0;
    const step = () => {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, 42);
    };
    setTimeout(step, 350);
  });
}

/* ---------- Copy email ---------- */
const copyBtn = document.querySelector('[data-copy]');
const copyStatus = document.getElementById('copyStatus');
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.copy);
    const prev = copyBtn.textContent;
    copyBtn.textContent = 'Copied ✓';
    if (copyStatus) copyStatus.textContent = 'Email address copied';
    setTimeout(() => {
      copyBtn.textContent = prev;
      if (copyStatus) copyStatus.textContent = '';
    }, 2000);
  } catch {
    location.href = `mailto:${copyBtn.dataset.copy}`;
  }
});

/* ---------- Year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ═══════════════════════════════════════════════════════════════════════
   v10 · The page reacts to how fast you move through it.
   One rAF loop writes --speed (0..1) on the streak layer alone, so the
   rest of the document never restyles while you scroll. Headings and
   sections stay still; only the champagne streaks surface at speed. The
   loop parks itself the moment you stop, so an idle page costs nothing.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rush = document.createElement('div');
  rush.className = 'rush';
  rush.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rush);

  let last = scrollY, raw = 0, vel = 0, raf = 0;

  const frame = () => {
    vel += (raw - vel) * 0.16;
    raw *= 0.80;
    const v = Math.max(-1, Math.min(1, vel / 105));
    rush.style.setProperty('--speed', Math.abs(v).toFixed(3));
    if (Math.abs(vel) < 0.4 && Math.abs(raw) < 0.4) {
      rush.style.setProperty('--speed', '0');
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  addEventListener('scroll', () => {
    raw += scrollY - last;
    last = scrollY;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });

  /* motion toggle: stop writing, and clear what was written */
  addEventListener('shafwan:motion-off', () => {
    cancelAnimationFrame(raf); raf = -1;
    rush.remove();
  });
})();

/* the opening seam is CSS-driven; this only takes it out of the DOM afterwards */
(() => {
  const intro = document.querySelector('.intro');
  if (!intro) return;
  const kill = () => intro.remove();
  if (document.documentElement.classList.contains('motion-off')) return kill();
  setTimeout(kill, 2100);
  addEventListener('shafwan:motion-off', kill);
})();

/* ---------- v10 · a champagne light that follows the pointer ---------- */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  let x = 50, y = 30, tx = 50, ty = 30, raf = 0;
  const frame = () => {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    root.style.setProperty('--mx', x.toFixed(2) + '%');
    root.style.setProperty('--my', y.toFixed(2) + '%');
    raf = (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) ? requestAnimationFrame(frame) : 0;
  };
  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth) * 100;
    ty = (e.clientY / innerHeight) * 100;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
})();

/* ---------- Back to top ----------
   The header is fixed, so an anchor on it never moved the page. The link keeps
   its "#top" href (which the browser treats as the document top) and we scroll
   it, smoothly unless motion is off. */
document.querySelectorAll('.foot-top').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-off');
  scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
  history.replaceState(null, '', location.pathname + location.search);
}));
