

# Detailed Implementation Plan: SubinterfaceGroup UI Editor (Hierarchical Approach)

## Overview

Add a nested sub-group hierarchy within Interface Groups in the Map Layers UI. This enables a three-level organizational structure: **Interface Group → Sub-Interface Group → Layers**.

Sub-groups are **implicitly managed** - they are derived from the unique `subinterfaceGroup` values across layers within a parent group, rather than stored as a separate config array.

**Key addition**: Layers can be moved between sub-groups by editing the layer and selecting a different sub-group from a dropdown.

---

## Visual Design

### Map Layers Hierarchy

```text
+---------------------------------------------------------------------------------------------+
| > Energy Analysis                              [+ Add Layer] [+ Add Sub-Group] [Edit] [X]   |
+---------------------------------------------------------------------------------------------+
|                                                                                             |
|   +-----------------------------------------------------------------------------------------+
|   | > Solar Panel Coverage (regular layer - no sub-group)                           [^ v] |
|   +-----------------------------------------------------------------------------------------+
|                                                                                             |
|   +-----------------------------------------------------------------------------------------+
|   | > Wind Resources                      2 layers        [+ Add Layer] [Edit] [X]  [^ v] |
|   | ======================================================================================= |
|   |   +-------------------------------------------------------------------------------------+
|   |   | > Wind Speed Layer                                                          [^ v] |
|   |   +-------------------------------------------------------------------------------------+
|   |   +-------------------------------------------------------------------------------------+
|   |   | > Wind Direction Layer                                                      [^ v] |
|   |   +-------------------------------------------------------------------------------------+
|   +-----------------------------------------------------------------------------------------+
|                                                                                             |
|   +-----------------------------------------------------------------------------------------+
|   | > Hydro Analysis (regular layer - no sub-group)                                 [^ v] |
|   +-----------------------------------------------------------------------------------------+
+---------------------------------------------------------------------------------------------+
```

### Layer Edit Form - Sub-Interface Group Field

```text
+-------------------------------------------------------------+
| Basic Information                                           |
+-------------------------------------------------------------+
| Layer Name *                  | Interface Group *            |
| [Wind Speed Layer________]    | [v Energy Analysis      ]    |
|                                                             |
| Sub-Interface Group (optional)                              |
| [v Wind Resources             ]                             |
|   +-------------------------+                               |
|   | (none)                  |  <- Removes from sub-group    |
|   | Solar Resources         |                               |
|   | Wind Resources      [x] |  <- Currently selected        |
|   | Geothermal              |                               |
|   +-------------------------+                               |
|   | + Create new sub-group  |  <- Creates new sub-group     |
|   +-------------------------+                               |
+-------------------------------------------------------------+
```

The dropdown shows:
- "(none)" option to remove the layer from any sub-group
- All existing sub-groups within the currently selected interface group
- "+ Create new sub-group" option at the bottom to create a new sub-group inline

---

## Implementation Steps

### Step 1: Create SubInterfaceGroup Component

**New File: `src/components/layers/components/SubInterfaceGroup.tsx`**

A collapsible component similar to `LayerGroup` but for sub-groups, with distinct visual styling (amber/orange border instead of primary blue).

```typescript
interface SubInterfaceGroupProps {
  subGroupName: string;
  parentInterfaceGroup: string;
  sources: DataSource[];
  sourceIndices: number[];
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  // Sub-group actions
  onAddLayer: () => void;
  onRenameSubGroup: (oldName: string, newName: string) => void;
  onRemoveSubGroup: (subGroupName: string) => void;
  // Movement controls
  canMoveUp: boolean;
  canMoveDown: boolean;
}
```

**Key Features:**
- Collapsible header with amber/orange accent border (`border-amber-500/30`)
- Layer count badge
- QA status indicators (reuse `calculateQAStats`)
- "+ Add Layer" button - pre-populates both `interfaceGroup` and `subinterfaceGroup`
- Inline rename functionality (edit icon -> input field)
- Delete button with confirmation
- Contains layer cards belonging to this sub-group
- Uses existing `LayerCard` component for rendering layers
- Uses existing `LayerMoveControls` for layer movement within sub-group

---

### Step 2: Create AddSubGroupDialog Component

**New File: `src/components/layers/components/AddSubGroupDialog.tsx`**

A dialog for adding new sub-groups, similar to `AddInterfaceGroupDialog`.

```typescript
interface AddSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subGroupName: string) => boolean;
  parentInterfaceGroup: string;
  existingSubGroups: string[];
}
```

