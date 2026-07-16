
## Scope

Bring `docs/stories/` up to date with the current Stories UI, which now models each step as a set of typed **actions** (Navigation, Layer display, Panels, Transition) rather than a fixed three-section layout, and adds a "copy to other steps" flow.

## What changed vs current docs

The current `docs/stories/index.md` describes the earlier UI. Notable gaps:

| Change in UI | Doc update needed |
| --- | --- |
| Step is now organised by **action sections** grouped into 4 categories: Navigation, Layer display (Active layers, Base map, Constraints), Panels, Transition. | Rewrite the "Step summary badges" / "Editing a step" area to describe action sections and the `+ Add …` empty-state buttons. |
| **Transition** is its own action section. `autoAdvance` was removed from the Content modal and lives behind its own editor. Empty state shows "Transition on Next / Previous click". | New subsection "Transitions (auto-advance)" with a screenshot of the Transition editor modal and the empty-state text. |
| **Base map** and **Constraints** are standalone actions inside "Layer display". | Add short subsections describing each. |
| **Copy to other steps** dialog: per-facet copy (navigation, baseLayer, activeLayers, constraints, panelState, transition, contentDescription) with merge strategies (Replace / Append for lists, Replace / Merge text into start / Merge text into end for descriptions). | New "Copying settings between steps" subsection with a screenshot. |
| Step JSON editor (`StepJsonEditorDialog`) for power users. | Brief mention with screenshot in "Editing a step". |
| Content modal no longer contains Auto-advance. | Remove that bullet from "Editing a step". |

Story-level dialog (Add story), Stories-tab card list, and URL / JSON reference sections are still accurate — leave prose alone; only refresh their screenshots so styling matches the rest.

## New / refreshed screenshots

Captured via Playwright against `http://localhost:8080` after loading the "Full screen storymap demo" example (so real content is on screen). All saved with `scripts/add-screenshot.sh` so they land in both `docs/assets/screenshots/` and `public/guide/assets/screenshots/`.

| Filename | What it shows | Replaces / new |
| --- | --- | --- |
| `stories-tab-overview.png` | Stories tab with the demo story expanded, showing Active badge and step list. | Refresh |
| `stories-step-expanded.png` | One step expanded, showing all four action categories including Transition. | Refresh |
| `stories-step-editor.png` | Content editor modal (now without Auto-advance). | Refresh |
| `stories-step-transition-editor.png` | Transition (auto-advance ms) modal. | New |
| `stories-step-base-map.png` | Base map action editor / summary badge. | New |
| `stories-step-constraints.png` | Constraints action editor / summary badge. | New |
| `stories-copy-to-steps.png` | Copy-to-other-steps dialog with facet checkboxes and strategy radio. | New |
| `stories-step-json-editor.png` | Raw JSON step editor dialog. | New |
| `stories-add-story-dialog.png` | Add story dialog. | Refresh only if styling drifted. |

If any of the "expanded step" or action editors can't be opened cleanly on the demo, I'll fall back to a smaller crop rather than shipping a broken image. Each screenshot is inspected before being copied into `docs/`.

## Doc changes (single file)

Rewrite `docs/stories/index.md` in place. New outline:

1. Intro (unchanged concepts, minor edit to reflect action model).
2. **Concepts** — extend with "Actions" and "Action category" definitions.
3. **The Stories tab** — same, refreshed screenshot.
4. **Step summary badges** — expand list to include Base map, Constraints, Transition badges.
5. **Editing a step**
   - Content (title / description / id).
   - Navigation.
   - Active layers.
   - Base map (new).
   - Constraints (new).
   - Panels.
   - Transition / auto-advance (new).
   - Editing raw JSON (new).
6. **Copying settings between steps** (new section, with facet + strategy table).
7. **Adding a story** — unchanged prose.
8. **URLs** — unchanged.
9. **JSON structure** — unchanged (link to reference).

No changes to `mkdocs.yml` (no new pages), and no changes to app code.

## Out of scope

- No changes to app source, schemas, or types.
- No rebuild of `public/guide/` HTML — that ships via the existing `./build-docs.sh --push` workflow when you next publish docs.
- No new pages; everything stays under `docs/stories/index.md` to keep the nav shape stable.
