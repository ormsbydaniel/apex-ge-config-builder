---
title: 6. Constraints
---
# 6. Constraints

Create categorical and continuous constraints to filter layers on the map.

## Key concepts

- **Constraints** apply to COG data.
- A constraint is a filter applied to the data — pixels that fall outside the
  constraint are masked out at render time.
- We already used the **Constraint** toggle on a layer to let users filter a
  layer by its own pixel values.
- Constraints can also come from **secondary layers** — for example land use,
  elevation, or "distance to" derived layers.
- Secondary constraint layers **must have the same CRS, resolution and origin**
  as the primary data they constrain. This usually requires preparing
  compatible constraint layers in advance.

### Constraint types

The GE defines three constraint types:

- **Continuous** — a variable (e.g. elevation) covering a full range between
  its min and max. Rendered as a slider.
- **Categorical** — data representing specific coded values (e.g.
  `10 = "Trees"`, `20 = "Grassland"`, …). Rendered as checkboxes.
- **Combined** — ranges within a continuous variable are grouped into named
  bands ("Low", "Medium", "High", "Very high") and rendered as checkboxes.
  Useful for things like altitudinal zones, aspect, uncertainty bands, or
  flood return periods.

See [Constraints](../../../../constraints/overview.md) for the full reference.

## Steps

1. [Pre-requisites](01-prerequisites.md)
2. [Create a categorical constraint](02-categorical-constraint.md)
3. [Add continuous constraints](03-continuous-constraints.md)
