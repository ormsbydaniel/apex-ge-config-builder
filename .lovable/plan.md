

## Fix Modal Height & Replace Back Button with Link

### Changes

**`src/components/layers/components/LayerDescriptionAttributionDisplay.tsx`**

1. **Fixed modal height**: Add `h-[480px] flex flex-col` to `DialogContent` so the modal stays the same size for both views. Wrap the inner content in a `flex-1 overflow-y-auto` div.

2. **Replace Back button with a link**: Remove the `DialogFooter` with the Back `Button` from the help view. Instead, add a `< Back` text link directly below the "Markdown Reference" title, using the same styling as "Tell me more" (small text, underline, primary color, with an `ArrowLeft` icon inline).

### Specific edits

- **Line 104**: Change `DialogContent` className to `"sm:max-w-[700px] h-[480px] flex flex-col"`
- **Lines 106-167** (help branch): After `DialogHeader`, add the `< Back` link as:
  ```tsx
  <button type="button" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline cursor-pointer" onClick={() => setShowHelp(false)}>
    <ArrowLeft className="h-3 w-3" /> Back
  </button>
  ```
  Wrap the table area in `<div className="flex-1 overflow-y-auto ...">`. Remove the `DialogFooter` with the Back button entirely.

- **Lines 169-218** (edit branch): Wrap content in `<div className="flex-1 overflow-y-auto">` to match the flex layout.

