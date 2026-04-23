
## Auto-revalidate on save and surface invalid services in the failures list

### Problem

Today, when a user adds or edits a service via the modal, the service lands in the main configured-services list regardless of whether its URL is reachable. Invalid services display a generic "manual configuration required" message inline rather than being grouped with the post-"Re-check all" failures panel at the bottom of the page. The user wants parity: a freshly saved service that fails validation should appear in the same failures section, with the same card styling and badge messaging, as services that fail during a bulk recheck.

### Behaviour

1. **Save still always succeeds** — the user can save an invalid service intentionally (matches current "user knows better" stance for the Validate button).
2. **On save (Add or Edit)**, automatically trigger a single-service revalidation for the just-saved service. This is the same `recheck(serviceId)` path the bulk hook already exposes.
3. **If validation fails**, the service shows up in the existing **"Invalid services"** failures section at the bottom of the page (the one introduced alongside the "Re-check all" progress strip), with the same card styling, badge, and error message as bulk-recheck failures.
4. **If validation succeeds**, the card sits in the main list with its normal "ok" badge and resource count — no change from today's happy path.
5. The inline "manual configuration required" message in the main list stays for services that have *never* been validated (e.g. freshly imported config before bulk-validation completes), but a service that has just been saved-and-revalidated will have a definitive `error` status, so it falls into the failures section automatically.

### How it hooks into existing code

The bottom-of-page failures section is already driven by `useBulkServiceValidation`'s `statuses` map (services where `status === 'error'`). The fix is to make sure a freshly saved service gets a real `'error'` (or `'ok'`) status set in that map, instead of being left as `'idle'`.

`useBulkServiceValidation` already exposes `recheck(serviceId?: string)` which validates a single service when an id is passed and writes the result into `statuses`. `ServicesManager.tsx` already calls a deferred `recheck()` (no id, recheck all) after add. We tighten this to:

- After **Add**: call `recheck(newService.id)` once the new service is in `config.services`.
- After **Edit**: call `recheck(editingServiceId)` immediately after the patch dispatch.

This single-service recheck is cheap and matches the per-card behaviour of the existing failures list, so the saved service either gets a green badge in the main list or appears in the failures list at the bottom with the same styling everything else uses.

### Implementation

**Single file: `src/components/ServicesManager.tsx`.**

1. **`handleAddService`** — in the **add** branch: after `onAddService(newService)` and the existing deferred `recheck()` (which currently rechecks everything), change that deferred call to `recheck(newService.id)` so it specifically targets the new service. Keep the small `setTimeout` so the service is in `config.services` by the time the recheck reads it.

2. **`handleAddService`** — in the **edit** branch: after `onUpdateService(editingServiceId, patch)`, schedule `recheck(editingServiceId)` (same `setTimeout(0)` pattern) so the patched URL is picked up before the probe runs.

3. **No UI changes needed.** The failures section at the bottom already renders any service whose `statuses[id] === 'error'`, with the same card styling and badge as bulk-recheck failures. Once the recheck writes a real status into that map, the service will appear there automatically.

### Out of scope

- Removing the "manual configuration required" inline message for never-validated services — it still serves the cold-load case before bulk validation has run.
- Blocking save when validation fails — user can still save an invalid service deliberately.
- Changing the failures-section UI, badge styling, or messaging.
- Modifying `useBulkServiceValidation` — its existing `recheck(serviceId)` already does exactly what we need.

### Files

- **Edit**: `src/components/ServicesManager.tsx` — update post-save side effects in both add and edit branches of `handleAddService` to call `recheck(serviceId)`.
