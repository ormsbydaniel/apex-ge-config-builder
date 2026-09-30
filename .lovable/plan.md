# Simple uniform line-style controls

## Changes

1. **Add line-only controls to Simple uniform**
   - When **Symbolise as** is **Lines — stroke**, show two compact dropdowns:
     - **Line style:** Solid, Dashed, Dotted, Dash-dot, Long dash.
     - **Line weight:** 1 px, 2 px, 3 px, 4 px, 6 px.
   - Keep the existing colour control.
   - Hide these controls for polygon and point styling.

2. **Generate standard line properties**
   - Save the selected weight as `stroke-width`.
   - Solid lines will omit `stroke-line-dash`.
   - Dashed, dotted, dash-dot, and long-dash choices will add the corresponding `stroke-line-dash` array.
   - Scale dash and gap lengths from the selected weight so presets remain visually balanced at every width.
   - Use a round line cap for dotted lines so short dash segments render as dots; leave the other presets on the standard cap.

3. **Keep generated rules editable**
   - The created rule will open in the existing editor with Width, Dash pattern, and Line cap available as normal properties.
   - No new configuration format or schema field is needed; the recipe continues to produce standard OpenLayers flat-style properties.

## Technical details

- Add a shared line-style preset type and mapping in the recipe utilities rather than embedding raw dash arrays in the dialog.
- Extend the Simple uniform recipe input with optional line style and weight values.
- Pass the two selections from the recipe setup into `buildUniformRecipe`; existing callers retain the current defaults of solid and 2 px.
- Keep line colour independent from line style and weight.

## Verification

- Add unit coverage for all five presets, each weight option, solid-line omission of the dash property, dotted round caps, and serialisation to the flat style array.
- Confirm polygon and point Simple uniform output is unchanged.
- Run the vector styling tests and full unit test suite, then check build diagnostics.
- Leave visual testing and screenshots to you.
