// Prints tools/resume.html to public/Shafwan-Ahmed-Resume.pdf (A4, one page, selectable text).
import path from 'path';
import { pathToFileURL } from 'url';

const pw = await import(
  pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs')
);

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/Shafwan-Ahmed-Resume.pdf');

const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(ROOT, 'tools/resume.html')).href);
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => document.fonts.ready);

const heightMm = await page.evaluate(() => document.querySelector('.page').scrollHeight / (96 / 25.4));
if (heightMm > 297.5) {
  await browser.close();
  throw new Error(`résumé overflows one A4 page: ${heightMm.toFixed(1)}mm tall`);
}

await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(path.basename(OUT), `${heightMm.toFixed(1)}mm of 297mm`);
