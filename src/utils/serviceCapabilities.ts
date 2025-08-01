
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
          
          // Only add layers that have a Name element (actual layers, not layer groups)
          if (nameElement?.textContent) {
            layers.push({
              name: nameElement.textContent,
              title: titleElement?.textContent || nameElement.textContent,
              abstract: abstractElement?.textContent,
              hasTimeDimension
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
          
          if (identifier?.textContent) {
            layers.push({
              name: identifier.textContent,
              title: title?.textContent || identifier.textContent,
              abstract: abstract?.textContent,
              hasTimeDimension
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
