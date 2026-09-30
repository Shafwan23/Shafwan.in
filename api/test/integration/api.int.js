/*
 * End-to-end API test against a real local Worker and a throwaway local D1.
 * Spawns `wrangler dev`, a stub mail endpoint on :8799, and drives every route.
 * Run with: npm run test:int   (needs network for Turnstile's test secret)
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API = 'http://127.0.0.1:8787';
const ORIGIN = 'http://localhost:5173';
const DUMMY_TURNSTILE = 'XXXX.DUMMY.TOKEN.XXXX';
const persist = mkdtempSync(join(tmpdir(), 'shafwan-d1-'));
const mails = [];
let worker, mailStub, session;

async function waitForApi(ms = 60000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try { if ((await fetch(API)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('wrangler dev did not start');
}

before(async () => {
  mailStub = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => { mails.push({ auth: req.headers.authorization, ...JSON.parse(body) }); res.end('{"id":"stub"}'); });
  }).listen(8799);
  execSync(`npx wrangler d1 migrations apply shafwan --local --persist-to "${persist}"`, { stdio: 'ignore', shell: true });
  worker = spawn('npx', ['wrangler', 'dev', '--local', '--port', '8787', '--persist-to', persist], { shell: true, stdio: 'ignore' });
  await waitForApi();
});

after(() => {
  mailStub?.close();
  if (worker?.pid) {
    try { execSync(process.platform === 'win32' ? `taskkill /pid ${worker.pid} /T /F` : `kill ${worker.pid}`, { stdio: 'ignore' }); } catch { /* gone */ }
  }
  try { rmSync(persist, { recursive: true, force: true }); } catch { /* wrangler may still hold the folder on Windows */ }
});

async function call(path, { body, auth = session, origin = ORIGIN, method = 'POST' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(API + path, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body ?? {}) });
  return { status: res.status, headers: res.headers, data: await res.json() };
}

test('health and empty boards are public', async () => {
  assert.equal((await call('/', { method: 'GET' })).data.ok, true);
  const boards = await call('/boards', { method: 'GET', origin: null });
  assert.deepEqual(boards.data, { bitwise: [], compile: [], keystroke: [] });
});

test('writes need the site origin and a play session', async () => {
  assert.equal((await call('/runs', { body: { game: 'bitwise' }, origin: 'https://evil.example', auth: null })).status, 403);
  assert.equal((await call('/runs', { body: { game: 'bitwise' }, auth: null })).status, 401);
  assert.equal((await call('/runs', { body: { game: 'bitwise' }, auth: 'forged.token' })).status, 401);
});

test('a Turnstile pass buys a session; a bad token does not', async () => {
  assert.equal((await call('/session', { body: {}, auth: null })).status, 400);
  const res = await call('/session', { body: { turnstileToken: DUMMY_TURNSTILE }, auth: null });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  session = res.data.token;
  assert.ok(session.includes('.'));
});

test('bitwise: server scores the run; a name is checked; a run is claimed once', async () => {
  const start = await call('/runs', { body: { game: 'bitwise' } });
  assert.equal(start.status, 200);
  assert.equal(start.data.rounds.length, 160);
  const id = start.data.runId;
  await new Promise((r) => setTimeout(r, 2500)); // two rounds' floor time must really pass

  const fin = await call(`/runs/${id}/finish`, { body: { game: 'bitwise', solves: [120, 240], score: 999999 } });
  assert.equal(fin.status, 200, JSON.stringify(fin.data));
  assert.ok(fin.data.final.score > 0 && fin.data.final.score < 999999, 'the sent score is ignored');
  assert.equal(fin.data.final.place, 1);

  assert.equal((await call(`/runs/${id}/finish`, { body: { game: 'bitwise', solves: [] } })).status, 409, 'no re-finishing');
  const rude = await call(`/runs/${id}/claim`, { body: { name: 'F.U.C.K' } });
  assert.equal(rude.status, 422);
  const ok = await call(`/runs/${id}/claim`, { body: { name: 'Ada Lovelace' } });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.place, 1);
  assert.equal(ok.data.board[0].name, 'Ada Lovelace');
  assert.equal((await call(`/runs/${id}/claim`, { body: { name: 'Again' } })).status, 409, 'no double claims');
});

