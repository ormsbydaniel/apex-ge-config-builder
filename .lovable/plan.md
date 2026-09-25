# Update the Tutorials home page: remove Export tip, reword navigation, add BYO data

All changes are to `docs/workshops/index.md` (deployed to
`https://ge-config-builder.apex.esa.int/guide/workshops/index.html`).

## Documentation changes

1. **Remove the "Export often" tip** from the "Navigating the tutorials"
   section — saving/exports will be covered in later exercises instead.
2. **Reword the navigation guidance** in "Navigating the tutorials":
   - Refer to the **"tutorial menu"** rather than the "left-hand navigation".
   - Say the tutorial menu is **to the left** of the page, or in the
     **top-left dropdown menu if accessed on a phone**.
3. **Add a final section "BYO data"** at the end of the home page (after
   "Workshops"):
   - Note that the tutorials use **cloud hosted data sources** — such as COGs,
     WMS / WMTS services, etc.
   - Invite readers with **their own data at a publicly accessible URL** to try
     substituting it in the tutorials.
   - Caveat: in a workshop environment, while the facilitator may be happy to
     help if possible, workshop sessions cannot be used to troubleshoot issues
     with your own data, as this would impact attention for other delegates.

## Verification

- Build the guide with MkDocs in strict mode (pinned toolchain:
  `mkdocs-material==9.5.44`, `pymdown-extensions==10.11.2`).
- Confirm the generated `public/guide/workshops/index.html` contains the
  reworded navigation guidance and the new "BYO data" section, and no longer
  contains the "Export often" tip.
