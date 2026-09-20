# AGENTS.md - Contributor Guide for AI Agents and Humans

This document is the single source of truth for how to work on this repository
without re-analyzing the whole codebase from scratch. Read it fully before
changing anything. Keep it up to date: **whenever you add a rule, invariant,
feature, or convention, update this file in the same commit.**

---

## 1. What This Project Is

**بستار دفاع ارشد BCOA** ("BCOA Master's Defense Kit") - a calm, fully
**offline**, installable (PWA) practice tool for a Master's thesis defense.

The repository is a **content-driven platform**:

- **App shell** (React/TypeScript): timers, themes, notes, print, PWA.
- **Content pack** (`content/`): all defense prose, slides, Q&A, cheat sheets,
 checklists. Default pack = BCOA Final Scenario v2.
- **Compiler** (`scripts/compile-content.mjs`): builds `src/content.generated.ts`.

There is **no optional/hidden slide**. Every slide file in `content/deck/` is
first-class. Talk length is the **sum of every slide's `durationSec`**.

Default BCOA pack timing:

| Metric | Value |
|--------|-------|
| Slides | 20 |
| Talk | 1155 s (19:15) |
| Safety buffer | 60 s |
| Session | 1215 s (20:15) |
| Finish target | 19:30 تا 19:45 |

- **UI language:** Persian (Farsi), RTL (`<html lang="fa" dir="rtl">`).
- **Code language:** TypeScript/React. Existing file header comments are Persian.
- **This guide:** pure English, by convention.
- **Slide duration labels in content files:** English (`estimatedTime`).

### The five sections (tabs)

| Tab id | Persian label | Purpose |
|--------|---------------|---------|
| `home` | نقشه راه دفاع | Roadmap, timing, resume card |
| `practice` | جلسه تمرینی | Timed rehearsal + notes/highlights |
| `cheat` | برگه تقلب | Equations, concepts, backup tables |
| `qa` | پرسش‌های داور | Examiner bank + drill |
| `checklist` | چک‌لیست روز دفاع | Interactive checklists + do/don't |

No router; navigation is `tab` state in app context.

---

## 2. Non-Negotiable Core Rules (Invariants)

Enforced by `tests/verify-all.cjs` (`npm run verify`). Never weaken a test to
make a change pass; fix the change instead.

1. **100% offline.** No network requests: no CDN, no online fonts, no APIs, no
 analytics, no external URLs in shipped app files (only allowed substring:
 `w3.org/2000/svg`). Fonts: `@fontsource/vazirmatn`. KaTeX: local.
 README/AGENTS may cite thesis URLs; they are not shipped by the app.
2. **ASCII-only LaTeX.** No Persian inside any LaTeX string. Persian lives
 *beside* formulas.
3. **No em dash (U+2014) and no en dash (U+2013)** in content, labs, components,
 `App.tsx`, `types.ts`, or `README.md`. Time ranges use «تا».
4. **Persian digits in UI.** Use `src/lib/persian.ts`
 (`toPersianDigits`, `formatClock`, `faNumber`, `faPercent`). Decimal «٫».
 Timers: `.timer-num` (tabular, LTR-isolated). Unit hint «(ثانیه:دقیقه)».
5. **Timing from content.** Each slide declares `durationSec` (seconds) and
 English `estimatedTime`. Compiler sums durations → `meta.talkTotalSec`.
 `SAFETY_BUFFER` / finish offsets come from `content/meta.yaml`.
 UI uses `planSlides()` / `meta.*` - never hardcode cumulative clocks.
 **No `optional` slides.**
6. **Canonical equations.** Certain LaTeX fragments are asserted verbatim
 (e.g. `\\overrightarrow{d(\\theta_{i}^{t})}`, kappa social term, adaptive
 sigma). Do not "simplify" equation strings.
7. **Claim discipline.** Persona: «آرام، دقیق، مسلط، قابل نقد». Never claim
 BCOA is universally best - only competitive on the evaluated suite.
