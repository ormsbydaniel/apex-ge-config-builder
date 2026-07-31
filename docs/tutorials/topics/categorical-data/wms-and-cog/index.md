---
title: 4. Categorical Data
---
# 4. Categorical Data

Configure categories for WMS and COG layers, use the JSON editor for bulk
edits and copy categories between layers.

## Key concepts

- We often work with **categorical** data such as classifications (e.g. land
  cover).
- The data can arrive in several ways — as a WMS where the server has already
  rendered the classes (like the World Cover WMS from Part 2), or as a COG
  where the raw pixel values represent the class codes.
- In both cases we can set up **categories** in the CB.
  - For **WMS** layers, categories define the legend shown in the Explorer.
  - For **COGs**, categories define both how the raw pixel values are rendered
    and the legend that is shown.

See [Categories](../../../../layers/categories.md) for the full reference.

## Steps

1. [Pre-requisites](01-prerequisites.md)
2. [Categories for a WMS layer](02-categories-wms.md)
3. [Categories for a COG](03-categories-cog.md)
4. [Use the JSON editor](04-categories-json-editor.md)
5. [Copy categories between layers](05-copy-categories.md)
