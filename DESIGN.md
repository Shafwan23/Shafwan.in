# DESIGN.md — shafwan.in

Recorded from the built world, 2026-08-20 (v3 — supersedes the "Editorial ink" single-page world, which the owner rejected as too quiet).
World pinned by owner: **Luxe Motion Studio** — a personal portfolio presented as a luxury motion-studio reel. Cinematic, tactile, unmistakably expensive.

## Site map (11 pages, directory URLs)

`/` home · `/work/` index + reel · `/work/{famysys,servicenow,myfundbox,sih-2023}/` case studies · `/experience/` · `/about/` · `/contact/` · `/lab/` (playable) · `404.html`. Vite MPA (`vite.config.js` rollup inputs). Cross-page nav is prerendered via Speculation Rules and transitioned via cross-document View Transitions.

**v4 split (2026-08-20):** the home page no longer lists projects and no longer holds the career record. Projects live on `/work/` — which inherited the cinematic sticky reel from the home page and now runs *index list → reel → contact doorway*. The record lives on `/experience/`, a page of its own with sticky year columns. `/about/` keeps the person and the philosophy and hands off to `/experience/` through a doorway. Nav is five items: Work · Experience · About · Lab · Contact.

## Home composition (v4) — eight movements, eight mediums

Hero (particle typography) → ticker ribbon → **01 statement** → **02 figures** → **03 capabilities** → **04 method** → **05 the person** → **06 the record** → **07 doorway to the work** → **08 the lab**. The rule: no two consecutive sections may share a medium. In order they are scroll-lit type, numerals, inverting rows, a drawn thread, an image with a rotating seal, a hover list, one colossal typographic doorway, and a framed cabinet. Every `.section` carries a `data-ghost` folio — a 22rem Italiana numeral at 3.5% opacity that parallaxes on a `view()` timeline.

## The one-medium rule (v7)

The site's organising constraint: **every section on every page owns a medium that appears nowhere else.** No two sections share an animation grammar, and no two pages share a section. The full register:

| Page | Section | Medium |
|---|---|---|
| `/` | statement | words pull into focus from blur, magnetised to the cursor |
| `/` | figures | odometer digits inside a self-drawing ring |
| `/` | capabilities | rows invert to champagne, tech marquee running inside |
| `/` | method | pinned stage, steps cross-fade, progress rail |
| `/` | the person | duotone portrait, rotating seal, register marks |
| `/` | the record | scroll-lit ledger, drawn spine, rows open on approach |
| `/` | doorway | extruded outline double + pointer light |
| `/` | the lab | arcade cabinet, scanlines, linked menu |
| `/work/` | hero | a champagne bar sweeps across; the word is behind it |
| `/work/` | index | a technical table, rule scrubbing, inline image peek |
| `/work/` | reel | pinned filmstrip travelling sideways on a named timeline |
| case | hero media | a curtain of six slats lifting in sequence |
| case | spec | numbered sheet with dotted leaders that draw |
| case | **instrument** | one per project — release path / ITSM queue / handset / rain band |
| case | gallery | two plates drifting against each other |
| `/experience/` | hero | headline lines lift from behind a mask; a year axis with a riding bead |
| `/experience/` | chapters | alternating bands, each drawing its own rule, outlined folio |
| `/experience/` | toolbox | a grid lighting in a diagonal wave |
| `/about/` | hero | **the dot portrait (v14)**: the photo rebuilt from ~25k colour dots that gather in, breathe, tilt with the pointer, part around it and ripple on a tap (`src/js/portrait.js`) |
| `/about/` | convictions | an accordion (`<details name>`, one open at a time) |
| `/about/` | off the clock | an orbit, items on a shared radius |
| `404.html` | the missing reel (v14) | the asked-for path typed and struck through; "404" as the hero's particle type; a film leader that counts 4 · 0 · 4 and never reaches the picture; the closest real pages matched from the path (`src/js/lost.js`) |
| `/contact/` | hero | the address decodes itself out of noise |
| `/contact/` | the board | a departure board flipping into place |
| `/contact/` | direct lines | rows with a rule that scrubs and an arrow that arrives |
| `/lab/` | hero | a console booting, typed, with CRT scanlines and a beam sweep |
| `/lab/` | 01 Stack | four tiles that light in sequence, a depth counter, step pips |
| `/lab/` | 02 Compile | a question gauntlet: draining ring, three lives, a deck rail |
| `/lab/` | 03 Keystroke | the typing lane, live WPM and accuracy |
| `/lab/` | record boards | eight-slot halls of record, and a modal that asks your name |

**The four instruments** are the sharpest expression of the rule: each case study carries a CSS-only device built from its own subject — Famysys a release-path readout (requirement-to-production sparkline drawing itself, four stage bars filling: interface, services, data, delivery), ServiceNow an ITSM queue (incident and change rows with SLA-consumed bars and a flickering SLA clock, on the order-book grammar), MYFUNDBOX a handset cycling the three sign-in states, SIH 2023 a 56-bar rain band with a scanning prediction head (the transport grammar). They exist on exactly one page each. Case plates (hero + two details) are drawn in `tools/case-art.html` and rendered by `tools/render-case-art.mjs`; content is 2026-09-30 LinkedIn truth (see PRODUCT.md).

Every one of these is CSS-only except three small scripts: the split-flap board, the address decoder and the console typewriter (~60 lines total).

## v10 — the site-wide layer

Four things that touch every page at once, so the whole site levels up rather than one page at a time.

