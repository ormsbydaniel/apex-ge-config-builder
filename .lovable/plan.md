## Plan

Add two new toggles to the App Settings dialog to control tab visibility.

### Changes

1. **`src/hooks/useAppSettings.ts`**
   - Add `showAlgorithmsTab: boolean` (default `false`)
   - Add `showStorymapsTab: boolean` (default `false`)

2. **`src/components/settings/AppSettingsDialog.tsx`**
   - Add two new checkbox rows under the existing "Show dev versions in preview":
     - "Show algorithms tab"
     - "Show storymaps tab"

3. **`src/components/ConfigBuilder.tsx`**
   - Read settings via `useAppSettings`
   - Conditionally render the Algorithms and Storymaps `TabsTrigger`s (and guard their `TabsContent`)
   - If the currently active tab becomes hidden by a settings change, fall back to a safe default tab (e.g. Layers / first visible)

### Notes
- Defaults to hidden so existing users won't see the tabs until they opt in via the settings cog.
- Persistence already handled by the existing `useAppSettings` localStorage layer — no schema changes needed (these are app-local prefs, not JSON config).
