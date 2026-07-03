
## Goal

Bring the storymap **step card** (header + expanded body) into visual alignment with the **layer card** pattern: the same header rhythm, the same section anatomy (icon + LABEL + inline pencil edit + summary line), the same badge/pill styling, and the same right‑aligned action cluster.

The step card stays functionally the same — only presentation changes.

---

## 1. Header row (collapsed + expanded)

Match the layer card header:

- **Left group:** chevron → title only. Drop the "Step 1 of 8" prefix from the header line; move it to a tiny muted caption under the title, or into a small outline pill on the right (see badges).
- **Title:** same weight/size as layer title (`font-semibold text-sm`), single line, truncates.
- **Badge cluster (right of title, before actions):** convert the current filled/outline `<Badge>`s to the layer‑card **pill style** — rounded‑full, `border` + `bg-background`, `text-[11px]`, colored text token, small leading icon:
  - `Step 1/8` — neutral pill (replaces the muted "Step 1 of 8" text).
  - `Zoom 7 · [14.5, 47.5] · 500ms` **or** `Fit: <layer>` — pill with a small `Compass`/`Crosshair` icon; blue tint like layer "standard" pill.
  - `1 layer` — pill with `Layers` icon; same neutral tint.
  - Warnings `⚠ 3` — amber pill with `AlertTriangle`, keeps the existing tooltip.
- **Action cluster (far right):** keep the current Copy + Trash outline buttons, but standardise sizing/spacing to exactly match `LayerActions` (`h-7 w-7`, `gap-1`, same border tints). Add a subtle vertical divider before them like the layer card has.

Net effect: collapsed step card reads as `▸ Regional overview  ⟨standard-style pills⟩ … ✎ 📋 🗑`.

---

## 2. Section anatomy (expanded body)

The layer card organises the body as repeated blocks of:

```
<icon> LABEL (summary)   ✎
  └ compact summary line(s), muted
```

Refactor `StepEditor` sections to that anatomy. In read/summary mode each section shows the icon + LABEL + short summary + pencil to enter edit mode; the current inline form becomes the "edit" state of that block. Sections and their icons:

| Section              | Icon (lucide)      | Summary when collapsed                                  |
|----------------------|--------------------|---------------------------------------------------------|
| Description & Basics | `FileText`         | Title, ID, first line of description                    |
| Viewport             | `Compass`          | `Zoom 7 · [14.5, 47.5] · 500ms` or `Fit: <layer>`       |
| Layers               | `Layers`           | `Focus: <name>` + `N active`                            |
| Expand panels        | `PanelRightOpen`   | pill list of keys, or "None"                            |
| Per-layer controls   | `SlidersHorizontal`| `N controls` + first layer names                        |

Match the layer card's:
- Section header row: `flex items-center gap-2`, icon `h-4 w-4 text-muted-foreground`, LABEL `text-xs font-semibold uppercase tracking-wide`, `(summary)` in `text-muted-foreground text-xs`.
- Pencil button: `Ghost` `h-6 w-6` `Pencil` icon, right‑aligned via `ml-auto`.
- Section spacing: `space-y-4` between sections; a hairline `border-t` between sections (as layer card does), not per‑section `border-t pt-4` inside the editor.
- Nested chips (active layers, expand panels, warnings) reuse the same rounded‑full pill style as the header badges.

---

## 3. Badges / pills — unified style

Replace all step‑card `Badge variant="outline"` usages with the layer card's pill helper style:

```
inline-flex items-center gap-1 rounded-full border bg-background
px-2 py-0.5 text-[11px] leading-none
<Icon className="h-3 w-3" />
```

Tints follow the layer card semantics:
- **Neutral** (`text-foreground/70 border-border`) — Step counter, layer count.
- **Info blue** (`text-blue-600 border-blue-500/30 bg-blue-500/5`) — Viewport summary.
- **Amber** (`text-amber-600 border-amber-500/30 bg-amber-500/5`) — Warnings.

Constraint / control chips inside the expanded body use the same helper so nothing feels visually foreign.

---

## 4. Buttons & controls alignment

- Header action buttons: switch to the exact `Button` props used by `CardActionButtons` (`variant="ghost" size="icon"` with `h-7 w-7`, coloured hover states) instead of the current custom outline sizing, so they match the layer card 1:1.
- Inside the editor, replace the section‑level "Add" / "Add control" buttons with the layer card's inline `ghost` + `Plus` icon style, right‑aligned in the section header row, not on a separate line.
- Move the `Cancel` / `Save step` footer buttons up into the header pencil pattern: pencil toggles edit mode; edit mode shows a compact `✓ Save` and `✕ Cancel` pair at the top of the block, matching how the layer card commits inline edits.

---

## 5. Warnings surfacing

Layer cards inline warnings as an amber pill next to the section header and an amber caption under the offending field. Do the same:

- Header pill `⚠ 3` (already exists) stays.
- Per‑section header shows a small amber pill `⚠ N` when `warnings` mention that section's field prefix (`focusLayer`, `layers.active`, `controls[…]`).
- Field‑level messages keep their existing amber caption, restyled to `text-[11px] text-amber-600` with a `h-3 w-3` `AlertTriangle`.

---

## 6. Spacing / density

Adopt layer card metrics (from `mem://style/compact-layout-metrics`):
- Card padding: `py-2 px-3` on header (already close), `px-3 pb-3` on body.
- Between sections: `space-y-3`, `border-t` hairline.
- Between fields inside a section: `space-y-1.5`.
- Labels: `text-xs font-medium text-muted-foreground` (currently mixed).

---

## Files touched (implementation phase)

- `src/components/config/storymaps/SortableStepCard.tsx` — header restructure, badge helper, action cluster sizing.
- `src/components/config/storymaps/StepEditor.tsx` — section anatomy (icon + LABEL + summary + pencil), unified pill chips, inline add buttons, save/cancel placement.
- Possibly a small shared `StoryPill` helper (or reuse an existing layer‑card pill helper if one is exported) to guarantee identical pill styling.

No schema, validation, or business‑logic changes — this is purely a presentation alignment.
