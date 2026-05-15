## Goal

Every multi-page nav section shows a clickable parent label plus a first child labelled **Overview**, both pointing to the same page. Eliminates the current duplicate-name row under Data visualisation and makes the pattern uniform.

## Approach

Keep `navigation.indexes` enabled so parent labels stay clickable. For every multi-page section, ensure the first child entry is **explicitly labelled `Overview:`** (not auto-derived from the file's H1). Material's behaviour:

- When the explicit child has the same target as the section's index page, it renders as a single "Overview" row under the parent (no duplicate of the parent label).
- The parent label remains a link to that same page.

The only section where this currently misbehaves is Data visualisation, because its landing file is `layers/data-visualisation.md` (not an `index.md`). Renaming the child entry to `Overview:` fixes the visible duplicate.

For sections already using `index.md`, an explicit `- Overview: …/index.md` line is added so that **if** Material renders a row, it reads "Overview" — and so the YAML is uniform and self-documenting. Earlier testing suggested duplicates could appear; the implementation step will verify this per section and, where Material refuses to show a separate Overview row alongside the auto-folded index, leave the explicit line in place anyway (it is harmless and keeps the YAML consistent).

## Changes

### 1. `mkdocs.yml` — add explicit `Overview:` labels

For each multi-page section, change the bare `section/index.md` (or landing file) line to:

```yaml
- Overview: section/index.md
```

Sections affected:

- Getting Started → `getting-started/index.md`
- Home tab → `home/index.md`
- Layers tab → `layers/index.md`
- Layers (sub) → `layers/types/index.md`
- Data sources → `data-sources/index.md`
- **Data visualisation → `layers/data-visualisation.md`** (the key fix)
- Charts → `charts/index.md`
- Services tab → `services/index.md`
- Settings tab → `settings/index.md`
- How-to recipes → `recipes/index.md`
- Reference → `reference/index.md`

### 2. Verify rendering

After rebuild, browser-check three representative sections:

- **Data visualisation** — confirm the duplicate "Data visualisation" row is replaced by a single "Overview" row, both parent and child link to the data-visualisation page.
- **Charts** (uses `index.md`) — confirm no broken duplicate, parent still clickable, and verify whether an "Overview" child row appears or is folded.
- **Reference** — same check as Charts.

If `navigation.indexes` folds the explicit Overview entry on `index.md`-based sections (so no child row appears), document that limitation and accept the inconsistency: parent click still opens the overview, which matches the user's stated requirement ("Clicking on either … should present the overview page"). The visible "Overview" row is guaranteed only on the Data visualisation section, which is the one currently broken.

### 3. Rebuild

Run `python3 -m mkdocs build --clean` and confirm `public/guide/` is updated.

## Out of scope

- No changes to page H1s or body content.
- No restructuring of recipes sub-groups.
- No source code changes.
