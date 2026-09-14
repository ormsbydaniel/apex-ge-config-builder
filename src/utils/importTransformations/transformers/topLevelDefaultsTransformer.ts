/**
 * Fill in required top-level fields that older configurations omit:
 *  - layout.navigation.logo  (required by ConfigurationSchema)
 *  - exclusivitySets         (required array)
 *  - interfaceGroups         (required array)
 *
 * Only applied when the value is missing or the wrong shape — valid configs
 * are returned untouched.
 */

export const DEFAULT_LOGO_URL =
  'https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg';

export const isValidLogoValue = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

export const reverseTopLevelDefaultsTransformation = (config: any, enabled: boolean): any => {
  if (!enabled || !config || typeof config !== 'object') return config;

  const next: any = { ...config };

  // Logo
  const layout = next.layout && typeof next.layout === 'object' && !Array.isArray(next.layout)
    ? { ...next.layout }
    : {};
  const navigation = layout.navigation && typeof layout.navigation === 'object' && !Array.isArray(layout.navigation)
    ? { ...layout.navigation }
    : {};

  if (!isValidLogoValue(navigation.logo)) {
    console.log('TopLevelDefaults transformer: applying default logo');
    navigation.logo = DEFAULT_LOGO_URL;
  }
  layout.navigation = navigation;
  next.layout = layout;

  // Required top-level arrays
  if (!Array.isArray(next.exclusivitySets)) {
    console.log('TopLevelDefaults transformer: defaulting exclusivitySets to []');
    next.exclusivitySets = [];
  }
  if (!Array.isArray(next.interfaceGroups)) {
    console.log('TopLevelDefaults transformer: defaulting interfaceGroups to []');
    next.interfaceGroups = [];
  }

  return next;
};
