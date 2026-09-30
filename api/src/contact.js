/* The anonymous note: checked, rate limited, stored, then mailed. */

import { ApiError } from './http.js';
import { globalLimit, rateLimit, verifyTurnstile } from './security.js';
import { sendMail } from './mail.js';

export const NOTE_MIN = 10;
export const NOTE_MAX = 2000;
export const REPLY_MAX = 120;

const PER_HOUR = { limit: 3, windowMs: 60 * 60 * 1000, message: 'That is a lot of notes. Try again in an hour.' };
const PER_DAY = { limit: 8, windowMs: 24 * 60 * 60 * 1000, message: 'Daily limit reached. Try again tomorrow, or use email.' };
const SITE_DAY = { limit: 80, windowMs: 24 * 60 * 60 * 1000, message: 'The inbox is busy today. Please use email instead.' };

/* control characters other than tab and newline, plus bidi overrides that can disguise text */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/** @returns {{ body: string, replyTo: string | null }} */
export function cleanNote(input) {
  const rawBody = typeof input.message === 'string' ? input.message : '';
  const body = rawBody.replace(/\r\n?/g, '\n').replace(CONTROL, '').replace(/\n{4,}/g, '\n\n\n').trim();
  if (body.length < NOTE_MIN) throw new ApiError(422, 'message', `Write at least ${NOTE_MIN} characters.`);
  if (body.length > NOTE_MAX) throw new ApiError(422, 'message', `Keep it under ${NOTE_MAX} characters.`);

  const rawReply = typeof input.reply === 'string' ? input.reply : '';
  const replyTo = rawReply.replace(CONTROL, '').replace(/\s+/g, ' ').trim();
  if (replyTo.length > REPLY_MAX) throw new ApiError(422, 'reply', `Keep the reply address under ${REPLY_MAX} characters.`);
  return { body, replyTo: replyTo || null };
}

/** @returns {Promise<{ queued: boolean }>} */
export async function submitNote(env, input, { ip, ipHash, now = Date.now() }) {
  const note = cleanNote(input);

  /* a hidden field people never see; bots fill it. Look successful, keep nothing. */
  if (typeof input.website === 'string' && input.website.trim()) return { queued: false };

  await verifyTurnstile(env, input.turnstileToken, ip);
  await rateLimit(env, 'note:hour', ipHash, PER_HOUR, now);
  await rateLimit(env, 'note:day', ipHash, PER_DAY, now);
  await globalLimit(env, 'note:site', SITE_DAY, now);

  const saved = await env.DB
    .prepare('INSERT INTO messages (body, reply_to, created_at) VALUES (?, ?, ?) RETURNING id')
    .bind(note.body, note.replyTo, now)
    .first();

  const delivered = await sendMail(env, { ...note, id: saved.id, createdAt: now });
  await env.DB
    .prepare('UPDATE messages SET delivered = ?, attempts = 1 WHERE id = ?')
    .bind(delivered ? 1 : 0, saved.id)
    .run();
  return { queued: !delivered };
}

/** Retries notes the mail provider did not take the first time. */
export async function retryUndelivered(env) {
  const { results } = await env.DB
    .prepare('SELECT id, body, reply_to, created_at FROM messages WHERE delivered = 0 AND attempts < 6 ORDER BY id LIMIT 20')
    .all();
  for (const row of results) {
    const delivered = await sendMail(env, { id: row.id, body: row.body, replyTo: row.reply_to, createdAt: row.created_at });
    await env.DB
      .prepare('UPDATE messages SET delivered = ?, attempts = attempts + 1 WHERE id = ?')
      .bind(delivered ? 1 : 0, row.id)
      .run();
  }
}
