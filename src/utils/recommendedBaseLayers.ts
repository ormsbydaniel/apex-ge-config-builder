import { DataSource } from '@/types/config';

const RECOMMENDED_CONFIG_URL = 'https://raw.githubusercontent.com/ESA-APEx/apex_geospatial_explorer_configs/main/resources/recommended-config.json';

export interface RecommendedConfig {
  sources?: DataSource[];
}

export async function fetchRecommendedBaseLayers(): Promise<DataSource[]> {
  try {
    const response = await fetch(RECOMMENDED_CONFIG_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommended config: ${response.statusText}`);
    }
    
    const config: RecommendedConfig = await response.json();
    
    // Filter only base layers from the config
    const baseLayers = (config.sources || []).filter(
      source => source.isBaseLayer === true
    );
    
    return baseLayers;
  } catch (error) {
    console.error('Error fetching recommended base layers:', error);
    throw error;
  }
}
