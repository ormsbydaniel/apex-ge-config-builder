

# Implementation Plan: Unified Interface Group + Sub-Group Dropdown

## Overview

Combine the separate Interface Group and Sub-Interface Group dropdowns into a single hierarchical dropdown. This simplifies the layer card form by reducing two fields to one while providing a cleaner visual hierarchy.

---

## Visual Design

### Current (Two Dropdowns)
```text
Interface Group *                    
[v Energy Analysis        ]          

Sub-Interface Group (optional)       
[v Wind Resources         ]  [+]     
```

### Proposed (Single Dropdown)
```text
Layer Placement *
[v Energy Analysis → Wind Resources    ]

┌─────────────────────────────────────────────┐
│ Soils                                       │
│ Soils → Greece                              │
│ Soils → Turkey                              │
│ ─────────────────────────────────           │
│ Vegetation                                  │
│ Vegetation → Forests                        │
│ Vegetation → Coastal                        │
│ ─────────────────────────────────           │
│ Marine                                      │
│ ─────────────────────────────────           │
│ + Create new sub-group...                   │
└─────────────────────────────────────────────┘
```

**Key Design Points:**
- Items without sub-groups appear as plain text (e.g., "Marine")
- Items with sub-groups use arrow notation (e.g., "Soils → Greece")
- Parent groups are shown to allow selecting just the group without a sub-group
- Visual separators between different interface groups for clarity
- "Create new sub-group" option at the bottom opens an inline popover

---

## Implementation Steps

### Step 1: Create Helper Type and Utility

**New type for combined options:**
```typescript
interface GroupPlacementOption {
  value: string;           // Encoded value: "groupName" or "groupName::subGroupName"
  label: string;           // Display text: "Soils" or "Soils → Greece"
  interfaceGroup: string;  // Original interface group
  subinterfaceGroup?: string; // Optional sub-group
  isSubGroup: boolean;     // Whether this is a sub-group option
}
```

**Value encoding:**
- Interface group only: `"Energy Analysis"`
- With sub-group: `"Energy Analysis::Wind Resources"` (using `::` separator)

### Step 2: Create Hook for Computing Options

**New file: `src/hooks/useGroupPlacementOptions.ts`**

This hook computes the flattened, hierarchical list of placement options:

```typescript
export const useGroupPlacementOptions = (
  interfaceGroups: string[],
  sources: DataSource[]
): GroupPlacementOption[] => {
  return useMemo(() => {
    const options: GroupPlacementOption[] = [];
    
    interfaceGroups.forEach(group => {
      // Add the parent group itself
      options.push({
        value: group,
        label: group,
        interfaceGroup: group,
        isSubGroup: false
      });
      
      // Find all sub-groups for this interface group
      const subGroups = new Set<string>();
      sources.forEach(source => {
        if (source.layout?.interfaceGroup === group && 
            source.layout?.subinterfaceGroup) {
          subGroups.add(source.layout.subinterfaceGroup);
        }
      });
      
      // Add sub-group options
      Array.from(subGroups).sort().forEach(subGroup => {
        options.push({
          value: `${group}::${subGroup}`,
          label: `${group} → ${subGroup}`,
          interfaceGroup: group,
          subinterfaceGroup: subGroup,
          isSubGroup: true
        });
      });
    });
    
    return options;
  }, [interfaceGroups, sources]);
};
```

### Step 3: Modify UnifiedBasicInfoSection

**File: `src/components/form/UnifiedBasicInfoSection.tsx`**

**Props changes:**
```typescript
interface UnifiedBasicInfoSectionProps {
  // Remove separate sub-group props, add combined approach
  interfaceGroup: string;
  subinterfaceGroup?: string;
  groupPlacementOptions: GroupPlacementOption[];  // NEW - precomputed options
  onGroupPlacementChange: (interfaceGroup: string, subinterfaceGroup?: string) => void;  // NEW
  // ... other existing props
}
```

**Replace the two dropdowns with single dropdown:**
```typescript
<div className="space-y-2">
  <Label htmlFor="layerPlacement">
    Layer Placement {required.interfaceGroup && '*'}
  </Label>
  <div className="flex gap-2">
    <Select
      value={encodeGroupPlacement(interfaceGroup, subinterfaceGroup)}
      onValueChange={handlePlacementChange}
    >
      <SelectTrigger className="flex-1">
        <SelectValue placeholder="Select placement..." />
      </SelectTrigger>
      <SelectContent>
        {groupedOptions.map((group, groupIdx) => (
          <React.Fragment key={group.interfaceGroup}>
            {groupIdx > 0 && <SelectSeparator />}
            {/* Parent group option */}
            <SelectItem value={group.interfaceGroup}>
              {group.interfaceGroup}
            </SelectItem>
            {/* Sub-group options with indentation */}
            {group.subGroups.map(subGroup => (
              <SelectItem 
                key={subGroup.value} 
                value={subGroup.value}
                className="pl-10 text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-amber-500" />
                  {subGroup.subinterfaceGroup}
                </span>
              </SelectItem>
            ))}
          </React.Fragment>
        ))}
        <SelectSeparator />
        <SelectItem value="__create_new__" className="text-amber-600">
          <span className="flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Create new sub-group...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
    {/* Keep the + button for quick sub-group creation */}
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" title="Create new sub-group">
        <Plus className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
  </div>
</div>
```

