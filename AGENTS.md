# AGENTS.md — Contributor Guide for AI Agents and Humans

This document is the single source of truth for how to work on this repository
without re-analyzing the whole codebase from scratch. Read it fully before
changing anything. Keep it up to date: **whenever you add a rule, invariant,
feature, or convention, update this file in the same commit.**

---

## 1. What This Project Is

**بستار دفاع ارشد BCOA** ("BCOA Master's Defense Kit") — a calm, fully
**offline**, installable (PWA) practice tool for a Master's thesis defense
session about the *Black-Capped Warbler Optimization Algorithm (BCOA)*.

All content is derived from one canonical document referred to as
**"Final Scenario, Version 2" (سناریوی نهایی نسخه ۲)**: an 8-chapter table of
contents, a compact 19-slide order plus an extended 20-slide order (the
optional «وراثت جهت و رقابت سرزمینی» slide sits at #11), exact timing
(compact speech 18:30 + 1:00 safety buffer; extended speech 19:15 + 1:00),
full speech text, formulas, examiner Q&A, and defense-day checklists.

- **UI language:** Persian (Farsi), RTL everywhere (`<html lang="fa" dir="rtl">`).
- **Code language:** TypeScript/React. Code comments are intentionally in
  Persian — preserve that style in existing files.
- **This guide:** pure English, by convention.

### The five sections (tabs) of the app

| Tab id      | Persian label      | Purpose                                                  |
|-------------|--------------------|----------------------------------------------------------|
| `home`      | نقشه راه دفاع      | Roadmap: session structure, timing, claim boundaries      |
| `practice`  | جلسه تمرینی        | Timed rehearsal simulator with slide + total timers       |
| `cheat`     | برگه تقلب          | Cheat sheet: full math, key numbers, backup tables        |
| `qa`        | پرسش‌های داور      | Examiner question bank with suggested answers + drill     |
| `checklist` | چک‌لیست روز دفاع   | Interactive defense-day checklists with autosave          |

There is no router; navigation is a single `tab` state in the app context.

---

## 2. Non-Negotiable Core Rules (Invariants)

These are enforced by `tests/verify-all.cjs` (run `npm run verify`). Breaking
any of them fails CI-style verification. Never weaken a test to make a change
pass; fix the change instead.

1. **100% offline.** No network requests of any kind: no CDN, no online fonts,
   no APIs, no analytics, no external URLs in any file the app ships or
   builds (src/, index.html, configs; the only allowed URL substring is
   `w3.org/2000/svg`). Fonts come from the locally installed
   `@fontsource/vazirmatn` package; KaTeX is local too. Repository
   documentation (README.md, AGENTS.md) may cite the thesis/paper by URL; it
   is never shipped by the app.
2. **ASCII-only LaTeX.** No Persian characters or Persian digits inside any
   LaTeX string in `src/data/cheat.ts` / `src/data/deck.ts`. Persian
   explanations live *next to* formulas, never inside them.
3. **No em dash (`—` U+2014) and no en dash (`–` U+2013)** anywhere in data
   files, labs, components, `App.tsx`, `types.ts`, or `README.md`. Time ranges
   use the Persian word «تا» (e.g. «۰۹:۳۰ تا ۱۰:۱۵»).
4. **Persian digits in UI.** All user-facing numbers go through helpers in
   `src/lib/persian.ts` (`toPersianDigits`, `formatClock`, `faNumber`,
   `faPercent`). Decimal separator is «٫». Timers use `.timer-num`
   (tabular numerals, LTR-isolated). Unit hints beside clocks describe how
   the clock reads right-to-left, e.g. «(ثانیه:دقیقه)» — on an LTR-isolated
   `mm:ss` clock the seconds group sits on the right.
5. **Timing must add up.** 20 slide entries total (19 standard + 1 optional,
   flagged `optional: true`); the standard slides sum to exactly
   **1110 seconds (18:30)**; the optional slide adds 45 seconds in the
   extended layout (speech 19:15); safety buffer is `SAFETY_BUFFER = 60`;
   the finish target is derived from the speech end of the active layout
   (15 to 30 seconds later): compact «۱۸:۴۵ تا ۱۹:۰۰», extended
   «۱۹:۳۰ تا ۱۹:۴۵». All timing displayed anywhere is *derived* via
   `planSlides()` in `src/lib/session.ts` — never hardcode cumulative times.
6. **Canonical equations.** Certain LaTeX fragments are asserted verbatim by
   the tests (e.g. `\overrightarrow{d(\theta_{i}^{t})}`, the `\kappa` social
   term, the adaptive `\sigma_i^t=\xi_i^t\exp\bigl(-t/T\bigr)` perturbation).
   Do not "simplify" or reformat equation strings.
7. **Claim discipline in content.** The presentation persona is
   "آرام، دقیق، مسلط، قابل نقد" (calm, precise, in command, open to critique).
   Content must never claim BCOA is universally best — only competitive on the
   evaluated suite. See `doDonts` in `src/data/checklist.ts` and
   `claimBoundaries` in `src/data/roadmap.ts` before writing any new claim.
8. **Local persistence only.** All user data (notes, highlights, progress,
   preferences) lives in `localStorage` under the `bcoa-defense:` prefix via
   `src/lib/storage.ts`. Never send it anywhere; never bypass the safe
   read/write wrappers.
9. **Time unit is seconds.** No `* 1000` conversions in navigation/timer paths;
   variable names must say what they hold (`totalSec`, not `totalMs`).
10. **No heavy dependencies.** Runtime deps are exactly: `react`, `react-dom`,
    `katex`, `lucide-react`, `@fontsource/vazirmatn`. Adding a dependency
    (especially anything service-oriented like `express` or `@google/*`) is
    almost certainly wrong for this project — the tests reject some explicitly.

---

## 3. Commands

```bash
npm install          # setup
npm run dev          # Vite dev server on 0.0.0.0:3000 (allowedHosts: .e2b.app)
npm run build        # production build + PWA service worker (dist/)
npm run preview      # serve the production build on 0.0.0.0:3000
npm run lint         # tsc --noEmit (type checking is the linter)
npm run verify       # tests/verify-all.cjs — MUST stay at 0 failures
npm run icons        # regenerate all brand icons from src/lib/brand.mjs
```

**Definition of done for any change:** `npm run lint` clean,
`npm run verify` all-pass, `npm run build` succeeds. Run all three.

---

## 4. Repository Map

```
index.html                  RTL Persian shell, favicon set, theme-color #fcfaf3
vite.config.ts              Vite + React + Tailwind v4 + vite-plugin-pwa (autoUpdate)
tests/verify-all.cjs        Dependency-free verification suite (npm run verify)
scripts/build-brand.mjs     Icon builder (npm run icons) — zero native deps
scripts/lib/raster.mjs      Hand-written SVG-path rasterizer + PNG/ICO encoders
public/                     Generated favicon/PWA icons — DO NOT edit by hand;
                            edit src/lib/brand.mjs then run `npm run icons`

src/
  main.tsx                  Entry: fonts, CSS, SW registration (PROD only)
  App.tsx                   Shell: header, tab switch, footer, focus-mode exit,
                            print orchestration, formula cache warm-up
  index.css                 THE design system (see §6 — layering rules matter!)
  types.ts                  All shared interfaces (Chapter, DeckSlide, Equation,
                            QaItem, ConceptCard, FactRow, ChecklistGroup, DoDont)

  data/                     Pure content modules — no logic, no JSX
    deck.ts                 chapters[], slides[] (20 entries), SAFETY_BUFFER
    cheat.ts                coreEquations, conceptCards, keyFacts,
                            reliabilityRows, ablationRows, parameterRows,
                            effectSizeRows
    qa.ts                   qaMain, qaHard, qaDrill, qaCategories
    checklist.ts            checklistGroups, doDonts
    roadmap.ts              governingPrinciple, missionPoints, fiveNumbers,
                            claimBoundaries, practiceMethods, answerPattern,
                            outOfScopeSteps, qaPresence, successLine

  labs/                     One component per tab (page-level)
    HomeLab.tsx             Roadmap + "resume last session" card
    PracticeLab.tsx         Rehearsal simulator (timers, audio cues, keyboard)
    CheatSheetLab.tsx       Equations, concepts, facts, backup tables
    QALab.tsx               Question bank + category filter + random drill
    ChecklistLab.tsx        Interactive checklists + Do/Don't table

  components/
    Header.tsx              Brand, nav, PDF-download menu, reading-settings panel
    PrintSheet.tsx          Print/PDF document (mounted only while printing)
    ShortcutGuide.tsx       Global keyboard-help dialog (H / ?)
    BrandMark.tsx           Inline SVG brand mark (single source: brand.mjs)
    ui.tsx                  SectionHead, NoteBox, MarkButton, Tag, TimeRange

  lib/
    app-context.tsx         Global state: tab, typography prefs, focus mode,
                            shortcuts toggle, PrintScope, session marker helpers
    session.ts              planSlides / totalTalk / totalSession / practiceWindow
    persian.ts              Digit/clock/percent formatting helpers
    storage.ts              Safe localStorage wrappers + useStoredState/Note/Flag
    tex.tsx                 KaTeX render + in-memory cache + <TeX> component
    keys.ts                 Keyboard utilities (e.code-based, layout-independent)
    use-global-shortcuts.ts Global hotkeys (H, F, M, Esc, Alt+1..5, Alt[+Shift]+P)
    use-modal.ts            useModalBehavior: layer counter, Esc, focus trap
    ui-bus.ts               overlaysOpen()/acquireLayer() — silences hotkeys
    brand.mjs               Brand geometry + colors (consumed by app AND scripts)
```

### Data flow in one paragraph

`data/*.ts` are inert content arrays typed by `types.ts`. `lib/session.ts`
turns `slides[]` into a cumulative timing plan. Labs render content and attach
per-item persistence via storage keys (`eq-note:<id>` / `eq-hl:<id>`,
`slide-note:<num|opt>` / `slide-hl:<num|opt>`, `qa-note:<id>` / `qa-hl:<id>`,
`ck:<groupId>`, `session:last`, `pref:*` — always namespaced, stable, and
prefixed by `storage.ts` with `bcoa-defense:`). `App.tsx` warms the KaTeX cache
at startup so the cheat sheet opens with zero rendering delay.

---

## 5. Global State & Interaction Model

- **Context:** one provider (`AppProvider` in `lib/app-context.tsx`). Access
  with `useApp()`. It holds: `tab`/`go()`, `pendingStart` (deep-link into
  practice at a slide), `textScale` (0.85–1.25), `lineHeight` (1.7/1.9/2.1),
  `audible`, `focus`, `shortcutsOn` (WCAG 2.1.4 opt-out), `guideOpen`,
  `printScope`/`openPrint(scope)`/`closePrint()`.
- **Typography scaling:** `readingStyle()` sets `font-size: %` and
  `--reading-lh` on the lab container. Body text that should scale uses `em`
  sizes and `leading-[var(--reading-lh)]`. Never use fixed `rem` for long-form
  reading text.
- **Overlays:** every modal/panel must use `useModalBehavior(open, onClose)`.
  It registers in the layer counter (`ui-bus.ts`), traps Tab, closes on
  Escape, and restores focus. Global shortcuts automatically go silent while
  any layer is open or while typing in an input.
- **Slide numbering:** the practice UI labels slides by their position in the
  *active* layout, never by a hardcoded total: compact shows 1–19, extended
  shows 1–20 with the optional «وراثت جهت و رقابت سرزمینی» slide as #11
  (dashed dot, no star). The canonical `num` field in `deck.ts` is the
  compact-layout number; extended numbering is always `position` in
  `planSlides()`, and number-key jumps map to that same position.
- **Keyboard:** always match `e.code` (physical key), never `e.key` — Persian
  keyboard layouts remap letters. Use helpers from `lib/keys.ts`
  (`snapshot`, `isEditableTarget`, `isInteractiveTarget`, `digitFromCode`).
  Single-letter shortcuts must respect `shortcutsOn`; `Alt+…` combos are
  always active.

### Global shortcuts (keep `ShortcutGuide.tsx` in sync when changing)

| Keys              | Action                              |
|-------------------|-------------------------------------|
| `H` or `?`        | Toggle shortcut guide               |
| `F`               | Toggle focus mode                   |
| `M`               | Toggle audio cues                   |
| `Esc`             | Close layer / exit focus mode       |
| `Alt+1..5`        | Jump to tab                         |
| `Alt+P`           | PDF of the current tab's section    |
| `Alt+Shift+P`     | PDF of the whole site               |

PracticeLab adds its own local keys (arrows, Space/P, R, Shift+R, digits and
Shift+digits to jump by slide number of the active layout, Home/End, O for the
extended layout). Navigating with those keys blurs the previously focused
control so a stale focus ring never lingers on an old slide number; the
current position is shown by the `.active` slide dot.

---

## 6. CSS Architecture — Read This Before Touching `index.css`

Styling is **Tailwind CSS v4** (via `@tailwindcss/vite`, `@import "tailwindcss"`,
design tokens in `@theme`) plus a hand-written component layer in
`src/index.css`. There is no `tailwind.config.js`.

### 6.1 The cascade-layer rule (the most important rule in this file)

Tailwind v4 emits utilities inside `@layer utilities`. Per the CSS Cascade
Layers spec, **any unlayered rule beats every layered rule**. Historically an
unlayered `p { margin: 0 }` silently killed every `mb-*`/`mt-*` utility on
paragraphs across the whole site. Therefore `index.css` is structured as:

- `@layer base { … }` — element resets and base typography (`html`, `body`,
  `p`, `h1–h5`, `button`, inputs, `::selection`, `:focus-visible`).
- `@layer components { … }` — all component classes (`.card`, `.panel`,
  `.btn*`, `.chip*`, `.eyebrow`, `.icon-btn`, animations, `.mini-table`,
  `.dot-list`, `kbd`, `.slide-dot`, …), split into three blocks; each closes
  with a Persian "end of layer" comment.
- **Deliberately unlayered:** (a) KaTeX-related rules (`.tex-frame`,
  `.tex-inline`, KaTeX font-size overrides) because `katex.min.css` itself is
  unlayered and must be beatable; (b) all `@media print` rules; (c) focus-mode
  `display: none !important` helpers; (d) motion tokens on `:root`.

**When adding CSS:** element selectors → `@layer base`; reusable classes →
`@layer components`; anything that must override third-party unlayered CSS →
unlayered, with a comment explaining why. Verification test #14 checks this
structure — keep it passing.

### 6.2 Design language (visual identity)

- **Palette (from `@theme`):** warm cream paper (`--color-paper #f4f0e6`,
  surfaces `#fcfaf3`/`#f7f3e8`), warm dark ink (`#2b251c`), calm pine green as
  the primary accent (`--color-pine #1e5a49`), soft ochre gold for highlights
  (`#9a7126`), earthy clay red for soft warnings (`#a04a2c`). Light mode only
  (`color-scheme: light`). Introduce no new hues; derive from these tokens.
- **Font:** Vazirmatn only (local), weights 400/500/700/800. `font-black`
  (900) renders via synthesis on big headings — acceptable, already in use.
- **Shape:** generous radii (cards 20px / `rounded-2xl`, buttons 12px,
  chips 999px), thin `--color-line` borders, soft layered shadows.
- **Motion:** calm and short. Fade/rise entrances (`.stagger`, `.fade-up`,
  `.pop-in`), 200–680ms, custom soft easings. **Hard rules, test-enforced:**
  no hover translate/lift (hover feedback = glow shadow only), no infinite
  animations, and full `prefers-reduced-motion` support. Do not add bouncy or
  attention-seeking animation.
- **Density:** page sections use `space-y-12`; cards pad `p-6`/`p-7 md:p-9`;
  labs are wrapped in `.stagger` for staggered entrance.

### 6.3 RTL and bidirectional text

- Everything is RTL by default. Anything technical/Latin/numeric that must
  read LTR gets `dir="ltr"` + isolation: `.ltr`, `.timer-num`, `.tex-*`
  classes, or an inline `dir="ltr"` with `text-left`.
- English labels (e.g. equation names) render as small, muted, explicitly
  LTR captions in their own element — never mixed into a Persian sentence.
- Formulas: use `<TeX tex={...} display />` for blocks, `<InlineTex>` inside
  Persian sentences. Never `dangerouslySetInnerHTML` KaTeX output yourself;
  go through `lib/tex.tsx` (it caches, isolates direction, and is pre-warmed).
- Time ranges: use the `TimeRange` component (`ui.tsx`) so «تا» stays in the
  RTL flow while each clock stays LTR.

### 6.4 UI component conventions

- Buttons: `.btn` + one variant (`btn-primary`, `btn-soft`, `btn-ghost`,
  `btn-quiet`) and optionally `.btn-sm`. Icon-only buttons: `.icon-btn`
  (must have `title` and/or `aria-label`).
- Section headers inside labs: `SectionHead` with a Persian-digit index badge.
- Per-item note/highlight: `NoteBox` + `MarkButton` with stable storage keys.
- Tags/chips: `Tag` with tone `pine | ochre | clay | mute`.
- Icons: `lucide-react` only, typically `h-4 w-4` or `h-3.5 w-3.5`.


### 6.5 Responsive / no-overflow invariants (test-enforced in §16 of verify-all)

The site must never develop horizontal overflow, broken layouts, or clipped
content at any viewport ≥ 320px. Hard-won rules:

- **Every grid gets an explicit track template.** A bare `display: grid`
  creates *auto*-sized implicit tracks whose base size derives from the
  largest min-content contribution of their items. A nowrap flex row with
  `shrink-0` children inside such a card inflates the track far beyond the
  viewport (this is what broke the cheat-sheet tables and parameter tags on
  mobile). Always pair `grid` with `grid-cols-1` (`minmax(0, 1fr)` under the
  hood) even when the grid is conceptually single-column.
- **Grid items hosting tables or scrollers get `min-w-0`** so their automatic
  minimum size never exceeds the track.
- **Tables live inside `.table-wrap`** (internal horizontal scroller with a
  subtle visible thumb). The page itself never scrolls sideways.
- **The table frame belongs to `.table-wrap`** (rounded border on all four
  sides); cell border edges touching the frame are suppressed so nothing
  doubles. Never strip the bottom of `.mini-table`'s last row without the
  wrapper frame, or the table looks cut off at its last row.
- **Composite chips wrap via `.chip-wrap`** (white-space: normal, max-width:
  100%) so no tag is wider than its card.
- **Content scroll rows use `.hbar`** (thin *visible* scrollbar). `.no-hbar`
  is reserved for discoverable UIs only (the header tab navigation).
- **Overlays/dropdowns are viewport-capped**: `max-w-[calc(100vw-2rem)]`, and
  header menus anchor to the controls *group*, not to an individual button,
  so they can never stick out past the screen edge at 320px.
- **Last line of defense:** `main` and `.site-footer` carry
  `overflow-x: clip` (keeps sticky intact, unlike `hidden`). The header is
  deliberately exempt so its dropdowns are not clipped.

---

## 7. Print / PDF System

The site exports clean A4 PDFs through the browser's print dialog
(Save as PDF). Design decisions:

- `PrintScope = 'all' | 'roadmap' | 'deck' | 'cheat' | 'qa' | 'checklist'`
  (defined in `lib/app-context.tsx`, with `printScopeOfTab` mapping tabs to
  scopes). `openPrint(scope)` mounts `<PrintSheet scope=…>` inside
  `.print-root` (hidden on screen), `App.tsx` adds `body.printing`, calls
  `window.print()` after two RAFs (so KaTeX/layout settle), and cleans up on
  `afterprint`.
- Entry points: the header download menu (`PDF_OPTIONS` in `Header.tsx`),
  the cheat-sheet button, and `Alt+P` / `Alt+Shift+P`.
- Print CSS lives at the bottom of `index.css` (`@media print`, unlayered).
  Conventions: `ps-`-prefixed classes; `break-inside: avoid` on formulas,
  table rows, Q&A items and slides; `.page-break` between top-level sections
  in 'all' scope; checklists render empty tick boxes (`.ps-checklist`);
  RTL document with LTR-centered formulas.
- If you add site content, extend `PrintSheet.tsx` so the PDF stays complete —
  verification test #15 asserts coverage of all five sections.

---

## 8. PWA / Offline Build

- `vite-plugin-pwa`, `registerType: 'autoUpdate'`, SW registered in
  `main.tsx` only in PROD. Workbox precaches
  `js,css,html,woff2,woff,ttf,svg,png,ico` with `navigateFallback: /index.html`.
- `theme_color` in the manifest (`vite.config.ts`) must equal the
  `theme-color` meta in `index.html` (`#fcfaf3`) — test-enforced.
- Icons in `public/` are build artifacts of `npm run icons`; regenerate, never
  hand-edit. The brand geometry single-source is `src/lib/brand.mjs`.
- Dev/preview servers bind `0.0.0.0:3000` and allow `.e2b.app` hosts for
  sandboxed live previews.
- Cloudflare deploys use Workers Static Assets: `wrangler.jsonc` points at
  `./dist` (with SPA `not_found_handling`, mirroring the SW fallback). Without
  it `npx wrangler versions upload` fails with "Missing entry-point". The
  `name` field must match the Workers project name in the Cloudflare
  dashboard — update it if the project is renamed.

---

## 9. Testing Philosophy

`tests/verify-all.cjs` is a plain Node script (no framework, no deps) that
reads source files as text and asserts invariants — writing rules, timing
sums, equation authenticity, offline purity, CSS layering, a11y wiring, PDF
coverage, brand integrity. It prints `[PASS]/[FAIL]` per check and exits
non-zero on any failure.

When you add a feature or fix a structural bug, **add a numbered section with
targeted assertions** to this file, in the same commit. Keep assertions
source-text-based and dependency-free. Note: LaTeX in TS sources is
double-backslashed; use the `norm()` helper to compare runtime strings.

There is no browser/E2E test infrastructure; manual checks happen through the
dev server. Headless browsers are typically unavailable in the sandbox.

---

## 10. Git / Workflow Conventions

- Commit messages are written in Persian, imperative and descriptive, wrapped
  with a summary line + body explaining root cause and approach (see history).
- Never commit `dist/`, `node_modules/`, `.cache/` (already gitignored).
- Do not reformat unrelated code; match the file's existing style (2-space
  indent, single quotes, semicolons, trailing commas — no Prettier config,
  consistency is by convention).
