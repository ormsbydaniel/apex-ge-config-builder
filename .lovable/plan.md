# Rewrite Tutorial 7 — Constraints

Rebuild the Constraints tutorial around the Austria Wind Power Density at 100 m
configuration, which exercises all three constraint types (continuous,
combined, categorical). The tutorial builds the layer from scratch, then adds
one constraint per step so each type is explained, configured, and previewed.

## New structure

```
7. Constraints
  Overview            index.md
  7-1. Pre-requisites          01-prerequisites.md
  7-2. Key concepts            02-key-concepts.md
  7-3. Add the wind power layer     03-wind-power-layer.md
  7-4. Categorical constraint (land cover)      04-categorical-constraint.md
  7-5. Continuous constraint (elevation)        05-continuous-constraint.md
  7-6. More continuous constraints              06-more-continuous.md
  7-7. Combined constraint (altitudinal zones)  07-combined-constraint.md
  7-8. Review the full configuration            08-review-and-export.md
```

Files 03 and 04 are rewritten in place with new names; 05–08 are new. `mkdocs.yml`
nav is updated to match.

## Step-by-step content

**Overview (index.md)** — objectives: explain what a constraint does, add
continuous, combined and categorical constraints, understand alignment
requirements, enable the constraint slider control.

**7-1. Pre-requisites** — unchanged apart from a note that this tutorial builds
a standalone layer, so it can be followed on a fresh config.

**7-2. Key concepts** — keep existing content, add:
- Each constraint reads a *separate* COG, masking the primary layer at render
  time.
- Constraint COGs must share CRS, resolution and origin with the primary data.
- `interactive: true` exposes the control in the viewer; `false` fixes the
  filter.
- Band index is auto-assigned per constraint as they are added.
- Controls must be enabled: Layer Card → Controls → **Constraint slider**.

**7-3. Add the wind power layer**
1. New layer card, name `Austria Wind Power Density at 100m`.
2. Add COG data source
   `https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix.tif`.
3. Meta: description, units `w / m 2`, attribution ESA GTIF / https://gtif.esa.int/.
4. Data Visualisation → Colormaps → add `jet`, min 0, max 2000, 50 steps.
5. Layout: interface group *Energy*, sub-group *Austria Green Transition*,
   content location Info panel, legend type swatch.
6. Controls: opacity slider, zoom to centre, **constraint slider** on;
   temporal and blend off.
7. Preview — colour ramp over Austria, no constraint controls yet.

**7-4. Categorical constraint — Land cover**
- Principle: discrete coded values; each value becomes a checkbox. Values must
  match the pixel codes in the constraint COG. Starting here builds on the
  categories work in tutorial 5.
- Steps: Layer card → **Constraints** tab → **Add constraint** → Source type
  *Direct URL* → paste
  `.../constraints/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix-esa_worldcover_2021.tif`
  → Label `Land Cover (from World Cover)` → Interactive on → Type
  **Categorical** → **Populate Categories from COG** → rename the discovered
  values to World Cover class names (10 Tree cover … 100 Moss and lichen),
  cross-referencing the class table from tutorial 5.
- View: tick only *Cropland* and *Grassland* to see wind potential on
  agricultural land.

**7-5. Continuous constraint — Elevation**
- Principle: mask pixels outside a numeric range; the viewer renders a
  two-handled slider rather than checkboxes.
- Steps: **Add constraint** → paste `Copernicus_DSM_COG_10m_3857_fix.tif` URL →
  Label `Elevation` → Interactive on → Type **Continuous** → use **Populate Min
  & Max from COG**, then correct to 0 / 4000 → Units `meters` → Save.
- View: preview, drag the Elevation slider, observe high-altitude pixels drop
  out.

**7-6. More continuous constraints**
Repeat the 7-5 pattern for the remaining continuous layers, presented as a
table (URL, label, min, max, units):
- Slope — 0–65 degrees
- Ruggedness Index — 0–1 index values
- Distance to High Power Line — 0–30000 meters
- Distance to settlement (WSF) — 0–5500 meters
Then a short "combining constraints" note: filters are applied together (AND),
so a site-suitability query is built by narrowing several sliders at once.

**7-7. Combined constraint — Altitudinal zones**
- Principle: a continuous variable grouped into named bands, rendered as
  checkboxes — effectively making categories out of continuous data, which is
  why it follows the categorical and continuous steps. Useful for zones, aspect
  classes, uncertainty bands, return periods.
- Steps: add a second constraint on the *same* DSM COG used in 7-5 → Label
  `Altitudinal zones` → Type **Combined** → Units `meters` → add named ranges
  0–1000, 1001–2000, 2001–3000, 3001–4000 manually, and show **Bulk Add** as
  the fast route (prefix, count, from/to with preview).
- Note: "Populate from COG" is not available for combined constraints.
- View: checkboxes in the viewer; untick zones to remove those altitude bands.

**7-8. Review and export**
- Full reference JSON of the finished layer (the config supplied), for readers
  who want to paste it directly or check their work.
- Reminder about band indices being assigned in order.
- Troubleshooting: nothing renders (CRS/resolution mismatch), no controls in
  viewer (constraint slider off), checkbox does nothing (wrong value codes).
- Final export prompt and closing congratulation (moved from the old 7-4).

## Screenshots

Placeholders referenced with the existing kebab-case convention under
`docs/assets/screenshots/`. New captures needed (via the preview, added in a
follow-up pass if you want them now):
`constraint-form-continuous.png`, `constraint-form-combined-bulk.png`,
`constraint-form-categorical.png`, `constraints-tab-list.png`,
`viewer-constraint-sliders.png`, `viewer-constraint-checkboxes.png`,
`tutorial-07-hero.png` (re-shoot with the wind power layer).

## Technical notes

- Cross-links: 7-2 → `../../constraints/overview.md`; 7-7 → tutorial 5 class
  table and `docs/assets/world-cover-classes.csv`.
- External links open in a new tab, matching the rest of the tutorials.
- `mkdocs build --strict` must pass and the built HTML under `public/guide/`
  is regenerated.
- Old files `03-categorical-constraint.md` and `04-continuous-constraints.md`
  are renamed, so their built HTML is removed and nav entries replaced.
