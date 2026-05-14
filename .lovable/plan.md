## Plan

Fix the generated guide so internal documentation navigation points directly at `index.html` files instead of extensionless directory URLs that Lovable preview is returning as 404.

### Changes

1. **Update MkDocs URL mode**
   - Change `mkdocs.yml` from `use_directory_urls: true` to `use_directory_urls: false`.
   - This makes MkDocs generate links like:
     - `/guide/getting-started/overview/index.html`
     - `../configuration/home/index.html`
   - Instead of links like:
     - `/guide/getting-started/overview/`

2. **Regenerate the static guide output**
   - Rebuild `public/guide` so every generated sidebar, next/previous, canonical, and body link uses explicit `index.html` targets.
   - Keep the existing `/guide/index.html` entry point unchanged.

3. **Verify generated links**
   - Inspect generated HTML to confirm nav links no longer point to bare directory paths.
   - Check representative pages such as:
     - `public/guide/index.html`
     - `public/guide/getting-started/overview/index.html`
     - `public/guide/configuration/home/index.html`

### Notes

- This targets the static MkDocs guide only; no React router change is needed.
- The app can keep using `BrowserRouter`.
- The root User Guide button can continue pointing at `/guide/index.html`.