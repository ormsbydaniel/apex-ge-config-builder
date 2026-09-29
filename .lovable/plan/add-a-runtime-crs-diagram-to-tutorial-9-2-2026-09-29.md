# Add a runtime CRS diagram to Tutorial 9-2

## Documentation

- Add a compact diagram immediately after the explanation of runtime reprojection in **9-2. Key concepts**. Show **Data in source CRS (for example EPSG:4326) → Reproject at runtime → Map in selected display CRS (for example EPSG:3413)**.
- Make clear in the diagram or its caption that the source data stays in its original CRS; the transformation is for map display. Give the diagram descriptive alternative text.
- Keep the existing lesson text and supported-CRS table unchanged.

## Technical details

- Create a self-contained, responsive SVG in the guide’s assets and reference it from the Markdown page. Use simple labels and arrows that remain readable on narrow screens and in light/dark guide themes.
- Regenerate the served guide and verify the strict MkDocs build and diagram asset reference. This does not publish the site.
