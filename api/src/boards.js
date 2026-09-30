/* The public boards: best claimed score per name, top eight per game. */

export const GAMES = ['bitwise', 'compile', 'keystroke'];
export const BOARD_SIZE = 8;
const KEEP_PER_GAME = 60;      /* rows kept per game; every board read touches only these */
const CACHE_MS = 10000;
const cache = new Map();       /* per isolate, so repeat visits skip D1 */

const BOARD_SQL = `
  SELECT name, score FROM (
    SELECT name, score, created_at,
           ROW_NUMBER() OVER (PARTITION BY name_key ORDER BY score DESC, created_at ASC) AS nth
    FROM scores WHERE game = ?
  )
  WHERE nth = 1
  ORDER BY score DESC, created_at ASC
  LIMIT ${BOARD_SIZE}`;

/** @returns {Promise<{ name: string, score: number }[]>} */
export async function readBoard(env, game, { fresh = false } = {}) {
  const hit = cache.get(game);
  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
  const { results } = await env.DB.prepare(BOARD_SQL).bind(game).all();
  const rows = results.map((r) => ({ name: r.name, score: r.score }));
  cache.set(game, { rows, at: Date.now() });
  return rows;
}

/**
 * After a claim: keep only a name's best row, and only the top rows of the game,
 * so the table (and every board read) stays small however many runs land.
 */
export async function pruneBoard(env, game, nameKey) {
  const statements = [];
  if (nameKey) {
    statements.push(env.DB.prepare(`DELETE FROM scores WHERE game = ?1 AND name_key = ?2 AND id <> (
      SELECT id FROM scores WHERE game = ?1 AND name_key = ?2 ORDER BY score DESC, created_at ASC LIMIT 1)`).bind(game, nameKey));
  }
  statements.push(env.DB.prepare(`DELETE FROM scores WHERE game = ?1 AND id NOT IN (
    SELECT id FROM scores WHERE game = ?1 ORDER BY score DESC, created_at ASC LIMIT ?2)`).bind(game, KEEP_PER_GAME));
  await env.DB.batch(statements);
}

export async function readBoards(env) {
  const lists = await Promise.all(GAMES.map((g) => readBoard(env, g)));
  return Object.fromEntries(GAMES.map((g, i) => [g, lists[i]]));
}

/** 1-based place a new score would take (ties keep the older entry above), or 0. */
export function placeFor(board, score) {
  if (!(score > 0)) return 0;
  const place = board.filter((row) => row.score >= score).length + 1;
  return place <= BOARD_SIZE ? place : 0;
}
