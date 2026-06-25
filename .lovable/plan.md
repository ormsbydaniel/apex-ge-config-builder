# App-level settings cog (top-right)

Add a small, discreet settings gear at the very top right of the Configuration Builder, sitting above the existing Export pill. Clicking it opens a modal of **app preferences** stored in `localStorage` only — never written to the JSON config. The first (and only, for now) preference is **"Show dev versions in preview"**, off by default; when on, non-semver viewer bundles (e.g. `dev-3-6-0-candidate`, `dev-interface-groups`) appear in the Preview version picker.

## What we'll build

1. **`src/hooks/useAppSettings.ts`** — single source of truth for app-level prefs.
   - Shape: `{ showDevViewerVersions: boolean }` (extensible).
   - Stored under one `localStorage` key (`apex-config-builder-app-settings`) as JSON.
   - Exports `useAppSettings()` returning `{ settings, setSetting, resetSettings }`.
   - Uses `useSyncExternalStore` + a tiny in-module pub/sub so cog and Preview both see updates without prop drilling.
   - Tolerant of missing/corrupt JSON (falls back to defaults).

2. **`src/components/app-settings/AppSettingsDialog.tsx`** — modal UI.
   - shadcn `Dialog` titled "Application settings", description: "These preferences are stored in your browser only and do not affect the exported configuration."
   - One checkbox row for now: **Show dev versions in preview** with helper text "By default the Preview tab only lists official semver viewer releases. Enable this to also list development / candidate bundles."
   - Toggles apply immediately (no save button); a single "Done" closes the dialog.
   - Layout designed so adding future checkboxes is a one-liner.

3. **Settings cog in `src/components/ConfigBuilder.tsx`**
   - Discreet `Settings` (lucide) icon button placed above the existing Export pill, right-aligned in the header column that already contains the User Guide / Export toolbar.
   - Styling: `h-4 w-4`, `text-white/40 hover:text-white/80`, transparent background, no border.
   - `aria-label="Application settings"` + tooltip "Application settings".
   - Opens `AppSettingsDialog` via local `useState`.
   - Existing User Guide / Export pill is left untouched.

4. **Wire the first setting into `src/pages/Preview.tsx`**
   - After `getAvailableViewerVersions()` resolves, filter using `useAppSettings`:
     - `showDevViewerVersions === false` → keep only entries matching `/^\d+\.\d+\.\d+$/` (same semver test already in `compareVersions`).
     - `true` → keep all.
   - Apply the same filter when picking the default/latest version so a dev bundle is never auto-selected for users who haven't opted in.
   - If a previously saved version is filtered out, fall back to the latest remaining semver (existing "version no longer exists" branch handles this).

## Files touched

- **New:** `src/hooks/useAppSettings.ts`
- **New:** `src/components/app-settings/AppSettingsDialog.tsx`
- **Edit:** `src/components/ConfigBuilder.tsx` — add cog above Export pill + mount dialog.
- **Edit:** `src/pages/Preview.tsx` — filter version list by the new setting.

## Non-goals

- No backend persistence; no per-user accounts.
- No changes to the exported JSON config schema, types, or validation.
- No reshuffling of the existing User Guide / Export toolbar.
- No additional checkboxes in this change.
