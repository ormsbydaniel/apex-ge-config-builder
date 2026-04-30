/**
 * Performance probe for WMS / WMTS GetCapabilities responses.
 *
 * Pure inspection of the parsed capabilities document plus the fetch metrics
 * (duration, byte size). No additional network calls are made — all inputs
 * are produced as a side-effect of the capabilities fetch we already perform
 * during reachability validation.
 *
 * Surfaced via the existing amber "Performance Warning" status — never masks
 * a real reachability error.
 */

/** Capabilities document took longer than this to download (ms). */
const SLOW_CAPABILITIES_MS = 5000;
/** Capabilities document is larger than this (bytes). */
const LARGE_CAPABILITIES_BYTES = 2 * 1024 * 1024;

export interface ServicePerfProbeMetrics {
  durationMs?: number;
  bytes?: number;
}

export interface ServicePerfProbeResult {
  status: 'ok' | 'warning';
  /** Concatenated, human-readable warning message (e.g. for the amber pill). */
  message?: string;
  /** Individual issue strings, in the order they were detected. */
  issues: string[];
}

const formatMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const getDescendantsByLocalName = (root: ParentNode, localName: string): Element[] =>
  Array.from(root.querySelectorAll('*')).filter(el => el.localName === localName);

const getDirectChildByLocalName = (root: Element, localName: string): Element | undefined =>
  Array.from(root.children).find(el => el.localName === localName);

const getDirectChildText = (root: Element, localName: string): string | undefined =>
  getDirectChildByLocalName(root, localName)?.textContent?.trim() || undefined;

/**
 * Find a specific WMS or WMTS layer element by its name/identifier.
 * Returns undefined if the layer can't be found in the document.
 */
function findLayerElement(
  xmlDoc: Document,
  format: 'wms' | 'wmts',
  layerName: string,
): Element | undefined {
  const layerElements = getDescendantsByLocalName(xmlDoc, 'Layer');
  const childTag = format === 'wms' ? 'Name' : 'Identifier';
  return layerElements.find(layer => getDirectChildText(layer, childTag) === layerName);
}

/**
 * Detect whether the layer advertises Web Mercator (EPSG:3857) support.
 * - WMS: looks for `<CRS>EPSG:3857</CRS>` (or legacy SRS) on the layer.
 * - WMTS: looks for a TileMatrixSetLink referencing a Web-Mercator-style set
 *   (GoogleMapsCompatible / WebMercatorQuad / EPSG:3857).
 */
function hasWebMercator(layer: Element, format: 'wms' | 'wmts'): boolean {
  if (format === 'wms') {
    const crsElements = [
      ...getDescendantsByLocalName(layer, 'CRS'),
      ...getDescendantsByLocalName(layer, 'SRS'),
    ];
    return crsElements.some(el => /epsg:3857|epsg:900913/i.test(el.textContent ?? ''));
  }

  const tmsLinks = getDescendantsByLocalName(layer, 'TileMatrixSetLink');
  return tmsLinks.some(link => {
    const tms = getDirectChildText(link, 'TileMatrixSet') ?? '';
    return /epsg:?3857|googlemapscompatible|webmercatorquad/i.test(tms);
  });
}

/** Detect whether the layer advertises any bounding box. */
function hasBoundingBox(layer: Element, format: 'wms' | 'wmts'): boolean {
  if (format === 'wms') {
    return (
      !!layer.querySelector('EX_GeographicBoundingBox') ||
      getDescendantsByLocalName(layer, 'BoundingBox').length > 0 ||
      !!layer.querySelector('LatLonBoundingBox')
    );
  }
  return (
    getDescendantsByLocalName(layer, 'WGS84BoundingBox').length > 0 ||
    getDescendantsByLocalName(layer, 'BoundingBox').length > 0
  );
}

/**
 * For WMS, output formats are advertised once on the service in
 * `<Capability><Request><GetMap><Format>...`.
 * For WMTS, formats are per-layer in `<Layer><Format>...`.
 */
function getAdvertisedFormats(
  xmlDoc: Document,
  format: 'wms' | 'wmts',
  layer: Element | undefined,
): string[] {
  if (format === 'wms') {
    const getMap = getDescendantsByLocalName(xmlDoc, 'GetMap')[0];
    if (!getMap) return [];
    return getDescendantsByLocalName(getMap, 'Format')
      .map(el => el.textContent?.trim().toLowerCase() ?? '')
      .filter(Boolean);
  }
  if (!layer) return [];
  return Array.from(layer.children)
    .filter(el => el.localName === 'Format')
    .map(el => el.textContent?.trim().toLowerCase() ?? '')
    .filter(Boolean);
}

/** True if the format list contains at least one PNG or JPEG variant. */
function hasPngOrJpeg(formats: string[]): boolean {
  return formats.some(f => /image\/(png|jpe?g)/.test(f));
}

/**
 * WMTS only: layer should expose a `<ResourceURL resourceType="tile">`
 * for OpenLayers' efficient REST tile loader. Without one, OL falls back
 * to slower KVP requests.
 */
function hasWmtsRestResourceUrl(layer: Element): boolean {
  const resources = Array.from(layer.children).filter(el => el.localName === 'ResourceURL');
  return resources.some(el => (el.getAttribute('resourceType') ?? '') === 'tile');
}

export function probeServiceCapabilitiesPerformance(
  format: 'wms' | 'wmts',
  layerName: string | undefined,
  xmlDoc: Document,
  metrics: ServicePerfProbeMetrics,
): ServicePerfProbeResult {
  const issues: string[] = [];

  // 1. Slow / large capabilities document.
  if (typeof metrics.durationMs === 'number' && metrics.durationMs > SLOW_CAPABILITIES_MS) {
    issues.push(`slow capabilities (${formatMs(metrics.durationMs)})`);
  }
  if (typeof metrics.bytes === 'number' && metrics.bytes > LARGE_CAPABILITIES_BYTES) {
    issues.push(`large capabilities (${formatBytes(metrics.bytes)})`);
  }

  // Per-layer checks only run if we can find the layer.
  const layer = layerName ? findLayerElement(xmlDoc, format, layerName) : undefined;

  if (layer) {
    // 2. Web Mercator support.
    if (!hasWebMercator(layer, format)) {
      issues.push(
        format === 'wms'
          ? 'EPSG:3857 not advertised (forces server-side reprojection)'
          : 'no Web Mercator TileMatrixSet (GoogleMapsCompatible / EPSG:3857)',
      );
    }

    // 3. Bounding box advertised.
    if (!hasBoundingBox(layer, format)) {
      issues.push('no bounding box advertised (cannot cull tile requests)');
    }
  }

  // 5 / 7. PNG or JPEG output advertised.
  const formats = getAdvertisedFormats(xmlDoc, format, layer);
  if (formats.length > 0 && !hasPngOrJpeg(formats)) {
    issues.push('no PNG or JPEG output format advertised');
  }

  // 9. WMTS REST ResourceURL.
  if (format === 'wmts' && layer && !hasWmtsRestResourceUrl(layer)) {
    issues.push('no REST ResourceURL (falls back to slower KVP requests)');
  }

  if (issues.length === 0) {
    return { status: 'ok', issues };
  }

  return {
    status: 'warning',
    issues,
    message: issues.join('; '),
  };
}