**Validation:**
- Name is required
- Name must be unique within the parent interface group

---

### Step 3: Create DeleteSubGroupDialog Component

**New File: `src/components/layers/components/DeleteSubGroupDialog.tsx`**

A confirmation dialog for deleting sub-groups with options to handle contained layers.

```typescript
interface DeleteSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroupName: string;
  parentInterfaceGroup: string;
  layerCount: number;
  onDelete: () => void;          // Delete sub-group and its layers
  onUngroup: () => void;         // Remove sub-group but keep layers in parent group
}
```

**Options when deleting:**
1. "Delete sub-group and layers" - removes sub-group and all its layers
2. "Ungroup layers" - removes `subinterfaceGroup` property, layers remain in parent interface group

---

### Step 4: Update LayerGroup Component

**File: `src/components/layers/components/LayerGroup.tsx`**

**Add new props:**
```typescript
interface LayerGroupProps {
  // ... existing props (lines 13-28)
  
  // NEW: Sub-group management
  onAddSubGroup: (subGroupName: string) => void;
  onRenameSubGroup: (oldName: string, newName: string) => void;
  onRemoveSubGroup: (subGroupName: string) => void;
  onUngroupSubGroup: (subGroupName: string) => void;
  onAddLayerToSubGroup: (subGroupName: string) => void;
  expandedSubGroups: Set<string>;
  onToggleSubGroup: (subGroupName: string) => void;
}
```

**Implementation Changes:**

1. Add "+ Add Sub-Group" button in header (next to "+ Add Layer" button at line 167-170)

2. Add state for sub-group dialog:
```typescript
const [showAddSubGroupDialog, setShowAddSubGroupDialog] = useState(false);
```

3. Group layers by `subinterfaceGroup` property:
```typescript
const { subGrouped, ungrouped } = useMemo(() => {
  const subGrouped: Record<string, Array<{source: DataSource, index: number}>> = {};
  const ungrouped: Array<{source: DataSource, index: number}> = [];
  
  sources.forEach((source, idx) => {
    const subGroup = source.layout?.subinterfaceGroup;
    if (subGroup) {
      if (!subGrouped[subGroup]) subGrouped[subGroup] = [];
      subGrouped[subGroup].push({ source, index: sourceIndices[idx] });
    } else {
      ungrouped.push({ source, index: sourceIndices[idx] });
    }
  });
  
  return { subGrouped, ungrouped };
}, [sources, sourceIndices]);
```

4. Update rendering in CollapsibleContent (lines 177-231):
   - Render ungrouped layers first using existing LayerCard rendering
   - Render `SubInterfaceGroup` components for each sub-group

---

### Step 5: Update LayerHierarchy Component

**File: `src/components/layers/LayerHierarchy.tsx`**

**Add sub-group expansion state:**
```typescript
// Sub-group expansion state - keyed by "parentGroup::subGroup"
const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(() => {
  if (navigationState?.expandedSubGroups) {
    return new Set(navigationState.expandedSubGroups);
  }
  return new Set();
});
```

**Add sub-group management handlers:**
```typescript
const handleAddSubGroup = (parentGroup: string, subGroupName: string) => {
  // Sub-groups are implicit - just trigger layer addition with subinterfaceGroup pre-set
  toast({
    title: "Sub-Group Ready",
    description: `Add a layer to create the "${subGroupName}" sub-group.`,
  });
};

const handleRenameSubGroup = (parentGroup: string, oldName: string, newName: string) => {
  // Update all layers in this sub-group
  const updatedSources = config.sources.map(source => 
    source.layout?.interfaceGroup === parentGroup && 
    source.layout?.subinterfaceGroup === oldName
      ? { 
          ...source, 
          layout: { ...source.layout, subinterfaceGroup: newName } 
        }
      : source
  );
  
  updateConfig({ sources: updatedSources });
  
  // Preserve expansion state
  if (expandedSubGroups.has(`${parentGroup}::${oldName}`)) {
    const newExpanded = new Set(expandedSubGroups);
    newExpanded.delete(`${parentGroup}::${oldName}`);
    newExpanded.add(`${parentGroup}::${newName}`);
    setExpandedSubGroups(newExpanded);
  }
};

const handleRemoveSubGroup = (parentGroup: string, subGroupName: string) => {
  // Remove all layers in this sub-group
  const updatedSources = config.sources.filter(source => 
    !(source.layout?.interfaceGroup === parentGroup && 
      source.layout?.subinterfaceGroup === subGroupName)
  );
  
  updateConfig({ sources: updatedSources });
};

const handleUngroupSubGroup = (parentGroup: string, subGroupName: string) => {
  // Remove subinterfaceGroup property but keep layers
  const updatedSources = config.sources.map(source => {
    if (source.layout?.interfaceGroup === parentGroup && 
        source.layout?.subinterfaceGroup === subGroupName) {
      const { subinterfaceGroup, ...restLayout } = source.layout;
      return { ...source, layout: restLayout };
    }
    return source;
  });
  
  updateConfig({ sources: updatedSources });
};

const toggleSubGroup = (parentGroup: string, subGroupName: string) => {
  const key = `${parentGroup}::${subGroupName}`;
  const newExpanded = new Set(expandedSubGroups);
  if (newExpanded.has(key)) {
    newExpanded.delete(key);
  } else {
    newExpanded.add(key);
  }
  setExpandedSubGroups(newExpanded);
};
```

