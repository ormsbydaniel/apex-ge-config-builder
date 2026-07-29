## Rename tab, split "Getting Started" into 5 workshop exercises

Rename the top-level **Workshops** tab to **Workshop Exercises**, and split the current single "Getting Started" workshop into 5 numbered exercises. Each exercise becomes its own folder so the Prev/Next arrows flow correctly within an exercise.

### New structure

```text
docs/workshops/
  index.md                        # updated landing page listing all 5 exercises
  01-getting-started/             # was: getting-started/ (pages 01–09)
    index.md
    01-key-concepts.md … 09-wms-service.md
  02-working-with-services/       # pages 10–13
    index.md
    01-recommended-services.md
    02-data-from-prr.md
    03-more-wms-layers.md
    04-wms-legends.md
  03-categorical-data/            # pages 14–18
    index.md
    01-categories-intro.md
    02-categories-wms.md
    03-categories-cog.md
    04-categories-json-editor.md
    05-copy-categories.md
  04-time-series/                 # pages 19–23
    index.md
    01-time-series-intro.md
    02-manual-timestamps.md
    03-stac-timestamps.md
    04-wms-timestamps.md
    05-manual-wms-timestamps.md
  05-constraints/                 # pages 24–26
    index.md
    01-constraints-intro.md
    02-categorical-constraint.md
    03-continuous-constraints.md
```

### File moves

Use `git mv`-equivalent shell `mv` operations to rename files into their new folders. Files renumber to start at `01-` within each exercise (their in-page H1 titles stay the same; only the file prefixes change).

### Content updates

- **`docs/workshops/index.md`** — replace the single "Getting Started" bullet with a list of all 5 exercises, each with a one-line description.
- **`docs/workshops/01-getting-started/index.md`** — trim the exercise list to items 1–9 only; drop Parts 2–5 from the outline; update the intro to reflect that later exercises live in their own workshop.
- **New `index.md` for each of the other 4 exercises** — short overview: scope, prerequisites (points at the previous exercise), and the ordered exercise list. Style-matched to the existing Getting Started overview.
- No changes to individual exercise page bodies.

### `mkdocs.yml` nav

```yaml
- Workshop Exercises:
    - Overview: workshops/index.md
    - 1. Getting Started:
        - Overview: workshops/01-getting-started/index.md
        - 1. Key concepts: workshops/01-getting-started/01-key-concepts.md
        - … (through 9. Add a WMS layer directly)
    - 2. Working with Services:
        - Overview: workshops/02-working-with-services/index.md
        - 1. Add recommended services: …/01-recommended-services.md
        - 2. Add data from the PRR: …/02-data-from-prr.md
        - 3. Add more WMS layers: …/03-more-wms-layers.md
        - 4. Add legends for a WMS: …/04-wms-legends.md
    - 3. Categorical Data:
        - Overview: workshops/03-categorical-data/index.md
        - 1. Categories — key concepts: …/01-categories-intro.md
        - 2. Categories for a WMS layer: …/02-categories-wms.md
        - 3. Categories for a COG: …/03-categories-cog.md
        - 4. Use the JSON editor: …/04-categories-json-editor.md
        - 5. Copy categories between layers: …/05-copy-categories.md
    - 4. Time Series:
        - Overview: workshops/04-time-series/index.md
        - 1. Time series — key concepts: …/01-time-series-intro.md
        - 2. Manual timestamps: …/02-manual-timestamps.md
        - 3. Using STAC timestamps: …/03-stac-timestamps.md
        - 4. WMS / WMTS time parameters: …/04-wms-timestamps.md
        - 5. Manual timestamps on WMS: …/05-manual-wms-timestamps.md
    - 5. Constraints:
        - Overview: workshops/05-constraints/index.md
        - 1. Constraints — key concepts: …/01-constraints-intro.md
        - 2. Create a categorical constraint: …/02-categorical-constraint.md
        - 3. Add continuous constraints: …/03-continuous-constraints.md
```

### Build

Re-run `mkdocs build --strict` to confirm no broken internal links after the moves. The Prev/Next footer arrows will now walk within each exercise and stop cleanly at the boundary between exercises.

### Notes

- URLs change (files moved to new folders). This is docs-internal; no app code references them.
- Exercise 18 ("Copy categories between layers") is retained as item 5 within **3. Categorical Data**, per your answer.
- No app code changes, no new dependencies.
