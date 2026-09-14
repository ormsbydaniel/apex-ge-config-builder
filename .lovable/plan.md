# Fill in the "Layers → Time Series" user guide page

`docs/layers/time-series.md` currently contains only "*Coming soon.*" — it is the one empty page in the Layers section and is linked from Workshop 6. Write the full reference page in the same house style as the other layer pages (e.g. `standard-layers.md`: front matter, short definition, tables, admonitions, "Related" links), then rebuild the guide.

## Content outline for `docs/layers/time-series.md`

1. **What a time series layer is** — a layer whose data changes over time, displayed through a temporal control that steps through different time periods (a day, a month, a year, etc.). Time series layers can be set up in three ways:
   - **Individual timestamped datasets** — COGs, GeoJSON, FlatGeoBuf, CSV, etc. where each dataset is given a manual timestamp in the config.
   - **STAC collections** — a collection whose items already carry timestamps (for example COG assets). The builder can either copy each item's datetime into the layer's datasets, or, from Geospatial Explorer v4.2 onwards, keep the STAC collection as a single data source so the Explorer dynamically builds the timestamp set on load. The dynamic approach is best for collections that are continuously updated, because newly added items appear automatically without changing the config.
   - **Services with a time parameter** — WMS or WMTS layers that advertise a `TIME` dimension, either as explicit dates or as a start/end/interval.
2. **Setting the timeframe (granularity)** — Layer Card → **Controls → Temporal control**, with options **None / Time / Days / Months / Years** (from `TimeframeType` in `src/types/dataSource.ts`). Table of when to use each granularity, plus the sub-day `timePrecision` option (Hours / Minutes) for finer granularity. Explain continuous vs discontinuous sequences (concepts already covered in workshop 6-2).
3. **Default time period** — the date picker that appears once a timeframe is set; sets the period new datasets inherit and the Explorer's initial step. Values are stored internally as Unix timestamps.
4. **Configuring each setup** — expand the three approaches from the introduction, mirroring the workshop:
   - **Manual** — per-dataset timestamp field (full date required; display follows the granularity). Timestamps can also be managed in bulk via the timestamp management dialog.
   - **STAC (copied item timestamps)** — item datetimes are copied automatically when assets are added from the STAC browser; note the temporal control must be configured on the layer *before* adding datasets or the timestamps are not picked up.
   - **STAC (dynamic collection data source)** — add the STAC collection itself as a single data source, so the Geospatial Explorer (v4.2+) resolves the available timestamps at load time. This avoids re-exporting the config when new items are published.
   - **WMS / WMTS `TIME` parameter** — the **Use TIME parameter** toggle; the builder probes GetCapabilities and auto-detects/advertises the time dimension (extent + granularity shown in the dataset metadata dialog). Link to the WMS/WMTS data-source page.
   - **Increment steps** — stepping forward N units at a time (e.g. 30 for monthly jumps over daily data).
5. **JSON reference** — the persisted fields: layer-level `timeframe` / `defaultTimestamp`, dataset-level `timestamps[]` (Unix seconds) and `useTimeParameter`, and the optional `timePrecision`. Small example JSON snippet.
6. **Troubleshooting** — short list: timestamps missing (timeframe set to None or set after adding datasets), control not appearing, granularity mismatch between datasets and control.
7. **Related** — links to [Standard layers](standard-layers.md), [WMS/WMTS/WFS data sources](../data-sources/wms-wmts-wfs.md), and Workshop 6 (Time Series).

## Steps

1. Write `docs/layers/time-series.md` following the outline above, reusing wording already established in `docs/workshops/06-time-series/` so terms stay consistent. No new screenshots are required for this page.
2. Run `mkdocs build --strict` and fix any failures; confirm `public/guide/layers/time-series.html` is generated with the new content.

## Technical details

- No code changes — docs-only. The nav entry for `layers/time-series.md` already exists in `mkdocs.yml`, so no nav edit is expected.
- Field names verified against the codebase: `timeframe` (`None | Time | Days | Months | Years`), `defaultTimestamp`, dataset `timestamps: number[]` and `useTimeParameter` in `src/types/dataSource.ts`; UI confirmed in `TemporalConfigSection.tsx` and `TimestampManagementDialog.tsx`.
