
## Goal

Stop bundling example configs inside this repo. Instead, fetch them at runtime from the `ESA-APEx/apex_geospatial_explorer_configs` repository, driven by a manifest so new examples can be added without redeploying the config builder.

## Manifest

New file to be committed by you in the external repo:

`https://raw.githubusercontent.com/ESA-APEx/apex_geospatial_explorer_configs/main/config-builder/manifest.json`

Proposed shape (versioned so we can evolve it safely):

```json
{
  "version": 1,
  "examples": [
    {
      "id": "comprehensive-demo",
      "name": "Comprehensive demo",
      "description": "A production-ready configuration showcasing many layer types and features.",
      "file": "demo-config-1.json"
    },
    {
      "id": "storymap-demo",
      "name": "Full screen storymap demo",
      "description": "EO4 Ports example as a full screen story map.",
      "file": "story-config-1.json"
    }
  ]
}
```

`file` is resolved relative to `config-builder/` in the same repo/branch. Optionally an absolute `url` field would override that for externally hosted examples.

## App changes

1. **New util `src/utils/exampleManifest.ts`**
   - Constants: `EXAMPLES_REPO = 'ESA-APEx/apex_geospatial_explorer_configs'`, `EXAMPLES_BRANCH = 'main'`, `EXAMPLES_DIR = 'config-builder'`.
   - `fetchExampleManifest(): Promise<ExampleConfig[]>` — fetches `manifest.json`, validates shape (light Zod schema), returns entries with fully-resolved `url` (raw.githubusercontent.com) and `fileName`.
   - Small in-memory cache so both dialogs share one fetch per session.

2. **`src/components/config/LoadConfigDialog.tsx`**
   - Remove the hardcoded `examples` array.
   - On dialog open (or examples tab mount), call `fetchExampleManifest()` via `useQuery`.
   - Render loading / error / empty states in the Examples tab. On error, show the manifest URL and a Retry button.

3. **`src/components/layers/import/DonorConfigPickerDialog.tsx`**
   - Replace the single hardcoded "Comprehensive demo" entry and `handleLoadExample` with a list driven by the same `fetchExampleManifest()` helper. Each entry becomes a clickable row that calls `loadFromUrl(entry.url, { type: 'example', label: entry.name }, …)`.

4. **Delete bundled example files** once the remote manifest is confirmed live:
   - `public/examples/story-config-1.json`
   - `public/examples/test-config.json`
   - Remove the `public/examples/` directory if empty.

## Failure handling

- If the manifest fetch fails (offline, 404, invalid JSON), the Examples tab shows an inline error with the manifest URL and Retry — no fallback to bundled files (the point is to remove them).
- Individual example load failures continue to surface through the existing import error flow.

## Out of scope

- No changes to the import pipeline itself (`useConfigImport`, `useDonorConfigLoader`).
- No schema/type changes to actual configs.
- No auth — the manifest and configs are public raw GitHub URLs.

## Action required from you

Before I delete the bundled files, please add `manifest.json` (and `demo-config-1.json`, `story-config-1.json`) under `config-builder/` in the external repo. Confirm the manifest field names above work for you, or tell me what to change.
