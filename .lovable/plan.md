
## Add a "Validate" button to the Add / Edit Service modal

### Behaviour

Add a **Validate** button to the modal footer (between Cancel and the primary Add/Save button) that lets the user check whether the URL works **before** committing the service. Result is shown inline above the footer so the user can see it without leaving the dialog.

**Available when**: any non-`json-upload` mode (Add or Edit), and `newServiceUrl.trim()` is non-empty.

**Disabled when**: URL empty, `json-upload` selected, or a validation is currently running.

### Validation logic

Reuse the same kind-aware probes the bulk validator uses, so behaviour matches what the cards show after save:

- **STAC** (`selectedFormat === 'stac'`): `fetch(url)` → expect JSON with `type` / `conformsTo` / `links` etc. Treat `ok` HTTP + parseable JSON as valid.
- **S3** (`selectedFormat === 's3'`): use existing `parseS3Url` + a HEAD/GET to the bucket listing endpoint. Treat 2xx/3xx as reachable.
- **OGC** (`wms` / `wmts` / `wfs`): GET the URL with `?service=…&request=GetCapabilities` appended (mirroring `useBulkServiceValidation`'s OGC probe). Treat XML response with no `ServiceException` as valid.

To avoid duplicating logic, **extract a single-service probe** from `useBulkServiceValidation`:

- New helper: `validateSingleService(url: string, kind: 'stac' | 'ogc' | 's3'): Promise<{ ok: boolean; message: string }>` in `src/hooks/useBulkServiceValidation.ts` (or a new `src/utils/serviceProbes.ts` if cleaner — preferred to keep the hook focused). Export it.
- The hook's existing per-kind probe functions get refactored to call this helper so there is exactly one implementation.

### UI

Modal footer becomes:

```
[ Inline result row, only when present ]
  ✓ Reachable — STAC catalogue responded (1 collection)
  ✗ Couldn't fetch capabilities — HTTP 404
  ⏳ Validating…

[ Cancel ] [ Validate ] [ Add Service / Save Changes ]
```

- Result row uses `text-emerald-600` for success, `text-destructive` for failure, `text-muted-foreground` for in-progress, all with appropriate lucide icons (`Check`, `AlertTriangle`, `Loader2`).
- Result clears automatically when the URL or Service Type changes (so a stale "valid" badge can't sit next to a freshly-edited URL).
- Validate button shows `Loader2` spinner + "Validating…" while in-flight.

### State (in `ServicesManager.tsx`)

```ts
const [validateState, setValidateState] = useState<
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string }
>({ status: 'idle' });
```

- `useEffect` watching `[newServiceUrl, selectedFormat]` resets it to `{ status: 'idle' }`.
- `handleCancel` resets it.
- After a successful Add/Save, modal closes so reset isn't strictly needed, but reset on close anyway for cleanliness.

### Out of scope

- Blocking save on a failed validation (user can still save — they may know better, e.g. CORS-only failures).
- Validating during the JSON/XML upload flow (already validated by the parser).
- Persisting the validation result onto the service object — bulk validation runs on save and updates the card badge as today.
- Changing the bulk validation hook's public API beyond extracting the shared probe helper.

### Files

- **Edit**: `src/components/ServicesManager.tsx` — add state, button, inline result, effect.
- **Edit (small refactor)**: `src/hooks/useBulkServiceValidation.ts` — extract single-service probe helper and re-use it internally; export it.
