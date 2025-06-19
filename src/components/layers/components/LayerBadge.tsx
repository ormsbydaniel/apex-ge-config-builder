
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

  return (
    <Badge variant={layerType === 'base' ? "secondary" : "default"}>
      {layerType}
    </Badge>
  );
};

export default LayerBadge;
