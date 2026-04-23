

## Persist validation results with a close button

### Current behaviour

The validation strip (`Checking STAC catalogues (N of M)…` etc.) only shows while `inFlightTotal > 0`. The moment all groups finish, the whole strip vanishes — so the user has no summary of what just happened.

### New behaviour

Once a validation run starts (manual **Re-check all**, recommended-services add, or auto-validation on tab visit), the strip stays visible **after** completion as a results summary, until the user dismisses it with an **X** button in its top-right corner.

### UI

While in flight (unchanged content, plus a dismiss button is hidden):
```
🔄 Checking STAC catalogues (2 of 3)…
🔄 Checking WMS / WMTS / WFS services (4 of 7)…
```

Once complete (each row swaps spinner for a tick / amber warn icon, X appears):
```
✓ STAC catalogues: 3 of 3 reachable                    [X]
⚠ WMS / WMTS / WFS services: 5 of 7 reachable (2 failed)
✓ S3 stores: 2 of 2 reachable
```

- Tick (green `Check` icon) when all in the group succeeded.
- Amber `AlertTriangle` when any failed, with `(N failed)` suffix.
- Only groups that had `total > 0` for this run are listed.
- X button (ghost icon, top-right of the panel) dismisses the strip. Starting a new run re-shows it.

### Implementation

**`src/components/ServicesManager.tsx`** (only file touched)

1. Track per-run group totals so the panel knows what was attempted, even after `inFlight` drops to 0:
   ```tsx
   const [runSummary, setRunSummary] = useState<{
     stac: { total: number; failed: number } | null;
     ogc:  { total: number; failed: number } | null;
     s3:   { total: number; failed: number } | null;
   } | null>(null);
   const [dismissed, setDismissed] = useState(true);
   ```

2. Detect the start of a run: when `inFlightTotal` transitions from 0 → >0, snapshot the per-group totals from `progress`, reset failed counts to 0, and `setDismissed(false)`.

3. While running, keep totals in sync (groups grow as the hook seeds them). Derive `failed` from `validationStatuses` filtered by group at render time (re-classify each service via the same `format`/`sourceType`/`parseS3Url` rules already used in the hook — extract a small local `classify()` helper so logic isn't duplicated long-term, or import it if exported from the hook).

4. Render condition: `!dismissed && runSummary && (any group has total > 0)`. Replace the existing `inFlightTotal > 0 &&` guard with this.

5. Per-row rendering:
   - If `progress[kind].inFlight > 0` → spinner + "Checking … (N of M)…" (current text).
   - Else if `runSummary[kind].total > 0` → tick or amber icon + "STAC catalogues: N of M reachable[, K failed]".

6. X button: positioned top-right of the panel (`absolute top-1 right-1` or flex header row), `Button variant="ghost" size="icon" className="h-6 w-6"`, calls `setDismissed(true)`. Hidden while `inFlightTotal > 0` so users don't dismiss mid-run.

7. Imports: add `X`, `Check`, `AlertTriangle` from `lucide-react` (Loader2 already imported).

### Out of scope

- Persisting the summary across tab switches or page reloads (in-memory only; closing & reopening the Services tab clears it).
- Showing the list of failed service names inline (users still see per-card amber badges with **Retry** for that detail).
- Changes to `useBulkServiceValidation` — all logic stays in the consumer.