8. **Local persistence only.** `localStorage` prefix `bcoa-defense:` via
 `src/lib/storage.ts`.
9. **Time unit is seconds.** No `* 1000` in navigation/timer paths.
10. **No heavy runtime dependencies.** Exactly: `react`, `react-dom`, `katex`,
 `lucide-react`, `@fontsource/vazirmatn`.
11. **Content is external.** Defense prose lives under `content/`, not in
 React components. `src/data/*` are thin re-exports of generated output.
12. **Audio cues work.** Soft beeps at 10 / 5 / 0 seconds remaining when
 audible is on, driven from the timer interval via `src/lib/audio.ts`
 (not a dead `useEffect` on a stable ref).

---

## 3. Commands

```bash
npm install # setup
npm run content # compile content/ → src/content.generated.ts
npm run dev # predev content + Vite on 0.0.0.0:3000 (allowedHosts: .e2b.app)
npm run build # prebuild content + production + PWA
npm run preview # serve dist on 0.0.0.0:3000
npm run lint # tsc --noEmit
npm run verify # preverify content + tests/verify-all.cjs
npm run icons # regenerate brand icons from src/lib/brand.mjs
```

**Definition of done:** `npm run lint` clean, `npm run verify` all-pass,
`npm run build` succeeds.

---

## 4. Repository Map

```
content/ HUMAN source of truth (Markdown + YAML)
 meta.yaml title, safetyBufferSec, finishTarget offsets
 chapters.yaml intro + eight chapters
 deck/*.md one file per slide (see §5)
 cheat/*.yaml equations, concepts, facts, tables
 qa/*.yaml main, hard, drill, categories
 checklist/*.yaml groups, do-dont
 roadmap/roadmap.yaml
 README.md author-facing content guide

scripts/compile-content.mjs zero-dep YAML/MD compiler + validator
scripts/build-brand.mjs icon builder
scripts/lib/raster.mjs

src/content.generated.ts GENERATED - do not hand-edit; commit it
src/data/*.ts re-export shims for stable import paths
src/types.ts shared interfaces (+ PaletteId, PersonalNote)
src/App.tsx shell, print orchestration, formula warm-up
src/index.css design system + five [data-theme] blocks
src/labs/*Lab.tsx five tabs
src/components/ Header, PrintSheet, BrandMark, ShortcutGuide, ui
src/lib/
 session.ts planSlides / totalTalk / practiceWindow from meta
 audio.ts ensureAudio, cueRemaining, playThresholdCue, playTestCue
 palettes.ts five professional palettes + applyPalette()
 content-keys.ts storage key builders + legacy fallbacks
 app-context.tsx tab, typography, audible, palette, focus, print
 brand.mjs brand geometry (icons stay default green)
 storage.ts / persian.ts / tex.tsx / keys.ts / ui-bus.ts / use-*.ts

tests/verify-all.cjs dependency-free invariant suite
docs/PLAN-v3.md architecture plan
```

### Data flow

```
content/** --compile--> src/content.generated.ts --> labs / PrintSheet / session
user notes ----------> localStorage (bcoa-defense:*)
palette ----------> documentElement data-theme + CSS vars
```

---

## 5. Content Authoring Contract

### Slide Markdown (`content/deck/NN-id.md`)

Front matter **must** include:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable kebab-case; storage keys use this |
| `num` | number | Informational; compiler renumbers by file order |
| `title` | string | Persian |
| `chapterId` | string | `start` or `ch1`…`ch8` |
| `durationSec` | number | **Seconds** - authoritative for timers |
| `estimatedTime` | string | **English** label, e.g. `"1 min 40 sec"` |
| `goal` / `phrase` / `transition` | string | optional |
| `visual` | string[] | bullets on the slide |
| `tex` | `{tex, caption?}[]` | ASCII LaTeX only |

Body sections:

```markdown
## Speech
paragraph…

## Coach notes
- tip…
```

### Meta (`content/meta.yaml`)

- `safetyBufferSec` (default 60)
- `finishTarget.fromOffsetSec` / `toOffsetSec` (default 15 / 30 after talk end)

