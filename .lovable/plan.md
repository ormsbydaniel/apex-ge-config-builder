# Stable 3-column header for the Healthcheck modal

Restructure the top of the Healthcheck modal (`CompleteLayersDialog`) into a 3-column grid so the live Results card stops resizing as layer names change length, sits at the top of the modal, and lives in a predictable middle column. Column 3 is left empty as a placeholder for an upcoming feature.

## File
`src/components/config/CompleteLayersDialog.tsx`

## Layout

Replace the current `<DialogHeader>` plus the Live Results card (which currently sits inside the table area and uses `ml-auto max-w-md`) with a single grid container at the top of `<DialogContent>`:

```text
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Layer Healthcheck    │       RESULTS        │                      │
│ Real-time validation │  Data Access  Perf   │  (reserved column)   │
│ of every layer's …   │  ✓ 8 Pass    ● 7 Good│                      │
│                      │  ◌ 1 Partial …       │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

Container:
```tsx
<div className="grid grid-cols-3 gap-4 items-start">
  {/* col 1 */} <DialogHeader …>…</DialogHeader>
  {/* col 2 */} <div className="flex justify-center">…results card…</div>
  {/* col 3 */} <div />
</div>
```

`items-start` keeps everything aligned to the top of the modal so the results card no longer drifts down vertically as it grows.

## Key changes

### 1. DialogHeader (col 1)
- Move into the new grid container.
- Add `text-left space-y-1`.
- Title and description content unchanged.

### 2. Results card (col 2) — fixed width, no jitter
- Remove the existing `mb-4 max-w-md ml-auto` placement above the table.
- Render inside `<div className="flex justify-center">` with the card itself sized `w-full max-w-sm` (≈384px) so its width is fixed regardless of layer name length.
- Card stays mounted whenever `isValidating || validationResults.size > 0` (unchanged).

Inside the card, restructure to **prevent resizing as layer names change**:

- Header row stays compact: left "RESULTS" label, right small `n / total ⟳` indicator (drop the word "Checking" — just show the fraction). Both have `shrink-0` so they never wrap.
- Move the "Currently: <name>" line to its **own row beneath the header**, full card width with `truncate`. To prevent vertical jitter when the name is briefly empty between layers, give the line a fixed minimum height (`min-h-[14px]`) and render `&nbsp;` as a placeholder when no current layer is set during a run. Only render this row at all while `isValidating` so the static post-run view stays compact.
- The two-column counter grid below remains identical to the home Results card layout.

### 3. Reserved column 3
Render an empty `<div />` to claim the third grid slot. Add an HTML comment `{/* reserved for future feature */}` so the next developer recognizes the slot.

### 4. Body container
Shift the existing `<div className="flex-1 overflow-hidden flex flex-col">` down (now sibling of the grid) and add `mt-4` for spacing under the header grid. Remove the now-unused mounting of the Results card from inside this body section.

## Out of scope
- No changes to validation logic, sorting, filtering, table rendering, or the home-page Results card.
- The placeholder column 3 has no content yet — purely structural.

## Technical notes
- The `Card`'s width is fixed by `w-full max-w-sm` inside a fixed-fraction grid column, so internal text length cannot grow the card.
- `truncate` on the "Currently:" row keeps long layer names on a single line with an ellipsis.
- `min-h-[14px]` + `&nbsp;` prevents the card height from flickering by one line as `currentLayer` toggles between values.
