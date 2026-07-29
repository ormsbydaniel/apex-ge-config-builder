
# Workshops in the user guide — "Getting Started" workshop

## Goal

Add a new **Workshops** section to the MkDocs guide with a first workshop called **Getting Started**, ported from the existing `workshop.md` notes. Each exercise is its own short page so delegates can walk through with Previous / Next arrows, and maintainers can edit one small file at a time.

## Structure

New docs tree:

```text
docs/workshops/
  index.md                              # Landing page listing available workshops
  getting-started/
    index.md                            # Overview: scope, prerequisites, useful links, exercise list
    01-key-concepts.md
    02-name-and-branding.md
    03-export-and-reload.md
    04-add-base-maps.md
    05-first-layer-card.md
    06-add-cog-data.md
    07-colormaps.md
    08-layer-controls.md
    09-wms-service.md
    ... (one file per exercise from the source doc)
```

One workshop = one folder; one exercise = one short markdown file. Adding a new workshop later is just a new folder plus a nav block in `mkdocs.yml`.

## Navigation

Material for MkDocs already renders Previous / Next footer links from the `nav:` order (the `navigation.footer` feature is enabled in `mkdocs.yml`). Ordering exercises under each workshop's nav block is the single source of truth for the flow — no plugin, no custom template.

## Page template

Each exercise page follows a light, consistent shape:

- H1 title (e.g. `# Add your first COG data source`)
- One-line "In this exercise you will…" intro
- Numbered steps
- Screenshot(s) inline where useful
- Optional Tip / Remember callouts via the existing `admonition` extension

## Refresh scope

The source `workshop.md` predates several UI changes in this branch (stories, algorithms, transitions, recommended base maps flow, etc.). As I port each exercise I will:

- Walk the current app UI for that step and rewrite the instructions to match today's labels, menu locations, and dialogs.
- Drop or rewrite any steps that no longer make sense; add short new steps where the current UI needs one that the source doc skipped.
- Keep the pedagogical flow of the original (basics → services → advanced) but split at natural exercise boundaries.
- Not expand scope beyond what the source doc covers — new features like Stories / Algorithms / Storymaps stay in their own reference sections and are only referenced from workshop pages, not taught here (a follow-up workshop can cover them).

## Screenshots

Recapture every screenshot fresh from the current app rather than reusing the GitHub-hosted images in the source doc:

- Drive the app via Playwright to reach each step's exact UI state, capture at a consistent viewport, and save into `docs/assets/screenshots/workshops/getting-started/` following the existing kebab-case convention (per the Screenshot Conventions memory, via `scripts/add-screenshot.sh`).
- Reference each screenshot from the exercise page that uses it, with descriptive alt text.

This makes the workshop stable against upstream GitHub attachment link rot and keeps it visually consistent with the rest of the guide.

## `mkdocs.yml` changes

Add a new top-level `Workshops` tab:

```yaml
- Workshops:
    - Overview: workshops/index.md
    - Getting Started:
        - Overview: workshops/getting-started/index.md
        - Key concepts: workshops/getting-started/01-key-concepts.md
        - Name and branding: workshops/getting-started/02-name-and-branding.md
        - Export and reload: workshops/getting-started/03-export-and-reload.md
        - Add base maps: workshops/getting-started/04-add-base-maps.md
        - Your first layer card: workshops/getting-started/05-first-layer-card.md
        - Add a COG data source: workshops/getting-started/06-add-cog-data.md
        - Style with a colormap: workshops/getting-started/07-colormaps.md
        - Layer controls: workshops/getting-started/08-layer-controls.md
        - Add a WMS service: workshops/getting-started/09-wms-service.md
        # ... remaining exercises added as they're ported
```

Exact exercise list will be finalised during the port; the order above mirrors the source doc's flow.

## Maintenance workflow

- Edit an exercise → run the existing **Deploy Docs Only** GitHub Action (`.github/workflows/deploy-docs.yaml`) → live at `/guide/workshops/getting-started/...`. No app rebuild.
- Add an exercise → new `.md` file + one line under the workshop's `nav:` block. Prev/Next updates automatically.
- Add a workshop → new folder under `docs/workshops/` + new nav block.

## Deliverables

1. `docs/workshops/index.md` — Workshops landing page.
2. `docs/workshops/getting-started/index.md` — Overview of the Getting Started workshop.
3. One markdown file per exercise ported from `workshop.md`, refreshed against today's UI.
4. Fresh screenshots captured via Playwright into `docs/assets/screenshots/workshops/getting-started/`.
5. `mkdocs.yml` updated with the `Workshops` tab and Getting Started exercise ordering.

Docs-only change — no app code changes, no new dependencies — ships through the existing `deploy-docs.yaml` workflow.
