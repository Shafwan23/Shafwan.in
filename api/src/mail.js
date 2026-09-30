/* Delivers contact notes by email through Resend's HTTP API (free tier). */

const IST = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
});

const EMAIL_SHAPE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

/** Plain text only, so nothing a visitor writes can render as HTML in the inbox. */
export function composeMail(env, note) {
  /* the trusted details go first, so nothing inside the note can pose as them */
  const lines = [
    'A new anonymous note arrived through shafwan.in.',
    `Sent: ${IST.format(new Date(note.createdAt))} IST`,
    `Reply to: ${note.replyTo || 'not given (fully anonymous)'}`,
    '',
    '===== the note, exactly as written =====',
    note.body,
    '===== end of note =====',
  ];
  const mail = {
    from: env.MAIL_FROM,
    to: [env.MAIL_TO],
    subject: 'New note from shafwan.in',
    text: lines.join('\n'),
  };
  if (note.replyTo && EMAIL_SHAPE.test(note.replyTo)) mail.reply_to = note.replyTo;
  return mail;
}

/** @returns {Promise<boolean>} true when the provider accepted the mail */
export async function sendMail(env, note, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) return false;
  try {
    const res = await fetchImpl(env.MAIL_ENDPOINT || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        /* a retried note is recognised by the provider and not sent twice */
        ...(note.id ? { 'Idempotency-Key': `shafwan-note-${note.id}` } : {}),
      },
      body: JSON.stringify(composeMail(env, note)),
    });
    if (!res.ok) console.error('mail rejected', res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error('mail failed', err instanceof Error ? err.message : err);
    return false;
  }
}
