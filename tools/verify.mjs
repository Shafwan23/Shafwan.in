import { pathToFileURL } from 'url';
import { writeFileSync } from 'fs';
const pw = await import(pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
const B = 'http://localhost:4173';
const b = await pw.chromium.launch({ args: ['--use-gl=angle','--ignore-gpu-blocklist'] });

async function page(opts = {}) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ...opts });
  p.on('pageerror', e => { if (!/Transition was skipped/.test(e.message)) console.log('[pe]', e.message.slice(0,160)); });
  return p;
}
async function snap(p, name) {
  const cdp = await p.context().newCDPSession(p);
  const s = await Promise.race([
    cdp.send('Page.captureScreenshot', { format: 'png' }),
    new Promise((_, r) => setTimeout(() => r(new Error('t')), 5000)),
  ]).catch(() => null);
  if (s) { writeFileSync('.shots/' + name, Buffer.from(s.data, 'base64')); console.log('  shot', name); }
  else console.log('  SKIP', name);
}

// ---- 1. case page: warp canvas geometry + hover ----
let p = await page();
await p.goto(B + '/work/famysys/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const rc = await p.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.querySelector('.case-hero-media');
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return { cx: r.x + r.width/2, cy: r.y + r.height/2 };
});
await p.waitForTimeout(400);
await p.mouse.move(rc.cx - 200, rc.cy - 90, { steps: 5 });
await p.mouse.move(rc.cx, rc.cy, { steps: 8 });
await p.waitForTimeout(1100);
console.log('CASE:', JSON.stringify(await p.evaluate(() => {
  const c = document.querySelector('.case-hero-media canvas');
  const f = document.querySelector('.case-hero-media');
  const cs = getComputedStyle(c), cr = c.getBoundingClientRect(), fr = f.getBoundingClientRect();
  return { pos: cs.position, zIndex: cs.zIndex, opacity: cs.opacity,
           fits: Math.abs(cr.width - fr.width) < 2 && Math.abs(cr.height - fr.height) < 2,
           cw: Math.round(cr.width), fw: Math.round(fr.width) };
})));
await snap(p, 'v2-case.png');
await p.close();

// ---- 2. lab: the three cabinets and their record boards ----
p = await page();
await p.goto(B + '/lab/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
console.log('LAB:', await p.evaluate(() => document.documentElement.className));
console.log('  cabinets:', JSON.stringify(await p.evaluate(() => ({
  frames: document.querySelectorAll('.game-frame').length,
  bits: document.querySelectorAll('.bw-bit').length,
  boards: document.querySelectorAll('.hs-list').length,
  rows: document.querySelectorAll('.hs-row').length,
  dialog: !!document.getElementById('hsDialog'),
}))));
/* play bitwise until the register matches, so the board takes a record */
await p.click('#bwStart');
await p.waitForTimeout(300);
const solvedOne = await p.evaluate(async () => {
  const bits = [...document.querySelectorAll('.bw-bit')];
  const target = +document.getElementById('bwDec').textContent;
  const want = document.getElementById('bwBin');
  /* read the prompt's answer by brute force: flip toward the goal one bit at a time */
  for (let n = 0; n < 256; n++) {
    const W = [128, 64, 32, 16, 8, 4, 2, 1];
    const cur = +document.getElementById('bwDec').textContent;
    if (cur === n) continue;
    for (let i = 0; i < 8; i++) {
      const on = (cur & W[i]) !== 0, need = (n & W[i]) !== 0;
      if (on !== need) bits[i].click();
    }
    if (+document.getElementById('bwScore').textContent > 0) return { hit: n, score: +document.getElementById('bwScore').textContent };
  }
  return { hit: -1, score: +document.getElementById('bwScore').textContent, target, want: want.textContent };
});
console.log('  bitwise solved:', JSON.stringify(solvedOne));
/* compile: answer the first question by clicking option one */
await p.click('#cpStart');
await p.waitForTimeout(400);
await p.click('.cp-opt');
await p.waitForTimeout(300);
console.log('  compile live:', JSON.stringify(await p.evaluate(() => ({
  cat: document.getElementById('cpCat').textContent.slice(0, 24),
  opts: document.querySelectorAll('.cp-opt').length,
  marked: document.querySelectorAll('.cp-opt.right, .cp-opt.wrong').length,
}))));
await snap(p, 'v2-playground.png');
await p.close();

// ---- 3. home hero + burn ----
p = await page();
await p.goto(B + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log('HOME:', await p.evaluate(() => document.documentElement.className));
await snap(p, 'v2-hero.png');
await p.evaluate(() => document.querySelector('.site-nav a[href="/about/"]').click());
await p.waitForTimeout(170);
await snap(p, 'v2-burn.png');
await p.waitForTimeout(1000);
console.log('  burn landed:', p.url());
await p.close();

// ---- 4. motion toggle + playground fallback ----
p = await page();
await p.goto(B + '/lab/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const hasToggle = await p.evaluate(() => !!document.querySelector('.motion-toggle'));
await p.evaluate(() => document.querySelector('.motion-toggle').click());
await p.waitForTimeout(600);
const afterOff = await p.evaluate(() => ({
  cls: document.documentElement.className,
  sceneCanvas: document.querySelectorAll('.scene-canvas').length,
  pressed: document.querySelector('.motion-toggle').getAttribute('aria-pressed'),
  label: document.querySelector('.motion-toggle').textContent,
}));
console.log('TOGGLE present:', hasToggle, '| after off:', JSON.stringify(afterOff));
// reload with motion off -> the cabinets still work, nothing hides
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1400);
console.log('MOTION OFF:', JSON.stringify(await p.evaluate(() => ({
  cls: document.documentElement.className,
  frames: document.querySelectorAll('.game-frame').length,
  hidden: [...document.querySelectorAll('main .game-frame *')]
    .filter((el) => !el.closest('[hidden], .sr-only') && getComputedStyle(el).opacity === '0').length,
  scan: getComputedStyle(document.querySelector('.console-scan')).display,
}))));
await p.close();

// ---- 5. reduced-motion: nothing boots at all ----
p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto(B + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
console.log('REDUCED:', JSON.stringify(await p.evaluate(() => ({
  cls: document.documentElement.className,
  scene: document.querySelectorAll('.scene-canvas').length,
  heroText: document.querySelector('[data-scene-text]')?.textContent.trim(),
  heroVisible: getComputedStyle(document.querySelector('[data-scene-text] .w') || document.body).opacity,
}))));
await p.close();
await b.close();
console.log('VERIFY DONE');
