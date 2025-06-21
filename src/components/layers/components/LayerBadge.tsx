
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
      case 'standard':
        return 'bg-gray-400 text-white border-gray-500';
      case 'base':
        return 'bg-secondary text-secondary-foreground border-secondary';
      default:
        return 'bg-gray-400 text-white border-gray-500';
    }
  };

  return (
    <Badge variant="outline" className={getBadgeStyles()}>
      {layerType}
    </Badge>
  );
};

export default LayerBadge;
