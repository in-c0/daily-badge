# DESIGN.md — Paper Midnight (merged)

Source: Stage 1 concept + one round of pushback, ChatGPT temporary chat, 2026-09-11 Sydney.
See `reviews/stage1-concept-2026-09-11.md`. Concept images: see "Concept art" at the end.

## Thesis
daily-badge is a single fresh sheet on a quiet desk: today's tiny real GitHub badge, one daily
message worth noticing, four printing choices, then the exact line to paste into a README. The
defining interaction is the **sheet change**: every committed pack / timezone / style / colour
change prepares the next real API-backed SVG underneath, then tears the old badge+message sheet
upward to expose it. A tiny printed `NEXT SHEET IN 10:11:42` line explains the local-midnight
promise continuously; at zero it reads `RECEIVING` until tomorrow's real SVG has loaded, then uses
the same tear.

## Palette
Pink is the **only** brand/accent hue. No calendar red, no blue status colours, no secondary hues.
Pink always carries dark ink (#FF4D97 on #24201D is AA). No gradients anywhere.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--desk` | #EAE1D2 | #151412 | Page outside the sheet |
| `--paper` | #FFF8EA | #24211D | Main calendar sheet |
| `--ink` | #24201D | #F8F0E4 | Primary text |
| `--muted` | #6D655D | #B8AEA2 | Secondary / footnote text |
| `--rule` | #968A7C | #7A7166 | 1px borders, hairline, field boundaries |
| `--accent` | #FF4D97 | #FF6AA9 | Badge default, selected state, copy acknowledgement |
| `--accent-soft` | #FFE1EE | #4A2435 | Hover/selected field background only |
| `--accent-ink` | #24201D | #181614 | Text on accent |
| `--focus` | #A81E5E | #FF92BF | 2px keyboard focus outline |
| `--code-bg` | #24201D | #0F0E0D | Markdown snippet |
| `--code-ink` | #FFF8EA | #F8F0E4 | Markdown snippet text |

Declare `color-scheme: light dark`; explicit tokens control the page; dark values under
`@media (prefers-color-scheme: dark)`.

## Type
Load: Fraunces 400/600/700 · IBM Plex Mono 400/500/600 · Noto Serif KR / JP / SC at **600 only**.
Chinese pack is `lang="zh-Hans"`.

```css
.message[data-script="latin"]    { font-family: "Fraunces","Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif; }
.message[data-script="hangul"]   { font-family: "Noto Serif KR","AppleMyungjo",Batang,serif; }
.message[data-script="japanese"] { font-family: "Noto Serif JP","Yu Mincho","Hiragino Mincho ProN","Hiragino Mincho Pro",serif; }
.message[data-script="chinese"]  { font-family: "Noto Serif SC","Songti SC",STSong,SimSun,serif; }
.mono                            { font-family: "IBM Plex Mono","SFMono-Regular",Consolas,"Liberation Mono",monospace; }
```

Display size: count grapheme clusters excluding whitespace (`Intl.Segmenter`, fallback `[...text]`),
assign one discrete class:

```css
.message        { font-size: clamp(32px, var(--message-fluid), 88px); }
.message.len-xs { --message-fluid: calc(38px + 3.5vw); } /* 1–8 */
.message.len-sm { --message-fluid: calc(32px + 2.6vw); } /* 9–18 */
.message.len-md { --message-fluid: calc(28px + 2vw);   } /* 19–36 */
.message.len-lg { --message-fluid: calc(26px + 1.5vw); } /* 37+ */
```
Latin: `max-inline-size: min(18ch, 760px); line-height: .98; text-wrap: balance`.
CJK: `max-inline-size: min(10em, 760px); line-height: 1.10`; Hangul `word-break: keep-all`;
JP/ZH `line-break: strict`. Never truncate or force one line; four lines is intentional.

| Role | Face | Size | Weight | Treatment |
|---|---|---|---|---|
| Display message | script serif | clamp(32px, fluid, 88px) | 600 | .98 Latin / 1.10 CJK |
| Date rail numeral | Fraunces | 32px desktop / 26px phone | 700 | lh 1; tabular nums |
| Date rail metadata | Plex Mono | 11px | 600 | lh 1.35; .08em tracking; uppercase |
| Pack label | Plex Mono | 12px | 600 | lh 1.4; .06em tracking |
| Control label | Plex Mono | 10px | 600 | lh 1.2; .08em tracking; uppercase |
| Control value | Plex Mono | 14px | 500 | lh 1.25 |
| Markdown snippet | Plex Mono | 13px | 500 | lh 1.5 |
| Body | Fraunces | 17px | 400 | lh 1.55 |
| Wall message | script serif | 20px | 600 | lh 1.35 Latin / 1.5 CJK |
| Footnote / countdown | Plex Mono | 11px | 500 | lh 1.4; tabular nums |

The countdown is always subordinate — never a timer widget.

## Composition
Desktop: `max-width: 1040px` stage, 32px gutters; badge + message + controls + snippet fit the
first viewport at laptop heights. Sheet grid `72px minmax(0,1fr)`: left column = date rail
(FRI / SEP / 11, vertical); right column = pack label, real badge SVG at intrinsic size, message,
countdown, perforation, controls. Message owns the flexible space; controls sit at the bottom. The
dark Markdown strip touches the sheet directly below and holds the one-line snippet + Copy.
≤600px: gutters 12px; date rail becomes a horizontal date line across the top; order unchanged;
snippet begins within ~620px of document top at 360px width.

Two identically sized sheet layers, no visible stack offset. On a setting change: populate the
under-layer with new text + new SVG URL, wait for `img` load/decode, then tear. If slow, keep the
current sheet and set the countdown line to `PREPARING NEXT SHEET`. Never a skeleton, spinner,
fake badge, or empty frame.

Below the snippet (64px later): the **today wall** — one continuous vertical `<ol>` of all packs,
pack name in mono + real message in script serif; rows, not cards; no equal heights. Then the
bring-your-own note (short text + minimal JSON specimen), the GitHub Action alternative (one
sentence + YAML), footer with source/API links, nothing promotional.

## Spacing
`--s1` 4 · `--s2` 8 · `--s3` 12 (phone gutter) · `--s4` 16 · `--s5` 24 · `--s6` 32 (desktop sheet
padding) · `--s7` 48 · `--s8` 64 (between lower-page sections).
Desktop sheet padding `32px 40px 32px 0` (rail owns its width); phone `20px 16px 16px`.

## Radii
Sheet 2px · select field 3px · colour group 3px · Markdown strip 4px · Copy 3px · code sample 3px ·
wall rows 0. No global radius token; outer page sections never rounded.

## Physical cues (the complete allowed list)
`--paper` colour; **one** 1px hairline separating message from utility area; the date rail;
**one** 1px perforation line immediately above the controls (dashed/repeating, not a torn edge);
**one** crisp offset shadow: `box-shadow: 2px 2px 0 rgba(36,32,29,.14)` light /
`2px 2px 0 rgba(0,0,0,.34)` dark. Zero blur. No second shadow on anything.
**Banned:** textures, grain, noise, curled corners, torn SVG masks, staples, tape, coffee rings,
binder holes, creases, embossing, stacked-paper edges, perspective at rest, stationery props.
Rotation only during the tear, max −0.35deg.

## Printer strip (controls)
A `<form>` with four labelled groups TIMEZONE · PACK · STYLE · COLOUR.
Desktop `grid-template-columns: 1.35fr 1.35fr 1fr .9fr; gap: 12px`; ≤600px two equal columns;
≤420px timezone and pack span both columns, style and colour share the third row. Min height 44px.
Timezone/pack/style are literal `<select>`: `appearance:none; background:transparent;
border:1px solid var(--rule); border-radius:3px; height:44px; padding:0 32px 0 10px;
font:500 14px/1.25 "IBM Plex Mono"`, 6px CSS chevron 12px from inline end. Native popup. No
listbox JS. `:focus-visible { outline:2px solid var(--focus); outline-offset:2px }`.
Colour = native `<input type="color">` 32×32 + synced 7-char text field; commit on `change`,
Enter, or blur — never on picker `input`.

## Motion
| Event | Movement | Duration | Easing | Reduced motion |
|---|---|---|---|---|
| Next sheet preparation | none visible; under-layer loads | — | — | same |
| Tear: current sheet exits | translateY(0→−44px), rotate(0→−0.35deg); clipped by stage | 280ms | cubic-bezier(.42,0,.78,.28) | no transform; atomic layer swap after SVG load |
| Fresh sheet settle | under-sheet translateY(6px→0), starts after 70ms overlap | 320ms | cubic-bezier(.16,1,.30,1) | no transform |
| Control hover/focus colour | border/background only | 90ms | cubic-bezier(.2,.8,.2,1) | immediate |
| Copy acknowledgement | COPY→COPIED; button depresses 1px then returns | 140ms | cubic-bezier(.2,.9,.3,1) | text only |
| Countdown tick | text only | 0ms | — | identical |
| Midnight | `NEXT SHEET IN 00:00:00` → `RECEIVING`; normal tear after load | 0ms + tear | — | RECEIVING then immediate swap |
| Wall row hover | hairline / accent-soft background only | 90ms | cubic-bezier(.2,.8,.2,1) | immediate |

Never animate opacity during the tear. Under `prefers-reduced-motion: reduce`: no transforms,
rotations, smooth scrolling, or transition durations; keep state/text changes and focus rings.

## Component inventory
| Component | Semantic form | Required behaviour |
|---|---|---|
| Masthead | `<header>` | small `daily-badge` wordmark + Source/GitHub link; never hero-sized |
| Calendar stage | `<section>` | relative container holding exactly two sheet layers |
| Current sheet | `<article>` | date, live badge, message, countdown, controls |
| Next sheet | `<article aria-hidden="true">` while staging | receives next message + real SVG before tear |
| Date rail | `<time>` + text | day numeral, weekday, month; vertical desktop, horizontal phone |
| Pack label | text | current pack name above badge/message |
| Live badge | `<img>` | API SVG URL at intrinsic size; descriptive `alt` |
| Daily message | heading/text | script-tagged and length-classed |
| Next-sheet status | `<time>` / status text | countdown, PREPARING NEXT SHEET, or RECEIVING |
| Perforation | decorative `<div aria-hidden>` | exactly one 1px line |
| Control strip | `<form>` | timezone, pack, style, colour; native controls |
| Markdown strip | `<div>` + `<code>` | full one-line README Markdown |
| Copy button | `<button type="button">` | copies exact snippet; COPY → COPIED |
| Live status | visually hidden `role="status"` | announces badge updated / copied; not the countdown |
| Today wall | `<section>` + `<ol>` | one continuous list of all pack messages; no cards |
| Wall row | `<li>` | pack name + real message; focusable only if it selects the pack |
| Bring-your-own note | `<section>` | short explanation + minimal JSON specimen |
| GitHub Action alternative | `<section>` | one use-case sentence + YAML |
| Footer | `<footer>` | source/API links, nothing promotional |

## Do / Don't
1. **Do** keep the real API SVG small and exact-size with confident negative space. **Don't** enlarge, trace, or CSS-mock the badge.
2. **Do** run one tear per *committed* control change once the replacement SVG is ready. **Don't** tear on keystrokes, picker drags, hover, or countdown ticks.
3. **Do** let a four-character Korean message be physically large and a long pun wrap to 3–4 balanced lines. **Don't** normalise every message into the same rectangle.
4. **Do** use Fraunces/Noto Serif for the gift and Plex Mono for the machinery. **Don't** turn the page into monospace developer cosplay.
5. **Do** preserve genuine `<select>`, `<input>`, `<button>` semantics and visible `:focus-visible`. **Don't** build custom dropdowns for cross-browser sameness.
6. **Do** let the printer strip reflow to two or three rows on phones. **Don't** horizontally scroll controls or shrink targets below 44px.
7. **Do** express paper with colour, one rule, one perforation, one date rail, one crisp shadow. **Don't** add any "realistic paper" treatment.
8. **Do** make `NEXT SHEET IN…` tiny, factual, ever-present. **Don't** make it a gamified timer, urgency device, or secondary hero.

## Concept art
Stage 2 renders (regular ChatGPT chat, see LOG.md for the chat title) — referenced here as they are
captured into `design/concepts/`:
Chat: "New chat" (ChatGPT regular chat, 2026-09-11 15:20–15:35 Sydney, url chatgpt.com/c/6aa37cc3-265c-83ec-8b52-650bce0f920d) — owner may delete it.
- `concepts/hero-desktop.png` — hero screen, 16:10 (round 1, accepted as-is: matches palette, rail, badge at true size, printer strip, dark Markdown strip)
- `concepts/storyboard-tear.png` — 8-panel storyboard of the tear (round 1, accepted: shows PREPARING state, clipped upward exit with slight rotation, fresh sheet underneath, settle)
- `concepts/components-phone.png` — component sheet (select rest/hover/focus, colour group, Markdown strip COPY/COPIED, date rail, footnote states, wall rows incl. Korean, perforation, dark-mode specimen) + 360px phone composition (round 1, accepted)
