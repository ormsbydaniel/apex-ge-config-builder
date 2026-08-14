---
title: 8-1. Pre-requisites
---
# 8-1. Pre-requisites

## Tutorial pre-requisites

Completion of all core tutorials or existing familiarity with the configuration
builder:

- [1. Familiarisation](../01-familiarisation/index.md)
- [2. My first config](../02-getting-started/index.md)
- [3. Working with Services](../03-working-with-services/index.md)

Tutorial [5. Categorical data](../05-categorical-data/index.md) is strongly
recommended: the World Cover class list is reused here, and if you already
completed tutorial 5 you can copy those categories straight across.

This tutorial builds a standalone layer, so you can follow it either in the
configuration you have been developing, or in a fresh configuration.

## Data used

- ESA World Cover 2021 served as WMS from the Terrascope MapProxy service.
- NUTS 2024 zonal statistics for World Cover 2021, published as FlatGeoBuf
  files at four levels of administrative detail.

!!! tip "Export often"
    Export your configuration after each step so you can recover if your
    browser tab closes.
