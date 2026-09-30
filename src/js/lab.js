/* SHAFWAN® — The Lab. Three technical drills and global record boards. Zero libraries. */

import { warmSession } from './api.js';
import { refreshBoards } from './lab/board.js';
import { initBitwise } from './lab/bitwise.js';
import { initCompile } from './lab/compile.js';
import { initKeystroke } from './lab/keystroke.js';

refreshBoards();
initBitwise();
initCompile();
initKeystroke();

/* start the human check as soon as someone reaches for a cabinet, not on page load */
document.querySelectorAll('.game-frame').forEach((frame) => {
  frame.addEventListener('pointerenter', warmSession, { once: true });
  frame.addEventListener('focusin', warmSession, { once: true });
});
