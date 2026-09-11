// Computed packs: messages derived from the date itself rather than a list.
// Each is a function (date, params) → string, where `date` is a LocalDate from
// date.js and `params` is the (sanitised) query string.
import { daysUntil } from "../date.js";

// ─── Moon phase ───────────────────────────────────────────────
// Mean synodic month and a reference new moon (2000-01-06 18:14 UTC). Accurate
// to within a day, which is all a badge needs.
const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
const PHASES = [
  ["🌑", "New Moon"],
  ["🌒", "Waxing Crescent"],
  ["🌓", "First Quarter"],
  ["🌔", "Waxing Gibbous"],
  ["🌕", "Full Moon"],
  ["🌖", "Waning Gibbous"],
  ["🌗", "Last Quarter"],
  ["🌘", "Waning Crescent"],
];

export function moonPhase(date) {
  // Evaluate at local noon so the phase is stable for the whole day.
  const age = (((date.epochDay + 0.5 - REF_NEW_MOON) % SYNODIC) + SYNODIC) % SYNODIC;
  const index = Math.round((age / SYNODIC) * 8) % 8;
  const illumination = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2) * 100);
  return { emoji: PHASES[index][0], name: PHASES[index][1], age: Math.round(age * 10) / 10, illumination };
}

function moon(date) {
  const p = moonPhase(date);
  return `${p.emoji} ${p.name} · ${p.illumination}% lit`;
}

// ─── Weekday ──────────────────────────────────────────────────
const WEEKDAY_LINES = [
  // Sunday
  ["Sunday: rest is a feature, not a bug", "Sunday reset. Plan light, live lighter.", "Sunday: read something for fun", "Slow Sunday. Nothing to fix today.", "Sunday scaries? Write tomorrow's top three."],
  // Monday
  ["Monday: fresh branch, fresh start", "Monday. Coffee first, then merge.", "Monday: pick one thing and finish it", "Monday: new week, new commits 🚀", "Monday: momentum starts small"],
  // Tuesday
  ["Tuesday: the honest workday", "Tuesday: deep work day", "Tuesday — momentum day", "Tuesday: the Monday you actually meant", "Tuesday: ship something small"],
  // Wednesday
  ["Wednesday: halfway there 🐪", "Wednesday check-in: how's the energy?", "Wednesday: review, then refocus", "Wednesday: the downhill starts now", "Wednesday: clear one blocker"],
  // Thursday
  ["Thursday: finish what Monday started", "Thursday: almost Friday, almost done", "Thursday: tidy the branch", "Thursday: write the docs you promised", "Thursday: close the open loops"],
  // Friday
  ["Friday: don't deploy. Or do. Live a little.", "Friday: read-only mode after 3pm", "Friday: merge with care, log off with joy", "Friday: celebrate one thing that worked", "Friday: leave a note for Monday-you"],
  // Saturday
  ["Saturday: side-project o'clock", "Saturday: touch grass, then keyboard", "Saturday: tinker without a ticket", "Saturday: the best commits are for fun", "Saturday: no standups, only stand-ups from the couch"],
];

function weekday(date) {
  const lines = WEEKDAY_LINES[date.weekday];
  const week = Math.floor(date.epochDay / 7);
  return lines[week % lines.length];
}

// ─── Year progress ────────────────────────────────────────────
function bar(fraction, width = 10) {
  const filled = Math.round(fraction * width);
  return "▓".repeat(filled) + "░".repeat(width - filled);
}

function year(date) {
  const pct = Math.round((date.doy / date.daysInYear) * 100);
  return `${bar(date.doy / date.daysInYear)} ${pct}% of ${date.y} · day ${date.doy}/${date.daysInYear}`;
}

// ─── Countdown ────────────────────────────────────────────────
// ?to=YYYY-MM-DD (one-off) or ?to=MM-DD (annual, next occurrence). ?event=Name.
const ONE_OFF = /^(\d{4})-(\d{2})-(\d{2})$/;
const ANNUAL = /^(\d{2})-(\d{2})$/;

export function countdownTarget(to, date) {
  let m;
  if ((m = String(to || "").match(ONE_OFF))) {
    return { y: +m[1], mo: +m[2], d: +m[3], annual: false };
  }
  if ((m = String(to || "").match(ANNUAL))) {
    const mo = +m[1];
    const d = +m[2];
    let y = date.y;
    if (daysUntil(date, y, mo, d) < 0) y += 1;
    return { y, mo, d, annual: true };
  }
  // Default: next New Year's Day.
  return { y: date.y + 1, mo: 1, d: 1, annual: true, event: "New Year" };
}

function countdown(date, params) {
  const t = countdownTarget(params.to, date);
  const event = (params.event || t.event || "the big day").slice(0, 40);
  const probe = new Date(Date.UTC(t.y, t.mo - 1, t.d));
  if (probe.getUTCMonth() !== t.mo - 1 || probe.getUTCDate() !== t.d) return `Invalid date for ${event}`;
  const n = daysUntil(date, t.y, t.mo, t.d);
  if (n === 0) return `It's ${event}! 🎉`;
  if (n === 1) return `1 day until ${event}`;
  if (n > 1) return `${n} days until ${event}`;
  if (n === -1) return `${event} was yesterday`;
  return `${event} was ${-n} days ago`;
}

export const COMPUTED = {
  moon: {
    name: "moon",
    title: "Moon phase",
    emoji: "🌕",
    lang: "en",
    description: "Tonight's moon phase and illumination, computed for your timezone.",
    kind: "computed",
    fn: moon,
  },
  weekday: {
    name: "weekday",
    title: "Weekday vibes",
    emoji: "📅",
    lang: "en",
    description: "A different mood for Monday than for Friday.",
    kind: "computed",
    fn: weekday,
  },
  year: {
    name: "year",
    title: "Year progress",
    emoji: "📈",
    lang: "en",
    description: "A progress bar through the year: ▓▓▓▓░░░░░░ 41%.",
    kind: "computed",
    fn: year,
  },
  countdown: {
    name: "countdown",
    title: "Countdown",
    emoji: "⏳",
    lang: "en",
    description: "Days until a date: ?to=12-25&event=Christmas (or to=2027-06-01).",
    kind: "computed",
    fn: countdown,
    params: ["to", "event"],
  },
};
