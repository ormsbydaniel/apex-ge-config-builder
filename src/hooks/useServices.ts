
import { useState } from 'react';
import { Service, ServiceCapabilities, DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { fetchS3BucketContents } from '@/utils/s3Utils';
import { fetchStacCapabilities } from '@/utils/stacCapabilities';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';

export const useServices = (services: Service[], onAddService: (service: Service) => void) => {
  const { toast } = useToast();
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);

  const parseGetCapabilities = async (url: string, format: DataSourceFormat): Promise<ServiceCapabilities | null> => {
    try {
      setIsLoadingCapabilities(true);
      return await fetchServiceCapabilities(url, format);
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
      
      const layers = objects.map(object => ({
        name: object.key,
        title: object.key.split('/').pop() || object.key,
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

  const fetchStacCatalogue = async (url: string): Promise<{ capabilities: ServiceCapabilities | null; title?: string }> => {
    try {
      setIsLoadingCapabilities(true);
      const result = await fetchStacCapabilities(url);
      if (!result.capabilities) {
        toast({
          title: "STAC Catalogue Error",
          description: "Failed to fetch catalogue metadata. Please check the catalogue URL.",
          variant: "destructive"
        });
      }
      return result;
    } finally {
      setIsLoadingCapabilities(false);
    }
  };

  const addService = async (name: string, url: string, format: DataSourceFormat | 'stac', sourceType?: 's3' | 'service' | 'stac') => {
    // Generate a unique service ID
    const serviceId = `${sourceType === 's3' ? 's3' : sourceType === 'stac' ? 'stac' : format}-service-${Date.now()}`;
    
    // For different source types, fetch appropriate metadata
    let capabilities: ServiceCapabilities | undefined;
    let serviceName = name.trim();
    
    if (sourceType === 's3') {
      capabilities = await fetchS3Objects(url) || undefined;
    } else if (sourceType === 'stac') {
      const stacResult = await fetchStacCatalogue(url);
      capabilities = stacResult.capabilities || undefined;
      // Auto-populate service name from STAC catalogue title if not provided or empty
      if (!serviceName || serviceName === '') {
        serviceName = stacResult.title || 'STAC Catalogue';
      }
    } else if (format !== 'xyz' && format !== 'stac') {
      // For formats that support capabilities, try to fetch them
      capabilities = await parseGetCapabilities(url, format as DataSourceFormat) || undefined;
    }

    const service: Service = {
      id: serviceId,
      name: serviceName,
      url: url.trim(),
      format,
      sourceType,
      ...(capabilities && { capabilities })
    };

    onAddService(service);
    
    if (capabilities?.layers.length) {
      const itemType = sourceType === 's3' ? 'objects' : sourceType === 'stac' ? 'collections' : 'layers';
      toast({
        title: "Service Added",
        description: `${serviceName} added with ${capabilities.layers.length} ${itemType} discovered.`,
      });
    } else {
      toast({
        title: "Service Added",
        description: `${serviceName} added. Configure layers manually.`,
      });
    }

    return service;
  };

  return {
    addService,
    isLoadingCapabilities
  };
};
