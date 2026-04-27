## Plan

I’ll make WMTS GetCapabilities parsing more robust so services that work in a browser also populate layers in the app.

## What I’ll change

1. **Centralize Add Service capabilities parsing**
   - Update `useServices.ts` so WMS/WMTS/WFS service creation uses the shared `fetchServiceCapabilities()` utility instead of its older duplicated parser.
   - This prevents Add Service and later lazy-loading/validation from disagreeing about discovered layers.

2. **Improve WMTS XML parsing**
   - Update `fetchServiceCapabilities()` to parse WMTS documents using namespace-safe DOM traversal, not only CSS selectors like `querySelectorAll('Layer')`.
   - Support common WMTS XML variations such as:
     - namespace-prefixed `<wmts:Layer>` elements
     - `<ows:Identifier>` / `<Identifier>` regardless of prefix
     - service metadata under OWS elements regardless of namespace prefix
   - Keep current WMS/WFS behavior unchanged except where shared helper functions make parsing safer.

3. **Improve validation feedback**
   - Keep returning capabilities with an empty layer list only when the fetch/parsing succeeded but no layers were detected.
   - Preserve existing error handling and avoid noisy render-loop logging.

4. **Verify the flow**
   - Test the TypeScript/build checks.
   - Manually reason through the affected paths:
     - Add WMTS service
     - Open “add data from service” modal
     - Lazy re-fetch of capabilities for existing services
     - Service validation/re-check

## Technical details

The likely root cause is that WMTS capabilities documents often use XML namespaces. In XML DOM parsing, browser CSS selectors can be unreliable for namespaced elements, especially if the element appears as `wmts:Layer` rather than plain `Layer`. I’ll add small XML helper functions that match by `localName`, so parsing is based on the actual XML element name independent of prefix.

Expected result: the service modal should list WMTS layers instead of showing “No layers found” when the GetCapabilities response contains valid WMTS Layer entries.