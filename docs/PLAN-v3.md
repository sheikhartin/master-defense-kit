# Master Defense Kit — Professional Plan v3

**Status:** awaiting user confirmation before implementation  
**Branch:** `arena/01a0b933-master-defense-kit`  
**Date:** 2026-09-19  
**Scope:** product, architecture, UX, content pipeline, theming, and documentation  
**Principle:** plan thoroughly first; implement only after explicit approval of milestones

---

## 0. Executive summary

This plan turns the current BCOA-specific, TypeScript-hardcoded defense coach into a **content-driven, fully offline, themable defense rehearsal kit** while preserving the calm professional identity and all non-negotiable invariants (offline purity, Persian RTL UI, second-based timing, local-only persistence, zero heavy dependencies).

The work is organized into seven milestones. Each milestone is independently verifiable with `npm run lint`, `npm run verify`, and `npm run build`. No milestone ships half-finished theming or a broken audio path.

### What changes for the user (product outcomes)

| # | Outcome | Why it matters |
|---|---------|----------------|
| 1 | **All slides always present** — no “optional / expandable” slide concept in the UI | One clear 20-slide rehearsal path; no hidden content |
| 2 | **Reliable soft audio alerts** at 10s, 5s, and 0s when enabled | The current beep path is structurally broken (see §3.2) |
| 3 | **Five professional color palettes** (green, blue, orange, purple, red) with logo/brand mark adapting | Personal taste without redesigning the product |
| 4 | **Important flag on coach notes and on personal extra notes** | Marks what must not be skipped under pressure |
| 5 | **Full-paragraph importance highlight** with padding + soft rounded corners | Clearer than the current thin gold underline wash |
| 6 | **No persistent “Quick Navigation: …” instructional banner** | Less chrome, more calm focus |
| 7 | **All defense content externalized** (Markdown / structured content files) | The kit becomes reusable for any defense, not only BCOA |
| 8 | **World-class `AGENTS.md`** updated in lockstep | Future agents can work without re-reading the whole tree |

---

## 1. Current-state diagnosis (facts from the codebase)

### 1.1 Architecture today

```
src/data/*.ts          ← content HARDCODED as TypeScript modules
src/labs/*Lab.tsx      ← five tab pages (no router)
src/lib/session.ts     ← planSlides(includeOptional) derives cumulative timing
src/lib/storage.ts     ← localStorage under bcoa-defense:
src/lib/brand.mjs      ← single brand geometry + fixed pine/cream/ochre
src/index.css          ← Tailwind v4 @theme tokens (single pine-green palette)
tests/verify-all.cjs   ← source-text invariant suite (no browser E2E)
```

Content modules:

| File | Role |
|------|------|
| `src/data/deck.ts` | 8 chapters + 20 slides (19 standard + 1 `optional: true`) + `SAFETY_BUFFER` |
| `src/data/cheat.ts` | Equations, concept cards, key facts, backup tables |
| `src/data/qa.ts` | Examiner Q&A banks + drill categories |
| `src/data/checklist.ts` | Defense-day checklists + do/don’t |
| `src/data/roadmap.ts` | Mission, claim boundaries, practice methods |

### 1.2 Confirmed product bugs / friction matching the request

1. **Optional slide model**  
   - Slide “وراثت جهت و رقابت سرزمینی” is flagged `optional: true` in `deck.ts`.  
   - Practice UI defaults to compact 19-slide layout; extended layout is a checkbox + `O` key.  
   - Tags, slide dots (dashed), print sheet, and session mapping all special-case `optional`.  
   - **User direction:** include all slides; do not mark any as optional/expandable.

2. **Audio alert does not fire during countdown (root cause)**  
   In `PracticeLab.tsx` the beep effect depends on `[running, current, plan, app.audible, timer]`.  
   - `timer` is a **ref object** (stable identity).  
   - Countdown advances via `setInterval` → mutates `timer.current` → `bump()` re-render.  
   - The effect **does not re-run on ticks**, so `rem` is computed once when running starts and never re-checked at the 10 / 5 / 0 boundaries.  
   - Cleanup also sets `prevRem.current = null`, which would break edge detection even if the effect did re-run.  
   - Secondary risks: `AudioContext` created only on play; browsers may still block if resume fails; no test covers the path.

