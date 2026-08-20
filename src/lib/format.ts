/**
 * Formatting helpers.
 *
 * Dates are formatted with an explicit locale AND time zone. `toLocaleString()`
 * with no arguments resolves differently on the server and in the browser,
 * which produces a hydration mismatch and, for an audit log, an ambiguous
 * timestamp ("8/15/2026" — whose month order?). Everything here is
 * deterministic, so server and client always agree.
 */

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const DATE_ONLY = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const TIME_ONLY = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "17 Aug 2026, 04:00 UTC" */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${DATE_TIME.format(d).replace(',', ',')} UTC`;
}

/** e.g. "17 Aug 2026" */
export function formatDate(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? DATE_ONLY.format(d) : '—';
}

/** e.g. "04:00" */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? TIME_ONLY.format(d) : '—';
}

/** Full ISO string, for `dateTime` attributes and `title` tooltips. */
export function isoOf(value: string | number | Date | null | undefined): string | undefined {
  return toDate(value)?.toISOString();
}

/** Compact plural helper: `count(1, 'event')` → "1 event". */
export function count(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
}
