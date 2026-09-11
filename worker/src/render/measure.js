// Text measurement for badge layout. Uses the same Verdana / Helvetica width
// tables Shields.io uses (via anafanafo, CC0), trimmed to code points <= 0x2FFF,
// plus explicit rules for the scripts the tables do not cover so that Korean,
// Japanese, Chinese and emoji messages lay out correctly instead of being
// guessed at the width of an "m".
import { verdana11, verdana10, verdana10b, helvetica11b } from "./widths.js";

const TABLES = {
  "11px Verdana": { data: verdana11, size: 11 },
  "10px Verdana": { data: verdana10, size: 10 },
  "bold 10px Verdana": { data: verdana10b, size: 10 },
  "bold 11px Helvetica": { data: helvetica11b, size: 11 },
};

function lookup(flat, cp) {
  // Binary search over [lo, hi, w] triples.
  let lo = 0;
  let hi = flat.length / 3 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = flat[mid * 3];
    const end = flat[mid * 3 + 1];
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return flat[mid * 3 + 2];
  }
  return undefined;
}

// Full-width scripts: rendered by a CJK fallback font at roughly 1em.
function isWide(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) || // CJK radicals … Yi
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK compatibility ideographs
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK compatibility forms
    (cp >= 0xff00 && cp <= 0xff60) || // Full-width forms
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3fffd) // CJK extension B+
  );
}

// Emoji are drawn by a colour emoji font, ~1.2em wide regardless of family.
function isEmoji(cp) {
  return (
    (cp >= 0x1f000 && cp <= 0x1faff) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x2b00 && cp <= 0x2bff) ||
    cp === 0x2764 ||
    cp === 0x203c ||
    cp === 0x2049
  );
}

const ZERO_WIDTH = new Set([0x200d, 0xfe0f, 0xfe0e, 0x200b, 0x200c, 0x2060]);

/**
 * Measure `text` in the given font, returning a width in px.
 * Emoji ZWJ sequences count once (the joined glyphs are hidden).
 */
export function measure(text, font) {
  const table = TABLES[font];
  if (!table) throw new Error(`Unknown font "${font}"`);
  const { data, size } = table;
  const emWidth = lookup(data, 0x6d /* m */);
  const cps = Array.from(text, (ch) => ch.codePointAt(0));
  let width = 0;
  let skipNext = false; // after ZWJ the following emoji is part of the same glyph
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (cp <= 31 || cp === 127) continue;
    if (ZERO_WIDTH.has(cp)) {
      if (cp === 0x200d) skipNext = true;
      continue;
    }
    if (cp >= 0x1f3fb && cp <= 0x1f3ff) continue; // skin tone modifiers
    if (cp >= 0xe0020 && cp <= 0xe007f) continue; // tag characters (flags)
    if (skipNext) {
      skipNext = false;
      continue;
    }
    // Emoji presentation: astral emoji, or a BMP symbol forced to emoji by
    // U+FE0F, or a BMP symbol the font table does not know.
    const forcedEmoji = cps[i + 1] === 0xfe0f;
    const w = lookup(data, cp);
    if (cp >= 0x1f000 || (isEmoji(cp) && (forcedEmoji || w === undefined))) {
      width += size * 1.2;
      continue;
    }
    if (isWide(cp)) {
      width += size;
      continue;
    }
    width += w === undefined ? emWidth : w;
  }
  return width;
}
