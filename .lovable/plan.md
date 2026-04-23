

## Fix recommended-service validation by mirroring "Re-check all"

### Problem

After clicking **Add Recommended Services**, the toast says *"Validating…"* but nothing happens. The newly added services keep showing the orange "Manual configuration required" badge.

### Root cause

In `handleConfirmRecommendedServices` (`src/components/ServicesManager.tsx`):

```ts
selectedServices.forEach(...) // dispatches onAddService for each
setTimeout(() => recheck(), 0); // calls the stale recheck
```

`recheck` is a `useCallback` in `useBulkServiceValidation` whose closure captures the **previous** `services` array. At the moment we call it, React hasn't re-rendered yet, so `recheck` still sees the pre-add list and validates nothing new. The "Re-check all" button works because by the time the user clicks it, the hook has re-rendered with the updated `services` array.

### Fix

Defer the `recheck()` call until **after** the next render — once `services` (and therefore `recheck`'s closure) reflects the newly added items. Use a `useEffect` driven by a "pending recheck" flag instead of `setTimeout`.

### Implementation

**`src/components/ServicesManager.tsx`**

1. Add a tiny piece of state: `const [pendingRecheck, setPendingRecheck] = useState(false);`
2. In `handleConfirmRecommendedServices`, replace `setTimeout(() => recheck(), 0)` with `setPendingRecheck(true)`.
3. Add a `useEffect` that watches `[pendingRecheck, services.length]` — when the flag is true and `services.length` reflects the new additions, call `recheck()` and clear the flag.

```tsx
useEffect(() => {
  if (!pendingRecheck) return;
  recheck();          // now sees the updated services list
  setPendingRecheck(false);
}, [pendingRecheck, services.length, recheck]);
```

This is exactly what the **Re-check all** button does — runs `recheck()` against the current `services` — so the recommended-services flow now uses the same validated path. The progress strip ("Checking STAC catalogues…", etc.) and per-card spinners/badges all light up automatically.

### Files touched

- **Edit**: `src/components/ServicesManager.tsx` — replace `setTimeout` with effect-based deferred recheck.

### Out of scope

- Changing `useBulkServiceValidation` (it's correct; the bug is in the caller).
- Changing the "Services added — Validating…" toast wording.

