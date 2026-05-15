## Remove Lovable references from documentation

Two files mention Lovable. Plan to neutralise them while preserving the actual workflow info.

### 1. `docs/reference/glossary.md`
Remove the **Lovable Cloud** entry entirely (lines 61-64). It only exists to say "we don't use it" — irrelevant to readers without the Lovable framing.

### 2. `docs/reference/authors-guide.md`
Replace Lovable-specific phrasing with neutral hosting/deployment language:

- **Line 13**: "the published Lovable app" → "the published web app"
- **Line 25**: "**Publish → Update** in Lovable" → "redeploy / publish the app from your hosting platform"
- **Line 36**: "(typically inside Lovable, or directly in the GitHub repo…)" → "(directly in the GitHub repo…)"
- **Lines 38-39**: drop the "Lovable does this automatically when you make changes via chat" sentence; keep the push-to-`origin/documentation` step.
- **Lines 43-44**: "In Lovable, click **Publish → Update** so the new `public/guide/` is served from the live `.lovable.app`…" → "Redeploy the app so the new `public/guide/` is served from the live site (and any custom domain)."
- **Line 99**: "Always edit on the Lovable side…" → "Always edit via the main repo workflow (or commit from `repo/` manually and push) before re-running."

### 3. Rebuild
After edits, run `mkdocs build --clean` so `public/guide/` HTML matches.

### Out of scope
No changes to nav, app code, or other docs pages. A repo-wide grep confirmed only these two files mention Lovable in `docs/`.
