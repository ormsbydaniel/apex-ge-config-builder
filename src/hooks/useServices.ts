
import { useState } from 'react';
import { Service, ServiceCapabilities, DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export const useServices = (services: Service[], onAddService: (service: Service) => void) => {
  const { toast } = useToast();
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);

  const parseGetCapabilities = async (url: string, format: DataSourceFormat): Promise<ServiceCapabilities | null> => {
    try {
      setIsLoadingCapabilities(true);
      
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
          
          // Only add layers that have a Name element (actual layers, not layer groups)
          if (nameElement?.textContent) {
            layers.push({
              name: nameElement.textContent,
              title: titleElement?.textContent || nameElement.textContent,
              abstract: abstractElement?.textContent
            });
          }
        });
      } else if (format === 'wmts') {
        const layerElements = xmlDoc.querySelectorAll('Layer');
        layerElements.forEach(layer => {
          const identifier = layer.querySelector('ows\\:Identifier, Identifier');
          const title = layer.querySelector('ows\\:Title, Title');
          const abstract = layer.querySelector('ows\\:Abstract, Abstract');
          
          if (identifier?.textContent) {
            layers.push({
              name: identifier.textContent,
              title: title?.textContent || identifier.textContent,
              abstract: abstract?.textContent
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
      toast({
        title: "GetCapabilities Error",
        description: "Failed to fetch service capabilities. You can still configure the service manually.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingCapabilities(false);
    }
  };

  const addService = async (name: string, url: string, format: DataSourceFormat) => {
    // Generate a unique service ID without the zero suffix
    const serviceId = `${format}-service-${Date.now()}`;
    
    // For formats that support GetCapabilities, try to fetch them
    let capabilities: ServiceCapabilities | undefined;
    if (format !== 'xyz') {
      capabilities = await parseGetCapabilities(url, format) || undefined;
    }

    const service: Service = {
      id: serviceId,
      name: name.trim(),
      url: url.trim(),
      format,
      ...(capabilities && { capabilities })
    };

    onAddService(service);
    
    if (capabilities?.layers.length) {
      toast({
        title: "Service Added",
        description: `${name} added with ${capabilities.layers.length} layers discovered.`,
      });
    } else {
      toast({
        title: "Service Added",
        description: `${name} added. Configure layers manually.`,
      });
    }

    return service;
  };

  return {
    addService,
    isLoadingCapabilities
  };
};
