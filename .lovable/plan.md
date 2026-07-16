## Swap `ChevronsRight` → `Forward` (blue) for copy affordances

Replace the double-chevron icon used for "copy to other steps" in all three places with Lucide's `Forward`, tinted blue to match the existing blue `Copy` button in the step header (`text-blue-600 hover:bg-blue-50` on a subtle blue-tinted border where a border is already in use).

### Files & edits

1. **`src/components/config/storymaps/actions/ActionsAndLayersSection.tsx`**
   - Import swap: `ChevronsRight` → `Forward`.
   - Row-level copy button (line ~107): render `<Forward className="h-3.5 w-3.5 text-blue-600" />`. Keep the button as `variant="ghost" size="icon"` (no border on inline row buttons) so only the glyph carries the blue accent — consistent with other ghost row icons.

2. **`src/components/config/storymaps/SortableStepCard.tsx`**
   - Import swap: `ChevronsRight` → `Forward` (keep `Copy` import untouched).
   - Step-header multi-facet copy button (line ~450): render `<Forward className="h-3 w-3 text-blue-600" />`. This button already sits next to the blue `Copy` step button (line 462, `border-blue-500/30 text-blue-600 hover:bg-blue-50`) — apply the same border/hover treatment so the two blue affordances read as a matched pair.

3. **`src/components/config/storymaps/StepEditor.tsx`**
   - Import swap: `ChevronsRight` → `Forward`.
   - Description copy button (line ~103): render `<Forward className="h-3.5 w-3.5 text-blue-600" />` on the existing ghost icon button. Keep it ghost (no border) to stay consistent with the neighbouring `Pencil` edit button; the blue tint alone conveys the copy family.

### Tooltip / aria text

No copy changes. Existing labels ("Copy to other steps", "Copy description to other steps", per-facet "Copy … to other steps") already describe the action clearly.

### Non-goals

- No change to the copy dialog itself, wiring, or the header `Copy` (duplicate-step) button.
- No change to icon sizing or button layout beyond the header-pair border alignment noted above.
