
import React from 'react';
import { Check, AlertTriangle, Triangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataSource } from '@/types/config';

interface LayerQAStatusProps {
  source: DataSource;
}

const LayerQAStatus = ({ source }: LayerQAStatusProps) => {
  const getQAStatus = () => {
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    
    // Check if layer has data or statistics
    const hasData = source.data && source.data.length > 0 && source.data.some(d => d.url);
    const hasStatistics = source.statistics && source.statistics.length > 0 && source.statistics.some(s => s.url);
    const hasAnyContent = hasData || hasStatistics;
    
    // Red: No data or statistics
    if (!hasAnyContent) {
      return {
        status: 'error',
        icon: Triangle,
        color: 'text-red-500',
        tooltip: 'Layer has no data or statistics'
      };
    }
    
    // Check for attribution
    const hasAttribution = source.meta?.attribution?.text;
    
    // Check for legend
    const hasLegend = source.layout?.layerCard?.legend?.url || 
                     (source.meta?.categories && source.meta.categories.length > 0) ||
                     (source.meta?.startColor && source.meta?.endColor);
    
    // For swipe layers, check if both clipped and base sources exist
    let swipeComplete = true;
    if (isSwipeLayer) {
      const hasClippedSource = source.meta?.swipeConfig?.clippedSourceName;
      const hasBaseSources = source.meta?.swipeConfig?.baseSourceNames && 
                            source.meta.swipeConfig.baseSourceNames.length > 0;
      swipeComplete = hasClippedSource && hasBaseSources;
    }
    
    // Amber: Missing attribution or incomplete swipe configuration
    if (!hasAttribution || (isSwipeLayer && !swipeComplete)) {
      const issues = [];
      if (!hasAttribution) issues.push('attribution');
      if (isSwipeLayer && !swipeComplete) issues.push('complete swipe configuration');
      
      return {
        status: 'warning',
        icon: AlertTriangle,
        color: 'text-amber-500',
        tooltip: `Layer is missing: ${issues.join(', ')}`
      };
    }
    
    // Blue: Has attribution but missing legend
    if (!hasLegend) {
      return {
        status: 'info',
        icon: Triangle,
        color: 'text-blue-500',
        tooltip: 'Layer is missing: legend'
      };
    }
    
    // Green: All checks passed
    return {
      status: 'success',
      icon: Check,
      color: 'text-green-500',
      tooltip: 'Layer is complete with all required elements'
    };
  };

  const { icon: Icon, color, tooltip } = getQAStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${color} flex-shrink-0 ml-2`}>
            <Icon className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LayerQAStatus;
