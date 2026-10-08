# Automatic STAC asset selection

## Goal
Make asset discovery the default continuation after a user enters a STAC `items` or direct `item` endpoint, and prevent saving a STAC data source without an asset name.

## Changes

1. **Automatically discover assets from item endpoints**
   - When the STAC URL resolves to an `items` endpoint or a direct `item` endpoint, fetch the first applicable item and inspect its assets without requiring the current “Browse assets” action.
   - Trigger discovery once for the committed endpoint, with stale-request protection so a response from an earlier URL cannot overwrite the current form.
   - Do not repeat discovery merely because bbox, date, limit, or unrelated query parameters change.
   - Keep the manual-entry pen as the fallback when discovery is unavailable or the required asset is not advertised.

2. **Handle the discovery result by asset count**
   - **One asset:** immediately set `assets` to that asset name and populate its detected format. Keep the selected name visible in the asset field.
   - **Multiple assets:** populate the dropdown, clear any stale selection, and open/focus it at “Select an asset…” so the user can choose. Each option continues to show `name — format`, while the chosen value displays only the name.
   - **No assets or failed discovery:** leave the field unselected, show the existing actionable error, and allow manual entry.
   - Selecting an advertised asset sets its detected format directly; if the format is unrecognised, require the user to choose the format manually.

3. **Make Asset name mandatory**
   - Mark the label as required and block STAC form submission whenever no non-empty asset name is selected or entered, regardless of browse/manual mode.
   - Continue requiring an asset format for the chosen name so every newly saved STAC source has both `assets[0]` and its `assetFormats` entry.
   - Add conditional schema validation requiring at least one non-empty `assets` entry when `format` is `stac`; `assets` remains optional for all other formats.
   - Keep `assets` optional in the shared TypeScript interface because the requirement is conditional on `format`.

## Technical details

- Reuse `listStacAssets` and the existing detected `StacAssetChoice.format`; do not add another STAC fetch path or persist sample URLs.
- Key automatic discovery by the item endpoint identity rather than its filter query so filter badge edits do not reset the asset choice.
- Keep current name-keyed `assetFormats` persistence and preserve other mapped entries when editing a future multi-asset configuration.
- Add focused tests for one-asset auto-selection, multi-asset choice state, stale response protection, required-name submission, and conditional schema validation.
- Run the focused STAC tests and TypeScript checks; detailed visual verification remains with the user.

## Scope

- No multi-asset selection in the editor.
- No changes to filter controls, URL storage, or Explorer behaviour.
- No changes to non-STAC data-source forms.
