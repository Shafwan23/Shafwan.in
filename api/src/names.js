/* Board names: short, a real-looking name, nothing offensive. Checked on the server. */

import { ApiError } from './http.js';

export const NAME_MIN = 2;
export const NAME_MAX = 14;
export const ANONYMOUS = 'ANONYMOUS';

const PUNCT = /^[ .'’-]$/;
/*
 * A letter is allowed only if it is a-z, or an accented a-z that decomposes to
 * one (é -> e). Letters that do not decompose (ß, Ð, Þ, Ø, Æ) would vanish in
 * the filter below and let "ßitch" through, so they are refused outright.
 */
const isPlainLetter = (ch) => /^[a-z]$/i.test(ch.normalize('NFD').charAt(0));

function allowedShape(name) {
  const chars = [...name];
  return isPlainLetter(chars[0]) && chars.every((ch) => isPlainLetter(ch) || PUNCT.test(ch));
}

/*
 * Matched anywhere inside the name, so they also catch "xFUCKx" or "B.I.T.C.H".
 * Only words that essentially never occur inside real names belong here.
 */
const ANYWHERE = [
  // English
  'fuck', 'fck', 'motherf', 'bitch', 'biatch', 'cunt', 'whore', 'slut', 'pussy', 'penis', 'vagina',
  'dildo', 'blowjob', 'handjob', 'porn', 'asshole', 'arsehole', 'dumbass', 'jackass', 'bullshit',
  'shithead', 'nigger', 'nigga', 'faggot', 'retard', 'rapist', 'wanker', 'bastard', 'hitler',
  // Hindi and Urdu, romanised
  'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'benchod', 'chutiya', 'chutia', 'bhosdi',
  'bhosda', 'bhosadi', 'gandu', 'gaandu', 'gaand', 'harami', 'haramzada', 'haramkhor', 'kutiya',
  'lavda', 'lawda', 'jhant',
  // Tamil, romanised
  'thevidiya', 'thevdiya', 'thevidya', 'ommala', 'oombu', 'koothi', 'pundai',
];

/*
 * Matched only as a whole word, because as fragments they sit inside ordinary
 * names (Cassandra, Dickens, Hitchcock, Nazia, Fukuda, Lauda).
 */
const WHOLE_WORD = [
  'ass', 'arse', 'tit', 'tits', 'cum', 'fag', 'dick', 'cock', 'prick', 'twat', 'sex', 'hoe', 'hoes',
  'boob', 'boobs', 'shit', 'piss', 'fuk', 'nazi', 'isis', 'kys', 'rape',
  'mc', 'bc', 'randi', 'kamina', 'kutta', 'lund', 'lauda', 'jhaat', 'tatti', 'chod', 'choot',
  'otha', 'punda', 'baadu',
];

/** Letters only, accents stripped, lower case: "B.i-tch" -> "bitch". */
const lettersOf = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
/** Runs of three or more shrink to two: "fuuuuck" -> "fuuck". */
const squeeze = (s) => s.replace(/(.)\1{2,}/g, '$1$1');
/** Every run shrinks to one: "fuuck" -> "fuck". */
const collapse = (s) => s.replace(/(.)\1+/g, '$1');
const hasDouble = (s) => /(.)\1/.test(s);

/** True when the name contains a blocked word, however it is spaced or stretched. */
export function isOffensive(name) {
  const whole = lettersOf(name);
  const squeezed = squeeze(whole);
  const collapsed = collapse(whole);

  const hitAnywhere = ANYWHERE.some((term) =>
    whole.includes(term) || squeezed.includes(term) || (!hasDouble(term) && collapsed.includes(term)));
  if (hitAnywhere) return true;

  /* whole words, plus runs of neighbouring words glued back together ("Big D ick") */
  const words = name.split(/[\s.'’-]+/).map((w) => lettersOf(w)).filter(Boolean);
  const candidates = [squeezed];
  for (let i = 0; i < words.length; i++) {
    let joined = '';
    for (let j = i; j < words.length && j < i + 4; j++) {
      joined += words[j];
      candidates.push(squeeze(joined));
    }
  }
  return candidates.some((w) => WHOLE_WORD.includes(w));
}

/**
 * Validates and tidies a board name. Empty means anonymous.
 * @returns {{ name: string, key: string | null }} key is null for anonymous entries
 */
export function cleanName(raw) {
  if (raw === null || raw === undefined) return { name: ANONYMOUS, key: null };
  if (typeof raw !== 'string') throw new ApiError(422, 'name', 'That name is not valid.');

  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!name || lettersOf(name) === ANONYMOUS.toLowerCase()) return { name: ANONYMOUS, key: null };

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    throw new ApiError(422, 'name', `Use ${NAME_MIN} to ${NAME_MAX} characters.`);
  }
  if (!allowedShape(name)) {
    throw new ApiError(422, 'name', 'Letters and spaces only, please. No numbers or symbols.');
  }
  if (lettersOf(name).length < NAME_MIN) {
    throw new ApiError(422, 'name', 'A name needs at least two letters.');
  }
  if (/(.)\1{2,}/i.test(lettersOf(name))) {
    throw new ApiError(422, 'name', 'That does not look like a name.');
  }
  if (isOffensive(name)) {
    throw new ApiError(422, 'name', 'Please choose a different name.');
  }
  return { name, key: lettersOf(name) };
}
