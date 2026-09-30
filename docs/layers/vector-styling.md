---
title: Vector styling
status: draft
---
# Vector styling

Style GeoJSON, FlatGeoBuf, and WFS layers using rule-based fills, lines, and labels. The Vector Style editor lives in the **Data Visualisation** section of any vector layer card.

## When to use

- Colour polygons by an attribute (choropleth)
- Size or colour points by a numeric value
- Apply different styles to subsets of features (rule-based)
- Add data-driven labels

If you only want to control which attributes appear in the info panel and how they are formatted, use [Data Values (vector)](data-values-vector.md) instead — that is a separate, non-styling editor.

## Styling recipes

When a layer has no style yet, the styling dialog opens on a set of recipes. Each recipe asks a few questions and then creates the style rules for you:

| Recipe | What it does |
|---|---|
| Categorised | Gives each value of an attribute its own colour, for example land-cover class |
| Graduated | Colours features along a colour ramp using a numeric attribute, with equal-interval or quantile classes |
| Simple uniform | Uses one fill, outline or marker for every feature |
| Feature labels | Shows a text label from an attribute |
| Filter / highlight | Picks out the features that match a condition and can show the rest in grey |

The recipe reads the attributes from the layer's first data file (up to 500 features). It then offers the fields, categories and value ranges it finds. If the file can't be read, you can type the field name and values yourself.

For **Graduated**, the range is rounded out to tidy numbers that still cover the data (for example `2.18 – 61417.36` becomes `0 – 70000`). The exact sample range is shown underneath; click **Use exact** to use it instead. Once clicked it changes to **Round**, which restores the rounded range. Graduated and Categorised recipes also have a **Reverse** checkbox beside the palette to flip its colour order.

If the layer already has rules, select **New from recipe** in the dialog header. You then choose whether the recipe **replaces** the existing rules or is **appended** after them. The generated rules can be edited like any other rule.


!!! info "Geometry vs styles"
    Geometry is what the data holds — points, lines or polygons. Styles are how it is drawn — fill, line, marker and label. Recipes read the geometry from the layer's first data file and preselect **Symbolise as** to match (for example, polygons get a fill and an outline). You can still change it, for instance to draw polygons as markers.

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

## Editing rules

The styling dialog is split into two panes:

- **Rules (left)** — every rule, drawn top to bottom. Each entry shows the rule name, its drawing layers, colour swatches and a one-line filter summary. Drag a rule, or use the up/down arrows, to change its order. The eye icon hides a rule without deleting it.
- **Rule editor (right)** — the selected rule's name, plus **Fill**, **Line**, **Marker**, **Label** and **When** tabs. A dot on a tab means that part is in use.

Every property shows a value mode dropdown (**Constant**, **From field**, **By zoom**, **Expression**), so you can see at a glance how each value is set. Use **+ Add property** to add any property that isn't set yet, including advanced ones such as dash pattern, line cap, label offsets or icon anchor. The **×** beside a property removes it from the saved style.
