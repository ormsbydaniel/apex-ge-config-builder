## Plan

1. **Adjust the affected MkDocs nav entries**
   - Keep `Data visualisation` as-is, since it already behaves correctly.
   - For `Layers` and `Data sources`, point the first child `Overview` entry at a non-index markdown page, matching the pattern that works for `Data visualisation`.
   - This avoids MkDocs Material folding `index.md` into the parent only, which is why the visible `Overview` child is currently missing.

2. **Preserve the same URLs for direct Overview links**
   - Add lightweight compatibility redirects/stubs so existing direct URLs such as:
     - `/guide/layers/index.html`
     - `/guide/data-sources/index.html`
   - continue to land on the relevant Overview content.

3. **Update the generated guide**
   - Rebuild the MkDocs output so `public/guide/` reflects the source changes.

4. **Verify the behaviour**
   - Check generated navigation for:
     - `Data visualisation` still shows `Overview` as first child.
     - `Layers` shows `Overview` as first child and parent click opens the overview.
     - `Data sources` shows `Overview` as first child and parent click opens the overview.
   - Confirm direct links to the Overview pages still resolve correctly.

## Technical notes

MkDocs Material’s `navigation.indexes` treats `section/index.md` specially: it merges that page into the parent link and often hides the explicit child row. `Data visualisation` works because its Overview page is `layers/data-visualisation.md`, not an `index.md`. The implementation will mirror that pattern for `Layers` and `Data sources` without changing page copy or headings.