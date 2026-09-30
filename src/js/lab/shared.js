/* Small pieces the three Lab cabinets share. */

/** Pulses a HUD number when it changes. */
export function tick(el, value) {
  if (!el) return;
  el.textContent = value;
  el.classList.add('tick');
  setTimeout(() => el.classList.remove('tick'), 260);
}

/** True while the visitor is typing into a field, so game keys stay out of the way. */
export const typing = (e) => e.target && e.target.closest('input, textarea, select, [contenteditable], .type-text');

/** Only the cabinet you last started answers the number keys. */
export const FOCUS = {
  who: null,
  claim(g) { this.who = g; },
  release(g) { if (this.who === g) this.who = null; },
  has(g) { return this.who === g; },
};

/** localStorage that never throws (private mode, blocked storage). */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage blocked */ } },
};
