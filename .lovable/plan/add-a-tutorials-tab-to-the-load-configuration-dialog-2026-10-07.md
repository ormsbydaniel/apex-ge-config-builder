# Add a "Tutorials" tab to the Load Configuration dialog

## What the user sees
- A new **Tutorials** tab beside Upload / Examples / GitHub.
- It lists every tutorial config found in the `tutorials` folder of `ESA-APEx/apex_geospatial_explorer_configs` (main branch), labelled in plain words, e.g. "Tutorial 3 completion", "Tutorial 4 prerequisite".
- Sorted by tutorial number, prerequisite before completion for the same tutorial.
- Clicking an entry loads it exactly like an example (same validation, error dialog and unsaved-changes guard).
- Loading, empty and error states (with a Retry button) match the Examples tab.

## Logic
- The folder listing is read live from GitHub, so new tutorial files appear without redeploying the builder (no manifest needed).
- Only files matching `tutorial-N-completion.json` or `tutorial-N-prerequisite.json` are shown; anything else in the folder is ignored.
- The list is fetched once when the tab is first opened and cached for the session.

## Technical details
- New utility `src/utils/tutorialConfigs.ts`:
  - Fetch `https://api.github.com/repos/ESA-APEx/apex_geospatial_explorer_configs/contents/tutorials?ref=main`.
  - Parse names with `/^tutorial-(\d+)-(completion|prerequisite)\.json$/i` into `{ id, tutorial, kind, name, url (download_url / raw URL), fileName }`.
  - Sort by number then kind; in-memory promise cache cleared on failure (same pattern as `exampleManifest.ts`).
  - Clear message on GitHub rate-limit (HTTP 403/429).
- `LoadConfigDialog.tsx`: add the `tutorials` TabsTrigger/TabsContent, reusing the existing example-loading handler and list styling.
- Unit test for the filename parser/sorting.
- Tutorials are not offered as donor configs for layer/story import.
