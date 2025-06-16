
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LayerControlsSectionProps {
  toggleable: boolean;
  opacitySlider: boolean;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  onUpdate: (field: string, value: any) => void;
}

const LayerControlsSection = ({
  toggleable,
  opacitySlider,
  legendType,
  legendUrl,
  startColor,
  endColor,
  minValue,
  maxValue,
  onUpdate
}: LayerControlsSectionProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Layer Card Controls</h4>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="toggleable"
          checked={toggleable}
          onCheckedChange={(value) => onUpdate('toggleable', value)}
        />
        <Label htmlFor="toggleable">Toggleable</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="opacitySlider"
          checked={opacitySlider}
          onCheckedChange={(value) => onUpdate('opacitySlider', value)}
        />
        <Label htmlFor="opacitySlider">Opacity Slider</Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="legendType">Legend Type</Label>
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
                  required={legendType === 'gradient'}
                />
                <Input
                  value={startColor}
                  onChange={(e) => onUpdate('startColor', e.target.value)}
                  placeholder="e.g., #000000 or rgb(0,0,0)"
                  required={legendType === 'gradient'}
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
                  required={legendType === 'gradient'}
                />
                <Input
                  value={endColor}
                  onChange={(e) => onUpdate('endColor', e.target.value)}
                  placeholder="e.g., #ffffff or rgb(255,255,255)"
                  required={legendType === 'gradient'}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minValue">Min Value *</Label>
              <Input
                id="minValue"
                type="number"
                step="any"
                value={minValue}
                onChange={(e) => onUpdate('minValue', e.target.value)}
                placeholder="e.g., 0.01"
                required={legendType === 'gradient'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxValue">Max Value *</Label>
              <Input
                id="maxValue"
                type="number"
                step="any"
                value={maxValue}
                onChange={(e) => onUpdate('maxValue', e.target.value)}
                placeholder="e.g., 0.42"
                required={legendType === 'gradient'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerControlsSection;
