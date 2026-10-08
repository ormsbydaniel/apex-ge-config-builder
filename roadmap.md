# Tutorial 9

- [x] Add Tutorial 9 overview and placeholder pages; move 4-5 as 9-3.
- [x] Update tutorial navigation and labels.
- [x] Rebuild and verify the guide.
- [x] Draft home page objectives ("Understand" wording) and add hero screenshot.
- [x] Draft 9-2 Key concepts (CRS definition, default EPSG:3857, reprojection, supported list incl. UTM ranges, custom CRS).
- [x] Add a runtime source-to-display CRS diagram to 9-2 and rebuild the guide.
- [x] Draft 9-4 Defining a custom CRS (EPSG:27700 walkthrough) and rebuild the guide.
- [x] Review tutorial Markdown for nested-list and numbered-step indentation; rebuild the guide.
- [x] Correct remaining nested lists in 9-4 and 3-5; audit all tutorials and rebuild the guide.

# Tutorial numbering

- [x] Correct interrupted numbered lists across tutorial Markdown pages.
- [x] Build the guide in strict mode and inspect the corrected rendered lists.

# Per-dataset visualisation settings

- [x] Phase 1: dataset selector with Previous/Next in the multi-band editor; "Same as first" / own settings; Apply, Reset to same as first, Copy to all; layer-card count.
- [x] Phase 2 (composites): compute stretch per dataset (batch) with progress and failure count.
- [ ] Phase 2 (indices): per-dataset index range — needs index-value histograms (not yet built).
- [ ] Shortcut from each dataset row to the editor scoped to that dataset.
- [ ] "Add same COG again" shortcut for same-scene swipe comparisons.
- [ ] Phase 3: same pattern for colormaps/gradient, categories and vector styling.

# Index palettes

- [x] Apply six index-specific absolute colour-stop defaults with Advanced generic overrides and per-COG labelled export.
- [x] Add editable index colour stops, meanings, and named-ramp recolouring under Customise settings.
- [ ] Display exported index stop meanings in the separately hosted Geospatial Explorer viewer bundle (requires viewer-side support).

# Computed composites

- [x] Add a Computed Composites tab and barren-soil RGB recipe matching the supplied openEO graph, using definition presets without per-channel histograms.
- [x] Preserve per-dataset scope, save/reopen and exported rendering; verify formulas and schema persistence with focused tests.

## STAC asset formats
- [x] Phase 1–2: name-keyed `assetFormats` map with detection and manual selection
- [x] Replace the duplicated asset-name controls with one discovery-first selector, manual entry, rescan, and format override
- [ ] Phase 3: gate COG/vector tools on effective format and use in-memory sample URL

## STAC item queries
- [x] Assess queryables-driven support and scope the first release to core URL parameters.
- [x] Add guided bbox, datetime, and limit controls with URL-only persistence.
- [x] Simplify the STAC form with side-by-side asset fields, inline result limit, and badge-based date/bbox dialogs.
- [x] Move query actions before assets, make result limit an add action/badge, and move manual entry beside Asset name.
- [x] Show only the STAC root in the editable URL field and display the complete formulated URL after filter badges.
- [ ] Later: use collection queryables for CQL2 property filters.

## Configuration donor sources
- [x] Align Import Layer Card with Load Configuration by offering test/development and tutorial configs.
- [x] Make the Examples and Tutorials pickers use the full available dialog height.
