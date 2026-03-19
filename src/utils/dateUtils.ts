export function isoToTime(iso: string): number {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(aISO: string, bISO: string): number {
  return Math.abs(isoToTime(bISO) - isoToTime(aISO)) / (24 * 60 * 60 * 1000);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

export function formatDateWithYear(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function compact(n: number, decimals = 1): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}
