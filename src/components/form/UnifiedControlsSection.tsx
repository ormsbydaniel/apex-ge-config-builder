import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TimeframeType } from '@/types/config';

interface UnifiedControlsSectionProps {
  opacitySlider: boolean;
  zoomToCenter: boolean;
  download: string;
  temporalControls: boolean;
  constraintSlider: boolean;
  blendControls: boolean;
  timeframe: TimeframeType;
  onUpdate: (field: string, value: any) => void;
}

const UnifiedControlsSection = ({
  opacitySlider,
  zoomToCenter,
  download,
  temporalControls,
  constraintSlider,
  blendControls,
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
      
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="zoomToCenter" className="min-w-[90px]">Zoom to layer:</Label>
          <Switch
            id="zoomToCenter"
            checked={zoomToCenter}
            onCheckedChange={(value) => onUpdate('zoomToCenter', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="download" className="min-w-[65px]">Download:</Label>
          <Switch
            id="download"
            checked={download !== undefined}
            onCheckedChange={(value) => {
              if (value) {
                onUpdate('download', '');
              } else {
                onUpdate('download', undefined);
              }
            }}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="opacitySlider" className="min-w-[90px]">Opacity Slider:</Label>
          <Switch
            id="opacitySlider"
            checked={opacitySlider}
            onCheckedChange={(value) => onUpdate('opacitySlider', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="blendControls" className="min-w-[110px]">Blend Controls:</Label>
          <Switch
            id="blendControls"
            checked={blendControls}
            onCheckedChange={(value) => onUpdate('blendControls', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="constraintSlider" className="min-w-[110px]">Constraint Slider:</Label>
          <Switch
            id="constraintSlider"
            checked={constraintSlider}
            onCheckedChange={(value) => onUpdate('constraintSlider', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="temporalControls" className="min-w-[110px]">Temporal Control:</Label>
          <Switch
            id="temporalControls"
            checked={temporalControls}
            onCheckedChange={(value) => onUpdate('temporalControls', value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 min-w-[200px]">
          <Label htmlFor="timeframe" className="whitespace-nowrap">Time picker:</Label>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time dimension" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Time">Time</SelectItem>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Months">Months</SelectItem>
              <SelectItem value="Years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {download !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="downloadUrl">Download URL *</Label>
          <Input
            id="downloadUrl"
            value={download || ''}
            onChange={(e) => onUpdate('download', e.target.value)}
            placeholder="https://example.com/download-file.csv"
            required
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedControlsSection;