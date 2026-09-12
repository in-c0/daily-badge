// Bring-your-own packs. Users can point the badge at a JSON file they host on
// GitHub (repo or gist) — no fork, no PR to this repo:
//
//   ?pack=gh:owner/repo/path/to/pack.json         (default branch)
//   ?pack=gh:owner/repo/path/to/pack.json@v1      (any ref)
//   ?pack=gist:username/gistid/pack.json
//   ?pack=https://raw.githubusercontent.com/...    (only these two hosts)
//
// The file is either an array of strings (rotated by day) or an object keyed
// by "Month Day". Anything else is rejected. The Worker only ever fetches from
// GitHub's raw hosts, caps the size at 64 KB, and caches for an hour — so a
// public endpoint cannot be turned into a proxy.

const ALLOWED_HOSTS = new Set(["raw.githubusercontent.com", "gist.githubusercontent.com"]);
const MAX_BYTES = 64 * 1024;
const MAX_ENTRIES = 2000;
const MAX_MESSAGE_CHARS = 200;
const CACHE_TTL = 3600;
const SEGMENT = /^(?!\.\.?$)[A-Za-z0-9._-]+$/; // no "." / ".." path tricks

/** Turn a pack spec into a fetchable raw URL, or undefined if it's not remote. */
export function remotePackUrl(spec) {
  if (typeof spec !== "string" || spec.length > 300) return undefined;
  let m;
  if ((m = spec.match(/^gh:([^/]+)\/([^/]+)\/(.+?)(?:@([^@]+))?$/))) {
    const [, owner, repo, path, ref] = m;
    if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) return undefined;
    if (!path.split("/").every((seg) => SEGMENT.test(seg))) return undefined;
    if (ref && !/^[A-Za-z0-9._\/-]+$/.test(ref)) return undefined;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref || "HEAD"}/${path}`;
  }
  if ((m = spec.match(/^gist:([^/]+)\/([^/]+)\/(.+)$/))) {
    const [, user, id, file] = m;
    if (!SEGMENT.test(user) || !/^[0-9a-f]+$/i.test(id) || !SEGMENT.test(file)) return undefined;
    return `https://gist.githubusercontent.com/${user}/${id}/raw/${file}`;
  }
  if (/^https:\/\//i.test(spec)) {
    try {
      const u = new URL(spec);
      if (!ALLOWED_HOSTS.has(u.hostname)) return undefined;
      u.search = "";
      u.hash = "";
      return u.toString();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Validate decoded JSON into a pack shape, or return undefined. */
export function validateRemotePack(data) {
  const clean = (s) => typeof s === "string" && s.trim().length > 0 && s.length <= MAX_MESSAGE_CHARS;
  if (Array.isArray(data)) {
    const msgs = data.filter(clean).map((s) => s.trim());
    if (!msgs.length || data.length > MAX_ENTRIES) return undefined;
    return { name: "remote", kind: "rotating", messages: msgs };
  }
  if (data && typeof data === "object") {
    const entries = Object.entries(data).filter(([k, v]) => /^[A-Z][a-z]+ \d{1,2}$/.test(k) && clean(v));
    if (!entries.length || Object.keys(data).length > MAX_ENTRIES) return undefined;
    return { name: "remote", kind: "calendar", messages: Object.fromEntries(entries.map(([k, v]) => [k, v.trim()])) };
  }
  return undefined;
}

/**
 * Fetch and validate a remote pack. Resolves to a pack or undefined; never throws.
 * `fetcher` is injectable for tests.
 */
export async function fetchRemotePack(url, fetcher = fetch) {
  try {
    const res = await fetcher(url, {
      headers: { accept: "application/json, text/plain;q=0.9", "user-agent": "daily-badge (+https://github.com/in-c0/daily-badge)" },
      cf: { cacheTtl: CACHE_TTL, cacheEverything: true },
    });
    if (!res.ok) return undefined;
    const len = Number(res.headers.get("content-length") || 0);
    if (len > MAX_BYTES) return undefined;
    const text = await res.text();
    if (text.length > MAX_BYTES) return undefined;
    return validateRemotePack(JSON.parse(text));
  } catch {
    return undefined;
  }
}
