

## Group Categories, Colormaps, Legends & RGB Composites Under "Data Visualisation"

### Current State
Categories, Colormaps, and Legend are rendered as independent top-level sections in the layer card. Each is conditionally hidden when empty (no way to add one if it doesn't exist).

### Proposed UI

```text
┌─ 🎨 Data Visualisation ──────────────────────────┐
│                                                    │
│  Categories (2)            ✏️                      │
│      🔴 Urban  🟢 Forest                          │
│                                                    │
│  Colormaps (1)             ✏️                      │
│      [viridis ramp] viridis 0-100 (10 steps)      │
│                                                    │
│  Legend - gradient         ✏️                      │
│      [gradient bar]                                │
│                                                    │
│  RGB Composites            ✏️                      │
│      (none defined)                                │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │ + Add Categories  + Add Colormap         │      │
│  │ + Add Legend      + Add RGB Composite    │      │
│  └──────────────────────────────────────────┘      │
└────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Parent section with `Eye` icon** — "Data Visualisation" uses the same header pattern (icon + label) as other sections, with `ml-6` on all child content.

2. **Always-visible sub-sections** — Categories, Colormaps, Legend, and RGB Composites are always shown (not hidden when empty). When empty, they display "(none defined)" in muted text.

3. **Add buttons row** — At the bottom of the section, compact `+ Add ...` buttons appear only for sub-sections that are currently empty. Clicking them opens the existing editor dialogs (CategoryEditorDialog, ColormapEditorDialog) or a new one for RGB Composites / Legend.

4. **Sub-section headers are lighter weight** — Use `text-xs font-medium text-muted-foreground uppercase tracking-wide` to distinguish them from top-level section headers. Each keeps its existing icon (Tags, Palette, LayoutGrid) at a smaller size.

### Files to Change

| File | Change |
|------|--------|
| `LayerCardContent.tsx` | Replace the three separate Categories/Colormaps/Legend blocks with a single `<LayerDataVisualisationSection>` component, passing source + handlers |
| **New:** `LayerDataVisualisationSection.tsx` | Parent component rendering the "Data Visualisation" header and four sub-sections. Contains "Add" buttons that open existing editor dialogs when sections are empty |
| `LayerColormapsDisplay.tsx` | Remove early `return null` — always render content (show "(none defined)" when empty). Remove the outer header (parent provides it) |
| `LayerCategories.tsx` | Same — remove early `return null`, remove outer header |
| `LayerLegendDisplay.tsx` | Same — remove early `return null`, remove outer header |
| **New:** `LayerRgbCompositesDisplay.tsx` | New sub-section component for RGB composite band configurations (initially just the empty state + add button wiring) |
| `src/types/dataSource.ts` | Add optional `rgbComposites` field to `DataSourceMeta` for future RGB composite configs |

### RGB Composites — Initial Scope

For this first pass, RGB Composites will be a placeholder sub-section with an "Add" button. The editor dialog and data model will be a follow-up feature. The type will be:

```ts
interface RgbComposite {
  name: string;
  red: number;    // band index
  green: number;
  blue: number;
}
```

### Section Order Within Data Visualisation

Categories → Colormaps → Legend → RGB Composites (matching current visual order, with RGB appended).

