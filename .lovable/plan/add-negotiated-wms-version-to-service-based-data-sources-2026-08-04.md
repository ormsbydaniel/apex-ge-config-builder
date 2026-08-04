# Add negotiated WMS version to service-based data sources

When a WMS layer is selected from a configured service, add the version reported by that service's `GetCapabilities` response to the resulting data source as `parameters.version`.

## Implementation

- Reuse the existing WMS capability negotiation: the request asks for WMS `1.3.0`, and the parser stores the version returned on the capabilities document root (for example `1.3.0` or an older negotiated version).
- Pass that reported version through the WMS service-layer selection flow into the data source form.
- On save, merge the reported value with any existing custom WMS parameters so the exported item contains:

  ```json
  "parameters": {
    "version": "1.3.0"
  }
  ```

- Keep `version` system-managed in the parameters editor: users should not manually override the version discovered from the selected service, while an existing generated version remains intact when the data source is edited.
- Apply the same behavior to each active service-based WMS creation path; leave direct WMS connections and non-WMS formats unchanged.

## Validation

- Add focused tests for selecting a WMS service whose capabilities report `1.3.0`, merging the version with other parameters, and preserving it through validation/export.
- Confirm an older version reported by a service is used as returned rather than always hard-coding `1.3.0`.
- Confirm WMTS, WFS, STAC, S3, and direct-connection data sources do not receive this WMS parameter.