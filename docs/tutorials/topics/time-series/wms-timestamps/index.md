---
title: Timestamps for WMS services
---
# Timestamps for WMS services

!!! info "Topic tutorial: Time series · ~25 min · Prerequisite: [core track](../../../index.md#core-track)"

Configure the temporal control for time-varying services — using the `TIME`
parameter advertised by a WMS / WMTS, and adding manual timestamps where the
service doesn't offer one.

## Key concepts

- Many WMS and WMTS services carry timestamps intrinsically via the `TIME`
  parameter, advertised in the service capabilities document.
- Where a service exposes time, the CB can read the available instants and
  build the temporal control for you.
- Where it doesn't, you can attach timestamps to individual WMS datasets
  manually, exactly as you would for a COG.
- Granularity (hours, days, months, years) and continuity are configured per
  layer.

See [Time series](../../../../layers/time-series.md) for the full reference.

## Steps

1. [Pre-requisites](01-prerequisites.md)
2. [WMS / WMTS time parameters](02-wms-timestamps.md)
3. [Manual timestamps on WMS](03-manual-wms-timestamps.md)
