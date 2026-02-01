
# Double-Click Move Controls Implementation Plan

## Overview

This plan transforms the layer move controls from 4 buttons (Up, Down, Move to Top, Move to Bottom) into 2 buttons where:
- **Single click** = Move one position (up or down)
- **Double click** = Move to boundary (top or bottom)

This halves the horizontal footprint while preserving all functionality.

## Visual Change

```text
BEFORE (4 buttons in 2x2 grid):        AFTER (2 buttons stacked):
┌───┬───┐                              ┌───┐
│ ↑ │ ⇈ │                              │ ↑ │  Single: up, Double: to top
├───┼───┤                              ├───┤
│ ↓ │ ⇊ │                              │ ↓ │  Single: down, Double: to bottom
└───┴───┘                              └───┘
~24px wide                             ~12px wide
```

## Implementation Details

### File to Modify
`src/components/layers/components/LayerMoveControls.tsx`

### Approach

1. **Remove the second column of buttons** (Move to Top / Move to Bottom)

2. **Add double-click detection** using a timing-based approach:
   - Track last click timestamp in a `useRef`
   - If second click occurs within 300ms, treat as double-click
   - Otherwise, execute single-click action

3. **Update button titles** to indicate the dual functionality:
   - "Move up (double-click for top)"
   - "Move down (double-click for bottom)"

4. **Maintain the same props interface** - the component still accepts all 8 props, but the "move to top/bottom" actions are now triggered by double-click instead of separate buttons

### Code Logic

```text
Click Handler Flow:
┌─────────────────────────────────────────────────────────┐
│  User clicks Up button                                  │
│                                                         │
│  Is there a recent click (< 300ms ago)?                 │
│    ├─ YES → Clear timeout, call onMoveToTop()           │
│    │        Reset lastClickTime                         │
│    │                                                    │
│    └─ NO  → Set timeout for 300ms                       │
│             After timeout: call onMoveUp()              │
│             Store current time as lastClickTime         │
└─────────────────────────────────────────────────────────┘
```

### Accessibility Considerations

- **Title/tooltip updated** to inform users of the double-click behavior
- **aria-label** added for screen readers describing both actions
- **No functionality removed** - same operations remain available
- **Keyboard users** can still double-tap Enter/Space on focused button

### Edge Cases Handled

- If `canMoveToTop` is false but `canMoveUp` is true, double-click still attempts `onMoveToTop` (the parent decides if it's a no-op)
- The timeout is cleared on unmount to prevent memory leaks
- Disabled state still applies to both single and double-click

## Impact Analysis

| Location | Usage Count | Impact |
|----------|-------------|--------|
| `LayerGroup.tsx` | 2 (sub-groups + layers) | Width reduced |
| `SubInterfaceGroup.tsx` | 1 (layers in sub-group) | Width reduced |
| `BaseLayerGroup.tsx` | 1 (base layers) | Width reduced |
| `WorkflowsTab.tsx` | 1 (workflows) | Width reduced |
| `ConstraintSourcesTab.tsx` | 1 (constraints) | Width reduced |

**Total: 6 usages, all automatically benefit from the change with no code modifications needed at call sites.**

## Space Savings Summary

- **Per control**: ~12px width reduction (from ~24px to ~12px)
- **Nested layer scenario** (layer in sub-group in interface group):
  - Before: 3 controls × 24px = ~72px of buttons
  - After: 3 controls × 12px = ~36px of buttons
  - **Saves ~36px of horizontal space** for layer card content

---

## Technical Section

### Implementation Steps

1. Add `useRef` to track last click time and pending timeout
2. Create `handleClick` function with double-click detection logic
3. Replace `onClick` handlers with the new `handleClick` wrapper
4. Remove the second column of buttons (lines 51-72)
5. Update Tailwind classes to single column layout
6. Update button `title` attributes for discoverability
7. Add cleanup via `useEffect` to clear timeout on unmount

### Cleanup

The `ArrowUpToLine` and `ArrowDownToLine` imports can be removed since those icons are no longer displayed.
