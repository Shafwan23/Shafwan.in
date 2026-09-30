import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreRun } from '../src/games/stack.js';
import { LEVEL_PAUSE_MS, MAX_LEVELS, MAX_SCORE, TAP_FLOOR_MS, TILES, dealSequence, lengthAt, levelPoints, showPhaseMs } from '../src/shared/stack-rules.js';
import { WPM_CEILING, keystroke, scoreLine } from '../src/games/keystroke.js';
import { LANGS, LINES } from '../src/shared/keystroke-texts.js';
import { BASE_POINTS, BONUS_POINTS, DECK_SIZE, PER_Q_MS, answerRun, pointsFor, startRun } from '../src/games/compile.js';
import { BANK } from '../src/games/compile-bank.js';
import { randomInt } from '../src/security.js';

const badRun = (fn) => assert.throws(fn, (e) => e.status === 400 && e.code === 'bad_run');

/* ---------- stack ---------- */

/** Taps for an honest run that clears `levels` levels, `gapMs` between taps. */
function honestTaps(sequence, levels, gapMs = 400) {
  const taps = [];
  let t = 0;
  for (let level = 1; level <= levels; level++) {
    const len = lengthAt(level);
    t += showPhaseMs(level) + 300;
    for (let i = 0; i < len; i++) { taps.push({ k: sequence[i], t }); t += gapMs; }
    t += LEVEL_PAUSE_MS;
  }
  return { taps, elapsed: t };
}

test('stack: a dealt sequence is long enough for every level and uses the four tiles', () => {
  const seq = dealSequence(randomInt);
  assert.equal(seq.length, lengthAt(MAX_LEVELS));
  assert.ok(seq.every((k) => Number.isInteger(k) && k >= 0 && k < TILES));
});

test('stack: level points reward speed with a floor', () => {
  assert.equal(levelPoints((3 - 1) * TAP_FLOOR_MS, 3), 150);
  assert.equal(levelPoints(10, 3), 150, 'faster than the floor earns no more');
  assert.equal(levelPoints(60000, 3), 100);
  assert.ok(levelPoints(1500, 3) > 100 && levelPoints(1500, 3) < 150);
  assert.equal(MAX_SCORE, MAX_LEVELS * 150);
});

test('stack: an honest run scores every cleared level', () => {
  const seq = dealSequence(randomInt);
  const { taps, elapsed } = honestTaps(seq, 4);
  const { score, depth, failed } = scoreRun(seq, taps, elapsed);
  assert.equal(depth, 4);
  assert.equal(failed, null);
  const expected = [1, 2, 3, 4].reduce((sum, level) => sum + levelPoints((lengthAt(level) - 1) * 400, lengthAt(level)), 0);
  assert.equal(score, expected);
});

test('stack: the first wrong tap ends the run and is reported', () => {
  const seq = dealSequence(randomInt);
  const { taps, elapsed } = honestTaps(seq, 2);
  const bad = { k: (seq[1] + 1) % TILES, t: taps[taps.length - 1].t + 2000 };
  const level3 = [{ k: seq[0], t: bad.t - 400 }, bad];
  const { depth, failed } = scoreRun(seq, [...taps, ...level3], elapsed + 5000);
  assert.equal(depth, 2);
  assert.deepEqual(failed, { level: 3, step: 2, expected: seq[1], got: bad.k });
});

test('stack: a level left unfinished does not count', () => {
  const seq = dealSequence(randomInt);
  const { taps, elapsed } = honestTaps(seq, 1);
  const partial = [{ k: seq[0], t: elapsed + 3000 }, { k: seq[1], t: elapsed + 3400 }];
  const { depth } = scoreRun(seq, [...taps, ...partial], elapsed + 5000);
  assert.equal(depth, 1);
});

test('stack: a whole run cannot land before its show phases have played', () => {
  const seq = dealSequence(randomInt);
  const burst = [];
  let t = 0;
  for (let level = 1; level <= 5; level++) for (let i = 0; i < lengthAt(level); i++) burst.push({ k: seq[i], t: ++t });
  badRun(() => scoreRun(seq, burst, 3000));
  const { score, depth } = scoreRun(seq, burst, 60000);
  assert.equal(depth, 5);
  assert.equal(score, 5 * 150, 'instant taps are floored, never rewarded beyond the floor');
});

test('stack: rejects malformed taps', () => {
  const seq = dealSequence(randomInt);
  badRun(() => scoreRun(seq, 'lots', 60000));
  badRun(() => scoreRun(seq, [{ k: 4, t: 100 }], 60000));
  badRun(() => scoreRun(seq, [{ k: 0, t: 300 }, { k: 0, t: 200 }], 60000));
  badRun(() => scoreRun(seq, [{ k: 0, t: NaN }], 60000));
  badRun(() => scoreRun(seq, [{ k: '1', t: 100 }], 60000));
  badRun(() => scoreRun(seq, [{ k: 0, t: 30000 }], 5000));
  badRun(() => scoreRun(seq, Array.from({ length: 200 }, (_, i) => ({ k: 0, t: i + 1 })), 60000));
  assert.deepEqual(scoreRun(seq, [], 1000), { score: 0, depth: 0, failed: null });
});

/* ---------- keystroke ---------- */

const LINE = 'x'.repeat(75); // 15 "words"

