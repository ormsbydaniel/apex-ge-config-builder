# Add negotiated WMTS version to service-based data sources

When a WMTS layer is selected from a configured service, store the version reported by its `GetCapabilities` response as the data source's top-level `version` property.

## Implementation

- Extend the existing negotiated-version state in the main data source form to cover both WMS and WMTS services.
- Keep the two output shapes protocol-specific:
  - WMS: `parameters.version`
  - WMTS: top-level `version`
- Populate `version` when a WMTS service layer is selected, preserve it when that generated data source is edited, and remove stale protocol-specific version fields when the format changes.
- Apply the same top-level WMTS version behavior to the alternate service configuration form so all active service-based creation paths remain consistent.
- Leave direct WMTS connections and non-WMS/WMTS formats unchanged.

## Schema and types

- Add optional `version` explicitly to the data source Zod schema and `DataSourceItem` TypeScript interface.
- Confirm the validation hook continues to preserve the field through configuration validation and export; its current spread-based normalization should require no behavioral rewrite.

## Validation

- Add focused tests confirming a reported WMTS version such as `1.0.0` survives schema validation as a top-level property.
- Cover protocol separation so WMTS does not receive `parameters.version`, WMS remains unchanged, and unrelated/direct data sources do not gain a version automatically.
- Run the focused tests and TypeScript validation.