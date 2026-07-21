import { makeBadge } from "badge-maker";
import messages from "./messages.json";

// ─── Config ────────────────────────────────────────────────────
const FALLBACK_MESSAGE = "You're amazing!";
const DEFAULT_LABEL = "Today is ...";
const DEFAULT_COLOR = "pink";
const DEFAULT_STYLE = "for-the-badge";
const ALLOWED_STYLES = new Set([
  "flat",
  "flat-square",
  "plastic",
  "for-the-badge",
  "social",
]);
const DAY = 86400;

// ─── Date helpers (ICU tz DB is built into Workers — no pytz needed) ──
function todayKey(tz) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "long",
      day: "numeric",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }
}

function secondsUntilLocalMidnight(tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date());
  } catch {
    return DAY; // unknown tz → cache a day
  }
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  let h = get("hour");
  if (h === 24) h = 0; // some ICU builds emit 24 at midnight
  const elapsed = h * 3600 + get("minute") * 60 + get("second");
  // Clamp: never below 60s (avoid thundering herd), never above a day.
  return Math.min(DAY, Math.max(60, DAY - elapsed));
}

// ─── Param sanitation (public endpoint — validate everything) ──
function clamp(str, max) {
  return String(str).slice(0, max);
}

// ─── Handler ───────────────────────────────────────────────────
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.searchParams;

    const tz = clamp(p.get("tz") || "UTC", 64);
    const label = clamp(p.get("label") || DEFAULT_LABEL, 40);
    const color = clamp(p.get("color") || DEFAULT_COLOR, 20);
    let style = p.get("style") || DEFAULT_STYLE;
    if (!ALLOWED_STYLES.has(style)) style = DEFAULT_STYLE;

    const message = messages[todayKey(tz)] || FALLBACK_MESSAGE;
    const maxAge = secondsUntilLocalMidnight(tz);
    const cache = `public, max-age=${maxAge}`;

    if (url.pathname === "/badge.json") {
      // Shields.io endpoint-compatible payload.
      return new Response(
        JSON.stringify({ schemaVersion: 1, label, message, color }),
        {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": cache,
            "access-control-allow-origin": "*",
          },
        }
      );
    }

    if (url.pathname === "/badge.svg" || url.pathname === "/") {
      let svg;
      try {
        svg = makeBadge({ label, message, color, style });
      } catch {
        svg = makeBadge({
          label: DEFAULT_LABEL,
          message,
          color: DEFAULT_COLOR,
          style: DEFAULT_STYLE,
        });
      }
      return new Response(svg, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": cache,
          "access-control-allow-origin": "*",
        },
      });
    }

    return new Response("Not found\nTry /badge.svg?tz=Australia/Sydney", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
