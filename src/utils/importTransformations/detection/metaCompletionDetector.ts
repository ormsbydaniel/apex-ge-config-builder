
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

    // Enhanced swipe layer detection - check for transformed swipe layers that still need meta completion
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    if (isSwipeLayer) {
      // Check if swipe layer has incomplete meta after transformation
      const needsCompletion = !source.meta.description || 
                             !source.meta.attribution?.text || 
                             source.meta.description.trim() === '' ||
                             source.meta.attribution.text.trim() === '';
      
      if (needsCompletion) {
        console.log(`MetaCompletion detector: Transformed swipe layer "${source.name}" needs meta completion:`, {
          hasDescription: !!source.meta.description,
          hasAttributionText: !!source.meta.attribution?.text,
          descriptionEmpty: source.meta.description === '',
          attributionTextEmpty: source.meta.attribution?.text === ''
        });
        return true;
      }
    }

    // Check for sources with meta but missing description
    if (source.meta && typeof source.meta === 'object' && !source.meta.description) {
      console.log(`MetaCompletion detector: Source "${source.name}" has meta but missing description`);
      return true;
    }

    // Check for sources with meta.description but missing attribution
    if (source.meta && typeof source.meta === 'object' && source.meta.description && 
        (!source.meta.attribution || !source.meta.attribution.text || source.meta.attribution.text.trim() === '')) {
      console.log(`MetaCompletion detector: Source "${source.name}" has description but missing attribution`);
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

    return false;
  });
};
