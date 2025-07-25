import React from 'react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';

interface LayerControlsDisplayProps {
  source: DataSource;
}

const LayerControlsDisplay = ({ source }: LayerControlsDisplayProps) => {
  const controls = source.layout?.layerCard?.controls;
  const toggleable = source.layout?.layerCard?.toggleable;
  const timeframe = source.meta?.temporal?.timeframe;
  
  const hasControls = controls && (controls.opacitySlider || controls.zoomToCenter);
  const hasTimeframe = timeframe && timeframe !== 'None';
  const hasToggleable = toggleable;
  
  if (!hasControls && !hasTimeframe && !hasToggleable) return null;

  const controlsList = [];
  if (hasToggleable) controlsList.push('Toggleable');
  if (controls?.zoomToCenter) controlsList.push('Zoom to Center');
  if (controls?.opacitySlider) controlsList.push('Opacity Slider');
  if (hasTimeframe) controlsList.push(`Time: ${timeframe}`);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Controls</h4>
      <div className="flex flex-wrap gap-1">
        {controlsList.map((control, index) => (
          <Badge key={index} variant="outline" className="text-xs border-blue-500/30 text-blue-600">
            {control}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default LayerControlsDisplay;