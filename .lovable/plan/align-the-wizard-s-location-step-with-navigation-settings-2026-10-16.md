# Align the wizard's Location step with Navigation Settings

## Goal
The app wizard's "Where should the app start?" step should look and behave like **Settings → Navigation → Default start location** in the Config Builder, so app builders learn the same controls they will later meet in the full builder.

## What the step will contain (same as Navigation Settings)
1. **Location preset dropdown** – the same list (Custom, Global & Continents, Major countries) built from the shared location list the Settings tab already uses. The wizard's own chip presets (continents, countries, cities) are retired.
2. **Start zoom slider** – the same slider and range, with the same hint labels (Global, Continent, City, Street, Buildings).
3. **"Pick on map" button** – opens the existing map centre picker dialog used by Settings, for any custom spot.
4. A short read-out of the current centre and zoom, as in Settings.

Wizard-specific extras kept, placed to fit the new layout:
- **Fit to data area** (when the data's extent is known) – shown as an extra option next to the dropdown.
- **Outside-data warning** – unchanged text below the controls.
- The data-area outline is shown inside the pick-on-map dialog (optional outline added to that dialog; Settings passes none, so it is unchanged there).

The always-visible small map is removed from the step, matching Settings. The dialog height stays as it is.

## Behaviour
- Choosing a preset sets centre and zoom; moving the slider or picking on the map switches the dropdown to "Custom" — the same rule Settings follows.
- Saved drafts keep working: they hold only centre and zoom, so they show as "Custom" unless they match a preset.

## Technical details
- Extract the preset dropdown + zoom slider + pick-on-map trio from `SettingsTab.tsx` into a shared `StartLocationControls` component (value: center, zoom; onChange). Settings uses it with its dispatches; the wizard uses it with local state. This keeps one source of truth and avoids drift. Settings' visible behaviour must not change.
- `MapCentrePickerDialog` gains an optional `dataBbox` prop to draw the outline.
- Remove `LOCATION_PRESETS` from `templates.ts` (move to `src/utils/deprecated/` per project rule if referenced elsewhere) and delete `LocationPickerMap.tsx` usage (deprecate the file).
- Add an AGENTS.md rule: start-location controls are shared between Settings and the app wizard.
