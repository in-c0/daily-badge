// Faithful port of badge-maker's renderers (Shields.io, CC0) to a dependency-free
// ESM module that runs on Cloudflare Workers. Same geometry, same font metrics,
// same 10x text-scaling trick, so output is pixel-identical to img.shields.io for
// the same label / message / colour — but computed at the edge with no round
// trip to Shields. Links and logos are intentionally unsupported (they do not
// work through GitHub's image proxy anyway).
import { measure } from "./measure.js";
import { colorsForBackground, toSvgColor } from "./color.js";

const FONT_FAMILY = "Verdana,Geneva,DejaVu Sans,sans-serif";
const SOCIAL_FONT_FAMILY = "Helvetica Neue,Helvetica,Arial,sans-serif";
const SCALE = 10; // https://github.com/badges/shields/pull/1132

export const STYLES = ["flat", "flat-square", "plastic", "for-the-badge", "social"];

export function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const roundUpToOdd = (v) => (v % 2 === 0 ? v + 1 : v);
const preferredWidthOf = (str, font) => roundUpToOdd(measure(str, font) | 0);

function svgWrap({ width, height, accessibleText }, body) {
  const a = escapeXml(accessibleText);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${a}">` +
    `<title>${a}</title>${body}</svg>`
  );
}

// ─── flat / flat-square / plastic ─────────────────────────────
function twoTone({ label, message, color, labelColor, height, verticalMargin, shadow }) {
  const horizPadding = 5;
  const hasLabel = label.length > 0;
  labelColor = hasLabel ? labelColor : color;
  const labelWidth = hasLabel ? preferredWidthOf(label, "11px Verdana") : 0;
  const leftWidth = hasLabel ? labelWidth + 2 * horizPadding : 0;
  const messageWidth = preferredWidthOf(message, "11px Verdana");
  const messageMargin = leftWidth - (message.length ? 1 : 0) + (hasLabel ? 0 : 1);
  const rightWidth = messageWidth + 2 * horizPadding;
  const width = leftWidth + rightWidth;

  const text = (content, leftMargin, bg, textWidth) => {
    if (!content.length) return "";
    const { textColor, shadowColor } = colorsForBackground(bg);
    const x = SCALE * (leftMargin + 0.5 * textWidth + horizPadding);
    const c = escapeXml(content);
    const tl = SCALE * textWidth;
    const sh = shadow
      ? `<text aria-hidden="true" x="${x}" y="${150 + verticalMargin}" fill="${shadowColor}" fill-opacity=".3" transform="scale(.1)" textLength="${tl}">${c}</text>`
      : "";
    return `${sh}<text x="${x}" y="${140 + verticalMargin}" transform="scale(.1)" fill="${textColor}" textLength="${tl}">${c}</text>`;
  };

  const fg =
    `<g fill="#fff" text-anchor="middle" font-family="${FONT_FAMILY}" text-rendering="geometricPrecision" font-size="110">` +
    text(label, 1, labelColor, labelWidth) +
    text(message, messageMargin, color, messageWidth) +
    `</g>`;
  const rects = `<rect width="${leftWidth}" height="${height}" fill="${labelColor}"/><rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${color}"/>`;
  return { width, height, leftWidth, rightWidth, rects, fg, accessibleText: (hasLabel ? `${label}: ` : "") + message };
}

function flat(p, square) {
  const t = twoTone({ ...p, height: 20, verticalMargin: 0, shadow: !square });
  if (square) {
    return svgWrap(t, `<g shape-rendering="crispEdges">${t.rects}</g>${t.fg}`);
  }
  const grad = `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`;
  const clip = `<clipPath id="r"><rect width="${t.width}" height="20" rx="3" fill="#fff"/></clipPath>`;
  return svgWrap(t, `${grad}${clip}<g clip-path="url(#r)">${t.rects}<rect width="${t.width}" height="20" fill="url(#s)"/></g>${t.fg}`);
}

function plastic(p) {
  const t = twoTone({ ...p, height: 18, verticalMargin: -10, shadow: true });
  const grad =
    `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>` +
    `<stop offset=".9" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`;
  const clip = `<clipPath id="r"><rect width="${t.width}" height="18" rx="4" fill="#fff"/></clipPath>`;
  return svgWrap(t, `${grad}${clip}<g clip-path="url(#r)">${t.rects}<rect width="${t.width}" height="18" fill="url(#s)"/></g>${t.fg}`);
}

