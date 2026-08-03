# Rebuild the user guide for the Lovable preview

Regenerate the static HTML under `public/guide/` from the current Markdown sources in `docs/`, so the guide served at `/guide/` in the Lovable preview matches the latest repo content.

## Why this is needed

The preview serves `/guide/` as pre-built static HTML committed under `public/guide/`. It does not run MkDocs. Markdown edits pushed to the repo sync into Lovable but do not change what the preview renders until the HTML is regenerated.

## Steps

1. Install the pinned docs toolchain in the sandbox: `mkdocs-material==9.5.44` and `pymdown-extensions==10.11.2` (same versions as the GitHub workflows).
2. Run `mkdocs build --strict`, which writes to `public/guide/` per `site_dir` in `mkdocs.yml`.
3. Fix any strict-mode failures (broken internal links, pages missing from `nav`) and re-run until the build is clean.
4. Report the changed pages so you can reload `/guide/...` in the preview and check them.

## Notes

- Strict mode is intentional: it matches CI, so a clean local build means the "Build and Deploy" and "Deploy Docs Only" workflows will also pass.
- No app source, `mkdocs.yml`, or Markdown content is modified — output only, unless a strict-mode error requires a link or nav fix, which will be called out.
- This does not deploy anything. Publishing or the GitHub workflows remain separate steps.
