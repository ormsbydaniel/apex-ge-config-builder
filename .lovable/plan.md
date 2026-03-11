

## Make out-of-range histogram bars visible in grey

Single change in `BandHistogram.tsx` at line 128-129: change the out-of-range `Cell` styling from a faint muted color to a solid grey.

**File: `src/components/layers/components/BandHistogram.tsx`**
- Change `fill` for out-of-range bars from `'hsl(var(--muted))'` to `'#9ca3af'` (Tailwind gray-400)
- Change `fillOpacity` from `0.3` to `0.5` so the grey bars are clearly visible but still visually subordinate to the colored in-range bars

