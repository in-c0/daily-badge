# Design log
Stage: 4 — motion review of the tear (review 2 in progress)
Direction: Paper Midnight (merged with Transmission's countdown) — chosen 2026-09-11
## Components
| component | build | review # | verdict | notes |
|---|---|---|---|---|
| tear (sheet change) | motion/tear/strip-1.png | 1 | PIVOT | seam lingered through message band; fixed with keyframed seam + 1px ink line → strip-2.png |
| calendar sheet / strip / md-strip (static) | motion/build-desktop-1.png, build-phone-ko-1.png, build-dark-1.png | — | — | static; contrast AA on all pairs; keyboard ring on all 9 stops; 360px no overflow; snippet at 583px |
## Open questions (ASK OWNER)
- References in BRIEF.md are Claude's assumptions; owner may replace.
## Session history
- 2026-09-11 12:50 Sydney (+10:00) — Stage 0: BRIEF.md written. Chrome selected ("windows").
- 2026-09-11 13:00–13:25 — Stage 1: temporary chat; 3 directions; one pushback round; merged spec → DESIGN.md; transcript summary in reviews/stage1-concept-2026-09-11.md.
- 2026-09-11 15:20–15:35 — Stage 2: regular chat "New chat" (chatgpt.com/c/6aa37cc3-265c-83ec-8b52-650bce0f920d — owner may delete). Three renders, each accepted on round 1; owner granted download permission in chat; saved to design/concepts/. DESIGN.md references all three.
- 2026-09-11 15:40–16:05 — Stage 3: index.html built from DESIGN.md; wrangler dev + headless Edge harness (design/capture*.mjs, check-a11y.mjs). Found + fixed: Workers runtime rejects non-handler exports (worker split into app.js/index.js).
- 2026-09-11 16:10 — Stage 4 review 1: PIVOT (reviews/tear-1.md). Applied; recaptured strip-2 + reduced-motion evidence. Review 2 sent.
