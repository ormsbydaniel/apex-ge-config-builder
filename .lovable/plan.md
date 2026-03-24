

## Maximize File List Space in S3 Modal

### Problem
Multiple layers of padding, cards-within-cards, labels, and generous spacing consume significant vertical space, leaving limited room for the actual file list.

### Changes

**1. `src/components/form/S3LayerSelector.tsx` — Remove card wrapper, compact controls**

- Remove the outer `<Card>` / `<CardContent>` wrapper entirely — it's already inside a modal, so the extra card border and padding are redundant
- Remove `<Label>` elements above Search and Format Filter — use placeholder text instead
- Reduce `space-y-4` gaps to `space-y-2`
- Compact breadcrumb: reduce `px-3 py-2` to `px-2 py-1`
- Compact folder rows: reduce `p-3` to `p-2`
- Compact file rows: reduce `p-3` to `py-1.5 px-2`, tighten inner spacing
- Reduce the empty-state icon/padding size

**2. `src/components/layers/components/ServiceSelectionModals.tsx` — Compact service info**

- Reduce the service info card padding (`pt-4` → `py-2 px-3`)
- Remove `mb-2` from the icon/name row, make it inline with URL
- Collapse service name, badges, and URL into a single compact row
- Reduce `gap-4` between sections to `gap-2`
- Remove `DialogDescription` text (the service card already provides context)

### Estimated space savings
- ~40px from removing Card wrapper + its padding
- ~20px from removing labels
- ~16px from reducing gaps
- ~20px from compacting service info card
- ~8-12px per file row from tighter padding

Total: roughly 100-120px more vertical space for the file list, which at the current row height would show ~3-4 additional files.

### Files Modified
1. `src/components/form/S3LayerSelector.tsx`
2. `src/components/layers/components/ServiceSelectionModals.tsx`

