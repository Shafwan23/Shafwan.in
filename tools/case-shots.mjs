// Screenshots of the two private products for their case pages, taken from the
// apps running locally on demo data, saved as WebP.
//   EMS:      cd S:/FamySys/famysys_hrms/apps/web && NEXT_PUBLIC_DATA_SOURCE=mock npx next dev -p 3001
//   FerroBid: cd S:/Shafwan/FerroBid && npx vite --port 5174
//   node tools/case-shots.mjs            capture + convert
//   node tools/case-shots.mjs --convert  convert the PNGs already in .shots-live/case/
// Every person, company and number in these apps' demo data is fictional. The
// FerroBid marketplace seeds real steel-company names as sellers; they are
// swapped for invented ones in the DOM before the shot, so nothing on the
// portfolio implies a client that does not exist.
import path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import { createRequire } from 'module';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, '.shots-live', 'case');
const OUT = path.join(ROOT, 'public/img');
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });

const sharp = createRequire(import.meta.url)('sharp');

const EMS = process.env.EMS_ORIGIN ?? 'http://localhost:3001';
const FERRO = process.env.FERRO_ORIGIN ?? 'http://127.0.0.1:5174';

const DESK = { width: 1440, height: 900, scale: 1, mobile: false, out: 1200, q: 74 };
const MOB = { width: 390, height: 844, scale: 2, mobile: true, out: 520, q: 74 };

/* invented sellers stand in for the real companies seeded in FerroBid's mock data */
const SELLERS = {
  'Tata Steel': 'Meridian Steelworks',
  'SAIL': 'Northline Alloys',
  'Hindalco': 'Kaveri Metals',
  'JSW Steel': 'Deccan Ferro',
  'Hindustan Zinc': 'Aravalli Zinc',
};

/** @type {Array<{key:string, origin:string, path?:string, signInAs?:string, view?:object, prepare?:(page)=>Promise<void>, pick?:(page)=>Promise<string>}>} */
const SHOTS = [
  /* ── Famysys EMS ── */
  /* the demo panel is folded by default; open it so the roles are on the shot */
  { key: 'ems-login', origin: EMS, path: '/employee/login', prepare: async (page) => {
    await page.getByText(/sign in with a demo account/i).first().click();
    await page.waitForTimeout(900);
  } },
  /* no path: the portal home is wherever sign-in lands (visiting /employee drops the mock session) */
  { key: 'ems-portal', origin: EMS, signInAs: 'Suresh Menon' },
  { key: 'ems-console-employees', origin: EMS, path: '/console/employees' },
  { key: 'ems-console-roles', origin: EMS, path: '/console/roles' },
  { key: 'ems-console-access', origin: EMS, path: '/console/access' },
  { key: 'ems-console-audit', origin: EMS, path: '/console/audit' },
  { key: 'ems-hiring-dashboard', origin: EMS, signInAs: 'Anita Kurian', path: '/hiring/dashboard' },
  { key: 'ems-hiring-pipeline', origin: EMS, path: '/hiring/pipeline' },
  { key: 'ems-hiring-candidates', origin: EMS, path: '/hiring/candidates' },
  { key: 'ems-hiring-candidate', origin: EMS, path: '/hiring/candidates/cand-00101' },
  { key: 'ems-hiring-jobs', origin: EMS, path: '/hiring/jobs' },
  { key: 'ems-hiring-offers', origin: EMS, path: '/hiring/offers' },
  { key: 'ems-hrms-home', origin: EMS, path: '/hrms' },
  { key: 'ems-hrms-attendance', origin: EMS, path: '/hrms/attendance' },
  { key: 'ems-hrms-leave', origin: EMS, path: '/hrms/leave' },
  { key: 'ems-hrms-records', origin: EMS, path: '/hrms/records' },
  { key: 'ems-hrms-reports', origin: EMS, path: '/hrms/reports' },
  { key: 'ems-hrms-payroll', origin: EMS, signInAs: 'Geetha Mohan', path: '/hrms/payroll' },
  { key: 'ems-hrms-payroll-months', origin: EMS, path: '/hrms/payroll/months' },
  { key: 'ems-hrms-team', origin: EMS, signInAs: 'Arun Pillai', path: '/hrms/team' },
  { key: 'ems-pms-home', origin: EMS, path: '/pms' },
  { key: 'ems-pms-projects', origin: EMS, path: '/pms/projects' },
  { key: 'ems-pms-project', origin: EMS, pick: async (page) => page.locator('a[href^="/pms/projects/"]').first().getAttribute('href') },
  { key: 'ems-pms-tasks', origin: EMS, path: '/pms/tasks' },
  { key: 'ems-pms-timesheet', origin: EMS, path: '/pms/timesheet' },
  { key: 'ems-pms-team', origin: EMS, path: '/pms/team' },
  { key: 'ems-pms-reports', origin: EMS, signInAs: 'Rajiv Varghese', path: '/pms/reports' },
  { key: 'ems-no-access', origin: EMS, signInAs: 'Vikram Raj', path: '/console/employees' },
  { key: 'ems-careers', origin: EMS, path: '/careers' },
  { key: 'ems-portal', origin: EMS, signInAs: 'Anita Kurian', view: MOB },
  { key: 'ems-hiring-dashboard', origin: EMS, path: '/hiring/dashboard', view: MOB },
  { key: 'ems-hrms-attendance', origin: EMS, path: '/hrms/attendance', view: MOB },
  /* ── FerroBid ── */
  { key: 'ferrobid-home', origin: FERRO, path: '/' },
  { key: 'ferrobid-marketplace', origin: FERRO, path: '/marketplace' },
  { key: 'ferrobid-how', origin: FERRO, path: '/how-it-works' },
  { key: 'ferrobid-roles', origin: FERRO, path: '/roles' },
  { key: 'ferrobid-calendar', origin: FERRO, path: '/calendar' },
  { key: 'ferrobid-pricing', origin: FERRO, path: '/pricing' },
  { key: 'ferrobid-auth', origin: FERRO, path: '/auth?tab=register' },
  { key: 'ferrobid-home', origin: FERRO, path: '/', view: MOB },
  { key: 'ferrobid-marketplace', origin: FERRO, path: '/marketplace', view: MOB },
];

