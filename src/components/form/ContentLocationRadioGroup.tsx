import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ContentLocation = 'layerCard' | 'infoPanel';

interface ContentLocationRadioGroupProps {
  value: ContentLocation;
  onChange: (value: ContentLocation) => void;
}

const ContentLocationRadioGroup = ({ value, onChange }: ContentLocationRadioGroupProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-base font-semibold">Content and Controls</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Choose where to display the legend and controls for this layer:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>In layer menu:</strong> Shows content directly in the layer card</li>
                <li><strong>On info panel:</strong> Shows content in a separate info panel</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as ContentLocation)}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
          <RadioGroupItem value="layerCard" id="layerCard" />
          <Label htmlFor="layerCard" className="cursor-pointer flex-1">
            <div className="font-medium">In layer menu</div>
            <div className="text-xs text-muted-foreground">Display in layer card</div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
          <RadioGroupItem value="infoPanel" id="infoPanel" />
          <Label htmlFor="infoPanel" className="cursor-pointer flex-1">
            <div className="font-medium">On info panel</div>
            <div className="text-xs text-muted-foreground">Display in info panel</div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ContentLocationRadioGroup;