test('keystroke: every language has real, typeable lines', () => {
  assert.deepEqual(LANGS, ['java', 'javascript', 'python', 'cpp']);
  for (const lang of LANGS) {
    assert.ok(LINES[lang].length >= 5);
    for (const line of LINES[lang]) {
      assert.ok(line.length >= 30 && line.length <= 90, `${lang}: ${line}`);
      assert.match(line, /^[\x20-\x7E]+$/, 'ASCII only');
    }
  }
});

test('keystroke: start needs a known language and line', () => {
  assert.deepEqual(keystroke.start({ lang: 'python', line: 0 }).reply, { lang: 'python', line: 0 });
  assert.throws(() => keystroke.start({ lang: 'rust', line: 0 }), { status: 400 });
  assert.throws(() => keystroke.start({ lang: 'java', line: 99 }), { status: 400 });
  assert.throws(() => keystroke.start({ lang: 'java', line: '0' }), { status: 400 });
});

test('keystroke: honest run gives words per minute', () => {
  const { wpm, accuracy } = scoreLine(LINE, { elapsedMs: 15000, typed: 80, errors: 5 }, 16000);
  assert.equal(wpm, 60);
  assert.equal(accuracy, 94);
});

test('keystroke: anything past the human ceiling counts at the ceiling', () => {
  assert.equal(scoreLine(LINE, { elapsedMs: 50, typed: 75, errors: 0 }, 60000).wpm, WPM_CEILING);
});

test('keystroke: cannot claim more time than passed on the server', () => {
  badRun(() => scoreLine(LINE, { elapsedMs: 30000, typed: 75, errors: 0 }, 5000));
});

test('keystroke: rejects impossible reports', () => {
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 10, errors: 0 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 80, errors: 90 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: -1, typed: 80, errors: 0 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: '5000', typed: 80, errors: 0 }, 9000));
  badRun(() => scoreLine(LINE, { elapsedMs: 5000, typed: 1.5, errors: 0 }, 9000));
});

/* ---------- compile ---------- */

const rightChoice = (state) => state.perm.indexOf(BANK[state.order[state.idx]].i);
const wrongChoice = (state) => (rightChoice(state) + 1) % 4;
const answer = (state, choice, now) => answerRun(state, { choice, number: state.idx + 1 }, now);

test('compile: a run is twenty questions drawn from the bank, no answer key sent', () => {
  const { state, question } = startRun(0);
  assert.equal(state.order.length, DECK_SIZE);
  assert.equal(new Set(state.order).size, DECK_SIZE, 'no repeats');
  assert.equal(question.total, DECK_SIZE);
  assert.equal(question.options.length, 4);
  assert.ok(!('i' in question) && !('rightIndex' in question));
});

test('compile: points are 100 plus a speed bonus that fades over the clock', () => {
  assert.equal(pointsFor(0), BASE_POINTS + BONUS_POINTS);
  assert.equal(pointsFor(1000), BASE_POINTS + BONUS_POINTS, 'no extra for beating a human reading time');
  assert.equal(pointsFor(PER_Q_MS), BASE_POINTS);
  assert.equal(pointsFor(6500), 150);
});

test('compile: a right answer scores by the server clock, a wrong one costs a life', () => {
  const { state } = startRun(0);
  const ok = answer(state, rightChoice(state), 3000).reply;
  assert.equal(ok.right, true);
  assert.equal(ok.points, pointsFor(3000));
  assert.equal(ok.score, pointsFor(3000));
  assert.equal(ok.lives, 3);
  const no = answer(state, wrongChoice(state), 3000).reply;
  assert.equal(no.right, false);
  assert.equal(no.points, 0);
  assert.equal(no.lives, 2);
  assert.equal(no.rightText, BANK[state.order[0]].a[0]);
});

test('compile: a late answer is wrong even if it picks the right option', () => {
  const { state } = startRun(0);
  const { reply } = answer(state, rightChoice(state), PER_Q_MS + 5000);
  assert.equal(reply.right, false);
  assert.equal(reply.late, true);
});

test('compile: three misses end the run', () => {
  let { state } = startRun(0);
  let out;
  for (let i = 0; i < 3; i++) { out = answer(state, wrongChoice(state), state.askedAt + 2000); state = out.state; }
  assert.equal(out.done, true);
  assert.equal(out.reply.next, null);
  assert.equal(out.reply.lives, 0);
});

test('compile: a resent answer for an earlier question is refused', () => {
  const { state } = startRun(0);
  const first = answer(state, rightChoice(state), 2000);
  assert.throws(() => answerRun(first.state, { choice: 0, number: 1 }, 2100), (e) => e.status === 409);
});

test('compile: rejects answers that are not an option', () => {
  const { state } = startRun(0);
  for (const bad of [4, -2, 1.5, '1', null]) assert.throws(() => answer(state, bad, 1000), (e) => e.status === 400);
});

test('compile: a perfect run clears twenty questions for at most 4000', () => {
  let { state } = startRun(0);
  let out;
  do { out = answer(state, rightChoice(state), state.askedAt + 500); state = out.state; } while (!out.done);
  assert.equal(out.reply.solved, DECK_SIZE);
  assert.equal(out.reply.score, DECK_SIZE * (BASE_POINTS + BONUS_POINTS));
  assert.equal(out.reply.lives, 3);
});
