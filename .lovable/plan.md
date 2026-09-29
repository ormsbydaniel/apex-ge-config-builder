# Draft 9-2. Key concepts — Tutorial 9 (Coordinate reference systems)

Fill in `docs/workshops/09-coordinate-reference-systems/02-key-concepts.md` with the content below, replacing the placeholder text. Bullet list in the house style of 8-2, ending with a pointer to the full reference. No other files change; rebuild the guide afterwards.

The supported-CRS list is taken from `src/constants/projections.ts` (the built-in options in the config builder) — flagged below for the user's verification before it ships, as requested.

## Drafted content

```markdown
---
title: 9-2. Key concepts
---
# 9-2. Key concepts

- A **CRS** (Coordinate Reference System) is essentially a **map projection** —
  the mathematical recipe for flattening the curved surface of the Earth onto a
  flat map. Because there is no single "right" way to do this, many different
  CRS exist, each suited to different regions, scales and purposes.
- By default the Geospatial Explorer displays maps in **EPSG:3857**, also known
  as **Web Mercator**. This is the most common CRS for web mapping services
  worldwide — it is what tile services like OpenStreetMap and most commercial
  basemaps use — which is why it is the Explorer's default.
- The Explorer can **reproject data between supported projections**. If a
  dataset is stored in a different CRS, it is transformed at runtime so that it
  lines up correctly with everything else on the map.
- This means you are not limited to data stored in Web Mercator: you can use
  datasets kept in another projection, **and/or change the CRS used for
  display** — for example a polar stereographic view when working with Arctic
  data (see [9-3](03-using-an-alternative-projection.md)).
- A number of standard CRS are **included with the Explorer**:

    | Code | Name |
    | --- | --- |
    | EPSG:3857 | WGS 84 / Pseudo-Mercator (default) |
    | EPSG:4326 | WGS 84 |
    | EPSG:3035 | ETRS89-extended / LAEA Europe |
    | EPSG:3413 | WGS 84 / NSIDC Sea Ice Polar Stereographic North |
    | EPSG:3031 | WGS 84 / Antarctic Polar Stereographic |

    <!-- PLACEHOLDER — verify this list before publishing; it reflects the
         built-in options in the config builder at the time of writing. -->

- If the CRS you need is not in that list, **additional CRS can be defined in
  the Configuration Builder** (Settings → Custom CRS) by supplying a **proj4
  string** — the standard one-line definition of a projection. A custom CRS can
  be used in two ways: to **support datasets stored in that projection**, or as
  the **default CRS** for the whole map.

See [Projections and CRS](../../configuration/projections.md) for the full reference.
```

## Checks after writing

- Update the reference link at the end to the actual CRS/projections docs page if the target differs (verify the path exists; adjust or drop the link).
- Confirm the 9-3 relative link filename matches the moved page.
- Rebuild: `PYTHONPATH=/tmp/mkdocs-toolchain python3 -m mkdocs build --strict`.
