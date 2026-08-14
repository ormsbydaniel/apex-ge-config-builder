/**
 * Service and capability type definitions
 */

import { DataSourceFormat } from './format';
import { TimeframeType } from './dataSource';



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

export interface CatalogueDatasetStyle {
  documentationUrl?: string;
  evalscriptDiscovered?: boolean;
  evalscriptDirectoryUrl?: string;
  githubArchiveUrl?: string;
  styleDiscoveryStatus?: string;
  scripts?: Array<{ name?: string; url?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** Provenance for legend class labels (e.g. an official product manual). */
export interface CatalogueLabelSource {
  type?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

export interface CatalogueLegendEntry {
  value: number;
  color: string;
  label?: string;
  labelSource?: CatalogueLabelSource;
}

export interface CatalogueLegend {
  /** 'discrete' for class legends, 'continuous' for ramps. */
  type?: 'discrete' | 'continuous';
  entries: CatalogueLegendEntry[];
  /** Sentinel values excluded from the ramp/classes. */
  noData?: CatalogueLegendEntry[];
  min?: number;
  max?: number;
  steps?: number;
  units?: string;
  /** Named colour ramp hint (e.g. 'magma'). */
  colormapName?: string;
  reverse?: boolean;
  sampled?: boolean;
  sourceEntryCount?: number;
  /** Provenance of the class labels, when they came from an official source. */
  labelSource?: CatalogueLabelSource;
  /** How many entries carry an officially sourced label. */
  officialLabelCount?: number;
}

/** Reported when legend extraction was attempted but deliberately not published. */
export interface CatalogueLegendDiscovery {
  status?: string;
  reason?: string;
  parsedMin?: number;
  parsedMax?: number;
  message?: string;
  [key: string]: unknown;
}

export interface CatalogueLayerStyle {
  name: string;
  evalscriptUrl?: string;
  legend?: CatalogueLegend;
  legendDiscovery?: CatalogueLegendDiscovery;
}

/** Where the band metadata (units, scale, range) was sourced from. */
export interface CatalogueBandMetadataSource {
  type?: string;
  url?: string;
  band?: string;
  [key: string]: unknown;
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
  style?: CatalogueDatasetStyle;
  layers?: CatalogueLayer[];
}

export interface CatalogueLayer {
  identifier: string;
  title?: string;
  abstract?: string;
  styles?: CatalogueLayerStyle[];
  /** Concise unit for the band, e.g. 'mm/day'. */
  units?: string;
  /** Verbose original unit wording; not suitable for display as a unit. */
  unitsRaw?: string;
  /** Storage type of the source band, e.g. 'INT16'. */
  sourceFormat?: string;
  /** Physical data range — may be wider than the legend's visualisation range. */
  dataRange?: { min?: number; max?: number };
  dataRangeRaw?: string;
  /** Digital-number to physical-value conversion. */
  scale?: number;
  offset?: number;
  /** Free-text summary of the classes for categorical bands. */
  categoricalValueDescription?: string;
  bandMetadataSource?: CatalogueBandMetadataSource;
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


export interface TimeDimensionExtent {
  start: string;
  end: string;
  period?: string;
  intervals: Array<{ start: string; end: string; period?: string }>;
  discreteValues?: string[];
  suggestedTimeframe: TimeframeType;
}

export interface LayerInfo {
  name: string;
  title?: string;
  abstract?: string;
  hasTimeDimension?: boolean;
  defaultTime?: string;
  timeExtent?: TimeDimensionExtent;
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
