// daily-badge Worker — one URL, a fresh message every day, in your timezone.
// (Logic lives here; src/index.js is the entry module and exports only the
// handler, because the Workers runtime rejects any other named export.)
//
//   GET /badge.svg?tz=Australia/Sydney&pack=dev-humor&style=flat&color=pink
//   GET /badge.json          Shields.io endpoint payload (same params)
//   GET /api/today           JSON: what the badge would say right now
//   GET /api/packs           JSON: every pack with today's message
//   GET /api/packs/:name     JSON: one pack, all messages
//   GET /health
//
// Everything is computed at the edge from the request time; there is no
// storage and nothing about the viewer is recorded.
import { renderBadge, STYLES } from "./render/shields.js";
import { normalizeTimeZone, localNow, parseIsoDate, secondsUntilLocalMidnight } from "./date.js";
import { PACKS, FALLBACK_MESSAGE, messageFromPack, pickBuiltin, listPacks } from "./packs/index.js";
import { remotePackUrl, fetchRemotePack } from "./remote.js";

export const LANDING_URL = "https://in-c0.github.io/daily-badge/";
const DEFAULT_LABEL = "Today is ...";
const DEFAULT_COLOR = "pink";
const DEFAULT_STYLE = "for-the-badge";
const STYLE_SET = new Set(STYLES);
const VERSION = "2.0.0";

const clamp = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

/** Read and sanitise query params. Public endpoint: trust nothing. */
export function readParams(url) {
  const p = url.searchParams;
  const style = p.get("style") || DEFAULT_STYLE;
  return {
    tz: normalizeTimeZone(clamp(p.get("tz") || "UTC", 64)),
    pack: clamp(p.get("pack") || "default", 300),
    date: parseIsoDate(p.get("date")),
    label: p.has("label") ? clamp(p.get("label"), 40) : DEFAULT_LABEL,
    color: clamp(p.get("color") || DEFAULT_COLOR, 32),
    labelColor: clamp(p.get("labelColor") || p.get("labelcolor") || "", 32) || undefined,
    style: STYLE_SET.has(style) ? style : DEFAULT_STYLE,
    seed: clamp(p.get("seed") || "", 64),
    to: clamp(p.get("to") || "", 10),
    event: clamp(p.get("event") || "", 40),
  };
}

/**
 * Work out today's message for a request. Pure apart from remote fetches.
 * @returns {{message:string, packName:string, date:object, error?:string}}
 */
export async function resolveMessage(params, { now = new Date(), fetcher = fetch } = {}) {
  const date = params.date || localNow(params.tz, now);
  const remoteUrl = remotePackUrl(params.pack);
  if (remoteUrl) {
    const pack = await fetchRemotePack(remoteUrl, fetcher);
    if (!pack) return { message: "pack unavailable", packName: params.pack, date, error: "remote_pack_unavailable" };
    return { message: messageFromPack(pack, date, params), packName: params.pack, date };
  }
  const pack = pickBuiltin(params.pack, date) || PACKS.default;
  return { message: messageFromPack(pack, date, params) || FALLBACK_MESSAGE, packName: pack.name, date };
}

function cacheHeaders(params, now, error) {
  // A fixed preview date never changes; an error should be retried soon;
  // otherwise hold the badge until the viewer's local midnight.
  const maxAge = error ? 300 : params.date ? 86400 : secondsUntilLocalMidnight(params.tz, now);
  return {
    "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    "access-control-allow-origin": "*",
    "x-daily-badge-version": VERSION,
  };
}

const json = (obj, headers = {}, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", ...headers },
  });

/** Main handler — exported so tests can call it without wrangler. */
export async function handle(request, opts = {}) {
  const now = opts.now || new Date();
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const params = readParams(url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  if (path === "/health") {
    return json({ ok: true, version: VERSION, packs: Object.keys(PACKS).length, now: now.toISOString() });
  }

  if (path === "/api/packs") {
    const date = params.date || localNow(params.tz, now);
    return json({ date: date.iso, tz: params.tz, packs: listPacks(date) }, cacheHeaders(params, now));
  }

  if (path.startsWith("/api/packs/")) {
    const name = decodeURIComponent(path.slice("/api/packs/".length)).toLowerCase();
    const pack = PACKS[name];
    if (!pack) return json({ error: "unknown_pack", name }, {}, 404);
    const { fn, ...meta } = pack;
    return json(meta, { "cache-control": "public, max-age=86400" });
  }

  if (path === "/api/today") {
    const r = await resolveMessage(params, { now, fetcher: opts.fetcher });
    return json(
      {
        date: r.date.iso,
        weekday: r.date.weekdayName,
        dayOfYear: r.date.doy,
        tz: params.tz,
        pack: r.packName,
        label: params.label,
        message: r.message,
        ...(r.error ? { error: r.error } : {}),
      },
      cacheHeaders(params, now, r.error)
    );
  }

  if (path === "/badge.json") {
    const r = await resolveMessage(params, { now, fetcher: opts.fetcher });
    const headers = cacheHeaders(params, now, r.error);
    const maxAge = Number(headers["cache-control"].match(/max-age=(\d+)/)[1]);
    return json(
      {
        schemaVersion: 1,
        label: params.label,
        message: r.message,
        color: r.error ? "red" : params.color,
        ...(params.labelColor ? { labelColor: params.labelColor } : {}),
        style: params.style,
        cacheSeconds: Math.max(300, maxAge),
        ...(r.error ? { isError: true } : {}),
      },
      headers
    );
  }

  const wantsBadge = path === "/badge.svg" || path === "/badge" || (path === "/" && url.search.length > 1);
  if (wantsBadge) {
    const r = await resolveMessage(params, { now, fetcher: opts.fetcher });
    let svg;
    try {
      svg = renderBadge({
        label: params.label,
        message: r.message,
        color: r.error ? "red" : params.color,
        labelColor: params.labelColor,
        style: params.style,
      });
    } catch {
      svg = renderBadge({ label: DEFAULT_LABEL, message: r.message, color: DEFAULT_COLOR, style: DEFAULT_STYLE });
    }
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "x-daily-badge-pack": r.packName,
        "x-daily-badge-date": r.date.iso,
        ...cacheHeaders(params, now, r.error),
      },
    });
  }

  if (path === "/") {
    return Response.redirect(LANDING_URL, 302);
  }

  if (path === "/robots.txt") {
    return new Response("User-agent: *\nAllow: /\n", { headers: { "content-type": "text/plain" } });
  }

  return new Response(`Not found.\nTry /badge.svg?tz=Australia/Sydney&pack=dev-humor\nDocs: ${LANDING_URL}\n`, {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

