# Phase 1: Community app templates from the configs repository

## Goal

App templates on `/apps` come from the ESA-APEx configs repository instead of being written in code. Each template is a normal Geospatial Explorer config (the "base config") plus a small wizard file that says which questions to ask and where each answer goes in the config. Anyone can add a template with a pull request; no redeploy of the Config Builder is needed.

This phase builds the template format, the loader and the wizard support. "Save as App Template" from the Config Builder is Phase 2.

## What the user sees

- `/apps` shows templates listed in the repository's manifest, alongside the three current built-in ones.
- Each card shows its name, tagline, badges and a "Community" marker when it comes from the repository.
- Opening one runs the same 5-step wizard (Title, Data, Location, Options, Final tweaks) with the same buttons, step jumping and Back to App Builder from Preview.
- If the repository can't be reached, the built-in templates still show, with a quiet "Couldn't load community templates" note.
- A template that fails its checks is left out and listed under a small "Unavailable templates" note, with the reason, so authors can fix it.

## Template format

A manifest entry in `config-builder/manifest.json`:

```json
"appTemplates": [
  { "id": "s2-monitor", "file": "apps/s2-monitor/template.json" }
]
```

`template.json`:

```json
{
  "formatVersion": 1,
  "id": "s2-monitor",
  "name": "Satellite STAC Monitor",
  "tagline": "...",
  "bestFor": ["Crop health", "Seasonal change"],
  "baseConfig": "config.json",
  "defaults": { "title": "...", "center": [15, 52], "zoom": 4, "layoutVariant": "sidebar" },
  "steps": {
    "data":    { "title": "Imagery", "fields": [ ... ] },
    "options": { "title": "Time period", "fields": [ ... ] }
  },
  "patches": [
    { "set": "/layout/navigation/title", "from": "title" },
    { "set": "/sources/0/data/0/url", "from": "stacUrl", "transform": "stacSearch" }
  ]
}
```

- Fields use the same kinds as today: choice, date, text, slider, with `showIf`.
- Patches are declarative: `set` a JSON path to a wizard answer, a fixed value, or the result of a named helper.
- Data-aware behaviour (EOX year lists, STAC date ranges, scene counts, vector extents) is opted into by name, e.g. `"probe": "stacCollection"` or `"optionsFrom": "stacYears"`. Authors pick from a fixed list of built-in helpers; templates never contain code.

## Build steps

1. Keep the parked Keycloak plan: move it into the saved-plans folder so this plan doesn't replace it.
2. Define the template format: Zod schema and TypeScript types for `template.json` and the patch rules, with a format version.
3. Patch engine: apply patches to a copy of the base config (JSON-pointer style paths, array indexes, named transforms). Pure functions, unit-tested.
4. Helper registry: wrap today's probes, `optionsFrom`, `rangeFrom`, `liveCheck` and transforms (STAC search URL, cloud filter, period from season/year, bbox from centre/zoom) under stable names.
5. Loader: extend the manifest reader with an optional `appTemplates` section, fetch each template and its base config, validate, cache for the session, and collect failures with reasons.
6. Adapter: turn a loaded community template into the same internal template object the wizard already uses, so the wizard needs only small changes (card marker, unavailable note).
7. Prove it: write the Satellite STAC Monitor as a `template.json` + `config.json` pair, check that its output matches the built-in version's output in a test, and supply the files for the configs repository (staged locally until they are pushed there).
8. Docs: a "Writing an app template" page in the guide (format, patches, helper names, how to submit), registered in `mkdocs.yml` and `nav-groups.js`.
9. Record the decision in `AGENTS.md`.

## Not in this phase

- "Save as App Template" in the Config Builder (Phase 2).
- Removing the built-in TypeScript templates. They stay as a fallback until the community versions are proven; retiring them is a later decision.
- Build with AI.

## Technical details

- New files under `src/utils/appTemplates/`: `templateSchema.ts`, `patchEngine.ts`, `helpers.ts` (named registry), `communityTemplates.ts` (loader + adapter). Tests in `__tests__/`.
- `exampleManifest.ts`: parse optional `appTemplates` entries with the existing `resolveRef`; a missing section is fine.
- Generated config still goes through `importConfigFromText`, so community output is schema-validated like any loaded file. Base configs are also validated at load time so broken templates are caught before the wizard opens.
- Patch paths that don't exist in the base config fail validation of the template, not silently at build time.
- Unknown helper names or a newer `formatVersion` mark the template unavailable rather than crashing.
- Draft resume keys on template id; community ids are prefixed (`community:`) to avoid clashing with built-ins.
- Tests: patch engine paths and transforms, schema rejection cases, manifest parsing with and without `appTemplates`, and STAC template parity with the built-in builder.
