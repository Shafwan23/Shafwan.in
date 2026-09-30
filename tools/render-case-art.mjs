// Renders the case-study plates in tools/case-art.html to public/img as WebP.
import path from 'path';
import { pathToFileURL } from 'url';
import sharp from 'sharp';

const pw = await import(
  pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs')
);

const ROOT = path.resolve(import.meta.dirname, '..');
const CASES = ['famysys', 'servicenow', 'myfundbox', 'sih-2023'];
const SHOTS = [
  { suffix: 'hero', out: '-1280.webp', scale: 1.25 },
  { suffix: 'd1', out: '-d1.webp', scale: 2 },
  { suffix: 'd2', out: '-d2.webp', scale: 2 },
];

const browser = await pw.chromium.launch();
for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: shot.scale });
  await page.goto(pathToFileURL(path.join(ROOT, 'tools/case-art.html')).href);
  await page.evaluate(() => document.fonts.ready);
  for (const id of CASES) {
    const box = await page.evaluate((sceneId) => window.show(sceneId), `${id}-${shot.suffix}`);
    const png = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    const file = path.join(ROOT, 'public/img', id + shot.out);
    const info = await sharp(png).webp({ quality: 82 }).toFile(file);
    console.log(path.basename(file), `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)}KB`);
  }
  await page.close();
}
await browser.close();
