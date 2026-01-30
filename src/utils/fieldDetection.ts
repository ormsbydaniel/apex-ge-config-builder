/**
 * Field detection utilities for vector data sources.
 * Detects field names from FlatGeoBuf and GeoJSON sources.
 */

import { fetchFlatGeobufMetadata } from './flatgeobufMetadata';

export interface DetectedField {
  name: string;
  type: string;
}

/**
 * Detect fields from a FlatGeoBuf source
 */
export async function detectFieldsFromFlatGeoBuf(url: string): Promise<DetectedField[]> {
  try {
    const metadata = await fetchFlatGeobufMetadata(url);
    return metadata.columns.map(col => ({
      name: col.name,
      type: col.type.toLowerCase()
    }));
  } catch (error) {
    console.error('Error detecting fields from FlatGeoBuf:', error);
    throw error;
  }
}

/**
 * Detect fields from a GeoJSON source by fetching and parsing the first feature
 */
export async function detectFieldsFromGeoJSON(url: string): Promise<DetectedField[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle both FeatureCollection and single Feature
    let properties: Record<string, any> | null = null;
    
    if (data.type === 'FeatureCollection' && data.features?.length > 0) {
      properties = data.features[0].properties;
    } else if (data.type === 'Feature' && data.properties) {
      properties = data.properties;
    }

    if (!properties) {
      return [];
    }

    // Infer types from values
    return Object.entries(properties).map(([name, value]) => ({
      name,
      type: inferTypeFromValue(value)
    }));
  } catch (error) {
    console.error('Error detecting fields from GeoJSON:', error);
    throw error;
  }
}

/**
 * Infer the type of a value from its JavaScript type
 */
function inferTypeFromValue(value: any): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double';
  }
  if (typeof value === 'boolean') {
    return 'bool';
  }
  if (typeof value === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'datetime';
    }
    return 'string';
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return 'json';
  }
  return 'string';
}

/**
 * Unified field detection based on format
 */
export async function detectFieldsFromSource(
  url: string, 
  format: string
): Promise<DetectedField[]> {
  const normalizedFormat = format.toLowerCase();
  
  if (normalizedFormat === 'flatgeobuf' || normalizedFormat === 'fgb') {
    return detectFieldsFromFlatGeoBuf(url);
  }
  
  if (normalizedFormat === 'geojson' || normalizedFormat === 'json') {
    return detectFieldsFromGeoJSON(url);
  }
  
  // WFS would need specific handling based on the service
  // For now, return empty array for unsupported formats
  console.warn(`Field detection not supported for format: ${format}`);
  return [];
}

/**
 * Check if a format supports field detection
 */
export function isVectorFormat(format: string): boolean {
  const vectorFormats = ['geojson', 'json', 'flatgeobuf', 'fgb', 'wfs'];
  return vectorFormats.includes(format.toLowerCase());
}
