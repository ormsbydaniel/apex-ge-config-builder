# Move shared tutorial guidance to the Tutorials home page

## Documentation changes

1. Move the shared guidance from **1-1. Pre-requisites** into `docs/workshops/index.md`, preserving its useful content:
   - overall experience and equipment requirements;
   - technologies and data formats used;
   - browser and monitor/phone setup guidance;
   - tutorial navigation and the “Export often” tip;
   - how tutorial pre-requisites work across the series;
   - guidance for asking questions during workshops.
2. Organise that guidance beneath clear sections on the Tutorials home page, while retaining the existing introduction to core and topic tutorials.
3. Reduce `docs/workshops/01-familiarisation/01-prerequisites.md` to its title and the statement that this is the first tutorial, so there are no previous tutorials to complete.

## QR code

- Regenerate the existing tutorial setup QR image so it opens:
  `https://ge-config-builder.apex.esa.int/guide/workshops/index.html`
- Keep the current compact display size and update the home-page image path and alt text as needed.
- Update both documentation copies of the QR image using the project’s screenshot helper so they remain synchronized.

## Verification

- Build the guide with MkDocs in strict mode.
- Confirm the generated `public/guide/workshops/index.html` contains the moved sections and the QR image.
- Decode the regenerated QR image to verify its destination is the Tutorials home page.
- Confirm the generated Tutorial 1-1 page contains only its concise no-pre-requisites message.
