# "Update from catalogue" in the Description & Attribution modal

Adds a way to pull description/attribution text/URL from the matching APEx Algorithm Catalogue record into the algorithm's Description & Attribution modal.

## Behaviour

- Visible **only on algorithm cards** (the modal is shared with layers — layer cards see no change).
- Trigger: a small "Update from catalogue" button at the top of the modal body (next to or just under the title), enabled only when the workflow has both `serviceId` and `serviceProvider`.
- Clicking it switches the dialog body to a sub-view (similar to the existing Markdown help "Back" pattern) titled "Update from catalogue", with:
  - A short note: "Pull values from the matching APEx catalogue record."
  - Three checkboxes, all checked by default:
    - Description
    - Attribution text
    - Attribution URL
  - An "Apply" button and a "Back" link.
- On Apply: only the ticked fields overwrite the corresponding inputs in the main modal view (Description textarea, Attribution Text input, Attribution URL input). The user still has to click the modal's main **Save** to persist — Apply does not save automatically. This keeps it consistent with the rest of the modal and lets users review/tweak before committing.
- Loading state on the catalogue lookup; if the algorithm has no matching catalogue record show an inline message ("No matching record found in the APEx catalogue.") and disable Apply.
- If the catalogue record has no value for a ticked field, that checkbox is disabled with a muted label suffix "(not available)".
- Errors fetching the catalogue or provider URL show an inline error message; the modal stays open.

## Technical details

**File: `src/components/layers/components/LayerDescriptionAttributionDisplay.tsx`**
- Add optional props `catalogueLookup?: { serviceId: string; serviceProvider: string }`.
- When provided, render the "Update from catalogue" button and the new sub-view (alongside the existing markdown help sub-view — track via a `view: 'main' | 'help' | 'catalogue'` state).
- Catalogue sub-view fetches via `loadCatalogue()` from `src/lib/catalogue/apexCatalogue.ts`, matches on `provider === serviceProvider` and `record.id === serviceId` (fallback `algorithmId`).
- Resolves the provider URL via `resolveProviderUrl(entry)` (already async/cached upstream where used).
- Pulls description from `entry.record.properties.description` (already exposed as `entry.description`), attribution text from `entry.providerLabel` / mapped fields, and attribution URL from `resolveProviderUrl`.
- Apply only mutates local `description`, `attributionText`, `attributionUrl` state for ticked + available fields.

**File: `src/components/config/workflows/WorkflowCard.tsx`**
- Pass `catalogueLookup={{ serviceId: workflow.serviceId, serviceProvider: workflow.serviceProvider }}` to `LayerDescriptionAttributionDisplay`.

**No schema, type, or import-flow changes.** Existing import-time `serviceTitle` back-fill is unaffected.

## Out of scope

- Auto-saving when Apply is clicked (kept as an explicit Save click for consistency).
- Pulling fields other than description / attribution text / attribution URL.
- Adding the same button to layer cards.
