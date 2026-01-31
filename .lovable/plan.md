
# Plan: Add "Load Example Config" Button

## Overview
Add a button to the Home tab that fetches and loads the example configuration from `/examples/test-config.json`. This allows users to quickly see a working configuration without having to import a file manually.

## Changes

### 1. Add URL Import Function to useConfigImport Hook
**File**: `src/hooks/useConfigImport.ts`

Add a new function `importConfigFromUrl` that:
- Fetches JSON from a given URL
- Reuses the existing validation and transformation logic
- Shows appropriate toast messages for success/failure

### 2. Add "Load Example" Button to HomeTab
**File**: `src/components/config/HomeTab.tsx`

Add a new button next to the existing Load/Export/New buttons that:
- Has a distinctive style (different colour to distinguish it from regular "Load")
- Fetches the example config on click
- Shows loading state while fetching
- Uses the new `importConfigFromUrl` function

## Button Placement

The button will be added to the existing button row in the Project card header, alongside Load, Export, and New buttons.

```text
+--------+  +--------+  +--------+  +--------------+
|  Load  |  | Export |  |  New   |  | Load Example |
+--------+  +--------+  +--------+  +--------------+
```

## Technical Details

### New Function in useConfigImport.ts

```typescript
const importConfigFromUrl = useCallback(async (url: string): Promise<{
  success: boolean;
  errors?: ValidationErrorDetails[];
  jsonError?: any;
}> => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const text = await response.text();
    // ... reuse existing parsing, validation, transformation logic
  } catch (error) {
    // ... error handling
  }
}, [dispatch, toast]);
```

### Button in HomeTab.tsx

```tsx
<Button 
  onClick={handleLoadExample}
  variant="outline"
  size="sm"
  className="h-9 w-[130px] ... border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
  disabled={config.isLoading}
>
  <FileText className="h-4 w-4 mr-2" />
  Example
</Button>
```

## User Experience

1. User clicks "Example" button
2. Button shows disabled/loading state briefly
3. Example config loads and replaces current config
4. Success toast appears: "Successfully loaded example configuration"
5. All tabs update to show the example data