1. **The opening seam** (`/`, on every reload or direct visit, gone in 1.8s). A champagne seam draws across the dark stage as the load bar while the browser counts 000 → 100 (an `@property --pct` integer fed to `counter()`, so nothing waits on JavaScript). SHAFWAN® unfolds out of the seam: the stage is two identical full-screen halves, each clipped to its side of the line, and every letter grows away from it from the centre outwards. At 1.1s the halves part along the seam (top up, bottom down), each carrying its own gold edge, and the hero is already there behind them. Only transform and opacity animate. An inline guard in `<head>` reads the navigation type and adds `html.no-intro` only for back/forward and for links followed from another page of the site, so it never replays when you click Home; Then **the name comes back in reverse**: each hero letter is redrawn by its `::before` (top half, falling from above the screen) and `::after` (bottom half, rising from below), left to right at 110ms per letter from 1.45s, while a gold seam traces through the name and fades. The splitter stores each glyph in `data-c` so CSS can draw the halves. `scene.js` collects the `hero-join-*` animations at boot and holds the particle type until they finish; then it builds the particles already formed (`formAt = now - FORM_MS`) and the DOM word cross-fades out over 0.9s, so the name never jumps or re-forms. JS only removes the element from the DOM afterwards.
2. **A champagne light that follows the pointer.** `body::before` is a fixed radial gradient at `--mx` / `--my`, eased at 0.06 per frame. Fine pointers only.
3. **Speed streaks.** One rAF loop writes `--speed` (0…1) on the fixed `.rush` layer only, never on `<html>`, so the document does not restyle while you scroll. The champagne streaks surface at `calc(var(--speed) * 1.1 - 0.34)`, invisible below a third of full speed. The loop **parks itself** the moment you stop. Headings and sections deliberately do **not** react to scroll speed: the owner found a skewing page and width-squeezing headings unpleasant to read (2026-09-30), so the old `skewY` lean and `wdth` squeeze were removed. The header capsule also keeps one padding in both states so the brand and nav never shift when it forms.
4. **The nav carries its identity across pages.** `.site-head` and `.brand` own `view-transition-name`s, so the header holds still and the wordmark morphs between pages while the body wipes in from `clip-path: inset(16% 0 0 0)`.

All five are off under `prefers-reduced-motion`, the footer Motion toggle, and (for the engine) `saveData`.

## Palette (tokens in `:root`, src/styles.css)

| Token | Value | Role |
|---|---|---|
| `--stage` | `#0F0E0C` | the dark stage; page ground |
| `--stage-2/3` | `#16140F` / `#1E1B14` | raised frames, hover washes |
| `--cream` | `#EDE8DF` | primary type — soft, not pure white |
| `--stone` | `#A69F90` | secondary text (~7:1 on stage) |
| `--stone-2` | `#6F685A` | large/decorative only |
| `--gold` | `#C9A96A` | champagne accent — folios, cursor, fills, availability |
| `--line/--line-2` | cream at 14% / 32% | hairlines |

Film grain overlay (tiled SVG turbulence, opacity .045, no blend mode). Selection gold-on-stage. `color-scheme: dark`.

## Type — Archivo variable + Italiana

- **Archivo** (one file, wght 100–900 × wdth 62–125%): width is the voice. **Expanded 800 caps** = display (hero `clamp(2.6rem,13.8vw,16rem)` nowrap, 13.2vw at or under 380px; `h-display`; panel/case titles). **Normal 400–500** = text. **Condensed 78% caps letterspaced** = `.caps` meta voice.
- **Italiana** (`--serif`) = the luxury counterpoint: folios (01/04), `em` accent words inside display type, stat numerals. Never for body.
- Metric fallback `Archivo Fallback` (Arial + size-adjust) minimizes swap CLS. Both fonts preloaded, latin subsets, self-hosted.

## The effects engine (src/js/scene.js — raw WebGL, zero libraries)

One fixed, `pointer-events:none` canvas per page (`.scene-canvas`, z-40; z-250 while burning) runs three programs off a shared context:

