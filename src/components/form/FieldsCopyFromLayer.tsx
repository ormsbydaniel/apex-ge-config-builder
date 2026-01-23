/**
 * Copy from Layer tab content for the Fields Editor.
 * Allows copying field configurations from another vector layer.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { FieldsConfig } from '@/types/category';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AvailableSourceLayer {
  name: string;
  fields: FieldsConfig;
}

interface FieldsCopyFromLayerProps {
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  setSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
}

const FieldsCopyFromLayer = ({
  availableSourceLayers,
  selectedSourceLayer,
  setSelectedSourceLayer,
  onCopyFromLayer
}: FieldsCopyFromLayerProps) => {
  const selectedLayer = availableSourceLayers.find(l => l.name === selectedSourceLayer);
  const fieldCount = selectedLayer ? Object.keys(selectedLayer.fields).length : 0;
  const visibleCount = selectedLayer 
    ? Object.values(selectedLayer.fields).filter(v => v !== null).length 
    : 0;
  const hiddenCount = fieldCount - visibleCount;

  return (
    <div className="space-y-4 py-4">
      <div className="text-sm text-muted-foreground">
        Copy field configuration from another layer that has fields defined.
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Source Layer</label>
        <Select 
          value={selectedSourceLayer} 
          onValueChange={setSelectedSourceLayer}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a layer..." />
          </SelectTrigger>
          <SelectContent>
            {availableSourceLayers.map((layer) => {
              const count = Object.keys(layer.fields).length;
              return (
                <SelectItem key={layer.name} value={layer.name}>
                  <div className="flex items-center gap-2">
                    <span>{layer.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count} field{count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Preview of selected layer's fields */}
      {selectedLayer && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Fields to copy ({visibleCount} visible, {hiddenCount} hidden):
          </div>
          <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto p-2 bg-muted rounded">
            {Object.entries(selectedLayer.fields).map(([fieldName, config]) => (
              <Badge 
                key={fieldName} 
                variant={config === null ? "outline" : "secondary"}
                className="text-xs"
              >
                {config === null ? (
                  <span className="line-through opacity-60">{fieldName}</span>
                ) : (
                  <>
                    {config.label || fieldName}
                    {config.order !== undefined && (
                      <span className="ml-1 opacity-60">#{config.order}</span>
                    )}
                  </>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={onCopyFromLayer}
        disabled={!selectedSourceLayer}
        className="w-full"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy Fields
      </Button>
    </div>
  );
};

export default FieldsCopyFromLayer;
