## Update Layers overview "Layer model" table

Edit `docs/layers/index.md` — replace the current "Layer model" section.

**Changes:**
- Change intro line from *"Each layer in the config has three concerns:"* to *"The definition of a layer comprises:"*
- Remove the table header row (markdown requires a header — use an empty header row that renders cleanly).
- Reorder and expand rows:

| | |
|---|---|
| **Where it lives in the UI** | An *interface group* (and optional *sub-interface group*) that determines where the layer appears in the Explorer's layer panel. |
| **What it shows** | One or more *data sources* — service+layer references or direct URLs to COG, GeoJSON, FlatGeoBuf, CSV, WMS/WMTS layers, etc. |
| **How it is visualised** | Style: colormap, RGB composite band assignments, vector styling rules, categorical classes. |
| **Supporting content** | Description, attribution, legend, units. |
| **Functional controls** | Opacity, temporal controls, zoom to layer, download link, layer toggles. |
| **Advanced features** | Statistics, constraints, charts. |

- Then rebuild the mkdocs site (`python3 -m mkdocs build --clean`) so the `public/guide/` HTML reflects the change.

No other files need changing.
