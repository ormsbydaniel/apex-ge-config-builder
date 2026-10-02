# Multi-band visualisations: separate composites and indices in one dialog

## Goal
Make it easier to choose a visualisation without splitting the workflow into separate dialogs. The home screen has two tabs, **Composites** and **Indices**, each with only its own recipe cards. Choosing a card opens the corresponding detailed editor.

## Experience
- Rename the dialog **Multi-band visualisations** and the layer-card entry **Multi-band visualisations**; keep the existing single edit/delete entry for both kinds of styling.
- When no styling is saved, open the home screen with **Composites** selected. Switching tabs swaps the visible recipe cards; descriptions, availability, band labels, and index colour previews remain as they are.
- Choosing a composite opens the three-channel editor; choosing an index opens the two-band/colour-ramp editor. In either editor, the left-hand recipe list shows **only recipes of that kind** rather than both groups at once. A **Back to visualisations** link returns to the home screen on the matching tab without saving; the other tab can then be chosen.
- When styling already exists, open directly in its corresponding editor, as requested. Its Back link also reaches the matching home tab. Reopening the dialog resets to the saved kind rather than remembering an unsaved tab or recipe choice.
- Keep Save available only in an editor with valid selections. Cancel/back do not write anything; choosing a different kind only replaces the saved style on Save.

## Technical approach
- Keep the current dialog and its RGB/index editing and saving logic. Add a separate home-tab state, initialised on open alongside the existing editor mode. Scope the recipe list to the current editor mode, and route the Back action through the home-tab state.
- Update `CompositeGallery` to render cards for the selected tab rather than both sections; use the existing tabs component and Button patterns. Preserve recipe definitions and sensor/band-availability logic.
- No changes to index expressions, COG band loading, schema, or Explorer bundle. The reported Explorer rendering issue remains a separate investigation.

## Verification
- Run basic checks of both tabs, recipe selection, Back, and reopening an existing style in its editor; check the preview build signal.
- Leave detailed visual and end-to-end checks to the user's desktop UI testing; no narrow-viewport review is required.
