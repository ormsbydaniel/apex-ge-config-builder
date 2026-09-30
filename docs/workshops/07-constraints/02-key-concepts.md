---
title: 7-2. Key concepts
---

# 7-2. Key concepts

- **Constraints** only apply to COG data. They are not applicable to WMS or WMTS services.
- A constraint is a **filter** applied to what data is visible. Pixels that fall outside the
  constraint are masked out at render time.
- You may have encoutered the **Constraint** toggle if you did exercise **4-3** where it was used to filter the layer on its own pixel values.
- Constraints can also come from **secondary layers** — for example land use,
  elevation, or "distance to" derived layers. Each constraint reads a
  _separate_ COG and masks the primary layer where the constraint is not met.
- Secondary constraint layers **must have the same CRS, resolution and origin**
  as the primary data they constrain. This usually requires preparing
  compatible constraint layers in advance. This preparation is outside the scope of this tutorial, but can be readily undertaken using GIS tools like QGIS.
- Multiple constraints are applied **together** — a pixel is only drawn where
  every active constraint is satisfied.
- Constraints can be **interactive** where the user is able to change the constraint criteria, (e.g. elevation between values on a slider) or **static** where by the constraint is defined in the config (e.g. elevation above 1000m).
- Each constraint is assigned a **band index** automatically,in the order the
  constraints appear in the UI.
- Constraint controls only appear in the viewer when the layer card control
  **Constraint slider** is enabled.

## Constraint types

The GE defines three constraint types:

- **Continuous** — a variable (e.g. elevation) covering a full range between
  its min and max. Rendered as a slider when defined as an interactive constraint.
- **Categorical** — data representing specific coded values (e.g.
  `10 = "Trees"`, `20 = "Grassland"`, …). Rendered as checkboxes when defined as an interactive constraint.
- **Combined** — ranges within a continuous variable are grouped into named
  bands ("Low", "Medium", "High", "Very high") and rendered as checkboxes, when defined as an interactive constraint. These are useful for things like altitudinal zones, aspect, uncertainty bands, or
  flood return periods.

See [Constraints](../../constraints/overview.md) for the full reference.
