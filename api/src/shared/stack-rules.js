/*
 * Stack round rules, shared by the Worker (which deals and scores runs) and the
 * Lab page (which plays them, and deals its own in practice mode).
 *
 * Four tiles light up in a sequence; repeat it. Every level the sequence grows
 * by one. A mistake ends the run. Pure functions only: this file ships to browsers.
 */

export const TILES = 4;
export const START_LEN = 3;              /* level 1 shows three tiles */
export const MAX_LEVELS = 15;            /* level 15 shows seventeen */
export const SHOW_MS = 520;              /* a tile stays lit this long at level 1... */
export const SHOW_MIN_MS = 300;          /* ...and never less than this */
export const GAP_MS = 160;               /* dark gap between lit tiles */
export const LEVEL_PAUSE_MS = 900;       /* breather after a cleared level */
export const TAP_FLOOR_MS = 220;         /* nobody taps two tiles faster than this */
export const TAP_ALLOWED_MS = 1400;      /* per tile, before the speed bonus is gone */
export const BASE_POINTS = 100;
export const BONUS_POINTS = 50;

export const lengthAt = (level) => START_LEN + level - 1;
export const showMsAt = (level) => Math.max(SHOW_MIN_MS, SHOW_MS - (level - 1) * 20);
/** How long the machine spends showing a level's sequence. */
export const showPhaseMs = (level) => lengthAt(level) * (showMsAt(level) + GAP_MS);
/** The most points a full run can earn. */
export const MAX_SCORE = MAX_LEVELS * (BASE_POINTS + BONUS_POINTS);

/** @param {(n: number) => number} rand integer in [0, n) */
export const dealSequence = (rand, length = lengthAt(MAX_LEVELS)) =>
  Array.from({ length }, () => rand(TILES));

/**
 * Points for one cleared level, from the time between its first and last tap.
 * The floor is the fastest a person can tap the tiles; the bonus is gone past
 * the allowed time. Both scale with the sequence length.
 */
export function levelPoints(tookMs, length) {
  const gaps = Math.max(1, length - 1);
  const floor = gaps * TAP_FLOOR_MS;
  const allowed = gaps * TAP_ALLOWED_MS;
  const left = Math.min(1, Math.max(0, (allowed - tookMs) / (allowed - floor)));
  return BASE_POINTS + Math.round(BONUS_POINTS * left);
}
