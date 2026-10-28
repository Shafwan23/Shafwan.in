// Imagery for the four older case pages, saved as WebP in public/img:
//   - ServiceNow and SIH 2023: scenes drawn in tools/case-mock.html (illustrations, never client screens)
//   - MYFUNDBOX: the public sign-in and sign-up pages of myfundbox.com, desktop and phone
// Famysys uses the live-product and EMS screenshots that already exist.
//   node tools/story-shots.mjs
import path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync } from 'fs';
import { createRequire } from 'module';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, '.shots-live', 'story');
const OUT = path.join(ROOT, 'public/img');
mkdirSync(RAW, { recursive: true });
const sharp = createRequire(import.meta.url)('sharp');

const pw = await import(pathToFileURL('S:/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
const browser = await pw.chromium.launch({ channel: 'chrome' });

async function save(page, name, width, q = 76) {
  const raw = path.join(RAW, `${name}.png`);
  await page.screenshot({ path: raw });
  const info = await sharp(raw).resize({ width, withoutEnlargement: true }).webp({ quality: q }).toFile(path.join(OUT, `${name}.webp`));
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
}

/* drawn scenes */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const url = pathToFileURL(path.join(ROOT, 'tools/case-mock.html')).href;
  for (const scene of ['snow-queue', 'snow-flow', 'snow-case', 'sih-field', 'sih-shap']) {
    /* a hash change alone is a same-document navigation and the scene script would not run again */
    await page.goto('about:blank');
    await page.goto(`${url}#${scene}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await save(page, scene, 1280, 78);
  }
  await page.close();
}

/* MYFUNDBOX, the public pages */
if (!process.argv.includes('--scenes')) for (const [name, url] of [['mfb-login', 'https://www.myfundbox.com/login-mfb'], ['mfb-signup', 'https://www.myfundbox.com/sign-up']]) {
  for (const [tag, w, h, scale, mobile, out] of [['desk', 1440, 900, 1, false, 1280], ['mob', 390, 844, 2, true, 520]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch { console.log(`${name} ${tag}: network never idle, shooting anyway`); }
    await page.waitForTimeout(2500);
    await save(page, `${name}-${tag}`, out);
    await ctx.close();
  }
}
await browser.close();