**Compute sub-groups per interface group:**
```typescript
const getSubGroupsForInterfaceGroup = (groupName: string): string[] => {
  const subGroups = new Set<string>();
  config.sources.forEach(source => {
    if (source.layout?.interfaceGroup === groupName && 
        source.layout?.subinterfaceGroup) {
      subGroups.add(source.layout.subinterfaceGroup);
    }
  });
  return Array.from(subGroups);
};
```

**Pass new props to LayerGroup:**
```typescript
<LayerGroup
  // ... existing props
  onAddSubGroup={(subGroupName) => handleAddSubGroup(groupName, subGroupName)}
  onRenameSubGroup={(oldName, newName) => handleRenameSubGroup(groupName, oldName, newName)}
  onRemoveSubGroup={(subGroupName) => handleRemoveSubGroup(groupName, subGroupName)}
  onUngroupSubGroup={(subGroupName) => handleUngroupSubGroup(groupName, subGroupName)}
  onAddLayerToSubGroup={(subGroupName) => onAddLayer(groupName, subGroupName)}
  expandedSubGroups={new Set(
    Array.from(expandedSubGroups)
      .filter(key => key.startsWith(`${groupName}::`))
      .map(key => key.split('::')[1])
  )}
  onToggleSubGroup={(subGroupName) => toggleSubGroup(groupName, subGroupName)}
/>
```

---

### Step 6: Update UnifiedBasicInfoSection Component

**File: `src/components/form/UnifiedBasicInfoSection.tsx`**

**Add new props for sub-interface group:**
```typescript
interface UnifiedBasicInfoSectionProps {
  // ... existing props (lines 11-37)
  
  // NEW: Sub-interface group
  subinterfaceGroup?: string;
  availableSubinterfaceGroups?: string[];  // Sub-groups within selected interface group
  showSubinterfaceGroup?: boolean;
}
```

**Add sub-interface group dropdown after Interface Group dropdown (around line 122):**
```typescript
{showSubinterfaceGroup && (
  <div className="space-y-2">
    <Label htmlFor="subinterfaceGroup">Sub-Interface Group (optional)</Label>
    <Select
      value={subinterfaceGroup || '__none__'}
      onValueChange={(value) => onUpdate('subinterfaceGroup', value === '__none__' ? '' : value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a sub-group (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">(none)</SelectItem>
        {availableSubinterfaceGroups?.map((subGroup) => (
          <SelectItem key={subGroup} value={subGroup}>
            {subGroup}
          </SelectItem>
        ))}
        <SelectItem value="__create_new__">+ Create new sub-group</SelectItem>
      </SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">
      Group layers within their interface group
    </p>
  </div>
)}
```

**Handle create new sub-group inline:**
When user selects "+ Create new sub-group", show an inline input dialog or popover to enter the new sub-group name, then add it to the list and select it.

---

### Step 7: Update LayerCardForm Component

**File: `src/components/layer/LayerCardForm.tsx`**

**Add props for sub-interface group:**
```typescript
interface LayerCardFormProps {
  // ... existing props (lines 31-38)
  defaultSubinterfaceGroup?: string;  // NEW
}
```

**Compute available sub-groups based on selected interface group:**
```typescript
const { config } = useConfig();

// Get available sub-groups for the currently selected interface group
const availableSubinterfaceGroups = useMemo(() => {
  const subGroups = new Set<string>();
  config.sources.forEach(source => {
    if (source.layout?.interfaceGroup === formData.interfaceGroup && 
        source.layout?.subinterfaceGroup) {
      subGroups.add(source.layout.subinterfaceGroup);
    }
  });
  return Array.from(subGroups);
}, [config.sources, formData.interfaceGroup]);
```

