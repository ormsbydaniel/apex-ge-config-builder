
# Sub-Group Color Scheme Change: Amber to Blue

## Overview

This plan updates all sub-group UI elements from an amber color scheme to a blue color scheme. The change affects card styling, buttons, badges, icons, drag handles, and text throughout the sub-group hierarchy.

## Files to Modify

Six files contain amber-colored sub-group styling:

| File | Element Types |
|------|---------------|
| `src/components/layers/components/SubInterfaceGroup.tsx` | Card borders, backgrounds, chevrons, title text, badges, add button, collapsible triggers |
| `src/components/layers/components/SortableSubInterfaceGroup.tsx` | Drag ring, drag handle hover state, grip icon |
| `src/components/layers/components/AddSubGroupDialog.tsx` | "Create New Layer" button, "Next" button, "Create Sub-Group" button |
| `src/components/layers/components/LayerGroup.tsx` | "Add Sub-Group" button |
| `src/components/form/UnifiedBasicInfoSection.tsx` | Sub-group chevron icon, "Create new sub-group" option, create button |
| `src/contexts/LayerDndContext.tsx` | Drag overlay card for sub-groups |

## Color Mapping

All amber colors will be replaced with their blue equivalents:

| Amber Class | Blue Replacement |
|-------------|------------------|
| `amber-50` | `blue-50` |
| `amber-100` | `blue-100` |
| `amber-300` | `blue-300` |
| `amber-400` | `blue-400` |
| `amber-500` | `blue-500` |
| `amber-600` | `blue-600` |
| `amber-700` | `blue-700` |
| `amber-900` | `blue-900` |
| `amber-950` | `blue-950` |

---

## Technical Section

### Detailed Changes by File

**1. SubInterfaceGroup.tsx (12 changes)**
- Line 132: Card `border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10` → `border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10`
- Line 154: Trigger hover `hover:bg-amber-100/50 dark:hover:bg-amber-900/20` → `hover:bg-blue-100/50 dark:hover:bg-blue-900/20`
- Lines 156, 158: Chevron icons `text-amber-600` → `text-blue-600`
- Line 161: Title `text-amber-700 dark:text-amber-500` → `text-blue-700 dark:text-blue-500`
- Line 170: Badge `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400` → `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
- Line 213: Add Layer button `text-amber-700 hover:bg-amber-100 border-amber-300` → `text-blue-700 hover:bg-blue-100 border-blue-300`
- Line 234: Content background `bg-amber-100/30 dark:bg-amber-950/20` → `bg-blue-100/30 dark:bg-blue-950/20`

**2. SortableSubInterfaceGroup.tsx (3 changes)**
- Line 51: Drag ring `ring-amber-500` → `ring-blue-500`
- Line 56: Handle hover `hover:bg-amber-100/50 dark:hover:bg-amber-900/30` → `hover:bg-blue-100/50 dark:hover:bg-blue-900/30`
- Line 59: Grip icon `text-amber-600/70` → `text-blue-600/70`

**3. AddSubGroupDialog.tsx (3 changes)**
- Line 160: Create New Layer button `text-amber-700 border-amber-300 hover:bg-amber-50` → `text-blue-700 border-blue-300 hover:bg-blue-50`
- Line 174: Next button `bg-amber-600 hover:bg-amber-700` → `bg-blue-600 hover:bg-blue-700`
- Line 190: Create Sub-Group button `bg-amber-600 hover:bg-amber-700` → `bg-blue-600 hover:bg-blue-700`

**4. LayerGroup.tsx (1 change)**
- Line 283: Add Sub-Group button `text-amber-700 hover:bg-amber-100 border-amber-300` → `text-blue-700 hover:bg-blue-100 border-blue-300`

**5. UnifiedBasicInfoSection.tsx (4 changes)**
- Line 218: Chevron icon `text-amber-500` → `text-blue-500`
- Line 226: Create new option `text-amber-600` → `text-blue-600`
- Line 239: Button styling `text-amber-700 border-amber-300 hover:bg-amber-100` → `text-blue-700 border-blue-300 hover:bg-blue-100`
- Line 291: Create button `bg-amber-600 hover:bg-amber-700` → `bg-blue-600 hover:bg-blue-700`

**6. LayerDndContext.tsx (3 changes)**
- Line 98: Card border `border-amber-500` → `border-blue-500`
- Line 99: Header background `bg-amber-50` → `bg-blue-50`
- Lines 101-102: Grip and title `text-amber-600`, `text-amber-700` → `text-blue-600`, `text-blue-700`

### Notes
- The QA warning indicators (AlertTriangle icons) at lines 190-192 in SubInterfaceGroup.tsx remain amber as they are semantic warning colors, not sub-group styling
- Same applies to line 254-255 in LayerGroup.tsx for warning stats
