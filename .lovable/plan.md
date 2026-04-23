

## Bug

`Add Dataset → From Service` crashes with "Rendered more hooks than during the previous render."

## Cause

In `src/components/layers/components/ServiceSelectionModals.tsx`, an early return runs *before* a hook:

```tsx
const [searchTerm, setSearchTerm] = useState('');
if (!service) return null;                                  // ← early return
...
const { isLoading } = useLazyServiceCapabilities(service, shouldLazyLoad);  // ← hook AFTER return
```

When the user opens the modal, `service` flips from `null` to an object, so the second render calls one more hook than the first → React throws.

## Fix

Move all hook calls above any conditional return, per Rules of Hooks.

1. Call `useLazyServiceCapabilities(service, shouldLazyLoad)` at the top of the component (alongside `useState`), passing the possibly-null service. The hook already handles `null` (`if (!enabled || !service) return;`), so this is safe — no behaviour change.
2. Compute `shouldLazyLoad` from the raw inputs (`isOpen`, `service?.sourceType`, `service?.url`) before the early return, instead of from `isS3Service`/`isStacService` derived after it.
3. Keep the `if (!service) return null;` guard, but place it *after* every hook call.

## Files touched

- `src/components/layers/components/ServiceSelectionModals.tsx` — reorder so all hooks (including `useLazyServiceCapabilities`) run before the `if (!service) return null` guard.

No other files affected. The lazy-load behaviour, S3/STAC skip logic, and UI remain identical.

