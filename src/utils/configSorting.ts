import { DataSource } from '@/types/config';

/**
 * Sorts sources to match the UI display order:
 * 1. By interface group order
 * 2. Ungrouped sources
 * 3. Base layers
 */
export function sortSources(
  sources: any[], 
  interfaceGroups: any[]
): any[] {
  // Handle both string array and object array for interface groups
  const interfaceGroupNames = interfaceGroups.map(g => 
    typeof g === 'string' ? g : g.name
  );
  
  return [...sources].sort((a, b) => {
    const aIsBase = 'isBaseLayer' in a && a.isBaseLayer;
    const bIsBase = 'isBaseLayer' in b && b.isBaseLayer;
    
    // Base layers always go last
    if (aIsBase && !bIsBase) return 1;
    if (!aIsBase && bIsBase) return -1;
    if (aIsBase && bIsBase) return 0;
    
    // Get interface group indices
    const aGroup = a.layout?.interfaceGroup;
    const bGroup = b.layout?.interfaceGroup;
    
    const aIndex = aGroup ? interfaceGroupNames.indexOf(aGroup) : -1;
    const bIndex = bGroup ? interfaceGroupNames.indexOf(bGroup) : -1;
    
    // Both ungrouped - maintain relative order
    if (aIndex === -1 && bIndex === -1) return 0;
    
    // Ungrouped sources come after grouped ones
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    // Sort by interface group order
    return aIndex - bIndex;
  });
}

/**
 * Sorts services by type priority, then alphabetically:
 * 1. STAC services
 * 2. WMS/WMTS services
 * 3. S3 services
 * 4. Others (alphabetically)
 */
export function sortServices(services: any[]): any[] {
  const typePriority: Record<string, number> = {
    'stac': 1,
    'wms': 2,
    'wmts': 2,
    's3': 3
  };
  
  return [...services].sort((a, b) => {
    const aPriority = typePriority[a.format.toLowerCase()] || 999;
    const bPriority = typePriority[b.format.toLowerCase()] || 999;
    
    // Sort by type priority first
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Reorders properties within a source object to match UI flow:
 * 1. name, isActive
 * 2. isBaseLayer, preview (for base layers)
 * 3. meta, layout
 * 4. timeframe, defaultTimestamp
 * 5. exclusivitySets, hasFeatureStatistics
 * 6. data, statistics, constraints, workflows
 * 7. Any other properties (catch-all to prevent data loss)
 */
export function orderSourceProperties(source: any): any {
  const ordered: any = {};
  
  // Define the desired property order
  const propertyOrder = [
    'name',
    'isActive',
    'isBaseLayer',
    'preview',
    'meta',
    'layout',
    'timeframe',
    'defaultTimestamp',
    'exclusivitySets',
    'hasFeatureStatistics',
    'data',
    'statistics',
    'constraints',
    'workflows'
  ];
  
  // Add properties in the desired order (if they exist)
  for (const key of propertyOrder) {
    if (key in source) {
      ordered[key] = source[key];
    }
  }
  
  // Catch-all: Add any remaining properties that weren't in our list
  // This prevents data loss if there are unexpected/future properties
  for (const key of Object.keys(source)) {
    if (!(key in ordered)) {
      ordered[key] = source[key];
    }
  }
  
  return ordered;
}
