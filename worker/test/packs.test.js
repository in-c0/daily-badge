import { test } from "node:test";
import assert from "node:assert/strict";
import { PACKS, STATIC, messageFromPack, pickBuiltin, hashSeed, listPacks } from "../src/packs/index.js";
import { moonPhase, countdownTarget } from "../src/packs/computed.js";
import { civil } from "../src/date.js";
import { renderBadge } from "../src/render/shields.js";

const MAX_CHARS = 64; // keeps for-the-badge (uppercase + letter-spacing) under ~600px

test("every pack has valid metadata", () => {
  for (const [name, p] of Object.entries(PACKS)) {
    assert.equal(p.name, name, `registry key must equal pack.name (${name})`);
    assert.match(name, /^[a-z0-9-]+$/, `pack name "${name}" must be url-safe`);
    for (const k of ["title", "emoji", "lang", "description", "kind"]) {
      assert.ok(typeof p[k] === "string" && p[k].length, `${name}.${k} missing`);
    }
    assert.ok(["calendar", "rotating", "computed"].includes(p.kind), `${name}.kind`);
  }
});

test("every static message is non-empty, trimmed, unique, and short enough for a badge", () => {
  for (const [name, p] of Object.entries(STATIC)) {
    const msgs = Array.isArray(p.messages) ? p.messages : Object.values(p.messages);
    assert.ok(msgs.length >= 30, `${name} has only ${msgs.length} messages`);
    const seen = new Set();
    for (const m of msgs) {
      assert.equal(typeof m, "string", `${name}: non-string message`);
      assert.equal(m, m.trim(), `${name}: untrimmed "${m}"`);
      assert.ok(m.length > 0, `${name}: empty message`);
      assert.ok(!seen.has(m), `${name}: duplicate "${m}"`);
      seen.add(m);
      if (name !== "default") {
        assert.ok([...m].length <= MAX_CHARS, `${name}: too long (${[...m].length}) "${m}"`);
      }
      assert.ok(!/[<>]/.test(m), `${name}: angle brackets in "${m}"`);
      assert.ok(!/\n/.test(m), `${name}: newline in "${m}"`);
    }
  }
});

test("calendar packs cover every day of a leap year", () => {
  for (const [name, p] of Object.entries(STATIC)) {
    if (p.kind !== "calendar") continue;
    for (let doy = 1; doy <= 366; doy++) {
      const d = new Date(Date.UTC(2024, 0, doy));
      const key = civil(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()).key;
      assert.ok(p.messages[key], `${name} missing "${key}"`);
    }
  }
});

test("every pack renders in every style without throwing, on every day of 2026 and 2024-02-29", () => {
  const days = [];
  for (let doy = 1; doy <= 365; doy++) {
    const d = new Date(Date.UTC(2026, 0, doy));
    days.push(civil(2026, d.getUTCMonth() + 1, d.getUTCDate()));
  }
  days.push(civil(2024, 2, 29));
  for (const p of Object.values(PACKS)) {
    for (const date of days) {
      const message = messageFromPack(p, date, { to: "12-25", event: "Christmas" });
      assert.equal(typeof message, "string");
      assert.ok(message.length > 0, `${p.name} empty on ${date.iso}`);
      for (const style of ["flat", "for-the-badge"]) {
        const svg = renderBadge({ label: "Today is ...", message, color: "pink", style });
        assert.ok(svg.startsWith("<svg"), `${p.name} ${style} ${date.iso}`);
      }
    }
  }
});

test("rotating packs are stable for a day, differ across days, and vary by seed", () => {
  const p = STATIC["dev-humor"];
  const a = messageFromPack(p, civil(2026, 9, 11));
  assert.equal(a, messageFromPack(p, civil(2026, 9, 11)));
  assert.notEqual(a, messageFromPack(p, civil(2026, 9, 12)));
  const seeded = new Set(["", "alice", "bob", "carol", "dave"].map((seed) => messageFromPack(p, civil(2026, 9, 11), { seed })));
  assert.ok(seeded.size >= 3, "seeds should spread messages out");
  assert.equal(hashSeed(""), 0);
  assert.equal(hashSeed("alice"), hashSeed("alice"));
  assert.notEqual(hashSeed("alice"), hashSeed("bob"));
});

