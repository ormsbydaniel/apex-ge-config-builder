# Fix old configs that fail to load

Two required fields in the configuration schema have no fallback, so older
configuration files are rejected on import:

- `layout.navigation.logo` — required, and older configs omit it.
- `exclusivitySets` — required top-level array, and older configs omit it.

## What will change

A new import step will fill these in automatically when they are missing, so
old configs load without the user having to hand-edit the file.

- **Missing logo** — set to the default ESA logo already used for new
  configurations. Also applied when the logo is present but blank, or is not a
  valid URL / relative path.
- **Missing exclusivity sets** — set to an empty list. Also applied when the
  value is present but not a list (e.g. an object or a string).
- **Missing interface groups** — the same top-level required-array problem
  applies to `interfaceGroups`; defaulted to an empty list for consistency.

Nothing is changed when the fields are already valid, so current configs load
exactly as they do today.

## Technical detail

- New `src/utils/importTransformations/detection/topLevelDefaultsDetector.ts`
  returning true when `layout.navigation.logo`, `exclusivitySets` or
  `interfaceGroups` is missing or the wrong shape.
- New `src/utils/importTransformations/transformers/topLevelDefaultsTransformer.ts`
  applying the defaults immutably, mirroring the style of
  `metaCompletionTransformer.ts`.
- Register `topLevelDefaultsNeeded` in `types.ts` (`DetectedTransformations`),
  in `detector.ts`, and apply it early in the loop in
  `iterativeOrchestrator.ts` (before meta completion), plus re-export from
  `index.ts`.
- Default logo constant reuses the value in `ConfigContext.tsx`
  (`https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg`);
  extracted into the transformer module so both stay in sync by reference.
- Add a Vitest covering: missing logo filled, invalid logo replaced, missing
  `exclusivitySets` defaulted to `[]`, valid config untouched, and that the
  result passes `ConfigurationSchema`.
