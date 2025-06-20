
import { useState, useCallback } from 'react';
import { DataSource } from '@/types/config';

export type LayerTypeOption = 'standard' | 'swipe' | 'mirror' | 'spotlight';

interface UseLayerTypeManagementProps {
  initialLayer?: DataSource;
  onLayerTypeChange?: (layerType: LayerTypeOption) => void;
}

export const useLayerTypeManagement = ({
  initialLayer,
  onLayerTypeChange
}: UseLayerTypeManagementProps = {}) => {
  // Determine initial layer type from existing layer
  const getInitialLayerType = (): LayerTypeOption => {
    if (!initialLayer) return 'standard';
    
    if ((initialLayer as any).isSwipeLayer) return 'swipe';
    if ((initialLayer as any).isMirrorLayer) return 'mirror';
    if ((initialLayer as any).isSpotlightLayer) return 'spotlight';
    
    return 'standard';
  };

  const [selectedLayerType, setSelectedLayerType] = useState<LayerTypeOption>(getInitialLayerType());

  const handleLayerTypeChange = useCallback((newType: LayerTypeOption) => {
    setSelectedLayerType(newType);
    onLayerTypeChange?.(newType);
  }, [onLayerTypeChange]);

  const getLayerTypeFlags = (layerType: LayerTypeOption) => {
    const flags: Record<string, boolean> = {};
    
    // Remove all layer type flags first
    delete flags.isSwipeLayer;
    delete flags.isMirrorLayer;
    delete flags.isSpotlightLayer;
    
    // Set the appropriate flag
    switch (layerType) {
      case 'swipe':
        flags.isSwipeLayer = true;
        break;
      case 'mirror':
        flags.isMirrorLayer = true;
        break;
      case 'spotlight':
        flags.isSpotlightLayer = true;
        break;
      // 'standard' type has no special flags
    }
    
    return flags;
  };

  const isComparisonLayerType = (layerType: LayerTypeOption): boolean => {
    return ['swipe', 'mirror', 'spotlight'].includes(layerType);
  };

  return {
    selectedLayerType,
    handleLayerTypeChange,
    getLayerTypeFlags,
    isComparisonLayerType
  };
};