### Compiler guarantees

- Rejects Persian-in-LaTeX, em/en dashes, missing `durationSec` / `estimatedTime`
- Writes `CONTENT_HASH` - `verify` fails if generated file is stale
- Emits `meta.talkTotalSec`, `sessionTotalSec`, `finishFromSec`, `finishToSec`

Full human guide: `content/README.md`.

---

## 6. Global State & Interaction Model

- **Context** (`useApp()`): `tab`/`go()`, `pendingStart`, `textScale`,
 `lineHeight`, `audible`, **`palette`**, `focus`, `shortcutsOn`, `guideOpen`,
 `printScope`/`openPrint`/`closePrint`.
- **Palette:** `pref:palette` ∈ `green|blue|orange|purple|red`.
 `applyPalette()` sets `data-theme` and `--color-accent*` (and aliases
 `--color-pine*` for existing utilities). Ochre (important) and clay (danger)
 stay fixed across themes. BrandMark fill uses `var(--color-accent)`.
 PWA install icons remain default green unless regenerated. The **browser tab favicon** (SVG) updates live with the active palette via `brandSvg()` + a dynamic `link[rel=icon]` in `applyPalette()`. Installed PWA home-screen icons are OS-cached and do not recolor until reinstall.
- **Typography:** `readingStyle()` → `%` font-size + `--reading-lh`.
- **Overlays:** `useModalBehavior`; global shortcuts silent while layers open.
- **Slide numbering:** positional 1…N in the single full deck.
- **Keyboard:** match `e.code`, never `e.key`. Helpers in `lib/keys.ts`.

### Global shortcuts

| Keys | Action |
|------|--------|
| `H` or `?` | Shortcut guide |
| `F` | Focus mode |
| `M` | Audio cues |
| `Esc` | Close layer / exit focus |
| `Alt+1..5` | Jump tab |
| `Alt+P` | PDF current section |
| `Alt+Shift+P` | PDF whole site |

### PracticeLab local keys

Arrows / PageUpDown, Space/P, R, Shift+R, digits + Shift+digits, Home/End.
**No `O` optional-layout toggle** (removed).

Audio: on tick, `cueRemaining(prev, ceil(duration - slideSec), playThresholdCue)`.
Test sound button in Header settings calls `playTestCue()`.

---

## 7. Notes & Highlights

| Layer | Storage key | UI |
|-------|-------------|-----|
| Speech paragraph | `speech-hl:<slideId>-<i>` | `.hl-block` padded rounded card + star |
| Coach note | `note-hl:<slideId>-<i>` | same |
| Whole slide | `slide-hl:<slideId>` | MarkButton |
| Personal note | `slide-note:<slideId>` | `PersonalNote` object: `{ text, important, extras[] }` |

Legacy numeric / `opt` keys are read once and migrated (`content-keys.ts`).

`.hl-block` = soft ochre wash, light border, `border-radius: 12px`, comfortable padding.
Do not bring back the thin underline-only `.hl-mark` as the primary speech style
(kept only for compatibility).

---

## 8. CSS Architecture

Tailwind CSS v4 via `@tailwindcss/vite`. No `tailwind.config.js`.

### Cascade layers (critical)

Unlayered CSS beats `@layer utilities`. Structure of `index.css`:

- `@layer base` - element resets
- `@layer components` - `.card`, `.btn*`, `.chip*`, `.slide-dot`, …
- **Unlayered:** KaTeX overrides, `@media print`, focus-mode helpers, motion tokens,
 `[data-theme="…"]` accent blocks

### Design language

- Cream paper neutrals (shared across palettes)
- Accent via pine utilities → runtime-mapped to active palette
- Ochre = importance; clay = soft danger (fixed)
- Vazirmatn 400/500/700/800
- Radii generous; hover = glow shadow only; no hover translate; no infinite animation;
 full `prefers-reduced-motion`

### Responsive invariants