- File header comments: every source file starts with a Persian block comment
  explaining its purpose. Keep this convention for new files.

---

## 11. Common Pitfalls (Learn From Past Bugs)

1. **Unlayered CSS killing utilities** — see §6.1. Any bare element selector
   added outside `@layer base` will silently break Tailwind spacing again.
2. **Persian text inside LaTeX** or Persian digits in `tex` strings — breaks
   test #2 and can corrupt KaTeX output in RTL context.
3. **Hardcoded timings** — slide windows must come from `planSlides()`; the
   optional slide shifts every subsequent window automatically.
4. **`e.key` shortcuts** — break on Persian keyboard layout; use `e.code`.
5. **Forgetting overlay registration** — a new modal that doesn't use
   `useModalBehavior` leaves global hotkeys active behind it.
6. **Milliseconds creeping into timer logic** — the whole practice engine is
   seconds-based (test #12).
7. **Adding hover `translateY` or infinite animations** — rejected by test #9.
8. **New user-facing numbers rendered with Latin digits** — always run
   through `toPersianDigits`/`faNumber` (exception: values that are
   intentionally technical/LTR like `p-value 0.0004` in data, which are
   displayed inside LTR-isolated spans).
9. **Editing `public/` icons directly** — they get overwritten by
   `npm run icons`.
10. **Em/en dashes pasted from LLM output** — strip them; use «تا», «؛» or
    restructure the sentence.
11. **Bare `grid` without `grid-cols-*`** — implicit auto tracks inflate to the
    widest child's min-content and break every narrow viewport; see §6.5.

---

## 12. Quick Checklist Before You Finish Any Task

- [ ] `npm run lint` — zero TypeScript errors
- [ ] `npm run verify` — zero failures (add new assertions for new invariants)
- [ ] `npm run build` — succeeds, PWA generated
- [ ] Persian digits + no em/en dashes in any new user-facing text
- [ ] New CSS is in the correct layer (§6.1)
- [ ] New modals use `useModalBehavior`; new shortcuts use `e.code` and are
      documented in `ShortcutGuide.tsx`
- [ ] New content is covered by `PrintSheet.tsx` (PDF completeness)
- [ ] `AGENTS.md` updated if you introduced a rule, structure, or convention
