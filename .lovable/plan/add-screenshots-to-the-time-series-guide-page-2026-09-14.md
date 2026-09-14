# Add screenshots to the Time Series guide page

Illustrate `docs/layers/time-series.md` with pictures from the Configuration Builder, matching the style of the other guide pages (image directly under the step it explains, with descriptive alt text).

## Images to add

1. **Temporal control / timeframe selector** — the Controls section of the layer card with the granularity choices. Placed in "Setting the timeframe", above the granularity table.
2. **Default time period picker** — the same panel with a timeframe chosen and the default period control visible. Placed in "Default time period".
3. **Timestamp management dialog** — the bulk add/remove timestamps dialog. Placed in "Manual timestamps".
4. **STAC browser items with datetimes** — reuse the existing `stac-browser-items.png`. Placed in "STAC item timestamps".
5. **WMS/WMTS time dimension in the metadata dialog** — reuse the existing `wmts-swi-metadata-temporal.png`. Placed in "WMS / WMTS `TIME` parameters".
6. **Explorer temporal control result** — reuse the existing `time-series-abg-preview.png` near the top of the page, so readers see what they are building towards.

Items 1-3 are new captures; items 4-6 reuse screenshots already in the docs.

## How it will be done

- Capture the three new images by driving the running builder with Playwright: open a layer card, open Controls, set the timeframe, then open the timestamp dialog.
- Save them through `scripts/add-screenshot.sh` so both `docs/assets/screenshots/` and `public/guide/assets/screenshots/` stay in sync, using kebab-case names such as `layer-card-temporal-control`, `layer-card-default-time-period`, `layer-card-timestamp-dialog`.
- Reference them with relative paths (`../assets/screenshots/<name>.png`) and write alt text describing what is on screen.
- Rebuild with `mkdocs build --strict` and confirm the page renders with all images.

No application code changes — documentation only.
