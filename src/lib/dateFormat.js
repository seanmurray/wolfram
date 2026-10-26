// Shared date formatter for `performed_at` values. Two shapes exist:
//
//   "2026-10-26T17:20:54.000Z" — what localdb writes: an instant. Shown in
//                                local time, so a 10 pm session stays on its
//                                own day even though UTC has rolled over.
//   "2026-10-26"               — a bare calendar date. Built with the local
//                                constructor: new Date("2026-10-26") would be
//                                UTC midnight and can show as the day before.
//
// (The bare-date branch is all this used to handle; the code came from a
// Postgres DATE column, so every local timestamp rendered "Invalid Date".)

const DATE_FMT = { weekday: 'short', month: 'short', day: 'numeric' };

export function formatDate(iso) {
  if (!iso) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? (([y, m, d]) => new Date(y, m - 1, d))(iso.split('-').map(Number))
    : new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, DATE_FMT);
}
