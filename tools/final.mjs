import { pathToFileURL } from 'url';
import { writeFileSync } from 'fs';
const pw = await import(pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
const B = 'http://localhost:4173';
const b = await pw.chromium.launch({ args: ['--use-gl=angle','--ignore-gpu-blocklist'] });
const errs = [];
async function shot(p, name) {
  const cdp = await p.context().newCDPSession(p);
  const s = await Promise.race([cdp.send('Page.captureScreenshot', { format: 'png' }),
    new Promise((_, r) => setTimeout(() => r(new Error('t')), 5000))]).catch(() => null);
  if (s) writeFileSync('.shots/' + name, Buffer.from(s.data, 'base64'));
  return !!s;
}
// desktop home
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => { if (!/Transition was skipped/.test(e.message)) errs.push('home: ' + e.message.slice(0,120)); });
await p.goto(B + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
console.log('HOME classes:', await p.evaluate(() => document.documentElement.className));
await p.mouse.move(400, 560); await p.mouse.move(900, 600, { steps: 12 });
await p.waitForTimeout(400);
console.log('  hero shot:', await shot(p, 'v3-hero.png'));
await p.close();
// mobile home (particles must still form; no cursor, no repel)
p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
p.on('pageerror', e => errs.push('mobile: ' + e.message.slice(0,120)));
await p.goto(B + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2800);
console.log('MOBILE:', JSON.stringify(await p.evaluate(() => ({
  cls: document.documentElement.className,
  overflow: document.documentElement.scrollWidth > innerWidth,
}))));
console.log('  mobile shot:', await shot(p, 'v3-m-home.png'));
await p.close();
// every page loads clean
for (const path of ['/work/', '/work/servicenow/', '/about/', '/contact/', '/lab/']) {
  const q = await b.newPage({ viewport: { width: 1280, height: 800 } });
  q.on('pageerror', e => { if (!/Transition was skipped/.test(e.message)) errs.push(path + ': ' + e.message.slice(0,120)); });
  await q.goto(B + path, { waitUntil: 'networkidle' });
  await q.waitForTimeout(1200);
  const ok = await q.evaluate(() => document.documentElement.classList.contains('scene-on'));
  console.log('PAGE', path, 'scene-on:', ok);
  await q.close();
}
await b.close();
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
