
# Add `projections` Array to Configuration

## Overview

Add a new top-level `projections` array to the config schema. Each projection object has a required `code` (e.g. "EPSG:3035") and `definition` (the proj4 string), plus an optional `name`. This array will be supported through import, export, the JSON config editor, and will persist through the full data flow.

## What Changes

- A new optional `projections` array appears in the exported/imported JSON at the top level (alongside `services`, `sources`, `mapConstraints`, etc.)
- Existing configs without `projections` continue to work unchanged
- The JSON Config editor will show/allow editing the `projections` array
- Import and export will preserve the array through the full round-trip

## Example JSON

```json
{
  "version": "1.0.0",
  "projections": [
    {
      "name": "LAEA Europe",
      "code": "EPSG:3035",
      "definition": "+proj=laea +lat_0=52 +lon_0=10 ..."
    },
    {
      "code": "EPSG:3413",
      "definition": "+proj=stere +lat_0=90 ..."
    }
  ],
  "layout": { ... },
  ...
}
```

## Technical Details

### 1. Zod Schema (`src/schemas/configSchema.ts`)

Add a `ProjectionSchema` and include it in `ConfigurationSchema`:

```typescript
const ProjectionSchema = z.object({
  name: z.string().optional(),
  code: z.string(),
  definition: z.string(),
});
```

Add to `ConfigurationSchema`:
```typescript
projections: z.array(ProjectionSchema).optional(),
```

### 2. ConfigContext (`src/contexts/ConfigContext.tsx`)

- Add `projections` to `initialState` (as `undefined` or empty array)
- Add a new action type `UPDATE_PROJECTIONS` to the reducer that sets `isDirty: true`
- Preserve `projections` in `LOAD_CONFIG` case (already handled by spread, but ensure it flows through)

### 3. Export (`src/hooks/useConfigExport.ts`)

Add `projections` to the `exportData` object:
```typescript
...(config.projections?.length && { projections: config.projections }),
```

### 4. ConfigJson page (`src/pages/ConfigJson.tsx`)

Same pattern -- include `projections` in the export data object.

### 5. Validated Config (`src/hooks/useValidatedConfig.ts`)

Pass through `projections` unchanged in the return value (it's already spread via `...config`, but worth verifying it isn't stripped).

### 6. Config Sanitization (`src/hooks/useConfigSanitization.ts`)

Verify projections aren't stripped during sanitization. If needed, add explicit passthrough.

### Files Modified

| File | Change |
|------|--------|
| `src/schemas/configSchema.ts` | Add `ProjectionSchema`, add `projections` to `ConfigurationSchema` |
| `src/contexts/ConfigContext.tsx` | Add `UPDATE_PROJECTIONS` action, include in initialState |
| `src/hooks/useConfigExport.ts` | Include `projections` in export data |
| `src/pages/ConfigJson.tsx` | Include `projections` in export data |
| `src/hooks/useValidatedConfig.ts` | Ensure `projections` passes through |

No UI editor for projections is included in this change -- they will be editable via the JSON Config tab. A dedicated UI editor could be added later if needed.
