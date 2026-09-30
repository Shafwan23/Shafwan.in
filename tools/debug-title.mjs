import { pathToFileURL } from 'url';
const pw = await import(
  pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs')
);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  document.getElementById('work-title').scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const el = document.getElementById('work-title');
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    className: el.className,
    htmlClass: document.documentElement.className,
    clipPath: cs.clipPath,
    opacity: cs.opacity,
    transform: cs.transform,
    color: cs.color,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    visibility: cs.visibility,
    display: cs.display,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    text: el.textContent.trim(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
