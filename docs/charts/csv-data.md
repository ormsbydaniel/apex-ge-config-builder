---
title: CSV data
status: draft
---
# CSV data

When a chart source is **Direct Connection** or **From Service** and returns CSV, the editor parses the file once and types each column before exposing it to the visual editor.

## Date detection

A column is treated as a date axis (`xaxis.type: date`) when its values parse cleanly as ISO 8601 dates, `YYYY-MM-DD`, or common Plotly-friendly date strings. Mixed numeric/date columns fall back to category.

## Numeric parsing

- Empty cells become `null` (gaps in the trace, not zeros).
- Strings with thousands separators (`1,234.5`) are normalised before parsing.
- Columns where every non-empty cell is a finite number are tagged numeric and shown in the Y picker; mixed columns appear only in the X picker.

## Header handling

The first row is always treated as the header. Header names are used verbatim as trace `name` and axis `title.text` defaults — rename them in the source CSV rather than the editor when you can, so multiple charts stay consistent.

## Related

- [Charts overview](index.md)
- [Visual editor](visual-editor.md)
