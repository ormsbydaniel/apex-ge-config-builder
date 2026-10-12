# Exercise-context icon screenshots

## Goal

Replace the current generic icon shots with focused screenshots captured in the exact tutorial context where learners first encounter each action. A screenshot must show enough surrounding interface to confirm the correct group, layer, dataset, or visualisation—not merely the correct icon.

## Capture rules

- Review tutorials strictly in menu order, from Tutorial 1 through Tutorial 11, and pages in exercise order.
- Record every instruction that asks the learner to click an icon, tab, or compact action button.
- Capture an action when it is first introduced, using the configuration state produced by following all preceding tutorial steps.
- Show the named group, layer, dataset, or visualisation in the crop whenever that context distinguishes the action.
- Keep the full relevant row or panel heading visible alongside the icon bank. Do not use an unrelated later tutorial merely because it exposes the same button.
- Use one red arrow and subtle ring around the target. Leave neighbouring controls visible so learners can identify its position.
- Reuse a screenshot later only when the surrounding state and intended target are genuinely equivalent. Otherwise create an exercise-specific shot.
- Use exercise-specific filenames, such as `tutorial-02-add-layer-forest-carbon.png`, rather than generic names such as `button-add-layer.png`.
- Create and present all replacement shots for review before changing any tutorial pages.

## Sequential capture plan

### Tutorial 1 — Familiarisation

- **1-3 Configuration Builder:** Preview control after loading Comprehensive Demo, captured with that loaded configuration visible.
- Keep the existing broader Load and return-to-builder screenshots where they already explain the whole dialogue or workflow; focused shots are only for ambiguous compact controls.

### Tutorial 2 — My first config

- **2-3 Name and interface group:** Application Title pen on the Home tab; rename pen and delete controls on the initial interface-group rows.
- **2-4 Export and reload:** top Export control in the learner's newly named configuration; New Config and Load controls only if their placement is not already clear from the existing page image.
- **2-5 Base maps:** Add Recommended Base Layers inside the Base Layers section.
- **2-6 First layer card:** `+ Add layer` inside the **Forest Carbon** group, then **Add layer card** in its opened choice menu. This becomes the first and authoritative Add layer shot.
- **2-7 COG source:** Add data source on the new layer card, followed by the COG row's information control after the source has been added.
- **2-8 Colormap:** Colormaps edit control from that single-band COG's own Data visualisation section. This becomes the first colormap shot; no multi-band panel is used.
- **2-9 WMS source:** Add another layer in the correct Forest Carbon group, then the WMS-specific source action in that new card.
- **2-10 WMS legend:** information/edit controls on the WMS row, only where the written steps call for them.

### Tutorial 3 — Working with Services

- Capture service-list and add-source actions from the tutorial's own loaded prerequisite configuration, with the named service and destination layer visible.
- Do not reuse Tutorial 2 dataset-row shots when the learner is acting on a service entry.

### Tutorial 4 — Fine tuning my config

- **4-3 Layer controls:** Edit Controls on the layer used by the exercise, with its layer heading visible.
- **4-5 Reordering:** move arrows on the actual layer being reordered, with adjacent layer order visible.
- **4-6 Exclusivity:** exclusivity-set control in the relevant layer context if represented by a compact icon/button.

### Tutorial 5 — Categorical data

- **5-3 COG categories:** Categories edit control from the categorical COG's visualisation panel.
- **5-4 WMS categories:** corresponding action from the WMS layer if its context or controls differ.
- **5-5 JSON editor:** switch-to-JSON control on the exact layer used in the exercise.

### Tutorial 6 — Time Series

- **6-3 Manual timestamps:** timestamp-management action on the exercise's dataset row.
- **6-4 STAC timestamps:** STAC-specific row action only where a compact control is explicitly used.
- **6-5/6-6 WMS/WMTS time:** capture separately where the source type changes the row or dialogue entry point.

### Tutorial 7 — Constraints

- **7-3 Wind layer:** first relevant styling edit on the wind-power layer and the Preview filter control in the resulting layer.
- **7-4 First constraint:** Add constraint source from the correct layer card and tab; this becomes the authoritative constraint shot.
- **7-5 onward:** new shots only for controls not already introduced or where categorical, continuous, and combined constraints have meaningfully different entry points.

### Tutorial 8 — Statistics

- **8-3 Reuse World Cover:** duplicate/copy control on the World Cover layer in this tutorial's prerequisite state.
- **8-4 First statistics source:** Add statistics source from the Statistics tab of the intended layer card.
- **8-5 Remaining levels:** repeat/add control only if it differs from 8-4's context.
- **8-7 Histogram statistics:** `+ Add all` in the histogram/statistics interface once this exercise's surrounding content makes its role clear.

### Tutorial 9 — Multi-spectral data

- **9-1 Prerequisites:** Load → Tutorials with Tutorial 9 prerequisite data visible.
- **9-3 Natural colour:** multi-band visualisation edit control on **Bristol Sentinel 2**, with the multi-band heading and dataset context visible.
- **9-4 Other composites:** duplicate-layer control on the Bristol natural-colour layer if this is the first duplication instruction in the written sequence; otherwise use the earlier authoritative duplicate shot only when its context remains clear.
- **9-5 NDWI:** duplicate the exact source layer named by the exercise; clear the existing multi-band visualisation in that duplicate's panel; then open the index selector. These are separate contextual shots because they communicate a sequence, not interchangeable icons.
- **9-6 Other indices:** reuse 9-5 only for identical steps; capture any index-specific selector state separately.

### Tutorial 10 — Vector data

- Capture its Load → Tutorials shot and vector-style controls only after its prerequisite configuration and exercise content exist.
- Do not substitute raster or multi-band styling screenshots for vector controls.

### Tutorial 11 — Coordinate Reference Systems

- Capture Load → Tutorials in the Tutorial 11 prerequisite context once its config exists.
- Capture CRS add/edit controls from Settings with the CRS section heading and relevant entry visible.
- Capture any layer-level CRS selection separately where the exercise acts on a layer rather than global Settings.

## Review deliverable

- Retire the current 18 generic review images rather than adapting misleading captures.
- Produce a new Files collection ordered by tutorial and exercise number.
- Include a short manifest listing: filename, tutorial step, exact configuration used, target action, and whether the shot is first-use or a justified reuse.
- Stop after the image set and manifest are ready. No Markdown pages, navigation, or published guide will change until the screenshots are approved.

## Technical details

- Follow each tutorial's saved prerequisite/configuration path and prior steps before capture; do not synthesize a convenient later state.
- Capture the relevant element plus controlled surrounding bounds, then annotate consistently.
- Save approved assets to both guide screenshot locations using the existing screenshot script and kebab-case convention.
- Rebuild the guide only in the later insertion phase, after screenshot approval.

## Dependencies

- Tutorial 10 and Tutorial 11 prerequisite configurations are not currently available, so configuration-specific captures for those tutorials remain blocked until those files are added.
- Placeholder exercises without actionable content do not receive speculative screenshots.