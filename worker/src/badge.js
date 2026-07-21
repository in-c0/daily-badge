// Self-contained SVG badge renderer — no Node built-ins, no filesystem, so it
// runs on Cloudflare Workers unmodified. Shields.io-style output for the common
// styles (flat / flat-square / for-the-badge). plastic + social map to flat.

// Approximate Verdana character widths (px at font-size 11). Good enough for a
// fun badge — a few px of padding slack is imperceptible.
const NARROW = "ijl.,:;'|!/\\ ";
const WIDE = "mwMW@%";
const CAPS = "ABCDEFGHJKLNOPQRSTUVXYZ";

function charWidth(ch) {
  const code = ch.codePointAt(0);
  if (code >= 0x1f000 || (code >= 0x2600 && code <= 0x27bf) || code === 0x2b50) return 12; // emoji
  if (NARROW.includes(ch)) return 3.6;
  if (WIDE.includes(ch)) return 10;
  if (ch >= "0" && ch <= "9") return 7;
  if (CAPS.includes(ch)) return 8;
  if (code > 127) return 6.5; // en-dash, curly quotes, accents
  return 6.6; // default lowercase / punctuation
}

function textWidth(str, extraPerChar = 0) {
  let w = 0;
  for (const ch of str) w += charWidth(ch) + extraPerChar;
  return w;
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function flat(label, message, color, square) {
  const pad = 6;
  const lw = Math.round(textWidth(label) + pad * 2);
  const mw = Math.round(textWidth(message) + pad * 2);
  const W = lw + mw;
  const H = 20;
  const rx = square ? 0 : 3;
  const grad = square
    ? ""
    : `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`;
  const gradRect = square ? "" : `<rect width="${W}" height="${H}" fill="url(#s)"/>`;
  const L = xmlEscape(label);
  const M = xmlEscape(message);
  const lx = lw / 2;
  const mx = lw + mw / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${L}: ${M}">
<title>${L}: ${M}</title>${grad}
<clipPath id="r"><rect width="${W}" height="${H}" rx="${rx}" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="${H}" fill="#555"/>
<rect x="${lw}" width="${mw}" height="${H}" fill="${color}"/>
${gradRect}
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lx}" y="15" fill="#010101" fill-opacity=".3">${L}</text>
<text x="${lx}" y="14">${L}</text>
<text x="${mx}" y="15" fill="#010101" fill-opacity=".3">${M}</text>
<text x="${mx}" y="14">${M}</text>
</g>
</svg>`;
}

function forTheBadge(label, message, color) {
  const pad = 9;
  const spacing = 1.3;
  const L = label.toUpperCase();
  const M = message.toUpperCase();
  const lw = Math.round(textWidth(L, spacing) + pad * 2);
  const mw = Math.round(textWidth(M, spacing) + pad * 2);
  const W = lw + mw;
  const H = 28;
  const Le = xmlEscape(L);
  const Me = xmlEscape(M);
  const lx = lw / 2;
  const mx = lw + mw / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${Le}: ${Me}">
<title>${Le}: ${Me}</title>
<g clip-path="none">
<rect width="${lw}" height="${H}" fill="#555"/>
<rect x="${lw}" width="${mw}" height="${H}" fill="${color}"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="10" font-weight="bold" letter-spacing="1.3">
<text x="${lx}" y="18">${Le}</text>
<text x="${mx}" y="18">${Me}</text>
</g>
</svg>`;
}

export function renderBadge({ label, message, color, style }) {
  switch (style) {
    case "for-the-badge":
      return forTheBadge(label, message, color);
    case "flat-square":
      return flat(label, message, color, true);
    default: // flat, plastic, social → flat
      return flat(label, message, color, false);
  }
}
