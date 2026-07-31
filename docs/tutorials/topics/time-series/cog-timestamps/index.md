---
title: Timestamps for COG and STAC
tags:
  - topic
  - time-series
  - cog
  - stac
---
# Timestamps for COG and STAC

!!! info "Topic tutorial: Time series · ~30 min · Prerequisite: [core track](../../../index.md#core-track)"

Configure the temporal control for raster data — attaching manual timestamps to
individual datasets, and pulling datetimes straight from a STAC collection.

## Key concepts

- The **temporal control** lets users step through data over time.
- Temporal data may have different granularities — hours, days, months, years.
  You configure the granularity per layer.
- Sequences may be **continuous** (no gaps) or **discontinuous** (jumping
  between periods).
- STAC item datetimes can be read directly, so a STAC-backed layer often needs
  no manual work at all.
- Where no timestamps are available, the CB lets you attach timestamps to
  individual datasets explicitly, using a specific calendar date. The GE stores
  these internally as Unix timestamps (seconds since 1970-01-01).

See [Time series](../../../../layers/time-series.md) for the full reference.

## Steps

1. [Pre-requisites](01-prerequisites.md)
2. [Manual timestamps](02-manual-timestamps.md)
3. [Using STAC timestamps](03-stac-timestamps.md)
