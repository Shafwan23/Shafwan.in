// Renders one OG card per page + favicon PNGs, using Playwright from FerroBid.
import path from 'path';
import { pathToFileURL } from 'url';

const pw = await import(
  pathToFileURL('C:/Users/91807/Desktop/Shafwan/FerroBid/node_modules/playwright/index.mjs')
);

const ROOT = path.resolve(import.meta.dirname, '..');

const PAGES = [
  { file: "og-home.png", label: "Software Engineer — Chennai", folio: "", title: "SHAFWAN<em>.</em>", sub: "Shafwan Ahmed — full stack software engineer" },
  { file: "og-work.png", label: "Selected Work", folio: "01 — 04", title: "The <em>Work</em>", sub: "Famysys · ServiceNow ITSM · MYFUNDBOX · SIH 2023" },
  { file: "og-famysys.png", label: "Case Study", folio: "01 / 04", title: "Famysys", sub: "Production web apps, end to end — Next.js, Node.js, MySQL" },
  { file: "og-servicenow.png", label: "Case Study", folio: "02 / 04", title: "ServiceNow", sub: "ITSM & HR Service Delivery at SUMZ Technologies" },
  { file: "og-myfundbox.png", label: "Case Study", folio: "03 / 04", title: "MYFUNDBOX", sub: "Auth flows & dashboard for subscription billing" },
  { file: "og-sih-2023.png", label: "Case Study", folio: "04 / 04", title: "SIH <em>2023</em>", sub: "Grand Finalist — explainable AI, ISRO problem statement" },
  { file: "og-experience.png", label: "Experience", folio: "2024 — now", title: "The <em>Record</em>", sub: "Famysys, SUMZ Technologies, MYFUNDBOX" },
  { file: "og-about.png", label: "About", folio: "", title: "End <em>to</em> End", sub: "Shafwan Ahmed — the person behind the work" },
  { file: "og-contact.png", label: "Contact", folio: "", title: "Let's <em>Talk</em>", sub: "tshafwan23@gmail.com — open to SWE roles" },
  { file: "og-lab.png", label: "The Lab", folio: "03 games", title: "Play<em>able</em>", sub: "Bitwise, Compile & Keystroke" },
];

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(ROOT, 'tools/og-template.html')).href);
await page.evaluate(() => document.fonts.ready);

for (const p of PAGES) {
  await page.evaluate((cfg) => {
    document.getElementById('ogLabel').textContent = cfg.label;
    document.getElementById('ogFolio').textContent = cfg.folio;
    document.getElementById('ogFolio').style.display = cfg.folio ? 'block' : 'none';
    document.getElementById('ogTitle').innerHTML = cfg.title;
    document.getElementById('ogSub').innerHTML = cfg.sub;
  }, p);
  await page.screenshot({ path: path.join(ROOT, 'public', p.file) });
  console.log(p.file);
}

// icons
await page.setViewportSize({ width: 180, height: 180 });
await page.goto(pathToFileURL(path.join(ROOT, 'tools/icon-template.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, 'public/apple-touch-icon.png') });
console.log('apple-touch-icon.png');

await browser.close();

const { default: sharp } = await import('sharp');
await sharp(path.join(ROOT, 'public/apple-touch-icon.png')).resize(48, 48).png()
  .toFile(path.join(ROOT, 'public/favicon-48.png'));
console.log('favicon-48.png');
