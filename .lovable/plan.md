

## Footer Links Editor Redesign

### Overview
Move the Footer Links section inside the main Settings Card as a peer of "Navigation Settings" and "Branding", using an `<h3>` heading. Rewrite the modal as a two-page dialog: Page 1 lists links with reorder/remove/edit actions and an "Add Footer Link" button; Page 2 is the add/edit form for a single link. Saving on Page 2 returns to Page 1.

### Changes

**1. SettingsTab.tsx**
- Remove the separate Footer Links `<Card>` (lines 879-917)
- Add a new `<div>` section inside the main `<CardContent>` (after the last existing section, before the closing `</CardContent>`) with `<h3 className="text-lg font-semibold">Footer Links</h3>`
- Below the heading, show the badge-based preview of current links (same as now) and the "Edit Footer Links" button
- Keep the `FooterLinksEditorDialog` mount inside the same component

**2. FooterLinksEditorDialog.tsx — Two-page modal rewrite**
- Add a `page` state: `'list' | 'edit'`
- Add `editingIndex` state: `number | null` (null = adding new)
- Add `editForm` state: `LinkFormState` for the single link being edited

**Page 1 (List view):**
- Title: "Footer Links"
- Each link shown as a row: icon (Mail/ExternalLink), title, truncated URL, then Edit / Move Up / Move Down / Remove buttons
- "Add Footer Link" button at bottom → sets `editForm` to empty, `editingIndex = null`, switches to Page 2
- "Done" button in footer closes the dialog and calls `onSave`

**Page 2 (Add/Edit form):**
- Title: "Add Footer Link" or "Edit Footer Link" based on `editingIndex`
- Same form fields as current (type selector, label, URL or mailto fields with cc/subject/body)
- "Cancel" → returns to Page 1 without changes
- "Add" / "Update" button → inserts new link at end of list (add) or updates in-place (edit), then returns to Page 1

**Key behaviours:**
- On dialog open, `page` resets to `'list'`
- Reorder arrows work on Page 1 directly against the local `links` array
- `onSave` is called only when closing from Page 1 (via "Done"), converting all `LinkFormState` entries to `FooterLink` objects
- Mailto URL parsing/reconstruction logic unchanged

### Technical Notes
- The `links` state (array of `LinkFormState`) remains the source of truth within the dialog
- Page 2 operates on a separate `editForm` state so cancelling discards changes
- No schema, type, or context changes needed — only the two files above

