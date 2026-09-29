# Rewrite tutorial 5-5 (Use the JSON editor)

## Goal
Reframe 5-5 as an "advanced technique" page that first recaps the three category
methods already taught in 5-3 and 5-4, then introduces direct JSON editing.
The rest of the tutorial (5-6 Copy categories between layers) carries on unchanged.

## Changes — single file: `docs/workshops/05-categorical-data/05-categories-json-editor.md`

New structure (house style: front-matter title, numbered steps, 4-space indents,
`!!! tip` admonitions, "Configuration Builder" / "Preview" terminology):

1. **Intro recap** — a short paragraph plus a bulleted list of the three methods
   covered so far:
   - Define categories one by one in the Categories editor (COG in 5-3, WMS in 5-4)
   - Populate categories (COG only) from the sampled values and embedded colour
     map, then edit the labels
   - Import categories, colours and labels from a CSV file

2. **Introduce JSON editing as a further, more advanced technique** — useful for
   bulk edits or pasting in a full category set in one go. Keep the existing
   explanation of the two JSON editors (full configuration on the JSON config
   tab, per-layer via the orange **{JSON}** icon on the layer card); this page
   uses the per-layer editor.

3. **`!!! tip` "Export first"** — hand-editing JSON bypasses the safeguards of
   the Categories editor, so export the configuration before starting to keep a
   working copy to fall back on.

4. **Steps unchanged in substance** (same numbered steps as the current page):
   1. Copy the World Cover categories JSON block (kept exactly as-is)
   2. On the *World Cover COG* layer card, open the **{JSON}** editor
   3. Scroll to the start of the `categories` section
   4. Collapse the existing `categories` array and delete it
   5. Paste the JSON, **Apply changes** and preview the layer

5. **Keep the existing tip** pointing to the full-config JSON editor
   ([JSON config](../../configuration/json-config.md)).

## No other files
- File name, title (`5-5. Use the JSON editor`), mkdocs.yml entry and
  nav-groups.js all stay the same.
- 5-6 and the tutorial 5 index are untouched.

## Verification
- `python3 -m mkdocs build --strict` passes.
- Check the generated HTML: recap bullets render as a list, JSON block intact,
  both tips render as admonitions.
