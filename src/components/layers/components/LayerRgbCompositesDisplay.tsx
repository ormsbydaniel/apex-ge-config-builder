import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RgbComposite } from '@/types/layer';

interface LayerRgbCompositesDisplayProps {
  rgbComposites?: RgbComposite[];
}

const LayerRgbCompositesDisplay = ({ rgbComposites }: LayerRgbCompositesDisplayProps) => {
  if (!rgbComposites || rgbComposites.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">(none defined)</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {rgbComposites.map((composite, index) => (
        <Badge key={index} variant="outline" className="text-xs border-primary/30">
          <span className="font-medium">{composite.name}</span>
          <span className="text-muted-foreground ml-1">
            R:{composite.red} G:{composite.green} B:{composite.blue}
          </span>
        </Badge>
      ))}
    </div>
  );
};

export default LayerRgbCompositesDisplay;
