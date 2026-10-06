# Rename spectralIndex.legendStops `meaning` → `label`

Align the index colour-stop JSON with the categories shape (`value`, `color`, `label`). Saved configs that still use `meaning` must keep loading; they are normalised to `label` and re-exported with the new key on the next save.

## Changes

**Schema + types**
- `src/schemas/configSchema.ts` — rename `legendStops[].meaning` to `label: z.string().min(1)`. Wrap each stop object in a `z.preprocess` that maps a legacy `meaning` field to `label` (only when `label` is absent), so old configs parse unchanged and validation/superRefine keeps working.
- `src/types/dataSource.ts` — `legendStops?: Array<{ value: number; color: string; label: string }>`.

**Internal model + palettes**
- `src/constants/indexPalettes.json` — rename `meaning` to `label` on every stop (six index palettes).
- `src/utils/rgbComposite/indices.ts` — `IndexLegendStop.meaning` → `label`; update `validateLegendStops` message ("Each stop needs a legend label.") and the `recolourLegendStops` doc comment.
- `src/components/layers/components/IndexStopsEditor.tsx` — column header "Legend meaning" → "Legend label"; read/write `stop.label`; new-stop default `label: 'New stop'`; aria-labels "Stop N legend label".
- `src/components/layers/components/RgbCompositeEditorDialog.tsx` — stop list renders `stop.label`; helper-text wording "legend meanings" → "legend labels".

**Docs**
- `docs/layers/rgb-composite.md` — update the exported-shape reference to `{ value, color, label }` and the "legend meanings" wording; note that older configs with `meaning` are accepted and upgraded on save.

**Tests**
- Update `meaning` → `label` in `src/utils/rgbComposite/__tests__/indices.test.ts`, `styleScope.test.ts`, `src/components/layers/components/__tests__/IndexStopsEditor.test.tsx`, `RgbCompositeEditorDialog.customise.test.tsx`.
- Add a schema-level test in `src/schemas/__tests__/` proving: a config using `meaning` parses successfully with `label` populated; a config using `label` parses as-is; an empty/missing text fails validation.

## Verification
- Focused index/stop/schema tests, typecheck, build.
- Import-path check: confirm `useConfigImport` validation accepts a `meaning`-style config via the preprocess (covered by the schema test).
- No rendering change: `buildIndexStyle` uses only `value`/`color`, so no visual behaviour shifts. The future Explorer legend will read `label`.
