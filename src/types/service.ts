/**
 * Service and capability type definitions
 */

import { DataSourceFormat } from './format';

// Service interface - simplified to avoid discriminated union issues
export interface Service {
  id: string;
  name: string;
  url: string;
  sourceType?: 's3' | 'service' | 'stac' | 'catalogue'; // Optional, defaults to 'service'
  format?: DataSourceFormat | 's3' | 'stac' | 'catalogue'; // Optional for S3/STAC/Catalogue services, required for others
  capabilities?: ServiceCapabilities;
}

export interface CatalogueDatasetAccess {
  wmts?: { available?: boolean; getCapabilitiesUrl?: string; serviceUrl?: string };
  wms?: { available?: boolean; getCapabilitiesUrl?: string; serviceUrl?: string };
  cog?: { catalogueAvailable?: boolean; publicAvailable?: boolean; productCount?: number };
  [key: string]: any;
}

export interface CatalogueDataset {
  datasetIdentifier: string;
  /** Absent for datasets with no public map service. */
  serviceUrl?: string;
  getCapabilitiesUrl?: string;
  title: string;
  abstract?: string;
  theme: string;
  available: boolean;
  /** e.g. 'WMTS' | 'WMS'; absent when no public service was discovered. */
  serviceType?: string;
  access?: CatalogueDatasetAccess;
  layers?: CatalogueLayer[];
}

export interface CatalogueLayer {
  identifier: string;
  title?: string;
  abstract?: string;
}


export interface CatalogueCapabilities extends ServiceCapabilities {
  catalogue: {
    datasets: CatalogueDataset[];
  };
  availableDatasetCount?: number;
  unavailableDatasetCount?: number;
}


export interface ServiceCapabilities {
  layers: LayerInfo[];
  title?: string;
  abstract?: string;
  totalCount?: number; // Total count of items (for paginated APIs like STAC)
  version?: string; // Service version reported by GetCapabilities (WMS/WMTS/WFS)
  catalogue?: {
    datasets: CatalogueDataset[];
  };
  availableDatasetCount?: number;
  unavailableDatasetCount?: number;
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
