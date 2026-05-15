## Goal

Restructure the Layers tab docs so the three layer types (Standard, Swipe, Base) each have their own page sitting under a new **Layers** subsection. Split the current `adding-layers.md` content into a per-type "Add a … layer" section.

## New nav structure (under "Layers tab")

```text
Layers tab:
  - layers/index.md            (existing Layers tab overview — kept)
  - Interface groups: ...      (unchanged)
  - Layers:
      - layers/types/index.md       (new — intro + the 3 types)
      - Standard layers: layers/standard-layers.md   (new)
      - Swipe layers:    layers/swipe-layers.md      (rewritten)
      - Base layers:     layers/base-layers.md       (rewritten)
  - Data sources: ...          (unchanged)
  - Data visualisation: ...    (unchanged)
  - Statistics, Constraints, Charts (unchanged)
```

`adding-layers.md` is deleted; its content is redistributed.

## File changes

### 1. New `docs/layers/types/index.md` — "Layers"

Section landing page. Explains:

- What a layer is (renderable thing on the map; one or more data sources, an interface group, a styling choice, optional UI controls).
- The three layer types and when to use each:
  - **Standard layer** — the default. One data source (or RGB-composite multi-source / time-series variants). Toggleable, styled, lives in an interface group. The vast majority of layers.
  - **Swipe layer** — compares two raster sources under a draggable handle. Includes the existing Mirror and Spotlight variants under the same comparison family (or noted as related comparison modes).
  - **Base layer** — background basemap. Picked from the basemap selector, no UI controls, no statistics.
- Quick "How to choose" decision list and links onward to each type page.
- Pulls the conceptual material currently in `layers/index.md` "Two kinds of layer" so the overview doesn't duplicate it (the overview will instead link here).

### 2. New `docs/layers/standard-layers.md`

Full page for the most common layer type. Covers:

- What a standard layer is and what it can carry (data + optional statistics, RGB composite, time-series, comparison modes mirror/spotlight if those stay grouped here rather than under Swipe).
- Sources expected per sub-type (table currently in adding-layers Step 2).
- Visualisation choices (link to Data visualisation).
- Legend / attribution / fields / controls (brief, link out).
- **"Add a standard layer"** section at the end — Step 1 (open Add New Layer), Step 2 (Add Layer Card → editor sections), Step 3 (Data Source form: direct URL vs. From Service, Statistics source). Lifted from `adding-layers.md` and trimmed to just the standard-layer flow.
- Includes the existing **Import Layer Card (beta)** subsection (it only applies to standard layer cards).

### 3. Rewrite `docs/layers/swipe-layers.md`

Keep current "What / When to use / Configure / Validation" content. Append:

- **"Add a swipe layer"** section — concrete steps: open Add New Layer → Add Layer Card → set Layer type to **Swipe** → add the **Left** and **Right** data sources (the comparison-position prompt) → set `clippedSourceName` / `baseSourceNames` → save.
- Note about Mirror and Spotlight being related comparison modes (cross-link), if we keep them under Standard rather than promote to siblings.

### 4. Rewrite `docs/layers/base-layers.md`

Keep current What / When to use / Configure / Validation content. Append:

- **"Add a base layer"** section — open Add New Layer (from the top of the Layers tab, *not* from inside an interface group, because the Base Layer tile is replaced by Import Layer Card when launched from a group) → choose **Base Layer** tile → fill name / preview / data source / attribution → save → it appears in the Base Layers section at the top of the Layers tab.

### 5. Update `docs/layers/index.md`

- Remove the "Two kinds of layer" section (now lives in `types/index.md`).
- Replace the "Next steps" list to point at: Layers subsection (`types/index.md`), Standard / Swipe / Base pages, Data visualisation.
- Keep: Layer model table, hierarchy diagram, card actions, empty state.
- Remove the `status: draft` flag (the page is being actively reviewed).

### 6. Delete `docs/layers/adding-layers.md`

Its content has been redistributed across the three type pages. Search the rest of the docs for links to `adding-layers.md` and re-point them:

- `docs/layers/base-layers.md` Related section
- `docs/layers/swipe-layers.md` Related section
- `docs/layers/index.md` Next steps
- Anywhere in `docs/recipes/`, `docs/services/`, etc.

Most should re-target `layers/standard-layers.md` (since "Adding layers" almost always meant a standard layer).

### 7. Update `mkdocs.yml`

Apply the nav structure shown above. The new nested **Layers** group renders as a collapsible subsection inside the Layers tab.

### 8. Rebuild

Run `python3 -m mkdocs build --clean` and verify no broken-link warnings beyond the pre-existing `services/healthcheck.md#performance` one.

## Open question

Where do **Mirror** and **Spotlight** belong? They are currently shown as `Layer type` options alongside Swipe in the editor. Two reasonable options:

- **(A)** Treat them as variants of the Standard layer (covered briefly on the Standard page, since they are still one toggleable card with two sources).
- **(B)** Cover them on the Swipe page as sibling comparison modes (since they share the "two-source on-map comparison" idiom).

I'd suggest **(B)** — group them with Swipe under a single "comparison layers" page, mentioned at the top and configured the same way. Confirm before I start, or I'll proceed with (B) by default.

## Out of scope

- No changes to `data-sources/`, `data-visualisation/`, recipes, or other tabs beyond link re-pointing.
- No code changes.
