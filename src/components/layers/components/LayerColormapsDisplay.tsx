
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Palette } from 'lucide-react';
import { Colormap } from '@/types/config';
import ColorRampPreview from '@/components/ui/ColorRampPreview';
import ColormapEditorDialog from '@/components/form/ColormapEditorDialog';

interface LayerColormapsDisplayProps {
  colormaps: Colormap[];
  onUpdate?: (colormaps: Colormap[]) => void;
  metaMin?: number;
  metaMax?: number;
}

const LayerColormapsDisplay = ({ colormaps, onUpdate, metaMin, metaMax }: LayerColormapsDisplayProps) => {
  if (!colormaps || colormaps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <h4 className="text-sm font-medium text-muted-foreground">Colormaps ({colormaps.length})</h4>
        {onUpdate && (
          <ColormapEditorDialog
            colormaps={colormaps}
            onUpdate={onUpdate}
            metaMin={metaMin}
            metaMax={metaMax}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {colormaps.map((colormap, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
            <ColorRampPreview 
              colormap={colormap.name} 
              reverse={colormap.reverse}
              width={60}
              height={16}
            />
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
