
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

      const ensureSlash = (u: string) => (u.endsWith('/') ? u : u + '/');
      const rootUrl = url;

      // Fetch root first so we can detect whether this is actually a catalog root,
      // or a direct openEO job-result style STAC-like response (assets at top-level).
      const rootRes = await fetch(rootUrl);
      const rootJson = await rootRes.json();

      // openEO job results pattern: no /collections, just a JSON with top-level "assets"
      if (rootJson?.assets && typeof rootJson.assets === 'object') {
        const assetCount = Object.keys(rootJson.assets).length;
        const title = rootJson.title || rootJson.id || 'STAC Assets';

        return {
          capabilities: {
            layers: [
              {
                name: 'assets',
                title: `Assets (${assetCount})`,
                abstract: 'Direct STAC assets response (openEO job results)',
              },
            ],
            title: rootJson.title,
            abstract: rootJson.description,
            totalCount: assetCount,
          },
          title,
        };
      }

      // Otherwise assume a STAC Catalog and fetch collections
      // IMPORTANT: do NOT append a trailing slash to signed URLs with query params.
      const baseUrl = new URL(url);
      baseUrl.search = '';
      baseUrl.hash = '';
      const collectionsUrl = ensureSlash(baseUrl.toString()) + 'collections?limit=100';
      const collRes = await fetch(collectionsUrl);

      const catalogue = rootJson;
      const collectionsJson = await collRes.json();

      const title = catalogue.title || catalogue.id || 'STAC Catalogue';

      let layers: any[] = [];
      const collections = collectionsJson.collections || collectionsJson; // some servers may return array directly

      // Use numberMatched from STAC API if available, otherwise use array length
      const totalCollections = collectionsJson.numberMatched !== undefined
        ? collectionsJson.numberMatched
        : (Array.isArray(collections) ? collections.length : 0);

      if (Array.isArray(collections)) {
        layers = collections.map((c: any) => ({
          name: c.id || c.title,
          title: c.title || c.id,
          abstract: c.description || 'STAC Collection'
        }));
      }

      return {
        capabilities: {
          layers,
          title: catalogue.title,
          abstract: catalogue.description,
          totalCount: totalCollections
        },
        title
      };
    } catch (error) {
      console.error('Error fetching STAC catalogue:', error);
      toast({
        title: "STAC Catalogue Error",
        description: "Failed to fetch catalogue metadata. Please check the catalogue URL.",
        variant: "destructive"
      });
      return { capabilities: null };
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
