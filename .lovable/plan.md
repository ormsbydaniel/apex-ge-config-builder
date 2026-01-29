

## Plan: Add `design` Object to Global Layout Schema

### Overview
Add support for a `design` object within the top-level `layout` configuration that allows specifying UI variant configurations with flexible parameters.

---

### Step 1: Update TypeScript Type Definitions

**File: `src/types/format.ts`** (or the appropriate layout types file)

Add new interfaces for the design configuration:

```typescript
// Design configuration for layout variants
export interface DesignConfig {
  variant: string;           // Required: the design variant (e.g., "fullscreen")
  parameters?: Record<string, unknown>;  // Optional: key-value pairs for variant parameters
}
```

Then update the `Layout` interface to include the optional `design` property:

```typescript
export interface Layout {
  design?: DesignConfig;
  navigation?: { ... };
  theme?: { ... };
}
```

---

### Step 2: Update Zod Schema

**File: `src/schemas/configSchema.ts`**

Add the design schema and integrate it into the global layout schema:

```typescript
// Design configuration schema
const DesignSchema = z.object({
  variant: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
}).passthrough();  // Allow future extensions

// Update the global LayoutSchema (not the DataSource LayoutSchema)
const GlobalLayoutSchema = z.object({
  design: DesignSchema.optional(),
  navigation: NavigationSchema.optional(),
  theme: ThemeSchema.optional(),
}).passthrough();
```

---

### Step 3: Verify Validation Hook Pass-through

**File: `src/hooks/useValidatedConfig.ts`**

The current implementation should already pass through the global `layout` object unchanged. Verify that no sanitization strips out the new `design` property. If needed, add explicit preservation:

```typescript
// Ensure design is preserved in layout
...(config.layout?.design && { design: config.layout.design }),
```

---

### Step 4: Verify Export Transformations

**File: `src/utils/exportTransformations/index.ts`**

The current implementation is a pass-through, so `design` will automatically be preserved during export. No changes needed.

---

### Step 5: Verify JSON Editors

The JSON editors (MonacoJsonEditor) work with the raw configuration object, so they will automatically support viewing and editing the new `design` property once the schema and types are updated.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/types/format.ts` | Add `DesignConfig` interface and update `Layout` interface |
| `src/schemas/configSchema.ts` | Add `DesignSchema` and include in global layout schema |
| `src/hooks/useValidatedConfig.ts` | Verify pass-through (may not need changes) |

---

### Example Configuration

```json
{
  "version": "1.0.0",
  "layout": {
    "design": {
      "variant": "fullscreen",
      "parameters": {
        "position": "right",
        "showHeader": true
      }
    },
    "navigation": { ... },
    "theme": { ... }
  }
}
```

---

### Technical Notes

1. **Flexible Parameters**: Using `Record<string, unknown>` allows any key-value pairs in the parameters object, supporting future extensions without schema changes

2. **Passthrough**: The `.passthrough()` modifier ensures additional properties aren't stripped during validation

3. **Optional Design**: The design object is optional to maintain backward compatibility with existing configurations

4. **Scope**: This change affects the **global layout** (`config.layout`), not the **data source layout** (`source.layout`)

