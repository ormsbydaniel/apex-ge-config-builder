import { DataSource, DataSourceItem, UrlValidationResult, LayerValidationResult } from '@/types/config';
import { probeGeojsonSize } from '@/utils/geojsonProbe';
import { probeCogPerformance } from '@/utils/cogPerformanceProbe';
import { probeServiceCapabilitiesPerformance } from '@/utils/serviceCapabilitiesPerformanceProbe';
import { probeTileRequest } from '@/utils/serviceTileProbe';
import { checkMixedContent } from '@/utils/transportSecurityProbe';

/** Threshold for flagging GeoJSON files as a performance warning. */
const GEOJSON_PERF_WARNING_BYTES = 5 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

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
    const directResult = await validateDirectUrl(url, type);

    // GeoJSON-only performance check: layered on top of reachability,
    // but only if the URL is reachable. Reachability problems remain 'error'.
    if (directResult.status === 'valid' && format === 'geojson') {
      const probe = await probeGeojsonSize(url, { largeBytes: GEOJSON_PERF_WARNING_BYTES });
      // Only flag known-oversized files. "Size unknown" / errors here are ignored —
      // the layer already passed reachability above.
      if (probe.status === 'warning' && typeof probe.bytes === 'number') {
        directResult.status = 'performance-warning';
        directResult.warning = probe.message ?? `Large file: ${formatBytes(probe.bytes)} (threshold ${formatBytes(GEOJSON_PERF_WARNING_BYTES)})`;
        directResult.bytes = probe.bytes;
      }
    }

    // COG performance check: tile size, overviews, compression, interleave.
    // Only runs if the URL is reachable; probe failures are swallowed so they
    // never mask the upstream "valid" status.
    if (directResult.status === 'valid' && format === 'cog') {
      const cogProbe = await probeCogPerformance(url);
      if (cogProbe.status === 'warning' && cogProbe.message) {
        directResult.status = 'performance-warning';
        directResult.warning = cogProbe.message;
      }
    }

    // Mixed-content check: HTTP asset on an HTTPS page will be blocked.
    // Layered on top of reachability — only flagged if otherwise valid/warning.
    if (directResult.status === 'valid' || directResult.status === 'performance-warning') {
      const mixed = checkMixedContent(url);
      if (mixed) {
        const existing = directResult.warning;
        directResult.status = 'performance-warning';
        directResult.warning = existing ? `${existing}; ${mixed.message}` : mixed.message;
      }
    }

    return directResult;
    
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

    const startedAt = performance.now();
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
    const durationMs = performance.now() - startedAt;
    const headerLen = Number(response.headers.get('Content-Length'));
    const bytes = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : xmlText.length;

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
    result.bytes = bytes;

    // Performance checks (capabilities-only, no extra network calls).
    // Never masks reachability errors — only runs once we're 'valid'.
    const perfProbe = probeServiceCapabilitiesPerformance(
      format,
      layers,
      xmlDoc,
      { durationMs, bytes },
    );
    const perfIssues: string[] = [...perfProbe.issues];

    // Active tile-request probe (one GetMap / GetTile call).
    const tileProbe = await probeTileRequest(url, format, layers, xmlDoc);
    if (tileProbe.status === 'warning' && tileProbe.message) {
      perfIssues.push(tileProbe.message);
    }

    // Mixed-content check on the service URL itself.
    const mixed = checkMixedContent(url);
    if (mixed) perfIssues.push(mixed.message);

    if (perfIssues.length > 0) {
      result.status = 'performance-warning';
      result.warning = perfIssues.join('; ');
    }

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

  // Determine overall status. Priority (highest first):
  //   error > partial > performance-warning > valid
  // Performance warnings never mask reachability failures.
  let overallStatus: LayerValidationResult['overallStatus'] = 'valid';

  if (urlResults.length === 0) {
    overallStatus = 'valid'; // No URLs to validate
  } else {
    const errorCount = urlResults.filter(r => r.status === 'error').length;
    const checkingCount = urlResults.filter(r => r.status === 'checking').length;
    const skippedCount = urlResults.filter(r => r.status === 'skipped').length;
    const perfWarningCount = urlResults.filter(r => r.status === 'performance-warning').length;
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
    } else if (perfWarningCount > 0) {
      overallStatus = 'performance-warning';
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

export interface ValidateBatchCallbacks {
  onProgress?: (completed: number, total: number, layerName: string) => void;
  /** Fired immediately before a layer's checks begin. Useful for showing a spinner on that row. */
  onLayerStart?: (index: number, layerName: string) => void;
  /** Fired as soon as a single layer's result is available — drives real-time UI updates. */
  onLayerResult?: (index: number, result: LayerValidationResult) => void;
}

/**
 * Validates multiple layers in parallel with concurrency control.
 *
 * Backwards compatible: the third argument may be either a plain `onProgress`
 * function (legacy) or a `ValidateBatchCallbacks` object with richer hooks.
 */
export async function validateBatchLayers(
  layers: DataSource[],
  services?: any[],
  callbacksOrOnProgress?:
    | ValidateBatchCallbacks
    | ((completed: number, total: number, layerName: string) => void)
): Promise<Map<number, LayerValidationResult>> {
  const callbacks: ValidateBatchCallbacks = typeof callbacksOrOnProgress === 'function'
    ? { onProgress: callbacksOrOnProgress }
    : (callbacksOrOnProgress ?? {});

  const results = new Map<number, LayerValidationResult>();
  const concurrencyLimit = 5; // Process 5 layers at a time

  // Process layers in batches
  for (let i = 0; i < layers.length; i += concurrencyLimit) {
    const batch = layers.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async (layer, batchIndex) => {
      const actualIndex = i + batchIndex;
      callbacks.onLayerStart?.(actualIndex, layer.name);

      const result = await validateLayerUrls(layer, services);
      results.set(actualIndex, result);

      callbacks.onLayerResult?.(actualIndex, result);
      callbacks.onProgress?.(results.size, layers.length, layer.name);

      return result;
    });

    await Promise.all(batchPromises);
  }

  return results;
}
