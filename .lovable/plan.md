Add support for the `baseLayer` step field described in STORY_SCHEMA_2.md to the underlying schema/types only. No UI changes.

## Changes

### 1. `src/schemas/storySchema.ts`
- Add `baseLayer: z.string().min(1).optional()` to `StoryStepV2Schema`.
- Legacy `StoryStepLegacySchema` is left untouched (v1 shape).
- Cross-reference validation (unknown id / non-base source) is out of scope for this change; can be added later in `storyValidation.ts` if desired.

### 2. `src/types/story.ts`
- Add `baseLayer?: string;` to the `StoryStepV2` interface, with a JSDoc note that it references a source `id` where `isBaseLayer === true`, and when omitted the current basemap is left unchanged.

### 3. Sanitization / persistence
- `src/hooks/useConfigSanitization.ts` spreads `stories` through unchanged (`...(config.stories && { stories: config.stories })`), so the new field is preserved on export automatically. No edits needed.

## Out of scope
- No editor UI (ActionEditors, ActionsAndLayersSection, etc.) changes.
- No validator warnings for unknown/non-base ids yet.
- No migration/transformer changes — the field is purely additive and optional.
