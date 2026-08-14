---
title: 7-2. Key concepts
---
# 7-2. Key concepts

- **Constraints** apply to COG data.
- A constraint is a filter applied to the data — pixels that fall outside the
  constraint are masked out at render time.
- We already used the **Constraint** toggle on a layer to let users filter a
  layer by its own pixel values.
- Constraints can also come from **secondary layers** — for example land use,
  elevation, or "distance to" derived layers. Each constraint reads a
  *separate* COG and masks the primary layer where the constraint is not met.
- Secondary constraint layers **must have the same CRS, resolution and origin**
  as the primary data they constrain. This usually requires preparing
  compatible constraint layers in advance.
- Multiple constraints are applied **together** — a pixel is only drawn where
  every active constraint is satisfied.
- `interactive: true` exposes the control in the viewer so the user can change
  the filter; `interactive: false` fixes it.
- Each constraint is assigned a **band index** automatically, in the order the
  constraints are added.
- Constraint controls only appear in the viewer when the layer card control
  **Constraint slider** is enabled.

## Constraint types

The GE defines three constraint types:

- **Continuous** — a variable (e.g. elevation) covering a full range between
  its min and max. Rendered as a slider.
- **Categorical** — data representing specific coded values (e.g.
  `10 = "Trees"`, `20 = "Grassland"`, …). Rendered as checkboxes.
- **Combined** — ranges within a continuous variable are grouped into named
  bands ("Low", "Medium", "High", "Very high") and rendered as checkboxes.
  Useful for things like altitudinal zones, aspect, uncertainty bands, or
  flood return periods.

See [Constraints](../../constraints/overview.md) for the full reference.