1. **Liquid gold smoke** — a curl-noise-advected fluid on a ping-pong RGBA8 FBO pair at quarter resolution. The pointer injects gaussian splats; the field drifts, rises and decays (multiplicative **and** subtractive, so 8-bit quantization can't leave a permanent haze). Density is clamped **on the gold ratio** `(0.94, 0.79, 0.52)` so saturation stays molten instead of blowing out to white. Runs on every page as an ambient accent.
2. **Particle typography** (home hero) — the `[data-scene-text]` headline is rasterized to an offscreen 2D canvas, sampled on a grid, and uploaded as ~25k GPU point sprites. The vertex shader is stateless: chaos→target formation, curl-noise idle breathing, an expanding click shockwave, and scroll-driven scatter that fades out by `scatter 0.85` so dust never veils the next section. Colors lerp cream→gold per particle seed. **The resting look is the "Orbit" wordmark study (Lab v13):** the pointer tilts the whole name in shallow 3D (`uTilt`, each dot at its own depth from a sine field of its home position), and a light roams the letters on two slow periods (`uLight`: dots under it grow and turn near white). Seeds are vec3 (z = alpha). The old inverse-square pointer repulsion is gone; the light is laid out from the sampled glyph bounds (`particles.caps`), never from the taller line box. The study's dotted ring and orbiting satellite were built and then removed at the owner's request (the name went back to full width, where a ring cannot fit); breathing and tilt scale with `uBox.z / 900` so phone letters stay crisp.
3. **Burn navigation** — same-origin link clicks are intercepted, a noise fire-curtain descends over 420ms with a two-layer ember front (tight white-gold sparkle core + wide champagne halo), then navigation commits. A `setTimeout` is authoritative, so a stalled rAF can never strand the click.

A fourth, contained instance (`#playCanvas`) is still implemented in `scene.js` — half resolution, a molten tone curve, gradient-derived specular sheen, a slow decay — but **no page mounts it since v8**; the Lab now holds knowledge drills instead of a fluid painter. The code is guarded (`if (play)`) and costs nothing.

`src/js/gl-hover.js` adds per-image **liquid distortion** (noise warp + pointer bulge) and a **scroll-velocity film-bend** on `[data-distort]` imagery, with a whisper of chromatic split.

### Engine constraints (do not regress)
- Boot the engine only after `load` + `requestIdleCallback` (1.2s timeout), never at module execution: shader compiles and text sampling are one long task, and running it before first paint pushed home FCP from 1.3s to 5.1s on Lighthouse mobile. The DOM headline stays visible until `scene-text-live`.
- Bail out on software rasterisers (SwiftShader, llvmpipe, Microsoft Basic Render) via `WEBGL_debug_renderer_info`: every frame becomes main-thread work. Verified 2026-09-30: runs on a real AMD GPU, skipped on headless SwiftShader.
- **Never boots inside a Speculation Rules prerender** — it would spend a GL context and burn through the formation choreography invisibly. Gated on `document.prerendering` + `prerenderingchange`.
- `uForm` is driven from `formAt` (stamped when particles are built, i.e. after `fonts.ready`), never from script-eval time — otherwise slow font loads silently skip the opening move.
- Vertex shader stays at default `highp` (positions are in pixels; `mediump`/fp16 quantizes to whole pixels above 1024 and shimmers on mobile). `uTime` is wrapped `% 1000` so fp16 fragment noise stays smooth in long sessions.
- The rAF loop is **single-flight** (`schedule()` no-ops when a frame is pending) and fully **parks** when nothing can move, re-arming on input. Never call `frame()` synchronously from `visibilitychange` — that duplicates loops on every tab switch and prerender activation.
- `Smoke.size()` deletes the previous textures/FBOs; particle rebuilds delete the old buffers. Resize is debounced 150ms and ignores height-only changes on touch (mobile URL-bar collapse).
- The burn wipe **owns the exit**: `::view-transition-old(root)` is reduced to a 0.15s fade so two nav transitions never stack.
- `.case-hero-media canvas` needs the same absolute/inset-0 rule as `.panel-media canvas`, or the distortion canvas lands in-flow behind the image.

### Motion gates (all three, all live)
`prefers-reduced-motion` · `navigator.connection.saveData` · the site's own **Motion: on/off** toggle (footer, `localStorage`, WCAG 2.2.2 pause mechanism). Reduced-motion and the toggle tear the engine down **mid-session** via a `change` listener and the `shafwan:motion-off` event. WebGL missing or context lost → canvas removed, DOM headline restored. The Lab's three games are pure DOM and keep working with every motion gate on — only the ambient loops (beam sweep, chase lights, reveal and flash animations) are suppressed.

## Motion inventory (CSS/DOM layer — no libraries)

1. **Page transitions:** `@view-transition { navigation: auto }` — the burn wipe carries the exit, so the old view only does a 0.15s fade and the new page rises (Chromium/Safari; Firefox falls back to instant).
2. **Custom cursor** (fine pointers): gold dot + lagging ring; ring inflates to a labeled gold disc over `[data-cursor]` targets (View / Play / Talk / Next / Write).
3. **Liquid distortion + film-bend** (`src/js/gl-hover.js`): raw WebGL quad per `[data-distort]` image — value-noise warp + pointer bulge (fine pointers) and a scroll-velocity bend (every device). Lazy-init via IO, rAF only while active, DPR capped 1.75, context loss falls back to the `<img>`.
4. **Sticky work reel** (home): each panel `position: sticky; top: 0; height: 100svh` — panels stack over one another; outgoing panel scales/dims via `animation-timeline: view()` where supported.
5. **Split headlines:** `[data-split]` chars rise from an overflow mask with 26ms stagger (in-view triggered). Never clip-path the observed element itself (IO zero-intersection trap — see memory).
6. **Reveal grammar:** `[data-reveal]` rise / `="fade"` / `="left"` / `="img"` (clip-path unveil), staggered by `--i`; `[data-rule]` hairlines draw scaleX.
7. **Ambient:** hero champagne glow drift; marquee (36s, pauses on hover); availability pulse; magnetic buttons (`[data-magnet]`); count-up stats.
8. **Hovers:** nav gold underline draw; work-index rows shift + gold + floating thumb; `.btn` gold sweep-up; foot-cta gold clip-path wipe; image de-desaturation.
9. **Scroll-lit statement** (`[data-illuminate]`, home + experience): app.js splits the sentence into indexed `.wd` spans; CSS brings each one from `--stone-2`, `blur(4px)`, 42% opacity to cream, sharp and solid (gold inside `em`) on a `view()` timeline whose range is offset by `--i`, so the sentence pulls into focus left to right as it crosses the viewport. Accent words get a champagne marker stroke (`em::before`) that draws on its own offset range. On fine pointers `[data-word-magnet]` adds physical weight: words lean toward the cursor and take a gold glow — rects are cached and offset by scroll delta, so a pointer move costs zero layout reads. No JS runs on the lighting itself. Browsers without `animation-timeline` simply render it lit.
9a. **The record ledger** (`06 — The record`), the page's most-loaded section: a champagne spine draws down the left on a `view()` timeline, and each row animates its own registered `@property --rec` from 0 → 1 across `entry 92% → cover 34%`. Everything in the row reads from it — the spine bead fills, blooms and scales, the Italiana year range mixes from `--stone-2` up to gold, the role from 34% cream to full. On approach the row opens its detail with `grid-template-rows: 0fr → 1fr` (three achievements, stack chips, a *Read the record* link), a champagne spotlight follows the pointer inside it, the org turns gold and the year lifts. `@media (hover: none)` shows the detail outright — a touch visitor must never be locked out of content. Rows carry a `Current` / `Closed` badge; the current one gets the pulsing live dot.
9b. **Odometer figures** (`02 — By the numbers`): each digit is a strip of 0–9 twice over inside its own 1.3em overflow box; revealing the cell rolls every strip a full turn plus its target digit, staggered 130ms left to right. Behind the numeral an SVG ring draws itself from `stroke-dashoffset: 345.6` to 95 (≈75% of the circle) over 2.4s, completing to 22 on hover. The readable value is a sibling `.sr-only` span — the odometer is decoration and is `aria-hidden`. **The champagne gradient must be painted on each digit row, never on the wrapper:** `background-clip: text` cannot reach through the per-digit overflow boxes, and putting it on `.fig-value` makes every digit vanish.
9c. **The pinned method** (`04 — How it goes`), the page's showpiece: a 460vh `.pin-track` carries `view-timeline-name: --pin`; a `position: sticky` stage inside it holds all four steps stacked absolutely. Each step animates `pin-cycle` (rise + unblur in, hold, drift + reblur out) across its own quarter of `contain 0% → 100%`, its giant Italiana numeral drifts on a slower parallax over the same range, and a four-segment progress rail fills and lights its label step by step. The last step uses `pin-cycle-last` so it doesn't fade out at the end of the track. Gated to `@media (min-width: 901px)` **and** `@supports (animation-timeline: view())` — everywhere else it is an ordinary, well-set vertical list, and both motion gates force it back to that list.
10. **Ghost folios** (`.section[data-ghost]`): oversized Italiana numeral, `z-index:-1` inside an isolated section, drifting ±7vh on a `view()` timeline.
11. **Capability rows** (`.disc`): each discipline is a full-width row whose gold ground rises from below on hover, inverting the row to charcoal-on-champagne, while a masked marquee of that discipline's stack runs inside it (alternating direction per row, accelerating on hover). The stack is duplicated twice for the `-50%` loop and mirrored into an `.sr-only` list for readers.
12. **The gold thread** (`.thread`): a champagne hairline draws down the method steps on a `view()` timeline (`.in` + transition as the fallback). Each `.thread-step` then animates its own registered `@property --on` from 0 → 1 across `entry 88% → cover 46%`, and everything in the step reads from it — the ring fills and blooms, the folio and title mix from `--stone-2` to gold and cream, the body copy comes up from 45% opacity, and a hairline unrolls under the step. Steps ahead of the thread are visibly *not yet*; steps behind it are lit. `--on` must be `inherits: true` — the children read it.
    - **Do not** put a `scale`/`translate` animation on an element that also needs a hover `transform`; the animation wins. This is why the portrait has no `view()` parallax.
13. **Spinning seal** (`.badge-spin`): SVG `textPath` on a 74r circle, rotating 24s. The string is sized to the arc — 465px of text on a 465px path; re-measure with `getComputedTextLength()` if the wording changes or it will overlap itself.
14. **Doorways** (`.doorway`): full-bleed typographic links (work → contact → experience) built in three stacked layers — an outlined `.ghost` double that pulls out to 22×14px on approach (depth), the solid `.base`, and a `.fill` copy that wipes champagne across via clip-path — plus a `.doorway-rule` hairline that unrolls beneath and a `[data-spot]` pointer light (app.js writes `--px`/`--py`, the gradient is CSS). They replace the home page's project listing — an invitation, not an index.
15. **The portrait** (`.teaser--seal`): never distorted. At rest it is `grayscale(.95) brightness(.62)` under a champagne-to-charcoal scrim that melts the frame into the stage; on approach the scrim lifts to 18%, the image comes to full colour and settles from `scale(1.07)`, a sheen crosses once, the offset champagne frame closes in, register marks draw at the four corners, and the seal spins up from 24s to 9s. The liquid-distortion engine (`gl-hover.js`) is **not** loaded on the home page any more — warping a human face looked broken.

`prefers-reduced-motion`: everything off (CSS + JS both check live).

## The hero (v5)

Two anchored bands, `justify-content: space-between`, so the frame is filled instead of pooling at the floor under a void:

- **`.hero-head`** — the eyebrow rule, then the name *immediately* under it, then `.hero-band`. Dense on purpose: an earlier version centred the name and left a ~400px hole above it, which read as a mistake.
- **`.hero-band` (v9)** — the area under the name is **two equal halves split by a vertical hairline**: the statement line holds the left (`max-width: 25ch`, so it breaks into two lines on desktop and the serif phrase lands at the end of the second), and the right carries the `Now` / `Status` meta as hairline rows plus the CTA pair. A single full-width column under the name left the right half visibly dead — the owner's word for it was "half half", and the split is the fix. Collapses to one column ≤900px, where the rule becomes the top border of the meta list.
- **`.hero-base`** — the floor ledger, now the two facts the right half does *not* carry (`Based` / `Shipping since`, hairline-separated, each lifting on hover), with a vertical `SCROLL` cue whose champagne bead runs down a 1px rail. Stacks to labelled rows ≤600px.

`.hero-title` is measured by `scene.js` with `getBoundingClientRect()`, so it can be moved freely in the layout — the particle field follows it. It is `width: max-content`, so the ® sits on the last N at any size. A Lab v13 experiment ran the name at 70vw (the wordmark-study proportion); the owner asked for the full width back within the hour, which matches the v9 lesson: the name owns the full width.

## The ticker ribbon

Replaces the flat double marquee: a **-1.15° tilted band** (`width: 107%; margin-left: -3.5%` so the rotation never exposes a corner), row one a solid champagne gradient with charcoal type, row two hollow (`-webkit-text-stroke`) and counter-running, both under a deep drop shadow. On top of the 46s/58s loop each row takes a **scroll-driven offset on the `translate` property** — `animation-timeline: auto, scroll(root block)` — which composes with the looping `transform` instead of overwriting it. That's the trick worth remembering: two animations on one element can coexist if they drive different transform properties.

## The footer — the colophon

`.foot-cta` keeps the colossal *Let's Talk* with its champagne clip-wipe, and gains a pointer-tracked light (`data-spot`) and an arrow that flies in from the lower left. Below it a four-column body: the brand mark with a one-line studio statement and a **live Asia/Kolkata clock** (`Intl.DateTimeFormat`, 20s tick — the developer's own wall); Sitemap; Elsewhere; and a `[data-foot-settings]` slot that app.js fills with the motion toggle. A bottom bar carries the colophon and a *Back to top* whose 1px rail fills champagne on hover. **Back to top (v14 fix):** the link is `href="#top"` and nothing carries `id="top"` any more; the header used to, but it is `position: fixed`, so jumping to it never moved the page. With no such id the browser treats `#top` as the document top, and app.js scrolls there smoothly (instantly under reduced motion or motion-off). Sunk into the floor, `.foot-water` is the wordmark in 1px cream outline at 15.2vw — **measured, not guessed**: the glyph run is a constant 1.192× the font-size, so anything above ~15.4vw silently eats the last letter.

