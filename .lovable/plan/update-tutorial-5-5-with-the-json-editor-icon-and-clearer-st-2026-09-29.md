# Update tutorial 5-5 with the JSON editor icon and clearer steps

## Goal
In `docs/workshops/05-categorical-data/05-categories-json-editor.md`, show the
**{JSON}** icon that launches the per-layer JSON editor (from the uploaded
image) and tighten steps 2 and 4.

## Changes — single page, three edits

1. **Step 2 — icon + Enable editing.** Reword step 2 to:
   "On your _World Cover 2020_ layer card, click the **{JSON}** icon to open
   the JSON editor, then click **Enable editing** to switch from the read-only
   view to edit mode." Add the uploaded icon image under step 2 (4-space
   indented so it stays inside the step), with a short caption such as
   "The **{JSON}** icon on the layer card".

2. **Step 4 — replace-the-line wording.** Reword the opening of step 4 to:
   "Highlight the entire line of the empty `categories` (`"categories": []`),
   and then press paste to replace that one line with the clipboard copy from
   above." Keep the existing **Apply changes** / preview sentence unchanged.

3. **Add the icon screenshot** via `scripts/add-screenshot.sh` with a
   kebab-case name (`layer-json-editor-icon.png`), which copies it to both
   `docs/assets/screenshots/` and `public/guide/assets/screenshots/` per the
   screenshot conventions. Reference it in step 2 with a relative path.

## No other files
- The intro, recap bullets, step 1 (clipboard JSON), step 3, the tip
  admonitions, mkdocs.yml and nav-groups.js are untouched.

## Verification
- `python3 -m mkdocs build --strict` passes.
- Check the generated HTML: icon figure renders inside step 2 with caption,
  step 4 contains the new wording, step count stays 4.
