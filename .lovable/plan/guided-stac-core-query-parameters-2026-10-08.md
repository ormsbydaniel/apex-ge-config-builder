# Guided STAC core query parameters

## Goal

Help users construct STAC item queries without hand-editing URLs. The first version will support only the standard core parameters `bbox`, `datetime`, and `limit`, and will save the result solely as the existing data-source URL.

The collection-specific `queryables` response is useful for a later property-filter builder, but it is not needed for these three core parameters. That broader work will remain deferred.

## User experience

1. Add a compact **Filter items** section to the STAC data-source form.
2. Determine what the entered URL represents before enabling filters:
   - Collection URL: follow its advertised `items` link and build the query against that endpoint.
   - Items URL: edit its query directly.
   - Direct item URL: explain that filters do not apply to a single fixed item.
   - Static STAC document without an items endpoint: explain that server-side filters are unavailable.
3. Provide focused controls for:
   - **Area**: west, south, east, and north coordinates for `bbox`.
   - **Date and time**: start and end values for a STAC `datetime` interval, while permitting an open start or end.
   - **Result limit**: a positive integer for `limit`.
4. Preserve the URL field as the source of truth. Changes in the controls update its query string; editing or reopening an existing URL repopulates the controls.
5. Preserve unrelated query parameters already present in the URL. Clearing a control removes only its corresponding parameter.

## Technical details

1. **Central URL utilities**
   - Add pure helpers to classify STAC URLs, parse `bbox`/`datetime`/`limit`, and update those parameters through `URL`/`URLSearchParams` without disturbing other parameters.
   - Resolve collection URLs through their advertised `rel: items` link rather than assuming a fixed path.
   - Reuse the same URL classification in STAC sample and asset discovery so queried item-list URLs remain consistent.

2. **Validation**
   - Require four finite bbox values in west/south/east/north order, with west not exceeding east and south not exceeding north.
   - Validate datetime values before producing the STAC interval syntax.
   - Require a positive integer limit.
   - Keep invalid edits visible with field-level feedback, but do not write malformed parameters into the URL.

3. **Form integration**
   - Keep all query state local to the STAC form and derive it from the URL when editing an existing source.
   - Do not add configuration fields or change the data model: the validated and exported value remains `DataSourceItem.url`.
   - Ensure changing between collection, items, and direct-item URLs resets or rehydrates the controls correctly without affecting asset selection.

4. **Coverage using `stac-datasets`**
   - Use the manifest fixture as the primary manual test source.
   - Cover its plain collection URLs, existing item-list URLs with `datetime` and `limit`, the bbox/datetime/limit Sentinel-2 query, and direct Sentinel-2 item URLs.
   - Add focused utility and form tests for URL round trips, unknown-parameter preservation, collection resolution, invalid values, and direct-item/static-source gating.

## Deferred

- Fetching and rendering collection-specific `queryables` fields.
- CQL2 property filters, operators, and AND/OR groups.
- Map drawing for bbox selection.
- Structured STAC query metadata in the saved configuration.
- The separate future-safe `assetFormats` mapping plan.
- The general modal-editor assessment.