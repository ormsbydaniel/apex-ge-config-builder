## Consolidate attribute modes into a single "From field" flow

Replace the current "By field (match)" and "By field (interpolate)" mode entries with a single **"From field"** option, then progressively reveal field + method controls.

### New behaviour

```text
[ Label   Mode ▾ (Constant | From field | By zoom | Expression)   « ]
   when mode = From field:
   ┌─────────────────────────────────────────────────────────────────┐
   │ Field  [ name ▾ ]   Method [ Direct | When field equals … | Interpolate ▾ ] │
   │ ...method-specific editor (stops, default, etc.)...                          │
   └─────────────────────────────────────────────────────────────────┘
```

Rules:

1. **Field dropdown** appears immediately after picking "From field". Populated from the existing `fields` prop (already sourced from the first feature in the GeoJSON / FlatGeobuf — see `useFieldsEditorState` and `flatgeobufMetadata.ts`). No change to data sourcing.
2. **Method dropdown** appears only after a field is chosen. Options depend on `prop.type`:
   - **Direct** — use the raw field value as-is. Always available. Especially useful for label `text-value`.
   - **When field equals …** — discrete value mapping (replaces the prior "Match" wording). Always available.
   - **Interpolate** — only when `interpAvailable(prop.type)` (number / color).
3. The body of the editor (stops, default value, etc.) renders only after a method that needs it is chosen. Direct requires no further configuration.

### Data model change

`ValueModel` currently has no representation for "use the field's raw value". Add a third attribute mode:

```ts
| { kind: 'attribute'; field: string; mode: 'direct' }
```

Update `src/types/vectorStyle.ts`. In the OL flat-style serializer / parser under `src/utils/vectorStyle/`, serialize `direct` as `["get", field]` and parse `["get", <string>]` back to `{ kind: 'attribute', mode: 'direct', field }`.

### File-level changes

1. **`src/types/vectorStyle.ts`** — add `mode: 'direct'` variant to the `attribute` union.
2. **`src/utils/vectorStyle/`** (toFlat / fromFlat) — handle the new `direct` mode (`["get", field]`).
3. **`src/components/vectorStyle/ValueInput.tsx`**:
   - Collapse `Mode` enum to: `'constant' | 'attribute' | 'zoom' | 'expression'`.
   - Mode dropdown labels: `Constant`, `From field`, `By zoom`, `Expression`.
   - When mode is `attribute`, render Field select; once a field is chosen, render Method select (`Direct` / `When field equals …` / `Interpolate?`).
   - Switching method updates the underlying `ValueModel` while preserving `field`.
   - `summaryFor` updated, e.g. `From field: <name> — when field equals …`.
   - `MODE_LABEL` and `blankFor` updated; `blankFor('attribute', ...)` defaults to `direct` mode.
4. **No Zod schema changes** — flat-style arrays already accept `["get", field]`.

### Out of scope

- No change to how `fields` are detected.
- No change to chevron / collapsed-row behaviour.
- No change to `By zoom`, `Expression`, or `Constant`.
