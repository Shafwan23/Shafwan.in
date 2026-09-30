// Batched inspection screenshots (vite preview on :4173).
import path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync } from 'fs';

const pw = await import(
  pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs')
);

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '.shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4173';

const browser = await pw.chromium.launch();

async function scrollThrough(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const step = innerHeight * 0.6;
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 170));
    }
    await new Promise((r) => setTimeout(r, 500));
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
}

async function shoot(pagePath, name, { full = true, mobile = false } = {}) {
  const ctx = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await ctx.goto(BASE + pagePath, { waitUntil: 'networkidle' });
  await ctx.waitForTimeout(1500);
  await ctx.screenshot({ path: path.join(OUT, `${name}-top.png`) });
  if (full) {
    await scrollThrough(ctx);
    await ctx.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true });
  }
  await ctx.close();
}

await shoot('/', 'home');
await shoot('/', 'm-home', { mobile: true });
await shoot('/work/', 'work');
await shoot('/work/famysys/', 'case');
await shoot('/work/famysys/', 'm-case', { mobile: true });
await shoot('/about/', 'about');
await shoot('/contact/', 'contact');
await shoot('/lab/', 'lab');

// hover state on work index
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(BASE + '/work/', { waitUntil: 'networkidle' });
await d.waitForTimeout(1200);
await d.locator('.work-item >> nth=1 >> a').hover();
await d.waitForTimeout(600);
await d.screenshot({ path: path.join(OUT, 'work-hover.png') });

// reel panel hover (GL distort) on home
await d.goto(BASE + '/', { waitUntil: 'networkidle' });
await d.waitForTimeout(1200);
await d.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('.panel')[1].scrollIntoView({ block: 'start' });
});
await d.waitForTimeout(1200);
await d.mouse.move(950, 450);
await d.waitForTimeout(900);
await d.screenshot({ path: path.join(OUT, 'home-panel-hover.png') });
await d.close();

await browser.close();
console.log('shots written');
