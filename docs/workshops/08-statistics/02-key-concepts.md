---
title: 8-2. Key concepts
---
# 8-2. Key concepts

- A layer's **data** sources are what the user *sees* on the map. Its
  **statistics** sources are what the user *queries* — they are stored in a
  separate `statistics` array on the layer and are never drawn as a normal
  layer.
- In this tutorial the statistics sources are **vector** files
  (**FlatGeoBuf**, or **GeoJSON**) whose features are administrative
  boundaries. Each feature carries **pre-computed attributes** — in this case
  the area of each World Cover class inside that boundary.
- Because the numbers are computed in advance, the Explorer does not have to
  process any raster on the fly. It simply loads the vector file for the
  current view and reads the attributes of whichever feature the user clicks.
- Statistics render best when the layer also has **categories** defined: the
  class labels and colours from the layer's category list are used to present
  the per-feature breakdown.
- Each statistics source has a **level**. Level `0` is the coarsest set of
  boundaries and higher levels are progressively finer. The Explorer picks the
  level appropriate to the current map zoom, so a user sees countries when
  zoomed out and small regions when zoomed in.

    Here we use **NUTS** (*Nomenclature of territorial units for statistics*),
    the standard European hierarchy:

    | Level | NUTS | Typical unit |
    | --- | --- | --- |
    | 0 | NUTS 0 | Country |
    | 1 | NUTS 1 | Major region |
    | 2 | NUTS 2 | Basic region / province |
    | 3 | NUTS 3 | Small region |

- Levels are assigned **in the order you add the sources**, starting at `0`.
  Add them coarsest first and the numbering takes care of itself.
- In the Explorer the user opens the **Statistics** tab and clicks a feature to
  see the summary for that area.

See [Statistics](../../statistics/overview.md) for the full reference.
