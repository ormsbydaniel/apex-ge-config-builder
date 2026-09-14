# Add “More settings” timeout control

Add a new **More settings** section immediately after **URL Parameters** in the Settings tab, backed by the existing top-level `settings.layerFetchTimeoutMs` configuration field.

## Behaviour

- Show a numeric **Layer Fetch Timeout** field in milliseconds.
- Accept positive whole numbers only, matching the existing configuration schema.
- Leave the field empty when the loaded configuration does not define a timeout; do not inject a default into the configuration.
- Populate and refresh the field whenever a configuration containing `settings.layerFetchTimeoutMs` is loaded.
- Save a valid value into `settings.layerFetchTimeoutMs` and mark the configuration as changed.
- Clearing the field removes only `layerFetchTimeoutMs`; preserve any other unknown keys already present in `settings`. Omit the whole `settings` block if it then becomes empty.
- Show clear inline validation for zero, negative, decimal, or otherwise invalid values without writing invalid data into the configuration.

## Technical changes

1. Extend the configuration reducer with a typed settings update action that merges changes into the existing `settings` object, preserving future/unknown settings.
2. Add local input state and a load-sync effect to the Settings tab so imported, example, uploaded, and JSON-edited configurations display their current timeout correctly.
3. Add the new section and accessible numeric input after URL Parameters, using the existing Settings page layout and controls.
4. Keep the existing schema, type, JSON editor, sanitisation, and export paths unchanged because they already support and preserve this field.

## Verification

- Add focused tests covering update, clear, unknown-key preservation, and loaded-value behaviour where practical with the current test setup.
- Run the relevant Vitest tests.
- Verify in the preview that loading a configuration with `5000` displays that value, editing it updates the JSON Config view/export data, and loading a configuration without the setting clears the field.
