# Master Defense Kit — Plan

> **Single living plan file.** This is the only plan/milestone document for this
> project, and its name is stable forever: no `PLAN-v2`, `PLAN-v3`,
> `MILESTONE-1`, … History lives in the change log at the bottom, never in the
> file name. Update this file in place whenever a milestone ships or a decision
> changes.

**Status:** M0–M6 shipped · M8 (global brand icon) shipped 2026-09-20 · M9 (content format) proposed, awaiting approval
**Principle:** plan thoroughly first; implement only after explicit approval of a milestone.
**Definition of done per milestone:** `npm run lint` + `npm run verify` + `npm run build` clean.

---

## 1. What this project is

**بستار دفاع ارشد BCOA** is a calm, fully offline, installable (PWA) practice
tool for a Master's thesis defense. It is a **content-driven platform**:

- **App shell** (React/TypeScript): timers, themes, notes, print, PWA.
- **Content pack** (`content/`): all defense prose, slides, Q&A, cheat sheets,
 checklists. Default pack = BCOA Final Scenario v2.
- **Compiler** (`scripts/compile-content.mjs`): validates `content/` and builds
 `src/content.generated.ts` (committed; `verify` fails if stale).

Full working rules: `AGENTS.md` (single source of truth for invariants).

---

## 2. Milestones

| # | Milestone | Status | Note |
|---|-----------|--------|------|
| M0 | Alignment freeze: decisions D1–D9, checklist C1–C14 | Done (2026-09-19) | Original plan, approved as written |
| M1 | Practice UX hardening: audio rewrite, no optional slides, `.hl-block`, note starring, no quick-nav banner | Done | |
| M2 | Five professional palettes + adaptive brand mark | Done | |
| M3 | Content pipeline: `content/**` → typed generated module | Done | |
| M4 | Storage key modernization (`id`-based keys, legacy fallbacks) | Done | |
| M5 | `AGENTS.md` + README excellence | Done | |
| M6 | Hardening & regression net (`tests/verify-all.cjs`) | Done | |
| M7 | Future ideas (parked) | Parked | Pack import (zip → same folder shape), multi-pack switcher, coach vs examinee mode, spaced-repetition Q&A. Do not half-build these. |
| M8 | Global brand icon (fixed, palette-independent) | Done (2026-09-20) | See §5 |
| M9 | Content format hardening | **Proposed (2026-09-20), awaiting approval** | See §4 |

---

## 3. Decision record

### Original (2026-09-19, M0)

| ID | Decision |
|----|----------|
| D1 | Abolish optional slides; talk length = sum of all slides (1155 s = 19:15) + 60 s buffer |
| D2 | Build-time compile of `content/` → typed module (not runtime fetch, not MDX) |
| D3 | One Markdown file per slide + sibling bundles; YAML front matter carries structure |
| D4 | Five palettes on shared cream neutrals; ochre/clay fixed; accent tokens via `data-theme` |
| D5 | Three independent importance layers (speech paragraph, coach note, personal note/extras) |
| D6 | Remove permanent quick-nav instruction; document jumps only via `H` guide |
| D7 | Audio: interval edge-trigger for 10/5/0 cues + test-sound button |
| D8 | Kit framed as platform; default pack stays BCOA; storage prefix `bcoa-defense:` kept |
| D9 | `AGENTS.md` rewritten as executable knowledge, updated in the same commit as any convention |

### Added

- **D10 (2026-09-20) — Global app icon.** Installed icons (PWA PNGs, iOS,
 `favicon.ico`, `icon.svg`) are a **fixed, palette-independent** mark:
 "shield and voice" — gold shield + cream microphone on a deep-pine tile
 (`APP_ICON` palette in `src/lib/brand.mjs`). Only the in-app mark's tile and
 the live tab favicon follow the active palette. Supersedes the
 "PWA install icons stay default green" half of original C4/D4. Rationale:
 the installed icon rarely changes, so it must be one standard, recognizable
 logo — not a palette swatch.
- **D11 (2026-09-20) — Single living plan file.** `docs/PLAN.md` is the only
 plan/milestone file; it is updated in place. Version numbers go in the change
 log, never in the file name. (Former `docs/PLAN-v3.md` renamed 2026-09-20.)
- **D12 (2026-09-20, proposed) — Content format policy.** Keep the two-tier
 hybrid: Markdown + front matter for prose, YAML for compact structured data;
 no MDX/JSON/third format. Hardening phases M9.1–M9.3 in §4. **Pending
 approval.**

---

## 4. M9 proposal — content format (awaiting approval)

### 4.1 Current state

- **Slides** (`content/deck/*.md`): Markdown body + YAML front matter. Works
 well: one file per unit, readable, clean diffs.
- **Everything else** (`meta.yaml`, `chapters.yaml`, `qa/*.yaml`,
 `cheat/*.yaml`, `checklist/*.yaml`, `roadmap/roadmap.yaml`): pure YAML,
 parsed by a **zero-dependency hand-rolled YAML subset parser** inside
 `scripts/compile-content.mjs`.

### 4.2 Problems with the current state

