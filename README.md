# 🌟 Daily Badge

[![Tests](https://github.com/in-c0/daily-badge/actions/workflows/tests.yml/badge.svg)](https://github.com/in-c0/daily-badge/actions/workflows/tests.yml)
[![Deploy Worker](https://github.com/in-c0/daily-badge/actions/workflows/worker-deploy.yml/badge.svg)](https://github.com/in-c0/daily-badge/actions/workflows/worker-deploy.yml)

**One URL. A new message on your GitHub profile every day, in your timezone.**
Fun days, dev humour, Stoic lines, science, the moon phase, a countdown, or your
own list — 21 packs in 8 languages, rendered at the edge, free, no sign-up.

![Daily Badge cycling through the year](assets/daily-badge-demo.gif)

```markdown
![Daily Badge](https://daily-badge.wldud5192.workers.dev/badge.svg?tz=Australia/Sydney)
```

**🎨 [Open the customizer →](https://in-c0.github.io/daily-badge/)** — pick your
timezone, pack, style and colour with a live preview, then copy the snippet.

## What it looks like

| | |
|---|---|
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?tz=Australia/Sydney) | `pack=default` — a curated "on this day" for all 366 days |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=dev-humor&style=flat) | `pack=dev-humor&style=flat` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=tech-facts&style=flat-square&color=blue) | `pack=tech-facts&style=flat-square&color=blue` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=stoic&style=plastic&color=555&label=stoa) | `pack=stoic&style=plastic&label=stoa` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=space&style=social&label=space) | `pack=space&style=social` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=moon&style=flat&color=midnightblue&label=tonight) | `pack=moon` — phase + illumination, computed |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=year&style=flat-square&color=teal&label=2026) | `pack=year` — progress bar through the year |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=countdown&to=12-25&event=Christmas&color=green) | `pack=countdown&to=12-25&event=Christmas` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=weekday&style=flat&color=gold) | `pack=weekday` — Monday ≠ Friday |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=ko&tz=Asia/Seoul&style=flat&color=hotpink&label=오늘) | `pack=ko&tz=Asia/Seoul` — also `ja` `zh` `es` `fr` `de` `pt` |
| ![](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=wholesome&label=psst&color=lavender) | `pack=wholesome&label=psst` |

## Packs

`default` 🌟 · `dev-humor` 🐛 · `tech-facts` 💡 · `motivation` 🔥 · `stoic` 🏛️ ·
`science` 🔬 · `space` 🪐 · `wholesome` 💖 · `productivity` ⏱️ · `puns` 🥁 ·
`ko` 🇰🇷 · `ja` 🇯🇵 · `zh` 🇨🇳 · `es` 🇪🇸 · `fr` 🇫🇷 · `de` 🇩🇪 · `pt` 🇧🇷 ·
`moon` 🌕 · `weekday` 📅 · `year` 📈 · `countdown` ⏳

Mix them: `pack=dev-humor,tech-facts` alternates by day. Preview any date with
`&date=2026-12-25`. Add `&seed=yourname` so your profile doesn't show the same
line as everyone else's. Full parameter reference: [`worker/README.md`](worker/README.md).

### Bring your own messages — no fork, no PR

Put a JSON file in any public repo or gist and point the badge at it:

```markdown
![Daily Badge](https://daily-badge.wldud5192.workers.dev/badge.svg?pack=gh:YOUR-USER/YOUR-REPO/messages.json)
```

```json
["Ship it", "Fix it", "Ship it again"]
```

An array rotates by day of year; an object keyed by `"Month Day"` is date-specific.
Details and limits in [`worker/README.md`](worker/README.md#bring-your-own-pack-no-pr-needed).

## Three ways to use it

### 1. The URL (recommended)

Paste the snippet above into your profile README (the repo named after your
username). The badge is an SVG computed at the edge — pixel-identical to
Shields.io, cached until *your* local midnight, no image proxy round-trip to a
third service.

Prefer Shields' own renderer? The same endpoint speaks its protocol:

```markdown
![Daily Badge](https://img.shields.io/endpoint?url=https://daily-badge.wldud5192.workers.dev/badge.json%3Ftz%3DAsia/Seoul%26pack%3Dko&style=for-the-badge)
```

### 2. As text in your README (GitHub Action)

Want the message as real, selectable text rather than an image? Add the markers
to your README:

```markdown
<!-- daily-badge:start -->
<!-- daily-badge:end -->
```

and a workflow in your profile repo:

```yaml
# .github/workflows/daily-badge.yml
on:
  schedule: [{ cron: "0 14 * * *" }]   # 00:00 Sydney; pick your own
  workflow_dispatch:
permissions: { contents: write }
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: in-c0/daily-badge@v2
        with:
          pack: dev-humor
          tz: Australia/Sydney
          template: "> 🌟 **{message}**"
```

Inputs: `file`, `pack`, `tz`, `template` (`{message} {date} {iso} {weekday} {pack} {tz}`),
`seed`, `to`/`event` (countdown), `commit`, `commit-message`. Built-in packs
resolve locally — the action makes no network calls.

### 3. Fork it (the original)

Fork, edit [`timezone.txt`](timezone.txt), and the included workflow writes
[`badge.json`](badge.json) daily for `img.shields.io/endpoint`. Standard-library
Python, nothing to install. Messages live in [`What_Day_365.csv`](What_Day_365.csv).

```markdown
![Daily Badge](https://img.shields.io/endpoint?url=https://YOUR-USER.github.io/daily-badge/badge.json&style=for-the-badge)
```

## How it works

- **Worker** ([`worker/`](worker/)) — a Cloudflare Worker with no runtime
  dependencies. Timezones come from the runtime's ICU database; text is measured
  with the same Verdana/Helvetica width tables Shields uses, bundled at build
  time, with explicit rules for CJK and emoji. Every response carries
  `Cache-Control: max-age=<seconds until the viewer's local midnight>`, so the
  edge absorbs nearly all traffic and the free tier is plenty.
- **Tests** — 46 cases run without wrangler, including a geometry comparison
  against `badge-maker` for all five styles, and a render of every message in
  every pack on every day of the year.
- **Privacy** — nothing is stored; there are no cookies, no analytics, no logs
  of who viewed what.

## Contributing a pack

Drop a file in [`worker/src/packs/`](worker/src/packs/), register it in
[`index.js`](worker/src/packs/index.js), run `npm test`. Messages ≤ 64 chars,
no duplicates, no angle brackets. Native-language packs are especially welcome.

---

Made with ❤️ by [in-c0](https://github.com/in-c0). Renderer ported from
[badge-maker](https://github.com/badges/shields/tree/master/badge-maker) (CC0).