3. **Single fixed palette**  
   Design tokens and brand mark are pine-green only. No theme switcher. Logo fill is hardcoded `BRAND_COLORS.pine`.

4. **Notes / highlights are incomplete relative to the request**  
   - Speech paragraphs: star toggle → class `hl-mark` (gradient underline wash, tight `py-1.5`, weak “card” feel).  
   - Whole-slide mark: `MarkButton` / `slide-hl:*`.  
   - Coach notes (`slide.notes`): plain list, **not markable as important**.  
   - Personal `NoteBox`: free text only, **no importance flag** on the note or on lines within it.

5. **Persistent quick-nav instructional copy**  
   Always visible in PracticeLab:
   > «ناوبری سریع: روی هر اسلاید بزن، یا با کلیدهای ۱ تا ۹ و ۰ …»

6. **Content is deeply coupled to code**  
   Adding another thesis requires editing TypeScript, types, tests, and print coverage. There is no `content/` tree, no loader, no schema validation beyond `verify-all.cjs` string checks.

7. **`AGENTS.md` is strong for the *current* design** but will be wrong the moment content moves out of `src/data/*.ts` and theming / non-optional decks land. It must be rewritten as part of the same program of work, not as an afterthought.

---

## 2. Expert consultation synthesis

The following positions were pressure-tested as if reviewed by complementary experts. Consensus is recorded; dissent and the chosen resolution are explicit so the implementation does not thrash later.

### 2.1 Panel (roles)

| Expert | Focus |
|--------|--------|
| **A — Product / defense coach** | Calm UX under stress; one clear path; no instructional noise |
| **B — Frontend architect** | Content/code split, type safety, Vite offline constraints |
| **C — Design systems** | Multi-palette without losing cohesion; brand mark adaptation |
| **D — Accessibility** | WCAG contrast, reduced motion, keyboard, non-color-only cues |
| **E — QA / invariants** | `verify-all.cjs` evolution; timing math; offline purity |
| **F — DX / AI-agents** | `AGENTS.md` as executable knowledge; file layout clarity |
| **G — Security / privacy** | Still 100% offline; no upload telemetry; local-only notes |

### 2.2 Decisions (consensus)

#### D1 — Optional slides: **abolish the concept in product and data**

