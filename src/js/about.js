/* /about/ — the desk clock. Chennai time, read every second: the digits, a
   ring that fills over each minute, the time of day in words and the date.
   Everything else on the page is CSS (the greeting, the hand of cards, the
   compass, the shelf). The portrait has its own script. */

const TICK_MS = 1000;

const clock = document.querySelector('[data-desk-clock]');

if (clock) {
  const hm = clock.querySelector('[data-hm]');
  const ss = clock.querySelector('[data-ss]');
  const word = clock.querySelector('[data-word]');
  const date = clock.querySelector('[data-date]');
  const ring = clock.querySelector('[data-ring]');

  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short',
  });

  /* the hour in Chennai, in the words a person would use */
  const timeOfDay = (hour) => {
    if (hour < 5) return 'Night';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  };

  const parts = (now) => Object.fromEntries(
    timeFormat.formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );

  const tick = () => {
    const now = new Date();
    const t = parts(now);
    const second = Number(t.second);
    if (hm) hm.textContent = `${t.hour}:${t.minute}`;
    if (ss) ss.textContent = t.second;
    if (word) word.textContent = `${timeOfDay(Number(t.hour))} in Chennai`;
    if (date) date.textContent = dateFormat.format(now);
    if (ring) {
      /* the arc jumps back to empty at the top of the minute instead of unwinding */
      clock.classList.toggle('is-wrapping', second === 0);
      ring.style.setProperty('--s', String(second));
    }
  };

  tick();
  setInterval(tick, TICK_MS);
}
