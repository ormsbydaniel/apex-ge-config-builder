## Goal

Make the Panel state modal's tab and control options context-sensitive to the selected focus layer, greying out anything that doesn't apply.

## Availability rules

**Focus = None** → every tab option (except "None") and every control row is disabled.

**Focus set to an active layer** → look up the corresponding `DataSource` in `sources`:

| Option | Enabled when |
| --- | --- |
| Tab: Overview | Always |
| Tab: Query | Always |
| Tab: Statistics | `source.statistics?.length > 0` |
| Tab: Charts | `source.charts?.length > 0` |
| Tab: Parameters | Never (disabled for now — reserved for algorithm-result layers) |
| Control: Temporal | `source.timeframe && source.timeframe !== 'None'` OR `meta.controls.temporalControls === true` |
| Control: Opacity (renamed from "Styles") | `meta.controls.opacitySlider === true` |
| Control: Constraint filters | `source.constraints?.length > 0` |

For controls, check both `meta.controls` and `infoPanel.controls` (either enabling it counts) to match how a layer surfaces the control at runtime.

## UI changes in `PanelStateEditor` (`src/components/config/storymaps/actions/ActionEditors.tsx`)

1. Accept a new `sources: DataSource[]` prop; `ActionsAndLayersSection` already has `sources` and passes it to sibling editors — add it to the `<PanelStateEditor>` call too.
2. Derive `focusSource` from `focus` + `sources`. Compute two maps: `tabEnabled: Record<StoryPanelTabId, boolean>` and `controlEnabled: Record<ControlKey, boolean>`.
3. Tab radio grid: pass `disabled` on `<RadioGroupItem>` and apply `opacity-50 cursor-not-allowed` on the wrapping `<label>` when not enabled. The "None" option stays enabled always.
4. Controls list: for each row where `controlEnabled[k] === false`, disable both Expanded and Disabled `<Checkbox>`es and grey the row (`opacity-50`). Rename the visible label of `styles` from "Styles" to "Opacity" (JSON key stays `styles`).
5. Preserve any existing saved values when the focus layer changes — do not silently mutate `controls`/`tabId`. Disabled rows still render their current state so the user can see it; they just can't toggle until they pick a compatible focus. Save logic is unchanged.
6. When `focus === '__none__'`, force everything except the "None" tab option to disabled.

## Out of scope

- No changes to the JSON schema, `StoryPanelState`, or the "styles" key name.
- No auto-clearing of previously saved incompatible values.
- "Parameters" wiring to algorithm-result layers — permanently disabled for this pass.
