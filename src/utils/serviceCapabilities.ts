
import { DataSourceFormat, ServiceCapabilities } from '@/types/config';
import {
  ProbeDiagnostic,
  classifyFetchError,
  classifyHttpResponse,
} from '@/utils/serviceDiagnostics';
import { parseTimeDimensionValue } from '@/utils/timeDimension';


const getDescendantsByLocalName = (root: ParentNode, localName: string): Element[] =>
  Array.from(root.querySelectorAll('*')).filter(el => el.localName === localName);

const getDirectChildByLocalName = (root: Element, localName: string): Element | undefined =>
  Array.from(root.children).find(el => el.localName === localName);

const getFirstDescendantByLocalName = (root: ParentNode, localName: string): Element | undefined =>
  getDescendantsByLocalName(root, localName)[0];

const getText = (el: Element | undefined): string | undefined =>
  el?.textContent?.trim() || undefined;

const getDirectChildText = (root: Element, localName: string): string | undefined =>
  getText(getDirectChildByLocalName(root, localName));

const getFirstDescendantText = (root: ParentNode, localName: string): string | undefined =>
  getText(getFirstDescendantByLocalName(root, localName));

const getServiceMetadataText = (xmlDoc: Document, localName: 'Title' | 'Abstract'): string | undefined => {
  const service = getFirstDescendantByLocalName(xmlDoc, 'Service');
  const serviceIdentification = getFirstDescendantByLocalName(xmlDoc, 'ServiceIdentification');

  return (
    (service ? getFirstDescendantText(service, localName) : undefined) ||
    (serviceIdentification ? getFirstDescendantText(serviceIdentification, localName) : undefined)
  );
};

export interface ServiceCapabilitiesMetrics {
  capabilities: ServiceCapabilities | null;
  /** Present when capabilities is null, or when the response parsed but is empty/suspicious. */
  diagnostic?: ProbeDiagnostic;
  durationMs?: number;
  bytes?: number;
}

const buildGetCapabilitiesUrlObject = (url: string, format: DataSourceFormat): URL | null => {
  if (format === 'xyz' || format === 'cog' || format === 'geojson' || format === 'flatgeobuf') {
    return null;
  }

  try {
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.set('service', format.toUpperCase());
    capabilitiesUrl.searchParams.set('request', 'GetCapabilities');
    const version =
      format === 'wms' ? '1.3.0' :
      format === 'wfs' ? '2.0.0' :
      '1.0.0';
    capabilitiesUrl.searchParams.set('version', version);
    return capabilitiesUrl;
  } catch {
    return null;
  }
};

export const buildGetCapabilitiesUrl = (url: string, format: DataSourceFormat): string | null => {
  return buildGetCapabilitiesUrlObject(url, format)?.toString() ?? null;
};

