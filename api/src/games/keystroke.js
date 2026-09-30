/*
 * Keystroke: type one line of code in the language you picked. The server
 * starts the clock when the line is dealt, so a reported time can never be
 * shorter than the time that really passed, and anything past a human ceiling
 * is counted at the ceiling.
 */

import { ApiError } from '../http.js';
import { LANGS, LINES, wpmOf } from '../shared/keystroke-texts.js';

export const WPM_CEILING = 180;
const CLOCK_SLACK_MS = 1500;
const MAX_RUN_MS = 20 * 60 * 1000;

const isCount = (n) => Number.isInteger(n) && n >= 0 && n < 100000;

/**
 * @param {string} text the line that was dealt
 * @param {{ elapsedMs?: unknown, typed?: unknown, errors?: unknown }} report from the browser
 * @param {number} serverElapsedMs time since the line was dealt, by the server's clock
 */
export function scoreLine(text, report, serverElapsedMs) {
  const { elapsedMs, typed, errors } = report;
  const readable = typeof elapsedMs === 'number' && Number.isFinite(elapsedMs) && isCount(typed) && isCount(errors);
  if (!readable || elapsedMs <= 0 || elapsedMs > MAX_RUN_MS || typed < text.length || errors > typed) {
    throw new ApiError(400, 'bad_run', 'That run could not be read.');
  }
  if (elapsedMs > serverElapsedMs + CLOCK_SLACK_MS) {
    throw new ApiError(400, 'bad_run', 'That run took longer than the clock allows.');
  }
  const fastestMs = (text.length / 5) / WPM_CEILING * 60000;
  const wpm = wpmOf(text.length, Math.max(elapsedMs, fastestMs));
  const accuracy = Math.round(((typed - errors) / typed) * 100);
  return { wpm, accuracy };
}

export const keystroke = {
  start(body) {
    const { lang, line } = body;
    if (!LANGS.includes(lang)) throw new ApiError(400, 'bad_lang', 'Unknown language.');
    if (!Number.isInteger(line) || line < 0 || line >= LINES[lang].length) {
      throw new ApiError(400, 'bad_line', 'Unknown line.');
    }
    return { state: { lang, line }, reply: { lang, line } };
  },
  finish(state, body, { serverElapsedMs }) {
    const { wpm, accuracy } = scoreLine(LINES[state.lang][state.line], body, serverElapsedMs);
    return { score: wpm, detail: { accuracy } };
  },
};
