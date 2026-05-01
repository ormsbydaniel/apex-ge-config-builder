import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Category } from '@/types/config';

export interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface CategoryCopyFromLayerButtonProps {
  availableSourceLayers: AvailableSourceLayer[];
  hasExistingCategories: boolean;
  onCopy: (sourceLayer: AvailableSourceLayer, mode: 'append' | 'replace') => void;
  onRequestAppendReplace: (sourceLayer: AvailableSourceLayer) => void;
}

const CategoryCopyFromLayerButton = ({
  availableSourceLayers,
  hasExistingCategories,
  onCopy,
  onRequestAppendReplace,
}: CategoryCopyFromLayerButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');

  const disabled = availableSourceLayers.length === 0;
  const selected = availableSourceLayers.find(l => l.name === selectedName);

  const handleCopy = () => {
    if (!selected) return;
    setOpen(false);
    if (hasExistingCategories) {
      onRequestAppendReplace(selected);
    } else {
      onCopy(selected, 'replace');
    }
    setSelectedName('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          title={disabled ? 'No other layers with categories available' : undefined}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy from layer
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Source layer</Label>
          <Select value={selectedName} onValueChange={setSelectedName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a layer..." />
            </SelectTrigger>
            <SelectContent>
              {availableSourceLayers.map(layer => (
                <SelectItem key={layer.name} value={layer.name}>
                  {layer.name} ({layer.categories.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-xs text-muted-foreground">
              {selected.categories.length} categories
              {selected.hasValues ? ' (with values)' : ' (without values)'}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleCopy} disabled={!selected}>
              Copy
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCopyFromLayerButton;
