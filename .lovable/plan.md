
# Implementation Plan: Add Sub-Group Wizard

## Overview

Transform the current single-step `AddSubGroupDialog` into a two-step wizard that:
1. **Step 1**: Define the sub-group name
2. **Step 2**: Select existing layers to move into the sub-group OR create a new layer

This improves the user experience for reorganizing existing layers into sub-groups, aligning with the implicit sub-group management approach.

---

## Visual Design

### Step 1: Define Sub-Group Name

```text
+-------------------------------------------------------------+
| Add Sub-Group to "Energy Analysis"                          |
+-------------------------------------------------------------+
|                                                             |
| Create a sub-group to organize layers within the            |
| "Energy Analysis" interface group.                          |
|                                                             |
| Sub-Group Name *                                            |
| [Wind Resources_____________________]                       |
|                                                             |
|                                     [Cancel]  [Next ->]     |
+-------------------------------------------------------------+
```

### Step 2: Select Layers

```text
+-------------------------------------------------------------+
| Add Sub-Group to "Energy Analysis"                          |
+-------------------------------------------------------------+
| Step 2: Select Layers for "Wind Resources"                  |
|                                                             |
| Select existing layers to move into this sub-group:         |
|                                                             |
| [ ] Wind Speed Analysis                                     |
| [ ] Wind Direction Data                                     |
| [ ] Solar Panel Coverage                                    |
| [ ] Hydro Analysis                                          |
|                                                             |
|           ~ or ~                                            |
|                                                             |
| [+ Create New Layer]                                        |
|                                                             |
|                           [<- Back]  [Cancel]  [Create]     |
+-------------------------------------------------------------+
```

**Behavior Notes:**
- Only layers that are NOT already in a sub-group are shown in the list
- If no ungrouped layers exist, only the "Create New Layer" option is shown
- "Create" button is enabled if at least one layer is selected OR if no layers exist (proceeds to create layer flow)
- "Create New Layer" immediately creates the sub-group and opens the layer form

---

## Implementation Steps

### Step 1: Update AddSubGroupDialog Props and State

**File: `src/components/layers/components/AddSubGroupDialog.tsx`**

**Add new props:**
```typescript
interface AddSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subGroupName: string, selectedLayerIndices: number[]) => void;  // CHANGED
  onCreateNewLayer: (subGroupName: string) => void;  // NEW - triggers layer creation
  parentInterfaceGroup: string;
  existingSubGroups: string[];
  availableLayers: Array<{ name: string; index: number }>;  // NEW - ungrouped layers in this interface group
}
```

**Add wizard state:**
```typescript
const [step, setStep] = useState<1 | 2>(1);
const [subGroupName, setSubGroupName] = useState('');
const [selectedLayers, setSelectedLayers] = useState<Set<number>>(new Set());
const [error, setError] = useState('');
```

### Step 2: Implement Step 1 UI (Name Input)

Keep the existing name input UI but change the button from "Add Sub-Group" to "Next →":

```typescript
// Step 1 content
{step === 1 && (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Create a sub-group to organize layers within "{parentInterfaceGroup}".
    </p>
    <div>
      <Label htmlFor="subGroupName">Sub-Group Name *</Label>
      <Input
        id="subGroupName"
        value={subGroupName}
        onChange={(e) => setSubGroupName(e.target.value)}
        placeholder="Enter sub-group name"
        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
      />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  </div>
)}
```

### Step 3: Implement Step 2 UI (Layer Selection)

Add a new step with checkboxes for layer selection:

```typescript
// Step 2 content
{step === 2 && (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Select existing layers to move into "{subGroupName}":
    </p>
    
    {availableLayers.length > 0 ? (
      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
        {availableLayers.map(layer => (
          <div key={layer.index} className="flex items-center space-x-2">
            <Checkbox
              id={`layer-${layer.index}`}
              checked={selectedLayers.has(layer.index)}
              onCheckedChange={(checked) => {
                const newSelected = new Set(selectedLayers);
                if (checked) {
                  newSelected.add(layer.index);
                } else {
                  newSelected.delete(layer.index);
                }
                setSelectedLayers(newSelected);
              }}
            />
            <Label htmlFor={`layer-${layer.index}`} className="cursor-pointer">
              {layer.name}
            </Label>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground italic">
        No ungrouped layers available. Create a new layer to start this sub-group.
      </p>
    )}
    
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
    
    <Button
      variant="outline"
      onClick={handleCreateNewLayer}
      className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create New Layer
    </Button>
  </div>
)}
```

### Step 4: Implement Navigation Logic

Add handlers for wizard navigation:

```typescript
const handleNext = () => {
  setError('');
  
  if (!subGroupName.trim()) {
    setError('Sub-group name is required');
    return;
  }
  
  if (existingSubGroups.includes(subGroupName.trim())) {
    setError('A sub-group with this name already exists');
    return;
  }
  
  setStep(2);
};

const handleBack = () => {
  setStep(1);
};

const handleCreate = () => {
  onAdd(subGroupName.trim(), Array.from(selectedLayers));
  handleClose();
};

const handleCreateNewLayer = () => {
  onCreateNewLayer(subGroupName.trim());
  handleClose();
};

const handleClose = () => {
  // Reset all state
  setStep(1);
  setSubGroupName('');
  setSelectedLayers(new Set());
  setError('');
  onOpenChange(false);
};
```

### Step 5: Update Footer with Step-Aware Buttons

```typescript
<DialogFooter>
  {step === 1 ? (
    <>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button onClick={handleNext} className="bg-amber-600 hover:bg-amber-700">
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={handleBack}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button 
        onClick={handleCreate} 
        className="bg-amber-600 hover:bg-amber-700"
        disabled={availableLayers.length > 0 && selectedLayers.size === 0}
      >
        Create Sub-Group
      </Button>
    </>
  )}
</DialogFooter>
```

### Step 6: Update LayerGroup Component

**File: `src/components/layers/components/LayerGroup.tsx`**

Update to pass available layers and handle the new callback signature:

```typescript
// Compute available layers for sub-group creation (ungrouped layers only)
const availableLayersForSubGroup = useMemo(() => {
  return ungrouped.map(item => ({
    name: item.source.name,
    index: item.index
  }));
}, [ungrouped]);

// Update handleAddSubGroup to handle layer selection
const handleAddSubGroup = (subGroupName: string, selectedLayerIndices: number[]): void => {
  if (onAddSubGroup) {
    onAddSubGroup(subGroupName, selectedLayerIndices);
  }
};

// Add handler for create new layer
const handleCreateNewLayerInSubGroup = (subGroupName: string) => {
  // This will be called when user chooses "Create New Layer"
  onAddLayer(groupName, subGroupName);
};

// Update AddSubGroupDialog usage
<AddSubGroupDialog
  open={showAddSubGroupDialog}
  onOpenChange={setShowAddSubGroupDialog}
  onAdd={handleAddSubGroup}
  onCreateNewLayer={handleCreateNewLayerInSubGroup}
  parentInterfaceGroup={groupName}
  existingSubGroups={existingSubGroups}
  availableLayers={availableLayersForSubGroup}
/>
```

### Step 7: Update LayerGroup Props Interface

**File: `src/components/layers/components/LayerGroup.tsx`**

```typescript
interface LayerGroupProps {
  // ... existing props
  onAddSubGroup?: (subGroupName: string, selectedLayerIndices: number[]) => void;  // CHANGED
  // ... rest of props
}
```

### Step 8: Update LayerHierarchy Handler

**File: `src/components/layers/LayerHierarchy.tsx`**

Update `handleAddSubGroup` to move selected layers:

```typescript
const handleAddSubGroup = (parentGroup: string, subGroupName: string, selectedLayerIndices: number[]) => {
  if (selectedLayerIndices.length > 0) {
    // Move selected layers into the sub-group
    const updatedSources = config.sources.map((source, idx) => {
      if (selectedLayerIndices.includes(idx)) {
        return {
          ...source,
          layout: {
            ...source.layout,
            subinterfaceGroup: subGroupName
          }
        };
      }
      return source;
    });
    
    updateConfig({ sources: updatedSources });
    
    toast({
      title: "Sub-Group Created",
      description: `"${subGroupName}" created with ${selectedLayerIndices.length} layer${selectedLayerIndices.length !== 1 ? 's' : ''}.`,
    });
  } else {
    // No layers selected - just expand and let user create a new layer
    toast({
      title: "Sub-Group Ready",
      description: `Add a layer to create the "${subGroupName}" sub-group.`,
    });
    onAddLayer(parentGroup, subGroupName);
  }
  
  // Expand the sub-group after creation
  const key = `${parentGroup}::${subGroupName}`;
  const newExpanded = new Set(expandedSubGroups);
  newExpanded.add(key);
  setExpandedSubGroups(newExpanded);
};
```

---

## Files Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/layers/components/AddSubGroupDialog.tsx` | **MODIFY** | Convert to 2-step wizard with layer selection |
| `src/components/layers/components/LayerGroup.tsx` | **MODIFY** | Pass available layers, update callback signature |
| `src/components/layers/LayerHierarchy.tsx` | **MODIFY** | Update handler to move layers into sub-group |

---

## Data Flow

### User Flow 1: Create Sub-Group with Existing Layers

1. User clicks "+ Add Sub-Group" on "Energy Analysis"
2. **Step 1**: User enters "Wind Resources" and clicks "Next"
3. **Step 2**: User sees list of ungrouped layers:
   - [x] Wind Speed Analysis
   - [x] Wind Direction Data
   - [ ] Solar Panel Coverage
4. User selects 2 layers and clicks "Create Sub-Group"
5. Both layers get `subinterfaceGroup: "Wind Resources"` added to their layout
6. "Wind Resources" sub-group appears with 2 layers

### User Flow 2: Create Sub-Group with New Layer

1. User clicks "+ Add Sub-Group" on "Energy Analysis"
2. **Step 1**: User enters "Geothermal" and clicks "Next"
3. **Step 2**: No ungrouped layers available (all already in sub-groups)
4. User clicks "+ Create New Layer"
5. Layer form opens with `defaultInterfaceGroup: "Energy Analysis"` and `defaultSubinterfaceGroup: "Geothermal"`
6. When layer is saved, "Geothermal" sub-group appears with the new layer

### User Flow 3: Cancel at Step 2

1. User clicks "+ Add Sub-Group" 
2. **Step 1**: User enters name and clicks "Next"
3. **Step 2**: User clicks "Cancel" or "Back"
4. Dialog closes or returns to Step 1 with state preserved

---

## Technical Notes

1. **Layer Filtering**: Only ungrouped layers (no `subinterfaceGroup` property) within the current interface group are shown in Step 2.

2. **State Reset**: When dialog closes (via Cancel or after creation), all state resets to initial values.

3. **Empty State**: If no ungrouped layers exist, the checkbox list is hidden and replaced with a message prompting to create a new layer.

4. **Button Enablement**: "Create Sub-Group" is disabled if there are available layers but none are selected. If no layers are available, it's enabled (will trigger new layer creation).

5. **Consistency**: The "Create New Layer" option uses the existing layer addition flow with pre-populated sub-group.
