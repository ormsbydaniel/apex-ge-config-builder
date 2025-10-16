import { DataSource, DataSourceItem, UrlValidationResult, LayerValidationResult } from '@/types/config';

/**
 * Validates a single URL with format-aware logic
 * - WMS/WMTS: Validates GetCapabilities and checks if layer exists
 * - XYZ: Skips validation (template URL)
 * - Direct files (COG, GeoJSON, FlatGeobuf): Uses HEAD/GET request
 */
async function validateUrl(
  url: string, 
  type: 'data' | 'statistics',
  format?: string,
  layers?: string
): Promise<UrlValidationResult> {
  const result: UrlValidationResult = {
    url,
    type,
    format,
    layers,
    status: 'checking'
  };

  try {
    // Handle XYZ tile templates - skip validation
    if (format === 'xyz') {
      result.status = 'skipped';
      result.validationType = 'skipped';
      result.error = 'Template URL (not validated)';
      return result;
    }

    // Handle WMS/WMTS - validate via GetCapabilities
    if (format === 'wms' || format === 'wmts') {
      return await validateServiceUrl(url, type, format, layers);
    }

    // For direct file URLs (COG, GeoJSON, FlatGeobuf, etc.)
    return await validateDirectUrl(url, type);
    
  } catch (error) {
    if (error instanceof Error) {
      result.status = 'error';
      result.error = error.message;
    } else {
      result.status = 'error';
      result.error = 'Unknown error occurred';
    }
    return result;
  }
}

/**
 * Validates WMS/WMTS services via GetCapabilities
 */
async function validateServiceUrl(
  url: string,
  type: 'data' | 'statistics',
  format: 'wms' | 'wmts',
  layers?: string
): Promise<UrlValidationResult> {
  const result: UrlValidationResult = {
    url,
    type,
    format,
    layers,
    status: 'checking',
    validationType: 'get-capabilities'
  };

  try {
    // Construct GetCapabilities URL
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.set('service', format.toUpperCase());
    capabilitiesUrl.searchParams.set('request', 'GetCapabilities');
    capabilitiesUrl.searchParams.set('version', format === 'wms' ? '1.3.0' : '1.0.0');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for capabilities

    const response = await fetch(capabilitiesUrl.toString(), {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.status = 'error';
      result.statusCode = response.status;
      result.error = `GetCapabilities failed: HTTP ${response.status}`;
      return result;
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      result.status = 'error';
      result.error = 'Invalid XML response from GetCapabilities';
      return result;
    }

    // If layers parameter is specified, check if it exists in capabilities
    if (layers) {
      const layerExists = checkLayerInCapabilities(xmlDoc, format, layers);
      if (!layerExists) {
        result.status = 'error';
        result.error = `Layer "${layers}" not found in service capabilities`;
        return result;
      }
    }

    result.status = 'valid';
    result.statusCode = response.status;
    return result;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.status = 'error';
        result.error = 'GetCapabilities timeout (>15s)';
      } else {
        result.status = 'error';
        result.error = `GetCapabilities error: ${error.message}`;
      }
    } else {
      result.status = 'error';
      result.error = 'Unknown error during GetCapabilities';
    }
    return result;
  }
}

/**
 * Checks if a layer exists in WMS/WMTS capabilities document
 */
function checkLayerInCapabilities(xmlDoc: Document, format: 'wms' | 'wmts', layerName: string): boolean {
  if (format === 'wms') {
    const nameElements = xmlDoc.querySelectorAll('Layer > Name');
    for (const nameElement of Array.from(nameElements)) {
      if (nameElement.textContent === layerName) {
        return true;
      }
    }
  } else if (format === 'wmts') {
    const identifierElements = xmlDoc.querySelectorAll('Layer > ows\\:Identifier, Layer > Identifier');
    for (const identifier of Array.from(identifierElements)) {
      if (identifier.textContent === layerName) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates direct file URLs using HEAD/GET requests
 */
async function validateDirectUrl(url: string, type: 'data' | 'statistics'): Promise<UrlValidationResult> {
  const result: UrlValidationResult = {
    url,
    type,
    status: 'checking',
    validationType: 'head-request'
  };

  try {
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Try HEAD request first
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        result.status = 'valid';
        result.statusCode = response.status;
      } else {
        result.status = 'error';
        result.statusCode = response.status;
        result.error = `HTTP ${response.status} ${response.statusText || 'error'}`;
      }
      
      return result;
    } catch (headError) {
      clearTimeout(timeoutId);
      
      // If HEAD fails, try GET with Range header
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0'
          },
          signal: controller2.signal
        });

        clearTimeout(timeoutId2);
        
        if (response.ok || response.status === 206) {
          result.status = 'valid';
          result.statusCode = response.status;
        } else {
          result.status = 'error';
          result.statusCode = response.status;
          result.error = `HTTP ${response.status} ${response.statusText || 'error'}`;
        }
        
        return result;
      } catch (getError) {
        clearTimeout(timeoutId2);
        throw getError;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.status = 'error';
        result.error = 'Request timeout (>10s)';
      } else {
        // Better CORS error messaging
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          result.status = 'error';
          result.error = 'CORS error or network failure - unable to validate URL';
        } else {
          result.status = 'error';
          result.error = error.message;
        }
      }
    } else {
      result.status = 'error';
      result.error = 'Unknown error occurred';
    }
    
    return result;
  }
}

