

## Add Visual Separation Between Folders and Files

### Problem
Folders and files in the S3 browser list blend together with no clear visual boundary, making it harder to scan.

### Changes — `src/components/form/S3LayerSelector.tsx`

1. **Add a subtle divider** between the folders section and files section — insert a `<Separator />` (from `@/components/ui/separator`) or a simple `<div className="border-t" />` between the two `grid` blocks when both folders and files exist.

2. **Differentiate folder row styling** — give folder rows a slightly different background (`bg-muted/30`) and remove the per-row border that files have, so folders feel like a distinct "navigation" section vs. the "selectable items" section below.

3. **Differentiate file icon color** — change the file `<File>` icon from `text-primary` to `text-muted-foreground` so it contrasts with the folder `<Folder>` icon which stays `text-primary`.

4. **Add section micro-headers** — add tiny `text-[10px] uppercase tracking-wide text-muted-foreground` labels "Folders" and "Files" above each section within the scrollable area for explicit grouping.

### Files Modified
1. `src/components/form/S3LayerSelector.tsx`

