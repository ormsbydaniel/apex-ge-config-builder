## Plan

One-way mirror from the personal repo (`ormsbydaniel/apex-ge-config-builder`) to the ESA-APEx repo (`ESA-APEx/ge_config_builder`) via a single, **manually-triggered** GitHub Actions workflow. Lovable continues to sync only to the personal repo; the Action propagates allowed refs downstream on demand.

### Scope

**Can be mirrored on demand (personal → ESA):**
- `main` branch
- `dev` branch (dormant until the branch exists)
- Any tag (e.g. `v0.1.0`)
- Optionally the GitHub Release attached to the chosen ref

**Never mirrored:**
- Other personal branches (e.g. `feature-x`)
- ESA-only branches (e.g. `feature-y`) — untouched by the Action

### Sync diagram

```text
                 ┌────────────────┐
                 │    Lovable     │
                 └───────┬────────┘
                         │ auto-sync
                         ▼
        ┌──────────────────────────────────┐
        │  ormsbydaniel/apex-ge-config-... │
        │  main  dev  feature-x  tags      │
        └───────┬──────────────────────────┘
                │ GitHub Action — manual "Run workflow"
                │ inputs: ref, mirror_release
                │ fast-forward only — fails loudly on divergence
                ▼
        ┌──────────────────────────────────┐
        │   ESA-APEx/ge_config_builder     │
        │  main  dev  feature-y  tags      │
        └──────────────────────────────────┘
```

### Single workflow file

`.github/workflows/mirror-to-esa-apex.yml`

- **Trigger:** `workflow_dispatch` only (manual "Run workflow" button in the Actions tab)
- **Inputs:**
  - `ref` — branch or tag name to mirror (default `main`; accepts `dev`, `vX.Y.Z`, etc.)
  - `mirror_release` — boolean; if true and the ref has a matching GitHub Release, copy title/tag/body verbatim to ESA via `gh release create/edit`
- **Steps:**
  1. Checkout the chosen `ref` from the personal repo (full history)
  2. Add ESA as a remote using `ESA_APEX_MIRROR_TOKEN`
  3. Push the ref fast-forward-only:
     - branches: `git push esa HEAD:refs/heads/<ref>`
     - tags: `git push esa refs/tags/<ref>`
  4. If `mirror_release` is true, mirror the GitHub Release with `gh`
- **No `--force` / no `--force-with-lease`** — divergence → red workflow, no overwrite

### Auth

- Fine-grained PAT with `Contents: read/write` and `Metadata: read` on `ESA-APEx/ge_config_builder`
- Stored in the personal repo as secret `ESA_APEX_MIRROR_TOKEN`

### Tagging convention (new)

- Manually cut `vX.Y.Z` tags + Releases at meaningful points on `main`
- Release notes: curate from `src/constants/announcements.ts`; the mirror copies them verbatim when `mirror_release` is checked

### Operational notes

- **`dev` not existing yet is fine** — the input value is dormant until you create the branch; the first manual run after `dev` exists will create it on ESA automatically.
- **Adding more mirrorable branches later:** no code change needed — the `ref` input accepts any branch name. (If we ever auto-trigger, only then do we need an allow-list.)
- **Deleting a branch personally does not delete on ESA** — manual cleanup if ever needed.
- **Handling ESA-side merges into `main`/`dev`:** workflow fails as non-fast-forward; resolve by pulling ESA's changes into the personal repo, letting Lovable re-sync, then re-run the mirror.
- **Promoting to automatic later:** add `push` (branches: [main, dev], tags) and `release` triggers alongside `workflow_dispatch` in the same file — no restructuring.
- **Disaster switch:** if the personal repo ever needs replacing, point the Action at a different source with no changes on the ESA side.
