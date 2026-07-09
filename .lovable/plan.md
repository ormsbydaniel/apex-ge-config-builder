## Goal

Add an optional `isActive: boolean` property to each Story so it flows through the Zod schema, TypeScript types, the story form UI, and every JSON import/export/editor path unchanged.

## Changes

### 1. Schema (`src/schemas/storySchema.ts`)
Add `isActive: z.boolean().optional()` to `StorySchema`. Optional so existing configs remain valid.

### 2. Type (`src/types/story.ts`)
Add `isActive?: boolean;` to the `Story` interface, mirroring the schema.

### 3. Story form dialog (`src/components/config/storymaps/StoryFormDialog.tsx`)
- Add `isActive?: boolean` to the `initial` prop shape and to the `onSave` patch shape.
- Add a local `const [isActive, setIsActive] = useState(false);` initialised in the same `useEffect` that resets `title`/`description` from `initial` (per the "initialize dialog state inside useEffect" project rule).
- Render a shadcn `Switch` (or `Checkbox`) row labelled "Active" beneath the description field.
- Include `isActive` in the `onSave({...})` call.

### 4. Story save handlers (`src/components/config/StorymapsTab.tsx`)
- Widen `handleAddStory` and `handleEditStory` patch types to include `isActive?: boolean`.
- Persist `isActive` on the created/updated `Story` object (a single merged `updateStory` call — no separate dispatches).

### 5. Story group header (`src/components/config/storymaps/SortableStoryGroup.tsx`)
- Pass `isActive` through when calling the edit dialog / rename path so it isn't dropped on edit.
- Show a small subtle badge ("Active" / "Inactive") in the story card header so users can see current state at a glance. Uses existing subtle badge tokens.

### 6. JSON editor round-trip
The full-config JSON editor (`MonacoJsonEditor` / `PreviewTab`) and the per-step editor (`StepJsonEditorDialog`) both validate against `ConfigurationSchema` / `StoryStepSchema`. No code changes required — adding `isActive` to `StorySchema` is sufficient for the full-config editor. There is no per-story JSON editor today, so nothing else needs wiring.

### 7. Validation hook (`src/hooks/useValidatedConfig.ts`)
Verify nothing sanitises unknown story fields. If a manual allow-list exists for story properties, add `isActive` there; otherwise no change (Zod passes it through).

### 8. Tests (`src/schemas/__tests__/storySchema.test.ts`)
- Add a test that a story with `isActive: true` parses successfully and the value survives `.parse()`.
- Add a test that a story without `isActive` still parses (backwards compat).

## Notes / Non-goals

- No behaviour change in the viewer or elsewhere in the builder is triggered by `isActive` — this task only introduces the field, the UI toggle, and guarantees round-trip persistence. Any downstream use of the flag (filtering, hiding inactive stories in the viewer, etc.) is out of scope and can be a follow-up.
- Default value on creation: `undefined` (i.e. omitted from JSON) to keep exported configs minimal; the toggle displays unchecked in that case.
