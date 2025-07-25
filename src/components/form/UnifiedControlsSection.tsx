import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface UnifiedControlsSectionProps {
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  onUpdate: (field: string, value: any) => void;
}

const UnifiedControlsSection = ({
  toggleable,
  opacitySlider,
  zoomToCenter,
  onUpdate
}: UnifiedControlsSectionProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Layer Card Controls</h4>
      
      <div className="flex items-center gap-6">
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
      </div>
    </div>
  );
};

export default UnifiedControlsSection;