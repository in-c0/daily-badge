import { test } from "node:test";
import assert from "node:assert/strict";
import { civil, localNow, secondsUntilLocalMidnight, parseIsoDate, isValidTimeZone, normalizeTimeZone, daysUntil, isLeapYear } from "../src/date.js";

test("civil() computes day-of-year, weekday, keys", () => {
  const d = civil(2026, 9, 11);
  assert.equal(d.doy, 254);
  assert.equal(d.weekdayName, "Friday");
  assert.equal(d.key, "September 11");
  assert.equal(d.iso, "2026-09-11");
  assert.equal(d.daysInYear, 365);
  assert.equal(civil(2024, 12, 31).doy, 366);
  assert.equal(civil(2024, 2, 29).key, "February 29");
});

test("leap years", () => {
  assert.ok(isLeapYear(2024));
  assert.ok(!isLeapYear(2100));
  assert.ok(isLeapYear(2000));
  assert.ok(!isLeapYear(2026));
});

test("localNow() respects the timezone (Sydney is a day ahead of LA at 20:00 UTC)", () => {
  const now = new Date("2026-09-11T20:00:00Z");
  assert.equal(localNow("Australia/Sydney", now).iso, "2026-09-12");
  assert.equal(localNow("America/Los_Angeles", now).iso, "2026-09-11");
  assert.equal(localNow("UTC", now).iso, "2026-09-11");
});

test("localNow() across a DST transition still yields civil fields", () => {
  // Sydney DST starts 2026-10-04 02:00 → 03:00 local.
  const now = new Date("2026-10-03T15:30:00Z"); // 02:30 AEDT... which does not exist; ICU resolves it.
  const d = localNow("Australia/Sydney", now);
  assert.equal(d.iso, "2026-10-04");
  assert.ok(d.hour >= 0 && d.hour < 24);
});

test("secondsUntilLocalMidnight() is clamped and tz-aware", () => {
  const now = new Date("2026-09-11T13:59:30Z"); // 23:59:30 in Sydney (AEST, +10)
  assert.equal(secondsUntilLocalMidnight("Australia/Sydney", now), 60); // never below 60s
  assert.equal(secondsUntilLocalMidnight("UTC", now), 86400 - (13 * 3600 + 59 * 60 + 30));
  const midnight = new Date("2026-09-11T14:00:00Z"); // 00:00:00 Sydney
  assert.equal(secondsUntilLocalMidnight("Australia/Sydney", midnight), 86400);
});

test("parseIsoDate() accepts real dates only", () => {
  assert.equal(parseIsoDate("2026-02-28").key, "February 28");
  assert.equal(parseIsoDate("2024-02-29").key, "February 29");
  assert.equal(parseIsoDate("2026-02-29"), undefined);
  assert.equal(parseIsoDate("2026-13-01"), undefined);
  assert.equal(parseIsoDate("2026-1-1"), undefined);
  assert.equal(parseIsoDate("garbage"), undefined);
  assert.equal(parseIsoDate(null), undefined);
  assert.equal(parseIsoDate("1969-12-31"), undefined);
});

test("timezone validation", () => {
  assert.ok(isValidTimeZone("Asia/Seoul"));
  assert.ok(isValidTimeZone("America/Argentina/Buenos_Aires"));
  assert.ok(!isValidTimeZone("Mars/Olympus_Mons"));
  assert.ok(!isValidTimeZone(""));
  assert.ok(!isValidTimeZone("x".repeat(65)));
  assert.equal(normalizeTimeZone("nope"), "UTC");
  assert.equal(normalizeTimeZone("Europe/Paris"), "Europe/Paris");
});

test("daysUntil()", () => {
  const today = civil(2026, 9, 11);
  assert.equal(daysUntil(today, 2026, 12, 25), 105);
  assert.equal(daysUntil(today, 2026, 9, 11), 0);
  assert.equal(daysUntil(today, 2026, 9, 10), -1);
});
