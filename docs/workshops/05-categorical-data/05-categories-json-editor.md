---
title: 5-5. Use the JSON editor
---

# 5-5. Use the JSON editor

So far in this tutorial we have configured categories in three ways:

- **Defined categories one by one** in the Categories editor — for the COG layer
  in [5-3](03-categories-cog.md) and the WMS layer in [5-4](04-categories-wms.md).
- **Populated categories** from a COG's sampled values and embedded colour map,
  then edited the labels — COG layers only ([5-3](03-categories-cog.md)).
- **Imported categories, colours and labels from a CSV file**
  ([5-3](03-categories-cog.md)).

A further, more advanced technique is to edit the layer's JSON directly. This is
useful for bulk edits, or for pasting in a complete category set in one go. The
Configuration Builder provides two JSON editors — one for the whole
configuration (on the JSON config tab) and one scoped to a single layer (a small
orange **{JSON}** icon on the layer card). This tutorial uses the per-layer
editor to replace the categories on the World Cover COG layer.

!!! tip "Export first"

    Hand-editing JSON bypasses the safeguards built into the Categories editor,
    so export your configuration before you start. That way you always have a
    working copy to fall back on.

1. Copy the following JSON to your clipboard:

    ```json
    "categories": [
      { "color": "#006400", "label": "Tree cover", "value": 10 },
      { "color": "#ffbb22", "label": "Shrubland", "value": 20 },
      { "color": "#ffff4c", "label": "Grassland", "value": 30 },
      { "color": "#f096ff", "label": "Cropland", "value": 40 },
      { "color": "#ff0000", "label": "Built-up", "value": 50 },
      { "color": "#b4b4b4", "label": "Bare", "value": 60 },
      { "color": "#f0f0f0", "label": "Snow and ice", "value": 70 },
      { "color": "#0064c8", "label": "Permanent water bodies", "value": 80 },
      { "color": "#0096a0", "label": "Herbaceous wetland", "value": 90 },
      { "color": "#00cf75", "label": "Mangroves", "value": 95 },
      { "color": "#fae6a0", "label": "Moss and lichen", "value": 100 }
    ]
    ```

2. On your *World Cover COG* layer card, open the **{JSON}** editor.
3. Scroll down to the start of the `categories` section.
4. Use the collapse arrow to fold the existing `categories` array down to
   `categories [ ]`, then delete from the opening `[` to the closing `]`.
5. Paste in the JSON you copied. **Apply changes** and preview the layer.

!!! tip "Full-config JSON editor"

    The full-config JSON editor lives on its own **JSON config** tab and is
    useful for larger edits. See [JSON config](../../configuration/json-config.md).
