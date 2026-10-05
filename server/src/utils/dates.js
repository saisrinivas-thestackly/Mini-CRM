const DAY_MS = 24 * 60 * 60 * 1000;

export function localRanges(now, tzOffset) {
  const offsetMs = tzOffset * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const toUtc = (ms) => new Date(ms + offsetMs);
  return {
    dayStart: toUtc(Date.UTC(y, m, d)),
    dayEnd: toUtc(Date.UTC(y, m, d) + DAY_MS),
    monthStart: toUtc(Date.UTC(y, m, 1)),
    monthEnd: toUtc(Date.UTC(y, m + 1, 1)),
  };
}
