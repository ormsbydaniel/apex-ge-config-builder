---
title: 5-2. Key concepts
---
# 5-2. Key concepts

- We often work with **categorical** data such as classifications (e.g. land
  cover).
- The data can arrive in several ways — as a WMS where the server has already
  rendered the classes (like the World Cover WMS in tutorial 2-9), or as a COG
  where the raw pixel values represent the class codes.
- In both cases we can set up **categories** in the CB.
    - For **WMS** layers, categories define the legend shown in the Explorer.
    - For **COGs**, categories define both how the raw pixel values are rendered
      and the legend that is shown.
- The categories comprise of a **colour**, **label** and a **value**
- In this tutorial we will run through a few examples of how to set them up
See [Categories](../../layers/categories.md) for the full reference.
