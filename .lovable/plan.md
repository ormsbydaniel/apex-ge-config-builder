
## Auto-validate on Save in the Add/Edit Service modal

### Behaviour

When the user clicks **Add Service** / **Save Changes**, run the same probe the **Validate** button uses, *before* the service is committed. The result drives the inline modal feedback the user already sees, then the modal closes and the service is saved as today (always succeeds — failure does not block save).

Net effect for the user:
- They no longer have to click Validate first.
- The inline ✓ / ✗ message flashes in the modal during save.
- The saved service ends up in the correct place: main list with green badge if reachable, "Invalid services" failures section at the bottom if not — identical card styling and badge to bulk-recheck failures (already wired via the existing post-save `recheck(serviceId)`).

If the user already clicked **Validate** and the URL hasn't changed since, skip the duplicate probe and reuse the existing `validateState` result — keeps save snappy.

### Flow

1. User clicks the primary button (Add Service / Save Changes).
2. If `validateState.status === 'ok' | 'error'` and URL+format are unchanged since that result → use it directly, skip re-probing.
3. Otherwise set `validateState` to `'checking'` (spinner + "Validating…" inline, primary button disabled and shows spinner), call `validateSingleService(...)`, write the result into `validateState` so the inline row shows ✓ or ✗.
4. Regardless of outcome, proceed with the existing save path (`onAddService` / `onUpdateService`), close the modal, and let the existing post-save `recheck(serviceId)` populate the bottom-of-page failures section if needed.
5. JSON-upload mode is unaffected — no probe runs (consistent with Validate button behaviour).

### Implementation

**Single file: `src/components/ServicesManager.tsx`.**

1. **`handleAddService`** — at the top, before the existing add/edit branching:
   - If `selectedFormat !== 'json-upload'` and URL is non-empty:
     - Determine `kind` and `ogcFormat` the same way `handleValidate` does today (extract a tiny `getProbeKind()` helper inside the component to avoid duplication).
     - If a fresh `validateState` result already matches the current URL+format, reuse it; otherwise `await validateSingleService(...)` with `validateState` flipped to `'checking'` during the call so the inline row updates.
   - Continue with the existing add/edit logic unchanged. Do **not** early-return on failure.

2. **Primary button** — while the in-save probe is running, show `Loader2` + "Saving…" and disable the button (reuse the existing `validateState.status === 'checking'` check so we don't need a new state flag).

3. **Track "last validated signature"** — small `useRef<{ url: string; format: string } | null>` updated whenever `validateSingleService` resolves (in both `handleValidate` and the new save-time probe). Used in step 1 to decide whether to skip re-probing.

4. **Reset** — clear the ref in `handleCancel` and in the existing `useEffect` that resets `validateState` on URL/format change, so a stale signature can't cause a skip.

### Out of scope

- Blocking save on validation failure (explicitly preserved — user may save deliberately).
- Changing the Validate button or its inline result UI (just reusing them).
- Touching `useBulkServiceValidation`, the failures section, or `serviceProbes.ts`.
- JSON-upload validation (handled by the upload parser).

### Files

- **Edit**: `src/components/ServicesManager.tsx` — add probe-on-save, reuse cache when fresh, reuse existing inline UI for feedback.
