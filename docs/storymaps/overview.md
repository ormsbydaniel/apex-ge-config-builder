# Storymaps (Experimental)

Storymaps let a configuration ship guided, step-by-step tours over its map
layers. The Config Builder validates the JSON shape, round-trips `stories`
through import, the JSON editor, and export, and now provides a **Storymaps**
tab for editing stories and their steps directly.

Enable the tab from **Config Builder settings → Show Storymaps tab**.
Viewer-side playback of storymaps is not yet implemented.

## Editing storymaps in the builder

Storymaps mirror the Layers tab: each **story** is a container (like an
interface group) whose header carries its own editable title + markdown
description, and each **step** inside a story is a draggable card (like a
layer card) that expands to reveal the full step editor.

- **Add story** — captures `id`, `title`, and a markdown `description`. The
  id is auto-slugged from the title and made unique within the config.
- **Reorder** — drag the grip on the story header, or on any step card.
- **Edit story info** — pencil / overflow menu on the story header opens
  the metadata dialog.
- **Add step** — appends a new step with sensible defaults inside the
  currently selected story.
- **Edit step** — click the step header to expand its editor, then Save.

Unresolved layer / constraint references surface as amber warning badges on
the step header and inline next to the offending field. Warnings never
block saving — they help authors catch drift from the underlying
`sources`.


## Top-level shape

```json
{
  "stories": [
    {
      "id": "austria-solar-intro",
      "title": "Austria Solar Potential",
      "description": "Markdown supported.",
      "steps": [ /* one or more StoryStep objects */ ]
    }
  ]
}
```

`stories` is optional. Existing configurations continue to validate unchanged.

## StoryStep

| Field | Type | Notes |
|---|---|---|
| `id` | string | Required, unique within a story |
| `title` | string | Required |
| `description` | string | Optional, Markdown |
| `focusLayer` | string | Optional — name of the primary layer for the step |
| `expandPanels` | `string[]` | Optional — viewer-defined panel identifiers |
| `layers.active` | `string[]` | Required — exact set of layers visible in the step |
| `viewport` | see below | Required |
| `controls` | `StoryStepControl[]` | Optional per-layer overrides |

## Viewport

Exactly one of the two shapes:

```json
{ "zoom": 7, "center": [14.5, 47.5], "duration": 500 }
```

```json
{ "fitLayer": "austria-solar-annual" }
```

`center` is `[longitude, latitude]`. `duration` is milliseconds and optional.

## StoryStepControl

```json
{
  "layer": "austria-solar-annual",
  "opacity": 0.8,
  "blend": false,
  "constraints": [
    { "label": "Elevation", "lower": 0, "upper": 4000 },
    { "label": "Altitudinal zones", "values": ["0_1000", "1001_2000"] },
    { "label": "Land Cover", "values": [10, 20, 30] }
  ]
}
```

- `opacity` is in `[0, 1]`.
- Each constraint selection references the constraint's `label` on the
  underlying source and must supply **either** `lower` + `upper`
  (continuous / combined) **or** a non-empty `values` array (categorical).
  Categorical values may be strings or numbers.

## Layer references

`focusLayer`, `layers.active[]`, and `controls[].layer` reference layers by
their source `name`. Cross-reference validation against the surrounding
`sources` is deferred to Phase 2 — Phase 1 validates shape only.
