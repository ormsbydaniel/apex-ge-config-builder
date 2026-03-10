

## Problem

The current band label editor renders individual text inputs for every band in a scrollable grid. With 200+ bands (hyperspectral data), this produces an unusable wall of inputs.

## Proposed Approach: Numeric Defaults with Optional Label Overrides

### Default behavior
Use plain band numbers (1, 2, 3, ..., 224) as the X-axis values by default. No inputs rendered — just a summary line like **"224 bands detected — using band numbers as X-axis"**. This is the sensible default for hyperspectral data and requires zero configuration.

### Optional label customization via modal
A **"Customize Band Labels"** button opens a modal dialog with a more capable editor:

- **Table view** with virtual scrolling (only renders visible rows) — columns: Band #, Label, with inline editing
- **Bulk operations toolbar** at the top:
  - **"Set All to Band Numbers"** — resets to 1, 2, 3...
  - **"Set All to Wavelengths"** — prompts for start wavelength and increment (e.g., start: 400nm, step: 2.5nm), then generates "400", "402.5", "405"... This is the most common hyperspectral labeling pattern
  - **"Paste from CSV"** — paste a column of labels from a spreadsheet
- **Search/filter** to quickly find and edit specific bands

### Adaptive inline editor for small band counts
For layers with ≤12 bands (typical multispectral), keep a compact inline grid of inputs as it is now — no modal needed. The modal button only appears for >12 bands.

## Implementation

### Changes to `ChartSourceForm.tsx`
- Replace the current band labels grid with:
  - Summary text showing band count
  - For ≤12 bands: keep existing inline grid
  - For >12 bands: show summary + "Customize Band Labels" button
- Default `bandLabels` to numeric strings (`["1", "2", "3", ...]`) instead of `"Band 1"`, `"Band 2"` etc.

### New component: `BandLabelEditorDialog.tsx`
- Dialog with a virtualized table (simple `div` with `overflow-y-auto` and fixed row heights — no new dependency needed, just render a window of ~30 rows based on scroll position)
- Bulk operations: wavelength generator (start + step inputs), reset to numbers, paste handler
- Search input to filter rows
- Returns updated labels array on save

### No changes needed to schemas or types
The `x: string[]` config already supports any label strings.

