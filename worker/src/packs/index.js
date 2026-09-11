// Pack registry. A pack is:
//   { name, title, emoji, lang, description, kind, messages }
// where kind is "calendar" (messages keyed by "Month Day"), "rotating"
// (array cycled by day-of-year) or "computed" (fn(date, params) → string).
//
// To add a pack: create src/packs/<name>.js exporting that shape, import it
// here, and add it to STATIC. `npm test` validates every pack.
import defaultPack from "./default.js";
import devHumor from "./dev-humor.js";
import techFacts from "./tech-facts.js";
import motivation from "./motivation.js";
import stoic from "./stoic.js";
import science from "./science.js";
import space from "./space.js";
import wholesome from "./wholesome.js";
import productivity from "./productivity.js";
import puns from "./puns.js";
import ko from "./ko.js";
import ja from "./ja.js";
import es from "./es.js";
import fr from "./fr.js";
import de from "./de.js";
import pt from "./pt.js";
import zh from "./zh.js";
import { COMPUTED } from "./computed.js";

export const STATIC = Object.fromEntries(
  [defaultPack, devHumor, techFacts, motivation, stoic, science, space, wholesome, productivity, puns, ko, ja, es, fr, de, pt, zh].map(
    (p) => [p.name, p]
  )
);

export const PACKS = { ...STATIC, ...COMPUTED };

export const FALLBACK_MESSAGE = "You're amazing!";

/** FNV-1a 32-bit — lets `seed=` de-synchronise rotating packs between users. */
export function hashSeed(seed) {
  if (!seed) return 0;
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Message from a single built-in pack for `date`.
 * @param {object} pack  registry entry
 * @param {object} date  LocalDate from date.js
 * @param {object} params sanitised query params ({ seed, to, event })
 */
export function messageFromPack(pack, date, params = {}) {
  if (!pack) return FALLBACK_MESSAGE;
  if (pack.kind === "computed") return pack.fn(date, params);
  if (Array.isArray(pack.messages)) {
    const n = pack.messages.length;
    if (!n) return FALLBACK_MESSAGE;
    // Day-of-year keeps a stable message for the whole local day; the year
    // term shifts the cycle so consecutive years differ; the seed spreads
    // users out so two profiles don't show the same line.
    const idx = (((date.doy - 1 + (date.y % 100) * 7 + hashSeed(params.seed)) % n) + n) % n;
    return pack.messages[idx];
  }
  return pack.messages[date.key] || FALLBACK_MESSAGE;
}

/**
 * Resolve a `pack=` value against built-in packs. Supports comma lists
 * ("dev-humor,tech-facts" alternates by day). Unknown names are skipped;
 * if nothing matches, returns undefined so the caller can try remote packs
 * or fall back to default.
 */
export function pickBuiltin(spec, date) {
  const names = String(spec || "default")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s in PACKS);
  if (!names.length) return undefined;
  return PACKS[names[(date.epochDay % names.length + names.length) % names.length]];
}

/** Public metadata for /api/packs. */
export function listPacks(date) {
  return Object.values(PACKS).map((p) => ({
    name: p.name,
    title: p.title,
    emoji: p.emoji,
    lang: p.lang,
    kind: p.kind,
    description: p.description,
    size: p.kind === "computed" ? undefined : Array.isArray(p.messages) ? p.messages.length : Object.keys(p.messages).length,
    params: p.params,
    today: messageFromPack(p, date, {}),
  }));
}
