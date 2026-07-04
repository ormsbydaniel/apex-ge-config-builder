## Add required `id` to data sources

Introduce a required top-level `id` on every source so stories reference layers stably by id. This task passes the field through the whole pipeline AND switches the story validator to resolve by id.

### Schema — `src/schemas/configSchema.ts`
- Add `id: z.string().min(1)` to `SourceShape` (flows into both top-level sources and workflow entries; workflows already make the shape optional).

### Types — `src/types/layer.ts`
- Add `id: string` to `BaseDataSource`. `BaseLayer`, `LayerCard`, `FlexibleLayer` all inherit it.

### Import path — auto-fill legacy configs
- `src/hooks/useValidatedConfig.ts`: when a source has no `id`, derive one from `slugify(source.name)`, de-duplicated across the array by appending `-2`, `-3`, … on collision. Runs before schema validation so legacy JSON still loads.
- `src/utils/importTransformations/` — add (or extend) an early step that fills missing `id`s on `config.sources[]` using the same slug+dedupe rule, so pasted/imported JSON is repaired up front.

### Source creation
- `src/hooks/useLayerOperations.ts` (`addLayer` and the duplicate path around line ~239): stamp a fresh unique `id` on create and on clone. Duplicates always mint a new id, never inherit.

### Export order — `src/utils/configSorting.ts`
- In `orderSourceProperties`, insert `'id'` as the first entry of `propertyOrder` so exports read `id, name, isActive, …`.

### Story validator — resolve by id
- `src/utils/storyValidation.ts` (`buildLayerLookup`): index sources by `id` in addition to `name` and `slug(name)`.
- Resolution order for every layer reference (`focusLayer`, `layers.active[]`, `controls[].layer`, `viewport.fitLayer`):
  1. exact id match
  2. exact name match
  3. slug(name) match
- Warning messages become: `"… does not match any source id or name."`
- Update `src/utils/__tests__/storyValidation.test.ts` with a case that resolves by id and one that still resolves by name/slug (regression).

### Story action editors — surface ids
- `src/components/config/storymaps/actions/ActionEditors.tsx` and `ActionsAndLayersSection.tsx`: the current `layerOptions = sources.map(s => s.name)` becomes `sources.map(s => ({ id: s.id, label: s.name }))`. Selects store `id` in the step JSON going forward; existing name-based values keep working via the resolver fallback.
- Show `name` as the visible label with `id` as a small muted suffix so authors can see both.

### Iframe / viewer preview
- `src/pages/Preview.tsx` already forwards `config.sources` verbatim — no change needed; `id` rides along.

### Tests
- Schema: source without `id` is rejected; with `id` accepted.
- `useValidatedConfig`: legacy config without ids gets unique auto-filled ids.
- `orderSourceProperties`: `id` appears first in serialized output.
- `storyValidation`: id, name, and slug all resolve; unresolved references still warn.

### Technical notes
- Slugify: lowercase, non-`[a-z0-9]` → `-`, collapse repeats, trim edge dashes. Add a small shared helper (`src/utils/idHelpers.ts`) rather than reusing the near-miss `sanitizeString`.
- De-dupe: `Set<string>` of ids already present (including auto-filled from earlier iterations); append `-2`, `-3`, … until unique.