/**
 * Validates all URLs in a layer's data and statistics sources
 * Now includes format-aware validation
 */
export async function validateLayerUrls(layer: DataSource, services?: any[]): Promise<LayerValidationResult> {
  const urlResults: UrlValidationResult[] = [];

  // Helper to resolve service URL from serviceId
  const resolveServiceUrl = (serviceId: string): string | null => {
    if (!services) return null;
    const service = services.find(s => s.id === serviceId);
    return service?.url || null;
  };

  // Collect all URLs from data sources
  if (layer.data && Array.isArray(layer.data)) {
    for (const dataItem of layer.data) {
      let urlToValidate = dataItem.url;
      
      // If no direct URL but has serviceId, resolve the service URL
      if (!urlToValidate && dataItem.serviceId) {
        urlToValidate = resolveServiceUrl(dataItem.serviceId);
      }
      
      if (urlToValidate) {
        const result = await validateUrl(
          urlToValidate,
          'data',
          dataItem.format,
          dataItem.layers
        );
        
        // Mark if this was a service lookup
        if (!dataItem.url && dataItem.serviceId) {
          result.validationType = 'service-lookup';
        }
        
        urlResults.push(result);
      }
    }
  }

  // Collect all URLs from statistics sources
  if (layer.statistics && Array.isArray(layer.statistics)) {
    for (const statsItem of layer.statistics) {
      let urlToValidate = statsItem.url;
      
      // If no direct URL but has serviceId, resolve the service URL
      if (!urlToValidate && statsItem.serviceId) {
        urlToValidate = resolveServiceUrl(statsItem.serviceId);
      }
      
      if (urlToValidate) {
        const result = await validateUrl(
          urlToValidate,
          'statistics',
          statsItem.format,
          statsItem.layers
        );
        
        // Mark if this was a service lookup
        if (!statsItem.url && statsItem.serviceId) {
          result.validationType = 'service-lookup';
        }
        
        urlResults.push(result);
      }
    }
  }

  // Determine overall status
  let overallStatus: LayerValidationResult['overallStatus'] = 'valid';
  
  if (urlResults.length === 0) {
    overallStatus = 'valid'; // No URLs to validate
  } else {
    const errorCount = urlResults.filter(r => r.status === 'error').length;
    const checkingCount = urlResults.filter(r => r.status === 'checking').length;
    const skippedCount = urlResults.filter(r => r.status === 'skipped').length;
    const validatableCount = urlResults.length - skippedCount;
    
    if (checkingCount > 0) {
      overallStatus = 'checking';
    } else if (validatableCount === 0) {
      // All URLs were skipped (e.g., all XYZ templates)
      overallStatus = 'valid';
    } else if (errorCount === validatableCount) {
      overallStatus = 'error';
    } else if (errorCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'valid';
    }
  }

  return {
    layerName: layer.name,
    overallStatus,
    urlResults,
    checkedAt: new Date()
  };
}

/**
 * Validates multiple layers in parallel with concurrency control
 */
export async function validateBatchLayers(
  layers: DataSource[],
  services?: any[],
  onProgress?: (completed: number, total: number, layerName: string) => void
): Promise<Map<number, LayerValidationResult>> {
  const results = new Map<number, LayerValidationResult>();
  const concurrencyLimit = 5; // Process 5 layers at a time
  
  // Process layers in batches
  for (let i = 0; i < layers.length; i += concurrencyLimit) {
    const batch = layers.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async (layer, batchIndex) => {
      const actualIndex = i + batchIndex;
      const result = await validateLayerUrls(layer, services);
      results.set(actualIndex, result);
      
      if (onProgress) {
        onProgress(results.size, layers.length, layer.name);
      }
      
      return result;
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}
