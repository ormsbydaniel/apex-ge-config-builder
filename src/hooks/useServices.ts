
import { useState } from 'react';
import { Service, ServiceCapabilities, DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { fetchS3BucketContents } from '@/utils/s3Utils';

export const useServices = (services: Service[], onAddService: (service: Service) => void) => {
  const { toast } = useToast();
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);

  const parseGetCapabilities = async (url: string, format: DataSourceFormat): Promise<ServiceCapabilities | null> => {
    try {
      setIsLoadingCapabilities(true);
      
      // Construct GetCapabilities URL for WMS/WMTS
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
          
          // Check for TIME dimension in WMTS
          const timeDimension = layer.querySelector('Dimension[ows\\:Identifier="time"], Dimension[ows\\:Identifier="TIME"], Dimension > ows\\:Identifier');
          const hasTimeDimension = timeDimension?.textContent?.toLowerCase() === 'time';
          
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
        layers: layers,
        title: xmlDoc.querySelector('Service > Title, ows\\:ServiceIdentification > ows\\:Title')?.textContent || undefined,
        abstract: xmlDoc.querySelector('Service > Abstract, ows\\:ServiceIdentification > ows\\:Abstract')?.textContent || undefined
      };
    } catch (error) {
      console.error('Error fetching capabilities:', error);
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

  const fetchS3Objects = async (url: string): Promise<ServiceCapabilities | null> => {
    try {
      setIsLoadingCapabilities(true);
      
      const objects = await fetchS3BucketContents(url);
      
      // Convert S3 objects to layer-like structure for compatibility
      const layers = objects.map(object => ({
        name: object.key,
        title: object.key.split('/').pop() || object.key, // Use filename as title
        abstract: `S3 Object - Size: ${Math.round(object.size / 1024)}KB, Modified: ${new Date(object.lastModified).toLocaleDateString()}`
      }));

      return {
        layers,
        title: 'S3 Bucket Contents',
        abstract: `Found ${objects.length} objects in bucket`
      };
    } catch (error) {
      console.error('Error fetching S3 bucket contents:', error);
      toast({
        title: "S3 Bucket Error",
        description: "Failed to fetch bucket contents. Please check the bucket URL and permissions.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingCapabilities(false);
    }
  };

  const addService = async (name: string, url: string, format: DataSourceFormat, sourceType?: 's3' | 'service') => {
    // Generate a unique service ID
    const serviceId = `${sourceType === 's3' ? 's3' : format}-service-${Date.now()}`;
    
    // For S3 sources, fetch bucket contents instead of capabilities
    let capabilities: ServiceCapabilities | undefined;
    if (sourceType === 's3') {
      capabilities = await fetchS3Objects(url) || undefined;
    } else if (format !== 'xyz') {
      // For formats that support capabilities, try to fetch them
      capabilities = await parseGetCapabilities(url, format) || undefined;
    }

    const service: Service = {
      id: serviceId,
      name: name.trim(),
      url: url.trim(),
      format,
      sourceType,
      ...(capabilities && { capabilities })
    };

    onAddService(service);
    
    if (capabilities?.layers.length) {
      const itemType = sourceType === 's3' ? 'objects' : 'layers';
      toast({
        title: "Service Added",
        description: `${name} added with ${capabilities.layers.length} ${itemType} discovered.`,
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
