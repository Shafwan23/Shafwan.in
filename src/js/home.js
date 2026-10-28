/* / — the Lab teaser names who holds each record right now.
   Read from the score server when it is configured and reachable; the rows
   simply keep their descriptions otherwise. Names come from the server,
   which already limits them to letters, and are written as text only. */

import { apiReady, getBoards } from './api.js';

const slots = document.querySelectorAll('[data-top]');

if (slots.length && apiReady) {
  getBoards()
    .then((boards) => {
      slots.forEach((el) => {
        const top = boards?.[el.dataset.top]?.[0];
        if (!top || typeof top.name !== 'string' || !Number.isFinite(Number(top.score))) return;
        const tag = document.createElement('i');
        tag.textContent = '№1';
        el.replaceChildren(tag, ` ${top.name} · ${Number(top.score).toLocaleString('en-US')}`);
        el.classList.add('is-live');
      });
    })
    .catch(() => { /* the board is a flourish here; the Lab page says when it is offline */ });
}
