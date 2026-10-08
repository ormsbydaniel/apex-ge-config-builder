# Simplify the STAC asset workflow

## Goal

Replace the current collection of text input, plus button, badge, list button, dropdown, format selector, and Detect button with one coherent single-asset control.

## Selected direction

Use the **unified asset selector** from Option 1, with the compact **Manual entry** and **Rescan collection** actions from Option 2.

### Default discovery flow

1. After a STAC URL is entered, show one **Asset** selector.
2. Its main action loads the first item's advertised assets and opens the choices.
3. Choosing an asset places its name directly in the selector; no duplicate badge is shown.
4. Selection immediately runs the existing detection process.
5. Show the detected format as a compact status within the same control, rather than as a separate always-visible row.

### Fallback actions

- **Manual entry** changes the selector into an editable asset-name field with a clear apply action. Applying the name selects that single asset and runs detection.
- **Rescan collection** fetches the first item's assets again and refreshes the choices. It keeps the current selection when still available and does not silently clear it otherwise.
- A small override affordance on the detected-format status reveals the existing manual format selector only when needed.

### States and feedback

- Disable discovery until a STAC URL is present.
- Show concise loading states while listing assets or detecting format.
- Keep existing failure messages and leave the current selection unchanged after a failed rescan.
- If no format is recognised, expose the manual format override directly.
- Preserve automatic detection on save when no explicit format has been established.

## Technical details

- Refactor only the STAC controls in `DataSourceForm`; keep the existing `listStacAssets` and `sampleStacAsset` utilities and single-asset data model.
- Remove the multi-value chip/add interaction from this form and store selection as the existing one-element `assets` array.
- Keep the current request, format detection, band-label extraction, saving, and validation behaviour unchanged.
- Use existing semantic tokens and design-system controls; no new visual palette or unrelated form changes.

## Verification

- Test discovery, selection, automatic detection, manual entry, rescan preservation, empty results, and request failures.
- Verify in the preview that the selected asset appears only once, its format is visible, and both fallback actions remain easy to reach.
