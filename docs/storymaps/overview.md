# Storymaps (Experimental)

Storymaps let a configuration ship guided, step-by-step tours over its map
layers. Phase 1 support is **schema-only**: the Config Builder validates the
JSON shape and round-trips `stories` through import, the JSON editor, and
export — but does not yet render a dedicated Storymaps UI (see the
"Storymaps" tab placeholder). Editor UI and viewer-side playback land in a
later phase.

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
| `expandPanels` | `("layers" \| "legend" \| "constraints" \| "info")[]` | Optional |
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