## Component grammar

- **`.site-head` (v6) never hides.** It is fixed and always present; only its dressing changes. Over the hero the capsule is bare; past 24px `.is-scrolled` gives `.head-inner` a 90%-stage background, an 18px blur, a hairline border and a soft drop shadow — it has to read as solid because the champagne ticker ribbon passes underneath it. A 2px champagne `.head-progress` bar across the very top is driven straight off `animation-timeline: scroll(root)`. The brand carries a small champagne lozenge that spins 180° on hover.
- **The nav pill** slides between items: app.js writes `--nx`/`--nw` from the hovered/focused link and the pill is a full-width bar revealed through `clip-path: inset(… round 99px)` — a clip window, not a moving box, so nothing lays out. It parks back on `a[aria-current="page"]` on pointerleave/focusout, re-measures on resize and after `fonts.ready`.
- **≤900px the inline nav is replaced by a real menu**: a bordered button whose two bars scale and cross into an X, opening a full-screen `backdrop-filter` overlay with six numbered display links that stagger in, plus the email and socials. Escape closes it, the button reclaims focus, `html.menu-open` locks the scroll, and a `setTimeout` is authoritative over `transitionend` so a dropped transition can never strand the overlay open.
- `.caps` letterspaced condensed labels; `.folio` Italiana gold numerals; `.btn` pill w/ gold fill sweep; `.game-frame` bordered stage-2 panels.
- Case template (v7): folio row → split display title → 3-col meta `dl` → 16:9 hero media behind a **slat curtain** → sticky **spec sheet** + prose (brief/build/result) → the project's own **instrument** → **drifting** 2-up gallery → full-width next-case link.
- **Lab v8 (2026-08-20) — three technical brain games, not toys.** The playful pair (Liquid Gold, Serpent) is gone; what a developer's lab should test is what a developer knows.
  - **01 Stack (v13, 2026-10-01, replaced Bitwise)** — working memory. Four tiles (gold, blue, coral, green; keys 1–4) light up in a sequence; tap it back. Level 1 is three tiles and every level adds one, to fifteen levels; the lit time shrinks from 520ms toward 300ms. A wrong tap ends the run ("Stack overflow") and lights the tile that was due. 100 points a cleared level plus up to 50 for tap speed (floor 220ms a tap, bonus gone at 1.4s a tap). The server deals the full 17-tile sequence, replays the taps level by level and bounds the run by its own clock. A first replacement, Swatch (match a hex code to a colour), was built and dropped the same day: reading hex is a skill almost nobody has.
  - **02 Compile** — a twenty-question run drawn from a 64-question bank of fundamentals (JavaScript, CSS, HTML, Git, HTTP, SQL, React, Node.js, Basics). Twelve seconds a question on a draining SVG ring tinted by category, three lives as gold diamonds, a deck rail of 20 ticks. Points: 100 a right answer plus up to 100 for speed (no chain multiplier — one rule for everyone). The category name is a coloured chip (`[data-cat]` custom property per category).
  - **03 Keystroke** — pick a language first (Java, JavaScript, Python, C++; remembered in `shafwan-keystroke-lang`), then a real one-liner in it. The line box shows a placeholder until a language is chosen. The typing goes into a real, invisible `<input class="type-input">` (16px so iOS does not zoom; autocorrect, autocapitalize and spellcheck off), so phones open their keyboard when a language is tapped; the visible line is only a picture of it. The input's value is always the correctly typed prefix — a burst from a soft keyboard is walked one character at a time and the first wrong one is dropped — and it is disabled at the end so the phone keyboard closes before the record prompt. On coarse pointers the line scrolls to the top once `visualViewport` resizes for the keyboard.
  - **The verdict flash.** After every answer in Stack and Compile a `.verdict` layer stamps the stage: a huge word (Correct / Fast! / Wrong / Time), the points, and on a miss the right answer and lives left; the stage glows gold on a hit and shakes red on a miss. Both motion gates reduce it to a plain fade.
  - **The prize.** A run that lands at #1 on a board gets a third `<dialog>` before the note: a sealed envelope (wax seal with the year, a breathing glow, "Tap to open"). Opening it cracks the seal, folds the flap back, fades the envelope away, bursts 56 gold flecks (`prize.js` sets per-fleck custom properties; CSS does the motion) and raises a letter with one of ten lines chosen at random, signed Shafwan, over the record line. Both motion gates drop the flecks and the entrance animations.
  - **Gotcha, recorded:** a CSS animation with `fill-mode: both` on `.st-tile.tap` kept painting its last keyframe over the tile for the rest of the session, so tapped tiles never lit again. Tap flashes now have no fill mode and the class is removed on `animationend`.
  - **After the name.** Once a record is signed (or skipped), a second `<dialog>` asks whether to say something to Shafwan — with the name just given, or anonymously — and sends a yes to `/contact/?from=lab&game=…&score=…#note`, where `note.js` pre-writes the opening line. Any open `<dialog>` adds `html.dialog-open`, which hands the native pointer back: the custom cursor lives below the top layer and would otherwise vanish.
