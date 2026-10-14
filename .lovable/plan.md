# Tutorial names in the Tutorials load tab

## Goal

Rows in Load → Tutorials currently read "Tutorial 10 prerequisite" / "Tutorial 10 completion". They should show the tutorial's topic, e.g. "Tutorial 10 – Vector data (completion)".

## Where the names come from

The list is built from file names in the `tutorials` folder of the configs repository (`src/utils/tutorialConfigs.ts`). File names carry only the tutorial number and kind, so the topic must come from somewhere else. Options:

1. **Static title map in the app** (recommended): a small `TUTORIAL_TITLES` record in `tutorialConfigs.ts`, e.g. `{ 9: 'Multi-spectral data', 10: 'Vector data', 11: 'Coordinate reference systems', 12: 'STAC as a data source' }`. Zero extra downloads, instant, no repository changes. Titles must be updated in the app when a new tutorial is added — same pattern as announcements.
2. **Manifest file in the repository**: a `tutorials/index.json` the app fetches alongside the listing. No app release needed for new titles, but adds a second request and a file to maintain in the other repository.
3. **Read each config's `meta.title`**: would need downloading every tutorial file just to list them — slow; rejected.

Plan uses option 1, with the map easy to extend.

## Changes

- `src/utils/tutorialConfigs.ts`
  - Add `TUTORIAL_TITLES: Record<number, string>` with the current tutorials (8 Statistics, 9 Multi-spectral data, 10 Vector data, 11 Coordinate reference systems, 12 STAC as a data source).
  - In `parseTutorialListing`, build the row name as `Tutorial N – <title> (kind)` when a title exists, falling back to today's `Tutorial N kind` for unknown numbers.
  - Description keeps the existing "Starting point for / Finished result of Tutorial N · Last updated …" text, now using the titled name.
- The Load dialog (`LoadConfigDialog.tsx`) needs no change — it renders `entry.name` already. The same applies to the Import Layer Card, which reuses these entries.
- Add a unit test for the titled naming and the fallback.

## Notes

- Nothing changes in the tutorials repository or file naming.
- When a new tutorial is added, one line in `TUTORIAL_TITLES` gives it a name; until then it still lists correctly as "Tutorial N kind".
