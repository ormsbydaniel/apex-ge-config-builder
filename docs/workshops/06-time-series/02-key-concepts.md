---
title: 6-2. Key concepts
---
# 6-2. Key concepts

- The **temporal control** lets users step through data over time.
- Temporal data may have different granularities — hours, days, months, years.
- You configure the granularity per layer.
- Sequences may be **continuous** (no gaps) or **discontinuous** (jumping
  between periods).
- Some services carry timestamps intrinsically — WMS / WMTS `TIME` parameters,
  or STAC item datetimes — but this is not mandatory.
- Where no timestamps are available from the service, the CB lets you attach
  timestamps to individual datasets explicitly, using a specific calendar
  date. The GE stores these internally as Unix timestamps (seconds since
  1970-01-01).

See [Time series](../../layers/time-series.md) for the full reference.
