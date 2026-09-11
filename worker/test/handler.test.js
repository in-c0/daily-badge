import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, readParams, LANDING_URL } from "../src/index.js";
import { remotePackUrl, validateRemotePack, fetchRemotePack } from "../src/remote.js";

const NOW = new Date("2026-09-11T02:00:00Z"); // 12:00 in Sydney, 22:00 (Sep 10) in New York
const get = (path, opts = {}) => handle(new Request(`https://daily-badge.example.workers.dev${path}`), { now: NOW, ...opts });

const fakeFetch = (bodies) => async (url) => {
  if (!(url in bodies)) return new Response("not found", { status: 404 });
  const b = bodies[url];
  return new Response(typeof b === "string" ? b : JSON.stringify(b), { status: 200 });
};

test("GET /badge.svg renders an SVG with cache until local midnight", async () => {
  const res = await get("/badge.svg?tz=Australia/Sydney&pack=dev-humor");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /image\/svg\+xml/);
  assert.equal(res.headers.get("x-daily-badge-date"), "2026-09-11");
  assert.equal(res.headers.get("x-daily-badge-pack"), "dev-humor");
  assert.match(res.headers.get("cache-control"), /max-age=43200/); // 12h to midnight in Sydney
  const svg = await res.text();
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("TODAY IS ...")); // for-the-badge default uppercases the label
});

test("timezone changes the date; invalid tz falls back to UTC", async () => {
  const ny = await get("/badge.svg?tz=America/New_York");
  assert.equal(ny.headers.get("x-daily-badge-date"), "2026-09-10");
  const bad = await get("/api/today?tz=Not/AZone");
  assert.equal((await bad.json()).tz, "UTC");
});

test("date= previews any day and is cached for a day", async () => {
  const res = await get("/api/today?date=2026-12-25&pack=default");
  const body = await res.json();
  assert.equal(body.date, "2026-12-25");
  assert.match(body.message, /Christmas/);
  assert.match(res.headers.get("cache-control"), /max-age=86400/);
  const bad = await get("/api/today?date=2026-02-30&tz=UTC");
  assert.equal((await bad.json()).date, "2026-09-11"); // invalid → today
});

