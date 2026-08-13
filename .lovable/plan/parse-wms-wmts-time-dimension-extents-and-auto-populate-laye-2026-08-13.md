# Parse WMS/WMTS time dimension extents and auto-populate layer timeframe

## Goal

Make the builder actually use the time extent advertised in a WMS/WMTS `GetCapabilities` response:

1. Parse the ISO 8601 interval(s) inside the `<Value>` element of a `time` dimension.
2. Show the parsed start, end and granularity in the WMS/WMTS metadata dialog.
3. When a temporal WMS/WMTS layer is added to a layer card, automatically set the layer's **Time picker** `timeframe` and `defaultTimestamp` from the advertised extent.

## Background

A WMTS `time` dimension can look like this:

```xml
<Dimension>
  <ows:Identifier>time</ows:Identifier>
  <UOM>ISO8601</UOM>
  <Default>2026-08-13</Default>
  <Current>false</Current>
  <Value>1984-03-01/2026-08-13/P1D</Value>
</Dimension>
```

The `<Value>` means the layer is available from `1984-03-01` to `2026-08-13` with a daily step (`P1D`). Today the builder only detects that a time dimension exists and reads the `<Default>` value; it ignores the `<Value>` extent and does not set the layer's `timeframe` automatically.

## Scope

- WMS 1.3.0 `<Dimension name="time">` and WMTS 1.0.0 `<Dimension><Identifier>time</Identifier>`.
- `<Value>` may be a single interval (`start/end/period`), a comma-separated list of intervals, or a comma-separated list of discrete dates.
- ISO 8601 durations such as `P1D`, `P5D`, `P1M`, `P1Y`, `PT1H`, `PT30M`.
- Mapping to the existing builder timeframes: `None`, `Time`, `Days`, `Months`, `Years`.
- Auto-populate only when the layer card does not already have a `timeframe` set, to avoid overwriting a user's explicit choice.

## Out of scope

- No changes to the viewer runtime; this is purely builder metadata and form behaviour.
- No CORS or fetching changes beyond parsing the existing `GetCapabilities` response.
- No changes to STAC, COG, S3 or catalogue timestamp handling.

## Implementation plan

### 1. Add a time-dimension parser utility

Create `src/utils/timeDimension.ts` with pure, unit-tested functions:

- `parseTimeDimensionValue(value: string): TimeDimensionExtent | null`
  - Splits comma-separated entries.
  - Detects interval triplets (`start/end/period`) vs. discrete dates.
  - Parses ISO 8601 dates using the existing `date-fns` dependency.
- `parseIso8601Duration(period: string): { years, months, days, hours, minutes, seconds }` or a simple normalised representation.
- `inferTimeframeFromDuration(period: string): TimeframeType`
  - Sub-day (`PT...`) → `Time`
  - Day(s) (`P1D`, `P5D`) → `Days`
  - Month(s) (`P1M`) → `Months`
  - Year(s) (`P1Y`) → `Years`
- `parseIso8601Date(dateStr: string): Date | null`
  - Handles `YYYY-MM-DD` and full ISO 8601 strings.

The returned `TimeDimensionExtent` should include:

- `start`, `end` as ISO 8601 strings
- `period` as the raw ISO duration
- `intervals` array of parsed `{ start, end, period }`
- `discreteValues` when the value is a list of discrete timestamps
- `suggestedTimeframe: TimeframeType`

### 2. Extend `LayerInfo` with time extent

In `src/types/service.ts`, add to `LayerInfo`:

```ts
export interface TimeDimensionExtent {
  start: string;
  end: string;
  period?: string;
  intervals: Array<{ start: string; end: string; period?: string }>;
  discreteValues?: string[];
  suggestedTimeframe: TimeframeType;
}

export interface LayerInfo {
  ...
  hasTimeDimension?: boolean;
  defaultTime?: string;
  timeExtent?: TimeDimensionExtent;
  ...
}
```

### 3. Parse the time dimension in `serviceCapabilities.ts`

For both WMS and WMTS parsing paths in `src/utils/serviceCapabilities.ts`:

- Read the dimension's `<Value>` text (WMS: `<Dimension>` text content; WMTS: `<Value>` child elements).
- Pass it through `parseTimeDimensionValue`.
- Populate `timeExtent` on the `LayerInfo` object.
- Keep the existing `hasTimeDimension` and `defaultTime` fields.

### 4. Display the extent in the metadata dialog

In `src/components/layers/components/WmsWmtsMetadataDialog.tsx`, when a layer has `timeExtent`, add rows to the layer details table showing:

- Time extent start
- Time extent end
- Granularity / period
- Suggested timeframe
- Default timestamp (already shown)

### 5. Pass the suggestion through the service selection flow

Update `src/components/layers/components/ServiceSelectionModals.tsx` so that when a layer is selected, the callback returns the full selected `LayerInfo` (or at least its `timeExtent`/`defaultTime`) instead of just the URL, name and format.

Update `src/components/layers/DataSourceForm.tsx` to:

- Capture `suggestedTimeframe` and `defaultTime` from the selected layer.
- When the form is submitted, attach a transient field to the `DataSourceItem`, e.g.:

```ts
__temporalSuggestion: {
  timeframe: TimeframeType;
  defaultTimestamp: number;
}
```

This transient field is used only to carry the suggestion across the callback and is stripped before persistence.

### 6. Apply the suggestion to the layer card

In `src/hooks/useLayerOperations.ts`, update `handleDataSourceAdded`:

- For each data source being added, check for `__temporalSuggestion`.
- If the layer's `timeframe` is currently `'None'` or `undefined`, set it to the suggested `timeframe` and set `defaultTimestamp` to the suggested timestamp.
- Remove `__temporalSuggestion` from the data source item before saving it.
- Also handle the edit path (`handleUpdateDataSource`) in the same way, so editing a WMS/WMTS layer can update the layer card if it has no timeframe yet.

### 7. Tests

Add `src/utils/__tests__/timeDimension.test.ts` covering:

- Single interval: `1984-03-01/2026-08-13/P1D`
- Multiple intervals separated by commas
- Discrete date list
- Period-to-timeframe mapping (`P1D`, `P5D`, `P1M`, `P1Y`, `PT1H`, `PT30M`)
- Invalid / malformed input returning `null`

Run the existing `serviceCapabilities.ts` tests (if any) or add a small test that verifies `timeExtent` is populated from a sample XML document.

### 8. Validation

- `bunx vite build` passes.
- `bunx tsgo` passes.
- `bunx vitest run src/utils/__tests__/timeDimension.test.ts` passes.
- Manual preview check: add a WMTS service with a daily `time` dimension, open the metadata dialog, confirm the extent is shown, then select the layer and confirm the layer card's **Time picker** is set to **Days** and the default date matches the `<Default>` value.

## Open questions

1. Should the auto-population overwrite a layer card that already has a `timeframe` set? The current proposal is "only when empty" to avoid overwriting user intent; confirm this is acceptable.
2. Should the data source item itself also store `timestamps` (for the manual-timestamp path) when `useTimeParameter` is disabled? The current proposal only updates the layer card `timeframe`/`defaultTimestamp` and lets the existing WMS/WMTS `TIME` parameter logic handle the rest.
