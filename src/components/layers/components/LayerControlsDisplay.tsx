import React, { useEffect } from 'react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayerControlsDisplayProps {
  source: DataSource;
}

const LayerControlsDisplay = ({ source }: LayerControlsDisplayProps) => {
  // Check both layerCard and infoPanel for controls (backward compatibility)
  const rawControls = source.layout?.layerCard?.controls || source.layout?.infoPanel?.controls;
  const toggleable = source.layout?.layerCard?.toggleable;
  const timeframe = source.timeframe;
  
  // Type guard: check if controls is an object (not a string array)
  const isControlsObject = rawControls && typeof rawControls === 'object' && !Array.isArray(rawControls);
  const controls = isControlsObject ? rawControls : undefined;
  
  const hasControls = controls && (controls.opacitySlider || controls.zoomToCenter || controls.download || controls.temporalControls || controls.constraintSlider);
  const hasTimeframe = timeframe && timeframe !== 'None';
  const hasToggleable = toggleable;
  const hasDownload = controls?.download !== undefined;
  
  useEffect(() => {
  }, [hasDownload, controls?.download]);
  
  if (!hasControls && !hasTimeframe && !hasToggleable) return null;

  const controlsList = [];
  if (hasToggleable) controlsList.push('Toggleable');
  if (controls?.zoomToCenter) controlsList.push('Zoom to Center');
  if (controls?.opacitySlider) controlsList.push('Opacity Slider');
  if (controls?.temporalControls) controlsList.push('Temporal Control');
  if (controls?.constraintSlider) controlsList.push('Constraint Slider');

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Controls</h4>
      <div className="flex flex-wrap gap-1">
        {controlsList.map((control, index) => (
          <Badge key={index} variant="outline" className="text-xs border-blue-500/30 text-blue-600">
            {control}
          </Badge>
        ))}
        {hasTimeframe && (
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
            Time: {timeframe}
          </Badge>
        )}
        {hasDownload && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 cursor-help">
                  Download
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs break-all text-sm">
                  {controls?.download || 'No URL configured'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default LayerControlsDisplay;