test('bitwise: cannot claim time the server has not seen pass', async () => {
  const burst = await call('/runs', { body: { game: 'bitwise' } });
  const instant = await call(`/runs/${burst.data.runId}/finish`, { body: { game: 'bitwise', solves: Array.from({ length: 160 }, (_, i) => i) } });
  assert.equal(instant.status, 400, 'a full run posted instantly is refused');
  const { data } = await call('/runs', { body: { game: 'bitwise' } });
  const res = await call(`/runs/${data.runId}/finish`, { body: { game: 'bitwise', solves: [30000, 59000] } });
  assert.equal(res.status, 400);
});

test('keystroke: over-fast reports are capped, impossible ones refused', async () => {
  const a = await call('/runs', { body: { game: 'keystroke', line: 0 } });
  const fast = await call(`/runs/${a.data.runId}/finish`, { body: { game: 'keystroke', elapsedMs: 300, typed: 90, errors: 0 } });
  assert.equal(fast.status, 200, JSON.stringify(fast.data));
  assert.equal(fast.data.final.score, 180);

  const b = await call('/runs', { body: { game: 'keystroke', line: 1 } });
  const slow = await call(`/runs/${b.data.runId}/finish`, { body: { game: 'keystroke', elapsedMs: 90000, typed: 95, errors: 0 } });
  assert.equal(slow.status, 400);
  assert.equal((await call('/runs', { body: { game: 'keystroke', line: 99 } })).status, 400);
});

test('compile: answers judged server-side; a doubled answer counts once', async () => {
  const start = await call('/runs', { body: { game: 'compile' } });
  assert.equal(start.status, 200);
  assert.equal(start.data.question.options.length, 4);
  assert.ok(!JSON.stringify(start.data).includes('"i":'), 'no answer key in the reply');
  const id = start.data.runId;

  const [one, two] = await Promise.all([
    call(`/runs/${id}/answer`, { body: { choice: 0, number: 1 } }),
    call(`/runs/${id}/answer`, { body: { choice: 0, number: 1 } }),
  ]);
  assert.deepEqual([one.status, two.status].sort(), [200, 409]);

  let reply = (one.status === 200 ? one : two).data;
  let guard = 0;
  while (!reply.final && guard++ < 60) {
    reply = (await call(`/runs/${id}/answer`, { body: { choice: (reply.rightIndex + 1) % 4, number: reply.next.number } })).data;
  }
  assert.ok(reply.final, 'three misses end the run');
  assert.equal(reply.lives, 0);
});

test('contact: validated, mailed as plain text, honeypot dropped, rate limited', async () => {
  const short = await call('/contact', { auth: null, body: { message: 'hi', turnstileToken: DUMMY_TURNSTILE } });
  assert.equal(short.status, 422);

  const sent = await call('/contact', { auth: null, body: { message: 'Loved the Lab. <b>Hire</b> me?', reply: 'hr@example.com', turnstileToken: DUMMY_TURNSTILE } });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  assert.equal(sent.data.queued, false);
  const mail = mails.at(-1);
  assert.equal(mail.to[0], 'tshafwan23@gmail.com');
  assert.equal(mail.reply_to, 'hr@example.com');
  assert.ok(mail.text.includes('Loved the Lab. <b>Hire</b> me?'));
  assert.equal(mail.html, undefined);
  assert.equal(mail.auth, 'Bearer re_local_stub');

  const before = mails.length;
  const bot = await call('/contact', { auth: null, body: { message: 'Buy cheap followers now', website: 'http://spam', turnstileToken: DUMMY_TURNSTILE } });
  assert.equal(bot.status, 200);
  assert.equal(mails.length, before, 'honeypot notes are never mailed');

  await call('/contact', { auth: null, body: { message: 'Second note from me', turnstileToken: DUMMY_TURNSTILE } });
  await call('/contact', { auth: null, body: { message: 'Third note from me', turnstileToken: DUMMY_TURNSTILE } });
  const fourth = await call('/contact', { auth: null, body: { message: 'Fourth note from me', turnstileToken: DUMMY_TURNSTILE } });
  assert.equal(fourth.status, 429);
});

test('boards show one best entry per name', async () => {
  for (const score of [1, 2]) {
    const { data } = await call('/runs', { body: { game: 'keystroke', line: score } });
    await call(`/runs/${data.runId}/finish`, { body: { game: 'keystroke', elapsedMs: 300, typed: 200, errors: 0 } });
    await call(`/runs/${data.runId}/claim`, { body: { name: 'Grace Hopper' } });
  }
  const board = (await call('/boards', { method: 'GET' })).data.keystroke;
  assert.equal(board.filter((r) => r.name === 'Grace Hopper').length, 1);
});
