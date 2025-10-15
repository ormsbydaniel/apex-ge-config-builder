import { DataSource, DataSourceItem, UrlValidationResult, LayerValidationResult } from '@/types/config';

/**
 * Validates a single URL by attempting to fetch it
 * Uses HEAD request for better performance, falls back to GET with range if needed
 */
async function validateUrl(url: string, type: 'data' | 'statistics'): Promise<UrlValidationResult> {
  const result: UrlValidationResult = {
    url,
    type,
    status: 'checking'
  };

  try {
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Try HEAD request first (without no-cors to read actual status)
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check actual HTTP status code
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
        
        // Check actual HTTP status code
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
 */
export async function validateLayerUrls(layer: DataSource): Promise<LayerValidationResult> {
  const urlResults: UrlValidationResult[] = [];

  // Collect all URLs from data sources
  if (layer.data && Array.isArray(layer.data)) {
    for (const dataItem of layer.data) {
      if (dataItem.url) {
        const result = await validateUrl(dataItem.url, 'data');
        urlResults.push(result);
      }
    }
  }

  // Collect all URLs from statistics sources
  if (layer.statistics && Array.isArray(layer.statistics)) {
    for (const statsItem of layer.statistics) {
      if (statsItem.url) {
        const result = await validateUrl(statsItem.url, 'statistics');
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
    
    if (checkingCount > 0) {
      overallStatus = 'checking';
    } else if (errorCount === urlResults.length) {
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
  onProgress?: (completed: number, total: number, layerName: string) => void
): Promise<Map<number, LayerValidationResult>> {
  const results = new Map<number, LayerValidationResult>();
  const concurrencyLimit = 5; // Process 5 layers at a time
  
  // Process layers in batches
  for (let i = 0; i < layers.length; i += concurrencyLimit) {
    const batch = layers.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async (layer, batchIndex) => {
      const actualIndex = i + batchIndex;
      const result = await validateLayerUrls(layer);
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
