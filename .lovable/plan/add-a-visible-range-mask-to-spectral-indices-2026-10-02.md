# Add a "Visible range" mask to spectral indices

## Why
Today the index range (Full range / Positive only / custom) only sets where the colour ramp is stretched — every pixel is still drawn. A second, independent control lets you hide pixels outside a chosen band of values, e.g. NDWI stretched over -1 to 1 but showing only values above 0, so land disappears and only water remains.

## What you will see
- In the indices editor, right-hand panel, a new **Visible range** section directly below **Index value range**.
- A two-handle slider from -1 to 1. Drag either end to hide values outside it. Small Min/Max number boxes beside it for exact values, plus a **Show all** reset link.
- A short hint: "Values outside this range are transparent. Colours still follow the value range above."
- The slider track shows the current colour ramp, with the hidden parts greyed out, so the link between stretch and visibility is obvious.
- Default is the full -1 to 1 (nothing hidden), so existing layers look exactly as they do now.
- Visible range follows the same dataset rules as colour ramp and value range: it applies to the selected dataset, and on the first dataset also to datasets marked "Same as first". "All datasets" style changes carry it across too.
- The layer card summary adds "visible 0 – 1" when a mask is active.

## Not changing
Composites (no mask there), the stretch checkbox, histogram cache, or how existing saved layers render.

## Technical details
- `SpectralIndexConfig` (indices.ts) gains optional `visibleMin` / `visibleMax`. Sync in `src/types/dataSource.ts` and the `spectralIndex` Zod object in `configSchema.ts` (both `.optional()`); confirm `useValidatedConfig.ts` passes them through.
- `buildIndexStyle` adds conditions to the existing `case`, only when a bound is narrower than -1/1:
  `['<', index, visibleMin] -> [0,0,0,0]`, `['>', index, visibleMax] -> [0,0,0,0]`, before the interpolate. Unmasked configs produce the identical style as today.
- Values are omitted from saved JSON when they equal the full range, so unedited layers export unchanged.
- Editor: new `visibleRange` state loaded in `loadFromItem`, included in the index config passed to `applyIndexStyle` / save; editing it sets `rangeDirty`. Use the existing shadcn Slider with two thumbs (step 0.01).
- Tests: `buildIndexStyle` with/without mask (unmasked output unchanged), schema round-trip of the new fields, `applyIndexStyle` carrying the mask to all datasets.
- Docs: add a short "Visible range" paragraph to the multi-band visualisations page.
- Verify with focused Vitest, typecheck, build; quick Playwright check on East London NDWI. Detailed UI testing stays with you.
