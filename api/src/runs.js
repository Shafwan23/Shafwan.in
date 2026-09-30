/* Run storage. A run's state lives only here; the browser holds just its id. */

import { ApiError } from './http.js';
import { randomId } from './security.js';

export const RUN_TTL_MS = 30 * 60 * 1000;

export async function createRun(env, game, state, now = Date.now()) {
  const id = randomId();
  await env.DB
    .prepare('INSERT INTO runs (id, game, state, step, status, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)')
    .bind(id, game, JSON.stringify(state), 'live', now, now)
    .run();
  return id;
}

/** Loads a run, insisting on its game and status and that it has not expired. */
export async function loadRun(env, id, { game, status }, now = Date.now()) {
  if (typeof id !== 'string' || !/^[0-9a-f]{32}$/.test(id)) {
    throw new ApiError(404, 'no_run', 'That run was not found.');
  }
  const row = await env.DB.prepare('SELECT * FROM runs WHERE id = ?').bind(id).first();
  if (!row || (game && row.game !== game)) throw new ApiError(404, 'no_run', 'That run was not found.');
  if (now - row.created_at > RUN_TTL_MS) throw new ApiError(410, 'run_expired', 'That run expired. Start a new one.');
  if (row.status !== status) throw new ApiError(409, 'run_state', 'That run is already finished.');
  return { ...row, state: JSON.parse(row.state) };
}

/**
 * Saves a run only if nobody else moved it first, so a replayed or doubled
 * request cannot score the same answer twice.
 */
export async function saveRun(env, run, { state, status, score = null }, now = Date.now()) {
  const result = await env.DB
    .prepare('UPDATE runs SET state = ?, status = ?, score = ?, step = step + 1, updated_at = ? WHERE id = ? AND step = ?')
    .bind(JSON.stringify(state), status, score, now, run.id, run.step)
    .run();
  if (result.meta.changes !== 1) throw new ApiError(409, 'run_state', 'That run moved on already.');
}
