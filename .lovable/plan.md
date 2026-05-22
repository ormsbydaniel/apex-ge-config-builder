# Custom bounding box for Zoom to Center

Two-phase delivery. Phase 1 lands the schema + plumbing only. Phase 2 (deferred) adds the UI in the Edit Controls modal.

## Target schema shape

```json
"zoomToCenter": { "extent": [0.0, 52, 1.0, 53.0] }
```

Existing boolean form (`"zoomToCenter": true`) must continue to work.

---

## Phase 1 — JSON / schema / pass-through

Goal: any config containing `zoomToCenter: { extent: [...] }` round-trips cleanly through import, validation, edit, export, layer copy/duplicate, the raw JSON editor, and the viewer hand-off — without any UI to set it yet (users can hand-edit JSON to exercise it).

### 1.1 Zod schema (`src/schemas/configSchema.ts`)
Widen `zoomToCenter` inside `ControlsSchema`:

```ts
zoomToCenter: z.union([
  z.boolean(),
  z.object({
    extent: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  }),
]).optional()
```

### 1.2 TypeScript types
Update the matching interface to:

```ts
zoomToCenter?: boolean | { extent: [number, number, number, number] }
```

Locate every `controls.zoomToCenter` type reference and update.

### 1.3 Validation hook (`src/hooks/useValidatedConfig.ts`)
Confirm nothing strips or coerces `zoomToCenter`. If sanitisation logic exists, allow the object form through unchanged.

### 1.4 Pass-through audit
Grep the codebase for every reader/writer of `controls.zoomToCenter` and confirm each path preserves the object shape:

- Config import (file upload, paste JSON)
- Config export (download / copy JSON)
- Raw JSON editor (parse + serialise round-trip)
- Layer copy / duplicate / move between sources
- ConfigContext reducer payloads
- Viewer iframe hand-off (preview)
- Any defaulting / normalisation utilities

For each call site, either no change is needed (passes through unknown) or update to handle `boolean | { extent }`. No truthy-only checks may silently drop the object.

### 1.5 Tests
Add a focused round-trip test that:

1. Parses a sample config containing `zoomToCenter: { extent: [0, 52, 1, 53] }` via `ConfigurationSchema`.
2. Re-serialises and re-parses it.
3. Asserts the extent array survives byte-for-byte.

Plus a duplicate-layer test if a helper exists in `src/utils/__tests__/`.

### 1.6 Out of scope for Phase 1
- No changes to `ControlsEditorDialog.tsx`.
- No new UI affordance for entering coordinates.
- No CRS handling, no map-pick.

---

## Phase 2 — UI (deferred, separate plan)

Edit Controls modal gets a "Custom" link next to the Zoom to Center checkbox that reveals four numeric inputs (xmin, ymin, xmax, ymax). Will be planned and approved separately once Phase 1 is verified.
