/**
 * Active tile-request performance probe for WMS / WMTS services.
 *
 * Issues a single representative GetMap (WMS) or GetTile (WMTS) request
 * against the service and measures response time and payload size.
 *
 * Designed to surface only egregiously slow / heavy tiles — never masks a
 * reachability failure (the caller only invokes this once the service is
 * already known to be reachable).
 */

const SLOW_TILE_MS = 3000;
const LARGE_TILE_BYTES = 1 * 1024 * 1024;
const TILE_TIMEOUT_MS = 8000;

export interface TileProbeResult {
  status: 'ok' | 'warning' | 'skipped';
  message?: string;
  durationMs?: number;
  bytes?: number;
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

function findLayerElement(
  xmlDoc: Document,
  format: 'wms' | 'wmts',
  layerName: string,
): Element | undefined {
  const layerElements = getDescendantsByLocalName(xmlDoc, 'Layer');
  const childTag = format === 'wms' ? 'Name' : 'Identifier';
  return layerElements.find(layer => getDirectChildText(layer, childTag) === layerName);
}

/** Pick a sensible image format from advertised list, preferring PNG. */
function pickImageFormat(formats: string[]): string {
  const png = formats.find(f => /image\/png/.test(f));
  if (png) return png;
  const jpeg = formats.find(f => /image\/jpe?g/.test(f));
  if (jpeg) return jpeg;
  return formats[0] ?? 'image/png';
}

function getWmsAdvertisedFormats(xmlDoc: Document): string[] {
  const getMap = getDescendantsByLocalName(xmlDoc, 'GetMap')[0];
  if (!getMap) return [];
  return getDescendantsByLocalName(getMap, 'Format')
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean);
}

function getWmtsLayerFormats(layer: Element): string[] {
  return Array.from(layer.children)
    .filter(el => el.localName === 'Format')
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean);
}

/** Build a WMS GetMap URL covering the layer's bbox at 256x256. */
function buildWmsGetMapUrl(
  serviceUrl: string,
  layer: Element,
  layerName: string,
  imageFormat: string,
): string | undefined {
  // Try EPSG:3857 first via WGS84 bbox; fall back to EX_GeographicBoundingBox -> CRS:84.
  const exGeo = layer.querySelector('EX_GeographicBoundingBox');
  let west: number | undefined;
  let south: number | undefined;
  let east: number | undefined;
  let north: number | undefined;

  if (exGeo) {
    west = parseFloat(exGeo.querySelector('westBoundLongitude')?.textContent ?? '');
    east = parseFloat(exGeo.querySelector('eastBoundLongitude')?.textContent ?? '');
    south = parseFloat(exGeo.querySelector('southBoundLatitude')?.textContent ?? '');
    north = parseFloat(exGeo.querySelector('northBoundLatitude')?.textContent ?? '');
  }

  // Default to a small slice of the world if bbox missing.
  if (![west, south, east, north].every(v => Number.isFinite(v))) {
    west = -10; south = -10; east = 10; north = 10;
  }

  const url = new URL(serviceUrl);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('request', 'GetMap');
  url.searchParams.set('version', '1.3.0');
  url.searchParams.set('layers', layerName);
  url.searchParams.set('styles', '');
  url.searchParams.set('crs', 'CRS:84');
  url.searchParams.set('bbox', `${west},${south},${east},${north}`);
  url.searchParams.set('width', '256');
  url.searchParams.set('height', '256');
  url.searchParams.set('format', imageFormat);
  url.searchParams.set('transparent', 'true');
  return url.toString();
}

/** Build a WMTS GetTile URL using KVP (works for both REST and KVP services). */
function buildWmtsGetTileUrl(
  serviceUrl: string,
  layer: Element,
  layerName: string,
  imageFormat: string,
): string | undefined {
  // Find a TileMatrixSet to use, preferring Web Mercator.
  const tmsLinks = getDescendantsByLocalName(layer, 'TileMatrixSetLink');
  if (tmsLinks.length === 0) return undefined;

  const preferred = tmsLinks.find(link => {
    const tms = getDirectChildText(link, 'TileMatrixSet') ?? '';
    return /epsg:?3857|googlemapscompatible|webmercatorquad/i.test(tms);
  });
  const link = preferred ?? tmsLinks[0];
  const tileMatrixSet = getDirectChildText(link, 'TileMatrixSet');
  if (!tileMatrixSet) return undefined;

  // Use TileMatrix=0/Row=0/Col=0 — coarsest tile, always exists.
  const url = new URL(serviceUrl);
  url.searchParams.set('service', 'WMTS');
  url.searchParams.set('request', 'GetTile');
  url.searchParams.set('version', '1.0.0');
  url.searchParams.set('layer', layerName);
  url.searchParams.set('style', 'default');
  url.searchParams.set('tilematrixset', tileMatrixSet);
  url.searchParams.set('tilematrix', '0');
  url.searchParams.set('tilerow', '0');
  url.searchParams.set('tilecol', '0');
  url.searchParams.set('format', imageFormat);
  return url.toString();
}

export async function probeTileRequest(
  serviceUrl: string,
  format: 'wms' | 'wmts',
  layerName: string | undefined,
  xmlDoc: Document,
): Promise<TileProbeResult> {
  if (!layerName) return { status: 'skipped' };

  const layer = findLayerElement(xmlDoc, format, layerName);
  if (!layer) return { status: 'skipped' };

  const formats =
    format === 'wms' ? getWmsAdvertisedFormats(xmlDoc) : getWmtsLayerFormats(layer);
  const imageFormat = pickImageFormat(formats);

  const probeUrl =
    format === 'wms'
      ? buildWmsGetMapUrl(serviceUrl, layer, layerName, imageFormat)
      : buildWmtsGetTileUrl(serviceUrl, layer, layerName, imageFormat);

  if (!probeUrl) return { status: 'skipped' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS);

  try {
    const startedAt = performance.now();
    const res = await fetch(probeUrl, { method: 'GET', signal: controller.signal });
    if (!res.ok) {
      // Don't mask reachability — just skip.
      return { status: 'skipped' };
    }
    const blob = await res.blob();
    const durationMs = performance.now() - startedAt;
    const bytes = blob.size;

    const issues: string[] = [];
    if (durationMs > SLOW_TILE_MS) issues.push(`slow tile (${formatMs(durationMs)})`);
    if (bytes > LARGE_TILE_BYTES) issues.push(`heavy tile (${formatBytes(bytes)})`);

    if (issues.length === 0) {
      return { status: 'ok', durationMs, bytes };
    }
    return { status: 'warning', durationMs, bytes, message: issues.join('; ') };
  } catch {
    return { status: 'skipped' };
  } finally {
    clearTimeout(timer);
  }
}
