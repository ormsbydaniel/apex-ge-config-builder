
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataSource } from '@/types/config';
import LayerQAStatus from './LayerQAStatus';

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
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={getBadgeStyles()}>
        {layerType}
      </Badge>
      {source.isActive && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                active
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">This layer will be visible as soon as the Geospatial Explorer opens</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <LayerQAStatus source={source} />
    </div>
  );
};

export default LayerBadge;
