import React, { useEffect } from 'react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayerControlsDisplayProps {
  source: DataSource;
}

const LayerControlsDisplay = ({ source }: LayerControlsDisplayProps) => {
  const controls = source.layout?.layerCard?.controls;
  const toggleable = source.layout?.layerCard?.toggleable;
  const timeframe = source.timeframe;
  
  console.log('LayerControlsDisplay - source name:', source.name);
  console.log('LayerControlsDisplay - controls:', controls);
  console.log('LayerControlsDisplay - download value:', controls?.download);
  
  const hasControls = controls && (controls.opacitySlider || controls.zoomToCenter || controls.download);
  const hasTimeframe = timeframe && timeframe !== 'None';
  const hasToggleable = toggleable;
  const hasDownload = controls?.download !== undefined;
  
  useEffect(() => {
    console.log('LayerControlsDisplay - hasDownload:', hasDownload);
    console.log('LayerControlsDisplay - download URL for tooltip:', controls?.download);
  }, [hasDownload, controls?.download]);
  
  if (!hasControls && !hasTimeframe && !hasToggleable) return null;

  const controlsList = [];
  if (hasToggleable) controlsList.push('Toggleable');
  if (controls?.zoomToCenter) controlsList.push('Zoom to Center');
  if (controls?.opacitySlider) controlsList.push('Opacity Slider');

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