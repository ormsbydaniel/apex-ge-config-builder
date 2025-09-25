import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Colormap } from '@/types/config';

interface LayerColormapsDisplayProps {
  colormaps: Colormap[];
}

const LayerColormapsDisplay = ({ colormaps }: LayerColormapsDisplayProps) => {
  if (!colormaps || colormaps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Colormaps</h4>
      <div className="flex flex-wrap gap-2">
        {colormaps.map((colormap, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
            <div className="flex flex-col text-xs">
              <span className="font-medium">{colormap.name}</span>
              <span className="text-muted-foreground">
                {colormap.min}-{colormap.max} ({colormap.steps} steps)
                {colormap.reverse && ' • reversed'}
              </span>
            </div>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default LayerColormapsDisplay;