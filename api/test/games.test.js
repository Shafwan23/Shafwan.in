import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RUN_MS, dealRounds, floorMs, minFlips, scoreRun } from '../src/games/bitwise.js';
import { WPM_CEILING, scoreLine } from '../src/games/keystroke.js';
import { PER_Q_MS, answerRun, startRun } from '../src/games/compile.js';
import { BANK } from '../src/games/compile-bank.js';
import { answerOf, roundPoints } from '../src/shared/bitwise-rules.js';

const badRun = (fn) => assert.throws(fn, (e) => e.status === 400 && e.code === 'bad_run');

/* ---------- bitwise ---------- */

test('bitwise: dealt rounds never repeat the value already held', () => {
  const rounds = dealRounds(undefined, 400);
  let held = 0;
  for (const r of rounds) {
    const v = answerOf(r);
    assert.ok(v >= 0 && v <= 255);
    assert.notEqual(v, held);
    held = v;
  }
});

test('bitwise: min flips is the cheaper of flipping or clearing', () => {
  assert.equal(minFlips(0, 0b1011), 3);
  assert.equal(minFlips(0b11111110, 0b00000001), 2); // clear, then one bit
  assert.equal(minFlips(0b1000, 0b1001), 1);
});

test('bitwise: honest human times score exactly as the page shows', () => {
  const rounds = [{ k: 'dec', v: 5 }, { k: 'hex', v: 200 }, { k: 'xor', a: 12, b: 3 }];
  const solves = [2000, 5000, 9000];
  const { score, solved } = scoreRun(rounds, solves, 60500);
  const expected = roundPoints(2000, 1) + roundPoints(3000, 2) + roundPoints(4000, 3);
  assert.equal(solved, 3);
  assert.equal(score, expected);
});

test('bitwise: superhuman times are counted at the floor, not taken at face value', () => {
  const rounds = dealRounds(undefined, 160);
  const instant = rounds.map((_, i) => i + 1); // one round per millisecond
  const { score, solved } = scoreRun(rounds, instant, RUN_MS + 1000);
  const floorOnly = rounds.slice(0, solved).reduce(
    (acc, r, i) => ({ held: answerOf(r), pts: acc.pts + roundPoints(floorMs(r, acc.held), i + 1) }),
    { held: 0, pts: 0 });
  assert.ok(solved < 160, 'the floor must stop a bot clearing every round');
  assert.equal(score, floorOnly.pts);
});

test('bitwise: a whole run cannot be claimed moments after it started', () => {
  const rounds = dealRounds(undefined, 160);
  const burst = rounds.map((_, i) => i); // every solve inside the first 160 ms
  badRun(() => scoreRun(rounds, burst, 100));
  badRun(() => scoreRun(rounds, burst.slice(0, 20), 5000)); // 20 floors need well over 5 s
});

test('bitwise: cannot report time that has not passed on the server', () => {
  const rounds = dealRounds(undefined, 10);
  badRun(() => scoreRun(rounds, [1000, 20000], 5000));
});

test('bitwise: rejects malformed solve lists', () => {
  const rounds = dealRounds(undefined, 3);
  badRun(() => scoreRun(rounds, 'lots', 60000));
  badRun(() => scoreRun(rounds, [1, 2, 3, 4], 60000));        // more solves than rounds
  badRun(() => scoreRun(rounds, [3000, 2000], 60000));        // out of order
  badRun(() => scoreRun(rounds, [1000, 1000], 60000));        // duplicate
  badRun(() => scoreRun(rounds, [-5], 60000));
  badRun(() => scoreRun(rounds, [NaN], 60000));
  badRun(() => scoreRun(rounds, [RUN_MS + 5000], 90000));     // past the run
});

test('bitwise: an empty run scores zero', () => {
  assert.deepEqual(scoreRun(dealRounds(undefined, 3), [], 60000), { score: 0, solved: 0 });
});

/* ---------- keystroke ---------- */

const LINE = 'x'.repeat(75); // 15 "words"

