// Shared date formatter for `performed_at` columns (DATE type in Postgres,
// surfaced as "YYYY-MM-DD" strings). Constructing a Date directly from the
// ISO string puts it at UTC midnight, which can shift a day in some
// timezones; we split the parts and use the local-timezone constructor.

const DATE_FMT = { weekday: 'short', month: 'short', day: 'numeric' };

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, DATE_FMT);
}
