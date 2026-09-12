# Motion review 2 — tear (ChatGPT temporary chat, 2026-09-11 ~16:30 Sydney)

Inputs: `motion/tear/strip-2.png` (0, 70, 140, 180, 190–260 @10 ms, 280, 320, 390, 450 ms, HOLD),
`motion/tear/reduced-motion-1.png` (before/after; 0 animations observed over 2 s of polling).

**VERDICT: PASS**

1. Storyboard match: one continuous physical event; outgoing sheet identifiable through 180 ms,
   reveal accelerates through the high-information area, new sheet owns the frame by 220 ms.
2. Easing: staged clip timing fixed the wipe-like feel; slow 0→8% opening, restrained to 180 ms,
   rapid 180→210 ms crossing as a release point; .16,1,.30,1 clearance avoids a hard stop.
3. Cadence: 180–210 ms passage is the right duration; settle stays visibly softer than the tear.
4. Seam line: 1px #24201D is sufficient; do not thicken.
5. 200–210 ms badge overlap: acceptable — reads as printed bands on two stacked sheets; ~one frame
   at 60 Hz.
6. No new discontinuity; 450 ms vs HOLD stable, no late snap.
7. Reduced motion: atomic state change confirmed.

Final strip for this component: `motion/tear/final.png` (= strip-2).