- **The record boards (v12, 2026-09-30): global and server-verified.** Each cabinet carries an eight-slot hall of records served by `shafwan-api` (a Cloudflare Worker + D1 in `api/`; see `api/README.md`). The browser never sends a score: Stack sends taps and times and the server replays them against the dealt sequence, a per-tap floor and its own clock, Compile is judged answer by answer on the server (the answer key never ships to the browser), and Keystroke is timed from the moment the server deals the line and capped at 180 WPM. A Turnstile check buys a two-hour signed play session. Beat the board and a modal `<dialog>` says *Record broken — you are #n on Bitwise with 4,820* and asks for a name; the server enforces 2–14 Latin letters and a profanity filter and shows its refusal inline. "Stay anonymous" signs ANONYMOUS; Escape leaves without signing. One best entry per name. Empty slots render as `— — —`. There is no Clear button any more. With no API configured (or the Worker down) Bitwise and Keystroke run as unranked practice and Compile says the question server is offline.
- **The anonymous note** on `/contact/` (section 01) posts to the same Worker: Turnstile, a honeypot, 3/hour and 8/day per hashed IP, 80/day site-wide, stored in D1 without any IP, then mailed as plain text through Resend (a cron every 15 minutes retries anything the mail API refused). The section stays `hidden` until the build has a real API URL and Turnstile site key.
- Home teasers: `.lab-band` is a two-column cabinet (copy + a linked menu of the three games, deep-linked to `#stack` / `#compile` / `#keystroke`); `.record-list` rows preview the three roles and all link to `/experience/`.
- Experience template (v7): masked headline + year axis → alternating `.band` chapters → `.wave-grid` toolbox → doorway to the work.
- About template (v7): masked headline + `.sheet` contact strip → `.beliefs` accordion → `.orbit` → doorway to the record.
- Contact template (v7): masked headline + decoding `.ct-mail` → `.board` → `.lines`.
- Icons: authored stroke SVG arrows only. No emoji-as-icons, no icon fonts.
- **The mark (v14):** a champagne tile (`linear-gradient(135deg, #E9CD94, gold, #96793F)`) carrying a geometric S drawn from two 8-unit arcs (`M39.25 20.62 A8 8 0 1 0 32 32 A8 8 0 1 1 24.75 43.38`, stroke 6.5, round caps). It is the favicon (`public/favicon.svg`, rendered to `favicon-48.png` and a square-bleed `apple-touch-icon.png` with sharp), the header lockup (`.brand-mark` + `.brand-word`, a sheen crosses the tile on hover) and the footer mark. The old serif-S favicon depended on whatever Georgia the OS had.
- **The header capsule (v14):** once it floats (`.is-scrolled`), a champagne beam runs its rim: a conic gradient on a `::before`, masked to the 1px ring, driven by an `@property --beam` angle over 7s.

