## Goal
Give every markdown editor in the app the same three-mode toggle — **Edit | Syntax Guide | Preview** — with the syntax guide built in (including image references), then refresh MkDocs screenshots that show a markdown editor.

## Changes

### 1. `src/components/common/MarkdownEditor.tsx`
Extend the local `mode` state to `'edit' | 'guide' | 'preview'` and add a third toggle button ("Syntax Guide", using a `BookOpen` or `HelpCircle` icon).

When `mode === 'guide'`, render a reference panel styled like the preview container (same border/padding, scrollable) containing a compact table adapted from `LayerDescriptionAttributionDisplay`:

| Feature | Syntax |
|---|---|
| Hyperlink | `[text](https://url/)` |
| Image | `![alt text](https://url/image.png)` |
| Italics | `*text*` |
| Bold | `**text**` |
| Heading 1 / 2 | `# text` / `## text` |
| List | `- item` |
| Quote | `> text` |
| Code | `` `code` `` |

Include a short note above the table explaining that images must be referenced by absolute URL (the editor does not upload local files) and that alt text is required for accessibility.

The guide view does not mutate `value`; switching modes is free.

### 2. `src/components/layers/components/LayerDescriptionAttributionDisplay.tsx`
Now that the syntax guide lives inside the editor, simplify this dialog:
- Remove the `'help'` branch of the `view` state and the associated Markdown Reference panel (lines ~176–239).
- Remove the "Tell me more" button and the helper sentence around it (lines ~350–359). The `MarkdownEditor` itself now exposes the guide.
- Keep the `'catalogue'` and `'main'` views untouched.

### 3. Other consumers
`StepEditor.tsx` and `StoryFormDialog.tsx` already use `MarkdownEditor`; they inherit the new three-mode toggle automatically. No further changes needed.

### 4. Documentation screenshots
Screenshots that currently show a markdown editor with only Edit/Preview need refreshing so the guide reflects the new UI. Candidates:
- `layer-card-edit-top.png` — layer edit dialog (if the description field is visible).
- Any storymap step/story screenshots that include the markdown editor. (None currently in `docs/assets/screenshots/`; skip if absent.)

Process for each stale shot:
1. Drive Playwright against `http://localhost:8080`, open the relevant dialog, and capture the region showing the editor with the new three-button toggle.
2. Save via `scripts/add-screenshot.sh <tmp-path> <existing-kebab-name>` so both `docs/assets/screenshots/` and `public/guide/assets/screenshots/` are updated (per `mem://documentation/screenshot-conventions`).
3. Rebuild MkDocs into `public/guide/` so the in-app guide picks up the new assets.

No markdown copy changes are required unless a page explicitly describes the old Edit/Preview toggle (a quick grep confirmed none do).

### 5. Verification
- Open a layer description dialog: confirm three buttons appear, guide renders the image row, previewing still works, "Tell me more" is gone.
- Open a storymap step description: confirm the same three-mode toggle.
- Typecheck/build runs automatically.

## Out of scope
- No schema, type, or persistence changes.
- No behavioural change to preview rendering or markdown pipeline.
- No new MkDocs pages — only refreshed screenshots.