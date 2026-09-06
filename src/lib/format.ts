// Locale is pinned to "en-US" everywhere dates/numbers are formatted so
// server-rendered and client-hydrated output always match — letting the
// runtime pick a locale (the `undefined` default) resolves differently
// between Node's server locale and the browser's, causing hydration errors.

export function formatDate(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  if (!iso) return "unknown date";
  return new Date(iso).toLocaleDateString("en-US", options);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "unknown date";
  return new Date(iso).toLocaleString("en-US");
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
