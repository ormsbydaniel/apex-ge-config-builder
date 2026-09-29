# Rework tutorial 5-5 to use the World Cover 2020 WMS layer

## Goal

Retarget the JSON-editor exercise at the *World Cover 2020* WMS layer (created in
3-3) instead of the COG layer, and remove the fold-and-delete steps — the 2020
layer has no categories yet, so the empty `"categories": []` is simply replaced
with the full list.

## File changed

`docs/workshops/05-categorical-data/05-categories-json-editor.md` only.

## Changes

1. **Intro recap** — keep the three-method recap (define one by one in the UI for
   COG and WMS; populate from COG values + colour map then edit labels; import
   from CSV) and the "further advanced technique" paragraph, but replace the
   closing sentence so it explains the setup:
   - Tutorial 2 gave us the *World Cover 2021* WMS layer, and
     [3-3](../03-working-with-services/03-wms-as-a-service.md) added a second
     one, *World Cover 2020*.
   - The 2021 layer already has its categories — we copied them from the COG in
     [5-4](04-categories-wms.md).
   - We will use the 2020 layer to explore a direct JSON copy of a complete
     category set.
2. **Keep the "Export first" tip** unchanged.
3. **Step 1** — copy the JSON snippet to the clipboard (unchanged, including the
   full 11-category list).
4. **Step 2** — on the *World Cover 2020* WMS layer card (not the COG layer),
   open the **{JSON}** editor.
5. **Step 3** — scroll to the `categories` section. It reads `"categories": []`
   — an empty list, because we have not given this layer any categories yet.
6. **Step 4** — select the empty `[]` and paste the copied JSON, so
   `"categories": []` becomes the full category list. **Apply changes** and
   preview the layer: the legend now shows a row per class.
7. **Remove** the old collapse-arrow / delete-from-`[`-to-`]` instructions (no
   delete section).
8. **Keep** the closing "Full-config JSON editor" tip unchanged.

## Out of scope

- 5-6 (Copy categories between layers) stays as is — it demonstrates the UI
  copy on the 2021 layer.

## Verification

- `python3 -m mkdocs build --strict` passes.
- Rendered 5-5 HTML has the 4 numbered steps, no delete instructions, and links
  to 3-3 and 5-4 resolve.
- Nothing published — user reviews in preview.
