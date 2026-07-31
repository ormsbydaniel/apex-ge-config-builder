---
title: 5. Time Series
---
# 5. Time Series

Configure the temporal control with manual timestamps, STAC datetimes and
WMS / WMTS time parameters.

## Key concepts

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

## Steps

- [5-1. Pre-requisites](01-prerequisites.md)
- [5-2. Manual timestamps](02-manual-timestamps.md)
- [5-3. Using STAC timestamps](03-stac-timestamps.md)
- [5-4. WMS / WMTS time parameters](04-wms-timestamps.md)
- [5-5. Manual timestamps on WMS](05-manual-wms-timestamps.md)
