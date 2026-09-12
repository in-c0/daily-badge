# daily-badge v2

One URL, a new message on your GitHub profile every day, in your timezone.

## New
- **21 packs.** The 366-day "on this day" calendar, dev humour, tech facts, motivation, Stoic,
  science, space, wholesome, productivity, puns; Korean, Japanese, Chinese, Spanish, French,
  German, Portuguese; and four computed packs: moon phase, weekday, year progress, countdown.
- **Bring your own messages.** `?pack=gh:you/your-repo/messages.json` — a JSON list in any
  public repo or gist. No fork, no pull request.
- **GitHub Action.** `uses: in-c0/daily-badge@v2` writes today's line into your README as real
  text between two markers.
- **Customizer.** A tear-off calendar at https://in-c0.github.io/daily-badge/ — pick timezone,
  pack, style and colour, watch the real badge, copy the line.
- `date=` to preview any day, `seed=` so your profile differs from the next person's,
  `labelColor=`, comma-separated packs that alternate by day, `/api/today`, `/api/packs`.

## Changed
- The badge is now rendered at the edge with the same font metrics Shields.io uses, so it looks
  identical to the badges you already have — including Korean, Japanese and Chinese text.
- The fork path needs no dependencies (Python standard library only).
- VS Code extension 1.1.0 can select any of the 21 packs.

Existing badge URLs keep working unchanged.
