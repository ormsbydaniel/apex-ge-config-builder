# Phase 2A: STAC vector styling & field detection

Make STAC datasets whose selected asset is mapped as `geojson` or `flatgeobuf` behave like direct vector datasets throughout vector styling, Manage Fields, statistics sources, and field-value charts — while the saved configuration keeps only the STAC endpoint and `assetFormats` map. Sample asset URLs are resolved in memory only, mirroring the Phase 2B pattern.

## What changes

### 1. Effective-format gating for vector tools
- Add an `isVectorDataSource(item)` helper (next to `getEffectiveFormat` in `src/utils/stacAssetFormat.ts`) that returns true when the *effective* format is a vector format, reusing `isVectorFormat` from `src/utils/fieldDetection.ts`.
- Replace raw `isVectorFormat(item.format)` call sites so mapped STAC vector assets qualify:
  - `LayerDataVisualisationSection.tsx` — vector styling entry, style summaries, "has vector data" checks
  - `LayerCardContent.tsx` — vector source filtering
  - `LayerCardForm.tsx`, `WorkflowCard.tsx` — vector capability detection
  - `VectorStylingDialog.tsx` — vector item selection and style save targeting
- `LayerFormHandler.tsx` — statistics `allowedFormats` and the fieldValues-chart `vectorSources` filter accept STAC sources whose effective format is `geojson`/`flatgeobuf`.
- `ConstraintSourceForm.tsx` — constraint tools gate on effective format where they currently check raw `format`.

### 2. In-memory sample resolution for data inspection
- `src/utils/vectorStyle/pickAttributeSource.ts` — for STAC items, resolve the inspection URL via `resolveDataSourceInspectionAccess` before probing; keep the existing multi-file probing order and FlatGeobuf early-abort streaming. Direct vector sources are unchanged.
- `VectorStylingDialog.tsx` — the wizard's sample-data query (`sampleSourceData`) uses the resolved URL/format for STAC items, resolved once on dialog open with a stale-response guard (same cancelled-ref pattern as the RGB editor).
- Manage Fields / field detection entry points — where `detectFieldsFromSource` is invoked for a data item, resolve STAC items to their in-memory sample URL first.

### 3. Contract guarantees (unchanged)
- No schema or type changes; `assetFormats` map is already in place.
- Resolved/signed asset URLs are never written to saved configuration — saving vector styles still targets the original STAC data item.
- STAC sources without a vector-mapped asset, and direct vector sources, behave exactly as today.

## Tests
- `stacAssetFormat.test.ts` — `isVectorDataSource` for mapped vector STAC, non-vector STAC, unmapped STAC, direct vector.
- `pickAttributeSource` tests — STAC item resolves sample URL before detection; probing order and early abort preserved; failure surfaces as "no attributes" without breaking other files.
- Component tests — vector styling entry appears for a STAC layer with a mapped `flatgeobuf` asset; style save writes onto the STAC item unchanged; statistics/fieldValues source pickers include mapped STAC vector sources.
- Run focused tests + `tsgo` typecheck; visual review left to the user.

## Out of scope (later phases)
- CSV assets, charts/statistics data probing beyond source eligibility, viewer-bundle changes, multi-asset selection UI.
