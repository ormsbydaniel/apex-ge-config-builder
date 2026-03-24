

## Make Folders and Breadcrumbs More Obviously Clickable

### Changes — `src/components/form/S3LayerSelector.tsx`

**Breadcrumbs (lines 244-267):**
- Add `underline` decoration on non-active breadcrumb segments and the Root button (when not current)
- Use `text-primary` instead of `text-muted-foreground` for clickable segments
- Keep the active/last segment as `text-foreground font-medium cursor-default` (no underline)

**Folder rows (lines 281-289):**
- Add `underline` to folder name text
- Use `text-primary` color on the folder name to signal it's a link
- Add a subtle right-pointing chevron or arrow indicator at the end of each row

### Files Modified
1. `src/components/form/S3LayerSelector.tsx`

