

# Unsaved Changes Warning for Load, New, and Example Actions

## Overview

When you click **Load**, **New**, or **Example**, the app will now check if you have unexported changes. If so, a confirmation dialog appears: *"Your recent changes have not been exported and will be overwritten. Do you wish to continue?"* with **Cancel** and **Continue** options.

## How It Works

The app will track a simple "dirty" flag that turns on whenever you make any change (add/edit/remove layers, change settings, etc.) and turns off whenever you export. When Load, New, or Example is clicked, the flag is checked and the warning shown if needed.

---

## Technical Details

### 1. Add `isDirty` flag to ConfigContext (`src/contexts/ConfigContext.tsx`)

- Add `isDirty: boolean` to `ConfigState` (initial: `false`)
- Set `isDirty: true` on all mutation actions (UPDATE_VERSION, UPDATE_LAYOUT, UPDATE_DESIGN, UPDATE_THEME, UPDATE_INTERFACE_GROUPS, UPDATE_EXCLUSIVITY_SETS, REMOVE_EXCLUSIVITY_SET, UPDATE_MAP_CONSTRAINTS, ADD_SERVICE, REMOVE_SERVICE, ADD_SOURCE, REMOVE_SOURCE, UPDATE_SOURCE, UPDATE_SOURCES)
- Set `isDirty: false` on SET_LAST_EXPORTED, LOAD_CONFIG, and RESET_CONFIG

### 2. Create a reusable confirmation hook (`src/hooks/useUnsavedChangesGuard.ts`)

A small hook that:
- Reads `config.isDirty` from ConfigContext
- Exposes a function like `guardAction(callback)` that either runs the callback immediately (if not dirty) or sets state to show a confirmation dialog
- Exposes dialog state (`isOpen`, `onConfirm`, `onCancel`) for the consuming component to render an AlertDialog

### 3. Update HomeTab (`src/components/config/HomeTab.tsx`)

- Use `useUnsavedChangesGuard` hook
- Wrap `handleNewConfig`, the file input trigger (Load), and `handleLoadExample` with the guard
- Render an `AlertDialog` driven by the hook's state, with the warning message

### 4. Update ConfigSummary (`src/components/config/ConfigSummary.tsx`)

- Same pattern: wrap New and Load actions with the guard and add the AlertDialog

### 5. No changes to export flow

The existing `SET_LAST_EXPORTED` dispatch in the export hook will naturally clear the dirty flag.

