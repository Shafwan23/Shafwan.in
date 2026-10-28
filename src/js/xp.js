/* /experience/ — the two things on the page that depend on today's date.
   The tenure chart's axis runs from September 2020 (month 0); the "now"
   marker and the open-ended Famysys bar take their position from the clock,
   and any [data-since] counter gets its month count filled in before app.js's
   count-up reads it. Everything else on the page is CSS. */

const AXIS_START_YEAR = 2020;
const AXIS_START_MONTH = 9; /* September */
const DAYS_IN_MONTH = 31;

const today = new Date();

/* whole months from a (year, month) to today, month 1 = January */
const monthsSince = (year, month) =>
  (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);

/* axis position of today, with the day of the month as a fraction */
const nowIndex = monthsSince(AXIS_START_YEAR, AXIS_START_MONTH) + (today.getDate() - 1) / DAYS_IN_MONTH;

/* the axis always ends at the end of the current year, so the chart keeps
   working after the ticks in the HTML run out (add a tick for each new year) */
const axisLength = monthsSince(AXIS_START_YEAR, AXIS_START_MONTH) + (12 - today.getMonth());

document.querySelectorAll('.tenure').forEach((chart) => {
  chart.style.setProperty('--now', nowIndex.toFixed(2));
  chart.style.setProperty('--len', String(axisLength));
});

/* inclusive month counts: November to the following October is twelve months */
document.querySelectorAll('[data-since]').forEach((el) => {
  const [year, month] = el.dataset.since.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return;
  el.dataset.count = String(Math.max(1, monthsSince(year, month) + 1));
});