## Hard-won constraints (do not regress)

- `html { overflow-x: clip }` (not `hidden` — sticky must survive) + `.marquee { overflow: hidden; contain: layout paint }`: a `width: max-content` track otherwise **expands the mobile layout viewport** and silently shrinks the whole page.
- `.hero-title` is `white-space: nowrap` — its size must keep SHAFWAN on one line at every width: 13.8vw, 13.2vw at or under 380px, floor 2.6rem. The old 3.4rem floor pushed the word past the gutter on 360-375px phones and clipped the N and the ®; verified at 320, 360, 375, 390, 412 and 430.
- Split-word `.w` spans wrap internally when a word exceeds its container (shrink-to-fit) — size display type so words fit, or insert explicit `<br>`.
- `.h-display` at its full `clamp(2.6rem, 7.5vw, 6.5rem)` **overflows the teaser's copy column** (951px of "ART & ENGINEERING" in a 743px column). `.teaser-copy .h-display` is capped at `clamp(2.1rem, 5vw, 4.4rem)`; check any new display type that lives inside a grid column rather than the full gutter width.
- `.section[data-ghost]` must never wrap a `position: sticky` child — the ghost needs no `overflow` clip today, but adding one would kill `/experience/`'s sticky year columns.
- `.foot-note` uses `--stone`, not `--stone-2`: at 13.6px the decorative tone is 3.49:1 and was the site's only axe violation. The site is now axe-clean on desktop and mobile.
- `[data-reveal="img"]` finishes at `clip-path: inset(0)`, which **still clips** — it silently ate the portrait's offset frame and corner marks (both drawn outside the box on `.teaser-media::before/::after`). The reveal lives on the inner `.teaser-frame`; keep decorative overflow on an unclipped ancestor.
- Named scroll timelines resolve by searching **ancestors**, so `animation-timeline: --pin` on a step finds `view-timeline-name: --pin` on `.pin-track` with no `timeline-scope`. The stage between them must not gain `overflow: clip` on an ancestor or the sticky breaks.
- `background-clip: text` stops at any descendant that establishes its own overflow box — see the odometer note above. Paint the gradient on the leaf, not the wrapper.
- Two animations on one element only coexist if they drive different properties: the ribbon loops on `transform` and takes its scroll offset on `translate`.
- Rail/step labels resting on `--stone-2` fail contrast at 12.8px — `.pin-rail .caps` uses `--stone` and animates up to cream.
- **Deliberate exceptions to the generic craft floor**, recorded so they read as decisions rather than drift: (a) *gradient text* on the three Italiana numeral sets (odometer digits, `.pin-no`, and nothing else) — in this world champagne is a **material**, and a brushed-metal ramp on a numeral is the material, not decoration; (b) *section folios* (01–08) — the home page is explicitly a sequence and the folio is a brand device; (c) `.caps` eyebrow labels — the pinned world's meta voice. The floor's own rule is that the committed world wins; these are the only places it is invoked.
- The cursor ring's `width`/`height` transition is the one remaining layout-animating transition on the site, and it is deliberate: one 44px fixed element with no siblings. Everything else moves on `transform`, `translate`, `clip-path` or `grid-template-rows`.
- `--stone-2` is **decorative only and never text**: at every size used on this site it measures 3.49:1. A sweep replaced all fifteen text usages with `--stone`; the token survives for hairlines, ghost numerals and outlines.
- A `<dl>` may not hold a stray `<span>` between its `dt`/`dd` — the telemetry bars are `<dd class="tele-bar">`, not spans, or axe fails `definition-list`.
- A modal `<dialog>` centres itself with `margin: auto` in the UA sheet — a `* { margin: 0 }` reset kills that and pins it to the top-left corner. `.hs-dialog` restores it explicitly.
- Repeating a landmark defeats it: three `<aside>` boards all labelled "Hall of records" fail axe `landmark-unique`. Each carries its own `aria-label` ("Stack hall of records").
- An absolutely positioned overlay with a **negative** `inset` inflates its container's `scrollWidth`; `.game-overlay` sits at `inset: 0`.
- A decorative two-axis grid background is a generated-UI tell the detector catches. The cabinets earn their instrument feel from chase lights, corner brackets and LEDs instead.
- **Never put a start-state `clip-path` on an element the IntersectionObserver watches.** Chromium folds a target's own `clip-path` into the intersection rect, so `clip-path: inset(0 0 100% 0)` reports `isIntersecting: false, ratio: 0` forever — the element never gets `.in`, never unclips, and the whole page stays invisible. It cost a full reveal system on `/contact/` before it was caught. Wipes belong on a wrapper or a pseudo-element.
- A velocity engine must **park itself**: when the smoothed delta falls under a pixel, write `0` and stop the rAF. Otherwise an idle page burns a frame forever.
- `visibility` in a keyframe is discretely animated and Chromium does not always report the filled value; if an overlay must truly go, animate `opacity` too and remove the node in JS.
- `aria-label` is **prohibited on a bare `<span>`**. The split-flap board carries a real `.sr-only` text node instead; the per-character cells are `aria-hidden`.
- `@property --on` is declared `inherits: true` on purpose: `.thread-step` animates it and its `h3`/`p` children read it. Flipping it to `false` silently freezes every child at the initial value while the pseudo-elements keep working.
- Cursor ring width/height transition is an accepted, imperceptible layout-transition exception (one 44px fixed element).
- Em-dashes in `.caps` labels ("Available — 2026") are a brand device; keep body-copy density low.

