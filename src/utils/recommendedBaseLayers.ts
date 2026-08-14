import { DataSource, Service } from '@/types/config';
import { fetchExampleManifest } from '@/utils/exampleManifest';

/**
 * Legacy URL used when the manifest does not (yet) list a recommended
 * `basemaps` / `services` reference. Keeps existing deployments working
 * against unchanged manifests.
 */
const LEGACY_RECOMMENDED_CONFIG_URL =
  'https://raw.githubusercontent.com/ESA-APEx/apex_geospatial_explorer_configs/main/resources/recommended-config.json';

export interface RecommendedConfig {
  sources?: DataSource[];
  services?: Service[];
}

export interface RecommendedCatalogueEntry {
  id: string;
  name: string;
  description?: string;
  url: string;
}

type Kind = 'basemaps' | 'services';


const resolveUrl = async (kind: Kind): Promise<string> => {
  try {
    const manifest = await fetchExampleManifest();
    const entry = manifest.recommended?.[kind];
    if (entry?.url) return entry.url;
  } catch (e) {
    console.warn(
      `[recommended] Could not read "${kind}" URL from examples manifest, falling back to legacy URL:`,
      e,
    );
  }
  return LEGACY_RECOMMENDED_CONFIG_URL;
};

const fetchConfig = async (url: string): Promise<RecommendedConfig> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommended config: ${response.statusText}`);
  }
  return response.json();
};

export async function fetchRecommendedBaseLayers(): Promise<DataSource[]> {
  try {
    const url = await resolveUrl('basemaps');
    const config = await fetchConfig(url);
    return (config.sources || []).filter((source) => source.isBaseLayer === true);
  } catch (error) {
    console.error('Error fetching recommended base layers:', error);
    throw error;
  }
}

export async function fetchRecommendedServices(): Promise<Service[]> {
  try {
    const url = await resolveUrl('services');
    const config = await fetchConfig(url);
    return config.services || [];
  } catch (error) {
    console.error('Error fetching recommended services:', error);
    throw error;
  }
}

export async function fetchRecommendedCatalogues(): Promise<RecommendedCatalogueEntry[]> {
  try {
    const manifest = await fetchExampleManifest();
    return manifest.recommended?.catalogues || [];
  } catch (error) {
    console.error('Error fetching recommended catalogues:', error);
    return [];
  }
}