test("calendar pack: Feb 29 and fallback", () => {
  assert.ok(messageFromPack(STATIC.default, civil(2024, 2, 29)).length > 0);
  assert.equal(messageFromPack({ kind: "calendar", messages: {} }, civil(2026, 1, 1)), "You're amazing!");
  assert.equal(messageFromPack({ kind: "rotating", messages: [] }, civil(2026, 1, 1)), "You're amazing!");
});

test("pickBuiltin: names, comma lists, case, unknowns", () => {
  const d = civil(2026, 9, 11);
  assert.equal(pickBuiltin("dev-humor", d).name, "dev-humor");
  assert.equal(pickBuiltin("DEV-HUMOR", d).name, "dev-humor");
  assert.equal(pickBuiltin("nope", d), undefined);
  assert.equal(pickBuiltin("nope,ko", d).name, "ko");
  const both = new Set([civil(2026, 9, 11), civil(2026, 9, 12)].map((x) => pickBuiltin("dev-humor,tech-facts", x).name));
  assert.deepEqual([...both].sort(), ["dev-humor", "tech-facts"]);
});

test("moon phase: known full moon and new moon", () => {
  // 2026-01-03 was a full moon (UTC 10:03); 2026-01-18 a new moon.
  assert.equal(moonPhase(civil(2026, 1, 3)).name, "Full Moon");
  assert.equal(moonPhase(civil(2026, 1, 18)).name, "New Moon");
  const p = moonPhase(civil(2026, 9, 11));
  assert.ok(p.illumination >= 0 && p.illumination <= 100);
  assert.match(messageFromPack(PACKS.moon, civil(2026, 1, 3)), /Full Moon · (9\d|100)% lit/);
});

test("weekday pack follows the weekday", () => {
  assert.match(messageFromPack(PACKS.weekday, civil(2026, 9, 11)), /Friday/);
  assert.match(messageFromPack(PACKS.weekday, civil(2026, 9, 14)), /Monday/);
});

test("year progress", () => {
  assert.match(messageFromPack(PACKS.year, civil(2026, 9, 11)), /70% of 2026 · day 254\/365$/);
  assert.match(messageFromPack(PACKS.year, civil(2026, 1, 1)), /^░{10} 0% of 2026/);
  assert.match(messageFromPack(PACKS.year, civil(2026, 12, 31)), /^▓{10} 100% of 2026/);
});

test("countdown: annual, one-off, today, past, default, invalid", () => {
  const d = civil(2026, 9, 11);
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "12-25", event: "Christmas" }), "105 days until Christmas");
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "09-11", event: "Today" }), "It's Today! 🎉");
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "09-10", event: "X" }), "364 days until X"); // rolled to next year
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "2026-09-12", event: "Launch" }), "1 day until Launch");
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "2026-09-01", event: "Launch" }), "Launch was 10 days ago");
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "2026-09-10", event: "Launch" }), "Launch was yesterday");
  assert.equal(messageFromPack(PACKS.countdown, d, {}), "112 days until New Year");
  assert.equal(messageFromPack(PACKS.countdown, d, { to: "2026-02-30", event: "Nope" }), "Invalid date for Nope");
  assert.equal(countdownTarget("13-99", d).annual, true); // parsed but invalid → handled by countdown()
});

test("listPacks includes today's message for every pack", () => {
  const list = listPacks(civil(2026, 9, 11));
  assert.equal(list.length, Object.keys(PACKS).length);
  for (const p of list) assert.ok(p.today.length > 0, p.name);
  assert.equal(list.find((p) => p.name === "default").size, 366);
});