**Helper functions:**
```typescript
// Encode group + subgroup into single value
const encodeGroupPlacement = (group: string, subGroup?: string): string => {
  if (subGroup) {
    return `${group}::${subGroup}`;
  }
  return group;
};

// Decode value back to group + subgroup
const decodeGroupPlacement = (value: string): { interfaceGroup: string; subinterfaceGroup?: string } => {
  const parts = value.split('::');
  return {
    interfaceGroup: parts[0],
    subinterfaceGroup: parts[1] || undefined
  };
};

// Handle selection change
const handlePlacementChange = (value: string) => {
  if (value === '__create_new__') {
    setShowNewSubGroupInput(true);
    return;
  }
  const { interfaceGroup, subinterfaceGroup } = decodeGroupPlacement(value);
  onUpdate('interfaceGroup', interfaceGroup);
  onUpdate('subinterfaceGroup', subinterfaceGroup || '');
};
```

### Step 4: Update LayerCardForm

**File: `src/components/layer/LayerCardForm.tsx`**

Compute combined options and pass to UnifiedBasicInfoSection:

```typescript
import { useGroupPlacementOptions } from '@/hooks/useGroupPlacementOptions';

// In component:
const groupPlacementOptions = useGroupPlacementOptions(interfaceGroups, config.sources);

// Pass to UnifiedBasicInfoSection:
<UnifiedBasicInfoSection
  name={formData.name}
  description={formData.description}
  interfaceGroup={formData.interfaceGroup}
  subinterfaceGroup={formData.subinterfaceGroup}
  groupPlacementOptions={groupPlacementOptions}
  // ... other props
/>
```

### Step 5: Handle Create New Sub-Group

When user selects "+ Create new sub-group...", show an inline popover:

1. User selects parent group from a simple dropdown
2. User enters new sub-group name
3. On confirm, update both `interfaceGroup` and `subinterfaceGroup`

The popover content:
```typescript
<PopoverContent className="w-80">
  <div className="space-y-3">
    <h4 className="font-medium text-sm">Create New Sub-Group</h4>
    
    <div className="space-y-2">
      <Label>Parent Group</Label>
      <Select value={newSubGroupParent} onValueChange={setNewSubGroupParent}>
        <SelectTrigger>
          <SelectValue placeholder="Select parent group" />
        </SelectTrigger>
        <SelectContent>
          {interfaceGroups.map(group => (
            <SelectItem key={group} value={group}>{group}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    
    <div className="space-y-2">
      <Label>Sub-Group Name</Label>
      <Input
        value={newSubGroupName}
        onChange={(e) => setNewSubGroupName(e.target.value)}
        placeholder="Enter sub-group name"
      />
      {subGroupError && (
        <p className="text-xs text-destructive">{subGroupError}</p>
      )}
    </div>
    
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => setShowNewSubGroupInput(false)}>
        Cancel
      </Button>
      <Button size="sm" onClick={handleCreateSubGroup}>
        Create
      </Button>
    </div>
  </div>
</PopoverContent>
```

---

## Files Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useGroupPlacementOptions.ts` | **NEW** | Hook to compute hierarchical placement options |
| `src/components/form/UnifiedBasicInfoSection.tsx` | **MODIFY** | Replace two dropdowns with single hierarchical dropdown |
| `src/components/layer/LayerCardForm.tsx` | **MODIFY** | Use new hook, pass combined options |
| `src/hooks/useLayerCardFormPersistence.ts` | **NO CHANGE** | Already tracks both fields separately |
| `src/hooks/useLayerCardFormSubmission.ts` | **NO CHANGE** | Already handles both fields |

---

## Data Flow

### Example 1: Selecting Parent Group Only
1. User clicks dropdown, sees hierarchical list
2. User selects "Marine" (no sub-groups)
3. `handlePlacementChange("Marine")` called
4. Updates: `interfaceGroup = "Marine"`, `subinterfaceGroup = ""`

### Example 2: Selecting Sub-Group
1. User clicks dropdown
2. User selects "Energy Analysis → Wind Resources"
3. `handlePlacementChange("Energy Analysis::Wind Resources")` called
4. Decoded to: `interfaceGroup = "Energy Analysis"`, `subinterfaceGroup = "Wind Resources"`
5. Both fields updated

### Example 3: Creating New Sub-Group
1. User clicks dropdown, selects "+ Create new sub-group..."
2. Popover opens with parent selector and name input
3. User selects "Vegetation" and enters "Mediterranean"
4. On confirm: `interfaceGroup = "Vegetation"`, `subinterfaceGroup = "Mediterranean"`

---

## Visual Styling

**Dropdown items styling:**
- Parent groups: Regular text, normal padding
- Sub-groups: Indented (`pl-10`), with amber arrow icon, slightly muted text
- Separators: Between different parent groups for visual grouping
- Create option: Amber-colored text with plus icon

**Display value:**
- When only group selected: "Energy Analysis"
- When sub-group selected: "Energy Analysis → Wind Resources"

---

## Technical Notes

1. **Backward Compatibility**: The underlying form data structure (`interfaceGroup` and `subinterfaceGroup`) remains unchanged. Only the UI presentation changes.

2. **Separator Character**: Using `::` as separator since it's unlikely to appear in group names. Could validate against this during group creation if needed.

3. **Sorting**: Sub-groups are sorted alphabetically within each parent group for consistency.

4. **Empty State**: If no interface groups exist, show appropriate empty state or prompt to create one first.

5. **Form Validation**: Existing validation (requiring interface group) continues to work since the decoded `interfaceGroup` value is still set.

