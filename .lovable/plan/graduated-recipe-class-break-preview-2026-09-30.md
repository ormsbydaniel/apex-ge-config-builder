# Graduated recipe: class-break preview

## Goal
Show the resulting class boundaries live in the Graduated recipe setup, below the Range and Classes controls, so the author can see the break points before clicking "Create rule".

## What you'll see
- A quiet grey line under the Classes row, e.g.:
  `Classes: 0 – 10,000 · 10,000 – 20,000 · 20,000 – 30,000 · … · 60,000 – 70,000`
- It updates instantly as you change the range, class count, or method (Equal interval / Quantile).
- No colours — break points only, as requested.
- If the range is invalid (empty, max ≤ min), the hint shows nothing rather than an error.

## Technical details
- `src/components/vectorStyle/RecipeWizard.tsx` only — no schema changes.
- Reuse the existing helpers from `sampleSourceData.ts`:
  - Equal interval → `equalIntervalBreaks(min, max, classes)`
  - Quantile → `quantileBreaks(fieldSample.numeric.values, classes)`
- Breaks are stop inputs (N values for N classes); render as N−1 adjacent ranges, formatted with `toLocaleString` (max 2 fraction digits), matching the existing "Sample:" hint style.
- Guard: only render when `min`/`max` parse to finite numbers with `max > min` and (for quantile) sampled values exist.
- Unit tests: extend `recipes.test.ts` (or a small new test) to cover the break-list formatting helper if extracted; otherwise verify via existing break helpers' tests.

## Verification
- `bunx vitest run` — all tests pass.
- `bunx tsgo --noEmit -p tsconfig.app.json` — clean.
- You do the visual check in the preview (Graduated on Oslo NO2: 0–70,000 with 8 classes should show 10k intervals).
