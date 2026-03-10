

## Add Controls Editor Dialog

Create a modal dialog for editing layer controls (toggleable, opacity, zoom, download, blend, constraints, temporal, timeframe), triggered by a pencil icon on the Controls section header.

### New File: `src/components/form/ControlsEditorDialog.tsx`

A dialog with:
- **Toggle switches** for: Toggleable, Zoom to Center, Opacity Slider, Blend Controls, Constraint Slider, Temporal Controls
- **Download** switch + conditional URL input field
- **Timeframe** select dropdown (None / Time / Days / Months / Years)
- Local state initialized from current source values; Save/Cancel buttons
- On save: calls `onUpdateLayout` for controls/toggleable changes and `onUpdateSource` for top-level `timeframe`

Props: `open`, `onOpenChange`, current `source` (to read controls/toggleable/timeframe), `onUpdateLayout`, `onUpdateSource` (for timeframe which lives on the source root)

Layout: Two-column grid of switches for compact presentation, download URL below if enabled, timeframe select at the bottom.

### Modified: `src/components/layers/components/LayerControlsDisplay.tsx`

- Add pencil icon button next to "Controls" header
- Add state for dialog open/close
- Accept new props: `onUpdateLayout`, `onUpdateSource`
- Import and render `ControlsEditorDialog`
- Remove the early `return null` when no controls exist — always show the section header so users can add controls via the pencil icon

### Modified: `src/components/layers/components/LayerCardContent.tsx`

- Pass `handleUpdateLayout` and a new `handleUpdateSource` (dispatches full source update for timeframe) to `LayerControlsDisplay`

### Data flow

```text
ControlsEditorDialog
  ├─ onUpdateLayout → updates layout.layerCard.controls + layout.layerCard.toggleable
  └─ onUpdateSource → updates source.timeframe (top-level field)
```

