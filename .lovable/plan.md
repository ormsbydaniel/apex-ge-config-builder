
## Phase 2 — Storymaps UI

### UI analogy (final)

| Storymaps concept | Existing analogue                       | Notes                                                       |
|-------------------|-----------------------------------------|-------------------------------------------------------------|
| Story container   | Interface group (`SortableInterfaceGroup`) | Light shell: drag handle, label header, children slot.   |
| Story header      | *New* — a small "parent card" atop the group's children | Story's own editable title + markdown description. Interface groups don't have this; it's the one deliberate deviation. |
| Step              | Layer card (`SortableWorkflowCard` / layer cards) | Rich, draggable, click-to-expand card with the full step editor inside. |

Everything reuses dnd-kit + shadcn primitives already used by the Layers tab and Workflows tab.

### Tab shell (`StorymapsTab.tsx`)

```text
┌─ Card ───────────────────────────────────────────────────────┐
│ CardHeader: 📖 Storymaps                    [+ Add story]    │
│ CardContent:                                                 │
│   <DndContext (story reordering)>                            │
│     <SortableContext items=stories>                          │
│       SortableStoryGroup × N                                 │
│     </SortableContext>                                       │
│   </DndContext>                                              │
│   (empty state fallback)                                     │
└──────────────────────────────────────────────────────────────┘
```

Single-`Card` outer shell matches `WorkflowsTab`. `[+ Add story]` opens a small dialog capturing `id` (auto-slug from title, editable), `title`, and markdown `description`.

### SortableStoryGroup (Interface-Group-alike shell)

Structure mirrors `SortableInterfaceGroup`:

```text
┌ drag handle │ ▸ Story: "Austria Solar Potential"   [6 steps] [⋯] ┐
│             │                                                     │
│             │  ┌─ Story parent card ───────────────────────────┐  │
│             │  │ Title:       Austria Solar Potential          │  │
│             │  │ Description: (markdown editor)                │  │
│             │  └───────────────────────────────────────────────┘  │
│             │                                                     │
│             │  ┌─ SortableStepCard #1  (collapsed)             ┐  │
│             │  ├─ SortableStepCard #2  (expanded — editor)     ┤  │
│             │  └─ SortableStepCard #3  (collapsed)             ┘  │
│             │                                                     │
│             │  [+ Add step]                                       │
└─────────────┴─────────────────────────────────────────────────────┘
```

- Same light chrome as an interface group (drag handle on the left, chevron to collapse the whole story, overflow menu with Rename/Duplicate/Delete).
- **The one deliberate difference**: immediately below the header, a small **parent card** renders the story's own editable content (title + markdown description). Click-through / pencil to edit; single `onSave` per story (core rule).
- Nested `DndContext` + `SortableContext` inside the group scopes step reordering to that story.

### SortableStepCard (Layer-Card-alike)

Mirrors `SortableWorkflowCard`:

- **Collapsed**: drag handle · step index (`Step 3`) · step title · summary chips (viewport kind, active layer count, amber warning badge if any) · overflow menu.
- **Expanded**: full editor form, grouped into sections:
  1. **Basics** — `id` (auto-slug, editable under Advanced), `title`, markdown `description`.
  2. **Viewport** — radio between `Zoom + center (+ duration)` and `Fit to layer`; layer picker from `config.sources`.
  3. **Layers** — checkbox list of `source.name`s for `layers.active`; separate `focusLayer` picker.
  4. **Expand panels** — free-form tag input (viewer-defined strings; no enum).
  5. **Controls** — repeatable rows: `layer` picker, `opacity` slider, `blend` switch, nested constraint selections. Each constraint row: `label` picker populated from the chosen source's `meta.constraints[]`, then either `lower`/`upper` inputs (continuous) or a multi-select of allowed values (categorical). Type inferred from the referenced constraint's definition.

Single `onSave` per step dispatch (core rule). Dialog / editor state initialised inside `useEffect` on the `open` / expanded prop (core rule).

### State plumbing

- New hook `src/hooks/useStoryActions.ts` returning:
  - Story-level: `addStory`, `updateStory`, `removeStory`, `duplicateStory`, `moveStory`.
  - Step-level: `addStep(storyIndex, step)`, `updateStep`, `removeStep`, `duplicateStep`, `moveStep`.
- New reducer action `SET_STORIES` in `ConfigContext.tsx`, mirroring `SET_WORKFLOWS` exactly.
- Wired into `useConfigBuilderState` alongside the existing workflow actions and passed down to `StorymapsTab`.
- Steps only reorder within their parent story in Phase 2 (moving steps across stories is Phase 3+, matching layers-within-interface-groups constraints today).

### Cross-reference validation (non-blocking warnings)

Pure helper `src/utils/storyValidation.ts` (`(stories, sources) => Map<stepKey, Warning[]>`), memoised in `StorymapsTab`. Warning categories:

- Unknown layer (`focusLayer`, `layers.active[]`, `controls[].layer`) — match by exact `source.name`, then slug-of-name fallback.
- Unknown constraint label — must exist in the referenced source's `meta.constraints[]`.
- Selection/type mismatch — `values` on a `continuous` constraint, or `lower`/`upper` on a `categorical` one.

Surfaced as a small amber badge on the step's collapsed header (tooltip lists issues) and inline next to the offending field in the expanded editor. Never blocks save.

### Unsaved-changes guard

While a step editor or story parent-card editor is dirty, set `hasUnsavedFormChanges` and a descriptive `unsavedFormDescription` on the config context — same signal that already gates the Preview tab. Cancel restores initial values.

### Schema alignment

- `id` fields auto-generated on **Add** via slug of the title (`slugify(title)`), suffixing `-2`, `-3`… on collision within the parent. Manual override exposed under an "Advanced" disclosure.
- No Zod schema changes (Phase 1 covered it).

### Feature-flag

`appSettings.showStorymapsTab` already gates the tab. No change.

### Docs

Extend `docs/storymaps/overview.md` with an "Editing storymaps in the builder" section and two screenshots (a story with steps collapsed; a step expanded showing the editor), captured via `scripts/add-screenshot.sh`.

### Tests

- `src/utils/__tests__/storyValidation.test.ts` — one test per warning category + clean-case.
- `src/hooks/__tests__/useStoryActions.test.ts` — add/update/remove/move/duplicate for stories and steps; verifies reducer round-trip.
- Light render test for empty state + populated state of `StorymapsTab`.

### Out of scope (Phase 3+)

- Moving steps between stories.
- Setting viewport / picking layers by clicking a live map.
- Viewer-side playback of storymaps.

### Technical notes / new files

- `src/components/config/storymaps/StorymapsTab.tsx` (replaces placeholder).
- `src/components/config/storymaps/SortableStoryGroup.tsx` — Interface-Group-alike shell.
- `src/components/config/storymaps/StoryParentCard.tsx` — the small editable "story header" card (the one deviation from the interface-group analogy).
- `src/components/config/storymaps/SortableStepCard.tsx` — Layer-Card-alike step card.
- `src/components/config/storymaps/StepEditor.tsx` — the expanded step form.
- `src/components/config/storymaps/StoryFormDialog.tsx` — add-story dialog.
- `src/utils/storyValidation.ts` + test.
- `src/hooks/useStoryActions.ts` + test.
- `ConfigContext.tsx`: add `SET_STORIES` action mirroring `SET_WORKFLOWS`.
- dnd-kit already installed — no new dependency.
- Follow Compact Layout Metrics, Subtle Metadata Badges, and Tooltip Timing memories for styling.
