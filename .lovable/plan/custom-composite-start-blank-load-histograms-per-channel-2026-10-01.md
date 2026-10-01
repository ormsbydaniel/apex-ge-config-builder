# Custom composite: start blank, load histograms per channel

## Goal
Picking the **Custom** composite resets the editor to a blank slate: all three channel dropdowns are cleared, all histograms disappear, and each histogram loads only when the user assigns a band to that channel.

## Behaviour
1. **Clicking "Custom"** (or opening a layer whose bands don't match any recipe):
   - Channel dropdowns (R, G, B) are cleared to their placeholder ("Choose a band").
   - Min/max values, histogram cache, stretch state and summaries are reset.
   - The right pane shows no histograms — a short hint like "Assign a band to a channel to see its histogram."
2. **Assigning a band to a channel** fetches that band's histogram immediately (existing loader) and shows it in the right pane with the active stretch auto-applied once loaded (existing pending-stretch mechanism).
3. **Channels without a band** render no histogram entry at all.
4. **Save** stays disabled until all three channels have a band.
5. Switching from Custom to a named recipe behaves as today (bands assigned, histograms load, stretch applied).

## Technical details
- `src/components/layers/components/RgbCompositeEditorDialog.tsx`:
  - `selectedBands` becomes `(number | null)[]` so a channel can be unset; `assignBand` fills/clears entries without auto-padding with band 1.
  - `applyRecipe('custom')` sets all channels to `null`, clears `histogramCache`, `histogramLoading`, `histogramError`, resets min/max to defaults, and clears `pendingStretch`.
  - Channel `Select` renders with `value={band ? String(band) : undefined}` so the placeholder shows when unset.
  - Right pane: `channelConfigs` filters out channels with no band; when none are set, show the hint text instead of the stacked list.
  - `currentRecipe`/`matchRecipe` only evaluated when all three bands are set.
  - `handleSave` guard already requires 3 bands — keep, now checking no `null`s.
- Existing per-band histogram fetch effect already keys off `selectedBands`, so unset channels simply never trigger a fetch.
- No changes to `recipes.ts`, schemas, or saved config format.

## Verification
- `bunx vitest run` on styling/RGB tests; `bunx tsgo --noEmit -p tsconfig.app.json`.
- Manual preview check: open RGB editor, click Custom → dropdowns clear, histograms vanish; assign Red → its histogram appears alone; Save disabled until all three set.
