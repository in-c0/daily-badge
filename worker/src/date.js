// Timezone-aware calendar helpers. The Workers runtime ships the full ICU
// timezone database, so `Intl` is all we need — no tz library, no drift.

const DAY_MS = 86400000;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fmtCache = new Map();
function partsFormatter(tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** True if `tz` is an IANA zone the runtime knows. */
export function isValidTimeZone(tz) {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    partsFormatter(tz);
    return true;
  } catch {
    return false;
  }
}

/** Normalise a user-supplied tz; unknown → "UTC". */
export function normalizeTimeZone(tz) {
  return isValidTimeZone(tz) ? tz : "UTC";
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(y, m, d) {
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / DAY_MS);
}

/**
 * Build a LocalDate from civil fields.
 * @returns {{y:number,m:number,d:number,doy:number,daysInYear:number,weekday:number,
 *   weekdayName:string,monthName:string,key:string,iso:string,epochDay:number}}
 */
export function civil(y, m, d) {
  const epochDay = Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    y,
    m,
    d,
    doy: dayOfYear(y, m, d),
    daysInYear: isLeapYear(y) ? 366 : 365,
    weekday,
    weekdayName: WEEKDAYS[weekday],
    monthName: MONTHS[m - 1],
    key: `${MONTHS[m - 1]} ${d}`, // matches the "Month Day" keys in calendar packs
    iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    epochDay,
  };
}

/** Current wall-clock fields in `tz` (already-validated). */
export function localNow(tz, now = new Date()) {
  const parts = partsFormatter(tz).formatToParts(now);
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  let hour = get("hour");
  if (hour === 24) hour = 0; // some ICU builds emit 24 at midnight
  return { ...civil(get("year"), get("month"), get("day")), hour, minute: get("minute"), second: get("second") };
}

/** Seconds until the next local midnight in `tz`, clamped to [60, 86400]. */
export function secondsUntilLocalMidnight(tz, now = new Date()) {
  const t = localNow(tz, now);
  const elapsed = t.hour * 3600 + t.minute * 60 + t.second;
  return Math.min(86400, Math.max(60, 86400 - elapsed));
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a `date=YYYY-MM-DD` preview parameter. Returns undefined if absent
 * or invalid (impossible dates like 2026-02-30 are rejected).
 */
export function parseIsoDate(s) {
  if (typeof s !== "string") return undefined;
  const m = s.match(ISO_DATE);
  if (!m) return undefined;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (y < 1970 || y > 2999 || mo < 1 || mo > 12 || d < 1 || d > 31) return undefined;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return undefined;
  return civil(y, mo, d);
}

/** Days from `from` to the next occurrence of month/day `to` (0 if today). */
export function daysUntil(from, toY, toM, toD) {
  const target = civil(toY, toM, toD);
  return target.epochDay - from.epochDay;
}
