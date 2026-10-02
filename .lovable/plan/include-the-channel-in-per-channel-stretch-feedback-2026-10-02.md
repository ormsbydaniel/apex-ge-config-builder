# Include the channel in per-channel stretch feedback

## Problem

With "Apply stretch to all datasets" ticked, changing the stretch on a single channel reports e.g. "2–98% applied to 11 datasets", which reads as though all three channels changed. It should say which channel, e.g. "2–98% on red channel applied to 11 datasets".

## Change

In `applyToAllDatasets` (`src/components/layers/components/RgbCompositeEditorDialog.tsx`, result message around line 489–495):

- When `channel` is passed (a per-channel stretch applied to all datasets), prefix the method name with the channel: `2–98% on red channel applied to 11 datasets`.
- Channel names in full: red / green / blue (matching the band labels), not the R/G/B abbreviations.
- When no channel is passed (dropdown stretch applied to all channels), the message stays exactly as it is today.

No state, schema, save, or progress changes — only the result message text.

## Verification

- Focused Vitest run for the stretch/histogram helpers; typecheck.
- Quick Playwright check on the East London layer: apply a stretch to all, then change one channel and confirm the status line names the channel.
