# daily-badge Worker

The zero-fork version. Adopters paste **one URL** — no fork, no Actions, no
per-user infra. Live at `https://badge.ava.kim` (the original
`https://daily-badge.wldud5192.workers.dev` keeps working).

```markdown
![Daily Badge](https://badge.ava.kim/badge.svg?tz=Australia/Sydney&pack=dev-humor)
```

## Endpoints

| Route | Returns |
|-------|---------|
| `GET /badge.svg` | Rendered SVG badge — pixel-identical to Shields.io, computed at the edge |
| `GET /badge.json` | Shields.io `endpoint`-compatible JSON (for `img.shields.io/endpoint?url=…`) |
| `GET /api/today` | JSON: `{date, weekday, dayOfYear, tz, pack, label, message}` |
| `GET /api/packs` | JSON: every pack with metadata and today's message |
| `GET /api/packs/:name` | JSON: one pack, all messages |
| `GET /health` | `{ok, version, packs}` |
| `GET /` | redirects to the customizer |

### Query params (all endpoints)

| Param | Default | Notes |
|-------|---------|-------|
| `tz` | `UTC` | Any IANA timezone (`Asia/Seoul`, `America/New_York`). Invalid → UTC. |
| `pack` | `default` | A pack name, a comma list (`dev-humor,tech-facts` alternates by day), or a remote pack — see below. |
| `style` | `for-the-badge` | `flat` · `flat-square` · `plastic` · `for-the-badge` · `social` |
| `color` | `pink` | Shields names (`brightgreen`, `blue`…), CSS names (`hotpink`), hex (`ff69b4`), `rgb()` / `hsl()` |
| `labelColor` | `#555` | Left-side colour, same formats |
| `label` | `Today is ...` | Left-side text (≤ 40 chars). `label=` for a message-only badge. |
| `date` | today | `YYYY-MM-DD` — preview any day |
| `seed` | — | Any string. Rotating packs are offset by it, so two profiles don't show the same line. |
| `to`, `event` | — | For `pack=countdown`: `to=12-25` (annual) or `to=2027-06-01`; `event=Christmas` |

### Packs

| Pack | | Kind | What you get |
|------|-|------|--------------|
| `default` | 🌟 | calendar | A curated "on this day" observance for all 366 days |
| `dev-humor` | 🐛 | rotating | Developer comedy |
| `tech-facts` | 💡 | rotating | Computing trivia |
| `motivation` | 🔥 | rotating | A short push, no platitudes |
| `stoic` | 🏛️ | rotating | Marcus, Seneca, Epictetus |
| `science` | 🔬 | rotating | Checkable science facts |
| `space` | 🪐 | rotating | Beyond the atmosphere |
| `wholesome` | 💖 | rotating | Kind words for your visitors |
| `productivity` | ⏱️ | rotating | One practical tip |
| `puns` | 🥁 | rotating | You've been warned |
| `ko` `ja` `zh` `es` `fr` `de` `pt` | 🌏 | rotating | Native-language packs (Korean, Japanese, Chinese, Spanish, French, German, Portuguese) |
| `moon` | 🌕 | computed | Tonight's phase + illumination: `🌔 Waxing Gibbous · 81% lit` |
| `weekday` | 📅 | computed | A different mood for Monday than Friday |
| `year` | 📈 | computed | `▓▓▓▓▓▓▓░░░ 70% of 2026 · day 254/365` |
| `countdown` | ⏳ | computed | `105 days until Christmas` |

### Bring your own pack (no PR needed)

Host a JSON file on GitHub and point the badge at it:

```
?pack=gh:owner/repo/path/pack.json          # default branch
?pack=gh:owner/repo/path/pack.json@v1       # any ref
?pack=gist:username/gistid/pack.json
```

The file is either an **array** of strings (rotated by day of year) or an
**object** keyed by `"Month Day"` (date-specific):

```json
["Ship it", "Fix it", "Ship it again"]
```
```json
{ "January 1": "Happy new year!", "December 25": "Merry Christmas!" }
```

The Worker fetches only from `raw.githubusercontent.com` / `gist.githubusercontent.com`,
caps files at 64 KB, validates the shape, and caches for an hour. A missing or
malformed file renders a red `pack unavailable` badge rather than failing silently.

## How it stays fresh (and free)

The message only changes at the viewer's **local midnight**, so each response sets
`Cache-Control: max-age=<seconds until next local midnight>`. Cloudflare's edge and
GitHub's image proxy both honour it; origin hits are minimal, comfortably inside the
Workers **free tier**.

Timezones use the ICU database built into the runtime (`Intl`). Text is measured
with the same Verdana/Helvetica width tables Shields uses, bundled at build time,
plus explicit rules for CJK and emoji — so Korean and Japanese badges are laid out
correctly rather than guessed. No dependencies at runtime; nothing about the viewer
is stored.

## Develop / test / deploy

```bash
cd worker
npm install
npm test              # 46 tests, no wrangler needed (handler is a plain function)
npx wrangler dev      # http://localhost:8787/badge.svg?tz=Australia/Sydney
npx wrangler deploy   # or push to main — .github/workflows/worker-deploy.yml
```

The test suite includes a comparison against `badge-maker` (the actual Shields
renderer): every style must produce identical geometry.

## Adding a pack

1. Create `src/packs/<name>.js` exporting `{ name, title, emoji, lang, description, kind, messages }`
   (`kind` = `rotating` with an array, or `calendar` with `"Month Day"` keys).
2. Import it in `src/packs/index.js` and add it to `STATIC`.
3. `npm test` — it checks length (≤ 64 chars), uniqueness, XML safety, and renders
   every message in every style for every day of the year.

Regenerate the width tables only if you bump `anafanafo`: `npm run build:widths`.
