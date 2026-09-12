# Motion review 1 — tear (ChatGPT temporary chat, 2026-09-11 ~16:10 Sydney)

Inputs: `motion/tear/strip-1.png` (17 frames, 0–450 ms + HOLD), `concepts/storyboard-tear.png`,
`motion/build-desktop-1.png`, DESIGN.md motion table.

**VERDICT: PIVOT**

Reasons (condensed from the reply):
1. Core motion language correct: upward exit, −0.35° rotation, no fade, stage clipping, preloaded
   replacement, restrained 6px→0 landing all fit the storyboard.
2. Easing correct — exit reads back-loaded (cubic-bezier(.42,0,.78,.28)), settle a clear
   deceleration (cubic-bezier(.16,1,.30,1)); no overshoot; nothing linear. Keep transforms as is.
3. Cadence: 390 ms fine overall, but the semantic swap is concentrated in 220–280 ms; the 70 ms
   overlap exists but is not legible because the settle is ~91% done by 180 ms while still buried.
4. **220 ms frame is a glitch, not a tear**: fragments of old and new message lines share the same
   band with no physical boundary cue; both sheets are the same cream stock.
5. Fix the clip, not the transforms: keep seam direction bottom→top, keep −44px / +6px, give the
   clip its own keyframed timing over 280 ms — inset-bottom 0% @0, 8% @70, 30% @180, 82% @210,
   94% @240, 100% @280 ms; 180→210 ms with cubic-bezier(.20,.75,.30,1), final clearance
   cubic-bezier(.16,1,.30,1) — so the seam crosses the message band in ~30 ms. Add a travelling
   1px ink seam line at the clip boundary (an edge cue, not a shadow).
6. No geometric jank; runtime frame drops cannot be judged from paused states.
7. Recapture 190–260 ms at 10 ms; include 450 ms and HOLD uncropped; add a reduced-motion
   before/after.

Applied in `index.html` (commit after this file): `@property --seam`, `seam` keyframes as
specified, `::after` 1px ink line at `bottom: var(--seam)`. Recaptured → `motion/tear/strip-2.png`,
`motion/tear/reduced-motion-1.png` (0 animations observed during the reduced-motion swap).
