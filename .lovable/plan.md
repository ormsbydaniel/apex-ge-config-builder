## Goal

Restore the conceptual split between Services and Data Sources, and introduce a new "Performance warning" status for diagnostics that aren't broken but aren't optimal.

- **Services page** → keeps GetCapabilities timing/size diagnostics (correct location).
- **Home → Layer QA → Run Data Source Validation** → gains GeoJSON file-size check.
- **New status** "Performance warning" cleanly separates "heavy but works" from "broken".

## Changes

### 1. Strip GeoJSON from the Services page

**`src/hooks/useBulkServiceValidation.ts`**
- Remove the `'geojson'` probe category and the `config.sources` walk.
- Keep `'warning'` status and `warnings` map — still used by GetCapabilities checks.

**`src/components/ServicesManager.tsx`**
- Remove the "GeoJSON Layer Sources" card.
- Remove GeoJSON rows/counts from the summary panel.
- Keep service-level warning badges (slow / large GetCapabilities).

### 2. New "Performance warning" status

**`src/types/validation.ts`**
- Extend `UrlValidationResult.status` with `'performance-warning'`.
- Extend `LayerValidationResult.overallStatus` with `'performance-warning'`.
- Add optional `warning?: string` and `bytes?: number` to `UrlValidationResult`.

**Aggregation in `layerValidation.ts`** — priority highest first:
1. `error` — any URL failed
2. `partial` — some valid, some failed
3. `performance-warning` — all reachable, but at least one URL has a perf warning
4. `valid` — all clean

Performance warnings never mask real failures.

### 3. GeoJSON size check in Layer QA

**`src/utils/layerValidation.ts`**
- For URLs whose layer type is GeoJSON, after the existing HEAD reachability check, evaluate `Content-Length` against a **5 MB** threshold using `probeGeojsonSize`.
- Caller passes `{ largeBytes: 5 * 1024 * 1024 }` so the utility default stays generic.
- Suppress the utility's "Size unknown" warning (only flag known-oversized files). Reachability problems remain `'error'`.
- On oversized: set `status: 'performance-warning'`, populate `warning` and `bytes`.
- FlatGeobuf intentionally excluded (designed for streaming).

### 4. UI

**`src/components/config/CompleteLayersDialog.tsx`**
- New per-layer status pill variant: "Performance" (amber).
- Per-URL row: amber badge with the message (e.g. "Large file: 7.2 MB (threshold 5 MB)").

**`src/components/config/HomeTab.tsx`**

a) **5th QA stat tile "Performance"**
- Icon: `Zap`, amber colour scheme.
- **Disabled state** when `validationResults.size === 0`: greyed out, value `–`, tooltip "Run Data Source Validation to check performance".
- **Active state** when `validationResults.size > 0`: count of layers with `overallStatus === 'performance-warning'`. Clickable → opens `LayerIssuesDialog` filtered to performance-warning layers.
- Grid: extend `grid-cols-2 md:grid-cols-4` → `grid-cols-2 md:grid-cols-5`.

b) **"Last Validation Results" summary** — extend from 3 to 4 buckets:

```text
[N Valid]  [N Perf warning]  [N Partial]  [N Errors]
  green       amber-soft        amber        red
```

**`QAStatCard`**
- Add optional `disabled?: boolean` and `tooltip?: string` props for reuse with future run-gated tiles (e.g. COG performance).

## Files touched

```text
src/hooks/useBulkServiceValidation.ts            — remove geojson category
src/components/ServicesManager.tsx               — remove GeoJSON card + summary rows
src/types/validation.ts                          — add 'performance-warning' + warning/bytes
src/utils/layerValidation.ts                     — call probeGeojsonSize (5 MB) for GeoJSON; aggregate perf-warning
src/components/config/CompleteLayersDialog.tsx   — perf-warning pill + per-url badges
src/components/config/HomeTab.tsx                — 4-bucket summary + 5th Performance tile (disabled until validated)
src/components/config/QAStatCard.tsx             — optional disabled + tooltip props
```

Unchanged: `geojsonProbe.ts`, `serviceCapabilities.ts`, `stacCapabilities.ts`.

## Out of scope / Future

- **TIF / COG performance checks** — deferred. Raw size isn't the right signal for raster (COG-ness, overviews, tiling, interleave matter more). Will slot into the same `'performance-warning'` bucket and the same disabled-until-run tile pattern.

## Risk

Low. Services-side change is mechanical removal. Layer QA addition reuses an existing utility, plugs into existing per-URL result rows, and adds one new enum value with clear aggregation precedence.
