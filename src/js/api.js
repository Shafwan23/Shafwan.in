/*
 * Talks to shafwan-api (a Cloudflare Worker). Scores are computed there, never
 * here; this module only carries moves, a play session and contact notes.
 * The human check is Cloudflare Turnstile, loaded only when first needed.
 */

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 12000;
const SESSION_MARGIN_MS = 60000;

/** False until the Worker URL and Turnstile site key are configured at build time. */
export const apiReady = /^https?:\/\/[^/]+/.test(API_URL) && !API_URL.includes('REPLACE') && SITEKEY.length > 10;

export class ApiFailure extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const OFFLINE = () => new ApiFailure(0, 'offline', 'The score server could not be reached.');

async function request(path, { body, auth, method = 'POST' } = {}) {
  if (!apiReady) throw OFFLINE();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const headers = {};
  if (method !== 'GET') headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${auth}`;
  let res;
  try {
    res = await fetch(API_URL + path, {
      method, headers, signal: ctrl.signal, credentials: 'omit',
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw OFFLINE();
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty or not JSON */ }
  if (!res.ok) {
    throw new ApiFailure(res.status, data?.error || 'server', data?.message || 'The server could not do that just now.');
  }
  return data;
}

/* ---------- Turnstile ---------- */

let turnstileLoading = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoading) {
    turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_SRC;
      s.async = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('no turnstile')));
      s.onerror = () => reject(new Error('turnstile blocked'));
      document.head.append(s);
    }).catch((err) => {
      turnstileLoading = null;
      throw err;
    });
  }
  return turnstileLoading;
}

/** Floating slot for the Lab; Turnstile only shows it if it needs the visitor to click. */
function floatingSlot() {
  let el = document.getElementById('humanCheck');
  if (!el) {
    el = document.createElement('div');
    el.id = 'humanCheck';
    el.className = 'human-check';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Human check');
    document.body.append(el);
  }
  return el;
}

/**
 * Runs a Turnstile check and resolves with its single-use token.
 * @param {HTMLElement} [slot] where the widget may appear if it needs a click
 */
export async function humanToken(slot = floatingSlot()) {
  let ts;
  try {
    ts = await loadTurnstile();
  } catch {
    throw new ApiFailure(0, 'captcha', 'The human check could not load. A blocker may be stopping it.');
  }
  return new Promise((resolve, reject) => {
    let id = null;
    const done = (fn, value) => {
      if (id !== null) { try { ts.remove(id); } catch { /* already gone */ } }
      slot.classList.remove('is-asking');
      fn(value);
    };
    id = ts.render(slot, {
      sitekey: SITEKEY,
      theme: 'dark',
      appearance: 'interaction-only',
      'before-interactive-callback': () => slot.classList.add('is-asking'),
      callback: (token) => done(resolve, token),
      'error-callback': () => done(reject, new ApiFailure(0, 'captcha', 'The human check failed. Reload and try again.')),
      'timeout-callback': () => done(reject, new ApiFailure(0, 'captcha', 'The human check timed out. Try again.')),
    });
  });
}

/* ---------- play sessions ---------- */

let session = null;
let sessionPending = null;

async function sessionToken() {
  if (session && session.expiresAt - Date.now() > SESSION_MARGIN_MS) return session.token;
  if (!sessionPending) {
    sessionPending = (async () => {
      const turnstileToken = await humanToken();
      session = await request('/session', { body: { turnstileToken } });
      return session.token;
    })().finally(() => { sessionPending = null; });
  }
  return sessionPending;
}

/** Starts the human check early so the first run does not wait on it. */
export function warmSession() {
  if (apiReady) sessionToken().catch(() => { /* surfaced when a run actually starts */ });
}

/** An authenticated game call; renews the session once if it lapsed. */
export async function play(path, body) {
  try {
    return await request(path, { body, auth: await sessionToken() });
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 401) {
      session = null;
      return request(path, { body, auth: await sessionToken() });
    }
    throw err;
  }
}

export const getBoards = () => request('/boards', { method: 'GET' });

export const sendNote = (note) => request('/contact', { body: note });
