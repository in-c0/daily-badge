# Design brief — daily-badge landing page / customizer

Written 2026-09-11 12:50 Sydney (+10:00). Stage 0 of `uiux-workflow`.
Owner confirmed the feeling ("Delight") in chat; references below are Claude's
stated assumptions, to be replaced if the owner names her own.

## What it is
A single-page site at https://in-c0.github.io/daily-badge/ where a GitHub user
picks a timezone, a message pack, a badge style and a colour, watches the live
badge update, and copies one line of Markdown into their profile README.
Secondary: a gallery of what the 21 packs look like, and a short explanation
of "bring your own pack" and the GitHub Action.

## Who uses it, when
Developers browsing GitHub, usually on a laptop in a browser tab next to their
profile README, attention span ~60 seconds, arriving from the repo README or a
badge someone else has. They are deciding whether a tiny thing is worth
adding to their profile. Some on phones from a GitHub notification.

## The one feeling
**Delight.** A small daily gift. The badge is the hero — it is the product, and
the page should feel like the place the badge lives, not a settings form.
Think: a well-made tear-off desk calendar; a Tamagotchi; the first time a
Shields badge showed "passing" on your repo.

## References (assumed, owner may replace)
Liked:
- Tear-off desk calendars (one big number/message a day; physical, warm).
- shields.io's badge itself — the tiny, exact, familiar object.
- Nintendo eShop / Animal Crossing UI — playful without being childish;
  rounded but crisp, strong colour discipline.
- readme.so / github-readme-stats demo pages: single purpose, snippet-first.
Hated:
- Generic SaaS landing pages (hero + three feature cards + CTA, purple
  gradients, "Elevate your profile").
- Dashboard-shaped settings forms with a preview bolted on top.

## Hard constraints
- Static HTML on GitHub Pages: one `index.html`, inline CSS/JS, no build step,
  no framework. Fonts via Google Fonts allowed (with real fallback stacks).
- Must call the live Worker: `/api/packs`, `/api/today`, `/badge.svg?…`.
  The preview IS the real badge SVG — no mock.
- Must work without JS well enough to show the default snippet.
- Must respect `prefers-color-scheme` and `prefers-reduced-motion`.
- Keyboard-operable; contrast AA on the actual palette.
- The copy snippet is the conversion; it must be reachable within one screen
  on desktop and within one scroll on a phone.
- Existing brand cue: the current page is pink (#ff4d97 accent) and the badge
  default colour is `pink`. Keep pink as a starting point unless the concept
  argues otherwise.
- No emoji-as-icons for structural UI (pack emoji inside the pack list are
  content, not chrome).

## What exists today
`index.html` on main: a centred 760px card, system font, pink accent, four
selects, a preview box, a snippet with a Copy button. Functional, generic.
Screenshot to be captured at Stage 3 for before/after.

## Assets available
- Every badge style/pack renders live from the Worker (real SVG).
- `assets/daily-badge-demo.gif` (badge cycling through the year).
- The Worker returns `/api/packs` with emoji + title + today's message for all
  21 packs, so a live "wall" of today's messages is possible with no design
  assets.

## Success
A visitor understands in 5 seconds that this is a badge that changes daily,
sees today's actual message, and copies a snippet. The page should be
recognisable as *this* product from a thumbnail.
