# Align field date/datetime formatting with the Explorer

The Explorer's Data Values panel only formats a field when `type === "date"` **and** a `format` string is present; the format is a Luxon token string (`yyyy`, `MM`, `dd`, `HH`, `mm`, etc.). A field with `type: "datetime"` or a missing `format` falls back to the raw value. The Manage Fields table currently offers a `DateTime` type that the Explorer never renders, and has no way to set `format` in the UI.

## Changes

### 1. Type column emits only what the Explorer supports
- In `src/components/form/FieldItem.tsx`, replace the Type select options with: **Default**, **Date / DateTime**, **URL**.
- Selecting "Date / DateTime" writes `"type": "date"` to the config (the only value the Explorer checks). The date-vs-datetime distinction is expressed through the chosen format, not the type.
- Configs that already contain `"type": "datetime"` are displayed as "Date / DateTime" and normalised to `"date"` on save, so existing configs keep working.

### 2. Format picker for date fields
- When Type is "Date / DateTime", show an inline **Format** control in the row (in the space the old Format column used, kept compact):
  - A dropdown of common Luxon presets, e.g. `yyyy-MM-dd`, `dd/MM/yyyy`, `dd MMM yyyy`, `yyyy-MM-dd HH:mm`, `dd MMM yyyy, HH:mm`, plus a **Custom…** option.
  - Choosing Custom reveals a small text input for a free Luxon token string, with a hint that tokens follow Luxon (e.g. `yyyy-MM-dd HH:mm`).
- The selected/custom value is saved to `config.format`; clearing the format removes the key (field then shows the raw value, matching Explorer behaviour).
- Existing `format` values (including ones not in the preset list) are preserved and shown as the current custom value.

### 3. Field population fix
- In `src/utils/populateFieldDetails.ts`, map detected `date` **and** `datetime` source types to `type: "date"` (currently `datetime` is written verbatim and would never render in the Explorer). Update `populateFieldDetails.test.ts` accordingly.

### 4. Documentation
- Update `docs/layers/data-values-vector.md`: the Type option is `date` (presented as "Date / DateTime"), formatting only applies when a `format` is set, formats use Luxon tokens, and the format can now be picked in the Manage Fields table. Update the JSON example if needed.
- Update `docs/reference/json-schema.md` field rows for `type`/`format` to match.

## Technical details
- No schema change needed: `FieldConfigSchema` already accepts `type`/`format` as optional strings (`.passthrough()`), and `FieldConfig` in `src/types/category.ts` already has both fields.
- Row layout: keep the compact table; the format control only renders for date rows so other rows are unchanged.
- Verification: run the vitest suite (including updated populate tests); user does visual testing of the dialog.
