# Correct custom CRS definition terminology

Update the custom CRS dialog and guide to call the supplied definition **PROJ.4**, not **Proj4js**. Keep the CRS inputs, saved JSON and behaviour unchanged.

## Changes
- Rename the dialog's **Proj4js Definition** field to **PROJ.4 Definition** and its epsg.io helper text to refer to a **PROJ.4 definition**.
- Replace **Proj4js/Proj4JS** references in tutorials 9-3 and 9-4 with **PROJ.4**. Keep the example definition and exercise steps intact.
- Use the same **PROJ.4** spelling for the definition in the related 9-2 concepts page, Settings guide and JSON reference so readers see one term throughout.

## Technical checks
- Search the source documentation and dialog for remaining user-facing **Proj4js** references.
- Rebuild the guide in strict mode and confirm the dialog's wording change compiles. Do not publish.
