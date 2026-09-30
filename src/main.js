/* shafwan.in — the whisper of JavaScript.
   Progressive enhancement only: with JS off the page is fully readable. */

document.documentElement.classList.add('js');

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Scroll reveals ---------- */
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

/* ---------- Masthead + reading progress ---------- */
const masthead = document.querySelector('.masthead');
const progressBar = document.getElementById('progressBar');
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    masthead.classList.toggle('is-scrolled', scrollY > 10);
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Nav scrollspy ---------- */
const navLinks = new Map(
  [...document.querySelectorAll('.nav a')].map((a) => [a.hash.slice(1), a])
);
const spyIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach((a) => a.removeAttribute('aria-current'));
    navLinks.get(e.target.id)?.setAttribute('aria-current', 'true');
  }
}, { rootMargin: '-40% 0px -55% 0px' });

['work', 'about', 'experience', 'contact'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) spyIO.observe(el);
});

/* ---------- Work index: animated open/close ---------- */
document.querySelectorAll('details.work').forEach((d) => {
  const summary = d.querySelector('summary');
  const body = d.querySelector('.work-body');
  let anim = null;

  summary.addEventListener('click', (e) => {
    if (rmq.matches) return; // native toggle
    e.preventDefault();
    anim?.cancel();
    if (d.open) {
      anim = body.animate(
        { height: [`${body.offsetHeight}px`, '0px'], opacity: [1, 0] },
        { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      );
      anim.onfinish = () => { d.open = false; body.style.height = ''; };
    } else {
      d.open = true;
      anim = body.animate(
        { height: ['0px', `${body.scrollHeight}px`] },
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
      anim.onfinish = () => { body.style.height = ''; };
    }
  });
});

/* ---------- Floating work preview (desktop only) ---------- */
if (finePointer) {
  const preview = document.getElementById('workPreview');
  const previewImg = document.createElement('img');
  previewImg.alt = '';
  previewImg.width = 340;
  previewImg.height = 340;
  preview.appendChild(previewImg);

  const index = document.querySelector('.work-index');
  const GAP = 28; // offset so the card never covers the hovered row's title
  let raf = null;
  let cur = { x: innerWidth / 2, y: innerHeight / 2 };
  let target = { ...cur };
  let scale = 0.82;
  let targetScale = 0.82;
  let on = false;

  // warm the preview images once the pointer reaches the index
  index.addEventListener('pointerenter', () => {
    document.querySelectorAll('details.work').forEach((d) => {
      new Image().src = d.dataset.preview;
    });
  }, { once: true });

  function loop() {
    cur.x += (target.x - cur.x) * 0.14;
    cur.y += (target.y - cur.y) * 0.14;
    scale += (targetScale - scale) * 0.14;
    const w = preview.offsetWidth || 340;
    const h = preview.offsetHeight || 340;
    // anchor beside the cursor, flip when near the right edge, clamp vertically
    let x = cur.x + GAP;
    if (x + w > innerWidth - 16) x = cur.x - GAP - w;
    let y = Math.min(Math.max(cur.y - h / 2, 16), innerHeight - h - 16);
    const rot = Math.max(-7, Math.min(7, (target.x - cur.x) * 0.045));
    preview.style.transform =
      `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
    if (on || Math.abs(target.x - cur.x) > 0.5) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  function show(d) {
    const src = d.dataset.preview;
    if (previewImg.getAttribute('src') !== src) previewImg.src = src;
    on = true;
    targetScale = 1;
    preview.classList.add('is-on');
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function hide() {
    on = false;
    targetScale = 0.82;
    preview.classList.remove('is-on');
  }

  document.querySelectorAll('details.work > summary').forEach((summary) => {
    const d = summary.parentElement;
    summary.addEventListener('pointermove', (e) => {
      if (rmq.matches) return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (d.open) { hide(); return; }
      show(d);
    });
    summary.addEventListener('pointerleave', hide);
    summary.addEventListener('click', hide); // dismiss the instant a spread opens
  });
}

/* ---------- Stat count-up ---------- */
const stats = document.querySelectorAll('.about-stats b[data-count]');
if (stats.length) {
  const statIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      statIO.unobserve(e.target);
      const end = +e.target.dataset.count;
      if (rmq.matches) {
        e.target.textContent = end.toLocaleString('en-US');
        continue;
      }
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        e.target.textContent = Math.round(end * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  stats.forEach((b) => statIO.observe(b));
}

/* ---------- Copy email ---------- */
const copyBtn = document.getElementById('copyEmail');
const copyStatus = document.getElementById('copyStatus');
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyBtn.classList.add('is-copied');
    if (copyStatus) copyStatus.textContent = 'Email address copied';
    setTimeout(() => {
      copyBtn.classList.remove('is-copied');
      if (copyStatus) copyStatus.textContent = '';
    }, 2000);
  } catch {
    location.href = `mailto:${copyBtn.dataset.email}`;
  }
});

/* ---------- Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