test('keystroke: honest run gives words per minute', () => {
  const { wpm, accuracy } = scoreLine(LINE, { elapsedMs: 15000, typed: 80, errors: 5 }, 16000);
  assert.equal(wpm, 60);
  assert.equal(accuracy, 94);
});

test('keystroke: anything past the human ceiling counts at the ceiling', () => {
  const { wpm } = scoreLine(LINE, { elapsedMs: 50, typed: 75, errors: 0 }, 60000);
  assert.equal(wpm, WPM_CEILING);
});

test('keystroke: cannot claim more time than passed on the server', () => {
  badRun(() => scoreLine(LINE, { elapsedMs: 30000, typed: 75, errors: 0 }, 5000));
});

test('keystroke: rejects impossible reports', () => {
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 10, errors: 0 }, 9000));   // fewer keys than the line
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 80, errors: 90 }, 9000));  // more errors than keys
  badRun(() => scoreLine(LINE, { elapsedMs: -1, typed: 80, errors: 0 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: '5000', typed: 80, errors: 0 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 1.5, errors: 0 }, 9000));
});

/* ---------- compile ---------- */

const rightChoice = (state) => state.perm.indexOf(BANK[state.order[state.idx]].i);
const wrongChoice = (state) => (rightChoice(state) + 1) % 4;

test('compile: the browser gets options but never the answer key', () => {
  const { state, question } = startRun(0);
  assert.equal(question.options.length, 4);
  assert.equal(question.total, BANK.length);
  assert.ok(!('i' in question) && !('rightIndex' in question));
  assert.ok(Array.isArray(state.perm));
});

test('compile: a right answer scores, time bonus comes from the server clock', () => {
  const { state } = startRun(0);
  const { reply } = answerRun(state, { choice: rightChoice(state), number: state.idx + 1 }, 3000);
  assert.equal(reply.right, true);
  assert.equal(reply.score, Math.round(100 + Math.round(((PER_Q_MS - 3000) / PER_Q_MS) * 120)));
  assert.equal(reply.lives, 3);
});

test('compile: answering faster than a person can read earns no extra bonus', () => {
  const { state } = startRun(0);
  const instant = answerRun(state, { choice: rightChoice(state), number: state.idx + 1 }, 5).reply.score;
  const human = answerRun(state, { choice: rightChoice(state), number: state.idx + 1 }, 1000).reply.score;
  assert.equal(instant, human);
});

test('compile: a late answer is wrong even if it picks the right option', () => {
  const { state } = startRun(0);
  const { reply } = answerRun(state, { choice: rightChoice(state), number: state.idx + 1 }, PER_Q_MS + 5000);
  assert.equal(reply.right, false);
  assert.equal(reply.late, true);
  assert.equal(reply.lives, 2);
});

test('compile: three misses end the run', () => {
  let { state } = startRun(0);
  let out;
  for (let i = 0; i < 3; i++) {
    out = answerRun(state, { choice: wrongChoice(state), number: state.idx + 1 }, state.askedAt + 2000);
    state = out.state;
  }
  assert.equal(out.done, true);
  assert.equal(out.reply.next, null);
  assert.equal(out.reply.lives, 0);
});

test('compile: a resent answer for an earlier question is refused', () => {
  const { state } = startRun(0);
  const first = answerRun(state, { choice: rightChoice(state), number: 1 }, 2000);
  assert.throws(() => answerRun(first.state, { choice: 0, number: 1 }, 2100), (e) => e.status === 409);
});

test('compile: rejects answers that are not an option', () => {
  const { state } = startRun(0);
  for (const bad of [4, -2, 1.5, '1', null]) {
    assert.throws(() => answerRun(state, { choice: bad, number: state.idx + 1 }, 1000), (e) => e.status === 400);
  }
});

test('compile: a perfect run clears the whole deck', () => {
  let { state } = startRun(0);
  let out;
  do {
    out = answerRun(state, { choice: rightChoice(state), number: state.idx + 1 }, state.askedAt + 2000);
    state = out.state;
  } while (!out.done);
  assert.equal(out.reply.solved, BANK.length);
  assert.equal(out.reply.lives, 3);
});
