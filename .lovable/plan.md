
# Add Custom Projection Dialog

## Overview

Add an "Add" button next to the CRS dropdown in the Settings tab. Clicking it opens a modal dialog where users can define a custom projection with three fields: Name (optional), CRS Code (required), and Proj4js Definition (required). The projection is saved to the config's `projections` array and also becomes selectable in the CRS dropdown.

## What You'll See

- A small "+" button appears to the right of the CRS dropdown
- Clicking it opens a dialog with:
  - **Name** input (optional)
  - **CRS Code** input (required, e.g. "EPSG:3035")
  - **Proj4js Definition** input (required, the proj4 string)
  - A note: "Copy Proj4js strings from https://epsg.io/"
  - Cancel and Add buttons
- After adding, the projection is stored in `config.projections` and appears as a selectable option in the CRS dropdown under a "Custom Projections" group

## Technical Details

### File: `src/components/config/SettingsTab.tsx`

1. **Import** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog`, and `Plus` icon from lucide-react
2. **Add state** for the dialog: `addProjectionOpen`, `newProjectionName`, `newProjectionCode`, `newProjectionDefinition`
3. **Add handler** `handleAddProjection` that dispatches `UPDATE_PROJECTIONS` with the new projection appended to existing `config.projections`
4. **Add "+" Button** next to the CRS `Select` (inside a flex wrapper), styled as a small outline/ghost button
5. **Add Dialog** with three Input fields, the epsg.io note as a helper text with a link, and Cancel/Add actions
6. **Update CRS Select** to show custom projections from `config.projections` in a separate "Custom Projections" group above the built-in options

### Layout change in the CRS section (lines ~424-458):

```text
<div className="flex items-center gap-2">
  <Select ...>  (existing, unchanged)
  <Button size="icon" variant="outline" onClick={open dialog}>
    <Plus />
  </Button>
</div>
```

### Custom projections in the Select dropdown:

```text
{config.projections?.length > 0 && (
  <>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Custom Projections</SelectLabel>
      {config.projections.map(p => (
        <SelectItem key={p.code} value={p.code}>
          {p.code}{p.name ? ` - ${p.name}` : ''}
        </SelectItem>
      ))}
    </SelectGroup>
  </>
)}
```

No other files need modification -- the `UPDATE_PROJECTIONS` action and schema support are already in place from the previous change.
