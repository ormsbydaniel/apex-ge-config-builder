---
title: Tutorials
---
# Tutorials

Tutorials are hands-on, follow-along sessions for the Geospatial Explorer
Configuration Builder. Each one is a short series of steps that you can work
through at your own pace, on your own machine, in your own time.

They are also the building blocks used in live [workshops](workshops/foss4g-uk-2026.md).

## Two tracks

**Core** tutorials are the assumed baseline. They introduce the Configuration
Builder, the export/reload cycle, layers, data sources and services. Do these
first, in order.

**Topic** tutorials branch out into specific areas of interest. Each one
assumes you have completed the core track, but they are otherwise independent
of one another — take them in any order, or take only the ones you care about.

## Core track

| Tutorial | What you'll learn | Duration |
|---|---|---|
| [Familiarisation](core/familiarisation/index.md) | What the Geospatial Explorer and Configuration Builder are, and how they fit together | ~20 min |
| [My first config](core/first-config/index.md) | Build a config from scratch: branding, base maps, a layer card, a COG source, colormaps and a WMS layer | ~60 min |
| [Working with services](core/working-with-services/index.md) | Register recommended services, browse the PRR, add WMS layers and legends | ~40 min |

## Topic tracks

| Topic | Tutorial | What you'll learn | Duration |
|---|---|---|---|
| Categorical data | [Categories for WMS and COG](topics/categorical-data/wms-and-cog/index.md) | Define categories, edit them in JSON, and copy them between layers | ~35 min |
| Time series | [Timestamps for COG and STAC](topics/time-series/cog-timestamps/index.md) | Attach manual timestamps to datasets and pull datetimes from STAC | ~30 min |
| Time series | [Timestamps for WMS services](topics/time-series/wms-timestamps/index.md) | Use WMS / WMTS `TIME` parameters, and add manual timestamps to a WMS | ~25 min |
| Constraints | [Categorical and continuous constraints](topics/constraints/categorical-and-continuous/index.md) | Filter layers on the map with checkbox and slider constraints | ~30 min |

!!! tip "Export often"
    The Config Builder holds your work in the browser — there is no cloud
    save. Use **Export config** frequently so you don't lose progress if the
    tab closes.

## Navigating a tutorial

Every tutorial has a **home** page describing what it covers, followed by a
**pre-requisites** step listing what to complete first (and, where relevant, a
starting configuration you can load if you would rather dive straight in).
Use the **Previous** and **Next** arrows at the bottom of each page to move
through the steps in order.
