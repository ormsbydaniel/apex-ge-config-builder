
import { DataSourceFormat, ServiceCapabilities } from '@/types/config';

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

// Function to fetch capabilities for a service
export const fetchServiceCapabilities = async (url: string, format: DataSourceFormat): Promise<ServiceCapabilities | null> => {
  try {
    // Skip capabilities for formats that don't support OGC GetCapabilities
    if (format === 'xyz' || format === 'cog' || format === 'geojson' || format === 'flatgeobuf') {
      return null;
    }

    // Construct GetCapabilities URL
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.set('service', format.toUpperCase());
    capabilitiesUrl.searchParams.set('request', 'GetCapabilities');
    const version =
      format === 'wms' ? '1.3.0' :
      format === 'wfs' ? '2.0.0' :
      '1.0.0';
    capabilitiesUrl.searchParams.set('version', version);

    // Use AbortController to enforce a 10-second timeout per service
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(capabilitiesUrl.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const xmlText = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse GetCapabilities response');
    }

    const layers: any[] = [];
    
      if (format === 'wms') {
        // Fix: Use a more specific selector to avoid duplicates
        const layerElements = xmlDoc.querySelectorAll('Layer');
        layerElements.forEach(layer => {
          const nameElement = layer.querySelector('Name');
          const titleElement = layer.querySelector('Title');
          const abstractElement = layer.querySelector('Abstract');
          
          // Check for TIME dimension
          const timeDimension = layer.querySelector('Dimension[name="time"], Dimension[name="TIME"]');
          const hasTimeDimension = !!timeDimension;
          const defaultTime = timeDimension?.getAttribute('default') || undefined;
          
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
          if (!legendGraphicUrl && nameElement?.textContent) {
            // Extract base URL (remove query parameters)
            const baseUrl = url.split('?')[0];
            const layerName = nameElement.textContent;
            legendGraphicUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=${encodeURIComponent(layerName)}`;
          }
          
          // Only add layers that have a Name element (actual layers, not layer groups)
          if (nameElement?.textContent) {
            layers.push({
              name: nameElement.textContent,
              title: titleElement?.textContent || nameElement.textContent,
              abstract: abstractElement?.textContent,
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
        const layerElements = xmlDoc.querySelectorAll('Layer');
        layerElements.forEach(layer => {
          const identifier = layer.querySelector('ows\\:Identifier, Identifier');
          const title = layer.querySelector('ows\\:Title, Title');
          const abstract = layer.querySelector('ows\\:Abstract, Abstract');
          
          // Check for TIME dimension in WMTS - improved detection
          const timeDimension = layer.querySelector('Dimension > ows\\:Identifier, Dimension > Identifier');
          const hasTimeDimension = timeDimension?.textContent?.toUpperCase() === 'TIME';
          const defaultTime = hasTimeDimension 
            ? layer.querySelector('Dimension > ows\\:Default, Dimension > Default')?.textContent || undefined
            : undefined;
          
          // Extract TileMatrixSet (CRS info)
          const tileMatrixSetElements = layer.querySelectorAll('TileMatrixSetLink > TileMatrixSet');
          const crsList = Array.from(tileMatrixSetElements).map(el => el.textContent).filter(Boolean);
          
          // Extract WGS84 bounding box
          const bboxElement = layer.querySelector('ows\\:WGS84BoundingBox, WGS84BoundingBox');
          let bbox = undefined;
          if (bboxElement) {
            const lowerCorner = bboxElement.querySelector('ows\\:LowerCorner, LowerCorner')?.textContent?.split(' ');
            const upperCorner = bboxElement.querySelector('ows\\:UpperCorner, UpperCorner')?.textContent?.split(' ');
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
          
          if (identifier?.textContent) {
            layers.push({
              name: identifier.textContent,
              title: title?.textContent || identifier.textContent,
              abstract: abstract?.textContent,
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

    return {
      layers: layers, // Remove the .slice(0, 50) limitation
      title: xmlDoc.querySelector('Service > Title, ows\\:ServiceIdentification > ows\\:Title')?.textContent || undefined,
      abstract: xmlDoc.querySelector('Service > Abstract, ows\\:ServiceIdentification > ows\\:Abstract')?.textContent || undefined
    };
  } catch (error) {
    console.error('Error fetching GetCapabilities:', error);
    return null;
  }
};
