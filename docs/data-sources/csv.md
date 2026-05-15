---
title: CSV
status: draft
---
# CSV

Plain comma-separated values. The builder treats CSV as a tabular data
source — most commonly used to drive [Charts](../charts/csv-data.md)
rather than render features on the map.

## When to use

- Time-series tables (date column + one or more value columns) plotted as
  line, area, or bar charts.
- Tabular ancillary data linked to a vector layer through a join key.
- Any one-off dataset where you want to skip GIS conversion.

## Add a CSV source

Layer Card → **Datasets → Add Dataset** → **Direct Connection** → **Data
Format** = **CSV (Comma Separated Values)**.

| Field | Notes |
|-------|-------|
| Data Source URL | HTTPS URL ending in `.csv`. The first row must be the header. |
| Z-Index | Default 50. Not used for chart-only CSVs. |

The builder fetches the file when it's referenced by a chart and parses
columns:

- A column whose name or values look like ISO dates is detected as the
  date axis.
- Numeric columns become available as Y-series.
- Other columns are exposed as labels for tooltips and filters.

See [Chart CSV processing](../charts/csv-data.md) for the detection
rules.

## Validation

- The healthcheck does a HEAD request only — it does not parse the file.
- Bad delimiters or non-UTF-8 encodings are surfaced when a chart that
  uses the CSV is opened in the visual editor.

## Tips

- Stick to UTF-8 with `\n` line endings. Excel-exported CSVs sometimes
  use Windows-1252; re-save as UTF-8 if columns appear garbled.
- Quote any value containing a comma; the parser doesn't try to recover
  from broken quoting.
- For very large CSVs (≳ 10&nbsp;MB), pre-aggregate upstream — the
  deployed Explorer loads the whole file into memory.
