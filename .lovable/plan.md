# Add `serviceTitle` to algorithm config + clarifying code comment

## 1. Drop the "Workflow = Algorithm" comment

Add a short note at the top of the canonical type and schema so future contributors aren't confused:

- `src/types/dataSource.ts` — above `WorkflowItem` interface.
- `src/schemas/configSchema.ts` — above `WorkflowItemSchema` (the existing comment block already explains the shape; extend it).
- `src/components/config/workflows/WorkflowsTab.tsx` — one-line header comment.

Wording:
```
// NOTE: "Workflow" in code === "Algorithm" in the UI. Internal symbols and the
// persisted `workflows` config key are kept for backwards compatibility with
// existing config JSON. Rename UI labels only.
```

## 2. Add `serviceTitle` (string, optional) to workflow items

Per project guidelines, update in this order: schema → type → consumers.

### 2a. Schema (`src/schemas/configSchema.ts`)
Extend `WorkflowItemSchema` with `serviceTitle: z.string().optional()` next to `serviceId` / `serviceProvider`. `.passthrough()` already preserves unknown keys, but declaring it explicitly makes it part of the documented schema and round-trip-safe.

### 2b. Type (`src/types/dataSource.ts`)
Add `serviceTitle?: string;` to the `WorkflowItem` interface alongside `serviceId` / `serviceProvider`.

### 2c. Catalogue mapping (`src/lib/catalogue/types.ts` + `apexCatalogue.ts`)
- Add `serviceTitle?: string` to `MappedWorkflowFields`.
- In `mapRecordToWorkflowFields`, populate it from `record.properties?.title` (fallback: `entry.name`). This means selecting an algorithm from the catalogue auto-fills `serviceTitle`.

### 2d. Review/edit dialog (`src/components/config/workflows/dialogs/WorkflowFormDialog.tsx`)
- Add `serviceTitle` to local state, initialise from `initial`/`prefill` in the `useEffect`.
- **Review mode:** render a read-only `Service title:` inline row above `Service ID:` when present.
- **Edit mode:** add a `Service title` text input above `Service ID *` (optional field).
- Include `serviceTitle: serviceTitle.trim() || undefined` in the saved `WorkflowItem` (omit empty so we don't pollute JSON).

### 2e. Card display (`src/components/config/workflows/WorkflowCard.tsx`)
- Show `serviceTitle` as the card header `title` when set, falling back to `serviceId` (so the human-readable title surfaces in the list).
- Add a `Service title:` row in the Execution Details block, above `Service ID:`.

### 2f. JSON editor
The existing `WorkflowJsonEditorDialog` parses arbitrary JSON against the schema — no code change required once the schema accepts `serviceTitle`. Round-trip (import/export/JSON edit) works automatically via schema passthrough + the explicit field.

## 3. Verification
- `bunx tsc --noEmit` for type safety.
- Run `src/schemas/__tests__/workflowItemSchema.test.ts` and `src/hooks/__tests__/configRoundTrip.workflows.test.ts` to confirm round-trip still passes; no new tests needed unless you want one asserting `serviceTitle` survives.

## Out of scope
- No rename of `Workflow*` symbols (covered by the clarifying comment instead).
- No migration of existing configs — `serviceTitle` is purely additive and optional.
