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
  };
  datasets: CatalogueDataset[];
}

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
  return data as CatalogueCollection;
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
  return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
};

export const buildCatalogueCapabilities = (
  title: string,
  datasets: CatalogueDataset[],
): ServiceCapabilities => {
  const available = datasets.filter(d => d.available);
  const unavailable = datasets.filter(d => !d.available);
  const topLayers = available.flatMap(d =>
    d.layers.slice(0, 1).map(layer => ({
      name: `${d.datasetIdentifier}:${layer.identifier}`,
      title: layer.title || d.title,
      abstract: layer.abstract || d.abstract,
    }))
  );

  return {
    title,
    abstract: `Catalogue with ${available.length} available and ${unavailable.length} unavailable datasets`,
    layers: topLayers,
    catalogue: { datasets },
    availableDatasetCount: available.length,
    unavailableDatasetCount: unavailable.length,
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
