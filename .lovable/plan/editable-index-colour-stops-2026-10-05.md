# Editable index colour stops

## Goal
Replace the current generic advanced controls with a stop-based palette editor that matches the established graduated vector styling pattern, while keeping each index recipe’s scientifically meaningful palette as the default.

## User experience
- Keep the default **Index colours** preview and labelled stop summary at the top of the right pane.
- Keep **Index value range** and **Visible range** in their current order.
- Move the expandable section to the bottom and rename it **Customise settings**.
- Inside it, show an interpolation grid modelled on the graduated vector UI. Each row contains:
  - editable index value;
  - editable colour swatch/value;
  - editable legend meaning;
  - remove action.
- Allow adding stops and require at least two strictly increasing values within −1 to 1 before saving.
- Add a named colour-ramp selector and Reverse option. Applying a ramp recolours the existing rows across their current order, preserving stop values and meanings.
- Provide **Restore [INDEX] defaults** for named recipes. Custom indices start from their current generic ramp converted into editable stops.
- Update the gradient preview immediately as stops, colours, or order change.

## Saved behaviour
- Add an explicit custom-palette mode and save the edited ordered `{ value, color, meaning }` list per COG.
- Compile the same saved stops directly into the OpenLayers style and export them for the future Explorer legend, ensuring the rendered colours and legend cannot diverge.
- Keep recipe defaults as recipe palettes; switching to customisation creates an editable copy rather than mutating the shared recipe definition.
- Preserve existing recipe-palette and legacy generic styles when reopening old configurations.
- Keep visible-range masking independent from colour interpolation and preserve existing per-dataset scope behaviour.

## Technical changes
- Extend the spectral-index schema and TypeScript definitions together for custom palette mode and validated labelled stops; confirm the validation path preserves them.
- Add focused palette utilities for cloning defaults, recolouring existing stops from named ramps, validating/sorting edits safely, and building gradients/styles from saved custom stops.
- Add a focused index stop editor component inspired by the existing vector `StopsEditor`, with the additional editable meaning column.
- Update the index editor state, load/save paths, immediate scoped commits, and documentation.
- Keep the existing vector styling editor unchanged.

## Verification
- Test recipe, custom, and legacy palette round trips through schema validation.
- Test named-ramp recolouring preserves values and meanings, including reverse.
- Test custom stops compile into the rendered OpenLayers expression and exported legend data identically.
- Test invalid, duplicate, or unordered values prevent saving with a clear inline message.
- Run focused multi-band tests, TypeScript checks, and the preview build; visually inspect the index editor layout against the supplied graduated-style reference.
