# Align Import Layer Card configuration sources

## Goal
Give **Import Layer Card** the same configuration choices as **Load Configuration**, so users can import layers from test/development and tutorial configurations as well as uploads, examples, and GitHub.

## Changes
- Update the Import Layer Card source picker from three tabs to the same four-tab order used by Load Configuration: **Upload**, **Examples**, **From GitHub**, **Tutorials**.
- Load the full examples manifest in the Examples tab and show **Test & development** configurations beneath the normal examples, matching the existing labels and visual distinction in Load Configuration.
- Add the Tutorials tab using the existing tutorial listing utility, including:
  - the current tutorial ordering and latest-version selection;
  - loading, empty, stale-list, error, and retry states;
  - a fresh folder check each time the Import Layer Card dialog opens.
- Route test and tutorial selections through the existing donor validation flow, then show their layer cards in the existing selection tree. Importing a donor configuration will continue to leave the current configuration untouched until specific layers are selected and imported.
- Keep Upload, GitHub browsing, layer selection, validation errors, and import placement unchanged.

## Technical details
- Reuse `fetchExampleManifest`, `fetchTutorialConfigs`, and the existing React Query cache keys/refresh behaviour from Load Configuration rather than introducing another source definition.
- Treat test and tutorial files as donor configurations only; no schema or saved-configuration changes are required.
- Keep this change focused on Import Layer Card rather than restructuring the existing dialog implementations.

## Verification
- Add focused coverage that test/development entries and tutorial entries can be selected and passed through donor validation.
- Run the relevant manifest/tutorial and donor-loader tests, followed by the TypeScript check and preview build check.
- Leave detailed visual verification to the user, per the established testing preference.
