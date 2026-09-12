import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { renderBadge, STYLES, escapeXml } from "../src/render/shields.js";
import { measure } from "../src/render/measure.js";
import { toSvgColor, brightness, colorsForBackground } from "../src/render/color.js";

const require = createRequire(import.meta.url);
const { makeBadge } = require("badge-maker"); // dev-only oracle: the real Shields renderer

// Compare layout numbers, ignoring the xlink namespace (we never emit links)
// and how a colour is spelled (we normalise "pink" → "#ffc0cb"; same pixels).
const geometry = (svg) =>
  (svg.replace(/xmlns:xlink="[^"]*"/, "").replace(/fill="[^"]*"/g, "").replace(/<title>.*?<\/title>/, "").match(/-?\d+(\.\d+)?/g) || []).join(",");

const CASES = [
  ["Today is ...", "Junk Food Day – Treat yo’ self!", "pink"],
  ["", "no label", "blue"],
  ["build", "passing", "brightgreen"],
  ["label", "It works on my machine", "hotpink"],
  ["x", "Wi-Fi doesn't actually stand for anything", "#ff69b4"],
  ["Today", "café résumé naïve", "orange"],
  ["a & b", "<tag> \"quoted\" 'single'", "red"],
  ["Ünïcödé", "Ωmega — ∑ums", "yellow"],
];

for (const style of STYLES) {
  test(`renderer matches badge-maker geometry: ${style}`, () => {
    for (const [label, message, color] of CASES) {
      const mine = renderBadge({ label, message, color, style });
      const ref = makeBadge({ label, message, color, style });
      assert.equal(geometry(mine), geometry(ref), `${style} ${JSON.stringify([label, message])}`);
    }
  });
}

test("escapes XML in label and message", () => {
  const svg = renderBadge({ label: "a<b", message: `"quotes" & 'apos'`, style: "flat" });
  assert.ok(!/<b/.test(svg.replace(/<\/?(svg|title|text|g|rect|linearGradient|stop|clipPath)\b/g, "")));
  assert.ok(svg.includes("&lt;b"));
  assert.ok(svg.includes("&quot;quotes&quot;"));
  assert.ok(svg.includes("&amp;"));
  assert.equal(escapeXml(`<&>"'`), "&lt;&amp;&gt;&quot;&apos;");
});

test("unknown style falls back to flat; unknown colour falls back to brightgreen", () => {
  const svg = renderBadge({ label: "l", message: "m", color: "not-a-colour", style: "bogus" });
  assert.ok(svg.includes('height="20"'));
  assert.ok(svg.includes('fill="#4c1"'));
});

test("text colour flips to dark on light backgrounds", () => {
  assert.deepEqual(colorsForBackground("#fff"), { textColor: "#333", shadowColor: "#ccc" });
  assert.deepEqual(colorsForBackground("#555"), { textColor: "#fff", shadowColor: "#010101" });
  assert.ok(brightness("gold") > 0.69);
  assert.ok(brightness("navy") < 0.69);
});

test("colour parsing", () => {
  assert.equal(toSvgColor("pink"), "#ffc0cb");
  assert.equal(toSvgColor("brightgreen"), "#4c1");
  assert.equal(toSvgColor("success"), "#4c1");
  assert.equal(toSvgColor("ff69b4"), "#ff69b4");
  assert.equal(toSvgColor("#ABC"), "#abc");
  assert.equal(toSvgColor("rgb(1, 2, 3)"), "rgb(1, 2, 3)");
  assert.equal(toSvgColor("hsl(330, 100%, 71%)"), "hsl(330, 100%, 71%)");
  assert.equal(toSvgColor("url(javascript:alert(1))"), undefined);
  assert.equal(toSvgColor("red;stroke:blue"), undefined);
  assert.equal(toSvgColor(""), undefined);
});

test("measure: CJK and emoji are wider than a Latin letter, ZWJ sequences count once", () => {
  const a = measure("a", "11px Verdana");
  assert.ok(measure("한", "11px Verdana") > a);
  assert.ok(measure("日", "11px Verdana") > a);
  assert.ok(measure("😅", "11px Verdana") > a);
  assert.equal(measure("👨‍👩‍👧", "11px Verdana"), measure("👨", "11px Verdana"));
  assert.equal(measure("👍🏽", "11px Verdana"), measure("👍", "11px Verdana"));
  assert.equal(measure("", "11px Verdana"), 0);
});

test("wide scripts produce a wide badge (not squeezed to Latin widths)", () => {
  const latin = renderBadge({ label: "", message: "abcdefghij", style: "flat" });
  const hangul = renderBadge({ label: "", message: "오늘도수고했어요오늘", style: "flat" });
  const w = (svg) => Number(svg.match(/width="(\d+)"/)[1]);
  assert.ok(w(hangul) > w(latin) * 1.4, `${w(hangul)} vs ${w(latin)}`);
});
