#!/usr/bin/env node
// Rewrites the block between <!-- daily-badge:start --> and <!-- daily-badge:end -->
// in a Markdown file with today's message as real text (searchable, selectable,
// no image proxy). Used by action.yml; also runnable by hand:
//
//   node action/update-readme.mjs --file README.md --pack dev-humor --tz Asia/Seoul
//
// Built-in packs are resolved locally from ../worker/src/packs (no network).
// Remote packs (gh:owner/repo/file.json) are fetched from GitHub raw.
import { readFileSync, writeFileSync } from "node:fs";

// Relative specifiers resolve against this file, so the action works from
// ${{ github.action_path }} on any OS (Windows needs file:// for absolute paths).
const { PACKS, messageFromPack, pickBuiltin } = await import("../worker/src/packs/index.js");
const { localNow, normalizeTimeZone, parseIsoDate } = await import("../worker/src/date.js");
const { remotePackUrl, fetchRemotePack } = await import("../worker/src/remote.js");

const START = "<!-- daily-badge:start -->";
const END = "<!-- daily-badge:end -->";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1) return process.argv[i + 1] ?? "true";
  const env = process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`];
  return env !== undefined && env !== "" ? env : fallback;
}

const file = arg("file", "README.md");
const packSpec = arg("pack", "default");
const tz = normalizeTimeZone(arg("tz", "UTC"));
const template = arg("template", "> 🌟 **{message}**\n> <sub>{date} · daily-badge</sub>");
const dryRun = arg("dry-run", "false") === "true";
const seed = arg("seed", "");
const to = arg("to", "");
const event = arg("event", "");
const date = parseIsoDate(arg("date", "")) || localNow(tz);

let pack = pickBuiltin(packSpec, date);
if (!pack) {
  const url = remotePackUrl(packSpec);
  if (url) pack = await fetchRemotePack(url);
}
if (!pack) {
  console.error(`::warning::unknown pack "${packSpec}", using default`);
  pack = PACKS.default;
}
const message = messageFromPack(pack, date, { seed, to, event });

const rendered = template
  .replaceAll("{message}", message)
  .replaceAll("{date}", `${date.monthName} ${date.d}, ${date.y}`)
  .replaceAll("{iso}", date.iso)
  .replaceAll("{weekday}", date.weekdayName)
  .replaceAll("{pack}", pack.name)
  .replaceAll("{tz}", tz);

const src = readFileSync(file, "utf8");
const a = src.indexOf(START);
const b = src.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  console.error(`::error::${file} has no ${START} … ${END} block`);
  process.exit(1);
}
const out = src.slice(0, a + START.length) + "\n" + rendered + "\n" + src.slice(b);
const changed = out !== src;

console.log(`[${date.iso} ${tz}] ${pack.name}: ${message}`);
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `message<<EOF\n${message}\nEOF\nchanged=${changed}\ndate=${date.iso}\n`, { flag: "a" });
}
if (dryRun) {
  console.log(changed ? "(dry run) would update " + file : "(dry run) no change");
} else if (changed) {
  writeFileSync(file, out);
  console.log("updated " + file);
} else {
  console.log("no change");
}
