
/**
 * Detect sources that need meta completion
 */
export const detectMetaCompletionNeeded = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) {
    return false;
  }

  return config.sources.some((source: any) => {
    // Skip base layers
    if (source.isBaseLayer === true) {
      return false;
    }

    // Check for sources with meta but missing description
    if (source.meta && typeof source.meta === 'object' && !source.meta.description) {
      console.log(`MetaCompletion detector: Source "${source.name}" has meta but missing description`);
      return true;
    }

    // Check for sources with empty meta object
    if (source.meta && typeof source.meta === 'object' && Object.keys(source.meta).length === 0) {
      console.log(`MetaCompletion detector: Source "${source.name}" has empty meta object`);
      return true;
    }

    // Check for sources with layout but no meta (layer cards need meta)
    if (source.layout && !source.meta && !source.isBaseLayer) {
      console.log(`MetaCompletion detector: Source "${source.name}" has layout but missing meta`);
      return true;
    }

    // Check for swipe layers that might need meta completion
    if (source.meta?.swipeConfig && (!source.meta.description || !source.meta.attribution?.text)) {
      console.log(`MetaCompletion detector: Swipe layer "${source.name}" needs meta completion`);
      return true;
    }

    return false;
  });
};
