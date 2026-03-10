

## Show Fields Section for Vector Layers Without Configured Fields

Two changes needed:

**1. `LayerCardContent.tsx`** — Change the condition from "has fields with entries" to "has any vector data source". This way the Fields section always appears for vector layers:

```typescript
// Replace:
{source.meta?.fields && Object.keys(source.meta.fields).length > 0 && (

// With:
{firstVectorSource && (
```

Pass `fields={source.meta?.fields || {}}` so it works with empty/undefined fields.

**2. `LayerFieldsDisplay.tsx`** — Remove the early return when `fieldEntries.length === 0`. Instead, when there are no configured fields, show the header with edit button and a subtle message like "All fields (default display)":

```
┌────────────────────────────────────┐
│ 🔤 Fields  ✏️                      │
│ All fields (default display)       │
└────────────────────────────────────┘
```

When fields are configured, it continues to show badges as before but with the count: "Fields (N)".

### Files Changed

| File | Change |
|------|--------|
| `LayerCardContent.tsx` | Loosen render condition to `firstVectorSource` instead of requiring non-empty fields |
| `LayerFieldsDisplay.tsx` | Remove early return for empty fields; show "All fields (default display)" message when no fields configured |

