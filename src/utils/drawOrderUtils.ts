import { DataSource, DataSourceItem } from '@/types/config';

// Format categorization
const RASTER_FORMATS = ['cog', 'wms', 'wmts', 'xyz'];
const VECTOR_FORMATS = ['geojson', 'flatgeobuf', 'wfs'];

// Z-level constants
export const Z_BASE_LAYER_RASTER = 10;
export const Z_STANDARD_RASTER = 50;
export const Z_VECTOR_POLYGON = 100;
export const Z_VECTOR_LINE = 110;
export const Z_VECTOR_POINT = 120;

/**
 * Detect geometry type from dataItem.type field
 */
function detectGeometryType(type?: string): 'polygon' | 'line' | 'point' | 'unknown' {
  if (!type) return 'unknown';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('polygon') || lowerType.includes('multipolygon')) {
    return 'polygon';
  }
  if (lowerType.includes('line') || lowerType.includes('linestring') || lowerType.includes('multilinestring')) {
    return 'line';
  }
  if (lowerType.includes('point') || lowerType.includes('multipoint')) {
    return 'point';
  }
  
  return 'unknown';
}

/**
 * Determine the appropriate Z-level for a data item based on format and type
 */
export function determineZLevel(dataItem: DataSourceItem, isBaseLayer: boolean): number {
  const format = dataItem.format?.toLowerCase() || '';
  
  // Check if it's a raster format
  if (RASTER_FORMATS.includes(format)) {
    return isBaseLayer ? Z_BASE_LAYER_RASTER : Z_STANDARD_RASTER;
  }
  
  // Check if it's a vector format
  if (VECTOR_FORMATS.includes(format)) {
    const geometryType = detectGeometryType(dataItem.type);
    
    switch (geometryType) {
      case 'polygon':
        return Z_VECTOR_POLYGON;
      case 'line':
        return Z_VECTOR_LINE;
      case 'point':
        return Z_VECTOR_POINT;
      default:
        return Z_VECTOR_POLYGON; // Default to polygon level for unknown geometry
    }
  }
  
  // Default to standard raster level if format is unknown
  console.warn(`Unknown format "${format}" for data item, defaulting to Z=${Z_STANDARD_RASTER}`);
  return Z_STANDARD_RASTER;
}

/**
 * Apply auto-tune logic to all data sources
 */
export function autoTuneZLevels(sources: DataSource[]): DataSource[] {
  return sources.map(source => {
    const isBaseLayerSource = source.isBaseLayer || false;
    
    // Process data array
    const updatedData = source.data.map(dataItem => {
      const isItemBaseLayer = dataItem.isBaseLayer || isBaseLayerSource;
      const newZLevel = determineZLevel(dataItem, isItemBaseLayer);
      
      return {
        ...dataItem,
        zIndex: newZLevel
      };
    });
    
    // Process statistics array if present
    const updatedStatistics = source.statistics?.map(statsItem => {
      const newZLevel = determineZLevel(statsItem, isBaseLayerSource);
      
      return {
        ...statsItem,
        zIndex: newZLevel
      };
    });
    
    return {
      ...source,
      data: updatedData,
      ...(updatedStatistics && { statistics: updatedStatistics })
    };
  });
}

/**
 * Generate a preview of Z-level changes for display in the dialog
 */
export interface AutoTunePreviewItem {
  sourceIndex: number;
  dataIndex: number;
  sourceType: 'data' | 'statistics';
  layerName: string;
  currentZLevel: number;
  proposedZLevel: number;
  format: string;
  isBaseLayer: boolean;
  willChange: boolean;
}

export function generateAutoTunePreview(sources: DataSource[]): AutoTunePreviewItem[] {
  const preview: AutoTunePreviewItem[] = [];
  
  sources.forEach((source, sourceIndex) => {
    const isBaseLayerSource = source.isBaseLayer || false;
    
    // Process data array
    source.data.forEach((dataItem, dataIndex) => {
      const isItemBaseLayer = dataItem.isBaseLayer || isBaseLayerSource;
      const proposedZLevel = determineZLevel(dataItem, isItemBaseLayer);
      
      preview.push({
        sourceIndex,
        dataIndex,
        sourceType: 'data',
        layerName: source.name,
        currentZLevel: dataItem.zIndex,
        proposedZLevel,
        format: dataItem.format || 'unknown',
        isBaseLayer: isItemBaseLayer,
        willChange: dataItem.zIndex !== proposedZLevel
      });
    });
    
    // Process statistics array
    source.statistics?.forEach((statsItem, statsIndex) => {
      const proposedZLevel = determineZLevel(statsItem, isBaseLayerSource);
      
      preview.push({
        sourceIndex,
        dataIndex: statsIndex,
        sourceType: 'statistics',
        layerName: source.name,
        currentZLevel: statsItem.zIndex,
        proposedZLevel,
        format: statsItem.format || 'unknown',
        isBaseLayer: isBaseLayerSource,
        willChange: statsItem.zIndex !== proposedZLevel
      });
    });
  });
  
  return preview;
}

/**
 * Generate summary statistics for the auto-tune preview
 */
export interface AutoTuneSummary {
  baseLayerRasters: number;
  standardRasters: number;
  vectorPolygons: number;
  vectorLines: number;
  vectorPoints: number;
  totalChanges: number;
}

export function generateAutoTuneSummary(preview: AutoTunePreviewItem[]): AutoTuneSummary {
  const summary: AutoTuneSummary = {
    baseLayerRasters: 0,
    standardRasters: 0,
    vectorPolygons: 0,
    vectorLines: 0,
    vectorPoints: 0,
    totalChanges: 0
  };
  
  preview.forEach(item => {
    if (item.willChange) {
      summary.totalChanges++;
    }
    
    switch (item.proposedZLevel) {
      case Z_BASE_LAYER_RASTER:
        summary.baseLayerRasters++;
        break;
      case Z_STANDARD_RASTER:
        summary.standardRasters++;
        break;
      case Z_VECTOR_POLYGON:
        summary.vectorPolygons++;
        break;
      case Z_VECTOR_LINE:
        summary.vectorLines++;
        break;
      case Z_VECTOR_POINT:
        summary.vectorPoints++;
        break;
    }
  });
  
  return summary;
}
