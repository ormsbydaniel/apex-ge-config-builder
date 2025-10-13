import { ServiceCapabilities, LayerInfo } from '@/types/config';

export type DetectedServiceType = 's3' | 'stac' | 'wms' | 'wmts' | 'unknown';

export interface DetectionResult {
  serviceType: DetectedServiceType;
  serviceName: string;
  capabilities: ServiceCapabilities | null;
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
  rawData?: any;
}

export function detectServiceTypeFromJson(jsonData: any, fileName: string): DetectionResult {
  const warnings: string[] = [];

  // S3 Bucket Listing Detection
  if (detectS3Structure(jsonData)) {
    const capabilities = transformS3ListToCapabilities(jsonData);
    return {
      serviceType: 's3',
      serviceName: jsonData.Name || extractNameFromFilename(fileName, 's3'),
      capabilities,
      confidence: 'high',
      warnings: capabilities.layers.length === 0 ? ['No objects found in S3 bucket listing'] : undefined,
      rawData: jsonData
    };
  }

  // STAC Catalog Detection
  if (detectStacStructure(jsonData)) {
    const capabilities = transformStacToCapabilities(jsonData);
    return {
      serviceType: 'stac',
      serviceName: jsonData.title || jsonData.id || extractNameFromFilename(fileName, 'stac'),
      capabilities,
      confidence: 'high',
      warnings: capabilities.layers.length === 0 ? ['No collections found in STAC catalog'] : undefined,
      rawData: jsonData
    };
  }

  // Custom Capabilities Format Detection
  if (detectCustomFormat(jsonData)) {
    const capabilities = transformCustomFormatToCapabilities(jsonData);
    const detectedType = jsonData.serviceType?.toLowerCase();
    return {
      serviceType: (['s3', 'stac', 'wms', 'wmts'].includes(detectedType) ? detectedType : 'unknown') as DetectedServiceType,
      serviceName: jsonData.serviceName || extractNameFromFilename(fileName),
      capabilities,
      confidence: 'medium',
      warnings: capabilities.layers.length === 0 ? ['No layers found in capabilities'] : undefined,
      rawData: jsonData
    };
  }

  // Unknown format
  return {
    serviceType: 'unknown',
    serviceName: extractNameFromFilename(fileName),
    capabilities: null,
    confidence: 'low',
    warnings: ['Could not automatically detect service type. Please select manually.'],
    rawData: jsonData
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
  const nameWithoutExt = fileName.replace(/\.json$/i, '');
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
