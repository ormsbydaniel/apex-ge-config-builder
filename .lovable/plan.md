# Data-first, data-aware app wizard

## What changes for the user

New step order for every template:

```text
1 Title -> 2 Data -> 3 Location -> 4 Options -> 5 Final tweaks
```

Once the data is chosen, later steps use what that data actually offers:

- **Change & Swipe (EOX Sentinel-2 cloudless):** Before and After list only the years the EOX map service actually has. The wizard reads the year list from the service's layer list rather than a fixed list, and the fixed list is only used if that read fails. For your own map service, Before and After become drop-downs of that service's layers, so you don't type layer names.
- **Satellite Monitor (STAC):** the wizard reads the collection's start and end dates and its area. Period presets outside those dates are greyed out, custom dates are limited to the range, and a short note shows "Data available 2015-06-27 to today". The Options step also shows a live count such as "23 scenes found for this place and period" (the same check as Test in the STAC editor). With zero scenes you get a suggestion to widen the period or move the map, but you can still continue.
- **Asset Inspector (vector):** the file's extent is read, and the Location step offers a "Fit to data" button.
- **Location step:** where the data's area is known, it is drawn on the small map and offered as a "Data area" preset. Picking a place outside it shows a warning.
- While a check runs you see a small "Checking data..." note. If a service can't be reached, the wizard falls back to today's fixed choices with a quiet "Couldn't check the service" message, so it never blocks you.

Clickable step numbers, the always-visible buttons and resuming from Preview keep working. Old saved answers still load and land on the matching step.

## Technical details

- `templates.ts`: add an optional per-template `probe(values, ctx) => Promise<DataInsight>` and a `DataInsight` type (`years?`, `layers?`, `temporalExtent?`, `bbox?`, `itemCount?`, `note?`). Steps can turn into dynamic options through an `optionsFrom?: (insight) => WizardOption[]` hook on `WizardField`, plus optional `min`/`max` for date fields. All of this stays in `src/utils/appTemplates/`.
- New `src/utils/appTemplates/dataProbes.ts`:
  - WMS: reuse `fetchServiceCapabilities` from `serviceCapabilities.ts` to get layer names. For EOX, match `s2cloudless(-YYYY)?_3857` to work out which years exist.
  - STAC: reuse `fetchStacCollection` (`stacMetadata.ts`) for `extent.temporal` and `extent.spatial`. Scene count comes from an items request with `limit=1` that reads `numberMatched`, or `context.matched` as a fallback, reusing `buildStacItemsUrl`.
  - Vector: a GeoJSON/FlatGeobuf header or bbox read with early abort, consistent with the existing attribute-probe approach.
  - In-memory cache keyed by URL, and a 10 s timeout.
- `AppWizardDialog.tsx`: reorder `STEP_LABELS` and map step index to step type. Run the probe when leaving the Data step, or when the data answers change (debounced). Pass the insight to `StepFields` and `LocationPickerMap`.
- `LocationPickerMap.tsx`: optional `dataBbox` prop to draw a rectangle and support "Fit to data".
- `wizardDraft.ts`: store a draft version and map old step indexes to the new order.
- `build()` output is unchanged. Configs still go through the normal import and validation path.
- Add unit tests for the EOX year parsing, STAC extent to period-preset filtering, and the draft step migration.
- Update `AGENTS.md`: probes live in `src/utils/appTemplates/dataProbes.ts` and are advisory only, because the wizard must work offline from services.
