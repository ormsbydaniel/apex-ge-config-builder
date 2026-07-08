## Goal
Add a Preview toggle to every modal where markdown can be authored so users can see rendered output using `react-markdown`.

## Markdown-editing locations
1. `src/components/config/storymaps/StepEditor.tsx` — step "Description (markdown)" textarea (line ~186).
2. `src/components/config/storymaps/StoryFormDialog.tsx` — story "Description (markdown)" textarea (line ~92).
3. `src/components/layers/components/LayerDescriptionAttributionDisplay.tsx` — layer "Description" textarea in the edit dialog (line ~358).

## New dependency
- Install `react-markdown` (add `remark-gfm` for tables/strikethrough/task-lists — the layer description dialog already advertises basic markdown support).

## New component: `src/components/common/MarkdownEditor.tsx`
Small controlled wrapper reused in all three places.

Props:
- `value: string`
- `onChange: (v: string) => void`
- `id?: string`
- `rows?: number`
- `placeholder?: string`
- `className?: string`
- `textareaClassName?: string`

Behavior:
- Renders a compact segmented toggle in the top-right of the field: **Edit** | **Preview** (shadcn `Button` group, `Eye` / `Pencil` icons).
- Edit mode: existing `Textarea` (same styling, forwarded props).
- Preview mode: same-height bordered scroll box rendering `<ReactMarkdown remarkPlugins={[remarkGfm]}>` inside a `prose prose-sm max-w-none dark:prose-invert` container. If `value` is empty, show muted "Nothing to preview".
- Toggle state is local; does not affect `value`.

## Edits
- `StepEditor.tsx`: replace the description `<Textarea>` with `<MarkdownEditor>` (keep id, rows, placeholder, value/onChange wiring).
- `StoryFormDialog.tsx`: same replacement for its description textarea.
- `LayerDescriptionAttributionDisplay.tsx`: same replacement for the layer description textarea inside the edit dialog. Leave the "Markdown Reference" helper dialog unchanged.

## Non-goals
- No changes to how markdown is rendered elsewhere in the app (viewer, cards) — only the authoring modals.
- No schema/type changes; textarea value stays a plain string.
- No changes to the catalogue-picker dialog or attribution field (attribution is plain text/URL).
- No syntax highlighting or custom renderers beyond GFM defaults.

## Verification
- `tsgo` typecheck after edits.
- Manual: open each of the three modals, type markdown (headings, list, link, code, table), toggle Preview, confirm rendering.
