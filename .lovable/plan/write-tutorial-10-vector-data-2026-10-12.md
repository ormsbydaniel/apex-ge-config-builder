# Write Tutorial 10: Vector data

## Goal

Turn Tutorial 10 from its current placeholders into a complete, practical guide using the confirmed **Tutorial 10 prerequisite** configuration. The tutorial will use **Countries** (the layer is not named Counties), **Ukraine Field Boundaries**, **HV Transmission Grid (Europe)** and **Oslo Downscaled Surface NO2**.

## Tutorial structure

### 10-1. Pre-requisites

- Keep the existing links to the core tutorials.
- Give clear instructions to select **Load → Tutorials → Tutorial 10 prerequisite**.
- Explain that the starting file already contains all datasets needed for the exercises.
- Add the standard reminder to export regularly.

### 10-2. Key concepts

- Explain that the Geospatial Explorer mainly focuses on Earth Observation data, while vector data is useful both as contextual information and as an output of EO projects.
- Briefly introduce vector geometries: points, lines and polygons.
- Explain **GeoJSON** as a widely supported, human-readable format suited to modest data volumes.
- Explain **FlatGeoBuf** as a compact, spatially indexed binary format that scales much better for large datasets and supports efficient streaming.
- Link to the existing vector data and vector styling reference pages for further detail.

### 10-3. Simple styling

- Start with **Countries**:
  - Open Vector styling and replace the existing rules with a **Simple uniform** polygon style using an outline and no visible fill.
  - Add a **Feature labels** rule using the confirmed `name` field.
  - Save and open **Preview** to inspect the outlined and labelled countries.
- Continue with **Ukraine Field Boundaries**:
  - Apply a **Simple uniform** polygon style with an outline and **Cross hatch** fill.
  - Save and preview again, navigating to Ukraine and zooming in far enough for the fields to appear.
  - Explain that the underlying dataset has `minZoom: 10`, preventing hundreds of thousands of field polygons from being rendered at scales where they would be illegible and expensive to draw.
- Include focused screenshots of the relevant recipe choices and both Preview results.

### 10-4. Categorised styling

- Create a new page using **HV Transmission Grid (Europe)**.
- Replace its existing vector rules with the **Categorised** recipe.
- Select the numeric `voltage` field, generate colour categories from the detected values, save, and preview the European grid.
- Explain that categorised styling gives each distinct value a colour and is most useful when the set of values is manageable.
- Include a focused recipe screenshot and a Preview result.

### 10-5. Graduated styling

- Create a new page using **Oslo Downscaled Surface NO2**.
- Replace its existing vector rules with the **Graduated** recipe and select the confirmed numeric field `no2_ugm3`.
- Use the detected range and a suitable sequential colour ramp, then save and preview the result over Oslo.
- Explain that graduated styling groups or interpolates numeric values across a colour ramp, making relative NO₂ concentrations easy to compare.
- Mention that this layer contains multiple dated datasets, so its styling applies throughout the time series.
- Include a focused recipe screenshot and a Preview result.

## Tutorial overview

Rewrite the Tutorial 10 home page with concise objectives. By the end, learners will be able to:

- Understand where vector data complements Earth Observation imagery.
- Recognise when GeoJSON or FlatGeoBuf is appropriate.
- Create outlined and labelled polygon styles.
- Use hatch patterns for dense polygon datasets.
- Style discrete values with a categorised recipe.
- Style numeric values with a graduated colour ramp.

Update the step list for the new 10-3, 10-4 and 10-5 pages. Use an appropriate finished Preview screenshot as the tutorial overview image if it reads clearly at page width.

## Screenshots and navigation

- Capture screenshots in the actual Tutorial 10 prerequisite configuration and at the exact point described by each instruction; avoid generic or out-of-context UI shots.
- Use focused crops for controls and wider captures for Preview outcomes. Highlight a control only when the instruction could otherwise be ambiguous.
- Use kebab-case `tutorial-10-*` filenames and `scripts/add-screenshot.sh` so every image is synchronised between `docs/assets/screenshots/` and `public/guide/assets/screenshots/`.
- Size screenshots according to their aspect ratio so portrait and dialog images remain legible.
- Register 10-4 and 10-5 in `mkdocs.yml`; keep the existing Tutorial 10 grouping/title registration in `docs/javascripts/nav-groups.js` in sync.

## Technical checks

- Confirm the instructions against the latest discovered prerequisite file (`tutorial-10-prerequisites_20261012_0756.json`) while authoring, because tutorial discovery may later select a newer timestamped file.
- Check that the exact recipe labels, field selectors and replace-existing-rules flow match the current interface.
- Build the guide in strict mode and resolve broken links or warnings.
- Verify every screenshot reference exists in both required locations and appears in the generated guide.
- Leave detailed visual review of the tutorial flow to the user after the complete draft and screenshots are ready.

Not in scope: changing the prerequisite configuration, application styling behaviour, or publishing the guide.