const fileName = (shot) => `${shot.key}-${(shot.view ?? DESK).mobile ? 'mob' : 'desk'}`;

async function signIn(page, origin, name) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.goto(`${origin}/employee/login`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.getByRole('button', { name: new RegExp(`^Sign in as ${name}`) }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60000 });
  /* the mock session is written a tick after the redirect; leaving too early loses it */
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
}

async function swapSellers(page) {
  await page.evaluate((map) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let text = node.nodeValue;
      for (const [real, fake] of Object.entries(map)) text = text.split(real).join(fake);
      /* the header prints the visitor's own IP address; a private-range one stands in */
      text = text.replace(/d{1,3}(.d{1,3}){3}/g, '10.42.0.17');
      if (text !== node.nodeValue) node.nodeValue = text;
    }
  }, SELLERS);
}

async function capture() {
  const pw = await import(pathToFileURL('S:/Shafwan/FerroBid/node_modules/playwright/index.mjs'));
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  let ctx = null, page = null, ctxKey = '';
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const shot of SHOTS) {
    if (only && !only.includes(shot.key)) continue;
    const view = shot.view ?? DESK;
    const key = `${shot.origin}|${view.width}`;
    if (key !== ctxKey) {
      if (ctx) await ctx.close();
      ctx = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        deviceScaleFactor: view.scale, isMobile: view.mobile, hasTouch: view.mobile,
        colorScheme: 'light',
      });
      page = await ctx.newPage();
      ctxKey = key;
    }
    try {
      if (shot.signInAs) await signIn(page, shot.origin, shot.signInAs);
      const target = shot.pick ? await shot.pick(page) : shot.path;
      if (target) await page.goto(`${shot.origin}${target}`, { waitUntil: 'networkidle', timeout: 120000 });
      else await page.waitForLoadState('networkidle');
      await page.waitForTimeout(shot.origin === FERRO ? 2600 : 1500);
      if (shot.origin === FERRO) await swapSellers(page);
      if (shot.prepare) await shot.prepare(page);
      await page.mouse.move(5, 5);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(RAW, `${fileName(shot)}.png`) });
      console.log('shot', fileName(shot), page.url().replace(shot.origin, ''));
    } catch (err) {
      console.log('FAILED', fileName(shot), err.message.split('\n')[0]);
    }
  }
  if (ctx) await ctx.close();
  await browser.close();
}

async function convert() {
  for (const file of readdirSync(RAW).filter((f) => f.endsWith('.png'))) {
    const mobile = file.endsWith('-mob.png');
    const view = mobile ? MOB : DESK;
    const out = file.replace(/\.png$/, '.webp');
    const info = await sharp(path.join(RAW, file))
      .resize({ width: view.out, withoutEnlargement: true })
      .webp({ quality: view.q })
      .toFile(path.join(OUT, out));
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
  }
}

if (!process.argv.includes('--convert')) await capture();
if (existsSync(RAW)) await convert();
