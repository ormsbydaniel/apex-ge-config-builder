

## Changes to `LayerLegendSection.tsx`

Two small updates:

1. **Remove the "Image" status text** (line 25): When legend type is `'image'`, return `null` instead of `'Image'` so the status label isn't shown — the link below already communicates this.

2. **Rename link text** (line 59): Change `"View Legend Image"` to `"Legend Image"`.

### Files modified
- `src/components/layers/components/LayerLegendSection.tsx`
  - Line 25: `return 'Image'` → `return null`
  - Line 59: `View Legend Image` → `Legend Image`

