
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Category } from '@/types/config';
import CategoryPreview from './CategoryPreview';

interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface CategoryCopyFromLayerProps {
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  setSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
}

const CategoryCopyFromLayer = ({
  availableSourceLayers,
  selectedSourceLayer,
  setSelectedSourceLayer,
  onCopyFromLayer
}: CategoryCopyFromLayerProps) => {
  const selectedSourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);

  if (availableSourceLayers.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <p className="text-sm text-muted-foreground py-8 text-center">
          No other layers with categories found. Create categories in other layers first to use this feature.
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
                  {layer.name} ({layer.categories.length} categories)
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
            Will copy {selectedSourceLayerData.categories.length} categories
            {selectedSourceLayerData.hasValues ? ' (with values)' : ' (without values)'}
          </p>
        )}
      </div>

      {/* Source Layer Preview */}
      {selectedSourceLayerData && (
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium">Preview: {selectedSourceLayerData.name}</Label>
          <div className="flex flex-wrap gap-1">
            <CategoryPreview 
              categories={selectedSourceLayerData.categories} 
              useValues={selectedSourceLayerData.hasValues}
              className="p-0 bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCopyFromLayer;