## Performance budget (hold this line)

Per page: HTML 2.5–6.6KB gz (home is the largest at 6.5 — it carries eight full sections) + CSS ~16KB gz (shared, cached — it now carries 26 single-use mediums) + JS ~12.5KB gz on the home page (app 3.6 + scene 8.9; gl-hover 2.7 loads only where `[data-distort]` imagery lives — /work/ and the case studies; lab 6.5 + api 1.4 only on /lab/ — the question bank moved server-side; Turnstile loads from challenges.cloudflare.com only when someone reaches for a cabinet or sends a note) + fonts 100KB (shared). Every v4 section is CSS-only motion — the added JS is ~15 lines (the word splitter). Zero third-party requests on load (Turnstile is on demand), zero dependencies — the entire WebGL effects layer is hand-written. Images lazy WebP with dimensions; GL textures reuse the loaded `<img>`. Speculation Rules make cross-page nav feel instant.

## The dot portrait (v14, /about/ hero)

The owner's photo (`public/img/me-dots.webp`: the person cut out of the original with a local ISNet background-removal model, 960px, alpha) is sampled on a 2px grid at the frame's CSS size (1.8px under 360px wide). Every opaque sample becomes one dot in the pixel's own colour: saturation nudged up 18%, then every channel lifted onto a warm floor (`0.17 + 0.83r`, `0.14 + 0.86g`, `0.11 + 0.89b`) so black hair and a black shirt still read on the charcoal stage. Luminance rides in the seed's z: it sets the dot size (0.82 to 1.18 of the pitch) and the depth for the tilt (highlights come forward). One WebGL program per portrait draws them as point sprites; the vertex shader is stateless like the hero's: gather from the edges (centre first), breathe, tilt with the pointer, part around it, ripple from a tap. All motion is scaled by `uScale = dpr × width / 380`, so a phone gets proportionally smaller moves. About 25k dots at 410px, 22k on a 345px phone. Without WebGL or with motion off, `paintStill` draws the same dots once on a 2D canvas; without JavaScript the cut-out photo itself shows. The frame is square (`.dots-frame`, corner marks from `.hs-corners`) with a caption giving the live dot count.

