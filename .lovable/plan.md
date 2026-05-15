## Add "Draft" status badge to every docs page

Use Material for MkDocs' built-in **page status** feature — a small icon next to each nav entry, with a hover tooltip. Reviewing a page = deleting one front-matter line.

### 1. Enable the status indicator in `mkdocs.yml`

Add to the `theme:` block:
```yaml
theme:
  name: material
  features:
    - ...existing features...
    - content.tooltips      # nicer hover label for the status icon
  icon:
    status:
      draft: material/pencil-outline
```

Add a top-level `extra:` block (or extend if one exists):
```yaml
extra:
  status:
    draft: Not yet reviewed
```

### 2. Add `status: draft` to every `.md` page under `docs/`

For each page (~55 files), ensure YAML front-matter contains `status: draft`:

- Pages with existing front-matter (e.g. `title: Authors Guide`) — insert the `status: draft` line inside the existing `---` block.
- Pages without front-matter — prepend a 3-line block:
  ```
  ---
  status: draft
  ---
  ```

Done via a single shell script (idempotent — skips files that already have `status: draft`).

### 3. Reviewing workflow

Once a page is reviewed, delete the `status: draft` line (or the whole front-matter block if it only contained that). The nav icon disappears, signalling progress.

### 4. Rebuild

`mkdocs build --clean` to regenerate `public/guide/`.

### Scope

- All `.md` files under `docs/` including `index.md`, section landings, recipes, reference pages.
- Excludes `docs/assets/screenshots/README.md` (not in nav anyway).
- No app code, no nav restructuring, no per-page banner.
