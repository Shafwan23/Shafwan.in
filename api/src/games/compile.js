/*
 * Compile: timed recall, three lives. The answer key never leaves the server:
 * each question goes out with shuffled options, each answer is judged and timed
 * here, and the score is kept here.
 */

import { ApiError } from '../http.js';
import { randomInt, shuffle } from '../security.js';
import { BANK } from './compile-bank.js';

export const PER_Q_MS = 12000;
const LATE_GRACE_MS = 2500;      /* network time on top of the visible clock */
const FASTEST_HUMAN_MS = 1000;   /* no bonus for answering faster than a person can read */
const PAUSE_RIGHT_MS = 700;      /* the browser shows the verdict this long before the next question */
const PAUSE_WRONG_MS = 1500;
const LIVES = 3;

const chain = (streak) => Math.min(4, 1 + Math.floor(streak / 3) * 0.5);
const range = (n) => Array.from({ length: n }, (_, i) => i);

function ask(state, askedAt, rand) {
  return { ...state, perm: shuffle(range(4), rand), askedAt };
}

/** What the browser may see of the current question. */
function questionOf(state) {
  const item = BANK[state.order[state.idx]];
  return {
    category: item.c,
    html: item.q,
    options: state.perm.map((i) => item.a[i]),
    number: state.idx + 1,
    total: state.order.length,
  };
}

export function startRun(now, rand = randomInt) {
  const base = { order: shuffle(range(BANK.length), rand), idx: 0, score: 0, streak: 0, solved: 0, lives: LIVES };
  const state = ask(base, now, rand);
  return { state, question: questionOf(state) };
}

/**
 * Judges one answer. `choice` is the option position picked, or -1 for time out;
 * `number` is the question it answers, so a resent answer cannot land on the next one.
 * @returns {{ state: object, reply: object, done: boolean }}
 */
export function answerRun(state, { choice, number }, now, rand = randomInt) {
  if (!Number.isInteger(choice) || choice < -1 || choice > 3) {
    throw new ApiError(400, 'bad_answer', 'That answer could not be read.');
  }
  if (number !== state.idx + 1) {
    throw new ApiError(409, 'run_state', 'That question was already answered.');
  }
  const item = BANK[state.order[state.idx]];
  const rightIndex = state.perm.indexOf(item.i);
  const elapsed = now - state.askedAt;
  const late = elapsed > PER_Q_MS + LATE_GRACE_MS;
  const right = !late && choice === rightIndex;

  let { score, streak, solved, lives } = state;
  if (right) {
    const took = Math.min(PER_Q_MS, Math.max(FASTEST_HUMAN_MS, elapsed));
    streak++;
    solved++;
    score += Math.round((100 + Math.round(((PER_Q_MS - took) / PER_Q_MS) * 120)) * chain(streak));
  } else {
    streak = 0;
    lives--;
  }

  const idx = state.idx + 1;
  const done = lives <= 0 || idx >= state.order.length;
  const settled = { ...state, idx, score, streak, solved, lives };
  const next = done ? settled : ask(settled, now + (right ? PAUSE_RIGHT_MS : PAUSE_WRONG_MS), rand);

  return {
    state: next,
    done,
    reply: {
      right,
      late,
      rightIndex,
      rightText: item.a[item.i],
      score,
      chain: chain(streak),
      solved,
      lives,
      next: done ? null : questionOf(next),
    },
  };
}

export const compile = {
  start(_body, { now }) {
    const { state, question } = startRun(now);
    return { state, reply: { question, perQuestionMs: PER_Q_MS, lives: LIVES } };
  },
};
