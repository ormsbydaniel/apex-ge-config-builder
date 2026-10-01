# RGB Composite Editor — recipe gallery home page

## Goal

Mirror the vector styling dialog's recipe gallery: when a layer has **no RGB composite applied yet**, the editor opens on a card-based home page instead of dropping straight into the two-pane editor. Each card shows a composite preset with its one-line explainer; only presets the source can actually support are enabled.

## Behaviour

- **No existing composite** (no COG data item with `convertToRGB`) → dialog opens on the gallery view.
- **Existing composite** → dialog opens directly in the two-pane editor, exactly as today (saved bands and ranges shown, stretch marked Custom).
- Gallery cards (grid, matching the vector `RecipeGallery` style):
  - **Natural colour** — "Red, green and blue bands — how the scene looks to the eye."
  - **False colour infrared** — "Near-infrared in red: healthy vegetation shows bright red."
  - **Agriculture** — "SWIR, NIR and blue: separates crops, bare soil and water."
  - **Urban / geology** — "Two SWIR bands and red: highlights built-up areas and rock types."
  - **Custom** (dashed border, like "Start from scratch") — "Pick any three bands by hand."
- Each available card also shows the bands it will use (e.g. `3-2-1`), resolved from band labels or the detected sensor (Sentinel-2 L2A/L1C/ARD, Landsat, RGB+NIR, RGB).
- Cards the source can't support are shown greyed out with a tooltip explaining why (missing bands/labels) — same rule as the current recipe list.
- Picking a card enters the editor with that recipe applied (bands assigned, 2–98% stretch queued as histograms load). Custom enters the editor with the blank-slate behaviour already built.
- In the editor, a **"← Back to composites"** link (top of the left pane) returns to the gallery without saving — visible only when the session started on the gallery, matching the vector dialog's Back to rules / Back to recipes pattern.
- Cancelling from the gallery just closes the dialog; nothing is written until Save in the editor.

## Technical notes

- `RgbCompositeEditorDialog.tsx`: add a `view: 'gallery' | 'editor'` state, initialised on open from whether any COG item has `convertToRGB === true` (same check the init effect already uses). Reset to the correct view each time the dialog opens.
- New small `CompositeGallery` component (colocated in the same folder), reusing the card styling pattern from `src/components/vectorStyle/RecipeGallery.tsx`; recipes and descriptions come from `RGB_RECIPES` / `resolveRecipeBands` in `src/utils/rgbComposite/recipes.ts` — no duplication of recipe data.
- Band count / sensor detection still loads in the background; the gallery shows a loading state until the COG header is read (unavailable cards resolve once known).
- No config schema or saved-format changes; saving is unchanged.
- Tests: extend the rgbComposite recipe tests with gallery-relevant cases (which recipes are available per sensor/band-label set) if not already covered.

## Verification

- `bunx vitest` run and `tsgo` typecheck clean.
- Manual check (user): open RGB editor on a layer with no composite → gallery appears; pick False colour infrared → editor with bands + stretch; reopen a layer that already has a composite → goes straight to the editor.