Gotchas: the sampling canvas must be same-origin (it is: `/img/`); sharp cannot be imported through a `file://` URL from another directory (its native module fails to load, use CommonJS `require`); the background remover (`@imgly/background-removal-node`) is a dev-time tool kept out of the repo, so keep its 1920px PNG output if the photo ever needs re-cutting.

## Search (v14)

On-page SEO was already in place (canonicals, per-page JSON-LD, sitemap, robots.txt with the AI crawlers allowed, llms.txt). v14 adds **IndexNow**: `public/<key>.txt` is the key file and `npm run indexnow` (`tools/indexnow.mjs`) posts every sitemap URL to api.indexnow.org after a deploy, which reaches Bing, Yandex, Naver, Seznam and Yep. Google ignores IndexNow: the owner submits the sitemap in Search Console and requests indexing of the home page there. The sitemap's `lastmod` must be bumped for every page that changes, or Google has no reason to recrawl it.

## The 404 page (v14)

`404.html` lives at the repo root as a Vite input (it used to be a static file in `public/`), so it shares the site's CSS, header, footer and engine. Render serves `dist/404.html` for any unknown path with a real 404 status; the dev server does the same through the `shafwan-404` plugin in `vite.config.js`, which runs after Vite's html fallback (so `/about/` has already become `/about/index.html` and passes through), 301s a slash-less directory the way Render does, and renders the page for everything else. The page is `noindex, follow`.

## The logo replay (v15)

Clicking the mark in the header **on the home page** no longer reloads the page: it takes the name apart and builds it again a new way. Nine choreographies, one picked at random and never the same twice running (the last one is kept in `sessionStorage`): **Orbit** (the dots gather into a spinning globe and are thrown out along arcs), **Rain** (they fly up into the sky, then fall left to right and bounce once), **Vortex** (a pulsing core unwinds into the letters, one or two laps each), **Monogram** (a seal of two turning rings and an S morphs into the name with an overshoot), **Print** (a hairline print head erases right to left, then prints left to right, every dot popping in white), **Beam** (the dots pour back into the mark, which glows, then fan out of it again), **Type** (letter by letter, dropped in from above), **Flip** (every letter turns on its own vertical axis; at the half-way hold the name reads mirrored) and **Tide** (the rows sink below the fold and rise back, lower rows first, swaying).

The opening on a load is untouched: still the preloader seam, then the name, then the particles taking over already formed. The replay only exists once the name stands, only on `/` (the mark stays a plain link everywhere else, and also when the scene is not live: no WebGL, motion off, reduced motion). A click while a replay runs is ignored, a click while scrolled down first scrolls to the top and starts at the hero. Scripts can ask for one: `dispatchEvent(new CustomEvent('shafwan:replay', { detail: { mode: 'rain' } }))`, or with no detail for a random pick.

How it works: `scene/replay.js` plans a replay on the CPU, eight floats per dot (`aA`, the start pose, whose meaning depends on the mode; `aB`, delay and duration), uploaded once per click as a second interleaved buffer. The vertex shader takes a second branch (`uMode >= 0`) that computes each dot's progress `p` (0 at the start pose, 1 at home) from `uReplay` seconds: the exit plays the entry schedule backwards and compressed (0.3 of the delays, 0.5 of the durations), the pose holds for a moment, then the entry runs. Every path ends exactly at the home position with `p = 1`, which is the same state the ordinary shader produces, so the hand-back is seamless. A spinning start pose (globe, seal) freezes for a dot the instant that dot leaves, so a path never jumps. Two modes reach the DOM: Print appends `.hero-printhead` to `.hero-title` and moves it from the frame loop, Beam sets `.is-beaming` on `.brand-mark`. Letters are found by cutting the sampled word at its empty columns (`detectLetters`), with an equal-slice fallback.

`scene.js` was split to make room: `scene/gl.js` (the quad, the noise chunk, the program builder), `scene/smoke.js` (the liquid-gold smoke) and `scene/replay.js`. The planner is pure and unit-tested with `npm test` (node:test, no framework).

## Two names on the board (v15)

The board prompt treats two names specially (`src/js/lab/special.js`, matched on letters only with repeated letters collapsed, so spacing, dots, accents and stretched vowels do not slip past, alone or as one word of a fuller name). **The reserved one** is not allowed to stay on the site: a modal on top of the prompt says so, the field is cleared and the visitor picks another; the API refuses it as well (`isReserved` in `api/src/names.js`, error code `name_reserved`), so the modal is courtesy and the server is the lock. **The owner's name** gets a wink ("Hey, leader. Playing your own games, Shafwan? Good try...") and then signs as usual. Both use the one `#nameDialog` in `lab/index.html`, styled like the other Lab dialogs.
