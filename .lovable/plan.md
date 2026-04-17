

## Goal

Simplify the GitHub tab by removing the explicit "Use Repo" and "Refresh" buttons, showing only the **Repository** label + **Branch** picker by default. The repo input becomes hidden behind a small **Change ›** toggle next to the label.

## Current state (`src/components/config/LoadConfigDialog.tsx`)

The GitHub tab currently shows:
- Editable Repository text input
- Branch dropdown
- "Use Repo" button (applies repo change → triggers branch + tree fetch)
- "Refresh" button (re-fetches tree)

## Changes

**Default (collapsed) view:**
- Label row: `Repository (owner/name)` followed by a small muted-link **Change ›** button
- Below the label: read-only display of the current repo (e.g. `ESA-APEx/apex_geospatial_explorer_configs`)
- Branch dropdown remains visible
- No "Use Repo" or "Refresh" buttons

**Expanded view (after clicking Change ›):**
- Replace the read-only repo display with the editable text input
- Show a small **Apply** (or check icon) and **Cancel** (or x icon) inline next to the input
- Apply → commits the new repo, refetches branches + tree, collapses back to read-only
- Cancel → reverts the input value, collapses

**Auto-refresh behavior:**
- Branch change → automatically refetch tree (already happens via `useEffect`, keep as-is)
- Repo change (via Apply) → refetch branches, then tree
- Removing the manual Refresh button is safe because tree already auto-fetches when repo/branch change

## Implementation notes

- Add local state: `isEditingRepo: boolean`, `repoDraft: string` (working copy while editing)
- Keep existing `repo`, `branch`, `branches`, `tree` state and effects unchanged
- The `Change ›` link uses a small `Button variant="link" size="sm"` with chevron icon, matching the subtle style used elsewhere
- Layout stays within the existing fixed-height dialog; no height changes

## Files touched

- `src/components/config/LoadConfigDialog.tsx` — restructure the repo/branch row, remove Use Repo + Refresh buttons, add Change toggle and inline edit mode

