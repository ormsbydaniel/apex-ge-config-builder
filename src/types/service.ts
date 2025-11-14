/**
 * Service and capability type definitions
 */

import { DataSourceFormat } from './format';

// Service interface - simplified to avoid discriminated union issues
export interface Service {
  id: string;
  name: string;
  url: string;
  sourceType?: 's3' | 'service' | 'stac'; // Optional, defaults to 'service'
  format?: DataSourceFormat | 's3' | 'stac'; // Optional for S3/STAC services, required for others
  capabilities?: ServiceCapabilities;
}

export interface ServiceCapabilities {
  layers: LayerInfo[];
  title?: string;
  abstract?: string;
}

export interface LayerInfo {
  name: string;
  title?: string;
  abstract?: string;
  hasTimeDimension?: boolean;
  defaultTime?: string;
  crs?: string[];
  bbox?: {
    west: string;
    east: string;
    south: string;
    north: string;
  };
  hasLegendGraphic?: boolean;
  legendGraphicUrl?: string;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}
