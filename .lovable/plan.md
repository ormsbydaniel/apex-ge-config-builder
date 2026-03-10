

## Redesign Controls Editor Dialog — Compact Checklist

**Goal**: Replace the two-column switch grid with a single-column compact checklist using checkboxes. Conditionally show the Timeframe dropdown only when Temporal Controls is checked (mirroring the Download URL pattern).

### Changes — `src/components/form/ControlsEditorDialog.tsx`

1. **Add Checkbox import** from `@/components/ui/checkbox`.

2. **Replace the 2-column switch grid** (lines 118-145) with a single-column list of checkbox rows:
   - Toggleable
   - Zoom to Center
   - Opacity Slider
   - Blend Controls
   - Constraint Slider
   - Temporal Controls
   - Download

   Each row: `<div className="flex items-center gap-2"><Checkbox .../><Label ...>Name</Label></div>`

3. **Conditional sub-fields** (indented below their parent checkbox):
   - **Temporal Controls** → when checked, show the Timeframe `Select` dropdown beneath it
   - **Download** → when checked, show the URL `Input` beneath it (already works this way)

4. **Auto-clear timeframe** when Temporal Controls is unchecked: set `timeframe` to `'None'`.

5. **Narrow the dialog** slightly: keep `sm:max-w-md` or reduce to `sm:max-w-sm` since single-column needs less width.

### Visual sketch

```text
┌─ Edit Controls ─────────────────┐
│                                 │
│  ☑ Toggleable                   │
│  ☐ Zoom to Center               │
│  ☑ Opacity Slider               │
│  ☐ Blend Controls               │
│  ☐ Constraint Slider            │
│  ☑ Temporal Controls            │
│     Timeframe: [Days ▾]         │
│  ☑ Download                     │
│     URL: [https://...]          │
│                                 │
│            [Cancel] [Save]      │
└─────────────────────────────────┘
```

