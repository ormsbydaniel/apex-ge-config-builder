# Deprecated: legacy v1 story step shape

## Status

The legacy story step shape — with top-level `title`, `description`,
`focusLayer`, `expandPanels`, `layers.active[]`, and `controls[]` — is
**deprecated** in favour of the v2 shape defined by `STORY_SCHEMA_1.md`.

## Why

v2 collapses several parallel arrays into a single `activeLayers[]` list
(one entry per source, carrying its own opacity / blend / date /
constraints), moves sidebar copy into `content`, and gathers info-panel
state into `panelState`. It also adds a `viewport.extent` mode, per-step
`autoAdvance`, and a story-level `thumbnail`. See the schema doc for the
full field-by-field description.

## Backward compatibility

`src/schemas/storySchema.ts` accepts a discriminated union of the legacy
and v2 step shapes, so existing configs continue to load and export
unchanged. The editor UI still emits legacy-shaped steps until phase 2
rewires it — `Story.steps` in `src/types/story.ts` is intentionally typed
as `StoryStepLegacy[]` for that reason.

## Migration

Use `upgradeLegacyStories` to convert an entire config's stories array to
v2, or `upgradeLegacyStory` / `upgradeLegacyStep` for a single object:

```ts
import { upgradeLegacyStories } from '@/utils/deprecated/storyLegacy/upgrade';

const upgraded = upgradeLegacyStories(config.stories);
// upgraded[*].steps now use { content, activeLayers, panelState, ... }
```

The helper is **not** invoked automatically anywhere. Phase 2 (editor
rewrite) will call it in the config loader so the UI can work directly
with v2 shape.
