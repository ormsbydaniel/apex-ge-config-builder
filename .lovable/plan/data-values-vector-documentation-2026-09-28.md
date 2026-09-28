# Data Values (vector) documentation

## Goal

Add a new guide page **Data Values (vector)** under the Layers section of the
MkDocs guide (deployed to `…/guide/layers/data-values-vector.html`). It
explains, reader-first, how the Geospatial Explorer's Data Values panel can
turn raw feature properties into a polished, readable readout.

## Content of the new page (`docs/layers/data-values-vector.md`)

House style: front matter (`title: Data Values (vector)`, `status: draft`),
H1 title, Material admonitions, tables, Related links at the end.

1. **Why customise data values** — when a user clicks a feature in the
   Explorer, the Data Values panel lists that feature's properties. Left
   alone it shows raw names and values (`no2_ugm3: 17.382913`, internal IDs,
   unformatted dates). Because the Explorer can't know what the data means,
   the config author customises the display.
2. **What you can change** — table of the field options and their effect:
   display label ("prettier version" of the name), prefix/suffix (units,
   `≈`, `%`, `°C`), precision (decimal places), type `date`/`datetime` with a
   format string, display order, and hiding fields entirely (internal IDs,
   geometry fields). Hidden fields stay in the config as `null`.
3. **Before / After** — the two placeholder images, with a note that they
   show the same feature queried in the Explorer:
   - Before: raw property names and full-precision values.
   - After: friendly labels, units, rounded values, dates formatted,
     internal fields gone.
4. **How it's done in the Configuration Builder** — the Manage Fields editor
   on a vector layer (GeoJSON, FlatGeoBuf, WFS):
   - One table row per field: Field name, Display label, Prefix, Suffix,
     Precision, Type, Hide toggle; drag handle and up/down chevrons set the
     display order; hidden rows grey out inline.
   - **Populate field details** pulls field names and types from the source
     file (a searchable picker appears when a layer has several vector
     files); **Copy from layer** reuses another layer's field settings.
   - Where the settings live in the JSON: the data source's
     `meta.fields` record, with a short example snippet (label, prefix,
     suffix, precision, type/format, `null` to hide).
5. **Related links** — Vector fields (full editor reference), Vector
   styling, Standard layers.

## Images

Two labelled placeholder images (no real Explorer screenshots exist yet):

- `data-values-before-raw.png` — "Before: raw data"
- `data-values-after-customised.png` — "After: customised field display"

Generated with the image generator as simple annotated placeholder frames,
then copied into **both** `docs/assets/screenshots/` and
`public/guide/assets/screenshots/` using
`./scripts/add-screenshot.sh data-values-before-raw` (and `-after-…`), per
the screenshot conventions memory. The page text flags them as placeholders
to be swapped for real Explorer screenshots later.

## Navigation and cross-links

- `mkdocs.yml`: add `Data Values (vector): layers/data-values-vector.md`
  under the Layers section, after **Vector styling** (before **Vector
  fields**).
- `docs/layers/vector-fields.md`: add a one-line pointer to the new page at
  the top so readers find the concept page; no other changes to it.
- `docs/layers/data-visualisation.md` is untouched (data values is a query
  panel, not a map-styling tool).

## Verification

- `mkdocs build --strict` with the pinned toolchain
  (`mkdocs-material==9.5.44`, `pymdown-extensions==10.11.2`,
  `PYTHONPATH=/tmp/mkdocs-toolchain`).
- Confirm `public/guide/layers/data-values-vector.html` exists and shows the
  admonitions, tables, and both images (not raw `!!!` text).

## Out of scope

- No app code changes; the page documents existing behaviour.
- Real Explorer screenshots (need a deployed Explorer session — placeholders
  stand in for now).
