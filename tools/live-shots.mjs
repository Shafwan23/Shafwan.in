// Screenshots of the live products for /work/: desktop and phone, saved as WebP.
//   node tools/live-shots.mjs            capture + convert
//   node tools/live-shots.mjs --convert  convert the PNGs already in .shots-live/
import path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync, existsSync } from 'fs';
import { createRequire } from 'module';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, '.shots-live');
const OUT = path.join(ROOT, 'public/img');
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });

/* sharp's native module does not load through a file:// import from another
   directory, so it is required the CommonJS way (see DESIGN.md, dot portrait) */
const sharp = createRequire(import.meta.url)('sharp');

const SITES = [
  { key: 'studio', url: 'https://studio.famysys.com/' },
  { key: 'miniminds', url: 'https://studiominiminds.com/' },
  { key: 'fajr', url: 'https://fajr-international.famysys.com/' },
  { key: 'saliah', url: 'https://shopzy.famysys.com/' },
  { key: 'ghl', url: 'https://ghl-dashboard.famysys.com/' },
];
const VIEWS = [
  { tag: 'desk', width: 1440, height: 900, scale: 1, mobile: false, out: 1280, q: 76 },
  { tag: 'mob', width: 390, height: 844, scale: 2, mobile: true, out: 520, q: 76 },
];

async function capture() {
  const pw = await import(pathToFileURL('S:/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  for (const site of SITES) {
    for (const v of VIEWS) {
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: v.scale, isMobile: v.mobile, hasTouch: v.mobile,
      });
      const page = await ctx.newPage();
      try {
        await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45000 });
      } catch {
        console.log(`${site.key} ${v.tag}: network never went idle, shooting anyway`);
      }
      await page.waitForTimeout(3500);
      await page.mouse.move(v.width / 2, v.height / 2);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(RAW, `${site.key}-${v.tag}.png`) });
      console.log(`shot ${site.key}-${v.tag}`);
      await ctx.close();
    }
  }
  await browser.close();
}

async function convert() {
  for (const site of SITES) {
    for (const v of VIEWS) {
      const src = path.join(RAW, `${site.key}-${v.tag}.png`);
      if (!existsSync(src)) { console.log(`missing ${src}`); continue; }
      const out = `live-${site.key}-${v.tag}.webp`;
      const info = await sharp(src)
        .resize({ width: v.out, withoutEnlargement: true })
        .webp({ quality: v.q })
        .toFile(path.join(OUT, out));
      console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
    }
  }
}

if (!process.argv.includes('--convert')) await capture();
await convert();