test("GET /badge.json is a valid Shields endpoint payload", async () => {
  const res = await get("/badge.json?tz=Asia/Seoul&pack=ko&color=blue&style=flat&labelColor=333");
  const body = await res.json();
  assert.equal(body.schemaVersion, 1);
  assert.equal(body.label, "Today is ...");
  assert.equal(body.color, "blue");
  assert.equal(body.labelColor, "333");
  assert.equal(body.style, "flat");
  assert.ok(body.cacheSeconds >= 300);
  assert.ok(body.message.length > 0);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("legacy: bare / with params renders a badge; bare / redirects to the landing page", async () => {
  const legacy = await get("/?tz=UTC");
  assert.match(legacy.headers.get("content-type"), /svg/);
  const root = await get("/");
  assert.equal(root.status, 302);
  assert.equal(root.headers.get("location"), LANDING_URL);
});

test("style / colour / label are sanitised", async () => {
  const res = await get(`/badge.svg?style=evil&color=${encodeURIComponent('red" onload="x')}&label=${encodeURIComponent("<b>hi</b>")}`);
  const svg = await res.text();
  assert.ok(svg.includes('height="28"')); // fell back to for-the-badge
  assert.ok(!svg.includes("onload"));
  assert.ok(!svg.includes("<b>"));
  assert.ok(svg.includes("&lt;B&gt;HI&lt;/B&gt;"));
});

test("label= may be empty (message-only badge)", async () => {
  const res = await get("/badge.svg?label=&style=flat");
  const svg = await res.text();
  assert.ok(!svg.includes("Today is"));
});

test("computed packs via HTTP", async () => {
  const moon = await (await get("/api/today?pack=moon")).json();
  assert.match(moon.message, /Moon · \d+% lit/);
  const cd = await (await get("/api/today?pack=countdown&to=12-25&event=Christmas&tz=Australia/Sydney")).json();
  assert.equal(cd.message, "105 days until Christmas");
  const yr = await (await get("/api/today?pack=year")).json();
  assert.match(yr.message, /% of 2026/);
});

test("comma packs alternate and unknown packs fall back to default", async () => {
  const unknown = await (await get("/api/today?pack=does-not-exist")).json();
  assert.equal(unknown.pack, "default");
  const multi = await (await get("/api/today?pack=dev-humor,tech-facts")).json();
  assert.ok(["dev-humor", "tech-facts"].includes(multi.pack));
});

test("GET /api/packs lists every pack with today's message; /api/packs/:name dumps one", async () => {
  const list = await (await get("/api/packs?tz=Australia/Sydney")).json();
  assert.equal(list.date, "2026-09-11");
  assert.ok(list.packs.length >= 20);
  assert.ok(list.packs.every((p) => p.today && p.title && p.emoji));
  const one = await (await get("/api/packs/ko")).json();
  assert.equal(one.name, "ko");
  assert.ok(Array.isArray(one.messages) && one.messages.length >= 30);
  assert.equal((await get("/api/packs/nope")).status, 404);
  const computed = await (await get("/api/packs/moon")).json();
  assert.equal(computed.fn, undefined); // functions are not serialised
});

test("GET /health, 404, 405", async () => {
  assert.equal((await (await get("/health")).json()).ok, true);
  assert.equal((await get("/nope")).status, 404);
  const post = await handle(new Request("https://x.workers.dev/badge.svg", { method: "POST" }), { now: NOW });
  assert.equal(post.status, 405);
});

test("readParams clamps lengths", () => {
  const p = readParams(new URL(`https://x/?label=${"a".repeat(100)}&pack=${"b".repeat(400)}&seed=${"s".repeat(100)}`));
  assert.equal(p.label.length, 40);
  assert.equal(p.pack.length, 300);
  assert.equal(p.seed.length, 64);
});

// ─── Remote packs ─────────────────────────────────────────────
test("remotePackUrl only ever targets GitHub raw hosts", () => {
  assert.equal(remotePackUrl("gh:alice/quotes/pack.json"), "https://raw.githubusercontent.com/alice/quotes/HEAD/pack.json");
  assert.equal(remotePackUrl("gh:alice/quotes/dir/pack.json@v1.2"), "https://raw.githubusercontent.com/alice/quotes/v1.2/dir/pack.json");
  assert.equal(remotePackUrl("gist:alice/0123abcd/pack.json"), "https://gist.githubusercontent.com/alice/0123abcd/raw/pack.json");
  assert.equal(remotePackUrl("https://raw.githubusercontent.com/a/b/main/p.json?x=1#f"), "https://raw.githubusercontent.com/a/b/main/p.json");
  assert.equal(remotePackUrl("https://evil.example/p.json"), undefined);
  assert.equal(remotePackUrl("http://raw.githubusercontent.com/a/b/c"), undefined);
  assert.equal(remotePackUrl("gh:../etc/passwd"), undefined);
  assert.equal(remotePackUrl("gh:a/b/../../x"), undefined);
  assert.equal(remotePackUrl("dev-humor"), undefined);
  assert.equal(remotePackUrl("gh:a/b/c@" + "x".repeat(300)), undefined);
});

test("validateRemotePack accepts arrays and Month-Day objects only", () => {
  assert.equal(validateRemotePack(["a", "b"]).messages.length, 2);
  assert.equal(validateRemotePack(["a", 1, "", "  b  "]).messages.join("|"), "a|b");
  assert.equal(validateRemotePack({ "January 1": "hi", bogus: "x", "March 3": 5 }).messages["January 1"], "hi");
  assert.equal(validateRemotePack({ "January 1": "hi", bogus: "x" }).messages.bogus, undefined);
  assert.equal(validateRemotePack([]), undefined);
  assert.equal(validateRemotePack({}), undefined);
  assert.equal(validateRemotePack("string"), undefined);
  assert.equal(validateRemotePack(null), undefined);
  assert.equal(validateRemotePack(["x".repeat(201)]), undefined);
  assert.equal(validateRemotePack(new Array(2001).fill("x")), undefined);
});

test("remote pack end-to-end, including failure modes", async () => {
  const url = "https://raw.githubusercontent.com/alice/quotes/HEAD/pack.json";
  const fetcher = fakeFetch({
    [url]: ["Only line", "Second line"],
    "https://raw.githubusercontent.com/alice/quotes/HEAD/cal.json": { "September 11": "Cal hit" },
    "https://raw.githubusercontent.com/alice/quotes/HEAD/broken.json": "{not json",
  });
  const ok = await (await get("/api/today?pack=gh:alice/quotes/pack.json", { fetcher })).json();
  assert.ok(["Only line", "Second line"].includes(ok.message));
  assert.equal(ok.pack, "gh:alice/quotes/pack.json");

  const cal = await (await get("/api/today?pack=gh:alice/quotes/cal.json&tz=UTC", { fetcher })).json();
  assert.equal(cal.message, "Cal hit");

  const missing = await get("/badge.svg?pack=gh:alice/quotes/missing.json", { fetcher });
  assert.equal(missing.headers.get("x-daily-badge-pack"), "gh:alice/quotes/missing.json");
  assert.match(await missing.text(), /PACK UNAVAILABLE/);
  assert.match(missing.headers.get("cache-control"), /max-age=300/);

  const broken = await (await get("/badge.json?pack=gh:alice/quotes/broken.json", { fetcher })).json();
  assert.equal(broken.isError, true);
  assert.equal(broken.color, "red");

  assert.equal(await fetchRemotePack(url, async () => { throw new Error("network"); }), undefined);
  assert.equal(await fetchRemotePack(url, async () => new Response("x".repeat(70000))), undefined);
});

