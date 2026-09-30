/*
 * Bitwise round rules, shared by the Worker (which deals and scores rounds) and
 * the Lab page (which draws them). Pure functions only: this file ships to browsers.
 */

/** The value a round asks for. */
export function answerOf(r) {
  switch (r.k) {
    case 'dec':
    case 'hex': return r.v;
    case 'and': return r.a & r.b;
    case 'or': return r.a | r.b;
    case 'xor': return r.a ^ r.b;
    case 'shl': return (r.x << r.n) & 255;
    case 'shr': return r.x >> r.n;
    case 'not': return (~r.x) & 255;
    default: throw new RangeError(`unknown round kind ${r.k}`);
  }
}

const KINDS = ['dec', 'dec', 'dec', 'hex', 'hex', 'and', 'or', 'xor', 'shl', 'shr', 'not'];

/** @param {(n: number) => number} rand integer in [0, n) */
function makeRound(rand) {
  const k = KINDS[rand(KINDS.length)];
  switch (k) {
    case 'dec':
    case 'hex': return { k, v: 1 + rand(255) };
    case 'and':
    case 'or':
    case 'xor': return { k, a: rand(256), b: rand(256) };
    case 'shl': return { k, x: 1 + rand(63), n: 1 + rand(2) };
    case 'shr': return { k, x: 16 + rand(240), n: 1 + rand(3) };
    default: return { k: 'not', x: rand(256) };
  }
}

/** A run's rounds; no round asks for the value the register already holds. */
export function dealRounds(rand, count) {
  const rounds = [];
  let held = 0;
  while (rounds.length < count) {
    const r = makeRound(rand);
    const want = answerOf(r);
    if (want === held) continue;
    rounds.push(r);
    held = want;
  }
  return rounds;
}

/** Score multiplier after `streak` consecutive solves. */
export const chain = (streak) => Math.min(5, 1 + Math.floor(streak / 2) * 0.5);

/** Points for one solve that took `tookMs`, at the given streak (already counting this solve). */
export const roundPoints = (tookMs, streak) =>
  Math.round((100 + Math.max(0, Math.round(150 - tookMs / 40))) * chain(streak));
