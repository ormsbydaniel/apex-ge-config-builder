# Compact Sort/Filter header controls

Convert the "Sort by" and "Filter by" dropdown triggers in the Healthcheck modal's **Data Access** and **Performance** column headers from text+icon buttons into compact **icon-only** buttons placed **to the right** of the column title, with tooltips explaining each action and an active-filter count badge.

## File
`src/components/config/CompleteLayersDialog.tsx`

## Changes (in `ColumnHeader` component, ~lines 556–630)

### 1. Layout: title + icons on one row
Replace the current stacked `flex flex-col gap-1.5` layout with a single horizontal row:

```text
Data Access   [↕]  [⚲ (n)]
```

```tsx
<div className="flex items-center gap-1.5">
  <span className="font-medium">{title}</span>
  <SortMenu />
  <FilterMenu />
</div>
```

The `<TableHead>` `align-top` and `w-[200px]` widths can stay as-is (or be reduced — see step 4).

### 2. Sort trigger → icon-only button + tooltip
- Remove the "Sort by" text label, keep only the `ArrowUpDown` icon.
- Wrap the trigger button in `Tooltip` / `TooltipTrigger` / `TooltipContent` (from `@/components/ui/tooltip`) with content `"Sort by {title}"`.
- Button styling: `variant="ghost" size="icon" className="h-6 w-6"` and `text-primary` when this column is the active sort, otherwise `text-muted-foreground`.
- The icon itself becomes `h-3.5 w-3.5`.

### 3. Filter trigger → icon-only button + count badge + tooltip
- Remove the "Filter by" text label.
- Show the `FilterIcon` only.
- When at least one filter option is **unchecked** (i.e. the user has narrowed results), append a small count in brackets next to the icon showing the number of hidden criteria, e.g. `⚲ (2)`. Use a small `<span className="text-[10px] ml-0.5">(2)</span>` next to the icon. The count is `filters.filter(f => !f.checked).length` (number of excluded values).
- When no filter is applied, show only the icon.
- Wrap in a `Tooltip` with content `"Filter {title}"` (or `"Filter {title} ({n} active)"` when filters are applied).
- Button: `variant="ghost" size="sm" className="h-6 px-1.5"` to accommodate the optional count text. `text-primary` when filters are active.

### 4. Imports
Add `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip` (TooltipProvider is already mounted at the app root via `App.tsx` shadcn convention; if not, wrap each tooltip locally).

The dropdown menu structure (`DropdownMenu`, `DropdownMenuContent`, sort/filter items) remains unchanged — only the **trigger buttons** become icon-only with tooltips.

### 5. Optional width tweak
With both controls now icon-only, the columns no longer need the extra width. Reduce both `w-[200px]` `<TableHead>` widths back to `w-[140px]` (Data Access) and `w-[130px]` (Performance) for a tighter table. Confirm with a quick visual check after implementation.

## Out of scope
- No changes to sort logic, filter state, dropdown menu items, or `sortedLayers` / `filteredLayers` memos.
- No changes to row rendering, `HomeTab`, or summary card.

## Technical detail summary
| Before | After |
|---|---|
| Stacked title above two text+icon buttons | Title with two icon-only buttons inline to the right |
| `[↕ Sort by]` `[⚲ Filter by (n)]` text triggers | `[↕]` `[⚲ (n)]` icon triggers with tooltips |
| Filter count showed visible items | Filter count shows applied/excluded criteria |
