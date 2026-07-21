# daily-badge Worker

Zero-fork version of the daily badge. Adopters paste **one URL** — no fork, no
Actions cron, no per-user infra.

```markdown
![Daily Badge](https://daily-badge.<you>.workers.dev/badge.svg?tz=Australia/Sydney)
```

## Endpoints

| Route | Returns |
|-------|---------|
| `GET /badge.svg` | Rendered SVG badge (default) |
| `GET /badge.json` | Shields.io `endpoint`-compatible JSON |

### Query params

| Param | Default | Notes |
|-------|---------|-------|
| `tz` | `UTC` | Any IANA timezone, e.g. `Australia/Sydney`. Invalid → UTC. |
| `color` | `pink` | Any CSS color or Shields color name. |
| `label` | `Today is ...` | Left side text. |
| `style` | `for-the-badge` | `flat` \| `flat-square` \| `plastic` \| `for-the-badge` \| `social`. |

## How it stays fresh (and cheap)

The message only changes at the viewer's **local midnight**, so each response sets
`Cache-Control: max-age=<seconds-until-next-local-midnight>`. Cloudflare's edge
serves the cached badge until then, so origin hits are minimal — comfortably inside
the Workers **free tier** ($0/mo).

Timezones use the ICU database built into the Workers runtime (`Intl`), so there's
**no third-party dependency** to install or break.

## Develop / deploy

```bash
cd worker
npm install
npx wrangler dev      # local: http://localhost:8787/badge.svg?tz=Australia/Sydney
npx wrangler login
npx wrangler deploy
```

## Updating messages

`src/messages.json` is generated from `../What_Day_365.csv`:

```bash
python - <<'PY'
import pandas as pd, json
df = pd.read_csv("../What_Day_365.csv")
data = {str(r["Day"]).strip(): str(r["Message"]).strip() for _, r in df.iterrows()}
json.dump(data, open("src/messages.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
PY
```
