# Refine the "Setting the timeframe" section of `docs/layers/time-series.md`

The user wants the `Setting the timeframe` section expanded to explain two distinct responsibilities of the timeframe setting: how dates are formatted in the Geospatial Explorer UI, and how the temporal control steps through available dates. The rest of the page stays as-is.

## What to change

Rewrite the opening paragraph and add short examples in `docs/layers/time-series.md`, section `## Setting the timeframe`.

### New content

- **Two roles of the timeframe**
  1. **Display format in the Geospatial Explorer** — whether the control shows only a year (e.g. *2026*), a year and month (e.g. *2026-06*), or a full date (e.g. *2026-06-01*).
  2. **Stepping interval** — the unit the control uses when moving forwards or backwards through the data.

- **Service example** — a WMS/WMTS layer whose underlying `TIME` dimension provides daily increments:
  - With the timeframe set to **Days**, the Explorer steps one explicit day at a time and shows the full date.
  - With the timeframe set to **Months**, the Explorer jumps to the nearest date one month offset from the current position and shows only the month in the UI, even though the underlying data changes daily.

- **Manual timestamp example** — when you attach explicit dates such as 1 January 2025 and 1 January 2026 to datasets, setting the timeframe to **Years** makes the Explorer treat those entries as yearly products and display only the year, even though the stored value is a complete date.

Keep the existing granularity table, `timePrecision` note, and continuous/discontinuous sequence note immediately after the new explanation.

## Verification

1. Run `mkdocs build --strict` and fix any failures.
2. Confirm `public/guide/layers/time-series.html` is regenerated with the refined section.

## Scope

Docs-only. No code changes.
