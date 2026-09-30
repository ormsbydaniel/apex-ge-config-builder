# Detect geometry from the data and clarify "Symbolise as"

## Goal
Geometry is a property of the data; styles are chosen to suit it. The recipe setup should read the geometry from the file and present the choice as how to draw it, not as something the user must declare.

## Changes
1. **Detect geometry while sampling.** When the recipe screen samples the source (GeoJSON / FlatGeoBuf, same 500-feature cap), also tally the geometry types found (Point/MultiPoint, LineString/MultiLineString, Polygon/MultiPolygon). Result: detected type, or "mixed" with counts, or unknown if sampling failed.
2. **Rename the control** from "Geometry" to **"Symbolise as"**, with options that describe drawing:
    - Polygons — fill + outline
    - Lines — stroke
    - Points — marker
3. **Preselect from the data.** Show a subtle note beneath: "Detected: Polygons (40 features)". If detection fails, keep today's default (polygons) and say "Couldn't detect geometry — choose how to draw it". The user can still override (e.g. markers on polygons).
4. **Mixed data.** Preselect the dominant type and note "Mixed: 30 polygons, 10 points — rule targets polygons". No automatic multi-rule generation in this step.
5. **Labels recipe.** Hide "Symbolise as"; use detected lines to set line label placement automatically, otherwise point placement.
6. **Docs.** Add a short "Geometry vs styles" note to the Styling recipes section of the vector styling guide; strict MkDocs build.

## Out of scope
- Marker placement along lines / at polygon centroids (would need geometry functions in styles) — noted as a future follow-up.
- No change to saved style format or config schema.

## Verification
- Unit tests for geometry tallying (single type, multi-types, mixed, none).
- Run styling tests and full suite; build clean. You do the visual check (Field Boundaries → Polygons, HV Grid → Lines).

## Technical details
- `sampleSourceData.ts`: add `geometry?: { dominant: GeometryTarget | null; counts: Record<GeometryTarget, number> }` to `SourceSample`; map Multi* to base type in both GeoJSON and FlatGeoBuf paths.
- `RecipeWizard.tsx`: relabel select, initialise `geometry` from sample once it arrives (only if user hasn't changed it), show detection note, hide for `labels`.
- `recipes.ts` unchanged (`GeometryTarget` keeps same values).