// Function to fetch capabilities for a service (with optional timing/size metrics)
export const fetchServiceCapabilitiesWithMetrics = async (
  url: string,
  format: DataSourceFormat,
): Promise<ServiceCapabilitiesMetrics> => {
  // Skip capabilities for formats that don't support OGC GetCapabilities
  if (format === 'xyz' || format === 'cog' || format === 'geojson' || format === 'flatgeobuf') {
    return { capabilities: null };
  }

  // Construct GetCapabilities URL
  const capabilitiesUrl = buildGetCapabilitiesUrlObject(url, format);
  if (!capabilitiesUrl) {
    return {
      capabilities: null,
      diagnostic: {
        category: 'invalid-url',
        title: 'URL is not well-formed',
        hint: 'Check for typos and that the address starts with http:// or https://',
      },
    };
  }

  const capabilitiesUrlString = capabilitiesUrl.toString();


  // Use AbortController to enforce a 10-second timeout per service
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const startedAt = performance.now();
  let response: Response;
  try {
    response = await fetch(capabilitiesUrl.toString(), { signal: controller.signal });
  } catch (err) {
    const durationMs = performance.now() - startedAt;
    return {
      capabilities: null,
      diagnostic: classifyFetchError(err, { url: capabilitiesUrl.toString(), durationMs }),
      durationMs,
    };
  } finally {
    clearTimeout(timer);
  }

  const durationMs = performance.now() - startedAt;
  const httpDiag = classifyHttpResponse(response, { expectedKind: 'xml', durationMs });
  if (httpDiag) {
    return { capabilities: null, diagnostic: httpDiag, durationMs };
  }

  let xmlText: string;
  try {
    xmlText = await response.text();
  } catch (err) {
    return {
      capabilities: null,
      diagnostic: classifyFetchError(err, { url: capabilitiesUrl.toString(), durationMs }),
      durationMs,
    };
  }
  const headerLen = Number(response.headers.get('Content-Length'));
  const bytes = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : xmlText.length;

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    return {
      capabilities: null,
      diagnostic: {
        category: 'parse-xml',
        title: `Response wasn't valid XML`,
        detail: `${format.toUpperCase()} GetCapabilities expected`,
        hint: `The URL may not be a ${format.toUpperCase()} GetCapabilities endpoint.`,
        durationMs,
      },
      durationMs,
      bytes,
    };
  }

  try {

    const layers: any[] = [];
    
      if (format === 'wms') {
        // Fix: Use a more specific selector to avoid duplicates
        const layerElements = getDescendantsByLocalName(xmlDoc, 'Layer');
        layerElements.forEach(layer => {
          const name = getDirectChildText(layer, 'Name');
          const title = getDirectChildText(layer, 'Title');
          const abstract = getDirectChildText(layer, 'Abstract');
          
          // Check for TIME dimension
          const timeDimension = layer.querySelector('Dimension[name="time"], Dimension[name="TIME"]');
          const hasTimeDimension = !!timeDimension;
          const defaultTime = timeDimension?.getAttribute('default') || undefined;
          const timeDimensionValue = timeDimension?.textContent || undefined;
          const timeExtent = timeDimensionValue ? parseTimeDimensionValue(timeDimensionValue) : undefined;

          
          // Extract CRS/EPSG codes
          const crsElements = layer.querySelectorAll('CRS');
          const crsList = Array.from(crsElements).map(el => el.textContent).filter(Boolean);
          
          // Extract bounding box
          const bboxElement = layer.querySelector('EX_GeographicBoundingBox');
          let bbox = undefined;
          if (bboxElement) {
            bbox = {
              west: bboxElement.querySelector('westBoundLongitude')?.textContent,
              east: bboxElement.querySelector('eastBoundLongitude')?.textContent,
              south: bboxElement.querySelector('southBoundLatitude')?.textContent,
              north: bboxElement.querySelector('northBoundLatitude')?.textContent
            };
          }
          
          // Check for LegendURL and extract the actual URL (GetLegendGraphic support)
          const legendURL = layer.querySelector('Style > LegendURL');
          const hasLegendGraphic = !!legendURL;
          let legendGraphicUrl: string | undefined;
          
          if (legendURL) {
            // Try to extract the OnlineResource URL
            const onlineResource = legendURL.querySelector('OnlineResource');
            if (onlineResource) {
              legendGraphicUrl = onlineResource.getAttribute('xlink:href') || 
                                 onlineResource.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
                                 undefined;
            }
          }
          
          // If no URL found in capabilities but layer exists, construct a standard GetLegendGraphic URL
          if (!legendGraphicUrl && name) {
            // Extract base URL (remove query parameters)
            const baseUrl = url.split('?')[0];
            legendGraphicUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=${encodeURIComponent(name)}`;
          }
          
          // Only add layers that have a Name element (actual layers, not layer groups)
          if (name) {
            layers.push({
              name,
              title: title || name,
              abstract,
              hasTimeDimension,
              defaultTime,
              crs: crsList.length > 0 ? crsList : undefined,
              bbox,
              hasLegendGraphic,
              legendGraphicUrl
            });
          }
        });
      } else if (format === 'wmts') {
        const layerElements = getDescendantsByLocalName(xmlDoc, 'Layer');
        layerElements.forEach(layer => {
          const identifier = getDirectChildText(layer, 'Identifier');
          const title = getDirectChildText(layer, 'Title');
          const abstract = getDirectChildText(layer, 'Abstract');
          
          // Check for TIME dimension in WMTS - improved detection
          const timeDimension = getDescendantsByLocalName(layer, 'Dimension').find(dimension =>
            getDirectChildText(dimension, 'Identifier')?.toUpperCase() === 'TIME'
          );
          const hasTimeDimension = !!timeDimension;
          const defaultTime = hasTimeDimension 
            ? getDirectChildText(timeDimension, 'Default')
            : undefined;
          
          // Extract TileMatrixSet (CRS info)
          const crsList = getDescendantsByLocalName(layer, 'TileMatrixSetLink')
            .map(link => getDirectChildText(link, 'TileMatrixSet'))
            .filter(Boolean);
          
          // Extract WGS84 bounding box
          const bboxElement = getFirstDescendantByLocalName(layer, 'WGS84BoundingBox');
          let bbox = undefined;
          if (bboxElement) {
            const lowerCorner = getDirectChildText(bboxElement, 'LowerCorner')?.split(/\s+/);
            const upperCorner = getDirectChildText(bboxElement, 'UpperCorner')?.split(/\s+/);
            if (lowerCorner && upperCorner) {
              bbox = {
                west: lowerCorner[0],
                south: lowerCorner[1],
                east: upperCorner[0],
                north: upperCorner[1]
              };
            }
          }
          
          // WMTS doesn't typically have GetLegendGraphic in the same way as WMS
          const hasLegendGraphic = false;
          
          if (identifier) {
            layers.push({
              name: identifier,
              title: title || identifier,
              abstract,
              hasTimeDimension,
              defaultTime,
              crs: crsList.length > 0 ? crsList : undefined,
              bbox,
              hasLegendGraphic
            });
          }
        });
      } else if (format === 'wfs') {
        // WFS 2.0.0: FeatureType elements under FeatureTypeList
        const featureTypes = xmlDoc.querySelectorAll('FeatureType');
        featureTypes.forEach(ft => {
          const nameEl = ft.querySelector('Name');
          const titleEl = ft.querySelector('Title');
          const abstractEl = ft.querySelector('Abstract');
          if (nameEl?.textContent) {
            layers.push({
              name: nameEl.textContent,
              title: titleEl?.textContent || nameEl.textContent,
              abstract: abstractEl?.textContent,
            });
          }
        });
      }

    // Version actually reported by the service on the capabilities root element
    const defaultVersion =
      format === 'wms' ? '1.3.0' :
      format === 'wfs' ? '2.0.0' :
      '1.0.0';
    const reportedVersion =
      xmlDoc.documentElement?.getAttribute('version')?.trim() || defaultVersion;

    const capabilities: ServiceCapabilities = {
      layers,
      title: getServiceMetadataText(xmlDoc, 'Title'),
      abstract: getServiceMetadataText(xmlDoc, 'Abstract'),
      version: reportedVersion || undefined,
    };
    const diagnostic: ProbeDiagnostic | undefined = layers.length === 0
      ? {
          category: 'empty',
          title: 'Endpoint reachable but no layers were advertised',
          hint: `The ${format.toUpperCase()} GetCapabilities response contained no usable layers.`,
          durationMs,
        }
      : undefined;
    return { capabilities, diagnostic, durationMs, bytes };
  } catch (error) {
    console.error('Error parsing GetCapabilities response:', error);
    return {
      capabilities: null,
      diagnostic: {
        category: 'parse-xml',
        title: `Could not interpret GetCapabilities response`,
        detail: error instanceof Error ? error.message : undefined,
        durationMs,
      },
      durationMs,
      bytes,
    };
  }
};

// Backward-compatible wrapper used by all existing call sites.
export const fetchServiceCapabilities = async (
  url: string,
  format: DataSourceFormat,
): Promise<ServiceCapabilities | null> => {
  const result = await fetchServiceCapabilitiesWithMetrics(url, format);
  return result.capabilities;
};

/**
 * Lightweight version negotiator: fetches the GetCapabilities document for the
 * given OGC service and returns the version reported by the root element. This
 * avoids the full parse performed by fetchServiceCapabilities when only the
 * protocol version is needed.
 */
export const fetchServiceVersion = async (
  url: string,
  format: DataSourceFormat,
): Promise<string | null> => {
  if (format !== 'wms' && format !== 'wmts') return null;

  let capabilitiesUrl: URL;
  try {
    capabilitiesUrl = new URL(url);
  } catch {
    return null;
  }

  capabilitiesUrl.searchParams.set('service', format.toUpperCase());
  capabilitiesUrl.searchParams.set('request', 'GetCapabilities');
  const defaultVersion = format === 'wms' ? '1.3.0' : '1.0.0';
  capabilitiesUrl.searchParams.set('version', defaultVersion);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(capabilitiesUrl.toString(), { signal: controller.signal });
    if (!response.ok) return null;
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    if (xmlDoc.querySelector('parsererror')) return null;
    return xmlDoc.documentElement?.getAttribute('version')?.trim() || defaultVersion;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};


