
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/config';
import CategoryEditorDialog from './CategoryEditorDialog';

interface UnifiedLegendSectionProps {
  // Layer controls
  toggleable: boolean;
  opacitySlider: boolean;
  
  // Legend configuration
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  
  // Gradient configuration
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  
  // Categories for swatch legend
  categories: Category[];
  
  // Update handler
  onUpdate: (field: string, value: any) => void;
}

const UnifiedLegendSection = ({
  toggleable,
  opacitySlider,
  legendType,
  legendUrl,
  startColor,
  endColor,
  minValue,
  maxValue,
  categories,
  onUpdate
}: UnifiedLegendSectionProps) => {
  // Check if any categories have values defined
  const hasValues = categories.some(cat => cat.value !== undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Layer Controls & Legend</h3>
        
        {/* Layer Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="toggleable"
              checked={toggleable}
              onCheckedChange={(checked) => onUpdate('toggleable', checked)}
            />
            <Label htmlFor="toggleable">Toggleable</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="opacitySlider"
              checked={opacitySlider}
              onCheckedChange={(checked) => onUpdate('opacitySlider', checked)}
            />
            <Label htmlFor="opacitySlider">Opacity Slider</Label>
          </div>
        </div>

        {/* Legend Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="legendType">Legend Type</Label>
          <Select
            value={legendType}
            onValueChange={(value: 'swatch' | 'gradient' | 'image') => onUpdate('legendType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="swatch">Swatch (Categories)</SelectItem>
              <SelectItem value="gradient">Gradient (Continuous)</SelectItem>
              <SelectItem value="image">Image URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Legend Type Specific Fields */}
        {legendType === 'image' && (
          <div className="space-y-2">
            <Label htmlFor="legendUrl">Legend Image URL *</Label>
            <Input
              id="legendUrl"
              value={legendUrl}
              onChange={(e) => onUpdate('legendUrl', e.target.value)}
              placeholder="https://example.com/legend.png"
              type="url"
              required
            />
          </div>
        )}

        {legendType === 'gradient' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startColor">Start Color *</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={startColor}
                    onChange={(e) => onUpdate('startColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={startColor}
                    onChange={(e) => onUpdate('startColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endColor">End Color *</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={endColor}
                    onChange={(e) => onUpdate('endColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={endColor}
                    onChange={(e) => onUpdate('endColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
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
                  placeholder="0"
                  required
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
                  placeholder="100"
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Section for Swatch Legend */}
      {legendType === 'swatch' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <CategoryEditorDialog
              categories={categories}
              onUpdate={(updatedCategories) => onUpdate('categories', updatedCategories)}
            />
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories defined. Click "Edit Categories" to add some.
            </p>
          ) : (
            <div>
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label || `Category ${index + 1}`}
                    {hasValues && category.value !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">({category.value})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedLegendSection;
