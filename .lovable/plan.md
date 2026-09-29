# Draft Tutorial 9 home page objectives

## Documentation change

Replace the placeholder objectives in `docs/workshops/09-coordinate-reference-systems/index.md` with drafted content, keeping the existing Steps list (9-1, 9-2, 9-3) unchanged.

Proposed content, following the Tutorial 4 and 8 house style (short intro sentence, then "By the end of this tutorial you will be able to:" bullets):

> This tutorial explains Coordinate Reference Systems (CRS) in the Geospatial
> Explorer: why they matter, how the Explorer handles them, and how to
> configure them.
>
> By the end of this tutorial you will be able to:
>
> - Explain why a map needs a CRS, and why you might choose a different one
>   for your data or audience (for example, regional grids or polar views).
> - Describe how the Explorer handles CRS — data is reprojected on the fly to
>   the display CRS — and which CRS are supported out of the box
>   (EPSG:3857, EPSG:4326, EPSG:3035, and the polar stereographic options).
> - Set a different CRS as the default display for a configuration, and see
>   the effect in GE Preview.
> - Add an additional CRS to a configuration so it becomes available as the
>   default or per-layer display option.

These four bullets map one-to-one onto the requested goals:

| Goal | Draft bullet |
|------|--------------|
| Why different CRS are needed | bullet 1 |
| How GE handles CRS and which are supported | bullet 2 |
| Use a different CRS as default display | bullet 3 |
| Configure additional CRS | bullet 4 |

No hero image is added yet — screenshots for this tutorial can follow when its pages are filled in (matches how Tutorial 8 grew).

## Notes

- The `## Steps` list and front matter stay as they are.
- Bullet 2's CRS list matches `src/constants/projections.ts`, the builder's actual built-in list.
- Custom CRS (bullet 4) refers to the Settings → Custom CRS dialog with a proj4 string, covered in more depth in the planned 9-2 Key concepts / later exercises.
- Rebuild the guide with the MkDocs toolchain in strict mode; this does not publish the site. The user tests the result in the preview.
