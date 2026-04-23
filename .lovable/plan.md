
## Restore auto-populate of Service Name from URL for WMS/WMTS/WFS

### Problem

The Add/Edit Service modal currently only auto-populates the Service Name field for STAC services (debounced fetch in a `useEffect`). For WMS/WMTS/WFS the name field stays blank until the user types one, even though the GetCapabilities response contains a `Service > Title` (or `ows:ServiceIdentification > ows:Title`) that we already parse inside `useServices.parseGetCapabilities`. Previously the user saw that title appear in the Name field shortly after pasting the URL.

### Behaviour

After the user pastes/edits the **Service URL** in the modal, with a short debounce (matches the existing 600 ms STAC pattern):

- **STAC** — unchanged. Existing effect fetches the catalogue JSON and fills Name from `title`/`id`.
- **WMS / WMTS / WFS** — new behaviour. Fetch `GetCapabilities` for the URL, parse the service title, and fill the Name field if it is currently empty.
- **S3 / xyz / cog / geojson / flatgeobuf / json-upload** — no auto-name (no reliable title source), unchanged.

Rules consistent with the STAC effect:
- Only populate when the Name field is empty (never overwrite user input).
- Debounce 600 ms; abort in-flight fetch on URL/format change or unmount.
- Reuse the existing `autoNameLoading` flag so the small spinner next to the Name label appears during the lookup for OGC formats too.
- Errors are silent (no toast) — the user can still type a name manually, and the existing on-save validation will surface URL problems.

### Implementation

**Single file: `src/components/ServicesManager.tsx`**, and one tiny extraction so we don't duplicate XML parsing.

1. **Extract a shared title parser**. Add a small exported helper `parseGetCapabilitiesTitle(url, format)` in a new lightweight util (`src/utils/getCapabilitiesTitle.ts`) that:
   - Builds the `service=…&request=GetCapabilities&version=…` URL the same way `useServices.parseGetCapabilities` does.
   - Fetches with an `AbortSignal` (passed in from the caller).
   - Parses XML, returns `xmlDoc.querySelector('Service > Title, ows\\:ServiceIdentification > ows\\:Title')?.textContent?.trim() || null`.
   - Returns `null` on any error (no toasts — this is a best-effort UX helper).
   
   `useServices.parseGetCapabilities` keeps its full behaviour but can optionally call this helper for the title extraction so the selector lives in one place.

2. **Generalise the auto-name effect** in `ServicesManager.tsx` (currently lines 141–166):
   - Replace the `if (selectedFormat !== 'stac') return;` guard with a switch on `selectedFormat`:
     - `'stac'` → existing JSON fetch path.
     - `'wms' | 'wmts' | 'wfs'` → call `parseGetCapabilitiesTitle(url, selectedFormat, controller.signal)`; if it returns a non-empty string and `newServiceName` is still empty, `setNewServiceName(title)`.
     - Anything else → return (no-op).
   - Keep the same 600 ms debounce, `AbortController`, `autoNameLoading` toggle, and "only fill when empty" guard.
   - Dependency array stays `[newServiceUrl, selectedFormat]` (and `newServiceName` is intentionally read but not in deps, matching the existing STAC behaviour, to avoid re-firing on every keystroke in the Name field).

3. **No UI changes**. The existing small loading indicator next to the Name label already keys off `autoNameLoading`, so it'll show for OGC lookups automatically.

### Out of scope

- Auto-naming for S3/xyz/file-based formats (no reliable title source).
- Changing the on-save validation flow, the Validate button, or the failures section.
- Touching `useServices.parseGetCapabilities`'s capability fetching used during commit — that still runs and still populates layers; we're only adding a pre-commit, name-only lookup driven from the modal.

### Files

- **New**: `src/utils/getCapabilitiesTitle.ts` — small abortable helper that fetches `GetCapabilities` and returns the service title.
- **Edit**: `src/components/ServicesManager.tsx` — generalise the existing STAC auto-name `useEffect` to also handle `wms`/`wmts`/`wfs` via the new helper.
- **Edit (optional, minor)**: `src/hooks/useServices.ts` — reuse the same helper for the title selector inside `parseGetCapabilities` to keep the title selector in one place.
