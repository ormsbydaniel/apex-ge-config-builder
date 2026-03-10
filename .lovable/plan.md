

## Phase 1: Wire Existing Editor Dialogs into Layer Card Display Components

Phase 1 adds edit buttons to three display components that already have corresponding editor dialogs, allowing inline editing directly from the layer card.

### Changes Overview

**1. `LayerCategories.tsx`** — Add a pencil icon button next to the "Categories" header. When clicked, opens `CategoryEditorDialog`. New props: `categories` (already has), `onUpdate: (categories: Category[]) => void`, `layerName?: string`.

**2. `LayerColormapsDisplay.tsx`** — Add a pencil icon button next to the "Colormaps" header. When clicked, opens `ColormapEditorDialog`. New props: `onUpdate: (colormaps: Colormap[]) => void`, `metaMin?: number`, `metaMax?: number`.

**3. `LayerFieldsDisplay.tsx`** — Add a pencil icon button next to the "Fields" header. When clicked, opens `FieldsEditorDialog`. New props: `onUpdate: (fields: FieldsConfig) => void`, `sourceUrl?: string`, `sourceFormat?: string`.

**4. `LayerCardContent.tsx`** — Wire the new props through to each display component using the existing `handleUpdateMeta` handler:
- `LayerCategories`: `onUpdate` calls `handleUpdateMeta({ categories: newCategories })`
- `LayerColormapsDisplay`: `onUpdate` calls `handleUpdateMeta({ colormaps: newColormaps })`; pass `source.meta?.min` and `source.meta?.max` for colormap defaults
- `LayerFieldsDisplay`: `onUpdate` calls `handleUpdateMeta({ fields: newFields })`; extract first vector data source URL/format from `source.data`

### UI Pattern

Each display component's header line becomes:

```text
┌────────────────────────────────────┐
│ Categories (3)              ✏️     │
│ [badge] [badge] [badge]           │
└────────────────────────────────────┘
```

The pencil icon is a small ghost-style button (`variant="ghost" size="icon"`) using `Pencil` from lucide-react, placed inline with the section header via `flex items-center justify-between`.

### File Changes

| File | Change |
|------|--------|
| `src/components/layers/components/LayerCategories.tsx` | Add optional `onUpdate` + `layerName` props; import and render `CategoryEditorDialog` with pencil trigger |
| `src/components/layers/components/LayerColormapsDisplay.tsx` | Add optional `onUpdate`, `metaMin`, `metaMax` props; import and render `ColormapEditorDialog` with pencil trigger |
| `src/components/layers/components/LayerFieldsDisplay.tsx` | Add optional `onUpdate`, `sourceUrl`, `sourceFormat` props; import and render `FieldsEditorDialog` with pencil trigger |
| `src/components/layers/components/LayerCardContent.tsx` | Pass `onUpdate` callbacks and supporting props to the three display components; extract first vector source URL/format for fields |

All `onUpdate` props are optional so the display components remain backward-compatible as read-only when no handler is provided — the edit button simply won't render.

