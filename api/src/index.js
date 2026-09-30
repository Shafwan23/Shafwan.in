/* shafwan-api: verified Lab leaderboards and the anonymous contact note. */

import { ApiError, clientIp, corsHeaders, json, readJson, requireSiteOrigin } from './http.js';
import { hashIp, issueSession, rateLimit, verifySession, verifyTurnstile } from './security.js';
import { GAMES, placeFor, pruneBoard, readBoard, readBoards } from './boards.js';
import { createRun, loadRun, saveRun } from './runs.js';
import { cleanName } from './names.js';
import { retryUndelivered, submitNote } from './contact.js';
import { stack } from './games/stack.js';
import { compile, answerRun } from './games/compile.js';
import { keystroke } from './games/keystroke.js';

const HANDLERS = { stack, compile, keystroke };
const HOUR = 60 * 60 * 1000;
const SESSION_LIMIT = { limit: 30, windowMs: HOUR, message: 'Too many sessions from here. Try again later.' };
const RUN_LIMIT = { limit: 150, windowMs: HOUR, message: 'That is a lot of runs. Take a breather and try again later.' };
const PRUNE_HITS_MS = 2 * 24 * HOUR;
const PRUNE_RUNS_MS = 24 * HOUR;

/* ---------- routes ---------- */

async function startSession(request, env, ctx) {
  const body = await readJson(request);
  await rateLimit(env, 'session', ctx.ipHash, SESSION_LIMIT);
  await verifyTurnstile(env, body.turnstileToken, ctx.ip);
  return json(await issueSession(env, ctx.ipHash));
}

async function startRun(request, env, ctx) {
  await verifySession(env, request.headers.get('Authorization'), ctx.ipHash);
  const body = await readJson(request);
  const game = body.game;
  if (!GAMES.includes(game)) throw new ApiError(400, 'bad_game', 'Unknown game.');
  await rateLimit(env, 'run', ctx.ipHash, RUN_LIMIT);
  const now = Date.now();
  const { state, reply } = HANDLERS[game].start(body, { now });
  const runId = await createRun(env, game, state, now);
  return json({ runId, ...reply });
}

/** Stores the final score and says where it would place. */
async function settle(env, run, state, score) {
  await saveRun(env, run, { state, status: 'scored', score });
  const board = await readBoard(env, run.game);
  return { score, place: placeFor(board, score) };
}

async function answer(request, env, ctx, runId) {
  await verifySession(env, request.headers.get('Authorization'), ctx.ipHash);
  const body = await readJson(request);
  const now = Date.now();
  const run = await loadRun(env, runId, { game: 'compile', status: 'live' }, now);
  const { state, reply, done } = answerRun(run.state, body, now);
  if (!done) {
    await saveRun(env, run, { state, status: 'live' }, now);
    return json(reply);
  }
  return json({ ...reply, final: await settle(env, run, state, state.score) });
}

async function finish(request, env, ctx, runId) {
  await verifySession(env, request.headers.get('Authorization'), ctx.ipHash);
  const body = await readJson(request);
  const now = Date.now();
  const game = body.game;
  if (game !== 'stack' && game !== 'keystroke') throw new ApiError(400, 'bad_game', 'Unknown game.');
  const run = await loadRun(env, runId, { game, status: 'live' }, now);
  const { score, detail } = HANDLERS[game].finish(run.state, body, { serverElapsedMs: now - run.created_at });
  return json({ ...detail, final: await settle(env, run, run.state, score) });
}

async function claim(request, env, ctx, runId) {
  await verifySession(env, request.headers.get('Authorization'), ctx.ipHash);
  const body = await readJson(request);
  const now = Date.now();
  const run = await loadRun(env, runId, { status: 'scored' }, now);
  const { name, key } = cleanName(body.name);
  if (!(run.score > 0)) throw new ApiError(409, 'no_score', 'A score of zero does not go on the board.');

  /* run_id is UNIQUE, so the insert itself is what makes a claim happen once */
  try {
    await env.DB
      .prepare('INSERT INTO scores (game, name, name_key, score, run_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(run.game, name, key ?? `anon:${run.id}`, run.score, run.id, now)
      .run();
  } catch (err) {
    if (/UNIQUE/i.test(String(err?.message))) throw new ApiError(409, 'run_state', 'That run is already on the board.');
    throw err;
  }
  await saveRun(env, run, { state: run.state, status: 'claimed', score: run.score }, now)
    .catch(() => { /* the score row is what counts; the run is pruned within a day */ });
  await pruneBoard(env, run.game, key);

  const board = await readBoard(env, run.game, { fresh: true });
  const place = board.findIndex((row) => row.name === name && row.score === run.score) + 1;
  return json({ name, place, board });
}

async function note(request, env, ctx) {
  const body = await readJson(request);
  const { queued } = await submitNote(env, body, ctx);
  return json({ ok: true, queued });
}

/* ---------- dispatch ---------- */

async function route(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'GET' && pathname === '/') return json({ ok: true, service: 'shafwan-api' });
  if (request.method === 'GET' && pathname === '/boards') {
    return json(await readBoards(env), { cache: 'public, max-age=10' });
  }
  if (request.method !== 'POST') throw new ApiError(404, 'not_found', 'Not found.');

  requireSiteOrigin(request, env);
  const ip = clientIp(request);
  const ctx = { ip, ipHash: await hashIp(env, ip) };

  if (pathname === '/session') return startSession(request, env, ctx);
  if (pathname === '/runs') return startRun(request, env, ctx);
  if (pathname === '/contact') return note(request, env, ctx);

  const match = pathname.match(/^\/runs\/([0-9a-f]{32})\/(answer|finish|claim)$/);
  if (match) {
    const [, runId, action] = match;
    if (action === 'answer') return answer(request, env, ctx, runId);
    if (action === 'finish') return finish(request, env, ctx, runId);
    return claim(request, env, ctx, runId);
  }
  throw new ApiError(404, 'not_found', 'Not found.');
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const res = await route(request, env);
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: err.code, message: err.message }, { status: err.status, headers: cors });
      }
      console.error('unhandled', err instanceof Error ? err.stack : err);
      return json({ error: 'server', message: 'Something went wrong on the server.' }, { status: 500, headers: cors });
    }
  },

  /* housekeeping, every 15 minutes */
  async scheduled(_event, env) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM hits WHERE at < ?').bind(now - PRUNE_HITS_MS),
      env.DB.prepare('DELETE FROM runs WHERE created_at < ?').bind(now - PRUNE_RUNS_MS),
    ]);
    await retryUndelivered(env);
  },
};
