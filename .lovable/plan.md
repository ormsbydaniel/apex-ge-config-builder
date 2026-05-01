## Replace ⊕ toggle with directional chevrons

The advanced-options toggle on each property row currently uses `PlusCircle` for both states. Replace it with double-chevron icons that visually communicate expand vs. collapse:

- **Collapsed** (constant + not expanded) → `ChevronsRight` (»), suggests "expand to the right" since the row will widen to span both columns.
- **Expanded** (advanced panel open or non-constant mode) → `ChevronsLeft` («), suggests "collapse back".

### Change

`src/components/vectorStyle/ValueInput.tsx`

- Swap the import from `PlusCircle` to `ChevronsRight, ChevronsLeft`.
- In the `advancedToggle` button, render `ChevronsLeft` when `showAdvanced` is true, otherwise `ChevronsRight`.
- Update the tooltip label to "Collapse" / "Advanced" to match the icon's meaning.

No other files are affected.