- Every grid needs explicit `grid-cols-*`
- Grid items with tables: `min-w-0`
- Tables in `.table-wrap`
- Composite chips: `.chip-wrap`
- Content scroll rows: `.hbar`
- Overlays: `max-w-[calc(100vw-2rem)]`
- `main` / `.site-footer`: `overflow-x: clip`

---

## 9. Print / PDF

`PrintScope = 'all' | 'roadmap' | 'deck' | 'cheat' | 'qa' | 'checklist'`.
`PrintSheet` mounts into `.print-root`; accent in print follows active palette.
All slides print in order; no "optional backup" appendix.

---

## 10. PWA / Offline Build

- `vite-plugin-pwa`, `registerType: 'autoUpdate'`, SW only in PROD
- `theme_color` / meta `theme-color` = `#fcfaf3` (cream, palette-independent)
- Icons from `npm run icons` / `brand.mjs`
- Dev/preview: `0.0.0.0:3000`, allow `.e2b.app`
- Cloudflare: `wrangler.jsonc` → `./dist`

---

## 11. Testing Philosophy

`tests/verify-all.cjs` is plain Node: source-text assertions for dashes, LaTeX,
timing sums, content hash freshness, offline purity, CSS layers, a11y wiring,
PDF coverage, brand integrity, **five palettes**, **audio module wiring**,
**no optional path**, **no quick-nav banner sentence**.

When you add a structural rule, add a numbered section in the same commit.

---

## 12. Git / Workflow

- Commit messages: Persian, imperative, summary + body (project convention).
- Never commit `dist/`, `node_modules/`.
- **Do commit** `src/content.generated.ts` alongside `content/` changes.
- 2-space indent, single quotes, semicolons, trailing commas.
- Persian file header comments on new source files.

---

## 13. Common Pitfalls

1. Unlayered element CSS killing Tailwind utilities (§8).
2. Persian inside LaTeX.
3. Hardcoded clocks instead of `planSlides()` / `meta`.
4. Reintroducing `optional` slides or compact/extended dual layout.
5. Audio effect that depends on a stable timer ref (cues never fire) - 
 always cue inside the interval via `cueRemaining`.
6. `e.key` shortcuts on Persian layouts - use `e.code`.
7. Forgetting `useModalBehavior` on new overlays.
8. Milliseconds in timer math.
9. Hover `translateY` or infinite animations.
10. Latin digits in user-facing UI (except intentional LTR technical values).
11. Editing `public/` icons by hand.
12. Em/en dashes from LLM paste.
13. Bare `grid` without `grid-cols-*`.
14. Hand-editing `src/content.generated.ts` or shipping stale hash.
15. Forgetting English `estimatedTime` on new slides.

---

## 14. Quick Checklist Before You Finish

- [ ] `npm run lint`
- [ ] `npm run verify`
- [ ] `npm run build`
- [ ] Persian digits + no em/en dashes in new UI/content
- [ ] New CSS in the correct layer
- [ ] New modals use `useModalBehavior`; shortcuts use `e.code`; ShortcutGuide updated
- [ ] New content covered by PrintSheet if user-visible in a tab
- [ ] Content changes: `durationSec` + English `estimatedTime`; totals still sensible
- [ ] `AGENTS.md` updated if you introduced a rule, structure, or convention

---

## 15. Storage Key Catalog (prefix `bcoa-defense:`)

| Key pattern | Meaning |
|-------------|---------|
| `pref:textScale` | number |
| `pref:lineHeight` | number |
| `pref:audible` | boolean |
| `pref:shortcuts` | boolean |
| `pref:palette` | `green\|blue\|orange\|purple\|red` |
| `session:last` | `{ slide, totalSeconds, slideSeconds, running, stamp }` |
| `slide-hl:<id>` | whole-slide important |
| `speech-hl:<id>-<i>` | speech paragraph highlight |
| `note-hl:<id>-<i>` | coach note important |
| `slide-note:<id>` | `PersonalNote` JSON |
| `eq-note:` / `eq-hl:` / `qa-note:` / `qa-hl:` | cheat/QA item notes |
| `ck:<groupId>` | checklist ticks |
