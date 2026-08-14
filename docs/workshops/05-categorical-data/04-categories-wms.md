---
title: 5-4. Categories for a WMS layer
---
# 5-4. Categories for a WMS layer

Set up categories manually for the World Cover WMS you added earlier.

1. On the **Layers** tab, edit the *World Cover* layer card you created in
   [Add a WMS layer directly](../02-getting-started/09-wms-service.md).
2. Scroll down and select **Add categories**. The categories editor opens.
3. Toggle **Use data values** on. An additional column appears for the raw
   pixel values.
4. Add your first category — for example, colour `#006400`, label `Tree cover`,
   value `10`.
5. Add another — colour `#ffff4c`, label `Grassland`, value `30`.
6. Save the layer card and preview. When you fill in the full set of World
   Cover classes, the legend in the Explorer will contain a row per class.

You do not need to fill in every category now — a handful is enough to see how
it works. You'll paste a full set in a later tutorial.

## WorldCover class lookup

| Value | Colour | Colour code | Class name |
| --- | --- | --- | --- |
| 10 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#006400"></span> | `#006400` | Tree cover |
| 20 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#ffbb22"></span> | `#ffbb22` | Shrubland |
| 30 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#ffff4c"></span> | `#ffff4c` | Grassland |
| 40 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#f096ff"></span> | `#f096ff` | Cropland |
| 50 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#fa0000"></span> | `#fa0000` | Built up |
| 60 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#b4b4b4"></span> | `#b4b4b4` | Bare / sparse vegetation |
| 70 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#f0f0f0"></span> | `#f0f0f0` | Snow and ice |
| 80 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#0032c8"></span> | `#0032c8` | Permanent water bodies |
| 90 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#0096a0"></span> | `#0096a0` | Herbaceous wetland |
| 95 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#00cf75"></span> | `#00cf75` | Mangroves |
| 100 | <span style="display:inline-block;width:1.2em;height:1.2em;background:#fae6a0"></span> | `#fae6a0` | Moss and lichen |
| 0 | | | No data |

Source: [ESA WorldCover collection documentation](https://collections.sentinel-hub.com/worldcover/readme.html){target=_blank}

