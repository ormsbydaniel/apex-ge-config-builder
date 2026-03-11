

## Fix: Hardcode band variables to 1, 2, 3 in `buildRgbStyle`

The viewer only loads the bands specified in the `bands` array, so they are always indexed as 1, 2, 3 regardless of the actual band numbers. Currently `buildRgbStyle` incorrectly sets `rBand`, `gBand`, `bBand` to the real band numbers from the selection.

**File: `src/components/layers/components/RgbCompositeEditorDialog.tsx`** (lines 134-136)

Change:
```ts
rBand: bands[0],
gBand: bands[1],
bBand: bands[2],
```
To:
```ts
rBand: 1,
gBand: 2,
bBand: 3,
```

The `bands` parameter can be removed from `buildRgbStyle` since it's no longer used there (the actual band numbers are already stored separately in the `bands` array on the data source item).

