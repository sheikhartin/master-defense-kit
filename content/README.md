# Content pack - authoring guide

All defense texts live under `content/`. The app **never** hardcodes speech, Q&A, or checklists in React components. A build step compiles this tree into `src/content.generated.ts`.

```bash
npm run content # compile only
npm run dev # compiles, then starts Vite
npm run verify # compiles, then runs invariant tests
```

## Layout

```
content/
 meta.yaml kit title, safety buffer, finish-target offsets
 chapters.yaml eight formal chapters + intro group
 deck/ one Markdown file per slide (ordered by filename)
 01-title.md
 …
 20-closing.md
 roadmap/roadmap.yaml
 cheat/
 equations.yaml
 concepts.yaml
 facts.yaml
 tables.yaml
 qa/
 main.yaml
 hard.yaml
 drill.yaml
 categories.yaml
 checklist/
 groups.yaml
 do-dont.yaml
```

## Slide files (required shape)

Each `deck/*.md` starts with YAML front matter, then body sections:

```markdown
---
id: "position-update"
num: 9
title: "…"
chapterId: "ch4"
durationSec: 100
estimatedTime: "1 min 40 sec"
goal: "…"
phrase: "…"
transition: "…"
visual:
 - "…"
tex:
 - tex: "X_i^{t+1}=..."
 caption: "…"
---

## Speech

First paragraph.

Second paragraph.

## Coach notes

- Delivery tip one.
- Delivery tip two.
```

### Timing rules

| Field | Language | Meaning |
|-------|----------|---------|
| `durationSec` | number (seconds) | **Authoritative** duration used by timers and totals |
| `estimatedTime` | **English** string | Human label for authors (e.g. `1 min 40 sec`, `45 seconds`) |

The compiler **sums every** `durationSec` to produce:

- `meta.talkTotalSec` - total speech length 
- `meta.sessionTotalSec` - talk + `safetyBufferSec` 
- `meta.finishFromSec` / `finishToSec` - practice finish window 

For the default BCOA pack this is **1155 s (19:15)** speech + **60 s** buffer.

There is **no optional slide**. Every file in `deck/` is part of the main path.

### Writing rules (enforced by `npm run verify`)

1. **No Persian characters inside LaTeX** (`tex` fields). Put Persian next to formulas. 
2. **No em dash (U+2014) or en dash (U+2013)** anywhere in content. Use «تا» for ranges. 
3. Stable `id` values (kebab-case English) - used for `localStorage` keys. 
4. `num` is renumbered positionally at compile time; keep filenames zero-padded for order.

## Editing workflow

1. Change or add files under `content/`. 
2. Run `npm run content` (or just `npm run dev`). 
3. If validation fails, the compiler prints the file and rule. 
4. Commit both `content/**` and the regenerated `src/content.generated.ts`.

## Adding a new slide

1. Create `content/deck/21-my-topic.md` with front matter + Speech + Coach notes. 
2. Set `durationSec` and English `estimatedTime`. 
3. Point `chapterId` at an existing chapter (or extend `chapters.yaml`). 
4. Compile and open Practice - the new slide appears at the end with a new total time.

## Replacing the whole pack

To use this kit for another thesis:

1. Replace `content/**` with your materials (same schema). 
2. Update `meta.yaml` title and persona. 
3. Run `npm run content && npm run verify`. 
4. Keep the React app untouched.

A future “import zip” feature can drop files into this same shape; do not invent a parallel format.
