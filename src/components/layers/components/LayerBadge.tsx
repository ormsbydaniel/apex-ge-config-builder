
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DataSource } from '@/types/config';

interface LayerBadgeProps {
  source: DataSource;
}

const LayerBadge = ({ source }: LayerBadgeProps) => {
  const getLayerType = () => {
    if (source.isBaseLayer === true) return 'base';
    if (source.meta?.swipeConfig !== undefined || (source as any).isSwipeLayer) return 'swipe';
    if ((source as any).isMirrorLayer) return 'mirror';
    if ((source as any).isSpotlightLayer) return 'spotlight';
    return 'standard';
  };

  const layerType = getLayerType();

  const getBadgeStyles = () => {
    switch (layerType) {
      case 'swipe':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'base':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'standard':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge variant="outline" className={getBadgeStyles()}>
      {layerType}
    </Badge>
  );
};

export default LayerBadge;