1. Long Persian prose sits in **single-line quoted YAML strings** (QA answers,
 tips, key sentences; equation `meaning`/`verbal`; concept cards). Hard to
 read, impossible to wrap, quote/backslash escaping.
2. LaTeX backslashes must be doubled inside double-quoted YAML (`\\kappa`
 written `\\\\kappa`); authors think in doubles.
3. The hand-rolled parser covers a **subset** of YAML (no flow maps, limited
 multi-line, no anchors); error messages are bare; every new content shape is
 a parser risk.
4. The compiler already supports `|` literal blocks, but none of the content
 uses them — the cheapest available win is unused.

### 4.3 Options considered

| Option | Verdict |
|--------|---------|
| **YAML (current)** | Fine for compact structured/tabular data. Poor for long prose. |
| **Markdown + YAML front matter (slide pattern)** | Best for prose: readable, previewable, one file per unit, structured fields in front matter. Already proven in `deck/`. |
| **MDX** | Rejected (original D2): pulls a compiler into the build, conflicts with the no-heavy-dependencies and zero-extra-toolchain invariants. |
| **TOML** | Simpler scalars and native types, but a third format to learn; weak fit for Persian prose; no real gain for ~10-line config files like `meta.yaml`. |
| **JSON / JSONC / JSON5** | Strict and universal, but no comments (JSON), verbose, poor for prose authoring and diffs; needs a parser dependency or fragile comment stripping. |
| **Plain Markdown, no front matter** | Possible for prose banks, but fields like `durationSec`/`tex`/`category` still need a structured mini-language; front matter is cleaner and already the convention. |
| **CSV/TSV** | No nesting, quote/encoding fragility, unusable for prose. Rejected. |

### 4.4 Recommendation (D12)

Keep the two-tier hybrid already established by the deck, and codify it as the
format contract:

- **Prose → Markdown + YAML front matter** (slide pattern).
- **Compact structured/tabular data → YAML** (`meta`, `chapters`, `categories`,
 `tables`, `checklist`, `do-dont`).
- **No MDX, no JSON, no third format.**

Phased, each independently verifiable with `lint` + `verify` + `build`:

- **M9.1 (low risk, recommended first step):** rewrite long one-line YAML
 prose fields as `|` literal blocks (QA `answer`/`tip`/`keySentence`, equation
 `meaning`/`verbal`/`ref`, concept/fact descriptions). The compiler already
 parses `|` blocks, so this is content-only: text wraps naturally, no quote
 escaping, and LaTeX backslashes become single (no more `\\\\`).
- **M9.2 (optional):** replace the hand-rolled YAML subset parser with one
 build-only devDependency (e.g. the `yaml` package) — pre-approved by original
 plan §7.3 ("one devDependency for parse-only at build time, never shipped to
 client"). Gains: full YAML support, precise error locations, ~120 lines of
 fragile parsing code removed.
- **M9.3 (larger, optional):** migrate the prose-heavy banks
 (`qa/main`, `qa/hard`, `cheat/concepts`, `cheat/facts`) to **one Markdown
 file per item** with front matter (`id`, `category`) and body sections
 (`## Question`, `## Answer`, `## Tip`, `## Key sentence`). Maximum author
 comfort; moderate compiler extension. Tabular data (tables, categories,
 checklists) stays YAML.

**Awaiting user approval.** M9.1 alone is safe and recommended; M9.2/M9.3
optional.

---

## 5. M8 — global brand icon (shipped 2026-09-20)

**Decision (D10):** the installed app icon is a fixed, standard, global logo.

- **Concept:** "shield and voice" — a **gold shield** with a **cream
 microphone** on a **deep-pine background tile**.
- **Fixed palette** `APP_ICON` in `src/lib/brand.mjs`:
 bg `#163f35` (deepest pine of the default palette, fixed), shield `#c9a14b`
 (brand gold), mic `#f4f0e6` (cream paper).
- **Scope:** `public/icon.svg`, `favicon.ico`, `apple-touch-icon.png`,
 `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512.png` — all regenerated
 by `npm run icons` from `APP_ICON`; **no palette input, ever**.
- **In-app only:** the header/footer `BrandMark` tile and the live browser-tab
 favicon follow the active palette (same geometry; gold shield + cream mic stay
 constant).
- `verify` now asserts the fixed palette in `brand.mjs`, the builder, and
 `public/icon.svg`.

---

## 6. Open technical notes (non-blocking)

- If brand geometry changes again: `npm run icons` + bump `?v=` in
 `index.html` + commit regenerated `public/` assets.
- Compiler should strip a leading BOM and normalize newlines (BOM stripping
 already done; newline normalization optional).
- Tailwind v4 `@theme` tokens vs runtime `data-theme`: runtime accents stay
 plain CSS variables on `:root` / `[data-theme]`.
- `M9.1` changes `content/` → `contentHash` changes → commit regenerated
 `src/content.generated.ts` together.

---

## Change log

| Date | Change |
|------|--------|
| 2026-09-19 | Plan v3 drafted (then `docs/PLAN-v3.md`); C1–C14 approved; M1–M6 implemented |
| 2026-09-20 | Renamed to single living `docs/PLAN.md` (D11); M8 global brand icon shipped (D10); M9 content-format proposal added (D12 pending approval) |
