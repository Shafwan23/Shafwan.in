import { pathToFileURL } from 'url';
const pw = await import(pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs'));

const browser = await pw.chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const reqs = [];
page.on('response', async (r) => {
  try {
    const body = await r.body();
    reqs.push({ url: r.url().replace('http://localhost:4173', ''), size: body.length });
  } catch {}
});
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const boxes = await page.evaluate(() => {
  const out = {};
  const grab = (sel, name) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const b = el.getBoundingClientRect();
    out[name] = { w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  grab('.nav a[href="#work"]', 'navLink');
  grab('.nav-contact', 'navContact');
  grab('.copy-btn', 'copyBtn');
  grab('.social a', 'socialLink');
  grab('.work-toggle', 'workToggle');
  grab('summary.work-row', 'summaryRow');
  grab('.to-top', 'toTop');
  grab('.hero-scroll', 'heroScroll');
  grab('.wordmark', 'wordmark');
  // CLS via layout shift observer not retroactive; check font loaded
  out.mastheadHeight = document.querySelector('.masthead').getBoundingClientRect().height;
  return out;
});
console.log('TOUCH TARGETS (390px):', JSON.stringify(boxes, null, 1));
console.log('REQUESTS AT LOAD:', JSON.stringify(reqs, null, 1));
const total = reqs.reduce((s, r) => s + r.size, 0);
console.log('TOTAL BYTES:', total, `(${(total / 1024).toFixed(1)} KB)`);

// CLS measurement on a fresh load
const page2 = await context.newPage();
await page2.addInitScript(() => {
  window.__cls = 0;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
await page2.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page2.waitForTimeout(2500);
console.log('CLS:', await page2.evaluate(() => window.__cls));

await browser.close();
