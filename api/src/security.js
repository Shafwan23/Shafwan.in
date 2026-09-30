/* Sessions, Turnstile, IP hashing, rate limits and server-side randomness. */

import { ApiError } from './http.js';

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const encoder = new TextEncoder();

/* ---------- base64url ---------- */

const toB64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function fromB64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/* ---------- keyed hashing ---------- */

function requireSecret(env) {
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new ApiError(503, 'not_configured', 'The server is not configured yet.');
  }
  return secret;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** IPv6 visitors get a whole /64 to rotate through, so they are counted per /64. */
export function ipBucket(ip) {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const full = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return full.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

/** Keyed hash of the IP (or IPv6 /64), so the rate-limit ledger never holds a raw address. */
export async function hashIp(env, ip) {
  const key = await hmacKey(requireSecret(env));
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`ip:${ipBucket(ip)}`));
  return toB64Url(sig).slice(0, 22);
}

/* ---------- play sessions ---------- */

/**
 * A signed, stateless pass proving this browser solved a Turnstile check
 * recently, tied to the network it solved it on.
 */
export async function issueSession(env, ipHash, now = Date.now()) {
  const payload = toB64Url(encoder.encode(JSON.stringify({ v: 1, exp: now + SESSION_TTL_MS, ip: ipHash })));
  const key = await hmacKey(requireSecret(env));
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`session:${payload}`));
  return { token: `${payload}.${toB64Url(sig)}`, expiresAt: now + SESSION_TTL_MS };
}

export async function verifySession(env, header, ipHash, now = Date.now()) {
  const token = (header || '').replace(/^Bearer\s+/i, '');
  const [payload, sig] = token.split('.');
  if (!payload || !sig) throw new ApiError(401, 'session', 'Your play session is missing. Reload the page.');
  const key = await hmacKey(requireSecret(env));
  let valid = false;
  try {
    valid = await crypto.subtle.verify('HMAC', key, fromB64Url(sig), encoder.encode(`session:${payload}`));
  } catch {
    valid = false;
  }
  if (!valid) throw new ApiError(401, 'session', 'Your play session is not valid. Reload the page.');
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(fromB64Url(payload)));
  } catch {
    throw new ApiError(401, 'session', 'Your play session is not valid. Reload the page.');
  }
  if (!data || typeof data.exp !== 'number' || data.exp < now || data.ip !== ipHash) {
    throw new ApiError(401, 'session_expired', 'Your play session expired.');
  }
  return data;
}

/* ---------- Turnstile ---------- */

/** Confirms a Turnstile token with Cloudflare. Tokens are single use. */
export async function verifyTurnstile(env, token, ip, fetchImpl = fetch) {
  if (!env.TURNSTILE_SECRET) throw new ApiError(503, 'not_configured', 'The server is not configured yet.');
  if (typeof token !== 'string' || !token || token.length > 2048) {
    throw new ApiError(400, 'captcha', 'The human check did not come through. Try again.');
  }
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  let outcome;
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
    outcome = await res.json();
  } catch {
    throw new ApiError(502, 'captcha_unreachable', 'The human check could not be verified right now.');
  }
  if (!outcome || outcome.success !== true) {
    throw new ApiError(403, 'captcha', 'The human check failed. Reload the page and try again.');
  }
}

/* ---------- rate limits ---------- */

/**
 * Counts this IP's hits in a bucket over a window and records the new one.
 * @param {{ limit: number, windowMs: number, message: string }} rule
 */
export async function rateLimit(env, bucket, ipHash, rule, now = Date.now()) {
  /* count and record in one statement, so parallel requests cannot all slip under the limit */
  const result = await env.DB
    .prepare(`INSERT INTO hits (bucket, ip_hash, at)
      SELECT ?1, ?2, ?3
      WHERE (SELECT COUNT(*) FROM hits WHERE bucket = ?1 AND ip_hash = ?2 AND at > ?4) < ?5`)
    .bind(bucket, ipHash, now, now - rule.windowMs, rule.limit)
    .run();
  if (result.meta.changes !== 1) throw new ApiError(429, 'rate_limited', rule.message);
}

/** A cap shared by everyone, for things like total mail per day. */
export const globalLimit = (env, bucket, rule, now = Date.now()) => rateLimit(env, bucket, '-', rule, now);

/* ---------- randomness ---------- */

/** Unbiased integer in [0, n) from the platform CSPRNG. */
export function randomInt(n) {
  if (!(n > 0) || n > 2 ** 32) throw new RangeError('randomInt range');
  const limit = Math.floor(2 ** 32 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}

export function shuffle(list, rand = randomInt) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
