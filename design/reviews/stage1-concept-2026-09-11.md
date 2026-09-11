# Stage 1 — concept directions (ChatGPT temporary chat, 2026-09-11 ~13:00–13:20 Sydney)

Three directions were returned: **Paper Midnight** (tear-off desk calendar; Fraunces + IBM Plex Mono;
paper #FFF8EA / ink #24201D / pink #FF4D97), **Badge Machine №366** (vending-machine face; Bowlby One SC
+ DM Mono; output slot changes shape per badge style), **The Daily Transmission** (broadcast log;
Newsreader + Space Mono; NEXT TRANSMISSION countdown to local midnight).

Claude's pushback (one round, as the workflow requires):
1. Paper Midnight's signature moment fires at midnight, when nobody is on the page — a moment for
   zero users. Proposed: tear on every committed control change, plus borrow Transmission's countdown
   as a subordinate printed line (`NEXT SHEET IN 10:11:42` → `RECEIVING`).
2. Fraunces has no CJK coverage and 7/21 packs are CJK or accented Latin — needed per-script stacks
   and a size rule that makes a 4-grapheme Korean line and a 62-char English pun both look intentional.
3. Skeuomorphism boundary — which physical cues are allowed vs banned; and native `<select>` only.

ChatGPT agreed with all three, added: tear only on *committed* change (`change`, not colour-picker
`input`); stage the next sheet underneath and wait for the SVG `<img>` to load before tearing (never
reveal a blank); `PREPARING NEXT SHEET` if the load is slow; Noto Serif KR/JP/SC at weight 600 only;
discrete length classes (xs/sm/md/lg) instead of continuous shrinking; strip reflows to 2 columns
≤600px and TZ/PACK full-width ≤420px; `appearance:none` closed field only, native popup.

Final merged direction → `design/DESIGN.md` (transcribed verbatim from the returned spec).
Chosen: **Paper Midnight (merged)**.
