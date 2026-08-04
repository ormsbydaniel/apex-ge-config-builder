# Show service version badge on WMS / WMTS cards

Add a small badge (for example `v1.3.0`) next to the WMS/WMTS type badge on service cards, showing the version the service actually reported in its GetCapabilities response.

Today nothing records the version: the capabilities parser keeps only layers, title and abstract, so the version has to be captured first.

## Capture the version

In `src/utils/serviceCapabilities.ts`, when parsing the GetCapabilities XML, read the `version` attribute from the document root element (`WMS_Capabilities` / `WMT_MS_Capabilities` for WMS, `Capabilities` for WMTS). Fall back to the version that was requested if the attribute is absent. Store it as `version` on the returned capabilities object.

Keep schema and types in sync (per project rules):

- `src/types/service.ts` — add `version?: string` to `ServiceCapabilities`.
- `src/schemas/configSchema.ts` — add `version: z.string().optional()` to `ServiceCapabilitiesSchema` so it survives validation and isn't stripped.

## Display the badge

Show the badge only when `service.capabilities?.version` exists and the service format is `wms` or `wmts`:

- `src/components/ServicesManager.tsx` — Services tab card, after the existing type badge.
- `src/components/layers/components/ServiceCardList.tsx` — service picker cards, same position.

Styled as an outline badge using the same blue token classes as the neighbouring service-type badge, so it reads as secondary information.

## Notes

- Existing saved configs won't have a version until the service is re-validated (Retry / healthcheck); the badge simply doesn't render in that case.
- No change to STAC or S3 cards.
