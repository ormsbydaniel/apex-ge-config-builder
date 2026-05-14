---
title: Vector styling
---

# Vector styling

Style GeoJSON, FlatGeoBuf, and WFS layers using rule-based fills, lines, and labels. The Vector Style editor lives in the **Data Visualisation** section of any vector layer card.

## When to use

- Colour polygons by an attribute (choropleth)
- Size or colour points by a numeric value
- Apply different styles to subsets of features (rule-based)
- Add data-driven labels

If you only want to control which attributes appear in the info panel and how they are formatted, use [Vector fields](vector-fields.md) instead — that is a separate, non-styling editor.

## Editor structure

The vector style editor is split into three property panels:

| Panel | Properties |
|---|---|
| **Fill** | fill colour, opacity, fill pattern |
| **Line** | stroke colour, width, dash pattern, line cap/join |
| **Label** | text source field, font, halo, placement, offset |

Each property accepts one of three value modes:

- **Constant** — a single literal (e.g. `#3b82f6`, `1.5`)
- **Stops** — value-driven mapping: pick a feature property, define stop pairs (input → output)
- **Rules** — filter expressions that scope a constant or stop set to a subset of features

Switch modes via the chip selector at the top of each property row.

## Building a value-driven style

1. Open the layer card → expand **Data Visualisation** → pencil-edit **Vector Style**
2. Pick the **Fill** panel
3. Switch the *Colour* property to **Stops**
4. In the field selector, choose the property to drive colour from (auto-detected from the source's first feature)
5. Define stops — for numeric fields use a ramp (e.g. `0 → #fef0d9`, `100 → #b30000`); for categorical fields use exact-match stops
6. Save

## Rule-based filtering

Rules let you target a subset of features. Each rule is `(filter expression) → constant or stops`.

Filter expressions are simple property comparisons:

- `class == "forest"`
- `population > 50000`
- `year >= 2020 && year <= 2023`

Rules are evaluated top-down — the first matching rule wins. Features that don't match any rule fall through to the panel's default value.

## Markers (points)

Point sources surface a **Marker** sub-panel with shape (circle, square, triangle, icon), radius, and stroke options. All marker properties accept the same Constant / Stops / Rules modes as fills and lines.

## Limitations

- Vector style is stored inline on the data source `meta`. It is not currently shareable between layers — duplicate layers if you need the same style elsewhere.
- Heatmaps and cluster styling are not part of this editor. Configure them upstream in the source if needed.
