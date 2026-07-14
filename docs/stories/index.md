# Stories

Stories are guided, step-by-step map experiences. A story is an ordered
sequence of **steps**, and each step drives what the map shows: the camera
position, which layers are active, sidebar copy, and (optionally) the state
of the info panel.

At runtime users navigate through the steps with the previous / next
controls, and the URL reflects the current step (`/stories/{id}?step=3`).

## Concepts

- **Story** — a titled sequence of steps with an `id`, an optional
  Markdown description, an optional thumbnail, and an `Active` flag that
  makes the app open the story on load.
- **Step** — one frame of the story. Owns its own content (title +
  Markdown), a viewport target, a set of active layers, and optional
  panel state.
- **Active layers** — per-step list of layer sources to switch on, with
  optional opacity, blend, date, and constraint overrides.
- **Panel state** — optional info-panel configuration (focus layer,
  which control sections are expanded / locked, and which tab is
  active). Omit `panelState` to hide the info panel for a step.
- **Layout variant** — `fullscreen` renders story content as a map
  overlay; `standard` renders it in the sidebar. Set via
  `layout.design.variant` or the `?variant=` URL parameter.

## The Stories tab

The **Stories (beta)** tab lists every story in the config as a card. Each
card shows the title, step count, and an **Active** badge when the story is
the initial one.

![Stories tab overview](../assets/screenshots/stories-tab-overview.png)

The tab is hidden by default. Turn it on from **Settings → App settings →
Show Stories (beta) tab** while it is in beta.

From here you can:

- **Add story** (top right) — open the story dialog to create a new story.
- **Add step** (per story) — append a step to that story.
- **Edit** (pencil next to the title / description) — rename a story or
  edit its Markdown description.
- **Drag** (grip handle) — reorder stories, or reorder steps within a
  story.
- **Duplicate** / **Delete** (icons on the right of each step row).

## Step summary badges

Each step row summarises what the step does without expanding it:

- **Viewport** — `Fit: <layer id>`, `Zoom`, or a fitted extent.
- **Active layers** — count of layers switched on for the step.
- **Focus** — which layer is focused in the info panel.
- **Tab** — which info-panel tab opens (`overview`, `query`, `charts`, …).

Expand a step to see its content, navigation (viewport), active layers,
and panels sections. Each section has its own edit button.

![Expanded step showing content, navigation, active layers and panels](../assets/screenshots/stories-step-expanded.png)

## Adding a story

**Add story** opens a dialog with the story-level fields:

- **Title** — display name shown in the story browser.
- **Active** toggle — makes this the story the app opens on load. Only
  one story should be active at a time.
- **Description** — Markdown intro shown above the current step. Switch
  between **Edit** and **Preview**, or open the **Syntax Guide** for
  supported Markdown.
- **Thumbnail URL** — optional image for the story card in the viewer.
- **ID** — URL-safe slug auto-generated from the title; edit if you need
  a stable identifier (it is used in `/stories/{id}`).

![Add story dialog](../assets/screenshots/stories-add-story-dialog.png)

## Editing a step

Click the pencil in a step's **Content** section to edit its title,
Markdown body, ID, and optional auto-advance timer.

![Edit content dialog for a step](../assets/screenshots/stories-step-editor.png)

Fields:

- **Title** — heading shown in the story panel.
- **Description (markdown)** — body copy for this step. Supports the
  same Markdown as story descriptions, with **Edit**, **Syntax Guide**
  and **Preview** modes.
- **ID** — slug used in validation messages. Auto-derived from the
  title, editable.
- **Auto-advance (ms)** — when set, the story advances to the next step
  automatically after this many milliseconds. Ignored on the final step;
  cleared as soon as the user navigates manually.

Use the other sections on the expanded step row to configure:

- **Navigation** — the viewport target (fit a layer, fit an extent, or
  set a zoom / centre).
- **Active layers** — the layers switched on for the step, plus their
  per-step opacity, blend, date and constraint values.
- **Panels** — the info-panel state (focus layer, expanded / locked
  control sections, active tab).

## URLs

| URL                    | Behaviour                                     |
| ---------------------- | --------------------------------------------- |
| `/stories`             | Story browser listing all configured stories. |
| `/stories/{id}`        | Opens story `{id}` at step 1.                 |
| `/stories/{id}?step=3` | Opens story `{id}` at the third step (`step` is 1-based). |

When a story is marked **Active** the app redirects `/` to that story on
load, as long as stories are enabled in `layout.navigation.links`.

## JSON structure

Stories are stored under the top-level `stories` array in `config.json`.
The exported JSON is the source of truth — the Stories tab is a
structured editor over the same shape.

```json
{
  "stories": [
    {
      "id": "eo-4-ports",
      "title": "EO 4 Ports",
      "isActive": true,
      "description": "Explore outputs from the EO4 Ports project.",
      "steps": [
        {
          "id": "welcome",
          "content": {
            "title": "Welcome",
            "description": "Welcome to the **EO4 Ports demonstrator**."
          },
          "viewport": { "fitLayer": "open-streetmap", "duration": 500 },
          "activeLayers": []
        }
      ]
    }
  ]
}
```

See the full field-by-field reference in
[Reference → JSON schema](../reference/json-schema.md), and try the
demo config from **Load → Examples → Full screen storymap demo**.
