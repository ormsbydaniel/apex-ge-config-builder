import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeframeType } from '@/types/config';

interface UnifiedControlsSectionProps {
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  timeframe: TimeframeType;
  onUpdate: (field: string, value: any) => void;
}

const UnifiedControlsSection = ({
  toggleable,
  opacitySlider,
  zoomToCenter,
  timeframe,
  onUpdate
}: UnifiedControlsSectionProps) => {
  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    onUpdate('timeframe', newTimeframe);
    
    // If switching to 'None', clear the default timestamp
    if (newTimeframe === 'None') {
      onUpdate('defaultTimestamp', undefined);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Layer Card Controls</h4>
      
      <div className="flex items-end gap-6">
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
        
        <div className="flex items-center space-x-2">
          <Switch
            id="zoomToCenter"
            checked={zoomToCenter}
            onCheckedChange={(value) => onUpdate('zoomToCenter', value)}
          />
          <Label htmlFor="zoomToCenter">Zoom to layer</Label>
        </div>
        
        <div className="space-y-2 min-w-[160px]">
          <Label htmlFor="timeframe">Time Dimension</Label>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time dimension" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Months">Months</SelectItem>
              <SelectItem value="Years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default UnifiedControlsSection;