---
title: 3-2. Key concepts
---
# 3-2. Key concepts

!!! info "Services"
  **Services**, in the context of the Geospatial Explorer, are **platforms
  that serve up data** or **catalogues of data**.

## Data services

- In **tutorial 2** we added data from one service: the **World Cover** layer
  from a **Web Map Service (WMS)**. We also added a number of background maps,
  which came from **tile mapping (XYZ) services**.

- Services often declare their **capabilities** — that is, they can be
  **queried to find out what data layers are available**. This is part of the
  **WMS** and **WMTS** standards, and the Config Builder can fetch the capabilities to find out what layers are available in a data service.

## Catalogue services

- Another type of service is a **catalogue service**. Rather than serving map
  images directly, it **describes what data exists and where to find it**.  For example, this might provide some information about where a COG file is and what it contains.

- The standard for Earth Observation data is the **SpatioTemporal Asset
  Catalog (STAC)**.

- ESA's **Project Results Repository (PRR)** is a store of data **produced by
  ESA-funded EO projects**, and it is available as a **STAC catalogue**.

## Why this matters

- You can **add services to a Geospatial Explorer config**, and then
  **search or browse** those services to **discover data** that might be
  useful to add in.