**Pass to UnifiedBasicInfoSection (around line 277-287):**
```typescript
<UnifiedBasicInfoSection
  name={formData.name}
  description={formData.description}
  interfaceGroup={formData.interfaceGroup}
  interfaceGroups={interfaceGroups}
  subinterfaceGroup={formData.subinterfaceGroup}                    // NEW
  availableSubinterfaceGroups={availableSubinterfaceGroups}         // NEW
  showSubinterfaceGroup={true}                                       // NEW
  units={formData.units}
  timeframe={formData.timeframe}
  defaultTimestamp={formData.defaultTimestamp}
  onUpdate={handleFieldChange}
  showUnits={true}
/>
```

**Handle interface group change to clear sub-interface group:**
```typescript
const handleFieldChange = (field: string, value: any) => {
  updateFormData(field, value);
  
  // Clear sub-interface group when interface group changes
  if (field === 'interfaceGroup') {
    updateFormData('subinterfaceGroup', '');
  }
  
  // ... existing auto-switch logic for colormaps
};
```

---

### Step 8: Update Form Persistence Hook

**File: `src/hooks/useLayerCardFormPersistence.ts`**

**Add `subinterfaceGroup` to form data interface (line 7-36):**
```typescript
interface LayerCardFormData {
  // ... existing fields
  subinterfaceGroup: string;  // NEW
}
```

**Update hook signature (line 41-45):**
```typescript
export const useLayerCardFormPersistence = (
  editingLayer?: DataSource,
  isEditing: boolean = false,
  defaultInterfaceGroup?: string,
  defaultSubinterfaceGroup?: string  // NEW
)
```

**Update getInitialFormData for editing (around line 66-69):**
```typescript
return {
  // ... existing fields
  interfaceGroup: editingLayer.layout?.interfaceGroup || defaultInterfaceGroup || '',
  subinterfaceGroup: editingLayer.layout?.subinterfaceGroup || defaultSubinterfaceGroup || '',  // NEW
  // ...
};
```

**Update default for new layers (around line 119-122):**
```typescript
return {
  // ... existing fields
  interfaceGroup: defaultInterfaceGroup || '',
  subinterfaceGroup: defaultSubinterfaceGroup || '',  // NEW
  // ...
};
```

---

### Step 9: Update Form Submission Hook

**File: `src/hooks/useLayerCardFormSubmission.ts`**

**Add `subinterfaceGroup` to submission interface (line 6-35):**
```typescript
interface SubmissionFormData {
  // ... existing fields
  subinterfaceGroup: string;  // NEW
}
```

**Include subinterfaceGroup in layoutObject (around line 94-97):**
```typescript
const layoutObject: any = {
  ...(formData.interfaceGroup && { interfaceGroup: formData.interfaceGroup }),
  ...(formData.subinterfaceGroup && { subinterfaceGroup: formData.subinterfaceGroup }),  // NEW
  contentLocation: formData.contentLocation,
};
```

---

### Step 10: Update LayersTabContext

**File: `src/contexts/LayersTabContext.tsx`**

**Add sub-group-related properties to context:**
```typescript
export interface LayersTabContextValue {
  // ... existing properties
  defaultSubinterfaceGroup?: string;  // NEW
}
```

---

### Step 11: Update Layer Form Container/Handler

**File: `src/components/layers/LayerFormHandler.tsx`** (or equivalent)

Pass `defaultSubinterfaceGroup` through the component hierarchy when adding layers from a sub-group context.

---

## Files Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/layers/components/SubInterfaceGroup.tsx` | **NEW** | Collapsible sub-group component with amber styling |
| `src/components/layers/components/AddSubGroupDialog.tsx` | **NEW** | Dialog for adding new sub-groups |
| `src/components/layers/components/DeleteSubGroupDialog.tsx` | **NEW** | Confirmation dialog for deleting sub-groups |
| `src/components/layers/components/LayerGroup.tsx` | **MODIFY** | Add sub-group rendering and "+ Add Sub-Group" button |
| `src/components/layers/LayerHierarchy.tsx` | **MODIFY** | Track sub-group expansion, add management handlers |
| `src/components/form/UnifiedBasicInfoSection.tsx` | **MODIFY** | Add sub-interface group dropdown with create new option |
| `src/components/layer/LayerCardForm.tsx` | **MODIFY** | Compute available sub-groups, pass to form section |
| `src/contexts/LayersTabContext.tsx` | **MODIFY** | Add `defaultSubinterfaceGroup` |
| `src/hooks/useLayerCardFormPersistence.ts` | **MODIFY** | Track `subinterfaceGroup` in form state |
| `src/hooks/useLayerCardFormSubmission.ts` | **MODIFY** | Include `subinterfaceGroup` in layout object |

