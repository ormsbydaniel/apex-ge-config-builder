import { Service, ServiceCapabilities, CatalogueDataset } from '@/types/config';

export interface CatalogueManifest {
  title: string;
  description?: string;
  url?: string;
  catalogues: {
    id: string;
    name: string;
    description?: string;
    manifestUrl: string;
  }[];
}

export interface CatalogueCounts {
  candidateCount?: number;
  publiclyAvailableCount?: number;
  wmtsCount?: number;
  wmsCount?: number;
  publicCogCount?: number;
  cataloguedCogOnlyCount?: number;
  [key: string]: number | undefined;
}

export interface CatalogueCollection {
  meta: {
    title: string;
    description?: string;
    version?: string;
    provider?: string;
    contact?: string;
    source?: string;
    generated?: string;
    catalogueUrl?: string;
    servicesUrl?: string;
    counts?: CatalogueCounts;
  };
  datasets: CatalogueDataset[];
}

/**
 * Normalises a dataset from the catalogue file so downstream code can rely on
 * `layers` being an array, and on service URLs being derived from the `access`
 * block when the top-level fields are absent.
 */
export const normaliseCatalogueDataset = (dataset: CatalogueDataset): CatalogueDataset => {
  const access = dataset.access || {};
  const wmts = access.wmts || {};
  const wms = access.wms || {};
  const serviceUrl = dataset.serviceUrl || wmts.serviceUrl || wms.serviceUrl;
  const getCapabilitiesUrl =
    dataset.getCapabilitiesUrl || wmts.getCapabilitiesUrl || wms.getCapabilitiesUrl;
  const serviceType =
    dataset.serviceType || (wmts.available ? 'WMTS' : wms.available ? 'WMS' : undefined);

  return {
    ...dataset,
    layers: dataset.layers || [],
    theme: dataset.theme || 'Other',
    ...(serviceUrl ? { serviceUrl } : {}),
    ...(getCapabilitiesUrl ? { getCapabilitiesUrl } : {}),
    ...(serviceType ? { serviceType } : {}),
  };
};

/** A dataset can only be added to a config when it is available and exposes layers. */
export const isCatalogueDatasetSelectable = (dataset: CatalogueDataset): boolean =>
  dataset.available === true && !!dataset.serviceUrl && (dataset.layers?.length ?? 0) > 0;

/** Human readable explanation for datasets that have no usable layers. */
export const catalogueDatasetUnavailableReason = (dataset: CatalogueDataset): string => {
  if (dataset.access?.cog?.catalogueAvailable) {
    const count = dataset.access.cog.productCount;
    return `No public map service; COG products catalogued only${count ? ` (${count} products)` : ''}.`;
  }
  return 'No public service endpoint found for this dataset.';
};

/** Format to use when creating a data source from this dataset. */
export const catalogueDatasetFormat = (
  dataset: CatalogueDataset,
  fallback: 'wmts' | 'wms' = 'wmts',
): 'wmts' | 'wms' => {
  const type = dataset.serviceType?.toLowerCase();
  return type === 'wms' || type === 'wmts' ? type : fallback;
};

export const fetchCatalogueManifest = async (url: string): Promise<CatalogueManifest> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalogue manifest: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.catalogues || !Array.isArray(data.catalogues)) {
    throw new Error('Invalid catalogue manifest: missing catalogues array');
  }
  return data as CatalogueManifest;
};

export const fetchCatalogueCollection = async (url: string): Promise<CatalogueCollection> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalogue collection: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.datasets || !Array.isArray(data.datasets)) {
    throw new Error('Invalid catalogue collection: missing datasets array');
  }
  return {
    ...data,
    datasets: (data.datasets as CatalogueDataset[]).map(normaliseCatalogueDataset),
  } as CatalogueCollection;
};

export const groupCatalogueDatasetsByTheme = (datasets: CatalogueDataset[]): Map<string, CatalogueDataset[]> => {
  const groups = new Map<string, CatalogueDataset[]>();
  datasets.forEach(dataset => {
    const theme = dataset.theme || 'Other';
    if (!groups.has(theme)) {
      groups.set(theme, []);
    }
    groups.get(theme)!.push(dataset);
  });
  // Alphabetical, but always keep the catch-all "Other" group last.
  return new Map(
    [...groups.entries()].sort((a, b) => {
      if (a[0] === 'Other') return 1;
      if (b[0] === 'Other') return -1;
      return a[0].localeCompare(b[0]);
    }),
  );
};

export const buildCatalogueCapabilities = (
  title: string,
  datasets: CatalogueDataset[],
  counts?: CatalogueCounts,
): ServiceCapabilities => {
  const available = datasets.filter(isCatalogueDatasetSelectable);
  const unavailable = datasets.filter(d => !isCatalogueDatasetSelectable(d));
  const topLayers = available.flatMap(d =>
    (d.layers || []).slice(0, 1).map(layer => ({
      name: `${d.datasetIdentifier}:${layer.identifier}`,
      title: layer.title || d.title,
      abstract: layer.abstract || d.abstract,
    }))
  );

  const availableCount = counts?.publiclyAvailableCount ?? available.length;
  const unavailableCount =
    counts?.candidateCount !== undefined
      ? counts.candidateCount - availableCount
      : unavailable.length;

  return {
    title,
    abstract: `Catalogue with ${availableCount} available and ${unavailableCount} unavailable datasets`,
    layers: topLayers,
    catalogue: { datasets },
    availableDatasetCount: availableCount,
    unavailableDatasetCount: unavailableCount,
  };
};


export const createCatalogueService = (
  name: string,
  url: string,
  capabilities: ServiceCapabilities,
): Service => ({
  id: `catalogue-service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
  url,
  sourceType: 'catalogue',
  format: 'catalogue',
  capabilities,
});
