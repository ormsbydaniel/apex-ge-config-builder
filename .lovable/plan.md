# Contrast stretch: compact row, "Apply to all datasets", fetch once

## What changes for you

1. **Compact stretch row** — the stretch dropdown shrinks to fit its longest option ("Full range"). The per-dataset option sits on the same line, to its right.
2. **Checkbox replaces the button** — "Compute stretch per dataset" becomes an **Apply to all datasets** checkbox (only on multi-dataset layers, when viewing the first dataset).
   - When ticked, picking a stretch method applies it to every dataset, each using its own pixel values. Datasets with their own settings are still skipped.
   - The "n of N datasets" progress shows next to the checkbox while the data loads for the first time.
   - When the layer was already stretched this way, the box opens ticked.
   - Unticking it leaves the existing per-dataset ranges in place. Choosing a method then updates the first dataset and any marked "Same as first", as it does today.
3. **Fetch once, switch instantly** — each histogram (per dataset, per band) is downloaded only once while you use the app. All three stretch results (2–98%, Full range, Mean ± 2σ) are worked out from it and kept. Switching methods, switching datasets, reopening the editor, or re-ticking the box then needs no new download. Only bands or datasets you haven't viewed yet are fetched.

## When data is fetched

- On opening: histograms for the dataset being viewed and its three assigned bands (as now).
- When "Apply to all datasets" is ticked: the same bands are fetched for every other target dataset in the background (3 at a time), with progress. After that, every method change applies to all datasets immediately.
- Changing a band only fetches that new band.
- The cache is kept in memory only and clears when the page is reloaded. It is limited in size so long sessions don't use excessive memory.

## Technical details

- New `src/utils/rgbComposite/histogramCache.ts`: module-level `Map` keyed `url|band|noData`, storing in-flight promises (so duplicate requests merge) plus results with their precomputed `{ 'percent-2-98', 'min-max', 'mean-2sd' }` ranges via `computeStretch`. Small LRU cap (e.g. 200 entries); failed fetches are evicted so they can retry. Exports `getHistogram(url, band0, noData)`, `getStretchMatrix(...)`, and `peekStretch(...)` (synchronous, for instant switching).
- `RgbCompositeEditorDialog.tsx`:
  - The histogram-loading effect reads from the shared cache. Local `histogramCache` state becomes a view over it, so changing scope or reopening reuses the data.
  - `runBatch` becomes `applyToAllDatasets(method)`. When every target is cached it builds styles synchronously with no progress display. Otherwise it fetches only the missing items through `computeBatchStretch` (using the cache-backed fetcher) and then applies. It's triggered by `chooseStretchMethod` when the box is ticked, and by ticking the box. Abort on close is kept.
  - New `applyAll` state, starting as true when the first or "same as first" COGs have `styleSource === 'batch'`.
  - Layout: `flex items-center gap-3`. `SelectTrigger` uses `w-auto` with the content sized to the widest label. Then `Checkbox` + label + inline progress/result text. Keep the description line below.
- `perDataset.ts` `computeBatchStretch` is unchanged (it already takes a fetcher). Batch tagging and the schema stay the same (`styleSource: 'batch'`, `batchStretch.method`), so exported JSON is unchanged.
- Tests: cache merges duplicate requests and evicts failures; stretch matrix matches `computeStretch`; applying to all with a fully cached set makes no new fetches. Then run the focused tests, typecheck, and a Playwright check on East London (multi-COG) and Bristol (single, no checkbox).
