import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashIp, ipBucket, issueSession, randomInt, shuffle, verifySession, verifyTurnstile } from '../src/security.js';
import { cleanNote } from '../src/contact.js';
import { composeMail } from '../src/mail.js';
import { placeFor } from '../src/boards.js';
import { corsHeaders, requireSiteOrigin } from '../src/http.js';

const env = { SESSION_SECRET: 'x'.repeat(40), TURNSTILE_SECRET: 'ts', ALLOWED_ORIGINS: 'https://shafwan.in' };

test('sessions: a fresh session verifies on the network it was issued to', async () => {
  const { token } = await issueSession(env, 'net-a', 1000);
  const data = await verifySession(env, `Bearer ${token}`, 'net-a', 2000);
  assert.equal(data.v, 1);
  await assert.rejects(verifySession(env, token, 'net-b', 2000), { status: 401 });
});

test('sessions: tampering, expiry and a wrong key all fail', async () => {
  const { token, expiresAt } = await issueSession(env, 'n', 1000);
  const [payload, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ v: 1, exp: 9e15, ip: 'n' })).toString('base64url');
  await assert.rejects(verifySession(env, `${forged}.${sig}`, 'n', 2000), { status: 401 });
  await assert.rejects(verifySession(env, `${payload}.${sig.slice(0, -2)}AA`, 'n', 2000), { status: 401 });
  await assert.rejects(verifySession(env, token, 'n', expiresAt + 1), { code: 'session_expired' });
  await assert.rejects(verifySession({ SESSION_SECRET: 'y'.repeat(40) }, token, 'n', 2000), { status: 401 });
  await assert.rejects(verifySession(env, '', 'n', 2000), { status: 401 });
  await assert.rejects(verifySession(env, 'garbage', 'n', 2000), { status: 401 });
});

test('sessions: refuse to run with a weak or missing secret', async () => {
  await assert.rejects(issueSession({ SESSION_SECRET: 'short' }), { status: 503 });
  await assert.rejects(hashIp({}, '1.2.3.4'), { status: 503 });
});

test('IPv6 addresses are counted per /64, IPv4 per address', async () => {
  assert.equal(ipBucket('203.0.113.9'), '203.0.113.9');
  assert.equal(ipBucket('2001:db8:1:2:aaaa:bbbb:cccc:dddd'), '2001:db8:1:2::/64');
  assert.equal(ipBucket('2001:db8:1:2::9'), '2001:db8:1:2::/64');
  assert.equal(ipBucket('2001:DB8::1'), '2001:db8:0:0::/64');
  assert.equal(await hashIp(env, '2001:db8:1:2::1'), await hashIp(env, '2001:db8:1:2:ffff::7'));
  assert.notEqual(await hashIp(env, '2001:db8:1:2::1'), await hashIp(env, '2001:db8:1:3::1'));
});

test('ip hashes are stable, keyed and do not contain the address', async () => {
  const a = await hashIp(env, '203.0.113.9');
  assert.equal(a, await hashIp(env, '203.0.113.9'));
  assert.notEqual(a, await hashIp({ SESSION_SECRET: 'z'.repeat(40) }, '203.0.113.9'));
  assert.ok(!a.includes('203'));
});

test('turnstile: passes only when Cloudflare says success', async () => {
  const ok = async () => ({ json: async () => ({ success: true }) });
  const no = async () => ({ json: async () => ({ success: false }) });
  const down = async () => { throw new Error('offline'); };
  await verifyTurnstile(env, 'tok', '1.1.1.1', ok);
  await assert.rejects(verifyTurnstile(env, 'tok', '1.1.1.1', no), { status: 403 });
  await assert.rejects(verifyTurnstile(env, 'tok', '1.1.1.1', down), { status: 502 });
  await assert.rejects(verifyTurnstile(env, '', '1.1.1.1', ok), { status: 400 });
  await assert.rejects(verifyTurnstile({}, 'tok', '1.1.1.1', ok), { status: 503 });
});

test('randomness: randomInt stays in range and shuffle keeps every item', () => {
  for (let i = 0; i < 2000; i++) {
    const n = randomInt(7);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 7);
  }
  assert.throws(() => randomInt(0), RangeError);
  const list = [1, 2, 3, 4, 5, 6];
  const mixed = shuffle(list);
  assert.deepEqual([...mixed].sort(), list);
  assert.deepEqual(list, [1, 2, 3, 4, 5, 6], 'shuffle must not mutate its input');
});

test('notes: trimmed, length checked, control characters removed', () => {
  assert.deepEqual(cleanNote({ message: '  Hello there, nice site!  ', reply: '' }), { body: 'Hello there, nice site!', replyTo: null });
  assert.equal(cleanNote({ message: 'Hello\u0007 there\r\nfriend' }).body, 'Hello there\nfriend');
  assert.equal(cleanNote({ message: 'right\u202Eto left text' }).body, 'rightto left text');
  assert.throws(() => cleanNote({ message: 'short' }), { code: 'message' });
  assert.throws(() => cleanNote({ message: 'x'.repeat(2001) }), { code: 'message' });
  assert.throws(() => cleanNote({ message: 'long enough text', reply: 'r'.repeat(121) }), { code: 'reply' });
  assert.throws(() => cleanNote({}), { code: 'message' });
});

test('mail: plain text only, reply-to set only for a real address', () => {
  const mailEnv = { MAIL_FROM: 'site <a@b.dev>', MAIL_TO: 'me@x.com' };
  const html = composeMail(mailEnv, { body: '<script>alert(1)</script>', replyTo: 'hr@company.com', createdAt: 0 });
  assert.ok(html.text.indexOf('Reply to:') < html.text.indexOf('<script>'), 'trusted details come before the note');
  assert.equal(html.html, undefined);
  assert.ok(html.text.includes('<script>alert(1)</script>'), 'kept verbatim as text, never rendered');
  assert.equal(html.reply_to, 'hr@company.com');
  const loose = composeMail(mailEnv, { body: 'hi there friend', replyTo: 'linkedin.com/in/someone', createdAt: 0 });
  assert.equal(loose.reply_to, undefined);
  assert.ok(loose.text.includes('linkedin.com/in/someone'));
});

test('boards: place accounts for ties and the eight-slot limit', () => {
  const board = [900, 800, 700, 600, 500, 400, 300, 200].map((score) => ({ name: 'x', score }));
  assert.equal(placeFor(board, 1000), 1);
  assert.equal(placeFor(board, 800), 3); // a tie sits below the older entry
  assert.equal(placeFor(board, 250), 8);
  assert.equal(placeFor(board, 100), 0);
  assert.equal(placeFor([], 5), 1);
  assert.equal(placeFor([], 0), 0);
});

test('origin: only the site may write, and CORS echoes only allowed origins', () => {
  const req = (origin) => new Request('https://api.example/runs', { method: 'POST', headers: origin ? { Origin: origin } : {} });
  assert.doesNotThrow(() => requireSiteOrigin(req('https://shafwan.in'), env));
  assert.throws(() => requireSiteOrigin(req('https://evil.example'), env), { status: 403 });
  assert.throws(() => requireSiteOrigin(req(null), env), { status: 403 });
  assert.equal(corsHeaders(req('https://shafwan.in'), env)['Access-Control-Allow-Origin'], 'https://shafwan.in');
  assert.deepEqual(corsHeaders(req('https://evil.example'), env), {});
});
