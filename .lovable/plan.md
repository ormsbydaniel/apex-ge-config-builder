

# Add Export Button to Main Navigation Bar

## Overview

Add a compact Export button to the main navigation bar, positioned to the right of the Preview tab. This gives quick access to export from any tab without navigating back to Home.

## What You'll See

- A compact "Export" button with a download icon will appear on the right side of the main tab bar, next to the Preview button
- Clicking it performs a quick export (default options) -- same as the "Quick Export" action on the Home tab
- The button will be styled to fit naturally in the nav bar without looking like a tab

## Technical Details

### File: `src/components/ConfigBuilder.tsx`

**Changes:**
1. Import `Download` icon from lucide-react
2. Import `useConfigExport` from `@/hooks/useConfigIO`
3. Add `const { exportConfig } = useConfigExport();` in the component
4. Change the `TabsList` grid from `grid-cols-7` to `grid-cols-8` (or use a flex layout with the export button outside the grid)
5. Add an Export button after the Preview tab trigger, styled as a compact button rather than a tab trigger

**Approach:** Place the Export button *outside* the `TabsList` but visually inline with it using a flex wrapper. This avoids it behaving like a tab (since export is an action, not a view). The layout would be:

```text
[TabsList: Home | Layers | Draw Order | Services | Settings | JSON Config | Preview] [Export]
```

The wrapper div around TabsList becomes a flex container:
```
<div className="flex items-center gap-2 mb-6">
  <TabsList className="grid flex-1 grid-cols-7 bg-white border border-primary/20">
    ...existing tabs...
  </TabsList>
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => exportConfig()}
    className="flex items-center gap-1.5 bg-white border-primary/20 hover:bg-primary hover:text-primary-foreground"
  >
    <Download className="h-4 w-4" />
    Export
  </Button>
</div>
```

This keeps the export as a standalone action button that is always visible, doesn't interfere with tab navigation, and matches the nav bar styling. The existing Home tab export buttons remain unchanged for users who want the "Export with Options" flow.

