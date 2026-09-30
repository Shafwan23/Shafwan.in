/* The anonymous note on /contact/. Shown only when the API is configured. */

import { apiReady, humanToken, sendNote } from './api.js';

const MIN = 10;
const MAX = 2000;

const section = document.getElementById('note');
const form = document.getElementById('noteForm');

if (section && form && apiReady) {
  section.hidden = false;

  const msg = document.getElementById('noteMsg');
  const reply = document.getElementById('noteReply');
  const trap = document.getElementById('noteWebsite');
  const count = document.getElementById('noteCount');
  const msgError = document.getElementById('noteMsgError');
  const status = document.getElementById('noteStatus');
  const send = document.getElementById('noteSend');
  const check = document.getElementById('noteCheck');
  const sendLabel = send.innerHTML;

  const showMsgError = (text) => {
    msgError.textContent = text;
    msgError.hidden = !text;
    msg.setAttribute('aria-invalid', text ? 'true' : 'false');
  };

  const setStatus = (text, tone = '') => {
    status.textContent = text;
    status.dataset.tone = tone;
  };

  const setBusy = (busy) => {
    send.disabled = busy;
    if (busy) send.textContent = 'Sending…';
    else send.innerHTML = sendLabel;
  };

  /* arriving from the Lab: start the note for them */
  const params = new URLSearchParams(location.search);
  if (params.get('from') === 'lab' && !msg.value) {
    const game = params.get('game') || 'the Lab';
    const score = params.get('score');
    const unit = params.get('unit') || 'points';
    const name = (params.get('name') || '').trim().slice(0, 14);
    const scored = score && /^\d{1,6}$/.test(score) ? ` and scored ${score} ${unit}` : '';
    msg.value = `Hi Shafwan, I just played ${game} in the Lab${scored}. `;
    if (name) msg.value += `

— ${name}`;
    msg.dispatchEvent(new Event('input'));
    requestAnimationFrame(() => {
      section.scrollIntoView({ block: 'start' });
      msg.focus();
      msg.setSelectionRange(msg.value.indexOf('. ') + 2, msg.value.indexOf('. ') + 2);
    });
  }

  msg.addEventListener('input', () => {
    const n = msg.value.trim().length;
    count.textContent = `${n} / ${MAX}`;
    count.dataset.over = String(n > MAX);
    if (n >= MIN) showMsgError('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = msg.value.trim();
    if (message.length < MIN) { showMsgError(`Write at least ${MIN} characters.`); msg.focus(); return; }
    if (message.length > MAX) { showMsgError(`Keep it under ${MAX} characters.`); msg.focus(); return; }
    showMsgError('');
    setBusy(true);
    setStatus('Checking you are human…');
    try {
      const turnstileToken = await humanToken(check);
      setStatus('Sending…');
      await sendNote({ message, reply: reply.value.trim(), website: trap.value, turnstileToken });
      form.reset();
      count.textContent = `0 / ${MAX}`;
      setStatus('Sent. Thank you, it is on its way to my inbox.', 'ok');
    } catch (err) {
      if (err.code === 'message') { showMsgError(err.message); msg.focus(); }
      setStatus(err.message || 'That did not send. Try again, or email me directly.', 'error');
    } finally {
      setBusy(false);
    }
  });
}
