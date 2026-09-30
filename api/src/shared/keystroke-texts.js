/* Keystroke lines, shared by the Worker (which times them) and the Lab page (which shows them). */
export const TEXTS = [
  "const portfolio = { design: 'premium', code: 'clean', experience: 'immersive' };",
  'function createAwesome(idea) { return idea.map(x => x.enhance()).filter(x => x.isWow()); }',
  "import { creativity, passion, coffee } from 'developer-essentials';",
  'async function buildTheFuture() { await learn(); await create(); return impact; }',
  'const skills = [...frontend, ...backend, ...devops].sort((a, b) => b.passion - a.passion);',
  'for (let i = 0; i < bits.length; i++) value |= bits[i] << (7 - i);',
  'SELECT name, count(*) FROM records GROUP BY name HAVING count(*) > 1 ORDER BY 2 DESC;',
];

/** Words per minute the way typing tests count them: five characters to a word. */
export const wpmOf = (chars, ms) => (ms > 0 ? Math.round((chars / 5) / (ms / 60000)) : 0);
