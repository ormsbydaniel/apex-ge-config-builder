

# CRS UI Refinement — Pills for Custom Projections

## Design

The CRS section gets split into two parts:

### 1. Default Map Projection (dropdown)
Same `Select` dropdown, relabelled **"Default Map Projection"**. Contains built-in projections plus any custom projections (in a grouped section). The "+" button moves away from here.

### 2. Custom Projections (pills below)
Below the dropdown, a **"Custom Projections"** label with a row of `Badge` pills. Each pill shows the projection code (and name if present) plus an **×** close button to remove it. An **"Add Custom Projection"** button (or small "+" pill) sits at the end of the row.

```text
Default Map Projection
┌─────────────────────────────────┐
│ EPSG:3857 - Pseudo-Mercator  ▼ │
└─────────────────────────────────┘

Custom Projections
┌──────────────────┐  ┌─────────────────────┐
│ EPSG:3035  ×     │  │ EPSG:32632  ×       │  [+ Add]
└──────────────────┘  └─────────────────────┘
```

When empty: "No custom projections defined" in muted text, with the [+ Add] button.

## Changes to `src/components/config/SettingsTab.tsx`

1. **Remove** the "+" icon button from beside the dropdown (line ~499-508)
2. **Relabel** the CRS dropdown to "Default Map Projection"
3. **Add** a new subsection below the dropdown:
   - Label: "Custom Projections"
   - `flex flex-wrap gap-2` container with `Badge` pills (variant="outline") for each `config.projections` entry
   - Each pill: code + optional name, with an `X` icon button that calls `handleRemoveProjection(code)`
   - A small outline `Button` at the end: `+ Add Custom Projection` → opens existing dialog
4. **Add** `handleRemoveProjection(code: string)`:
   - Filters `config.projections` to remove the entry
   - Dispatches `UPDATE_PROJECTIONS`
   - If removed code was the active `mapConstraints.projection`, resets to `EPSG:3857`
5. **Modify** `handleAddProjection` to **not** auto-select the new projection (remove line 176: `handleProjectionChange(newProjection.code)`)

No schema, type, or context changes needed — purely UI within SettingsTab.

