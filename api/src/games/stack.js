/*
 * Stack: repeat a growing sequence of four tiles. The server deals the whole
 * sequence and re-scores the run from the taps and times the browser reports;
 * the score the browser shows is only a live readout.
 */

import { ApiError } from '../http.js';
import { randomInt } from '../security.js';
import {
  LEVEL_PAUSE_MS, MAX_LEVELS, TAP_FLOOR_MS, TILES, dealSequence, lengthAt, levelPoints, showPhaseMs,
} from '../shared/stack-rules.js';

const CLOCK_SLACK_MS = 1500;
const MAX_RUN_MS = 20 * 60 * 1000;
const MAX_TAPS = Array.from({ length: MAX_LEVELS }, (_, i) => lengthAt(i + 1)).reduce((a, b) => a + b, 0);

function assertTaps(taps, serverElapsedMs) {
  if (!Array.isArray(taps) || taps.length > MAX_TAPS) {
    throw new ApiError(400, 'bad_run', 'That run could not be read.');
  }
  let prev = -1;
  for (const tap of taps) {
    const keyOk = tap && Number.isInteger(tap.k) && tap.k >= 0 && tap.k < TILES;
    const timeOk = tap && typeof tap.t === 'number' && Number.isFinite(tap.t) && tap.t >= 0 && tap.t > prev && tap.t <= MAX_RUN_MS;
    if (!keyOk || !timeOk) throw new ApiError(400, 'bad_run', 'That run could not be read.');
    prev = tap.t;
  }
  if (taps.length && prev > serverElapsedMs + CLOCK_SLACK_MS) {
    throw new ApiError(400, 'bad_run', 'That run finished faster than the clock allows.');
  }
}

/**
 * Replays the taps ({ k: tile, t: ms since the run began }) level by level.
 * A level is cleared when its whole sequence is tapped in order; the first
 * wrong tap ends the run. The speed bonus counts time between taps, floored
 * at a human pace, and the run as a whole cannot outrun the server's clock.
 */
export function scoreRun(sequence, taps, serverElapsedMs) {
  assertTaps(taps, serverElapsedMs);
  let score = 0, depth = 0, clock = 0, at = 0, failed = null;

  for (let level = 1; level <= MAX_LEVELS && !failed; level++) {
    const length = lengthAt(level);
    const slice = taps.slice(at, at + length);
    if (slice.length === 0) break;                       /* the run stopped before this level */
    clock += showPhaseMs(level);

    const wrong = slice.findIndex((tap, i) => tap.k !== sequence[i]);
    if (wrong !== -1) {
      failed = { level, step: wrong + 1, expected: sequence[wrong], got: slice[wrong].k };
      break;
    }
    if (slice.length < length) break;                    /* gave up mid-level: not cleared */

    const took = Math.max(slice[length - 1].t - slice[0].t, (length - 1) * TAP_FLOOR_MS);
    clock += took + (level > 1 ? LEVEL_PAUSE_MS : 0);
    if (clock > serverElapsedMs + CLOCK_SLACK_MS) {
      throw new ApiError(400, 'bad_run', 'That run finished faster than the clock allows.');
    }
    score += levelPoints(took, length);
    depth = level;
    at += length;
  }
  return { score, depth, failed };
}

export const stack = {
  start() {
    const sequence = dealSequence(randomInt);
    return { state: { sequence }, reply: { sequence, levels: MAX_LEVELS } };
  },
  finish(state, body, { serverElapsedMs }) {
    const { score, depth, failed } = scoreRun(state.sequence, body.taps, serverElapsedMs);
    return { score, detail: { depth, failed } };
  },
};
