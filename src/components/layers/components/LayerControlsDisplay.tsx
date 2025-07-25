import React from 'react';
import { DataSource } from '@/types/config';
import { Badge } from '@/components/ui/badge';

interface LayerControlsDisplayProps {
  source: DataSource;
}

const LayerControlsDisplay = ({ source }: LayerControlsDisplayProps) => {
  const controls = source.layout?.layerCard?.controls;
  
  if (!controls || (!controls.opacitySlider && !controls.zoomToCenter)) return null;

  const controlsList = [];
  if (controls.opacitySlider) controlsList.push('Opacity Slider');
  if (controls.zoomToCenter) controlsList.push('Zoom to Center');

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