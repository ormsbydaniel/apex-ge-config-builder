# Consolidate contrast-stretch feedback

- Rename the multi-dataset checkbox to **Apply stretch to all datasets**, making clear that it changes stretch rather than the composite or index recipe.
- Keep progress beside that checkbox and its stretch selector, but label the spinner **Calculating histograms — X of N datasets** while uncached imagery is being processed.
- Replace the separate stretch-result line below the description with a compact status in that same control area: a tick and, for example, **Mean ± 2σ applied to 11 datasets**. Show it after both cached and newly calculated applications; report partial failures there instead of claiming all datasets succeeded. Clear stale status when the selection changes, an operation is cancelled, or a new calculation begins.
- Preserve the existing per-dataset stretch behavior and histogram cache. Run focused tests for feedback states and the existing stretch flow; leave detailed UI testing to you.

## Technical notes

Update the multi-band editor's RGB contrast-stretch controls and its batch-progress/result state. Reuse the stretch method display names and existing success/failure counts. No configuration schema or export changes.
