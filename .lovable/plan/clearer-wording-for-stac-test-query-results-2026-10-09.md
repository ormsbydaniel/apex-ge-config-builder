# Clearer wording for STAC test query results

Make the test results in the STAC query editor and the property filter dialog unambiguous: say "property filter" (not just "filter"), treat 0 results as a valid outcome, warn that an empty result means the layer won't display, and explain what the no-filter comparison row means.

## Wording changes

### 1. Say "property filter" everywhere
- Verdict labels: `applied` → "property filter applied", `probably ignored` → "property filter probably ignored", `not supported` → "property filter not supported", `unclear` → "property filter effect unclear".
- Probe row labels: "Items + filter" → "Items + property filter", "Search + filter" → "Search + property filter".
- Summary sentences in `stacFilterComparison.ts`: "The filter works on…" → "The property filter works on…", etc.
- Inline result in the query editor: "· filter applied" → "· property filter applied".

### 2. Baseline row explains itself
- Label: "Items, no filter" → "Items, no property filter".
- Add a caption under the results (editor and dialog): "The 'no property filter' row shows what the query returns with only the area, date range and limit applied — use it as the comparison for the filtered rows."

### 3. Zero results are a valid answer
- Verdict logic already treats filtered=0 with baseline>0 as "applied"; keep that, but make the wording positive rather than alarming:
  - When a filtered probe returns 0 and the verdict is `applied`: show "0 returned — no items match the property filter" in normal (not destructive) colour.
  - Add a warning line whenever the probe for the *currently selected* method returns 0: "This query returns no items, so the layer will not display on the map. Try relaxing the property filter, widening the date range or area, or raising the limit." (amber/warning styling, not error red, since it may be intentional.)
- When the *baseline* returns 0, the verdict stays `unclear`/`unknown`, with summary: "The query returns no items even without the property filter — check the area, date range and limit before judging the filter."

### 4. Summary sentence scenarios (in `stacFilterComparison.ts`)
- applied on current method: "The property filter works on the {items|search} endpoint you are using."
- recommendSearch: "This service ignores property filters on the items endpoint; switch to Search."
- reverse case: "The property filter works on items but not search for this service; consider switching to Items."
- ignored: "The property filter appears to be ignored by this service — the same items come back with and without it."
- unsupported: "The service rejected the property filter."
- unknown: "Could not tell whether the property filter was applied (no difference detectable)."

### 5. Footer note (both places)
- Replace "Some servers only apply property filters on the search endpoint. Test uses the current dates, area, limit and filters (first page only)." with: "The test runs the query exactly as configured — area, date range, limit and property filters — fetching the first page only. Some servers only apply property filters on the search endpoint."

## Files
- `src/utils/stacFilterComparison.ts` — probe labels, note, summary sentences; add a `zeroResults` hint flag on the comparison for the current method.
- `src/components/layers/components/StacQueryEditor.tsx` — VERDICT_TEXT, inline result line, zero-results warning, baseline caption, footer note.
- `src/components/layers/components/PropertyFilterDialog.tsx` — VERDICT_LABEL, table header "Filter" → "Property filter", zero-results warning, baseline caption, footer note.
- `src/utils/__tests__/stacFilterComparison.test.ts` — update/extend tests for new labels, zero-result summaries, and the zeroResults flag.

## Verification
- Run the STAC filter comparison tests, typecheck, and confirm a clean build.
