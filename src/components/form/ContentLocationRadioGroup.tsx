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
const ContentLocationRadioGroup = ({
  value,
  onChange
}: ContentLocationRadioGroupProps) => {
  return <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-lg font-medium">Layout Style</Label>
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
      
      <RadioGroup value={value} onValueChange={newValue => onChange(newValue as ContentLocation)} className="space-y-2">
        <div className="flex items-center space-x-2 p-1 cursor-pointer">
          <RadioGroupItem value="layerCard" id="layerCard" />
          <Label htmlFor="layerCard" className="cursor-pointer flex-1">
            <div className="font-medium">Content and controls in layer menu</div>
            
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 p-1 cursor-pointer">
          <RadioGroupItem value="infoPanel" id="infoPanel" />
          <Label htmlFor="infoPanel" className="cursor-pointer flex-1">
            <div className="font-medium">Content and controls on map panel

          </div>
            
          </Label>
        </div>
      </RadioGroup>
    </div>;
};
export default ContentLocationRadioGroup;