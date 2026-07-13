## Phase 2 — Migrate the editor to v2

Phase 1 landed the v2 schema, types, upgrader, and validator (dual-shape). Phase 2 flips the editor to produce v2 **only**, wires the legacy upgrader into the loader, and retires the legacy interfaces.

### Goals
- Editor reads and writes v2 shape end-to-end.
- Legacy configs opened in the editor are transparently upgraded on import.
- No dual-shape branches remain in the editor UI.
- Legacy Zod branch is retained only for import; runtime types are v2.

---

### 1. Type / schema flip
- `src/types/story.ts`: make `StoryStep = StoryStepV2`, `StoryViewport = StoryViewportV2`, `Story.steps: StoryStepV2[]`. Keep `StoryStepLegacy` exported under `@deprecated` for the upgrader / tests only.
- `src/schemas/storySchema.ts`: keep `StoryStepSchema` union for **import** but export a new `StoryStepV2Schema` used by the editor's JSON dialog (already exists — switch `StepJsonEditorDialog` to it).

### 2. Loader wiring (legacy → v2 on import)
- `src/hooks/useValidatedConfig.ts` / `useConfigImport.ts`: after schema parse, run `upgradeLegacyStories(config.stories)` so anything hitting the editor state is v2.
- Add a small toast when an upgrade actually mutated data.

### 3. Editor UI changes

**StepEditor** (`StepEditor.tsx`)
- Read/write `step.content.title`, `step.content.description`, `step.id`.
- Add an `autoAdvance` field (numeric ms, optional) in the Content dialog.
- Replace three action sections with four:
  - Navigation (viewport)
  - Active layers (new merged editor)
  - Panel state (focus layer + controls + tab)
  - _(remove standalone Focus layer / Expand panels / Layer control sections)_

**ActionsAndLayersSection** (`ActionsAndLayersSection.tsx`)
- Rework `ActionKind` union to: `navigation | activeLayers | panelState`.
- Remove: `focusLayer`, `layerControl`, `expandPanels` action cards. Their functionality moves into `activeLayers[]` items and `panelState`.
- `hasKind`, `warningsForAction`, and category map updated accordingly.

**NavigationEditor**
- Add third viewport mode: **Fit to extent** (`extent: [minX,minY,maxX,maxY]`, optional `projection`, `maxZoom`, `duration`). UI: mode radio (Zoom / Fit layer / Extent) + four numeric inputs for extent.
- Preserve existing `zoom` and `fitLayer` modes.

**ActiveLayersEditor** (renamed responsibilities)
- One card per `StoryActiveLayer`: layer picker, opacity slider, blend toggle, optional `date` (number | 'earliest' | 'latest' | ISO string), constraints editor (lifted from old `LayerControlEditor`).
- Order in array is meaningful (drag-reorder retained if present; else move up/down).

**PanelStateEditor** (new)
- `focusLayer` picker (constrained to ids in `activeLayers`).
- `controls`: three toggle groups (`temporal`, `styles`, `filters`) each with `expanded` + `disabled` checkboxes.
- `tab`: dropdown of `overview | statistics | query | charts | parameters`; when `charts`, extra input for `activeChart` (title match).

**StoryFormDialog**
- Add `thumbnail` (URL) input.

**SortableStepCard / SortableStoryGroup**
- Read titles from `step.content?.title ?? step.id`; description from `step.content?.description`.
- Story card shows `thumbnail` when set.

**StepJsonEditorDialog**
- Validate against `StoryStepV2Schema` (strict v2), not the union.
- Header uses `step.content?.title ?? step.id`.

### 4. Actions module (`actions/`)
- `types.ts`: rewrite `ACTION_META`, `CATEGORY_ORDER`, `ActionKind`, `hasKind`, `warningsForAction` for v2.
- `ActionEditors.tsx`: delete `FocusLayerEditor`, `ExpandPanelsEditor`, `LayerControlEditor` (or keep constraints subeditor as a shared component consumed by `ActiveLayersEditor`). Rewrite `ActiveLayersEditor` to edit full `StoryActiveLayer[]`. Add `PanelStateEditor`. `NavigationEditor` gets the extent mode.

### 5. useStoryActions
- Default step template for `addStep`: `{ id, content: { title }, viewport: { zoom: 2, center: [0,0] }, activeLayers: [] }`.
- No shape branching needed since types are v2 now.

### 6. Validation warning keys
- `storyValidation.ts` v2 branch already emits: `unknown-focus-layer`, `invalid-tab-id`, coverage checks. Add mapping in `warningsForAction` for the new action kinds.

### 7. Deprecations
- Move `StoryStepLegacy`, `StoryStepControl`, `StoryStepLayers` to `src/utils/deprecated/storyLegacy/legacyTypes.ts` (re-export from `types/story` for import compatibility with an `@deprecated` JSDoc).
- README updated with removal criteria.

### 8. Docs
- `docs/storymaps/overview.md`: replace legacy examples with v2, note that the editor now writes v2 only and old configs auto-upgrade on load.

### 9. Tests
- Update editor-adjacent tests (none currently touch editor components — only schema/upgrade/validation). Extend `storySchema.test.ts` to lock in that the editor's default step passes `StoryStepV2Schema`.
- Add a small round-trip test: legacy config → `upgradeLegacyStories` → `StorySchema.parse` succeeds and produces v2 shape.

---

### Out of scope for phase 2
- Viewer runtime changes (viewer consumes v2 already per schema doc).
- Any changes to constraint editor internals beyond relocating it under `ActiveLayersEditor`.
- Migration UI (banner, diff preview) — silent upgrade + toast only.

### File touch list
```text
src/types/story.ts                                          (flip default to v2)
src/schemas/storySchema.ts                                  (no shape change; ensure V2 schema exported)
src/hooks/useValidatedConfig.ts                             (call upgradeLegacyStories on import)
src/hooks/useConfigImport.ts                                (same, if that's the actual import site)
src/hooks/useStoryActions.ts                                (v2 default template)
src/components/config/storymaps/StepEditor.tsx              (content dialog + section list)
src/components/config/storymaps/StoryFormDialog.tsx         (thumbnail field)
src/components/config/storymaps/SortableStepCard.tsx        (read content.*)
src/components/config/storymaps/SortableStoryGroup.tsx      (thumbnail render)
src/components/config/storymaps/StepJsonEditorDialog.tsx    (V2 schema)
src/components/config/storymaps/actions/types.ts            (rewrite kinds)
src/components/config/storymaps/actions/ActionsAndLayersSection.tsx  (rewrite items/pick/remove)
src/components/config/storymaps/actions/ActionEditors.tsx   (NavigationEditor extent, ActiveLayersEditor, PanelStateEditor; drop old editors)
src/utils/deprecated/storyLegacy/legacyTypes.ts             (new)
docs/storymaps/overview.md                                  (v2 examples)
src/schemas/__tests__/storySchema.test.ts                   (extend)
```

### Risk & rollback
- Editor rewrite is invasive but self-contained; keeping the legacy Zod branch in `StoryStepSchema` means any pre-migration config still loads. If a regression is found, revert the editor commit — schema/upgrader from phase 1 continue to work.
