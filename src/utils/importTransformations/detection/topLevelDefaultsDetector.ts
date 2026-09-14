import { isValidLogoValue } from '../transformers/topLevelDefaultsTransformer';

/**
 * Detect configs missing required top-level fields (logo, exclusivitySets,
 * interfaceGroups) that would otherwise fail schema validation on import.
 */
export const detectTopLevelDefaultsNeeded = (config: any): boolean => {
  if (!config || typeof config !== 'object') return false;

  const navigation = config?.layout?.navigation;
  if (!navigation || typeof navigation !== 'object' || !isValidLogoValue(navigation.logo)) {
    return true;
  }
  if (!Array.isArray(config.exclusivitySets)) return true;
  if (!Array.isArray(config.interfaceGroups)) return true;

  return false;
};
