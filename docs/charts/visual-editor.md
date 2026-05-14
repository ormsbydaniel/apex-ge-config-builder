---
title: Visual editor
---

# Visual editor

The chart **Visual editor** wraps Plotly's trace and layout schema in a focused UI. You pick a data source, then add traces by selecting an X column and one or more Y columns, then style each trace.

## Quick add

The Quick Add panel lists every column found in the source CSV (or every band of a multi-band COG, for [Pixel values](pixel-values.md)). Click an X column once and Y columns repeatedly — each click on a Y column adds a new trace using the current X.

## Trace styling

Each trace exposes:

- **Type** — `scatter` (line / markers / lines+markers), `bar`, or `pie`.
- **Fill** — `none`, `tozeroy`, `tonexty` for area charts.
- **Line** — colour, width, dash, shape (linear / spline / step).
- **Marker** — size, colour, symbol.
- **Bar** — orientation (`v`/`h`) and width when `type: bar`.

Traces are stored in `charts[].traces[]` and serialised straight into the Plotly `data` array at runtime.

## Layout

The layout panel covers `xaxis`, `yaxis`, `legend`, and `barmode`. Axis titles use Plotly v2's nested shape (`{ text, font }`) rather than the legacy string form.

## Related

- [Charts overview](index.md)
- [CSV data](csv-data.md) — how columns are typed before they reach Quick Add.
