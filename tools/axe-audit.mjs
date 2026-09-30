import { pathToFileURL } from 'url';

const pw = await import(pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
const axe = await import(pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/@axe-core/playwright/dist/index.mjs'));
const AxeBuilder = axe.AxeBuilder || axe.default;

const browser = await pw.chromium.launch();
const results = {};

for (const vp of [{ w: 1440, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'mobile' }]) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const res = await new AxeBuilder({ page }).analyze();
  results[vp.name] = res.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, html: n.html.slice(0, 200), summary: n.failureSummary?.slice(0, 300) }))
  }));
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
