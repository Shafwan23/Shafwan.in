/* /contact/ — the two details that depend on the clock.
   Under the address, a line says what time it is in Chennai, what that means
   for a reply, and how far ahead of the reader it is. On the board, the
   "Local time" row re-flaps every minute: each changed character is rebuilt as
   a flap cell (the same structure app.js builds for every [data-flap]) and
   carries .flip so CSS can turn it. */

const CHENNAI_OFFSET_MINUTES = 330;
const MINUTES_PER_HOUR = 60;
const TICK_MS = 20000;

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/* what the hour means for a note sent right now */
const readingAt = (hour) => {
  if (hour < 5) return 'the middle of the night — I will read it in the morning';
  if (hour < 9) return 'early morning — I am up';
  if (hour < 18) return 'working hours — I am at my desk';
  if (hour < 22) return 'evening — I will see it tonight';
  return 'late — I will read it in the morning';
};

/* "4 h 30" from a count of minutes */
const spanOf = (minutes) => {
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

const whenLine = (now) => {
  const time = timeFormat.format(now);
  const hour = Number(time.slice(0, 2));
  const ahead = CHENNAI_OFFSET_MINUTES + now.getTimezoneOffset();
  const gap = ahead === 0
    ? 'the same time zone as you'
    : `${spanOf(Math.abs(ahead))} ${ahead > 0 ? 'ahead of' : 'behind'} you`;
  return `${time} in Chennai, ${readingAt(hour)}. That is ${gap}. Replies usually within a day.`;
};

/* rebuild a [data-flap] value, marking the cells that changed */
const flapInto = (el, text) => {
  const cells = [...el.querySelectorAll('span[aria-hidden]')].map((cell) => cell.textContent);
  /* previous[i] must line up with text[i]: spaces had no cell, so put them back */
  const previous = [...(el.dataset.flap || '')].map((chr) => (chr === ' ' ? ' ' : cells.shift()));
  const frag = document.createDocumentFragment();
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  frag.appendChild(label);
  let word = null;
  [...text].forEach((chr, i) => {
    if (chr === ' ') { word = null; return; }
    if (!word) {
      word = document.createElement('span');
      word.className = 'flap-word';
      frag.appendChild(word);
    }
    const cell = document.createElement('span');
    cell.style.setProperty('--c', String(i));
    cell.setAttribute('aria-hidden', 'true');
    cell.textContent = chr;
    if (previous.length && previous[i] !== chr) cell.classList.add('flip');
    word.appendChild(cell);
  });
  el.dataset.flap = text;
  el.replaceChildren(frag);
};

const when = document.querySelector('[data-when]');
const clockRow = document.querySelector('[data-flap-clock]');

if (when || clockRow) {
  let lastShown = '';
  const tick = () => {
    const now = new Date();
    if (when) when.textContent = whenLine(now);
    if (clockRow) {
      const text = `${timeFormat.format(now)} IST`;
      if (text !== lastShown) { flapInto(clockRow, text); lastShown = text; }
    }
  };
  tick();
  setInterval(tick, TICK_MS);
}
