
import { DataSourceFormat, ServiceCapabilities } from '@/types/config';

// Function to fetch capabilities for a service
export const fetchServiceCapabilities = async (url: string, format: DataSourceFormat): Promise<ServiceCapabilities | null> => {
  try {
    // Skip capabilities for xyz format
    if (format === 'xyz') {
      return null;
    }

    // Construct GetCapabilities URL
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.set('service', format.toUpperCase());
    capabilitiesUrl.searchParams.set('request', 'GetCapabilities');
    capabilitiesUrl.searchParams.set('version', format === 'wms' ? '1.3.0' : '1.0.0');

    const response = await fetch(capabilitiesUrl.toString());
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