---

## Data Flow Examples

### Example 1: Adding a Layer to a Sub-Group via "+ Add Layer" Button

1. User clicks "+ Add Layer" on "Wind Resources" sub-group within "Energy Analysis"
2. `onAddLayerToSubGroup("Wind Resources")` is called
3. Layer form opens with:
   - `defaultInterfaceGroup`: "Energy Analysis"
   - `defaultSubinterfaceGroup`: "Wind Resources"
4. Form pre-populates both fields
5. On save, layer is created with:
   ```json
   {
     "name": "Wind Speed Layer",
     "layout": {
       "interfaceGroup": "Energy Analysis",
       "subinterfaceGroup": "Wind Resources",
       "contentLocation": "infoPanel",
       "layerCard": { "toggleable": true }
     }
   }
   ```
6. `LayerHierarchy` groups this layer under the "Wind Resources" sub-group

### Example 2: Moving a Layer Between Sub-Groups via Edit Form

1. User clicks "Edit" on "Wind Speed Layer" (currently in "Wind Resources" sub-group)
2. Layer form opens with current values:
   - Interface Group: "Energy Analysis"
   - Sub-Interface Group: "Wind Resources" (selected in dropdown)
3. User changes Sub-Interface Group dropdown to "Solar Resources"
4. On save, layer is updated with:
   ```json
   {
     "layout": {
       "interfaceGroup": "Energy Analysis",
       "subinterfaceGroup": "Solar Resources"
     }
   }
   ```
5. Layer moves from "Wind Resources" sub-group to "Solar Resources" sub-group in the UI

### Example 3: Removing a Layer from a Sub-Group

1. User edits a layer that's in a sub-group
2. User changes Sub-Interface Group dropdown to "(none)"
3. On save, layer is updated with `subinterfaceGroup` removed from layout
4. Layer now appears directly under the interface group (not in any sub-group)

### Example 4: Creating a New Sub-Group from Layer Form

1. User is editing/creating a layer in "Energy Analysis" group
2. User selects "+ Create new sub-group" from Sub-Interface Group dropdown
3. Inline input/popover appears asking for sub-group name
4. User enters "Geothermal" and confirms
5. "Geothermal" is selected in the dropdown
6. On save, layer is created with `subinterfaceGroup: "Geothermal"`
7. The "Geothermal" sub-group now appears in the UI (implicitly created)

### Example 5: Renaming a Sub-Group

1. User clicks edit icon on "Wind Resources" sub-group header
2. Inline input appears with current name
3. User types "Wind Analysis" and presses Enter
4. All layers with `subinterfaceGroup: "Wind Resources"` in "Energy Analysis" are updated to `subinterfaceGroup: "Wind Analysis"`
5. Expansion state is preserved

### Example 6: Deleting a Sub-Group

1. User clicks delete icon on "Wind Resources" sub-group (contains 2 layers)
2. `DeleteSubGroupDialog` shows with options:
   - "Delete sub-group and 2 layers"
   - "Ungroup layers (keep in Energy Analysis)"
3. If "Delete": removes all layers with that sub-group
4. If "Ungroup": removes `subinterfaceGroup` property from those layers, they remain visible directly under "Energy Analysis"

---

## Technical Notes

1. **Implicit Management**: Sub-groups are derived from layer data, not stored separately. This matches the config schema and avoids orphan sub-groups.

2. **Expansion State Keys**: Sub-groups use composite keys (`parentGroup::subGroup`) to ensure uniqueness across different interface groups.

3. **Visual Distinction**: Sub-groups use amber/orange styling (`border-amber-500/30`, `text-amber-600`) to differentiate from primary blue interface groups.

4. **Interface Group Change**: When changing a layer's interface group, the sub-interface group is automatically cleared since sub-groups are scoped to their parent group.

5. **Schema Already Supports**: The `subinterfaceGroup` property is already in types and Zod schema from the previous implementation.

6. **No Breaking Changes**: Existing configs without `subinterfaceGroup` continue to work - layers just appear directly in their interface group.

7. **Dropdown Population**: The sub-interface group dropdown dynamically shows only sub-groups that exist within the currently selected interface group.

