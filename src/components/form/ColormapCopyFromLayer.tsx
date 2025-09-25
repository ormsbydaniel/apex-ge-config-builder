import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Colormap } from '@/types/config';
import ColorRampPreview from '@/components/ui/ColorRampPreview';

interface AvailableSourceLayer {
  name: string;
  colormaps: Colormap[];
}

interface ColormapCopyFromLayerProps {
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  setSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
}

const ColormapCopyFromLayer = ({
  availableSourceLayers,
  selectedSourceLayer,
  setSelectedSourceLayer,
  onCopyFromLayer
}: ColormapCopyFromLayerProps) => {
  const selectedSourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);

  if (availableSourceLayers.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <p className="text-sm text-muted-foreground py-8 text-center">
          No other layers with colormaps found. Create colormaps in other layers first to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Layer Selection */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
        <Label className="text-sm font-medium">Copy from Another Layer</Label>
        <div className="flex gap-3">
          <Select value={selectedSourceLayer} onValueChange={setSelectedSourceLayer}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a layer to copy from..." />
            </SelectTrigger>
            <SelectContent>
              {availableSourceLayers.map((layer) => (
                <SelectItem key={layer.name} value={layer.name}>
                  {layer.name} ({layer.colormaps.length} colormaps)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            onClick={onCopyFromLayer}
            disabled={!selectedSourceLayer}
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
        {selectedSourceLayerData && (
          <p className="text-xs text-muted-foreground">
            Will copy {selectedSourceLayerData.colormaps.length} colormaps
          </p>
        )}
      </div>

      {/* Source Layer Preview */}
      {selectedSourceLayerData && (
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium">Preview: {selectedSourceLayerData.name}</Label>
          <div className="space-y-2">
            {selectedSourceLayerData.colormaps.map((colormap, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border rounded">
                <ColorRampPreview 
                  colormap={colormap.name} 
                  reverse={colormap.reverse}
                  width={80}
                  height={20}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{colormap.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {colormap.min} - {colormap.max} • {colormap.steps} steps
                    {colormap.reverse && ' • reversed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColormapCopyFromLayer;