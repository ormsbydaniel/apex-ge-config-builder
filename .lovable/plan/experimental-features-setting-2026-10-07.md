# Experimental features setting

## What changes
- Config Builder settings gets a new checkbox, **Experimental features** (off by default), described as: "Includes features that are under development and review and not intended for production use."
- The **Computed Composites** tab in the Multi-band visualisations gallery only appears when this is ticked.
- Layers that already have a saved computed composite still open and edit normally, so existing configs are never broken.

## Technical details
- `useAppSettings.ts`: add `showExperimentalFeatures: boolean` (default `false`).
- `AppSettingsDialog.tsx`: add the checkbox row matching existing ones.
- `CompositeGallery.tsx`: new `showComputed` prop; hide the Computed trigger and content when false.
- `RgbCompositeEditorDialog.tsx`: read the setting, pass `showComputed = setting || layer already has computed data`; if `homeTab` is `computed` while hidden, fall back to `rgb`.
- Docs: mention the setting in `docs/settings/overview.md` near the computed composite notes if present.