- **Consensus:** Every slide in the active deck is first-class. No `optional` flag, no dashed dots, no “چیدمان گسترده” toggle, no `O` shortcut, no compact/extended dual timing.  
- **Timing:** The single canonical talk length becomes the former *extended* total: **sum(all slide durations) = 1155 s (19:15)** + `SAFETY_BUFFER = 60` → session 20:15; finish target **19:30 تا 19:45**.  
- **Migration:** The former optional slide keeps its content and natural position (index of current #11 in extended order) but is a normal slide numbered by position.  
- **Tests:** Replace “19 standard + 1 optional / mainSum === 1110” with “N slides / talkSum === 1155 (or derived from content)” and delete optional-flag assertions.  
- **Dissent rejected:** Keeping a hidden “advanced layout” switch “just in case” reintroduces the exact confusion the user wants gone.

#### D2 — Content pipeline: **build-time Markdown → typed JSON module** (not runtime `fetch`)

- **Problem:** A pure runtime `fetch('/content/...')` fights the offline PWA + `file://` / service-worker mental model and complicates tests.  
- **Chosen approach:**
  1. Authors edit human files under `content/` (Markdown + light front matter).  
  2. A small **Node build step** (`scripts/compile-content.mjs`), run from `predev` / `prebuild` / `verify`, parses and validates content and emits `src/content.generated.ts` (or `.json` imported as a module).  
  3. The React app continues to import **one typed bundle** — still zero network, still tree-shakeable, still offline.  
- **Why not MDX:** MDX pulls a compiler into the client or complex Vite plugins; heavy and fragile.  
- **Why not keep TS modules:** User explicitly rejected hardcoding defense texts in code; TS modules also tempt logic leakage into content.  
- **Why not a CMS / upload UI in v3:** Out of scope for “plan + next confirmation.” Design the folder contract so a future “import zip” feature can drop files into the same shape. Document the extension point; do not build the uploader yet.

#### D3 — Markdown shape: **one file per slide, plus sibling bundles**

```
content/
  meta.yaml                 # kit title, persona, safety buffer, locale
  chapters.yaml             # ordered chapter list
  deck/
    01-title.md
    02-agenda.md
    …
    11-direction-inheritance.md
    …
  cheat/
    equations.md            # or one file per equation
    concepts.md
    facts.md
    tables/*.md
  qa/
    main.md
    hard.md
    drill.md
  checklist/
    groups.md
    do-dont.md
  roadmap/
    roadmap.md
```

Front matter (YAML) on each slide Markdown carries structured fields; the body carries speech paragraphs and notes using simple conventions (see §4.3).

#### D4 — Theming: **CSS custom properties + data-theme, five curated palettes**

- Keep the **cream paper / warm ink** foundation (shared neutrals) so the product still feels like one family.  
- Swap only **accent tokens**: primary, primary-deep, primary-soft, primary-wash, glow shadows, focus ring, progress fill, active nav, brand shield fill.  
- Ochre (highlight/important) and clay (soft danger) stay **stable across themes** so “important” and “overrun” always mean the same thing.  
- Palettes: `green` (current pine, default), `blue`, `orange`, `purple`, `red`.  
- Persist `pref:palette` via existing storage helpers.  
- `BrandMark` reads accent from CSS variables (or a small palette map shared with `brand.mjs`) so the **logo tile fill tracks the palette**. Icon build (`npm run icons`) can keep generating the **default green** set for installables; runtime SVG mark follows the live theme. (Regenerating five full PWA icon sets is optional polish, not required for correctness.)  
- Print CSS: either force default green for predictable paper output, or honor the active palette; **recommendation:** honor accent for on-screen fidelity, keep neutrals for paper. Confirm in milestone review.  
- a11y: each palette must meet contrast for primary buttons and active nav on cream paper; verify manually and with a contrast checklist in `verify` where feasible (hex pairs asserted).

#### D5 — Importance marking model

Three orthogonal layers (do not collapse them):

| Layer | What | Storage key pattern | Visual |
|-------|------|---------------------|--------|
| **Speech paragraph** | Mark a spoken paragraph important | `speech-hl:<slideId>-<i>` | Full soft pill: padding, `rounded-xl`, warm ochre wash background, subtle border — **not** the thin gradient underline |
| **Coach note item** | Mark a scenario note important | `note-hl:<slideId>-<i>` | Same pill treatment + small star/flag control on each note row |
| **Personal note** | Mark the whole personal note box important **and/or** individual user-added extra note lines | `slide-note-flag:<slideId>` + structured extras `slide-extras:<slideId>` | Flag on NoteBox header; extras list with per-item star |

**Personal extras (new, small):** upgrade `NoteBox` from a single textarea to:

1. Keep the freeform textarea (backward compatible with existing `slide-note:*` strings).  
2. Add an optional “یادداشت‌های کلیدی” list where the user can add short lines, each starrable as important.  
3. Migrate safely: if stored value is a string, treat as legacy freeform text; if object, use `{ text, important, extras[] }`.

#### D6 — Quick navigation chrome

- **Remove** the always-on instructional sentence.  
- Keep the slide-dot strip (useful, discoverable).  
- Keep keyboard jumps (1–9, 0, Shift+digit); document only in `ShortcutGuide` (`H` / `?`).  
- Optional one-time tip via `pref:seenNavTip` was considered and **rejected** for v3 to avoid nag patterns; power users already have `H`.

#### D7 — Audio engine rewrite

- Move beep logic off the “effect that doesn’t see ticks” pattern.  
- **Preferred:** inside the timer interval, after advancing time, compute `rem = ceil(duration - slideSec)` and edge-trigger beeps when crossing 10, 5, 0 (compare previous integer remaining).  
- Call `ensureAudio()` on enabling audible **and** on starting the timer (user gesture).  
- Guard: only beep if `audible && running`.  
- Reset edge baseline on slide change and on slide-timer reset.  
- Do **not** beep when jumping slides while paused.  
- Keep sounds soft (low gain sine); respect no infinite animation rules (audio is finite one-shots).  
- Add a “test sound” control in reading settings so users can verify audio without waiting for a slide boundary.  
- Add a `verify-all` structural assertion that the practice timer path references the shared audio helper (prevents regressions to a dead effect).

#### D8 — Naming / product generalization

- Code may keep package name `bcoa-defense-kit` for continuity **or** introduce a neutral `defense-kit` framing in docs while default content remains BCOA.  
- Storage prefix `bcoa-defense:` stays for backward compatibility with existing user notes; document it. A future migration map can rewrite keys if the product is fully rebranded.  
- `AGENTS.md` describes the **kit platform** + “default content pack = BCOA Final Scenario v2”.

#### D9 — `AGENTS.md` standard

Rewrite to include:

1. Product definition (platform vs content pack)  
2. Invariants (updated: no optional slides; content lives under `content/`; themes; audio)  
3. Commands (including `npm run content` / prehooks)  
4. Repository map (new `content/`, compiler, generated file)  
5. Content authoring contract (front matter schema, examples)  
6. Theming contract (tokens, how to add a palette)  
7. State / storage key catalog  
8. CSS layering rules (unchanged core)  
9. Print / PWA / testing / pitfalls  
10. “Definition of done” checklist  

Rule remains: **update `AGENTS.md` in the same commit as any new convention.**

---

## 3. Target architecture

### 3.1 High-level

```
content/**                   human-authored source of truth (Markdown/YAML)
        │
        ▼
scripts/compile-content.mjs  validate + compile (Node, zero extra deps if possible)
        │
        ▼
src/content.generated.ts     typed snapshot imported by app (git-commit generated OR build artifact)
        │
        ├── lib/session.ts   planSlides() over all slides (no optional filter)
        ├── labs/*           render from generated content
        ├── components/PrintSheet.tsx
        └── tests/verify-all.cjs  asserts content tree + generated invariants
```

**Generated file policy (recommendation):**  
Commit `src/content.generated.ts` so clone → `npm install` → `npm run dev` works even if someone forgets the prehook, **and** still regenerate on every build. `verify` fails if generated output is stale relative to `content/`.

### 3.2 Runtime data flow

```
AppProvider
  ├── tab, typography, audible, focus, shortcuts, printScope
  ├── palette  →  document.documentElement.dataset.theme = palette
  └── …

PracticeLab
  ├── plan = planSlides()           // always full deck
  ├── timer ref + interval
  │     └── on tick: update time; maybe beep via audio.ts
  ├── notes / highlights / extras via storage.ts
  └── UI: dots, slide card, speech pills, coach notes with stars
```

### 3.3 Theming mechanics

```css
/* shared neutrals in @theme */
@theme { --color-paper: …; --color-ink: …; … }

/* accent defaults = green */
:root, [data-theme="green"] {
  --color-accent: #1e5a49;
  --color-accent-deep: #163f35;
  --color-accent-soft: #e6efe8;
  --color-accent-wash: #eef4ed;
  /* map legacy --color-pine* to accent aliases for gradual migration */
  --color-pine: var(--color-accent);
  …
}

[data-theme="blue"]   { … }
[data-theme="orange"] { … }
[data-theme="purple"] { … }
[data-theme="red"]    { … }
```

Migration tactic: introduce accent aliases first, point existing `--color-pine*` at them, then gradually rename class names (`bg-pine` → `bg-accent`) **or** keep Tailwind token name `pine` as the semantic “primary accent” even when the hue is blue.  

**Design-system recommendation:** keep utility names as **semantic primary** (`pine` as historical name is confusing). Prefer introducing `accent` tokens and dual-mapping during one milestone, then switch class names in a dedicated cleanup pass so diffs stay reviewable.

Brand mark:

```tsx
// BrandMark reads getComputedStyle accent OR palette map
<rect fill="var(--color-accent, #1e5a49)" />
```

Inline SVG `fill="var(--…)"` works when the SVG is in the DOM (not external file). Keep that approach.

### 3.4 Audio module

New `src/lib/audio.ts`:

- `ensureAudio(): void`
- `beep(opts?): void`
- `cueRemaining(prevRem: number | null, nextRem: number): number | null` — pure edge detector for 10/5/0  
- `playTestCue(): void`

PracticeLab interval owns the edge state. Unit-ish assertions in `verify-all` can parse that `cueRemaining` thresholds exist; optional tiny pure test by exporting and requiring the module in Node if kept dependency-free (may need `.mts` or duplicate pure function in verify — prefer pure function with no DOM so Node can import after compile, or re-implement threshold list assertion only).

---

## 4. Content authoring contract (draft schema)

### 4.1 `content/meta.yaml`

```yaml
id: bcoa-master-defense
title: بستار دفاع ارشد BCOA
locale: fa
dir: rtl
safetyBufferSec: 60
persona: آرام، دقیق، مسلط، قابل نقد
# finish target offsets after talk end
finishTarget: { fromOffsetSec: 15, toOffsetSec: 30 }
```

### 4.2 `content/chapters.yaml`

```yaml
- id: ch1
  num: "۰۱"
  title: مقدمه
  summary: …
  goal: …
  # slide ids listed explicitly OR inferred from deck front matter chapterId
```

### 4.3 Slide Markdown (`content/deck/11-….md`)

```markdown
---
id: direction-inheritance
num: 11
title: وراثت جهت و رقابت سرزمینی
chapterId: ch4
duration: 45
goal: …
phrase: …
transition: …
visual:
  - نکته روی اسلاید ۱
  - نکته ۲
tex:
  - tex: "\\kappa\\,\\bigl(X_g^{t}-X_i^{t}\\bigr)"
    caption: جمله اجتماعی
---

## گفتار

پاراگراف اول گفتار.

پاراگراف دوم گفتار.

## یادداشت اجرا

- اول آهسته صحبت کن.
- به فرمول اشاره کن، روخوانی نکن.
```

Compiler responsibilities:

- Enforce ASCII-only LaTeX in `tex[].tex`  
- Forbid em/en dashes in compiled strings  
- Sum durations; expose `talkTotal`  
- Stable `id` for storage keys (**prefer `id` over bare num** going forward, with alias migration from old `slide-note:11` keys)  
- Order by filename prefix or explicit `num`

### 4.4 Q&A / cheat / checklist

Use Markdown sections with YAML front matter per item, or a single file with `---` stacked documents (YAML document stream). Prefer **one item per file** only when count is high; for this pack, grouped files with clear headings are enough if the compiler is strict.

Example Q&A item fence:

```markdown
### Q-12
- category: آماری
- question: …
- answer: …
- tip: …
- keySentence: …
```

### 4.5 Storage key migration

| Legacy | New |
|--------|-----|
| `slide-note:11` / `slide-note:opt` | `slide-note:<id>` |
| `speech-hl:opt-0` | `speech-hl:<id>-0` |
| `slide-hl:opt` | `slide-hl:<id>` |

On read, try new key then fall back to legacy num/opt keys once; do not write legacy again.

---

## 5. UX specification (delta only)

### 5.1 Practice lab

- Slide dots: 1…N for full deck; no `.optional` dashed style.  
- Header tag: always `بخش {num} · {title}` (never “اسلاید اختیاری”).  
- Remove quick-nav sentence; retain dots + optional subtle `aria-label` on the nav region.  
- Remove extended-layout checkbox and `KeyO` handler; update `ShortcutGuide`.  
- Speech paragraphs: click star → `.hl-block` (padded, `rounded-xl`, ochre soft bg, light border).  
- Coach notes: each row has star; important rows use `.hl-block`.  
- NoteBox: importance toggle on the box; “افزودن یادداشت کلیدی” for extras with per-item star.  
- Audio: working cues; test button in settings.

### 5.2 Header reading settings

Add:

- Palette segmented control (5 swatches + Persian labels)  
- “آزمایش صدا” button when audible is on (or always, and enable audible on success)

### 5.3 Home / roadmap / print

- Timing copy always reflects full-deck totals (19:15 talk, etc.).  
- Print deck includes all slides in order; delete “پشتیبان اختیاری” section split.  
- PDF menu hint text no longer says “نوزده اسلاید + پشتیبان اختیاری”.

### 5.4 HomeLab resume card

Uses full plan only; simplify session marker (drop `optional` field; ignore if present in old markers).

---

## 6. Milestones (implementation phases)

> **Gate:** User confirms this plan (or a revised version) before coding begins.  
> **Definition of done per milestone:** `npm run lint` + `npm run verify` + `npm run build` clean; `AGENTS.md` section updated if conventions changed; no em/en dashes; Persian digits in new UI strings.

### Milestone 0 — Alignment freeze (no code)

**Deliverable:** this document + confirmation checklist (§9).  
**Exit:** user signs off on decisions D1–D9 or lists amendments.

### Milestone 1 — Practice UX hardening (no content-pipeline yet)

**Goal:** fix the painful runtime issues on the current data shape first, so rehearsal quality improves immediately.

Work:

1. **Audio rewrite** (`src/lib/audio.ts` + PracticeLab interval integration + test cue in Header).  
2. **Abolish optional UX** while content still lives in `deck.ts`:  
   - `planSlides()` always includes all slides; remove `includeOptional` parameter.  
   - Remove checkbox, `KeyO`, dashed optional dots, optional tags, compact/extended mapping helpers.  
   - Set `optional: false` or delete the field from the former optional slide; keep its duration in the sum.  
   - Update HomeLab, PrintSheet, ShortcutGuide, README timing sentences, verify-all timing assertions (1155 talk seconds).  
3. **Remove quick-nav instructional banner.**  
4. **Paragraph highlight visual upgrade** (`.hl-block`).  
5. **Coach-note importance stars** + storage keys.  
6. **NoteBox importance + extras list** with backward-compatible storage.  
7. Update `AGENTS.md` sections on timing, practice keys, storage keys, audio.

**Risk:** session markers with `optional: true` from old runs — migrate/ignore gracefully.  
**Verify adds:** audio helper presence; no `optional: true`; talk sum 1155; no quick-nav sentence; ShortcutGuide without O-for-optional.

### Milestone 2 — Professional palettes + adaptive brand mark

**Goal:** five tasteful themes; logo background follows accent.

Work:

1. Define palette token tables (green/blue/orange/purple/red) with shared neutrals.  
2. Wire `data-theme` on `<html>` from `pref:palette`.  
3. Palette picker UI in Header settings (swatches, names in Persian).  
4. Map component colors so primary surfaces follow accent; keep ochre/clay semantics.  
5. `BrandMark` uses accent variable; confirm header/footer/focus mark update live.  
6. Focus ring, selection, progress bar, slide-dot.active, btn-primary follow accent.  
7. Contrast pass per palette; document hex pairs.  
8. `theme-color` meta: either dynamic via DOM or keep neutral cream `#fcfaf3` (cream is palette-independent — **keep cream** for browser chrome stability).  
9. Print CSS: decide per §2 D4; implement consistently.  
10. `AGENTS.md` theming chapter + verify assertions for five `data-theme` blocks and absence of hardcoded single-accent assumptions where unsafe.

**Non-goal:** five separate PWA icon PNGs. Default install icons remain green unless user later requests multi-icon generation.

### Milestone 3 — Content pipeline foundation

**Goal:** move from “content in TS” to “content in files” without changing user-visible copy.

Work:

1. Create `content/` tree; move BCOA materials 1:1 from `src/data/*` into Markdown/YAML.  
2. Implement `scripts/compile-content.mjs` (validate + emit `src/content.generated.ts`).  
3. npm scripts: `content`, `predev`, `prebuild`; `verify` runs compile freshness check.  
4. Switch app imports from `src/data/*` to generated module (thin re-export shims allowed during transition).  
5. Delete or reduce `src/data/*` to re-exports **only if** needed for gradual migration; end state = no hand-authored defense prose in `src/`.  
6. Expand `types.ts` only as needed (`id: string` on slides, etc.).  
7. Rewrite verify-all content assertions to read **either** generated output or `content/` sources (prefer sources + “generated is fresh”).  
8. Document authoring in `content/README.md` (short) + full contract in `AGENTS.md`.

**Risk:** LaTeX escaping in Markdown/YAML — compiler must not mangle backslashes; golden-file tests for canonical equations.  
**Risk:** Persian digits in YAML — keep as strings.

### Milestone 4 — Storage key modernization & polish

**Goal:** slide `id`-based keys, legacy fallbacks, polish notes UX, print fidelity with new highlight semantics (print may show speech text only; importance is personal — usually **not** printed, remains device-local).

Work:

1. Centralize key builders in `src/lib/content-keys.ts`.  
2. Legacy fallback reads.  
3. QA/cheat note keys aligned if they still use numeric ids.  
4. Microcopy pass (timing strings, PDF labels).  
5. Responsive checks on palette picker and extras list (320px).  

### Milestone 5 — AGENTS.md + README excellence

**Goal:** documentation good enough that a new agent never needs a full-repo archaeology pass.

Work:

1. Full `AGENTS.md` rewrite (structure in D9).  
2. README: features list updated (palettes, all slides, external content, audio).  
3. `content/README.md` quick-start for humans editing slides.  
4. Architecture diagram (mermaid or ASCII) in AGENTS.  
5. Pitfalls list expanded (audio edge detection, stale generated content, theme contrast, YAML LaTeX).

### Milestone 6 — Hardening & regression net

**Goal:** lock the new world.

Work:

1. Broaden `tests/verify-all.cjs`:  
   - content schema required fields  
   - duration sum  
   - no `optional`  
   - no em/en dash in `content/`  
   - ASCII LaTeX  
   - canonical equations present  
   - five palettes defined  
   - audio thresholds  
   - generated freshness  
   - CSS layering still valid  
   - offline purity still valid  
2. Manual rehearsal script (written checklist in docs): 20-slide run, audible on, palette switch mid-session, note extras, print each scope.  
3. Final Persian copy edit for UI chrome only (not thesis content).

### Milestone 7 (optional future, not in v3 commit scope)

- In-app “load content pack” (zip → IndexedDB) while staying offline after import  
- Multi-pack switcher  
- Per-palette maskable icon generation  
- Coach mode vs examinee mode  
- Spaced-repetition for Q&A  

Recorded so we do not accidentally half-build them now.

---

## 7. Detailed work breakdown (engineering checklist)

### 7.1 Files likely touched

| Area | Paths |
|------|-------|
| Audio | `src/lib/audio.ts` (new), `src/labs/PracticeLab.tsx`, `src/components/Header.tsx` |
| Optional removal | `src/lib/session.ts`, `src/data/deck.ts` (interim), `PracticeLab`, `HomeLab`, `PrintSheet`, `ShortcutGuide`, `README`, `AGENTS`, `verify-all` |
| Highlights / notes | `src/components/ui.tsx`, `PracticeLab`, `src/index.css`, `src/lib/storage.ts` |
| Themes | `src/index.css`, `src/lib/app-context.tsx`, `Header`, `BrandMark`, `src/lib/brand.mjs` (accent maps), `index.html` (optional) |
| Content pipeline | `content/**`, `scripts/compile-content.mjs`, `src/content.generated.ts`, `src/types.ts`, `package.json` scripts, labs/print imports |
| Docs | `AGENTS.md`, `README.md`, `docs/PLAN-v3.md` (this file), `content/README.md` |

### 7.2 Explicit non-goals (v3)

- No backend, no cloud sync, no analytics  
- No new runtime dependencies (no gray-matter npm package if a 30-line YAML front matter parser suffices; if YAML becomes painful, allow **one** devDependency for parse-only at build time — never shipped to client)  
- No MDX  
- No real upload UI yet  
- No dark mode (still light `color-scheme: light`)  
- No hover-lift / infinite animations  
- No change to claim-discipline of BCOA scientific content

### 7.3 Dependency policy

Runtime remains: `react`, `react-dom`, `katex`, `lucide-react`, `@fontsource/vazirmatn`.  

Build-time: prefer zero new deps; if YAML is error-prone, `yaml` as **devDependency** only is acceptable with verify ensuring it never lands in `dist` vendor chunks for content paths (compiler runs in Node only).

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Audio still blocked by browser autoplay policies | High | Resume AudioContext on user gestures only; test-sound button; visual stage already shows warn/end |
| Palette contrast failure (e.g. light orange on cream) | Medium | Curate deeper accents; assert contrast pairs; never pure neon |
| Content compiler bugs mangle LaTeX | High | Golden equation fixtures in verify; round-trip sample |
| Stale generated content in git | Medium | Freshness hash check in verify; prehooks |
| Storage key rename loses user notes | Medium | Read fallback chain; never wipe localStorage |
| Scope creep into upload/CMS | High | Milestone 7 explicitly deferred |
| Dual timing docs drift (README vs UI vs tests) | Medium | Single derived numbers from compiler output in docs where possible |
| `BrandMark` vs static PWA icons diverge by palette | Low | Document: install icon = default green; in-app mark = live accent |
| verify-all becomes huge | Low | Section numbering discipline; helper functions |

---

## 9. Confirmation checklist (for the next message)

Please reply with decisions on each item. Defaults below match this plan if you say “approve as written.”

| ID | Question | Plan default |
|----|----------|--------------|
| C1 | Abolish optional slides entirely and always use the 20-slide / 19:15 timing? | **Yes** |
| C2 | Approve audio rewrite (interval edge-trigger + test sound)? | **Yes** |
| C3 | Five palettes: green, blue, orange, purple, red; shared cream neutrals; ochre/clay fixed? | **Yes** |
| C4 | Logo/brand mark fill follows active palette; PWA install icons stay default green? | **Yes** |
| C5 | Speech + coach notes + personal extras all starrable; paragraph highlight = padded rounded block? | **Yes** |
| C6 | Remove quick-nav instructional sentence permanently (docs only via H)? | **Yes** |
| C7 | Externalize content to `content/**` Markdown with build-time compile (not runtime fetch, not upload UI yet)? | **Yes** |
| C8 | Commit generated `src/content.generated.ts` + freshness verify? | **Yes** |
| C9 | Milestone order 1→2→3→4→5→6 as above? | **Yes** |
| C10 | Keep storage prefix `bcoa-defense:` for compatibility? | **Yes** |
| C11 | Print PDF: follow active accent or force green? | **Follow accent** |
| C12 | Any additional palettes or only the five named? | **Only five** |
| C13 | Should default content remain BCOA Final Scenario v2 verbatim while plumbing becomes generic? | **Yes** |
| C14 | Is multi-pack / zip import deferred to a later version? | **Yes, deferred** |

### Amendments channel

If you disagree, answer like:

- `C7: prefer runtime fetch of /content/*.md from public/`  
- `C11: force green in print`  
- `C1: keep optional slide but don’t label it optional`  
- etc.

---

## 10. Success metrics

The program is successful when:

1. A user opens Practice, enables sound, runs a slide to its limit, and hears soft cues at 10, 5, and 0 without opening the console.  
2. All 20 slides appear in order with positional numbers; no UI copy says «اختیاری» / optional / extended layout.  
3. Switching palette recolors primary chrome + brand mark within one frame; text remains readable.  
4. User can star a speech paragraph, a coach note, and a personal extra note; stars survive reload.  
5. Quick-nav banner is gone; `H` still documents jumps.  
6. Editing `content/deck/01-*.md` and running `npm run content && npm run dev` changes the app; no defense prose remains hand-maintained under `src/data/`.  
7. `npm run lint && npm run verify && npm run build` is green.  
8. A cold AI agent can read only `AGENTS.md` + `content/README.md` and correctly add a slide or a palette.

---

## 11. Suggested first implementation slice (after approval)

If the plan is approved “as written,” start **Milestone 1** only:

1. `src/lib/audio.ts` + fix PracticeLab  
2. Remove optional pathway end-to-end  
3. Nav banner removal  
4. `.hl-block` + note starring + NoteBox extras  
5. verify + AGENTS delta  

Then pause for a quick visual/audio sanity check before Milestone 2 (palettes), which is the next most user-visible win, then Milestone 3 (content extraction), which is the largest structural change.

---

## 12. Open technical notes (non-blocking)

- `rememberSession` currently does not persist `optional` but PracticeLab’s reader expects it — already inconsistent; cleanup in M1.  
- `prevRem` cleanup bug must not be reintroduced; edge state lives beside the interval.  
- Tailwind v4 `@theme` tokens vs runtime `data-theme`: runtime accents should be plain CSS variables on `:root` / `[data-theme]`, not re-generated `@theme` blocks per theme (unless we duplicate tokens carefully).  
- Consider renaming CSS semantic `pine` → `accent` in a dedicated commit inside M2 to keep reviews sane.  
- Compiler should strip a leading BOM and normalize newlines to avoid hash thrash on Windows later.

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| v3.0 | 2026-09-19 | Initial full plan for user confirmation |

**Next step:** user confirms §9 checklist. No implementation commits until then.
