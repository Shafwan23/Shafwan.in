/*
 * Bitwise: sixty seconds of eight-bit targets. The server deals the rounds and
 * re-scores the run from the solve times the browser reports, so the score the
 * browser shows is never trusted. Each round has a floor time a human cannot
 * beat; faster claims are counted at the floor and still spend the clock.
 */

import { ApiError } from '../http.js';
import { randomInt } from '../security.js';
import { answerOf, dealRounds as dealShared, roundPoints } from '../shared/bitwise-rules.js';

export const RUN_MS = 60000;
const ROUND_COUNT = 160;
const CLOCK_SLACK_MS = 1500;   /* network and timer jitter between browser and server */

/* the quickest a person can read each kind of target, and then each switch flip */
const READ_FLOOR_MS = { dec: 450, hex: 400, and: 700, or: 700, xor: 700, shl: 500, shr: 500, not: 500 };
const FLIP_FLOOR_MS = 45;

/** A run's rounds, dealt from the platform CSPRNG. */
export const dealRounds = (rand = randomInt, count = ROUND_COUNT) => dealShared(rand, count);

const popcount = (v) => v.toString(2).replace(/0/g, '').length;

/** Fewest switch presses from one value to the next: flip the difference, or clear and rebuild. */
export function minFlips(from, to) {
  return Math.min(popcount(from ^ to), 1 + popcount(to));
}

export function floorMs(round, heldBefore) {
  return READ_FLOOR_MS[round.k] + FLIP_FLOOR_MS * minFlips(heldBefore, answerOf(round));
}

function assertSolveTimes(solves, rounds, serverElapsedMs) {
  if (!Array.isArray(solves) || solves.length > rounds.length) {
    throw new ApiError(400, 'bad_run', 'That run could not be read.');
  }
  let prev = -1;
  for (const t of solves) {
    const readable = typeof t === 'number' && Number.isFinite(t);
    if (!readable || t < 0 || t <= prev || t > RUN_MS + CLOCK_SLACK_MS) {
      throw new ApiError(400, 'bad_run', 'That run could not be read.');
    }
    prev = t;
  }
  if (solves.length && prev > serverElapsedMs + CLOCK_SLACK_MS) {
    throw new ApiError(400, 'bad_run', 'That run finished faster than the clock allows.');
  }
}

/**
 * Scores a run from the browser's solve times (ms since the run began, one per
 * solved round, in order). Throws on anything malformed or impossible.
 * @param {object[]} rounds dealt by the server
 * @param {unknown} solves reported by the browser
 * @param {number} serverElapsedMs time the server has seen pass since the run began
 */
export function scoreRun(rounds, solves, serverElapsedMs) {
  assertSolveTimes(solves, rounds, serverElapsedMs);
  let score = 0, solved = 0, clock = 0, last = 0, held = 0;
  for (let i = 0; i < solves.length; i++) {
    const round = rounds[i];
    const took = Math.max(solves[i] - last, floorMs(round, held));
    clock += took;
    if (clock > RUN_MS) break;
    if (clock > serverElapsedMs + CLOCK_SLACK_MS) {
      throw new ApiError(400, 'bad_run', 'That run finished faster than the clock allows.');
    }
    solved++;
    score += roundPoints(took, solved);
    last = solves[i];
    held = answerOf(round);
  }
  return { score, solved };
}

export const bitwise = {
  start() {
    const rounds = dealRounds();
    return { state: { rounds }, reply: { rounds, runMs: RUN_MS } };
  },
  finish(state, body, { serverElapsedMs }) {
    const { score, solved } = scoreRun(state.rounds, body.solves, serverElapsedMs);
    return { score, detail: { solved } };
  },
};
