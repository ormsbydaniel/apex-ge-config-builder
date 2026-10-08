# Separate the STAC source URL from its formulated query

## Goal

Reduce visual noise in the STAC form while keeping the complete request transparent and preserving the existing URL-only configuration contract.

## Form behaviour

- For STAC sources, display only the URL before `?` in the editable **Data Source URL** field.
- Keep the complete STAC URL, including all query parameters, as the value saved to the configuration and used by asset discovery and query inspection.
- Place a muted, read-only **Formulated URL** beneath the result-limit, date, and bounding-box controls and before asset selection.
- Show the complete generated URL there with safe wrapping so long addresses remain readable.
- Update the formulated URL immediately when a guided filter is added, edited, or removed.
- Preserve unrelated parameters such as tokens or collection-specific options even though they are hidden from the main URL field and have no dedicated badge.
- Editing the root field replaces only the URL base and carries the existing query string forward; entering a complete URL with query parameters imports those parameters into the filter badges and formulated URL.
- Keep non-STAC URL fields unchanged.

## Technical details

- Add focused URL helpers in `src/utils/stacQuery.ts` for extracting the display base and replacing it without losing the existing query string.
- Continue treating `directUrl` as the single complete source of truth; do not add saved query fields or change the schema.
- Pass the base-only value to the STAC URL input while routing edits through the helper, and render the full `directUrl` from `StacQueryEditor` after its controls.
- Preserve existing collection inspection behaviour, including conversion to an advertised items endpoint when filters are enabled.
- Use existing semantic muted text styles and the project’s long-URL wrapping convention.

## Verification

- Add utility tests for base extraction, base replacement, pasted query import, fragments, and preservation of unrelated parameters.
- Confirm the existing `stac-datasets` query URLs still parse into badges and save unchanged until edited.
- Run the focused STAC query tests and TypeScript checks; detailed visual verification remains with the user.
