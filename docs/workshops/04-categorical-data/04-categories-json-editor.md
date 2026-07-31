---
title: 4-4. Use the JSON editor
---
# 4-4. Use the JSON editor

The CB provides two JSON editors — one for the whole configuration (on the
Home tab) and one scoped to a single layer (a small orange **{JSON}** icon on
the layer card). This exercise uses the per-layer editor to paste in a full
set of World Cover categories.

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
