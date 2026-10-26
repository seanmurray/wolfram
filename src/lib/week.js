// Calendar weeks for the weekly tally: Monday 00:00 → next Monday 00:00
// (exclusive), in the device's local time.
//
// All arithmetic goes through setDate/setHours — never "+ 7 * 86400000" — so a
// DST-change week (one day is 23 or 25 hours long) still starts and ends on
// the right local midnight.

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 0 = Monday … 6 = Sunday
export function weekdayIndex(d) {
  return (new Date(d).getDay() + 6) % 7;
}

export function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - weekdayIndex(x));
  return x;
}

// Exclusive end: the following Monday at local midnight.
export function weekEnd(d) {
  const x = weekStart(d);
  x.setDate(x.getDate() + 7);
  return x;
}

export function inSameWeek(at, now) {
  const t = new Date(at);
  return t >= weekStart(now) && t < weekEnd(now);
}

// The moment `weekday` (0 = Mon) at "HH:MM" falls in the same week as `now`.
export function dateInWeek(now, weekday, time = '00:00') {
  const x = weekStart(now);
  x.setDate(x.getDate() + weekday);
  const [h, m] = String(time).split(':').map(Number);
  x.setHours(h || 0, m || 0, 0, 0);
  return x;
}

// "18:15" → "6:15 pm"
export function formatTime(time) {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

// "2026-10-26" — the local date of that week's Monday. Stable key for
// per-week state like skip days.
export function weekKey(d) {
  const s = weekStart(d);
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
}

// "2026-10-26" → that date at local midnight.
export function parseWeekKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Whole weeks from a's week to b's week (negative if b is earlier). Rounded,
// because a span containing a DST change is 7 days ± 1 hour.
export function weeksBetween(a, b) {
  return Math.round((weekStart(b) - weekStart(a)) / (7 * 86400000));
}
