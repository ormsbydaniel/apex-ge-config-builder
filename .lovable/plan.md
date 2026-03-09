

## Inline Reorder Arrows on Each Selected Band

### Change

In `BandSelectorDialog.tsx`, move the up/down arrows from the separate column into each selected band row. Remove the `highlightedBand` state and the standalone reorder button column entirely.

**Each selected band row** will render:
```
☑ 1. Band 3 (Red)  [▲] [▼]
```

- Up/down buttons inline, right-aligned via `ml-auto`
- Each button directly calls a `moveBandUp(idx)` / `moveBandDown(idx)` with the row's index
- First item disables ▲, last item disables ▼
- Remove `highlightedBand` state and click-to-highlight logic
- Remove the separate reorder buttons column (lines 167-189)

### File: `src/components/layers/components/BandSelectorDialog.tsx`

- Remove `highlightedBand` state
- Replace `moveUp`/`moveDown` with `moveBandUp(idx: number)` and `moveBandDown(idx: number)` that swap by index
- In the selected bands `.map()`, add inline `ChevronUp`/`ChevronDown` buttons after the band label
- Remove the standalone reorder buttons `div` (the third column)
- Remove highlight styling from selected band rows

