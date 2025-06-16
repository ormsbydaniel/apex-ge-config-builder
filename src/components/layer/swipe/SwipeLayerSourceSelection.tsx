
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { DataSource } from '@/types/config';

interface SwipeLayerSourceSelectionProps {
  clippedSourceName: string;
  baseSourceNames: string[];
  availableSources: DataSource[];
  onUpdate: (field: string, value: any) => void;
}

const SwipeLayerSourceSelection = ({
  clippedSourceName,
  baseSourceNames,
  availableSources,
  onUpdate
}: SwipeLayerSourceSelectionProps) => {
  // Filter sources for clipped source (exclude base layers and swipe layers)
  const clippedSourceOptions = availableSources.filter(source => {
    const isBaseLayer = source.data.some(item => item.isBaseLayer === true);
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    return !isBaseLayer && !isSwipeLayer;
  });

  // Filter sources for base sources (exclude swipe layers, but allow base layers)
  const baseSourceOptions = availableSources.filter(source => {
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    return !isSwipeLayer;
  }).map(source => {
    const isBaseLayer = source.data.some(item => item.isBaseLayer === true);
    return {
      value: source.name,
      label: source.name,
      badge: isBaseLayer ? 'Base Layer' : 'Layer Card',
      disabled: source.name === clippedSourceName
    };
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clippedSource">Clipped Source (Top Layer) *</Label>
        <Select value={clippedSourceName} onValueChange={(value) => onUpdate('clippedSourceName', value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select clipped source" />
          </SelectTrigger>
          <SelectContent>
            {clippedSourceOptions.map((source) => (
              <SelectItem key={source.name} value={source.name}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseSources">Base Sources (Bottom Layers) *</Label>
        <MultiSelect
          options={baseSourceOptions}
          value={baseSourceNames}
          onValueChange={(value) => onUpdate('baseSourceNames', value)}
          placeholder="Select base sources..."
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Select one or more layers to use as base sources. Base layers and layer cards are both supported.
        </p>
      </div>
    </div>
  );
};

export default SwipeLayerSourceSelection;
