
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Globe, Server } from 'lucide-react';
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
        return 'border-purple-300 text-purple-700';
      case 'base':
        return 'border-green-300 text-green-700';
      case 'standard':
        return 'border-green-300 text-green-700';
      default:
        return 'border-gray-300 text-gray-700';
    }
  };

  const getBadgeIcon = () => {
    switch (layerType) {
      case 'swipe':
        return <Server className="h-3 w-3" />;
      case 'base':
      case 'standard':
        return <Database className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={getBadgeStyles()}>
        <div className="flex items-center gap-1">
          {getBadgeIcon()}
          {layerType}
        </div>
      </Badge>
      {source.isActive && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
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
