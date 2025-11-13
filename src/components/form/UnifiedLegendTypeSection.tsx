import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Colormap } from '@/types/config';
import { Info } from 'lucide-react';

interface UnifiedLegendTypeSectionProps {
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  colormaps: Colormap[];
  onUpdate: (field: string, value: any) => void;
}

const UnifiedLegendTypeSection = ({
  legendType,
  legendUrl,
  startColor,
  endColor,
  minValue,
  maxValue,
  colormaps,
  onUpdate
}: UnifiedLegendTypeSectionProps) => {
  const hasColormaps = colormaps.length > 0;
  const isGradientWithColormap = legendType === 'gradient' && hasColormaps;
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Legend Type</h4>
      
      <div className="space-y-2">
        <Select value={legendType} onValueChange={(value: 'swatch' | 'gradient' | 'image') => onUpdate('legendType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="swatch">Swatch</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {legendType === 'image' && (
        <div className="space-y-2">
          <Label htmlFor="legendUrl">Legend Image URL *</Label>
          <Input
            id="legendUrl"
            value={legendUrl}
            onChange={(e) => onUpdate('legendUrl', e.target.value)}
            placeholder="https://example.com/legend.png"
            required={legendType === 'image'}
          />
        </div>
      )}

      {legendType === 'gradient' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h5 className="font-medium">Gradient Configuration</h5>
          
          {isGradientWithColormap && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md border border-border/50">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Gradient colors will be derived from the colormap definition. Start/End colors are not required.
              </p>
            </div>
          )}
          
          {!hasColormaps && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startColor">Start Color *</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="startColor"
                    value={startColor}
                    onChange={(e) => onUpdate('startColor', e.target.value)}
                    className="w-16"
                    required={legendType === 'gradient' && !hasColormaps}
                  />
                  <Input
                    value={startColor}
                    onChange={(e) => onUpdate('startColor', e.target.value)}
                    placeholder="e.g., #000000 or rgb(0,0,0)"
                    required={legendType === 'gradient' && !hasColormaps}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endColor">End Color *</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="endColor"
                    value={endColor}
                    onChange={(e) => onUpdate('endColor', e.target.value)}
                    className="w-16"
                    required={legendType === 'gradient' && !hasColormaps}
                  />
                  <Input
                    value={endColor}
                    onChange={(e) => onUpdate('endColor', e.target.value)}
                    placeholder="e.g., #ffffff or rgb(255,255,255)"
                    required={legendType === 'gradient' && !hasColormaps}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minValue">Min Value *</Label>
              <Input
                id="minValue"
                value={minValue}
                onChange={(e) => onUpdate('minValue', e.target.value)}
                placeholder="e.g., 0"
                required={legendType === 'gradient'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxValue">Max Value *</Label>
              <Input
                id="maxValue"
                value={maxValue}
                onChange={(e) => onUpdate('maxValue', e.target.value)}
                placeholder="e.g., 100"
                required={legendType === 'gradient'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLegendTypeSection;