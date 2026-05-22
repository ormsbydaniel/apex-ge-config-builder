---
title: Tips and shortcuts
status: draft
---
# Tips and shortcuts

Small UX details that are easy to miss but pay off once you know them.

## Tooltips

Most icon-only controls have descriptive tooltips. To keep the UI quiet
during normal use, tooltips follow two rules:

- **400 ms hover delay** before they appear, so glancing past a control
  does not flash a tooltip.
- **2-second auto-hide** while the cursor is still over the control, so
  the tooltip does not block what you are trying to read underneath.

Move off the control and back on to bring the tooltip back.

## Double-click to zoom to bounds

Anywhere a layer or data source has a known bounding box (COG, WMS layer,
GeoJSON, FlatGeoBuf, S3 object, STAC item), **double-click** the move
controls beside it to zoom the embedded preview straight to that
extent — no manual pan/zoom required.

This is the same gesture used in:

- The **GE Preview** tab when iterating on layer styling.
- The **STAC browser** item list.
- The **S3 browser** when previewing a COG.

## Compact move controls

The up / down / pin buttons next to layers and groups stack vertically in
the **compact** layout to keep wide cards readable on smaller windows.
The button hit area stays the same — only the visual stack changes — so
muscle memory carries over from the spacious layout.

## Unsaved changes guard

The builder tracks an `isDirty` flag on every editor dialog. If you try
to:

- Close a dialog with unsaved edits,
- Switch tabs while an editor is dirty,
- Load a different config without exporting first,

you will see a confirmation prompt rather than losing the work
silently. **Cancel** the prompt to return to the editor; **Discard** to
throw the edits away and continue.

## Keyboard

The builder relies on standard browser keyboard behaviour rather than
custom shortcuts:

| Key | Effect |
|-----|--------|
| `Tab` / `Shift+Tab` | Move between form fields and buttons. |
| `Enter` | Submit a focused form / confirm a dialog's primary button. |
| `Esc` | Close the topmost dialog or popover. |
| `Ctrl/Cmd+F` | Browser search — works against the JSON Config tab to find a key fast. |

## Working with long URLs

Service URLs, S3 paths, and STAC self-links are often very long. The UI:

- Truncates the middle of the URL with an ellipsis,
- Shows the full URL on hover,
- Clicks through to the original resource (or to an external STAC
  browser, where applicable).

See the relevant [signed URL handling](../data-sources/stac-browser.md)
notes if you are pasting pre-signed S3 URLs.
