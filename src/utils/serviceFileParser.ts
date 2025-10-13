import { ServiceCapabilities, LayerInfo } from '@/types/config';
import { parseXmlToJson, transformS3XmlToStandardFormat } from './xmlParser';

export type DetectedServiceType = 's3' | 'stac' | 'wms' | 'wmts' | 'unknown';

export interface DetectionResult {
  serviceType: DetectedServiceType;
  serviceName: string;
  capabilities: ServiceCapabilities | null;
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
  rawData?: any;
}

/**
 * Main entry point for file-based service detection
 * Handles both JSON and XML files
 */
export function detectServiceTypeFromFile(
  fileContent: string,
  fileName: string,
  fileType: 'json' | 'xml'
): DetectionResult {
  try {
    let parsedData: any;
    
    if (fileType === 'xml') {
      // Parse XML and transform to standard format
      const xmlData = parseXmlToJson(fileContent);
      parsedData = transformS3XmlToStandardFormat(xmlData);
      
      // Store file type in raw data for reference
      if (parsedData) {
        parsedData.__fileType = 'XML';
      }
    } else {
      // Parse JSON
      parsedData = JSON.parse(fileContent);
      if (parsedData) {
        parsedData.__fileType = 'JSON';
      }
    }
    
    return detectServiceTypeFromData(parsedData, fileName);
  } catch (error) {
    return {
      serviceType: 'unknown',
      serviceName: extractNameFromFilename(fileName),
      capabilities: null,
      confidence: 'low',
      warnings: [
        `Failed to parse ${fileType.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    };
  }
}

/**
 * Legacy function for backward compatibility (JSON only)
 */
export function detectServiceTypeFromJson(jsonData: any, fileName: string): DetectionResult {
  return detectServiceTypeFromData(jsonData, fileName);
}

/**
 * Internal function that performs service type detection from parsed data
 */
function detectServiceTypeFromData(data: any, fileName: string): DetectionResult {
  const warnings: string[] = [];

  // S3 Bucket Listing Detection
  if (detectS3Structure(data)) {
    const capabilities = transformS3ListToCapabilities(data);
    return {
      serviceType: 's3',
      serviceName: data.Name || extractNameFromFilename(fileName, 's3'),
      capabilities,
      confidence: 'high',
      warnings: capabilities.layers.length === 0 ? ['No objects found in S3 bucket listing'] : undefined,
      rawData: data
    };
  }

  // STAC Catalog Detection
  if (detectStacStructure(data)) {
    const capabilities = transformStacToCapabilities(data);
    return {
      serviceType: 'stac',
      serviceName: data.title || data.id || extractNameFromFilename(fileName, 'stac'),
      capabilities,
      confidence: 'high',
      warnings: capabilities.layers.length === 0 ? ['No collections found in STAC catalog'] : undefined,
      rawData: data
    };
  }

  // Custom Capabilities Format Detection
  if (detectCustomFormat(data)) {
    const capabilities = transformCustomFormatToCapabilities(data);
    const detectedType = data.serviceType?.toLowerCase();
    return {
      serviceType: (['s3', 'stac', 'wms', 'wmts'].includes(detectedType) ? detectedType : 'unknown') as DetectedServiceType,
      serviceName: data.serviceName || extractNameFromFilename(fileName),
      capabilities,
      confidence: 'medium',
      warnings: capabilities.layers.length === 0 ? ['No layers found in capabilities'] : undefined,
      rawData: data
    };
  }

  // Unknown format
  return {
    serviceType: 'unknown',
    serviceName: extractNameFromFilename(fileName),
    capabilities: null,
    confidence: 'low',
    warnings: ['Could not automatically detect service type. Please select manually.'],
    rawData: data
  };
}

function detectS3Structure(data: any): boolean {
  // AWS S3 ListObjectsV2 response format
  if (data.ListBucketResult?.Contents || data.Contents) {
    return true;
  }
  
  // Simple array of objects with S3-like properties
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    return !!(firstItem.Key && (firstItem.Size !== undefined || firstItem.LastModified));
  }
  
  return false;
}

function detectStacStructure(data: any): boolean {
  // STAC catalog or collection
  if (data.stac_version || data.type === 'Catalog' || data.type === 'Collection') {
    return true;
  }
  
  // Check for collections array
  if (data.collections && Array.isArray(data.collections)) {
    return true;
  }
  
  return false;
}

function detectCustomFormat(data: any): boolean {
  return !!(data.serviceType && data.capabilities?.layers);
}

function transformS3ListToCapabilities(data: any): ServiceCapabilities {
  let contents: any[] = [];
  
  // Handle different S3 response formats
  if (data.ListBucketResult?.Contents) {
    contents = Array.isArray(data.ListBucketResult.Contents) 
      ? data.ListBucketResult.Contents 
      : [data.ListBucketResult.Contents];
  } else if (data.Contents) {
    contents = Array.isArray(data.Contents) ? data.Contents : [data.Contents];
  } else if (Array.isArray(data)) {
    contents = data;
  }

  const layers: LayerInfo[] = contents.map((item: any) => ({
    name: item.Key || item.key || 'unknown',
    title: item.Key || item.key || 'Unnamed Object',
    abstract: `Size: ${formatBytes(item.Size || item.size || 0)}, Last Modified: ${item.LastModified || item.lastModified || 'Unknown'}`
  }));

  return {
    layers,
    title: data.Name || data.name || 'S3 Bucket',
    abstract: `S3 bucket with ${layers.length} objects`
  };
}

function transformStacToCapabilities(data: any): ServiceCapabilities {
  const collections: any[] = data.collections || [];
  
  const layers: LayerInfo[] = collections.map((collection: any) => ({
    name: collection.id || collection.name || 'unknown',
    title: collection.title || collection.id || 'Unnamed Collection',
    abstract: collection.description || collection.abstract || undefined
  }));

  return {
    layers,
    title: data.title || data.id || 'STAC Catalog',
    abstract: data.description || `STAC catalog with ${layers.length} collections`
  };
}

function transformCustomFormatToCapabilities(data: any): ServiceCapabilities {
  const layers: LayerInfo[] = (data.capabilities?.layers || []).map((layer: any) => ({
    name: layer.name || 'unknown',
    title: layer.title || layer.name || 'Unnamed Layer',
    abstract: layer.abstract || layer.description || undefined,
    hasTimeDimension: layer.hasTimeDimension,
    boundingBox: layer.boundingBox
  }));

  return {
    layers,
    title: data.capabilities?.title || data.serviceName || 'Service',
    abstract: data.capabilities?.abstract || undefined
  };
}

function extractNameFromFilename(fileName: string, serviceType?: string): string {
  // Remove extension and clean up
  const nameWithoutExt = fileName.replace(/\.(json|xml)$/i, '');
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  
  if (serviceType) {
    return `${cleaned} (${serviceType.toUpperCase()})`;
  }
  
  return cleaned;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