// ─── for-the-badge ────────────────────────────────────────────
function forTheBadge({ label, message, color, labelColor }) {
  const FONT_SIZE = 10;
  const H = 28;
  const TEXT_MARGIN = 12;
  const LETTER_SPACING = 1.25;
  label = label.toUpperCase();
  message = message.toUpperCase();
  const hasLabel = label.length > 0;

  const labelTextWidth = hasLabel ? (measure(label, "10px Verdana") | 0) + LETTER_SPACING * [...label].length : 0;
  const messageTextWidth = message.length
    ? (measure(message, "bold 10px Verdana") | 0) + LETTER_SPACING * [...message].length
    : 0;

  const labelTextMinX = TEXT_MARGIN;
  let labelRectWidth = 0;
  let messageTextMinX;
  let messageRectWidth;
  if (hasLabel) {
    labelRectWidth = labelTextMinX + labelTextWidth + TEXT_MARGIN;
    messageTextMinX = labelRectWidth + TEXT_MARGIN;
  } else {
    messageTextMinX = TEXT_MARGIN;
  }
  messageRectWidth = 2 * TEXT_MARGIN + messageTextWidth;

  const labelEl = hasLabel
    ? `<text transform="scale(.1)" x="${SCALE * (labelTextMinX + 0.5 * labelTextWidth)}" y="175" textLength="${SCALE * labelTextWidth}" fill="${colorsForBackground(labelColor).textColor}">${escapeXml(label)}</text>`
    : "";
  const messageEl = `<text transform="scale(.1)" x="${SCALE * (messageTextMinX + 0.5 * messageTextWidth)}" y="175" textLength="${SCALE * messageTextWidth}" fill="${colorsForBackground(color).textColor}" font-weight="bold">${escapeXml(message)}</text>`;

  const bg = hasLabel
    ? `<rect width="${labelRectWidth}" height="${H}" fill="${labelColor}"/><rect x="${labelRectWidth}" width="${messageRectWidth}" height="${H}" fill="${color}"/>`
    : `<rect width="${messageRectWidth}" height="${H}" fill="${color}"/>`;

  return svgWrap(
    { width: labelRectWidth + messageRectWidth, height: H, accessibleText: (hasLabel ? `${label}: ` : "") + message },
    `<g shape-rendering="crispEdges">${bg}</g>` +
      `<g fill="#fff" text-anchor="middle" font-family="${FONT_FAMILY}" text-rendering="geometricPrecision" font-size="${SCALE * FONT_SIZE}">${labelEl}${messageEl}</g>`
  );
}

// ─── social ───────────────────────────────────────────────────
function social({ label, message }) {
  label = label.charAt(0).toUpperCase() + label.slice(1);
  const externalHeight = 20;
  const internalHeight = 19;
  const labelHorizPadding = 5;
  const messageHorizPadding = 4;
  const horizGutter = 6;
  const hasMessage = message.length > 0;
  const font = "bold 11px Helvetica";
  const labelTextWidth = preferredWidthOf(label, font);
  const messageTextWidth = preferredWidthOf(message, font);
  const labelRectWidth = labelTextWidth + 2 * labelHorizPadding;
  const messageRectWidth = messageTextWidth + 2 * messageHorizPadding;

  const bubbleX = labelRectWidth + horizGutter + 0.5;
  const bubble = hasMessage
    ? `<rect x="${bubbleX}" y="0.5" width="${messageRectWidth}" height="${internalHeight}" rx="2" fill="#fafafa"/>` +
      `<rect x="${labelRectWidth + horizGutter}" y="7.5" width="0.5" height="5" stroke="#fafafa"/>` +
      `<path d="M${bubbleX} 6.5 l-3 3v1 l3 3" stroke="d5d5d5" fill="#fafafa"/>`
    : "";

  const labelX = SCALE * (labelTextWidth / 2 + labelHorizPadding);
  const L = escapeXml(label);
  const labelText =
    `<rect id="llink" stroke="#d5d5d5" fill="url(#a)" x=".5" y=".5" width="${labelRectWidth}" height="${internalHeight}" rx="2"/>` +
    `<text aria-hidden="true" x="${labelX}" y="150" fill="#fff" transform="scale(.1)" textLength="${SCALE * labelTextWidth}">${L}</text>` +
    `<text x="${labelX}" y="140" transform="scale(.1)" textLength="${SCALE * labelTextWidth}">${L}</text>`;

  let messageText = "";
  if (hasMessage) {
    const mx = SCALE * (labelRectWidth + horizGutter + messageRectWidth / 2);
    const M = escapeXml(message);
    messageText =
      `<text aria-hidden="true" x="${mx}" y="150" fill="#fff" transform="scale(.1)" textLength="${SCALE * messageTextWidth}">${M}</text>` +
      `<text id="rlink" x="${mx}" y="140" transform="scale(.1)" textLength="${SCALE * messageTextWidth}">${M}</text>`;
  }

  const gradients =
    `<linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#fcfcfc" stop-opacity="0"/><stop offset="1" stop-opacity=".1"/></linearGradient>` +
    `<linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#ccc" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`;

  return svgWrap(
    {
      width: labelRectWidth + 1 + (hasMessage ? horizGutter + messageRectWidth : 0),
      height: externalHeight,
      accessibleText: `${label}: ${message}`,
    },
    `<style>a:hover #llink{fill:url(#b);stroke:#ccc}a:hover #rlink{fill:#4183c4}</style>${gradients}` +
      `<g stroke="#d5d5d5"><rect stroke="none" fill="#fcfcfc" x="0.5" y="0.5" width="${labelRectWidth}" height="${internalHeight}" rx="2"/>${bubble}</g>` +
      `<g aria-hidden="true" fill="#333" text-anchor="middle" font-family="${SOCIAL_FONT_FAMILY}" text-rendering="geometricPrecision" font-weight="700" font-size="110px" line-height="14px">${labelText}${messageText}</g>`
  );
}

/**
 * Render a Shields-style badge.
 * @param {object} o
 * @param {string} o.label
 * @param {string} o.message
 * @param {string} [o.color]      any Shields / CSS colour; invalid → #4c1
 * @param {string} [o.labelColor] default #555
 * @param {string} [o.style]      one of STYLES; unknown → flat
 */
export function renderBadge({ label = "", message = "", color, labelColor, style = "flat" }) {
  label = String(label).trim();
  message = String(message).trim();
  const c = toSvgColor(color) || "#4c1";
  const lc = toSvgColor(labelColor) || "#555";
  switch (style) {
    case "for-the-badge":
      return forTheBadge({ label, message, color: c, labelColor: lc });
    case "social":
      return social({ label, message });
    case "plastic":
      return plastic({ label, message, color: c, labelColor: lc });
    case "flat-square":
      return flat({ label, message, color: c, labelColor: lc }, true);
    default:
      return flat({ label, message, color: c, labelColor: lc }, false);
  }
}
