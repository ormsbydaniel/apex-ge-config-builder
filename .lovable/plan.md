

## Separate failed services into "Invalid services" section

### Behaviour

Split the configured services grid into two sections:

1. **Configured services** (existing grid) — services with status `ok`, `checking`, or `idle` (no validation error).
2. **Invalid services** — services where `validationStatuses[service.id] === 'error'`. Rendered below, under a heading **"Invalid services"** with a short helper line, using the same card component (so the user keeps the amber error badge + Retry + Edit + Delete controls).

If there are no failed services, the "Invalid services" section is not rendered. If there are no valid services, the existing empty state still appears in the top section.

### UI sketch

```
Configured services
  [stac card] [wms card]
  [s3 card]   [wmts card]

Invalid services
2 services failed validation. Check the URL or retry.
  [failing wms card]  [failing stac card]
```

The "Invalid services" heading uses muted foreground styling consistent with other section labels in the app (no new color tokens). Cards keep their existing left-border colour by source type — only the grouping changes.

### Implementation

**File touched: `src/components/ServicesManager.tsx`** (only).

1. In the render block (around lines 638–790), before the current `.sort().map()`, partition the sorted services into two arrays based on `validationStatuses[service.id] === 'error'`:
   ```ts
   const sorted = services.slice().sort(/* existing priority sort */);
   const validServices  = sorted.filter(s => validationStatuses[s.id] !== 'error');
   const invalidServices = sorted.filter(s => validationStatuses[s.id] === 'error');
   ```

2. Extract the per-service `<Card>` JSX (lines 661–787) into a small inline helper `renderServiceCard(service)` inside the component to avoid duplicating ~125 lines. No new file, no new component export — keeps existing structure intact.

3. Replace the current single grid with:
   - **Top grid** — renders `validServices` via `renderServiceCard`. Empty state (lines 632–637) shows only when `services.length === 0` (unchanged trigger).
   - **Bottom section** — rendered only when `invalidServices.length > 0`:
     ```
     <div className="mt-6">
       <h4 className="text-sm font-medium text-muted-foreground mb-1">Invalid services</h4>
       <p className="text-xs text-muted-foreground mb-3">
         {invalidServices.length} service{...} failed validation. Check the URL or retry.
       </p>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {invalidServices.map(renderServiceCard)}
       </div>
     </div>
     ```

4. No changes to validation logic, hook, types, or schema. Removal indices still resolve correctly because `onRemoveService` already uses `services.findIndex(s => s.id === service.id)` (line 774).

### Out of scope

- Collapsing/expanding the invalid section.
- Bulk "Remove all invalid" action.
- Changing card styling for failed services beyond their existing amber error badge.

