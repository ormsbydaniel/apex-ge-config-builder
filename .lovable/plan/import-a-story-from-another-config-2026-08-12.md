# Import a story from another config

Add a second way to create a story: instead of only defining a new one from scratch, the user can pull one or more existing stories out of another configuration (uploaded file, a config in the GitHub repo, or an example).

## User flow

1. In the Stories tab, click **Add story**.
2. The dialogue now opens with two tabs:
   - **New story** — exactly the current form (title, description, thumbnail, id, active).
   - **Import story** — the donor-config picker, mirroring the existing "Import layer" experience.
3. On **Import story**, the user picks a source config: Upload / GitHub / Examples.
4. Once the config loads, the dialogue lists the stories it contains (title, description snippet, step count) with checkboxes. If the config has no stories, an explainer is shown.
5. Below the story list, any layers referenced by the selected stories that do not exist in the current config are listed, each with a checkbox (all ticked by default) so they can be imported alongside the story.
6. **Import** adds the selected stories (and any ticked layers) to the working config, then closes the dialogue.

## Behaviour details

- Story ids and titles are de-duplicated against existing stories (`my-story`, `my-story-2`).
- Imported layers are cloned with the existing donor-import rules (fresh id, unique name, base-layer flag cleared) and land in the donor's original interface group where the group exists in the target config, otherwise the group is created.
- Because cloning mints new layer ids, the imported story's step references are rewritten to the new ids so the story still works. References to layers the user chose *not* to import are dropped from the steps, and a toast notes how many references were removed.
- `baseLayer`, `panelState.focusLayer` and per-layer constraints in each step go through the same remapping.
- Missing-layer detection covers `activeLayers[].id`, `baseLayer` and `panelState.focusLayer`.
- Nothing is written to the config until **Import** is pressed; the donor config is read-only.

## Technical notes

- Extract the donor loading/browsing part of `src/components/layers/import/DonorConfigPickerDialog.tsx` into a reusable `DonorConfigSourcePicker` (Upload / GitHub / Examples tabs + `useDonorConfigLoader`) so both the layer import and the new story import share it; the layer dialogue keeps its current behaviour.
- New `src/components/config/storymaps/import/StoryImportPanel.tsx`: donor source picker → story checkbox list → missing-layer checkbox list → Import.
- New `src/utils/storyImport.ts`: `collectStoryLayerRefs(story)`, `remapStoryLayerRefs(story, idMap, droppedIds)`, and `uniqueStoryId` helpers, with unit tests.
- Wrap `StoryFormDialog` in a `Tabs` (`New story` / `Import story`) when in add mode; edit mode keeps the single form.
- `StorymapsTab` gains an `handleImportStories(stories, layers)` handler that dispatches `ADD_SOURCE` for each cloned layer (reusing `cloneDonorLayer` from `src/utils/donorImport.ts`, extended to return the minted id) and then `addStory` for each remapped story.
- Story shape validated against `StorySchema` in `src/schemas/storySchema.ts` before insertion; invalid stories are listed as non-selectable with the reason.
